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
  ArrowUpRight,
  Zap,
  House,
  ClipboardCheck
} from "lucide-react";
import { Footer, Header } from "@/components/site";

export default function GuidePage() {
  return (
    <>
      <Header />
      <main className="inner-page">
        {/* MOBILE VIEW (< 1024px): Matches target design media_1795354561132_fb247a8b.jpg */}
        <div className="mobile-how-section block lg:hidden">
          {/* Top-Right Decorative Phone Graphic */}
          <div className="mobile-how-phone-decor" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/how-it-works-phone-transparent.png"
              alt=""
              width={175}
              height={215}
              className="mobile-how-phone-img"
              loading="lazy"
            />
          </div>

          <div className="mobile-how-header-content">
            {/* Eyebrow badge */}
            <div className="mobile-how-eyebrow">
              <Zap size={13} strokeWidth={2.4} />
              <span>HOW IT WORKS</span>
            </div>

            {/* Headline */}
            <h1 className="mobile-how-headline">
              No long forms.
              <span>
                No running around.
                <svg className="mobile-how-swoop" viewBox="0 0 170 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7.5C45 2 125 2 168 7.5" stroke="#7aa93c" strokeWidth="3.2" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mobile-how-desc">
              Three simple steps to connect with trusted local professionals.
            </p>
          </div>

          {/* Steps Timeline (01, 02, 03) */}
          <div className="mobile-how-steps-list">
            {/* Step 1 */}
            <div className="mobile-how-step-item">
              <div className="mobile-how-step-card">
                <div className="mobile-how-step-badge badge-01">01</div>
                <div className="mobile-how-step-icon icon-01">
                  <MessageCircle size={22} strokeWidth={1.8} />
                </div>
                <div className="mobile-how-step-text">
                  <strong>Tell us the problem.</strong>
                  <p>Choose a service, describe the issue and share your location.</p>
                </div>
              </div>
              <div className="mobile-how-step-line" aria-hidden="true" />
            </div>

            {/* Step 2 */}
            <div className="mobile-how-step-item">
              <div className="mobile-how-step-card">
                <div className="mobile-how-step-badge badge-02">02</div>
                <div className="mobile-how-step-icon icon-02">
                  <Phone size={22} strokeWidth={1.8} />
                </div>
                <div className="mobile-how-step-text">
                  <strong>We help connect you.</strong>
                  <p>Your request is received and reviewed by the Homi team.</p>
                </div>
              </div>
              <div className="mobile-how-step-line" aria-hidden="true" />
            </div>

            {/* Step 3 */}
            <div className="mobile-how-step-item">
              <div className="mobile-how-step-card">
                <div className="mobile-how-step-badge badge-03">03</div>
                <div className="mobile-how-step-icon icon-03">
                  <ClipboardCheck size={22} strokeWidth={1.8} />
                </div>
                <div className="mobile-how-step-text">
                  <strong>Track your request.</strong>
                  <p>Log in to your customer dashboard to check its latest status.</p>
                </div>
              </div>
            </div>
          </div>

          {/* "Quick, simple and local." House Promo Banner */}
          <div className="mobile-house-promo-banner">
            <div className="mobile-house-art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/banner-house.png"
                alt=""
                width={110}
                height={80}
                className="mobile-house-banner-img"
                loading="lazy"
              />
            </div>
            <div className="mobile-house-banner-divider" aria-hidden="true" />
            <div className="mobile-house-banner-content">
              <h4>Quick, simple and local.</h4>
              <p>Get your home problems solved without the hassle.</p>
            </div>
          </div>

          {/* Full-Width Action Button */}
          <Link href="/book" className="mobile-how-submit-btn">
            <span>Send a Request</span>
            <ArrowRight size={16} />
          </Link>

          {/* Trust Badges */}
          <div className="mobile-trust-badges">
            <div className="mobile-trust-badge-item">
              <ShieldCheck size={22} className="mobile-trust-icon" strokeWidth={1.8} />
              <div className="mobile-trust-text">
                <strong>Verified Pros</strong>
                <small>Background checked</small>
              </div>
            </div>

            <div className="mobile-trust-badge-item">
              <Zap size={22} className="mobile-trust-icon" strokeWidth={1.8} />
              <div className="mobile-trust-text">
                <strong>Quick Response</strong>
                <small>In your area</small>
              </div>
            </div>

            <div className="mobile-trust-badge-item">
              <House size={22} className="mobile-trust-icon" strokeWidth={1.8} />
              <div className="mobile-trust-text">
                <strong>Home Friendly</strong>
                <small>Reliable &amp; safe</small>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW (>= 1024px): Full desktop layout untouched */}
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 hidden lg:block">
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
