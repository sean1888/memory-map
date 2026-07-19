export type MemoryEntry = {
  id: string;
  author: string;
  authorInitial: string;
  date: string;
  weather: string;
  temp: string;
  text: string;
  photos: string[];
};

export type Place = {
  id: string;
  name: string;
  city: string;
  x: number; // % on map
  y: number;
  entries: MemoryEntry[];
};

// Real photography from picsum with fixed seeds for reliable, thematic-feeling images
const p = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const places: Place[] = [
  {
    id: "beishan",
    name: "北山街",
    city: "杭州",
    x: 32,
    y: 44,
    entries: [
      {
        id: "linxia",
        author: "林夏",
        authorInitial: "夏",
        date: "2025年11月6日",
        weather: "小雨",
        temp: "14°C",
        text: "梧桐叶落下来以后，这条路突然安静了。湖面看不清对岸，但能听见自行车经过湿地面的声音。",
        photos: [
          p("beishan-autumn-1"),
          p("beishan-autumn-2"),
          p("beishan-autumn-3"),
          p("beishan-autumn-4"),
          p("beishan-autumn-5"),
        ],
      },
      {
        id: "zhouyu",
        author: "周屿",
        authorInitial: "屿",
        date: "2026年4月12日",
        weather: "晴",
        temp: "19°C",
        text: "春天来的时候路又不一样了。樱花落在自行车筐里，坐在长椅上吃了一个橘子。想起你去年在这里拍的照片，梧桐还没有长出叶子。",
        photos: [p("beishan-spring-1"), p("beishan-spring-2"), p("beishan-spring-3")],
      },
    ],
  },
  {
    id: "wukang",
    name: "武康路",
    city: "上海",
    x: 58,
    y: 38,
    entries: [
      {
        id: "e1",
        author: "陈临",
        authorInitial: "临",
        date: "2025年10月22日",
        weather: "多云",
        temp: "18°C",
        text: "转角的咖啡馆换了老板，窗边座位还是老样子。",
        photos: [p("wukang-1"), p("wukang-2"), p("wukang-3")],
      },
    ],
  },
  {
    id: "gulang",
    name: "鼓浪屿老巷",
    city: "厦门",
    x: 46,
    y: 62,
    entries: [
      {
        id: "e2",
        author: "苏禾",
        authorInitial: "禾",
        date: "2025年8月3日",
        weather: "阵雨",
        temp: "28°C",
        text: "海风带着盐味吹进小巷。台阶上的猫没有看我。",
        photos: [p("gulang-1"), p("gulang-2"), p("gulang-3"), p("gulang-4")],
      },
    ],
  },
  {
    id: "798",
    name: "798 东街",
    city: "北京",
    x: 70,
    y: 26,
    entries: [
      {
        id: "e3",
        author: "阿樊",
        authorInitial: "樊",
        date: "2025年12月14日",
        weather: "晴",
        temp: "-2°C",
        text: "冬天里的红砖厂房，管道结着薄霜。",
        photos: [p("798-1"), p("798-2")],
      },
    ],
  },
  {
    id: "kuanzhai",
    name: "宽窄巷子后巷",
    city: "成都",
    x: 24,
    y: 68,
    entries: [
      {
        id: "e4",
        author: "小满",
        authorInitial: "满",
        date: "2026年1月8日",
        weather: "阴",
        temp: "9°C",
        text: "老茶馆里下午三点还很热闹，麻将声比说话声大。",
        photos: [p("kuanzhai-1"), p("kuanzhai-2"), p("kuanzhai-3")],
      },
    ],
  },
  {
    id: "shamian",
    name: "沙面北街",
    city: "广州",
    x: 40,
    y: 78,
    entries: [
      {
        id: "e5",
        author: "阿宁",
        authorInitial: "宁",
        date: "2025年9月18日",
        weather: "晴",
        temp: "31°C",
        text: "老榕树的气根垂到栏杆上，江边有人在钓鱼。",
        photos: [p("shamian-1"), p("shamian-2")],
      },
    ],
  },
];

export const primaryPlace = places[0];
