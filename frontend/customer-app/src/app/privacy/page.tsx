"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/site";
import { Shield, Lock, FileText, CheckCircle2, AlertCircle, Send, Download, HelpCircle, ArrowLeft } from "lucide-react";

interface GrievanceOfficer {
  name: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  instructions: string;
}

export default function PrivacyPolicyPage() {
  const [officer, setOfficer] = useState<GrievanceOfficer | null>(null);

  // SAR Form state
  const [requestType, setRequestType] = useState<string>("ACCESS");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Data export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    fetch("/api/v1/privacy/grievance-officer")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.officer) {
          setOfficer(data.officer);
        }
      })
      .catch(() => {
        // Fallback default
        setOfficer({
          name: "Data Protection & Grievance Officer",
          designation: "Grievance Redressal Officer",
          email: "grievance@homi.local",
          phone: "+91 755 000 0000",
          address: "Homi Platform Operations, Arera Colony, Bhopal, Madhya Pradesh - 462016, India",
          instructions:
            "Complaints will be acknowledged within 24 hours and addressed within 15 days in accordance with the Digital Personal Data Protection Act, 2023.",
        });
      });
  }, []);

  const handleSARSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/privacy/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          contactEmail: email,
          contactPhone: phone,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setSuccessMsg(`Your request (#HOMI-SAR-${data.requestId}) has been received. Our Grievance Officer will review and contact you at ${email}.`);
      setDetails("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadData = async () => {
    setExporting(true);
    setExportError("");
    try {
      const res = await fetch("/api/v1/privacy/export");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Please sign in to download your personal data.");

      // Trigger download
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homi-personal-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || "Could not export data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Header />
      <main style={{ background: "#f8faf7", minHeight: "100vh", padding: "40px 16px 90px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#3e5c4a",
              textDecoration: "none",
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {/* Title Header */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "36px 32px",
              border: "1px solid #e2ebe0",
              boxShadow: "0 4px 20px rgba(18, 59, 48, 0.04)",
              marginBottom: 28,
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#e8f3e3", borderRadius: 30, color: "#19422e", fontSize: 12, fontWeight: 800, marginBottom: 14 }}>
              <Shield size={16} /> Digital Personal Data Protection Act (DPDP), 2023 Compliant
            </div>
            <h1 style={{ fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 800, color: "#123b30", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Privacy Policy & Personal Data Notice
            </h1>
            <p style={{ fontSize: 15, color: "#5d7364", lineHeight: 1.6, margin: 0 }}>
              Last Updated: November 2026 • Effective for all Homi Platform users across India.
            </p>
          </div>

          {/* Policy Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Section 1: Introduction */}
            <article style={{ background: "#ffffff", borderRadius: 16, padding: "28px 30px", border: "1px solid #e5ede3" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", marginTop: 0, marginBottom: 12 }}>
                1. Purpose & Notice of Data Collection
              </h2>
              <p style={{ fontSize: 14.5, color: "#4f6556", lineHeight: 1.7, margin: 0 }}>
                Homi (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;) operates as a Data Fiduciary in accordance with India&apos;s
                <strong> Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the Digital Personal Data Protection Rules, 2025.
                We are committed to processing your personal data lawfully, transparently, and strictly for the specified household service purposes for which you provide it.
              </p>
            </article>

            {/* Section 2: Data Collected */}
            <article style={{ background: "#ffffff", borderRadius: 16, padding: "28px 30px", border: "1px solid #e5ede3" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", marginTop: 0, marginBottom: 12 }}>
                2. What Personal Information We Collect and Why
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 14 }}>
                <div style={{ background: "#f8fbf6", padding: "18px 20px", borderRadius: 12, border: "1px solid #e1ebdc" }}>
                  <strong style={{ display: "block", color: "#19422e", fontSize: 15, marginBottom: 6 }}>
                    Customer Information
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "#546c5c", lineHeight: 1.6 }}>
                    <li><strong>Full Name & Contact Phone:</strong> To coordinate service arrival and dispatch status.</li>
                    <li><strong>Home Address & City:</strong> To dispatch verified local technicians to your exact location.</li>
                    <li><strong>Problem Description & Photos:</strong> To assess the required repair work and estimate fair costs.</li>
                    <li><strong>Payment Reference / UTR:</strong> To verify payment directly with administrators.</li>
                  </ul>
                </div>

                <div style={{ background: "#f8fbf6", padding: "18px 20px", borderRadius: 12, border: "1px solid #e1ebdc" }}>
                  <strong style={{ display: "block", color: "#19422e", fontSize: 15, marginBottom: 6 }}>
                    Service Worker / Tradesperson
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "#546c5c", lineHeight: 1.6 }}>
                    <li><strong>Name, Phone & Skills:</strong> To list in verified trade categories and connect with local repair jobs.</li>
                    <li><strong>Availability Schedule:</strong> To match requests during your designated working hours.</li>
                    <li><strong>Government ID & Trade Certificates:</strong> Strictly for identity verification and fraud prevention (accessible exclusively to admins).</li>
                  </ul>
                </div>
              </div>
            </article>

            {/* Section 3: Data Security & Storage */}
            <article style={{ background: "#ffffff", borderRadius: 16, padding: "28px 30px", border: "1px solid #e5ede3" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", marginTop: 0, marginBottom: 12 }}>
                3. Technical & Organizational Security Safeguards
              </h2>
              <p style={{ fontSize: 14.5, color: "#4f6556", lineHeight: 1.7, margin: "0 0 12px" }}>
                We deploy defense-in-depth security measures to protect your digital personal data:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Lock size={18} color="#25593e" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#516758", lineHeight: 1.5 }}>
                    <strong>Row Level Security (RLS):</strong> Isolates customer records so no unauthorized customer or public caller can view your requests.
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Shield size={18} color="#25593e" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#516758", lineHeight: 1.5 }}>
                    <strong>Private Storage Buckets:</strong> Worker identity verification documents and payment proofs are stored in private buckets accessible only by authorized administrators.
                  </span>
                </div>
              </div>
            </article>

            {/* Section 4: Data Retention & Erasure */}
            <article style={{ background: "#ffffff", borderRadius: 16, padding: "28px 30px", border: "1px solid #e5ede3" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", marginTop: 0, marginBottom: 12 }}>
                4. Data Retention Policy
              </h2>
              <p style={{ fontSize: 14.5, color: "#4f6556", lineHeight: 1.7, margin: 0 }}>
                Under the DPDP Act, personal data is retained only for as long as necessary to fulfill the service purpose or legal obligations. Completed service records and transaction receipts are maintained for accounting and warranty verification. Upon your request for erasure, inactive records will be safely anonymized or deleted within 30 days unless required by law.
              </p>
            </article>

            {/* Section 5: Exercise Your Rights (SAR Form) */}
            <article
              id="exercise-rights"
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: "32px 30px",
                border: "2px solid #c9dec4",
                boxShadow: "0 6px 24px rgba(18, 59, 48, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <FileText size={22} color="#15422f" />
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#123b30", margin: 0 }}>
                  5. Exercise Your Data Subject Rights (DPDP Sections 11–13)
                </h2>
              </div>
              <p style={{ fontSize: 14, color: "#5a7061", lineHeight: 1.6, margin: "0 0 20px" }}>
                You have the right to request access to your personal data, seek correction of inaccuracies, or request complete erasure of your profile.
              </p>

              {/* Instant Download Button */}
              <div
                style={{
                  background: "#f3f8ef",
                  border: "1px solid #d7e7cf",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: "#163f2e" }}>Right to Access: Download My Data Bundle</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#5f7667" }}>
                    Export a machine-readable JSON file of your profile, active bookings, and payment records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadData}
                  disabled={exporting}
                  style={{
                    background: "#1d4d38",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Download size={15} /> {exporting ? "Generating..." : "Download JSON Data"}
                </button>
              </div>
              {exportError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {exportError}
                </div>
              )}

              {/* SAR / Grievance Form */}
              <form onSubmit={handleSARSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#375040", marginBottom: 5 }}>
                      Request Type
                    </label>
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #c8d9c5",
                        fontSize: 14,
                        background: "#fff",
                      }}
                    >
                      <option value="ACCESS">Right to Access (Copy of Personal Data)</option>
                      <option value="CORRECTION">Right to Correction / Update</option>
                      <option value="ERASURE">Right to Erasure / Account Deletion</option>
                      <option value="GRIEVANCE">Privacy Grievance / Complaint</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#375040", marginBottom: 5 }}>
                      Your Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #c8d9c5",
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#375040", marginBottom: 5 }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #c8d9c5",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#375040", marginBottom: 5 }}>
                    Request Details / Specific Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your request or complaint in detail..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #c8d9c5",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {successMsg && (
                  <div style={{ display: "flex", gap: 10, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, color: "#065f46", fontSize: 13.5 }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div style={{ display: "flex", gap: 10, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 13.5 }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#123b30",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: 9,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Send size={16} /> {submitting ? "Submitting..." : "Submit Data Request"}
                </button>
              </form>
            </article>

            {/* Section 6: Grievance Officer Contact Details */}
            <article style={{ background: "#ffffff", borderRadius: 16, padding: "28px 30px", border: "1px solid #e5ede3" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <HelpCircle size={22} color="#1d4d38" />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", margin: 0 }}>
                  6. Grievance Redressal Mechanism & Officer Details
                </h2>
              </div>
              <p style={{ fontSize: 14.5, color: "#4f6556", lineHeight: 1.6, margin: "0 0 16px" }}>
                In compliance with Section 13 of the Digital Personal Data Protection Act, 2023, the details of our designated Data Protection and Grievance Officer are set forth below:
              </p>

              {officer ? (
                <div
                  style={{
                    background: "#f7faf5",
                    border: "1px solid #e0ebdb",
                    borderRadius: 14,
                    padding: "20px 22px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#6e8374", textTransform: "uppercase" }}>Name & Title</span>
                    <strong style={{ display: "block", fontSize: 15, color: "#163f2e", marginTop: 2 }}>{officer.name}</strong>
                    <span style={{ fontSize: 13, color: "#546d5c" }}>{officer.designation}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#6e8374", textTransform: "uppercase" }}>Official Email</span>
                    <a href={`mailto:${officer.email}`} style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1d4734", marginTop: 2 }}>
                      {officer.email}
                    </a>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#6e8374", textTransform: "uppercase" }}>Contact Number</span>
                    <span style={{ display: "block", fontSize: 14, color: "#2d4b38", marginTop: 2 }}>{officer.phone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#6e8374", textTransform: "uppercase" }}>Physical Address</span>
                    <span style={{ display: "block", fontSize: 13, color: "#546d5c", marginTop: 2, lineHeight: 1.4 }}>{officer.address}</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2ebd9", paddingTop: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#6e8374", textTransform: "uppercase" }}>Redressal Timeline</span>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4f6556", lineHeight: 1.5 }}>
                      {officer.instructions}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#778c7d" }}>Loading officer details...</p>
              )}
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
