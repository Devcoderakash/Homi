"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  FileCheck,
  Briefcase,
  Compass,
  Clock,
  ArrowUpRight,
  RotateCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ChevronRight,
  Send,
  Eye,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { adminApi } from "../../services/adminApi";
import { formatRupees, formatDateTime } from "../../lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [statsData, reqRes, appRes] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getRecentRequests().catch(() => ({ requests: [] })),
        adminApi.getRecentApplications().catch(() => ({ applications: [] })),
      ]);

      if (statsData) {
        const normalized = statsData.stats || statsData.data || statsData;
        setStats(normalized);
      }
      setRecentRequests(
        reqRes?.requests ||
        reqRes?.recentRequests ||
        statsData?.recentRequests ||
        statsData?.stats?.recentRequests ||
        []
      );
      setRecentApplications(
        appRes?.applications ||
        appRes?.recentApplications ||
        statsData?.recentApplications ||
        statsData?.stats?.recentApplications ||
        []
      );
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQuickPublish = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Approve and broadcast this request to qualified local workers?")) return;
    try {
      setActingId(id);
      await adminApi.publishRequest(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to publish request");
    } finally {
      setActingId(null);
    }
  };

  // Top KPI metrics
  const pendingRequestsCount = stats?.requests?.pendingReview ?? stats?.pendingRequests ?? 0;
  const newApplicationsCount = stats?.applications?.pending ?? stats?.pendingWorkerApps ?? 0;
  const totalWorkersCount = stats?.users?.workers ?? stats?.totalWorkers ?? 0;
  const activeWorkersCount = stats?.users?.activeWorkers ?? stats?.activeWorkers ?? 0;
  const activeJobsCount = stats?.requests?.active ?? stats?.activeJobs ?? 0;

  return (
    <AdminShell>
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#123b30]">
            Marketplace Overview
          </h2>
          <p className="text-xs text-[#718078] mt-0.5">
            Real-time control center for incoming customer requests, worker proposals, and job dispatch.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-outline px-3.5 py-2 text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto shadow-2xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#123b30]" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Clean Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Requests */}
        <Link
          href="/requests"
          className="homi-card p-5 hover:border-[#b8d1ad] hover:shadow-sm transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#718078] tracking-tight">
              Pending Requests
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              pendingRequestsCount > 0 ? "bg-amber-100 text-amber-800" : "bg-[#f0f4ee] text-[#557e62]"
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#123b30] font-['Manrope']">
              {pendingRequestsCount}
            </span>
            {pendingRequestsCount > 0 ? (
              <span className="text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Needs Review
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#718078]">
                All cleared
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#718078] mt-2 flex items-center gap-1 group-hover:text-[#123b30]">
            <span>Review customer requests</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>

        {/* Card 2: New Applications */}
        <Link
          href="/applications"
          className="homi-card p-5 hover:border-[#b8d1ad] hover:shadow-sm transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#718078] tracking-tight">
              New Applications
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              newApplicationsCount > 0 ? "bg-[#d9ed89]/50 text-[#123b30]" : "bg-[#f0f4ee] text-[#557e62]"
            }`}>
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#123b30] font-['Manrope']">
              {newApplicationsCount}
            </span>
            {newApplicationsCount > 0 ? (
              <span className="text-[11px] font-extrabold bg-[#d9ed89] text-[#123b30] px-2 py-0.5 rounded-full">
                Awaiting Match
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#718078]">
                Up to date
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#718078] mt-2 flex items-center gap-1 group-hover:text-[#123b30]">
            <span>Evaluate worker proposals</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>

        {/* Card 3: Total Workers */}
        <Link
          href="/workers"
          className="homi-card p-5 hover:border-[#b8d1ad] hover:shadow-sm transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#718078] tracking-tight">
              Total Workers
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#eaf3e1] text-[#3e6b45] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#123b30] font-['Manrope']">
              {totalWorkersCount}
            </span>
            <span className="text-[11px] font-bold text-[#285437] bg-[#eaf5e5] px-2 py-0.5 rounded-full">
              {activeWorkersCount} active
            </span>
          </div>
          <p className="text-[11px] text-[#718078] mt-2 flex items-center gap-1 group-hover:text-[#123b30]">
            <span>Manage partner roster</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>

        {/* Card 4: Active Jobs */}
        <Link
          href="/assignments"
          className="homi-card p-5 hover:border-[#b8d1ad] hover:shadow-sm transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#718078] tracking-tight">
              Active Jobs
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#e8f1fe] text-[#205493] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#123b30] font-['Manrope']">
              {activeJobsCount}
            </span>
            <span className="text-[11px] font-bold text-[#205493] bg-[#e8f1fe] px-2 py-0.5 rounded-full">
              Dispatched
            </span>
          </div>
          <p className="text-[11px] text-[#718078] mt-2 flex items-center gap-1 group-hover:text-[#123b30]">
            <span>Monitor ongoing assignments</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      </div>

      {/* Two Clean Sections: Left = Recent Service Requests, Right = Recent Worker Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Recent Service Requests */}
        <div className="homi-card p-5 sm:p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5ebe4] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#123b30] tracking-tight flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#557e62]" />
                Recent Service Requests
              </h3>
              <p className="text-xs text-[#718078] mt-0.5">
                New incoming household repair requests submitted by customers
              </p>
            </div>
            <Link
              href="/requests"
              className="text-xs font-bold text-[#123b30] hover:text-[#266352] flex items-center gap-1 group shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718078]">
              No service requests recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4ee] overflow-hidden">
              {recentRequests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="py-3 px-2 -mx-2 rounded-lg hover:bg-[#f8faf5] transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-extrabold text-[#123b30]">
                        #{req.id}
                      </span>
                      <span className="text-xs font-bold text-[#183c31] truncate capitalize">
                        {req.category}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-[#718078] truncate">
                      {req.title || "Household service request"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8fa094]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {req.city || "Bhopal"}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(req.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === "pending_admin_review" && (
                      <button
                        onClick={(e) => handleQuickPublish(e, req.id)}
                        disabled={actingId === req.id}
                        className="btn btn-lime px-2.5 py-1 text-[11px] font-bold shadow-2xs"
                        title="Approve & broadcast to local workers"
                      >
                        <Send className="w-3 h-3" />
                        <span>Publish</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="p-1.5 text-[#718078] hover:text-[#123b30] hover:bg-[#f0f4ee] rounded-md transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Recent Worker Applications */}
        <div className="homi-card p-5 sm:p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5ebe4] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#123b30] tracking-tight flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#557e62]" />
                Recent Worker Applications
              </h3>
              <p className="text-xs text-[#718078] mt-0.5">
                Worker proposals and fee quotes submitted for open jobs
              </p>
            </div>
            <Link
              href="/applications"
              className="text-xs font-bold text-[#123b30] hover:text-[#266352] flex items-center gap-1 group shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718078]">
              No worker job proposals submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4ee] overflow-hidden">
              {recentApplications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="py-3 px-2 -mx-2 rounded-lg hover:bg-[#f8faf5] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        {app.workerName?.charAt(0) || "W"}
                      </div>
                      <span className="text-xs font-extrabold text-[#183c31] truncate">
                        {app.workerName}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-[#718078] truncate">
                      Applied for Request #{app.requestId} • <span className="capitalize">{app.category || "Service"}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8fa094]">
                      <span className="font-bold text-[#183c31]">
                        Quote: {app.expectedCharges ? formatRupees(app.expectedCharges) : "Standard"}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(app.appliedAt)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/applications?requestId=${app.requestId}`}
                    className="btn btn-outline px-2.5 py-1 text-[11px] font-bold text-[#123b30] shrink-0"
                  >
                    Evaluate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Small Clean Recent Activity & Operational Dispatch Feed */}
      <div className="homi-card p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-extrabold text-[#123b30] tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#557e62]" />
          Platform Dispatch Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs text-[#41534a]">
          <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
            <p className="font-bold text-[#123b30] mb-1">1. Review & Approve</p>
            <p className="text-[11px] text-[#718078] leading-relaxed">
              Verify customer problem description and address, then click <strong>Publish</strong> to broadcast to all nearby verified technicians.
            </p>
          </div>
          <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
            <p className="font-bold text-[#123b30] mb-1">2. Shortlist & Assign</p>
            <p className="text-[11px] text-[#718078] leading-relaxed">
              Compare worker proposals, ratings, and requested visit charges. Select the most qualified technician with 1 click.
            </p>
          </div>
          <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
            <p className="font-bold text-[#123b30] mb-1">3. Monitor Progress</p>
            <p className="text-[11px] text-[#718078] leading-relaxed">
              Track arrival, work progress, and customer payment acknowledgement in the Assignments monitor.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Request Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title={`Request #${selectedRequest?.id}`}
        subtitle={`Submitted ${selectedRequest ? formatDateTime(selectedRequest.createdAt) : ""}`}
      >
        {selectedRequest && (
          <div className="space-y-5 text-xs text-[#183c31]">
            <div className="flex items-center justify-between p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
              <div>
                <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                  Category
                </span>
                <p className="font-extrabold text-[#123b30] capitalize text-sm">
                  {selectedRequest.category}
                </p>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                Problem Description
              </h4>
              <p className="p-3 bg-white rounded-lg border border-[#e5ebe4] text-[#41534a] leading-relaxed">
                {selectedRequest.title || selectedRequest.description || "No specific notes provided."}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                Service Location
              </h4>
              <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1">
                <p className="font-bold text-[#123b30]">{selectedRequest.city || "Bhopal, MP"}</p>
              </div>
            </div>

            {selectedRequest.status === "pending_admin_review" && (
              <div className="pt-3 border-t border-[#e5ebe4]">
                <button
                  onClick={(e) => {
                    handleQuickPublish(e, selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                  className="btn btn-lime w-full py-2.5 text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Broadcast to Workers</span>
                </button>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/requests?id=${selectedRequest.id}`}
                className="btn btn-outline w-full py-2.5 text-xs font-bold text-[#123b30] block text-center"
              >
                Open Full Request Operations
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
