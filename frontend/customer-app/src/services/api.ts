/**
 * Centralized API Client for Customer & Worker Application (frontend/customer-app)
 * Interacts exclusively with the Express.js Backend via REST APIs.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:4000/api");

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  token?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, token, headers, ...rest } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (!(rest.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      credentials: "include", // Supports HttpOnly session cookies
      signal: controller.signal,
    });

    clearTimeout(timer);

    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else if (contentType?.includes("text/") || contentType?.includes("calendar")) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    if (!response.ok) {
      const errorMessage =
        data && typeof data === "object" && "error" in data
          ? data.error
          : `Request failed with status ${response.status}`;
      throw new ApiClientError(response.status, errorMessage, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new ApiClientError(408, "Request timed out. Please try again.");
    }
    if (err instanceof ApiClientError) {
      throw err;
    }
    throw new ApiClientError(500, err.message || "Network request failed.");
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),

  // Worker marketplace helpers
  getAvailableJobs: (params?: { category?: string; maxDistance?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.maxDistance) query.set("maxDistance", params.maxDistance.toString());
    const qStr = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<{ jobs: any[] }>(`/v1/worker/jobs${qStr}`);
  },

  getJobDetails: (id: number) =>
    apiRequest<{ job: any }>(`/v1/worker/jobs/${id}`),

  applyForJob: (id: number, payload: { expectedCharges?: number; note?: string; estimatedArrival?: string }) =>
    apiRequest<{ ok: boolean; application: any }>(`/v1/worker/jobs/${id}/apply`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyApplications: () =>
    apiRequest<{ applications: any[] }>("/v1/worker/applications"),

  withdrawApplication: (id: number) =>
    apiRequest(`/v1/worker/applications/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

export default api;
