import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Cookies the browser client sets directly should also be session-only.
      // Browser closes → cookie gone → middleware sees no user → /login.
      cookieOptions: {
        path: "/",
        sameSite: "lax",
      },
    }
  );
}
