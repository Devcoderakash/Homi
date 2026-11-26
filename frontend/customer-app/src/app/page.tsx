"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  ArrowUpRight, 
  Check, 
  ChevronDown, 
  Handshake, 
  IndianRupee, 
  MapPin, 
  MessageCircle, 
  Phone, 
  Sparkles, 
  Wrench, 
  Droplets, 
  PlugZap, 
  Hammer, 
  PaintRoller, 
  Fan, 
  Armchair,
  Clock,
  ShieldCheck,
  UserCheck,
  LocateFixed,
  Zap,
  House,
  Search,
  LayoutGrid,
  ChevronRight,
  ClipboardCheck
} from "lucide-react";
import { Footer, Header, useServiceCategories } from "@/components/site";
import { useLanguage } from "@/components/language";

const iconMap: Record<string, any> = {
  Droplets,
  PlugZap,
  Hammer,
  Sparkles,
  PaintRoller,
  Fan,
  Armchair,
  Wrench,
};

const mobilePopularServices = [
  { name: "Furniture Repair", label: "Furniture\nRepair", icon: Armchair, serviceParam: "Furniture repair" },
  { name: "Plumbing", label: "Plumbing", icon: Droplets, serviceParam: "Plumbing" },
  { name: "Electrical", label: "Electrical", icon: Zap, serviceParam: "Electrical" },
  { name: "Home Cleaning", label: "Home\nCleaning", icon: Sparkles, serviceParam: "Cleaning" },
  { name: "Painting", label: "Painting", icon: PaintRoller, serviceParam: "Painting" },
];

const promoSlides = [
  {
    lead: "Keep your home",
    highlight: "in perfect shape.",
    subtitle: "Trusted professionals for all home services.",
    btnText: "Book Now",
    href: "/book",
    image: "/images/promo-sofa-clean.png",
    alt: "Living room sofa and furniture care",
  },
  {
    lead: "Fast home repairs.",
    highlight: "Verified experts.",
    subtitle: "Plumbers, electricians & technicians near you.",
    btnText: "Find Help",
    href: "/workers",
    image: "/images/promo-repair.png",
    alt: "Technician home repair services",
  },
  {
    lead: "Fair pricing.",
    highlight: "No hidden fees.",
    subtitle: "Agree on the cost before any work begins.",
    btnText: "How It Works",
    href: "/guide",
    image: "/images/promo-home.png",
    alt: "Fair upfront pricing",
  },
];

type CategoryItem = {
  id?: number;
  slug?: string;
  name: string;
  subtitle: string;
  iconName?: string;
  icon?: any;
  color: string;
};

