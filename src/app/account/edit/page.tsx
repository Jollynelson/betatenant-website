"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Camera, Loader2, Check, User, Mail, Phone, MapPin, Briefcase,
  MessageCircle, ExternalLink, CheckCircle2, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function EditProfileContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [agentBasedLocation, setAgentBasedLocation] = useState("");
  const [yearsOfRentalExperience, setYearsOfRentalExperience] = useState("");

  // WhatsApp verification state
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyWaNumber, setVerifyWaNumber] = useState("");
  const [verifySent, setVerifySent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyPolling, setVerifyPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const role = user?.role ?? "user";
  const isAgentOrLandlord = role === "agent" || role === "landlord";

  useEffect(() => {
    const endpoint = isAgentOrLandlord ? "/v1/landlordandagent/profile" : "/v1/user/profile";
    api.get<any>(endpoint)
      .then((r) => {
        const p = r.profile ?? r.user ?? r;
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setEmail(p.email ?? "");
        const rawPhone = p.phoneNumber ? String(p.phoneNumber) : "";
        setPhoneNumber(rawPhone.replace(/^234/, "0"));
        setPhoneVerified(!!p.phoneNumberVerified);
        setProfilePic(p.profilePic ?? "");
        setAgentBasedLocation(p.agentBasedLocation ?? "");
        setYearsOfRentalExperience(p.yearsOfRentalExperience ?? "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const initiateWhatsAppVerify = async () => {
    if (!newPhone.trim()) {
      toast.error("Enter your phone number");
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await api.post<any>("/v1/user/phone-verify/init-wa", { phoneNumber: newPhone.trim() });
      setVerifyCode(res.data.code);
      setVerifyWaNumber(res.data.waNumber);
      setVerifySent(true);
      toast.success("Code generated! Send it via WhatsApp");
      startPolling();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate code");
    } finally {
      setVerifyLoading(false);
    }
  };

  const openWhatsApp = () => {
    const waUrl = `https://wa.me/${verifyWaNumber}?text=${encodeURIComponent(verifyCode)}`;
    window.open(waUrl, "_blank");
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setVerifyPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get<any>("/v1/user/phone-verify/status");
        if (res.verified) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setVerifyPolling(false);
          setPhoneNumber(res.phoneNumber?.replace(/^234/, "0") ?? newPhone);
          setPhoneVerified(true);
          setEditingPhone(false);
          setVerifySent(false);
          toast.success("Phone number verified!");
        }
      } catch {}
    }, 3000);
    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setVerifyPolling(false);
      }
    }, 10 * 60 * 1000);
  };

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
      toast.success("Profile updated");
      router.back();
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

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const apiBase = window.location.hostname === "localhost"
        ? "/api/bt" : "https://api.betatenant.com";
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
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPic(false);
    }
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 rounded-full bg-bt-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-bt-primary-light transition-colors flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-bt-primary" />
          </div>
        ) : (
          <>
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {profilePic ? (
                  <Image src={profilePic} alt="Profile" width={96} height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-bt-primary flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingPic}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-bt-primary border-2 border-white flex items-center justify-center shadow-sm hover:bg-bt-primary-light transition-colors disabled:opacity-50"
                >
                  {uploadingPic ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <p className="text-xs text-neutral-400 mt-2">Tap to change photo</p>
            </div>

            {/* Form Fields */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-4">
              <FieldRow icon={User} label="First Name">
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-[16px] text-neutral-900 font-medium bg-transparent focus:outline-none placeholder:text-neutral-300"
                  placeholder="First name" />
              </FieldRow>

              <FieldRow icon={User} label="Last Name">
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-[16px] text-neutral-900 font-medium bg-transparent focus:outline-none placeholder:text-neutral-300"
                  placeholder="Last name" />
              </FieldRow>

              <FieldRow icon={Mail} label="Email" disabled>
                <p className="text-[16px] text-neutral-400 font-medium">{email}</p>
                <p className="text-[10px] text-neutral-300 mt-0.5">Email cannot be changed</p>
              </FieldRow>

              <FieldRow icon={Phone} label="Phone Number">
                {!editingPhone ? (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[16px] text-neutral-900 font-medium">
                        {phoneNumber || "Not set"}
                        {phoneVerified && (
                          <span className="inline-flex items-center gap-0.5 ml-2 text-[11px] text-bt-success font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingPhone(true); setNewPhone(phoneNumber); setVerifySent(false); }}
                      className="text-xs font-semibold text-bt-primary hover:underline shrink-0"
                    >
                      {phoneNumber ? "Change" : "Add"}
                    </button>
                  </div>
                ) : !verifySent ? (
                  <div className="space-y-3">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                      placeholder="08012345678"
                      className="w-full text-[16px] text-neutral-900 font-medium bg-neutral-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bt-primary/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={initiateWhatsAppVerify}
                        disabled={verifyLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20bd5a] transition-colors disabled:opacity-50"
                      >
                        {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                        Verify via WhatsApp
                      </button>
                      <button
                        onClick={() => { setEditingPhone(false); setVerifySent(false); }}
                        className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-[#25D366]/8 border border-[#25D366]/20 rounded-xl p-3.5">
                      <p className="text-sm font-semibold text-neutral-900 mb-1">Send this code via WhatsApp:</p>
                      <div className="flex items-center gap-2 mb-3">
                        <code className="text-lg font-bold text-bt-primary tracking-wider bg-white px-3 py-1.5 rounded-lg border border-neutral-100">
                          {verifyCode}
                        </code>
                        {verifyPolling && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                            <Clock className="w-3 h-3 animate-pulse" /> Waiting...
                          </span>
                        )}
                      </div>
                      <button
                        onClick={openWhatsApp}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20bd5a] active:scale-[0.98] transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Open WhatsApp & Send
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[11px] text-neutral-400 mt-2 text-center">
                        Code expires in 10 minutes. We&apos;ll auto-detect when you send it.
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingPhone(false); setVerifySent(false); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } setVerifyPolling(false); }}
                      className="w-full py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </FieldRow>

              {isAgentOrLandlord && (
                <>
                  <FieldRow icon={MapPin} label="Location">
                    <input type="text" value={agentBasedLocation} onChange={(e) => setAgentBasedLocation(e.target.value)}
                      className="w-full text-[16px] text-neutral-900 font-medium bg-transparent focus:outline-none placeholder:text-neutral-300"
                      placeholder="e.g. Lekki, Lagos" />
                  </FieldRow>

                  <FieldRow icon={Briefcase} label="Years of Experience">
                    <input type="text" value={yearsOfRentalExperience} onChange={(e) => setYearsOfRentalExperience(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full text-[16px] text-neutral-900 font-medium bg-transparent focus:outline-none placeholder:text-neutral-300"
                      placeholder="e.g. 5" />
                  </FieldRow>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FieldRow({ icon: Icon, label, disabled, children }: {
  icon: any; label: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-3 pb-4 border-b border-neutral-50 last:border-0 last:pb-0", disabled && "opacity-60")}>
      <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return <AuthGuard><EditProfileContent /></AuthGuard>;
}
