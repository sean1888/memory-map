import type { Metadata } from "next";
import { SceneMobile } from "@/components/scene/SceneMobile";

export const metadata: Metadata = {
  title: "同景时刻 · 在场",
  description: "手机端同景时刻比较视图。",
};

export default function Page() {
  return <SceneMobile />;
}
