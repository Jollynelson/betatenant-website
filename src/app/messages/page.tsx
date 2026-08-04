"use client";

import { motion } from "framer-motion";
import { MessageCircle, Search } from "lucide-react";

const mockConversations = [
  {
    id: "1",
    name: "Adebayo Ogundimu",
    initials: "AO",
    lastMessage: "The apartment is still available. When would you like to visit?",
    time: "2h ago",
    unread: 2,
    isAgent: true,
  },
  {
    id: "2",
    name: "Funke Adekunle",
    initials: "FA",
    lastMessage: "I've sent you the inspection schedule",
    time: "1d ago",
    unread: 0,
    isAgent: true,
  },
  {
    id: "3",
    name: "Ibrahim Musa",
    initials: "IM",
    lastMessage: "Yes, the 2 bedroom in Ikeja is ₦2.2M per year",
    time: "3d ago",
    unread: 0,
    isAgent: true,
  },
];

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Conversations */}
        {mockConversations.length > 0 ? (
          <div className="space-y-1">
            {mockConversations.map((convo, i) => (
              <motion.button
                key={convo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                  {convo.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate text-sm">
                      {convo.name}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {convo.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {convo.lastMessage}
                  </p>
                </div>
                {convo.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {convo.unread}
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No messages yet
            </h3>
            <p className="text-muted-foreground">
              When you contact agents about properties, your conversations will
              appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
