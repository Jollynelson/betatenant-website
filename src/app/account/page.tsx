"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Settings,
  Heart,
  MessageCircle,
  Home,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Star,
  HelpCircle,
} from "lucide-react";

const menuItems = [
  { icon: User, label: "Personal Info", href: "/account/profile", description: "Name, email, phone" },
  { icon: Home, label: "My Properties", href: "/account/properties", description: "Listed properties" },
  { icon: Heart, label: "Saved", href: "/saved", description: "Favorited listings" },
  { icon: MessageCircle, label: "Messages", href: "/messages", description: "Chat with agents" },
  { icon: Bell, label: "Notifications", href: "/account/notifications", description: "Alert preferences" },
  { icon: Shield, label: "Verification", href: "/account/verification", description: "ID verification" },
  { icon: Star, label: "Reviews", href: "/account/reviews", description: "Your reviews" },
  { icon: HelpCircle, label: "Help & Support", href: "/help", description: "FAQs and contact" },
  { icon: Settings, label: "Settings", href: "/account/settings", description: "Account settings" },
];

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Account</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and preferences
            </p>
          </div>
        </motion.div>

        {/* Sign in prompt (shown when not logged in) */}
        <div className="mb-6 p-5 rounded-2xl bg-primary/5 border border-primary/20">
          <p className="font-medium text-foreground mb-2">
            Sign in to access your account
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            View saved properties, messages, and manage your listings.
          </p>
          <div className="flex gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}

          {/* Logout */}
          <button className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-red-50 transition-colors group w-full">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="font-medium text-red-600 text-sm">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
