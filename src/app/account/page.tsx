"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Heart, MessageCircle, Home, LayoutDashboard, Shield,
  LogOut, ChevronRight, Phone, Mail, Bell, Repeat2, Plus,
  MapPin, ShieldCheck, Crown, Edit3,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { PushToggle } from "@/components/push-subscribe";

function AccountContent() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const role = user?.role ?? "user";
  const isAgentOrLandlord = role === "agent" || role === "landlord";

  const fetchProfile = () => {
    setLoading(true);
    const endpoint = isAgentOrLandlord ? "/v1/landlordandagent/profile" : "/v1/user/profile";
    api.get<any>(endpoint)
      .then((r) => { setProfile(r.profile ?? r.user ?? r); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProfile(); }, [isAgentOrLandlord]);

  const handleSignOut = () => { clearAuth(); router.push("/"); };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isPremium = profile?.userSubscriptionObject?.status === "active";
  const isVerified = profile?.userVerificationObject?.status === "verified";

  // Role-specific navigation sections
  const tenantNav = [
    { icon: Heart,         label: "Saved Properties", href: "/saved",         desc: "Properties you saved" },
    { icon: Bell,          label: "Listing Alerts",   href: "/alerts",        desc: "Get notified of new listings" },
    { icon: MessageCircle, label: "Messages",         href: "/messages",      desc: "Chat with agents" },
    { icon: Repeat2,       label: "Tenant Switch",    href: "/tenant-switch", desc: "Swap apartments" },
    { icon: Shield,        label: "Report Agent",     href: "/agents",        desc: "Check or report an agent" },
  ];

  const agentNav = [
    { icon: LayoutDashboard, label: "Dashboard",   href: "/host",               desc: "Stats, bookings & listings" },
    { icon: Home,            label: "My Listings", href: "/account/properties", desc: "Manage your listings" },
    { icon: Plus,            label: "Add Listing", href: "/host/new",           desc: "List a new property" },
    { icon: MessageCircle,   label: "Messages",    href: "/messages",           desc: "Chat with tenants" },
  ];

  const navItems = isAgentOrLandlord ? agentNav : tenantNav;

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-neutral-500 text-sm">Could not load profile</p>
          <button onClick={() => { setError(false); fetchProfile(); }}
            className="px-6 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── Profile Card ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-20 bg-gradient-to-r from-bt-primary to-bt-primary-light relative">
            {isPremium && (
              <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900 text-[11px] font-bold">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="relative">
                {loading ? (
                  <div className="w-16 h-16 rounded-full bg-neutral-200 animate-pulse border-4 border-white" />
                ) : profile?.profilePic ? (
                  <Image src={profile.profilePic} alt="Profile" width={64} height={64}
                    className={`w-16 h-16 rounded-full object-cover border-4 border-white shadow-md ${isPremium ? "ring-2 ring-amber-400" : ""}`} />
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-bt-primary flex items-center justify-center text-white font-bold text-xl border-4 border-white shadow-md ${isPremium ? "ring-2 ring-amber-400" : ""}`}>
                    {initials}
                  </div>
                )}
                {isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-bt-success border-2 border-white flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <Link
                href="/account/edit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </Link>
            </div>

            {/* Info */}
            {loading ? (
              <div className="space-y-2">
                <div className="h-5 w-40 bg-neutral-100 animate-pulse rounded" />
                <div className="h-3.5 w-56 bg-neutral-100 animate-pulse rounded" />
                <div className="h-3.5 w-48 bg-neutral-100 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-neutral-900 capitalize">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  {isVerified && (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-bt-success">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  {profile?.email && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-neutral-400 shrink-0" />{profile.email}
                    </p>
                  )}
                  {profile?.phoneNumber && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                      {String(profile.phoneNumber).replace(/^234/, "0")}
                    </p>
                  )}
                  {profile?.agentBasedLocation && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />{profile.agentBasedLocation}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-[11px] font-semibold capitalize">
                    {role}
                  </span>
                  {profile?.yearsOfRentalExperience && (
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[11px]">
                      {profile.yearsOfRentalExperience}+ yrs experience
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-50 overflow-hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0 group-hover:bg-bt-primary/12 transition-colors">
                <item.icon className="w-4 h-4 text-bt-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

        {/* ── Push Notifications ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Notifications</p>
          <PushToggle />
        </div>

        {/* ── Danger Zone ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-red-50 active:bg-red-100 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-semibold text-red-500">Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AccountPage() {
  return <AuthGuard><AccountContent /></AuthGuard>;
}
