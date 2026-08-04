"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Home, Hotel, Castle, Warehouse, Building } from "lucide-react";

const categories = [
  { icon: Home, label: "Self Contained", slug: "Self Contained", color: "bg-blue-50 text-blue-600" },
  { icon: Building2, label: "Mini Flat", slug: "Mini Flat", color: "bg-purple-50 text-purple-600" },
  { icon: Hotel, label: "1 Bedroom", slug: "1 Bedroom", color: "bg-amber-50 text-amber-600" },
  { icon: Building, label: "2 Bedroom", slug: "2 Bedroom", color: "bg-emerald-50 text-emerald-600" },
  { icon: Castle, label: "3 Bedroom", slug: "3 Bedroom", color: "bg-rose-50 text-rose-600" },
  { icon: Warehouse, label: "Duplex", slug: "Duplex", color: "bg-cyan-50 text-cyan-600" },
];

export function CategorySection() {
  return (
    <section className="py-14 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Browse by Property Type
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find the perfect space that fits your lifestyle
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, i) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={`/properties?apartmentType=${encodeURIComponent(category.slug)}`}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7" />
                </div>
                <span className="text-sm font-medium text-foreground text-center">
                  {category.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
