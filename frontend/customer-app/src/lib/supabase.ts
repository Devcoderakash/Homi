import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes("placeholder-project") &&
    !supabaseUrl.includes("your-project") &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes("placeholder")
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function syncSessionCookie(accessToken: string | null) {
  if (typeof document === "undefined") return;
  if (accessToken) {
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `homi_session=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    try {
      localStorage.setItem("homi_token", accessToken);
    } catch {}
  } else {
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "homi_session=; path=/; max-age=0; SameSite=Lax";
    try {
      localStorage.removeItem("homi_token");
    } catch {}
  }
}

// Auto-sync Supabase session changes to cookies for seamless API access
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      syncSessionCookie(session.access_token);
    } else if (event === "SIGNED_OUT") {
      syncSessionCookie(null);
    }
  });
}
