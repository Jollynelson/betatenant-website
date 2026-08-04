"use client";

import { motion } from "framer-motion";
import { Shield, Eye, Star, BadgeCheck, AlertTriangle, Lock } from "lucide-react";

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Agents",
    description: "Every agent on our platform is verified. Check their ratings before you deal.",
  },
  {
    icon: Eye,
    title: "Transparent Pricing",
    description: "No hidden fees or charges. What you see is what you pay.",
  },
  {
    icon: AlertTriangle,
    title: "Report Bad Actors",
    description: "Report fake listings and fraudulent agents. We act on every report.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "All payments are processed securely through Paystack with full protection.",
  },
  {
    icon: Star,
    title: "Real Reviews",
    description: "Read authentic reviews from real tenants who've dealt with agents.",
  },
  {
    icon: Shield,
    title: "Identity Verified",
    description: "Agents verify their identity with NIN for an extra layer of trust.",
  },
];

export function TrustSection() {
  return (
    <section className="py-14 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                Trust & Safety
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Rent with confidence.
                <br />
                We&apos;ve got your back.
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                The Nigerian rental market can be risky. Beta Tenant was built to
                change that. Our trust system, verified agents, and transparent
                reviews protect you from scams.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-white border border-border/50 hover:shadow-md transition-shadow"
              >
                <feature.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
