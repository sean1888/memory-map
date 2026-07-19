# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

"地点记忆地图"（在场）— 一个原型应用。用户在某个地点留下文字 + 照片作为记忆，朋友来到同一地点后可看到之前的记录并续写自己的版本。视觉风格为「城市观察手记」：暖白 / 深墨 / 朱红 / 衬线标题。

部署目标：**Cloudflare Workers**，通过 `@opennextjs/cloudflare` 适配。

## 常用命令

```bash
bun run dev        # 启动 Next.js 开发服务器（端口 3000）
bun run build      # 生产构建（Next.js）
bun run start      # 启动生产服务器
bun run lint       # Next.js lint
bun run format     # Prettier 格式化
bun run preview    # Cloudflare 本地预览（wrangler dev）
bun run deploy     # 部署到 Cloudflare（opennextjs-cloudflare + wrangler deploy）
```

包管理器是 **Bun**，请用 `bun install` / `bun add`，不要用 npm / yarn。

**没有配置测试框架** — 没有测试文件、没有 Vitest/Jest 等 runner、没有 test 脚本。

## 架构

### 框架：Next.js App Router

- `app/` 目录下使用 **App Router 文件路由**，每个 `page.tsx` 文件对应一个路由。
- **不要**创建 `src/pages/`、`src/routes/` 或任何其他路由目录。
- 唯一的根布局是 `app/layout.tsx`，必须保留其中的 `<html>` 和 `<body>`。
- App Router 约定：`layout.tsx`（布局）、`page.tsx`（页面）、`not-found.tsx`（404）、`error.tsx`（错误边界）、`loading.tsx`（加载态）。
- `app/` 下所有使用 React hooks 的组件必须在顶部加 `"use client"`。默认是 Server Components。

### 路由结构

| 文件 | URL |
|------|-----|
| `app/layout.tsx` | 根布局（所有页面共用） |
| `app/page.tsx` | `/` — 主页地图 + 地点列表（支持 `?place=xxx` 深链） |
| `app/m/page.tsx` | `/m` — 场景手机版 |
| `app/scene/page.tsx` | `/scene` — 场景桌面版 |
| `app/upload/page.tsx` | `/upload` — 上传流程（支持 `?from=...&placeId=...&sceneId=...`） |
| `app/not-found.tsx` | 404 页面 |
| `app/error.tsx` | 客户端错误边界 |

### 路径别名

`@/*` → `./src/*`（在 `tsconfig.json` 中配置）。

### 关键模块

- `src/components/PrototypeApp.tsx` — 主应用：地图屏 + 地点详情屏。`"use client"` 组件，接收 `initialPlaceId` / `initialFilter` props，用 `useRouter` 从 `next/navigation` 做 URL 导航。
- `src/components/scene/` — 场景相关组件：`SceneDesktop`、`SceneMobile`、`CompareSlider`（对比滑块）、`UploadConfirm`。全部都是 `"use client"` 组件。
- `src/lib/sceneData.ts` — 领域类型（`Place`、`Scene`、`Moment`、`Visibility`、`Season`）及"同视角不同时刻"功能的 mock 数据。
- `src/lib/mockData.ts` — 主原型的 `Place[]` 和 `MemoryEntry[]` mock 数据。

### UI 层

- **shadcn/ui**（new-york 风格）位于 `src/components/ui/`。配置：`components.json`。组件在本地，直接编辑即可。所有组件都已加 `"use client"`。
- **Tailwind CSS v4**，通过 `@tailwindcss/postcss` 集成到 Next.js（见 `postcss.config.mjs`）。主题 token 都是 CSS 自定义属性。
- **Radix UI** 是 shadcn 组件的底层原语。
- **Lucide** 图标库。
- **cn()** 工具函数在 `src/lib/utils.ts` — `clsx` + `tailwind-merge`。

### Next.js 配置

- `next.config.ts` — Next.js 配置。
- `postcss.config.mjs` — PostCSS 配置（Tailwind v4 集成）。
- `opennext.config.json` — `@opennextjs/cloudflare` 适配配置。
- `wrangler.jsonc` — Cloudflare 部署配置。
- **不要添加重复的 Tailwind / React 插件** — Next.js 已内置处理。

### Cloudflare 部署

使用 `@opennextjs/cloudflare` 把 Next.js 构建产物适配为 Cloudflare Workers 格式：
- `bun run preview` — 本地用 wrangler 预览
- `bun run deploy` — 部署到 Cloudflare

## 代码风格

- Prettier：100 字符宽、分号、双引号、尾逗号。
- ESLint：`eslint-config-next` + Prettier 集成。
- `.next`、`dist`、`.output`、`.open-next` 被忽略。
