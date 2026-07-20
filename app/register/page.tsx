import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "注册 · 在场" };
export default function Page() {
  return (
    <AuthShell
      title="创建你的地点手记"
      description="注册后，你的每一段记录都会以固定昵称保存。邮箱验证将在后续开放。"
    >
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
