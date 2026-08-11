"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { locationData } from "@/lib/locations";
import {
  ArrowLeft, Loader2, Check, Bed, Bath, MapPin, Home,
  DollarSign, FileText, Sparkles, Image as ImageIcon,
  X, Plus, Video, Trash2,
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
  { label: "Single room / Shared apartment", value: "single-room/shared-apartment" },
  { label: "Self Contained",                 value: "self-contained" },
  { label: "Mini flat / 1 Bedroom",          value: "mini-flat/one-bedroom" },
  { label: "2 Bedroom flat",                 value: "two-bedroom" },
  { label: "3 Bedroom flat",                 value: "three-bedroom" },
  { label: "4 Bedroom flat",                 value: "four-bedroom" },
  { label: "Big family house (4+ beds)",     value: "big-family-house-4plus" },
];

const ROOM_DEFAULTS: Record<string, { rooms: number; baths: number }> = {
  "single-room/shared-apartment": { rooms: 1, baths: 1 },
  "self-contained":               { rooms: 1, baths: 1 },
  "mini-flat/one-bedroom":        { rooms: 1, baths: 1 },
  "two-bedroom":                  { rooms: 2, baths: 2 },
  "three-bedroom":                { rooms: 3, baths: 3 },
  "four-bedroom":                 { rooms: 4, baths: 4 },
  "big-family-house-4plus":       { rooms: 5, baths: 4 },
};

interface Amenity { _id: string; name: string }
interface HouseRule { _id: string; name: string }

