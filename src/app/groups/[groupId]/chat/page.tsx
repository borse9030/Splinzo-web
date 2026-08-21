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
const BG = "#ECE5DD"; // WhatsApp-like warm background

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
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

  // Scroll to bottom whenever messages change
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

  const getAvatarColor = (senderId: string) => {
    // Deterministic color per user based on their ID
    const colors = ["#E91E63", "#9C27B0", "#2196F3", "#00BCD4", "#4CAF50", "#FF5722", "#607D8B"];
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
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
      handleSend(e as any);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
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

  const isNewDay = (msg: ChatMessage, idx: number) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    if (!msg.createdAt || !prev.createdAt) return false;
    return msg.createdAt.toDate().toDateString() !== prev.createdAt.toDate().toDateString();
  };

  const visibleMessages = messages.filter((m) => !m.isCallLog);

  return (
    /*
     * The parent layout has pb-24 which creates space below this component.
     * We use -mb-24 -mx-4 sm:-mx-6 lg:-mx-8 to cancel parent padding and
     * stretch edge-to-edge. Height fills viewport minus hero+actions+tabs (~308px)
     * and the sidebar offset is handled by the parent.
     */
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 -mb-24 flex flex-col"
      style={{
        height: "calc(100svh - 308px)",
        background: BG,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b99a' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* ── Messages scroll area ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1">
        {chatLoading || groupLoading ? (
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} gap-2`}>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? "w-40" : "w-56"}`} />
              </div>
            ))}
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4 shadow-sm"
              style={{ background: "rgba(249,185,18,0.15)" }}
            >
              <MessageSquare className="h-10 w-10" style={{ color: AMBER }} />
            </div>
            <h3 className="text-base font-extrabold text-gray-700">No messages yet</h3>
            <p className="text-sm text-gray-400 mt-1">Say hi to the group! 👋</p>
          </div>
        ) : (
          visibleMessages.map((msg, idx) => {
            const isMe = msg.senderId === appUser?.id;
            const name = getMemberName(msg.senderId);
            const avatarColor = getAvatarColor(msg.senderId);
            const prev = visibleMessages[idx - 1];
            const newDay = isNewDay(msg, idx);
            const sameAuthorAsPrev =
              prev &&
              prev.senderId === msg.senderId &&
              !newDay;

            return (
              <div key={msg.id}>
                {/* Day separator pill */}
                {newDay && (
                  <div className="flex justify-center my-4">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                      style={{ background: "#D1C4A8", color: "#5a4a3a" }}
                    >
                      {dayLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"} mb-0.5`}>
                  {/* Avatar — only for others, only first in a group */}
                  <div className="w-7 shrink-0">
                    {!isMe && !sameAuthorAsPrev ? (
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: avatarColor }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                  </div>

                  {/* Bubble column */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[78%] sm:max-w-[65%]`}>
                    {/* Sender name — only for others, first in group */}
                    {!isMe && !sameAuthorAsPrev && (
                      <span
                        className="text-[11px] font-bold mb-1 ml-1"
                        style={{ color: avatarColor }}
                      >
                        {name}
                      </span>
                    )}

                    {/* Image message */}
                    {msg.imageUrl ? (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <div
                          className="rounded-2xl overflow-hidden shadow-sm"
                          style={
                            isMe
                              ? { background: AMBER, padding: "3px", borderBottomRightRadius: "4px" }
                              : { background: "white", padding: "3px", borderBottomLeftRadius: "4px" }
                          }
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Image"
                            className="max-w-[240px] max-h-[300px] object-cover rounded-xl"
                          />
                          <p className={`text-[10px] font-medium mt-1 px-1 pb-0.5 text-right ${isMe ? "text-amber-900/60" : "text-gray-400"}`}>
                            {fmt(msg.createdAt)}
                          </p>
                        </div>
                      </a>
                    ) : msg.text ? (
                      /* Text message */
                      <div
                        className="relative px-3 py-2 text-sm leading-relaxed shadow-sm"
                        style={
                          isMe
                            ? {
                                background: AMBER,
                                color: AMBER_DARK,
                                borderRadius: "18px 18px 4px 18px",
                              }
                            : {
                                background: "white",
                                color: "#1a1a1a",
                                borderRadius: "18px 18px 18px 4px",
                              }
                        }
                      >
                        <span className="font-medium whitespace-pre-wrap">{msg.text}</span>
                        <span
                          className="block text-[10px] font-medium text-right mt-0.5 -mb-0.5"
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

      {/* ── Image preview strip ── */}
      {imagePreviewUrl && (
        <div
          className="px-4 pb-2 flex items-center gap-3"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          <div className="relative">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-16 w-16 rounded-xl object-cover border-2"
              style={{ borderColor: AMBER }}
            />
            <button
              onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-700 text-white flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <span className="text-xs font-medium text-gray-600">
            {uploading ? "Uploading..." : "Ready to send"}
          </span>
        </div>
      )}

      {/* ── Input bar ── */}
      <div
        className="flex items-end gap-2 px-3 py-3"
        style={{ background: "#F0EBE1" }}
      >
        {/* Image picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
          style={{ background: AMBER, color: AMBER_DARK }}
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImagePick}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm font-medium outline-none"
          style={{
            background: "white",
            border: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            maxHeight: "100px",
            lineHeight: "1.5",
          }}
        />

        {/* Send button */}
        <button
          type="submit"
          onClick={handleSend}
          disabled={sending || uploading || (!text.trim() && !imageFile)}
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
          style={{ background: AMBER, color: AMBER_DARK }}
        >
          {sending || uploading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <Send className="h-4 w-4 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
