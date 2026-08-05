"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart, MapPin, Bed, Bath, Eye, Star,
  ChevronLeft, ChevronRight, BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorited, toggleFavorite } from "@/lib/favorites";
import type { Property } from "@/types";

const APPT_LABELS: Record<string, string> = {
  "single-room/shared-apartment": "Single Room",
  "self-contained": "Self Contained",
  "mini-flat/one-bedroom": "Mini Flat",
  "two-bedroom": "2 Bedroom",
  "three-bedroom": "3 Bedroom",
  "four-bedroom": "4 Bedroom",
  "big-family-house-4plus": "4+ Bedroom",
};

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "horizontal";
  onRemove?: (id: string) => void;
}

export function PropertyCard({ property, variant = "default", onRemove }: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setLiked(isFavorited(property._id));
  }, [property._id]);

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    const nowLiked = toggleFavorite(property._id);
    setLiked(nowLiked);
    if (!nowLiked && onRemove) onRemove(property._id);
  };

  // View Transitions API — animates like native navigation
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!("startViewTransition" in document)) return; // fallback: normal link
    e.preventDefault();
    (document as any).startViewTransition(() => {
      router.push(`/property/${property._id}`);
    });
  };

  const typeLabel = APPT_LABELS[property.apartmentType] || property.apartmentType;

  if (variant === "horizontal") {
    return (
      <Link
        href={`/property/${property._id}`}
        className="group flex gap-5 p-4 rounded-2xl border border-transparent hover:border-neutral-200 hover:bg-white hover:shadow-sm transition-all"
      >
        <div className="relative w-[200px] h-[140px] rounded-xl overflow-hidden shrink-0">
          <Image
            src={property.photos[0] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {property.host?.isVerified && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-bt-success/90 text-white text-[10px] font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              {property.apartmentType}
            </p>
            <h3 className="font-semibold text-neutral-900 mt-1 text-base leading-snug">
              {property.bedrooms} Bed in {property.lga}
            </h3>
            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{property.address}</span>
            </p>
          </div>
          <p className="text-lg font-bold text-[#08065E]">
            &#8358;{property.price.toLocaleString()}
            <span className="text-sm text-neutral-400 font-normal">/year</span>
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="group w-full">
      <Link
        href={`/property/${property._id}`}
        onClick={handleNavigate}
        className="block rounded-xl overflow-hidden bg-white border border-neutral-100 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5"
        style={{ viewTransitionName: `card-${property._id}` } as React.CSSProperties}
      >
        {/* Image */}
        <div className="relative w-full aspect-[16/11] overflow-hidden bg-neutral-100">
          <Image
            src={property.photos[imgIdx] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ viewTransitionName: `card-img-${property._id}` } as React.CSSProperties}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {property.host?.isVerified && (
              <span className="px-2 py-1 rounded-md bg-bt-success text-white text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
            {property.isPromoted && (
              <span className="px-2 py-1 rounded-md bg-bt-secondary text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">
                Featured
              </span>
            )}
          </div>

          {/* Heart — wired to localStorage */}
          <button
            onClick={handleHeart}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
            aria-label={liked ? "Remove from saved" : "Save property"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all",
                liked ? "fill-red-500 text-red-500" : "text-neutral-500"
              )}
            />
          </button>

          {/* Carousel */}
          {property.photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); setImgIdx(imgIdx > 0 ? imgIdx - 1 : property.photos.length - 1); }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 group-active:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-200"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-neutral-700" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setImgIdx(imgIdx < property.photos.length - 1 ? imgIdx + 1 : 0); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 group-active:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-200"
              >
                <ChevronRight className="w-3.5 h-3.5 text-neutral-700" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {property.photos.slice(0, 5).map((_, i) => (
                  <span key={i} className={cn("h-1.5 rounded-full transition-all duration-200", i === imgIdx ? "bg-white w-4" : "bg-white/50 w-1.5")} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[17px] font-bold text-neutral-900">
              &#8358;{property.price.toLocaleString()}
              <span className="text-[13px] text-neutral-400 font-normal ml-0.5">/yr</span>
            </p>
            {!!property.rating && (
              <span className="flex items-center gap-1 text-[13px] text-neutral-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {property.rating.toFixed(1)}
                <span className="text-neutral-300">({property.reviewCount})</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[13px] text-neutral-600">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-neutral-400" />
              {property.bedrooms} bed
            </span>
            <span className="text-neutral-300">&bull;</span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-neutral-400" />
              {property.bathrooms} bath
            </span>
            <span className="text-neutral-300">&bull;</span>
            <span>{typeLabel}</span>
          </div>
          <p className="text-[13px] text-neutral-500 mt-1.5 truncate">
            {property.lga}, {property.state}
          </p>
          {!!property.views && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-neutral-400">
              <Eye className="w-3 h-3" />
              {property.views.toLocaleString()} views
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
