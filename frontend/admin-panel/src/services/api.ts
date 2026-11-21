/**
 * Centralized API Client for Admin Panel
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:4000/api");

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  token?: string;
}

export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, token, headers, ...rest } = options;

  let url: string;
  if (endpoint.startsWith("http")) {
    url = endpoint;
  } else {
    const base = API_BASE_URL.replace(/\/$/, "");
    const cleanEndpoint = endpoint.replace(/^\//, "");
    url = `${base}/${cleanEndpoint}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (!(rest.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null);
  if (authToken) {
    defaultHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timer);

    const contentType = res.headers.get("content-type");
    let data: any;

    if (contentType?.includes("application/json")) {
      data = await res.json();
    } else if (contentType?.includes("text/") || contentType?.includes("calendar")) {
      data = await res.text();
    } else {
      data = await res.blob();
    }

    if (!res.ok) {
      const msg = data && typeof data === "object" && "error" in data ? data.error : `Request failed (${res.status})`;
      throw new ApiError(res.status, msg, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new ApiError(408, "Request timed out. Please try again.");
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, err.message || "Network request failed.");
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export default api;
