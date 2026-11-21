import api from "./api";
import type { AdminUser } from "../types";

export class AuthService {
  static async login(credentials: { email: string; password: string }) {
    const res = await api.post<{ ok: boolean; role: string; token?: string; user?: AdminUser }>("/auth/login", {
      ...credentials,
      action: "login",
    });
    return res;
  }

  static async logout() {
    return api.post<{ ok: boolean }>("/auth/logout");
  }

  static async getMe(token?: string): Promise<AdminUser | null> {
    try {
      const res = await api.get<{ user: AdminUser | null }>("/me", token ? { token } : undefined);
      return res.user;
    } catch {
      return null;
    }
  }

  static async changePassword(currentPassword: string, newPassword: string) {
    return api.post<{ ok: boolean }>("/auth/password", {
      currentPassword,
      newPassword,
    });
  }
}
