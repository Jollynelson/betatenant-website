"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
import { AuthGuard } from "@/components/auth-guard";
import { api, mapProperty } from "@/lib/api";
import { formatPriceFullNumber } from "@/lib/constants";

function HostDashboardContent() {
  // Fetch the host's properties — POST with page/limit in path
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["host-listings"],
    queryFn: () => api.post<any>("/v1/landlordandagent/properties/1/50", {}),
    staleTime: 1000 * 60 * 2,
  });

  const rawListings: any[] = listingsData?.properties ?? [];
  const myListings = rawListings.map(mapProperty).slice(0, 4);

  const totalListings = listingsData?.totalResults ?? rawListings.length ?? 0;
  const statsLoading = listingsLoading;
  const totalViews = rawListings.reduce((sum: number, p: any) => sum + (p.totalViews ?? 0), 0);

  const dashboardStats = [
    { label: "Active Listings", value: statsLoading ? null : String(totalListings), icon: Home, trend: "Total listings" },
    { label: "Total Views", value: statsLoading ? null : totalViews.toLocaleString(), icon: Eye, trend: "Across all listings" },
    { label: "Inquiries", value: "—", icon: MessageCircle, trend: "Coming soon" },
    { label: "Earnings", value: "—", icon: DollarSign, trend: "Coming soon" },
  ];

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Host Dashboard
            </h1>
            <p className="text-neutral-500">
              Manage your properties and earnings
            </p>
          </div>
          <Link
            href="/host/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-bt-primary text-white font-medium hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
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
              className="p-5 rounded-2xl bg-white border border-neutral-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-bt-primary/8 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-bt-primary" />
                </div>
                <span className="text-xs text-neutral-500">
                  {stat.trend}
                </span>
              </div>
              {stat.value === null ? (
                <div className="h-8 bg-neutral-100 animate-pulse rounded-lg w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              )}
              <p className="text-sm text-neutral-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <QuickAction href="/host/new" icon={Plus} label="Add Listing" />
          <QuickAction href="/messages" icon={MessageCircle} label="Messages" />
          <QuickAction href="/account/properties" icon={BarChart3} label="All Listings" />
          <QuickAction href="/account" icon={Settings} label="Settings" />
        </div>

        {/* My Listings */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">My Listings</h2>
            <Link href="/host/listings" className="text-sm text-bt-primary font-medium">
              View all
            </Link>
          </div>

          {listingsLoading ? (
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-16 h-12 rounded-lg bg-neutral-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : myListings.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {myListings.map((listing) => (
                <div
                  key={listing._id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-bt-surface transition-colors"
                >
                  <div className="w-16 h-12 rounded-lg bg-neutral-100 overflow-hidden relative shrink-0">
                    <Image
                      src={listing.photos[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate text-sm">
                      {listing.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {listing.lga}, {listing.state}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatPriceFullNumber(listing.price)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {listing.views} views
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Home className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm mb-4">No listings yet</p>
              <Link
                href="/host/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Your First Listing
              </Link>
            </div>
          )}
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
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 bg-white hover:border-bt-primary/30 hover:bg-bt-primary/5 transition-all"
    >
      <Icon className="w-5 h-5 text-bt-primary" />
      <span className="text-xs font-medium text-neutral-900">{label}</span>
    </Link>
  );
}

export default function HostDashboard() {
  return (
    <AuthGuard>
      <HostDashboardContent />
    </AuthGuard>
  );
}
