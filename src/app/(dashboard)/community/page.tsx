import { createClient } from "@/lib/supabase/server";
import { CommunityClient } from "./CommunityClient";
import { getServerMessages, resolveKey } from "@/lib/i18n";

// Always fetch fresh so newly added resources show up in the org credit search.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Community — Fresh Land" };

export default async function CommunityPage() {
  const supabase = await createClient();
  const { messages } = await getServerMessages();
  const t = (key: string) => resolveKey(messages, key);

  // The middleware already gates /community on auth, so authUser should be
  // present here. Pass it to the client so posting never depends on the
  // Zustand store being hydrated.
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const [{ data: posts }, { data: categories }, { data: resources }, { data: replies }] = await Promise.all([
    supabase
      .from("community_posts")
      .select(
        "*, author:profiles(id, full_name, avatar_url), category:categories(*), resource:resources(id, name, phone, category:categories(slug))"
      )
      .eq("is_approved", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("categories").select("*").eq("is_active", true).order("display_order"),
    supabase.from("resources").select("id, name, phone").eq("is_active", true).order("name").limit(2000),
    supabase
      .from("community_replies")
      .select("*, author:profiles(full_name, avatar_url)")
      .eq("is_approved", true)
      .order("created_at", { ascending: true }),
  ]);

  const repliesByPost = new Map<string, any[]>();
  for (const r of replies || []) {
    if (!r.post_id) continue;
    if (!repliesByPost.has(r.post_id)) repliesByPost.set(r.post_id, []);
    repliesByPost.get(r.post_id)!.push(r);
  }
  const postsWithReplies = (posts || []).map((p: any) => ({
    ...p,
    replies: repliesByPost.get(p.id) || [],
  }));

  return (
    <div className="max-w-2xl mx-auto p-5 md:p-8 space-y-6" translate="no">
      <div>
        <h1 className="text-3xl font-semibold">{t("community.title")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("community.body")}</p>
      </div>
      <CommunityClient
        initialPosts={postsWithReplies}
        categories={categories || []}
        resources={resources || []}
        currentUserId={authUser?.id || null}
      />
    </div>
  );
}