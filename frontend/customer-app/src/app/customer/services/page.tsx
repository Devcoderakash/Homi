"use client";

import Link from "next/link";
import { ArrowRight, Wrench, ShieldCheck, Check } from "lucide-react";
import { Header, Footer, services } from "@/components/site";
import { useLanguage } from "@/components/language";

export default function CustomerServicesPage() {
  const { t, serviceLabel } = useLanguage();

  return (
    <>
      <Header />
      <main style={{ background: "#f8faf5", minHeight: "80vh", padding: "48px 0 80px" }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-kicker">HOMI SERVICES</span>
            <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#123b30", margin: "12px 0 8px" }}>
              Verified Household Services
            </h1>
            <p style={{ color: "#718078", fontSize: 15, maxWidth: 540, margin: "0 auto" }}>
              Choose a trade below to request an on-demand repair technician to your home in Bhopal.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #e5ebe4",
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: s.color || "#eef5eb",
                        display: "grid",
                        placeItems: "center",
                        color: "#123b30",
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", marginBottom: 4 }}>
                      {serviceLabel(s.name)}
                    </h3>
                    <p style={{ fontSize: 13, color: "#718078", lineHeight: 1.5, marginBottom: 20 }}>
                      {s.subtitle}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid #f0f4ee", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <small style={{ fontSize: 10, color: "#718078", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Starting Fee
                      </small>
                      <strong style={{ fontSize: 15, color: "#123b30" }}>₹149</strong>
                    </div>
                    <Link
                      href={`/book?category=${encodeURIComponent(s.name)}`}
                      className="btn btn-lime"
                      style={{ padding: "8px 16px", fontSize: 12 }}
                    >
                      Book Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
