"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  ArrowUpRight, 
  ChevronRight, 
  Droplets, 
  Fan, 
  Hammer, 
  House, 
  LayoutGrid, 
  PaintRoller, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Wrench, 
  Zap 
} from "lucide-react";
import { Header, Footer, services } from "@/components/site";

export default function ServicesPage() {
  const [servicesSearch, setServicesSearch] = useState("");

  const filteredServices = services.filter((item) => {
    if (!servicesSearch.trim()) return true;
    const q = servicesSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
  });

  return (
    <>
      <Header />
      <main>
        {/* MOBILE VIEW (< 1024px): Matches target design media_1795350808984_ec98b199.jpg */}
        <section className="mobile-services-section block lg:hidden">
          {/* Top-Right Decorative Architectural Arch Image */}
          <div className="mobile-services-arch-decor" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-arch-transparent.png"
              alt=""
              width={185}
              height={260}
              className="mobile-arch-img"
              loading="eager"
            />
          </div>

          <div className="mobile-services-header-content">
            {/* Eyebrow badge */}
            <div className="mobile-services-eyebrow">
              <LayoutGrid size={13} strokeWidth={2.4} />
              <span>AVAILABLE SERVICES</span>
            </div>

            {/* Headline */}
            <h1 className="mobile-services-headline">
              Everyday problems.
              <span>Local solutions.</span>
            </h1>

            {/* Subtitle */}
            <p className="mobile-services-desc">
              Choose a service category to send your repair request directly to verified professionals in your neighbourhood.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <div className="mobile-services-search-wrap">
            <Search size={18} className="mobile-services-search-icon" />
            <input
              type="text"
              placeholder="Search for a service (e.g. Plumbing, Electrical...)"
              value={servicesSearch}
              onChange={(e) => setServicesSearch(e.target.value)}
              className="mobile-services-search-input"
              aria-label="Search services"
            />
          </div>

          {/* 2-Column Grid (8 Services) */}
          <div className="mobile-services-grid">
            {filteredServices.length > 0 ? (
              filteredServices.map((item) => {
                const Icon = item.icon || Wrench;
                return (
                  <Link
                    key={item.name}
                    href={`/book?service=${encodeURIComponent(item.name)}`}
                    className="mobile-service-list-card"
                  >
                    <div className="mobile-service-card-left">
                      <div
                        className="mobile-service-card-icon"
                        style={{ backgroundColor: item.color || "#eef5eb" }}
                      >
                        <Icon size={19} strokeWidth={1.8} />
                      </div>
                      <div className="mobile-service-card-text">
                        <strong>{item.name}</strong>
                        <small>{item.subtitle}</small>
                      </div>
                    </div>
                    <ChevronRight size={15} className="mobile-service-card-arrow" />
                  </Link>
                );
              })
            ) : (
              <div className="mobile-services-empty">
                No services matching &ldquo;{servicesSearch}&rdquo;
              </div>
            )}
          </div>

          {/* "Can't find the right service?" Banner */}
          <div className="mobile-custom-service-banner">
            <div className="mobile-custom-service-content">
              <h3>Can’t find the right service?</h3>
              <p>Send a custom request and we&apos;ll match you with the right professional.</p>
              <Link href="/book" className="btn mobile-custom-service-btn">
                <span>Send a Request</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mobile-custom-service-art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/custom-request-clipboard.png"
                alt=""
                width={130}
                height={110}
                className="mobile-custom-clipboard-img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Trust Row */}
          <div className="mobile-trust-badges">
            <div className="mobile-trust-badge-item">
              <ShieldCheck size={22} className="mobile-trust-icon" strokeWidth={1.8} />
              <div className="mobile-trust-text">
                <strong>Verified Professionals</strong>
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
                <strong>Trusted & Local</strong>
                <small>Reliable service near you</small>
              </div>
            </div>
          </div>
        </section>

        {/* DESKTOP VIEW (>= 1024px): Standard desktop services layout */}
        <section className="section services-section hidden lg:block" id="services">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-kicker">AVAILABLE SERVICES</span>
                <h2>Everyday problems. <span>Local solutions.</span></h2>
                <p>Choose a service category to send your repair request directly to verified professionals in your neighbourhood.</p>
              </div>
              <Link href="/book" className="text-link">
                Send a Request <ArrowUpRight size={18} />
              </Link>
            </div>

            <div className="services-grid">
              {services.map((item) => {
                const Icon = item.icon || Wrench;
                return (
                  <Link
                    href={`/book?service=${encodeURIComponent(item.name)}`}
                    key={item.name}
                    className="service-card"
                  >
                    <span
                      className="service-icon"
                      style={{ backgroundColor: item.color || "#dfeefd" }}
                    >
                      <Icon size={28} strokeWidth={1.8} />
                    </span>
                    <span className="service-info">
                      <strong>{item.name}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <ArrowUpRight size={19} className="service-arrow" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
