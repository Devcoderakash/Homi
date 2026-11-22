import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://lgwwkkjbgdwmsubjagva.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd3dra2piZ2R3bXN1YmphZ3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMzMxNTIsImV4cCI6MjExMDgwOTE1Mn0.GwTEphXD8pMwMUJOJB0VtMl9O3t9s-Dt9TJR1-3V-JY";

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes("placeholder-project") &&
    !supabaseUrl.includes("your-project") &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey.length > 20
  );
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "unconfigured-placeholder-key",
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function syncAdminSessionCookie(accessToken: string | null) {
  if (typeof document === "undefined") return;
  if (accessToken) {
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `homi_admin_session=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    try {
      localStorage.setItem("admin_token", accessToken);
    } catch {}
  } else {
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "homi_admin_session=; path=/; max-age=0; SameSite=Lax";
    try {
      localStorage.removeItem("admin_token");
    } catch {}
  }
}

// Auto-sync Supabase session changes to cookies and localStorage for admin APIs
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      syncAdminSessionCookie(session.access_token);
    } else if (event === "SIGNED_OUT") {
      syncAdminSessionCookie(null);
    }
  });
}
