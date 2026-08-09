"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi, api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import toast from "react-hot-toast";

type Step = "login" | "verify" | "forgot" | "reset";

export default function LoginPageWrapper() {
  return <Suspense><LoginPage /></Suspense>;
}

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ otp: "", password: "", verificationToken: "" });

  const canSubmit = form.email.trim().length > 2 && form.password.trim().length > 2;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      if (res.successful) {
        setAuth(res.token, res.userDetails);
        toast.success("Login successful!");
        const from = searchParams.get("from");
        const role = res.userDetails?.role;
        // Role-based default: agents/landlords → listings, tenants → property search
        const defaultPath = (role === "agent" || role === "landlord") ? "/account/properties" : "/properties";
        setTimeout(() => router.push(from || defaultPath), 300);
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg === "Email not verified" || msg.includes("not verified")) {
        // Trigger resend OTP so they can verify
        try {
          const r = await api.post<any>("/v1/auth/resend-otp", { email: form.email });
          setVerificationId(r.verificationToken || "");
        } catch { /* ignore */ }
        toast.error("Email not verified — check your inbox for the code");
        setStep("verify");
      } else if (msg === "invalid-credentials" || msg.includes("credentials")) {
        toast.error("Invalid email or password");
      } else if (msg === "account-not-found" || msg.includes("not-found")) {
        toast.error("No account found with this email");
        router.push("/auth/signup");
      } else {
        toast.error(msg || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyEmail(verificationId, otp);
      toast.success("Email verified! You can now log in.");
      setOtp("");
      setStep("login");
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerify = async () => {
    setResendLoading(true);
    try {
      const r = await api.post<any>("/v1/auth/resend-otp", { email: form.email });
      setVerificationId(r.verificationToken || "");
      toast.success("Code resent to your email");
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post<any>("/v1/auth/forgot-password", { email: forgotEmail });
      setResetForm((f) => ({ ...f, verificationToken: r.verificationToken || "" }));
      toast.success("Reset code sent to your email");
      setStep("reset");
    } catch (err: any) {
      toast.error(err.message || "Email not found");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/v1/auth/reset-password", {
        verificationToken: resetForm.verificationToken,
        otp: resetForm.otp,
        newPassword: resetForm.password,
      });
      toast.success("Password reset successfully!");
      setTimeout(() => setStep("login"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-72px)] flex items-center justify-center px-5 py-10">
      <AnimatePresence mode="wait">

        {/* ── Login ── */}
        {step === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link href="/">
                <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
              </Link>
              <h1 className="text-[24px] font-bold text-bt-primary">Welcome back</h1>
              <p className="text-neutral-500 mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email address">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={cn(inputCls, "pl-11")}
                  />
                </div>
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={cn(inputCls, "pl-11 pr-11")}
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep("forgot")}
                  className="text-sm text-neutral-500 underline hover:text-neutral-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : "Log in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Save the intended destination before leaving the page
                  const from = searchParams.get("from");
                  if (from) {
                    try { sessionStorage.setItem("BT_LOGIN_FROM", from); } catch {}
                  }
                  const apiBase = window.location.hostname === "localhost" ? "/api/bt" : "https://api.betatenant.com";
                  window.location.href = `${apiBase}/v1/auth/login/federated/google`;
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

            <p className="text-center text-neutral-500 text-sm mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline text-bt-secondary font-medium">
                Sign up instead
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── Email Verify (after unverified login attempt) ── */}
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
              <h1 className="text-[24px] font-bold text-bt-primary">Verify your email</h1>
              <p className="text-neutral-500 mt-1">
                We sent a code to <span className="font-semibold text-neutral-700">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <Field label="Enter verification code">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    className={cn(inputCls, "pl-11 text-center text-xl tracking-[0.3em] font-bold")}
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
                onClick={handleResendVerify}
                disabled={resendLoading}
                className="w-full py-3.5 rounded-full border-2 border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Please wait..." : "Resend code"}
              </button>
            </form>

            <p className="text-center text-neutral-500 text-sm mt-5">
              Wrong email?{" "}
              <button onClick={() => setStep("login")} className="underline text-bt-secondary font-semibold">
                Go back
              </button>
            </p>
          </motion.div>
        )}

        {/* ── Forgot Password ── */}
        {step === "forgot" && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link href="/">
                <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
              </Link>
              <h1 className="text-[24px] font-bold text-bt-primary">Forgot password?</h1>
              <p className="text-neutral-500 mt-1">Enter your email and we'll send a reset code</p>
            </div>

            <form onSubmit={handleForgot} className="space-y-4">
              <Field label="Email address">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={cn(inputCls, "pl-11")}
                  />
                </div>
              </Field>

              <button
                type="submit"
                disabled={loading || !forgotEmail.includes("@")}
                className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Send reset code"}
              </button>
            </form>

            <p className="text-center text-neutral-500 text-sm mt-5">
              <button onClick={() => setStep("login")} className="underline text-bt-secondary font-medium">
                ← Back to login
              </button>
            </p>
          </motion.div>
        )}

        {/* ── Reset Password ── */}
        {step === "reset" && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link href="/">
                <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={140} height={36} className="h-9 w-auto mx-auto mb-6" />
              </Link>
              <h1 className="text-[24px] font-bold text-bt-primary">Reset your password</h1>
              <p className="text-neutral-500 mt-1">Enter the code sent to {forgotEmail}</p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <Field label="Verification code">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="000000"
                    value={resetForm.otp}
                    onChange={(e) => setResetForm({ ...resetForm, otp: e.target.value.replace(/\D/g, "") })}
                    maxLength={6}
                    className={cn(inputCls, "pl-11 text-center text-xl tracking-[0.3em] font-bold")}
                  />
                </div>
              </Field>

              <Field label="New password">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={resetForm.password}
                    onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                    className={cn(inputCls, "pl-11 pr-11")}
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

              <button
                type="submit"
                disabled={loading || resetForm.otp.length < 4 || resetForm.password.length < 6}
                className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Reset password"}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all";
