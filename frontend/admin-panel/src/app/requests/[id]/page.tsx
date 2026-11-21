"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Send,
  Star,
  IndianRupee,
  Calendar,
  AlertCircle,
  Camera,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  FileText,
  X,
  CreditCard,
  Search,
  ArrowRight,
} from "lucide-react";
import { AdminShell } from "../../../components/layout/AdminShell";
import { adminApi } from "../../../services/adminApi";

export default function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const requestId = Number(resolvedParams.id);
  const router = useRouter();

  const [request, setRequest] = useState<any | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // WhatsApp modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappData, setWhatsappData] = useState<{ message: string; groupLink: string; isShared: boolean; sharedAt?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [markingShared, setMarkingShared] = useState(false);

  // Add / Edit Quote Modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");

  const [quoteForm, setQuoteForm] = useState({
    workerId: undefined as number | undefined,
    workerName: "",
    workerPhone: "",
    workerSpecialty: "",
    labourCharges: "",
    materialCharges: "",
    additionalCharges: "",
    availability: "Immediate / Today",
    estimatedCompletionTime: "1-2 hours",
    notes: "",
  });

  // Customer Quotation Form state
  const [customerQuoteForm, setCustomerQuoteForm] = useState({
    selectedWorkerId: undefined as number | undefined,
    selectedWorkerName: "",
    selectedWorkerPhone: "",
    labourCharges: 0,
    materialCharges: 0,
    inspectionCharges: 0,
    additionalCharges: 0,
    discount: 0,
    workDescription: "",
    estimatedDuration: "",
    proposedVisitDate: "",
    proposedVisitTime: "Morning (8am – 12pm)",
    notes: "",
  });

  const [showReviseQuote, setShowReviseQuote] = useState(false);

  // Decline / Status Update state
  const [statusNotes, setStatusNotes] = useState("");

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRequestById(requestId).catch(() => null);
      const reqData = res?.data?.request || res?.request || null;
      const quotesData = res?.quotes || reqData?.workerQuotes || [];
      const paymentData = res?.payment || reqData?.payment || null;
      if (reqData) {
        reqData.customerName = reqData.customer?.name || reqData.contactName || "Customer";
        reqData.customerPhone = reqData.customer?.phone || reqData.contactPhone || "";
      }
      setRequest(reqData);
      setQuotes(quotesData);
      setPayment(paymentData);

      if (reqData) {
        // Pre-fill customer quote form from existing request data or selected worker
        setCustomerQuoteForm({
          selectedWorkerId: reqData.selectedWorkerId,
          selectedWorkerName: reqData.selectedWorkerName || "",
          selectedWorkerPhone: reqData.selectedWorkerPhone || "",
          labourCharges: reqData.quoteLabourCharges || 0,
          materialCharges: reqData.quoteMaterialCharges || 0,
          inspectionCharges: reqData.quoteInspectionCharges || 0,
          additionalCharges: reqData.quoteAdditionalCharges || 0,
          discount: reqData.quoteDiscount || 0,
          workDescription: reqData.quoteWorkDescription || reqData.title || reqData.description?.slice(0, 100) || "",
          estimatedDuration: reqData.quoteEstimatedDuration || "1-2 hours",
          proposedVisitDate: reqData.quoteProposedVisitDate || reqData.preferredDate || new Date().toISOString().slice(0, 10),
          proposedVisitTime: reqData.quoteProposedVisitTime || reqData.preferredTime || "Morning (8am – 12pm)",
          notes: reqData.quoteNotes || "",
        });
      }
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  // Load WhatsApp message for sharing
  const handleOpenWhatsAppModal = async () => {
    try {
      setActing(true);
      const data = await adminApi.getWhatsAppJobMessage(requestId);
      setWhatsappData(data);
      setShowWhatsAppModal(true);
      setCopied(false);
    } catch (err: any) {
      alert(err.message || "Failed to load WhatsApp job message");
    } finally {
      setActing(false);
    }
  };

  const handleCopyMessage = () => {
    if (!whatsappData?.message) return;
    navigator.clipboard.writeText(whatsappData.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMarkShared = async () => {
    try {
      setMarkingShared(true);
      await adminApi.markSharedToWhatsApp(requestId);
      setShowWhatsAppModal(false);
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to mark as shared");
    } finally {
      setMarkingShared(false);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const res = await adminApi.getWorkers();
      if (res && res.workers) {
        const active = res.workers.filter((w: any) => w.available !== false);
        setAvailableWorkers(active);
      }
    } catch (err) {
      console.error("Failed to load active workers:", err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  // Open Add Quote Modal
  const handleOpenAddQuote = () => {
    setEditingQuoteId(null);
    setWorkerSearchTerm("");
    setQuoteForm({
      workerId: undefined,
      workerName: "",
      workerPhone: "",
      workerSpecialty: "",
      labourCharges: "",
      materialCharges: "",
      additionalCharges: "",
      availability: "Immediate / Today",
      estimatedCompletionTime: "1-2 hours",
      notes: "",
    });
    void fetchAvailableWorkers();
    setShowQuoteModal(true);
  };

  // Open Edit Quote Modal
  const handleOpenEditQuote = (q: any) => {
    setEditingQuoteId(q.id);
    setQuoteForm({
      workerId: q.workerId,
      workerName: q.workerName || "",
      workerPhone: q.workerPhone || "",
      workerSpecialty: "",
      labourCharges: String(q.labourCharges || 0),
      materialCharges: String(q.materialCharges || 0),
      additionalCharges: String(q.additionalCharges || 0),
      availability: q.availability || "",
      estimatedCompletionTime: q.estimatedCompletionTime || "",
      notes: q.notes || "",
    });
    setShowQuoteModal(true);
  };

  // Automatically calculated worker quote total = Labour + Material + Other
  const calculatedQuoteTotal =
    (Number(quoteForm.labourCharges) || 0) +
    (Number(quoteForm.materialCharges) || 0) +
    (Number(quoteForm.additionalCharges) || 0);

  // Save Worker Quote
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuoteId && (!quoteForm.workerId || !quoteForm.workerName.trim())) {
      alert("Please select an existing worker from the dropdown.");
      return;
    }
    if (!quoteForm.workerName.trim() || !quoteForm.workerPhone.trim()) {
      alert("Worker identity details are required.");
      return;
    }

    try {
      setActing(true);
      const payload = {
        workerId: quoteForm.workerId,
        workerName: quoteForm.workerName,
        workerPhone: quoteForm.workerPhone,
        labourCharges: Number(quoteForm.labourCharges || 0),
        materialCharges: Number(quoteForm.materialCharges || 0),
        additionalCharges: Number(quoteForm.additionalCharges || 0),
        quotedAmount: calculatedQuoteTotal,
        availability: quoteForm.availability,
        estimatedCompletionTime: quoteForm.estimatedCompletionTime,
        notes: quoteForm.notes,
      };

      if (editingQuoteId) {
        await adminApi.updateWorkerQuote(requestId, editingQuoteId, payload);
      } else {
        await adminApi.createWorkerQuote(requestId, payload);
      }

      setShowQuoteModal(false);
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to save quote");
    } finally {
      setActing(false);
    }
  };

  // Delete Quote
  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm("Are you sure you want to remove this worker quotation?")) return;
    try {
      setActing(true);
      await adminApi.deleteWorkerQuote(requestId, quoteId);
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to delete quote");
    } finally {
      setActing(false);
    }
  };

  // Select Preferred Worker Quote
  const handleSelectPreferredQuote = async (quoteId: number) => {
    try {
      setActing(true);
      const res = await adminApi.selectPreferredWorkerQuote(requestId, quoteId);
      const selected = res?.quote;
      if (selected) {
        setCustomerQuoteForm((prev) => ({
          ...prev,
          selectedWorkerId: selected.workerId,
          selectedWorkerName: selected.workerName,
          selectedWorkerPhone: selected.workerPhone,
          labourCharges: selected.labourCharges || 0,
          materialCharges: selected.materialCharges || 0,
          additionalCharges: selected.additionalCharges || 0,
        }));
      }
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to select preferred worker quote");
    } finally {
      setActing(false);
    }
  };

  // Calculated Customer Final Total
  const calculatedFinalTotal = Math.max(
    0,
    Number(customerQuoteForm.labourCharges || 0) +
      Number(customerQuoteForm.materialCharges || 0) +
      Number(customerQuoteForm.inspectionCharges || 0) +
      Number(customerQuoteForm.additionalCharges || 0) -
      Number(customerQuoteForm.discount || 0)
  );

  // Send Customer Quotation
  const handleSendCustomerQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerQuoteForm.selectedWorkerName) {
      alert("Please enter or select a preferred worker name first.");
      return;
    }
    if (calculatedFinalTotal <= 0) {
      if (!confirm("The total amount is ₹0. Do you want to proceed with sending this quote?")) return;
    }

    try {
      setActing(true);
      await adminApi.sendCustomerQuote(requestId, {
        ...customerQuoteForm,
        finalTotal: calculatedFinalTotal,
      });
      alert(`Quotation of ₹${calculatedFinalTotal} sent to customer successfully! Status is now pending customer approval.`);
      setShowReviseQuote(false);
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to send customer quote");
    } finally {
      setActing(false);
    }
  };

  // Confirm Final Worker Assignment (after customer approved)
  const handleConfirmAssignment = async () => {
    if (!confirm(`Confirm assignment of ${request.selectedWorkerName || "worker"} to this request?`)) return;
    try {
      setActing(true);
      await adminApi.confirmWorkerAssignment(requestId);
      alert("Worker assignment confirmed successfully! Customer has been notified.");
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to confirm worker assignment");
    } finally {
      setActing(false);
    }
  };

  // Mark Work In Progress
  const handleMarkWorkInProgress = async () => {
    if (!confirm("Mark work on this request as IN PROGRESS?")) return;
    try {
      setActing(true);
      await adminApi.markWorkInProgress(requestId);
      alert("Work marked as IN PROGRESS.");
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to mark in progress");
    } finally {
      setActing(false);
    }
  };

  // Mark Work Completed (Activates Payment Flow)
  const handleMarkWorkCompleted = async () => {
    const note = prompt("Enter completion notes (optional):", "Service completed satisfactorily.");
    if (note === null) return;
    try {
      setActing(true);
      await adminApi.markWorkCompleted(requestId, note);
      alert("Work marked as COMPLETED! Customer payment section has been activated.");
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to mark work as completed");
    } finally {
      setActing(false);
    }
  };

  // Verify and Mark as Paid
  const handleVerifyPayment = async (payId: number) => {
    if (!confirm("Verify and approve this customer payment as PAID?")) return;
    try {
      setActing(true);
      await adminApi.verifyPayment(payId);
      alert("Payment verified successfully and marked as PAID!");
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to verify payment");
    } finally {
      setActing(false);
    }
  };

  // Reject Customer Payment
  const handleRejectPayment = async (payId: number) => {
    const reason = prompt("Enter reason for rejecting this payment (e.g. UTR not matching, amount mismatch):", "Invalid UTR / Reference number not found in bank account");
    if (!reason) return;
    try {
      setActing(true);
      await adminApi.rejectPayment(payId, reason);
      alert("Payment rejected. The customer has been asked to resubmit.");
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to reject payment");
    } finally {
      setActing(false);
    }
  };

  // Update Status Action
  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Update request status to '${newStatus.replace(/_/g, " ")}'?`)) return;
    try {
      setActing(true);
      await adminApi.updateRequestStatus(requestId, newStatus, statusNotes);
      setStatusNotes("");
      await fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="p-12 text-center text-[#718078]">
          <div className="w-8 h-8 border-3 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading request #{requestId}...
        </div>
      </AdminShell>
    );
  }

  if (!request) {
    return (
      <AdminShell>
        <div className="p-12 max-w-md mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mx-auto">
            <AlertCircle size={26} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#123b30]">Service Request Not Found</h2>
            <p className="text-xs text-[#718078] mt-1.5 leading-relaxed">
              Request #{requestId} does not exist or was removed during data cleanup.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/requests" className="btn btn-dark text-xs inline-flex items-center gap-2">
              <ArrowLeft size={14} />
              <span>Back to Service Requests</span>
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  // Format status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "customer_confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "customer_approval_pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "customer_declined":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "assigned":
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "finding_worker":
      case "worker_selected":
        return "bg-lime-100 text-[#123b30] border-[#c4e38c]";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const normStatus = (request?.status || "").toLowerCase();
  const isQuotationStage = !["assigned", "in_progress", "completed", "customer_confirmed"].includes(normStatus);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#557e62] hover:text-[#123b30]"
        >
          <ArrowLeft size={14} />
          Back to Service Requests
        </Link>

        {/* Top Overview Banner */}
        <div className="bg-white p-6 rounded-xl border border-[#e5ebe4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-[#123b30]">
                #HOMI-{request.id}
              </h1>
              <span className="font-extrabold text-xs bg-[#f0f4ee] text-[#123b30] px-2.5 py-0.5 rounded">
                {request.category}
              </span>
              <span
                className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  request.status
                )}`}
              >
                {request.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-[#718078]">
              Submitted on {new Date(request.createdAt).toLocaleString()} by{" "}
              <strong className="text-[#123b30]">{request.customerName}</strong> ({request.contactPhone || request.customerPhone})
            </p>
          </div>

          {/* Prominent Action: Send to WhatsApp Group Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenWhatsAppModal}
              disabled={acting}
              className="btn btn-lime text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-xs hover:shadow-sm transition-all"
            >
              <Share2 size={15} />
              <span>Send to WhatsApp Group</span>
            </button>

            {/* Work Progress & Completion Actions: Prominent Mark Work Done */}
            {normStatus === "assigned" && (
              <>
                <button
                  onClick={handleMarkWorkCompleted}
                  disabled={acting}
                  className="btn btn-dark text-xs font-bold py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 shadow-xs"
                >
                  <CheckCircle2 size={16} />
                  <span>Mark Work Done</span>
                </button>
                <button
                  onClick={handleMarkWorkInProgress}
                  disabled={acting}
                  className="btn btn-secondary text-xs font-bold py-2 px-3 text-[#123b30] border-[#cbe1c3]"
                >
                  Start Work (In Progress)
                </button>
              </>
            )}

            {normStatus === "in_progress" && (
              <button
                onClick={handleMarkWorkCompleted}
                disabled={acting}
                className="btn btn-dark text-xs font-bold py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 shadow-xs"
              >
                <CheckCircle2 size={16} />
                <span>Mark Work Done</span>
              </button>
            )}

            {normStatus !== "completed" && normStatus !== "cancelled" && (
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={acting}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-2"
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>

        {/* Customer Approved Banner (Prominent Assignment Trigger) */}
        {normStatus === "customer_confirmed" && (
          <div className="p-5 rounded-xl bg-[#f0f8f3] border-2 border-emerald-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  Customer Approved – Confirm Assignment
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  The customer accepted the quotation of <strong>₹{request.quoteFinalTotal}</strong> on{" "}
                  {request.customerApprovedAt ? new Date(request.customerApprovedAt).toLocaleString() : "today"}.
                  Preferred technician: <strong>{request.selectedWorkerName}</strong> ({request.selectedWorkerPhone}).
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirmAssignment}
              disabled={acting}
              className="btn btn-dark text-xs font-extrabold py-3 px-6 bg-emerald-800 hover:bg-emerald-900 text-white shadow-md shrink-0 flex items-center gap-2"
            >
              <UserCheck size={16} />
              <span>Confirm Worker Assignment</span>
            </button>
          </div>
        )}

        {/* Customer Declined Banner */}
        {normStatus === "customer_declined" && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-3 text-xs text-rose-900">
            <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-rose-950">Customer Declined Quotation</h4>
              <p className="mt-0.5">
                Reason: <em>"{request.customerDeclineReason || "Price or timing did not suit customer"}"</em>
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                You can revise the quotation parameters below and re-send it to the customer.
              </p>
            </div>
          </div>
        )}

        {/* Assigned Worker Banner */}
        {(normStatus === "assigned" || normStatus === "in_progress") && (
          <div className="p-5 rounded-xl bg-[#f0f8f3] border-2 border-[#285437] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[#123b30] text-[#d9ed89] shrink-0 mt-0.5">
                <UserCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#285437] tracking-wide block">
                  Assigned Technician
                </span>
                <h3 className="text-base font-extrabold text-[#123b30] mt-0.5">
                  {request.selectedWorkerName || "Assigned Professional"}
                </h3>
                <div className="text-xs text-[#48624d] flex items-center gap-4 mt-1.5 flex-wrap">
                  {request.selectedWorkerPhone && (
                    <span>Phone: <strong>{request.selectedWorkerPhone}</strong></span>
                  )}
                  <span>Proposed Visit: <strong>{request.quoteProposedVisitDate || request.preferredDate} ({request.quoteProposedVisitTime || request.preferredTime})</strong></span>
                  <span>Agreed Quote: <strong>₹{request.quoteFinalTotal}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {request.selectedWorkerPhone && (
                <a
                  href={`tel:${request.selectedWorkerPhone}`}
                  className="btn btn-dark text-xs font-bold py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Call Worker</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Customer Payment Confirmation (When Work is COMPLETED) */}
        {normStatus === "completed" && (
          <div className="bg-white p-6 rounded-xl border-2 border-[#123b30] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#e5ebe4]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#123b30] text-[#d9ed89]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#123b30] text-sm">
                    {(request.paymentStatus || payment?.status) === "PAID"
                      ? "Payment Completed"
                      : "Customer Payment Confirmation"}
                  </h3>
                  <p className="text-xs text-[#718078]">
                    Work completed. Total payable: <strong>₹{request.quoteFinalTotal || payment?.amount || 0}</strong>
                  </p>
                </div>
              </div>

              <span
                className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full border ${
                  (request.paymentStatus || payment?.status) === "PAID"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : (request.paymentStatus || payment?.status) === "PAYMENT_SUBMITTED"
                    ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                    : (request.paymentStatus || payment?.status) === "PAYMENT_REJECTED"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {(request.paymentStatus || payment?.status) === "PAID"
                  ? "Payment Completed ✓"
                  : (request.paymentStatus || payment?.status || "PAYMENT_PENDING").replace(/_/g, " ")}
              </span>
            </div>

            {/* Status: PAID */}
            {(request.paymentStatus || payment?.status) === "PAID" ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <span>Payment Completed & Verified ✓</span>
                </div>
                <div className="grid sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                  <div>Request ID: <strong className="text-[#123b30]">#HOMI-{request.id}</strong></div>
                  <div>Final Amount: <strong>₹{payment?.amount || request.quoteFinalTotal}</strong></div>
                  <div>Assigned Worker: <strong>{request.selectedWorkerName || request.workerName}</strong></div>
                  <div>Reference / UTR: <strong className="font-mono">{payment?.transactionReference || "Direct"}</strong></div>
                </div>
                {payment?.verifiedAt && (
                  <div className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200">
                    Confirmed by Admin on {new Date(payment.verifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              /* Payment Pending / Submitted / Rejected - Admin confirmation workflow */
              <div className="space-y-4">
                <div className="grid sm:grid-cols-4 gap-3 p-3.5 bg-[#f8faf6] rounded-lg border border-[#e2ede0] text-xs">
                  <div>
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Request ID</span>
                    <strong className="text-sm text-[#123b30]">#HOMI-{request.id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Customer</span>
                    <strong className="text-sm text-[#123b30]">{request.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Assigned Worker</span>
                    <strong className="text-sm text-[#123b30]">{request.selectedWorkerName || request.workerName || "Verified Worker"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718078] uppercase font-bold block">Final Amount</span>
                    <strong className="text-base text-[#123b30] font-black">₹{request.quoteFinalTotal || payment?.amount || 0}</strong>
                  </div>
                </div>

                {/* Submitted proof details if customer submitted UTR/screenshot */}
                {(request.paymentStatus || payment?.status) === "PAYMENT_SUBMITTED" && payment && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-3">
                    <div className="font-bold text-amber-950 flex items-center gap-2">
                      <Clock size={16} className="text-amber-700" />
                      <span>Customer Submitted Payment Proof (Awaiting Verification)</span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 p-3 bg-white rounded border border-amber-200">
                      <div>
                        <span className="text-[10px] text-[#718078] uppercase font-bold block">Method</span>
                        <strong className="text-sm text-[#183c31]">{payment.paymentMethod || "UPI"}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#718078] uppercase font-bold block">Transaction Ref / UTR</span>
                        <strong className="text-sm font-mono text-[#123b30] bg-[#f0f4ee] px-2 py-0.5 rounded">
                          {payment.transactionReference || "—"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#718078] uppercase font-bold block">Submitted Date</span>
                        <span className="text-xs text-[#183c31]">
                          {payment.paymentDate || (payment.submittedAt ? new Date(payment.submittedAt).toLocaleDateString() : "Today")}
                        </span>
                      </div>
                    </div>

                    {payment.paymentScreenshotPath && (
                      <div>
                        <span className="text-[10px] text-[#718078] uppercase font-bold block mb-1">
                          Payment Screenshot Proof
                        </span>
                        <a
                          href={payment.paymentScreenshotPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block border border-amber-300 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={payment.paymentScreenshotPath}
                            alt="Payment proof screenshot"
                            className="max-h-40 object-cover"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {(request.paymentStatus || payment?.status) === "PAYMENT_REJECTED" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    <strong>Previous Payment Rejected:</strong> <em>"{payment?.rejectionReason || "Details not matching bank statement"}"</em>
                  </div>
                )}

                {/* Primary Action Button: Mark Payment Done */}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={() => handleVerifyPayment(payment?.id || requestId)}
                    disabled={acting}
                    className="btn btn-dark bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-5 flex items-center gap-2 shadow-xs"
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark Payment Done</span>
                  </button>

                  {(request.paymentStatus || payment?.status) === "PAYMENT_SUBMITTED" && payment && (
                    <button
                      onClick={() => handleRejectPayment(payment.id)}
                      disabled={acting}
                      className="btn btn-secondary border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <XCircle size={14} />
                      <span>Reject Payment</span>
                    </button>
                  )}

                  <span className="text-[11px] text-[#718078]">
                    Click when the worker confirms receiving payment from the customer.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Sharing Status Indicator */}
        {request.whatsappSharedAt && (
          <div className="p-3 bg-[#f4f8f4] border border-[#d2e7d7] rounded-lg flex items-center justify-between text-xs text-[#285437]">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#1b7e47]" />
              <span>
                Shared to WhatsApp Workers Group on{" "}
                <strong>{new Date(request.whatsappSharedAt).toLocaleString()}</strong>
              </span>
            </div>
            <button
              onClick={handleOpenWhatsAppModal}
              className="text-[11px] font-bold text-[#123b30] underline hover:no-underline"
            >
              View Message / Re-share
            </button>
          </div>
        )}

        {/* Request Details Grid */}
        <div className="grid md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Problem & Customer Info */}
          <div className="md:col-span-6 space-y-6">
            {/* Problem Details */}
            <div className="bg-white p-6 rounded-xl border border-[#e5ebe4] space-y-4">
              <h2 className="text-sm font-bold text-[#123b30]">Problem Details</h2>
              <div className="p-4 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs leading-relaxed text-[#183c31] whitespace-pre-wrap">
                {request.description}
              </div>

              {request.photos && request.photos.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#123b30] mb-2 flex items-center gap-1">
                    <Camera size={13} />
                    Attached Customer Photos ({request.photos.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {request.photos.map((p: any, idx: number) => (
                      <img
                        key={p.id || idx}
                        src={p.url || `/api/requests/${requestId}/photos/${p.id}`}
                        alt="Problem snapshot"
                        className="rounded-lg object-cover w-full h-24 border border-[#e5ebe4]"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Contact Details */}
            <div className="bg-white p-6 rounded-xl border border-[#e5ebe4] space-y-3">
              <h2 className="text-sm font-bold text-[#123b30]">Customer Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-[#123b30]" />
                  <div>
                    <div className="text-[10px] text-[#718078] uppercase font-bold">Customer Name</div>
                    <div className="font-bold text-[#183c31]">{request.customerName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-[#123b30]" />
                  <div>
                    <div className="text-[10px] text-[#718078] uppercase font-bold">Phone Number</div>
                    <div className="font-bold text-[#183c31]">{request.contactPhone || request.customerPhone || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#123b30]" />
                  <div>
                    <div className="text-[10px] text-[#718078] uppercase font-bold">Preferred Visit Date & Time</div>
                    <div className="font-semibold text-[#183c31]">
                      {request.preferredDate} · {request.preferredTime || "Flexible"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-[#123b30]" />
                  <div>
                    <div className="text-[10px] text-[#718078] uppercase font-bold">Account Email</div>
                    <div className="font-semibold text-[#183c31]">{request.customerEmail || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e5ebe4] text-xs">
                <div className="text-[10px] text-[#718078] uppercase font-bold mb-1">
                  Service Address & Map Location
                </div>
                <div className="flex items-start gap-1.5 text-[#183c31]">
                  <MapPin size={15} className="text-[#123b30] shrink-0 mt-0.5" />
                  <span>{request.locationLabel || request.address || request.city}</span>
                </div>
                {request.latitude && request.longitude && (
                  <div className="text-[11px] text-[#718078] mt-1 pl-5">
                    Coordinates: {request.latitude.toFixed(5)}, {request.longitude.toFixed(5)}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Worker Card (if assigned) */}
            {request.workerId || normStatus === "assigned" || normStatus === "in_progress" || normStatus === "completed" ? (
              <div className="bg-white p-6 rounded-xl border border-emerald-300 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <UserCheck size={18} />
                  <span>Assigned Field Worker</span>
                </div>
                <div className="p-3 bg-[#f0f8f3] rounded-lg text-xs space-y-1.5">
                  <div className="font-extrabold text-base text-[#123b30]">
                    {request.selectedWorkerName || request.workerName || "Assigned Worker"}
                  </div>
                  <div className="text-[#526e57]">
                    Phone: {request.selectedWorkerPhone || request.workerPhone || "—"}
                  </div>
                  {request.quoteProposedVisitDate && (
                    <div className="text-[#526e57]">
                      Scheduled Visit: {request.quoteProposedVisitDate} · {request.quoteProposedVisitTime}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-[#718078] pt-1">
                  <div className="flex justify-between">
                    <span>Agreed Customer Total:</span>
                    <strong className="text-[#123b30]">₹{request.quoteFinalTotal || (request.quotedAmount ? request.quotedAmount / 100 : 0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <strong className="text-[#123b30] uppercase">{request.paymentStatus || "Unpaid"}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Worker Quotes & Final Customer Quotation */}
          <div className="md:col-span-6 space-y-6">
            {/* Section 1: Worker Quotations (Admin Enters Manually) */}
            <div className="bg-white p-6 rounded-xl border border-[#e5ebe4] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#123b30]">
                    Worker Quotes (from WhatsApp)
                  </h2>
                  <p className="text-[11px] text-[#718078]">
                    Enter responses received from workers in the WhatsApp group
                  </p>
                </div>
                {isQuotationStage ? (
                  <button
                    type="button"
                    onClick={handleOpenAddQuote}
                    className="btn btn-dark text-xs py-1.5 px-3 flex items-center gap-1 font-bold shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Add Quote</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                    Quotation Finalized
                  </span>
                )}
              </div>

              {quotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#718078] bg-[#f8faf5] rounded-xl border border-dashed border-[#e5ebe4] space-y-2">
                  <p>No worker quotes added yet.</p>
                  <p className="text-[11px]">
                    Share the job to your WhatsApp group first, then click <strong>Add Quote</strong> when technicians reply.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q: any) => (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                        q.isSelected
                          ? "bg-[#f4f9f1] border-[#a3cf93] shadow-xs"
                          : "bg-white border-[#e5ebe4] hover:border-[#ccd7cb]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#123b30]">
                              {q.workerName}
                            </span>
                            {q.isSelected && (
                              <span className="bg-[#d9ed89] text-[#123b30] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                Preferred Worker
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#718078] block">
                            {q.workerPhone} {q.availability ? `• ${q.availability}` : ""}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-[#123b30]">
                            ₹{q.quotedAmount}
                          </span>
                          {q.estimatedCompletionTime && (
                            <span className="text-[10px] text-[#718078] block">
                              Est. {q.estimatedCompletionTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Charges Breakdown */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#f0f4ee] text-[11px] text-[#557e62]">
                        <div>Labour: ₹{q.labourCharges || 0}</div>
                        <div>Material: ₹{q.materialCharges || 0}</div>
                        <div>Additional: ₹{q.additionalCharges || 0}</div>
                      </div>

                      {q.notes && (
                        <p className="text-[11px] text-[#526e57] bg-white/70 p-1.5 rounded border border-[#e5ebe4]">
                          {q.notes}
                        </p>
                      )}

                      {/* Actions (Only available before customer approval) */}
                      {isQuotationStage ? (
                        <div className="flex items-center justify-between pt-1 border-t border-[#f0f4ee]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditQuote(q)}
                              className="text-[11px] text-[#557e62] hover:text-[#123b30] font-semibold flex items-center gap-1"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuote(q.id)}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>

                          {!q.isSelected && (
                            <button
                              type="button"
                              onClick={() => handleSelectPreferredQuote(q.id)}
                              disabled={acting}
                              className="btn btn-dark text-[11px] py-1 px-3 font-bold"
                            >
                              Select as Preferred
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="pt-1 border-t border-[#f0f4ee] flex justify-between items-center text-[11px]">
                          <span className="text-[#718078]">Recorded for WhatsApp bid history</span>
                          {q.isSelected && (
                            <span className="font-bold text-emerald-800">Assigned Technician ✓</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Final Customer Quotation (Locked and Read-Only after Customer Acceptance) */}
            {normStatus === "assigned" || normStatus === "in_progress" || normStatus === "completed" || normStatus === "customer_confirmed" ? (
              <div className="bg-white p-6 rounded-xl border border-emerald-300 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#123b30]">
                        Approved Customer Quotation
                      </h2>
                      <p className="text-[11px] text-[#718078]">
                        Customer accepted this quotation. Price and assigned worker are locked.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    Quotation Locked ✓
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#718078] block">Assigned Worker</span>
                    <strong className="text-sm text-[#123b30] block">{request.selectedWorkerName || request.workerName || "Assigned Worker"}</strong>
                    {request.selectedWorkerPhone && <span className="text-xs text-[#48624d] font-mono">{request.selectedWorkerPhone}</span>}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#718078] block">Proposed Visit</span>
                    <strong className="text-sm text-[#123b30] block">
                      {request.quoteProposedVisitDate || request.preferredDate} ({request.quoteProposedVisitTime || request.preferredTime})
                    </strong>
                    <span className="text-xs text-[#718078]">Est. Duration: {request.quoteEstimatedDuration || "1-2 hours"}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#f8faf6] rounded-lg border border-[#e2ede0] text-xs space-y-2">
                  <div className="flex justify-between text-[#48624d]">
                    <span>Labour Charges:</span>
                    <strong>₹{request.quoteLabourCharges || 0}</strong>
                  </div>
                  {(request.quoteMaterialCharges || 0) > 0 && (
                    <div className="flex justify-between text-[#48624d]">
                      <span>Material Charges:</span>
                      <strong>₹{request.quoteMaterialCharges}</strong>
                    </div>
                  )}
                  {(request.quoteInspectionCharges || 0) > 0 && (
                    <div className="flex justify-between text-[#48624d]">
                      <span>Inspection Fee:</span>
                      <strong>₹{request.quoteInspectionCharges}</strong>
                    </div>
                  )}
                  {(request.quoteAdditionalCharges || 0) > 0 && (
                    <div className="flex justify-between text-[#48624d]">
                      <span>Other / Additional Charges:</span>
                      <strong>₹{request.quoteAdditionalCharges}</strong>
                    </div>
                  )}
                  {(request.quoteDiscount || 0) > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Discount:</span>
                      <strong>-₹{request.quoteDiscount}</strong>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#d8e3d5] text-base font-extrabold text-[#123b30]">
                    <span>Final Agreed Total:</span>
                    <span>₹{request.quoteFinalTotal || 0}</span>
                  </div>
                </div>

                {request.quoteWorkDescription && (
                  <div className="text-xs text-[#48624d]">
                    <span className="text-[10px] uppercase font-bold text-[#718078] block mb-1">Work Description & Scope</span>
                    <p className="bg-[#f8faf5] p-2.5 rounded border border-[#e5ebe4] text-xs leading-relaxed">{request.quoteWorkDescription}</p>
                  </div>
                )}
              </div>
            ) : normStatus === "customer_approval_pending" && !showReviseQuote ? (
              <div className="bg-white p-6 rounded-xl border-2 border-amber-400 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#123b30]">
                        Quotation Sent — Awaiting Customer Approval
                      </h2>
                      <p className="text-[11px] text-[#718078]">
                        Quotation sent on {new Date(request.quoteSentAt || Date.now()).toLocaleTimeString()} ({new Date(request.quoteSentAt || Date.now()).toLocaleDateString()}).
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
                    Awaiting Approval
                  </span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                  ✓ This quotation of <strong>₹{request.quoteFinalTotal || calculatedFinalTotal}</strong> is currently visible in the Customer Dashboard. The customer can review the price breakdown, proposed visit time, and click <strong>Accept & Confirm</strong> or <strong>Decline</strong>.
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#718078] block">Selected Worker</span>
                    <strong className="text-sm text-[#123b30] block">{request.selectedWorkerName || "Selected Worker"}</strong>
                    {request.selectedWorkerPhone && <span className="text-xs text-[#48624d] font-mono">{request.selectedWorkerPhone}</span>}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#718078] block">Proposed Visit Schedule</span>
                    <strong className="text-sm text-[#123b30] block">
                      {request.quoteProposedVisitDate || request.preferredDate} ({request.quoteProposedVisitTime || request.preferredTime})
                    </strong>
                    <span className="text-xs text-[#718078]">Est. Duration: {request.quoteEstimatedDuration || "1-2 hours"}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#f8faf6] rounded-lg border border-[#e2ede0] text-xs space-y-2">
                  <div className="flex justify-between text-[#48624d]">
                    <span>Labour Charges:</span>
                    <strong>₹{request.quoteLabourCharges || 0}</strong>
                  </div>
                  {(request.quoteMaterialCharges || 0) > 0 && (
                    <div className="flex justify-between text-[#48624d]">
                      <span>Material Charges:</span>
                      <strong>₹{request.quoteMaterialCharges}</strong>
                    </div>
                  )}
                  {(request.quoteInspectionCharges || 0) > 0 && (
                    <div className="flex justify-between text-[#48624d]">
                      <span>Inspection Fee:</span>
                      <strong>₹{request.quoteInspectionCharges}</strong>
                    </div>
                  )}
                  {(request.quoteAdditionalCharges || 0) > 0 && (
                    <div className="flex justify-between text-[#48624d]">
                      <span>Other / Additional Charges:</span>
                      <strong>₹{request.quoteAdditionalCharges}</strong>
                    </div>
                  )}
                  {(request.quoteDiscount || 0) > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Discount:</span>
                      <strong>-₹{request.quoteDiscount}</strong>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#d8e3d5] text-base font-extrabold text-[#123b30]">
                    <span>Total Quoted Amount:</span>
                    <span>₹{request.quoteFinalTotal || 0}</span>
                  </div>
                </div>

                {request.quoteWorkDescription && (
                  <div className="text-xs text-[#48624d]">
                    <span className="text-[10px] uppercase font-bold text-[#718078] block mb-1">Work Description & Scope</span>
                    <p className="bg-[#f8faf5] p-2.5 rounded border border-[#e5ebe4] text-xs leading-relaxed">{request.quoteWorkDescription}</p>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReviseQuote(true)}
                    className="px-4 py-2 border border-[#dce9d7] hover:bg-[#f0f4ee] text-[#123b30] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={13} />
                    <span>Revise Quotation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-[#e5ebe4] space-y-4">
                <div className="border-b border-[#e5ebe4] pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#123b30]">
                      {normStatus === "customer_approval_pending" ? "Revise Customer Quotation" : "Final Customer Quotation"}
                    </h2>
                    <p className="text-[11px] text-[#718078]">
                      {normStatus === "customer_approval_pending"
                        ? "Update the prices or visit schedule and re-send to customer"
                        : "Set customer prices and send for customer approval in their dashboard"}
                    </p>
                  </div>
                  {normStatus === "customer_approval_pending" && (
                    <button
                      type="button"
                      onClick={() => setShowReviseQuote(false)}
                      className="px-3 py-1 border border-[#e5ebe4] hover:bg-[#f8faf5] text-[#718078] font-bold text-xs rounded-lg transition-colors"
                    >
                      Cancel Revision
                    </button>
                  )}
                </div>

                <form onSubmit={handleSendCustomerQuote} className="space-y-3.5 text-xs">
                  {/* Selected Worker Info */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Selected Worker Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customerQuoteForm.selectedWorkerName}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({ ...prev, selectedWorkerName: e.target.value }))
                        }
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] font-semibold outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Worker Phone (internal)
                      </label>
                      <input
                        type="text"
                        value={customerQuoteForm.selectedWorkerPhone}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({ ...prev, selectedWorkerPhone: e.target.value }))
                        }
                        placeholder="e.g. +919876543210"
                        className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                  </div>

                  {/* Charges Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Labour Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={customerQuoteForm.labourCharges || ""}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({
                            ...prev,
                            labourCharges: Number(e.target.value || 0),
                          }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-bold text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Material Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={customerQuoteForm.materialCharges || ""}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({
                            ...prev,
                            materialCharges: Number(e.target.value || 0),
                          }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-bold text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Inspection Fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={customerQuoteForm.inspectionCharges || ""}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({
                            ...prev,
                            inspectionCharges: Number(e.target.value || 0),
                          }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-bold text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Other Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={customerQuoteForm.additionalCharges || ""}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({
                            ...prev,
                            additionalCharges: Number(e.target.value || 0),
                          }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-bold text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={customerQuoteForm.discount || ""}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({
                            ...prev,
                            discount: Number(e.target.value || 0),
                          }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-bold text-rose-700 outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div className="bg-[#f0f4ee] p-2 rounded-lg border border-[#d8e3d5] flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-[#557e62] uppercase">Final Total</span>
                      <span className="text-base font-black text-[#123b30]">₹{calculatedFinalTotal}</span>
                    </div>
                  </div>

                  {/* Scope & Schedule */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                      Work Description & Scope
                    </label>
                    <textarea
                      rows={2}
                      value={customerQuoteForm.workDescription}
                      onChange={(e) =>
                        setCustomerQuoteForm((prev) => ({ ...prev, workDescription: e.target.value }))
                      }
                      placeholder="Details of inspection, parts to replace, or repair work..."
                      className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Est. Duration
                      </label>
                      <input
                        type="text"
                        value={customerQuoteForm.estimatedDuration}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))
                        }
                        placeholder="e.g. 1-2 hours"
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Proposed Visit Date
                      </label>
                      <input
                        type="date"
                        value={customerQuoteForm.proposedVisitDate}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({ ...prev, proposedVisitDate: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                        Proposed Visit Time
                      </label>
                      <select
                        value={customerQuoteForm.proposedVisitTime}
                        onChange={(e) =>
                          setCustomerQuoteForm((prev) => ({ ...prev, proposedVisitTime: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                      >
                        <option value="Morning (8am – 12pm)">Morning (8am – 12pm)</option>
                        <option value="Afternoon (12pm – 5pm)">Afternoon (12pm – 5pm)</option>
                        <option value="Evening (5pm – 9pm)">Evening (5pm – 9pm)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={acting}
                      className="btn btn-dark w-full py-2.5 text-xs font-bold shadow-xs flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      <span>
                        {normStatus === "customer_approval_pending"
                          ? `Update & Resend Quotation (₹${calculatedFinalTotal})`
                          : `Send Quotation to Customer (₹${calculatedFinalTotal})`}
                      </span>
                    </button>
                    {normStatus === "customer_approval_pending" && (
                      <p className="text-[11px] text-amber-700 text-center mt-2 font-semibold">
                        Revising quotation. Once submitted, the updated quotation will replace the existing one in customer dashboard.
                      </p>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Share Modal */}
        {showWhatsAppModal && whatsappData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#e5ebe4] animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366]">
                    <MessageSquare size={18} className="text-[#1b7e47]" />
                  </div>
                  <h3 className="font-extrabold text-[#123b30] text-sm">
                    Broadcast Request to WhatsApp Group
                  </h3>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="p-1 rounded-lg text-[#718078] hover:bg-[#f0f4ee]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#183c31]">Prepared WhatsApp Job Message</span>
                  <button
                    onClick={handleCopyMessage}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123b30] bg-[#f0f4ee] hover:bg-[#e2e8df] px-2.5 py-1 rounded"
                  >
                    {copied ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                    <span>{copied ? "Copied!" : "Copy Message"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={whatsappData.message}
                  className="w-full p-3 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-mono text-[#183c31] leading-relaxed outline-none"
                />
                <p className="text-[11px] text-[#718078] italic">
                  Note: Customer's private mobile number and exact house address are masked for privacy.
                </p>
              </div>

              {/* Instructions & Actions */}
              <div className="p-3.5 bg-[#f0f4ee] rounded-xl text-xs space-y-2">
                <div className="font-bold text-[#123b30]">Next steps to share:</div>
                <ol className="list-decimal list-inside space-y-1 text-[#557e62] text-[11px]">
                  <li>Click <strong>Copy Message</strong> above.</li>
                  <li>Open the WhatsApp group using the link below and paste the message.</li>
                  <li>Click <strong>Mark as Shared</strong> once pasted.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {whatsappData.groupLink ? (
                  <a
                    href={whatsappData.groupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark text-xs font-bold py-2.5 px-4 inline-flex items-center gap-1.5"
                  >
                    <span>Open WhatsApp Group</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <Link
                    href="/settings"
                    className="text-xs text-rose-700 font-bold underline hover:no-underline"
                  >
                    Set WhatsApp Group Link in Settings
                  </Link>
                )}

                <button
                  onClick={handleMarkShared}
                  disabled={markingShared}
                  className="btn btn-lime text-xs font-bold py-2.5 px-5 shadow-xs"
                >
                  {markingShared ? "Saving..." : "Mark as Shared"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Worker Quote Modal */}
        {showQuoteModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#e5ebe4] animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
                <div>
                  <h3 className="font-extrabold text-[#123b30] text-sm">
                    {editingQuoteId ? "Edit Worker Quote" : "Add Worker Quote (from WhatsApp)"}
                  </h3>
                  <p className="text-[11px] text-[#718078]">
                    {editingQuoteId ? "Update charges and details" : "Select an active registered technician and enter quote"}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="p-1 rounded-lg text-[#718078] hover:bg-[#f0f4ee]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuote} className="space-y-3.5 text-xs">
                {/* 1. Worker Selection Dropdown (Only for adding new quote) */}
                {!editingQuoteId ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#718078] uppercase">
                      Select Existing Worker *
                    </label>

                    {loadingWorkers ? (
                      <div className="p-3 text-center text-xs text-[#718078] bg-[#f8faf5] rounded-lg border border-[#e5ebe4]">
                        Loading active registered workers...
                      </div>
                    ) : availableWorkers.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                        <p className="font-bold text-amber-900 text-xs">No active workers found in directory.</p>
                        <p className="text-[11px] text-amber-700">Please register or activate workers in the Workers section first.</p>
                        <Link
                          href="/workers"
                          className="btn btn-dark text-xs py-1.5 px-3 inline-flex items-center gap-1 font-bold"
                        >
                          <span>Go to Workers Section</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Search filter for workers */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 text-[#718078]" size={13} />
                          <input
                            type="text"
                            placeholder="Filter by name, specialty, or phone..."
                            value={workerSearchTerm}
                            onChange={(e) => setWorkerSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30]"
                          />
                        </div>

                        {/* Searchable dropdown select */}
                        <select
                          required
                          value={quoteForm.workerId || ""}
                          onChange={(e) => {
                            const selectedId = Number(e.target.value);
                            const w = availableWorkers.find((worker: any) => worker.id === selectedId);
                            if (w) {
                              setQuoteForm((prev) => ({
                                ...prev,
                                workerId: w.id,
                                workerName: w.name,
                                workerPhone: w.phone,
                                workerSpecialty: w.specialty,
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs font-semibold text-[#123b30] outline-none focus:border-[#123b30]"
                        >
                          <option value="">-- Choose Existing Active Worker --</option>
                          {availableWorkers
                            .filter((w: any) =>
                              !workerSearchTerm ||
                              w.name.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
                              (w.specialty || "").toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
                              (w.phone || "").includes(workerSearchTerm)
                            )
                            .map((w: any) => (
                              <option key={w.id} value={w.id}>
                                {w.name} — {w.specialty || "All Services"} ({w.phone})
                              </option>
                            ))}
                        </select>

                        {/* Selected Worker Info Confirmation Card */}
                        {quoteForm.workerId && (
                          <div className="p-2.5 bg-[#f0f6ee] border border-[#cbe1c3] rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <strong className="text-[#123b30] block">{quoteForm.workerName}</strong>
                              <span className="text-[11px] text-[#48624d]">
                                {quoteForm.workerSpecialty ? `${quoteForm.workerSpecialty} • ` : ""}
                                {quoteForm.workerPhone}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold bg-[#d9ed89] text-[#123b30] px-2.5 py-0.5 rounded-full">
                              Worker #{quoteForm.workerId}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-[#f8faf5] border border-[#e5ebe4] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#718078] uppercase block">Editing Quote For</span>
                      <strong className="text-xs text-[#123b30]">{quoteForm.workerName}</strong>
                      <span className="text-[11px] text-[#718078] block font-mono">{quoteForm.workerPhone}</span>
                    </div>
                    {quoteForm.workerId && (
                      <span className="text-[10px] font-bold bg-[#e2ede0] text-[#123b30] px-2 py-0.5 rounded-full">
                        Worker #{quoteForm.workerId}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Charges Breakdown (Labour + Material + Other) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                      Labour (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={quoteForm.labourCharges}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, labourCharges: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] font-bold text-[#123b30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                      Material (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quoteForm.materialCharges}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, materialCharges: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] font-bold text-[#123b30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                      Other (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quoteForm.additionalCharges}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, additionalCharges: e.target.value }))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] font-bold text-[#123b30]"
                    />
                  </div>
                </div>

                {/* Total Quoted Amount (Auto-Calculated: Labour + Material + Other) */}
                <div className="p-3 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#718078] block">
                      Total Quoted Amount (Auto-Calculated)
                    </span>
                    <span className="text-[11px] text-[#48624d]">Labour + Material + Other</span>
                  </div>
                  <strong className="text-base font-black text-[#123b30]">
                    ₹{calculatedQuoteTotal}
                  </strong>
                </div>

                {/* Availability and Estimated Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                      Availability
                    </label>
                    <input
                      type="text"
                      value={quoteForm.availability}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, availability: e.target.value }))}
                      placeholder="e.g. Immediate / Today"
                      className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                      Est. Completion Time
                    </label>
                    <input
                      type="text"
                      value={quoteForm.estimatedCompletionTime}
                      onChange={(e) =>
                        setQuoteForm((f) => ({ ...f, estimatedCompletionTime: e.target.value }))
                      }
                      placeholder="e.g. 1-2 hours"
                      className="w-full px-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30]"
                    />
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    Internal Notes (Admin only)
                  </label>
                  <textarea
                    rows={2}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Worker comments from WhatsApp, specific requirements..."
                    className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e5ebe4]">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="btn btn-secondary text-xs py-2 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={acting || (!editingQuoteId && !quoteForm.workerId)}
                    className="btn btn-dark text-xs font-bold py-2 px-4 shadow-xs"
                  >
                    {acting ? "Saving..." : editingQuoteId ? "Update Quote" : `Save Quote (₹${calculatedQuoteTotal})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
