import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SavedClient } from "./SavedClient";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerMessages, resolveKey, formatMessage } from "@/lib/i18n";

export const metadata = { title: "Saved — Fresh Land" };

export default async function SavedPage() {
  const supabase = await createClient();
  const { messages } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: saved } = await supabase
    .from("saved_resources")
    .select("id, saved_at, resource:resources(*, category:categories(*))")
    .eq("user_id", authUser.id)
    .order("saved_at", { ascending: false });

  const items = (saved || []).filter((s: any) => s.resource);

  return (
    <div className="max-w-5xl mx-auto p-5 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold inline-flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" /> {t("saved.title")}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("saved.subtitle")}
          <span className="ml-2 inline-block bg-primary-light text-primary-dark rounded-pill px-2 py-0.5 text-xs font-semibold">
            {t("saved.countBadge", { count: items.length })}
          </span>
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-card border border-dashed border-border p-12 text-center">
          <Heart className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-lg font-semibold">{t("saved.emptyTitle")}</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
            {t("saved.emptyBody")}
          </p>
          <Link href="/resources" className="inline-block mt-5">
            <Button>{t("action.browse")}</Button>
          </Link>
        </div>
      ) : (
        <SavedClient items={items as any} />
      )}
    </div>
  );
}
