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
    title: "Sign Up & Set Your Preferences",
    description: "Create your profile in minutes. Tell us what you're looking for and we'll tailor your experience.",
    icon: UserPlus,
    gradient: "from-[#0A0876]/10 to-[#3B3991]/5",
  },
  {
    number: "02",
    title: "Search, Discover & Connect",
    description: "Browse verified homes and chat directly with landlords or agents. No middlemen.",
    icon: Search,
    gradient: "from-[#FB6514]/10 to-[#FD853A]/5",
  },
  {
    number: "03",
    title: "Secure & Move In",
    description: "Sign your lease with confidence and start your new chapter. We've got your back.",
    icon: Key,
    gradient: "from-[#12B76A]/10 to-[#12B76A]/5",
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
    title: "Direct & Secure Messaging",
    description: "Chat with landlords or agents in real-time, all in one safe, private space.",
    icon: MessageCircle,
  },
  {
    title: "Safe, Transparent Rental Process",
    description: "Every step is clear, secure, and designed to protect you from start to finish.",
    icon: Shield,
  },
];

export function HowItWorks() {
  return (
    <div className="hidden md:block">
      {/* Part 1: How Beta Tenant Works */}
      <section className="bg-[#F9FAFB] py-16 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl lg:text-[32px] font-bold text-neutral-900 tracking-[-0.02em]">
              How Beta Tenant Works
            </h2>
            <p className="text-neutral-500 mt-2 text-base">
              Three simple steps to your next home
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`relative bg-white rounded-3xl p-8 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${step.gradient}`} />
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-bt-primary/[0.07] flex items-center justify-center group-hover:bg-bt-primary/[0.12] transition-colors">
                    <step.icon className="w-5 h-5 text-bt-primary" />
                  </div>
                  <span className="text-[40px] font-bold text-neutral-100 leading-none">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
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
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl lg:text-[32px] font-bold text-neutral-900 tracking-[-0.02em]">
              Why You&apos;ll Never Go Back After Beta Tenant
            </h2>
            <p className="text-neutral-500 mt-2 text-base">
              Features that make all the difference
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-7 rounded-2xl border border-neutral-100 hover:border-[#CECEE4] bg-white hover:bg-[#F9FAFB] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#CECEE4]/30 flex items-center justify-center mb-4 group-hover:bg-bt-primary/10 transition-colors">
                  <feature.icon className="w-5 h-5 text-bt-primary" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
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
    </div>
  );
}
