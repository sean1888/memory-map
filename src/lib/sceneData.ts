import autumnImg from "@/assets/scene-autumn.jpg";
import springImg from "@/assets/scene-spring.jpg";
import winterImg from "@/assets/scene-winter.jpg";
import uploadImg from "@/assets/upload-photo.jpg";

export type Visibility = "participants" | "link" | "public";
export type Season = "春" | "夏" | "秋" | "冬";

export type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type Scene = {
  id: string;
  placeId: string;
  title: string; // e.g. 石桥旁向东北看
  latitude: number;
  longitude: number;
  direction: string; // e.g. 东北 42°
  momentCount: number;
};

export type Moment = {
  id: string;
  sceneId: string;
  author: string;
  authorInitial: string;
  imageUrl: string;
  capturedAt: string; // 显示用
  isoDate: string; // 排序用
  season: Season;
  weather: string;
  temperature: string;
  note: string;
  visibility: Visibility;
  source: "EXIF" | "手动" | "分享";
  gpsAccuracy: string; // e.g. 约 12 米
  shortLabel: string; // 例如 2025 秋雨
};

export const place: Place = {
  id: "beishan",
  name: "杭州 · 北山街",
  address: "浙江省杭州市西湖区北山街",
  latitude: 30.2569,
  longitude: 120.1451,
};

export const scenes: Scene[] = [
  {
    id: "shiqiao-ne",
    placeId: "beishan",
    title: "石桥旁向东北看",
    latitude: 30.2571,
    longitude: 120.1449,
    direction: "东北 42°",
    momentCount: 3,
  },
  {
    id: "duanqiao",
    placeId: "beishan",
    title: "断桥残雪堤上",
    latitude: 30.2585,
    longitude: 120.1462,
    direction: "西 268°",
    momentCount: 2,
  },
  {
    id: "baodi",
    placeId: "beishan",
    title: "宝石山下岔路口",
    latitude: 30.2559,
    longitude: 120.1438,
    direction: "北 12°",
    momentCount: 1,
  },
];

export const moments: Moment[] = [
  {
    id: "m-autumn",
    sceneId: "shiqiao-ne",
    author: "林夏",
    authorInitial: "夏",
    imageUrl: autumnImg,
    capturedAt: "2025 年 11 月 6 日 · 15:24",
    isoDate: "2025-11-06",
    season: "秋",
    weather: "小雨",
    temperature: "14°C",
    note: "梧桐叶落下来以后，这条路突然安静了。湖面看不清对岸，但能听见自行车经过湿地面的声音。",
    visibility: "participants",
    source: "EXIF",
    gpsAccuracy: "约 8 米",
    shortLabel: "2025 秋雨",
  },
  {
    id: "m-spring",
    sceneId: "shiqiao-ne",
    author: "周屿",
    authorInitial: "屿",
    imageUrl: springImg,
    capturedAt: "2026 年 4 月 12 日 · 16:37",
    isoDate: "2026-04-12",
    season: "春",
    weather: "晴",
    temperature: "19°C",
    note: "春天的湖面比你照片里亮很多。我沿着你的路线走了一遍，在同一棵树下拍了这张照片。",
    visibility: "participants",
    source: "EXIF",
    gpsAccuracy: "约 12 米",
    shortLabel: "2026 春晴",
  },
  {
    id: "m-winter",
    sceneId: "shiqiao-ne",
    author: "陈默",
    authorInitial: "默",
    imageUrl: winterImg,
    capturedAt: "2026 年 1 月 18 日 · 09:12",
    isoDate: "2026-01-18",
    season: "冬",
    weather: "雾",
    temperature: "6°C",
    note: "雾把湖岸藏了起来，树枝的轮廓反而比平时更清楚。",
    visibility: "link",
    source: "EXIF",
    gpsAccuracy: "约 15 米",
    shortLabel: "2026 冬雾",
  },
];

export const scene = scenes[0];

export const uploadPhotoUrl = uploadImg;

export function daysBetween(a: string, b: string) {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}
