"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Wrench, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  FileText, 
  Clock, 
  Sparkles,
  Camera,
  FileCheck,
  ChevronDown
} from "lucide-react";
import { Header, Footer, services } from "@/components/site";

export default function BecomeAWorkerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    applicationId: number;
    name: string;
    specialty: string;
    city: string;
    status: string;
  } | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("3");
  const [city, setCity] = useState("Bhopal");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        category,
        skills: skills.trim(),
        experienceYears: Number(experienceYears) || 0,
        city: city.trim(),
        area: area.trim(),
        address: address.trim(),
        bio: bio.trim(),
      };

      const res = await fetch("/api/workers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application. Please check your details.");
      }

      setSubmittedData({
        applicationId: data.applicationId || data.data?.id,
        name: data.data?.name || fullName,
        specialty: data.data?.specialty || category,
        city: data.data?.city || city,
        status: "PENDING",
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="inner-page">
        <div className="container" style={{ maxWidth: 840, margin: "0 auto", padding: "40px 20px" }}>
          {submittedData ? (
            /* Confirmation Screen */
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5ebe4",
                borderRadius: 16,
                padding: "48px 36px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(18, 59, 48, 0.06)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#eaf3dd",
                  color: "#225746",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 24px",
                }}
              >
                <CheckCircle2 size={40} />
              </div>

              <span
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: 30,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  background: "#fff5dc",
                  color: "#a47627",
                  marginBottom: 16,
                }}
              >
                STATUS: {submittedData.status}
              </span>

              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#123b30", margin: "0 0 12px" }}>
                Application Received!
              </h1>
              <p style={{ color: "#718078", fontSize: 16, maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.6 }}>
                Thank you, <strong>{submittedData.name}</strong>. Your application as a <strong>{submittedData.specialty}</strong> in <strong>{submittedData.city}</strong> has been saved.
              </p>

              <div
                style={{
                  background: "#f8faf5",
                  border: "1px solid #e5ebe4",
                  borderRadius: 12,
                  padding: "20px 24px",
                  maxWidth: 480,
                  margin: "0 auto 32px",
                  textAlign: "left",
                  fontSize: 14,
                  color: "#243b32",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#718078" }}>Application ID:</span>
                  <strong>#{submittedData.applicationId}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#718078" }}>Service Category:</span>
                  <strong>{submittedData.specialty}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#718078" }}>Review Status:</span>
                  <span style={{ color: "#a47627", fontWeight: 700 }}>Pending Admin Review</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: "#8a998d", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.6 }}>
                Our team verifies every service professional to maintain trust for families. We will contact you on your registered mobile number for document verification.
              </p>

              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/" className="btn btn-dark" style={{ padding: "14px 24px" }}>
                  Back to Home
                </Link>
                <Link href="/workers" className="btn btn-lime" style={{ padding: "14px 24px" }}>
                  Explore Workers Directory <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            /* Application Form */
            <div>
              {/* Heading */}
              <div style={{ marginBottom: 36, textAlign: "center" }}>
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
                  JOIN AS A LOCAL SERVICE PROFESSIONAL
                </span>
                <h1 style={{ fontSize: "clamp(32px, 3.8vw, 46px)", fontWeight: 800, color: "#123b30", margin: "0 0 14px", lineHeight: 1.18 }}>
                  Aapka hunar. Apne shehar mein kaam.
                </h1>
                <p style={{ fontSize: 16, color: "#718078", maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
                  Join Homi as a local service professional. Share your skills and experience with us.
                </p>
              </div>

              {/* Form Card */}
              <form
                onSubmit={handleSubmit}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5ebe4",
                  borderRadius: 16,
                  padding: "40px",
                  boxShadow: "0 12px 36px rgba(18, 59, 48, 0.05)",
                }}
              >
                {error && (
                  <div
                    style={{
                      background: "#fff0ed",
                      color: "#ad4435",
                      border: "1px solid #f5c9c2",
                      borderRadius: 10,
                      padding: "14px 18px",
                      fontSize: 13,
                      marginBottom: 24,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Section 1: Personal Details */}
                <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #eef1ed" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 6px" }}>
                    1. Personal Details
                  </h2>
                  <p style={{ fontSize: 13, color: "#8a998d", margin: "0 0 20px" }}>
                    Your primary contact information for customer communication.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <div className="form-field">
                      <label>Full Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Ramesh Kumar Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Mobile Number (10 Digits) *</label>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9826012345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginTop: 16 }}>
                    <label>Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 2: Service & Skills */}
                <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #eef1ed" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 6px" }}>
                    2. Service Category & Skills
                  </h2>
                  <p style={{ fontSize: 13, color: "#8a998d", margin: "0 0 20px" }}>
                    Select your primary trade and tell us your experience.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
                    <div className="form-field">
                      <label>Primary Service Category *</label>
                      <div style={{ position: "relative" }}>
                        <select
                          required
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{ appearance: "none", cursor: "pointer", paddingRight: 36 }}
                        >
                          {services.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#718078" }} />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Experience (Years) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="50"
                        placeholder="e.g. 5"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginTop: 16 }}>
                    <label>Skills & Specializations</label>
                    <input
                      type="text"
                      placeholder="e.g. Pipe leaks, bathroom fitting, sanitary installations, water motor repair"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </div>

                  <div className="form-field" style={{ marginTop: 16 }}>
                    <label>Short Introduction (Bio)</label>
                    <textarea
                      rows={3}
                      placeholder="Tell customers briefly about your work background, reliability and quality of work..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 3: Location */}
                <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #eef1ed" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 6px" }}>
                    3. Work Location
                  </h2>
                  <p style={{ fontSize: 13, color: "#8a998d", margin: "0 0 20px" }}>
                    Where do you live and offer your home repair services?
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <div className="form-field">
                      <label>City *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Bhopal"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Area / Locality *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. MP Nagar, Arera Colony"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginTop: 16 }}>
                    <label>Full Address</label>
                    <input
                      type="text"
                      placeholder="e.g. House No. 24, Zone 2, MP Nagar, Bhopal"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 4: Verification (Optional / Trade info) */}
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", margin: "0 0 6px" }}>
                    4. Profile & Verification
                  </h2>
                  <p style={{ fontSize: 13, color: "#8a998d", margin: "0 0 16px" }}>
                    Optional trade or identification documents (e.g. Aadhaar / ITI trade certificate).
                  </p>

                  <div
                    style={{
                      background: "#f8faf5",
                      border: "1px dashed #d5ded4",
                      borderRadius: 12,
                      padding: "20px",
                      textAlign: "center",
                      color: "#6b8073",
                      fontSize: 13,
                    }}
                  >
                    <FileCheck size={28} style={{ margin: "0 auto 8px", color: "#4f7a50" }} />
                    <strong style={{ display: "block", color: "#243b32", marginBottom: 4 }}>
                      Verification in Person / Over Phone
                    </strong>
                    <span>
                      Our local coordinator will inspect original Aadhaar and trade certificates during the verification call.
                    </span>
                  </div>
                </div>

                {/* Submission CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-dark"
                  style={{
                    width: "100%",
                    height: 52,
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {loading ? "Submitting Application…" : "Apply as a Worker →"}
                </button>

                <p style={{ fontSize: 12, color: "#8a998d", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
                  By applying, you agree to connect honestly with households and respect fair pricing guidelines.
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
