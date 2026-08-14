"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthGuard } from "@/components/auth-guard";
import { tenantSwitchApi, api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { locationData } from "@/lib/locations";
import {
  ArrowLeft, Loader2, Check, Bed, Bath, MapPin, Home,
  DollarSign, FileText, Calendar, Image as ImageIcon,
  X, Plus, Eye, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const API_BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "https://api.betatenant.com" : "/api/bt";

async function uploadFile(file: File, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("files", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/v1/user/aws-upload`);
    const token = localStorage.getItem("BT_TOKEN");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.data?.[0]) resolve(data.data[0]);
        else reject(new Error(data.message || `Upload failed (${xhr.status})`));
      } catch { reject(new Error("Upload failed")); }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

const APARTMENT_TYPES = [
  { label: "Single Room / Shared", value: "single-room/shared-apartment" },
  { label: "Self Contained",       value: "self-contained" },
  { label: "Mini Flat / 1 Bed",    value: "mini-flat/one-bedroom" },
  { label: "2 Bedroom Flat",       value: "two-bedroom" },
  { label: "3 Bedroom Flat",       value: "three-bedroom" },
  { label: "4 Bedroom Flat",       value: "four-bedroom" },
  { label: "4+ Bedroom House",     value: "big-family-house-4plus" },
];

function CountInput({ value, onChange, min = 0, max = 20 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold hover:bg-neutral-200 transition-colors text-lg">−</button>
      <span className="flex-1 text-center text-base font-bold text-neutral-900">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold hover:bg-neutral-200 transition-colors text-lg">+</button>
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-bt-primary" />
        </div>
        <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function TenantSwitchFormContent() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Fields
  const [apartmentType, setApartmentType] = useState("");
  const [houseName, setHouseName]         = useState("");
  const [description, setDescription]     = useState("");
  const [state, setState]                 = useState("");
  const [lga, setLga]                     = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [closeLandmark, setCloseLandmark] = useState("");
  const [rooms, setRooms]                 = useState(1);
  const [baths, setBaths]                 = useState(1);
  const [livingRooms, setLivingRooms]     = useState(1);
  const [listingFee, setListingFee]       = useState("");
  const [cautionFee, setCautionFee]       = useState("");
  const [moveOutDate, setMoveOutDate]     = useState("");
  const [tenantGender, setTenantGender]   = useState<"male"|"female"|"any">("any");
  const [photoURLs, setPhotoURLs]         = useState<string[]>([]);
  const [uploading, setUploading]         = useState<{ id: string; progress: number; name: string }[]>([]);

  const statesData = locationData.map((d) => d.state);
  const lgaList    = locationData.find((d) => d.state === state)?.cities ?? [];

  // Check if user already has a listing
  const { data: myListing, isLoading: checkingListing } = useQuery({
    queryKey: ["tenant-switch-my-listing"],
    queryFn: tenantSwitchApi.myListing,
    staleTime: 1000 * 60 * 5,
  });

  // Pre-fill from existing listing
  useEffect(() => {
    if (myListing) {
      setApartmentType(myListing.apartmentType ?? "");
      setHouseName(myListing.title ?? "");
      setDescription(myListing.description ?? "");
      setState(myListing.state ?? "");
      setLga(myListing.lga ?? "");
      setStreetAddress(myListing.address ?? "");
      setCloseLandmark(myListing.closeLandmark ?? "");
      setRooms(myListing.bedrooms ?? 1);
      setBaths(myListing.bathrooms ?? 1);
      setListingFee(myListing.price ? String(myListing.price) : "");
      setPhotoURLs(myListing.photos?.filter((p: string) => !p.includes("placeholder")) ?? []);
      if (myListing.moveOutDate) {
        setMoveOutDate(new Date(myListing.moveOutDate).toISOString().split("T")[0]);
      }
      if (myListing.tenantGender) setTenantGender(myListing.tenantGender as any);
    }
  }, [myListing]);

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const uid = Math.random().toString(36).slice(2);
      setUploading(p => [...p, { id: uid, progress: 0, name: file.name }]);
      try {
        const url = await uploadFile(file, prog =>
          setUploading(p => p.map(u => u.id === uid ? { ...u, progress: prog } : u))
        );
        setPhotoURLs(p => [...p, url]);
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`);
      } finally {
        setUploading(p => p.filter(u => u.id !== uid));
      }
    }
  };

  const handleSave = async () => {
    if (!apartmentType)  { toast.error("Select apartment type"); return; }
    if (!state || !lga)  { toast.error("Select state and city"); return; }
    if (!streetAddress)  { toast.error("Enter your street address"); return; }
    if (!closeLandmark)  { toast.error("Enter closest landmark"); return; }
    if (!description)    { toast.error("Add a description"); return; }
    if (!listingFee || Number(listingFee) < 1) { toast.error("Enter your annual rent"); return; }
    if (!moveOutDate)    { toast.error("Select when you plan to move out"); return; }
    if (photoURLs.length < 1) { toast.error("Add at least 1 photo"); return; }

    setSaving(true);
    try {
      if (myListing) {
        // Update existing via the general edit endpoint
        await api.put(`/v1/landlordandagent/my-listings/${myListing._id}`, {
          apartmentType,
          houseName: houseName.trim() || undefined,
          houseDescription: description,
          propertyState: state,
          propertyLGA: lga,
          streetAddress,
          closeLandmark,
          roomCount: rooms,
          bathroomCount: baths,
          livingRoomCount: livingRooms,
          listingFee: Number(listingFee),
          cautionFee: cautionFee ? Number(cautionFee) : 0,
          photoURLs,
          moveOutDate,
        });
        toast.success("Listing updated!");
      } else {
        await tenantSwitchApi.create({
          apartmentType,
          houseName: houseName.trim() || undefined,
          houseDescription: description,
          propertyState: state,
          propertyLGA: lga,
          streetAddress,
          closeLandmark,
          roomCount: rooms,
          bathroomCount: baths,
          livingRoomCount: livingRooms,
          listingFee: Number(listingFee),
          cautionFee: cautionFee ? Number(cautionFee) : 0,
          amenities: [],
          houseRules: [],
          photoURLs,
          moveOutDate,
          tenantGender,
        });
        toast.success("Your space is now listed! You have 5 free unlocks.");
      }
      router.push("/tenant-switch");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (checkingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
      </div>
    );
  }

  // Today's date for min date on picker
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-neutral-900">
              {myListing ? "My Space" : "List My Space"}
            </h1>
            {myListing && (
              <p className="text-[11px] text-emerald-600 font-semibold">Active listing</p>
            )}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-full bg-bt-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {myListing ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {myListing && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Your space is live. Update details or remove your listing below.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Move-out Date */}
        <Section icon={Calendar} title="Move-out Date">
          <Field label="When do you plan to move out?">
            <input
              type="date"
              min={today}
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all"
            />
          </Field>
          <p className="text-[11px] text-neutral-400 mt-2">Your listing will automatically be removed on this date.</p>
        </Section>

        {/* Gender */}
        <Section icon={Home} title="Your Gender">
          <p className="text-xs text-neutral-500 mb-3">Let potential swap partners know who they'd be connecting with.</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "male",   emoji: "👨", label: "Male" },
              { value: "female", emoji: "👩", label: "Female" },
              { value: "any",    emoji: "🤝", label: "Prefer not to say" },
            ] as const).map((g) => (
              <button
                key={g.value}
                onClick={() => setTenantGender(g.value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all",
                  tenantGender === g.value
                    ? "border-bt-primary bg-bt-primary/5"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <span className="text-3xl">{g.emoji}</span>
                <span className={cn("text-xs font-semibold", tenantGender === g.value ? "text-bt-primary" : "text-neutral-600")}>
                  {g.label}
                </span>
                {tenantGender === g.value && (
                  <div className="w-4 h-4 rounded-full bg-bt-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Apartment Type */}
        <Section icon={Home} title="Property Type">
          <div className="grid grid-cols-2 gap-2">
            {APARTMENT_TYPES.map((t) => (
              <button key={t.value} onClick={() => setApartmentType(t.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-sm text-left transition-all",
                  apartmentType === t.value
                    ? "border-bt-primary bg-bt-primary/5 text-bt-primary font-semibold"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Details */}
        <Section icon={FileText} title="About Your Space">
          <div className="space-y-3">
            <Field label="Listing Name (optional)">
              <input type="text" value={houseName} onChange={(e) => setHouseName(e.target.value)}
                placeholder="e.g. Cozy 1-Bedroom in Yaba"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Describe what makes your place great..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all resize-none" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Bedrooms"><CountInput value={rooms} onChange={setRooms} min={0} /></Field>
              <Field label="Bathrooms"><CountInput value={baths} onChange={setBaths} min={1} /></Field>
              <Field label="Living Rooms"><CountInput value={livingRooms} onChange={setLivingRooms} min={0} /></Field>
            </div>
          </div>
        </Section>

        {/* Location */}
        <Section icon={MapPin} title="Location">
          <div className="space-y-3">
            <Field label="State">
              <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all">
                <option value="">Select state</option>
                {statesData.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            {state && (
              <Field label="City / LGA">
                <select value={lga} onChange={(e) => setLga(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all">
                  <option value="">Select city</option>
                  {lgaList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            )}
            <Field label="Street Address">
              <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. 15 Herbert Macaulay Way"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
            </Field>
            <Field label="Closest Landmark">
              <input type="text" value={closeLandmark} onChange={(e) => setCloseLandmark(e.target.value)}
                placeholder="e.g. Near GTBank, Surulere"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
            </Field>
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={DollarSign} title="Rent">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Annual Rent (₦)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₦</span>
                <input type="text" value={listingFee ? Number(listingFee).toLocaleString() : ""}
                  onChange={(e) => setListingFee(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
              </div>
            </Field>
            <Field label="Caution Fee (₦) optional">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₦</span>
                <input type="text" value={cautionFee ? Number(cautionFee).toLocaleString() : ""}
                  onChange={(e) => setCautionFee(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
              </div>
            </Field>
          </div>
          {listingFee && (
            <p className="mt-3 text-xs text-neutral-500">
              Unlock fee for viewers:{" "}
              <span className="font-semibold text-bt-primary">
                ₦{Number(listingFee) > 1_500_000 ? "1,500" : Number(listingFee) > 501_000 ? "850" : "500"}
              </span>
            </p>
          )}
        </Section>

        {/* Photos */}
        <Section icon={ImageIcon} title={`Photos (${photoURLs.length})`}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photoURLs.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group">
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                <button
                  onClick={() => setPhotoURLs(p => p.filter(u => u !== url))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {uploading.map(u => (
              <div key={u.id} className="aspect-square rounded-xl bg-neutral-100 flex flex-col items-center justify-center gap-1">
                <Loader2 className="w-5 h-5 animate-spin text-bt-primary" />
                <span className="text-[10px] text-neutral-500">{u.progress}%</span>
              </div>
            ))}
            <button onClick={() => photoInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-1 hover:border-bt-primary/40 transition-colors">
              <Plus className="w-5 h-5 text-neutral-400" />
              <span className="text-[10px] text-neutral-400">Add</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">Add at least 1 photo of your space.</p>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
        </Section>

        {/* Publish */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl bg-bt-primary text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-bt-primary-light active:scale-[0.99] transition-all shadow-[0_4px_14px_rgba(10,8,118,0.25)]">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {myListing ? "Update My Space" : "Publish My Space"}
        </button>

        {myListing && (
          <button
            onClick={async () => {
              if (!confirm("Remove your tenant switch listing?")) return;
              try {
                await api.del(`/v1/landlordandagent/my-listings/${myListing._id}`);
                toast.success("Listing removed");
                router.push("/tenant-switch");
              } catch (err: any) {
                toast.error(err.message || "Failed to remove");
              }
            }}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Remove My Listing
          </button>
        )}
      </div>
    </div>
  );
}

export default function TenantSwitchListPage() {
  return <AuthGuard><TenantSwitchFormContent /></AuthGuard>;
}
