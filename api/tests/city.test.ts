import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';

jest.mock('../src/client', () => ({
  prisma: {
    city: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import {
  getCities,
  getCityById,
  getEventByCity,
} from '../src/city/city.controller';
import { cityRouter } from '../src/city/city.router';

const mockCityFindMany = prisma.city.findMany as jest.Mock;
const mockCityFindUnique = prisma.city.findUnique as jest.Mock;
const mockEventFindMany = prisma.event.findMany as jest.Mock;

// Helpers
const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({ params: {}, body: {}, query: {}, headers: {}, ...overrides } as unknown as Request);

const makeRes = (): Response => {
  const res = {} as Response;
  (res as any).status = jest.fn().mockReturnValue(res);
  (res as any).json = jest.fn().mockReturnValue(res);
  return res;
};

const app = express();
app.use(express.json());
app.use('/city', cityRouter);

const sampleCity = {
  id: 'city-1',
  name: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  inseeCode: '75056',
  postalCode: '75001',
  imageUrl: null,
  region: 'Île-de-France',
};

const sampleEvent = {
  id: 'event-1',
  title: 'Festival',
  type: 'FESTIVAL',
  startDate: new Date('2025-07-01'),
  endDate: new Date('2025-07-03'),
  isOutdoor: true,
  nbGuests: 500,
  maxCapacity: 1000,
  FK_cityId: 'city-1',
};

// ─────────────────────── CONTROLLER UNIT TESTS ───────────────────────

describe('City Controller - getCities', () => {
  it('devrait retourner 200 avec la liste des villes', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    const req = makeReq();
    const res = makeRes();

    await getCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Liste des villes récupérée avec succès.',
      result: [sampleCity],
    });
  });

  it('devrait retourner 200 avec une liste vide', async () => {
    mockCityFindMany.mockResolvedValue([]);
    const req = makeReq();
    const res = makeRes();

    await getCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ result: [] }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockCityFindMany.mockRejectedValue(new Error('DB error'));
    const req = makeReq();
    const res = makeRes();

    await getCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('City Controller - getCityById', () => {
  it('devrait retourner 400 si cityId non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await getCityById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith({ error: 'Identifiant de ville invalide.' });
  });

  it('devrait retourner 200 avec la ville trouvée', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    const req = makeReq({ params: { cityId: 'city-1' } });
    const res = makeRes();

    await getCityById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: 'Ville récupérée avec succès.',
      result: sampleCity,
    });
  });

  it('devrait retourner 404 si ville non trouvée', async () => {
    mockCityFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { cityId: 'unknown' } });
    const res = makeRes();

    await getCityById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('unknown') }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockCityFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { cityId: 'city-1' } });
    const res = makeRes();

    await getCityById(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

describe('City Controller - getEventByCity', () => {
  it('devrait retourner 400 si cityId non fourni (typeof check)', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();

    await getEventByCity(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith({ error: 'Identifiant de ville invalide.' });
  });

  it('devrait retourner 200 avec les événements de la ville', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventFindMany.mockResolvedValue([sampleEvent]);
    const req = makeReq({ params: { cityId: 'city-1' } });
    const res = makeRes();

    await getEventByCity(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith({
      message: `Événements de la ville "${sampleCity.name}" récupérés avec succès.`,
      result: [sampleEvent],
    });
  });

  it('devrait retourner 200 avec une liste vide si aucun événement', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventFindMany.mockResolvedValue([]);
    const req = makeReq({ params: { cityId: 'city-1' } });
    const res = makeRes();

    await getEventByCity(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ result: [] }),
    );
  });

  it('devrait retourner 404 si ville non trouvée', async () => {
    mockCityFindUnique.mockResolvedValue(null);
    const req = makeReq({ params: { cityId: 'unknown' } });
    const res = makeRes();

    await getEventByCity(req, res);

    expect((res as any).status).toHaveBeenCalledWith(404);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('unknown') }),
    );
  });

  it('devrait retourner 500 sur erreur serveur', async () => {
    mockCityFindUnique.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ params: { cityId: 'city-1' } });
    const res = makeRes();

    await getEventByCity(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('City Router', () => {
  it('GET / devrait retourner 200', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);

    const res = await request(app).get('/city/');

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
  });

  it('GET /:cityId devrait retourner 200 si ville trouvée', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);

    const res = await request(app).get('/city/city-1');

    expect(res.status).toBe(200);
    expect(res.body.result.id).toBe('city-1');
  });

  it('GET /:cityId devrait retourner 404 si ville non trouvée', async () => {
    mockCityFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/city/unknown');

    expect(res.status).toBe(404);
  });

  it('GET /:cityId/events devrait retourner 200 avec les événements', async () => {
    mockCityFindUnique.mockResolvedValue(sampleCity);
    mockEventFindMany.mockResolvedValue([sampleEvent]);

    const res = await request(app).get('/city/city-1/events');

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
  });

  it('GET /:cityId/events devrait retourner 404 si ville non trouvée', async () => {
    mockCityFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/city/unknown/events');

    expect(res.status).toBe(404);
  });
});
