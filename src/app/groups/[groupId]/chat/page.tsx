"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteField,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { storageService } from "@/services/storageService";
import { Send, ImageIcon, MessageSquare, X, Trash2, Edit2, Ban, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AMBER     = "#F9B912";
const AMBER_DARK = "#1a1a1a";

/* ─── Colour palette for avatars ────────────────────────── */
const AVATAR_COLORS = [
  "#E91E63","#9C27B0","#2196F3","#00BCD4",
  "#4CAF50","#FF5722","#607D8B","#FF9800",
];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ─── Avatar component (photo → letter fallback) ────────── */
function MemberAvatar({
  photoURL, name, id, size = 28,
}: { photoURL?: string; name: string; id: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();
  const color   = avatarColor(id);

  if (photoURL && !imgErr) {
    return (
      <img
        src={photoURL}
        alt={name}
        width={size} height={size}
        onError={() => setImgErr(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  isCallLog?: boolean;
  type?: string;
  nudgeTargetUid?: string;
  nudgeTargetName?: string;
  nudgeAmount?: number;
  nudgeMemeTitle?: string;
  nudgeMemeText?: string;
  expenseCardData?: {
    expenseId: string;
    title: string;
    amount: number;
    currency: string;
    payerName: string;
    payerId: string;
    splitCount: number;
    myShare: number;
  };
  createdAt: Timestamp | null;
  editedAt?: Timestamp | null;
  isDeleted?: boolean;
}

export default function GroupChatPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  const { appUser } = useAuth();
  const { group, loading: groupLoading } = useGroup(groupId);

  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [chatLoading,    setChatLoading]    = useState(true);
  const [text,           setText]           = useState("");
  const [sending,        setSending]        = useState(false);
  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imagePreviewUrl,setImagePreviewUrl]= useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText,         setEditText]         = useState("");

  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [quickBillTitle, setQuickBillTitle] = useState("");
  const [quickBillAmount, setQuickBillAmount] = useState("");
  const [isSubmittingQuickBill, setIsSubmittingQuickBill] = useState(false);

  const handleQuickBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickBillAmount);
    if (!quickBillTitle.trim() || isNaN(amt) || amt <= 0 || !appUser) return;
    setIsSubmittingQuickBill(true);
    try {
      const expRef = await addDoc(collection(db, "groups", groupId, "expenses"), {
        groupId,
        description: quickBillTitle.trim(),
        amount: amt,
        payerId: appUser.id,
        currency: group?.currency || "INR",
        createdAt: serverTimestamp(),
        createdBy: appUser.id,
        splitBetweenIds: group?.members?.map((m: any) => m.id) || [appUser.id],
        category: "General",
      });

      const membersCount = group?.members?.length || 1;
      await addDoc(collection(db, "groups", groupId, "messages"), {
        groupId,
        senderId: appUser.id,
        type: "expense_card",
        expenseCardData: {
          expenseId: expRef.id,
          title: quickBillTitle.trim(),
          amount: amt,
          currency: group?.currency === "INR" ? "₹" : (group?.currency || "₹"),
          payerId: appUser.id,
          payerName: appUser.name || appUser.displayName || "Member",
          splitCount: membersCount,
          myShare: amt / membersCount,
        },
        createdAt: serverTimestamp(),
      });

      setQuickBillTitle("");
      setQuickBillAmount("");
      setIsQuickBillOpen(false);
    } catch (err) {
      console.error("Failed to split bill in chat:", err);
    } finally {
      setIsSubmittingQuickBill(false);
    }
  };

  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef= useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Real-time listener */
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      msgs.sort((a, b) => {
        const aT = a.createdAt?.seconds ?? Number.MAX_SAFE_INTEGER;
        const bT = b.createdAt?.seconds ?? Number.MAX_SAFE_INTEGER;
        return aT - bT;
      });
      setMessages(msgs);
      setChatLoading(false);
    }, (err) => {
      console.warn("[chat:onSnapshot]", err.message);
      setChatLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Member lookup helpers */
  const getMember = useCallback(
    (senderId: string) => group?.members?.find((m: any) => m.id === senderId),
    [group]
  );
  const getMemberName = useCallback(
    (senderId: string) => {
      const m = getMember(senderId);
      if (m) return (m.name || m.displayName || "?").split(" ")[0];
      return "Unknown";
    },
    [getMember]
  );
  const getMemberPhoto = useCallback(
    (senderId: string) => {
      const m = getMember(senderId);
      return m?.photoURL || m?.photoUrl || "";
    },
    [getMember]
  );

  /* Send handler */
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (editingMessageId) {
      if (!editText.trim()) return;
      const currentEditId = editingMessageId;
      const currentEditText = editText.trim();
      
      setEditingMessageId(null);
      setEditText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      
      Promise.resolve().then(async () => {
        try {
          const docRef = doc(db, "groups", groupId, "messages", currentEditId);
          await updateDoc(docRef, {
            text: currentEditText,
            editedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("Edit failed:", err);
        }
      });
      return;
    }

    if ((!text.trim() && !imageFile) || !appUser || sending) return;
    
    // Save local vars
    const messageText = text.trim();
    const currentImageFile = imageFile;
    const currentImageUrl = imagePreviewUrl;
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic UI updates
    if (messageText || currentImageUrl) {
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          groupId,
          senderId: appUser.id,
          text: messageText,
          imageUrl: currentImageUrl || undefined,
          createdAt: Timestamp.now(), // Estimate timestamp
        },
      ]);
    }
    
    setText("");
    setImageFile(null);
    setImagePreviewUrl(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    // Fire and forget
    Promise.resolve().then(async () => {
      try {
        if (currentImageFile) {
          setUploading(true);
          const url = await storageService.uploadFile(currentImageFile);
          await addDoc(collection(db, "groups", groupId, "messages"), {
            groupId, senderId: appUser.id, imageUrl: url, createdAt: serverTimestamp(),
          });
        }
        if (messageText) {
          await addDoc(collection(db, "groups", groupId, "messages"), {
            groupId, senderId: appUser.id, text: messageText, createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Send failed:", err);
      } finally {
        setUploading(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const EDIT_WINDOW_MS = 15 * 60 * 1000;
  
  const canEdit = (msg: ChatMessage) => {
    if (msg.isDeleted || !msg.text || !msg.createdAt) return false;
    return Date.now() - msg.createdAt.toMillis() <= EDIT_WINDOW_MS;
  };

  const handleEditInit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.text || "");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = async (msgId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        const docRef = doc(db, "groups", groupId, "messages", msgId);
        await updateDoc(docRef, {
          isDeleted: true,
          text: deleteField(),
          imageUrl: deleteField(),
        });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const fmt = (ts: Timestamp | null) => {
    if (!ts) return "";
    return ts.toDate().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const dayLabel = (ts: Timestamp | null) => {
    if (!ts) return "";
    const d = ts.toDate(); const now = new Date(); const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return "Today";
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isNewDay = (msg: ChatMessage, idx: number, arr: ChatMessage[]) => {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    if (!msg.createdAt || !prev.createdAt) return false;
    return msg.createdAt.toDate().toDateString() !== prev.createdAt.toDate().toDateString();
  };

  const visibleMessages = messages.filter((m) => !m.isCallLog);

  return (
    <div className="flex flex-col w-full h-full" style={{ background: "var(--background)" }}>

      {/* ── Scrollable message area ── */}
      <div className="flex-1 overflow-y-auto py-4 overscroll-contain">
        {/* Centre-constrain on desktop */}
        <div className="max-w-2xl mx-auto px-3 sm:px-5 space-y-0.5">

          {(chatLoading || groupLoading) ? (
            <div className="space-y-4 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} gap-2`}>
                  {i % 2 !== 0 && <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-auto" />}
                  <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-36" : "w-52"}`} />
                </div>
              ))}
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 rounded-full flex items-center justify-center mb-3"
                   style={{ background: "rgba(249,185,18,0.18)" }}>
                <MessageSquare className="h-8 w-8" style={{ color: AMBER }} />
              </div>
              <p className="text-base font-extrabold" style={{ color: "var(--foreground)" }}>No messages yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Be the first to say hi! 👋</p>
            </div>
          ) : (
            visibleMessages.map((msg, idx, arr) => {
              const isMe   = msg.senderId === appUser?.id;
              const name   = getMemberName(msg.senderId);
              const photo  = getMemberPhoto(msg.senderId);
              const color  = avatarColor(msg.senderId);
              const newDay = isNewDay(msg, idx, arr);
              const prev   = arr[idx - 1];
              const grouped= prev && prev.senderId === msg.senderId && !newDay;

              return (
                <div key={msg.id}>
                  {/* Day separator */}
                  {newDay && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] font-semibold px-4 py-1 rounded-full shadow-sm"
                            style={{ background: "var(--card)", color: "var(--foreground)",
                                     border: "1px solid var(--border)" }}>
                        {dayLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${grouped ? "mt-0.5" : "mt-2.5"}`}>
                    {/* Avatar — other users only */}
                    {!isMe && (
                      <div className="w-7 shrink-0 self-end">
                        {!grouped ? (
                          <MemberAvatar photoURL={photo} name={name} id={msg.senderId} size={28} />
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    )}

                    {/* Bubble column */}
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] sm:max-w-sm md:max-w-md`}>
                      {/* Sender name */}
                      {!isMe && !grouped && (
                        <span className="text-[11px] font-bold mb-0.5 ml-1" style={{ color }}>
                          {name}
                        </span>
                      )}

                      {/* Image message */}
                      {msg.isDeleted ? (
                        <div className="px-3.5 py-2 text-sm leading-relaxed flex items-center gap-2 italic" style={{
                          background: isMe ? "var(--muted)" : "var(--card)",
                          color: "var(--muted-foreground)",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        }}>
                          <Ban className="h-3.5 w-3.5" />
                          <span>This message was deleted</span>
                        </div>
                      ) : msg.imageUrl ? (
                        <div className="relative group/msg">
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                            <div style={{
                              padding: "3px",
                              background: isMe ? AMBER : "var(--card)",
                              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                            }}>
                              <img src={msg.imageUrl} alt="img"
                                   className="max-w-[220px] sm:max-w-[260px] max-h-[280px] rounded-xl object-cover" />
                              <p className="text-[10px] font-medium text-right px-1 pt-0.5 pb-0" style={{ opacity: 0.55, color: isMe ? AMBER_DARK : "var(--muted-foreground)" }}>
                                {fmt(msg.createdAt)}
                              </p>
                            </div>
                          </a>
                          {isMe && (
                            <div className="absolute -left-9 top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity hidden md:block">
                               <button onClick={() => handleDelete(msg.id)} className="p-1.5 rounded-full bg-white shadow-sm text-gray-500 hover:text-red-500">
                                 <Trash2 className="h-3 w-3" />
                               </button>
                            </div>
                          )}
                          {/* Mobile-only visible delete button since hover is tricky */}
                          {isMe && (
                            <div className="absolute -left-9 top-2 md:hidden">
                               <button onClick={() => handleDelete(msg.id)} className="p-1.5 rounded-full bg-white/80 shadow-sm text-gray-500 hover:text-red-500">
                                 <Trash2 className="h-3 w-3" />
                               </button>
                            </div>
                          )}
                        </div>
                      ) : msg.type === "nudge" ? (
                        /* Playful Meme Nudge Card */
                        <div
                          className="relative max-w-sm rounded-2xl p-4 shadow-sm border border-amber-200 text-slate-900"
                          style={{
                            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200/60">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold text-white tracking-wide">
                              {msg.nudgeMemeTitle || "🎭 SPLINZO NUDGE"}
                            </span>
                            {msg.nudgeAmount && (
                              <span className="font-extrabold text-xs text-amber-900">
                                ₹{msg.nudgeAmount.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs font-semibold text-amber-950 leading-relaxed">
                            {msg.nudgeMemeText || "Friendly reminder to settle up!"}
                          </p>
                          <p className="text-[10px] text-right mt-1.5 text-amber-800/60 font-medium">
                            {fmt(msg.createdAt)}
                          </p>
                        </div>
                      ) : msg.type === "expense_card" && msg.expenseCardData ? (
                        /* Interactive Instant Split Card */
                        <div
                          className="relative max-w-sm rounded-2xl p-4 shadow-md bg-white border-2 border-amber-300 text-slate-900"
                          style={{
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                              <Zap className="h-3 w-3 fill-amber-500 text-amber-500" /> INSTANT SPLIT
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {fmt(msg.createdAt)}
                            </span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-gray-900">
                            {msg.expenseCardData.title}
                          </h4>
                          <div className="text-xl font-extrabold text-gray-900 mt-0.5">
                            {msg.expenseCardData.currency === "INR" ? "₹" : msg.expenseCardData.currency}
                            {msg.expenseCardData.amount.toLocaleString("en-IN")}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Paid by {msg.expenseCardData.payerName} • Split between {msg.expenseCardData.splitCount} people
                          </p>
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                            <span className="text-xs font-medium text-gray-600">Per Person:</span>
                            <span className="text-xs font-bold text-amber-700">
                              {msg.expenseCardData.currency === "INR" ? "₹" : msg.expenseCardData.currency}
                              {msg.expenseCardData.myShare?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      ) : msg.text ? (
                        /* Text message */
                        <div className="relative group/msg max-w-full">
                          <div className="px-3.5 py-2 text-sm leading-relaxed" style={{
                            background: isMe ? AMBER : "var(--card)",
                            color: isMe ? AMBER_DARK : "var(--foreground)",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                            wordBreak: "break-word",
                          }}>
                            <span className="font-medium whitespace-pre-wrap">{msg.text}</span>
                            <span className="block text-[10px] font-medium text-right mt-1 -mb-0.5 ml-8"
                                  style={{ opacity: 0.5, color: isMe ? AMBER_DARK : "var(--muted-foreground)" }}>
                              {msg.editedAt && <span className="mr-1">(edited)</span>}
                              {fmt(msg.createdAt)}
                            </span>
                          </div>
                          {/* Actions overlay for isMe */}
                          {isMe && (
                            <div className="absolute -left-16 top-0 bottom-0 flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity gap-1 hidden md:flex">
                               {canEdit(msg) && (
                                 <button onClick={() => handleEditInit(msg)} className="p-1.5 rounded-full bg-white shadow-sm text-gray-500 hover:text-blue-500">
                                   <Edit2 className="h-3 w-3" />
                                 </button>
                               )}
                               <button onClick={() => handleDelete(msg.id)} className="p-1.5 rounded-full bg-white shadow-sm text-gray-500 hover:text-red-500">
                                 <Trash2 className="h-3 w-3" />
                               </button>
                            </div>
                          )}
                          {/* Mobile-only actions */}
                          {isMe && (
                            <div className="absolute -left-16 top-0 bottom-0 flex items-center gap-1 md:hidden">
                               {canEdit(msg) && (
                                 <button onClick={() => handleEditInit(msg)} className="p-1.5 rounded-full bg-white/80 shadow-sm text-gray-500">
                                   <Edit2 className="h-3 w-3" />
                                 </button>
                               )}
                               <button onClick={() => handleDelete(msg.id)} className="p-1.5 rounded-full bg-white/80 shadow-sm text-gray-500">
                                 <Trash2 className="h-3 w-3" />
                               </button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Edit preview strip ── */}
      {editingMessageId && (
        <div className="px-4 py-2 flex items-center justify-between shrink-0"
             style={{ background: "var(--muted)", borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 text-sm">
            <Edit2 className="h-4 w-4" style={{ color: AMBER }} />
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>Editing Message</span>
          </div>
          <button onClick={handleCancelEdit}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Image preview strip ── */}
      {imagePreviewUrl && !editingMessageId && (
        <div className="px-4 py-2 flex items-center gap-3 shrink-0"
             style={{ background: "var(--muted)", borderTop: "1px solid var(--border)" }}>
          <div className="relative shrink-0">
            <img src={imagePreviewUrl} alt="preview" className="h-14 w-14 rounded-xl object-cover" />
            <button onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--foreground)", color: "var(--background)" }}>
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
            {uploading ? "Uploading…" : "Image ready to send"}
          </span>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="shrink-0 px-3 py-3" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
        {/* Constrain to same max-width as messages */}
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          {/* Quick Bill Split button */}
          <button
            type="button"
            onClick={() => setIsQuickBillOpen(true)}
            title="Instant Bill Split"
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 bg-amber-100 text-amber-700 hover:bg-amber-200"
          >
            <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
          </button>

          {/* Image button */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                  style={{ background: "var(--muted)" }}>
            <ImageIcon className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </button>
          <input type="file" accept="image/*,.heic,.heif" ref={fileInputRef} className="hidden"
                 onChange={(e) => {
                   const f = e.target.files?.[0];
                   if (f) { setImageFile(f); setImagePreviewUrl(URL.createObjectURL(f)); }
                 }} />

          {/* Text area — pill-shaped */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={editingMessageId ? "Edit your message…" : "Type a message…"}
              value={editingMessageId ? editText : text}
              onChange={(e) => {
                if (editingMessageId) {
                  setEditText(e.target.value);
                } else {
                  setText(e.target.value);
                }
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
              }}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-3xl px-4 py-2.5 text-sm font-medium outline-none"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
                maxHeight: "96px",
                lineHeight: "1.5",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "none",
              }}
            />
          </div>

          {/* Send button */}
          <button onClick={() => handleSend()}
                  disabled={editingMessageId ? !editText.trim() : (sending || uploading || (!text.trim() && !imageFile))}
                  className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 disabled:opacity-40"
                  style={{ background: AMBER }}>
            {(sending || uploading) ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <Send className="h-4 w-4 ml-0.5" style={{ color: AMBER_DARK }} />
            )}
          </button>
        </div>
      </div>

      {/* Quick Bill Split Modal */}
      {isQuickBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 font-bold">
                  <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">Quick Bill Split</h4>
                  <p className="text-xs text-slate-500">Drop an interactive split card in chat</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickBillOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickBillSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">What was it for?</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickBillTitle}
                  onChange={(e) => setQuickBillTitle(e.target.value)}
                  placeholder="e.g. Uber, Dinner, Coffee"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Total Amount ({group?.currency === "INR" ? "₹" : (group?.currency || "₹")})
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-500">
                    {group?.currency === "INR" ? "₹" : (group?.currency || "₹")}
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quickBillAmount}
                    onChange={(e) => setQuickBillAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-xl font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                Split equally between all {group?.members?.length || 1} group members.
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickBillOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickBill}
                  className="flex-1 rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-slate-950 shadow-md hover:bg-amber-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-4 w-4 fill-slate-950" />
                  {isSubmittingQuickBill ? "Posting..." : "Drop in Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
