import api from "./api";
import type { Customer } from "../types";

export class CustomerService {
  static async getCustomers(query?: string, limit = 100, offset = 0) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    const res = await api.get<{ customers: Customer[] }>(`/admin/customers?${params.toString()}`);
    return res.customers || [];
  }
}
