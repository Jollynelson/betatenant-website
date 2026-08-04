"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-[#08065E] px-8 py-16 md:px-16 md:py-20 text-center min-h-[300px] flex items-center justify-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="relative max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Are you a landlord?
            </h2>
            <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed">
              Join other landlords in our BetaTenant community and discover ways
              to increase your property&apos;s value and get listed.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-neutral-200 text-bt-primary font-semibold hover:bg-white transition-colors"
            >
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
