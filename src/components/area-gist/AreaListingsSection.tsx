"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, ShieldCheck, ArrowRight, Home, Sparkles } from "lucide-react";
import { AreaGistData } from "./types";
import { cdnThumb } from "@/lib/api";

interface AreaListingsSectionProps {
  stats: AreaGistData["stats"];
  locationName: string;
  state: string;
}

export function AreaListingsSection({ stats, locationName, state }: AreaListingsSectionProps) {
  const formatCurrency = (val: number) => {
    if (!val) return "Contact for price";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const sampleListings = stats.sampleListings || [];

  return (
    <section id="available-listings" className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bt-primary mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-bt-secondary" />
              Verified Inventory
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Verified Homes For Rent in {locationName}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 font-normal max-w-2xl">
              Inspect vetted apartments directly. Every listing is physically inspected to protect you from phantom agents and fake deposits.
            </p>
          </div>

          <Link
            href={`/properties?search=${encodeURIComponent(locationName)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-bt-primary bg-bt-primary/5 hover:bg-bt-primary/10 border border-bt-primary/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>Browse All {stats.totalAvailableListings || ""} in {locationName}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Listings Grid */}
        {sampleListings.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-8 text-center max-w-md mx-auto">
            <Home className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              New Listings Adding Weekly
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              We are currently vetting fresh apartments in {locationName}. Browse our verified catalog across {state} or get notified when a unit drops.
            </p>
            <Link
              href={`/properties?search=${encodeURIComponent(state)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-bt-primary hover:bg-bt-primary-light transition-colors"
            >
              Browse All Listings in {state}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleListings.map((listing) => {
              const photoUrl = listing.photos && listing.photos.length > 0
                ? cdnThumb(listing.photos[0])
                : "/images/placeholder-property.jpg";

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Image Thumbnail */}
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                      <Image
                        src={photoUrl}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={photoUrl.includes("amazonaws.com") || photoUrl.startsWith("http")}
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-extrabold text-bt-primary flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Unit</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-white capitalize">
                        {listing.type || "Apartment"}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Price */}
                      <div className="text-lg font-extrabold text-emerald-600 mb-1">
                        {formatCurrency(listing.price)}
                        <span className="text-xs font-normal text-gray-500"> / yr</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm sm:text-base text-gray-950 line-clamp-1 mb-1 group-hover:text-bt-primary transition-colors">
                        {listing.title}
                      </h3>

                      {/* Address */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{listing.address || locationName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="p-4 pt-0">
                    <Link
                      href={`/property/${listing.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-bt-primary bg-bt-primary/5 hover:bg-bt-primary hover:text-white transition-all"
                    >
                      <span>View & Schedule Inspection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
