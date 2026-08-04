"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MapPin, Bed, Bath, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPriceFullNumber } from "@/lib/constants";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "horizontal";
}

export function PropertyCard({
  property,
  variant = "default",
}: PropertyCardProps) {
  const [liked, setLiked] = useState(false);

  if (variant === "horizontal") {
    return (
      <Link
        href={`/property/${property._id}`}
        className="group flex gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors"
      >
        <div className="relative w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden shrink-0">
          <Image
            src={property.photos[0] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {property.lga}, {property.state}
          </p>
          <h3 className="font-semibold text-neutral-900 truncate mt-0.5">
            {property.title}
          </h3>
          <p className="text-bt-primary font-bold mt-1">
            {formatPriceFullNumber(property.price)}
            <span className="text-neutral-500 font-normal text-sm">/year</span>
          </p>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="group max-w-[330px] w-full mx-auto"
    >
      <Link
        href={`/property/${property._id}`}
        className="block rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* Image */}
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={property.photos[0] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Heart button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                liked
                  ? "fill-bt-primary text-bt-primary"
                  : "text-neutral-600"
              )}
            />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-5 space-y-2">
          {/* Price */}
          <p className="text-lg font-bold text-[#08065E]">
            &#8358;{property.price.toLocaleString()}
            <span className="text-sm text-neutral-500 font-normal">/year</span>
          </p>

          {/* Title */}
          <h3 className="text-sm font-semibold text-neutral-900">
            House in {property.lga}
          </h3>

          {/* Apartment type */}
          <p className="text-sm text-neutral-500">
            {property.apartmentType} Apartment
          </p>

          {/* Location */}
          <p className="text-sm text-neutral-500 truncate flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.address}</span>
          </p>

          {/* Views */}
          <p className="text-xs text-neutral-400 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {property.views} views
          </p>

          {/* Divider */}
          <div className="border-t border-neutral-200 pt-3 mt-3 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Bed className="w-4 h-4 text-neutral-400" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Bath className="w-4 h-4 text-neutral-400" />
              {property.bathrooms}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
