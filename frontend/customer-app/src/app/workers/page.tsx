"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, 
  MapPin, 
  Search, 
  Star, 
  UsersRound, 
  Briefcase, 
  CheckCircle2, 
  RotateCcw,
  ChevronDown
} from "lucide-react";
import { Footer, Header, services, type WorkerProfile } from "@/components/site";
import { useLanguage } from "@/components/language";

export default function WorkersPage() {
  const { t, serviceLabel } = useLanguage();
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);

  async function loadWorkers(cityFilter = city, serviceFilter = service) {
    const key = ++sequence.current;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (cityFilter.trim()) params.set("city", cityFilter.trim());
      if (serviceFilter.trim()) params.set("service", serviceFilter.trim());

      const res = await fetch(`/api/workers?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load workers");
      if (sequence.current === key) {
        setWorkers(data.workers || []);
      }
    } catch (err: any) {
      if (sequence.current === key) {
        setError(err.message || "Could not load local workers");
      }
    } finally {
      if (sequence.current === key) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadWorkers("", "");
    return () => {
      sequence.current += 1;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadWorkers(city, service);
  };

  const handleClear = () => {
    setCity("");
    setService("");
    void loadWorkers("", "");
  };

  return (
    <>
      <Header />
      <main className="directory-page">
        <div className="container" style={{ padding: "48px 20px 80px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
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
              APPROVED DIRECTORY
            </span>
            <h1 style={{ fontSize: "clamp(30px, 3.6vw, 44px)", fontWeight: 800, color: "#123b30", margin: "0 0 12px", lineHeight: 1.2 }}>
              Find Local Workers
            </h1>
            <p style={{ fontSize: 16, color: "#718078", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
              Explore profiles of approved service professionals in your city. Direct connections with honest pricing.
            </p>
          </div>

          {/* Simple Search & Filters */}
          <form
            onSubmit={handleSearch}
            style={{
              maxWidth: 720,
              margin: "0 auto 40px",
              background: "#ffffff",
              border: "1px solid #e5ebe4",
              borderRadius: 14,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 10px 30px rgba(18, 59, 48, 0.05)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 200px", padding: "6px 8px" }}>
              <MapPin size={18} style={{ color: "#718078", flexShrink: 0 }} />
              <input
                aria-label="Filter by City"
                placeholder="Enter city (e.g. Bhopal)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  border: 0,
                  outline: "none",
                  width: "100%",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#243b32",
                  background: "transparent",
                }}
              />
            </div>

            <div style={{ height: 28, width: 1, background: "#e5ebe4" }} className="mobile-hide" />

            <div style={{ display: "flex", alignItems: "center", flex: "1 1 200px", padding: "6px 8px" }}>
              <select
                aria-label="Filter by Service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                style={{
                  border: 0,
                  outline: "none",
                  width: "100%",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#243b32",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <option value="">All Services</option>
                {services.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-dark"
                style={{ padding: "12px 20px", fontSize: 13 }}
              >
                <Search size={16} />
                Search
              </button>
              {(city || service) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn"
                  style={{
                    padding: "12px 14px",
                    background: "#f0f4ee",
                    color: "#3d5746",
                    fontSize: 13,
                  }}
                  title="Reset filters"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </form>

          {error && (
            <div
              style={{
                maxWidth: 720,
                margin: "0 auto 30px",
                background: "#fff0ed",
                color: "#ad4435",
                border: "1px solid #f5c9c2",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Workers Grid or Empty State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#718078" }}>
              Loading local professionals…
            </div>
          ) : workers.length === 0 ? (
            /* Clean Empty State */
            <div
              style={{
                maxWidth: 580,
                margin: "40px auto",
                background: "#ffffff",
                border: "1px dashed #d5ded4",
                borderRadius: 16,
                padding: "60px 32px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: "#edf4e8",
                  color: "#568261",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 20px",
                }}
              >
                <UsersRound size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#123b30", margin: "0 0 10px" }}>
                No workers found in this area yet
              </h3>
              <p style={{ fontSize: 14, color: "#718078", maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.6 }}>
                Don't worry! Submit your household service request and our team will locate a verified technician for you.
              </p>
              <Link href="/book" className="btn btn-dark" style={{ padding: "14px 26px", fontSize: 14 }}>
                Send a Request <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {workers.map((worker) => (
                <article
                  key={worker.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5ebe4",
                    borderRadius: 16,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 6px 20px rgba(18, 59, 48, 0.04)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  {/* Top: Avatar & Availability */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#eaf3dd",
                        color: "#225746",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                        fontWeight: 800,
                      }}
                    >
                      {worker.name.charAt(0)}
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: 20,
                        background: "#e7f4e7",
                        color: "#356f43",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#438053" }} />
                      Verified
                    </span>
                  </div>

                  {/* Worker Name & Category */}
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 4px" }}>
                    {worker.name}
                  </h2>
                  <p style={{ fontSize: 13, color: "#457252", fontWeight: 700, margin: "0 0 12px" }}>
                    {worker.specialty || "Household Services"}
                  </p>

                  {/* Location & Experience */}
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#718078", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={14} style={{ color: "#557e62" }} />
                      {worker.city || "Local"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Briefcase size={14} style={{ color: "#557e62" }} />
                      {worker.experienceYears} Years Exp.
                    </span>
                  </div>

                  {/* Bio */}
                  {worker.bio && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#718078",
                        lineHeight: 1.55,
                        margin: "0 0 16px",
                        flex: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {worker.bio}
                    </p>
                  )}

                  {/* Rating / Review */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "#718078",
                      borderTop: "1px solid #f0f4ee",
                      paddingTop: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Star size={15} fill={worker.rating ? "#e3b14f" : "none"} color={worker.rating ? "#e3b14f" : "#b0c0b4"} />
                    {worker.rating ? (
                      <strong style={{ color: "#243b32" }}>
                        {worker.rating.toFixed(1)} <span style={{ color: "#8a998d", fontWeight: 400 }}>({worker.reviewCount} reviews)</span>
                      </strong>
                    ) : (
                      <span style={{ color: "#8a998d" }}>Active service partner</span>
                    )}
                  </div>

                  {/* CTA: Request This Worker */}
                  <Link
                    href={`/book?${new URLSearchParams({
                      service: worker.specialty || "",
                      city: worker.city || "",
                      worker: String(worker.id),
                    }).toString()}`}
                    className="btn btn-dark"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "11px 16px",
                      fontSize: 13,
                    }}
                  >
                    Request This Worker <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* Privacy Note */}
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#8a998d",
              marginTop: 48,
              lineHeight: 1.6,
            }}
          >
            Direct contact numbers are shared only once a service request is confirmed to protect technician privacy.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
