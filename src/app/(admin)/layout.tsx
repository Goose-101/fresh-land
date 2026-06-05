import Link from "next/link";
import { ShieldCheck, Home, Database, ImageIcon } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Logo />
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-pill px-2 py-0.5">
            <ShieldCheck className="h-3 w-3" /> Admin
          </span>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/admin" className="px-3 py-1.5 rounded-btn hover:bg-slate-50 inline-flex items-center gap-1.5">
              <Home className="h-4 w-4" /> Overview
            </Link>
            <Link href="/admin/resources" className="px-3 py-1.5 rounded-btn hover:bg-slate-50 inline-flex items-center gap-1.5">
              <Database className="h-4 w-4" /> Resources
            </Link>
            <Link href="/admin/categories" className="px-3 py-1.5 rounded-btn hover:bg-slate-50 inline-flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4" /> Category images
            </Link>
            <Link href="/dashboard" className="px-3 py-1.5 rounded-btn hover:bg-slate-50 text-text-secondary">
              Exit
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
