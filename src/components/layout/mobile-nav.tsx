"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, Heart, MessageCircle, User,
  Building2, Plus, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api, propertyApi } from "@/lib/api";
import { queryClient } from "@/components/providers";
import toast from "react-hot-toast";

// Prefetch data for a tab when the user touches it (before navigation fires)
function prefetchForRoute(href: string, token: string | null) {
  switch (href) {
    case "/properties":
    case "/search":
      queryClient.prefetchQuery({
        queryKey: ["home-listings"],
        queryFn: () => propertyApi.list(1, 8),
        staleTime: 1000 * 60 * 5,
      });
      break;
    case "/saved":
      if (token) {
        queryClient.prefetchQuery({
          queryKey: ["saved-ids"],
          queryFn: () => {
            const ids = JSON.parse(localStorage.getItem("BT_SAVED") ?? "[]");
            return Promise.resolve(ids);
          },
          staleTime: 0,
        });
      }
      break;
    case "/messages":
      if (token) {
        queryClient.prefetchQuery({
          queryKey: ["chats"],
          queryFn: () => api.get<any>("/v1/user/chats"),
          staleTime: 1000 * 60,
        });
      }
      break;
    case "/account":
      if (token) {
        queryClient.prefetchQuery({
          queryKey: ["account-profile"],
          queryFn: () => api.get<any>("/v1/user/profile"),
          staleTime: 1000 * 60 * 5,
        });
      }
      break;
    case "/account/properties":
      if (token) {
        queryClient.prefetchQuery({
          queryKey: ["my-listings"],
          queryFn: () => api.post<any>("/v1/landlordandagent/properties/1/50", {}),
          staleTime: 1000 * 60 * 2,
        });
      }
      break;
  }
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  const role = user?.role ?? "user";
  const isAgentOrLandlord = role === "agent" || role === "landlord";

  useEffect(() => {
    const updateUnread = () => setUnread(Number(localStorage.getItem("BT_UNREAD_COUNT") || 0));
    const updateNotif = () => setNotifCount(Number(localStorage.getItem("BT_NOTIF_COUNT") || 0));
    updateUnread(); updateNotif();
    window.addEventListener("storage", updateUnread);
    window.addEventListener("storage", updateNotif);
    const interval = setInterval(() => { updateUnread(); updateNotif(); }, 30_000);
    return () => {
      window.removeEventListener("storage", updateUnread);
      window.removeEventListener("storage", updateNotif);
      clearInterval(interval);
    };
  }, []);

  const handleProtectedNav = useCallback((href: string) => {
    if (!token) {
      toast.error("Please sign in to access this");
      router.push("/auth/login");
      return;
    }
    router.push(href);
  }, [token, router]);

  type NavItem = {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    protected?: boolean;
  };

  // Build browse URL with last search restored
  const browseHref = (() => {
    if (typeof window === "undefined") return "/properties";
    try {
      const lastSearch = localStorage.getItem("BT_LAST_SEARCH") ?? sessionStorage.getItem("BT_LAST_SEARCH");
      if (lastSearch) return `/properties${lastSearch}`;
    } catch {}
    return "/properties";
  })();

  const tenantItems: NavItem[] = [
    { href: browseHref,          icon: Search,        label: "Browse" },
    { href: "/saved",            icon: Heart,         label: "Saved",         protected: true },
    { href: "/notifications",    icon: Bell,          label: "Notifications", protected: true },
    { href: "/messages",         icon: MessageCircle, label: "Messages",      protected: true },
    { href: "/account",          icon: User,          label: "Profile",       protected: true },
  ];

  const agentItems: NavItem[] = [
    { href: "/account/properties", icon: Building2,     label: "Listings",      protected: true },
    { href: "/host/new",           icon: Plus,          label: "Add",           protected: true },
    { href: "/notifications",      icon: Bell,          label: "Notifications", protected: true },
    { href: "/messages",           icon: MessageCircle, label: "Messages",      protected: true },
    { href: "/account",            icon: User,          label: "Profile",       protected: true },
  ];

  const navItems = isAgentOrLandlord ? agentItems : tenantItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-neutral-100">
      <div
        className="flex items-center justify-around px-1"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))", paddingTop: "0.5rem" }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const isAdd      = item.href === "/host/new";
          const isMessages = item.href === "/messages";
          const isBell     = item.href === "/notifications";

          const itemCls = cn(
            "relative flex flex-col items-center gap-[3px] min-w-[64px] min-h-[44px] justify-center transition-all duration-150",
            isAdd ? "text-white" : isActive ? "text-bt-primary" : "text-neutral-400"
          );

          const inner = isAdd ? (
            <div className="flex flex-col items-center gap-[3px]">
              <div className="w-10 h-10 rounded-full bg-bt-primary flex items-center justify-center shadow-[0_4px_12px_rgba(10,8,118,0.25)]">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-bt-primary">Add</span>
            </div>
          ) : (
            <>
              <div className="relative">
                <item.icon className={cn("w-[22px] h-[22px] transition-all", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                {isMessages && unread > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-[7px] h-[7px] rounded-full bg-bt-secondary border-[1.5px] border-white" />
                )}
                {isBell && notifCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-bt-secondary text-white text-[8px] font-bold flex items-center justify-center border-[1.5px] border-white leading-none">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-bt-primary" />
                )}
              </div>
              <span className={cn("text-[10px] font-medium leading-none mt-0.5", isActive && "font-semibold")}>
                {item.label}
              </span>
            </>
          );

          const onTouchStart = () => prefetchForRoute(item.href, token);

          if (item.protected) {
            return (
              <button
                key={item.href}
                onTouchStart={onTouchStart}
                onClick={() => handleProtectedNav(item.href)}
                className={itemCls}
                aria-label={item.label}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onTouchStart={onTouchStart}
              className={itemCls}
              aria-label={item.label}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
