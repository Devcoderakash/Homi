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
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {submittedData ? (
            /* Confirmation Screen */
            <div className="bg-white border border-[#e5ebe4] rounded-2xl p-6 sm:p-10 md:p-12 text-center shadow-sm">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#eaf3dd] text-[#225746] grid place-items-center mx-auto mb-5 sm:mb-6">
                <CheckCircle2 size={36} className="sm:w-10 sm:h-10" />
              </div>

              <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider bg-[#fff5dc] text-[#a47627] mb-4 uppercase">
                STATUS: {submittedData.status}
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123b30] mb-3">
                Application Received!
              </h1>
              <p className="text-sm sm:text-base text-[#718078] max-w-lg mx-auto mb-6 leading-relaxed">
                Thank you, <strong>{submittedData.name}</strong>. Your application as a <strong>{submittedData.specialty}</strong> in <strong>{submittedData.city}</strong> has been saved.
              </p>

              <div className="bg-[#f8faf5] border border-[#e5ebe4] rounded-xl p-4 sm:p-6 max-w-md mx-auto mb-6 sm:mb-8 text-left text-xs sm:text-sm text-[#243b32] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#718078]">Application ID:</span>
                  <strong className="font-mono">#{submittedData.applicationId}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#718078]">Service Category:</span>
                  <strong>{submittedData.specialty}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#718078]">Review Status:</span>
                  <span className="text-[#a47627] font-extrabold">Pending Admin Review</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#8a998d] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
                Our team verifies every service professional to maintain trust for families. We will contact you on your registered mobile number for document verification.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/" className="btn btn-dark w-full sm:w-auto py-3 px-6 text-sm font-bold min-h-[44px]">
                  Back to Home
                </Link>
                <Link href="/workers" className="btn btn-lime w-full sm:w-auto py-3 px-6 text-sm font-bold min-h-[44px]">
                  Explore Workers Directory <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            /* Application Form */
            <div>
              {/* Heading */}
              <div className="mb-6 sm:mb-9 text-center">
                <span className="inline-block text-xs font-extrabold tracking-widest text-[#557e62] mb-2 uppercase">
                  JOIN AS A LOCAL SERVICE PROFESSIONAL
                </span>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#123b30] mb-3 leading-tight tracking-tight">
                  Aapka hunar. Apne shehar mein kaam.
                </h1>
                <p className="text-sm sm:text-base text-[#718078] max-w-xl mx-auto leading-relaxed">
                  Join Homi as a local service professional. Share your skills and experience with us.
                </p>
              </div>

              {/* Form Card */}
              <form
                onSubmit={handleSubmit}
                className="bg-white border border-[#e5ebe4] rounded-2xl p-5 sm:p-8 md:p-10 shadow-sm"
              >
                {error && (
                  <div className="bg-[#fff0ed] text-[#ad4435] border border-[#f5c9c2] rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm mb-6">
                    {error}
                  </div>
                )}

                {/* Section 1: Personal Details */}
                <div className="mb-7 sm:mb-8 pb-6 sm:pb-7 border-b border-[#eef1ed]">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123b30] mb-1">
                    1. Personal Details
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a998d] mb-4 sm:mb-5">
                    Your primary contact information for customer communication.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="form-field">
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        autoComplete="name"
                        placeholder="e.g. Ramesh Kumar Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                      />
                    </div>

                    <div className="form-field">
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Mobile Number (10 Digits) *
                      </label>
                      <input
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        maxLength={10}
                        placeholder="e.g. 9826012345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                      />
                    </div>
                  </div>

                  <div className="form-field mt-4">
                    <label className="block text-xs font-extrabold text-[#345044] mb-2">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. ramesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                    />
                  </div>
                </div>

                {/* Section 2: Service & Skills */}
                <div className="mb-7 sm:mb-8 pb-6 sm:pb-7 border-b border-[#eef1ed]">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123b30] mb-1">
                    2. Service Category & Skills
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a998d] mb-4 sm:mb-5">
                    Select your primary trade and tell us your experience.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="form-field">
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Primary Service Category *
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full border border-[#e1e8df] rounded-lg p-3 pr-10 text-sm text-[#294337] bg-white outline-none focus:border-[#92b777] min-h-[46px] appearance-none cursor-pointer"
                        >
                          {services.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#718078]" />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Experience (Years) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="50"
                        placeholder="e.g. 5"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                      />
                    </div>
                  </div>

                  <div className="form-field mt-4">
                    <label className="block text-xs font-extrabold text-[#345044] mb-2">
                      Skills & Specializations
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pipe leaks, bathroom fitting, sanitary installations, water motor repair"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                    />
                  </div>

                  <div className="form-field mt-4">
                    <label className="block text-xs font-extrabold text-[#345044] mb-2">
                      Short Introduction (Bio)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell customers briefly about your work background, reliability and quality of work..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[85px] resize-y"
                    />
                  </div>
                </div>

                {/* Section 3: Location */}
                <div className="mb-7 sm:mb-8 pb-6 sm:pb-7 border-b border-[#eef1ed]">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123b30] mb-1">
                    3. Work Location
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a998d] mb-4 sm:mb-5">
                    Where do you live and offer your home repair services?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="form-field">
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        City *
                      </label>
                      <input
                        required
                        type="text"
                        autoComplete="address-level2"
                        placeholder="e.g. Bhopal"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                      />
                    </div>

                    <div className="form-field">
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Area / Locality *
                      </label>
                      <input
                        required
                        type="text"
                        autoComplete="address-line2"
                        placeholder="e.g. MP Nagar, Arera Colony"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                      />
                    </div>
                  </div>

                  <div className="form-field mt-4">
                    <label className="block text-xs font-extrabold text-[#345044] mb-2">
                      Full Address
                    </label>
                    <input
                      type="text"
                      autoComplete="street-address"
                      placeholder="e.g. House No. 24, Zone 2, MP Nagar, Bhopal"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-[#e1e8df] rounded-lg p-3 text-sm text-[#294337] outline-none focus:border-[#92b777] min-h-[46px]"
                    />
                  </div>
                </div>

                {/* Section 4: Verification */}
                <div className="mb-7 sm:mb-8">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123b30] mb-1">
                    4. Profile & Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a998d] mb-4">
                    Trade or identification documents (e.g. Aadhaar / ITI trade certificate).
                  </p>

                  <div className="bg-[#f8faf5] border border-dashed border-[#d5ded4] rounded-xl p-4 sm:p-5 text-center text-xs sm:text-sm text-[#6b8073]">
                    <FileCheck size={28} className="mx-auto mb-2 text-[#4f7a50]" />
                    <strong className="block text-[#243b32] mb-1 font-bold">
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
                  className="btn btn-dark w-full min-h-[50px] text-sm sm:text-base font-extrabold tracking-wide flex items-center justify-center gap-2 rounded-xl shadow-xs"
                >
                  {loading ? "Submitting Application…" : "Apply as a Worker →"}
                </button>

                <p className="text-xs text-[#8a998d] text-center mt-4 leading-relaxed">
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
