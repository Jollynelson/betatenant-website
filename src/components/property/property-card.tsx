"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MapPin, Bed, Bath, Eye, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [imgIdx, setImgIdx] = useState(0);

  if (variant === "horizontal") {
    return (
      <Link
        href={`/property/${property._id}`}
        className="group flex gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors"
      >
        <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-xl overflow-hidden shrink-0">
          <Image
            src={property.photos[0] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p className="text-xs text-neutral-400 uppercase tracking-wide font-medium">
            {property.apartmentType}
          </p>
          <h3 className="font-semibold text-neutral-900 truncate mt-0.5 text-[15px]">
            House in {property.lga}
          </h3>
          <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {property.lga}, {property.state}
          </p>
          <p className="text-[#08065E] font-bold mt-2 text-base">
            &#8358;{property.price.toLocaleString()}
            <span className="text-neutral-400 font-normal text-sm">/year</span>
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
      className="group w-full"
    >
      <Link
        href={`/property/${property._id}`}
        className="block rounded-2xl overflow-hidden bg-white border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
      >
        {/* Image Carousel */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <Image
            src={property.photos[imgIdx] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Heart button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
          >
            <Heart
              className={cn(
                "w-[18px] h-[18px] transition-all",
                liked
                  ? "fill-[#0A0876] text-[#0A0876] scale-110"
                  : "text-neutral-600"
              )}
            />
          </button>

          {/* Image navigation arrows (only on hover, only if multiple images) */}
          {property.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImgIdx(imgIdx > 0 ? imgIdx - 1 : property.photos.length - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImgIdx(imgIdx < property.photos.length - 1 ? imgIdx + 1 : 0);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {property.photos.slice(0, 5).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === imgIdx ? "bg-white w-4" : "bg-white/60"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-1.5">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold text-[#08065E]">
              &#8358;{property.price.toLocaleString()}
              <span className="text-sm text-neutral-400 font-normal">/year</span>
            </p>
            {property.rating && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-neutral-700">{property.rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-neutral-900 leading-snug">
            House in {property.lga}
          </h3>

          {/* Type */}
          <p className="text-sm text-neutral-500">
            {property.apartmentType} Apartment
          </p>

          {/* Location */}
          <p className="text-sm text-neutral-400 truncate flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.address}</span>
          </p>

          {/* Views */}
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{property.views} views</span>
          </div>

          {/* Divider + Amenities */}
          <div className="border-t border-neutral-100 pt-3 mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Bed className="w-4 h-4 text-neutral-400" />
              {property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Bath className="w-4 h-4 text-neutral-400" />
              {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
