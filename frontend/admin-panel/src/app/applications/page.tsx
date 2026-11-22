"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileCheck, 
  Search, 
  RotateCw, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Clock, 
  UserCheck, 
  Eye,
  IndianRupee,
  Star,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  X,
  Image as ImageIcon,
  Briefcase
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { adminApi } from "../../services/adminApi";
import { formatRupees, formatDateTime } from "../../lib/utils";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getApplications({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setApplications(res.data?.applications || res.applications || []);
    } catch (err: any) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    try {
      setActingId(id);
      await adminApi.approveApplication(id, reviewNotes);
      alert("Worker application approved! Official worker profile has been activated on the platform roster.");
      await fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: "APPROVED" }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve application");
    } finally {
      setActingId(null);
    }
  };

  const handleShortlist = async (id: number) => {
    try {
      setActingId(id);
      await adminApi.shortlistApplication(id);
      await fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: "shortlisted" }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to shortlist proposal");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this worker application?")) return;
    try {
      setActingId(id);
      await adminApi.rejectApplication(id, reviewNotes);
      await fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: "REJECTED" }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject application");
    } finally {
      setActingId(null);
    }
  };

  const handleAssign = async (requestId: number, workerId: number, appId?: number) => {
    if (!confirm("Confirm assignment of this technician? All other applicants will be notified.")) return;
    try {
      setActingId(appId || workerId);
      await adminApi.assignWorker(requestId, workerId);
      await fetchApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, status: "accepted" }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign worker");
    } finally {
      setActingId(null);
    }
  };

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.requestId && a.requestId.toString().includes(q)) ||
      (a.fullName && a.fullName.toLowerCase().includes(q)) ||
      (a.workerName && a.workerName.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q)) ||
      (a.city && a.city.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q)) ||
      (a.message && a.message.toLowerCase().includes(q)) ||
      (a.note && a.note.toLowerCase().includes(q))
    );
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#123b30] tracking-tight">
              Worker Applications & Verifications
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Review technician applications, availability schedules, and ID verification documents to approve workers for platform dispatch.
            </p>
          </div>

          <button
            onClick={fetchApplications}
            className="btn btn-outline px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <RotateCw size={13} className={loading ? "animate-spin text-[#123b30]" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[#e5ebe4] overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
          {[
            { id: "all", label: "All Applications" },
            { id: "pending", label: "Pending Review" },
            { id: "approved", label: "Approved & Active" },
            { id: "shortlisted", label: "Shortlisted" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "border-[#123b30] text-[#123b30] font-extrabold"
                  : "border-transparent text-[#718078] hover:text-[#123b30]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="homi-card p-2.5 flex items-center gap-2.5">
          <Search size={15} className="text-[#718078] shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search by worker name, phone, city, category, or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent text-[#183c31] placeholder-[#718078] font-medium"
          />
        </div>

        {/* Mobile View: Stacked Application Cards */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading worker applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              <p className="font-bold text-xs text-[#123b30] mb-1">
                No worker applications found matching this filter.
              </p>
              <Link
                href="/workers"
                className="btn btn-dark text-xs py-1.5 px-3.5 font-bold inline-flex items-center gap-1.5 shadow-2xs mt-2"
              >
                <span>View Registered Workers</span>
              </Link>
            </div>
          ) : (
            filtered.map((a) => {
              const docImg = a.documentUrl || a.documentsUrl;
              const hasTiming = a.availableFrom || a.availableTo;
              const name = a.fullName || a.workerName || `Applicant #${a.id}`;
              const isApproved = a.status === "APPROVED" || a.status === "accepted";
              const isRejected = a.status === "REJECTED" || a.status === "rejected";

              return (
                <div key={a.id} className="homi-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {a.profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={a.profilePhotoUrl} 
                          alt="" 
                          className="w-9 h-9 rounded-full object-cover border border-[#c5d3c1] shrink-0" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold text-[#123b30] text-sm">
                          {name}
                        </div>
                        <div className="text-[11px] text-[#718078]">
                          {a.category || a.specialty || "General Technician"} • {a.city || "Bhopal"}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Availability Timing Box */}
                  {hasTiming && (
                    <div className="bg-[#f4f8f2] border border-[#dbe6d7] rounded-lg p-2.5 flex items-center gap-2 text-xs text-[#244a33]">
                      <Clock size={14} className="text-[#3e6b45] shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold">Available: {a.availableFrom || "09:00 AM"} - {a.availableTo || "07:00 PM"}</span>
                        <span className="text-[11px] text-[#557e62] block truncate">
                          Days: {a.availableDays || "Monday to Saturday"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Verification Document Thumbnail & Type */}
                  {docImg && (
                    <div className="flex items-center justify-between bg-[#f8faf5] border border-[#e5ebe4] rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={() => setZoomImage({ url: docImg, title: `${name} - ${a.documentType || "ID Document"}` })}
                          className="w-10 h-10 rounded border border-[#ccd8ca] overflow-hidden cursor-pointer shrink-0 bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={docImg} alt="Document" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-[#123b30] block">
                            {a.documentType || "Verification Document"}
                          </span>
                          <span className="text-[10px] text-[#2e7d32] font-semibold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Image Uploaded
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setZoomImage({ url: docImg, title: `${name} - ${a.documentType || "ID Document"}` })}
                        className="btn btn-outline text-[11px] py-1 px-2 font-bold"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#718078] pt-1">
                    <span>Phone: {a.phone || "—"}</span>
                    <span>
                      Applied: {new Date(a.appliedAt || a.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#e5ebe4]">
                    {!isApproved && !isRejected && (
                      <>
                        <button
                          onClick={() => handleApprove(a.id)}
                          disabled={actingId === a.id}
                          className="btn btn-dark text-xs py-2 px-3 font-bold flex-1"
                        >
                          Approve Worker
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          disabled={actingId === a.id}
                          className="btn bg-[#fee2e2] text-[#991b1b] text-xs py-2 px-3 font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setSelectedApp(a);
                        setReviewNotes(a.adminNotes || "");
                      }}
                      className="btn btn-outline text-[#123b30] text-xs py-2 px-3 font-bold flex items-center justify-center gap-1"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Applications Table (Desktop / Tablet) */}
        <div className="homi-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf5] border-b border-[#e5ebe4] text-[#718078] uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Applicant / Worker</th>
                  <th className="py-3 px-4">Trade Specialty</th>
                  <th className="py-3 px-4">Available Timings</th>
                  <th className="py-3 px-4">ID Document</th>
                  <th className="py-3 px-4">Contact & City</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ebe4]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading worker applications...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      <p className="font-bold text-xs text-[#123b30] mb-1">
                        No worker applications found matching this filter.
                      </p>
                      <Link
                        href="/workers"
                        className="btn btn-dark text-xs py-1.5 px-3.5 font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>View Registered Workers</span>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const docImg = a.documentUrl || a.documentsUrl;
                    const hasTiming = a.availableFrom || a.availableTo;
                    const name = a.fullName || a.workerName || `Applicant #${a.id}`;
                    const isApproved = a.status === "APPROVED" || a.status === "accepted";
                    const isRejected = a.status === "REJECTED" || a.status === "rejected";

                    return (
                      <tr key={a.id} className="hover:bg-[#f8faf5] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {a.profilePhotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={a.profilePhotoUrl} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover border border-[#c5d3c1] shrink-0" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-[#123b30]">
                                {name}
                              </div>
                              <div className="text-[11px] text-[#718078]">
                                App #{a.id} • {a.experienceYears ? `${a.experienceYears} yrs exp` : "Fresh"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#183c31] bg-[#f0f4ee] px-2 py-0.5 rounded capitalize">
                            {a.category || a.specialty || "Technician"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {hasTiming ? (
                            <div className="text-xs">
                              <span className="font-bold text-[#123b30] flex items-center gap-1">
                                <Clock size={12} className="text-[#3e6b45]" />
                                {a.availableFrom || "09:00 AM"} - {a.availableTo || "07:00 PM"}
                              </span>
                              <span className="text-[11px] text-[#718078] block">
                                {a.availableDays || "Monday to Saturday"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#718078]">Standard hours</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {docImg ? (
                            <div className="flex items-center gap-2">
                              <div 
                                onClick={() => setZoomImage({ url: docImg, title: `${name} - ${a.documentType || "ID Document"}` })}
                                className="w-9 h-9 rounded border border-[#ccd8ca] overflow-hidden cursor-pointer hover:border-[#123b30] transition-colors shrink-0 bg-white"
                                title="Click to view full image"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={docImg} alt="Document" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="font-bold text-[#123b30] block text-[11px]">
                                  {a.documentType || "ID Document"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setZoomImage({ url: docImg, title: `${name} - ${a.documentType || "ID Document"}` })}
                                  className="text-[10px] text-[#2e7d32] hover:underline font-bold"
                                >
                                  View Image ↗
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#8a998d] italic text-[11px]">In-person verify</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[#183c31] font-medium">{a.phone || "—"}</div>
                          <div className="text-[11px] text-[#718078]">{a.city || "Bhopal"}{a.area ? `, ${a.area}` : ""}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isApproved && !isRejected && (
                              <>
                                <button
                                  onClick={() => handleApprove(a.id)}
                                  disabled={actingId === a.id}
                                  className="btn btn-dark text-[11px] py-1 px-2.5 font-bold shadow-2xs"
                                  title="Approve worker application"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(a.id)}
                                  disabled={actingId === a.id}
                                  className="btn bg-[#fee2e2] text-[#991b1b] text-[11px] py-1 px-2 font-bold"
                                  title="Reject application"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedApp(a);
                                setReviewNotes(a.adminNotes || "");
                              }}
                              className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2 font-bold"
                              title="View full details"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Details Drawer */}
        <Drawer
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Worker Application #${selectedApp?.id || ""}`}
          subtitle={`Submitted by ${selectedApp?.fullName || selectedApp?.workerName || "Applicant"} on ${selectedApp ? formatDateTime(selectedApp.appliedAt || selectedApp.createdAt) : ""}`}
        >
          {selectedApp && (
            <div className="space-y-5 text-xs text-[#183c31]">
              {/* Top Banner Status */}
              <div className="flex items-center justify-between p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
                <div className="flex items-center gap-3">
                  {selectedApp.profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={selectedApp.profilePhotoUrl} 
                      alt="" 
                      className="w-12 h-12 rounded-full object-cover border border-[#c5d3c1]" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-base flex items-center justify-center">
                      {(selectedApp.fullName || selectedApp.workerName || "W").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-[#123b30] text-sm">
                      {selectedApp.fullName || selectedApp.workerName}
                    </h3>
                    <p className="text-[11px] text-[#718078] capitalize">
                      {selectedApp.category || selectedApp.specialty} • {selectedApp.experienceYears || 0} Years Experience
                    </p>
                  </div>
                </div>
                <StatusBadge status={selectedApp.status} />
              </div>

              {/* ⏰ Working Availability Box */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock size={13} className="text-[#3e6b45]" />
                  <span>Availability & Working Hours</span>
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#718078]">Working Hours:</span>
                    <strong className="text-[#123b30] font-bold">
                      {selectedApp.availableFrom || "09:00 AM"} se {selectedApp.availableTo || "07:00 PM"}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#718078]">Available Days:</span>
                    <strong className="text-[#123b30] font-bold">
                      {selectedApp.availableDays || "Monday to Saturday"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 📄 Profile & Verification Document Uploaded */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#3e6b45]" />
                  <span>Profile & ID Document Verification</span>
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#718078]">Document Type:</span>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#eaf3dd] text-[#225746] uppercase">
                      {selectedApp.documentType || "Aadhaar Card"}
                    </span>
                  </div>

                  {(selectedApp.documentUrl || selectedApp.documentsUrl) ? (
                    <div>
                      <span className="text-[#718078] block mb-1.5 text-[11px]">Uploaded Document Image:</span>
                      <div 
                        onClick={() => setZoomImage({ 
                          url: selectedApp.documentUrl || selectedApp.documentsUrl, 
                          title: `${selectedApp.fullName || selectedApp.workerName} - ${selectedApp.documentType || "Document"}` 
                        })}
                        className="relative rounded-lg overflow-hidden border border-[#ccd8ca] bg-[#1a231f] cursor-pointer group max-h-48 flex items-center justify-center p-1"
                        title="Click to zoom image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={selectedApp.documentUrl || selectedApp.documentsUrl} 
                          alt="Verification Document" 
                          className="max-h-44 w-auto object-contain rounded group-hover:scale-102 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5">
                          <Eye size={15} />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setZoomImage({ 
                          url: selectedApp.documentUrl || selectedApp.documentsUrl, 
                          title: `${selectedApp.fullName || selectedApp.workerName} - ${selectedApp.documentType || "Document"}` 
                        })}
                        className="btn btn-outline text-xs py-1.5 px-3 font-bold w-full mt-2 inline-flex items-center justify-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>Open Document Image Full-Size</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#f8faf5] border border-dashed border-[#ccd8ca] p-3 text-center rounded-lg text-xs text-[#718078]">
                      No digital document uploaded. Original ID will be verified in person during initial coordinator onboarding.
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Contact & Location
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#557e62]" />
                    <span className="font-bold">{selectedApp.phone || "No phone provided"}</span>
                  </div>
                  {selectedApp.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-[#557e62]" />
                      <span>{selectedApp.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 pt-1 border-t border-[#f0f4ee]">
                    <MapPin size={13} className="text-[#557e62] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{selectedApp.city || "Bhopal"}{selectedApp.area ? `, ${selectedApp.area}` : ""}</p>
                      {selectedApp.address && (
                        <p className="text-[#718078] text-[11px] mt-0.5">{selectedApp.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Bio */}
              {(selectedApp.skills || selectedApp.bio) && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                    Skills & Introduction
                  </h4>
                  <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-2">
                    {selectedApp.skills && (
                      <div>
                        <span className="text-[#718078] text-[10px] uppercase font-bold block">Specializations:</span>
                        <p className="font-medium text-[#183c31] mt-0.5">{selectedApp.skills}</p>
                      </div>
                    )}
                    {selectedApp.bio && (
                      <div className="pt-1.5 border-t border-[#f0f4ee]">
                        <span className="text-[#718078] text-[10px] uppercase font-bold block">Bio:</span>
                        <p className="text-[#41534a] text-[11px] leading-relaxed mt-0.5">{selectedApp.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Review Notes & Actions */}
              <div className="pt-2 space-y-2">
                {selectedApp.status === "PENDING" && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Optional admin review notes (e.g. Identity verified via Aadhaar)..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full border border-[#e1e8df] rounded-lg p-2.5 text-xs text-[#294337] outline-none focus:border-[#92b777] resize-none"
                    />
                    <button
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={actingId === selectedApp.id}
                      className="btn btn-dark w-full py-2.5 text-xs font-bold shadow-xs"
                    >
                      {actingId === selectedApp.id ? "Approving & Registering..." : "Approve & Activate Worker Profile"}
                    </button>
                    <button
                      onClick={() => handleReject(selectedApp.id)}
                      disabled={actingId === selectedApp.id}
                      className="btn bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] w-full py-2 text-xs font-bold"
                    >
                      Reject Application
                    </button>
                  </div>
                )}

                {selectedApp.status === "APPROVED" && (
                  <div className="bg-[#eaf5e5] border border-[#b8d1ad] rounded-xl p-3 text-center text-[#285437] font-bold text-xs">
                    ✓ Verified Worker Profile is active on platform roster
                  </div>
                )}
              </div>
            </div>
          )}
        </Drawer>

        {/* Document Image Zoom Modal */}
        {zoomImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setZoomImage(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-3xl w-full p-4 overflow-hidden relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4] mb-3">
                <span className="text-sm font-extrabold text-[#123b30]">
                  {zoomImage.title}
                </span>
                <button
                  type="button"
                  onClick={() => setZoomImage(null)}
                  className="p-1 rounded-lg text-[#718078] hover:text-[#123b30] hover:bg-[#f0f4ee]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-[#1a231f] rounded-xl p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={zoomImage.url} alt="Full Verification Document" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
