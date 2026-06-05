import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md bg-white rounded-card shadow-card border border-border p-8">
        {children}
      </div>
    </div>
  );
}
