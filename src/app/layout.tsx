import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toast } from "@/components/ui/Toast";
import { ReminderBanner } from "@/components/ui/ReminderBanner";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { I18nProvider } from "@/components/I18nProvider";
import { getServerMessages } from "@/lib/i18n";
import { getLangDir } from "@/lib/i18n-config";

export const metadata: Metadata = {
  title: "Fresh Land — Essential services for newcomers in Atlanta",
  description:
    "Free guide to housing, legal aid, employment, healthcare, education, and more — in your language, near you.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, messages } = await getServerMessages();
  const dir = getLangDir(lang);

  return (
    <html lang={lang} dir={dir} translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body>
        <I18nProvider lang={lang} messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toast />
              <ReminderBanner />
              <AIAssistant />
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
