"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield, Check, X, Settings2, Info } from "lucide-react";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
}

const STORAGE_KEY = "homi_cookie_consent_v1";

export function getStoredCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("open_cookie_preferences"));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredCookiePreferences();
    if (!stored) {
      // Delay display slightly for smooth page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
    }

    const handleOpen = () => {
      const current = getStoredCookiePreferences();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setModalOpen(true);
      setVisible(true);
    };

    window.addEventListener("open_cookie_preferences", handleOpen);
    return () => window.removeEventListener("open_cookie_preferences", handleOpen);
  }, []);

  const savePreferences = async (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);
    setModalOpen(false);

    // Notify application listeners
    window.dispatchEvent(new CustomEvent("cookie_consent_updated", { detail: prefs }));

    // Async record consent to backend under DPDP Act 2023
    try {
      await fetch("/api/v1/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentType: "cookies",
          purpose: `Essential: true, Analytics: ${prefs.analytics}, Marketing: ${prefs.marketing}`,
          consentVersion: "1.0",
          granted: true,
          sessionId: localStorage.getItem("homi_session_id") || "guest-web",
        }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      consentedAt: new Date().toISOString(),
    });
  };

  const handleRejectOptional = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      consentedAt: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    savePreferences({
      essential: true,
      analytics,
      marketing,
      consentedAt: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      <aside
        className="cookie-banner-wrapper"
        aria-label="Privacy & Cookie Preferences"
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          right: 20,
          maxWidth: 620,
          margin: "0 auto",
          zIndex: 9999,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(18, 59, 48, 0.16), 0 2px 10px rgba(0,0,0,0.06)",
          border: "1px solid #dbe6d7",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#eaf3e5",
              color: "#1d4734",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Cookie size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 800,
                color: "#153d2c",
                letterSpacing: "-0.01em",
              }}
            >
              Your Privacy & Cookie Choices
            </h4>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "#5b6e61",
              }}
            >
              We use essential cookies to keep Homi secure and functional. With your consent, we also
              use privacy-respecting analytics to improve your experience in compliance with India&apos;s
              DPDP Act, 2023.{" "}
              <Link
                href="/privacy"
                style={{
                  color: "#1d4734",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Read Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 8,
            paddingTop: 4,
            borderTop: "1px solid #f0f4ef",
          }}
        >
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: "transparent",
              border: "1px solid #d5e0d1",
              color: "#3e5746",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Settings2 size={14} /> Customize
          </button>
          <button
            type="button"
            onClick={handleRejectOptional}
            style={{
              background: "#f4f7f2",
              border: "1px solid #dbe4d7",
              color: "#284b38",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reject Optional
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            style={{
              background: "#123b30",
              border: "1px solid #123b30",
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Accept All
          </button>
        </div>
      </aside>

      {/* Customize Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 25, 20, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: 500,
              borderRadius: 18,
              padding: "24px 26px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={20} color="#1d4734" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#123b30" }}>
                  Manage Cookie Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#6b7f71",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: "#5a7061", lineHeight: 1.5 }}>
              Choose which categories of cookies you want to permit. You can update your choice at
              any time via the footer link.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Essential */}
              <div
                style={{
                  background: "#f7faf5",
                  border: "1px solid #e1ebdc",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong style={{ fontSize: 13, color: "#193f2f" }}>Strictly Necessary Cookies</strong>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        background: "#e4efe0",
                        color: "#28523b",
                        borderRadius: 4,
                      }}
                    >
                      Always Active
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#617768", lineHeight: 1.45 }}>
                    Required for security, user sessions, language selection, and service booking functionality.
                  </p>
                </div>
                <input type="checkbox" checked disabled style={{ marginTop: 4, accentColor: "#1d4734" }} />
              </div>

              {/* Analytics */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e1ebdc",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: 13, color: "#193f2f" }}>Performance & Analytics</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#617768", lineHeight: 1.45 }}>
                    Helps us understand how users navigate the platform and detect errors so we can improve responsiveness.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  style={{ marginTop: 4, width: 17, height: 17, accentColor: "#123b30", cursor: "pointer" }}
                />
              </div>

              {/* Marketing */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e1ebdc",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: 13, color: "#193f2f" }}>Marketing & Recommendations</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#617768", lineHeight: 1.45 }}>
                    Used to present relevant localized service recommendations and track referral campaigns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  style={{ marginTop: 4, width: 17, height: 17, accentColor: "#123b30", cursor: "pointer" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleRejectOptional}
                style={{
                  background: "#f4f7f2",
                  border: "1px solid #dbe4d7",
                  color: "#3b5543",
                  padding: "10px 16px",
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  background: "#123b30",
                  border: "1px solid #123b30",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Check size={16} /> Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
