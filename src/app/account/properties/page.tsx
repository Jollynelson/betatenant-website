"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Plus, Eye, Loader2, X, RefreshCw, Trash2,
  Edit3, ExternalLink, CheckCircle, AlertTriangle, ChevronRight,
  Bed, Bath, MapPin, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { formatPriceFullNumber } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BoostModal } from "@/components/boost-modal";

type Status = "all" | "available" | "delisted" | "draft" | "rented";

const STATUS_FILTERS: { value: Status; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "available", label: "Active" },
  { value: "draft",     label: "Draft" },
  { value: "delisted",  label: "Delisted" },
  { value: "rented",    label: "Rented" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  draft:     { bg: "bg-amber-50",   text: "text-amber-700",   label: "Draft" },
  delisted:  { bg: "bg-neutral-100",text: "text-neutral-500", label: "Delisted" },
  rented:    { bg: "bg-blue-50",    text: "text-blue-700",    label: "Rented" },
};

interface Property {
  _id: string;
  houseName?: string;
  houseDescription?: string;
  apartmentType?: string;
  propertyLGA?: string;
  propertyState?: string;
  streetAddress?: string;
  listingFee?: number;
  photoURLs?: string[];
  propertyStatus?: string;
  totalViews?: number;
  roomCount?: number;
  bathroomCount?: number;
}

