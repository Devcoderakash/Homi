/**
 * Centralized Admin API Client
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? "/api"
    : process.env.NODE_ENV === "production"
    ? "https://homi-v3nj.onrender.com/api"
    : "http://localhost:4000/api");

export async function adminRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  let token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  if (!token && typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )(?:sb-access-token|homi_admin_session)=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "homi_admin_session=; path=/; max-age=0; SameSite=Lax";
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return new Promise(() => {}) as Promise<T>;
        }
      }
      throw new Error(data?.error || data?.message || `Admin API Error (${response.status})`);
    }
    return data as T;
  } catch (err: any) {
    if (typeof window !== "undefined" && err.message?.includes("authorization required") && !window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return new Promise(() => {}) as Promise<T>;
    }
    throw err;
  }
}

export const adminApi = {
  // Stats & Dashboard
  getStats: () => adminRequest("/admin/stats"),
  getRecentRequests: () => adminRequest("/admin/dashboard/recent-requests"),
  getRecentApplications: () => adminRequest("/admin/dashboard/recent-applications"),

  // Service Requests
  getRequests: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    const qStr = query.toString() ? `?${query.toString()}` : "";
    return adminRequest(`/admin/requests${qStr}`);
  },
  getRequestById: (id: number) => adminRequest(`/admin/requests/${id}`),
  publishRequest: (id: number, notes?: string) =>
    adminRequest(`/admin/requests/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),
  rejectRequest: (id: number, reason: string) =>
    adminRequest(`/admin/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  assignWorker: (requestId: number, workerId: number, notes?: string) =>
    adminRequest(`/admin/requests/${requestId}/assign`, {
      method: "POST",
      body: JSON.stringify({ workerId, notes }),
    }),

  // Applications
  getApplications: (params?: { status?: string; requestId?: number; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.requestId) query.set("requestId", params.requestId.toString());
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    const qStr = query.toString() ? `?${query.toString()}` : "";
    return adminRequest(`/admin/applications${qStr}`);
  },
  getApplicationById: (id: number) => adminRequest(`/admin/applications/${id}`),
  shortlistApplication: (id: number) =>
    adminRequest(`/admin/applications/${id}/shortlist`, { method: "POST" }),
  rejectApplication: (id: number) =>
    adminRequest(`/admin/applications/${id}/reject`, { method: "POST" }),

  // Assignments
  getAssignments: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    const qStr = query.toString() ? `?${query.toString()}` : "";
    return adminRequest(`/admin/assignments${qStr}`);
  },

  // Categories
  getCategories: () => adminRequest("/admin/categories"),
  createCategory: (data: { name: string; slug: string; description?: string; icon?: string }) =>
    adminRequest("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: { name?: string; slug?: string; description?: string; icon?: string; active?: boolean }) =>
    adminRequest(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleCategory: (id: number) =>
    adminRequest(`/admin/categories/${id}/toggle`, { method: "PATCH" }),

  // Users Directory
  getCustomers: (q?: string) => adminRequest(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getWorkers: (q?: string) => adminRequest(`/admin/workers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  toggleWorkerAvailability: (id: number) => adminRequest(`/admin/workers/${id}/toggle`, { method: "PATCH" }),
  deleteWorker: (id: number) => adminRequest(`/admin/workers/${id}`, { method: "DELETE" }),

  // Reviews, Notifications & Audit Logs
  getReviews: () => adminRequest("/admin/reviews"),
  getNotifications: () => adminRequest("/admin/notifications"),
  markNotificationRead: (id: number) => adminRequest(`/admin/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => adminRequest("/admin/notifications/mark-all-read", { method: "POST" }),
  getAuditLogs: (limit = 50) => adminRequest(`/admin/audit-logs?limit=${limit}`),

  confirmWorkerAssignment: (requestId: number, workerId?: number) =>
    adminRequest(`/admin/requests/${requestId}/confirm-assignment`, {
      method: "POST",
      body: JSON.stringify({ workerId }),
    }),
  updateRequestStatus: (requestId: number, status: string, notes?: string) =>
    adminRequest(`/admin/requests/${requestId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    }),

  // WhatsApp Group Setting & Broadcast
  getWhatsAppGroupLink: () => adminRequest("/admin/settings/whatsapp-group"),
  updateWhatsAppGroupLink: (link: string) =>
    adminRequest("/admin/settings/whatsapp-group", {
      method: "PUT",
      body: JSON.stringify({ link }),
    }),
  getWhatsAppJobMessage: (requestId: number) =>
    adminRequest(`/admin/requests/${requestId}/whatsapp-message`),
  markSharedToWhatsApp: (requestId: number) =>
    adminRequest(`/admin/requests/${requestId}/mark-shared`, { method: "POST" }),

  // Worker Quotes (Admin entered)
  getWorkerQuotes: (requestId: number) => adminRequest(`/admin/requests/${requestId}/quotes`),
  createWorkerQuote: (requestId: number, data: any) =>
    adminRequest(`/admin/requests/${requestId}/quotes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateWorkerQuote: (requestId: number, quoteId: number, data: any) =>
    adminRequest(`/admin/requests/${requestId}/quotes/${quoteId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteWorkerQuote: (requestId: number, quoteId: number) =>
    adminRequest(`/admin/requests/${requestId}/quotes/${quoteId}`, { method: "DELETE" }),
  selectPreferredWorkerQuote: (requestId: number, quoteId: number) =>
    adminRequest(`/admin/requests/${requestId}/quotes/${quoteId}/select`, { method: "POST" }),

  // Final Customer Quotation
  sendCustomerQuote: (requestId: number, data: any) =>
    adminRequest(`/admin/requests/${requestId}/customer-quote`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Work Progress & Completion
  markWorkInProgress: (requestId: number, notes?: string) =>
    adminRequest(`/admin/requests/${requestId}/in-progress`, {
      method: "POST",
      body: JSON.stringify({ completionNote: notes }),
    }),
  markWorkCompleted: (requestId: number, notes?: string) =>
    adminRequest(`/admin/requests/${requestId}/complete`, {
      method: "POST",
      body: JSON.stringify({ completionNote: notes }),
    }),

  // Payment Verification & Settings
  getPaymentSettings: () => adminRequest("/admin/settings/payment"),
  updatePaymentSettings: (data: any) =>
    adminRequest("/admin/settings/payment", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  verifyPayment: (paymentId: number) =>
    adminRequest(`/admin/payments/${paymentId}/verify`, { method: "POST" }),
  rejectPayment: (paymentId: number, reason: string) =>
    adminRequest(`/admin/payments/${paymentId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getPayments: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    const qStr = query.toString() ? `?${query.toString()}` : "";
    return adminRequest(`/admin/payments${qStr}`);
  },

  // Auth
  login: (credentials: { email: string; password: string }) =>
    adminRequest("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  logout: () => adminRequest("/auth/logout", { method: "POST" }),
  getMe: () => adminRequest("/me"),
};
