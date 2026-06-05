import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn("[reminders] POST unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, taskId, taskTitle, fireAt, note } = body as {
    id?: string;
    taskId: string;
    taskTitle?: string;
    fireAt: string;
    note?: string;
  };

  if (!taskId || !fireAt) {
    return NextResponse.json({ error: "taskId and fireAt required" }, { status: 400 });
  }

  const insert = {
    ...(id ? { id } : {}),
    user_id: user.id,
    task_id: taskId,
    task_title: taskTitle || null,
    fire_at: fireAt,
    note: note || null,
  };

  const { data, error } = await supabase
    .from("reminders")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    console.error("[reminders] insert failed", error.message, error.details);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("[reminders] saved", data.id, "for", user.email, "fires", data.fire_at);
  return NextResponse.json({ reminder: data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
