import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../src/client', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    userReview: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { getReviews, postReview } from '../src/review/review.controller';
import { reviewRouter } from '../src/review/review.router';
import { eventRouter } from '../src/event/event.router';

const mockEventFindUnique = prisma.event.findUnique as jest.Mock;
const mockReviewFindMany = prisma.userReview.findMany as jest.Mock;
const mockReviewCreate = prisma.userReview.create as jest.Mock;

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
app.use('/review', reviewRouter);
app.use('/event', eventRouter);

const sampleEvent = { id: 'event-1', title: 'Festival' };
const sampleReview = {
  id: 'review-1',
  rating: 5,
  comment: 'Super!',
  FK_EventId: 'event-1',
  FK_userId: 'user-1',
  createdAt: new Date(),
  createdBy: 'user-1',
};

const sampleReviews = [
  {
    id: 'review-1',
    rating: 5,
    comment: 'Super!',
    user: { username: 'alice' },
    event: { title: 'Festival', city: { name: 'Paris' } },
  },
];

// ─────────────────────── getReviews ───────────────────────

describe('Review Controller - getReviews', () => {
  it('devrait retourner 200 avec la liste des avis', async () => {
    mockReviewFindMany.mockResolvedValue(sampleReviews);
    const req = makeReq();
    const res = makeRes();

    await getReviews(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Liste des avis récupérée avec succès.',
      result: sampleReviews,
    });
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockReviewFindMany.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq();
    const res = makeRes();

    await getReviews(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── postReview ───────────────────────

describe('Review Controller - postReview', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await postReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith({ error: "Identifiant d'événement invalide." });
  });

  it('devrait retourner 400 si rating manquant', async () => {
    const req = makeReq({ params: { id: 'event-1' }, body: { comment: 'ok' } });
    const res = makeRes();

    await postReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si événement non trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' }, body: { rating: 5 } });
    const res = makeRes();

    await postReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 401 si userId absent', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    const req = makeReq({ params: { id: 'event-1' }, body: { rating: 5 }, userId: undefined });
    const res = makeRes();

    await postReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(401);
    expect((res as any).json).toHaveBeenCalledWith({ message: 'Utilisateur non authentifié.' });
  });

  it('devrait retourner 201 avec la review créée', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockReviewCreate.mockResolvedValue(sampleReview);
    const req = makeReq({ params: { id: 'event-1' }, body: { rating: 5, comment: 'Super!' } });
    const res = makeRes();

    await postReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(201);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Review créée avec succès.',
      result: sampleReview,
    });
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockEventFindUnique.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq({ params: { id: 'event-1' }, body: { rating: 5 } });
    const res = makeRes();

    await postReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('Review Router', () => {
  it('GET / devrait retourner 401 sans token', async () => {
    const res = await request(app).get('/review/');

    expect(res.status).toBe(401);
  });

  it('GET / devrait retourner 200 avec token valide', async () => {
    mockReviewFindMany.mockResolvedValue(sampleReviews);

    const res = await request(app)
      .get('/review/')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
  });

  it('POST /event/:id/review devrait retourner 401 sans token', async () => {
    const res = await request(app).post('/event/event-1/review').send({ rating: 5 });

    expect(res.status).toBe(401);
  });

  it('POST /event/:id/review devrait retourner 201 avec token valide', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockReviewCreate.mockResolvedValue(sampleReview);

    const res = await request(app)
      .post('/event/event-1/review')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ rating: 5, comment: 'Super!' });

    expect(res.status).toBe(201);
  });
});
