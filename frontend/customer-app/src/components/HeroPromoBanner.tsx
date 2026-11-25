"use client";

import Link from "next/link";
import {
  ArrowRight,
  Droplets,
  Hammer,
  Home,
  PaintRoller,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/site";

const bannerServices = [
  { label: "Plumbing", href: "/book?service=Plumbing", icon: Droplets },
  { label: "Electrical", href: "/book?service=Electrical", icon: Zap },
  { label: "Carpentry", href: "/book?service=Carpentry", icon: Hammer },
  { label: "Painting", href: "/book?service=Painting", icon: PaintRoller },
  { label: "Home Repairs", href: "/book", icon: Home },
];

export function HeroPromoBanner() {
  return (
    <section
      className="homi-promo-band"
      aria-labelledby="homi-promo-banner-heading"
    >
      <div className="homi-promo-band-inner">
        <h2 id="homi-promo-banner-heading" className="sr-only">
          Homi — Your Neighbourhood, Your Help. Ghar ka kaam? Find help near you.
          Trusted local professionals for Plumbing, Electrical, Carpentry,
          Painting, and Home Repairs.
        </h2>

        {/* DESKTOP VIEW (>= 1024px): Complete horizontal campaign artwork with crisp interactive CTA */}
        <div className="homi-promo-desktop hidden lg:block">
          <div className="homi-promo-desktop-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/homi-promo-banner.jpg"
              alt="Homi — Your Neighbourhood, Your Help. Ghar ka kaam? Find help near you with trusted local professionals for Plumbing, Electrical, Carpentry, Painting, and Home Repairs."
              width={1002}
              height={658}
              loading="eager"
              decoding="async"
              className="homi-promo-desktop-img"
            />
            <Link
              href="/book"
              className="homi-promo-desktop-cta"
              aria-label="Explore Homi and send a home service request"
            >
              <span>Explore Homi</span>
              <ArrowRight aria-hidden="true" className="homi-promo-cta-arrow" />
            </Link>
          </div>
        </div>

        {/* MOBILE & TABLET VIEW (< 1024px): Bespoke responsive composition with repositioned visuals */}
        <div className="homi-promo-mobile block lg:hidden">
          <div className="homi-promo-mobile-card">
            <div className="homi-promo-mobile-grid">
              {/* Left / Top Editorial Block */}
              <div className="homi-promo-mobile-copy">
                <div className="homi-promo-mobile-logo">
                  <Logo />
                </div>

                <h3 className="homi-promo-mobile-title">
                  Ghar ka kaam?
                  <span className="homi-promo-mobile-accent">
                    Find help near you.
                    <svg
                      className="homi-promo-mobile-swoosh"
                      viewBox="0 0 180 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8.5C52 3 128 2.5 177 7.5"
                        stroke="#9bc240"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h3>

                <p className="homi-promo-mobile-subtitle">
                  Trusted local professionals for everyday home repairs.
                </p>

                {/* Mobile Visual Showcase placed naturally below headline on phones; moves to right column on tablet */}
                <div className="homi-promo-mobile-visual-inline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/homi-promo-visual-mobile.jpg"
                    alt="Homi app interface and verified local plumber fixing a kitchen sink"
                    width={486}
                    height={508}
                    loading="lazy"
                    decoding="async"
                    className="homi-promo-visual-img"
                  />
                </div>

                {/* 5 Core Service Chips matching banner palette */}
                <div
                  className="homi-promo-services-row"
                  role="list"
                  aria-label="Available home services"
                >
                  {bannerServices.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="listitem"
                        className="homi-promo-service-tile"
                      >
                        <Icon
                          size={20}
                          strokeWidth={1.9}
                          aria-hidden="true"
                          className="homi-promo-service-icon"
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Tablet Right Column Visual Showcase (768px - 1023px) */}
              <div className="homi-promo-tablet-visual" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/homi-promo-visual-mobile.jpg"
                  alt=""
                  width={486}
                  height={508}
                  loading="lazy"
                  decoding="async"
                  className="homi-promo-visual-img"
                />
              </div>
            </div>

            {/* Footer Band & Responsive CTA */}
            <div className="homi-promo-mobile-footer">
              <div className="homi-promo-mobile-tagline">
                <strong>Homi — Your Neighbourhood, Your Help</strong>
                <span>Simple help. Close to home.</span>
              </div>
              <Link
                href="/book"
                className="homi-promo-mobile-cta"
              >
                <span>Explore Homi</span>
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
