"use client";
import { ReactNode, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store";

const IDLE_TIMEOUT_MS = 20 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, setUser, setSavedIds, setNotifications, setCurrentLanguage } = useAppStore();

  useEffect(() => {
    const supabase = createClient();

    // Pull a usable display name from auth metadata (covers email signup,
    // Google, Apple, etc. — different providers use different key names).
    const nameFromAuth = (meta: Record<string, unknown> | undefined): string | null => {
      if (!meta) return null;
      const candidates = [
        meta.full_name,
        meta.name,
        meta.display_name,
        [meta.given_name, meta.family_name].filter(Boolean).join(" "),
      ];
      for (const c of candidates) {
        if (typeof c === "string" && c.trim()) return c.trim();
      }
      return null;
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        const m = document.cookie.match(/language=([^;]+)/);
        if (m) setCurrentLanguage(m[1]);
        return;
      }

      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      // Self-heal: if the profile is missing a name, copy it from the auth
      // metadata so the sidebar shows the real name instead of "You".
      if (profile && !profile.full_name?.trim()) {
        const recovered = nameFromAuth(session.user.user_metadata);
        if (recovered) {
          const { data: updated } = await supabase
            .from("profiles")
            .update({ full_name: recovered })
            .eq("id", session.user.id)
            .select("*")
            .single();
          if (updated) profile = updated;
        }
      }

      if (profile) {
        setUser(profile);
        setCurrentLanguage(profile.preferred_language || "en");

        const [{ data: saved }, { data: notifs }] = await Promise.all([
          supabase.from("saved_resources").select("resource_id").eq("user_id", session.user.id),
          supabase.from("notifications").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
        ]);
        setSavedIds((saved || []).map((s) => s.resource_id));
        setNotifications(notifs || []);
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setSavedIds([]);
        setNotifications([]);
      } else if (event === "SIGNED_IN" && session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) setUser(profile);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [setUser, setSavedIds, setNotifications, setCurrentLanguage]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        supabase.auth.signOut();
      }, IDLE_TIMEOUT_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession();
        resetIdle();
      }
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", resetIdle);

    resetIdle();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", resetIdle);
    };
  }, [user]);

  return <>{children}</>;
}
