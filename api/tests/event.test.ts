import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../src/client', () => ({
  prisma: {
    city: {
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userReview: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import {
  getEvents,
  getEventById,
  getReviewsByEvent,
  postEvent,
  putEvent,
  deleteEvent,
} from '../src/event/event.controller';
import { eventRouter } from '../src/event/event.router';

const mockCityFindUnique = prisma.city.findUnique as jest.Mock;
const mockEventFindMany = prisma.event.findMany as jest.Mock;
const mockEventFindUnique = prisma.event.findUnique as jest.Mock;
const mockEventCreate = prisma.event.create as jest.Mock;
const mockEventUpdate = prisma.event.update as jest.Mock;
const mockEventDelete = prisma.event.delete as jest.Mock;
const mockReviewFindMany = prisma.userReview.findMany as jest.Mock;

// Helpers
const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({ params: {}, body: {}, query: {}, headers: {}, userId: 'user-1', ...overrides } as unknown as Request);

const makeRes = (): Response => {
  const res = {} as Response;
  (res as any).status = jest.fn().mockReturnValue(res);
  (res as any).json = jest.fn().mockReturnValue(res);
  return res;
};

// Test app
const testToken = jwt.sign(
  { userId: 'user-1', email: 'test@test.com' },
  process.env.JWT_SECRET as string,
);

const app = express();
app.use(express.json());
app.use('/event', eventRouter);

const sampleEvent = {
  id: 'event-1',
  title: 'Festival Paris',
  type: 'FESTIVAL',
  startDate: new Date('2025-07-01'),
  endDate: new Date('2025-07-03'),
  description: 'Un festival',
  isOutdoor: true,
  nbGuests: 500,
  maxCapacity: 1000,
  weather: null,
  imageUrl: null,
  createdAt: new Date(),
  createdBy: 'user-1',
  FK_cityId: 'city-1',
};

const sampleCity = { id: 'city-1', name: 'Paris' };

const sampleReview = {
  id: 'review-1',
  rating: 5,
  comment: 'Super!',
  FK_EventId: 'event-1',
  FK_userId: 'user-1',
};

const eventBody = {
  type: 'FESTIVAL',
  startDate: '2025-07-01',
  endDate: '2025-07-03',
  description: 'Un festival',
  isOutdoor: true,
  nbGuests: 500,
  title: 'Festival Paris',
  weather: null,
  FK_cityId: 'city-1',
};

// ─────────────────────── CONTROLLER UNIT TESTS ───────────────────────

describe('Event Controller - getEvents', () => {
  it('devrait retourner 200 avec la liste des événements', async () => {
    mockEventFindMany.mockResolvedValue([sampleEvent]);
    const req = makeReq();
    const res = makeRes();

    await getEvents(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Liste des événements récupérée avec succès.',
      result: [sampleEvent],
    });
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockEventFindMany.mockRejectedValue(new Error('DB error'));
    const req = makeReq();
    const res = makeRes();

    await getEvents(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('Event Controller - getEventById', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await getEventById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 200 avec l\'événement trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await getEventById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Événement récupéré avec succès.',
      result: sampleEvent,
    });
  });

  it('devrait retourner 404 si événement non trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' } });
    const res = makeRes();

    await getEventById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockEventFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await getEventById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('Event Controller - getReviewsByEvent', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await getReviewsByEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 200 avec les reviews de l\'événement', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockReviewFindMany.mockResolvedValue([sampleReview]);
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await getReviewsByEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: `Reviews de l'événement "${sampleEvent.title}" récupérés avec succès.`,
      result: [sampleReview],
    });
  });

  it('devrait retourner 200 avec liste vide si aucune review', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockReviewFindMany.mockResolvedValue([]);
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await getReviewsByEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ result: [] }),
    );
  });

  it('devrait retourner 404 si événement non trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' } });
    const res = makeRes();

    await getReviewsByEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockEventFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await getReviewsByEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('Event Controller - postEvent', () => {
  it('devrait retourner 400 si champs obligatoires manquants', async () => {
    const req = makeReq({ body: { title: 'Test' } });
    const res = makeRes();

    await postEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si la ville n\'existe pas', async () => {
    mockCityFindUnique.mockResolvedValue(null);
    const req = makeReq({ body: eventBody });
    const res = makeRes();

    await postEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 401 si userId absent', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    const req = makeReq({ body: eventBody, userId: undefined });
    const res = makeRes();

    await postEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(401);
  });

  it('devrait retourner 201 avec l\'événement créé', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventCreate.mockResolvedValue(sampleEvent);
    const req = makeReq({ body: eventBody, userId: 'user-1' });
    const res = makeRes();

    await postEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(201);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Événement créé avec succès.',
      result: sampleEvent,
    });
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockCityFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ body: eventBody });
    const res = makeRes();

    await postEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('Event Controller - deleteEvent', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await deleteEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 200 après suppression', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockEventDelete.mockResolvedValue(sampleEvent);
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await deleteEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining(sampleEvent.title) }),
    );
  });

  it('devrait retourner 404 si événement non trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'unknown' } });
    const res = makeRes();

    await deleteEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockEventFindUnique.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq({ params: { id: 'event-1' } });
    const res = makeRes();

    await deleteEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('Event Controller - putEvent', () => {
  it('devrait retourner 400 si id non fourni (typeof check)', async () => {
    const req = makeReq({ params: {}, body: eventBody });
    const res = makeRes();

    await putEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  // Note: le code de putEvent omet `await` sur findUnique — les Promises
  // retournées sont toujours truthy, donc les branches "not found" sont
  // du code mort. Pour passer les if, on initialise les mocks avant l'appel.
  it('devrait retourner 200 après mise à jour', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventUpdate.mockResolvedValue({ ...sampleEvent, title: 'Updated' });
    const req = makeReq({ params: { id: 'event-1' }, body: eventBody });
    const res = makeRes();

    await putEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventUpdate.mockRejectedValueOnce(new Error('DB error'));
    const req = makeReq({ params: { id: 'event-1' }, body: eventBody });
    const res = makeRes();

    await putEvent(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('Event Router', () => {
  it('GET / devrait retourner 200', async () => {
    mockEventFindMany.mockResolvedValue([sampleEvent]);

    const res = await request(app).get('/event/');

    expect(res.status).toBe(200);
  });

  it('GET /:id devrait retourner 200 si événement trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);

    const res = await request(app).get('/event/event-1');

    expect(res.status).toBe(200);
  });

  it('GET /:id devrait retourner 404 si non trouvé', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/event/unknown');

    expect(res.status).toBe(404);
  });

  it('GET /:id/reviews devrait retourner 200', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockReviewFindMany.mockResolvedValue([sampleReview]);

    const res = await request(app).get('/event/event-1/reviews');

    expect(res.status).toBe(200);
  });

  it('POST / devrait retourner 401 sans token', async () => {
    const res = await request(app).post('/event/').send(eventBody);

    expect(res.status).toBe(401);
  });

  it('POST / devrait retourner 201 avec token valide', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventCreate.mockResolvedValue(sampleEvent);

    const res = await request(app)
      .post('/event/')
      .set('Authorization', `Bearer ${testToken}`)
      .send(eventBody);

    expect(res.status).toBe(201);
  });

  it('PUT /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).put('/event/event-1').send(eventBody);

    expect(res.status).toBe(401);
  });

  it('PUT /:id devrait retourner 200 avec token valide', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventUpdate.mockResolvedValue(sampleEvent);

    const res = await request(app)
      .put('/event/event-1')
      .set('Authorization', `Bearer ${testToken}`)
      .send(eventBody);

    expect(res.status).toBe(200);
  });

  it('DELETE /:id devrait retourner 401 sans token', async () => {
    const res = await request(app).delete('/event/event-1');

    expect(res.status).toBe(401);
  });

  it('DELETE /:id devrait retourner 200 avec token valide', async () => {
    mockEventFindUnique.mockResolvedValue(sampleEvent);
    mockEventDelete.mockResolvedValue(sampleEvent);

    const res = await request(app)
      .delete('/event/event-1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
  });
});
