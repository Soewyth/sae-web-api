import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../src/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    log: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { getLogs } from '../src/log/log.controller';
import { logRouter } from '../src/log/log.router';

const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockLogFindMany = prisma.log.findMany as jest.Mock;

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({ params: {}, body: {}, query: {}, headers: {}, userId: 'user-1', ...overrides } as unknown as Request);

const makeRes = (): Response => {
  const res = {} as Response;
  (res as any).status = jest.fn().mockReturnValue(res);
  (res as any).json = jest.fn().mockReturnValue(res);
  return res;
};

const testToken = jwt.sign(
  { userId: 'user-1', email: 'test@test.com' },
  process.env.JWT_SECRET as string,
);

const app = express();
app.use(express.json());
app.use('/logs', logRouter);

const sampleLog = {
  id: 'log-1',
  method: 'GET',
  route: '/event',
  details: { query: { page: '1' } },
  date: new Date(),
  createdAt: new Date(),
  createdBy: 'user-1',
  FK_userId: 'user-1',
  fk_eventId: null,
  fk_reviewId: null,
  user: { username: 'user' },
};

const findManyArgs = (where: object) => ({
  where,
  include: { user: { select: { username: true } } },
  orderBy: { date: 'desc' },
});

const regularUser = { id: 'user-1', email: 'test@test.com', username: 'user', isAdmin: false };
const adminUser = { id: 'admin-1', email: 'admin@test.com', username: 'admin', isAdmin: true };

// ─────────────────────── CONTROLLER UNIT TESTS ───────────────────────

describe('Log Controller - getLogs', () => {
  it('devrait retourner 401 si userId absent', async () => {
    const req = makeReq({ userId: undefined });
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(401);
    expect((res as any).json).toHaveBeenCalledWith({ message: 'Utilisateur non authentifié.' });
  });

  it('devrait retourner 404 si utilisateur non trouvé', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const req = makeReq({ userId: 'unknown' });
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
    expect((res as any).json).toHaveBeenCalledWith({ message: 'Utilisateur introuvable.' });
  });

  it('devrait retourner 200 avec tous les logs si utilisateur admin', async () => {
    mockUserFindUnique.mockResolvedValue(adminUser);
    mockLogFindMany.mockResolvedValue([sampleLog]);
    const req = makeReq({ userId: 'admin-1' });
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect(mockLogFindMany).toHaveBeenCalledWith(findManyArgs({})); // sans filtre
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Liste des logs récupérée avec succès.',
      result: [sampleLog],
    });
  });

  it('devrait retourner 200 avec uniquement ses logs si utilisateur non admin', async () => {
    mockUserFindUnique.mockResolvedValue(regularUser);
    mockLogFindMany.mockResolvedValue([sampleLog]);
    const req = makeReq({ userId: 'user-1' });
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect(mockLogFindMany).toHaveBeenCalledWith(findManyArgs({ FK_userId: 'user-1' }));
  });

  it('devrait filtrer par utilisateur et méthode si admin', async () => {
    mockUserFindUnique.mockResolvedValue(adminUser);
    mockLogFindMany.mockResolvedValue([sampleLog]);
    const req = makeReq({
      userId: 'admin-1',
      query: { userId: 'user-1', method: 'POST' },
    } as Partial<Request>);
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect(mockLogFindMany).toHaveBeenCalledWith(
      findManyArgs({ FK_userId: 'user-1', method: 'POST' }),
    );
  });

  it('devrait retourner 400 si la méthode de filtre est invalide', async () => {
    mockUserFindUnique.mockResolvedValue(adminUser);
    const req = makeReq({
      userId: 'admin-1',
      query: { method: 'PATCH' },
    } as Partial<Request>);
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it("devrait ignorer le filtre utilisateur si l'utilisateur n'est pas admin", async () => {
    mockUserFindUnique.mockResolvedValue(regularUser);
    mockLogFindMany.mockResolvedValue([sampleLog]);
    const req = makeReq({
      userId: 'user-1',
      query: { userId: 'someone-else' },
    } as Partial<Request>);
    const res = makeRes();

    await getLogs(req, res);

    expect(mockLogFindMany).toHaveBeenCalledWith(findManyArgs({ FK_userId: 'user-1' }));
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockUserFindUnique.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq({ userId: 'user-1' });
    const res = makeRes();

    await getLogs(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('Log Router', () => {
  it('GET / devrait retourner 401 sans token', async () => {
    const res = await request(app).get('/logs/');

    expect(res.status).toBe(401);
  });

  it('GET / devrait retourner 200 avec token valide (user non admin)', async () => {
    mockUserFindUnique.mockResolvedValue(regularUser);
    mockLogFindMany.mockResolvedValue([sampleLog]);

    const res = await request(app)
      .get('/logs/')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
  });

  it('GET / devrait retourner 200 avec token admin', async () => {
    const adminToken = jwt.sign(
      { userId: 'admin-1', email: 'admin@test.com' },
      process.env.JWT_SECRET as string,
    );
    mockUserFindUnique.mockResolvedValue(adminUser);
    mockLogFindMany.mockResolvedValue([sampleLog]);

    const res = await request(app)
      .get('/logs/')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