export default function HomePage() {
  const { t, serviceLabel } = useLanguage();
  const { categories } = useServiceCategories();
  const [service, setService] = useState("");
  const [city, setCity] = useState("Bhopal");
  const [servicesSearch, setServicesSearch] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveSlide((prev) => (prev + 1) % promoSlides.length);
      } else {
        setActiveSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
      }
    }
    setTouchStartX(null);
  };

  const filteredServices = categories.filter((item) => {
    if (!servicesSearch.trim()) return true;
    const q = servicesSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
  });

  const popularMobileItems = categories.slice(0, 5);

  const bookingUrl = `/book?${new URLSearchParams({
    ...(service ? { service } : {}),
    ...(city ? { city } : {}),
  }).toString()}`;

  return (
    <>
      <Header />
      <main>
        {/* MOBILE EXPERIENCE (< 1024px): Matching reference app UI design */}
        <section className="mobile-home-container block lg:hidden">
          {/* Top-Right Decorative Architectural Arch Image */}
          <div className="mobile-hero-arch-decor" aria-hidden="true">
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

          <div className="mobile-hero-content">
            {/* Eyebrow */}
            <div className="mobile-eyebrow">
              <span className="mobile-eyebrow-spark">✳</span>
              <span>YOUR NEIGHBOURHOOD, YOUR HELP</span>
            </div>

            {/* Headline with playful green swoop underline */}
            <h1 className="mobile-hero-headline">
              Ghar ka kaam?<br />
              <span className="mobile-headline-sub">
                Find help near you.
                <svg
                  className="mobile-swoosh"
                  viewBox="0 0 160 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 10C45 4 110 3 157 7"
                    stroke="#8cb441"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mobile-hero-desc">
              A leaky tap, a broken sofa, or a fan that won’t start? Get trusted local professionals for every home need.
            </p>
          </div>

          {/* Elevated "What do you need help with?" Card */}
          <div className="mobile-search-card">
            <div className="mobile-search-card-header">
              <span className="mobile-search-badge">
                <Wrench size={14} strokeWidth={2.5} />
              </span>
              <h2 className="mobile-search-title">What do you need help with?</h2>
            </div>

            {/* Service Select Field */}
            <div className="mobile-search-input-wrap">
              <Wrench size={18} className="mobile-input-icon-left" />
              <select
                aria-label="Select Service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="mobile-search-select"
              >
                <option value="">Select a service</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} className="mobile-input-icon-right pointer-events-none" />
            </div>

            {/* City Field */}
            <div className="mobile-search-input-wrap">
              <MapPin size={18} className="mobile-input-icon-left" />
              <input
                type="text"
                aria-label="City"
                placeholder="Enter your city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mobile-search-input"
              />
              <button
                type="button"
                className="mobile-locate-btn"
                aria-label="Locate current city"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      () => setCity("Bhopal"),
                      () => setCity("Bhopal")
                    );
                  }
                }}
              >
                <LocateFixed size={18} className="mobile-locate-icon" />
              </button>
            </div>

            {/* Submit Button */}
            <Link
              href={bookingUrl}
              className="btn mobile-search-btn"
              aria-label="Send a Request"
            >
              <span>Send a Request</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Popular Services Section */}
          <div className="mobile-popular-section">
            <div className="mobile-popular-header">
              <h2 className="mobile-popular-title">Popular Services</h2>
              <Link href="/book" className="mobile-popular-all">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mobile-popular-grid">
              {popularMobileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={`/book?service=${encodeURIComponent(item.name)}`}
                    className="mobile-popular-item"
                  >
                    <div className="mobile-popular-icon-box">
                      <Icon size={24} strokeWidth={1.8} />
                    </div>
                    <span className="mobile-popular-label">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Promotional Banner Carousel (3 slides with dots) */}
          <div className="mobile-promo-banner-wrap">
            <div
              className="mobile-promo-card"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div key={activeSlide} className="mobile-promo-slide-inner">
                <div className="mobile-promo-content">
                  <h3 className="mobile-promo-title">
                    {promoSlides[activeSlide].lead}<br />
                    <span className="mobile-promo-highlight">{promoSlides[activeSlide].highlight}</span>
                  </h3>
                  <p className="mobile-promo-subtitle">
                    {promoSlides[activeSlide].subtitle}
                  </p>
                  <Link href={promoSlides[activeSlide].href} className="mobile-promo-btn">
                    <span>{promoSlides[activeSlide].btnText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="mobile-promo-image-wrap" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={promoSlides[activeSlide].image}
                    alt={promoSlides[activeSlide].alt}
                    width={260}
                    height={150}
                    className="mobile-promo-img"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="mobile-promo-dots" role="tablist" aria-label="Featured promotions">
              {promoSlides.map((slide, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={activeSlide === idx}
                  aria-label={`Slide ${idx + 1}: ${slide.lead} ${slide.highlight}`}
                  className={`mobile-dot-btn ${activeSlide === idx ? "active" : ""}`}
                  onClick={() => setActiveSlide(idx)}
                >
                  <span className="mobile-dot-indicator" />
                </button>
              ))}
            </div>
          </div>

          {/* Trust Badges (Verified Pros / Fast Response / Home Friendly) */}
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
                <strong>Fast Response</strong>
                <small>In your area</small>
              </div>
            </div>

            <div className="mobile-trust-badge-item">
              <House size={22} className="mobile-trust-icon" strokeWidth={1.8} />
              <div className="mobile-trust-text">
                <strong>Home Friendly</strong>
                <small>Safe & reliable</small>
              </div>
            </div>
          </div>
        </section>

        {/* 1. DESKTOP HERO SECTION (visible >= 1024px only) */}
        <section className="hero-section local-hero hidden lg:block">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-spark">✳</span>
                YOUR NEIGHBOURHOOD, YOUR HELP
              </div>
              <h1>
                Ghar ka kaam?<br />
                <span>Find help near you.</span>
              </h1>
              <p className="hero-description">
                A leaking tap, a broken sofa, or a fan that won't start? Tell us the problem. We'll help you connect with local service professionals.
              </p>

              {/* Service & City Search Field */}
              <div className="hero-search">
                <div className="search-field service-select">
                  <Wrench size={20} />
                  <select
                    aria-label="Select Service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    <option value="">Select a service…</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="select-arrow" />
                </div>
                <div className="search-field city-field">
                  <MapPin size={20} />
                  <input
                    aria-label="City"
                    placeholder="Enter your city (e.g. Bhopal)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <Link
                  href={bookingUrl}
                  className="btn btn-dark search-submit"
                  aria-label="Send a Request"
                >
                  <ArrowRight size={21} />
                </Link>
              </div>

              {/* Primary CTA and Secondary Trust Info */}
              <div className="hero-request-actions">
                <Link href={bookingUrl} className="btn btn-dark">
                  Send a Request <ArrowRight size={18} />
                </Link>
                <span>
                  <Check size={16} />
                  Simple help, close to home.
                </span>
              </div>
            </div>

            {/* Hero Visual Right Side */}
            <div className="hero-visual">
              <div className="hero-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/indian-home.jpg"
                  alt="A modern comfortable family home interior"
                  className="hero-img-element"
                  width={800}
                  height={600}
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = "1";
                      target.src = "https://images.pexels.com/photos/7404938/pexels-photo-7404938.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200";
                    }
                  }}
                />
              </div>
              <div className="hero-image-shade" />
              
              {/* Badges: Floating on desktop, static clean cards below image on mobile */}
              <div className="hero-badges-wrapper">
                <div className="hero-photo-label">
                  <span className="label-check">
                    <Check size={19} strokeWidth={3} />
                  </span>
                  <span>
                    <strong>Quality care for your home</strong>
                    <small>Verified local technicians ready</small>
                  </span>
                </div>
                <div className="floating-card">
                  <div className="float-icon">
                    <Handshake size={23} />
                  </div>
                  <div>
                    <strong>Local professionals ready</strong>
                    <span>Fast response in your area</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="container hero-bottom">
            <span>
              <Phone size={18} />
              Direct phone connection
            </span>
            <span>
              <MessageCircle size={18} />
              Talk in your own language
            </span>
            <span>
              <IndianRupee size={18} />
              Agree on price first
            </span>
          </div>
        </section>

        {/* 2. SERVICES SECTION */}
        <section className="services-section-wrapper" id="services">
          {/* MOBILE VIEW (< 1024px): Matches target design media_1795350808984_ec98b199.jpg */}
          <div className="mobile-services-section block lg:hidden">
            {/* Top-Right Decorative Architectural Arch Image */}
            <div className="mobile-services-arch-decor" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-arch-transparent.png"
                alt=""
                width={185}
                height={260}
                className="mobile-arch-img"
                loading="lazy"
              />
            </div>

            <div className="mobile-services-header-content">
              {/* Eyebrow badge */}
              <div className="mobile-services-eyebrow">
                <LayoutGrid size={13} strokeWidth={2.4} />
                <span>AVAILABLE SERVICES</span>
              </div>

              {/* Headline */}
              <h2 className="mobile-services-headline">
                Everyday problems.
                <span>Local solutions.</span>
              </h2>

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
                  const Icon = item.icon || (item.iconName ? iconMap[item.iconName] : null) || Wrench;
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
          </div>

          {/* DESKTOP VIEW (>= 1024px): Full desktop layout untouched */}
          <div className="desktop-services-section hidden lg:block">
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
                {categories.map((item) => {
                  const Icon = item.icon || (item.iconName ? iconMap[item.iconName] : null) || Wrench;
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
          </div>
        </section>

        {/* 3. HOW IT WORKS – START HERE SECTION */}
        <section className="how-section-wrapper" id="how-it-works">
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
              <h2 className="mobile-how-headline">
                No long forms.
                <span>
                  No running around.
                  <svg className="mobile-how-swoop" viewBox="0 0 170 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 7.5C45 2 125 2 168 7.5" stroke="#7aa93c" strokeWidth="3.2" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>

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
          <div className="desktop-how-section hidden lg:block how-section">
            <div className="container">
              <div className="center-heading">
                <span className="section-kicker">START HERE</span>
                <h2>No long forms. <span>No running around.</span></h2>
                <p>Three simple steps to connect with trusted local professionals.</p>
              </div>

              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">01</div>
                  <div className="step-icon">
                    <MessageCircle size={28} />
                  </div>
                  <h3>1. Tell us the problem.</h3>
                  <p>Choose a service, describe the issue and share your location.</p>
                </div>
                <div className="step-connector" />
                <div className="step-card">
                  <div className="step-number">02</div>
                  <div className="step-icon">
                    <Phone size={28} />
                  </div>
                  <h3>2. We help connect you.</h3>
                  <p>Your request is received and reviewed by the Homi team.</p>
                </div>
                <div className="step-connector" />
                <div className="step-card">
                  <div className="step-number">03</div>
                  <div className="step-icon">
                    <Check size={28} />
                  </div>
                  <h3>3. Track your request.</h3>
                  <p>Log in to your customer dashboard to check its latest status.</p>
                </div>
              </div>

              <div className="steps-cta-wrap">
                <Link href="/book" className="btn btn-dark steps-cta">
                  Send a Request <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. WORKERS DIRECTORY & BECOME A WORKER GATEWAYS */}
        <section className="why-section">
          <div className="container why-grid">
            <div className="why-photo">
              <div className="why-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/why-repair.jpg"
                  alt="A skilled technician working"
                  className="why-img-element"
                  width={600}
                  height={500}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = "1";
                      target.src = "https://images.pexels.com/photos/15124970/pexels-photo-15124970.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1000";
                    }
                  }}
                />
              </div>
              <div className="why-badge">
                <span>✳</span>
                <strong>Quality work, fair pricing</strong>
              </div>
            </div>
            <div className="why-content">
              <span className="section-kicker">FOR CUSTOMERS & TECHNICIANS</span>
              <h2>Local help, <span>right in your neighbourhood.</span></h2>
              <p className="why-lead">
                Whether you need a quick repair at home or want to offer your trade skills locally, Homi keeps things honest, direct and simple.
              </p>

              <div className="benefit">
                <span><UserCheck size={22} /></span>
                <div>
                  <h3>Find Local Workers</h3>
                  <p>Explore profiles of approved local plumbers, electricians and handymen in your area.</p>
                </div>
              </div>

              <div className="benefit">
                <span><Wrench size={22} /></span>
                <div>
                  <h3>Aapka hunar. Apne shehar mein kaam.</h3>
                  <p>Join Homi as an independent service professional. Share your skills and get connected with local household requests.</p>
                </div>
              </div>

              <div className="why-actions">
                <Link href="/workers" className="btn btn-dark">
                  Find Local Workers <ArrowRight size={17} />
                </Link>
                <Link href="/become-a-worker" className="btn btn-lime">
                  I Am a Worker <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CTA SECTION */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-box">
              <div className="cta-decoration cta-decoration-one" />
              <div className="cta-decoration cta-decoration-two" />
              <div className="cta-text">
                <span className="section-kicker">READY TO GET STARTED?</span>
                <h2>Ghar ka kaam aasaan.<br />Send your request today.</h2>
                <p>No upfront registration or payment required. Just tell us what needs fixing.</p>
                <div className="cta-buttons">
                  <Link href="/book" className="btn btn-lime">
                    Send a Request <ArrowRight size={18} />
                  </Link>
                  <Link href="/become-a-worker" className="btn btn-outline-light">
                    Apply as a Worker <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
              <div className="cta-art">
                <span className="art-circle">
                  <Wrench size={100} strokeWidth={1.1} />
                </span>
                <span className="art-small art-small-one">
                  <Sparkles size={26} />
                </span>
                <span className="art-small art-small-two">
                  <Check size={28} />
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
