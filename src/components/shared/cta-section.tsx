"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-[#08065E] px-8 py-16 md:px-20 md:py-24 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#3B3991]/30 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#FB6514]/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
          </div>

          <div className="relative max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-white leading-tight tracking-[-0.02em]">
              Are you a landlord?
            </h2>
            <p className="text-base sm:text-lg text-white/60 mt-4 mb-8 leading-relaxed max-w-md mx-auto">
              Join other landlords in our Beta Tenant community and discover ways
              to increase your property&apos;s value and get listed.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#08065E] font-semibold hover:bg-neutral-100 transition-colors shadow-[0_4px_20px_rgba(255,255,255,0.15)] group"
            >
              Sign up
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
