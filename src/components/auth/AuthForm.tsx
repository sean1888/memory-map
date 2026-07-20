"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";

type Mode = "login" | "register";
type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

const inputClass =
  "mt-1.5 h-11 w-full rounded-[8px] border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-accent";

function passwordIssue(password: string): string | null {
  if (password.length < 6 || password.length > 18) return "密码长度需为 6-18 位";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "密码需同时包含字母和数字";
  if (
    ["password", "password1", "123456", "12345678", "qwerty123", "abc123"].includes(
      password.toLowerCase(),
    )
  )
    return "这个密码过于常见，请换一个";
  return null;
}

function FieldMessage({
  state,
  availableText,
  takenText,
}: {
  state: Availability;
  availableText: string;
  takenText: string;
}) {
  if (state === "idle") return null;
  const message =
    state === "checking"
      ? "正在检查…"
      : state === "available"
        ? availableText
        : state === "invalid"
          ? "格式不正确"
          : takenText;
  return (
    <p className={`mt-1 text-[11px] ${state === "available" ? "text-emerald-700" : "text-accent"}`}>
      {message}
    </p>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next =
    searchParams.get("next")?.startsWith("/") && !searchParams.get("next")?.startsWith("//")
      ? searchParams.get("next")!
      : "/";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameState, setUsernameState] = useState<Availability>("idle");
  const [emailState, setEmailState] = useState<Availability>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async (kind: "email" | "username", value: string) => {
    const setState = kind === "email" ? setEmailState : setUsernameState;
    if (!value.trim()) return setState("invalid");
    setState("checking");
    try {
      const response = await fetch(
        `/api/auth/check-${kind}?${kind}=${encodeURIComponent(value.trim())}`,
      );
      const result = (await response.json()) as { available?: boolean };
      setState(
        response.ok && result.available
          ? "available"
          : response.status === 400
            ? "invalid"
            : "taken",
      );
    } catch {
      setState("idle");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (mode === "register") {
      const issue = passwordIssue(password);
      setPasswordError(issue);
      if (issue) return;
      if (password !== confirmPassword) return setError("两次输入的密码不一致");
      if (emailState === "taken" || usernameState === "taken")
        return setError("请先更换已被使用的信息");
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { username, email, password, confirmPassword }
            : { email, password },
        ),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) return setError(result.error ?? "操作失败，请稍后重试");
      router.replace(next);
      router.refresh();
    } catch {
      setError("网络连接失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const otherHref = `${mode === "login" ? "/register" : "/login"}?next=${encodeURIComponent(next)}`;
  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <label className="block text-[13px] font-medium">
          用户名
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setUsernameState("idle");
            }}
            onBlur={() => checkAvailability("username", username)}
            autoComplete="username"
            maxLength={20}
            className={inputClass}
          />
          <FieldMessage
            state={usernameState}
            availableText="这个用户名可以使用"
            takenText="该用户名已被使用"
          />
        </label>
      )}
      <label className="block text-[13px] font-medium">
        邮箱
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailState("idle");
          }}
          onBlur={() => mode === "register" && checkAvailability("email", email)}
          autoComplete="email"
          className={inputClass}
        />
        {mode === "register" && (
          <FieldMessage
            state={emailState}
            availableText="该邮箱可以注册"
            takenText="该邮箱已注册"
          />
        )}
      </label>
      <label className="block text-[13px] font-medium">
        密码
        <span className="relative block">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError(null);
            }}
            onBlur={() => mode === "register" && setPasswordError(passwordIssue(password))}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            className="absolute right-1 top-2 grid h-9 w-9 place-items-center text-muted-foreground"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
        {mode === "register" && (
          <p
            className={`mt-1 text-[11px] ${passwordError ? "text-accent" : "text-muted-foreground"}`}
          >
            {passwordError ?? "6-18 位，至少包含字母和数字"}
          </p>
        )}
      </label>
      {mode === "register" && (
        <label className="block text-[13px] font-medium">
          确认密码
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[8px] border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs text-accent"
        >
          {error}
        </p>
      )}
      <button
        disabled={submitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-accent text-sm text-accent-foreground disabled:opacity-60"
      >
        {submitting && <LoaderCircle size={15} className="animate-spin" />}
        {mode === "login" ? "登录" : "创建账号"}
      </button>
      <p className="pt-2 text-center text-xs text-muted-foreground">
        {mode === "login" ? "还没有账号？" : "已有账号？"}
        <Link href={otherHref} className="ml-1 text-accent hover:underline">
          {mode === "login" ? "去注册" : "去登录"}
        </Link>
      </p>
    </form>
  );
}
