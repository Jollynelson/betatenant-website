"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Home,
  TrendingUp,
  DollarSign,
  Eye,
  Calendar,
  BarChart3,
  Settings,
  MessageCircle,
} from "lucide-react";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { formatPriceFullNumber } from "@/lib/constants";

const dashboardStats = [
  { label: "Active Listings", value: "5", icon: Home, trend: "+2 this month" },
  { label: "Total Views", value: "1,234", icon: Eye, trend: "+18% vs last week" },
  { label: "Inquiries", value: "23", icon: MessageCircle, trend: "8 pending" },
  { label: "Earnings", value: "₦450k", icon: DollarSign, trend: "This month" },
];

export default function HostDashboard() {
  const myListings = MOCK_PROPERTIES.slice(0, 4);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Host Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your properties and earnings
            </p>
          </div>
          <Link
            href="/host/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl bg-white border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <QuickAction
            href="/host/new"
            icon={Plus}
            label="Add Listing"
          />
          <QuickAction
            href="/host/reservations"
            icon={Calendar}
            label="Reservations"
          />
          <QuickAction
            href="/host/earnings"
            icon={BarChart3}
            label="Analytics"
          />
          <QuickAction
            href="/host/settings"
            icon={Settings}
            label="Settings"
          />
        </div>

        {/* My Listings */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">My Listings</h2>
            <Link
              href="/host/listings"
              className="text-sm text-primary font-medium"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-border">
            {myListings.map((listing) => (
              <div
                key={listing._id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="w-16 h-12 rounded-lg bg-muted overflow-hidden relative shrink-0">
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">
                    {listing.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listing.lga}, {listing.state}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">
                    {formatPriceFullNumber(listing.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listing.views} views
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-white hover:border-primary/30 hover:bg-primary/5 transition-all"
    >
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}
