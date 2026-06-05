import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const uid = user.id;

  await admin.from("ai_conversations").delete().eq("user_id", uid);
  await admin.from("saved_resources").delete().eq("user_id", uid);
  await admin.from("notifications").delete().eq("user_id", uid);
  await admin.from("community_replies").delete().eq("user_id", uid);
  await admin.from("community_reports").delete().eq("reporter_id", uid);
  await admin.from("community_posts").delete().eq("user_id", uid);
  await admin.from("resource_reviews").delete().eq("user_id", uid);
  await admin.from("user_progress").delete().eq("user_id", uid);
  await admin.from("profiles").delete().eq("id", uid);

  const { error: authErr } = await admin.auth.admin.deleteUser(uid);
  if (authErr) {
    console.error("[account-delete] auth user delete failed", authErr.message);
    return NextResponse.json({ error: "auth_delete_failed" }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
