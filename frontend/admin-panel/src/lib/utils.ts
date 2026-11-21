import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupees(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "—";
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function formatRupeesExact(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "—";
  const rupees = (paise / 100).toFixed(2);
  return `₹${rupees}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function getStatusBadgeProps(status: string): { label: string; className: string } {
  switch (status?.toLowerCase()) {
    case "completed":
    case "received":
    case "approved":
    case "active":
    case "verified":
    case "confirmed":
      return { label: status, className: "bg-[#eaf5e5] text-[#285437] border-[#d6e9d3]" };
    case "in_progress":
    case "on_the_way":
    case "accepted":
    case "claimed":
    case "scheduled":
    case "shortlisted":
    case "assigned":
      return { label: status.replace(/_/g, " "), className: "bg-[#e8f1fe] text-[#205493] border-[#cbe0fd]" };
    case "open":
    case "open_for_applications":
    case "pending":
    case "pending_admin_review":
    case "reported":
    case "awaiting_confirmation":
      return { label: status.replace(/_/g, " "), className: "bg-[#fef9c3] text-[#854d0e] border-[#fef08a]" };
    case "cancelled":
    case "unpaid":
    case "declined":
    case "rejected":
    case "suspended":
    case "inactive":
      return { label: status, className: "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]" };
    default:
      return { label: status || "unknown", className: "bg-[#f0f4ee] text-[#41534a] border-[#e5ebe4]" };
  }
}

export function exportToCsv(
  filename: string,
  dataOrHeaders: Record<string, any>[] | string[],
  maybeRows?: (string | number)[][]
) {
  const sanitizeCell = (val: any) => {
    const str = String(val ?? "");
    const safe = /^[\s]*[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  let headers: string[] = [];
  let rows: (string | number)[][] = [];

  if (Array.isArray(dataOrHeaders) && dataOrHeaders.length > 0 && typeof dataOrHeaders[0] === "object" && !Array.isArray(dataOrHeaders[0])) {
    const records = dataOrHeaders as Record<string, any>[];
    headers = Object.keys(records[0]);
    rows = records.map((rec) => headers.map((h) => rec[h]));
  } else if (Array.isArray(dataOrHeaders) && maybeRows) {
    headers = dataOrHeaders as string[];
    rows = maybeRows;
  }

  const csvContent =
    "\ufeff" +
    [headers, ...rows]
      .map((row) => row.map(sanitizeCell).join(","))
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const finalFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
