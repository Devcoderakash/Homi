"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { adminApi } from "../../services/adminApi";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPayments({
        status: statusFilter === "ALL" ? "" : statusFilter,
      });
      setPayments(res.payments || []);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify = async (paymentId: number, requestId: number, amount: number) => {
    if (!confirm(`Verify and approve payment of ₹${amount} for Request #HOMI-${requestId} as PAID?`)) return;
    try {
      setActing(true);
      await adminApi.verifyPayment(paymentId);
      alert("Payment verified successfully and marked as PAID!");
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || "Failed to verify payment");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (paymentId: number, requestId: number) => {
    const reason = prompt(
      `Enter reason for rejecting payment for Request #HOMI-${requestId} (e.g. UTR mismatch, payment not received in bank):`,
      "Transaction reference / UTR not found in bank account"
    );
    if (!reason) return;
    try {
      setActing(true);
      await adminApi.rejectPayment(paymentId, reason);
      alert("Payment rejected. Customer will be notified to submit corrected details.");
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || "Failed to reject payment");
    } finally {
      setActing(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.customerName?.toLowerCase().includes(term) ||
      p.customerPhone?.toLowerCase().includes(term) ||
      p.transactionReference?.toLowerCase().includes(term) ||
      String(p.requestId).includes(term) ||
      p.workerName?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "PAYMENT_SUBMITTED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "PAYMENT_REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#123b30] text-[#d9ed89]">
                <CreditCard size={20} />
              </div>
              <h1 className="text-xl font-extrabold text-[#123b30]">
                Customer Payments Verification
              </h1>
            </div>
            <p className="text-xs text-[#718078] mt-1">
              Verify customer payment confirmations (UPI / Bank Transfer) submitted upon work completion
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPayments()}
              disabled={loading || acting}
              className="btn btn-dark text-xs font-bold py-2 px-3.5 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              href="/settings"
              className="btn btn-lime text-xs font-bold py-2 px-3.5 flex items-center gap-1.5"
            >
              <span>Payment Settings</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#e5ebe4] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {[
              { id: "ALL", label: "All Payments" },
              { id: "PAYMENT_SUBMITTED", label: "Awaiting Verification" },
              { id: "PAID", label: "Verified & Paid" },
              { id: "PAYMENT_REJECTED", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#123b30] text-[#d9ed89] shadow-xs"
                    : "bg-[#f8faf5] text-[#718078] hover:bg-[#f0f4ee] hover:text-[#123b30]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-[#718078]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by UTR, Customer, or ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] focus:bg-white text-[#123b30]"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl border border-[#e5ebe4] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#718078] text-xs">
              <div className="w-7 h-7 border-3 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading payment submissions...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-[#718078]">
              <AlertCircle size={28} className="mx-auto text-[#a1c347]" />
              <h3 className="font-extrabold text-[#123b30] text-sm">No Payment Records Found</h3>
              <p className="text-xs">
                {statusFilter !== "ALL"
                  ? `No payments matching status '${statusFilter}'.`
                  : "No customer payments submitted yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf5] text-[#718078] border-b border-[#e5ebe4] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Request</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method & UTR</th>
                    <th className="py-3 px-4">Proof</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ebe4]">
                  {filteredPayments.map((p) => {
                    const isSubmitted = (p.status || "").toUpperCase() === "PAYMENT_SUBMITTED";
                    const isPaid = (p.status || "").toUpperCase() === "PAID";
                    const isRejected = (p.status || "").toUpperCase() === "PAYMENT_REJECTED";

                    return (
                      <tr key={p.id} className="hover:bg-[#fbfcfb] transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/requests/${p.requestId}`}
                            className="font-extrabold text-[#123b30] hover:underline inline-flex items-center gap-1"
                          >
                            <span>#HOMI-{p.requestId}</span>
                            <ExternalLink size={11} className="text-[#718078]" />
                          </Link>
                          {p.category && (
                            <div className="text-[10px] text-[#718078]">{p.category}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-[#123b30] block">{p.customerName}</strong>
                          <span className="text-[11px] text-[#718078]">{p.customerPhone}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[#183c31] block font-semibold">{p.workerName}</span>
                          {p.workerPhone && <span className="text-[11px] text-[#718078]">{p.workerPhone}</span>}
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-sm text-[#123b30]">
                          ₹{p.amount}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#f0f4ee] text-[#123b30] mb-1 uppercase">
                            {p.paymentMethod || "UPI"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-[11px] font-bold text-[#183c31] bg-[#f8faf5] px-1.5 py-0.5 rounded border border-[#e5ebe4]">
                              {p.transactionReference || "—"}
                            </code>
                            {p.transactionReference && (
                              <button
                                onClick={() => handleCopy(p.transactionReference, `ref-${p.id}`)}
                                title="Copy UTR"
                                className="text-[#718078] hover:text-[#123b30]"
                              >
                                {copiedId === `ref-${p.id}` ? (
                                  <Check size={12} className="text-emerald-700" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {p.paymentScreenshotPath ? (
                            <button
                              onClick={() => setPreviewImage(p.paymentScreenshotPath)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123b30] hover:underline bg-[#f0f4ee] px-2 py-1 rounded"
                            >
                              <Eye size={12} />
                              <span>View Proof</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#a0aba3] italic">No image</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-[#718078]">
                          {p.submittedAt ? (
                            <>
                              <div className="font-semibold text-[#183c31]">
                                {new Date(p.submittedAt).toLocaleDateString()}
                              </div>
                              <div>{new Date(p.submittedAt).toLocaleTimeString()}</div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${getStatusBadge(
                              p.status
                            )}`}
                          >
                            {(p.status || "").replace(/_/g, " ")}
                          </span>
                          {isRejected && p.rejectionReason && (
                            <div className="text-[10px] text-rose-700 mt-1 max-w-xs truncate" title={p.rejectionReason}>
                              {p.rejectionReason}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isSubmitted && (
                              <>
                                <button
                                  onClick={() => handleVerify(p.id, p.requestId, p.amount)}
                                  disabled={acting}
                                  className="btn btn-dark bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] py-1.5 px-2.5 flex items-center gap-1 shadow-xs"
                                  title="Verify & Mark as Paid"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Verify</span>
                                </button>
                                <button
                                  onClick={() => handleReject(p.id, p.requestId)}
                                  disabled={acting}
                                  className="btn btn-secondary border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-[11px] py-1.5 px-2.5 flex items-center gap-1"
                                  title="Reject Payment"
                                >
                                  <XCircle size={12} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {isPaid && (
                              <span className="text-[11px] font-bold text-emerald-800 inline-flex items-center gap-1">
                                <Check size={12} />
                                Verified
                              </span>
                            )}

                            <Link
                              href={`/requests/${p.requestId}`}
                              className="text-[#718078] hover:text-[#123b30] p-1.5 rounded hover:bg-[#f0f4ee]"
                              title="View Request Details"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Screenshot Modal Preview */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5ebe4]">
                <h3 className="font-extrabold text-[#123b30] text-sm flex items-center gap-2">
                  <CreditCard size={16} />
                  <span>Customer Payment Screenshot Proof</span>
                </h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-lg text-[#718078] hover:bg-[#f0f4ee]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-lg border border-[#e5ebe4] bg-[#f8faf5] flex items-center justify-center p-2">
                <img
                  src={previewImage}
                  alt="Customer payment proof"
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              </div>
              <div className="flex justify-end pt-1">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-dark text-xs font-bold py-1.5 px-3 inline-flex items-center gap-1"
                >
                  <span>Open in Full Tab</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
