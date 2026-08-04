"use client";

import { motion } from "framer-motion";
import { Search, ShieldCheck, Key, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse thousands of verified properties across Nigeria. Filter by location, budget, and amenities to find your match.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "Verify the Agent",
    description:
      "Check agent ratings and reviews from real tenants. Our trust system keeps scammers out and honest agents in.",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: MessageCircle,
    title: "Connect & Inspect",
    description:
      "Contact verified agents directly. Schedule property inspections at your convenience with zero pressure.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Key,
    title: "Move In",
    description:
      "Complete your transaction securely through our platform. Pay with confidence knowing you're protected.",
    color: "from-amber-500 to-amber-600",
  },
];

export function HowItWorks() {
  return (
    <section className="py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            How Beta Tenant Works
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            From search to move-in, we make renting simple, safe, and transparent
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative text-center"
            >
              {/* Connector line - hidden on mobile, first col */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
              )}

              <div className={`relative inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} items-center justify-center shadow-lg mb-5`}>
                <step.icon className="w-9 h-9 text-white" />
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-foreground">
                  {i + 1}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
