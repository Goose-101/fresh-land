import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return !!data?.is_admin;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");
  const supabase = await createClient();

  if (action === "approve-post" && id) {
    await supabase.from("community_posts").update({ is_approved: true }).eq("id", id);
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (action === "restore-post" && id) {
    await supabase
      .from("community_posts")
      .update({ is_approved: true, report_count: 0 })
      .eq("id", id);
    await supabase.from("community_reports").delete().eq("post_id", id);
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (action === "delete-post" && id) {
    await supabase.from("community_posts").delete().eq("id", id);
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (action === "block-user" && id) {
    await supabase.from("profiles").update({ is_blocked: true }).eq("id", id);
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (action === "approve-review" && id) {
    await supabase.from("resource_reviews").update({ is_approved: true }).eq("id", id);
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return NextResponse.json({ error: "unknown" }, { status: 400 });
}