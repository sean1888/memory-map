export type SchemeId = "a" | "b" | "c";

export type Scheme = {
  id: SchemeId;
  name: string;
  tagline: string;
  description: string;
  suits: string;
  pros: string[];
  risks: string[];
  swatches: string[];
};

export const schemes: Record<SchemeId, Scheme> = {
  a: {
    id: "a",
    name: "城市观察手记",
    tagline: "像一本现代城市观察笔记",
    description:
      "冷白背景、深墨文字、朱红作为唯一强调色。留白宽裕，字体安静，节奏克制。",
    suits: "喜欢阅读、书写、慢速旅行的用户，独自记录多于社交。",
    pros: [
      "文字气质突出，长文段和短句都读得舒服",
      "视觉噪音最少，照片本身更被看见",
      "适合品牌走人文路线，长期不易审美疲劳",
    ],
    risks: [
      "对年轻/移动端重度用户略显冷淡",
      "没有明显社交刺激，早期活跃度可能偏低",
      "对图片质量非常敏感，随手拍会拉低整体调性",
    ],
    swatches: ["#f6f4ef", "#1a1a1a", "#b53a2b", "#8a8378"],
  },
  b: {
    id: "b",
    name: "影像地图",
    tagline: "地图作为沉浸式背景，照片说话",
    description:
      "深灰底、银白字，松绿作为唯一强调色。照片撑满，地图作为氛围，而不是工具。",
    suits: "以摄影、影像为主要表达方式的用户，习惯图像先行。",
    pros: [
      "视觉冲击力最强，分享链接点开即被抓住",
      "深色底衬托照片颜色，摄影感强",
      "沉浸式地图让「一个地点」的存在感被放大",
    ],
    risks: [
      "深色对大段中文阅读不如浅色友好",
      "对图片质量要求最高，弱图片场景会露怯",
      "地图作为背景的做法在弱网/低端机上性能压力大",
    ],
    swatches: ["#1c1e1d", "#e6e6e3", "#6f9a6a", "#3a3d3c"],
  },
  c: {
    id: "c",
    name: "轻社交地图",
    tagline: "朋友、回应、我也来过",
    description:
      "浅灰底、深蓝文字、珊瑚红强调。移动端优先，头像和回应更前置，节奏更快。",
    suits: "20-28 岁、朋友之间高频分享、习惯即时反馈的年轻用户。",
    pros: [
      "「我也来过」动作最被强调，容易形成社交叠加",
      "移动端信息密度和触达最舒服",
      "颜色亲切，冷启动门槛最低",
    ],
    risks: [
      "如果社交量少，会显得空旷",
      "亲切风格与深度记录的调性有轻微冲突",
      "珊瑚红使用过量会稀释「一个地点、多次回访」的重量感",
    ],
    swatches: ["#f3f4f6", "#0f2544", "#ff6a5b", "#8a95a8"],
  },
};

export const schemeList: Scheme[] = [schemes.a, schemes.b, schemes.c];
