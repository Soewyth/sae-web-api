import request from 'supertest';
import express from 'express';

jest.mock('../src/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

import { prisma } from '../src/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRouter } from '../src/auth/auth.router';

const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockUserCreate = prisma.user.create as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockJwtSign = jwt.sign as jest.Mock;

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

const sampleUser = {
  id: 'user-1',
  email: 'test@test.com',
  username: 'testuser',
  password: 'hashed-password',
};

describe('Auth Router', () => {
  describe('POST /auth/register', () => {
    it('devrait retourner 400 si email manquant', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ password: 'password123', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email, password et username requis');
    });

    it('devrait retourner 400 si password manquant', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email, password et username requis');
    });

    it('devrait retourner 400 si username manquant', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email, password et username requis');
    });

    it('devrait retourner 400 si body vide', async () => {
      const res = await request(app).post('/auth/register').send({});

      expect(res.status).toBe(400);
    });

    it('devrait retourner 400 si email déjà utilisé', async () => {
      mockUserFindUnique.mockResolvedValue(sampleUser);

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email déjà utilisé');
    });

    it('devrait retourner 201 avec les données utilisateur si succès', async () => {
      mockUserFindUnique.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed-password');
      mockUserCreate.mockResolvedValue(sampleUser);

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123', username: 'testuser' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Utilisateur créé');
      expect(res.body.user).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
      });
    });

    it('devrait retourner 500 sur erreur serveur', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123', username: 'testuser' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Erreur serveur');
    });
  });

  describe('POST /auth/login', () => {
    it('devrait retourner 401 si utilisateur non trouvé', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'unknown@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Email ou mot de passe incorrect');
    });

    it('devrait retourner 401 si mot de passe incorrect', async () => {
      mockUserFindUnique.mockResolvedValue(sampleUser);
      mockCompare.mockResolvedValue(false);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Email ou mot de passe incorrect');
    });

    it('devrait retourner 200 avec token si credentials valides', async () => {
      mockUserFindUnique.mockResolvedValue(sampleUser);
      mockCompare.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('mock-jwt-token');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Connexion réussie');
      expect(res.body.token).toBe('mock-jwt-token');
      expect(res.body.user).toEqual({ id: 'user-1', email: 'test@test.com' });
    });

    it('devrait retourner 500 sur erreur serveur', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erreur serveur');
    });
  });
});
