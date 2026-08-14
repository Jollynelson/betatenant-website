"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth-guard";
import { api, tenantSwitchApi } from "@/lib/api";
import { locationData } from "@/lib/locations";
import {
  Bath, Bed, Tv, Upload, X, Loader2, Check, ChevronRight,
  Video, AlertCircle, RefreshCw, Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FileEntry {
  id: number;
  url: string;
  thumbnail?: string;
  file: File | null;
  fileName: string;
  fileSize?: number;
  progress?: number;
  speedKBps?: number;
  error?: string;
  abortController?: AbortController;
}
interface Amenity  { _id: string; name: string; slug: string; }
interface HouseRule { _id: string; name: string; slug: string; }

// ── Constants ─────────────────────────────────────────────────────────────────
const APARTMENT_TYPES = [
  { label: "Single room/Shared apartment", value: "single-room/shared-apartment" },
  { label: "Self Contained Apartment",     value: "self-contained" },
  { label: "Mini flat/One bedroom",        value: "mini-flat/one-bedroom" },
  { label: "Two bedroom flat",             value: "two-bedroom" },
  { label: "Three bedroom flat",           value: "three-bedroom" },
  { label: "Four bedroom flat",            value: "four-bedroom" },
  { label: "Big family house/4+ Bedrooms", value: "big-family-house-4plus" },
] as const;

const STEPS = ["List My Space", "Pricing", "Preview"] as const;
const DRAFT_KEY = "BT_TS_LISTING_DRAFT";

function makeId() { return Math.floor(Math.random() * 100000); }
function formatCurrency(n: number): string { return !n && n !== 0 ? "0" : n.toLocaleString("en-NG"); }
function safeParse(val: string): number { return parseFloat(String(val || "0").replace(/[^\d.]/g, "")) || 0; }

// ── Network & Upload helpers (same as host/new) ────────────────────────────────
type NetworkTier = "fast" | "medium" | "slow";
function detectNetworkTier(): NetworkTier {
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection;
  if (!conn) return "medium";
  const t = conn.effectiveType as string;
  if (t === "4g") return "fast"; if (t === "3g") return "medium"; return "slow";
}
async function compressImage(file: File): Promise<{ file: File; savedBytes: number }> {
  if (!file.type.startsWith("image/")) return { file, savedBytes: 0 };
  const tier = detectNetworkTier();
  const cfg = { fast: { maxPx: 2560, q: 0.92 }, medium: { maxPx: 2048, q: 0.85 }, slow: { maxPx: 1600, q: 0.78 } }[tier];
  return new Promise((resolve) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, cfg.maxPx / Math.max(img.width, img.height));
      if (file.size < 800_000 && scale === 1) { resolve({ file, savedBytes: 0 }); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || blob.size >= file.size) { resolve({ file, savedBytes: 0 }); return; }
        resolve({ file: new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }), savedBytes: file.size - blob.size });
      }, "image/jpeg", cfg.q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ file, savedBytes: 0 }); };
    img.src = url;
  });
}
async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 400 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}
const CHUNK_SIZE = 5 * 1024 * 1024;
function getApiBase() { return window.location.hostname === "localhost" ? "/api/bt" : "https://api.betatenant.com"; }
function getToken()   { return localStorage.getItem("BT_TOKEN"); }
async function uploadFileChunked(file: File, onProgress: (p: number, s?: number) => void, signal?: AbortSignal): Promise<string> {
  return file.size <= CHUNK_SIZE ? uploadDirect(file, onProgress, signal) : uploadMultipart(file, onProgress, signal);
}
async function uploadDirect(file: File, onProgress: (p: number) => void, signal?: AbortSignal, retries = 3): Promise<string> {
  let last: Error = new Error("Upload failed");
  for (let i = 0; i <= retries; i++) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    if (i > 0) await new Promise(r => setTimeout(r, 1000 * 2 ** (i - 1)));
    try {
      return await new Promise<string>((res, rej) => {
        const fd = new FormData(); fd.append("files", file);
        const xhr = new XMLHttpRequest(); xhr.open("POST", `${getApiBase()}/v1/user/aws-upload`);
        const tok = getToken(); if (tok) xhr.setRequestHeader("Authorization", `Bearer ${tok}`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => { try { const d = JSON.parse(xhr.responseText); if (xhr.status < 300 && d.data?.[0]) res(d.data[0]); else rej(new Error(d.message || `HTTP ${xhr.status}`)); } catch { rej(new Error("Invalid response")); } };
        xhr.onerror = () => rej(new Error("Network error")); xhr.timeout = 90_000; xhr.ontimeout = () => rej(new Error("Timed out"));
        signal?.addEventListener("abort", () => xhr.abort(), { once: true }); xhr.send(fd);
      });
    } catch (e: any) { last = e; if (e.message?.includes("401") || e.message?.includes("403")) throw e; }
  }
  throw last;
}
async function uploadMultipart(file: File, onProgress: (p: number, s?: number) => void, signal?: AbortSignal): Promise<string> {
  const base = getApiBase(); const tok = getToken();
  const hdrs: Record<string, string> = { "Content-Type": "application/json" };
  if (tok) hdrs["Authorization"] = `Bearer ${tok}`;
  const init = await fetch(`${base}/v1/user/upload/init-multipart`, { method: "POST", headers: hdrs, body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }), signal });
  if (!init.ok) throw new Error((await init.json().catch(() => ({}))).message || "Failed to start upload");
  const { data: { uploadId, key } } = await init.json();
  const chunks = Math.ceil(file.size / CHUNK_SIZE); const parts: any[] = []; const t0 = Date.now();
  for (let i = 0; i < chunks; i++) {
    if (signal?.aborted) { fetch(`${base}/v1/user/upload/abort`, { method: "POST", headers: hdrs, body: JSON.stringify({ key, uploadId }) }).catch(() => {}); throw new Error("Upload cancelled"); }
    const start = i * CHUNK_SIZE; const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
    const part = await new Promise<any>((res, rej) => {
      const fd = new FormData(); fd.append("chunk", new File([chunk], file.name)); fd.append("key", key); fd.append("uploadId", uploadId); fd.append("partNumber", String(i + 1));
      const xhr = new XMLHttpRequest(); xhr.open("POST", `${base}/v1/user/upload/chunk`);
      if (tok) xhr.setRequestHeader("Authorization", `Bearer ${tok}`);
      xhr.upload.onprogress = e => { if (e.lengthComputable) { const overall = ((start + chunk.size * e.loaded / e.total) / file.size) * 100; const spd = Math.round((start + chunk.size * e.loaded / e.total) / 1024 / ((Date.now() - t0) / 1000)); onProgress(Math.round(overall), spd); } };
      xhr.onload = () => { try { const d = JSON.parse(xhr.responseText); if (xhr.status < 300 && d.data) res(d.data); else rej(new Error(d.message || `HTTP ${xhr.status}`)); } catch { rej(new Error("Invalid")); } };
      xhr.onerror = () => rej(new Error("Network error")); xhr.timeout = 120_000; signal?.addEventListener("abort", () => xhr.abort(), { once: true }); xhr.send(fd);
    });
    parts.push(part);
  }
  const complete = await fetch(`${base}/v1/user/upload/complete`, { method: "POST", headers: hdrs, body: JSON.stringify({ key, uploadId, parts }), signal });
  if (!complete.ok) throw new Error("Failed to finalize upload");
  onProgress(100);
  return (await complete.json()).data.url;
}

