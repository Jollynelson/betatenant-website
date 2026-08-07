"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Bed, Bath, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorited, toggleFavorite } from "@/lib/favorites";
import type { Property } from "@/types";

const APPT_LABELS: Record<string, string> = {
  "single-room/shared-apartment": "Single Room",
  "self-contained":               "Self Contained",
  "mini-flat/one-bedroom":        "Mini Flat",
  "two-bedroom":                  "2 Bedroom",
  "three-bedroom":                "3 Bedroom",
  "four-bedroom":                 "4 Bedroom",
  "big-family-house-4plus":       "4+ Bedroom",
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
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setLiked(isFavorited(property._id));
  }, [property._id]);

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowLiked = toggleFavorite(property._id);
    setLiked(nowLiked);
    if (!nowLiked && onRemove) onRemove(property._id);
  };

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!("startViewTransition" in document)) return;
    e.preventDefault();
    (document as any).startViewTransition(() => router.push(`/property/${property._id}`));
  };

  const typeLabel = APPT_LABELS[property.apartmentType] || property.apartmentType;
  const agentName = `${property.host.firstName} ${property.host.lastName}`.trim();

  // ── Horizontal variant (list view) ──────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <Link
        href={`/property/${property._id}`}
        className="flex gap-4 p-3.5 rounded-2xl bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all group"
      >
        <div className="relative w-[120px] h-[90px] rounded-xl overflow-hidden shrink-0 bg-neutral-100">
          <Image src={property.photos[0] || "/placeholder-property.jpg"} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-[15px] font-bold text-neutral-900 leading-snug truncate">
              &#8358;{property.price.toLocaleString()}
              <span className="text-xs font-normal text-neutral-400 ml-1">/yr</span>
            </p>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {property.bedrooms} bd · {property.bathrooms} ba · {typeLabel}
            </p>
            <p className="text-[12px] text-neutral-400 truncate mt-0.5">
              {property.address ? `${property.address}, ` : ""}{property.lga}, {property.state}
            </p>
          </div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium truncate">{agentName}</p>
        </div>
      </Link>
    );
  }

  // ── Default grid card ────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <Link
        href={`/property/${property._id}`}
        onClick={handleNavigate}
        className="block rounded-2xl overflow-hidden bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200"
        style={{ viewTransitionName: `card-${property._id}` } as React.CSSProperties}
      >
        {/* ── Image ── */}
        <div
          className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-100"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 40) {
              e.preventDefault();
              if (dx < 0) setImgIdx((i) => (i < property.photos.length - 1 ? i + 1 : 0));
              else setImgIdx((i) => (i > 0 ? i - 1 : property.photos.length - 1));
            }
            touchStartX.current = null;
          }}
        >
          <Image
            src={property.photos[imgIdx] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ viewTransitionName: `card-img-${property._id}` } as React.CSSProperties}
          />

          {/* Top-left badge */}
          {(property.host?.isVerified || property.promotionPackage || property.isPromoted) && (
            <div className="absolute top-2.5 left-2.5 flex gap-1 flex-wrap">
              {property.promotionPackage === "spotlight" && (
                <span className="px-2 py-0.5 rounded-md bg-[#FF4500] text-white text-[10px] font-bold">
                  🔥 Spotlight
                </span>
              )}
              {property.promotionPackage === "featured" && (
                <span className="px-2 py-0.5 rounded-md bg-[#FB6514] text-white text-[10px] font-bold">
                  ⭐ Featured
                </span>
              )}
              {property.promotionPackage === "boost" && (
                <span className="px-2 py-0.5 rounded-md bg-bt-primary text-white text-[10px] font-bold">
                  🚀 Boosted
                </span>
              )}
              {!property.promotionPackage && property.isPromoted && (
                <span className="px-2 py-0.5 rounded-md bg-[#FB6514] text-white text-[10px] font-bold">
                  Featured
                </span>
              )}
              {property.host?.isVerified && (
                <span className="px-2 py-0.5 rounded-md bg-bt-success text-white text-[10px] font-bold flex items-center gap-1">
                  <BadgeCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
          )}

          {/* Heart — top right */}
          <button
            onClick={handleHeart}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label={liked ? "Remove from saved" : "Save"}
          >
            <Heart className={cn("w-[15px] h-[15px]", liked ? "fill-red-500 text-red-500" : "text-neutral-500")} />
          </button>

          {/* Dot indicators — only when multiple photos */}
          {property.photos.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
              {property.photos.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={cn("rounded-full transition-all duration-200", i === imgIdx ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5")}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-3.5">
          {/* Price — large and bold, primary action */}
          <p className="text-[18px] font-bold text-neutral-900 leading-none">
            &#8358;{property.price.toLocaleString()}
            <span className="text-[12px] font-normal text-neutral-400 ml-1">/yr</span>
          </p>

          {/* Beds · Baths · Type — compact inline row */}
          <p className="text-[12.5px] text-neutral-600 mt-1.5 font-medium">
            {property.bedrooms} bds
            <span className="text-neutral-300 mx-1.5">|</span>
            {property.bathrooms} ba
            <span className="text-neutral-300 mx-1.5">|</span>
            {typeLabel}
          </p>

          {/* Address */}
          <p className="text-[12px] text-neutral-500 mt-1 truncate">
            {property.address ? `${property.address}, ` : ""}{property.lga}, {property.state}
          </p>

          {/* Agent name — subtle, like Zillow's brokerage line */}
          <p className="text-[10.5px] text-neutral-400 uppercase tracking-wide font-medium mt-2 truncate">
            {agentName}
          </p>
        </div>
      </Link>
    </div>
  );
}
