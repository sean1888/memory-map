import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "登录 · 在场" };
export default function Page() {
  return (
    <AuthShell title="欢迎回来" description="登录后继续记录你与地点之间发生的故事。">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
