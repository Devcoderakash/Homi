"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileSpreadsheet,
  RotateCw,
  Eye,
  ClipboardList,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { TablePagination } from "../../components/tables/TablePagination";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { CustomerService } from "../../services/customer.service";
import { formatDate, exportToCsv } from "../../lib/utils";
import type { Customer } from "../../types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadCustomers = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const data = await CustomerService.getCustomers(searchQuery);
      setCustomers(data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Pagination calculation
  const totalItems = customers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage, pageSize]);

  const handleExportCsv = () => {
    const csvData = customers.map((c) => ({
      ID: c.id,
      Name: c.fullName || c.name || "Customer",
      Email: c.email,
      Phone: c.phone || "N/A",
      City: c.city || "Bhopal",
      Address: c.address || "N/A",
      RegisteredDate: c.createdAt ? formatDate(c.createdAt) : "N/A",
    }));
    exportToCsv("homi-customers.csv", csvData);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#123b30] tracking-tight">
              Customer Directory
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Manage registered household accounts, verified contact information, and service history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCustomers(search)}
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

        {/* Quick Search */}
        <div className="homi-card p-2.5 flex items-center gap-2.5">
          <Search size={15} className="text-[#718078] shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone, or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent text-[#183c31] placeholder-[#718078] font-medium"
          />
        </div>

        {/* Mobile View: Stacked Customer Cards */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading customers...
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <div className="homi-card p-6 text-center text-[#718078] text-xs">
              No customers found.
            </div>
          ) : (
            paginatedCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="homi-card p-4 space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {(c.fullName || c.name || c.email || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#123b30] text-sm">
                        {c.fullName || c.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-[#718078]">ID #{c.id}</div>
                    </div>
                  </div>
                  <span className="badge bg-[#eaf5e5] text-[#285437] text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#41534a] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-[#718078] shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-[#718078] shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#557e62] shrink-0" />
                    <span>{c.city || c.address || "Bhopal"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#e5ebe4] text-xs">
                  <span className="text-[11px] text-[#718078]">
                    Joined: {c.createdAt ? formatDate(c.createdAt) : "—"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(c);
                    }}
                    className="btn btn-outline text-[#123b30] text-xs py-1.5 px-3 font-bold inline-flex items-center gap-1"
                  >
                    <Eye size={12} />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customers Table (Desktop / Tablet) */}
        <div className="homi-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf5] border-b border-[#e5ebe4] text-[#718078] uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">City / Area</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ebe4]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      <div className="w-6 h-6 border-2 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading customers...
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#718078]">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-[#f8faf5] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {(c.fullName || c.name || c.email || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#123b30]">
                              {c.fullName || c.name || "Customer"}
                            </div>
                            <div className="text-[11px] text-[#718078]">
                              ID #{c.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#183c31]">
                        {c.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-[#41534a]">
                        {c.email}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[#41534a]">
                          <MapPin size={12} className="text-[#557e62] shrink-0" />
                          <span className="truncate max-w-[140px]">{c.city || c.address || "Bhopal"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#718078] whitespace-nowrap">
                        {c.createdAt ? formatDate(c.createdAt) : "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="badge bg-[#eaf5e5] text-[#285437]">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                          className="btn btn-outline text-[#123b30] text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>History</span>
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

        {/* Customer Details Drawer */}
        <Drawer
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer?.fullName || selectedCustomer?.name || "Customer Profile"}
          subtitle={`Account ID #${selectedCustomer?.id}`}
        >
          {selectedCustomer && (
            <div className="space-y-5 text-xs text-[#183c31]">
              <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4] space-y-1">
                <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                  Registration
                </span>
                <p className="font-extrabold text-[#123b30]">
                  Member since {selectedCustomer.createdAt ? formatDate(selectedCustomer.createdAt) : "Platform launch"}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#123b30] uppercase tracking-wider text-[11px]">
                  Contact Details
                </h4>
                <div className="p-3 bg-white rounded-lg border border-[#e5ebe4] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-[#557e62]" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#557e62]" />
                    <span>{selectedCustomer.phone || "No phone recorded"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#557e62]" />
                    <span>{selectedCustomer.address || selectedCustomer.city || "Bhopal, MP"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e5ebe4]">
                <Link
                  href={`/requests?search=${encodeURIComponent(selectedCustomer.name || selectedCustomer.email)}`}
                  className="btn btn-dark w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <ClipboardList size={14} />
                  <span>View All Customer Service Requests</span>
                </Link>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AdminShell>
  );
}
