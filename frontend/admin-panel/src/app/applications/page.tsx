"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileCheck, 
  Search, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  Eye,
  IndianRupee,
  Star,
  ExternalLink,
  MapPin,
  MessageSquare,
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
    if (!confirm("Are you sure you want to reject this worker proposal?")) return;
    try {
      setActingId(id);
      await adminApi.rejectApplication(id);
      await fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: "rejected" }));
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
      a.requestId.toString().includes(q) ||
      (a.workerName && a.workerName.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q)) ||
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
              Worker Applications & Proposals
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Review technician visit fee proposals, compare ratings, and assign the best worker to customer requests.
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
            { id: "all", label: "All Proposals" },
            { id: "pending", label: "Pending Decision" },
            { id: "shortlisted", label: "Shortlisted" },
            { id: "accepted", label: "Selected & Assigned" },
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
            placeholder="Search by worker name, request ID, category, or proposal note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent text-[#183c31] placeholder-[#718078] font-medium"
          />
        </div>

        {/* Applications Table */}
        <div className="homi-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf5] border-b border-[#e5ebe4] text-[#718078] uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Related Request</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Expected Charges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied Date</th>
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
                        No worker proposals found matching this filter.
                      </p>
                      <p className="text-[11px] text-[#718078] max-w-md mx-auto mb-3">
                        Technicians apply for open jobs from their worker app. As an administrator, you can also directly assign any registered technician from the Service Requests page without waiting.
                      </p>
                      <Link
                        href="/requests"
                        className="btn btn-dark text-xs py-1.5 px-3.5 font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>View Open Requests</span>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-[#f8faf5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {(a.workerName || "W").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#123b30]">
                              {a.workerName || `Worker #${a.workerId}`}
                            </div>
                            <div className="text-[11px] text-[#718078]">
                              {a.workerSpecialty || a.specialty || "Certified Technician"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/requests/${a.requestId}`}
                          className="font-extrabold text-[#123b30] hover:text-[#266352] flex items-center gap-1 group"
                          title="Open related request"
                        >
                          <span>Request #{a.requestId}</span>
                          <ExternalLink className="w-3 h-3 text-[#718078] group-hover:text-[#123b30]" />
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#183c31] bg-[#f0f4ee] px-2 py-0.5 rounded capitalize">
                          {a.category || "Service"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#183c31]">
                        {a.expectedCharges ? formatRupees(a.expectedCharges) : "Standard"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 text-[#718078] whitespace-nowrap">
                        {new Date(a.appliedAt || a.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status !== "accepted" && (
                            <>
                              <button
                                onClick={() => handleAssign(a.requestId, a.workerId, a.id)}
                                disabled={actingId === a.id}
                                className="btn btn-dark text-[11px] py-1 px-2.5 font-bold shadow-2xs"
                                title="Assign this worker to the request"
                              >
                                Assign
                              </button>
                              {a.status !== "shortlisted" && (
                                <button
                                  onClick={() => handleShortlist(a.id)}
                                  disabled={actingId === a.id}
                                  className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2 font-bold"
                                  title="Shortlist proposal"
                                >
                                  Shortlist
                                </button>
                              )}
                              <button
                                onClick={() => handleReject(a.id)}
                                disabled={actingId === a.id}
                                className="btn bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] text-[11px] py-1 px-2 font-bold"
                                title="Reject proposal"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedApp(a)}
                            className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2 font-bold"
                            title="View proposal details"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Details Drawer */}
        <Drawer
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Proposal from ${selectedApp?.workerName || "Technician"}`}
          subtitle={`Submitted on ${selectedApp ? formatDateTime(selectedApp.appliedAt || selectedApp.createdAt) : ""}`}
        >
          {selectedApp && (
            <div className="space-y-5 text-xs text-[#183c31]">
              <div className="flex items-center justify-between p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
                <div>
                  <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                    Proposed Visit Fee
                  </span>
                  <p className="font-extrabold text-[#123b30] text-base">
                    {selectedApp.expectedCharges ? formatRupees(selectedApp.expectedCharges) : "Standard Fee"}
                  </p>
                </div>
                <StatusBadge status={selectedApp.status} />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Technician Profile
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1">
                  <p className="font-bold text-[#123b30]">{selectedApp.workerName || "Worker Partner"}</p>
                  <p className="text-[#718078] capitalize">{selectedApp.workerSpecialty || selectedApp.specialty || selectedApp.category || "General Handyman"}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Proposal Note & Availability
                </h4>
                <p className="p-3 bg-white rounded-lg border border-[#e5ebe4] text-[#41534a] leading-relaxed">
                  {selectedApp.message || selectedApp.note || "Available immediately with necessary tools and replacement parts."}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Related Service Request
                </h4>
                <div className="p-3 bg-[#f8faf5] rounded-lg border border-[#e5ebe4] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#123b30]">Request #{selectedApp.requestId}</p>
                    <p className="text-[11px] text-[#718078] capitalize">{selectedApp.category}</p>
                  </div>
                  <Link
                    href={`/requests/${selectedApp.requestId}`}
                    className="btn btn-outline text-xs px-2.5 py-1 text-[#123b30] font-bold flex items-center gap-1"
                  >
                    <span>View Request</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>

              {selectedApp.status !== "accepted" && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handleAssign(selectedApp.requestId, selectedApp.workerId, selectedApp.id)}
                    disabled={actingId === selectedApp.id}
                    className="btn btn-dark w-full py-2.5 text-xs font-bold shadow-xs"
                  >
                    Confirm & Assign This Worker
                  </button>

                  {selectedApp.status !== "shortlisted" && (
                    <button
                      onClick={() => handleShortlist(selectedApp.id)}
                      disabled={actingId === selectedApp.id}
                      className="btn btn-outline w-full py-2 text-xs font-bold text-[#123b30]"
                    >
                      Shortlist Proposal
                    </button>
                  )}

                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    disabled={actingId === selectedApp.id}
                    className="btn bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] w-full py-2 text-xs font-bold"
                  >
                    Reject Proposal
                  </button>
                </div>
              )}
            </div>
          )}
        </Drawer>
      </div>
    </AdminShell>
  );
}