// ── Step 1: Create Listing ────────────────────────────────────────────────────
function StepCreate({ onNext, existingId }: { onNext: (id: string, details: any) => void; existingId?: string }) {
  const [apartmentType, setApartmentType]   = useState("");
  const [roomCount, setRoomCount]           = useState(1);
  const [bathroomCount, setBathroomCount]   = useState(1);
  const [livingRoomCount, setLivingRoomCount] = useState(0);
  const [streetAddress, setStreetAddress]   = useState("");
  const [closeLandmark, setCloseLandmark]   = useState("");
  const [propertyState, setPropertyState]   = useState("");
  const [propertyLGA, setPropertyLGA]       = useState("");
  const [amenities, setAmenities]           = useState<string[]>([]);
  const [houseRules, setHouseRules]         = useState<string[]>([]);
  const [photoURLs, setPhotoURLs]           = useState<FileEntry[]>([]);
  const [videoURLs, setVideoURLs]           = useState<FileEntry[]>([]);
  const [houseName, setHouseName]           = useState("");
  const [houseDescription, setHouseDescription] = useState("");
  const [moveOutDate, setMoveOutDate]       = useState("");
  const [tenantGender, setTenantGender]     = useState<"male" | "female" | "any">("any");

  const [amenityList, setAmenityList]   = useState<Amenity[]>([]);
  const [houseRuleList, setHouseRuleList] = useState<HouseRule[]>([]);
  const [isImageDeleting, setImageDeleting] = useState(false);
  const [isCreating, setCreating]           = useState(false);
  const [error, setError]                   = useState("");

  const uploadingCount = photoURLs.filter(p => p.progress !== undefined).length + videoURLs.filter(v => v.progress !== undefined).length;
  const hasUploadErrors = photoURLs.some(p => p.error) || videoURLs.some(v => v.error);

  useEffect(() => {
    api.get<any>("/v1/user/amenities/rent").then(d => setAmenityList(d.amenities ?? [])).catch(() => {});
    api.get<any>("/v1/user/houserules/rent").then(d => setHouseRuleList(d.houseRules ?? [])).catch(() => {});
  }, []);

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY); if (!raw) return;
      const d = JSON.parse(raw);
      if (d.apartmentType)    setApartmentType(d.apartmentType);
      if (d.roomCount)        setRoomCount(d.roomCount);
      if (d.bathroomCount)    setBathroomCount(d.bathroomCount);
      if (d.livingRoomCount)  setLivingRoomCount(d.livingRoomCount);
      if (d.streetAddress)    setStreetAddress(d.streetAddress);
      if (d.closeLandmark)    setCloseLandmark(d.closeLandmark);
      if (d.propertyState)    setPropertyState(d.propertyState);
      if (d.propertyLGA)      setPropertyLGA(d.propertyLGA);
      if (d.houseName)        setHouseName(d.houseName);
      if (d.houseDescription) setHouseDescription(d.houseDescription);
      if (d.moveOutDate)      setMoveOutDate(d.moveOutDate);
      if (d.tenantGender)     setTenantGender(d.tenantGender);
      if (Array.isArray(d.amenities))  setAmenities(d.amenities);
      if (Array.isArray(d.houseRules)) setHouseRules(d.houseRules);
      if (Array.isArray(d.photoURLs) && d.photoURLs.length)
        setPhotoURLs(d.photoURLs.map((p: any) => ({ ...p, file: null })));
      if (Array.isArray(d.videoURLs) && d.videoURLs.length)
        setVideoURLs(d.videoURLs.map((v: any) => ({ ...v, file: null })));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft
  useEffect(() => {
    const draft = {
      apartmentType, roomCount, bathroomCount, livingRoomCount,
      streetAddress, closeLandmark, propertyState, propertyLGA,
      amenities, houseRules, houseName, houseDescription, moveOutDate, tenantGender,
      photoURLs: photoURLs.filter(p => p.progress === undefined && !p.error).map(p => ({ url: p.url, fileName: p.fileName, id: p.id })),
      videoURLs: videoURLs.filter(v => v.progress === undefined && !v.error).map(v => ({ url: v.url, fileName: v.fileName, id: v.id })),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [apartmentType, roomCount, bathroomCount, livingRoomCount, streetAddress, closeLandmark,
      propertyState, propertyLGA, amenities, houseRules, photoURLs, videoURLs,
      houseName, houseDescription, moveOutDate, tenantGender]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return; setError("");
    const files = Array.from(e.target.files).filter(f => !photoURLs.find(p => p.fileName === f.name));
    if (!files.length) return; e.target.value = "";
    const withThumbs = await Promise.all(files.map(async f => ({ id: makeId(), file: f, fileName: f.name, fileSize: f.size, url: "", thumbnail: await generateThumbnail(f), progress: 0 })));
    setPhotoURLs(prev => [...prev, ...withThumbs]);
    for (const entry of withThumbs) {
      const abort = new AbortController();
      setPhotoURLs(prev => prev.map(p => p.id === entry.id ? { ...p, abortController: abort } : p));
      try {
        const { file: compressed, savedBytes } = await compressImage(entry.file!);
        if (savedBytes > 100_000) {
          setPhotoURLs(prev => prev.map(p => p.id === entry.id ? { ...p, error: `Optimised (-${(savedBytes / 1024 / 1024).toFixed(1)}MB)` } : p));
          await new Promise(r => setTimeout(r, 1200));
          setPhotoURLs(prev => prev.map(p => p.id === entry.id ? { ...p, error: undefined } : p));
        }
        const url = await uploadFileChunked(compressed, (pct, spd) => setPhotoURLs(prev => prev.map(p => p.id === entry.id ? { ...p, progress: pct, speedKBps: spd } : p)), abort.signal);
        setPhotoURLs(prev => prev.map(p => p.id === entry.id ? { ...p, url, progress: undefined, error: undefined, abortController: undefined } : p));
      } catch (err: any) {
        if (err.message === "Upload cancelled") return;
        setPhotoURLs(prev => prev.map(p => p.id === entry.id ? { ...p, progress: undefined, error: err.message || "Upload failed", abortController: undefined } : p));
      }
    }
  };

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return; setError("");
    const files = Array.from(e.target.files).filter(f => !videoURLs.find(v => v.fileName === f.name));
    if (!files.length) return; e.target.value = "";
    const placeholders: FileEntry[] = files.map(f => ({ id: makeId(), file: f, fileName: f.name, fileSize: f.size, url: "", progress: 0 }));
    setVideoURLs(prev => [...prev, ...placeholders]);
    for (const ph of placeholders) {
      const abort = new AbortController();
      setVideoURLs(prev => prev.map(v => v.id === ph.id ? { ...v, abortController: abort } : v));
      try {
        const url = await uploadFileChunked(ph.file!, (pct, spd) => setVideoURLs(prev => prev.map(v => v.id === ph.id ? { ...v, progress: pct, speedKBps: spd } : v)), abort.signal);
        setVideoURLs(prev => prev.map(v => v.id === ph.id ? { ...v, url, progress: undefined, error: undefined, abortController: undefined } : v));
      } catch (err: any) {
        if (err.message === "Upload cancelled") return;
        setVideoURLs(prev => prev.map(v => v.id === ph.id ? { ...v, progress: undefined, error: err.message || "Upload failed", abortController: undefined } : v));
      }
    }
  };

  const cancelUpload = (entry: FileEntry, type: "photo" | "video") => {
    entry.abortController?.abort();
    (type === "photo" ? setPhotoURLs : setVideoURLs)(prev => prev.filter(p => p.id !== entry.id));
  };

  const retryUpload = async (entry: FileEntry, type: "photo" | "video") => {
    if (!entry.file) return;
    const setter = type === "photo" ? setPhotoURLs : setVideoURLs;
    const abort = new AbortController();
    setter(prev => prev.map(p => p.id === entry.id ? { ...p, error: undefined, progress: 0, abortController: abort } : p));
    try {
      const file = type === "photo" ? (await compressImage(entry.file)).file : entry.file;
      const url = await uploadFileChunked(file, (pct, spd) => setter(prev => prev.map(p => p.id === entry.id ? { ...p, progress: pct, speedKBps: spd } : p)), abort.signal);
      setter(prev => prev.map(p => p.id === entry.id ? { ...p, url, progress: undefined, error: undefined, abortController: undefined } : p));
    } catch (err: any) {
      if (err.message === "Upload cancelled") return;
      setter(prev => prev.map(p => p.id === entry.id ? { ...p, progress: undefined, error: err.message, abortController: undefined } : p));
    }
  };

  const removeImage = useCallback(async (id: number) => {
    const entry = photoURLs.find(p => p.id === id); if (!entry) return;
    setImageDeleting(true);
    try {
      const tok = localStorage.getItem("BT_TOKEN");
      const filename = entry.url.split("/").at(-1);
      await fetch(`/api/bt/v1/landlordandagent/file/${filename}`, { method: "DELETE", headers: tok ? { Authorization: `Bearer ${tok}` } : {} });
      setPhotoURLs(prev => prev.filter(p => p.id !== id));
    } catch { setError("Failed to remove image."); }
    finally { setImageDeleting(false); }
  }, [photoURLs]);

  const handleSubmit = async () => {
    setError("");
    if (!apartmentType)    return setError("Please select an apartment type.");
    if (!streetAddress)    return setError("Street address is required.");
    if (!closeLandmark)    return setError("Closest landmark is required.");
    if (!propertyState)    return setError("Please select a state.");
    if (!propertyLGA)      return setError("Please select a town/LGA.");
    if (!houseName)        return setError("House name is required.");
    if (!houseDescription) return setError("Description is required.");
    if (!moveOutDate)      return setError("Please select your move-out date.");
    if (uploadingCount > 0) return setError("Please wait for uploads to finish.");
    if (hasUploadErrors)   return setError("Some files failed. Retry or remove them.");
    const readyPhotos = photoURLs.filter(p => p.url && !p.error && p.progress === undefined);
    if (readyPhotos.length < 3) return setError("Please upload at least 3 photos.");

    const readyVideos = videoURLs.filter(v => v.url && !v.error && v.progress === undefined);
    const form: Record<string, any> = {
      rentType: "tenant-switch",
      apartmentType, roomCount, bathroomCount, livingRoomCount,
      allowedGuestCount: 0,
      streetAddress, closeLandmark, propertyLGA, propertyState,
      amenities, houseRules,
      photoURLs: readyPhotos.map(p => p.url),
      houseName, houseDescription,
      moveOutDate, tenantGender,
    };
    if (readyVideos.length > 0) form.videoURLs = readyVideos.map(v => v.url);

    setCreating(true);
    try {
      // If editing existing, use PUT; otherwise create new
      let res: any;
      if (existingId) {
        res = await api.put<any>(`/v1/landlordandagent/my-listings/${existingId}`, { ...form, propertyState, propertyLGA });
        const details = res?.updatedProperty ?? res;
        sessionStorage.setItem("ts_propertyToEdit", JSON.stringify({ ...details, _id: existingId }));
        onNext(existingId, details);
      } else {
        res = await api.post<any>("/v1/landlordandagent/create-listing", form);
        const details = res?.propertyDetails ?? res;
        const id: string = res?.propertyId ?? details?._id ?? "";
        sessionStorage.setItem("ts_propertyToEdit", JSON.stringify(details));
        localStorage.removeItem(DRAFT_KEY);
        onNext(id, details);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create listing. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const citiesForState = locationData.find(l => l.state === propertyState)?.cities ?? [];

  return (
    <div className="space-y-10">
      {/* Gender */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Your Gender</h2>
            <p className="text-sm text-neutral-500 mt-1">Let potential swap partners know who they'd be connecting with.</p>
          </div>
          <div className="flex-1 min-w-64">
            <div className="flex flex-wrap gap-3">
              {([
                { value: "male",   emoji: "👨", label: "Male" },
                { value: "female", emoji: "👩", label: "Female" },
                { value: "any",    emoji: "🤝", label: "Prefer not to say" },
              ] as const).map(g => (
                <button key={g.value} type="button" onClick={() => setTenantGender(g.value)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all ${
                    tenantGender === g.value ? "border-bt-primary bg-bt-primary/5" : "border-neutral-200 hover:border-neutral-300"
                  }`}>
                  <span className="text-2xl">{g.emoji}</span>
                  <span className={`text-sm font-semibold ${tenantGender === g.value ? "text-bt-primary" : "text-neutral-700"}`}>{g.label}</span>
                  {tenantGender === g.value && <Check className="w-4 h-4 text-bt-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Move-out Date */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Move-out Date</h2>
            <p className="text-sm text-neutral-500 mt-1">Your listing will automatically be removed on this date.</p>
          </div>
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              When do you plan to move out? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input type="date" min={today} value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)}
                className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Apartment Type */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Apartment basics</h2>
            <p className="text-sm text-neutral-500 mt-1">Share some information about your listing</p>
          </div>
          <div className="flex-1 min-w-64">
            <p className="font-medium text-neutral-800 mb-3">Is this an entire apartment or shared? <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-3">
              {APARTMENT_TYPES.map(t => (
                <label key={t.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  apartmentType === t.value ? "border-bt-primary bg-bt-primary/5 text-bt-primary font-medium" : "border-neutral-200 hover:border-neutral-300"
                }`}>
                  <input type="radio" name="apartmentType" value={t.value} checked={apartmentType === t.value}
                    onChange={e => {
                      const v = e.target.value; setApartmentType(v);
                      const rm: Record<string, number> = { "single-room/shared-apartment": 1, "self-contained": 1, "mini-flat/one-bedroom": 1, "two-bedroom": 2, "three-bedroom": 3, "four-bedroom": 4, "big-family-house-4plus": 4 };
                      setRoomCount(rm[v] ?? 1); setBathroomCount(1);
                      if (v === "self-contained" || v === "mini-flat/one-bedroom") setLivingRoomCount(0);
                      else if (livingRoomCount === 0 && v !== "single-room/shared-apartment") setLivingRoomCount(1);
                    }} className="sr-only" />
                  {apartmentType === t.value && <Check className="w-3.5 h-3.5" />}
                  {t.label}
                </label>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: "Rooms",       sub: "Number of available rooms",      icon: Bed,  val: roomCount,       set: setRoomCount },
                { label: "Bathrooms",   sub: "Number of available bathrooms",  icon: Bath, val: bathroomCount,   set: setBathroomCount },
                { label: "Living Rooms",sub: "Number of living rooms",         icon: Tv,   val: livingRoomCount, set: setLivingRoomCount },
              ].map(({ label, sub, icon: Icon, val, set }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center"><Icon className="w-4 h-4 text-bt-primary" /></div>
                    <div><p className="text-sm font-semibold text-neutral-800">{label}</p><p className="text-xs text-neutral-500">{sub}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => set(Math.max(0, val - 1))} disabled={val === 0} className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">−</button>
                    <span className="w-6 text-center font-medium">{val}</span>
                    <button type="button" onClick={() => set(val + 1)} className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50">+</button>
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
            {[
              { label: "Street Address", val: streetAddress, set: setStreetAddress, ph: "Enter street address", req: true },
              { label: "Closest Landmark", val: closeLandmark, set: setCloseLandmark, ph: "Enter a nearby landmark", req: true },
            ].map(({ label, val, set, ph, req }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label} {req && <span className="text-red-500">*</span>}</label>
                <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph} className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">State</label>
              <select value={propertyState} onChange={e => { setPropertyState(e.target.value); setPropertyLGA(""); }} className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30">
                <option value="">Select a state</option>
                {locationData.map(l => <option key={l.state} value={l.state}>{l.state}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Town/LGA</label>
              <select value={propertyLGA} onChange={e => setPropertyLGA(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30">
                <option value="">Select a city</option>
                {citiesForState.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities & Rules */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Amenities & House Rules</h2>
            <p className="text-sm text-neutral-500 mt-1">What does your space have?</p>
          </div>
          <div className="flex-1 min-w-64">
            <p className="text-sm font-semibold text-neutral-700 mb-3">Amenities</p>
            <div className="flex flex-wrap gap-2 pb-6">
              {amenityList.map(a => (
                <label key={a._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${amenities.includes(a._id) ? "border-bt-primary bg-bt-primary/5 text-bt-primary" : "border-neutral-200 hover:border-neutral-300"}`}>
                  <input type="checkbox" checked={amenities.includes(a._id)} onChange={() => setAmenities(prev => prev.includes(a._id) ? prev.filter(x => x !== a._id) : [...prev, a._id])} className="sr-only" />
                  {amenities.includes(a._id) && <Check className="w-3 h-3" />} {a.name}
                </label>
              ))}
            </div>
            <p className="text-sm font-semibold text-neutral-700 mb-3 pt-4 border-t border-neutral-100">House Rules</p>
            <div className="flex flex-wrap gap-2">
              {houseRuleList.map(r => (
                <label key={r._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${houseRules.includes(r._id) ? "border-bt-primary bg-bt-primary/5 text-bt-primary" : "border-neutral-200 hover:border-neutral-300"}`}>
                  <input type="checkbox" checked={houseRules.includes(r._id)} onChange={() => setHouseRules(prev => prev.includes(r._id) ? prev.filter(x => x !== r._id) : [...prev, r._id])} className="sr-only" />
                  {houseRules.includes(r._id) && <Check className="w-3 h-3" />} {r.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Photos</h2>
            <p className="text-sm text-neutral-500 mt-1">At least 3 photos required. Auto-compressed for fast upload.</p>
          </div>
          <div className="flex-1 min-w-64">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-neutral-700">Photos ({photoURLs.filter(p => p.url && !p.error).length}/3 minimum)<span className="text-red-500"> *</span></p>
              {isImageDeleting && <span className="text-xs text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Removing…</span>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              <label htmlFor="ts-photo-upload" className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 hover:border-bt-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer bg-neutral-50 hover:bg-bt-primary/4 transition-colors">
                <Upload className="w-5 h-5 text-neutral-400" />
                <span className="text-xs text-neutral-500 text-center px-1">Add photos</span>
              </label>
              <input type="file" id="ts-photo-upload" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              {photoURLs.map(p => (
                <div key={p.id} className="aspect-square relative rounded-xl overflow-hidden bg-neutral-100">
                  {(p.thumbnail || p.url) && <img src={p.url || p.thumbnail} alt="" className="w-full h-full object-cover" />}
                  {p.progress !== undefined && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-end justify-end p-2">
                      <div className="w-full bg-white/25 rounded-full h-1 mb-1"><div className="bg-white h-1 rounded-full transition-all" style={{ width: `${p.progress}%` }} /></div>
                      <span className="text-white text-[9px] font-semibold">{p.progress}%{p.speedKBps ? ` · ${p.speedKBps > 1024 ? `${(p.speedKBps / 1024).toFixed(1)}MB/s` : `${p.speedKBps}KB/s`}` : ""}</span>
                    </div>
                  )}
                  {p.error?.startsWith("Optimised") && <div className="absolute inset-0 bg-bt-success/70 flex items-center justify-center"><span className="text-white text-[10px] font-bold px-2 text-center">{p.error}</span></div>}
                  {p.error && !p.error.startsWith("Optimised") && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 p-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-white text-[9px] text-center">{p.error}</span>
                      {p.file && <button type="button" onClick={() => retryUpload(p, "photo")} className="flex items-center gap-1 text-[10px] text-white bg-white/20 rounded px-1.5 py-0.5 mt-0.5"><RefreshCw className="w-3 h-3" /> Retry</button>}
                    </div>
                  )}
                  <button type="button" onClick={() => p.progress !== undefined ? cancelUpload(p, "photo") : removeImage(p.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Video <span className="text-neutral-400 font-normal text-sm">(optional)</span></h2>
            <p className="text-sm text-neutral-500 mt-1">A short walkthrough greatly increases interest.</p>
          </div>
          <div className="flex-1 min-w-64">
            {videoURLs.length === 0 ? (
              <label htmlFor="ts-video-upload" className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-neutral-200 hover:border-bt-primary/40 cursor-pointer bg-neutral-50 hover:bg-bt-primary/4 transition-colors">
                <div className="w-12 h-12 rounded-full bg-bt-primary/8 flex items-center justify-center"><Video className="w-5 h-5 text-bt-primary" /></div>
                <div className="text-center"><p className="text-sm font-medium text-neutral-700">Upload a video tour</p><p className="text-xs text-neutral-400 mt-0.5">MP4, MOV — up to 500MB</p></div>
              </label>
            ) : (
              <div className="space-y-2">
                {videoURLs.map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white">
                    <div className="w-10 h-10 rounded-lg bg-bt-primary/8 flex items-center justify-center shrink-0"><Video className="w-5 h-5 text-bt-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{v.fileName}</p>
                      {v.fileSize && <p className="text-[11px] text-neutral-400">{(v.fileSize / 1024 / 1024).toFixed(1)}MB</p>}
                      {v.progress !== undefined && <div className="mt-1.5"><div className="w-full bg-neutral-100 rounded-full h-1.5"><div className="bg-bt-primary h-1.5 rounded-full transition-all" style={{ width: `${v.progress}%` }} /></div><span className="text-xs text-neutral-400">{v.progress}%{v.speedKBps ? ` · ${v.speedKBps > 1024 ? `${(v.speedKBps / 1024).toFixed(1)}MB/s` : `${v.speedKBps}KB/s`}` : " — uploading…"}</span></div>}
                      {v.error && <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" /> {v.error}{v.file && <button type="button" onClick={() => retryUpload(v, "video")} className="ml-1 underline">Retry</button>}</p>}
                      {v.progress === undefined && !v.error && v.url && <p className="text-xs text-bt-success font-medium">✓ Uploaded</p>}
                    </div>
                    <button type="button" onClick={() => v.progress !== undefined ? cancelUpload(v, "video") : setVideoURLs(prev => prev.filter(x => x.id !== v.id))} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" id="ts-video-upload" accept="video/*" className="hidden" onChange={handleVideoChange} />
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="pb-4">
        <div className="flex flex-wrap gap-8">
          <div className="basis-64 shrink-0">
            <h2 className="font-semibold text-neutral-900">Description</h2>
            <p className="text-sm text-neutral-500 mt-1">Tell people about your space</p>
          </div>
          <div className="flex-1 min-w-64 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">House Name <span className="text-red-500">*</span></label>
              <input type="text" value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="Give your listing a name" className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea value={houseDescription} onChange={e => setHouseDescription(e.target.value)} placeholder="Describe your listing" rows={4} className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bt-primary/30 resize-none" />
            </div>
          </div>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex justify-end pt-4">
        <button type="button" onClick={handleSubmit} disabled={isCreating}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60">
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isCreating ? "Saving..." : "Save & Continue"}
          {!isCreating && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Pricing (no inspection fee) ───────────────────────────────────────
function StepPricing({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [listingFee, setListingFee]     = useState("0");
  const [cautionFee, setCautionFee]     = useState("0");
  const [serviceCharge, setServiceCharge] = useState("0");
  const [lawyerFee, setLawyerFee]       = useState("0");
  const [cleaningFee, setCleaningFee]   = useState("0");
  const [isUpdating, setUpdating]       = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("ts_propertyToEdit");
    if (raw) {
      const p = JSON.parse(raw);
      setListingFee(formatCurrency(safeParse(String(p?.listingFee ?? 0))));
      setCautionFee(formatCurrency(safeParse(String(p?.cautionFee ?? 0))));
      setServiceCharge(formatCurrency(safeParse(String(p?.serviceCharge ?? 0))));
      setLawyerFee(formatCurrency(safeParse(String(p?.lawyerFee ?? 0))));
      setCleaningFee(formatCurrency(safeParse(String(p?.cleaningFee ?? 0))));
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const raw = e.target.value.replace(/[^\d]/g, "") || "0";
    setter(formatCurrency(parseInt(raw)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const raw = sessionStorage.getItem("ts_propertyToEdit");
    if (!raw) return setError("Property data missing. Go back and try again.");
    const p = JSON.parse(raw); const propertyId: string = p._id;
    if (!propertyId) return setError("Property ID missing.");
    const tok = localStorage.getItem("BT_TOKEN");
    if (!tok) return setError("Not authenticated.");
    const scNum = safeParse(serviceCharge);
    const data = {
      listingFee: safeParse(listingFee),
      cautionFee: safeParse(cautionFee),
      inspectionFee: 0, // no inspection fee for tenant switch
      serviceCharge: scNum,
      serviceChargeFrequency: scNum > 0 ? "yearly" : "N/A",
      lawyerFee: safeParse(lawyerFee),
      cleaningFee: safeParse(cleaningFee),
      additionalFee: 0,
    };
    setUpdating(true);
    try {
      const base = window.location.hostname === "localhost" ? "/api/bt" : "https://api.betatenant.com";
      const res = await fetch(`${base}/v1/landlordandagent/pricing/${propertyId}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` }, body: JSON.stringify(data),
      });
      let json: any = {}; const text = await res.text();
      if (text) { try { json = JSON.parse(text); } catch {} }
      if (!res.ok) throw new Error(json.message || `Server error (${res.status})`);
      if (json.propertyDetails) sessionStorage.setItem("ts_propertyToEdit", JSON.stringify(json.propertyDetails));

      // Grant 5 free unlocks now that listing is priced
      await api.put(`/v1/landlordandagent/my-listings/${propertyId}`, { tenantSwitchFreeUnlocks: 5 }).catch(() => {});

      onNext();
    } catch (err: any) {
      setError(err.message || "Failed to update pricing.");
    } finally { setUpdating(false); }
  };

  const total = safeParse(listingFee) + safeParse(cautionFee) + safeParse(serviceCharge) + safeParse(lawyerFee);
  const unlockFee = safeParse(listingFee) > 1_500_000 ? 1500 : safeParse(listingFee) > 501_000 ? 850 : 500;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
      <div className="bg-neutral-50 rounded-2xl p-6 text-center">
        <p className="text-sm text-neutral-500 mb-1">Rent per annum</p>
        <p className="text-4xl font-bold text-neutral-800">₦{listingFee}</p>
        <p className="text-sm text-neutral-500 mt-1">₦{formatCurrency(total)} total with all fees</p>
        {safeParse(listingFee) > 0 && (
          <p className="text-xs text-bt-primary font-semibold mt-2">
            Viewers will pay ₦{unlockFee.toLocaleString()} to unlock your contact
          </p>
        )}
      </div>

      {[
        { id: "listingFee",   label: "Rent per annum",          val: listingFee,   set: setListingFee,   req: true },
        { id: "serviceCharge",label: "Service Charge (optional)",val: serviceCharge,set: setServiceCharge,req: false },
        { id: "lawyerFee",    label: "Legal Fee (optional)",     val: lawyerFee,    set: setLawyerFee,    req: false },
        { id: "cautionFee",   label: "Caution Fee (optional)",   val: cautionFee,   set: setCautionFee,   req: false },
        { id: "cleaningFee",  label: "Cleaning Fee (optional)",  val: cleaningFee,  set: setCleaningFee,  req: false },
      ].map(({ id, label, val, set, req }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label} {req && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">₦</span>
            <input id={id} type="text" inputMode="numeric" value={val} onChange={e => handleChange(e, set)}
              className="w-full border border-neutral-200 rounded-xl pl-8 pr-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30" />
          </div>
        </div>
      ))}

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
        <button type="button" onClick={onBack} className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">Back</button>
        <button type="submit" disabled={isUpdating} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60">
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
  const queryClient = useQueryClient();
  const [house, setHouse]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [isPublishing, setPublishing] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("ts_propertyToEdit");
    if (!raw) { setLoading(false); return; }
    const p = JSON.parse(raw);
    const tok = localStorage.getItem("BT_TOKEN");
    fetch(`/api/bt/v1/landlordandagent/preview/${p._id}`, { headers: tok ? { Authorization: `Bearer ${tok}` } : {} })
      .then(r => r.json()).then(d => setHouse(d.propertyDetails)).catch(() => setHouse(p)).finally(() => setLoading(false));
  }, []);

  const publish = async () => {
    if (!house?._id) return;
    setPublishing(true); setError("");
    try {
      const tok = localStorage.getItem("BT_TOKEN");
      const base = window.location.hostname === "localhost" ? "/api/bt" : "https://api.betatenant.com";
      const res = await fetch(`${base}/v1/landlordandagent/publish/${house._id}`, { method: "POST", headers: tok ? { Authorization: `Bearer ${tok}` } : {} });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Failed to publish.");
      sessionStorage.removeItem("ts_propertyToEdit");
      localStorage.removeItem(DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ["tenant-switch-my-listing"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-switch-listings"] });
      toast.success("Your space is now live! You have 5 free unlocks this month.");
      router.push("/tenant-switch");
    } catch (err: any) {
      setError(err.message || "Failed to publish listing.");
    } finally { setPublishing(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-bt-primary" /></div>;
  if (!house) return <div className="text-center py-12 text-neutral-500"><p>Could not load preview.</p><button onClick={onBack} className="mt-4 text-bt-primary font-medium hover:underline">Go back</button></div>;

  return (
    <div>
      {house.photoURLs?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6">
          {house.photoURLs.slice(0, 5).map((url: string, i: number) => (
            <img key={i} src={url} alt={`Photo ${i + 1}`} className={`w-full object-cover ${i === 0 ? "col-span-2 row-span-2 h-64" : "h-32"}`} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{house.houseName}</h1>
            <p className="text-neutral-500 text-sm mt-1">{house.streetAddress}, {house.propertyLGA}, {house.propertyState}</p>
            <p className="text-bt-primary font-bold text-lg mt-2">₦{Number(house.listingFee ?? 0).toLocaleString()}/year</p>
            {house.moveOutDate && <p className="text-sm text-bt-secondary font-medium mt-1">Moving out: {new Date(house.moveOutDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>}
            {house.tenantGender && house.tenantGender !== "any" && <p className="text-sm text-neutral-600 mt-1">{house.tenantGender === "male" ? "👨 Male" : "👩 Female"}</p>}
          </div>
          <p className="text-neutral-700 text-sm leading-relaxed">{house.houseDescription}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 h-fit">
          <h3 className="font-semibold text-neutral-900 mb-3">Summary</h3>
          <dl className="space-y-2 text-sm">
            {[["Type", house.apartmentType?.replace(/-/g, " ")], ["Bedrooms", house.roomCount], ["Bathrooms", house.bathroomCount], ["State", house.propertyState], ["LGA", house.propertyLGA]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between"><dt className="text-neutral-500">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>
            ))}
          </dl>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mt-4">{error}</p>}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-neutral-200">
        <button type="button" onClick={onBack} className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">Edit Details</button>
        <button type="button" onClick={publish} disabled={isPublishing}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60">
          {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPublishing ? "Publishing..." : "Confirm & Publish"}
          {!isPublishing && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function TenantSwitchListContent() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [existingId, setExistingId] = useState<string | undefined>();

  const { data: myListing } = useQuery({
    queryKey: ["tenant-switch-my-listing"],
    queryFn: tenantSwitchApi.myListing,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (myListing?._id) setExistingId(myListing._id);
  }, [myListing]);

  return (
    <div className="min-h-screen bg-bt-surface overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 overflow-x-hidden">
        <div className="mb-8">
          <button onClick={() => router.push("/tenant-switch")} className="text-sm text-neutral-500 hover:text-neutral-700 mb-3 flex items-center gap-1">
            ← Back to Tenant Switch
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">{myListing ? "Edit My Space" : "List My Space"}</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {myListing ? "Update your tenant switch listing" : "List your space on Tenant Switch in 3 steps — get 5 free unlocks/month"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-10 overflow-hidden">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors shrink-0 ${i < step ? "bg-bt-success text-white" : i === step ? "bg-bt-primary text-white" : "bg-neutral-100 text-neutral-400"}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ${i === step ? "text-neutral-900" : i < step ? "text-bt-success" : "text-neutral-400"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 min-w-[12px] transition-colors ${i < step ? "bg-bt-success" : "bg-neutral-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          {step === 0 && <StepCreate onNext={(id) => { setExistingId(id); setStep(1); }} existingId={existingId} />}
          {step === 1 && <StepPricing onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <StepPreview onBack={() => setStep(1)} />}
        </div>
      </div>
    </div>
  );
}

export default function TenantSwitchListPage() {
  return <AuthGuard><TenantSwitchListContent /></AuthGuard>;
}
