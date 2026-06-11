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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import {
  postReview,
  putReview,
  deleteReview,
} from '../src/review/review.controller';
import { reviewRouter } from '../src/review/review.router';

const mockEventFindUnique = prisma.event.findUnique as jest.Mock;
const mockReviewFindUnique = prisma.userReview.findUnique as jest.Mock;
const mockReviewCreate = prisma.userReview.create as jest.Mock;
const mockReviewUpdate = prisma.userReview.update as jest.Mock;
const mockReviewDelete = prisma.userReview.delete as jest.Mock;

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

// ─────────────────────── putReview ───────────────────────

describe('Review Controller - putReview', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await putReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 404 si review non trouvée', async () => {
    mockReviewFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' }, body: { rating: 4 } });
    const res = makeRes();

    await putReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 200 après mise à jour', async () => {
    mockReviewFindUnique.mockResolvedValue(sampleReview);
    mockReviewUpdate.mockResolvedValue({ ...sampleReview, rating: 4 });
    const req = makeReq({ params: { id: 'review-1' }, body: { rating: 4, comment: 'Bien' } });
    const res = makeRes();

    await putReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('review-1') }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockReviewFindUnique.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq({ params: { id: 'review-1' }, body: { rating: 4 } });
    const res = makeRes();

    await putReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── deleteReview ───────────────────────

describe('Review Controller - deleteReview', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await deleteReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 404 si review non trouvée', async () => {
    mockReviewFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' } });
    const res = makeRes();

    await deleteReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 200 après suppression', async () => {
    mockReviewFindUnique.mockResolvedValue(sampleReview);
    mockReviewDelete.mockResolvedValue(sampleReview);
    const req = makeReq({ params: { id: 'review-1' } });
    const res = makeRes();

    await deleteReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('review-1') }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockReviewFindUnique.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq({ params: { id: 'review-1' } });
    const res = makeRes();

    await deleteReview(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('Review Router', () => {
  it('PUT /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).put('/review/review-1').send({ rating: 4 });

    expect(res.status).toBe(401);
  });

  it('PUT /:id devrait retourner 200 avec token valide', async () => {
    mockReviewFindUnique.mockResolvedValue(sampleReview);
    mockReviewUpdate.mockResolvedValue(sampleReview);

    const res = await request(app)
      .put('/review/review-1')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(200);
  });

  it('DELETE /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).delete('/review/review-1');

    expect(res.status).toBe(401);
  });

  it('DELETE /:id devrait retourner 200 avec token valide', async () => {
    mockReviewFindUnique.mockResolvedValue(sampleReview);
    mockReviewDelete.mockResolvedValue(sampleReview);

    const res = await request(app)
      .delete('/review/review-1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
  });
});
