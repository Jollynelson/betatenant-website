"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, Heart, MessageCircle, User,
  Building2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import toast from "react-hot-toast";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [unread, setUnread] = useState(0);

  const role = user?.role ?? "user";
  const isAgentOrLandlord = role === "agent" || role === "landlord";

  useEffect(() => {
    const update = () => setUnread(Number(localStorage.getItem("BT_UNREAD_COUNT") || 0));
    update();
    window.addEventListener("storage", update);
    const interval = setInterval(update, 30_000);
    return () => { window.removeEventListener("storage", update); clearInterval(interval); };
  }, []);

  const handleProtectedNav = (href: string) => {
    if (!token) {
      toast.error("Please sign in to access this");
      router.push("/auth/login");
      return;
    }
    router.push(href);
  };

  type NavItem = {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    protected?: boolean;
  };

  // Tenants: Search, Saved, Messages, Profile
  const tenantItems: NavItem[] = [
    { href: "/search",     icon: Search,        label: "Search" },
    { href: "/saved",      icon: Heart,         label: "Saved",    protected: true },
    { href: "/messages",   icon: MessageCircle, label: "Messages", protected: true },
    { href: "/account",    icon: User,          label: "Profile",  protected: true },
  ];

  // Agents / Landlords: Listings, Add, Messages, Profile
  const agentItems: NavItem[] = [
    { href: "/account/properties", icon: Building2,     label: "Listings",  protected: true },
    { href: "/host/new",           icon: Plus,          label: "Add",       protected: true },
    { href: "/messages",           icon: MessageCircle, label: "Messages",  protected: true },
    { href: "/account",            icon: User,          label: "Profile",   protected: true },
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
          const isAdd = item.href === "/host/new";
          const isMessages = item.href === "/messages";

          const itemCls = cn(
            "relative flex flex-col items-center gap-[3px] min-w-[64px] min-h-[44px] justify-center transition-all duration-150",
            isAdd
              ? "text-white"
              : isActive
              ? "text-bt-primary"
              : "text-neutral-400"
          );

          const inner = isAdd ? (
            // "Add" gets special pill treatment for agents
            <div className="flex flex-col items-center gap-[3px]">
              <div className="w-10 h-10 rounded-full bg-bt-primary flex items-center justify-center shadow-[0_4px_12px_rgba(10,8,118,0.25)]">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-bt-primary">Add</span>
            </div>
          ) : (
            <>
              <div className="relative">
                <item.icon
                  className={cn(
                    "w-[22px] h-[22px] transition-all",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"
                  )}
                />
                {isMessages && unread > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-[7px] h-[7px] rounded-full bg-bt-secondary border-[1.5px] border-white" />
                )}
                {/* Active dot under icon */}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-bt-primary" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none mt-0.5",
                  isActive ? "font-semibold" : ""
                )}
              >
                {item.label}
              </span>
            </>
          );

          if (item.protected) {
            return (
              <button
                key={item.href}
                onClick={() => handleProtectedNav(item.href)}
                className={itemCls}
                aria-label={item.label}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={itemCls} aria-label={item.label}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
