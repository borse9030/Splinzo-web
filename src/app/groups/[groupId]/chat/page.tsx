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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { storageService } from "@/services/storageService";
import { Send, ImageIcon, MessageSquare, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AMBER = "#F9B912";
const AMBER_DARK = "#1a1a1a";

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  isCallLog?: boolean;
  createdAt: Timestamp | null;
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real-time listener — same Firestore path as Flutter app
  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "groups", groupId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
      setChatLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMemberName = useCallback(
    (senderId: string) => {
      const m = group?.members?.find((m: any) => m.id === senderId);
      if (m) return (m.name || m.displayName || "?").split(" ")[0];
      return "Unknown";
    },
    [group]
  );

  const getAvatarColor = (id: string) => {
    const colors = ["#E91E63", "#9C27B0", "#2196F3", "#00BCD4", "#4CAF50", "#FF5722", "#607D8B"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !imageFile) || !appUser || sending) return;
    setSending(true);
    try {
      if (imageFile) {
        setUploading(true);
        const url = await storageService.uploadFile(imageFile);
        setUploading(false);
        await addDoc(collection(db, "groups", groupId, "messages"), {
          groupId,
          senderId: appUser.id,
          imageUrl: url,
          createdAt: serverTimestamp(),
        });
        setImageFile(null);
        setImagePreviewUrl(null);
      }
      if (text.trim()) {
        await addDoc(collection(db, "groups", groupId, "messages"), {
          groupId,
          senderId: appUser.id,
          text: text.trim(),
          createdAt: serverTimestamp(),
        });
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fmt = (ts: Timestamp | null) => {
    if (!ts) return "";
    return ts.toDate().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const dayLabel = (ts: Timestamp | null) => {
    if (!ts) return "";
    const d = ts.toDate();
    const now = new Date();
    const yest = new Date(now);
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
    /**
     * Layout now passes flex-1 min-h-0 down from main → content div → here.
     * So h-full fills exactly the remaining viewport space on ALL screen sizes.
     * No calc(), no viewport hacks, works on mobile + desktop identically.
     */
    <div
      className="flex flex-col w-full h-full"
      style={{ background: "#ECE5DD" }}
    >
      {/* ── Scrollable messages ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-0.5 overscroll-contain">
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
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(249,185,18,0.18)" }}
            >
              <MessageSquare className="h-8 w-8" style={{ color: AMBER }} />
            </div>
            <p className="text-base font-extrabold text-gray-700">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to say hi! 👋</p>
          </div>
        ) : (
          visibleMessages.map((msg, idx, arr) => {
            const isMe = msg.senderId === appUser?.id;
            const name = getMemberName(msg.senderId);
            const color = getAvatarColor(msg.senderId);
            const newDay = isNewDay(msg, idx, arr);
            const prev = arr[idx - 1];
            const grouped = prev && prev.senderId === msg.senderId && !newDay;

            return (
              <div key={msg.id}>
                {newDay && (
                  <div className="flex justify-center my-3">
                    <span
                      className="text-[11px] font-semibold px-3 py-1 rounded-full"
                      style={{ background: "#D1C4A8", color: "#5a4a3a" }}
                    >
                      {dayLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-1.5 mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${grouped ? "mt-0.5" : "mt-2"}`}>
                  {/* Avatar */}
                  <div className="w-7 shrink-0 self-end">
                    {!isMe && !grouped ? (
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: color }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                    ) : <div className="h-7 w-7" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[78%] sm:max-w-[60%]`}>
                    {!isMe && !grouped && (
                      <span className="text-[11px] font-bold mb-0.5 ml-1" style={{ color }}>
                        {name}
                      </span>
                    )}

                    {msg.imageUrl ? (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            padding: "3px",
                            background: isMe ? AMBER : "white",
                            borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          <img
                            src={msg.imageUrl}
                            alt="img"
                            className="max-w-[220px] sm:max-w-[260px] max-h-[280px] rounded-lg object-cover"
                          />
                          <p className="text-[10px] font-medium text-right px-1 pt-0.5 pb-0" style={{ opacity: 0.55 }}>
                            {fmt(msg.createdAt)}
                          </p>
                        </div>
                      </a>
                    ) : msg.text ? (
                      <div
                        className="px-3 py-2 text-sm leading-relaxed"
                        style={{
                          background: isMe ? AMBER : "white",
                          color: AMBER_DARK,
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                          wordBreak: "break-word",
                        }}
                      >
                        <span className="font-medium whitespace-pre-wrap">{msg.text}</span>
                        <span
                          className="block text-[10px] font-medium text-right mt-0.5 -mb-0.5 ml-6"
                          style={{ opacity: 0.55 }}
                        >
                          {fmt(msg.createdAt)}
                        </span>
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

      {/* ── Image preview ── */}
      {imagePreviewUrl && (
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.07)" }}>
          <div className="relative shrink-0">
            <img src={imagePreviewUrl} alt="preview" className="h-14 w-14 rounded-xl object-cover" />
            <button
              onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-700 text-white flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
          <span className="text-xs font-semibold text-gray-500">{uploading ? "Uploading…" : "Image ready"}</span>
        </div>
      )}

      {/* ── Input bar — always at bottom, no overflow issues ── */}
      <div
        className="flex items-end gap-2 px-3 py-3 shrink-0"
        style={{ background: "#F0EBE1", borderTop: "1px solid #DDD5C6" }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          style={{ background: AMBER }}
        >
          <ImageIcon className="h-5 w-5" style={{ color: AMBER_DARK }} />
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setImageFile(f); setImagePreviewUrl(URL.createObjectURL(f)); }
        }} />

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm font-medium outline-none"
          style={{
            background: "white",
            border: "none",
            maxHeight: "96px",
            lineHeight: "1.5",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        />

        <button
          onClick={() => handleSend()}
          disabled={sending || uploading || (!text.trim() && !imageFile)}
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-40"
          style={{ background: AMBER }}
        >
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
  );
}
