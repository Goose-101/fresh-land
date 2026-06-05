import { Resend } from "resend";

let _client: Resend | null = null;

function getClient(): Resend | null {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _client = new Resend(key);
  return _client;
}

const FROM_DEFAULT = process.env.RESEND_FROM || "Fresh Land <onboarding@resend.dev>";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY not configured" };

  try {
    const res = await client.emails.send({
      from: args.from || FROM_DEFAULT,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "send failed" };
  }
}

export function reminderEmailHtml(opts: {
  taskTitle: string;
  note?: string | null;
  dashboardUrl: string;
}): string {
  const safeTitle = escape(opts.taskTitle);
  const safeNote = opts.note ? escape(opts.note) : "";
  return `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h1 style="margin:0 0 6px;color:#065f46;font-size:20px;">Fresh Land reminder</h1>
    <p style="color:#475569;margin:0 0 18px;font-size:14px;">You set a reminder for this task:</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:18px;">
      <p style="margin:0;font-weight:600;color:#0f172a;">${safeTitle}</p>
      ${safeNote ? `<p style="margin:6px 0 0;color:#475569;font-size:14px;">${safeNote}</p>` : ""}
    </div>
    <a href="${opts.dashboardUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open Fresh Land</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">You're getting this because you scheduled a reminder. To turn these off, visit Settings &rarr; Notifications.</p>
  </div>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
