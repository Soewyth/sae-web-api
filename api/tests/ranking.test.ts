import request from 'supertest';
import express from 'express';

jest.mock('../src/client', () => ({
  prisma: {
    cityRanking: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userReview: {
      groupBy: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { rankingRouter } from '../src/ranking/ranking.router';

const mockCityRankingFindMany = prisma.cityRanking.findMany as jest.Mock;
const mockCityRankingCount = prisma.cityRanking.count as jest.Mock;
const mockUserReviewGroupBy = prisma.userReview.groupBy as jest.Mock;
const mockEventFindMany = prisma.event.findMany as jest.Mock;

const app = express();
app.use(express.json());
app.use('/ranking', rankingRouter);

const sampleCityRanking = {
  FK_cityId: 'city-1',
  score: 3.4,
  eventCount: 3,
  rank: 1,
  updatedAt: new Date('2026-06-12'),
  city: {
    id: 'city-1',
    name: 'Paris',
    region: 'Île-de-France',
    imageUrl: 'https://example.com/paris.jpg',
  },
};

describe('Ranking Router - GET /ranking/cities', () => {
  it('devrait retourner 200 avec le classement paginé des villes', async () => {
    mockCityRankingCount.mockResolvedValue(45);
    mockCityRankingFindMany.mockResolvedValue([sampleCityRanking]);

    const res = await request(app).get('/ranking/cities');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
    expect(res.body.result).toHaveLength(1);
    expect(res.body.result[0]).toMatchObject({
      rank: 1,
      score: 3.4,
      eventCount: 3,
      city: { id: 'city-1', name: 'Paris' },
    });
  });

  it('devrait respecter les paramètres page et limit', async () => {
    mockCityRankingCount.mockResolvedValue(45);
    mockCityRankingFindMany.mockResolvedValue([]);

    const res = await request(app).get('/ranking/cities?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 2, limit: 10, totalPages: 5 });
    expect(mockCityRankingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockCityRankingCount.mockRejectedValue(new Error('DB error'));
    mockCityRankingFindMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/ranking/cities');

    expect(res.status).toBe(500);
  });
});

describe('Ranking Router - GET /ranking/events', () => {
  it('devrait classer tous les événements, y compris ceux sans review', async () => {
    mockUserReviewGroupBy.mockResolvedValue([
      { FK_EventId: 'event-1', _avg: { rating: 3 }, _count: { rating: 2 } },
      { FK_EventId: 'event-2', _avg: { rating: 5 }, _count: { rating: 1 } },
    ]);
    mockEventFindMany.mockResolvedValue([
      {
        id: 'event-1',
        title: 'Festival A',
        type: 'FESTIVAL',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-03'),
        imageUrl: null,
        city: { id: 'city-1', name: 'Paris', region: 'Île-de-France' },
      },
      {
        id: 'event-2',
        title: 'Concert B',
        type: 'CONCERT',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-01'),
        imageUrl: null,
        city: { id: 'city-2', name: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
      },
      {
        id: 'event-3',
        title: 'Expo C sans review',
        type: 'EXPOSITION',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-02'),
        imageUrl: null,
        city: { id: 'city-1', name: 'Paris', region: 'Île-de-France' },
      },
    ]);

    const res = await request(app).get('/ranking/events');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.result).toHaveLength(3);
    expect(res.body.result[0]).toMatchObject({
      rank: 1,
      score: 5,
      reviewCount: 1,
      event: { id: 'event-2', title: 'Concert B' },
    });
    expect(res.body.result[1]).toMatchObject({
      rank: 2,
      score: 3,
      event: { id: 'event-1' },
    });
    // L'événement sans review est inclus avec un score de 0
    expect(res.body.result[2]).toMatchObject({
      rank: 3,
      score: 0,
      reviewCount: 0,
      event: { id: 'event-3' },
    });
  });

  it('devrait paginer les événements', async () => {
    mockUserReviewGroupBy.mockResolvedValue([]);
    mockEventFindMany.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({
        id: `event-${i}`,
        title: `Événement ${String(i).padStart(2, '0')}`,
        type: 'CONCERT',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-01'),
        imageUrl: null,
        city: { id: 'city-1', name: 'Paris', region: 'Île-de-France' },
      })),
    );

    const res = await request(app).get('/ranking/events?page=2');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 2, total: 25, totalPages: 2 });
    expect(res.body.result).toHaveLength(5);
    expect(res.body.result[0].rank).toBe(21);
  });

  it('devrait retourner 200 avec une liste vide si aucun événement', async () => {
    mockUserReviewGroupBy.mockResolvedValue([]);
    mockEventFindMany.mockResolvedValue([]);

    const res = await request(app).get('/ranking/events');

    expect(res.status).toBe(200);
    expect(res.body.result).toEqual([]);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockUserReviewGroupBy.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/ranking/events');

    expect(res.status).toBe(500);
  });
});

describe('Ranking Router - GET /ranking/regions', () => {
  beforeEach(() => {
    // Mock du fetch Wikipédia pour la photo de région
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        thumbnail: { source: 'https://example.com/region.jpg' },
      }),
    }) as jest.Mock;
  });

  it('devrait retourner 200 avec les régions agrégées et leur photo', async () => {
    mockCityRankingFindMany.mockResolvedValue([
      { ...sampleCityRanking, score: 4.5, city: { region: 'Île-de-France' } },
      {
        FK_cityId: 'city-2',
        score: 3.5,
        eventCount: 2,
        rank: 2,
        updatedAt: new Date('2026-06-12'),
        city: { region: 'Île-de-France' },
      },
      {
        FK_cityId: 'city-3',
        score: 0,
        eventCount: 0,
        rank: 3,
        updatedAt: new Date('2026-06-12'),
        city: { region: 'Bretagne' },
      },
    ]);

    const res = await request(app).get('/ranking/regions');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.result).toHaveLength(2);
    // Île-de-France : moyenne de 4.5 et 3.5 = 4
    expect(res.body.result[0]).toMatchObject({
      rank: 1,
      region: 'Île-de-France',
      score: 4,
      eventCount: 5,
      cityCount: 2,
      imageUrl: 'https://example.com/region.jpg',
    });
    // Bretagne : aucune ville notée donc score 0
    expect(res.body.result[1]).toMatchObject({
      rank: 2,
      region: 'Bretagne',
      score: 0,
      eventCount: 0,
      cityCount: 1,
    });
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockCityRankingFindMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/ranking/regions');

    expect(res.status).toBe(500);
  });
});
