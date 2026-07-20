export async function canAccessMemory(
  db: D1Database | D1DatabaseSession,
  memoryId: string,
  actorId: string | null,
): Promise<boolean> {
  const memory = await db
    .prepare("SELECT actor_id, visibility FROM memories WHERE id = ? AND deleted_at IS NULL")
    .bind(memoryId)
    .first<{ actor_id: string; visibility: string }>();
  return Boolean(memory && (memory.visibility === "public" || memory.actor_id === actorId));
}
