"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, BedDouble, Bath, BadgeCheck, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorited, toggleFavorite } from "@/lib/favorites";
import { cdnThumb, propertyApi } from "@/lib/api";
import { queryClient } from "@/components/providers";
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
  const [liked, setLiked]   = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX         = useRef<number | null>(null);
  const touchStartY         = useRef<number | null>(null);

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

  const typeLabel   = APPT_LABELS[property.apartmentType] || property.apartmentType;
  const agentName   = `${property.host.firstName} ${property.host.lastName}`.trim();
  const hasPhotos   = property.photos.length > 0 && !property.photos[0].includes("placeholder");
  const hasVideos   = (property.videos ?? []).length > 0;
  // For cards: use photos if available, otherwise use video thumbnail via poster attribute
  const photos      = hasPhotos ? property.photos : ["/placeholder-property.jpg"];
  const videoOnlyMode = !hasPhotos && hasVideos;

  // Prefetch property detail on hover/touch so it loads instantly when tapped
  const prefetchProperty = () => {
    queryClient.prefetchQuery({
      queryKey: ["property", property._id],
      queryFn: () => propertyApi.get(property._id),
      staleTime: 1000 * 60 * 5,
    });
  };

  // ── Horizontal variant ────────────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <Link
        href={`/property/${property._id}`}
        onMouseEnter={prefetchProperty}
        onTouchStart={prefetchProperty}
        className="flex gap-4 p-3.5 rounded-2xl bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all group"
      >
        <div className="relative w-[120px] h-[90px] rounded-xl overflow-hidden shrink-0 bg-neutral-100">
          {videoOnlyMode ? (
            <>
              <video src={(property.videos ?? [])[0]} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayCircle className="w-6 h-6 text-white drop-shadow" />
              </div>
            </>
          ) : (
            <Image src={cdnThumb(photos[0])} alt={property.title} fill className="object-cover" sizes="120px" loading="lazy" />
          )}
          {/* Promotion badge on horizontal card */}
          {(property.promotionPackage || property.isPromoted) && (
            <span className={cn(
              "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-white text-[9px] font-bold",
              property.promotionPackage === "spotlight" ? "bg-[#FF4500]" :
              property.promotionPackage === "featured"  ? "bg-[#FB6514]" :
              "bg-bt-primary"
            )}>
              {property.promotionPackage === "spotlight" ? "🔥 Spotlight" :
               property.promotionPackage === "featured"  ? "⭐ Featured" :
               property.promotionPackage === "boost"     ? "🚀 Boosted" : "Featured"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-[15px] font-bold text-neutral-900 leading-snug truncate">
              &#8358;{property.price.toLocaleString()}
              <span className="text-xs font-normal text-neutral-400 ml-1">/yr</span>
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[12px] text-neutral-500 flex-wrap">
              <span className="flex items-center gap-1"><BedDouble className="w-3 h-3 text-neutral-400" />{property.bedrooms} beds</span>
              {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3 text-neutral-400" />{property.bathrooms} baths</span>}
              <span>{typeLabel}</span>
            </div>
            <p className="text-[12px] text-neutral-400 truncate mt-0.5">
              {property.address ? `${property.address}, ` : ""}{property.lga}, {property.state}
            </p>
          </div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium truncate">{agentName}</p>
        </div>
      </Link>
    );
  }

  // ── Default grid card ─────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <Link
        href={`/property/${property._id}`}
        onMouseEnter={prefetchProperty}
        onTouchStart={prefetchProperty}
        className="block rounded-2xl overflow-hidden bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200"
      >
        {/* ── Image area ── */}
        <div
          className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-100"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = e.changedTouches[0].clientY - (touchStartY.current ?? 0);
            touchStartX.current = null;
            touchStartY.current = null;
            // Only swipe if horizontal gesture (not a scroll)
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              e.preventDefault();
              setImgIdx(i =>
                dx < 0
                  ? (i < photos.length - 1 ? i + 1 : 0)
                  : (i > 0 ? i - 1 : photos.length - 1)
              );
            }
          }}
        >
          {/* Video-only: show muted autoplay preview or thumbnail with play badge */}
          {videoOnlyMode ? (
            <>
              <video
                src={(property.videos ?? [])[0]}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                preload="none"
                // poster = first photo if available (video thumbnail stored there by import)
                poster={property.photos?.[0] && !property.photos[0].includes("placeholder")
                  ? property.photos[0] : undefined}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                <PlayCircle className="w-3 h-3" /> Video
              </div>
            </>
          ) : (
            /* Render all images stacked; only show current via opacity — avoids re-fetch */
            photos.slice(0, 5).map((src, i) => (
              <Image
                key={src}
                src={cdnThumb(src)}
                alt={property.title}
                fill
                className={cn(
                  "object-cover transition-opacity duration-150",
                  i === imgIdx ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
              />
            ))
          )}

          {/* Badges */}
          {(property.host?.isVerified || property.promotionPackage || property.isPromoted) && (
            <div className="absolute top-2.5 left-2.5 flex gap-1 flex-wrap">
              {property.promotionPackage === "spotlight" && (
                <span className="px-2 py-0.5 rounded-md bg-[#FF4500] text-white text-[10px] font-bold">🔥 Spotlight</span>
              )}
              {property.promotionPackage === "featured" && (
                <span className="px-2 py-0.5 rounded-md bg-[#FB6514] text-white text-[10px] font-bold">⭐ Featured</span>
              )}
              {property.promotionPackage === "boost" && (
                <span className="px-2 py-0.5 rounded-md bg-bt-primary text-white text-[10px] font-bold">🚀 Boosted</span>
              )}
              {!property.promotionPackage && property.isPromoted && (
                <span className="px-2 py-0.5 rounded-md bg-[#FB6514] text-white text-[10px] font-bold">Featured</span>
              )}
              {property.host?.isVerified && (
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1">
                  <BadgeCheck className="w-2.5 h-2.5" /> ID Verified
                </span>
              )}
              {property.host?.isPremium && !property.host?.isVerified && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
                  ★ Premium
                </span>
              )}
            </div>
          )}

          {/* Heart */}
          <button
            onClick={handleHeart}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label={liked ? "Remove from saved" : "Save"}
          >
            <Heart className={cn("w-[15px] h-[15px]", liked ? "fill-red-500 text-red-500" : "text-neutral-500")} />
          </button>

          {/* Dot indicators */}
          {photos.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.slice(0, 5).map((_, i) => (
                <span key={i} className={cn("rounded-full transition-all duration-150",
                  i === imgIdx ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5")} />
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-3.5">
          <p className="text-[18px] font-bold text-neutral-900 leading-none">
            &#8358;{property.price.toLocaleString()}
            <span className="text-[12px] font-normal text-neutral-400 ml-1">/yr</span>
          </p>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[12.5px] text-neutral-600 font-medium">
              <BedDouble className="w-3.5 h-3.5 text-neutral-400" />{property.bedrooms} beds
            </span>
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1 text-[12.5px] text-neutral-600 font-medium">
                <Bath className="w-3.5 h-3.5 text-neutral-400" />{property.bathrooms} baths
              </span>
            )}
            <span className="text-[12.5px] text-neutral-600 font-medium">{typeLabel}</span>
          </div>

          <p className="text-[12px] text-neutral-500 mt-1 truncate">
            {property.address ? `${property.address}, ` : ""}{property.lga}, {property.state}
          </p>

          <p className={cn(
            "text-[10.5px] uppercase tracking-wide font-medium mt-2 truncate flex items-center gap-1",
            property.host?.isPremium ? "text-amber-600 font-semibold" : "text-neutral-400"
          )}>
            {property.host?.isPremium && <span className="shrink-0">★</span>}
            <span className="truncate">{agentName}</span>
            {property.host?.isVerified && <BadgeCheck className="w-2.5 h-2.5 text-blue-500 shrink-0" />}
          </p>
        </div>
      </Link>
    </div>
  );
}
