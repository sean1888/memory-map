import type { Metadata } from "next";
import { SceneDesktop } from "@/components/scene/SceneDesktop";

export const metadata: Metadata = {
  title: "在场 · 同一个视角，不同的时刻",
  description:
    "在杭州北山街的石桥旁向东北看，秋雨、春晴、冬雾，三位记录者在同一个视角上留下了不同的时刻。",
};

export default function Page() {
  return <SceneDesktop />;
}