function AccountPropertiesContent() {
  const [all, setAll] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>("all");
  const [selected, setSelected] = useState<Property | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [boostTarget, setBoostTarget] = useState<Property | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    api.post<any>("/v1/landlordandagent/properties/1/100", {})
      .then((res) => setAll(res?.properties ?? []))
      .catch((err) => toast.error(err.message || "Failed to load properties"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const displayed = filter === "all"
    ? all
    : all.filter((p) => p.propertyStatus === filter);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      await api.put(`/v1/landlordandagent/my-listings/${id}`, { propertyStatus: status });
      toast.success(
        status === "available" ? "Listing is now active" :
        status === "delisted"  ? "Listing delisted" :
        "Status updated"
      );
      setAll((prev) => prev.map((p) => p._id === id ? { ...p, propertyStatus: status } : p));
      setSelected((s) => s?._id === id ? { ...s, propertyStatus: status } : s);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Permanently delete this listing? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.del(`/v1/landlordandagent/my-listings/${id}`);
      toast.success("Listing deleted");
      setAll((prev) => prev.filter((p) => p._id !== id));
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  const counts = {
    all:       all.length,
    available: all.filter((p) => p.propertyStatus === "available").length,
    draft:     all.filter((p) => p.propertyStatus === "draft").length,
    delisted:  all.filter((p) => p.propertyStatus === "delisted").length,
    rented:    all.filter((p) => p.propertyStatus === "rented").length,
  };

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Properties</h1>
            <p className="text-neutral-500 text-sm mt-0.5">{all.length} listing{all.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href="/host/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Listing
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
          {STATUS_FILTERS.map((f) => {
            const count = counts[f.value];
            if (f.value !== "all" && count === 0) return null;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                  filter === f.value
                    ? "bg-bt-primary text-white border-bt-primary"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                )}
              >
                {f.label}
                <span className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                  filter === f.value ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-16 text-center">
            <Home className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium mb-1">
              {filter === "all" ? "No listings yet" : `No ${filter} listings`}
            </p>
            {filter === "all" && (
              <Link href="/host/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold mt-4 hover:bg-bt-primary-light transition-colors">
                <Plus className="w-4 h-4" /> Add Your First Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((p, i) => {
              const style = STATUS_STYLE[p.propertyStatus ?? ""] ?? { bg: "bg-neutral-100", text: "text-neutral-500", label: p.propertyStatus ?? "" };
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                <Link
                  href={`/property/${p._id}`}
                  className="w-full bg-white rounded-2xl border border-neutral-200 overflow-hidden flex items-center gap-4 p-4 hover:shadow-md hover:border-neutral-300 active:scale-[0.99] transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                    {p.photoURLs?.[0] ? (
                      <img src={p.photoURLs[0]} alt={p.houseName ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-6 h-6 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate text-sm">
                      {p.houseName || `${p.apartmentType ?? "Property"} in ${p.propertyLGA}`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {p.propertyLGA}, {p.propertyState}
                    </p>
                    <p className="text-sm font-bold text-bt-primary mt-1">
                      {formatPriceFullNumber(p.listingFee ?? 0)}
                      <span className="text-xs font-normal text-neutral-400">/yr</span>
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", style.bg, style.text)}>
                      {style.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {(p.totalViews ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                          <Eye className="w-3 h-3" />{p.totalViews}
                        </span>
                      )}
                      {p.propertyStatus === "available" && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBoostTarget(p); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bt-primary/8 text-bt-primary text-[11px] font-bold hover:bg-bt-primary/15 transition-colors"
                        >
                          <Zap className="w-3 h-3" /> Boost
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-300" />
                    </div>
                  </div>
                </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Boost Modal */}
      <BoostModal
        open={!!boostTarget}
        onClose={() => setBoostTarget(null)}
        propertyId={boostTarget?._id ?? ""}
        propertyName={boostTarget?.houseName || `${boostTarget?.apartmentType ?? "Property"} in ${boostTarget?.propertyLGA}`}
        onSuccess={() => setBoostTarget(null)}
      />

      {/* Listing detail sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
            >
              <ListingSheet
                property={selected}
                loading={actionLoading}
                onClose={() => setSelected(null)}
                onUpdateStatus={updateStatus}
                onDelete={deleteListing}
                onBoost={selected.propertyStatus === "available" ? () => { setSelected(null); setBoostTarget(selected); } : undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Listing Detail Sheet ─────────────────────────────────────────────────────

function ListingSheet({ property: p, loading, onClose, onUpdateStatus, onDelete, onBoost }: {
  property: Property;
  loading: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onBoost?: () => void;
}) {
  const status = p.propertyStatus ?? "available";
  const style = STATUS_STYLE[status] ?? { bg: "bg-neutral-100", text: "text-neutral-500", label: status };

  return (
    <div className="pb-8">
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-neutral-200" />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", style.bg, style.text)}>
          {style.label}
        </span>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
          <X className="w-4 h-4 text-neutral-600" />
        </button>
      </div>

      {/* Photo */}
      {p.photoURLs?.[0] && (
        <div className="mx-5 rounded-2xl overflow-hidden aspect-video bg-neutral-100">
          <img src={p.photoURLs[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Info */}
      <div className="px-5 pt-4">
        <h2 className="text-lg font-bold text-neutral-900">
          {p.houseName || `${p.apartmentType ?? "Property"} in ${p.propertyLGA}`}
        </h2>
        <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {p.streetAddress ? `${p.streetAddress}, ` : ""}{p.propertyLGA}, {p.propertyState}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3">
          <p className="text-xl font-bold text-bt-primary">
            {formatPriceFullNumber(p.listingFee ?? 0)}<span className="text-sm font-normal text-neutral-400">/yr</span>
          </p>
          <div className="flex items-center gap-3 ml-auto text-xs text-neutral-500">
            {(p.roomCount ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{p.roomCount}</span>
            )}
            {(p.bathroomCount ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathroomCount}</span>
            )}
            {(p.totalViews ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.totalViews} views</span>
            )}
          </div>
        </div>

        {p.houseDescription && (
          <p className="text-sm text-neutral-600 mt-3 line-clamp-2">{p.houseDescription}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 mt-5 space-y-2.5">
        {/* Boost — only for active listings */}
        {status === "available" && onBoost && (
          <button
            onClick={onBoost}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-bt-primary text-white text-sm font-bold hover:bg-bt-primary-light transition-colors"
          >
            <Zap className="w-4 h-4" /> Boost This Listing
          </button>
        )}

        {/* View public listing */}
        {status !== "draft" && (
          <Link
            href={`/property/${p._id}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> View Public Listing
          </Link>
        )}

        {/* Edit listing */}
        <Link
          href={`/host/edit/${p._id}`}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-bt-primary/30 bg-bt-primary/5 text-bt-primary text-sm font-semibold hover:bg-bt-primary/10 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          {status === "draft" ? "Continue Editing Draft" : "Edit Listing"}
        </Link>

        {/* Status actions */}
        {status === "delisted" && (
          <button
            onClick={() => onUpdateStatus(p._id, "available")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Relist Property
          </button>
        )}

        {status === "available" && (
          <button
            onClick={() => onUpdateStatus(p._id, "delisted")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Delist Property
          </button>
        )}

        {status === "draft" && (
          <button
            onClick={() => onUpdateStatus(p._id, "available")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Publish Listing
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(p._id)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete Listing
        </button>
      </div>
    </div>
  );
}

// ─── Bottom of AccountPropertiesContent — add BoostModal ─────────────────────
// (already rendered inline in AccountPropertiesContent via boostTarget state)

export default function AccountPropertiesPage() {
  return <AuthGuard><AccountPropertiesContent /></AuthGuard>;
}
