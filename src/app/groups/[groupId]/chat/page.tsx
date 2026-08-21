"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupChatPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { appUser } = useAuth();
  const { group, loading } = useGroup(resolvedParams.groupId);

  if (loading) {
    return (
      <div className="space-y-4 mt-4 h-[60vh] flex flex-col justify-end">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className="h-16 w-64 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  // Mock messages for demonstration
  const mockMessages = [
    {
      id: "1",
      senderId: "system",
      senderName: "Splinzo",
      text: `${group?.createdBy === appUser?.id ? "You" : "Someone"} created the group "${group?.name}"`,
      timestamp: new Date(Date.now() - 86400000),
      isSystem: true
    },
    {
      id: "2",
      senderId: group?.members[0]?.id || "unknown",
      senderName: group?.members[0]?.name || "User",
      text: "Hey everyone! Let's use this group for our upcoming trip expenses.",
      timestamp: new Date(Date.now() - 3600000),
      isSystem: false
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] mt-4">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 pb-4">
        
        {/* Empty State / Coming Soon */}
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-2xl border-dashed border-2 mb-6">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-bold">Group Chat (Preview)</h3>
          <p className="text-xs text-gray-500 max-w-[250px] mt-1">
            Real-time chat schema synchronization with the Flutter app is coming soon.
          </p>
        </div>

        {mockMessages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.senderId === appUser?.id;

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <Avatar className="h-8 w-8 mt-auto shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`} />
                  <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                {!isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</span>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-white border shadow-sm rounded-bl-none text-gray-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input Area */}
      <div className="pt-4 border-t mt-auto">
        <form className="flex items-end gap-2" onSubmit={(e) => e.preventDefault()}>
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full h-11 w-11 text-gray-400 hover:text-gray-600">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input 
            placeholder="Type a message..." 
            className="rounded-2xl h-11 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:bg-white"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-full h-11 w-11">
            <Send className="h-5 w-5 ml-1" />
          </Button>
        </form>
      </div>
    </div>
  );
}
