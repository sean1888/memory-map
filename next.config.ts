import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 保留 @/* 路径别名（tsconfig 中配置）
  // Tailwind v4 通过 PostCSS 集成（见 postcss.config.mjs）
};

export default nextConfig;
