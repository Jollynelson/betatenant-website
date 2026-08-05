"use client";

import { useState, useEffect, useRef } from "react";
import { setAppBadge } from "@/components/sw-register";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, User, Heart, MessageCircle, LogOut,
  Home, Bell, Repeat2, Shield, Plus, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}

const TENANT_ITEMS: NavItem[] = [
  { href: "/account",       icon: User,          label: "My Profile" },
  { href: "/saved",         icon: Heart,         label: "Saved Properties" },
  { href: "/tenant-switch", icon: Repeat2,       label: "Tenant Switch" },
  { href: "/messages",      icon: MessageCircle, label: "Messages" },
  { href: "/agents",        icon: Shield,        label: "Report Agent" },
];

const AGENT_LANDLORD_ITEMS: NavItem[] = [
  { href: "/account",            icon: User,            label: "My Account" },
  { href: "/account/properties", icon: Home,            label: "My Listings" },
  { href: "/host/new",           icon: Plus,            label: "Add Listing", highlight: true },
  { href: "/host",               icon: LayoutDashboard, label: "Dashboard" },
  { href: "/messages",           icon: MessageCircle,   label: "Messages" },
];

// ── Notification hook ────────────────────────────────────────────────────────
type AuthUser = { fullName: string; email: string; userId: string; role: string } | null;

function useNotifications(user: AuthUser) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    if (!user) { setCount(0); setItems([]); return; }

    let cancelled = false;
    const role = user.role;

    async function fetch() {
      const notifications: { label: string; href: string }[] = [];

      // 1. Unread messages — all roles
      try {
        const chats = await api.get<any>("/v1/user/chats");
        const chatList: any[] = chats?.chats ?? chats ?? [];
        const unread = chatList.reduce((sum: number, c: any) => sum + (c.numberOfUnreadMessage ?? 0), 0);
        if (typeof window !== "undefined") {
          localStorage.setItem("BT_UNREAD_COUNT", String(unread));
        }
        if (unread > 0) notifications.push({ label: `${unread} unread message${unread > 1 ? "s" : ""}`, href: "/messages" });
      } catch { /* silent */ }

      // 2. Pending bookings — agents & landlords only
      if (role === "agent" || role === "landlord") {
        try {
          const res = await api.get<any>("/v1/landlordandagent/property-bookings/1/10");
          const bookings: any[] = res?.bookingResult?.docs ?? [];
          const pending = bookings.filter((b: any) => b.ticketPaymentStatus === "success" && !b.viewingConfirmed);
          if (pending.length > 0) notifications.push({ label: `${pending.length} pending viewing${pending.length > 1 ? "s" : ""}`, href: "/host" });
        } catch { /* silent */ }
      }

      if (!cancelled) {
        const total = notifications.reduce((n, item) => {
          const m = item.label.match(/^(\d+)/);
          return n + (m ? parseInt(m[1]) : 1);
        }, 0);
        setCount(notifications.length);
        setItems(notifications);
        // Update OS app badge (home screen icon badge)
        setAppBadge(total);
      }
    }

    // Delay first fetch by 3s so it doesn't compete with page load
    const initial = setTimeout(fetch, 3000);
    const interval = setInterval(fetch, 60_000);
    return () => { cancelled = true; clearTimeout(initial); clearInterval(interval); };
  }, [user]);

  return { count, items };
}

