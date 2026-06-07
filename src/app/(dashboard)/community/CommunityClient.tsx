"use client";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pin,
  MessageCircle,
  Plus,
  ImagePlus,
  X,
  MoreHorizontal,
  Flag,
  Phone,
  Send,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

type Resource = { id: string; name: string; phone?: string | null; category?: { slug: string } | null };
type Reply = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: { full_name?: string | null; avatar_url?: string | null } | null;
};
type Post = {
  id: string;
  user_id: string;
  title?: string | null;
  content: string;
  image_url?: string | null;
  is_pinned?: boolean;
  created_at: string;
  author?: { id: string; full_name?: string | null; avatar_url?: string | null } | null;
  category?: { id: string; name: string; slug: string } | null;
  resource?: Resource | null;
  replies?: Reply[];
};

type Props = {
  initialPosts: Post[];
  categories: { id: string; name: string; slug: string }[];
  resources: Resource[];
};

const REPORT_REASONS = ["spam", "harassment", "misinformation", "offtopic", "other"] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

function displayName(author: { full_name?: string | null } | null | undefined, fallback: string) {
  return author?.full_name?.trim() || fallback;
}

export function CommunityClient({ initialPosts, categories, resources }: Props) {
  const { user, showToast, currentLanguage } = useAppStore();
  const { t } = useT();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reportFor, setReportFor] = useState<{ postId: string } | null>(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {t("community.feedHint", undefined, "Share a win, credit a resource that helped, or ask the community a question.")}
        </p>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus className="h-4 w-4" /> {t("community.newPost", undefined, "New post")}
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-card border border-dashed border-border p-10 text-center">
          <p className="text-text-secondary">
            {t("community.empty", undefined, "No stories yet — be the first to share one.")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id || null}
              currentLanguage={currentLanguage}
              onReport={() => setReportFor({ postId: post.id })}
              onDelete={async () => {
                const ok = window.confirm(
                  t("community.deleteConfirm", undefined, "Delete this post? This cannot be undone.")
                );
                if (!ok) return;
                const supabase = createClient();
                const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
                if (error) {
                  showToast("error", t("community.deleteFailed", undefined, "Could not delete post."));
                  return;
                }
                setPosts((prev) => prev.filter((p) => p.id !== post.id));
                showToast("success", t("community.deleted", undefined, "Post deleted."));
              }}
              onReplyAdded={(reply) =>
                setPosts((prev) =>
                  prev.map((p) => (p.id === post.id ? { ...p, replies: [...(p.replies || []), reply] } : p))
                )
              }
              onUpdated={(patch) => {
                setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...patch } : p)));
                showToast("success", t("community.editSaved", undefined, "Post updated."));
              }}
              onUpdateError={(msg) => showToast("error", msg)}
            />
          ))}
        </div>
      )}

      <Composer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        categories={categories}
        resources={resources}
        userId={user?.id || null}
        currentLanguage={currentLanguage}
        onCreated={(post) => setPosts((prev) => [post, ...prev])}
        onError={(msg) => showToast("error", msg)}
        onSuccess={(msg) => showToast("success", msg)}
        onRefetch={async () => {
          const supabase = createClient();
          const [postsRes, repliesRes] = await Promise.all([
            supabase
              .from("community_posts")
              .select(
                "*, author:profiles(id, full_name, avatar_url), category:categories(*), resource:resources(id, name, phone, category:categories(slug))"
              )
              .eq("is_approved", true)
              .order("is_pinned", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(50),
            supabase
              .from("community_replies")
              .select("*, author:profiles(full_name, avatar_url)")
              .eq("is_approved", true)
              .order("created_at", { ascending: true }),
          ]);
          if (!postsRes.data) return;
          const repliesByPost = new Map<string, any[]>();
          for (const r of repliesRes.data || []) {
            if (!r.post_id) continue;
            if (!repliesByPost.has(r.post_id)) repliesByPost.set(r.post_id, []);
            repliesByPost.get(r.post_id)!.push(r);
          }
          const hydrated = postsRes.data.map((p: any) => ({
            ...p,
            replies: repliesByPost.get(p.id) || [],
          }));
          setPosts(hydrated as unknown as Post[]);
        }}
      />

      <ReportModal
        open={!!reportFor}
        onClose={() => setReportFor(null)}
        postId={reportFor?.postId || null}
        userId={user?.id || null}
        onReported={() => showToast("success", t("community.reportThanks", undefined, "Thanks — we'll review this post."))}
        onError={(msg) => showToast("error", msg)}
      />
    </>
  );
}

