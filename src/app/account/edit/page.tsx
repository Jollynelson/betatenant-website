"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Camera, Loader2, Check, User, Mail, Phone, MapPin, Briefcase,
  MessageCircle, ExternalLink, CheckCircle2, Clock, Lock, Trash2,
  ChevronRight, Eye, EyeOff, Shield, AlertTriangle, Link2, Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/lib/auth-store";
import { api, API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "profile" | "phone" | "email" | "password" | "portfolio-link" | "delete";

// ─── Main Content ─────────────────────────────────────────────────────────────

function EditProfileContent() {
  const router = useRouter();
  const { user, clearAuth, setProfilePic: syncProfilePic } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [activeSection, setActiveSection] = useState<Section | null>("profile");
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [secondaryPhoneVerified, setSecondaryPhoneVerified] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState<"primary" | "secondary">("primary");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [agentBasedLocation, setAgentBasedLocation] = useState("");
  const [yearsOfRentalExperience, setYearsOfRentalExperience] = useState("");
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [currentShareId, setCurrentShareId] = useState<string | null>(null);

  useEffect(() => {
    // /v1/user/profile works for ALL roles — same user collection
    api.get<any>("/v1/user/profile")
      .then((r) => {
        // Response shape: { profile: {...} } — pick first truthy nested object
        const p = r?.profile ?? r?.userProfile ?? r?.user
          // fallback: if the response itself looks like a user doc, use it
          ?? (r?.firstName !== undefined ? r : null);
        if (!p) { toast.error("Could not read profile data"); return; }
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setEmail(p.email ?? "");
        const rawPhone = p.phoneNumber ? String(p.phoneNumber) : "";
        setPhoneNumber(rawPhone.replace(/^234/, "0"));
        setPhoneVerified(!!p.phoneNumberVerified);
        setSecondaryPhone(p.secondaryPhoneNumber ? String(p.secondaryPhoneNumber).replace(/^234/, "0") : "");
        setSecondaryPhoneVerified(!!p.secondaryPhoneVerified);
        setWhatsappPhone(p.whatsappPhone ?? "primary");
        setIdentityVerified(!!(p.userVerified || p.userVerificationObject?.status === "verified"));
        setProfilePic(p.profilePic ?? "");
        setAgentBasedLocation(p.agentBasedLocation ?? "");
        setYearsOfRentalExperience(p.yearsOfRentalExperience ? String(p.yearsOfRentalExperience) : "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));

    // Load slug for agents/landlords
    api.get<any>("/v1/landlordandagent/share/myslug")
      .then((r) => { setCurrentSlug(r?.slug ?? null); setCurrentShareId(r?.shareId ?? null); })
      .catch(() => {});
  }, []);

  const role = user?.role ?? useAuthStore.getState().user?.role ?? "user";
  const isAgentOrLandlord = role === "agent" || role === "landlord";

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, any> = { firstName: firstName.trim(), lastName: lastName.trim() };
      if (isAgentOrLandlord) {
        if (agentBasedLocation.trim()) body.agentBasedLocation = agentBasedLocation.trim();
        if (yearsOfRentalExperience) body.yearsOfRentalExperience = yearsOfRentalExperience;
      }
      await api.put("/v1/user/profile", body);
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const apiBase = API_BASE_URL;
      const token = localStorage.getItem("BT_TOKEN");
      const res = await fetch(`${apiBase}/v1/user/aws-upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      const url = data.data?.[0];
      if (!url) throw new Error("Upload failed");
      await api.put("/v1/user/profile-picture", { profilePic: url });
      setProfilePic(url);
      syncProfilePic(url);
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPic(false);
    }
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Account Settings</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-bt-primary" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

          {/* Avatar */}
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              {profilePic ? (
                <Image src={profilePic} alt="Profile" width={88} height={88}
                  className="w-22 h-22 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-[88px] h-[88px] rounded-full bg-bt-primary flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md">
                  {initials}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={uploadingPic}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-bt-primary border-2 border-white flex items-center justify-center shadow hover:bg-bt-primary-light transition-colors disabled:opacity-50">
                {uploadingPic ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <p className="text-xs text-neutral-400 mt-2">Tap to change photo</p>
          </div>

          {/* ── Personal Info ──────────────────────────────────────────────── */}
          <SectionCard
            title="Personal Information"
            open={activeSection === "profile"}
            onToggle={() => setActiveSection(activeSection === "profile" ? null : "profile")}
          >
            <div className="space-y-4 pt-1">
              {/* Verified identity notice */}
              {identityVerified && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  Your identity is verified. Name cannot be changed to protect your verification status.
                </div>
              )}
              <Field label="First Name">
                <input type="text" value={firstName}
                  onChange={(e) => !identityVerified && setFirstName(e.target.value)}
                  readOnly={identityVerified}
                  className={cn(
                    "w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300",
                    identityVerified && "opacity-60 cursor-not-allowed"
                  )}
                  placeholder="First name" />
              </Field>
              <Field label="Last Name">
                <input type="text" value={lastName}
                  onChange={(e) => !identityVerified && setLastName(e.target.value)}
                  readOnly={identityVerified}
                  className={cn(
                    "w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300",
                    identityVerified && "opacity-60 cursor-not-allowed"
                  )}
                  placeholder="Last name" />
              </Field>
              {isAgentOrLandlord && (
                <>
                  <Field label="Location">
                    <input type="text" value={agentBasedLocation} onChange={(e) => setAgentBasedLocation(e.target.value)}
                      className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300"
                      placeholder="e.g. Lekki, Lagos" />
                  </Field>
                  <Field label="Years of Experience">
                    <input type="text" value={yearsOfRentalExperience}
                      onChange={(e) => setYearsOfRentalExperience(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300"
                      placeholder="e.g. 5" />
                  </Field>
                </>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl bg-bt-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-bt-primary-light transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </SectionCard>

          {/* ── Phone Numbers ──────────────────────────────────────────────── */}
          <SectionCard
            title="Phone Numbers"
            subtitle={phoneNumber ? `${phoneNumber}${phoneVerified ? " · Verified" : ""}${secondaryPhone ? ` · +1 more` : ""}` : "Not set"}
            open={activeSection === "phone"}
            onToggle={() => setActiveSection(activeSection === "phone" ? null : "phone")}
          >
            <div className="space-y-4 pt-1">
              {/* Primary phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Primary Number</p>
                  <div className="flex items-center gap-1">
                    {phoneVerified && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Verified</span>
                    )}
                    {whatsappPhone === "primary" && (
                      <span className="text-[10px] font-semibold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded-full">WhatsApp</span>
                    )}
                  </div>
                </div>
                <PhoneSection
                  currentPhone={phoneNumber}
                  onVerified={(num) => { setPhoneNumber(num); setPhoneVerified(true); }}
                />
              </div>

              {/* Secondary phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Secondary Number (optional)</p>
                  <div className="flex items-center gap-1">
                    {secondaryPhoneVerified && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Verified</span>
                    )}
                    {whatsappPhone === "secondary" && (
                      <span className="text-[10px] font-semibold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded-full">WhatsApp</span>
                    )}
                  </div>
                </div>
                <PhoneSection
                  currentPhone={secondaryPhone}
                  isSecondary
                  onVerified={(num) => { setSecondaryPhone(num); setSecondaryPhoneVerified(true); }}
                />
              </div>

              {/* WhatsApp / Calls designation — only shown when both numbers exist */}
              {phoneNumber && secondaryPhone && (
                <div className="bg-neutral-50 rounded-xl p-3.5 space-y-2.5">
                  <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wide">Which number is WhatsApp?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "primary" as const, label: phoneNumber },
                      { value: "secondary" as const, label: secondaryPhone },
                    ].map(({ value, label }) => (
                      <button key={value} onClick={async () => {
                        setWhatsappPhone(value);
                        await api.put("/v1/user/profile", { whatsappPhone: value }).catch(() => {});
                      }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all",
                          whatsappPhone === value
                            ? "border-[#25D366] bg-[#25D366]/8 text-[#128C7E]"
                            : "border-neutral-200 hover:border-neutral-300"
                        )}>
                        <MessageCircle className={cn("w-3.5 h-3.5 shrink-0", whatsappPhone === value ? "text-[#25D366]" : "text-neutral-400")} />
                        <p className="text-xs font-medium truncate">{label}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400">The other number will be shown as the call number on your listings.</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Email ──────────────────────────────────────────────────────── */}
          <SectionCard
            title="Email Address"
            subtitle={email}
            open={activeSection === "email"}
            onToggle={() => setActiveSection(activeSection === "email" ? null : "email")}
          >
            <EmailSection currentEmail={email} onUpdated={(e) => { setEmail(e); setActiveSection(null); }} />
          </SectionCard>

          {/* ── Password ───────────────────────────────────────────────────── */}
          <SectionCard
            title="Password"
            subtitle="Change your account password"
            open={activeSection === "password"}
            onToggle={() => setActiveSection(activeSection === "password" ? null : "password")}
          >
            <PasswordSection onDone={() => setActiveSection(null)} />
          </SectionCard>

          {/* ── Portfolio Link — agents/landlords only ─────────────────────── */}
          {isAgentOrLandlord && (
            <SectionCard
              title="Portfolio Link"
              subtitle={currentSlug ? `betatenant.com/in/${currentSlug}` : "Set your custom link"}
              open={activeSection === "portfolio-link"}
              onToggle={() => setActiveSection(activeSection === "portfolio-link" ? null : "portfolio-link")}
            >
              <PortfolioLinkSection
                currentSlug={currentSlug}
                currentShareId={currentShareId}
                onSaved={(slug, shareId) => { setCurrentSlug(slug); setCurrentShareId(shareId); }}
              />
            </SectionCard>
          )}

          {/* ── Delete Account ─────────────────────────────────────────────── */}
          <SectionCard
            title="Delete Account"
            subtitle="Permanently remove your account"
            danger
            open={activeSection === "delete"}
            onToggle={() => setActiveSection(activeSection === "delete" ? null : "delete")}
          >
            <DeleteSection onDeleted={() => { clearAuth(); router.replace("/"); }} />
          </SectionCard>

        </div>
      )}
    </div>
  );
}

// ─── Phone Section ────────────────────────────────────────────────────────────

function PhoneSection({ currentPhone, onVerified, isSecondary = false }: {
  currentPhone: string; onVerified: (num: string) => void; isSecondary?: boolean;
}) {
  const [method, setMethod] = useState<"sms" | "whatsapp" | null>(null);
  const [newPhone, setNewPhone] = useState(currentPhone || "");

  // SMS flow
  const [smsVerificationId, setSmsVerificationId] = useState("");
  const [smsOtp, setSmsOtp] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  // WhatsApp flow
  const [waCode, setWaCode] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [waSent, setWaSent] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waPolling, setWaPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const sendSmsOtp = async () => {
    if (!newPhone.trim()) { toast.error("Enter your phone number"); return; }
    setSmsLoading(true);
    try {
      const res = await api.put<any>("/v1/user/phone-number", { phoneNumber: newPhone.trim(), secondary: isSecondary });
      setSmsVerificationId(res.verificationId ?? res.data?.verificationId ?? "");
      setSmsSent(true);
      toast.success("OTP sent to your phone");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSmsLoading(false);
    }
  };

  const verifySmsOtp = async () => {
    if (!smsOtp.trim()) { toast.error("Enter the OTP"); return; }
    setSmsLoading(true);
    try {
      await api.put("/v1/user/verify-phone-number", { verificationId: smsVerificationId, otp: smsOtp.trim() });
      toast.success("Phone number verified!");
      onVerified(newPhone.replace(/^234/, "0"));
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setSmsLoading(false);
    }
  };

  const initiateWhatsApp = async () => {
    if (!newPhone.trim()) { toast.error("Enter your phone number"); return; }
    setWaLoading(true);
    try {
      const res = await api.post<any>("/v1/user/phone-verify/init-wa", { phoneNumber: newPhone.trim() });
      setWaCode(res.data?.code ?? res.code);
      setWaNumber(res.data?.waNumber ?? res.waNumber);
      setWaSent(true);
      toast.success("Code generated! Send it via WhatsApp");
      startWaPolling();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate code");
    } finally {
      setWaLoading(false);
    }
  };

  const startWaPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setWaPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get<any>("/v1/user/phone-verify/status");
        if (res.verified) {
          clearInterval(pollRef.current!); pollRef.current = null; setWaPolling(false);
          toast.success("Phone number verified!");
          onVerified(res.phoneNumber?.replace(/^234/, "0") ?? newPhone);
        }
      } catch {}
    }, 3000);
    setTimeout(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; setWaPolling(false); } }, 10 * 60 * 1000);
  };

  const reset = () => {
    setMethod(null); setSmsSent(false); setSmsOtp(""); setWaSent(false);
    setWaPolling(false); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  if (!method) {
    return (
      <div className="space-y-3 pt-1">
        <Field label="New Phone Number">
          <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9+]/g, ""))}
            placeholder="08012345678"
            className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
        </Field>
        <p className="text-xs text-neutral-500 font-medium">Verify via:</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMethod("sms")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-neutral-200 text-sm font-semibold text-neutral-700 hover:border-bt-primary hover:text-bt-primary transition-colors">
            <Phone className="w-4 h-4" /> SMS
          </button>
          <button onClick={() => setMethod("whatsapp")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#25D366]/40 bg-[#25D366]/5 text-sm font-semibold text-[#128C7E] hover:border-[#25D366] transition-colors">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>
    );
  }

  if (method === "sms") {
    return (
      <div className="space-y-3 pt-1">
        {!smsSent ? (
          <>
            <Field label="Phone Number">
              <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                placeholder="08012345678"
                className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
            </Field>
            <div className="flex gap-2">
              <button onClick={sendSmsOtp} disabled={smsLoading}
                className="flex-1 py-3 rounded-xl bg-bt-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {smsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                Send OTP
              </button>
              <button onClick={reset} className="px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600">Back</button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-sm text-blue-700">
              An OTP has been sent to <span className="font-semibold">{newPhone}</span>
            </div>
            <Field label="Enter OTP">
              <input type="text" inputMode="numeric" value={smsOtp} onChange={(e) => setSmsOtp(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={6} placeholder="123456"
                className="w-full text-[20px] font-bold text-neutral-900 tracking-[0.3em] bg-transparent focus:outline-none placeholder:text-neutral-300 placeholder:font-normal placeholder:tracking-normal" />
            </Field>
            <div className="flex gap-2">
              <button onClick={verifySmsOtp} disabled={smsLoading}
                className="flex-1 py-3 rounded-xl bg-bt-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {smsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Verify
              </button>
              <button onClick={() => setSmsSent(false)} className="px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600">Resend</button>
            </div>
            <button onClick={reset} className="w-full text-sm font-medium text-neutral-400 hover:text-neutral-600 py-1">Cancel</button>
          </>
        )}
      </div>
    );
  }

  // WhatsApp
  return (
    <div className="space-y-3 pt-1">
      {!waSent ? (
        <>
          <Field label="Phone Number">
            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9+]/g, ""))}
              placeholder="08012345678"
              className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
          </Field>
          <div className="flex gap-2">
            <button onClick={initiateWhatsApp} disabled={waLoading}
              className="flex-1 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-[#20bd5a]">
              {waLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Get WhatsApp Code
            </button>
            <button onClick={reset} className="px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600">Back</button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-[#25D366]/8 border border-[#25D366]/25 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-neutral-800">Send this code to our WhatsApp:</p>
            <div className="flex items-center gap-3">
              <code className="text-xl font-bold text-bt-primary tracking-widest bg-white px-3 py-2 rounded-lg border border-neutral-100 flex-1 text-center">
                {waCode}
              </code>
              {waPolling && (
                <span className="flex items-center gap-1 text-[11px] text-neutral-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> Waiting...
                </span>
              )}
            </div>
            <button onClick={() => window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waCode)}`, "_blank")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20bd5a] active:scale-[0.98] transition-all">
              <MessageCircle className="w-4 h-4" /> Open WhatsApp &amp; Send <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <p className="text-[11px] text-neutral-400 text-center">Code expires in 10 minutes. We&apos;ll auto-detect when you send it.</p>
          </div>
          <button onClick={reset} className="w-full text-sm font-medium text-neutral-400 hover:text-neutral-600 py-1">Cancel</button>
        </>
      )}
    </div>
  );
}

