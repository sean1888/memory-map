# Cloudflare 部署与存储配置

## 部署模型

Cloudflare 已将全栈 Next.js 的官方部署路径迁移到 Workers。Pages 仅适合
`output: "export"` 的静态 Next.js。本项目使用 OpenNext、Workers Assets、D1 和私有 R2，
仍可运行在 Workers Free 套餐。

## 1. 环境准备

使用 Node.js 22 以上和仓库锁定的 pnpm：

```bash
nvm use
pnpm install --frozen-lockfile
pnpm wrangler login
```

## 2. 创建免费存储

```bash
pnpm wrangler d1 create memory-map-db
pnpm wrangler r2 bucket create memory-map-images
```

将 D1 命令返回的 `database_id` 写入 `wrangler.jsonc`，替换
`PLACEHOLDER_REPLACE_AFTER_WRANGLER_D1_CREATE`。R2 桶名必须与
`r2_buckets[].bucket_name` 一致。

## 3. 初始化数据库

本地开发：

```bash
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
```

远程生产：

```bash
pnpm db:migrate:remote
pnpm wrangler d1 execute DB --remote --file db/seed.sql
pnpm cf-typegen
```

种子脚本使用 `INSERT OR IGNORE`，可重复执行。生产环境不需要演示数据时，只运行迁移。

## 4. 预览与部署

```bash
pnpm preview
pnpm deploy
```

`pnpm dev` 使用 Next.js 和本地 bindings；`pnpm preview` 使用生产同款 workerd。
发布前至少执行一次 preview。部署通过 Workers Builds 时，将
`NEXT_PUBLIC_MAPBOX_TOKEN` 配置为 Build Variable。

## R2 与 CORS

当前上传和读取均经过同源 Route Handler，R2 保持私有，不需要 CORS，也不需要 S3
访问密钥。不要把 `r2.dev` 用作生产图片域名。

只有以后改成浏览器直传预签名 URL 时，才在 R2 设置精确来源：

```json
[
  {
    "AllowedOrigins": ["https://your-domain.example", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

生产环境不要使用 `AllowedOrigins: ["*"]`。S3 密钥只能存为 Worker secret，不能使用
`NEXT_PUBLIC_*`。

## 免费额度与限制

- Workers Free：100,000 请求/日、10ms CPU/请求、128MB 内存、100MB 请求体。
- R2 Standard：10GB/月、100 万次 Class A、1000 万次 Class B、出口流量免费。
- D1 Free：每库 500MB、账户 5GB、500 万行读/日、10 万行写/日。
- 应用额外限制：最多 6 张图，单张 5MB，总请求图片 20MB；避免在 Worker 内执行图片转码。
- 历史记录使用游标分页和索引，避免 D1 全表扫描。
- 上传使用幂等 `client_request_id`；R2 成功而 D1 失败时会自动删除已上传对象。

## 中国大陆访问

Cloudflare Free 不提供中国大陆境内节点或可承诺的访问质量。生产应使用自定义域名、
图片长期缓存、客户端压缩和懒加载；不要依赖 `r2.dev`。需要稳定的中国大陆加速时，
通常必须使用 Cloudflare China Network/合作运营商并满足 ICP 要求，这不属于免费额度。
