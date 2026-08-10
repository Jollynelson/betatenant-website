"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AgencyOnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [agencyName, setAgencyName]       = useState("");
  const [slugPreview, setSlugPreview]     = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking]   = useState(false);
  const [saving, setSaving]               = useState(false);

  const roleLabel = user?.role === "landlord" ? "Landlord" : "Agent";

  const toSlug = (s: string) =>
    s.toLowerCase().trim()
     .replace(/[^a-z0-9\s-]/g, "")
     .replace(/\s+/g, "-")
     .replace(/-+/g, "-")
     .replace(/^-|-$/g, "")
     .slice(0, 30);

  useEffect(() => {
    const slug = toSlug(agencyName);
    setSlugPreview(slug);
    setSlugAvailable(null);
    if (slug.length < 3) return;

    const t = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const r = await api.get<any>(`/v1/landlordandagent/share/slug/check/${encodeURIComponent(slug)}`);
        setSlugAvailable(r.available);
      } catch { setSlugAvailable(null); }
      setSlugChecking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [agencyName]);

  const handleSave = async () => {
    if (!agencyName.trim() || agencyName.trim().length < 2) {
      toast.error("Please enter a valid agency name");
      return;
    }
    setSaving(true);
    try {
      await api.put("/v1/user/profile", { agencyName: agencyName.trim() });
      toast.success("Agency name saved!");
      router.replace("/account/properties");
    } catch (err: any) {
      toast.error(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace("/account/properties");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-bt-primary/8 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-bt-primary" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">What&apos;s your agency called?</h1>
          <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
            This becomes your shareable portfolio link — tenants can find all your listings in one place.
            <br />You can always change it later.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1.5">
              {roleLabel === "Landlord" ? "Company / Agency" : "Agency"} Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={roleLabel === "Landlord" ? "e.g. Sunshine Properties" : "e.g. Hauz of Floxy"}
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-neutral-200 bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {slugChecking && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
                {!slugChecking && slugAvailable === true  && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
            </div>

            {/* Slug preview */}
            {agencyName.trim().length >= 3 && slugPreview && (
              <div className={cn(
                "mt-2 px-3 py-2 rounded-xl text-sm flex items-center gap-2",
                slugAvailable === false ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              )}>
                {slugAvailable === false ? (
                  <>⚠ <span><strong>betatenant.com/in/{slugPreview}</strong> is taken. You can pick a different name or change it from your profile later.</span></>
                ) : (
                  <>✓ <span>Your portfolio link: <strong>betatenant.com/in/{slugPreview}</strong></span></>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || agencyName.trim().length < 2}
            className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {saving ? "Saving..." : "Continue"}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-3 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Skip for now — I&apos;ll set this later
          </button>
        </div>
      </div>
    </div>
  );
}
