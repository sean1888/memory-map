import type { Metadata } from "next";
import "@/styles.css";

export const metadata: Metadata = {
  title: "在场 · 地点记忆地图",
  description:
    "在地图上的某个地点留下文字、照片和时间。朋友来到同一个地点后，可以看到你的记录，并添加自己的版本。",
  openGraph: {
    title: "在场 · 地点记忆地图",
    description: "同一个地点，不同人不同时间的记忆版本。",
    type: "website",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a83dc5c4-5c4c-4d23-a94a-ecdf8b9793d6/id-preview-68d80fb2--0df79cc7-6e93-4420-a571-f81220a63ee5.lovable.app-1784201374242.png",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "在场 · 地点记忆地图",
    description: "在地图上留下地点、时间和感受，朋友可以在同一个地点续写自己的记忆。",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a83dc5c4-5c4c-4d23-a94a-ecdf8b9793d6/id-preview-68d80fb2--0df79cc7-6e93-4420-a571-f81220a63ee5.lovable.app-1784201374242.png",
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
