"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  MessageCircle, 
  Phone, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  ShieldCheck, 
  ArrowUpRight 
} from "lucide-react";
import { Footer, Header } from "@/components/site";

export default function GuidePage() {
  return (
    <>
      <Header />
      <main className="inner-page">
        <div className="container" style={{ maxWidth: 840, margin: "0 auto", padding: "48px 20px 80px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.15em",
                color: "#557e62",
                marginBottom: 10,
              }}
            >
              START HERE
            </span>
            <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#123b30", margin: "0 0 14px", lineHeight: 1.18 }}>
              No long forms. No running around.
            </h1>
            <p style={{ fontSize: 16, color: "#718078", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
              Three simple steps to connect with trusted local service professionals in your neighbourhood.
            </p>
          </div>

          {/* Three Simple Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
            {/* Step 1 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5ebe4",
                borderRadius: 16,
                padding: "32px",
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                boxShadow: "0 8px 24px rgba(18, 59, 48, 0.04)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "#eaf3dd",
                  color: "#225746",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                01
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", margin: "0 0 8px" }}>
                  1. Tell us the problem.
                </h2>
                <p style={{ fontSize: 14, color: "#718078", lineHeight: 1.65, margin: "0 0 16px" }}>
                  Choose a service category (Plumber, Electrician, Carpenter, etc.), describe what needs repair, and enter your city or area. No account creation or payment is needed to send a request.
                </p>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#457252", fontWeight: 700 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={16} /> Fast 1-minute form
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={16} /> In your own language
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5ebe4",
                borderRadius: 16,
                padding: "32px",
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                boxShadow: "0 8px 24px rgba(18, 59, 48, 0.04)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "#fff0d8",
                  color: "#996316",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                02
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", margin: "0 0 8px" }}>
                  2. We help connect you.
                </h2>
                <p style={{ fontSize: 14, color: "#718078", lineHeight: 1.65, margin: "0 0 16px" }}>
                  Your request is immediately received and reviewed by the Homi team. An approved technician located in your neighbourhood will be assigned or contact you to confirm visiting details and price.
                </p>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#457252", fontWeight: 700 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={16} /> Verified local professionals
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={16} /> Direct phone contact
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5ebe4",
                borderRadius: 16,
                padding: "32px",
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                boxShadow: "0 8px 24px rgba(18, 59, 48, 0.04)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "#e2f2e8",
                  color: "#1c5737",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                03
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", margin: "0 0 8px" }}>
                  3. Track your request.
                </h2>
                <p style={{ fontSize: 14, color: "#718078", lineHeight: 1.65, margin: "0 0 16px" }}>
                  Log in to your customer dashboard anytime to check the latest status of your service request, see assigned technician details, and leave feedback once the job is completed.
                </p>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#457252", fontWeight: 700 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={16} /> Real-time status tracking
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={16} /> Clear audit history
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA Button */}
          <div style={{ textAlign: "center", marginBottom: 54 }}>
            <Link
              href="/book"
              className="btn btn-dark"
              style={{ padding: "16px 36px", fontSize: 16, fontWeight: 800 }}
            >
              Send a Request <ArrowRight size={18} />
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5ebe4",
              borderRadius: 16,
              padding: "28px 32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <ShieldCheck size={24} style={{ color: "#366e44", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", fontSize: 14, color: "#123b30", marginBottom: 3 }}>
                  Verified Identity
                </strong>
                <span style={{ fontSize: 12, color: "#718078", lineHeight: 1.5 }}>
                  Every technician is vetted and phone-verified before taking jobs.
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <IndianRupee size={24} style={{ color: "#366e44", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", fontSize: 14, color: "#123b30", marginBottom: 3 }}>
                  Agree Price First
                </strong>
                <span style={{ fontSize: 12, color: "#718078", lineHeight: 1.5 }}>
                  No hidden charges. Review charges before work starts.
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Phone size={24} style={{ color: "#366e44", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", fontSize: 14, color: "#123b30", marginBottom: 3 }}>
                  Direct Support
                </strong>
                <span style={{ fontSize: 12, color: "#718078", lineHeight: 1.5 }}>
                  The Homi team is available to help resolve any questions.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
