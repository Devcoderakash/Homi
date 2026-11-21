"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Clock, 
  Eye,
  Send,
  MapPin,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { adminApi } from "../../services/adminApi";
import { formatDateTime } from "../../lib/utils";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acting, setActing] = useState(false);
  const [assignModalReq, setAssignModalReq] = useState<any | null>(null);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const handleOpenAssignModal = async (req: any) => {
    setAssignModalReq(req);
    try {
      setLoadingWorkers(true);
      const res = await adminApi.getWorkers();
      setAvailableWorkers(res.data?.workers || res.workers || []);
    } catch (err: any) {
      console.error("Failed to load workers for assignment", err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleDirectAssignWorker = async (workerId: number) => {
    if (!assignModalReq) return;
    if (!confirm("Assign this technician to the request? Both customer and technician will be notified immediately.")) return;
    try {
      setActing(true);
      await adminApi.assignWorker(assignModalReq.id, workerId, "Direct assignment by platform administrator");
      setAssignModalReq(null);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to assign worker");
    } finally {
      setActing(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRequests(res.data?.requests || res.requests || []);
    } catch (err: any) {
      if (err?.message?.includes("authorization required") || err?.message?.includes("401")) {
        return;
      }
      console.warn("Could not fetch requests:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handlePublish = async (id: number) => {
    if (!confirm("Approve and broadcast this request to all verified workers in the service radius?")) return;
    try {
      setActing(true);
      await adminApi.publishRequest(id);
      await fetchRequests();
      if (selectedReq?.id === id) {
        setSelectedReq((prev: any) => ({ ...prev, status: "open_for_applications" }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to publish request");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq || !rejectReason.trim()) return;
    try {
      setActing(true);
      await adminApi.rejectRequest(selectedReq.id, rejectReason);
      setShowRejectModal(false);
      setSelectedReq(null);
      setRejectReason("");
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    } finally {
      setActing(false);
    }
  };

  // Derive unique categories for the dropdown
  const categories = useMemo(
    () => Array.from(new Set(requests.map(r => r.category).filter(Boolean))),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (categoryFilter !== "all" && r.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.id.toString().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.customerPhone && r.customerPhone.includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    });
  }, [requests, categoryFilter, search]);

  const pendingCount = useMemo(
    () => requests.filter(r => r.status === "pending_admin_review").length,
    [requests]
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#123b30] tracking-tight">
                Service Requests
              </h2>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  {pendingCount} Needs Review
                </span>
              )}
            </div>
            <p className="text-xs text-[#718078] mt-0.5">
              Review, approve, and dispatch customer household service requests across Bhopal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              className="btn btn-outline text-xs px-3 py-2 font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCw size={13} className={loading ? "animate-spin text-[#123b30]" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              href="/applications"
              className="btn btn-dark text-xs px-3.5 py-2 font-bold shadow-2xs"
            >
              Worker Applications
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex border-b border-[#e5ebe4] overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
          {[
            { id: "all", label: "All Requests" },
            { id: "pending_admin_review", label: "Pending Review", badge: pendingCount },
            { id: "open_for_applications", label: "Open for Applications" },
            { id: "assigned", label: "Assigned" },
            { id: "completed", label: "Completed" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "border-[#123b30] text-[#123b30] font-extrabold"
                  : "border-transparent text-[#718078] hover:text-[#123b30]"
              }`}
            >
              <span>{tab.label}</span>
              {Boolean(tab.badge) && tab.badge! > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="homi-card p-2.5 flex-1 flex items-center gap-2.5">
            <Search size={15} className="text-[#718078] shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search by ID, customer name, phone, problem or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs outline-none bg-transparent text-[#183c31] placeholder-[#718078] font-medium"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none homi-card px-3.5 py-2.5 pr-8 text-xs font-bold text-[#183c31] bg-white cursor-pointer outline-none hover:border-[#b8d1ad] transition-colors"
            >
              <option value="all">All Service Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#718078] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Requests Table */}
        <div className="homi-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf5] border-b border-[#e5ebe4] text-[#718078] uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ebe4]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading service requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      No service requests found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8faf5] transition-colors">
                      <td className="py-3 px-4 font-extrabold text-[#123b30]">
                        #{r.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-[#123b30]">
                          {r.customerName || "Customer"}
                        </div>
                        <div className="text-[11px] text-[#718078]">
                          {r.customerPhone || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#183c31] bg-[#f0f4ee] px-2 py-0.5 rounded capitalize">
                          {r.category}
                        </span>
                        <p className="text-[11px] text-[#718078] truncate max-w-xs mt-0.5">
                          {r.title || r.description}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[#41534a]">
                          <MapPin size={12} className="shrink-0 text-[#557e62]" />
                          <span className="truncate max-w-[130px]">{r.locationLabel || r.city || "Bhopal"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#718078] whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "pending_admin_review" && (
                            <>
                              <button
                                onClick={() => handlePublish(r.id)}
                                disabled={acting}
                                title="Approve and Publish to Workers"
                                className="btn btn-lime text-[11px] py-1 px-2.5 font-bold shadow-2xs"
                              >
                                Approve & Publish
                              </button>
                              <button
                                onClick={() => { setSelectedReq(r); setShowRejectModal(true); }}
                                disabled={acting}
                                title="Reject Request"
                                className="btn bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] text-[11px] py-1 px-2 font-bold"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {(r.status === "open_for_applications" || r.status === "open") && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(r)}
                              className="btn btn-dark text-[11px] py-1 px-2.5 font-bold flex items-center gap-1"
                              title="Assign a worker to this request"
                            >
                              <UserCheck size={12} />
                              <span>Assign</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedReq(r)}
                            className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2.5 font-bold flex items-center gap-1"
                            title="View details"
                          >
                            <Eye size={12} />
                            <span>Details</span>
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

        {/* Request Details Drawer */}
        <Drawer
          isOpen={Boolean(selectedReq && !showRejectModal)}
          onClose={() => setSelectedReq(null)}
          title={`Request #${selectedReq?.id}`}
          subtitle={`Submitted on ${selectedReq ? formatDateTime(selectedReq.createdAt) : ""}`}
        >
          {selectedReq && (
            <div className="space-y-5 text-xs text-[#183c31]">
              <div className="flex items-center justify-between p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
                <div>
                  <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                    Service Category
                  </span>
                  <p className="font-extrabold text-[#123b30] capitalize text-sm">
                    {selectedReq.category}
                  </p>
                </div>
                <StatusBadge status={selectedReq.status} />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Customer Contact
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1">
                  <p className="font-bold text-[#123b30]">{selectedReq.customerName || "Customer"}</p>
                  <p className="text-[#718078] font-mono">{selectedReq.customerPhone || "No phone provided"}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Problem Description
                </h4>
                <p className="p-3 bg-white rounded-lg border border-[#e5ebe4] text-[#41534a] leading-relaxed whitespace-pre-wrap">
                  {selectedReq.description || selectedReq.title || "No description provided."}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Service Location
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1">
                  <p className="font-bold text-[#123b30]">{selectedReq.locationLabel || selectedReq.city || "Bhopal"}</p>
                  <p className="text-[#718078]">{selectedReq.address || "Address as per customer profile"}</p>
                </div>
              </div>

              {selectedReq.status === "pending_admin_review" && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handlePublish(selectedReq.id)}
                    disabled={acting}
                    className="btn btn-lime w-full py-2.5 text-xs font-bold shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Broadcast to Workers</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={acting}
                    className="btn bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] w-full py-2 text-xs font-bold"
                  >
                    Reject Request
                  </button>
                </div>
              )}

              {(selectedReq.status === "open_for_applications" || selectedReq.status === "open") && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const req = selectedReq;
                      setSelectedReq(null);
                      handleOpenAssignModal(req);
                    }}
                    disabled={acting}
                    className="btn btn-dark w-full py-2.5 text-xs font-bold shadow-2xs flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign Worker to Request</span>
                  </button>
                  <Link
                    href={`/applications?requestId=${selectedReq.id}`}
                    className="text-center text-xs text-[#557e62] hover:text-[#123b30] font-semibold py-1"
                  >
                    View Worker Proposals →
                  </Link>
                </div>
              )}

              <div className="pt-2 border-t border-[#e5ebe4]">
                <Link
                  href={`/requests/${selectedReq.id}`}
                  className="btn btn-outline text-[#123b30] w-full py-2.5 text-xs font-bold block text-center shadow-xs"
                >
                  Open Full Request Operations
                </Link>
              </div>
            </div>
          )}
        </Drawer>

        {/* Reject Reason Modal */}
        {showRejectModal && selectedReq && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#e5ebe4]">
              <h3 className="text-base font-extrabold text-[#123b30]">
                Reject Request #{selectedReq.id}
              </h3>
              <p className="text-xs text-[#718078]">
                Provide an official explanation for why this customer request cannot be fulfilled by platform technicians.
              </p>
              <div>
                <label className="block text-xs font-bold text-[#183c31] mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Service location is outside platform coverage or safety policy violation"
                  className="w-full text-xs border border-[#e5ebe4] rounded-lg p-2.5 outline-none focus:border-[#123b30] text-[#183c31]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-outline text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={acting || !rejectReason.trim()}
                  className="btn bg-[#dc2626] text-white hover:bg-[#b91c1c] text-xs py-1.5 px-3 font-bold"
                >
                  {acting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Worker Modal */}
        {assignModalReq && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#e5ebe4]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#123b30]">
                    Assign Worker to Request #{assignModalReq.id}
                  </h3>
                  <p className="text-xs text-[#718078] mt-0.5">
                    <span className="font-bold text-[#123b30] capitalize">{assignModalReq.category}</span> • {assignModalReq.title || "Service Request"}
                  </p>
                  <p className="text-[11px] text-[#8fa094] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{assignModalReq.locationLabel || assignModalReq.city || "Bhopal"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignModalReq(null)}
                  className="text-[#718078] hover:text-[#123b30] text-sm p-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-b border-[#e5ebe4] py-3 space-y-2.5 max-h-[340px] overflow-y-auto">
                <span className="text-[11px] font-bold text-[#557e62] uppercase tracking-wider block">
                  Select Registered Technician
                </span>

                {loadingWorkers ? (
                  <div className="py-8 text-center text-xs text-[#718078]">
                    <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading registered technicians...
                  </div>
                ) : availableWorkers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#718078] bg-[#f8faf5] rounded-xl border border-dashed border-[#e5ebe4]">
                    No active workers found in directory.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableWorkers
                      .slice()
                      .sort((a, b) => {
                        const aMatch = a.specialty?.toLowerCase() === assignModalReq.category?.toLowerCase() ? 1 : 0;
                        const bMatch = b.specialty?.toLowerCase() === assignModalReq.category?.toLowerCase() ? 1 : 0;
                        return bMatch - aMatch;
                      })
                      .map((w) => {
                        const isMatch = w.specialty?.toLowerCase() === assignModalReq.category?.toLowerCase();
                        return (
                          <div
                            key={w.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              isMatch
                                ? "bg-[#f4f9f1] border-[#cbe1c3]"
                                : "bg-white border-[#e5ebe4] hover:border-[#b8d1ad]"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-[#123b30] truncate">
                                  {w.name}
                                </span>
                                {isMatch && (
                                  <span className="bg-[#d9ed89] text-[#123b30] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                                    Exact Match
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#718078] flex items-center gap-2 mt-0.5">
                                <span className="font-semibold text-[#3d6d49]">{w.specialty || "General Technician"}</span>
                                <span>•</span>
                                <span>{w.city || "Bhopal"}</span>
                                <span>•</span>
                                <span className="font-mono">{w.phone}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDirectAssignWorker(w.id)}
                              disabled={acting}
                              className="btn btn-dark text-xs py-1.5 px-3 font-bold shrink-0"
                            >
                              Assign
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/applications?requestId=${assignModalReq.id}`}
                  onClick={() => setAssignModalReq(null)}
                  className="text-xs font-bold text-[#557e62] hover:text-[#123b30] flex items-center gap-1"
                >
                  <span>Or view worker-submitted proposals →</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setAssignModalReq(null)}
                  className="btn btn-outline text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
