PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO actors (id, token_hash, display_name)
VALUES ('actor-seed', 'seed-data-no-login', '在场');

INSERT OR IGNORE INTO places
  (id, name, city, address, latitude, longitude, created_by)
VALUES
  ('beishan', '北山街', '杭州', '浙江省杭州市西湖区北山街', 30.2569, 120.1451, 'actor-seed'),
  ('wukang', '武康路', '上海', '上海市徐汇区武康路', 31.2089, 121.4366, 'actor-seed'),
  ('gulang', '鼓浪屿老巷', '厦门', '福建省厦门市思明区鼓浪屿', 24.4479, 118.0650, 'actor-seed'),
  ('798', '798 东街', '北京', '北京市朝阳区酒仙桥路', 39.9840, 116.4952, 'actor-seed'),
  ('kuanzhai', '宽窄巷子后巷', '成都', '四川省成都市青羊区', 30.6703, 104.0547, 'actor-seed'),
  ('shamian', '沙面北街', '广州', '广东省广州市荔湾区', 23.1057, 113.2430, 'actor-seed');

INSERT OR IGNORE INTO scenes
  (id, place_id, title, latitude, longitude, direction_degrees, created_by)
VALUES
  ('shiqiao-ne', 'beishan', '石桥旁向东北看', 30.2571, 120.1449, 42, 'actor-seed'),
  ('duanqiao', 'beishan', '断桥残雪堤上', 30.2585, 120.1462, 268, 'actor-seed'),
  ('baodi', 'beishan', '宝石山下岔路口', 30.2559, 120.1438, 12, 'actor-seed');

INSERT OR IGNORE INTO memories
  (id, client_request_id, place_id, scene_id, actor_id, note, latitude, longitude,
   captured_at, weather, temperature, visibility, source, gps_accuracy)
VALUES
  ('m-autumn', 'seed-m-autumn', 'beishan', 'shiqiao-ne', 'actor-seed',
   '梧桐叶落下来以后，这条路突然安静了。湖面看不清对岸，但能听见自行车经过湿地面的声音。',
   30.2571, 120.1449, '2025-11-06T15:24:00Z', '小雨', 14, 'public', 'exif', 8),
  ('m-spring', 'seed-m-spring', 'beishan', 'shiqiao-ne', 'actor-seed',
   '春天的湖面比你照片里亮很多。我沿着你的路线走了一遍，在同一棵树下拍了这张照片。',
   30.2571, 120.1449, '2026-04-12T16:37:00Z', '晴', 19, 'public', 'exif', 12),
  ('m-winter', 'seed-m-winter', 'beishan', 'shiqiao-ne', 'actor-seed',
   '雾把湖岸藏了起来，树枝的轮廓反而比平时更清楚。',
   30.2571, 120.1449, '2026-01-18T09:12:00Z', '雾', 6, 'public', 'exif', 15),
  ('m-duanqiao-1', 'seed-m-duanqiao-1', 'beishan', 'duanqiao', 'actor-seed',
   '断桥的雪没等到，但堤上的枯荷有种干净的骨架。',
   30.2585, 120.1462, '2025-12-28T08:40:00Z', '阴', 3, 'public', 'manual', 10),
  ('m-duanqiao-2', 'seed-m-duanqiao-2', 'beishan', 'duanqiao', 'actor-seed',
   '柳絮比桃花先来。堤上的风把湖面吹出细纹，像揉皱的宣纸。',
   30.2585, 120.1462, '2026-03-02T17:05:00Z', '晴', 15, 'public', 'manual', 18),
  ('m-baodi-1', 'seed-m-baodi-1', 'beishan', 'baodi', 'actor-seed',
   '岔路口有棵老樟树，冬天也能闻到淡淡的香。',
   30.2559, 120.1438, '2026-02-10T11:30:00Z', '晴', 8, 'public', 'manual', 14),
  ('m-wukang', 'seed-m-wukang', 'wukang', NULL, 'actor-seed',
   '转角的咖啡馆换了老板，窗边座位还是老样子。',
   31.2089, 121.4366, '2025-10-22T10:00:00Z', '多云', 18, 'public', 'manual', NULL),
  ('m-gulang', 'seed-m-gulang', 'gulang', NULL, 'actor-seed',
   '海风带着盐味吹进小巷。台阶上的猫没有看我。',
   24.4479, 118.0650, '2025-08-03T10:00:00Z', '阵雨', 28, 'public', 'manual', NULL),
  ('m-798', 'seed-m-798', '798', NULL, 'actor-seed',
   '冬天里的红砖厂房，管道结着薄霜。',
   39.9840, 116.4952, '2025-12-14T10:00:00Z', '晴', -2, 'public', 'manual', NULL),
  ('m-kuanzhai', 'seed-m-kuanzhai', 'kuanzhai', NULL, 'actor-seed',
   '老茶馆里下午三点还很热闹，麻将声比说话声大。',
   30.6703, 104.0547, '2026-01-08T10:00:00Z', '阴', 9, 'public', 'manual', NULL),
  ('m-shamian', 'seed-m-shamian', 'shamian', NULL, 'actor-seed',
   '老榕树的气根垂到栏杆上，江边有人在钓鱼。',
   23.1057, 113.2430, '2025-09-18T10:00:00Z', '晴', 31, 'public', 'manual', NULL);

INSERT OR IGNORE INTO media_assets
  (id, memory_id, r2_key, url, original_name, content_type, byte_size, sort_order)
VALUES
  ('asset-autumn', 'm-autumn', NULL, '/assets/scene-autumn.jpg', 'scene-autumn.jpg', 'image/jpeg', 0, 0),
  ('asset-spring', 'm-spring', NULL, '/assets/scene-spring.jpg', 'scene-spring.jpg', 'image/jpeg', 0, 0),
  ('asset-winter', 'm-winter', NULL, '/assets/scene-winter.jpg', 'scene-winter.jpg', 'image/jpeg', 0, 0),
  ('asset-duanqiao-1', 'm-duanqiao-1', NULL, '/assets/scene-autumn.jpg', 'scene-autumn.jpg', 'image/jpeg', 0, 0),
  ('asset-duanqiao-2', 'm-duanqiao-2', NULL, '/assets/scene-spring.jpg', 'scene-spring.jpg', 'image/jpeg', 0, 0),
  ('asset-baodi-1', 'm-baodi-1', NULL, '/assets/scene-winter.jpg', 'scene-winter.jpg', 'image/jpeg', 0, 0),
  ('asset-wukang', 'm-wukang', NULL, '/assets/upload-photo.jpg', 'upload-photo.jpg', 'image/jpeg', 0, 0),
  ('asset-gulang', 'm-gulang', NULL, '/assets/scene-spring.jpg', 'scene-spring.jpg', 'image/jpeg', 0, 0),
  ('asset-798', 'm-798', NULL, '/assets/scene-winter.jpg', 'scene-winter.jpg', 'image/jpeg', 0, 0),
  ('asset-kuanzhai', 'm-kuanzhai', NULL, '/assets/scene-autumn.jpg', 'scene-autumn.jpg', 'image/jpeg', 0, 0),
  ('asset-shamian', 'm-shamian', NULL, '/assets/upload-photo.jpg', 'upload-photo.jpg', 'image/jpeg', 0, 0);
