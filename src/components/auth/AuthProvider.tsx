"use client";
import { ReactNode, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store";

const IDLE_TIMEOUT_MS = 12 * 60 * 60 * 1000;

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

      // Mark this session as active. The marker stays set during the entire
      // browser session and clears automatically when the browser closes.
      // We don't sign users out if the marker is missing — that would log out
      // existing users who signed in before this code was deployed. Users
      // stay signed in across navigations + reloads, and can sign out manually.
      try {
        sessionStorage.setItem("fl:auth:active", "1");
      } catch {}

      // Use a minimal user immediately so the UI never thinks they're signed out
      // while we wait for the profile fetch. We'll replace it with the real
      // profile once it arrives.
      const fallbackName =
        nameFromAuth(session.user.user_metadata) ||
        session.user.email?.split("@")[0] ||
        "Member";
      const minimalProfile = {
        id: session.user.id,
        full_name: fallbackName,
        email: session.user.email || "",
        avatar_url: (session.user.user_metadata?.avatar_url as string) || null,
        preferred_language: "en",
        city: "Atlanta",
        state: "GA",
        zip: null,
        needs: [],
        immigration_status: null,
        has_children: false,
        english_comfort: "medium",
        years_in_us: null,
        is_admin: false,
        onboarding_complete: false,
        created_at: session.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
      setUser(minimalProfile);

      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      // If profile row doesn't exist yet, create it now (self-heal).
      if (!profile) {
        const { data: created } = await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: fallbackName,
            avatar_url: minimalProfile.avatar_url,
          })
          .select("*")
          .maybeSingle();
        if (created) profile = created;
      }

      // Self-heal: if the profile is missing a name, copy it from auth metadata.
      if (profile && !profile.full_name?.trim()) {
        const recovered = nameFromAuth(session.user.user_metadata);
        if (recovered) {
          const { data: updated } = await supabase
            .from("profiles")
            .update({ full_name: recovered })
            .eq("id", session.user.id)
            .select("*")
            .maybeSingle();
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
        try { sessionStorage.removeItem("fl:auth:active"); } catch {}
        setUser(null);
        setSavedIds([]);
        setNotifications([]);
      } else if (event === "SIGNED_IN" && session) {
        // Mark this browser session as active. If the browser closes, this
        // marker is wiped and the next session-init forces a fresh sign-in.
        try { sessionStorage.setItem("fl:auth:active", "1"); } catch {}
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
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
