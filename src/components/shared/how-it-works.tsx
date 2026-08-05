"use client";

import { motion } from "framer-motion";
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
    description: "Create your profile in minutes. Tell us what you're looking for and we'll tailor your experience.",
    icon: UserPlus,
    color: "bg-bt-primary/8 text-bt-primary",
  },
  {
    number: "02",
    title: "Search & Connect",
    description: "Browse verified homes and chat directly with landlords or agents. No middlemen.",
    icon: Search,
    color: "bg-bt-secondary/8 text-bt-secondary",
  },
  {
    number: "03",
    title: "Secure & Move In",
    description: "Sign your lease with confidence and start your new chapter. We've got your back.",
    icon: Key,
    color: "bg-bt-success/10 text-bt-success",
  },
];

const features = [
  {
    title: "Neighborhood Insights",
    description: "Discover nearby amenities, safety scores, and local vibes before you decide.",
    icon: MapPin,
  },
  {
    title: "Smart Search Filters",
    description: "Zero in on the perfect home by price, location, type, or specific amenities.",
    icon: SlidersHorizontal,
  },
  {
    title: "Direct Messaging",
    description: "Chat with landlords or agents in real-time, all in one safe, private space.",
    icon: MessageCircle,
  },
  {
    title: "Safe Rental Process",
    description: "Every step is clear, secure, and designed to protect you from start to finish.",
    icon: Shield,
  },
];

export function HowItWorks() {
  return (
    <>
      {/* Part 1: How Beta Tenant Works */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 md:mb-12"
          >
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 tracking-[-0.02em]">
              How Beta Tenant Works
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Three simple steps to your next home
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

      {/* Part 2: Why You'll Never Go Back */}
      <section className="py-12 md:py-20 bg-bt-surface hidden md:block">
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
                className="group p-6 rounded-2xl bg-white border border-neutral-100 hover:border-bt-primary-faint hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-bt-primary/6 flex items-center justify-center mb-4 group-hover:bg-bt-primary/10 transition-colors">
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
    </>
  );
}
