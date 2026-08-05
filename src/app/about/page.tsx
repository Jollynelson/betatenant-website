"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Heart,
  Zap,
  Target,
  Eye,
  Home,
  Star,
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Trust First",
    description:
      "We built our platform on the principle that every renter deserves safety and transparency in their housing search.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "No hidden fees, no surprise charges. Every listing shows the full cost so you can budget with confidence.",
  },
  {
    icon: Heart,
    title: "Community",
    description:
      "Our review system is powered by real tenants helping each other avoid scams and find great agents.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "From AI-powered search to WhatsApp integration, we use technology to make your rental journey effortless.",
  },
];

const stats = [
  { value: "1,800+", label: "Active Users" },
  { value: "200+", label: "Verified Agents" },
  { value: "2,000+", label: "Properties Listed" },
  { value: "37", label: "States Covered" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-bt-surface to-white pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
              Making renting in Nigeria{" "}
              <span className="text-bt-primary">safe and simple</span>
            </h1>
            <p className="mt-5 text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              Beta Tenant was born from a frustration every Nigerian renter
              knows: fake listings, fraudulent agents, and zero accountability.
              We&apos;re changing that.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Our Story
              </h2>
              <div className="space-y-4 text-neutral-500 leading-relaxed">
                <p>
                  In Nigeria, finding a rental apartment has always been a
                  nightmare. Fake listings flood social media, agents demand
                  inspection fees with no intention of showing real apartments,
                  and tenants have zero recourse when they get scammed.
                </p>
                <p>
                  Beta Tenant was created to bring order to the chaos. By
                  building a trust-based marketplace where agents are rated,
                  listings are verified, and payments are secure, we&apos;re making
                  it possible for anyone to find a home without fear.
                </p>
                <p>
                  Our WhatsApp-first approach meets Nigerians where they are,
                  while our web platform provides the full experience for those
                  who want it.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center"
                >
                  <p className="text-2xl font-bold text-bt-primary">{stat.value}</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              What We Stand For
            </h2>
            <p className="mt-2 text-neutral-500">
              Our core values guide everything we build
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white border border-neutral-200"
              >
                <value.icon className="w-8 h-8 text-bt-primary mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Target className="w-12 h-12 text-bt-primary mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
            Our Mission
          </h2>
          <p className="text-lg text-neutral-500 leading-relaxed">
            To make finding and renting a home in Nigeria a safe, transparent,
            and stress-free experience for every tenant, while empowering
            honest agents and landlords to thrive.
          </p>
        </div>
      </section>
    </div>
  );
}
