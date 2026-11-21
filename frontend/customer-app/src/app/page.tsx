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
  UserCheck
} from "lucide-react";
import { Footer, Header, services as defaultServices } from "@/components/site";
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
  const [categories, setCategories] = useState<CategoryItem[]>(defaultServices);
  const [service, setService] = useState("");
  const [city, setCity] = useState("Bhopal");

  useEffect(() => {
    let mounted = true;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data && Array.isArray(data.services) && data.services.length > 0) {
          setCategories(data.services);
        }
      })
      .catch(() => {
        // Fallback to defaultServices
      });
    return () => {
      mounted = false;
    };
  }, []);

  const bookingUrl = `/book?${new URLSearchParams({
    ...(service ? { service } : {}),
    ...(city ? { city } : {}),
  }).toString()}`;

  return (
    <>
      <Header />
      <main>
        {/* 1. HERO SECTION */}
        <section className="hero-section local-hero">
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
        <section className="section services-section" id="services">
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
        </section>

        {/* 3. HOW IT WORKS – START HERE SECTION */}
        <section className="how-section" id="how-it-works">
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

            <div style={{ textAlign: "center", marginTop: 42 }}>
              <Link href="/book" className="btn btn-dark" style={{ padding: "16px 28px", fontSize: 15 }}>
                Send a Request <ArrowRight size={18} />
              </Link>
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

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
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
