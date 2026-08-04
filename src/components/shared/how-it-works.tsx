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
    number: "1",
    title: "Sign Up & Set Your Preferences",
    description: "Create your profile in minutes.",
    icon: UserPlus,
  },
  {
    number: "2",
    title: "Search, Discover & Connect",
    description: "Browse verified homes and chat with landlords or agents.",
    icon: Search,
  },
  {
    number: "3",
    title: "Secure & Move In",
    description: "Sign your lease and start your new chapter.",
    icon: Key,
  },
];

const features = [
  {
    title: "Neighborhood Insights",
    description: "Discover nearby amenities and more before you decide.",
    icon: MapPin,
  },
  {
    title: "Smart Search Filters",
    description: "Zero in on the perfect home by price, location, or amenities.",
    icon: SlidersHorizontal,
  },
  {
    title: "Direct & Secure Messaging",
    description: "Chat with landlords or agents, all in one safe space.",
    icon: MessageCircle,
  },
  {
    title: "Safe, Transparent Rental Process",
    description: "Every step is clear, secure, and stress-free.",
    icon: Shield,
  },
];

export function HowItWorks() {
  return (
    <div className="hidden md:block">
      {/* Part 1: How Beta Tenant Works */}
      <section className="bg-[#F9FAFB] py-16 lg:py-20">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-10"
          >
            How Beta Tenant Works
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-bt-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-bt-primary" />
                  </div>
                  <span className="text-3xl font-bold text-bt-primary/20">
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
      <section className="py-16 lg:py-20">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-10"
          >
            Why You&apos;ll Never Go Back After Beta Tenant
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-neutral-200 hover:border-bt-primary/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-bt-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-bt-primary" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1.5">
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
