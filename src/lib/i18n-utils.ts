export type Messages = Record<string, any>;

export function resolveKey(messages: Messages, key: string, fallback?: string): string {
  const parts = key.split(".");
  let cur: any = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return fallback ?? key;
  }
  return typeof cur === "string" ? cur : fallback ?? key;
}

export function formatMessage(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
