import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "success" | "warning" | "error" | "info" | "muted";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-primary-light text-primary-dark",
  success: "bg-primary-light text-primary-dark",
  warning: "bg-amber-50 text-amber-800",
  error: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  muted: "bg-slate-50 text-slate-500",
};

export function Badge({ variant = "default", className, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