// =============================================================
// Post card — photo-first layout with resource chip and comments
// =============================================================
function PostCard({
  post,
  currentUserId,
  currentLanguage,
  onReport,
  onDelete,
  onReplyAdded,
  onUpdated,
  onUpdateError,
}: {
  post: Post;
  currentUserId: string | null;
  currentLanguage: string;
  onReport: () => void;
  onDelete: () => void;
  onReplyAdded: (reply: Reply) => void;
  onUpdated: (patch: { title?: string | null; content?: string }) => void;
  onUpdateError: (msg: string) => void;
}) {
  const { t } = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);

  const EDIT_WORD_LIMIT = 100;
  const editWordCount = editContent.trim() ? editContent.trim().split(/\s+/).length : 0;
  const editOverLimit = editWordCount > EDIT_WORD_LIMIT;

  const beginEdit = () => {
    setEditTitle(post.title || "");
    setEditContent(post.content || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle(post.title || "");
    setEditContent(post.content || "");
  };

  const saveEdit = async () => {
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();
    if (!trimmedTitle && !trimmedContent && !post.image_url) {
      onUpdateError(t("community.needsTitleOrPhoto", undefined, "Add a title, photo, or story before posting."));
      return;
    }
    if (editOverLimit) {
      onUpdateError(t("community.storyTooLong", undefined, "Your story must be 100 words or fewer."));
      return;
    }
    setSavingEdit(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("community_posts")
      .update({ title: trimmedTitle || null, content: trimmedContent })
      .eq("id", post.id);
    setSavingEdit(false);
    if (error) {
      onUpdateError(`Edit failed: ${error.message}`);
      return;
    }
    onUpdated({ title: trimmedTitle || null, content: trimmedContent });
    setIsEditing(false);
  };

  const sendReply = async () => {
    if (!currentUserId || !replyText.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_replies")
      .insert({
        post_id: post.id,
        user_id: currentUserId,
        content: replyText.trim(),
        language: currentLanguage,
      })
      .select("*, author:profiles(full_name, avatar_url)")
      .single();
    setSending(false);
    if (error || !data) return;
    onReplyAdded(data as Reply);
    setReplyText("");
  };

  const replies = post.replies || [];
  const anonLabel = t("community.anonymous", undefined, "Anonymous");
  const authorName = displayName(post.author, anonLabel);
  const authorInitial = authorName?.[0]?.toUpperCase() || "U";
  const isOwn = !!currentUserId && currentUserId === post.user_id;

  return (
    <article className="bg-white rounded-card border border-border overflow-hidden">
      <header className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div className="h-9 w-9 rounded-full bg-primary-light text-primary-dark grid place-items-center font-semibold text-sm shrink-0">
          {authorInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{authorName}</p>
            {post.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
          </div>
          <p className="text-xs text-text-muted">{timeAgo(post.created_at)}</p>
        </div>
        <div className="relative">
          <button
            className="p-1.5 rounded-btn hover:bg-slate-100 text-text-secondary"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t("community.postMenu", undefined, "Post menu")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-card shadow-modal z-20 py-1">
                {isOwn ? (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        beginEdit();
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t("community.editPost", undefined, "Edit post")}
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("community.deletePost", undefined, "Delete post")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onReport();
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {t("community.reportPost", undefined, "Report post")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {isEditing && (
        <div className="px-5 pb-3 flex flex-col gap-2 border-t border-border pt-3 bg-primary-light/20">
          <Input
            label={t("community.titleLabel", undefined, "Title")}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder={t("community.titlePlaceholder", undefined, "First day of school, help with emergency call…")}
          />
          <div>
            <label className="label">{t("community.storyLabel", undefined, "Your story")}</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full rounded-btn border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className={`text-xs mt-1 ${editOverLimit ? "text-error" : "text-text-muted"}`}>
              {editWordCount}/{EDIT_WORD_LIMIT} {t("community.words", undefined, "words")}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={savingEdit}>
              {t("action.cancel", undefined, "Cancel")}
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={savingEdit || editOverLimit}>
              {savingEdit
                ? t("community.saving", undefined, "Saving…")
                : t("action.save", undefined, "Save")}
            </Button>
          </div>
        </div>
      )}

      {!isEditing && post.content && (
        <div className="px-5 pb-3">
          <p className="text-sm text-text-secondary whitespace-pre-line">{post.content}</p>
        </div>
      )}

      {post.image_url && (
        <div className="relative w-full aspect-[4/3] bg-slate-100">
          <Image
            src={post.image_url}
            alt={post.title || "Community post"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      <div className="px-5 py-4">
        {!isEditing && post.title && <h3 className="text-base font-semibold mb-2">{post.title}</h3>}

        {post.category && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{post.category.name}</Badge>
          </div>
        )}

        {post.resource && (
          <Link
            href={`/resources/${post.resource.id}`}
            className="mt-3 flex items-center gap-3 rounded-card border border-border px-3 py-2.5 hover:bg-primary-light/40 transition"
          >
            <div className="h-8 w-8 rounded-full bg-primary-light text-primary-dark grid place-items-center shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">
                {t("community.helpedBy", undefined, "Helped by")}
              </p>
              <p className="text-sm font-medium truncate">{post.resource.name}</p>
            </div>
            <span className="text-xs text-primary font-medium">
              {t("community.view", undefined, "View")} →
            </span>
          </Link>
        )}

        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {replies.length} {replies.length === 1
            ? t("community.comment", undefined, "comment")
            : t("community.comments", undefined, "comments")}
        </button>
      </div>

      {commentsOpen && (
        <div className="border-t border-border px-5 py-3 bg-slate-50/60">
          {replies.length > 0 && (
            <ul className="flex flex-col gap-3 mb-3">
              {replies.map((r) => (
                <li key={r.id} className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary-light text-primary-dark grid place-items-center text-xs font-semibold shrink-0">
                    {displayName(r.author, anonLabel)[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-card border border-border px-3 py-2">
                      <p className="text-xs font-medium">{displayName(r.author, anonLabel)}</p>
                      <p className="text-sm text-text-secondary whitespace-pre-line mt-0.5">{r.content}</p>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 ml-1">{timeAgo(r.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {currentUserId ? (
            <div className="flex gap-2 items-start">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("community.replyPlaceholder", undefined, "Ask a question or share your thoughts…")}
                className="flex-1 min-h-[44px] max-h-[140px] rounded-btn border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-white"
                rows={1}
              />
              <Button size="sm" onClick={sendReply} disabled={!replyText.trim()} loading={sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              <Link href="/login" className="text-primary hover:underline">
                {t("action.signIn", undefined, "Sign in")}
              </Link>{" "}
              {t("community.signInToComment", undefined, "to comment.")}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

// =============================================================
// Composer — create a new post
// =============================================================
function Composer({
  open,
  onClose,
  categories,
  resources,
  userId,
  currentLanguage,
  onCreated,
  onError,
  onSuccess,
  onRefetch,
}: {
  open: boolean;
  onClose: () => void;
  categories: Props["categories"];
  resources: Resource[];
  userId: string | null;
  currentLanguage: string;
  onCreated: (post: Post) => void;
  onError: (msg: string) => void;
  onRefetch?: () => void;
  onSuccess: (msg: string) => void;
}) {
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [catId, setCatId] = useState("");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<string>("");
  const stageRef = useRef<string>("");
  const setStageBoth = (s: string) => {
    stageRef.current = s;
    setStage(s);
  };
  const [debugError, setDebugError] = useState<string>("");

  const WORD_LIMIT = 100;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > WORD_LIMIT;

  const selectedResource = resources.find((r) => r.id === resourceId) || null;
  const filteredResources = useMemo(() => {
    const q = resourceQuery.trim().toLowerCase();
    if (!q) return resources.slice(0, 8);
    return resources.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 10);
  }, [resourceQuery, resources]);

  const reset = () => {
    setTitle("");
    setContent("");
    setCatId("");
    setResourceQuery("");
    setResourceId(null);
    setFile(null);
    setPreview(null);
  };

  const handleFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    const MAX_BYTES = 10 * 1024 * 1024;
    if (f.size > MAX_BYTES) {
      onError(
        t(
          "community.photoTooLarge",
          { size: (f.size / 1024 / 1024).toFixed(1) },
          `Photo is ${(f.size / 1024 / 1024).toFixed(1)} MB. Maximum is 10 MB.`
        )
      );
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      onError(
        t("community.notAnImage", undefined, "Please select an image file (JPG, PNG, etc.).")
      );
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const submit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !file && !trimmedContent) {
      onError(t("community.needsTitleOrPhoto", undefined, "Add a title, photo, or story before posting."));
      return;
    }
    if (overLimit) {
      onError(t("community.storyTooLong", undefined, "Your story must be 100 words or fewer."));
      return;
    }

    setSaving(true);
    setDebugError("");
    setStageBoth("starting…");
    const supabase = createClient();

    // Generous safety net so photo uploads on slow networks don't bail too early.
    // If we DO hit this, we also kick off a refetch in case the post actually saved.
    const hangGuard = setTimeout(() => {
      setSaving(false);
      setDebugError(
        `Still working on "${stageRef.current || "starting"}". ` +
          `If your post doesn't appear shortly, please refresh the page.`
      );
      onRefetch?.();
    }, 130000);

    const fail = (msg: string) => {
      clearTimeout(hangGuard);
      setSaving(false);
      setDebugError(msg);
    };

    try {
      setStageBoth("checking sign-in");
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const { data: auth } = await supabase.auth.getUser();
        resolvedUserId = auth?.user?.id || null;
      }
      if (!resolvedUserId) {
        return fail("Not signed in. Please log in and try again.");
      }

      let image_url: string | null = null;
      if (file) {
        const sizeKB = Math.round(file.size / 1024);
        setStageBoth(`uploading photo (${sizeKB}KB)`);
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${resolvedUserId}/${Date.now()}.${ext}`;
        const uploadController = new AbortController();
        // Scale timeout to file size: ~1s/100KB plus a 5s buffer. A 10MB
        // upload gets ~105s on a slow connection; a 200KB upload gets ~7s.
        const uploadMs = Math.min(120_000, Math.max(8_000, sizeKB * 10 + 5_000));
        const uploadTimeout = setTimeout(() => uploadController.abort(), uploadMs);
        let uploadOk = false;
        let uploadErrorMsg = "";
        try {
          const { error: uploadErr } = await supabase.storage
            .from("community-photos")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
              // @ts-expect-error supabase-js v2 forwards unknown options to fetch
              signal: uploadController.signal,
            });
          if (!uploadErr) {
            uploadOk = true;
          } else {
            uploadErrorMsg = uploadErr.message;
            console.warn("[community-publish] upload error", uploadErr.message);
          }
        } catch (uploadEx: any) {
          uploadErrorMsg = uploadController.signal.aborted ? "timeout" : uploadEx?.message || "unknown";
          console.warn("[community-publish] upload exception", uploadErrorMsg);
        } finally {
          clearTimeout(uploadTimeout);
        }
        if (uploadOk) {
          const { data: pub } = supabase.storage.from("community-photos").getPublicUrl(path);
          image_url = pub.publicUrl;
        } else {
          // Show a friendly error instead of silently publishing without the photo
          return fail(
            `Photo upload failed (${uploadErrorMsg}). Try again, or remove the photo to post just the text.`
          );
        }
      }

      const insertPayload: Record<string, any> = {
        user_id: resolvedUserId,
        category_id: catId || null,
        title: trimmedTitle || null,
        content: trimmedContent,
        language: currentLanguage,
      };
      if (resourceId) insertPayload.resource_id = resourceId;
      if (image_url) insertPayload.image_url = image_url;

      setStageBoth("saving post");
      const { data, error } = await supabase
        .from("community_posts")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error || !data) {
        return fail(`Save failed: ${error?.message || "unknown error"}`);
      }

      clearTimeout(hangGuard);
      setSaving(false);
      setStageBoth("");

      // Fetch this user's profile so the new post shows the real name (not "Anonymous").
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", resolvedUserId)
        .single();

      const hydrated = {
        ...data,
        author: profile || { id: resolvedUserId, full_name: null, avatar_url: null },
        category: categories.find((c) => c.id === catId) || null,
        resource: resources.find((r) => r.id === resourceId) || null,
        replies: [],
      } as Post;

      reset();
      onClose();
      setTimeout(() => {
        onCreated(hydrated);
        onSuccess(t("community.postPublished", undefined, "Post published."));
      }, 0);
    } catch (err: any) {
      fail(`Error: ${err?.message || String(err)}`);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t("community.newPost", undefined, "New post")} size="lg">
      <div className="flex flex-col gap-3">
        <Input
          label={t("community.titleLabel", undefined, "Title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("community.titlePlaceholder", undefined, "First day of school, help with emergency call…")}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {t("community.storyLabel", undefined, "Your story")}
            </label>
            <span className={`text-xs ${overLimit ? "text-red-600" : wordCount > WORD_LIMIT - 15 ? "text-amber-600" : "text-text-muted"}`}>
              {wordCount} / {WORD_LIMIT} {t("community.words", undefined, "words")}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("community.storyPlaceholder", undefined, "Share what happened and who helped you…")}
            rows={4}
            className={`w-full rounded-btn border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white resize-y ${
              overLimit ? "border-red-300 focus:ring-red-300/40" : "border-border focus:ring-primary/30"
            }`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t("community.photoLabel", undefined, "Photo")}</label>
          {preview ? (
            <div className="relative w-full max-h-64 rounded-card overflow-hidden border border-border bg-slate-50">
              <img src={preview} alt="preview" className="w-full max-h-64 object-contain" />
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-white"
                aria-label={t("community.removePhoto", undefined, "Remove photo")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-3 px-4 py-6 rounded-card border-2 border-dashed border-border hover:bg-slate-50 cursor-pointer">
              <ImagePlus className="h-5 w-5 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {t("community.uploadPhoto", undefined, "Upload a photo")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t("community.categoryLabel", undefined, "Category")}</label>
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white"
          >
            <option value="">{t("community.chooseCategory", undefined, "Choose a category")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {t("community.creditLabel", undefined, "Credit an organization that helped you")}
          </label>
          {selectedResource ? (
            <div className="flex items-center gap-3 rounded-btn border border-border px-3 py-2 bg-primary-light/40">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedResource.name}</p>
                {selectedResource.phone && (
                  <p className="text-xs text-text-muted truncate">{selectedResource.phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setResourceId(null); setResourceQuery(""); }}
                className="p-1.5 rounded-btn hover:bg-white"
                aria-label={t("community.removeCredit", undefined, "Remove credit")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-btn border border-border px-3 py-2 bg-white">
                <Search className="h-4 w-4 text-text-muted shrink-0" />
                <input
                  value={resourceQuery}
                  onChange={(e) => setResourceQuery(e.target.value)}
                  placeholder={t("community.searchOrg", undefined, "Search for an organization…")}
                  className="flex-1 text-sm focus:outline-none bg-transparent"
                />
              </div>
              {resourceQuery && filteredResources.length > 0 && (
                <ul className="mt-1 max-h-48 overflow-auto rounded-card border border-border bg-white shadow-modal">
                  {filteredResources.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => { setResourceId(r.id); setResourceQuery(""); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary-light/40"
                      >
                        {r.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {saving && stage && (
          <div className="text-xs text-primary bg-primary-light/40 rounded-btn px-3 py-2">
            {stage}…
          </div>
        )}
        {debugError && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-btn px-3 py-2 whitespace-pre-wrap">
            {debugError}
          </div>
        )}
        <div className="flex gap-2 mt-3 items-center">
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            {t("action.cancel", undefined, "Cancel")}
          </Button>
          {!title.trim() && !file && !content.trim() && (
            <span className="text-xs text-text-muted ml-2">
              {t("community.needsTitleHint", undefined, "Add a title, photo, or story to enable Publish")}
            </span>
          )}
          <Button
            onClick={submit}
            disabled={(!title.trim() && !file && !content.trim()) || overLimit}
            loading={saving}
            className="ml-auto"
          >
            {t("community.publish", undefined, "Publish")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================
// Report modal
// =============================================================
function ReportModal({
  open,
  onClose,
  postId,
  userId,
  onReported,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  userId: string | null;
  onReported: () => void;
  onError: (msg: string) => void;
}) {
  const { t } = useT();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const reasonLabel = (r: ReportReason) => {
    const labels: Record<ReportReason, string> = {
      spam: t("community.reasonSpam", undefined, "Spam"),
      harassment: t("community.reasonHarassment", undefined, "Harassment or hate"),
      misinformation: t("community.reasonMisinformation", undefined, "False information"),
      offtopic: t("community.reasonOfftopic", undefined, "Off-topic"),
      other: t("community.reasonOther", undefined, "Other"),
    };
    return labels[r];
  };

  const submit = async () => {
    if (!postId || !userId) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("community_reports").insert({
      post_id: postId,
      reporter_id: userId,
      reason,
      note: note.trim() || null,
    });
    setSending(false);
    if (error) {
      onError(t("community.reportFailed", undefined, "Could not submit report."));
      return;
    }
    onReported();
    setReason("spam");
    setNote("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("community.reportTitle", undefined, "Report this post")} size="sm">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">
          {t("community.reportHelp", undefined, "Tell us what's wrong. If enough people report a post, it will be hidden automatically while our team reviews it.")}
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t("community.reasonLabel", undefined, "Reason")}</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{reasonLabel(r)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t("community.noteLabel", undefined, "Add a note")}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[80px] rounded-btn border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>{t("action.cancel", undefined, "Cancel")}</Button>
          <Button onClick={submit} loading={sending} className="ml-auto">
            {t("community.submitReport", undefined, "Submit report")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}