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

describe('Board routes', () => {
  let app: FastifyInstance;
  let cookie: string;

  beforeEach(async () => {
    app = await createTestApp();
    const { sessionCookie } = await registerUser(app);
    cookie = sessionCookie!;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/boards', () => {
    it('creates a board', async () => {
      const { response, body } = await createBoard(app, cookie, 'My Board');
      expect(response.statusCode).toBe(201);
      expect(body.board.name).toBe('My Board');
      expect(body.board.id).toBeDefined();
    });

    it('rejects empty name', async () => {
      const { response, body } = await createBoard(app, cookie, '');
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('requires auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/boards',
        payload: { name: 'Test' },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/boards', () => {
    it('returns user boards', async () => {
      await createBoard(app, cookie, 'Board 1');
      await createBoard(app, cookie, 'Board 2');

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/boards',
        headers: authHeader(cookie),
      });
      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(200);
      expect(body.boards).toHaveLength(2);
    });

    it('does not return other users boards', async () => {
      await createBoard(app, cookie, 'Board 1');

      const { sessionCookie: otherCookie } = await registerUser(app, {
        email: 'other@example.com',
        username: 'other',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/boards',
        headers: authHeader(otherCookie!),
      });
      const body = JSON.parse(response.body);
      expect(body.boards).toHaveLength(0);
    });
  });

  describe('GET /api/v1/boards/:boardId', () => {
    it('returns board with lists and cards', async () => {
      const { body: boardBody } = await createBoard(app, cookie, 'My Board');
      const boardId = boardBody.board.id;

      const { body: listBody } = await createList(app, cookie, boardId, 'To Do');
      await createCard(app, cookie, listBody.list.id, 'Task 1');
      await createCard(app, cookie, listBody.list.id, 'Task 2');

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/boards/${boardId}`,
        headers: authHeader(cookie),
      });
      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(200);
      expect(body.board.name).toBe('My Board');
      expect(body.board.lists).toHaveLength(1);
      expect(body.board.lists[0].name).toBe('To Do');
      expect(body.board.lists[0].cards).toHaveLength(2);
    });

    it('returns 404 for non-existent board', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/boards/nonexistent',
        headers: authHeader(cookie),
      });
      expect(response.statusCode).toBe(404);
    });

    it('returns 403 for other users board', async () => {
      const { body: boardBody } = await createBoard(app, cookie, 'My Board');
      const { sessionCookie: otherCookie } = await registerUser(app, {
        email: 'other@example.com',
        username: 'other',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/boards/${boardBody.board.id}`,
        headers: authHeader(otherCookie!),
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/v1/boards/:boardId', () => {
    it('updates board name', async () => {
      const { body: boardBody } = await createBoard(app, cookie);
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/boards/${boardBody.board.id}`,
        headers: authHeader(cookie),
        payload: { name: 'Updated Name' },
      });
      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(200);
      expect(body.board.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/v1/boards/:boardId', () => {
    it('deletes board and cascades', async () => {
      const { body: boardBody } = await createBoard(app, cookie);
      const boardId = boardBody.board.id;

      const { body: listBody } = await createList(app, cookie, boardId);
      await createCard(app, cookie, listBody.list.id, 'Card 1');

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/boards/${boardId}`,
        headers: authHeader(cookie),
      });
      expect(deleteRes.statusCode).toBe(200);

      // Verify board is gone
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/v1/boards/${boardId}`,
        headers: authHeader(cookie),
      });
      expect(getRes.statusCode).toBe(404);
    });
  });
});
