"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Home, MessageCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 px-8 py-14 md:px-16 md:py-20 text-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          </div>

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to find your next home?
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
              Join thousands of happy tenants who found their perfect rental
              through Beta Tenant. Start your search today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-primary font-semibold hover:bg-white/90 transition-colors shadow-lg"
              >
                <Home className="w-5 h-5" />
                Browse Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/host"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                List Your Property
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
