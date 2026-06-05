"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookMarked, Heart, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();
  const items = [
    { href: "/dashboard", label: t("nav.home"), icon: Home },
    { href: "/resources", label: t("nav.find"), icon: BookMarked },
    { href: "/saved", label: t("nav.saved"), icon: Heart },
    { href: "/community", label: t("nav.community"), icon: Users },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border grid grid-cols-5 h-16">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-xs",
              active ? "text-primary" : "text-text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
