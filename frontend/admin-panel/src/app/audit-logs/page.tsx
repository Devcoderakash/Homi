"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Clock,
  User,
  Activity,
  Lock,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { DataTable } from "../../components/tables/DataTable";
import { TablePagination } from "../../components/tables/TablePagination";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Drawer } from "../../components/common/Drawer";
import { adminApi } from "../../services/adminApi";
import { formatDateTime, exportToCsv } from "../../lib/utils";
import type { AuditLog } from "../../types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    adminApi.getAuditLogs(100)
      .then((res: any) => {
        const raw = res.logs || [];
        setLogs(
          raw.map((l: any) => ({
            id: String(l.id),
            adminEmail: l.admin?.email || "admin@homi.local",
            action: l.action,
            entityType: l.entityType,
            entity: l.entityType,
            entityId: l.entityId,
            timestamp: l.createdAt,
            createdAt: l.createdAt,
            ipAddress: l.ipAddress || "127.0.0.1",
            details: l.details || "",
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to load audit logs:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          l.adminEmail.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          (l.entity && l.entity.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleExportCsv = () => {
    const csv = logs.map((l) => ({
      LogID: l.id,
      Action: l.action,
      AdminEmail: l.adminEmail,
      Entity: l.entity,
      IPAddress: l.ipAddress,
      Details: l.details,
      Timestamp: formatDateTime(l.createdAt),
    }));
    exportToCsv("homi-admin-audit-logs.csv", csv);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">LOGIN</span>;
      case "TOGGLE_WORKER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">TOGGLE_WORKER</span>;
      case "EXPORT_CSV":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">EXPORT_CSV</span>;
      case "UPDATE_SERVICE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">UPDATE_SERVICE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  const columns = [
    {
      header: "Log Ref",
      accessor: (l: AuditLog) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          #{l.id}
        </span>
      ),
      className: "w-24",
    },
    {
      header: "Action",
      accessor: (l: AuditLog) => getActionBadge(l.action),
      className: "w-36",
    },
    {
      header: "Admin User",
      accessor: (l: AuditLog) => (
        <span className="text-xs font-medium text-slate-900 font-mono">
          {l.adminEmail}
        </span>
      ),
    },
    {
      header: "Target Entity",
      accessor: (l: AuditLog) => (
        <span className="text-xs font-semibold text-slate-700">
          {l.entity}
        </span>
      ),
      className: "w-36",
    },
    {
      header: "IP Address",
      accessor: (l: AuditLog) => (
        <span className="font-mono text-xs text-slate-500">
          {l.ipAddress}
        </span>
      ),
      className: "w-32",
    },
    {
      header: "Timestamp",
      accessor: (l: AuditLog) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(l.createdAt)}
        </span>
      ),
      className: "w-36",
    },
  ];

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Platform Security & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of administrative actions, data exports, worker toggles, and session logins.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export Audit Trail
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Audit Records</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{logs.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Privileged Superusers</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">1</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Security Posture</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">Healthy</p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput
          placeholder="Search audit events by admin, action, or details..."
          value={search}
          onChange={setSearch}
          className="max-w-md w-full"
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs text-slate-500 font-medium">Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 text-slate-700 font-medium py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="TOGGLE_WORKER">TOGGLE_WORKER</option>
            <option value="EXPORT_CSV">EXPORT_CSV</option>
            <option value="UPDATE_SERVICE">UPDATE_SERVICE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(l) => l.id}
        onRowClick={(l) => setSelectedLog(l)}
        emptyMessage="No audit log entries found."
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Log #${selectedLog?.id}`}
        subtitle={`Recorded on ${selectedLog ? formatDateTime(selectedLog.createdAt) : ""}`}
      >
        {selectedLog && (
          <div className="space-y-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Action Performed</p>
                <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
              </div>
              <span className="font-mono text-slate-500 text-xs">{selectedLog.ipAddress}</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                Event Metadata
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Initiator</span>
                  <span className="font-mono text-slate-900 font-medium">{selectedLog.adminEmail}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Target Entity</span>
                  <span className="font-medium text-slate-900">{selectedLog.entity}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Description</span>
                  <span className="text-slate-700">{selectedLog.details}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
