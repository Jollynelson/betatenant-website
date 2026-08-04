"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MapPin, Bed, Bath, Star, Verified } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPriceFullNumber } from "@/lib/constants";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "horizontal" | "compact";
}

export function PropertyCard({
  property,
  variant = "default",
}: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  if (variant === "horizontal") {
    return (
      <Link
        href={`/property/${property._id}`}
        className="group flex gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
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
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {property.lga}, {property.state}
          </p>
          <h3 className="font-semibold text-foreground truncate mt-0.5">
            {property.title}
          </h3>
          <p className="text-primary font-bold mt-1">
            {formatPriceFullNumber(property.price)}
            <span className="text-muted-foreground font-normal text-sm">
              {property.type === "rent" ? "/yr" : "/night"}
            </span>
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
      className="group"
    >
      <Link href={`/property/${property._id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
          <Image
            src={property.photos[imageIndex] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Like button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              className={cn(
                "w-4.5 h-4.5 transition-colors",
                liked ? "fill-red-500 text-red-500" : "text-gray-700"
              )}
            />
          </button>

          {/* Type Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium">
            {property.type === "short-let" ? "Short-Let" : "For Rent"}
          </div>

          {/* Promoted Badge */}
          {property.isPromoted && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              Featured
            </div>
          )}

          {/* Image dots */}
          {property.photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {property.photos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    setImageIndex(i);
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === imageIndex
                      ? "bg-white w-4"
                      : "bg-white/60 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-1">
              {property.title}
            </h3>
            {property.rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">
                  {property.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {property.lga}, {property.state}
          </p>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              {property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {property.bathrooms}{" "}
              {property.bathrooms === 1 ? "Bath" : "Baths"}
            </span>
            {property.host?.isVerified && (
              <span className="flex items-center gap-1 text-primary">
                <Verified className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          <p className="text-lg font-bold text-foreground pt-1">
            {formatPriceFullNumber(property.price)}
            <span className="text-sm text-muted-foreground font-normal">
              {property.type === "rent" ? " /year" : " /night"}
            </span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
