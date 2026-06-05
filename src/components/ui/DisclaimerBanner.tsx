import { AlertTriangle, Info, Phone, Scale, Stethoscope, DollarSign } from "lucide-react";
import { resolveKey, type Messages } from "@/lib/i18n-utils";

type Kind = "legal" | "medical" | "emergency" | "financial";

const STYLES: Record<Kind, { wrap: string; icon: typeof AlertTriangle }> = {
  legal:     { wrap: "bg-blue-50 border-blue-200 text-blue-900",    icon: Scale },
  medical:   { wrap: "bg-rose-50 border-rose-200 text-rose-900",    icon: Stethoscope },
  emergency: { wrap: "bg-orange-50 border-orange-200 text-orange-900", icon: Phone },
  financial: { wrap: "bg-amber-50 border-amber-200 text-amber-900", icon: DollarSign },
};

export function DisclaimerBanner({
  kind,
  messages,
  className = "",
}: {
  kind: Kind;
  messages: Messages;
  className?: string;
}) {
  const style = STYLES[kind];
  const Icon = style.icon;
  const title = resolveKey(messages, `disclaimer.${kind}Title`);
  const body = resolveKey(messages, `disclaimer.${kind}Body`);

  return (
    <div
      role={kind === "emergency" ? "alert" : "note"}
      className={`flex gap-3 rounded-card border px-4 py-3 ${style.wrap} ${className}`}
    >
      <Icon className="h-5 w-5 mt-0.5 shrink-0" aria-hidden />
      <div className="text-sm leading-relaxed">
        <p className="font-semibold">{title}</p>
        <p className="opacity-90">{body}</p>
      </div>
    </div>
  );
}

export function categoryDisclaimerKind(slug: string | null | undefined): Kind | null {
  if (!slug) return null;
  if (slug === "legal") return "legal";
  if (slug === "healthcare") return "medical";
  if (slug === "emergency") return "emergency";
  if (slug === "financial") return "financial";
  return null;
}

export function InfoChangesNote({ messages, className = "" }: { messages: Messages; className?: string }) {
  return (
    <p className={`text-xs text-text-muted inline-flex items-center gap-1.5 ${className}`}>
      <Info className="h-3.5 w-3.5" aria-hidden />
      {resolveKey(messages, "disclaimer.infoCanChange")}
    </p>
  );
}
