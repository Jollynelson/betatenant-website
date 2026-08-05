"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { locationData } from "@/lib/locations";
import {
  Bath, Bed, Tv, Upload, X, Loader2, Check, ChevronRight,
  Video, Play, AlertCircle, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FileEntry {
  id: number;
  url: string;
  file: File | null;
  fileName: string;
  progress?: number;  // 0-100, undefined = done
  error?: string;
}

interface Amenity {
  _id: string;
  name: string;
  slug: string;
}

interface HouseRule {
  _id: string;
  name: string;
  slug: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const APARTMENT_TYPES = [
  { label: "Single room/Shared apartment", value: "single-room/shared-apartment" },
  { label: "Self Contained Apartment", value: "self-contained" },
  { label: "Mini flat/One bedroom", value: "mini-flat/one-bedroom" },
  { label: "Two bedroom flat", value: "two-bedroom" },
  { label: "Three bedroom flat", value: "three-bedroom" },
  { label: "Four bedroom flat", value: "four-bedroom" },
  { label: "Big family house/4+ Bedrooms", value: "big-family-house-4plus" },
] as const;

const STEPS = ["Create Listing", "Pricing", "Preview"] as const;

function makeId() {
  return Math.floor(Math.random() * 100000);
}

function formatCurrency(n: number): string {
  if (!n && n !== 0) return "0";
  return n.toLocaleString("en-NG");
}

function safeParse(val: string): number {
  const cleaned = String(val || "0").replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
}

// ── Upload helpers ────────────────────────────────────────────────────────────

// Client-side image compression before upload (reduces size for slow networks)
async function compressImage(file: File, maxSizePx = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxSizePx / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(width  * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// Upload a single file with XHR so we get progress events, with retry
async function uploadSingleFile(
  file: File,
  onProgress: (pct: number) => void,
  retries = 2
): Promise<string> {
  const token = localStorage.getItem("BT_TOKEN");
  const apiBase = window.location.hostname === "localhost"
    ? "/api/bt" : "https://api.betatenant.com";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const formData = new FormData();
        formData.append("files", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/v1/user/aws-upload`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.data?.[0]) {
              resolve(data.data[0]);
            } else {
              reject(new Error(data.message || `Upload failed (${xhr.status})`));
            }
          } catch { reject(new Error("Invalid server response")); }
        };
        xhr.onerror = () => reject(new Error("Network error — check your connection"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));
        xhr.timeout = 120_000; // 2 min timeout per file
        xhr.send(formData);
      });
      return url;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); // backoff
    }
  }
  throw new Error("Upload failed after retries");
}

// Draft persistence key
const DRAFT_KEY = "BT_LISTING_DRAFT";

// ── Step 1: Create Listing ────────────────────────────────────────────────────
function StepCreate({
  onNext,
}: {
  onNext: (propertyId: string, propertyDetails: any) => void;
}) {
  const [apartmentType, setApartmentType] = useState("");
  const [roomCount, setRoomCount] = useState(0);
  const [bathroomCount, setBathroomCount] = useState(0);
  const [livingRoomCount, setLivingRoomCount] = useState(0);
  const [streetAddress, setStreetAddress] = useState("");
  const [closeLandmark, setCloseLandmark] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyLGA, setPropertyLGA] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [photoURLs, setPhotoURLs] = useState<FileEntry[]>([]);
  const [houseName, setHouseName] = useState("");
  const [houseDescription, setHouseDescription] = useState("");

  const [videoURLs, setVideoURLs] = useState<FileEntry[]>([]);

  const [amenityList, setAmenityList] = useState<Amenity[]>([]);
  const [houseRuleList, setHouseRuleList] = useState<HouseRule[]>([]);
  const [isImageDeleting, setImageDeleting] = useState(false);
  const [isCreating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const uploadingCount = photoURLs.filter((p) => p.progress !== undefined).length
    + videoURLs.filter((v) => v.progress !== undefined).length;
  const hasUploadErrors = photoURLs.some((p) => p.error) || videoURLs.some((v) => v.error);

  // fetch amenities + house rules
  useEffect(() => {
    api.get<any>("/v1/user/amenities/rent").then((d) => setAmenityList(d.amenities ?? [])).catch(() => {});
    api.get<any>("/v1/user/houserules/rent").then((d) => setHouseRuleList(d.houseRules ?? [])).catch(() => {});
  }, []);

  // ── Draft: save to localStorage on every field change ──────────────────────
  useEffect(() => {
    const draft = {
      apartmentType, roomCount, bathroomCount, livingRoomCount,
      streetAddress, closeLandmark, propertyState, propertyLGA,
      amenities, houseRules,
      photoURLs: photoURLs.filter((p) => p.progress === undefined && !p.error).map((p) => ({ url: p.url, fileName: p.fileName, id: p.id })),
      videoURLs: videoURLs.filter((v) => v.progress === undefined && !v.error).map((v) => ({ url: v.url, fileName: v.fileName, id: v.id })),
      houseName, houseDescription,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [apartmentType, roomCount, bathroomCount, livingRoomCount, streetAddress, closeLandmark,
      propertyState, propertyLGA, amenities, houseRules, photoURLs, videoURLs, houseName, houseDescription]);

  // ── Draft: restore on mount ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.apartmentType)   setApartmentType(d.apartmentType);
      if (d.roomCount)       setRoomCount(d.roomCount);
      if (d.bathroomCount)   setBathroomCount(d.bathroomCount);
      if (d.livingRoomCount) setLivingRoomCount(d.livingRoomCount);
      if (d.streetAddress)   setStreetAddress(d.streetAddress);
      if (d.closeLandmark)   setCloseLandmark(d.closeLandmark);
      if (d.propertyState)   setPropertyState(d.propertyState);
      if (d.propertyLGA)     setPropertyLGA(d.propertyLGA);
      if (d.houseName)       setHouseName(d.houseName);
      if (d.houseDescription) setHouseDescription(d.houseDescription);
      if (Array.isArray(d.amenities))  setAmenities(d.amenities);
      if (Array.isArray(d.houseRules)) setHouseRules(d.houseRules);
      if (Array.isArray(d.photoURLs) && d.photoURLs.length > 0)
        setPhotoURLs(d.photoURLs.map((p: any) => ({ ...p, file: null })));
      if (Array.isArray(d.videoURLs) && d.videoURLs.length > 0)
        setVideoURLs(d.videoURLs.map((v: any) => ({ ...v, file: null })));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setError("");
    const files = Array.from(e.target.files).filter((f) => !photoURLs.find((p) => p.fileName === f.name));
    if (!files.length) return;

    // Add placeholder entries with progress=0
    const placeholders: FileEntry[] = files.map((f) => ({
      id: makeId(), file: f, fileName: f.name, url: "", progress: 0,
    }));
    setPhotoURLs((prev) => [...prev, ...placeholders]);
    e.target.value = "";

    // Upload each file individually with progress tracking
    for (const placeholder of placeholders) {
      try {
        const compressed = await compressImage(placeholder.file!);
        const url = await uploadSingleFile(compressed, (pct) => {
          setPhotoURLs((prev) => prev.map((p) => p.id === placeholder.id ? { ...p, progress: pct } : p));
        });
        setPhotoURLs((prev) => prev.map((p) => p.id === placeholder.id ? { ...p, url, progress: undefined, error: undefined } : p));
      } catch (err: any) {
        setPhotoURLs((prev) => prev.map((p) => p.id === placeholder.id ? { ...p, progress: undefined, error: err.message || "Upload failed" } : p));
      }
    }
  };

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setError("");
    const files = Array.from(e.target.files).filter((f) => !videoURLs.find((v) => v.fileName === f.name));
    if (!files.length) return;

    const placeholders: FileEntry[] = files.map((f) => ({
      id: makeId(), file: f, fileName: f.name, url: "", progress: 0,
    }));
    setVideoURLs((prev) => [...prev, ...placeholders]);
    e.target.value = "";

    for (const placeholder of placeholders) {
      try {
        const url = await uploadSingleFile(placeholder.file!, (pct) => {
          setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id ? { ...v, progress: pct } : v));
        });
        setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id ? { ...v, url, progress: undefined, error: undefined } : v));
      } catch (err: any) {
        setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id ? { ...v, progress: undefined, error: err.message || "Upload failed" } : v));
      }
    }
  };

  const retryUpload = async (entry: FileEntry, type: "photo" | "video") => {
    if (!entry.file) return;
    const setter = type === "photo" ? setPhotoURLs : setVideoURLs;
    setter((prev) => prev.map((p) => p.id === entry.id ? { ...p, error: undefined, progress: 0 } : p));
    try {
      const file = type === "photo" ? await compressImage(entry.file) : entry.file;
      const url = await uploadSingleFile(file, (pct) => {
        setter((prev) => prev.map((p) => p.id === entry.id ? { ...p, progress: pct } : p));
      });
      setter((prev) => prev.map((p) => p.id === entry.id ? { ...p, url, progress: undefined, error: undefined } : p));
    } catch (err: any) {
      setter((prev) => prev.map((p) => p.id === entry.id ? { ...p, progress: undefined, error: err.message } : p));
    }
  };

  const removeImage = useCallback(async (id: number) => {
    const entry = photoURLs.find((p) => p.id === id);
    if (!entry) return;
    setImageDeleting(true);
    try {
      const token = localStorage.getItem("BT_TOKEN");
      const filename = entry.url.split("/").at(-1);
      await fetch(`/api/bt/v1/landlordandagent/file/${filename}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPhotoURLs((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to remove image.");
    } finally {
      setImageDeleting(false);
    }
  }, [photoURLs]);

  const toggleAmenity = (id: string) =>
    setAmenities((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const toggleRule = (id: string) =>
    setHouseRules((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

  const handleSubmit = async () => {
    setError("");

    if (!apartmentType) return setError("Please select an apartment type.");
    if (!streetAddress) return setError("Street address is required.");
    if (!closeLandmark) return setError("Closest landmark is required.");
    if (!propertyState) return setError("Please select a state.");
    if (!propertyLGA) return setError("Please select a town/LGA.");
    if (!houseName) return setError("House name is required.");
    if (!houseDescription) return setError("Description is required.");
    const readyPhotos = photoURLs.filter((p) => p.url && !p.error && p.progress === undefined);
    if (uploadingCount > 0) return setError("Please wait for all uploads to finish.");
    if (hasUploadErrors) return setError("Some files failed to upload. Retry or remove them.");
    if (readyPhotos.length < 5) return setError("Please upload at least 5 photos.");

    const readyVideos = videoURLs.filter((v) => v.url && !v.error && v.progress === undefined);

    const form = {
      rentType: "rent",
      apartmentType,
      roomCount,
      bathroomCount,
      livingRoomCount,
      allowedGuestCount: 0,
      rentAmount: 0,
      streetAddress,
      closeLandmark,
      propertyLGA,
      propertyState,
      amenities,
      houseRules,
      photoURLs: readyPhotos.map((p) => p.url),
      videoURLs: readyVideos.map((v) => v.url),
      houseName,
      houseDescription,
    };

    setCreating(true);
    try {
      const res = await api.post<any>("/v1/landlordandagent/create-listing", form);
      const propertyDetails = res?.propertyDetails ?? res;
      const propertyId: string = res?.propertyId ?? propertyDetails?._id ?? "";
      sessionStorage.setItem("propertyToEdit", JSON.stringify(propertyDetails));
      localStorage.removeItem(DRAFT_KEY); // clear draft on success
      onNext(propertyId, propertyDetails);
    } catch (err: any) {
      setError(err.message || "Failed to create listing. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const citiesForState = locationData.find((l) => l.state === propertyState)?.cities ?? [];

  return (
    <div className="space-y-10">
      {/* Apartment Type */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Apartment basics</h2>
            <p className="text-sm text-neutral-500 mt-1">Share some information about your listing</p>
          </div>
          <div className="flex-1 min-w-64">
            <p className="font-medium text-neutral-800 mb-3">
              Is this an entire apartment or shared? <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {APARTMENT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                    apartmentType === t.value
                      ? "border-bt-primary bg-bt-primary/5 text-bt-primary font-medium"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="apartmentType"
                    value={t.value}
                    checked={apartmentType === t.value}
                    onChange={(e) => {
                      setApartmentType(e.target.value);
                      if (e.target.value === "self-contained") {
                        if (roomCount === 0) setRoomCount(1);
                        if (bathroomCount === 0) setBathroomCount(1);
                        if (livingRoomCount === 0) setLivingRoomCount(1);
                      }
                    }}
                    className="sr-only"
                  />
                  {apartmentType === t.value && <Check className="w-3.5 h-3.5" />}
                  {t.label}
                </label>
              ))}
            </div>

            {/* Counts */}
            <div className="mt-6 space-y-4">
              {[
                { label: "Rooms", sub: "Number of available rooms", icon: Bed, val: roomCount, set: setRoomCount },
                { label: "Bathrooms", sub: "Number of available bathrooms", icon: Bath, val: bathroomCount, set: setBathroomCount },
                { label: "Living Rooms", sub: "Number of living rooms", icon: Tv, val: livingRoomCount, set: setLivingRoomCount },
              ].map(({ label, sub, icon: Icon, val, set }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-bt-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{label}</p>
                      <p className="text-xs text-neutral-500">{sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set(Math.max(0, val - 1))}
                      disabled={val === 0}
                      className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-medium">{val}</span>
                    <button
                      type="button"
                      onClick={() => set(val + 1)}
                      className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Location information</h2>
            <p className="text-sm text-neutral-500 mt-1">Where is your listing located?</p>
          </div>
          <div className="flex-1 min-w-64 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Enter street address"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Closest Landmark <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={closeLandmark}
                onChange={(e) => setCloseLandmark(e.target.value)}
                placeholder="Enter a nearby landmark"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">State</label>
              <select
                value={propertyState}
                onChange={(e) => { setPropertyState(e.target.value); setPropertyLGA(""); }}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
              >
                <option value="">Select a state</option>
                {locationData.map((l) => (
                  <option key={l.state} value={l.state}>{l.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Town/LGA</label>
              <select
                value={propertyLGA}
                onChange={(e) => setPropertyLGA(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
              >
                <option value="">Select a city</option>
                {citiesForState.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities & House Rules */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Amenities & House rules</h2>
            <p className="text-sm text-neutral-500 mt-1">Amenities you have, and rules?</p>
          </div>
          <div className="flex-1 min-w-64">
            <p className="text-sm font-semibold text-neutral-700 mb-3">Amenities</p>
            <div className="flex flex-wrap gap-2 pb-6">
              {amenityList.map((a) => (
                <label
                  key={a._id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
                    amenities.includes(a._id)
                      ? "border-bt-primary bg-bt-primary/5 text-bt-primary"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(a._id)}
                    onChange={() => toggleAmenity(a._id)}
                    className="sr-only"
                  />
                  {amenities.includes(a._id) && <Check className="w-3 h-3" />}
                  {a.name}
                </label>
              ))}
            </div>
            <p className="text-sm font-semibold text-neutral-700 mb-3 pt-4 border-t border-neutral-100">House Rules</p>
            <div className="flex flex-wrap gap-2">
              {houseRuleList.map((r) => (
                <label
                  key={r._id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
                    houseRules.includes(r._id)
                      ? "border-bt-primary bg-bt-primary/5 text-bt-primary"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={houseRules.includes(r._id)}
                    onChange={() => toggleRule(r._id)}
                    className="sr-only"
                  />
                  {houseRules.includes(r._id) && <Check className="w-3 h-3" />}
                  {r.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Photo Upload */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Photos</h2>
            <p className="text-sm text-neutral-500 mt-1">At least 5 photos required. Images are auto-compressed for fast upload.</p>
          </div>
          <div className="flex-1 min-w-64">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-neutral-700">
                Photos ({photoURLs.filter(p => p.url && !p.error).length}/5 minimum)
                <span className="text-red-500"> *</span>
              </p>
              {isImageDeleting && <span className="text-xs text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Removing…</span>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {/* Upload trigger */}
              <label
                htmlFor="photo-upload"
                className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 hover:border-bt-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer bg-neutral-50 hover:bg-bt-primary/4 transition-colors"
              >
                <Upload className="w-5 h-5 text-neutral-400" />
                <span className="text-xs text-neutral-500 text-center leading-tight px-1">Add photos</span>
              </label>
              <input type="file" id="photo-upload" accept="image/*" multiple className="hidden" onChange={handleImageChange} />

              {photoURLs.map((p) => (
                <div key={p.id} className="aspect-square relative rounded-xl overflow-hidden bg-neutral-100">
                  {/* Uploaded image */}
                  {p.url && !p.error && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt="Upload" className="w-full h-full object-cover" />
                  )}

                  {/* Progress overlay */}
                  {p.progress !== undefined && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 p-2">
                      <div className="w-full bg-white/20 rounded-full h-1.5">
                        <div className="bg-white h-1.5 rounded-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-white text-[10px] font-medium">{p.progress}%</span>
                    </div>
                  )}

                  {/* Error overlay with retry */}
                  {p.error && (
                    <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center gap-1 p-2">
                      <AlertCircle className="w-4 h-4 text-white" />
                      <span className="text-white text-[9px] text-center leading-tight">{p.error}</span>
                      {p.file && (
                        <button type="button" onClick={() => retryUpload(p, "photo")} className="mt-1 flex items-center gap-1 text-[10px] text-white bg-white/20 rounded px-1.5 py-0.5">
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  )}

                  {/* Remove button (only when not uploading) */}
                  {p.progress === undefined && !p.error && (
                    <button type="button" onClick={() => removeImage(p.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2">Photos are automatically compressed. Supports JPG, PNG, HEIC.</p>
          </div>
        </div>
      </section>

      {/* Video Upload */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Video <span className="text-neutral-400 font-normal text-sm">(optional)</span></h2>
            <p className="text-sm text-neutral-500 mt-1">A short walkthrough video greatly increases interest. Max 1 video.</p>
          </div>
          <div className="flex-1 min-w-64">
            {videoURLs.length === 0 ? (
              <label
                htmlFor="video-upload"
                className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-neutral-200 hover:border-bt-primary/40 cursor-pointer bg-neutral-50 hover:bg-bt-primary/4 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-bt-primary/8 flex items-center justify-center">
                  <Video className="w-5 h-5 text-bt-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-700">Upload a video tour</p>
                  <p className="text-xs text-neutral-400 mt-0.5">MP4, MOV — up to 500MB</p>
                </div>
              </label>
            ) : (
              <div className="space-y-2">
                {videoURLs.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white">
                    <div className="w-10 h-10 rounded-lg bg-bt-primary/8 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-bt-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{v.fileName}</p>
                      {v.progress !== undefined && (
                        <div className="mt-1.5">
                          <div className="w-full bg-neutral-100 rounded-full h-1.5">
                            <div className="bg-bt-primary h-1.5 rounded-full transition-all" style={{ width: `${v.progress}%` }} />
                          </div>
                          <span className="text-xs text-neutral-400">{v.progress}% — uploading…</span>
                        </div>
                      )}
                      {v.error && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {v.error}
                          {v.file && <button type="button" onClick={() => retryUpload(v, "video")} className="ml-1 underline">Retry</button>}
                        </p>
                      )}
                      {!v.progress && !v.error && v.url && <p className="text-xs text-bt-success">✓ Uploaded</p>}
                    </div>
                    {v.progress === undefined && (
                      <button type="button" onClick={() => setVideoURLs((prev) => prev.filter((x) => x.id !== v.id))} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <input type="file" id="video-upload" accept="video/*" className="hidden" onChange={handleVideoChange} />
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="pb-4">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Description</h2>
            <p className="text-sm text-neutral-500 mt-1">What should we call your listing?</p>
          </div>
          <div className="flex-1 min-w-64 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                House Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                placeholder="Give your listing a name"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={houseDescription}
                onChange={(e) => setHouseDescription(e.target.value)}
                placeholder="Describe your listing"
                rows={4}
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bt-primary/30 resize-none"
              />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isCreating ? "Creating..." : "Save & Continue"}
          {!isCreating && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Pricing ────────────────────────────────────────────────────────────
function StepPricing({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [listingFee, setListingFee] = useState("0");
  const [cautionFee, setCautionFee] = useState("0");
  const [inspectionFee, setInspectionFee] = useState("0");
  const [serviceCharge, setServiceCharge] = useState("0");
  const [lawyerFee, setLawyerFee] = useState("0");
  const [cleaningFee, setCleaningFee] = useState("0");
  const [isUpdating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("propertyToEdit");
    if (raw) {
      const p = JSON.parse(raw);
      setListingFee(formatCurrency(safeParse(String(p?.listingFee ?? 0))));
      setCautionFee(formatCurrency(safeParse(String(p?.cautionFee ?? 0))));
      setInspectionFee(formatCurrency(safeParse(String(p?.inspectionFee ?? 0))));
      setServiceCharge(formatCurrency(safeParse(String(p?.serviceCharge ?? 0))));
      setLawyerFee(formatCurrency(safeParse(String(p?.lawyerFee ?? 0))));
      setCleaningFee(formatCurrency(safeParse(String(p?.cleaningFee ?? 0))));
    }
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    const raw = e.target.value.replace(/[^\d]/g, "") || "0";
    setter(formatCurrency(parseInt(raw)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const raw = sessionStorage.getItem("propertyToEdit");
    if (!raw) return setError("Property data missing. Please go back and try again.");
    const p = JSON.parse(raw);
    const propertyId: string = p._id;

    if (!propertyId) return setError("Property ID missing. Please go back.");

    const token = localStorage.getItem("BT_TOKEN");
    if (!token) return setError("Not authenticated. Please log in again.");

    const serviceChargeNum = safeParse(serviceCharge);
    const data = {
      listingFee: safeParse(listingFee),
      cautionFee: safeParse(cautionFee),
      inspectionFee: safeParse(inspectionFee),
      serviceCharge: serviceChargeNum,
      // publish endpoint validates serviceChargeFrequency as "monthly"|"yearly"|"N/A"
      serviceChargeFrequency: serviceChargeNum > 0 ? "yearly" : "N/A",
      lawyerFee: safeParse(lawyerFee),
      cleaningFee: safeParse(cleaningFee),
      additionalFee: 0,
    };

    setUpdating(true);
    try {
      const res = await fetch(`/api/bt/v1/landlordandagent/pricing/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update pricing");
      sessionStorage.setItem("propertyToEdit", JSON.stringify(json.propertyDetails));
      onNext();
    } catch (err: any) {
      setError(err.message || "Failed to update pricing.");
    } finally {
      setUpdating(false);
    }
  };

  const total = safeParse(listingFee) + safeParse(cautionFee) + safeParse(inspectionFee) + safeParse(serviceCharge) + safeParse(lawyerFee);

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
      <div className="bg-neutral-50 rounded-2xl p-6 text-center">
        <p className="text-sm text-neutral-500 mb-1">Rent per annum</p>
        <p className="text-4xl font-bold text-neutral-800">₦{listingFee}</p>
        <p className="text-sm text-neutral-500 mt-1">₦{formatCurrency(total)} total with all fees</p>
      </div>

      {[
        { id: "listingFee", label: "Rent per annum", val: listingFee, set: setListingFee, required: true },
        { id: "serviceCharge", label: "Service Charge (optional)", val: serviceCharge, set: setServiceCharge, required: false },
        { id: "lawyerFee", label: "Legal Fee (optional)", val: lawyerFee, set: setLawyerFee, required: false },
        { id: "inspectionFee", label: "Inspection Fee", val: inspectionFee, set: setInspectionFee, required: true },
        { id: "cautionFee", label: "Caution Fee (optional)", val: cautionFee, set: setCautionFee, required: false },
        { id: "cleaningFee", label: "Cleaning Fee (optional)", val: cleaningFee, set: setCleaningFee, required: false },
      ].map(({ id, label, val, set, required }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">₦</span>
            <input
              id={id}
              type="text"
              inputMode="numeric"
              value={val}
              onChange={(e) => handleChange(e, set)}
              className="w-full border border-neutral-200 rounded-xl pl-8 pr-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
            />
          </div>
        </div>
      ))}

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isUpdating ? "Saving..." : "Preview Listing"}
          {!isUpdating && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}

// ── Step 3: Preview ────────────────────────────────────────────────────────────
function StepPreview({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pricing" | "rules">("overview");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("propertyToEdit");
    if (!raw) { setLoading(false); return; }
    const p = JSON.parse(raw);
    const token = localStorage.getItem("BT_TOKEN");

    fetch(`/api/bt/v1/landlordandagent/preview/${p._id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setHouse(d.propertyDetails))
      .catch(() => setHouse(p))
      .finally(() => setLoading(false));
  }, []);

  const publish = async () => {
    if (!house?._id) return;
    setPublishing(true);
    setError("");
    try {
      const token = localStorage.getItem("BT_TOKEN");
      const res = await fetch(`/api/bt/v1/landlordandagent/publish/${house._id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed to publish.");
      }
      sessionStorage.removeItem("propertyToEdit");
      router.push("/host");
    } catch (err: any) {
      setError(err.message || "Failed to publish listing.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
      </div>
    );
  }

  if (!house) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>Could not load property preview. Please go back and try again.</p>
        <button onClick={onBack} className="mt-4 text-bt-primary font-medium hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Photo grid */}
      {house.photoURLs?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6">
          {house.photoURLs.slice(0, 5).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Photo ${i + 1}`}
              className={`w-full object-cover ${i === 0 ? "col-span-2 row-span-2 h-64" : "h-32"}`}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{house.houseName}</h1>
            <p className="text-neutral-500 text-sm mt-1">
              {house.streetAddress}, {house.propertyLGA}, {house.propertyState}
            </p>
            <p className="text-bt-primary font-bold text-lg mt-2">
              ₦{Number(house.listingFee ?? 0).toLocaleString()}/year
            </p>
          </div>

          {/* Tabs */}
          <div>
            <nav className="flex gap-1 border-b border-neutral-200 pb-0 mb-4">
              {(["overview", "pricing", "rules"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-bt-primary text-white"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {tab === "pricing" ? "Price Breakdown" : tab === "rules" ? "House Rules" : "Overview"}
                </button>
              ))}
            </nav>

            {activeTab === "overview" && (
              <div className="space-y-4">
                <p className="text-neutral-700 text-sm leading-relaxed">{house.houseDescription}</p>
                {house.amenities?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-800 mb-2">Amenities</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {house.amenities.map((a: any) => (
                        <li key={a._id ?? a} className="flex items-center gap-2 text-sm text-neutral-700">
                          <Check className="w-3.5 h-3.5 text-bt-primary" />
                          {typeof a === "string" ? a : a.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {activeTab === "pricing" && (
              <div className="space-y-3 text-sm">
                {[
                  ["Listing Fee", house.listingFee],
                  ["Caution Fee", house.cautionFee],
                  ["Inspection Fee", house.inspectionFee],
                  ["Service Charge", house.serviceCharge],
                  ["Legal Fee", house.lawyerFee],
                  ["Cleaning Fee", house.cleaningFee],
                ].map(([label, val]) =>
                  val ? (
                    <div key={label as string} className="flex justify-between border-b border-neutral-100 pb-2">
                      <span className="text-neutral-500">{label}</span>
                      <span className="font-medium">₦{Number(val).toLocaleString()}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}
            {activeTab === "rules" && (
              <ul className="grid grid-cols-2 gap-2">
                {house.houseRules?.map((r: any) => (
                  <li key={r._id ?? r} className="flex items-center gap-2 text-sm text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-bt-primary" />
                    {typeof r === "string" ? r : r.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 h-fit">
          <h3 className="font-semibold text-neutral-900 mb-3">Listing Summary</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Type</dt>
              <dd className="font-medium capitalize">{house.apartmentType?.replace(/-/g, " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Bedrooms</dt>
              <dd className="font-medium">{house.roomCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Bathrooms</dt>
              <dd className="font-medium">{house.bathroomCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">State</dt>
              <dd className="font-medium">{house.propertyState}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">LGA</dt>
              <dd className="font-medium">{house.propertyLGA}</dd>
            </div>
          </dl>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mt-4">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Edit Listing Details
        </button>
        <button
          type="button"
          onClick={publish}
          disabled={isPublishing}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60"
        >
          {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPublishing ? "Publishing..." : "Confirm & Publish"}
          {!isPublishing && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function NewListingContent() {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-bt-surface overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Create a New Listing</h1>
          <p className="text-neutral-500 text-sm mt-1">List your property on BetaTenant in 3 simple steps</p>
        </div>

        {/* Step indicator — flex with min-w-0 so labels don't overflow on mobile */}
        <div className="flex items-center mb-10 overflow-hidden">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors shrink-0 ${
                  i < step
                    ? "bg-bt-success text-white"
                    : i === step
                    ? "bg-bt-primary text-white"
                    : "bg-neutral-100 text-neutral-400"
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ${
                  i === step ? "text-neutral-900" : i < step ? "text-bt-success" : "text-neutral-400"
                }`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 min-w-[12px] transition-colors ${i < step ? "bg-bt-success" : "bg-neutral-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          {step === 0 && (
            <StepCreate
              onNext={(_id, _details) => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepPricing
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepPreview onBack={() => setStep(1)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <AuthGuard>
      <NewListingContent />
    </AuthGuard>
  );
}
