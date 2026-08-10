"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MessageCircle, Search, Loader2, Send, ArrowLeft, Star, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

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
  const [tab, setTab] = useState<"all" | "unread">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const endpoint = user?.role === "agent" || user?.role === "landlord"
      ? "/v1/landlordandagent/chats"
      : "/v1/user/chats";
    api.get<any>(endpoint)
      .then((r) => {
        const list = r.chats ?? r ?? [];
        setChats(list);
        // Update unread badge
        const unread = list.reduce((s: number, c: any) => s + (c.numberOfUnreadMessage ?? c.unreadCount ?? 0), 0);
        try { localStorage.setItem("BT_UNREAD_COUNT", String(unread)); } catch {}
      })
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const openChat = async (chat: any) => {
    setSelected(chat);
    setMsgLoading(true);
    const otherId = chat.userId?._id ?? chat.userId ?? chat._id;
    try {
      const r = await api.get<any>(`/v1/user/messages/${otherId}`);
      setMessages(r.messages ?? r ?? []);
      // Mark as read locally
      setChats(prev => prev.map(c => c._id === chat._id ? { ...c, numberOfUnreadMessage: 0, unreadCount: 0 } : c));
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
      setMessages(prev => [...prev, {
        _id: Date.now().toString(),
        message: text,
        from: { _id: user?.userId },
        createdAt: new Date().toISOString(),
      }]);
      setNewMsg("");
      // Update last message preview
      setChats(prev => prev.map(c => c._id === selected._id
        ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
        : c
      ));
    } catch {
      toast.error("Failed to send. Try again.");
    }
    setSending(false);
  };

  const filtered = chats.filter((c: any) => {
    const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchTab = tab === "all" || (c.numberOfUnreadMessage ?? c.unreadCount ?? 0) > 0;
    return matchSearch && matchTab;
  });

  const totalUnread = chats.reduce((s, c) => s + (c.numberOfUnreadMessage ?? c.unreadCount ?? 0), 0);

  const selectedName = selected
    ? `${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim() || "Unknown"
    : "";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1360px] mx-auto lg:px-10 lg:py-8">
        <div className="bg-white lg:rounded-2xl border-0 lg:border border-neutral-100 lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex h-[calc(100dvh-64px)] lg:h-[calc(100dvh-160px)] min-h-[500px]">

          {/* ── Chat list sidebar ─────────────────────────── */}
          <div className={cn(
            "w-full md:w-[320px] lg:w-[360px] shrink-0 flex flex-col border-r border-neutral-100 bg-white",
            selected && "hidden md:flex"
          )}>
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-50">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold text-neutral-900">Messages</h1>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-bt-primary text-white text-xs font-bold">{totalUnread}</span>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-bt-primary"
                />
              </div>

              {/* Tab pills */}
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All", count: chats.length },
                  { key: "unread", label: "Unread", count: totalUnread },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as any)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
                      tab === t.key ? "bg-bt-primary text-white" : "bg-neutral-100 text-neutral-600"
                    )}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span className={cn(
                        "ml-1.5 text-[10px] font-bold",
                        tab === t.key ? "opacity-70" : "text-neutral-400"
                      )}>{t.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-bt-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <MessageCircle className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">{tab === "unread" ? "No unread messages" : "No conversations yet"}</p>
                </div>
              ) : (
                filtered.map((chat: any, i: number) => {
                  const name = `${chat.firstName ?? ""} ${chat.lastName ?? ""}`.trim() || "Unknown";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  const isActive = selected?._id === chat._id;
                  const unread = chat.numberOfUnreadMessage ?? chat.unreadCount ?? 0;

                  return (
                    <motion.button
                      key={chat._id ?? i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => openChat(chat)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-neutral-50 last:border-0",
                        isActive ? "bg-bt-primary/5 border-l-2 border-l-bt-primary" : "hover:bg-neutral-50 active:bg-neutral-100",
                        unread > 0 && !isActive && "bg-blue-50/30"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-bt-primary/10 flex items-center justify-center text-bt-primary font-bold text-sm overflow-hidden">
                          {chat.profilePic
                            ? <Image src={chat.profilePic} alt="" width={44} height={44} className="object-cover w-full h-full" />
                            : initials
                          }
                        </div>
                        {unread > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-bt-primary border-2 border-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn("text-sm truncate capitalize", unread > 0 ? "font-bold text-neutral-900" : "font-medium text-neutral-700")}>{name}</p>
                          {chat.lastMessageAt && (
                            <span className="text-[11px] text-neutral-400 shrink-0">{timeAgo(chat.lastMessageAt)}</span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className={cn("text-xs truncate mt-0.5", unread > 0 ? "text-neutral-700 font-medium" : "text-neutral-400")}>{chat.lastMessage}</p>
                        )}
                        {chat.role && (
                          <p className="text-[10px] text-neutral-400 mt-0.5 capitalize">{chat.role}</p>
                        )}
                      </div>

                      {/* Unread count badge */}
                      {unread > 0 && (
                        <div className="min-w-[20px] h-5 px-1 rounded-full bg-bt-primary flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Conversation pane ─────────────────────────── */}
          <div className={cn("flex-1 flex flex-col bg-white", !selected && "hidden md:flex")}>
            {selected ? (
              <>
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center gap-3 bg-white">
                  <button
                    onClick={() => setSelected(null)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-bt-primary/10 flex items-center justify-center text-bt-primary font-bold text-sm overflow-hidden shrink-0">
                    {selected.profilePic
                      ? <Image src={selected.profilePic} alt="" width={36} height={36} className="object-cover w-full h-full" />
                      : `${selected.firstName?.[0] ?? ""}${selected.lastName?.[0] ?? ""}`.toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 capitalize truncate">{selectedName}</p>
                    <p className="text-xs text-neutral-400 capitalize">{selected.role ?? "User"}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: "linear-gradient(to bottom, #fafafa, #fff)" }}>
                  {msgLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-bt-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-neutral-400">No messages yet. Say hello! 👋</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg: any) => {
                        const isMine = msg.from?._id === user?.userId || msg.from === user?.userId;
                        return (
                          <div key={msg._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[72%] px-4 py-2.5 rounded-2xl text-sm",
                              isMine ? "bg-bt-primary text-white rounded-br-md" : "bg-neutral-100 text-neutral-900 rounded-bl-md"
                            )}>
                              <p className="leading-relaxed">{msg.message}</p>
                              <div className={cn("flex items-center gap-1 justify-end mt-1", isMine ? "text-white/50" : "text-neutral-400")}>
                                <span className="text-[10px]">
                                  {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isMine && <CheckCheck className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="px-4 py-3 border-t border-neutral-100 flex items-center gap-2 bg-white" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 text-sm focus:outline-none focus:border-bt-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newMsg.trim() || sending}
                    className="w-10 h-10 rounded-full bg-bt-primary flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-500">Select a conversation</p>
                  <p className="text-xs text-neutral-400 mt-1">Choose from your chats on the left</p>
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
