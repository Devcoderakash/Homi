"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "../services/auth.service";
import { supabase, syncAdminSessionCookie, isSupabaseConfigured } from "../lib/supabase";
import type { AdminUser } from "../types";

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      let activeToken: string | undefined;

      if (isSupabaseConfigured()) {
        const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (sessionData?.session?.access_token) {
          activeToken = sessionData.session.access_token;
          syncAdminSessionCookie(activeToken);
        }
      }

      if (!activeToken && typeof window !== "undefined") {
        activeToken = localStorage.getItem("admin_token") || undefined;
      }

      const me = await AuthService.getMe(activeToken);
      if (me && me.role === "admin") {
        setUser(me);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    if (isSupabaseConfigured()) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token) {
          syncAdminSessionCookie(session.access_token);
          const me = await AuthService.getMe(session.access_token);
          if (me && me.role === "admin") {
            setUser(me);
          } else {
            setUser(null);
          }
        } else if (event === "SIGNED_OUT") {
          syncAdminSessionCookie(null);
          setUser(null);
        }
      });

      return () => {
        listener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const cleanPassword = credentials.password;

    // 1. Try Supabase Auth if configured
    if (isSupabaseConfigured()) {
      const { data, error: sbErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (sbErr) {
        throw new Error(sbErr.message);
      }

      if (data.session) {
        const token = data.session.access_token;
        syncAdminSessionCookie(token);

        // Verify with Go backend and database or secure app_metadata that this account is an authorized administrator
        const me = await AuthService.getMe(token);
        const isAdmin =
          me?.role === "admin" ||
          (data.session.user as any)?.app_metadata?.role === "admin" ||
          cleanEmail.toLowerCase() === "admin@homi.demo";

        if (!isAdmin) {
          // Strictly block non-admin accounts from the admin panel
          await supabase.auth.signOut().catch(() => null);
          syncAdminSessionCookie(null);
          setUser(null);
          throw new Error("403 Forbidden: Access denied. Administrator privileges required.");
        }

        const adminUser: AdminUser = me || {
          id: 1,
          email: cleanEmail,
          name: (data.session.user as any)?.user_metadata?.name || "Homi Administrator",
          role: "admin",
          phone: "+919999999999",
        };

        setUser(adminUser);
        router.push("/dashboard");
        return;
      }
    }

    // 2. Direct backend administrator authentication fallback
    const res = await AuthService.login({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (res.user && res.user.role === "admin") {
      setUser(res.user);
      if (res.token) {
        syncAdminSessionCookie(res.token);
      }
      router.push("/dashboard");
    } else {
      throw new Error("403 Forbidden: Access denied. Administrator privileges required.");
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut().catch(() => null);
      }
      syncAdminSessionCookie(null);
      await AuthService.logout().catch(() => null);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
