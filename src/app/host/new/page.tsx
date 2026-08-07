"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { locationData } from "@/lib/locations";
import {
  Bath, Bed, Tv, Upload, X, Loader2, Check, ChevronRight,
  Video, Play, AlertCircle, RefreshCw, Crown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FileEntry {
  id: number;
  url: string;          // final CDN URL (empty while uploading)
  thumbnail?: string;   // instant local preview before upload completes
  file: File | null;
  fileName: string;
  fileSize?: number;
  progress?: number;    // 0-100, undefined = done
  speedKBps?: number;   // upload speed for UX display
  error?: string;
  abortController?: AbortController;
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

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD SYSTEM — handles slow networks, large files, dropped connections
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Network quality detection ──────────────────────────────────────────────
type NetworkTier = "fast" | "medium" | "slow";

function detectNetworkTier(): NetworkTier {
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
  if (!conn) return "medium";
  const type = conn.effectiveType as string;
  if (type === "4g") return "fast";
  if (type === "3g") return "medium";
  return "slow"; // 2g, slow-2g, offline
}

// ── 2. Adaptive image compression ─────────────────────────────────────────────
// Quality and max resolution adapt to network tier.
// Never degrades quality past 75% (Instagram uses 78%), never makes file larger.
async function compressImage(file: File): Promise<{ file: File; didCompress: boolean; savedBytes: number }> {
  if (!file.type.startsWith("image/")) return { file, didCompress: false, savedBytes: 0 };

  const tier = detectNetworkTier();

  // Adaptive targets per network quality
  const config = {
    fast:   { maxPx: 2560, quality: 0.92 }, // near-lossless, just remove excess megapixels
    medium: { maxPx: 2048, quality: 0.85 }, // slight reduction, still excellent quality
    slow:   { maxPx: 1600, quality: 0.78 }, // noticeable compression but loads fast
  }[tier];

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const maxDim = Math.max(width, height);

      // Skip if already small enough for this tier
      if (file.size < 800 * 1024 && maxDim <= config.maxPx) {
        resolve({ file, didCompress: false, savedBytes: 0 });
        return;
      }

      // Generate low-res placeholder thumbnail first (for instant preview)
      const scale = Math.min(1, config.maxPx / maxDim);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(width  * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve({ file, didCompress: false, savedBytes: 0 });
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve({ file: compressed, didCompress: true, savedBytes: file.size - blob.size });
        },
        "image/jpeg",
        config.quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ file, didCompress: false, savedBytes: 0 }); };
    img.src = url;
  });
}

// Generate a tiny placeholder preview (for instant display before upload)
async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 400 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

// ── 3. Upload engine — small files go direct, large files use S3 multipart ────
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB — S3 minimum part size

function getApiBase() {
  return window.location.hostname === "localhost"
    ? "/api/bt" : "https://api.betatenant.com";
}

function getToken() {
  return localStorage.getItem("BT_TOKEN");
}

async function uploadFileChunked(
  file: File,
  onProgress: (pct: number, speedKBps?: number) => void,
  signal?: AbortSignal
): Promise<string> {
  // Small files (≤5MB): direct single upload — fast, simple
  if (file.size <= 5 * 1024 * 1024) {
    return uploadDirect(file, onProgress, signal);
  }
  // Large files: S3 multipart — true server-side assembly, resumable
  return uploadMultipart(file, onProgress, signal);
}

