import { SignupForm } from "@/components/auth/SignupForm";
import { getServerMessages, resolveKey, formatMessage } from "@/lib/i18n";

export const metadata = { title: "Create account — Fresh Land" };

export default async function SignupPage() {
  const { messages } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  return (
    <>
      <h1 className="text-2xl font-semibold text-center mb-2">{t("auth.createAccount")}</h1>
      <p className="text-sm text-text-secondary text-center mb-6">
        {t("auth.createAccountBody")}
      </p>
      <SignupForm />
    </>
  );
}
