# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

"地点记忆地图"（在场）— 一个原型应用。用户在某个地点留下文字 + 照片作为记忆，朋友来到同一地点后可看到之前的记录并续写自己的版本。视觉风格为「城市观察手记」：暖白 / 深墨 / 朱红 / 衬线标题。

项目已连接到 [Lovable](https://lovable.dev)。**禁止改写已推送的 git 历史**（不要 force push、不要 rebase/amend/squash 已推送的 commit）— 会破坏 Lovable 侧的历史记录。推送到已连接分支的 commit 会自动同步回 Lovable 编辑器。

## 常用命令

```bash
bun run dev        # 启动开发服务器（Vite）
bun run build      # 生产构建（Vite + Nitro SSR）
bun run build:dev  # 开发模式构建
bun run preview    # 预览生产构建
bun run lint       # ESLint 检查
bun run format     # Prettier 格式化
```

包管理器是 **Bun**，请用 `bun install` / `bun add`，不要用 npm / yarn。

**没有配置测试框架** — 没有测试文件、没有 Vitest/Jest 等 runner、没有 test 脚本。

## 架构

### 框架：TanStack Start（不是 Next.js / Remix）

- `src/routes/` 下使用**文件路由**，每个 `.tsx` 文件对应一个路由。**不要**创建 `src/pages/` 或 `app/layout.tsx`。
- `routeTree.gen.ts` 是**自动生成**的 — 永远不要手动编辑。
- 唯一的根布局是 `src/routes/__root.tsx`，必须保留其中的 `<Outlet />`。
- 路由文件约定：`index.tsx` → `/`、`$id.tsx` → `/:id`（动态参数）、`_layout.tsx` → 布局路由。
- `server-only` 包被 ESLint 禁用。需要仅服务端代码时，使用 `*.server.ts` 文件名或 `@tanstack/react-start/server-only` 标记。

### 入口文件

- `src/server.ts` — Nitro 的 SSR 入口。包裹 TanStack Start 的 server entry，处理灾难性错误（h3 有时会把抛错吞成通用的 500 JSON 响应；这里检测并替换成样式化错误页）。
- `src/start.ts` — `createStart()` 实例，带服务端错误中间件。
- `src/router.tsx` — `createRouter()` 工厂函数，把 `QueryClient` 注入到路由 context。

### 视觉主题：城市观察手记

定义在 `src/styles.css` 的 `:root` 中：暖白 / 深墨 / 朱红。标题使用衬线字体 `.font-editorial`。

### 路径别名

`@/*` → `./src/*`（在 `tsconfig.json` 和 `vite.config.ts` 中通过 `@lovable.dev/vite-tanstack-config` 配置）。

### 关键模块

- `src/components/PrototypeApp.tsx` — 主应用：地图屏 + 地点详情屏。`/` 的入口。
- `src/components/scene/` — 场景相关组件：`SceneDesktop`、`SceneMobile`、`CompareSlider`（对比滑块）、`UploadConfirm`。
- `src/lib/sceneData.ts` — 领域类型（`Place`、`Scene`、`Moment`、`Visibility`、`Season`）及"同视角不同时刻"功能的 mock 数据。
- `src/lib/mockData.ts` — 主原型的 `Place[]` 和 `MemoryEntry[]` mock 数据。
- `src/lib/error-capture.ts` — 带外错误捕获（全局 `error` / `unhandledrejection` 监听），让 `server.ts` 能从 h3 吞掉的错误中恢复原始堆栈。
- `src/lib/lovable-error-reporting.ts` — 把 React error boundary 捕获的错误转发给 Lovable 遥测（`window.__lovableEvents`）。

### UI 层

- **shadcn/ui**（new-york 风格）位于 `src/components/ui/`。配置：`components.json`。组件在本地，直接编辑即可。
- **Tailwind CSS v4**，在 `src/styles.css` 中用 `@import "tailwindcss"` 引入。主题 token 都是 CSS 自定义属性。
- **Radix UI** 是 shadcn 组件的底层原语。
- **Lucide** 图标库。
- **cn()** 工具函数在 `src/lib/utils.ts` — `clsx` + `tailwind-merge`。

### Vite 配置

`vite.config.ts` 使用 `@lovable.dev/vite-tanstack-config`，它已打包：TanStack devtools、`tanstackStart`、`viteReact`、`tailwindcss`、`tsConfigPaths`、`nitro`（SSR，默认 Cloudflare 目标）、`VITE_*` 环境变量注入、`@` 路径别名、React/TanStack 去重、错误日志插件、沙箱检测。**不要添加重复插件** — 会导致应用崩溃。

### 供应链防护

`bunfig.toml` 强制 `minimumReleaseAge = 86400`（24 小时），即跳过发布不足一天的包版本。仅少量 `@lovable.dev/*` 包在排除列表中。**不要在未经用户确认的情况下往 `minimumReleaseAgeExcludes` 添加条目**。

## 代码风格

- Prettier：100 字符宽、分号、双引号、尾逗号。
- ESLint：TypeScript ESLint + React Hooks + React Refresh。`@typescript-eslint/no-unused-vars` 已关闭。
- `routeTree.gen.ts`、`dist`、`.output`、`.vinxi` 被 Prettier 忽略。
