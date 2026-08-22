import { CallService } from "@/services/callService";
import { SignalingData, IceCandidateData } from "@/types/call";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export class PeerManager {
  private pcs: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  
  private groupId: string;
  private callId: string;
  private myUid: string;
  
  private candidateBuffers: Map<string, any[]> = new Map();
  private candidateTimers: Map<string, NodeJS.Timeout> = new Map();

  public onRemoteStream?: (uid: string, stream: MediaStream) => void;
  public onPeerStateChange?: (uid: string, state: string) => void;

  constructor(groupId: string, callId: string, myUid: string) {
    this.groupId = groupId;
    this.callId = callId;
    this.myUid = myUid;
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    // Add tracks to existing peer connections if any
    this.pcs.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        // Prevent adding the same track twice
        const senders = pc.getSenders();
        const hasTrack = senders.some((s) => s.track === track);
        if (!hasTrack) {
          pc.addTrack(track, stream);
        }
      });
    });
  }

  async createPeerConnection(remoteUid: string): Promise<RTCPeerConnection> {
    if (this.pcs.has(remoteUid)) {
      return this.pcs.get(remoteUid)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pcs.set(remoteUid, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.bufferIceCandidate(remoteUid, event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      this.onPeerStateChange?.(remoteUid, pc.connectionState);
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream?.(remoteUid, event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        this.onRemoteStream?.(remoteUid, stream);
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Subscribe to ICE candidates from this remote peer
    CallService.watchCandidatesFrom(this.groupId, this.callId, remoteUid, this.myUid, (candidateData) => {
      this.addRemoteCandidate(remoteUid, candidateData);
    });

    return pc;
  }

  private bufferIceCandidate(remoteUid: string, candidate: any) {
    if (!this.candidateBuffers.has(remoteUid)) {
      this.candidateBuffers.set(remoteUid, []);
    }
    this.candidateBuffers.get(remoteUid)!.push(candidate);

    if (!this.candidateTimers.has(remoteUid)) {
      const timer = setTimeout(async () => {
        const batch = this.candidateBuffers.get(remoteUid) || [];
        this.candidateBuffers.set(remoteUid, []);
        this.candidateTimers.delete(remoteUid);

        if (batch.length > 0) {
          await CallService.sendCandidateBatch(this.groupId, this.callId, this.myUid, remoteUid, batch);
        }
      }, 500); // 500ms batching window
      this.candidateTimers.set(remoteUid, timer);
    }
  }

  private async addRemoteCandidate(remoteUid: string, data: IceCandidateData) {
    const pc = this.pcs.get(remoteUid);
    if (!pc) return;
    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate({
          candidate: data.candidate,
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex
        }));
      } else {
        // Queue candidate if remote description is not set yet
        // A robust implementation would queue these and apply them after setRemoteDescription
        // For simplicity, we assume SDP negotiation happens fast enough or we wait slightly.
        setTimeout(() => this.addRemoteCandidate(remoteUid, data), 500);
      }
    } catch (e) {
      console.error("Error adding remote ICE candidate", e);
    }
  }

  async createAndSendOffer(remoteUid: string) {
    const pc = await this.createPeerConnection(remoteUid);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    await CallService.sendOffer(
      this.groupId,
      this.callId,
      this.myUid,
      remoteUid,
      offer.sdp!,
      offer.type,
      1
    );
  }

  async handleIncomingSignaling(data: SignalingData) {
    if (data.from === this.myUid) return;
    
    const pc = await this.createPeerConnection(data.from);

    if (data.role === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: data.type as RTCSdpType, sdp: data.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await CallService.sendAnswer(
        this.groupId,
        this.callId,
        this.myUid,
        data.from,
        answer.sdp!,
        answer.type,
        data.revision
      );
    } else if (data.role === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: data.type as RTCSdpType, sdp: data.sdp }));
    }
  }

  dispose() {
    this.candidateTimers.forEach(clearTimeout);
    this.pcs.forEach((pc) => pc.close());
    this.pcs.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }
}
