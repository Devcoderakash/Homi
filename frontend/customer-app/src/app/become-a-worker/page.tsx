"use client";

import { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  Upload,
  Image as ImageIcon,
  X,
  ShieldCheck,
  Eye,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Header, Footer, useServiceCategories } from "@/components/site";

export default function BecomeAWorkerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    applicationId: number;
    name: string;
    specialty: string;
    city: string;
    status: string;
    timing: string;
    documentType: string;
    hasDoc: boolean;
  } | null>(null);

  // Form states
  const { categories: services } = useServiceCategories();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Plumbing");

  useEffect(() => {
    if (services.length > 0 && !services.some((s) => s.name === category)) {
      setCategory(services[0].name);
    }
  }, [services, category]);
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("3");
  const [city, setCity] = useState("Bhopal");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  // Availability states
  const [availableFrom, setAvailableFrom] = useState("09:00 AM");
  const [availableTo, setAvailableTo] = useState("07:00 PM");
  const [availableDays, setAvailableDays] = useState("Monday to Saturday");

  // Document & Profile Verification states
  const [documentType, setDocumentType] = useState("Aadhaar Card");
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState("");
  const [documentFileSize, setDocumentFileSize] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [honeypot, setHoneypot] = useState("");

  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (
    file: File | undefined,
    type: "document" | "profile"
  ) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          if (type === "document") {
            setDocumentImage(compressed);
            setDocumentFileName(file.name);
            setDocumentFileSize((file.size / 1024).toFixed(0) + " KB");
          } else {
            setProfilePhoto(compressed);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (honeypot) {
      setSubmittedData({
        applicationId: 999999,
        name: fullName || "Applicant",
        specialty: category,
        city: city,
        status: "under_review",
        timing: `${availableFrom} - ${availableTo}`,
        documentType,
        hasDoc: false,
      });
      return;
    }
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
        availableFrom,
        availableTo,
        availableDays,
        documentType,
        documentUrl: documentImage || "",
        documentsUrl: documentImage || "",
        profilePhotoUrl: profilePhoto || "",
        website: honeypot,
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
        timing: `${availableFrom} - ${availableTo} (${availableDays})`,
        documentType,
        hasDoc: Boolean(documentImage),
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
                  <span className="text-[#718078]">Working Schedule:</span>
                  <strong className="text-right">{submittedData.timing}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#718078]">Verification Document:</span>
                  <span className="font-bold text-[#2e7d32]">
                    {submittedData.hasDoc ? `${submittedData.documentType} (Uploaded)` : "Pending"}
                  </span>
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
                {/* Anti-bot honeypot */}
                <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
                  <label htmlFor="worker_website">Website</label>
                  <input
                    type="text"
                    id="worker_website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
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

                {/* Section 4: Availability & Working Hours */}
                <div className="mb-7 sm:mb-8 pb-6 sm:pb-7 border-b border-[#eef1ed]">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123b30] mb-1 flex items-center gap-2">
                    <Clock size={18} className="text-[#557e62]" />
                    4. Availability & Working Hours
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a998d] mb-4 sm:mb-5">
                    Aap kab se kab tak kaam ke liye available hain? Yeh timing customers aur admin ko dikhegi.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Available Working Days *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          "All 7 Days (Mon - Sun)",
                          "Monday to Saturday",
                          "Monday to Friday",
                          "Weekends (Sat - Sun)",
                        ].map((daysOption) => (
                          <button
                            key={daysOption}
                            type="button"
                            onClick={() => setAvailableDays(daysOption)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                              availableDays === daysOption
                                ? "bg-[#123b30] text-[#d9ed89] border-[#123b30] shadow-xs"
                                : "bg-white text-[#41534a] border-[#e1e8df] hover:border-[#b8c9b3]"
                            }`}
                          >
                            {daysOption}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="form-field">
                        <label className="block text-xs font-extrabold text-[#345044] mb-2 flex items-center gap-1.5">
                          <span>Available From (Start Time) *</span>
                        </label>
                        <div className="relative">
                          <select
                            value={availableFrom}
                            onChange={(e) => setAvailableFrom(e.target.value)}
                            className="w-full border border-[#e1e8df] rounded-lg p-3 pr-10 text-sm text-[#294337] bg-white outline-none focus:border-[#92b777] min-h-[46px] appearance-none cursor-pointer"
                          >
                            {["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#718078]" />
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="block text-xs font-extrabold text-[#345044] mb-2 flex items-center gap-1.5">
                          <span>Available Till (End Time) *</span>
                        </label>
                        <div className="relative">
                          <select
                            value={availableTo}
                            onChange={(e) => setAvailableTo(e.target.value)}
                            className="w-full border border-[#e1e8df] rounded-lg p-3 pr-10 text-sm text-[#294337] bg-white outline-none focus:border-[#92b777] min-h-[46px] appearance-none cursor-pointer"
                          >
                            {["05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#718078]" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f8faf5] border border-[#e5ebe4] rounded-xl p-3 sm:p-3.5 flex items-center gap-2.5 text-xs text-[#285437]">
                      <Clock size={16} className="shrink-0 text-[#3e6b45]" />
                      <span>
                        <strong>Selected Working Schedule:</strong> {availableFrom} se {availableTo} ({availableDays})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 5: Profile Photo & Verification Document */}
                <div className="mb-7 sm:mb-8">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123b30] mb-1 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#557e62]" />
                    5. Profile Photo & Verification Document
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a998d] mb-4 sm:mb-5">
                    Dashboard me verification ke liye apna ID document aur profile photo upload karein.
                  </p>

                  <div className="space-y-6">
                    {/* Profile Photo */}
                    <div>
                      <label className="block text-xs font-extrabold text-[#345044] mb-2">
                        Worker Profile Photo (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#d5ded4] bg-[#f8faf5] overflow-hidden flex items-center justify-center shrink-0">
                          {profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profilePhoto} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={26} className="text-[#8a998d]" />
                          )}
                        </div>
                        <div>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFile(e.target.files?.[0], "profile")}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => photoInputRef.current?.click()}
                              className="btn btn-outline text-xs py-2 px-3.5 font-bold inline-flex items-center gap-1.5"
                            >
                              <Camera size={13} />
                              <span>{profilePhoto ? "Change Photo" : "Upload Photo"}</span>
                            </button>
                            {profilePhoto && (
                              <button
                                type="button"
                                onClick={() => setProfilePhoto(null)}
                                className="btn border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] text-xs py-2 px-2.5 font-bold rounded-lg"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8a998d] block mt-1.5">
                            Clear front-facing photo helps customers recognize you.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Type & Image Upload */}
                    <div className="pt-4 border-t border-[#eef1ed]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="form-field">
                          <label className="block text-xs font-extrabold text-[#345044] mb-2">
                            Document Type *
                          </label>
                          <div className="relative">
                            <select
                              value={documentType}
                              onChange={(e) => setDocumentType(e.target.value)}
                              className="w-full border border-[#e1e8df] rounded-lg p-3 pr-10 text-sm text-[#294337] bg-white outline-none focus:border-[#92b777] min-h-[46px] appearance-none cursor-pointer"
                            >
                              <option value="Aadhaar Card">Aadhaar Card (Front / Back)</option>
                              <option value="Voter ID Card">Voter ID Card</option>
                              <option value="Driving License">Driving License</option>
                              <option value="PAN Card">PAN Card</option>
                              <option value="Trade / ITI Certificate">Trade / ITI Certificate</option>
                              <option value="Govt ID Proof">Other Govt ID Proof</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#718078]" />
                          </div>
                        </div>

                        <div className="form-field flex flex-col justify-end">
                          <span className="text-xs text-[#718078] mb-2 block">
                            Document Image (Aadhaar / Voter ID / Certificate photo) *
                          </span>
                          <input
                            ref={docInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleImageFile(e.target.files?.[0], "document")}
                          />
                          <button
                            type="button"
                            onClick={() => docInputRef.current?.click()}
                            className="btn btn-outline text-xs py-2.5 px-4 font-bold inline-flex items-center justify-center gap-2 min-h-[46px] border-dashed border-2 hover:border-[#123b30] hover:bg-[#f8faf5]"
                          >
                            <Upload size={15} />
                            <span>{documentImage ? "Change Document Image" : "Upload Document Image"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Document Image Preview Box */}
                      {documentImage ? (
                        <div className="bg-[#f8faf5] border border-[#d5ded4] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div 
                              onClick={() => setPreviewModalImg(documentImage)}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[#c2cfbf] shrink-0 bg-white cursor-pointer group"
                              title="Click to view full image"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={documentImage} alt="Document" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye size={16} />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#eaf3dd] text-[#225746] uppercase">
                                  {documentType}
                                </span>
                                <CheckCircle2 size={14} className="text-[#2e7d32]" />
                              </div>
                              <p className="text-xs font-bold text-[#123b30] truncate mt-1">
                                {documentFileName || "Document image selected"}
                              </p>
                              <span className="text-[11px] text-[#718078]">
                                {documentFileSize ? `Size: ${documentFileSize} • ` : ""}Click image thumbnail to preview
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setPreviewModalImg(documentImage)}
                              className="btn btn-outline text-xs py-1.5 px-3 font-bold inline-flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentImage(null);
                                setDocumentFileName("");
                                setDocumentFileSize("");
                              }}
                              className="btn border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] text-xs py-1.5 px-3 font-bold rounded-lg inline-flex items-center gap-1"
                            >
                              <X size={12} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => docInputRef.current?.click()}
                          className="border-2 border-dashed border-[#ccd8ca] hover:border-[#557e62] rounded-xl p-6 text-center cursor-pointer bg-[#fafcf9] hover:bg-[#f5f8f3] transition-colors"
                        >
                          <FileCheck size={32} className="mx-auto mb-2 text-[#4f7a50]" />
                          <strong className="block text-xs sm:text-sm text-[#243b32] font-bold mb-1">
                            Aadhaar Card, Voter ID ya Trade Certificate ki photo upload karein
                          </strong>
                          <span className="text-xs text-[#718078] block">
                            Tap to browse image from phone/computer (JPG, PNG, WebP)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DPDP Privacy Notice & Verification Consent */}
                <div className="mb-6 p-4 rounded-xl bg-[#f2f8ed] border border-[#dcebd8] text-xs text-[#285437] space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldCheck size={16} />
                    <span>DPDP Act 2023 — Privacy Notice for Service Professionals</span>
                  </div>
                  <p className="leading-relaxed text-[#3b5944]">
                    Your personal information and government identity document are collected solely for identity verification, safety background screening, and fraud prevention as required by Indian regulations.
                  </p>
                  <p className="leading-relaxed text-[#3b5944]">
                    Your identity documents are stored in private, encrypted cloud storage and are <strong>never</strong> displayed publicly or shared with customers.
                  </p>
                  <label className="flex items-start gap-2 pt-1 font-semibold text-[#184e3f] cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="mt-0.5 rounded text-[#285437] focus:ring-[#285437]"
                    />
                    <span>
                      I consent to the collection and verification of my details and documents under the{" "}
                      <Link href="/privacy" target="_blank" className="underline font-bold hover:text-[#123b30]">
                        Homi Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" target="_blank" className="underline font-bold hover:text-[#123b30]">
                        Terms of Service
                      </Link>.
                    </span>
                  </label>
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

        {/* Full Image Preview Modal */}
        {previewModalImg && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewModalImg(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4] mb-3">
                <span className="text-sm font-extrabold text-[#123b30]">
                  Document Preview ({documentType})
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModalImg(null)}
                  className="p-1 rounded-lg text-[#718078] hover:text-[#123b30] hover:bg-[#f0f4ee]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-[#1a231f] rounded-xl p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewModalImg} alt="Document Full Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
