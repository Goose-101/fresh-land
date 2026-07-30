import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Use @supabase/ssr's default (persistent) cookies so users stay signed in
  // across navigations, reloads, and browser restarts — like most sites. This
  // also keeps the browser and server cookie settings consistent, which avoids
  // the token-refresh hiccups that were logging users out mid-session.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