function EditListingContent({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core fields
  const [houseName, setHouseName]         = useState("");
  const [description, setDescription]     = useState("");
  const [apartmentType, setApartmentType] = useState("");
  const [state, setState]                 = useState("");
  const [lga, setLga]                     = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [rooms, setRooms]                 = useState(1);
  const [baths, setBaths]                 = useState(1);
  const [listingFee, setListingFee]       = useState("");
  const [cautionFee, setCautionFee]       = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRules, setSelectedRules]         = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState("");

  // Photos & videos
  const [photoURLs, setPhotoURLs]   = useState<string[]>([]);
  const [videoURLs, setVideoURLs]   = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState<{ id: string; progress: number; name: string }[]>([]);
  const [uploadingVideos, setUploadingVideos] = useState<{ id: string; progress: number; name: string }[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Options
  const [amenities, setAmenities]   = useState<Amenity[]>([]);
  const [houseRules, setHouseRules] = useState<HouseRule[]>([]);

  const statesData = locationData.map((d) => d.state);
  const lgaList = locationData.find((d) => d.state === state)?.cities ?? [];

  useEffect(() => {
    Promise.all([
      api.get<any>(`/v1/landlordandagent/my-listings/${id}`),
      api.get<any>("/v1/user/amenities/rent"),
      api.get<any>("/v1/user/houserules/rent"),
    ]).then(([propRes, amenRes, ruleRes]) => {
      const p = propRes?.myListings ?? propRes;
      setHouseName(p.houseName ?? "");
      setDescription(p.houseDescription ?? "");
      setApartmentType(p.apartmentType ?? "");
      setState(p.propertyState ?? "");
      setLga(p.propertyLGA ?? "");
      setStreetAddress(p.streetAddress ?? "");
      setRooms(p.roomCount ?? 1);
      setBaths(p.bathroomCount ?? 1);
      setListingFee(p.listingFee ? String(p.listingFee) : "");
      setCautionFee(p.cautionFee ? String(p.cautionFee) : "");
      setCurrentStatus(p.propertyStatus ?? "");
      // amenities/houseRules may be objects or ObjectId strings
      const aIds = (p.amenities ?? []).map((a: any) => typeof a === "object" ? a._id : a);
      const rIds = (p.houseRules ?? []).map((r: any) => typeof r === "object" ? r._id : r);
      setSelectedAmenities(aIds);
      setSelectedRules(rIds);

      setPhotoURLs(p.photoURLs ?? []);
      setVideoURLs(p.videoURLs ?? []);
      setAmenities(amenRes?.amenities ?? []);
      setHouseRules(ruleRes?.houseRules ?? []);
    }).catch(() => toast.error("Failed to load listing"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTypeChange = (val: string) => {
    setApartmentType(val);
    const def = ROOM_DEFAULTS[val];
    if (def) { setRooms(def.rooms); setBaths(def.baths); }
  };

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const uid = Math.random().toString(36).slice(2);
      setUploadingPhotos(p => [...p, { id: uid, progress: 0, name: file.name }]);
      try {
        const url = await uploadFile(file, (prog) =>
          setUploadingPhotos(p => p.map(u => u.id === uid ? { ...u, progress: prog } : u))
        );
        setPhotoURLs(p => [...p, url]);
      } catch (err: any) {
        toast.error(`Photo upload failed: ${err.message}`);
      } finally {
        setUploadingPhotos(p => p.filter(u => u.id !== uid));
      }
    }
  };

  const handleDeletePhoto = async (url: string) => {
    // Remove from UI immediately
    setPhotoURLs(p => p.filter(u => u !== url));
    // Delete from S3 (best-effort)
    const key = url.split(".amazonaws.com/")[1] ?? url.split("/").pop() ?? "";
    try { await api.del(`/v1/landlordandagent/file/${encodeURIComponent(key)}`); } catch {}
  };

  const handleAddVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const uid = Math.random().toString(36).slice(2);
      setUploadingVideos(p => [...p, { id: uid, progress: 0, name: file.name }]);
      try {
        const url = await uploadFile(file, (prog) =>
          setUploadingVideos(p => p.map(u => u.id === uid ? { ...u, progress: prog } : u))
        );
        setVideoURLs(p => [...p, url]);
      } catch (err: any) {
        toast.error(`Video upload failed: ${err.message}`);
      } finally {
        setUploadingVideos(p => p.filter(u => u.id !== uid));
      }
    }
  };

  const handleDeleteVideo = async (url: string) => {
    setVideoURLs(p => p.filter(u => u !== url));
    const key = url.split(".amazonaws.com/")[1] ?? url.split("/").pop() ?? "";
    try { await api.del(`/v1/landlordandagent/file/${encodeURIComponent(key)}`); } catch {}
  };

  const handleSave = async () => {
    if (!apartmentType) { toast.error("Select an apartment type"); return; }
    if (!state || !lga) { toast.error("Select state and city"); return; }
    if (!listingFee || Number(listingFee) < 1) { toast.error("Enter a valid listing fee"); return; }
    if (photoURLs.length < 3) { toast.error("At least 3 photos required"); return; }

    setSaving(true);
    try {
      await api.put(`/v1/landlordandagent/my-listings/${id}`, {
        houseName:       houseName.trim() || undefined,
        houseDescription: description.trim() || undefined,
        apartmentType,
        propertyState:   state,
        propertyLGA:     lga,
        streetAddress:   streetAddress.trim() || undefined,
        roomCount:       rooms,
        bathroomCount:   baths,
        listingFee:      Number(listingFee),
        cautionFee:      cautionFee ? Number(cautionFee) : undefined,
        amenities:       selectedAmenities,
        houseRules:      selectedRules,
        photoURLs,
        videoURLs,
      });
      toast.success("Listing updated!");
      router.back();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Edit Listing</h1>
          {currentStatus && (
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
              currentStatus === "available" ? "bg-emerald-50 text-emerald-700" :
              currentStatus === "draft"     ? "bg-amber-50 text-amber-700" :
              "bg-neutral-100 text-neutral-500"
            )}>
              {currentStatus === "available" ? "Active" : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-full bg-bt-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 hover:bg-bt-primary-light transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Apartment Type */}
        <Section icon={Home} title="Property Type">
          <div className="grid grid-cols-2 gap-2">
            {APARTMENT_TYPES.map((t) => (
              <button key={t.value} onClick={() => handleTypeChange(t.value)}
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
        <Section icon={FileText} title="Details">
          <div className="space-y-3">
            <Field label="Listing Name (optional)">
              <input type="text" value={houseName} onChange={(e) => setHouseName(e.target.value)}
                placeholder="e.g. Cozy 2-Bedroom in Lekki"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Describe the property..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all resize-none" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bedrooms">
                <CountInput value={rooms} onChange={setRooms} min={1} max={20} />
              </Field>
              <Field label="Bathrooms">
                <CountInput value={baths} onChange={setBaths} min={1} max={20} />
              </Field>
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
                placeholder="e.g. 12 Adeola Odeku Street"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all" />
            </Field>
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={DollarSign} title="Pricing">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Annual Rent (₦)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₦</span>
                <input type="text" value={listingFee ? Number(listingFee).toLocaleString() : ""}
                  onChange={(e) => setListingFee(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0" className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all pl-7" />
              </div>
            </Field>
            <Field label="Caution Fee (₦)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₦</span>
                <input type="text" value={cautionFee ? Number(cautionFee).toLocaleString() : ""}
                  onChange={(e) => setCautionFee(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Optional" className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all pl-7" />
              </div>
            </Field>
          </div>
        </Section>

        {/* Amenities */}
        {amenities.length > 0 && (
          <Section icon={Sparkles} title="Amenities">
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((a) => (
                <label key={a._id} className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer text-sm transition-all",
                  selectedAmenities.includes(a._id)
                    ? "border-bt-primary/30 bg-bt-primary/5 text-bt-primary font-medium"
                    : "border-neutral-100 text-neutral-600 hover:bg-neutral-50"
                )}>
                  <input type="checkbox"
                    checked={selectedAmenities.includes(a._id)}
                    onChange={() => setSelectedAmenities(toggle(selectedAmenities, a._id))}
                    className="w-4 h-4 rounded accent-bt-primary" />
                  {a.name}
                </label>
              ))}
            </div>
          </Section>
        )}

        {/* House Rules */}
        {houseRules.length > 0 && (
          <Section icon={FileText} title="House Rules">
            <div className="grid grid-cols-2 gap-2">
              {houseRules.map((r) => (
                <label key={r._id} className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer text-sm transition-all",
                  selectedRules.includes(r._id)
                    ? "border-bt-primary/30 bg-bt-primary/5 text-bt-primary font-medium"
                    : "border-neutral-100 text-neutral-600 hover:bg-neutral-50"
                )}>
                  <input type="checkbox"
                    checked={selectedRules.includes(r._id)}
                    onChange={() => setSelectedRules(toggle(selectedRules, r._id))}
                    className="w-4 h-4 rounded accent-bt-primary" />
                  {r.name}
                </label>
              ))}
            </div>
          </Section>
        )}

        {/* Photos */}
        <Section icon={ImageIcon} title={`Photos (${photoURLs.length})`}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photoURLs.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group">
                <Image src={url} alt={`Photo ${i+1}`} fill className="object-cover" sizes="120px" />
                <button
                  onClick={() => handleDeletePhoto(url)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {uploadingPhotos.map(u => (
              <div key={u.id} className="aspect-square rounded-xl bg-neutral-100 flex flex-col items-center justify-center gap-1">
                <Loader2 className="w-5 h-5 animate-spin text-bt-primary" />
                <span className="text-[10px] text-neutral-500">{u.progress}%</span>
              </div>
            ))}
            <button
              onClick={() => photoInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-1 hover:border-bt-primary/40 hover:bg-bt-primary/3 transition-colors"
            >
              <Plus className="w-5 h-5 text-neutral-400" />
              <span className="text-[10px] text-neutral-400">Add</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">Minimum 3 photos required. Tap × to remove a photo.</p>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
        </Section>

        {/* Videos */}
        <Section icon={Video} title={`Videos (${videoURLs.length})`}>
          <div className="space-y-2 mb-3">
            {videoURLs.map((url, i) => (
              <div key={url} className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <Video className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="flex-1 text-xs text-neutral-600 truncate">Video {i+1}</span>
                <button onClick={() => handleDeleteVideo(url)} className="text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {uploadingVideos.map(u => (
              <div key={u.id} className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <Loader2 className="w-4 h-4 animate-spin text-bt-primary shrink-0" />
                <span className="flex-1 text-xs text-neutral-500 truncate">{u.name}</span>
                <span className="text-[10px] text-neutral-400">{u.progress}%</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-neutral-200 text-sm text-neutral-500 flex items-center justify-center gap-2 hover:border-bt-primary/40 hover:text-bt-primary transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Video
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleAddVideos} />
        </Section>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl bg-bt-primary text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-bt-primary-light active:scale-[0.99] transition-all shadow-[0_4px_14px_rgba(10,8,118,0.25)]">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Save Changes
        </button>

      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function CountInput({ value, onChange, min, max }: {
  value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold hover:bg-neutral-200 transition-colors text-lg leading-none"
      >−</button>
      <span className="flex-1 text-center text-base font-bold text-neutral-900">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold hover:bg-neutral-200 transition-colors text-lg leading-none"
      >+</button>
    </div>
  );
}

export default function EditListingClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedId = typeof window !== "undefined"
    ? window.location.pathname.split("/host/edit/")[1]?.split("/")[0]
    : "";
  const { id: paramId } = use(params);
  const id = resolvedId || paramId;
  return <AuthGuard><EditListingContent id={id} /></AuthGuard>;
}
