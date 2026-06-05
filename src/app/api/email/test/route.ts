import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await sendEmail({
    to: user.email,
    subject: "Fresh Land — test email",
    text: "This is a test email from Fresh Land. If you got this, email is working.",
    html: `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 6px;color:#065f46;font-size:20px;">Email is working ✅</h1>
    <p style="color:#475569;margin:0 0 12px;font-size:14px;">This is a test email from Fresh Land. If you're reading this, your Resend setup is configured correctly.</p>
    <p style="color:#94a3b8;margin:0;font-size:12px;">Sent at ${new Date().toUTCString()}</p>
  </div>
</body></html>`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
