import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Database, MessagesSquare, Flag, ShieldAlert } from "lucide-react";
import { RunRemindersButton } from "./RunRemindersButton";

export const metadata = { title: "Admin — Fresh Land" };

export default async function AdminPage() {
  const supabase = await createClient();
  const [
    { count: users },
    { count: resources },
    { count: hiddenPosts },
    { count: pendingReviews },
    { count: openReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("resource_reviews").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("community_reports").select("*", { count: "exact", head: true }),
  ]);

  const { data: hidden } = await supabase
    .from("community_posts")
    .select("*, author:profiles(id, full_name, is_blocked)")
    .eq("is_approved", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentReports } = await supabase
    .from("community_reports")
    .select("*, post:community_posts(id, title, content, report_count), reporter:profiles!community_reports_reporter_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: pendReviews } = await supabase
    .from("resource_reviews")
    .select("*, resource:resources(name)")
    .eq("is_approved", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Admin overview</h1>
        <RunRemindersButton />
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { label: "Users", value: users || 0, Icon: Users },
          { label: "Resources", value: resources || 0, Icon: Database },
          { label: "Hidden posts", value: hiddenPosts || 0, Icon: MessagesSquare },
          { label: "Open reports", value: openReports || 0, Icon: ShieldAlert },
          { label: "Pending reviews", value: pendingReviews || 0, Icon: Flag },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-card border border-border p-4">
            <m.Icon className="h-5 w-5 text-primary" />
            <p className="text-2xl font-semibold mt-2">{m.value}</p>
            <p className="label">{m.label}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Hidden posts (auto-hidden by reports)</h2>
          <Link href="/admin/resources" className="text-sm text-primary hover:underline">
            Manage resources →
          </Link>
        </div>
        {hidden?.length ? (
          <ul className="divide-y divide-border">
            {hidden.map((p: any) => (
              <li key={p.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {p.title && <p className="font-medium">{p.title}</p>}
                  <p className="text-xs text-text-muted">
                    by {p.author?.full_name || "Anonymous"} · {p.report_count || 0} reports
                    {p.author?.is_blocked && <span className="ml-2 text-red-600">blocked</span>}
                  </p>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">{p.content}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <form action={`/api/admin?action=restore-post&id=${p.id}`} method="POST">
                    <button type="submit" className="text-xs font-medium text-primary hover:underline">
                      Restore
                    </button>
                  </form>
                  <form action={`/api/admin?action=delete-post&id=${p.id}`} method="POST">
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                  {p.author?.id && !p.author?.is_blocked && (
                    <form action={`/api/admin?action=block-user&id=${p.author.id}`} method="POST">
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        Block user
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No hidden posts.</p>
        )}
      </section>

      <section className="bg-white rounded-card border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent reports</h2>
        {recentReports?.length ? (
          <ul className="divide-y divide-border">
            {recentReports.map((r: any) => (
              <li key={r.id} className="py-3">
                <p className="text-sm">
                  <strong>{r.reporter?.full_name || "Anonymous"}</strong> reported:{" "}
                  <span className="text-text-secondary">{r.reason}</span>
                </p>
                {r.post && (
                  <p className="text-xs text-text-muted mt-0.5">
                    on post: {r.post.title || r.post.content?.slice(0, 80) || "(no title)"}
                  </p>
                )}
                {r.note && <p className="text-sm text-text-secondary mt-1">"{r.note}"</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No reports yet.</p>
        )}
      </section>

      <section className="bg-white rounded-card border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Moderation queue — reviews</h2>
        {pendReviews?.length ? (
          <ul className="divide-y divide-border">
            {pendReviews.map((r: any) => (
              <li key={r.id} className="py-3">
                <p className="text-sm"><strong>{r.author_name || "Anonymous"}</strong> on {r.resource?.name}</p>
                <p className="text-xs text-text-muted mt-0.5">Rating: {r.rating}/5</p>
                <p className="text-sm text-text-secondary mt-1">{r.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No reviews waiting.</p>
        )}
      </section>
    </div>
  );
}