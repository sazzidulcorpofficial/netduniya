"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Wallet, 
  CreditCard, 
  FileText, 
  Building2,
  Shield,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, user, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (user) {
      if (redirectParam) {
        router.replace(redirectParam);
      } else if (isAdmin || isSuperAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, isAdmin, isSuperAdmin, redirectParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" || 
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email address or password. Please verify your login credentials.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many unsuccessful attempts. For your security, please wait a few minutes before trying again.");
      } else {
        setError(err.message || "Unable to sign in. Please check your internet connection.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden bg-slate-100/60">
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-0" />

      <div className="max-w-4xl w-full relative z-10 my-4 shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* ═══════════════════════════════════════════════════════════════════════
              LEFT COLUMN: BRAND SHOWCASE & TRUST METRICS (Desktop & Tablet)
              ═══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle decorative circles */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-amber-500/20 blur-2xl" />

            {/* Top Brand Header */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-13 h-13 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-emerald-400 to-blue-500 shadow-xl flex-shrink-0 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="https://i.ibb.co/SwRRLf7R/file-00000000cf547209bfa39d10d03ef966.png" 
                      alt="NetDuniya Logo" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white">
                    NET<span className="text-amber-400">DUNIYA</span>
                  </h2>
                  <p className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider">
                    Digital Citizen Services
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-[11px] font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>Authorized Citizen Portal</span>
                </div>
                <h3 className="text-lg font-black text-white mt-2 leading-snug">
                  Fast, Secure & Verified E-Governance Assistance
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  Single-sign-on access to smart PVC card printing, digital citizen wallet, document processing, and 100+ government scheme assistance.
                </p>
              </div>

              {/* Key Highlights List */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wallet className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Digital Wallet & Instant Refunds</span>
                    <span className="text-[11px] text-slate-400">Instant wallet credit on any canceled order</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CreditCard className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Smart PVC Card Dispatch Tracking</span>
                    <span className="text-[11px] text-slate-400">Live speed-post & courier dispatch updates</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">256-Bit SSL Encrypted Security</span>
                    <span className="text-[11px] text-slate-400">Strict citizen data privacy & encryption</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Developer / Corporate Attribution */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-medium text-slate-300">A Digital Initiative & Venture of:</span>
              </div>
              <p className="font-black text-amber-300 tracking-wide uppercase flex items-center space-x-1">
                <span>Sazzidul Corporation</span>
                <Sparkles className="h-3 w-3 text-amber-400 ml-1 inline" />
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              RIGHT COLUMN: MODERN LOGIN FORM
              ═══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Form Title */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Citizen & Staff Login
                  </span>
                  <Link 
                    href="/"
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center space-x-1"
                  >
                    <span>Public Home</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5">
                  Sign In to Portal
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Enter your registered email ID and password to access your applications and services.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs rounded-xl flex items-start space-x-2.5 animate-fadeIn shadow-sm">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Sign In Failed</span>
                    <span className="font-medium text-rose-800">{error}</span>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="text-rose-500 hover:text-rose-800 font-bold p-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                    Email Address / User ID *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="citizen@example.com"
                      autoComplete="email"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-brand-blue focus:outline-none transition shadow-sm"
                    />
                    <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                      Password *
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="text-xs font-bold text-brand-blue hover:text-blue-800 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-brand-blue focus:outline-none transition shadow-sm"
                    />
                    <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-brand-blue via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration Link / Alternate Action */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold">New to NetDuniya?</span>
                </div>
              </div>

              <Link
                href={`/register?redirect=${encodeURIComponent(redirectParam || "")}`}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-300 hover:border-brand-blue bg-white hover:bg-blue-50/50 text-slate-800 hover:text-brand-blue font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>Create Free Citizen Account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Trust Footer Badges */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
              <div className="flex items-center space-x-1 text-emerald-700 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>256-Bit SSL Protected</span>
              </div>
              <div className="flex items-center space-x-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>Need assistance? <Link href="/support" className="text-brand-blue font-bold underline">Help Center</Link></span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-600 font-bold text-sm">Loading NetDuniya Portal Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
