import { eq, and, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Database } from '../db/index.js';
import { boards, lists, cards } from '../db/schema.js';
import type { CreateBoardInput, UpdateBoardInput } from '@kanbang/shared/validation/board.js';

export class BoardService {
  constructor(private db: Database) {}

  async create(userId: string, input: CreateBoardInput) {
    const now = new Date();
    const [board] = await this.db
      .insert(boards)
      .values({
        id: nanoid(),
        name: input.name,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return board;
  }

  async getAll(userId: string) {
    return this.db
      .select()
      .from(boards)
      .where(eq(boards.userId, userId))
      .orderBy(asc(boards.createdAt));
  }

  async getById(boardId: string) {
    const [board] = await this.db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (!board) return null;

    const boardLists = await this.db
      .select()
      .from(lists)
      .where(eq(lists.boardId, boardId))
      .orderBy(asc(lists.position));

    const listsWithCards = await Promise.all(
      boardLists.map(async (list) => {
        const listCards = await this.db
          .select()
          .from(cards)
          .where(eq(cards.listId, list.id))
          .orderBy(asc(cards.position));

        return { ...list, cards: listCards };
      }),
    );

    return { ...board, lists: listsWithCards };
  }

  async update(boardId: string, input: UpdateBoardInput) {
    const [board] = await this.db
      .update(boards)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(boards.id, boardId))
      .returning();

    return board ?? null;
  }

  async delete(boardId: string) {
    const [board] = await this.db
      .delete(boards)
      .where(eq(boards.id, boardId))
      .returning();

    return !!board;
  }

  async isOwner(boardId: string, userId: string) {
    const [board] = await this.db
      .select({ userId: boards.userId })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
      .limit(1);

    return !!board;
  }
}
