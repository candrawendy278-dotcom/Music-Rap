import { db } from './index.ts';
import { users, saves } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  const result = await db.insert(users)
    .values({ uid, email })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email },
    })
    .returning();
  return result[0];
}

export async function saveGameState(uid: string, gameState: any) {
  const result = await db.insert(saves)
    .values({ userId: uid, gameState })
    .onConflictDoUpdate({
      target: saves.userId,
      set: { gameState, updatedAt: new Date() },
    })
    .returning();
  return result[0];
}

export async function getGameState(uid: string) {
  try {
    const result = await db.select().from(saves).where(eq(saves.userId, uid)).limit(1);
    return result.length > 0 ? result[0].gameState : null;
  } catch (error) {
    console.error("Database query failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
