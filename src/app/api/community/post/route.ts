import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side community post creation. Browser-to-Supabase connections can
// hang on bad networks or token refresh issues. Routing through this Next.js
// server endpoint means the heavy lifting (DB insert, FK checks, RLS) happens
// inside the Vercel function via a direct server-to-Supabase connection,
// which is far more reliable than the browser path.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      category_id,
      resource_id,
      image_url,
      language,
    }: {
      title?: string | null;
      content?: string;
      category_id?: string | null;
      resource_id?: string | null;
      image_url?: string | null;
      language?: string;
    } = body || {};

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "not signed in" }, { status: 401 });
    }

    // Self-heal profile right before insert — guarantees the FK check on
    // community_posts.user_id always succeeds.
    await supabase
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          email: authUser.email,
          full_name:
            (authUser.user_metadata?.full_name as string)?.trim() ||
            (authUser.user_metadata?.name as string)?.trim() ||
            authUser.email?.split("@")[0] ||
            "Member",
          avatar_url: (authUser.user_metadata?.avatar_url as string) || null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    const insertPayload: Record<string, any> = {
      user_id: authUser.id,
      category_id: category_id || null,
      title: title || null,
      content: content || "",
      language: language || "en",
    };
    if (resource_id) insertPayload.resource_id = resource_id;
    if (image_url) insertPayload.image_url = image_url;

    const { data, error } = await supabase
      .from("community_posts")
      .insert(insertPayload)
      .select(
        "*, author:profiles(id, full_name, avatar_url), category:categories(*), resource:resources(id, name, phone, category:categories(slug))"
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}