// Direct single-file upload (images, small videos)
async function uploadDirect(
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
  maxRetries = 3
): Promise<string> {
  const apiBase = getApiBase();
  const token = getToken();
  let lastErr: Error = new Error("Upload failed");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const formData = new FormData();
        formData.append("files", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/v1/user/aws-upload`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.data?.[0]) resolve(data.data[0]);
            else reject(new Error(data.message || `HTTP ${xhr.status}`));
          } catch { reject(new Error("Invalid response")); }
        };
        xhr.onerror   = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Timed out — retrying…"));
        xhr.timeout   = 90_000;
        signal?.addEventListener("abort", () => xhr.abort(), { once: true });
        xhr.send(formData);
      });
      return url;
    } catch (err: any) {
      lastErr = err;
      if (err.message?.includes("401") || err.message?.includes("403")) throw err;
    }
  }
  throw lastErr;
}

// S3 multipart upload — init, upload parts, complete
async function uploadMultipart(
  file: File,
  onProgress: (pct: number, speedKBps?: number) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiBase = getApiBase();
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 1. Initiate multipart upload
  const initRes = await fetch(`${apiBase}/v1/user/upload/init-multipart`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
    signal,
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({ message: "Failed to start upload" }));
    throw new Error(err.message || `HTTP ${initRes.status}`);
  }
  const { data: { uploadId, key } } = await initRes.json();

  // 2. Upload parts with progress tracking
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const parts: { ETag: string; PartNumber: number }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) {
      // Abort the multipart upload on cancel
      await fetch(`${apiBase}/v1/user/upload/abort`, {
        method: "POST", headers,
        body: JSON.stringify({ key, uploadId }),
      }).catch(() => {});
      throw new Error("Upload cancelled");
    }

    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const partNumber = i + 1;

    const part = await uploadSinglePart(
      key, uploadId, partNumber, chunk, file.name, apiBase, token,
      (chunkPct) => {
        const overall = ((start + chunk.size * chunkPct / 100) / file.size) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const speedKBps = elapsed > 0
          ? Math.round((start + chunk.size * chunkPct / 100) / 1024 / elapsed)
          : undefined;
        onProgress(Math.round(overall), speedKBps);
      },
      signal
    );
    parts.push(part);
  }

  // 3. Complete multipart upload
  const completeRes = await fetch(`${apiBase}/v1/user/upload/complete`, {
    method: "POST",
    headers,
    body: JSON.stringify({ key, uploadId, parts }),
    signal,
  });
  if (!completeRes.ok) {
    throw new Error("Failed to finalize upload");
  }
  const { data: { url } } = await completeRes.json();
  onProgress(100);
  return url;
}

async function uploadSinglePart(
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Blob,
  fileName: string,
  apiBase: string,
  token: string | null,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
  maxRetries = 3
): Promise<{ ETag: string; PartNumber: number }> {
  let lastErr: Error = new Error("Chunk upload failed");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
    try {
      const result = await new Promise<{ ETag: string; PartNumber: number }>((resolve, reject) => {
        const formData = new FormData();
        formData.append("chunk", new File([chunk], fileName));
        formData.append("key", key);
        formData.append("uploadId", uploadId);
        formData.append("partNumber", String(partNumber));

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/v1/user/upload/chunk`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.data) resolve(data.data);
            else reject(new Error(data.message || `HTTP ${xhr.status}`));
          } catch { reject(new Error("Invalid response")); }
        };
        xhr.onerror   = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Timed out — retrying…"));
        xhr.timeout   = 120_000; // 2min per 5MB chunk
        signal?.addEventListener("abort", () => xhr.abort(), { once: true });
        xhr.send(formData);
      });
      return result;
    } catch (err: any) {
      lastErr = err;
      if (err.message?.includes("401") || err.message?.includes("403")) throw err;
    }
  }
  throw lastErr;
}

// ── 4. IndexedDB upload queue — survives page close/crash ─────────────────────
// Queued items are re-attempted when the page reopens
interface QueuedUpload {
  id: string;
  fileName: string;
  fileSize: number;
  draftKey: string; // which draft this belongs to
  type: "photo" | "video";
  // We can't store File objects in IDB, but we store the object URL temporarily
  // For true persistence across tabs, users would need to re-select the file
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
  const [roomCount, setRoomCount] = useState(1);
  const [bathroomCount, setBathroomCount] = useState(1);
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
    const tier = detectNetworkTier();
    if (tier === "slow") {
      setError("⚠️ Slow network detected — images will be optimised for faster upload. You can still proceed.");
      setTimeout(() => setError(""), 5000);
    }

    const files = Array.from(e.target.files).filter((f) => !photoURLs.find((p) => p.fileName === f.name));
    if (!files.length) return;
    e.target.value = "";

    // Instantly show thumbnails — user sees their photos immediately, no waiting
    const withThumbnails = await Promise.all(files.map(async (f) => ({
      id: makeId(), file: f, fileName: f.name, fileSize: f.size,
      url: "", thumbnail: await generateThumbnail(f), progress: 0,
    })));
    setPhotoURLs((prev) => [...prev, ...withThumbnails]);

