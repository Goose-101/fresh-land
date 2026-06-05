"use client";
import { useAppStore } from "@/store";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toast, clearToast } = useAppStore();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-primary" />,
    error: <XCircle className="h-5 w-5 text-error" />,
    info: <Info className="h-5 w-5 text-info" />,
  };

  const borderColor = {
    success: "border-primary/30",
    error: "border-error/30",
    info: "border-info/30",
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div
        className={cn(
          "flex items-center gap-3 bg-white shadow-modal border rounded-card px-4 py-3 min-w-[280px]",
          borderColor[toast.type]
        )}
      >
        {icons[toast.type]}
        <p className="text-sm text-text flex-1">{toast.message}</p>
        <button
          onClick={clearToast}
          className="p-1 rounded hover:bg-slate-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
}
