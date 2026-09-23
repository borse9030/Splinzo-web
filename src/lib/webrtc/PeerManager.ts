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
  iceCandidatePoolSize: 10,
};

/**
 * Modifies SDP to optimize Opus codec parameters for crystal-clear voice:
 * - minptime=10 (low audio packetization delay)
 * - useinbandfec=1 (Forward Error Correction to withstand packet loss)
 * - usedtx=1 (Discontinuous Transmission to reduce background network congestion)
 * - stereo=0 (forces mono speech channel, avoiding stereo phase cancellation)
 * - sprop-stereo=0
 * - maxaveragebitrate=64000 (high fidelity 64 kbps speech)
 */
function optimizeOpusSdp(sdp: string): string {
  if (!sdp) return sdp;
  const lines = sdp.split("\r\n");
  let opusPt: string | null = null;

  // Find Opus payload type from rtpmap
  for (const line of lines) {
    const match = line.match(/^a=rtpmap:(\d+)\s+opus\/48000/i);
    if (match) {
      opusPt = match[1];
      break;
    }
  }

  if (!opusPt) return sdp;

  let fmtpFound = false;
  const newLines = lines.map((line) => {
    if (line.startsWith(`a=fmtp:${opusPt} `) || line.startsWith(`a=fmtp:${opusPt}=`)) {
      fmtpFound = true;
      const params = line.substring(`a=fmtp:${opusPt} `.length);
      const desiredParams: Record<string, string> = {
        minptime: "10",
        useinbandfec: "1",
        usedtx: "1",
        stereo: "0",
        "sprop-stereo": "0",
        maxaveragebitrate: "64000",
      };

      const existingParts = params.split(";").filter((p) => p.trim().length > 0);
      const parsed: Record<string, string> = {};
      existingParts.forEach((p) => {
        const [k, v] = p.split("=");
        if (k && v !== undefined) parsed[k.trim()] = v.trim();
      });

      Object.assign(parsed, desiredParams);

      const newParamStr = Object.entries(parsed)
        .map(([k, v]) => `${k}=${v}`)
        .join(";");

      return `a=fmtp:${opusPt} ${newParamStr}`;
    }
    return line;
  });

  if (!fmtpFound) {
    // Inject a=fmtp line right after a=rtpmap:<opusPt>
    const result: string[] = [];
    for (const line of newLines) {
      result.push(line);
      if (line.startsWith(`a=rtpmap:${opusPt} `)) {
        result.push(
          `a=fmtp:${opusPt} minptime=10;useinbandfec=1;usedtx=1;stereo=0;sprop-stereo=0;maxaveragebitrate=64000`
        );
      }
    }
    return result.join("\r\n");
  }

  return newLines.join("\r\n");
}

export class PeerManager {
  private pcs: Map<string, RTCPeerConnection> = new Map();
  private makingOfferFlags: Map<string, boolean> = new Map();
  private ignoreOfferFlags: Map<string, boolean> = new Map();
  private offerRevisions: Map<string, number> = new Map();
  private lastHandledRevision: Map<string, number> = new Map();
  private isProcessingNegotiation: Map<string, boolean> = new Map();
  private hasPendingNegotiation: Map<string, boolean> = new Map();

  private localStream: MediaStream | null = null;

  private groupId: string;
  private callId: string;
  public myUid: string;

