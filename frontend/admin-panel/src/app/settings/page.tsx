"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Lock,
  Server,
  Shield,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Globe,
  Radio,
  ExternalLink,
  MessageSquare,
  CreditCard,
  QrCode,
  Building,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { useAuth } from "../../contexts/AuthContext";
import { AuthService } from "../../services/auth.service";
import { adminApi } from "../../services/adminApi";

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // WhatsApp Group Link Settings
  const [whatsappLink, setWhatsappLink] = useState("");
  const [loadingLink, setLoadingLink] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState("");
  const [linkError, setLinkError] = useState("");

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "homi@upi",
    payeeName: "Homi Everyday Care",
    qrCodeUrl: "/images/payment-qr.jpg",
    bankAccountHolder: "Homi Platform Operations",
    bankName: "State Bank of India",
    accountNumber: "409281726354",
    ifsc: "SBIN0001234",
    branch: "Arera Colony Branch, Bhopal",
    enableUpi: true,
    enableBank: true,
  });
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // DPDP Grievance Officer Settings (DPDP Act 2023)
  const [grievanceOfficer, setGrievanceOfficer] = useState({
    name: "Grievance Officer (Designated)",
    designation: "Data Protection & Grievance Redressal Officer",
    email: "grievance@homi.local",
    phone: "+91 755 000 0000",
    address: "Homi Platform Operations, Arera Colony, Bhopal, MP - 462016, India",
  });
  const [loadingGrievance, setLoadingGrievance] = useState(true);
  const [savingGrievance, setSavingGrievance] = useState(false);
  const [grievanceSuccess, setGrievanceSuccess] = useState("");
  const [grievanceError, setGrievanceError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoadingLink(true);
        const res = await adminApi.getWhatsAppGroupLink();
        if (res?.link) {
          setWhatsappLink(res.link);
        }
      } catch (err: any) {
        console.warn("Could not load WhatsApp group link:", err);
      } finally {
        setLoadingLink(false);
      }

      try {
        setLoadingPayment(true);
        const payRes = await adminApi.getPaymentSettings();
        if (payRes?.settings) {
          setPaymentSettings({
            upiId: payRes.settings.upiId || "homi@upi",
            payeeName: payRes.settings.payeeName || "Homi Everyday Care",
            qrCodeUrl: payRes.settings.qrCodeUrl || "/images/payment-qr.jpg",
            bankAccountHolder: payRes.settings.bankAccountHolder || "Homi Platform Operations",
            bankName: payRes.settings.bankName || "State Bank of India",
            accountNumber: payRes.settings.accountNumber || "409281726354",
            ifsc: payRes.settings.ifsc || "SBIN0001234",
            branch: payRes.settings.branch || "Arera Colony Branch, Bhopal",
            enableUpi: payRes.settings.enableUpi ?? true,
            enableBank: payRes.settings.enableBank ?? true,
          });
        }
      } catch (err: any) {
        console.warn("Could not load payment settings:", err);
      } finally {
        setLoadingPayment(false);
      }

      try {
        setLoadingGrievance(true);
        const gRes = await adminApi.getGrievanceOfficer();
        if (gRes?.officer) {
          setGrievanceOfficer({
            name: gRes.officer.name || "Grievance Officer (Designated)",
            designation: gRes.officer.designation || "Data Protection & Grievance Redressal Officer",
            email: gRes.officer.email || "grievance@homi.local",
            phone: gRes.officer.phone || "+91 755 000 0000",
            address: gRes.officer.address || "Homi Platform Operations, Arera Colony, Bhopal, MP - 462016, India",
          });
        }
      } catch (err: any) {
        console.warn("Could not load Grievance Officer:", err);
      } finally {
        setLoadingGrievance(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveGrievanceOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrievanceError("");
    setGrievanceSuccess("");
    setSavingGrievance(true);
    try {
      await adminApi.updateGrievanceOfficer(grievanceOfficer);
      setGrievanceSuccess("Grievance Officer details updated successfully! These details are now live on the Customer Privacy & Grievance page.");
    } catch (err: any) {
      setGrievanceError(err.message || "Failed to update Grievance Officer");
    } finally {
      setSavingGrievance(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentSuccess("");
    setSavingPayment(true);
    try {
      const res = await adminApi.updatePaymentSettings(paymentSettings);
      if (res?.settings) {
        setPaymentSettings(res.settings);
      }
      setPaymentSuccess("Payment details updated successfully! Customers will see these details for work completion payments.");
    } catch (err: any) {
      setPaymentError(err.message || "Failed to update payment settings");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveWhatsAppLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");

    const trimmed = whatsappLink.trim();
    if (!trimmed) {
      setLinkError("Please enter a WhatsApp group invite link.");
      return;
    }

    if (!/^https:\/\/(chat\.whatsapp\.com|wa\.me)\/[a-zA-Z0-9_-]+/i.test(trimmed)) {
      setLinkError("Invalid WhatsApp invite link format. Must start with https://chat.whatsapp.com/ (e.g. https://chat.whatsapp.com/L1234567890abcdef)");
      return;
    }

    setSavingLink(true);
    try {
      const res = await adminApi.updateWhatsAppGroupLink(trimmed);
      setWhatsappLink(res.link);
      setLinkSuccess("WhatsApp Workers Group link saved successfully.");
    } catch (err: any) {
      setLinkError(err.message || "Failed to save WhatsApp group link.");
    } finally {
      setSavingLink(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      setPasswordSuccess("Admin password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#123b30]">
            Settings & System Status
          </h2>
          <p className="text-xs text-[#718078] mt-0.5">
            Manage administrator profile credentials, security policies, and review platform architecture health.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Profile Overview */}
          <div className="homi-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e5ebe4]">
              <div className="p-2.5 rounded-lg bg-[#f0f4ee] text-[#123b30]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123b30]">
                  Administrator Profile
                </h3>
                <p className="text-xs text-[#718078]">Authenticated superuser details</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#f0f4ee]">
                <span className="text-[#718078]">Full Name</span>
                <span className="font-extrabold text-[#123b30]">{user?.fullName || "Platform Admin"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#f0f4ee]">
                <span className="text-[#718078]">Email Address</span>
                <span className="font-mono font-medium text-[#183c31]">{user?.email || "admin@homi.local"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#f0f4ee]">
                <span className="text-[#718078]">Security Role</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#d9ed89] text-[#123b30]">
                  SUPER_ADMIN
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#718078]">Access Scope</span>
                <span className="font-semibold text-[#183c31]">Full Marketplace & Dispatch</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="homi-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e5ebe4]">
              <div className="p-2.5 rounded-lg bg-[#f0f4ee] text-[#123b30]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123b30]">
                  Update Password
                </h3>
                <p className="text-xs text-[#718078]">Enhance console account security</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-[#eaf5e5] border border-[#d6e9d3] text-[#285437] text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#183c31] font-bold mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] focus:bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[#183c31] font-bold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] focus:bg-white"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-[#183c31] font-bold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] focus:bg-white"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="btn btn-dark w-full py-2.5 text-xs font-bold shadow-xs mt-2"
              >
                {savingPassword ? "Updating Password..." : "Save New Password"}
              </button>
            </form>
          </div>
        </div>

        {/* WhatsApp Workers Group Link Configuration */}
        <div className="homi-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366]">
                <MessageSquare className="w-5 h-5 text-[#1b7e47]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123b30]">
                  WhatsApp Workers Group Link
                </h3>
                <p className="text-xs text-[#718078]">
                  Invite link to the official WhatsApp broadcast group for verified local field technicians
                </p>
              </div>
            </div>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f0f4ee] hover:bg-[#e2e8df] text-[#123b30] border border-[#e5ebe4] transition-colors"
              >
                <span>Test Link (Open Group)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <form onSubmit={handleSaveWhatsAppLink} className="space-y-3">
            {linkSuccess && (
              <div className="flex items-center gap-2 p-3 bg-[#f0f7f2] border border-[#d2e7d7] text-[#1c4b2b] rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#285437] shrink-0" />
                <span>{linkSuccess}</span>
              </div>
            )}

            {linkError && (
              <div className="flex items-center gap-2 p-3 bg-[#fdf2f2] border border-[#f5c6c6] text-[#991b1b] rounded-lg text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#183c31] uppercase tracking-wider mb-1">
                WhatsApp Group Invite URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/L1234567890abcdef"
                  disabled={loadingLink || savingLink}
                  className="w-full px-3.5 py-2.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs outline-none focus:border-[#123b30] focus:bg-white font-mono text-[#123b30]"
                />
              </div>
              <p className="text-[11px] text-[#718078] mt-1.5">
                When you click <strong>Send to WhatsApp Group</strong> inside any service request details page, this link will be opened so you can copy and post the preformatted job details.
              </p>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingLink || loadingLink}
                className="btn btn-dark px-5 py-2.5 text-xs font-bold shadow-xs"
              >
                {savingLink ? "Saving Link..." : "Save WhatsApp Group Link"}
              </button>
            </div>
          </form>
        </div>

        {/* Payment Details Configuration (UPI & Bank Details for Customers) */}
        <div className="homi-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#123b30] text-[#d9ed89]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123b30]">
                  Payment Settings & Bank Account Details
                </h3>
                <p className="text-xs text-[#718078]">
                  Configure official UPI ID and Bank Transfer details presented to customers upon work completion
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-4 text-xs">
            {paymentSuccess && (
              <div className="flex items-center gap-2 p-3 bg-[#f0f7f2] border border-[#d2e7d7] text-[#1c4b2b] rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#285437] shrink-0" />
                <span>{paymentSuccess}</span>
              </div>
            )}

            {paymentError && (
              <div className="flex items-center gap-2 p-3 bg-[#fdf2f2] border border-[#f5c6c6] text-[#991b1b] rounded-lg text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* UPI Settings */}
            <div className="p-4 bg-[#f8faf5] border border-[#e5ebe4] rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#123b30]" />
                <h4 className="font-extrabold text-[#123b30] text-xs uppercase tracking-wide">
                  UPI Payment Details
                </h4>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    UPI ID (Virtual Payment Address) *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.upiId}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, upiId: e.target.value }))}
                    placeholder="e.g. homi@upi"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs font-mono text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    Payee Name / Business Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.payeeName}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, payeeName: e.target.value }))}
                    placeholder="e.g. Homi Everyday Care"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>
              </div>

              {/* Active Payment QR Preview */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 border-t border-[#e5ebe4]">
                <div className="w-24 h-24 rounded-xl bg-white border border-[#dce9d7] p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentSettings.qrCodeUrl || "/images/payment-qr.jpg"}
                    alt="Active UPI Payment QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-[#123b30]">
                    Active Customer Payment QR Code
                  </p>
                  <p className="text-[11px] text-[#526e57]">
                    Customers see this QR code on their request payment screen once work is completed.
                  </p>
                  <p className="text-[10px] font-mono text-[#718078]">
                    Source: {paymentSettings.qrCodeUrl || "/images/payment-qr.jpg"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Transfer Settings */}
            <div className="p-4 bg-[#f8faf5] border border-[#e5ebe4] rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-[#123b30]" />
                <h4 className="font-extrabold text-[#123b30] text-xs uppercase tracking-wide">
                  Bank Transfer Details (NEFT / IMPS)
                </h4>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.bankAccountHolder}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, bankAccountHolder: e.target.value }))}
                    placeholder="e.g. Homi Platform Operations"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.bankName}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, bankName: e.target.value }))}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.accountNumber}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="e.g. 409281726354"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs font-mono text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.ifsc}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs font-mono uppercase text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                    Branch Name & City *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.branch}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, branch: e.target.value }))}
                    placeholder="e.g. Arera Colony Branch, Bhopal"
                    className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingPayment || loadingPayment}
                className="btn btn-dark px-6 py-2.5 text-xs font-bold shadow-xs"
              >
                {savingPayment ? "Saving Payment Details..." : "Save Payment Details"}
              </button>
            </div>
          </form>
        </div>

        {/* DPDP Act 2023 — Data Protection & Grievance Officer Settings */}
        <div className="homi-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#eef7ee] text-[#285437]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123b30]">
                  DPDP Act 2023 — Grievance Officer &amp; Privacy Management
                </h3>
                <p className="text-xs text-[#718078]">
                  Statutory data protection details displayed to customers on the Privacy &amp; Grievance Redressal page
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-[#eef7ee] text-[#285437] rounded-full border border-[#d4ead0]">
              DPDP Rules 2025 Compliant
            </span>
          </div>

          {grievanceSuccess && (
            <div className="p-3 bg-[#eef7ee] border border-[#c3e2be] text-[#285437] rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{grievanceSuccess}</span>
            </div>
          )}

          {grievanceError && (
            <div className="p-3 bg-[#fdf2f2] border border-[#f5c6cb] text-[#b3483b] rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{grievanceError}</span>
            </div>
          )}

          <form onSubmit={handleSaveGrievanceOfficer} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                  Officer Name *
                </label>
                <input
                  type="text"
                  required
                  value={grievanceOfficer.name}
                  onChange={(e) => setGrievanceOfficer((g) => ({ ...g, name: e.target.value }))}
                  placeholder="e.g. Grievance Officer (Designated)"
                  className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  value={grievanceOfficer.designation}
                  onChange={(e) => setGrievanceOfficer((g) => ({ ...g, designation: e.target.value }))}
                  placeholder="e.g. Data Protection & Grievance Redressal Officer"
                  className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={grievanceOfficer.email}
                  onChange={(e) => setGrievanceOfficer((g) => ({ ...g, email: e.target.value }))}
                  placeholder="e.g. grievance@homi.local"
                  className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs font-mono text-[#123b30] outline-none focus:border-[#123b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={grievanceOfficer.phone}
                  onChange={(e) => setGrievanceOfficer((g) => ({ ...g, phone: e.target.value }))}
                  placeholder="e.g. +91 755 000 0000"
                  className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs font-mono text-[#123b30] outline-none focus:border-[#123b30]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-[#718078] uppercase mb-1">
                  Official Postal Address *
                </label>
                <input
                  type="text"
                  required
                  value={grievanceOfficer.address}
                  onChange={(e) => setGrievanceOfficer((g) => ({ ...g, address: e.target.value }))}
                  placeholder="e.g. Homi Platform Operations, Arera Colony, Bhopal, MP - 462016, India"
                  className="w-full px-3 py-2 bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#123b30] outline-none focus:border-[#123b30]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-[11px] text-[#718078]">
                Changes are updated instantly in the Supabase database and reflected on the live customer Privacy page.
              </p>
              <button
                type="submit"
                disabled={savingGrievance || loadingGrievance}
                className="btn btn-dark px-6 py-2.5 text-xs font-bold shadow-xs"
              >
                {savingGrievance ? "Saving Grievance Officer..." : "Save Grievance Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Platform Architecture & Services Health */}
        <div className="homi-card p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#e5ebe4]">
            <div className="p-2 rounded-lg bg-[#f0f4ee] text-[#123b30]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#123b30]">
                Platform Architecture Topology
              </h3>
              <p className="text-xs text-[#718078]">Connected micro-services and database topology</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4] space-y-1">
              <span className="text-[10px] text-[#718078] font-bold uppercase tracking-wider">Customer Frontend</span>
              <p className="font-extrabold text-[#123b30]">Next.js 16 (App Router)</p>
              <p className="text-[11px] text-[#285437] font-bold">Port 3000 • Operational</p>
            </div>

            <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4] space-y-1">
              <span className="text-[10px] text-[#718078] font-bold uppercase tracking-wider">Admin Panel</span>
              <p className="font-extrabold text-[#123b30]">Next.js 16 (App Router)</p>
              <p className="text-[11px] text-[#285437] font-bold">Port 3001 • Operational</p>
            </div>

            <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4] space-y-1">
              <span className="text-[10px] text-[#718078] font-bold uppercase tracking-wider">Backend API Server</span>
              <p className="font-extrabold text-[#123b30]">Go (Golang) + Gin</p>
              <p className="text-[11px] text-[#285437] font-bold">Port 4000 • Healthy</p>
            </div>

            <div className="p-3.5 bg-[#f8faf5] rounded-xl border border-[#e5ebe4] space-y-1">
              <span className="text-[10px] text-[#718078] font-bold uppercase tracking-wider">Database Engine</span>
              <p className="font-extrabold text-[#123b30]">Supabase PostgreSQL (RLS)</p>
              <p className="text-[11px] text-[#285437] font-bold">Port 5432 • Connected</p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
