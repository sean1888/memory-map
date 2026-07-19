import { createFileRoute, Link } from "@tanstack/react-router";
import { schemeList } from "@/lib/schemes";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "三套视觉方案 · 在场" },
      { name: "description", content: "对比三套视觉方向：城市观察手记、影像地图、轻社交地图。" },
    ],
  }),
  component: Schemes,
});

function Schemes() {
  return (
    <main className="scheme-a min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-10">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Prototype · 2026
          </p>
          <h1 className="mt-3 font-editorial text-3xl sm:text-4xl leading-[1.15]">
            三套视觉方向
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted-foreground">
            当前主原型采用方案 A「城市观察手记」。这里保留另外两套的入口，方便对照。
            <Link to="/" className="ml-1 text-accent hover:underline">返回主原型 →</Link>
          </p>
        </header>

        <ul className="grid gap-5 sm:grid-cols-3">
          {schemeList.map((s) => (
            <li key={s.id}>
              <Link
                to="/scheme/$id"
                params={{ id: s.id }}
                className="group block rounded-[8px] border border-border bg-surface p-4 transition-colors hover:border-foreground/40"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">方案 {s.id.toUpperCase()}</span>
                  <h2 className="text-base font-medium">{s.name}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
                <div className="mt-3 flex gap-1.5">
                  {s.swatches.map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-sm border border-black/5"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-accent group-hover:underline">进入方案 →</p>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-14 grid gap-8 sm:grid-cols-3 text-sm">
          {schemeList.map((s) => (
            <div key={s.id}>
              <h3 className="text-[13px] font-medium">
                方案 {s.id.toUpperCase()} · 适合谁
              </h3>
              <p className="mt-2 text-muted-foreground leading-6">{s.suits}</p>
              <h4 className="mt-4 text-[13px] font-medium">优点</h4>
              <ul className="mt-2 space-y-1 text-muted-foreground leading-6">
                {s.pros.map((p) => (<li key={p}>· {p}</li>))}
              </ul>
              <h4 className="mt-4 text-[13px] font-medium">风险</h4>
              <ul className="mt-2 space-y-1 text-muted-foreground leading-6">
                {s.risks.map((p) => (<li key={p}>· {p}</li>))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
