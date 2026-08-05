"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Home, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

type Step = "role" | "form" | "verify";

const ROLES = [
  {
    value: "user",
    label: "I'm a Tenant",
    subtitle: "Find apartments, book rentals, and move in faster.",
    icon: User,
  },
  {
    value: "landlord",
    label: "I'm a Landlord",
    subtitle: "List properties, earn rent, and grow your income.",
    icon: Home,
  },
  {
    value: "agent",
    label: "I'm an Agent",
    subtitle: "List properties, manage rentals, and reach more tenants.",
    icon: Users,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agree: false,
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Restore role from localStorage (matches live site pattern)
  useEffect(() => {
    const saved = localStorage.getItem("usrLoginType");
    if (saved) {
      setRole(saved);
      setStep("form");
    }
  }, []);

  const selectRole = (value: string) => {
    setRole(value);
    localStorage.setItem("usrLoginType", value);
    setTimeout(() => setStep("form"), 300);
  };

  const validate = () => {
    const e = { firstName: "", lastName: "", email: "", password: "" };
    if (form.firstName.trim().length < 2) e.firstName = "First name must be at least 2 characters";
    if (form.lastName.trim().length < 2) e.lastName = "Last name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.password.trim().length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.register(form.firstName, form.lastName, form.email, form.password);
      if (res.successful) {
        setVerificationId(res.verificationId);
        localStorage.setItem("verifyVTK", res.verificationId);
        localStorage.setItem("usrEml", form.email);
        toast.success(res.message || "Registration successful");
        setStep("verify");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyEmail(verificationId, otp);
      toast.success("Email verified successfully!");
      localStorage.removeItem("usrLoginType");
      localStorage.removeItem("verifyVTK");
      localStorage.removeItem("usrEml");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await fetch("/api/bt/v1/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      toast.success("Code resent to your email");
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-72px)] flex items-center justify-center px-5 py-10">
      <AnimatePresence mode="wait">

        {/* ── Step 1: Role ── */}
        {step === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link href="/">
                <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
              </Link>
              <h1 className="text-[24px] font-bold text-bt-primary">Select Preference</h1>
              <p className="text-neutral-500 mt-1">Select your preferred mode of signing up</p>
            </div>

            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => selectRole(r.value)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-bt-primary/50",
                    role === r.value
                      ? "border-bt-primary bg-bt-primary/5"
                      : "border-neutral-200 bg-white"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
                    <r.icon className="w-5 h-5 text-bt-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{r.label}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{r.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-neutral-500 mt-6">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline text-bt-secondary font-medium">
                Log in instead
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── Step 2: Form ── */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link href="/">
                <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
              </Link>
              <h1 className="text-[24px] font-bold text-bt-primary">
                {role === "user" ? "Create a Tenant Account" : role === "landlord" ? "Create a Landlord Account" : "Create an Agent Account"}
              </h1>
              <p className="text-neutral-500 mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First name" error={errors.firstName}>
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className={inputCls(!!errors.firstName)}
                  />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className={inputCls(!!errors.lastName)}
                  />
                </Field>
              </div>

              <Field label="Email address" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={cn(inputCls(!!errors.email), "pl-11")}
                  />
                </div>
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your preferred password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={cn(inputCls(!!errors.password), "pl-11 pr-11")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  className="w-4 h-4 mt-0.5 accent-bt-primary"
                />
                <span className="text-neutral-500">
                  I have read and agreed to the{" "}
                  <Link href="/terms-and-conditions" className="text-bt-primary underline">Terms of Use</Link>{" "}
                  and{" "}
                  <Link href="/privacy-policies" className="text-bt-primary underline">Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={!form.agree || loading}
                className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : "Sign up"}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "https://api.betatenant.com/v1/auth/login/federated/google";
                }}
                className="w-full py-3.5 rounded-full border-2 border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="flex items-center justify-between mt-5">
              <button onClick={() => setStep("role")} className="text-sm text-neutral-400 hover:text-neutral-600 underline">
                ← Change role
              </button>
              <p className="text-sm text-neutral-500">
                Have an account?{" "}
                <Link href="/auth/login" className="underline text-bt-secondary font-medium">Log in</Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: OTP Verify ── */}
        {step === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link href="/">
                <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
              </Link>
              <h1 className="text-[24px] font-bold text-bt-primary">Verify your email address</h1>
              <p className="text-neutral-500 mt-1">
                We sent a verification code to{" "}
                <span className="font-semibold text-neutral-700">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <Field label="Enter verification code">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="000-000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className={cn(inputCls(false), "pl-11 text-center text-xl tracking-[0.3em] font-bold")}
                  />
                </div>
              </Field>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Continue"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-3.5 rounded-full border-2 border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Please wait..." : "Resend code"}
              </button>
            </form>

            <p className="text-center text-neutral-500 text-sm mt-5">
              Wrong email?{" "}
              <button onClick={() => setStep("form")} className="underline text-bt-secondary font-semibold">
                Change email
              </button>
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-4 py-3.5 rounded-xl border bg-white text-[16px] focus:outline-none focus:ring-2 transition-all",
    hasError
      ? "border-red-400 focus:ring-red-100"
      : "border-neutral-200 focus:ring-bt-primary/20 focus:border-bt-primary"
  );
}