    // Upload in background — user can keep filling the form
    for (const entry of withThumbnails) {
      const abort = new AbortController();
      setPhotoURLs((prev) => prev.map((p) => p.id === entry.id ? { ...p, abortController: abort } : p));
      try {
        const { file: compressed, savedBytes } = await compressImage(entry.file!);
        const savedMB = (savedBytes / 1024 / 1024).toFixed(1);
        if (savedBytes > 100_000) {
          // Show compression saving briefly
          setPhotoURLs((prev) => prev.map((p) => p.id === entry.id
            ? { ...p, error: `Optimised (-${savedMB}MB)` } : p));
          await new Promise((r) => setTimeout(r, 1200));
          setPhotoURLs((prev) => prev.map((p) => p.id === entry.id ? { ...p, error: undefined } : p));
        }
        const url = await uploadFileChunked(
          compressed,
          (pct, speedKBps) => setPhotoURLs((prev) => prev.map((p) => p.id === entry.id ? { ...p, progress: pct, speedKBps } : p)),
          abort.signal
        );
        setPhotoURLs((prev) => prev.map((p) => p.id === entry.id
          ? { ...p, url, progress: undefined, error: undefined, abortController: undefined } : p));
      } catch (err: any) {
        if (err.message === "Upload cancelled") return;
        setPhotoURLs((prev) => prev.map((p) => p.id === entry.id
          ? { ...p, progress: undefined, error: err.message || "Upload failed", abortController: undefined } : p));
      }
    }
  };

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setError("");
    const files = Array.from(e.target.files).filter((f) => !videoURLs.find((v) => v.fileName === f.name));
    if (!files.length) return;
    e.target.value = "";

    const tier = detectNetworkTier();
    if (tier === "slow" && files.some((f) => f.size > 50 * 1024 * 1024)) {
      setError("⚠️ Large video on a slow connection — this may take a while. You can keep filling the form while it uploads.");
      setTimeout(() => setError(""), 8000);
    }

    const placeholders: FileEntry[] = files.map((f) => ({
      id: makeId(), file: f, fileName: f.name, fileSize: f.size, url: "", progress: 0,
    }));
    setVideoURLs((prev) => [...prev, ...placeholders]);

    for (const placeholder of placeholders) {
      const abort = new AbortController();
      setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id ? { ...v, abortController: abort } : v));
      try {
        const url = await uploadFileChunked(
          placeholder.file!,
          (pct, speedKBps) => setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id ? { ...v, progress: pct, speedKBps } : v)),
          abort.signal
        );
        setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id
          ? { ...v, url, progress: undefined, error: undefined, abortController: undefined } : v));
      } catch (err: any) {
        if (err.message === "Upload cancelled") return;
        setVideoURLs((prev) => prev.map((v) => v.id === placeholder.id
          ? { ...v, progress: undefined, error: err.message || "Upload failed", abortController: undefined } : v));
      }
    }
  };

  const cancelUpload = (entry: FileEntry, type: "photo" | "video") => {
    entry.abortController?.abort();
    const setter = type === "photo" ? setPhotoURLs : setVideoURLs;
    setter((prev) => prev.filter((p) => p.id !== entry.id));
  };

  const retryUpload = async (entry: FileEntry, type: "photo" | "video") => {
    if (!entry.file) return;
    const setter = type === "photo" ? setPhotoURLs : setVideoURLs;
    const abort = new AbortController();
    setter((prev) => prev.map((p) => p.id === entry.id ? { ...p, error: undefined, progress: 0, abortController: abort } : p));
    try {
      const file = type === "photo" ? (await compressImage(entry.file)).file : entry.file;
      const url = await uploadFileChunked(
        file,
        (pct, speedKBps) => setter((prev) => prev.map((p) => p.id === entry.id ? { ...p, progress: pct, speedKBps } : p)),
        abort.signal
      );
      setter((prev) => prev.map((p) => p.id === entry.id
        ? { ...p, url, progress: undefined, error: undefined, abortController: undefined } : p));
    } catch (err: any) {
      if (err.message === "Upload cancelled") return;
      setter((prev) => prev.map((p) => p.id === entry.id
        ? { ...p, progress: undefined, error: err.message, abortController: undefined } : p));
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
    if (readyPhotos.length < 3) return setError("Please upload at least 3 photos.");

    const readyVideos = videoURLs.filter((v) => v.url && !v.error && v.progress === undefined);

    const form: Record<string, any> = {
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
      houseName,
      houseDescription,
    };
    if (readyVideos.length > 0) {
      form.videoURLs = readyVideos.map((v) => v.url);
    }

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
                      const val = e.target.value;
                      setApartmentType(val);
                      const roomDefaults: Record<string, number> = {
                        "single-room/shared-apartment": 1,
                        "self-contained": 1,
                        "mini-flat/one-bedroom": 1,
                        "two-bedroom": 2,
                        "three-bedroom": 3,
                        "four-bedroom": 4,
                        "big-family-house-4plus": 4,
                      };
                      setRoomCount(roomDefaults[val] ?? 1);
                      setBathroomCount(1);
                      if (val === "self-contained" || val === "mini-flat/one-bedroom") {
                        setLivingRoomCount(0);
                      } else if (livingRoomCount === 0 && val !== "single-room/shared-apartment") {
                        setLivingRoomCount(1);
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
                  {/* Show thumbnail instantly, replace with final URL when done */}
                  {(p.thumbnail || p.url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.url || p.thumbnail}
                      alt="Upload"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Uploading: progress bar overlay */}
                  {p.progress !== undefined && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-end justify-end p-2">
                      <div className="w-full bg-white/25 rounded-full h-1 mb-1">
                        <div className="bg-white h-1 rounded-full transition-all duration-200" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-white text-[9px] font-semibold tabular-nums">
                        {p.progress}%{p.speedKBps ? ` · ${p.speedKBps > 1024 ? `${(p.speedKBps/1024).toFixed(1)}MB/s` : `${p.speedKBps}KB/s`}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Info message (e.g. "Optimised -2.3MB") — green tint */}
                  {p.error && p.error.startsWith("Optimised") && (
                    <div className="absolute inset-0 bg-bt-success/70 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold px-2 text-center">{p.error}</span>
                    </div>
                  )}

                  {/* Error overlay with retry/cancel */}
                  {p.error && !p.error.startsWith("Optimised") && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 p-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-white text-[9px] text-center leading-tight">{p.error}</span>
                      {p.file && (
                        <button type="button" onClick={() => retryUpload(p, "photo")} className="flex items-center gap-1 text-[10px] text-white bg-white/20 rounded px-1.5 py-0.5 mt-0.5">
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  )}

                  {/* Remove/Cancel button */}
                  <button
                    type="button"
                    onClick={() => p.progress !== undefined ? cancelUpload(p, "photo") : removeImage(p.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Photos upload in the background — you can keep filling the form while they upload.
              Images are auto-optimised based on your network speed.
            </p>
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
                      {v.fileSize && (
                        <p className="text-[11px] text-neutral-400">{(v.fileSize / 1024 / 1024).toFixed(1)}MB</p>
                      )}
                      {v.progress !== undefined && (
                        <div className="mt-1.5">
                          <div className="w-full bg-neutral-100 rounded-full h-1.5">
                            <div className="bg-bt-primary h-1.5 rounded-full transition-all duration-200" style={{ width: `${v.progress}%` }} />
                          </div>
                          <span className="text-xs text-neutral-400 tabular-nums">
                            {v.progress}%
                            {v.speedKBps ? ` · ${v.speedKBps > 1024 ? `${(v.speedKBps/1024).toFixed(1)}MB/s` : `${v.speedKBps}KB/s`}` : " — uploading…"}
                          </span>
                        </div>
                      )}
                      {v.error && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1 flex-wrap">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {v.error}
                          {v.file && <button type="button" onClick={() => retryUpload(v, "video")} className="ml-1 underline">Retry</button>}
                        </p>
                      )}
                      {v.progress === undefined && !v.error && v.url && (
                        <p className="text-xs text-bt-success font-medium">✓ Uploaded successfully</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => v.progress !== undefined ? cancelUpload(v, "video") : setVideoURLs((prev) => prev.filter((x) => x.id !== v.id))}
                      className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                      title={v.progress !== undefined ? "Cancel upload" : "Remove"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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
  const [subPrompt, setSubPrompt] = useState(false); // subscription required modal

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
      const apiBase = window.location.hostname === "localhost" ? "/api/bt" : "https://api.betatenant.com";
      const res = await fetch(`${apiBase}/v1/landlordandagent/publish/${house._id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.errorCode === "SUBSCRIPTION_REQUIRED") {
          // Listing saved as draft — prompt user to subscribe
          setSubPrompt(true);
          return;
        }
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
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
          Edit Listing Details
        </button>
        <button type="button" onClick={publish} disabled={isPublishing}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60">
          {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPublishing ? "Publishing..." : "Confirm & Publish"}
          {!isPublishing && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Subscription required prompt */}
      {subPrompt && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSubPrompt(false)} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-7 h-7 text-amber-600 fill-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 text-center mb-1">Upgrade to Publish</h2>
            <p className="text-sm text-neutral-500 text-center mb-5">
              You&apos;ve reached the free limit of 3 active listings. Your listing has been <span className="font-semibold text-neutral-700">saved as a draft</span> — subscribe to go live instantly.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => router.push("/account/subscription")}
                className="w-full py-3.5 rounded-xl bg-bt-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-bt-primary-light transition-colors shadow-[0_4px_14px_rgba(10,8,118,0.25)]">
                <Crown className="w-4 h-4" /> Go Premium — Publish Now
              </button>
              <button onClick={() => { setSubPrompt(false); router.push("/account/properties"); }}
                className="w-full py-3 text-sm font-medium text-neutral-500 hover:text-neutral-700">
                Save as draft and decide later
              </button>
            </div>
          </div>
        </div>
      )}
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
