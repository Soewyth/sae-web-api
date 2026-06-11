import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../src/client', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import { prisma } from '../src/client';
import bcrypt from 'bcrypt';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../src/user/user.controller';
import { userRouter } from '../src/user/user.router';

const mockFindMany = prisma.user.findMany as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockDelete = prisma.user.delete as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;

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

describe('User Controller - getUserById', () => {
  it('devrait retourner 400 si userId non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await getUserById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith({ error: "Identifiant d'utilisateur invalide." });
  });

  it('devrait retourner 200 avec l\'utilisateur trouvé', async () => {
    mockFindUnique.mockResolvedValue(sampleUser);
    const req = makeReq({ params: { userId: 'user-1' } });
    const res = makeRes();

    await getUserById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Utilisateur récupéré avec succès.',
      result: sampleUser,
    });
  });

  it('devrait retourner 404 si utilisateur non trouvé', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { userId: 'unknown' } });
    const res = makeRes();

    await getUserById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('unknown') }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { userId: 'user-1' } });
    const res = makeRes();

    await getUserById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('User Controller - updateUser', () => {
  it('devrait retourner 400 si userId non fourni (typeof check)', async () => {
    const req = makeReq({ params: {}, body: { username: 'new' } });
    const res = makeRes();

    await updateUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith({ error: "Identifiant d'utilisateur invalide." });
  });

  it('devrait retourner 400 si aucun champ fourni', async () => {
    const req = makeReq({ params: { userId: 'user-1' }, body: {} });
    const res = makeRes();

    await updateUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 404 si utilisateur non trouvé', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { userId: 'unknown' }, body: { username: 'new' } });
    const res = makeRes();

    await updateUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 400 si email déjà pris par un autre utilisateur', async () => {
    mockFindUnique
      .mockResolvedValueOnce(sampleUser)
      .mockResolvedValueOnce({ id: 'other-user', email: 'taken@test.com' });
    const req = makeReq({
      params: { userId: 'user-1' },
      body: { email: 'taken@test.com' },
    });
    const res = makeRes();

    await updateUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('taken@test.com') }),
    );
  });

  it('devrait autoriser la mise à jour si l\'email appartient déjà au même utilisateur', async () => {
    mockFindUnique
      .mockResolvedValueOnce(sampleUser)
      .mockResolvedValueOnce({ id: 'user-1', email: 'test@test.com' });
    mockUpdate.mockResolvedValue(sampleUser);
    const req = makeReq({
      params: { userId: 'user-1' },
      body: { email: 'test@test.com' },
    });
    const res = makeRes();

    await updateUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait mettre à jour le username uniquement', async () => {
    mockFindUnique.mockResolvedValue(sampleUser);
    mockUpdate.mockResolvedValue({ ...sampleUser, username: 'newname' });
    const req = makeReq({
      params: { userId: 'user-1' },
      body: { username: 'newname' },
    });
    const res = makeRes();

    await updateUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ username: 'newname' }) }),
    );
  });

  it('devrait hasher le mot de passe lors d\'une mise à jour', async () => {
    mockFindUnique.mockResolvedValue(sampleUser);
    mockHash.mockResolvedValue('new-hashed-password');
    mockUpdate.mockResolvedValue(sampleUser);
    const req = makeReq({
      params: { userId: 'user-1' },
      body: { password: 'newpassword' },
    });
    const res = makeRes();

    await updateUser(req, res);

    expect(mockHash).toHaveBeenCalledWith('newpassword', 10);
    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({
      params: { userId: 'user-1' },
      body: { username: 'newname' },
    });
    const res = makeRes();

    await updateUser(req, res);

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
    const req = makeReq({ params: { userId: 'user-1' } });
    const res = makeRes();

    await deleteUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Utilisateur supprimé avec succès.',
    });
  });

  it('devrait retourner 404 si utilisateur non trouvé', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { userId: 'unknown' } });
    const res = makeRes();

    await deleteUser(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { userId: 'user-1' } });
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

  it('GET /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).get('/user/user-1');
    expect(res.status).toBe(401);
  });

  // Note: le router utilise /:id mais le controller lit req.params.userId — bug de nommage
  it('GET /:id retourne 400 (bug: param nommé :id mais controller lit :userId)', async () => {
    const res = await request(app)
      .get('/user/user-1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(400);
  });

  it('PUT /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).put('/user/user-1').send({ username: 'new' });
    expect(res.status).toBe(401);
  });

  it('DELETE /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).delete('/user/user-1');
    expect(res.status).toBe(401);
  });
});
