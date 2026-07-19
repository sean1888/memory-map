const autumnImg = "/assets/scene-autumn.jpg";
const springImg = "/assets/scene-spring.jpg";
const winterImg = "/assets/scene-winter.jpg";
const uploadImg = "/assets/upload-photo.jpg";

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
  {
    id: "m-duanqiao-1",
    sceneId: "duanqiao",
    author: "林夏",
    authorInitial: "夏",
    imageUrl: autumnImg,
    capturedAt: "2025 年 12 月 28 日 · 08:40",
    isoDate: "2025-12-28",
    season: "冬",
    weather: "阴",
    temperature: "3°C",
    note: "断桥的雪没等到，但堤上的枯荷有种干净的骨架。",
    visibility: "public",
    source: "EXIF",
    gpsAccuracy: "约 10 米",
    shortLabel: "2025 冬堤",
  },
  {
    id: "m-duanqiao-2",
    sceneId: "duanqiao",
    author: "苏禾",
    authorInitial: "禾",
    imageUrl: springImg,
    capturedAt: "2026 年 3 月 2 日 · 17:05",
    isoDate: "2026-03-02",
    season: "春",
    weather: "晴",
    temperature: "15°C",
    note: "柳絮比桃花先来。堤上的风把湖面吹出细纹，像揉皱的宣纸。",
    visibility: "participants",
    source: "手动",
    gpsAccuracy: "约 18 米",
    shortLabel: "2026 春柳",
  },
  {
    id: "m-baodi-1",
    sceneId: "baodi",
    author: "周屿",
    authorInitial: "屿",
    imageUrl: winterImg,
    capturedAt: "2026 年 2 月 10 日 · 11:30",
    isoDate: "2026-02-10",
    season: "冬",
    weather: "晴",
    temperature: "8°C",
    note: "岔路口有棵老樟树，冬天也能闻到淡淡的香。",
    visibility: "link",
    source: "EXIF",
    gpsAccuracy: "约 14 米",
    shortLabel: "2026 樟树",
  },
];

export const scene = scenes[0];

export const uploadPhotoUrl = uploadImg;

export function daysBetween(a: string, b: string) {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}