// ─── Email Section ────────────────────────────────────────────────────────────

function EmailSection({ currentEmail, onUpdated }: { currentEmail: string; onUpdated: (email: string) => void }) {
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) { toast.error("Enter a valid email address"); return; }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) { toast.error("That's already your current email"); return; }
    setLoading(true);
    try {
      await api.put("/v1/user/secondary-email", { secondaryEmail: newEmail.trim() });
      setOtpSent(true);
      toast.success(`Verification code sent to ${newEmail}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    if (!otp.trim()) { toast.error("Enter the verification code"); return; }
    setLoading(true);
    try {
      await api.put("/v1/user/confirm-secondary-email", { otp: otp.trim() });
      toast.success("Email updated successfully!");
      onUpdated(newEmail.trim());
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="bg-neutral-100 rounded-xl px-4 py-3">
        <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Current Email</p>
        <p className="text-sm font-semibold text-neutral-700 mt-0.5">{currentEmail}</p>
      </div>

      {!otpSent ? (
        <>
          <Field label="New Email Address">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
          </Field>
          <button onClick={sendOtp} disabled={loading}
            className="w-full py-3 rounded-xl bg-bt-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Verification Code
          </button>
        </>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-sm text-blue-700">
            A code was sent to <span className="font-semibold">{newEmail}</span>. Check your inbox.
          </div>
          <Field label="Verification Code">
            <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)}
              maxLength={8} placeholder="Enter code"
              className="w-full text-[20px] font-bold text-neutral-900 tracking-[0.3em] bg-transparent focus:outline-none placeholder:text-neutral-300 placeholder:font-normal placeholder:tracking-normal" />
          </Field>
          <div className="flex gap-2">
            <button onClick={confirmOtp} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-bt-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm
            </button>
            <button onClick={() => setOtpSent(false)} className="px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600">
              Resend
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Password Section ─────────────────────────────────────────────────────────

function PasswordSection({ onDone }: { onDone: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(newPw);

  const handleSubmit = async () => {
    if (!currentPw) { toast.error("Enter your current password"); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      await api.put("/v1/user/update-password", { formerPassword: currentPw, newPassword: newPw });
      toast.success("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      <Field label="Current Password">
        <div className="flex items-center gap-2">
          <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Your current password"
            className="flex-1 text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-neutral-400 hover:text-neutral-600 shrink-0">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <Field label="New Password">
        <div className="flex items-center gap-2">
          <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)}
            placeholder="At least 8 characters"
            className="flex-1 text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
          <button type="button" onClick={() => setShowNew(!showNew)} className="text-neutral-400 hover:text-neutral-600 shrink-0">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {newPw.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("flex-1 rounded-full transition-colors", i <= strength.score ? strength.color : "bg-neutral-200")} />
              ))}
            </div>
            <p className={cn("text-[11px] font-medium", strength.textColor)}>{strength.label}</p>
          </div>
        )}
      </Field>

      <Field label="Confirm New Password">
        <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Repeat new password"
          className="w-full text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
        {confirmPw.length > 0 && newPw !== confirmPw && (
          <p className="text-[11px] text-red-500 mt-1">Passwords don&apos;t match</p>
        )}
      </Field>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 rounded-xl bg-bt-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        Change Password
      </button>
    </div>
  );
}

// ─── Delete Section ───────────────────────────────────────────────────────────

function DeleteSection({ onDeleted }: { onDeleted: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) { toast.error("Enter your password to confirm"); return; }
    setLoading(true);
    try {
      await api.del("/v1/user/account", { password });
      toast.success("Account deleted");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      {!confirmed ? (
        <>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">This action is permanent</p>
              <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                <li>Your profile and preferences will be erased</li>
                <li>Active listings will be removed</li>
                <li>This cannot be undone</li>
              </ul>
            </div>
          </div>
          <button onClick={() => setConfirmed(true)}
            className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
            I understand, continue
          </button>
        </>
      ) : (
        <>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-sm text-red-700 font-medium">
            Enter your password to confirm account deletion.
          </div>
          <Field label="Password">
            <div className="flex items-center gap-2">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your current password"
                className="flex-1 text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-neutral-400 hover:text-neutral-600 shrink-0">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-red-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Account
            </button>
            <button onClick={() => { setConfirmed(false); setPassword(""); }}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Portfolio Link Section ───────────────────────────────────────────────────

function PortfolioLinkSection({
  currentSlug, currentShareId, onSaved,
}: {
  currentSlug: string | null;
  currentShareId: string | null;
  onSaved: (slug: string, shareId: string) => void;
}) {
  const [slug, setSlug] = useState(currentSlug ?? "");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availMsg, setAvailMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const API_BASE = API_BASE_URL;
  const portfolioUrl = currentSlug
    ? `${API_BASE}/in/${currentSlug}`
    : currentShareId
      ? `https://new.betatenant.com/agents/portfolio/${currentShareId}`
      : null;

  const checkAvailability = async (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setSlug(cleaned);
    if (cleaned.length < 3) { setAvailable(null); setAvailMsg(""); return; }
    setChecking(true);
    try {
      const r = await api.get<any>(`/v1/landlordandagent/share/slug/check/${encodeURIComponent(cleaned)}`);
      setAvailable(r.available);
      setAvailMsg(r.available ? "✓ Available!" : r.reason ?? "Already taken");
    } catch { setAvailable(null); }
    setChecking(false);
  };

  const handleClaim = async () => {
    if (!slug || slug.length < 3) { toast.error("Slug must be at least 3 characters"); return; }
    setSaving(true);
    try {
      const r = await api.put<any>("/v1/landlordandagent/share/slug", { slug });
      if (r.successful) {
        toast.success("Portfolio link saved!");
        onSaved(r.slug, r.shareId);
        setAvailable(null);
      } else {
        toast.error(r.message ?? "Failed to save");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!portfolioUrl) return;
    navigator.clipboard.writeText(portfolioUrl).then(() => toast.success("Link copied!")).catch(() => {});
  };

  return (
    <div className="space-y-4 pt-1">
      <p className="text-xs text-neutral-500 leading-relaxed">
        Your custom portfolio link lets clients find all your listings in one place. Choose a short, memorable name.
      </p>

      {/* Current link display */}
      {portfolioUrl && (
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-xl px-3.5 py-2.5">
          <Link2 className="w-4 h-4 text-bt-primary shrink-0" />
          <span className="flex-1 text-sm text-neutral-700 truncate">{portfolioUrl}</span>
          <button onClick={copyLink} className="text-neutral-400 hover:text-bt-primary transition-colors shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slug input */}
      <div>
        <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">Custom Link</p>
        <div className="bg-neutral-50 rounded-xl border border-neutral-100 px-3.5 py-2.5 flex items-center gap-2">
          <span className="text-xs text-neutral-400 shrink-0 hidden sm:inline">betatenant.com/in/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => checkAvailability(e.target.value)}
            placeholder="your-name"
            maxLength={30}
            className="flex-1 text-[16px] text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300 min-w-0"
          />
          {checking && <Loader2 className="w-4 h-4 animate-spin text-neutral-400 shrink-0" />}
          {!checking && available === true && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          {!checking && available === false && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
        </div>
        {availMsg && (
          <p className={cn("text-xs mt-1.5", available ? "text-emerald-600" : "text-red-500")}>{availMsg}</p>
        )}
        <p className="text-[11px] text-neutral-400 mt-1">Lowercase letters, numbers, and hyphens only. 3-30 characters.</p>
      </div>

      <button
        onClick={handleClaim}
        disabled={saving || !slug || slug.length < 3 || available === false}
        className="w-full py-3 rounded-xl bg-bt-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-bt-primary-light transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {currentSlug ? "Update Link" : "Claim Link"}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, danger, open, onToggle, children,
}: {
  title: string; subtitle?: string; danger?: boolean; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border shadow-sm overflow-hidden transition-all", danger ? "border-red-100" : "border-neutral-100")}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", danger ? "bg-red-50" : "bg-neutral-100")}>
          {danger ? <Trash2 className="w-4 h-4 text-red-500" /> :
            title.includes("Phone") ? <Phone className="w-4 h-4 text-neutral-500" /> :
            title.includes("Email") ? <Mail className="w-4 h-4 text-neutral-500" /> :
            title.includes("Password") ? <Lock className="w-4 h-4 text-neutral-500" /> :
            <User className="w-4 h-4 text-neutral-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", danger ? "text-red-600" : "text-neutral-900")}>{title}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <ChevronRight className={cn("w-4 h-4 text-neutral-400 shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-neutral-50">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <div className="bg-neutral-50 rounded-xl px-3.5 py-2.5 border border-neutral-100">
        {children}
      </div>
    </div>
  );
}

function passwordStrength(pw: string): { score: number; label: string; color: string; textColor: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too weak", color: "bg-red-400", textColor: "text-red-500" },
    { label: "Weak", color: "bg-orange-400", textColor: "text-orange-500" },
    { label: "Fair", color: "bg-yellow-400", textColor: "text-yellow-600" },
    { label: "Strong", color: "bg-green-400", textColor: "text-green-600" },
    { label: "Very strong", color: "bg-green-600", textColor: "text-green-700" },
  ];
  return { score: Math.max(1, score), ...map[Math.min(score, 4)] };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  return <AuthGuard><EditProfileContent /></AuthGuard>;
}
