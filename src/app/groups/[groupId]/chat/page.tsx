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
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon, MessageSquare, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef as useInputRef } from "react";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

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
  const [imagePreview, setImagePreview] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to messages in real-time — same collection as Flutter app
  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "groups", groupId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as ChatMessage));
      setMessages(msgs);
      setChatLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMemberName = useCallback(
    (senderId: string) => {
      const member = group?.members?.find((m: any) => m.id === senderId);
      if (member) return (member.name || member.displayName || "").split(" ")[0];
      return "Unknown";
    },
    [group]
  );

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview) || !appUser || sending) return;

    setSending(true);
    try {
      if (imagePreview) {
        setUploading(true);
        const url = await storageService.uploadFile(imagePreview);
        setUploading(false);
        await addDoc(collection(db, "groups", groupId, "messages"), {
          groupId,
          senderId: appUser.id,
          imageUrl: url,
          createdAt: serverTimestamp(),
        });
        setImagePreview(null);
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
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText(e as any);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return "";
    const date = ts.toDate();
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDateLabel = (ts: Timestamp | null) => {
    if (!ts) return "";
    const date = ts.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const shouldShowDateLabel = (msg: ChatMessage, idx: number) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    if (!msg.createdAt || !prev.createdAt) return false;
    return msg.createdAt.toDate().toDateString() !== prev.createdAt.toDate().toDateString();
  };

  if (groupLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-280px)] mt-4 gap-4">
        <div className="flex-1 space-y-4 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col mt-4 rounded-2xl overflow-hidden"
      style={{ height: "calc(100vh - 280px)", background: "#F7F7F7" }}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {chatLoading ? (
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} gap-2`}>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
              </div>
            ))}
          </div>
        ) : messages.filter((m) => !m.isCallLog).length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: AMBER_LIGHT }}
            >
              <MessageSquare className="h-10 w-10" style={{ color: AMBER }} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">No messages yet</h3>
            <p className="text-sm text-gray-400 mt-1 font-medium">Say hi to the group! 👋</p>
          </div>
        ) : (
          messages
            .filter((m) => !m.isCallLog)
            .map((msg, idx, arr) => {
              const isMe = msg.senderId === appUser?.id;
              const senderName = getMemberName(msg.senderId);
              const prevMsg = arr[idx - 1];
              const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && !shouldShowDateLabel(msg, idx);
              const showAvatar = !isMe && !isConsecutive;

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {shouldShowDateLabel(msg, idx) && (
                    <div className="flex justify-center my-4">
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.07)", color: "#888" }}
                      >
                        {formatDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Sender name for others (only show for first in group) */}
                  {!isMe && !isConsecutive && (
                    <p className="text-xs font-bold ml-11 mb-1" style={{ color: AMBER }}>
                      {senderName}
                    </p>
                  )}

                  <div className={`flex items-end gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className="w-8 shrink-0">
                      {showAvatar ? (
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: AMBER_LIGHT, color: AMBER }}
                        >
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                      ) : null}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                      {msg.imageUrl ? (
                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.imageUrl}
                            alt="Image"
                            className="max-w-[260px] rounded-2xl object-cover shadow-sm"
                            style={isMe ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }}
                          />
                        </a>
                      ) : msg.text ? (
                        <div
                          className="px-4 py-2.5 text-sm font-medium leading-relaxed"
                          style={
                            isMe
                              ? {
                                  background: AMBER,
                                  color: "#1a1a1a",
                                  borderRadius: "18px 18px 4px 18px",
                                }
                              : {
                                  background: "white",
                                  color: "#1a1a1a",
                                  borderRadius: "18px 18px 18px 4px",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                }
                          }
                        >
                          {msg.text}
                        </div>
                      ) : null}

                      {/* Timestamp */}
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview strip */}
      {imagePreviewUrl && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-20 w-20 rounded-xl object-cover border-2"
              style={{ borderColor: AMBER }}
            />
            <button
              onClick={() => { setImagePreview(null); setImagePreviewUrl(null); }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className="px-4 py-3 border-t"
        style={{ background: "white", borderColor: "#F0F0F0" }}
      >
        <form onSubmit={handleSendText} className="flex items-end gap-2">
          {/* Image picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ background: AMBER_LIGHT, color: AMBER }}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Text area */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type a message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm font-medium outline-none border transition-all"
            style={{
              background: "#F7F7F7",
              borderColor: "#EBEBEB",
              lineHeight: "1.5",
              maxHeight: "120px",
            }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || uploading || (!text.trim() && !imagePreview)}
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
            style={{ background: AMBER, color: "#1a1a1a" }}
          >
            {uploading || sending ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <Send className="h-4 w-4 ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
