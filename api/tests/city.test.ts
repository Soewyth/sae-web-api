import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';

jest.mock('../src/client', () => ({
  prisma: {
    city: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { getCities } from '../src/city/city.controller';
import { cityRouter } from '../src/city/city.router';

const mockCityFindMany = prisma.city.findMany as jest.Mock;

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

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('City Router', () => {
  it('GET / devrait retourner 200', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);

    const res = await request(app).get('/city/');

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(1);
  });
});
