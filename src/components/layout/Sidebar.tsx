"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Home, Compass, BookMarked, Users, Heart, Settings, LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/I18nProvider";
import { usePathwayReminderCount } from "@/components/pathway/PathwayReminderBadge";

export function Sidebar() {
  const pathname = usePathname();
  const { user, setUser } = useAppStore();
  const { t } = useT();
  const pathwayReminderCount = usePathwayReminderCount();

  // Self-heal: if user isn't in the store, fetch from Supabase so the greeting
  // block always shows. The dashboard SSR has the user — but the sidebar is
  // client-side and only learns about the user through Zustand.
  useEffect(() => {
    if (user) return;
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (cancelled || !authUser) return;

        const fallbackName =
          (authUser.user_metadata?.full_name as string)?.trim() ||
          (authUser.user_metadata?.name as string)?.trim() ||
          authUser.email?.split("@")[0] ||
          "Member";

        setUser({
          id: authUser.id,
          full_name: fallbackName,
          email: authUser.email || "",
          avatar_url: null,
          preferred_language: "en",
          city: "Atlanta",
          state: "GA",
        } as any);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();
        if (!cancelled && profile) setUser(profile);
      } catch {
        // Render still proceeds — greeting block just stays hidden.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setUser]);

  const nav = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: Home },
    { href: "/pathway", label: t("nav.pathway"), icon: Compass },
    { href: "/resources", label: t("nav.resources"), icon: BookMarked },
    { href: "/community", label: t("nav.community"), icon: Users },
    { href: "/saved", label: t("nav.saved"), icon: Heart },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const onSignOutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setUser(null);
    try {
      const supabase = createClient();
      supabase.auth.signOut().catch(() => {});
    } catch {}
    window.location.href = "/api/auth/signout";
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-border sticky top-0 h-screen">
      <div className="px-6 py-5">
        <Logo />
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const showBadge = href === "/pathway" && pathwayReminderCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition",
                active
                  ? "bg-primary-light text-primary-dark"
                  : "text-text-secondary hover:bg-slate-50"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="min-w-[20px] h-5 grid place-items-center rounded-full bg-primary text-white text-[10px] font-bold leading-none px-1.5">
                  {pathwayReminderCount > 9 ? "9+" : pathwayReminderCount}
                </span>
              )}
            </Link>
          );
        })}
        {user?.is_admin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium mt-2",
              pathname.startsWith("/admin")
                ? "bg-amber-50 text-amber-800"
                : "text-text-secondary hover:bg-slate-50"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {t("nav.admin")}
          </Link>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-xs text-text-muted">Theme</span>
          <ThemeToggle />
        </div>
        {user && (() => {
          const fullName =
            user.full_name?.trim() ||
            user.preferred_name?.trim() ||
            user.email?.split("@")[0] ||
            "Member";
          return (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-9 w-9 rounded-full bg-primary-light text-primary-dark grid place-items-center font-semibold text-sm shrink-0 overflow-hidden">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  fullName[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName}</p>
                <p className="text-xs text-text-muted truncate">{user.email || `${user.city || "Atlanta"}, ${user.state || "GA"}`}</p>
              </div>
            </div>
          );
        })()}
        <a
          href="/api/auth/signout"
          onClick={onSignOutClick}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm text-text-secondary hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" /> {t("action.signOut")}
        </a>
      </div>
    </aside>
  );
}
