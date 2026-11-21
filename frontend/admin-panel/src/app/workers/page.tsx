"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Briefcase,
  Search,
  Mail,
  Phone,
  MapPin,
  Compass,
  CheckCircle2,
  XCircle,
  RotateCw,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ChevronDown,
  Eye,
  UserCheck,
  Trash2,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { TablePagination } from "../../components/tables/TablePagination";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { WorkerService } from "../../services/worker.service";
import { formatRupees, formatDate, formatDateTime, exportToCsv } from "../../lib/utils";
import type { Worker } from "../../types";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadWorkers = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const data = await WorkerService.getWorkers(searchQuery);
      setWorkers(data || []);
    } catch (err) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWorkers(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggle = async (e: React.MouseEvent, worker: Worker) => {
    e.stopPropagation();
    setTogglingId(worker.id);
    try {
      const updated = await WorkerService.toggleAvailability(worker.id);
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? { ...w, available: updated.available } : w))
      );
      if (selectedWorker?.id === worker.id) {
        setSelectedWorker((prev) => (prev ? { ...prev, available: updated.available } : null));
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteWorker = async (e: React.MouseEvent, worker: Worker) => {
    e.stopPropagation();
    const name = worker.name || worker.fullName || `Worker #${worker.id}`;
    if (
      !window.confirm(
        `Are you sure you want to remove worker "${name}" (ID #${worker.id}) from the platform roster?\n\nThis will remove them from the active technicians directory. Service history will be preserved.`
      )
    ) {
      return;
    }
    setDeletingId(worker.id);
    try {
      await WorkerService.deleteWorker(worker.id);
      setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
      if (selectedWorker?.id === worker.id) {
        setSelectedWorker(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove worker");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter workers by status tabs and specialty
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (statusFilter === "active" && !w.available) return false;
      if (statusFilter === "inactive" && w.available) return false;
      if (statusFilter === "suspended" && (w as any).status !== "suspended") return false;

      if (selectedSpecialty !== "all" && w.specialty?.toLowerCase() !== selectedSpecialty.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [workers, statusFilter, selectedSpecialty]);

  // Pagination calculation
  const totalItems = filteredWorkers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWorkers.slice(start, start + pageSize);
  }, [filteredWorkers, currentPage, pageSize]);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => {
      if (w.specialty) set.add(w.specialty);
    });
    return Array.from(set);
  }, [workers]);

  const handleExportCsv = () => {
    const csvData = workers.map((w) => ({
      ID: w.id,
      Name: w.name || w.fullName || "Worker",
      Email: w.email,
      Phone: w.phone || "N/A",
      Specialty: w.specialty || "General",
      City: w.city || "Bhopal",
      RadiusKm: w.serviceRadiusKm || 10,
      VisitFeeRupees: w.visitFee ? w.visitFee / 100 : 0,
      Available: w.available ? "Yes" : "No",
      RegisteredDate: w.createdAt ? formatDate(w.createdAt) : "N/A",
    }));
    exportToCsv("homi-workers.csv", csvData);
  };

  const activeCount = workers.filter((w) => w.available).length;

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#123b30] tracking-tight">
              Service Workers & Partners
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Manage field technician roster, trade specialties, service radii, and dispatch availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadWorkers(search)}
              disabled={loading}
              className="btn btn-outline text-xs px-3 py-2 font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#123b30]" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="btn btn-dark text-xs px-3.5 py-2 font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[#e5ebe4] overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
          {[
            { id: "all", label: `All Workers (${workers.length})` },
            { id: "active", label: `Active / Available (${activeCount})` },
            { id: "inactive", label: `Inactive (${workers.length - activeCount})` },
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

        {/* Search & Specialty Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="homi-card p-2.5 flex-1 flex items-center gap-2.5">
            <Search size={15} className="text-[#718078] shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search by worker name, specialty, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs outline-none bg-transparent text-[#183c31] placeholder-[#718078] font-medium"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none homi-card px-3.5 py-2.5 pr-8 text-xs font-bold text-[#183c31] bg-white cursor-pointer outline-none hover:border-[#b8d1ad] transition-colors"
            >
              <option value="all">All Specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#718078] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Mobile View: Stacked Worker Cards */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading worker roster...
            </div>
          ) : paginatedWorkers.length === 0 ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              No service workers found.
            </div>
          ) : (
            paginatedWorkers.map((w) => (
              <div key={w.id} className="homi-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {(w.name || w.fullName || w.email || "W").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-extrabold text-[#123b30] text-sm">
                        {w.name || w.fullName || "Worker Partner"}
                      </p>
                      <p className="text-[11px] text-[#718078]">ID #{w.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggle(e, w)}
                    disabled={togglingId === w.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-[#f0f4ee]"
                    title="Toggle availability"
                  >
                    {w.available ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-[#285437]" />
                        <span className="text-[#285437] font-extrabold text-[11px]">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-[#718078]" />
                        <span className="text-[#718078] text-[11px]">Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#f8faf5] p-2.5 rounded-lg border border-[#e5ebe4]">
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Specialty</span>
                    <span className="font-bold text-[#183c31] capitalize">{w.specialty || "Handyman"}</span>
                  </div>
                  <div className="bg-[#f8faf5] p-2.5 rounded-lg border border-[#e5ebe4]">
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Visit Fee</span>
                    <span className="font-bold text-[#183c31]">{w.visitFee ? formatRupees(w.visitFee) : "Standard"}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[#41534a]">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-[#718078] shrink-0" />
                    <span className="truncate">{w.email}</span>
                  </div>
                  {w.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-[#718078] shrink-0" />
                      <span>{w.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#557e62] shrink-0" />
                    <span>{w.city || "Bhopal"} ({w.serviceRadiusKm || 10} km radius)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#e5ebe4]">
                  <button
                    onClick={() => setSelectedWorker(w)}
                    className="btn btn-outline text-[#123b30] text-xs py-2 px-3 font-bold flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteWorker(e, w)}
                    disabled={deletingId === w.id}
                    className="btn border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] text-xs py-2 px-3 font-bold flex items-center justify-center gap-1.5 rounded-md"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Workers Table (Desktop / Tablet) */}
        <div className="homi-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf5] border-b border-[#e5ebe4] text-[#718078] uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Services / Specialty</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Coverage</th>
                  <th className="py-3 px-4">Visit Fee</th>
                  <th className="py-3 px-4">Status / Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ebe4]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading worker roster...
                    </td>
                  </tr>
                ) : paginatedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      No service workers found.
                    </td>
                  </tr>
                ) : (
                  paginatedWorkers.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWorker(w)}
                      className="hover:bg-[#f8faf5] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {(w.name || w.fullName || w.email || "W").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#123b30]">
                              {w.name || w.fullName || "Worker Partner"}
                            </p>
                            <p className="text-[11px] text-[#718078]">
                              ID #{w.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#183c31] bg-[#f0f4ee] px-2 py-0.5 rounded capitalize">
                          {w.specialty || "General Handyman"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#183c31] font-medium">{w.email}</div>
                        <div className="text-[11px] text-[#718078]">{w.phone || "—"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[#41534a]">
                          <MapPin size={12} className="text-[#557e62]" />
                          <span>{w.city || "Bhopal"}</span>
                          <span className="text-[11px] text-[#718078]">({w.serviceRadiusKm || 10} km)</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#183c31]">
                        {w.visitFee ? formatRupees(w.visitFee) : "Standard"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => handleToggle(e, w)}
                          disabled={togglingId === w.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all hover:bg-[#f0f4ee]"
                          title="Toggle availability"
                        >
                          {w.available ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-[#285437]" />
                              <span className="text-[#285437] font-extrabold text-[11px]">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-[#718078]" />
                              <span className="text-[#718078] text-[11px]">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorker(w);
                            }}
                            className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1 hover:bg-[#f0f4ee]"
                            title="View Worker Profile"
                          >
                            <Eye size={12} />
                            <span>Profile</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteWorker(e, w)}
                            disabled={deletingId === w.id}
                            className="btn border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1 rounded-md transition-colors"
                            title="Remove Worker"
                          >
                            <Trash2 size={12} className={deletingId === w.id ? "animate-spin" : ""} />
                            <span>{deletingId === w.id ? "Removing..." : "Remove"}</span>
                          </button>
                        </div>
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

        {/* Worker Details Drawer */}
        <Drawer
          isOpen={Boolean(selectedWorker)}
          onClose={() => setSelectedWorker(null)}
          title={selectedWorker?.name || selectedWorker?.fullName || "Worker Profile"}
          subtitle={`Registered on ${selectedWorker ? formatDate(selectedWorker.createdAt) : ""}`}
        >
          {selectedWorker && (
            <div className="space-y-5 text-xs text-[#183c31]">
              <div className="flex items-center justify-between p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4]">
                <div>
                  <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                    Trade Specialty
                  </span>
                  <p className="font-extrabold text-[#123b30] text-sm capitalize">
                    {selectedWorker.specialty || "General Handyman"}
                  </p>
                </div>
                <span className={`badge ${selectedWorker.available ? "bg-[#eaf5e5] text-[#285437]" : "bg-gray-100 text-gray-700"}`}>
                  {selectedWorker.available ? "Available" : "Offline"}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Contact Information
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-[#557e62]" />
                    <span>{selectedWorker.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#557e62]" />
                    <span>{selectedWorker.phone || "No phone provided"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Coverage & Fees
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1">
                  <p><strong>Base City:</strong> {selectedWorker.city || "Bhopal"}</p>
                  <p><strong>Service Radius:</strong> {selectedWorker.serviceRadiusKm || 10} km</p>
                  <p><strong>Base Visit Fee:</strong> {selectedWorker.visitFee ? formatRupees(selectedWorker.visitFee) : "Standard rate"}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5ebe4] space-y-2">
                <button
                  onClick={(e) => handleToggle(e, selectedWorker)}
                  disabled={togglingId === selectedWorker.id || deletingId === selectedWorker.id}
                  className="btn btn-dark w-full py-2.5 text-xs font-bold shadow-xs"
                >
                  {selectedWorker.available ? "Set Worker Inactive" : "Activate Worker for Dispatch"}
                </button>
                <button
                  onClick={(e) => handleDeleteWorker(e, selectedWorker)}
                  disabled={deletingId === selectedWorker.id || togglingId === selectedWorker.id}
                  className="btn border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] w-full py-2.5 text-xs font-bold shadow-xs inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={13} className={deletingId === selectedWorker.id ? "animate-spin" : ""} />
                  <span>{deletingId === selectedWorker.id ? "Removing from Platform..." : "Remove Worker from Platform"}</span>
                </button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AdminShell>
  );
}
