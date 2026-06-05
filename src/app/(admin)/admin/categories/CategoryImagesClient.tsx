"use client";
import { useState } from "react";
import Image from "next/image";
import { Upload, X, Link as LinkIcon, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/types";

const BUCKET = "category-images";

export function CategoryImagesClient({
  categories: initial,
}: {
  categories: Category[];
}) {
  const [categories, setCategories] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const updateLocal = (id: string, patch: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const saveImage = async (cat: Category, image_url: string | null, image_alt?: string | null) => {
    setBusy(cat.id);
    setError(null);
    const payload: Partial<Category> = { image_url };
    if (image_alt !== undefined) payload.image_alt = image_alt;
    const { error: dbErr } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", cat.id);
    setBusy(null);
    if (dbErr) {
      setError(`Save failed for ${cat.name}: ${dbErr.message}`);
      return false;
    }
    updateLocal(cat.id, payload);
    return true;
  };

  const onUploadFile = async (cat: Category, file: File) => {
    setBusy(cat.id);
    setError(null);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${cat.slug}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
    if (upErr) {
      setBusy(null);
      setError(`Upload failed: ${upErr.message}`);
      return;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    await saveImage(cat, pub.publicUrl);
  };

  const onPasteUrl = async (cat: Category, url: string) => {
    if (!url.trim()) return;
    await saveImage(cat, url.trim());
  };

  const onClear = async (cat: Category) => {
    await saveImage(cat, null, null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            busy={busy === cat.id}
            onUploadFile={(f) => onUploadFile(cat, f)}
            onPasteUrl={(u) => onPasteUrl(cat, u)}
            onSaveAlt={(alt) => saveImage(cat, cat.image_url, alt)}
            onClear={() => onClear(cat)}
          />
        ))}
      </ul>
    </div>
  );
}

function CategoryCard({
  cat,
  busy,
  onUploadFile,
  onPasteUrl,
  onSaveAlt,
  onClear,
}: {
  cat: Category;
  busy: boolean;
  onUploadFile: (f: File) => void;
  onPasteUrl: (u: string) => void;
  onSaveAlt: (alt: string) => void;
  onClear: () => void;
}) {
  const [urlDraft, setUrlDraft] = useState("");
  const [altDraft, setAltDraft] = useState(cat.image_alt || "");
  const [dragOver, setDragOver] = useState(false);

  return (
    <li className="rounded-card border border-border bg-white overflow-hidden">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) onUploadFile(file);
        }}
        className={`relative aspect-[16/9] bg-slate-100 transition ${dragOver ? "ring-2 ring-primary ring-inset" : ""}`}
      >
        {cat.image_url ? (
          <Image
            src={cat.image_url}
            alt={cat.image_alt || cat.name}
            fill
            className="object-cover"
            sizes="(min-width:768px) 50vw, 100vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-text-muted text-sm">
            Drag &amp; drop an image, or pick a file below
          </div>
        )}
        {cat.image_url && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{cat.name}</p>
          <span className="text-xs text-text-muted font-mono">{cat.slug}</span>
        </div>

        <div className="flex gap-2">
          <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-btn border border-border px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
            <Upload className="h-3.5 w-3.5" />
            {busy ? "Uploading…" : "Upload file"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="flex gap-2 items-center">
          <LinkIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <Input
            placeholder="Paste image URL"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="text-xs flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !urlDraft.trim()}
            onClick={() => {
              onPasteUrl(urlDraft);
              setUrlDraft("");
            }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            placeholder="Alt text (for accessibility)"
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            className="text-xs flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onSaveAlt(altDraft)}
          >
            Save
          </Button>
        </div>
      </div>
    </li>
  );
}