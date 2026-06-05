"use client";
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, MessageSquare, Trash2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store";

type R = any;

export function AdminResourcesClient({ initialResources, categories }: { initialResources: R[]; categories: any[] }) {
  const { showToast } = useAppStore();
  const [rows, setRows] = useState<R[]>(initialResources);
  const [editing, setEditing] = useState<R | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [reviewsFor, setReviewsFor] = useState<R | null>(null);

  const supabase = createClient();

  const toggle = async (id: string, field: string, value: boolean) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: !value } : r)));
    await supabase.from("resources").update({ [field]: !value }).eq("id", id);
  };

  const syncGoogle = async (r: R) => {
    if (!r.google_place_id) return showToast("error", "No Google Place ID set.");
    setSyncing(r.id);
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: r.id, placeId: r.google_place_id }),
    });
    setSyncing(null);
    if (res.ok) {
      showToast("success", "Synced with Google.");
      const { data } = await supabase.from("resources").select("*, category:categories(*)").eq("id", r.id).single();
      if (data) setRows((p) => p.map((x) => (x.id === r.id ? data : x)));
    } else {
      showToast("error", "Sync failed.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Resources</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      </div>

      <div className="bg-white rounded-card border border-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">City</th>
              <th className="p-3">Active</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Clicks</th>
              <th className="p-3">Saves</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.category?.name}</td>
                <td className="p-3">{r.city}</td>
                <td className="p-3">
                  <button onClick={() => toggle(r.id, "is_active", r.is_active)}>
                    <Badge variant={r.is_active ? "success" : "muted"}>{r.is_active ? "Yes" : "No"}</Badge>
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => toggle(r.id, "is_verified", r.is_verified)}>
                    <Badge variant={r.is_verified ? "success" : "muted"}>{r.is_verified ? "Yes" : "No"}</Badge>
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => toggle(r.id, "is_featured", r.is_featured)}>
                    <Badge variant={r.is_featured ? "warning" : "muted"}>{r.is_featured ? "Yes" : "No"}</Badge>
                  </button>
                </td>
                <td className="p-3 text-text-muted">{r.click_count}</td>
                <td className="p-3 text-text-muted">{r.save_count}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReviewsFor(r)}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reviews
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => syncGoogle(r)} disabled={syncing === r.id}>
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing === r.id ? "animate-spin" : ""}`} />
                    Sync
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ResourceFormModal
          resource={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={(r) => {
            if (editing) setRows((p) => p.map((x) => (x.id === r.id ? r : x)));
            else setRows((p) => [r, ...p]);
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      {reviewsFor && (
        <AdminReviewsModal
          resource={reviewsFor}
          onClose={() => setReviewsFor(null)}
        />
      )}
    </div>
  );
}

function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-0.5"
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
        >
          <Star
            className={`h-5 w-5 ${i <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

const SOURCE_OPTIONS = [
  { value: "manual", label: "Fresh Land (curated)" },
  { value: "google", label: "Google" },
  { value: "yelp", label: "Yelp" },
  { value: "facebook", label: "Facebook" },
  { value: "site", label: "Their website" },
  { value: "news", label: "News article" },
];

function AdminReviewsModal({ resource, onClose }: { resource: any; onClose: () => void }) {
  const { showToast } = useAppStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [source, setSource] = useState("manual");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/reviews?resourceId=${resource.id}`);
      const json = await res.json();
      if (!cancelled) {
        setReviews(json.reviews || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resource.id]);

  const add = async () => {
    if (!authorName.trim() || !text.trim()) {
      showToast("error", "Author name and review text are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId: resource.id,
        authorName,
        rating,
        text,
        source,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast("error", err?.error || "Failed to add review.");
      return;
    }
    const { review } = await res.json();
    setReviews((p) => [review, ...p]);
    setAuthorName("");
    setText("");
    setRating(5);
    setSource("manual");
    showToast("success", "Review added.");
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast("error", "Failed to delete.");
      return;
    }
    setReviews((p) => p.filter((r) => r.id !== id));
  };

  return (
    <Modal open onClose={onClose} title={`Reviews — ${resource.name}`} size="lg">
      <div className="bg-slate-50 rounded-card border border-border p-4 mb-5">
        <h4 className="font-semibold mb-3 text-sm">Add a review</h4>
        <p className="text-xs text-text-muted mb-3">
          Paste a review you've copied from anywhere — Google, the org's website, news quote, etc. Pick the source so users know where it came from.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Author name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. Maria S."
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Source</label>
            <select
              className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium block mb-1.5">Rating</label>
          <StarsInput value={rating} onChange={setRating} />
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <label className="text-sm font-medium">Review text</label>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the review here…"
            className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={add} loading={saving}>
            <Plus className="h-4 w-4" /> Add review
          </Button>
        </div>
      </div>

      <h4 className="font-semibold mb-2 text-sm">
        Existing reviews ({reviews.length})
      </h4>
      {loading ? (
        <p className="text-sm text-text-muted py-3">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-text-muted py-3">
          No reviews yet. Add one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 border border-border rounded-card p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{r.author_name || "Anonymous"}</span>
                  <span className="inline-flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    ))}
                  </span>
                  <Badge variant="muted">{r.source || "manual"}</Badge>
                </div>
                {r.text && (
                  <p className="text-sm text-text-secondary mt-1 line-clamp-3">
                    {r.text}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(r.id)}
                className="p-1.5 text-text-muted hover:text-red-600 rounded-btn hover:bg-red-50"
                aria-label="Delete review"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ResourceFormModal({
  resource,
  categories,
  onClose,
  onSaved,
}: {
  resource: R | null;
  categories: any[];
  onClose: () => void;
  onSaved: (r: R) => void;
}) {
  const { showToast } = useAppStore();
  const [form, setForm] = useState<any>(
    resource || {
      name: "",
      description: "",
      short_description: "",
      category_id: categories[0]?.id,
      website_url: "",
      phone: "",
      address: "",
      city: "Atlanta",
      state: "GA",
      zip: "",
      google_place_id: "",
      languages: ["en"],
      is_free: true,
      serves_undocumented: true,
      is_active: true,
    }
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const query = resource
      ? supabase.from("resources").update(form).eq("id", resource.id).select("*, category:categories(*)").single()
      : supabase.from("resources").insert(form).select("*, category:categories(*)").single();
    const { data, error } = await query;
    setSaving(false);
    if (error || !data) {
      showToast("error", error?.message || "Save failed.");
      return;
    }
    onSaved(data);
    showToast("success", "Saved.");
  };

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <Modal open onClose={onClose} title={resource ? "Edit resource" : "New resource"} size="lg">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Category</label>
          <select
            className="rounded-btn border border-border px-3 py-2.5 text-sm"
            value={form.category_id || ""}
            onChange={(e) => set("category_id", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Input label="Phone" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
        <Input label="Website" value={form.website_url || ""} onChange={(e) => set("website_url", e.target.value)} />
        <Input label="Address" value={form.address || ""} onChange={(e) => set("address", e.target.value)} className="sm:col-span-2" />
        <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
        <Input label="Zip" value={form.zip || ""} onChange={(e) => set("zip", e.target.value)} />
        <Input label="Google Place ID" value={form.google_place_id || ""} onChange={(e) => set("google_place_id", e.target.value)} className="sm:col-span-2" />
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-medium">Short description</label>
          <textarea
            rows={2}
            value={form.short_description || ""}
            onChange={(e) => set("short_description", e.target.value)}
            className="rounded-btn border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="rounded-btn border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <div className="sm:col-span-2 grid grid-cols-3 gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.is_free} onChange={(e) => set("is_free", e.target.checked)} /> Free
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.serves_undocumented} onChange={(e) => set("serves_undocumented", e.target.checked)} /> Undoc friendly
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active
          </label>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving} className="ml-auto">Save</Button>
      </div>
    </Modal>
  );
}
