"use client";

import { useState } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Star,
  Shield,
  Phone,
  MessageCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Verified,
  Eye,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPriceFullNumber } from "@/lib/constants";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { PropertyCard } from "@/components/property/property-card";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const property = MOCK_PROPERTIES.find((p) => p._id === id) || MOCK_PROPERTIES[0];
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const similarProperties = MOCK_PROPERTIES.filter(
    (p) => p._id !== property._id && p.type === property.type
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Image Gallery */}
      <div className="md:hidden relative">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={property.photos[currentImage] || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover"
            priority
          />

          {/* Navigation overlay */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <button
              onClick={() =>
                setCurrentImage(
                  currentImage > 0
                    ? currentImage - 1
                    : property.photos.length - 1
                )
              }
              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setCurrentImage(
                  currentImage < property.photos.length - 1
                    ? currentImage + 1
                    : 0
                )
              }
              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Top bar */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
            <Link
              href="/properties"
              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    liked ? "fill-red-500 text-red-500" : "text-gray-700"
                  )}
                />
              </button>
              <button className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium">
            {currentImage + 1} / {property.photos.length}
          </div>
        </div>
      </div>

      {/* Desktop Image Gallery */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[480px]">
          <div className="col-span-2 row-span-2 relative group cursor-pointer">
            <Image
              src={property.photos[0] || "/placeholder-property.jpg"}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
          {property.photos.slice(1, 5).map((photo, i) => (
            <div key={i} className="relative group cursor-pointer">
              <Image
                src={photo}
                alt={`${property.title} ${i + 2}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {i === 3 && property.photos.length > 5 && (
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-medium"
                >
                  +{property.photos.length - 5} more
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-bt-primary/10 text-bt-primary text-xs font-medium">
                  For Rent
                </span>
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  {property.apartmentType}
                </span>
                {property.isPromoted && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {property.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.address}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {property.views} views
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 py-5 border-y border-border">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{property.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{property.bathrooms}</p>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{property.toilets}</p>
                  <p className="text-xs text-muted-foreground">Toilets</p>
                </div>
              </div>
              {property.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-sm font-semibold">
                      {property.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {property.reviewCount} reviews
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                About this property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Amenities & Features
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-muted/50"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            {property.houseRules.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  House Rules
                </h2>
                <div className="space-y-2">
                  {property.houseRules.map((rule) => (
                    <div
                      key={rule}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Location
              </h2>
              <div className="aspect-[16/9] rounded-2xl bg-muted flex items-center justify-center border border-border">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {property.lga}, {property.state}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Map view available after connecting API
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Price Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl border border-border bg-white shadow-lg"
              >
                <div className="mb-5">
                  <p className="text-3xl font-bold text-foreground">
                    {formatPriceFullNumber(property.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    per year
                  </p>
                </div>

                {property.cautionFee && (
                  <div className="flex items-center justify-between py-3 border-t border-border text-sm">
                    <span className="text-muted-foreground">Caution Fee</span>
                    <span className="font-medium">
                      {formatPriceFullNumber(property.cautionFee)}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="p-3 rounded-xl border border-neutral-200">
                    <label className="text-xs text-neutral-500 block mb-1">
                      Schedule Inspection
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <input
                        type="date"
                        className="flex-1 text-sm font-medium bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Schedule Inspection
                </button>

                <button className="w-full mt-3 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message Host
                </button>
              </motion.div>

              {/* Host Card */}
              <div className="mt-5 p-5 rounded-2xl border border-border bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {property.host.firstName[0]}
                    {property.host.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground">
                        {property.host.firstName} {property.host.lastName}
                      </p>
                      {property.host.isVerified && (
                        <Verified className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {property.host.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 py-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {property.host.rating?.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {property.host.reviewCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {property.host.listingCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Listings</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Identity verified &bull; Responds within 2 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Similar Properties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-16 left-0 right-0 md:hidden bg-white border-t border-border px-4 py-3 flex items-center justify-between z-40">
        <div>
          <p className="text-xl font-bold text-foreground">
            {formatPriceFullNumber(property.price)}
          </p>
          <p className="text-xs text-muted-foreground">
            per year
          </p>
        </div>
        <button
          onClick={() => setShowContactModal(true)}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
        >
          Schedule Visit
        </button>
      </div>
    </div>
  );
}
