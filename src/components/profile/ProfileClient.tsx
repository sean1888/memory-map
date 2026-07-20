"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { CurrentUser } from "@/lib/auth";

type Memory = {
  id: string;
  note: string;
  visibility: string;
  created_at: string;
  captured_at: string | null;
  place_name: string;
  cover: string | null;
};

export function ProfileClient({
  initialUser,
  initialMemories,
}: {
  initialUser: CurrentUser;
  initialMemories: Memory[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState(initialUser);
  const [memories, setMemories] = useState(initialMemories);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    setBusy(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    setBusy(false);
    if (response.ok) {
      setUser({ ...user, displayName: displayName.trim() });
      setEditing(false);
      router.refresh();
    }
  };
  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    const body = new FormData();
    body.set("avatar", file);
    setBusy(true);
    const response = await fetch("/api/profile/avatar", { method: "POST", body });
    const result = (await response.json()) as { avatarUrl?: string };
    setBusy(false);
    if (response.ok && result.avatarUrl) setUser({ ...user, avatarUrl: result.avatarUrl });
  };
  const deleteAvatar = async () => {
    setBusy(true);
    const response = await fetch("/api/profile/avatar", { method: "DELETE" });
    setBusy(false);
    if (response.ok) setUser({ ...user, avatarUrl: null });
  };
  const deleteMemory = async (id: string) => {
    if (!window.confirm("确定删除这段记录和已上传的图片吗？")) return;
    const response = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (response.ok) setMemories((items) => items.filter((item) => item.id !== id));
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft size={16} /> 返回地图
          </Link>
          <button
            onClick={logout}
            className="ml-auto inline-flex h-9 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut size={15} /> 退出登录
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="group relative block h-20 w-20 overflow-hidden rounded-[8px] bg-accent text-2xl text-accent-foreground"
              aria-label="更换头像"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.displayName.slice(0, 1)
              )}
              <span className="absolute inset-x-0 bottom-0 grid h-7 place-items-center bg-black/45 text-white opacity-0 group-hover:opacity-100">
                <Camera size={14} />
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => uploadAvatar(event.target.files?.[0])}
            />
            {user.avatarUrl && (
              <button
                type="button"
                onClick={deleteAvatar}
                disabled={busy}
                className="mt-1 inline-flex w-20 items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
              >
                <Trash2 size={11} /> 移除头像
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex max-w-sm gap-2">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={30}
                  className="h-10 min-w-0 flex-1 rounded-[8px] border border-border bg-surface px-3"
                />
                <button
                  onClick={saveName}
                  disabled={busy}
                  className="h-10 rounded-[8px] bg-accent px-4 text-sm text-accent-foreground"
                >
                  保存
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-3xl">{user.displayName}</h1>
                <button
                  onClick={() => setEditing(true)}
                  aria-label="修改昵称"
                  className="grid h-8 w-8 place-items-center text-muted-foreground"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              @{user.username} · {user.email}
            </p>
            {!user.emailVerified && (
              <p className="mt-2 text-xs text-muted-foreground">
                邮箱暂未验证，验证功能将在后续开放
              </p>
            )}
          </div>
          <Link
            href="/upload?from=global"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-accent px-4 text-sm text-accent-foreground"
          >
            <Plus size={15} /> 记录这一刻
          </Link>
        </section>
        <section className="pt-8">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-editorial text-2xl">我的记录</h2>
            <span className="text-xs text-muted-foreground">{memories.length} 条</span>
          </div>
          {memories.length === 0 ? (
            <div className="border-t border-border py-16 text-center text-sm text-muted-foreground">
              还没有留下记录
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {memories.map((memory) => (
                <li
                  key={memory.id}
                  className="flex min-h-28 gap-3 rounded-[8px] border border-border bg-surface p-3"
                >
                  {memory.cover && (
                    <img
                      src={memory.cover}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-[6px] object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{memory.place_name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {memory.visibility === "public" ? "公开" : "仅自己"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {memory.note}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {new Date(memory.captured_at ?? memory.created_at).toLocaleDateString(
                        "zh-CN",
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    aria-label="删除记录"
                    className="grid h-8 w-8 shrink-0 place-items-center text-muted-foreground hover:text-accent"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
