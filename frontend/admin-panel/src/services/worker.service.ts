import api from "./api";
import type { Worker } from "../types";

export class WorkerService {
  static async getWorkers(query?: string, limit = 100, offset = 0) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    const res = await api.get<{ workers: Worker[] }>(`/admin/workers?${params.toString()}`);
    return res.workers || [];
  }

  static async toggleAvailability(workerId: number) {
    const res = await api.patch<{ ok: boolean; worker: { id: number; available: boolean } }>(
      `/admin/workers/${workerId}/toggle`
    );
    return res.worker;
  }

  static async deleteWorker(workerId: number) {
    const res = await api.delete<{ ok: boolean; message?: string }>(
      `/admin/workers/${workerId}`
    );
    return res;
  }
}
