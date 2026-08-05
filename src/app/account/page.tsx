"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User, Heart, MessageCircle, Home, Shield,
  LogOut, ChevronRight, Phone, Mail, Loader2, Bell,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

function AccountContent() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("/v1/user/profile")
      .then((r) => setProfile(r.profile ?? r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => {
    clearAuth();
    router.push("/");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const menuItems = [
    { icon: Home,          label: "My Properties",    href: "/account/properties", description: "Your listed properties" },
    { icon: Heart,         label: "Saved Properties", href: "/saved",        description: "Properties you favourited" },
    { icon: Bell,          label: "Listing Alerts",   href: "/alerts",       description: "Get notified of new listings" },
    { icon: MessageCircle, label: "Messages",         href: "/messages",     description: "Chat with agents" },
    { icon: Shield,        label: "Report Agent",     href: "/agents",       description: "Check or report an agent" },
  ];

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5"
        >
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-14 h-14 rounded-full bg-neutral-100 animate-pulse shrink-0" />
            ) : profile?.profilePic ? (
              <Image src={profile.profilePic} alt="" width={56} height={56} className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-neutral-100" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-bt-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 bg-neutral-100 rounded animate-pulse w-40" />
                  <div className="h-3.5 bg-neutral-100 rounded animate-pulse w-56" />
                </div>
              ) : (
                <>
                  <p className="font-bold text-neutral-900 capitalize">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {profile?.email && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />{profile.email}
                      </p>
                    )}
                    {profile?.phoneNumber && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />{String(profile.phoneNumber).replace("234", "0")}
                      </p>
                    )}
                  </div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-[11px] font-semibold capitalize">
                    {profile?.role ?? user?.role ?? "user"}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Menu */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden mb-4">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 group"
              >
                <div className="w-9 h-9 rounded-xl bg-bt-primary/6 flex items-center justify-center group-hover:bg-bt-primary/10 transition-colors shrink-0">
                  <item.icon className="w-4 h-4 text-bt-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors group"
          >
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
