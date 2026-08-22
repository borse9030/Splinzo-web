import { CallService } from "@/services/callService";
import { SignalingData, IceCandidateData } from "@/types/call";

// Match the TURN config the Android app uses (call_repository.dart)
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export class PeerManager {
  private pcs: Map<string, RTCPeerConnection> = new Map();
  private makingOfferFlags: Map<string, boolean> = new Map();
  private ignoreOfferFlags: Map<string, boolean> = new Map();

  private localStream: MediaStream | null = null;

  private groupId: string;
  private callId: string;
  public myUid: string;

  private candidateBuffers: Map<string, any[]> = new Map();
  private candidateTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private candidateQueues: Map<string, RTCIceCandidateInit[]> = new Map();

  public onRemoteStream?: (uid: string, stream: MediaStream) => void;
  public onPeerStateChange?: (uid: string, state: string) => void;

  constructor(groupId: string, callId: string, myUid: string) {
    this.groupId = groupId;
    this.callId = callId;
    this.myUid = myUid;
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    this.pcs.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        const alreadyAdded = pc.getSenders().some((s) => s.track === track);
        if (!alreadyAdded) pc.addTrack(track, stream);
      });
    });
  }

  /**
   * Whether this peer is "polite" (answers) vs "impolite" (offers).
   * Determined by lexicographic UID comparison — matches Android convention.
   * Lower UID = polite = answers. Higher UID = impolite = makes offers.
   */
  private isPolite(remoteUid: string): boolean {
    return this.myUid < remoteUid;
  }

  async getOrCreatePc(remoteUid: string): Promise<RTCPeerConnection> {
    if (this.pcs.has(remoteUid)) return this.pcs.get(remoteUid)!;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pcs.set(remoteUid, pc);
    this.makingOfferFlags.set(remoteUid, false);
    this.ignoreOfferFlags.set(remoteUid, false);
    this.candidateQueues.set(remoteUid, []);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.bufferIceCandidate(remoteUid, candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      this.onPeerStateChange?.(remoteUid, pc.connectionState);
    };

    pc.onnegotiationneeded = async () => {
      // Only the impolite peer initiates offers
      if (this.isPolite(remoteUid)) return;
      try {
        this.makingOfferFlags.set(remoteUid, true);
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") return; // rolled back already
        await pc.setLocalDescription(offer);
        await CallService.sendOffer(
          this.groupId, this.callId, this.myUid, remoteUid,
          pc.localDescription!.sdp, pc.localDescription!.type, Date.now()
        );
      } catch (e) {
        console.error("[PeerManager] onnegotiationneeded error", e);
      } finally {
        this.makingOfferFlags.set(remoteUid, false);
      }
    };

    pc.ontrack = ({ streams, track }) => {
      const stream = streams?.[0] ?? new MediaStream([track]);
      this.onRemoteStream?.(remoteUid, stream);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => pc.addTrack(t, this.localStream!));
    }

    // Subscribe to ICE candidates from this remote peer
    CallService.watchCandidatesFrom(
      this.groupId, this.callId, remoteUid, this.myUid,
      (data) => this.applyRemoteCandidate(remoteUid, data)
    );

    return pc;
  }

  private bufferIceCandidate(remoteUid: string, candidate: any) {
    if (!this.candidateBuffers.has(remoteUid)) this.candidateBuffers.set(remoteUid, []);
    this.candidateBuffers.get(remoteUid)!.push(candidate);

    if (!this.candidateTimers.has(remoteUid)) {
      const timer = setTimeout(async () => {
        const batch = this.candidateBuffers.get(remoteUid) || [];
        this.candidateBuffers.set(remoteUid, []);
        this.candidateTimers.delete(remoteUid);
        if (batch.length > 0) {
          await CallService.sendCandidateBatch(
            this.groupId, this.callId, this.myUid, remoteUid, batch
          );
        }
      }, 400);
      this.candidateTimers.set(remoteUid, timer);
    }
  }

  private async applyRemoteCandidate(remoteUid: string, data: IceCandidateData) {
    const pc = this.pcs.get(remoteUid);
    if (!pc) return;
    const candidate: RTCIceCandidateInit = {
      candidate: data.candidate,
      sdpMid: data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex,
    };
    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue until remote description is set
        this.candidateQueues.get(remoteUid)?.push(candidate);
      }
    } catch (e) {
      if (!(this.ignoreOfferFlags.get(remoteUid))) {
        console.error("[PeerManager] addIceCandidate failed", e);
      }
    }
  }

  private async drainCandidateQueue(remoteUid: string) {
    const pc = this.pcs.get(remoteUid);
    if (!pc) return;
    const queue = this.candidateQueues.get(remoteUid) || [];
    this.candidateQueues.set(remoteUid, []);
    for (const c of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.error("[PeerManager] drainCandidateQueue addIceCandidate failed", e);
      }
    }
  }

  /**
   * Handle an incoming signaling message (offer or answer).
   * Uses "perfect negotiation" to avoid offer/answer collisions between Web and Android.
   */
  async handleIncomingSignaling(data: SignalingData) {
    if (data.from === this.myUid) return;

    const pc = await this.getOrCreatePc(data.from);
    const polite = this.isPolite(data.from);

    try {
      if (data.role === "offer") {
        const offerCollision =
          this.makingOfferFlags.get(data.from) ||
          pc.signalingState !== "stable";

        this.ignoreOfferFlags.set(data.from, !polite && offerCollision);
        if (this.ignoreOfferFlags.get(data.from)) return;

        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: data.type as RTCSdpType, sdp: data.sdp })
        );
        await this.drainCandidateQueue(data.from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await CallService.sendAnswer(
          this.groupId, this.callId, this.myUid, data.from,
          pc.localDescription!.sdp, pc.localDescription!.type, data.revision
        );
      } else if (data.role === "answer") {
        // Only process if we're not already stable
        if (pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: data.type as RTCSdpType, sdp: data.sdp })
        );
        await this.drainCandidateQueue(data.from);
      }
    } catch (e) {
      console.error("[PeerManager] handleIncomingSignaling error", e, data.role, pc.signalingState);
    }
  }

  /** Explicitly create a PC and trigger onnegotiationneeded (impolite peer only) */
  async connectTo(remoteUid: string) {
    await this.getOrCreatePc(remoteUid);
    // onnegotiationneeded fires automatically if we are the impolite peer
  }

  dispose() {
    this.candidateTimers.forEach(clearTimeout);
    this.pcs.forEach((pc) => pc.close());
    this.pcs.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }
  }
}
