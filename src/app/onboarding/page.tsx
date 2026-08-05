"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Home, Search, ShieldCheck, MapPin, Star, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: 0,
    bg: "from-[#0A0876] to-[#3B3991]",
    accentBg: "bg-white/10",
    label: "Welcome to",
    title: "Beta Tenant",
    subtitle: "Nigeria's most trusted rental marketplace — find verified homes, connect with real agents.",
    visual: <WelcomeVisual />,
    cta: null,
  },
  {
    id: 1,
    bg: "from-[#08065E] to-[#0A0876]",
    accentBg: "bg-white/10",
    label: "Discover",
    title: "Find Your\nPerfect Home",
    subtitle: "Search thousands of verified rentals across every state in Nigeria.",
    visual: <SearchVisual />,
    cta: null,
  },
  {
    id: 2,
    bg: "from-[#0A0876] to-[#1a1a6e]",
    accentBg: "bg-white/10",
    label: "Trust & Safety",
    title: "Verified Agents,\nZero Scams",
    subtitle: "Every agent is rated by real tenants. Check any agent before you deal — stay protected.",
    visual: <TrustVisual />,
    cta: null,
  },
  {
    id: 3,
    bg: "from-[#08065E] to-[#3B3991]",
    accentBg: "bg-white/10",
    label: "Tenant Switch",
    title: "Swap Your\nApartment",
    subtitle: "Moving out? Connect with other tenants who want to swap. Only on Beta Tenant.",
    visual: <SwapVisual />,
    cta: null,
  },
  {
    id: 4,
    bg: "from-[#0A0876] to-[#08065E]",
    accentBg: "bg-white/10",
    label: "Get Started",
    title: "Ready to find\nyour home?",
    subtitle: "Sign up free or browse listings without an account.",
    visual: <GetStartedVisual />,
    cta: "getstarted",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if already onboarded
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("BT_ONBOARDED")) {
      router.replace("/");
    }
  }, [router]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
  };

  const skip = () => {
    finish();
  };

  const finish = (redirectTo = "/") => {
    if (typeof window !== "undefined") localStorage.setItem("BT_ONBOARDED", "1");
    router.replace(redirectTo);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -60 && current < SLIDES.length - 1) goTo(current + 1);
    if (info.offset.x > 60 && current > 0) goTo(current - 1);
  };

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 overflow-hidden select-none" ref={containerRef}>
      {/* Background gradient — animates between slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={cn("absolute inset-0 bg-gradient-to-br", slide.bg)}
        />
      </AnimatePresence>

      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-[280px] h-[280px] rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[220px] h-[220px] rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Skip button */}
      {!isLast && (
        <button
          onClick={skip}
          className="absolute top-[max(1.5rem,env(safe-area-inset-top))] right-5 z-20 px-4 py-2 rounded-full bg-white/15 text-white/80 text-sm font-medium backdrop-blur-sm active:bg-white/25 transition-colors"
        >
          Skip
        </button>
      )}

      {/* Slide content — draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className="absolute inset-0 flex flex-col"
      >
        {/* Visual area — top 55% */}
        <div className="flex-1 flex items-center justify-center px-8 pt-[max(5rem,env(safe-area-inset-top))]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`visual-${current}`}
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -12 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-[320px]"
            >
              {slide.visual}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text + nav area — bottom 45% */}
        <div className="shrink-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mb-8"
            >
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">
                {slide.label}
              </p>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-white leading-[1.15] tracking-[-0.02em] whitespace-pre-line mb-4">
                {slide.title}
              </h1>
              <p className="text-white/70 text-base leading-relaxed">
                {slide.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex items-center gap-2 mb-6">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === current ? "bg-white w-6" : "bg-white/30 w-1.5"
                )}
              />
            ))}
          </div>

          {/* CTA buttons */}
          {isLast ? (
            <div className="space-y-3">
              <button
                onClick={() => finish("/auth/signup")}
                className="w-full py-4 rounded-full bg-white text-bt-primary font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-transform"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => finish()}
                className="w-full py-4 rounded-full bg-white/15 text-white font-semibold text-base backdrop-blur-sm active:bg-white/25 transition-colors"
              >
                Browse Without Account
              </button>
              <button
                onClick={() => finish("/auth/login")}
                className="w-full py-2 text-white/70 text-sm font-medium"
              >
                Already have an account? <span className="text-white underline underline-offset-2">Sign in</span>
              </button>
            </div>
          ) : (
            <button
              onClick={next}
              className="w-full py-4 rounded-full bg-white/20 text-white font-semibold text-base flex items-center justify-center gap-2 backdrop-blur-sm active:bg-white/30 transition-colors border border-white/20"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── SLIDE VISUALS ─────────────────────────────────────────────────────────── */

function WelcomeVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: "spring", bounce: 0.4 }}
        className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
      >
        <Image src="/images/bt_logo.svg" alt="Beta Tenant" width={56} height={56} className="w-14 h-14" />
      </motion.div>

      {/* Floating stat cards */}
      <div className="relative w-full h-[180px] mt-2">
        {[
          { label: "Verified Listings", value: "2,000+", icon: "🏠", x: "5%",  y: "0%",   delay: 0.25 },
          { label: "Happy Tenants",     value: "1,800+", icon: "😊", x: "55%", y: "20%",  delay: 0.4  },
          { label: "Vetted Agents",     value: "200+",   icon: "✅", x: "10%", y: "60%",  delay: 0.55 },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: card.delay, duration: 0.4 }}
            style={{ position: "absolute", left: card.x, top: card.y }}
            className="bg-white/15 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20"
          >
            <p className="text-lg">{card.icon}</p>
            <p className="text-white font-bold text-lg leading-none">{card.value}</p>
            <p className="text-white/60 text-xs mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="space-y-3">
      {/* Mock search bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/15 backdrop-blur-md rounded-full px-5 py-3.5 flex items-center gap-3 border border-white/20"
      >
        <Search className="w-5 h-5 text-white/60 shrink-0" />
        <span className="text-white/80 text-sm">Lekki, Lagos...</span>
        <div className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      {/* Mock property cards */}
      {[
        { title: "3 Bed in Lekki Phase 1", price: "₦4.5M/yr", tag: "Verified", tagColor: "bg-emerald-500", delay: 0.25 },
        { title: "Self Contained in Yaba",  price: "₦800k/yr", tag: "Featured", tagColor: "bg-bt-secondary", delay: 0.38 },
        { title: "2 Bed in Wuse, Abuja",    price: "₦2.2M/yr", tag: "Verified", tagColor: "bg-emerald-500", delay: 0.5  },
      ].map((c) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: c.delay, duration: 0.35 }}
          className="bg-white/12 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/15"
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{c.title}</p>
            <p className="text-white/60 text-xs mt-0.5">{c.price}</p>
          </div>
          <span className={cn("px-2 py-0.5 rounded-full text-white text-[10px] font-bold shrink-0", c.tagColor)}>
            {c.tag}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function TrustVisual() {
  return (
    <div className="space-y-4">
      {/* Agent trust card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            AO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white font-semibold">Adebayo O.</p>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-white/60 text-xs">Verified Agent · Lagos</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-white font-bold">4.8</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[["89", "Deals"], ["42", "Reviews"], ["98%", "Trust"]].map(([v, l]) => (
            <div key={l} className="bg-white/10 rounded-xl py-2.5">
              <p className="text-white font-bold">{v}</p>
              <p className="text-white/50 text-[11px]">{l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Positive review chip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30 flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">&ldquo;Professional, transparent, zero hidden fees.&rdquo;</p>
          <p className="text-white/50 text-xs mt-1">— Adaobi C., Lagos</p>
        </div>
      </motion.div>

      {/* Report chip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 flex items-center gap-2.5 border border-white/15"
      >
        <Search className="w-4 h-4 text-white/60" />
        <p className="text-white/70 text-sm">Search any agent by phone number</p>
        <ArrowRight className="w-4 h-4 text-white/40 ml-auto" />
      </motion.div>
    </div>
  );
}

function SwapVisual() {
  return (
    <div className="space-y-3">
      {/* Header label */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 w-fit border border-white/20"
      >
        <Repeat2 className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-semibold">Tenant Switch</span>
      </motion.div>

      {/* Two cards with swap arrow */}
      <div className="relative">
        {[
          { initials: "TN", loc: "Lekki Phase 1",  room: "3 Bedroom", delay: 0.25 },
          { initials: "AO", loc: "Wuse 2, Abuja",  room: "2 Bedroom", delay: 0.42 },
        ].map((c, i) => (
          <motion.div
            key={c.initials}
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: c.delay }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                {c.initials}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{c.room} Flat</p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {c.loc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Swap arrow in the middle */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, type: "spring", bounce: 0.5 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-[-calc(50%+24px)] w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg z-10"
        >
          <Repeat2 className="w-5 h-5 text-bt-primary" />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="text-white/50 text-xs text-center"
      >
        Connect with tenants ready to swap apartments
      </motion.p>
    </div>
  );
}

function GetStartedVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Pulsing logo */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-3xl bg-white/20"
        />
        <motion.div
          animate={{ scale: [1, 1.22, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="absolute inset-0 rounded-3xl bg-white/10"
        />
        <div className="relative w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <Image src="/images/bt_logo.svg" alt="Beta Tenant" width={64} height={64} className="w-16 h-16" />
        </div>
      </div>

      {/* Feature chips row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { emoji: "🔍", label: "Smart Search" },
          { emoji: "✅", label: "Verified Agents" },
          { emoji: "💬", label: "Direct Messaging" },
          { emoji: "🔄", label: "Tenant Switch" },
          { emoji: "📍", label: "Area Insights" },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm"
          >
            <span className="text-sm">{f.emoji}</span>
            <span className="text-white text-xs font-medium">{f.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Nigeria note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-white/40 text-xs text-center"
      >
        🇳🇬 Built for Nigeria
      </motion.p>
    </div>
  );
}
