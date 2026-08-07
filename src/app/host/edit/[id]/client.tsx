"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { locationData } from "@/lib/locations";
import {
  ArrowLeft, Loader2, Check, Bed, Bath, MapPin, Home,
  DollarSign, FileText, Sparkles, Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

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

  const handleSave = async () => {
    if (!apartmentType) { toast.error("Select an apartment type"); return; }
    if (!state || !lga) { toast.error("Select state and city"); return; }
    if (!listingFee || Number(listingFee) < 1) { toast.error("Enter a valid listing fee"); return; }

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
