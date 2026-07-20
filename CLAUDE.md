# Repository Guidelines

## 项目结构与模块组织

本项目是基于 Next.js 15 App Router 的“地点记忆地图”，使用 TypeScript、React 19 与 Tailwind CSS v4，通过 OpenNext 部署到 Cloudflare Workers。路由与布局位于 `app/`；API 使用 `app/api/` Route Handlers。业务组件放在 `src/components/`，共享逻辑和数据访问位于 `src/lib/`，D1 迁移与种子数据位于 `db/`。不要新增 `pages/` 或其他路由目录。

## 构建、检查与本地开发

统一使用 pnpm，不要混用 npm、yarn 或 Bun。
Node.js 必须为 22 或更高版本；仓库 `.nvmrc` 固定当前开发版本。

- `pnpm install`：安装锁定在 `pnpm-lock.yaml` 中的依赖。
- `pnpm dev`：启动本地开发服务器，默认地址为 `http://localhost:3000`。
- `pnpm build`：执行生产构建并检查 Next.js 集成问题。
- `pnpm lint`：运行 ESLint 与 Prettier 规则检查。
- `pnpm format`：格式化仓库文件。
- `pnpm preview`：通过 OpenNext 和 Wrangler 本地预览 Cloudflare 构建。
- `pnpm deploy`：构建并部署到 Cloudflare Workers；仅在明确授权后执行。
- `pnpm db:migrate:local`：将 D1 迁移应用到本地数据库。
- `pnpm db:seed:local`：向本地 D1 写入演示初始数据。

## 编码风格与命名约定

遵循 `.prettierrc`：双引号、分号、尾随逗号、100 字符行宽。React 组件使用 PascalCase（如 `MapboxMap.tsx`），Hooks 使用 `use-*.tsx`，工具模块使用小写或 camelCase。通过 `@/*` 引用 `src/*`。默认使用 Server Components；仅在需要 Hooks、浏览器 API 或交互状态时添加 `"use client"`。优先复用 `src/components/ui/` 和 `src/lib/utils.ts` 中的 `cn()`。

## 测试与验证

当前未配置测试框架、覆盖率门槛或 `test` 脚本。每次修改至少运行 `pnpm lint`、`pnpm build`，涉及 bindings 时还要运行 `pnpm preview`。新增测试基础设施前先达成共识；测试文件建议与模块同目录，命名为 `*.test.ts` 或 `*.test.tsx`。

## 提交与合并请求

历史提交采用简短的类型前缀，例如 `feat: Mapbox 真实地图...`、`polish: ...`、`migrate: ...`。继续使用 `<type>: <简洁说明>`，一次提交只处理一个主题。合并请求应说明用户可见变化、验证命令和关联问题；涉及界面时附桌面端与移动端截图，涉及数据库时说明 `db/schema.sql` 或迁移影响。

## 配置与安全

将 `NEXT_PUBLIC_MAPBOX_TOKEN` 等本地配置放入 `.env.local`，不要提交密钥。Cloudflare D1 绑定名为 `DB`，私有 R2 绑定名为 `IMAGES`。用户上传图片只存 R2，结构化记录只存 D1；页面不得重新依赖 mock 数据。全栈 Next.js 使用 OpenNext Workers，不使用已停止推荐的 Pages Functions 适配器。修改 bindings 后运行 `pnpm cf-typegen` 并同时验证本地预览和生产构建。