  private candidateBuffers: Map<string, any[]> = new Map();
  private candidateTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private candidateQueues: Map<string, RTCIceCandidateInit[]> = new Map();
  private candidateSubs: Map<string, () => void> = new Map();

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
   * Hot-swaps the local audio track (e.g. when changing microphone) across all active peer connections
   * without renegotiation or call interruption.
   */
  async replaceLocalTrack(newTrack: MediaStreamTrack) {
    if (this.localStream) {
      const oldAudioTracks = this.localStream.getAudioTracks();
      oldAudioTracks.forEach((t) => {
        this.localStream!.removeTrack(t);
        t.stop();
      });
      this.localStream.addTrack(newTrack);
    }

    const promises: Promise<void>[] = [];
    this.pcs.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          promises.push(sender.replaceTrack(newTrack));
        }
      });
    });
    await Promise.all(promises);
  }

  /**
   * Whether this peer is "polite" (answers) vs "impolite" (offers).
   * Determined by lexicographic UID comparison — matches Android convention (myUid.compareTo(remoteUid) > 0).
   */
  private isPolite(remoteUid: string): boolean {
    return this.myUid > remoteUid;
  }

  async getOrCreatePc(remoteUid: string): Promise<RTCPeerConnection> {
    if (this.pcs.has(remoteUid)) return this.pcs.get(remoteUid)!;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pcs.set(remoteUid, pc);
    this.makingOfferFlags.set(remoteUid, false);
    this.ignoreOfferFlags.set(remoteUid, false);
    this.candidateQueues.set(remoteUid, []);

    pc.onicecandidate = ({ candidate }) => {
      // Ignore null and empty candidates (such as end-of-gathering notifications)
      if (candidate && candidate.candidate && candidate.candidate.trim() !== "") {
        this.bufferIceCandidate(remoteUid, candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      this.onPeerStateChange?.(remoteUid, pc.connectionState);
    };

    pc.onnegotiationneeded = () => {
      this.triggerNegotiation(remoteUid);
    };

    pc.ontrack = ({ streams, track }) => {
      const stream = streams?.[0] ?? new MediaStream([track]);
      this.onRemoteStream?.(remoteUid, stream);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        const alreadyAdded = pc.getSenders().some((s) => s.track === t);
        if (!alreadyAdded) pc.addTrack(t, this.localStream!);
      });
    }

    // Cancel previous subscription if one existed
    this.candidateSubs.get(remoteUid)?.();

    // Subscribe to ICE candidates from this remote peer
    const unsub = CallService.watchCandidatesFrom(
      this.groupId,
      this.callId,
      remoteUid,
      this.myUid,
      (data) => this.applyRemoteCandidate(remoteUid, data)
    );
    this.candidateSubs.set(remoteUid, unsub);

    return pc;
  }

  private async triggerNegotiation(remoteUid: string) {
    const pc = this.pcs.get(remoteUid);
    if (!pc || pc.signalingState === "closed") return;

    this.hasPendingNegotiation.set(remoteUid, true);
    if (this.isProcessingNegotiation.get(remoteUid)) return;

    this.isProcessingNegotiation.set(remoteUid, true);
    try {
      while (this.hasPendingNegotiation.get(remoteUid)) {
        this.hasPendingNegotiation.set(remoteUid, false);
        this.makingOfferFlags.set(remoteUid, true);

        try {
          const offer = await pc.createOffer();
          if (pc.signalingState !== "stable") break;

          const optimizedSdp = optimizeOpusSdp(offer.sdp || "");
          await pc.setLocalDescription({ type: offer.type, sdp: optimizedSdp });

          const nextRev = (this.offerRevisions.get(remoteUid) || 0) + 1;
          this.offerRevisions.set(remoteUid, nextRev);

          await CallService.sendOffer(
            this.groupId,
            this.callId,
            this.myUid,
            remoteUid,
            pc.localDescription!.sdp,
            pc.localDescription!.type,
            nextRev
          );
        } finally {
          this.makingOfferFlags.set(remoteUid, false);
        }
      }
    } catch (e) {
      console.error(`[PeerManager] triggerNegotiation error for ${remoteUid}`, e);
    } finally {
      this.isProcessingNegotiation.set(remoteUid, false);
    }
  }

  private bufferIceCandidate(remoteUid: string, candidate: any) {
    if (!this.candidateBuffers.has(remoteUid)) this.candidateBuffers.set(remoteUid, []);
    this.candidateBuffers.get(remoteUid)!.push(candidate);

    if (!this.candidateTimers.has(remoteUid)) {
      // 80ms debounced batching for swift ICE transmission
      const timer = setTimeout(async () => {
        const batch = this.candidateBuffers.get(remoteUid) || [];
        this.candidateBuffers.set(remoteUid, []);
        this.candidateTimers.delete(remoteUid);
        if (batch.length > 0) {
          await CallService.sendCandidateBatch(
            this.groupId,
            this.callId,
            this.myUid,
            remoteUid,
            batch
          );
        }
      }, 80);
      this.candidateTimers.set(remoteUid, timer);
    }
  }

  private async applyRemoteCandidate(remoteUid: string, data: IceCandidateData) {
    const pc = this.pcs.get(remoteUid);
    if (!pc || pc.signalingState === "closed") return;

    // 1. Ignore empty, null, or gathering-complete candidates
    if (!data || !data.candidate || typeof data.candidate !== "string" || data.candidate.trim() === "") {
      return;
    }

    // 2. Normalize sdpMid and sdpMLineIndex safely
    const sdpMLineIndex =
      typeof data.sdpMLineIndex === "number"
        ? data.sdpMLineIndex
        : typeof data.sdpMLineIndex === "string"
        ? parseInt(data.sdpMLineIndex, 10)
        : null;

    const sdpMid =
      data.sdpMid !== undefined && data.sdpMid !== null ? String(data.sdpMid) : null;

    // Both cannot be null per WebRTC specification
    if (sdpMid === null && (sdpMLineIndex === null || isNaN(sdpMLineIndex))) {
      return;
    }

    const candidateInit: RTCIceCandidateInit = {
      candidate: data.candidate,
      sdpMid: sdpMid ?? undefined,
      ...(sdpMLineIndex !== null && !isNaN(sdpMLineIndex) ? { sdpMLineIndex } : {}),
    };

    try {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(candidateInit);
      } else {
        // Queue until remote description is set
        const queue = this.candidateQueues.get(remoteUid);
        if (queue) {
          queue.push(candidateInit);
        } else {
          this.candidateQueues.set(remoteUid, [candidateInit]);
        }
      }
    } catch (e) {
      if (!this.ignoreOfferFlags.get(remoteUid)) {
        console.warn("[PeerManager] addIceCandidate ignored error", e);
      }
    }
  }

  private async drainCandidateQueue(remoteUid: string) {
    const pc = this.pcs.get(remoteUid);
    if (!pc || pc.signalingState === "closed" || !pc.remoteDescription) return;
    const queue = this.candidateQueues.get(remoteUid) || [];
    this.candidateQueues.set(remoteUid, []);
    for (const c of queue) {
      try {
        await pc.addIceCandidate(c);
      } catch (e) {
        console.warn("[PeerManager] drainCandidateQueue addIceCandidate ignored error", e);
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
    if (pc.signalingState === "closed") return;
    const polite = this.isPolite(data.from);

    try {
      if (data.role === "offer") {
        const lastRev = this.lastHandledRevision.get(data.from) || 0;
        if (data.revision > 0 && data.revision <= lastRev) {
          console.warn(`[PeerManager] Stale offer rev.${data.revision} from ${data.from} ignored`);
          return;
        }

        const offerCollision =
          this.makingOfferFlags.get(data.from) || pc.signalingState !== "stable";

        this.ignoreOfferFlags.set(data.from, !polite && offerCollision);
        if (this.ignoreOfferFlags.get(data.from)) return;

        this.lastHandledRevision.set(data.from, data.revision);

        if (polite && offerCollision) {
          await pc.setLocalDescription({ type: "rollback" as RTCSdpType });
        }

        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: data.type as RTCSdpType, sdp: data.sdp })
        );
        await this.drainCandidateQueue(data.from);

        const answer = await pc.createAnswer();
        const optimizedAnswerSdp = optimizeOpusSdp(answer.sdp || "");
        await pc.setLocalDescription({ type: answer.type, sdp: optimizedAnswerSdp });
        await CallService.sendAnswer(
          this.groupId,
          this.callId,
          this.myUid,
          data.from,
          pc.localDescription!.sdp,
          pc.localDescription!.type,
          data.revision
        );
      } else if (data.role === "answer") {
        // Only process if we have a local offer
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
  }

  dispose() {
    this.candidateTimers.forEach(clearTimeout);
    this.candidateTimers.clear();

    this.candidateSubs.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn("[PeerManager] candidate sub unsub error", e);
      }
    });
    this.candidateSubs.clear();

    this.pcs.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {
        console.warn("[PeerManager] pc close error", e);
      }
    });
    this.pcs.clear();
    this.candidateQueues.clear();
    this.candidateBuffers.clear();
    this.makingOfferFlags.clear();
    this.ignoreOfferFlags.clear();
    this.offerRevisions.clear();
    this.lastHandledRevision.clear();
    this.isProcessingNegotiation.clear();
    this.hasPendingNegotiation.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }
}
