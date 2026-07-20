"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ImagePlus, LoaderCircle, MessageCircle, Send, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Comment = {
  id: string;
  authorId: string;
  author: string;
  authorAvatarUrl: string | null;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
  canDelete: boolean;
};

type InteractionsResponse = {
  comments: Comment[];
  likeCount: number;
  liked: boolean;
};

export function MemoryInteractions({
  memoryId,
  placeId,
  isAuthenticated,
  initialCommentCount,
  initialLikeCount,
  initiallyLiked,
}: {
  memoryId: string;
  placeId: string;
  isAuthenticated: boolean;
  initialCommentCount: number;
  initialLikeCount: number;
  initiallyLiked: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [liking, setLiking] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const login = () => {
    router.push(`/login?next=${encodeURIComponent(`/?place=${placeId}`)}`);
  };

  const loadComments = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/memories/${memoryId}/interactions`);
      const result = (await response.json()) as InteractionsResponse;
      if (!response.ok) throw new Error();
      setComments(result.comments);
      setCommentCount(result.comments.length);
      setLikeCount(result.likeCount);
      setLiked(result.liked);
      setLoaded(true);
    } catch {
      setError("互动内容加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void loadComments();
  };

  const toggleLike = async () => {
    if (!isAuthenticated) return login();
    if (liking) return;
    setLiking(true);
    try {
      const response = await fetch(`/api/memories/${memoryId}/like`, { method: "POST" });
      const result = (await response.json()) as { liked?: boolean; likeCount?: number };
      if (!response.ok) throw new Error();
      setLiked(Boolean(result.liked));
      setLikeCount(Number(result.likeCount ?? 0));
    } catch {
      setError("点赞失败，请稍后重试");
    } finally {
      setLiking(false);
    }
  };

  const selectImage = (file?: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setImage(null);
      setPreviewUrl(null);
      return;
    }
    if (
      !new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("请选择不超过 2MB 的 JPG、PNG 或 WebP 图片");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!expanded || loading) return;
    const frame = requestAnimationFrame(() => {
      panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, loading]);

  const submitComment = async () => {
    if (!isAuthenticated) return login();
    if (!text.trim() && !image) return setError("请输入文字或选择图片");
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    if (text.trim()) formData.set("text", text.trim());
    if (image) formData.set("image", image);
    try {
      const response = await fetch(`/api/memories/${memoryId}/comments`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { comment?: Comment; error?: string };
      if (!response.ok || !result.comment) {
        setError(result.error ?? "评论发布失败，请稍后重试");
        return;
      }
      setComments((items) => [...items, result.comment!]);
      setCommentCount((count) => count + 1);
      setText("");
      selectImage();
    } catch {
      setError("评论发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm("确定删除这条评论吗？")) return;
    const response = await fetch(`/api/memories/${memoryId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setComments((items) => items.filter((comment) => comment.id !== commentId));
      setCommentCount((count) => Math.max(0, count - 1));
    } else {
      setError("评论删除失败，请稍后重试");
    }
  };

  return (
    <section
      className="mt-6 border-t border-border pt-3"
      aria-label="点赞与评论"
      data-comments-expanded={expanded}
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={toggleLike}
          disabled={liking}
          aria-pressed={liked}
          className={`inline-flex h-9 items-center gap-1.5 rounded-[6px] px-2.5 hover:bg-surface-2 ${liked ? "text-accent" : ""}`}
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
          <span>{likeCount > 0 ? likeCount : "点赞"}</span>
        </button>
        <button
          type="button"
          onClick={toggleComments}
          aria-expanded={expanded}
          className="inline-flex h-9 items-center gap-1.5 rounded-[6px] px-2.5 hover:bg-surface-2"
        >
          <MessageCircle size={15} />
          <span>{commentCount > 0 ? `${commentCount} 条评论` : "评论"}</span>
        </button>
      </div>

      {expanded && (
        <div
          ref={panel}
          className="mt-2 scroll-mb-24 animate-fade-up border-t border-border/70 pt-4"
        >
          {loading ? (
            <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
              <LoaderCircle size={13} className="animate-spin" /> 正在加载评论
            </p>
          ) : comments.length > 0 ? (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-2.5">
                  {comment.authorAvatarUrl ? (
                    <img
                      src={comment.authorAvatarUrl}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-[4px] object-cover"
                    />
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[4px] bg-surface-2 text-[11px]">
                      {comment.author.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-medium text-foreground">{comment.author}</span>
                      <time className="text-muted-foreground">
                        {formatCommentTime(comment.createdAt)}
                      </time>
                      {comment.canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteComment(comment.id)}
                          aria-label="删除评论"
                          className="ml-auto grid h-7 w-7 place-items-center text-muted-foreground hover:text-accent"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    {comment.text && (
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-6">
                        {comment.text}
                      </p>
                    )}
                    {comment.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setExpandedImage(comment.imageUrl)}
                        aria-label="查看评论大图"
                        className="mt-2 block w-fit"
                      >
                        <img
                          src={comment.imageUrl}
                          alt="评论图片"
                          loading="lazy"
                          className="max-h-28 max-w-32 cursor-zoom-in rounded-[6px] border border-border object-cover"
                        />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : loaded ? (
            <p className="py-2 text-xs text-muted-foreground">还没有评论</p>
          ) : null}

          {isAuthenticated ? (
            <div className="mt-4 border-t border-border/70 pt-4">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="写下你的回应…"
                className="w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2.5 text-[13px] leading-6 outline-none focus:border-accent"
              />
              {previewUrl && (
                <div className="relative mt-2 w-fit">
                  <img
                    src={previewUrl}
                    alt="待上传图片"
                    className="h-20 w-20 rounded-[6px] border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => selectImage()}
                    aria-label="移除图片"
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => selectImage(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="grid h-9 w-9 place-items-center rounded-[6px] text-muted-foreground hover:bg-surface-2"
                  aria-label="添加图片"
                >
                  <ImagePlus size={16} />
                </button>
                <span className="text-[10px] text-muted-foreground">图片不超过 2MB</span>
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={submitting}
                  className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-accent px-3 text-xs text-accent-foreground disabled:opacity-60"
                >
                  {submitting ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}{" "}
                  发布
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="mt-4 text-xs text-accent hover:underline"
            >
              登录后参与评论
            </button>
          )}
          {error && (
            <p role="alert" className="mt-2 text-[11px] text-accent">
              {error}
            </p>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(expandedImage)}
        onOpenChange={(open) => !open && setExpandedImage(null)}
      >
        <DialogContent className="flex w-auto max-w-[92vw] items-center justify-center border-0 bg-transparent p-0 text-white shadow-none">
          <DialogTitle className="sr-only">查看评论大图</DialogTitle>
          {expandedImage && (
            <img
              src={expandedImage}
              alt="评论大图"
              className="max-h-[88dvh] max-w-[88vw] rounded-[6px] bg-white p-1.5 object-contain shadow-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function formatCommentTime(value: string): string {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
