import { getCloudflareContext } from "@opennextjs/cloudflare";

export type AppBindings = CloudflareEnv & {
  DB: D1Database;
  IMAGES: R2Bucket;
};

export function getBindings(): AppBindings {
  return getCloudflareContext().env as AppBindings;
}

export function getDatabase(bookmark?: string | null): D1Database | D1DatabaseSession {
  const { DB } = getBindings();
  return DB.withSession(bookmark || "first-unconstrained");
}
