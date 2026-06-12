import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../src/client', () => ({
  prisma: {
    userReview: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { getReviews } from '../src/review/review.controller';
import { reviewRouter } from '../src/review/review.router';

const mockReviewFindMany = prisma.userReview.findMany as jest.Mock;

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
});
