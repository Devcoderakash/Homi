"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck, Mail, KeyRound, AlertCircle } from "lucide-react";
import { Logo, useCurrentUser } from "@/components/site";
import { LanguagePicker, useAppCopy, useLanguage } from "@/components/language";
import { indianMobile } from "@/lib/india";
import { supabase, syncSessionCookie, isSupabaseConfigured } from "@/lib/supabase";

function AuthContent() {
  const params = useSearchParams();
  const { user } = useCurrentUser();
  const { language, t } = useLanguage();
  const { a } = useAppCopy();

  const initialMode = params.get("mode") === "register"
    ? "register"
    : params.get("mode") === "forgot"
    ? "forgot"
    : params.get("mode") === "reset"
    ? "reset"
    : "login";

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    newPassword: "",
    city: "Bhopal",
  });

  const guest = user?.email.endsWith("@guest.homi.local");

  useEffect(() => {
    if (guest && user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name,
        phone: f.phone || indianMobile(user.phone) || "",
        city: f.city || user.city || "Bhopal",
      }));
    }
  }, [user, guest]);

  useEffect(() => {
    const m = params.get("mode");
    if (m === "register" || m === "login" || m === "forgot" || m === "reset") {
      setMode(m);
    }
  }, [params]);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const redirectAfterAuth = () => {
    const next = params.get("next");
    const destination =
      next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
        ? next
        : "/customer";
    window.location.assign(destination);
  };

  // --- 1. Customer Login ---
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password;

      // Try Supabase Auth first if configured
      if (isSupabaseConfigured()) {
        const { data, error: sbErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (sbErr) {
          throw new Error(sbErr.message);
        }

        if (data.session) {
          syncSessionCookie(data.session.access_token);
          // Sync with Go backend
          await fetch("/api/me", {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            credentials: "include",
          }).catch(() => null);

          redirectAfterAuth();
          return;
        }
      }

      // Fallback to Go backend direct authentication
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email,
          password,
          role: "customer",
          language,
        }),
      });

      const resData = await res.json().catch(() => null);
      if (!res.ok || !resData?.ok) {
        throw new Error(resData?.error || "Invalid email or password.");
      }

      if (resData.token) {
        syncSessionCookie(resData.token);
      }

      redirectAfterAuth();
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please verify your credentials.");
      setLoading(false);
    }
  }

  // --- 2. Customer Registration ---
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password;
      const name = form.name.trim();
      const phone = form.phone.trim();
      const city = form.city.trim() || "Bhopal";

      if (isSupabaseConfigured()) {
        const { data, error: sbErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
              phone,
              city,
            },
          },
        });

        if (sbErr) {
          throw new Error(sbErr.message);
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          setNotice(
            `A confirmation email has been sent to ${email}. Please check your inbox and verify your email address to complete registration.`
          );
          setLoading(false);
          return;
        }

        if (data.session) {
          syncSessionCookie(data.session.access_token);
          // Sync with Go backend
          await fetch("/api/me", {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            credentials: "include",
          }).catch(() => null);

          redirectAfterAuth();
          return;
        }
      }

      // Fallback to Go backend direct registration
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name,
          email,
          phone,
          password,
          city,
          role: "customer",
          language,
        }),
      });

      const resData = await res.json().catch(() => null);
      if (!res.ok || !resData?.ok) {
        throw new Error(resData?.error || "Registration could not be completed.");
      }

      if (resData.token) {
        syncSessionCookie(resData.token);
      }

      redirectAfterAuth();
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your details.");
      setLoading(false);
    }
  }

  // --- 3. Forgot Password Request ---
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const email = form.email.trim().toLowerCase();
      if (!email) {
        throw new Error("Please enter your registered email address.");
      }

      if (isSupabaseConfigured()) {
        const redirectTo = `${window.location.origin}/auth?mode=reset`;
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (resetErr) {
          throw new Error(resetErr.message);
        }
      }

      setNotice(
        `If an account exists for ${email}, a password reset link has been sent. Please check your inbox and spam folder.`
      );
    } catch (err: any) {
      setError(err?.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  }

  // --- 4. Password Reset Form ---
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const newPassword = form.newPassword;
      if (!newPassword || newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (isSupabaseConfigured()) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateErr) {
          throw new Error(updateErr.message);
        }
      }

      setNotice("Your password has been successfully reset! You can now sign in.");
      setMode("login");
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Reset link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-main">
        <div className="auth-top">
          <Logo />
          <LanguagePicker />
          <Link href="/" className="back-link">
            <ArrowLeft size={17} />
            {t("backHome")}
          </Link>
        </div>

        <div className="auth-form-wrap real-auth">
          <div className="auth-label">CUSTOMER PORTAL</div>

          {mode === "login" && (
            <>
              <h1>Welcome Back</h1>
              <p className="auth-intro">
                Sign in with your verified customer credentials to track your service requests, review quotations, and view appointments.
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <h1>Create Customer Account</h1>
              <p className="auth-intro">
                Sign up to connect with verified local technicians, receive instant quotes, and track your repair appointments.
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h1>Reset Your Password</h1>
              <p className="auth-intro">
                Enter your registered email address and we will send you a secure link to reset your account password.
              </p>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1>Set New Password</h1>
              <p className="auth-intro">
                Choose a strong new password for your customer account (minimum 8 characters).
              </p>
            </>
          )}

          {/* Mode Switch Tabs (Login / Register) */}
          {(mode === "login" || mode === "register") && (
            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setNotice("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                  setNotice("");
                }}
              >
                New Customer
              </button>
            </div>
          )}

          {guest && mode === "register" && (
            <p className="auth-upgrade-note">
              Save your ongoing service request to your permanent customer account so you can easily track it later.
            </p>
          )}

          {notice && (
            <div className="success-alert" role="status" style={{ marginBottom: 16 }}>
              <Check size={18} />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>{notice}</p>
            </div>
          )}

          {error && (
            <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Form: LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="form-stack">
              <div className="form-field">
                <label htmlFor="login-email">Email Address *</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>

              <div className="form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="login-password">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setNotice("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1f5847",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={128}
                    autoComplete="current-password"
                    value={form.password}
                    placeholder="Enter your password"
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-dark form-submit" disabled={loading}>
                {loading ? "Signing In…" : "Sign In →"}
              </button>
            </form>
          )}

          {/* Form: REGISTER */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="form-stack">
              <div className="form-field">
                <label htmlFor="reg-name">Full Name *</label>
                <input
                  id="reg-name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={form.name}
                  placeholder="Enter your full name"
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-phone">Mobile Number *</label>
                <div className="india-phone">
                  <span>🇮🇳 +91</span>
                  <input
                    id="reg-phone"
                    required
                    type="tel"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={form.phone}
                    placeholder="10-digit mobile number"
                    onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="reg-city">City *</label>
                <input
                  id="reg-city"
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.city}
                  placeholder="e.g. Bhopal"
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-email">Email Address *</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-password">Password *</label>
                <div className="password-wrap">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.password}
                    placeholder="At least 8 characters"
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-dark form-submit" disabled={loading}>
                {loading ? "Creating Account…" : "Create Customer Account →"}
              </button>
            </form>
          )}

          {/* Form: FORGOT PASSWORD */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="form-stack">
              <div className="form-field">
                <label htmlFor="forgot-email">Registered Email Address *</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>

              <button className="btn btn-dark form-submit" disabled={loading}>
                {loading ? "Sending Reset Link…" : "Send Reset Link →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setNotice("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#557e62",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Form: SET NEW PASSWORD */}
          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="form-stack">
              <div className="form-field">
                <label htmlFor="reset-new-password">New Password *</label>
                <div className="password-wrap">
                  <input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.newPassword}
                    placeholder="At least 8 characters"
                    onChange={(e) => update("newPassword", e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-dark form-submit" disabled={loading}>
                {loading ? "Updating Password…" : "Update Password & Sign In →"}
              </button>
            </form>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e5ebe4", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#718078" }}>
              Are you a service professional?{" "}
            </span>
            <Link
              href="/become-a-worker"
              style={{ fontSize: 13, color: "#225746", fontWeight: 800, textDecoration: "underline" }}
            >
              Apply as a Worker →
            </Link>
          </div>
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-side-image" />
        <div className="auth-side-overlay" />
        <div className="auth-side-content">
          <div className="auth-pill">
            <ShieldCheck size={16} />
            HOMI CUSTOMER CARE
          </div>
          <h2>
            Ghar ka kaam?<br />
            Find help near you.
          </h2>
          <p>
            Track your repair requests, review quotes, and schedule verified service technicians directly from your dashboard.
          </p>
          <div className="auth-side-checks">
            <span>
              <Check size={16} />
              No upfront charges
            </span>
            <span>
              <Check size={16} />
              Direct phone contact
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="page-loading">Loading…</div>}>
      <AuthContent />
    </Suspense>
  );
}
