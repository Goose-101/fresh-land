"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";
import { useAppStore } from "@/store";
import { Mail } from "lucide-react";

const CODE_LEN = 8;

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const { showToast } = useAppStore();

  const email = params.get("email") || "";
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const code = digits.join("");
  const codeReady = code.length === CODE_LEN && /^\d+$/.test(code);

  const setDigit = (idx: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = clean;
      return next;
    });
    if (clean && idx < CODE_LEN - 1) inputs.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LEN);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, CODE_LEN - 1)]?.focus();
  };

  const onKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const verify = async () => {
    if (!codeReady || !email) return;
    setVerifying(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) {
        showToast(
          "error",
          t("auth.verifyInvalid", undefined, "That code didn't work. Check it and try again.")
        );
        setDigits(Array(CODE_LEN).fill(""));
        inputs.current[0]?.focus();
        return;
      }
      showToast("success", t("auth.verifySuccess", undefined, "Email verified."));
      router.push("/onboarding?start=1");
      router.refresh();
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
      });
      if (error) {
        showToast("error", error.message);
        return;
      }
      showToast("success", t("auth.codeResent", undefined, "New code sent. Check your inbox."));
      setCooldown(45);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          {t("auth.verifyTitle", undefined, "Verify your email")}
        </h1>
        <p className="text-sm text-text-secondary">
          {t(
            "auth.verifyNoEmail",
            undefined,
            "We don't know which email to verify. Please start signup again."
          )}
        </p>
        <Button onClick={() => router.push("/signup")}>
          {t("action.backToSignUp", undefined, "Back to sign up")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-light grid place-items-center text-primary mb-3">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">
          {t("auth.verifyTitle", undefined, "Verify your email")}
        </h1>
        <p className="text-sm text-text-secondary mt-2">
          {t(
            "auth.verifyBody",
            undefined,
            "We sent a 6-digit code to"
          )}{" "}
          <span className="font-medium text-text">{email}</span>
        </p>
      </div>

      <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={onKeyDown(i)}
            className="h-12 w-9 sm:h-14 sm:w-11 text-center text-xl sm:text-2xl font-semibold rounded-btn border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <Button
        fullWidth
        variant="primary"
        onClick={verify}
        loading={verifying}
        disabled={!codeReady}
      >
        {t("auth.verifyButton", undefined, "Verify email")}
      </Button>

      <div className="text-center text-sm text-text-secondary">
        {t("auth.didntGet", undefined, "Didn't get a code?")}{" "}
        <button
          type="button"
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {cooldown > 0
            ? t("auth.resendIn", { sec: cooldown }, `Resend in ${cooldown}s`)
            : t("auth.resend", undefined, "Resend it")}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-muted">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
