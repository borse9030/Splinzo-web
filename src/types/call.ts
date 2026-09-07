export interface CallSession {
  id: string;
  groupId: string;
  callerId: string;
  callerName?: string;
  groupName: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'cancelled';
  createdAt: any;
  lastSeen?: Record<string, any>;
}

export interface SignalingData {
  role: 'offer' | 'answer';
  type: string;
  sdp: string;
  from: string;
  to: string;
  revision: number;
  timestamp: any;
}

export interface IceCandidateData {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
  from: string;
  to: string;
  createdAt: number;
}
