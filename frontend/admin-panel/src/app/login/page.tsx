"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Wrench, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your administrator email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setError(err.message || "Invalid credentials or unauthorized.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf5] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-icon.svg" alt="homi" width={36} height={36} className="shrink-0" />
            <span className="text-3xl font-extrabold text-[#123b30] tracking-tight font-['Manrope']">
              homi<span className="text-[#a1c347]">.</span>
            </span>
            <span className="text-xs font-extrabold bg-[#d9ed89] text-[#123b30] px-2 py-0.5 rounded uppercase tracking-wider">
              Admin
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#123b30]">
            Marketplace Control Console
          </h1>
          <p className="text-xs text-[#718078] mt-1">
            Sign in with authorized administrator credentials
          </p>
        </div>

        {/* Login Card */}
        <div className="homi-card p-7 sm:p-8 space-y-5 bg-white rounded-2xl shadow-sm border border-[#e5ebe4]">
          {error && (
            <div className="p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#183c31] mb-1.5 uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718078] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-medium text-[#183c31] placeholder-[#718078] outline-none focus:border-[#123b30] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183c31] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718078] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-medium text-[#183c31] placeholder-[#718078] outline-none focus:border-[#123b30] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718078] hover:text-[#123b30]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-dark w-full py-3 text-xs font-extrabold shadow-sm mt-2 flex items-center justify-center gap-2 bg-[#123b30] text-white rounded-lg hover:bg-[#1a4f41] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-[#e5ebe4] text-center flex items-center justify-center gap-1.5 text-[11px] text-[#718078]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#406a48]" />
            <span>Authorized administrators only • Protected access</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#718078] mt-6">
          © {new Date().getFullYear()} homi. Secure Operator Dashboard
        </p>
      </div>
    </main>
  );
}
