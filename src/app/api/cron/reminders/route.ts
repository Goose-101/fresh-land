import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendEmail, reminderEmailHtml } from "@/lib/email";

// Authorize: either Vercel's cron header (in production) OR an admin user
// (so admins can manually trigger from the dashboard for testing).
async function authorize(req: Request): Promise<{ ok: boolean; status?: number }> {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { ok: false, status: 403 };

  return { ok: true };
}

async function processDueReminders() {
  const admin = await createAdminClient();
  const nowIso = new Date().toISOString();

  // Pull all unfired reminders whose fire_at is in the past, with the user's
  // email joined in. Cap at 100 per run to avoid runaway batches.
  const { data: due, error } = await admin
    .from("reminders")
    .select("id, user_id, task_id, task_title, fire_at, note, profiles!inner(email, full_name)")
    .eq("email_sent", false)
    .lte("fire_at", nowIso)
    .limit(100);

  if (error) {
    console.error("[cron-reminders] fetch failed", error.message);
    return { processed: 0, sent: 0, errors: [error.message] };
  }

  const items = due || [];
  if (items.length === 0) return { processed: 0, sent: 0, errors: [] };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const errors: string[] = [];
  let sent = 0;

  for (const r of items) {
    const profile = (r as any).profiles;
    const email = profile?.email;
    if (!email) {
      // No email on file — mark sent anyway so we don't retry forever.
      await admin
        .from("reminders")
        .update({ email_sent: true, email_sent_at: nowIso })
        .eq("id", r.id);
      continue;
    }

    const result = await sendEmail({
      to: email,
      subject: `Reminder: ${r.task_title || "Pathway task"}`,
      html: reminderEmailHtml({
        taskTitle: r.task_title || "Pathway task",
        note: r.note,
        dashboardUrl: `${appUrl}/pathway`,
      }),
      text: `Reminder for ${r.task_title || "Pathway task"}.${r.note ? `\n\n${r.note}` : ""}\n\nOpen Fresh Land: ${appUrl}/pathway`,
    });

    if (!result.ok) {
      console.error(`[cron-reminders] send failed to ${email}: ${result.error}`);
      errors.push(`${r.id}: ${result.error}`);
      continue;
    }

    await admin
      .from("reminders")
      .update({ email_sent: true, email_sent_at: nowIso })
      .eq("id", r.id);
    sent += 1;
  }

  return { processed: items.length, sent, errors };
}

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  const result = await processDueReminders();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  return GET(req);
}