// ── Navbar ───────────────────────────────────────────────────────────────────
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { user, clearAuth } = useAuthStore();
  const role = user?.role ?? "user";
  const isAgentOrLandlord = role === "agent" || role === "landlord";
  const menuItems = isAgentOrLandlord ? AGENT_LANDLORD_ITEMS : TENANT_ITEMS;

  const { count: notifCount, items: notifItems } = useNotifications(user);

  const initials = user
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200",
      scrolled ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "shadow-none border-b border-transparent"
    )}>
      <nav className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-[72px] lg:h-[78px]">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={122} height={32} className="h-8 w-auto" priority />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            <NavLink href="/properties">Browse</NavLink>
            <NavLink href="/tenant-switch">Tenant Switch</NavLink>
            <NavLink href="https://gist.betatenant.com" external>Area Gist</NavLink>
            <NavLink href="/agents">Report Agent</NavLink>
          </div>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Single pill: bell (conditional) + avatar + name */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-200 hover:border-neutral-300 transition-colors"
                >
                  {/* Bell — only shown when there are notifications */}
                  {notifCount > 0 && (
                    <div className="relative shrink-0">
                      <Bell className="w-[15px] h-[15px] text-neutral-500" />
                      <span className="absolute -top-1 -right-1 w-[14px] h-[14px] rounded-full bg-bt-secondary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    </div>
                  )}

                  <div className="w-7 h-7 rounded-full bg-bt-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 max-w-[110px] truncate">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-neutral-400 transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-60 bg-white border border-neutral-100 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden py-1.5"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-neutral-50">
                        <p className="text-sm font-bold text-neutral-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{user.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-[10px] font-semibold capitalize">
                          {role}
                        </span>
                      </div>

                      {/* Notifications section — only when there are some */}
                      {notifItems.length > 0 && (
                        <div className="px-3 py-2 border-b border-neutral-50">
                          {notifItems.map((n, i) => (
                            <Link
                              key={i}
                              href={n.href}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-neutral-50 transition-colors"
                            >
                              <div className="w-5 h-5 rounded-full bg-bt-secondary/10 flex items-center justify-center shrink-0">
                                <Bell className="w-3 h-3 text-bt-secondary" />
                              </div>
                              <span className="text-xs text-neutral-700 font-medium">{n.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Role-based menu items */}
                      <div className="py-1">
                        {menuItems.map((item) => (
                          <DropdownItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            highlight={item.highlight}
                            onClick={() => setDropdownOpen(false)}
                          >
                            {item.label}
                          </DropdownItem>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-neutral-50 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="px-5 py-2 text-sm font-medium text-neutral-700 hover:text-bt-primary transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-50 transition-colors relative"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-neutral-700" /> : <Menu className="w-5 h-5 text-neutral-700" />}
            {/* Mobile bell dot */}
            {user && notifCount > 0 && !mobileMenuOpen && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bt-secondary border-2 border-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[72px] bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[72px] left-0 right-0 bottom-0 bg-white z-50 lg:hidden overflow-y-auto"
              style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}
            >
              <div className="px-5 py-5 space-y-1">
                <MobileNavLink href="/properties" onClick={() => setMobileMenuOpen(false)}>Browse Properties</MobileNavLink>
                <MobileNavLink href="/tenant-switch" onClick={() => setMobileMenuOpen(false)}>Tenant Switch</MobileNavLink>
                <MobileNavLink href="https://gist.betatenant.com" onClick={() => setMobileMenuOpen(false)}>Area Gist</MobileNavLink>
                <MobileNavLink href="/agents" onClick={() => setMobileMenuOpen(false)}>Report Agent</MobileNavLink>

                <div className="pt-4 border-t border-neutral-100 mt-4">
                  {user ? (
                    <>
                      {/* User info */}
                      <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-bt-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-[10px] font-semibold capitalize shrink-0">
                          {role}
                        </span>
                      </div>

                      {/* Mobile notifications */}
                      {notifItems.length > 0 && (
                        <div className="mx-1 mb-2 rounded-xl bg-bt-secondary/5 border border-bt-secondary/15 px-3 py-2 space-y-1">
                          {notifItems.map((n, i) => (
                            <Link
                              key={i}
                              href={n.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 py-1.5"
                            >
                              <Bell className="w-3.5 h-3.5 text-bt-secondary shrink-0" />
                              <span className="text-xs text-neutral-700 font-medium">{n.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {menuItems.map((item) => (
                        <MobileNavLink key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <span className="flex items-center gap-3">
                            <item.icon className={cn("w-4 h-4", item.highlight ? "text-bt-primary" : "text-neutral-400")} />
                            {item.label}
                          </span>
                        </MobileNavLink>
                      ))}

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Link href="/auth/login" className="flex-1 text-center px-5 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium text-sm" onClick={() => setMobileMenuOpen(false)}>
                        Sign in
                      </Link>
                      <Link href="/auth/signup" className="flex-1 text-center px-5 py-3 rounded-xl bg-bt-primary text-white font-semibold text-sm" onClick={() => setMobileMenuOpen(false)}>
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function DropdownItem({ href, icon: Icon, onClick, children, highlight }: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        highlight ? "text-bt-primary font-semibold hover:bg-bt-primary/5" : "text-neutral-700 hover:bg-neutral-50"
      )}
    >
      <Icon className={cn("w-4 h-4", highlight ? "text-bt-primary" : "text-neutral-400")} />
      {children}
    </Link>
  );
}

function NavLink({ href, children, external }: {
  href: string; children: React.ReactNode; external?: boolean;
}) {
  const cls = "px-4 py-2 text-[14px] font-medium text-neutral-600 hover:text-bt-primary rounded-lg transition-colors";
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}

function MobileNavLink({ href, children, onClick }: {
  href: string; children: React.ReactNode; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 rounded-xl transition-colors">
      {children}
    </Link>
  );
}
