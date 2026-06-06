import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Make Supabase auth cookies session-only: clear maxAge and expires so the
// cookie disappears when the browser is closed. Users must re-sign-in after
// closing the browser, but stay signed in across page navigations + reloads.
function toSessionCookieOptions(options: CookieOptions): CookieOptions {
  const { maxAge: _ma, expires: _ex, ...rest } = options;
  return rest;
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, toSessionCookieOptions(options))
            );
          } catch {}
        },
      },
    }
  );
}

export async function createAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
