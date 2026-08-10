"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Bell, MessageCircle, Star, Home, CheckCircle, Info,
  Zap, Crown, ArrowLeft, Check, Trash2,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type NotifType = "message" | "review" | "listing" | "system" | "promotion";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  time: string;
  avatar?: string;
  initials?: string;
}

const TYPE_ICON: Record<NotifType, { icon: any; bg: string; color: string }> = {
  message:   { icon: MessageCircle, bg: "bg-blue-50",    color: "text-blue-500" },
  review:    { icon: Star,          bg: "bg-amber-50",   color: "text-amber-500" },
  listing:   { icon: Home,          bg: "bg-emerald-50", color: "text-emerald-500" },
  system:    { icon: Info,          bg: "bg-neutral-100",color: "text-neutral-500" },
  promotion: { icon: Zap,           bg: "bg-purple-50",  color: "text-purple-500" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function buildNotifications(chats: any[], reviews: any[], myReviews: any[], userId: string): Notif[] {
  const notifs: Notif[] = [];

  // Unread messages
  chats.forEach((c: any) => {
    const unread = c.numberOfUnreadMessage ?? c.unreadCount ?? 0;
    if (unread > 0) {
      const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Someone";
      notifs.push({
        id: `msg-${c._id}`,
        type: "message",
        title: name,
        body: c.lastMessage ? `"${c.lastMessage}"` : `${unread} unread message${unread > 1 ? "s" : ""}`,
        href: "/messages",
        read: false,
        time: c.lastMessageAt ?? new Date().toISOString(),
        avatar: c.profilePic,
        initials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      });
    }
  });

  // Reviews received (for agents/landlords)
  reviews.forEach((r: any) => {
    const name = `${r.firstName ?? r.reviewer?.firstName ?? "Someone"}`.trim();
    notifs.push({
      id: `rev-${r._id}`,
      type: "review",
      title: "New review received",
      body: `${name} rated you ${r.rating}★${r.message || r.comment ? ` — "${r.message || r.comment}"` : ""}`,
      href: `/account`,
      read: false,
      time: r.createdAt,
      initials: name[0]?.toUpperCase() ?? "?",
    });
  });

  // Reply notifications — reviews the user wrote that now have a reply
  myReviews.forEach((r: any) => {
    if (r.reply?.text && r.reply?.repliedAt) {
      const agentName = r.agentName || "The agent";
      notifs.push({
        id: `reply-${r._id}`,
        type: "review",
        title: "Agent replied to your review",
        body: `${agentName} responded: "${r.reply.text}"`,
        href: r.portfolioUrl || "/",
        read: false,
        time: r.reply.repliedAt,
        initials: agentName[0]?.toUpperCase() ?? "A",
      });
    }
  });

  // Sort newest first
  notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return notifs;
}

const TABS = [
  { key: "all",       label: "All" },
  { key: "message",   label: "Messages" },
  { key: "review",    label: "Reviews" },
  { key: "listing",   label: "Listings" },
  { key: "system",    label: "System" },
] as const;

function NotificationsContent() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"all" | NotifType>("all");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const isAgent = user.role === "agent" || user.role === "landlord";

    Promise.all([
      api.get<any>(isAgent ? "/v1/landlordandagent/chats" : "/v1/user/chats").catch(() => ({})),
      // Reviews ON the agent (reviews they received)
      isAgent ? api.get<any>(`/v1/landlordandagent/review/${user.userId}`).catch(() => ({})) : Promise.resolve({}),
    ]).then(([chatRes, reviewRes]) => {
      const chats = chatRes?.chats ?? chatRes ?? [];
      const reviews = reviewRes?.reviews ?? reviewRes?.result ?? [];
      setNotifs(buildNotifications(chats, reviews, [], user.userId));
    }).finally(() => setLoading(false));

    // Load previously read IDs from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("BT_READ_NOTIFS") ?? "[]");
      setReadIds(new Set(saved));
    } catch {}
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("BT_READ_NOTIFS", JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const markAllRead = () => {
    const all = new Set(notifs.map(n => n.id));
    setReadIds(all);
    try { localStorage.setItem("BT_READ_NOTIFS", JSON.stringify(Array.from(all))); } catch {}
  };

  const filtered = notifs.filter(n => {
    if (tab === "all") return true;
    return n.type === tab;
  });

  const unreadCount = notifs.filter(n => !readIds.has(n.id)).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-neutral-500 p-1"><ArrowLeft className="w-5 h-5" /></Link>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-neutral-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-bt-primary text-white text-xs font-bold">{unreadCount}</span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm text-bt-primary font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* Tab pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1">
            {TABS.map(t => {
              const count = t.key === "all"
                ? notifs.filter(n => !readIds.has(n.id)).length
                : notifs.filter(n => n.type === t.key && !readIds.has(n.id)).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors relative",
                    tab === t.key ? "bg-bt-primary text-white" : "bg-white border border-neutral-200 text-neutral-600"
                  )}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={cn(
                      "ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      tab === t.key ? "bg-white/20 text-white" : "bg-bt-primary/10 text-bt-primary"
                    )}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-neutral-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-1/2" />
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No notifications</p>
            <p className="text-sm text-neutral-400 mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((n, i) => {
                const isRead = readIds.has(n.id);
                const meta = TYPE_ICON[n.type];
                const Inner = (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "bg-white rounded-2xl p-4 flex gap-3 cursor-pointer active:scale-[0.99] transition-all border",
                      isRead ? "border-neutral-100 opacity-70" : "border-neutral-100 shadow-sm"
                    )}
                  >
                    {/* Icon / avatar */}
                    <div className="relative shrink-0">
                      {n.avatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <Image src={n.avatar} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                      ) : n.initials ? (
                        <div className="w-10 h-10 rounded-full bg-bt-primary/10 flex items-center justify-center text-bt-primary font-bold text-sm">
                          {n.initials}
                        </div>
                      ) : (
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", meta.bg)}>
                          <meta.icon className={cn("w-5 h-5", meta.color)} />
                        </div>
                      )}
                      {/* Type badge overlay */}
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white", meta.bg)}>
                        <meta.icon className={cn("w-2.5 h-2.5", meta.color)} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", isRead ? "font-normal text-neutral-600" : "font-semibold text-neutral-900")}>
                          {n.title}
                        </p>
                        <span className="text-[11px] text-neutral-400 shrink-0 mt-0.5">{timeAgo(n.time)}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>
                    </div>

                    {/* Unread dot */}
                    {!isRead && (
                      <div className="w-2 h-2 rounded-full bg-bt-primary shrink-0 mt-1" />
                    )}
                  </motion.div>
                );

                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => markRead(n.id)}>{Inner}</Link>
                ) : Inner;
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return <AuthGuard><NotificationsContent /></AuthGuard>;
}
