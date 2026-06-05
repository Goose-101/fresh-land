"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/login`,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    setSent(true);
  };

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-semibold text-center mb-2">{t("auth.sentTitle")}</h1>
        <p className="text-sm text-text-secondary text-center mb-6">
          {t("auth.sentBody", { email })}
        </p>
        <Link href="/login">
          <Button variant="outline" fullWidth>{t("action.backToSignIn")}</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-center mb-2">{t("auth.resetTitle")}</h1>
      <p className="text-sm text-text-secondary text-center mb-6">
        {t("auth.resetBody")}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {err && <p className="text-sm text-error">{err}</p>}
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          {t("action.sendResetLink")}
        </Button>
        <p className="text-sm text-center">
          <Link href="/login" className="text-primary hover:underline">{t("action.backToSignIn")}</Link>
        </p>
      </form>
    </>
  );
}
