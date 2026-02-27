import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  createTestApp,
  registerUser,
  authHeader,
  createBoard,
  createList,
  createCard,
} from './helpers.js';

describe('List routes', () => {
  let app: FastifyInstance;
  let cookie: string;
  let boardId: string;

  beforeEach(async () => {
    app = await createTestApp();
    const { sessionCookie } = await registerUser(app);
    cookie = sessionCookie!;
    const { body } = await createBoard(app, cookie, 'Test Board');
    boardId = body.board.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/boards/:boardId/lists', () => {
    it('creates a list', async () => {
      const { response, body } = await createList(app, cookie, boardId, 'To Do');
      expect(response.statusCode).toBe(201);
      expect(body.list.name).toBe('To Do');
      expect(body.list.boardId).toBe(boardId);
      expect(body.list.position).toBeDefined();
    });

    it('assigns ordered positions to multiple lists', async () => {
      const { body: l1 } = await createList(app, cookie, boardId, 'To Do');
      const { body: l2 } = await createList(app, cookie, boardId, 'In Progress');
      const { body: l3 } = await createList(app, cookie, boardId, 'Done');

      expect(l1.list.position < l2.list.position).toBe(true);
      expect(l2.list.position < l3.list.position).toBe(true);
    });

    it('rejects empty name', async () => {
      const { response } = await createList(app, cookie, boardId, '');
      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/v1/lists/:listId', () => {
    it('updates list name', async () => {
      const { body: listBody } = await createList(app, cookie, boardId, 'To Do');
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lists/${listBody.list.id}`,
        headers: authHeader(cookie),
        payload: { name: 'Done' },
      });
      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(200);
      expect(body.list.name).toBe('Done');
    });
  });

  describe('PATCH /api/v1/lists/:listId/reorder', () => {
    it('updates list position', async () => {
      const { body: listBody } = await createList(app, cookie, boardId, 'To Do');
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lists/${listBody.list.id}/reorder`,
        headers: authHeader(cookie),
        payload: { position: 'b0' },
      });
      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(200);
      expect(body.list.position).toBe('b0');
    });
  });

  describe('DELETE /api/v1/lists/:listId', () => {
    it('deletes list and cascades cards', async () => {
      const { body: listBody } = await createList(app, cookie, boardId, 'To Do');
      await createCard(app, cookie, listBody.list.id, 'Task 1');

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/lists/${listBody.list.id}`,
        headers: authHeader(cookie),
      });
      expect(deleteRes.statusCode).toBe(200);

      // Verify board has no lists
      const boardRes = await app.inject({
        method: 'GET',
        url: `/api/v1/boards/${boardId}`,
        headers: authHeader(cookie),
      });
      const boardBody = JSON.parse(boardRes.body);
      expect(boardBody.board.lists).toHaveLength(0);
    });
  });
});
