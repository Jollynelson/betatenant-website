"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  UserPlus,
  Search,
  Key,
  MapPin,
  SlidersHorizontal,
  MessageCircle,
  Shield,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Sign Up & Set Preferences",
    description:
      "Create your profile in minutes. Tell us what you're looking for and we'll tailor your experience.",
    icon: UserPlus,
    color: "bg-bt-primary/8 text-bt-primary",
  },
  {
    number: "02",
    title: "Search & Discover",
    description:
      "Browse verified homes and chat directly with landlords or agents. No middlemen, no hidden fees.",
    icon: Search,
    color: "bg-bt-secondary/8 text-bt-secondary",
  },
  {
    number: "03",
    title: "Secure & Move In",
    description:
      "Sign your lease with confidence and start your new chapter. We've got your back every step.",
    icon: Key,
    color: "bg-bt-success/10 text-bt-success",
  },
];

const features = [
  {
    title: "Neighborhood Insights",
    description:
      "Discover nearby amenities, safety scores, and local vibes before you decide.",
    icon: MapPin,
  },
  {
    title: "Smart Search Filters",
    description:
      "Zero in on the perfect home by price, location, type, or specific amenities.",
    icon: SlidersHorizontal,
  },
  {
    title: "Direct Messaging",
    description:
      "Chat with landlords or agents in real-time, all in one safe, private space.",
    icon: MessageCircle,
  },
  {
    title: "Safe Rental Process",
    description:
      "Every step is clear, secure, and designed to protect you from start to finish.",
    icon: Shield,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-bt-surface to-white pt-12 pb-16 md:pt-20 md:pb-20">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold text-bt-primary uppercase tracking-widest mb-4">
              How It Works
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-[-0.02em] mb-4">
              Your home search, simplified
            </h1>
            <p className="text-lg text-neutral-500 leading-relaxed max-w-xl mx-auto">
              From your first search to moving day, Beta Tenant makes every step
              safe, transparent, and stress-free.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/properties"
                className="px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
              >
                Browse Properties
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-3 rounded-full border border-neutral-200 text-neutral-700 font-medium text-sm hover:bg-neutral-50 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 md:mb-12"
          >
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 tracking-[-0.02em]">
              Three steps to your next home
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Simple, fast, and designed around you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 md:p-8 rounded-2xl border border-neutral-100 bg-bt-surface hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-neutral-200 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[32px] font-bold text-neutral-100 group-hover:text-neutral-200 leading-none transition-colors">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights — visible on all screen sizes */}
      <section className="py-12 md:py-20 bg-bt-surface">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 tracking-[-0.02em]">
              Why You&apos;ll Never Go Back
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Features that make all the difference
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl bg-white border border-neutral-100 hover:border-bt-primary/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-bt-primary/8 flex items-center justify-center mb-4 group-hover:bg-bt-primary/12 transition-colors">
                  <feature.icon className="w-[18px] h-[18px] text-bt-primary" />
                </div>
                <h3 className="text-[15px] font-semibold text-neutral-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-xl mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Ready to find your home?
          </h2>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            Join thousands of Nigerians who found their perfect home safely through Beta Tenant.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
          >
            Start Searching
          </Link>
        </div>
      </section>
    </div>
  );
}
