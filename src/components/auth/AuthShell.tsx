import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden min-h-dvh overflow-hidden lg:block">
        <Image
          src="/assets/scene-autumn.jpg"
          alt="秋日街道的地点记忆"
          fill
          priority
          unoptimized
          className="object-cover"
          sizes="45vw"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-editorial text-3xl leading-tight">
            有些地方，因为被记住，才真正属于我们。
          </p>
          <p className="mt-3 text-sm text-white/80">在同一个地点，留下不同时间的生活切片。</p>
        </div>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} /> 返回地图
          </Link>
          <div className="mb-8 flex items-center gap-2 text-accent">
            <MapPin size={18} />
            <span className="font-editorial text-lg text-foreground">在场</span>
          </div>
          <h1 className="font-editorial text-[32px] leading-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
