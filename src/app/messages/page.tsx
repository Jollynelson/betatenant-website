"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Search, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

function MessagesContent() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const chatEndpoint =
      user?.role === "agent" || user?.role === "landlord"
        ? "/v1/landlordandagent/chats"
        : "/v1/user/chats";
    api.get<any>(chatEndpoint)
      .then((r) => setChats(r.chats ?? r ?? []))
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const openChat = async (chat: any) => {
    setSelected(chat);
    setMsgLoading(true);
    // Backend populates chat.userId as the other user's profile object
    const otherId = chat.userId?._id ?? chat.userId ?? chat._id;
    try {
      const r = await api.get<any>(`/v1/user/messages/${otherId}`);
      setMessages(r.messages ?? r ?? []);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    const text = newMsg.trim();
    const otherId = selected.userId?._id ?? selected.userId ?? selected._id;
    try {
      await api.post("/v1/user/message", { to: otherId, message: text });
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          message: text,
          from: { _id: user?.userId },
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewMsg("");
    } catch {
      toast.error("Message failed to send. Tap to retry.");
    }
    setSending(false);
  };

  const filtered = chats.filter((c: any) => {
    const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-[-0.02em] mb-6">Messages</h1>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex h-[calc(100dvh-220px)] min-h-[500px]">

          {/* Sidebar */}
          <div className={cn("w-full md:w-[300px] lg:w-[340px] shrink-0 flex flex-col border-r border-neutral-100", selected && "hidden md:flex")}>
            <div className="p-4 border-b border-neutral-50">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-bt-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <MessageCircle className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">No conversations yet</p>
                </div>
              ) : (
                filtered.map((chat: any, i: number) => {
                  const name = `${chat.firstName ?? ""} ${chat.lastName ?? ""}`.trim() || "Unknown";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  const isActive = selected?._id === chat._id;
                  return (
                    <motion.button
                      key={chat._id ?? i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openChat(chat)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                        isActive ? "bg-bt-primary/5 border-r-2 border-bt-primary" : "hover:bg-neutral-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-neutral-900 truncate capitalize">{name}</p>
                          {chat.lastMessageAt && (
                            <span className="text-[11px] text-neutral-400 shrink-0 ml-2">
                              {new Date(chat.lastMessageAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-xs text-neutral-500 truncate mt-0.5">{chat.lastMessage}</p>
                        )}
                      </div>
                      {(chat.unreadCount ?? 0) > 0 && (
                        <div className="w-5 h-5 rounded-full bg-bt-primary flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{chat.unreadCount}</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className={cn("flex-1 flex flex-col", !selected && "hidden md:flex")}>
            {selected ? (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="md:hidden text-neutral-500 hover:text-neutral-800 mr-1 text-sm py-2 px-2 min-h-[44px] flex items-center"
                  >
                    ← Back
                  </button>
                  <div className="w-9 h-9 rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary font-bold text-sm">
                    {`${selected.firstName?.[0] ?? ""}${selected.lastName?.[0] ?? ""}`.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 capitalize">
                      {`${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim()}
                    </p>
                    <p className="text-xs text-neutral-400 capitalize">{selected.role ?? "User"}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-bt-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-neutral-400 py-10">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg: any) => {
                      const isMine = msg.from?._id === user?.userId || msg.from === user?.userId;
                      return (
                        <div key={msg._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                            isMine
                              ? "bg-bt-primary text-white rounded-br-sm"
                              : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
                          )}>
                            <p className="leading-relaxed">{msg.message}</p>
                            <p className={cn("text-[10px] mt-1", isMine ? "text-white/60" : "text-neutral-400")}>
                              {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="px-4 py-3 border-t border-neutral-100 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newMsg.trim() || sending}
                    className="w-10 h-10 rounded-full bg-bt-primary flex items-center justify-center text-white hover:bg-bt-primary-light transition-colors disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return <AuthGuard><MessagesContent /></AuthGuard>;
}
