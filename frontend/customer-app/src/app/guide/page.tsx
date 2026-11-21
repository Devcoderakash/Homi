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
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
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
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#123b30", margin: "0 0 14px", lineHeight: 1.18 }}>
              No long forms. No running around.
            </h1>
            <p style={{ fontSize: 15, color: "#718078", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
              Three simple steps to connect with trusted local service professionals in your neighbourhood.
            </p>
          </div>

          {/* Three Simple Steps */}
          <div className="flex flex-col gap-5 sm:gap-6 mb-10 sm:mb-12">
            {/* Step 1 */}
            <div className="bg-white border border-[#e5ebe4] rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start shadow-sm">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#eaf3dd",
                  color: "#225746",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                01
              </div>
              <div className="flex-1 min-w-0">
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 8px" }}>
                  1. Tell us the problem.
                </h2>
                <p style={{ fontSize: 14, color: "#718078", lineHeight: 1.65, margin: "0 0 14px" }}>
                  Choose a service category (Plumber, Electrician, Carpenter, etc.), describe what needs repair, and enter your city or area. No account creation or payment is needed to send a request.
                </p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs text-[#457252] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check size={16} /> Fast 1-minute form
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check size={16} /> In your own language
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#e5ebe4] rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start shadow-sm">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#fff0d8",
                  color: "#996316",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                02
              </div>
              <div className="flex-1 min-w-0">
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 8px" }}>
                  2. We help connect you.
                </h2>
                <p style={{ fontSize: 14, color: "#718078", lineHeight: 1.65, margin: "0 0 14px" }}>
                  Your request is immediately received and reviewed by the Homi team. An approved technician located in your neighbourhood will be assigned or contact you to confirm visiting details and price.
                </p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs text-[#457252] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check size={16} /> Verified local professionals
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check size={16} /> Direct phone contact
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#e5ebe4] rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start shadow-sm">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#e2f2e8",
                  color: "#1c5737",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                03
              </div>
              <div className="flex-1 min-w-0">
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 8px" }}>
                  3. Track your request.
                </h2>
                <p style={{ fontSize: 14, color: "#718078", lineHeight: 1.65, margin: "0 0 14px" }}>
                  Log in to your customer dashboard anytime to check the latest status of your service request, see assigned technician details, and leave feedback once the job is completed.
                </p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs text-[#457252] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check size={16} /> Real-time status tracking
                  </span>
                  <span className="flex items-center gap-1.5">
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
          <div className="bg-white border border-[#e5ebe4] rounded-2xl p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={24} className="text-[#366e44] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm text-[#123b30] mb-1 font-extrabold">
                  Verified Identity
                </strong>
                <span className="text-xs text-[#718078] leading-relaxed">
                  Every technician is vetted and phone-verified before taking jobs.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IndianRupee size={24} className="text-[#366e44] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm text-[#123b30] mb-1 font-extrabold">
                  Agree Price First
                </strong>
                <span className="text-xs text-[#718078] leading-relaxed">
                  No hidden charges. Review charges before work starts.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={24} className="text-[#366e44] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm text-[#123b30] mb-1 font-extrabold">
                  Direct Support
                </strong>
                <span className="text-xs text-[#718078] leading-relaxed">
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
