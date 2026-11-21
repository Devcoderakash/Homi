"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Eye,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { TablePagination } from "../../components/tables/TablePagination";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { adminApi } from "../../services/adminApi";
import { formatDateTime, exportToCsv } from "../../lib/utils";
import type { Assignment } from "../../types";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAssignments();
      setAssignments(res.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.workerName.toLowerCase().includes(q) ||
          a.customerName.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          String(a.bookingId).includes(q)
        );
      }
      return true;
    });
  }, [assignments, statusFilter, search]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleExportCsv = () => {
    const csv = assignments.map((a) => ({
      AssignmentID: a.id,
      BookingID: a.bookingId,
      WorkerName: a.workerName,
      CustomerName: a.customerName,
      Category: a.category,
      DistanceKm: a.distanceKm,
      Status: a.status,
      AssignedAt: formatDateTime(a.assignedAt),
    }));
    exportToCsv("homi-worker-assignments.csv", csv);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#123b30] tracking-tight">
              Assignments & Dispatch Monitor
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Live monitor for dispatched jobs, technician arrival milestones, and work progression.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="btn btn-dark text-xs px-3.5 py-2 font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex border-b border-[#e5ebe4] overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
          {[
            { id: "all", label: "All Dispatches" },
            { id: "claimed", label: "Assigned / Claimed" },
            { id: "on_the_way", label: "On the Way" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
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

        {/* Quick Search */}
        <div className="homi-card p-2.5 flex items-center gap-2.5">
          <Search size={15} className="text-[#718078] shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search by worker, customer, booking ID, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent text-[#183c31] placeholder-[#718078] font-medium"
          />
        </div>

        {/* Mobile View: Stacked Assignment Cards */}
        <div className="block md:hidden space-y-3">
          {paginated.length === 0 ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              No active assignments found matching this filter.
            </div>
          ) : (
            paginated.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedAssignment(a)}
                className="homi-card p-4 space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#123b30] text-sm">#{a.bookingId}</span>
                    <span className="font-bold text-[11px] text-[#183c31] bg-[#f0f4ee] px-2 py-0.5 rounded capitalize">
                      {a.category}
                    </span>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#f8faf5] p-2.5 rounded-lg border border-[#e5ebe4]">
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Assigned Technician</span>
                    <strong className="text-[#123b30] block truncate mt-0.5">{a.workerName}</strong>
                    <span className="text-[10px] text-[#718078] block">ID #{a.workerId}</span>
                  </div>
                  <div className="bg-[#f8faf5] p-2.5 rounded-lg border border-[#e5ebe4]">
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Customer</span>
                    <strong className="text-[#123b30] block truncate mt-0.5">{a.customerName}</strong>
                    <span className="text-[10px] text-[#718078] block">Assigned: {new Date(a.assignedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#e5ebe4]">
                  <Link
                    href={`/requests/${a.bookingId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-outline text-[#123b30] text-xs py-2 px-3 font-bold flex-1 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    <span>View Request</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAssignment(a);
                    }}
                    className="btn btn-dark text-xs py-2 px-3 font-bold flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>Track Status</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assignments Table (Desktop / Tablet) */}
        <div className="homi-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf5] border-b border-[#e5ebe4] text-[#718078] uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4">Status / Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ebe4]">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      No active assignments found matching this filter.
                    </td>
                  </tr>
                ) : (
                  paginated.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedAssignment(a)}
                      className="hover:bg-[#f8faf5] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-extrabold text-[#123b30]">
                        <Link
                          href={`/requests/${a.bookingId}`}
                          className="hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>#{a.bookingId}</span>
                          <ExternalLink className="w-3 h-3 text-[#718078]" />
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-[#123b30]">{a.customerName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#123b30] text-[#d9ed89] flex items-center justify-center font-extrabold text-[10px]">
                            {a.workerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#123b30] text-xs">{a.workerName}</p>
                            <p className="text-[10px] text-[#718078]">ID #{a.workerId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#183c31] bg-[#f0f4ee] px-2 py-0.5 rounded capitalize">
                          {a.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#718078] whitespace-nowrap">
                        {formatDateTime(a.assignedAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssignment(a);
                          }}
                          className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[#e5ebe4]">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Assignment Details Drawer */}
        <Drawer
          isOpen={Boolean(selectedAssignment)}
          onClose={() => setSelectedAssignment(null)}
          title={`Assignment #${selectedAssignment?.id}`}
          subtitle={`Request #${selectedAssignment?.bookingId}`}
        >
          {selectedAssignment && (
            <div className="space-y-5 text-xs text-[#183c31]">
              <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">Service Trade</p>
                  <p className="font-extrabold text-[#123b30] text-sm capitalize">
                    {selectedAssignment.category}
                  </p>
                </div>
                <StatusBadge status={selectedAssignment.status} />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Technician & Household
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-[#f0f4ee]">
                    <span className="text-[#718078]">Assigned Technician</span>
                    <span className="font-extrabold text-[#123b30]">{selectedAssignment.workerName}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#f0f4ee]">
                    <span className="text-[#718078]">Customer Name</span>
                    <span className="font-extrabold text-[#123b30]">{selectedAssignment.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#718078]">Haversine Distance</span>
                    <span className="font-bold text-[#123b30]">{selectedAssignment.distanceKm} km</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Dispatch Timestamps
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-[#f0f4ee]">
                    <span className="text-[#718078]">Assigned At</span>
                    <span className="text-[#183c31]">{formatDateTime(selectedAssignment.assignedAt)}</span>
                  </div>
                  {selectedAssignment.completedAt && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#718078]">Completed At</span>
                      <span className="text-[#183c31]">{formatDateTime(selectedAssignment.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#e5ebe4]">
                <Link
                  href={`/requests/${selectedAssignment.bookingId}`}
                  className="btn btn-dark w-full py-2.5 text-xs font-bold block text-center shadow-xs"
                >
                  View Related Service Request
                </Link>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AdminShell>
  );
}
