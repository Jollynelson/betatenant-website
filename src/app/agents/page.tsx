"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Shield,
  Star,
  Phone,
  Verified,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockAgents = [
  {
    id: "1",
    name: "Adebayo Ogundimu",
    phone: "+2348012345678",
    avatar: "AO",
    rating: 4.8,
    positiveReports: 42,
    negativeReports: 3,
    totalDeals: 89,
    isVerified: true,
    listingCount: 12,
    speciality: "Lekki & VI",
  },
  {
    id: "2",
    name: "Funke Adekunle",
    phone: "+2348034567890",
    avatar: "FA",
    rating: 4.9,
    positiveReports: 67,
    negativeReports: 1,
    totalDeals: 134,
    isVerified: true,
    listingCount: 8,
    speciality: "Ikoyi & VI",
  },
  {
    id: "3",
    name: "Ibrahim Musa",
    phone: "+2348045678901",
    avatar: "IM",
    rating: 4.6,
    positiveReports: 28,
    negativeReports: 5,
    totalDeals: 56,
    isVerified: true,
    listingCount: 15,
    speciality: "Ikeja & Magodo",
  },
  {
    id: "4",
    name: "Ngozi Eze",
    phone: "+2348078901234",
    avatar: "NE",
    rating: 4.7,
    positiveReports: 51,
    negativeReports: 4,
    totalDeals: 102,
    isVerified: true,
    listingCount: 20,
    speciality: "Mainland Lagos",
  },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<(typeof mockAgents)[0] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const found = mockAgents.find(
      (a) =>
        a.phone.includes(searchQuery) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResult(found || null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-secondary to-background pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
            <Shield className="w-4 h-4" />
            Agent Trust System
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Check an Agent Before You Deal
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Search any agent by their phone number to see reviews and trust
            scores from real tenants.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter agent phone number or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-24 py-4 rounded-2xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Search Result */}
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-md mx-auto"
            >
              {searchResult ? (
                <AgentCard agent={searchResult} expanded />
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-border text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="font-semibold text-foreground">
                    No agent found
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This could mean the agent is not registered on our platform.
                    Proceed with caution.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Top Agents */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Top Rated Agents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockAgents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  expanded,
}: {
  agent: (typeof mockAgents)[0];
  expanded?: boolean;
}) {
  const trustScore = Math.round(
    (agent.positiveReports / (agent.positiveReports + agent.negativeReports)) *
      100
  );

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-white border border-border text-left",
        expanded && "shadow-lg"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground truncate">
              {agent.name}
            </p>
            {agent.isVerified && (
              <Verified className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{agent.speciality}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{agent.rating}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 py-3 border-t border-border">
        <div className="text-center">
          <p className="text-sm font-semibold text-emerald-600">
            {trustScore}%
          </p>
          <p className="text-xs text-muted-foreground">Trust Score</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">{agent.totalDeals}</p>
          <p className="text-xs text-muted-foreground">Deals</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">{agent.listingCount}</p>
          <p className="text-xs text-muted-foreground">Listings</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-sm text-emerald-600">
          <ThumbsUp className="w-4 h-4" />
          <span>{agent.positiveReports} positive</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-red-500">
          <ThumbsDown className="w-4 h-4" />
          <span>{agent.negativeReports} negative</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border flex gap-2">
          <button className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            View Listings
          </button>
          <button className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium">
            Report Agent
          </button>
        </div>
      )}
    </div>
  );
}
