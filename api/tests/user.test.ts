import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../src/client', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { getUsers, deleteUser } from '../src/user/user.controller';
import { userRouter } from '../src/user/user.router';

const mockFindMany = prisma.user.findMany as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockDelete = prisma.user.delete as jest.Mock;

// Helpers
const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({ params: {}, body: {}, query: {}, headers: {}, userId: 'test-user-id', ...overrides } as unknown as Request);

const makeRes = (): Response => {
  const res = {} as Response;
  (res as any).status = jest.fn().mockReturnValue(res);
  (res as any).json = jest.fn().mockReturnValue(res);
  return res;
};

// Test app for router integration tests
const testToken = jwt.sign(
  { userId: 'test-user-id', email: 'test@test.com' },
  process.env.JWT_SECRET as string,
);

const app = express();
app.use(express.json());
app.use('/user', userRouter);

const sampleUser = { id: 'user-1', email: 'test@test.com', username: 'testuser' };
const sampleUserWithPassword = { ...sampleUser, password: 'hashed' };

// ─────────────────────── CONTROLLER UNIT TESTS ───────────────────────

describe('User Controller - getUsers', () => {
  it('devrait retourner 200 avec la liste des utilisateurs', async () => {
    mockFindMany.mockResolvedValue([sampleUser]);
    const req = makeReq();
    const res = makeRes();

    await getUsers(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Liste des utilisateurs récupérée avec succès.',
      result: [sampleUser],
    });
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));
    const req = makeReq();
    const res = makeRes();

    await getUsers(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('User Controller - deleteUser', () => {
  it('devrait retourner 400 si userId non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await deleteUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith({ error: "Identifiant d'utilisateur invalide." });
  });

  it('devrait retourner 200 après suppression', async () => {
    mockFindUnique.mockResolvedValue(sampleUserWithPassword);
    mockDelete.mockResolvedValue(sampleUserWithPassword);
    const req = makeReq({ params: { id: 'user-1' } });
    const res = makeRes();

    await deleteUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Utilisateur supprimé avec succès.',
    });
  });

  it('devrait retourner 404 si utilisateur non trouvé', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' } });
    const res = makeRes();

    await deleteUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { id: 'user-1' } });
    const res = makeRes();

    await deleteUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('JWT Middleware', () => {
  it('devrait retourner 401 avec un token invalide', async () => {
    const res = await request(app)
      .get('/user/')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token invalide ou expiré');
  });

  it('devrait retourner 401 avec un token expiré', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-user-id', email: 'test@test.com' },
      process.env.JWT_SECRET as string,
      { expiresIn: '0s' },
    );

    const res = await request(app)
      .get('/user/')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});

describe('User Router', () => {
  it('GET / devrait retourner 401 sans token', async () => {
    const res = await request(app).get('/user/');
    expect(res.status).toBe(401);
  });

  it('GET / devrait retourner 200 avec token valide', async () => {
    mockFindMany.mockResolvedValue([sampleUser]);

    const res = await request(app)
      .get('/user/')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
  });

  it('DELETE /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).delete('/user/user-1');
    expect(res.status).toBe(401);
  });
});
