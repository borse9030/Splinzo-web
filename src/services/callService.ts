import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp,
  getDocs,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from "firebase/firestore";
import { CallSession, SignalingData, IceCandidateData } from "@/types/call";

export class CallService {
  /** Watches for incoming active calls for a specific group */
  static watchActiveCall(groupId: string, onUpdate: (call: CallSession | null) => void) {
    const callsRef = collection(db, "groups", groupId, "calls");
    // Simple query - no composite index needed.
    // Staleness (createdAt) is filtered client-side in CallContext.
    const q = query(
      callsRef,
      where("status", "in", ["ringing", "active"]),
      limit(1)
    );
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        onUpdate({ id: d.id, groupId, ...d.data() } as CallSession);
      } else {
        onUpdate(null);
      }
    }, (err) => {
      console.error(`[watchActiveCall:${groupId}]`, err.message);
      onUpdate(null);
    });
  }

  /** Watches a specific call session */
  static watchCallSession(groupId: string, callId: string, onUpdate: (call: CallSession | null) => void) {
    const callDoc = doc(db, "groups", groupId, "calls", callId);
    return onSnapshot(callDoc, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, groupId, ...snapshot.data() } as CallSession);
      } else {
        onUpdate(null);
      }
    });
  }

  static async startCall(
    groupId: string,
    groupName: string,
    callerId: string,
    callerName: string,
    callerPhoto: string
  ): Promise<{ callId: string; isExisting: boolean }> {
    const callsRef = collection(db, "groups", groupId, "calls");

    // Check for race condition: if a call already exists, join it instead
    const activeQ = query(callsRef, where("status", "in", ["ringing", "active"]), limit(1));
    const existingSnap = await getDocs(activeQ);
    if (!existingSnap.empty) {
      const existingCallId = existingSnap.docs[0].id;
      await CallService.joinCall(groupId, existingCallId, callerId, callerName, callerPhoto);
      return { callId: existingCallId, isExisting: true };
    }

    const callRef = doc(callsRef);
    await setDoc(callRef, {
      status: "ringing",
      callerId,
      groupName,
      participants: [callerId],
      participantNames: { [callerId]: callerName },
      participantPhotos: { [callerId]: callerPhoto },
      createdAt: Date.now(),
      lastSeen: { [callerId]: serverTimestamp() },
    });

    return { callId: callRef.id, isExisting: false };
  }

  static async joinCall(
    groupId: string,
    callId: string,
    myUid: string,
    myName: string,
    myPhoto: string
  ) {
    const callDoc = doc(db, "groups", groupId, "calls", callId);
    await updateDoc(callDoc, {
      status: "active",
      participants: arrayUnion(myUid),
      [`participantNames.${myUid}`]: myName,
      [`participantPhotos.${myUid}`]: myPhoto,
      [`lastSeen.${myUid}`]: serverTimestamp(),
    });
  }

  static async leaveCall(groupId: string, callId: string, myUid: string) {
    const callDoc = doc(db, "groups", groupId, "calls", callId);
    // Use transaction to end call if this was the last participant
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(callDoc);
      if (!snap.exists()) return;
      const participants: string[] = snap.data().participants || [];
      const remaining = participants.filter((p) => p !== myUid);
      tx.update(callDoc, {
        participants: remaining,
        ...(remaining.length === 0 ? { status: "ended" } : {}),
      });
    });
  }

  static async endCall(groupId: string, callId: string) {
    const callDoc = doc(db, "groups", groupId, "calls", callId);
    await updateDoc(callDoc, { status: "ended" });
  }

  static async cancelCall(groupId: string, callId: string) {
    const callDoc = doc(db, "groups", groupId, "calls", callId);
    await updateDoc(callDoc, { status: "cancelled" });
  }

  /** Clean up signaling sub-collections after a call ends */
  static async cleanupSignaling(groupId: string, callId: string) {
    try {
      const sigRef = collection(db, "groups", groupId, "calls", callId, "signaling");
      const snap = await getDocs(sigRef);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("[cleanupSignaling] failed", e);
    }
  }

  static _signalingDocId(fromUid: string, toUid: string) {
    return `${fromUid}_to_${toUid}`;
  }

  static async sendOffer(
    groupId: string,
    callId: string,
    fromUid: string,
    toUid: string,
    sdp: string,
    type: string,
    revision: number
  ) {
    const sigDoc = doc(
      db,
      "groups",
      groupId,
      "calls",
      callId,
      "signaling",
      this._signalingDocId(fromUid, toUid)
    );
    await setDoc(sigDoc, {
      sdp,
      type,
      role: "offer",
      from: fromUid,
      to: toUid,
      revision,
      timestamp: serverTimestamp(),
    });
  }

  static async sendAnswer(
    groupId: string,
    callId: string,
    fromUid: string,
    toUid: string,
    sdp: string,
    type: string,
    revision: number
  ) {
    const sigDoc = doc(
      db,
      "groups",
      groupId,
      "calls",
      callId,
      "signaling",
      this._signalingDocId(fromUid, toUid)
    );
    await setDoc(sigDoc, {
      sdp,
      type,
      role: "answer",
      from: fromUid,
      to: toUid,
      revision,
      timestamp: serverTimestamp(),
    });
  }

  static watchIncomingSignaling(
    groupId: string,
    callId: string,
    myUid: string,
    onSignaling: (data: SignalingData) => void
  ) {
    const sigRef = collection(db, "groups", groupId, "calls", callId, "signaling");
    const q = query(sigRef, where("to", "==", myUid));
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          onSignaling(change.doc.data() as SignalingData);
        }
      });
    });
  }

  static async sendCandidateBatch(
    groupId: string,
    callId: string,
    fromUid: string,
    toUid: string,
    candidates: any[]
  ) {
    if (candidates.length === 0) return;
    const batch = writeBatch(db);
    const iceCol = collection(
      db,
      "groups",
      groupId,
      "calls",
      callId,
      "candidates",
      this._signalingDocId(fromUid, toUid),
      "ice"
    );

    candidates.forEach((cand) => {
      const docRef = doc(iceCol);
      batch.set(docRef, {
        ...cand,
        from: fromUid,
        to: toUid,
        createdAt: Date.now(),
      });
    });

    await batch.commit();
  }

  static watchCandidatesFrom(
    groupId: string,
    callId: string,
    fromUid: string,
    toUid: string,
    onCandidate: (candidate: IceCandidateData) => void
  ) {
    const iceCol = collection(
      db,
      "groups",
      groupId,
      "calls",
      callId,
      "candidates",
      this._signalingDocId(fromUid, toUid),
      "ice"
    );
    return onSnapshot(iceCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          onCandidate(change.doc.data() as IceCandidateData);
        }
      });
    });
  }
}
