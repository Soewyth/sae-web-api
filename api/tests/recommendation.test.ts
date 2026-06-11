import type { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';

jest.mock('../src/client', () => ({
  prisma: {
    city: {
      findMany: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/client';
import { getTopCities } from '../src/recommendation/recommendation.controller';
import { recommendationRouter } from '../src/recommendation/recommendation.router';

const mockCityFindMany = prisma.city.findMany as jest.Mock;
const mockEventFindMany = prisma.event.findMany as jest.Mock;

// Helpers
const makeReq = (query: Record<string, string> = {}): Request =>
  ({ params: {}, body: {}, query, headers: {} } as unknown as Request);

const makeRes = (): Response => {
  const res = {} as Response;
  (res as any).status = jest.fn().mockReturnValue(res);
  (res as any).json = jest.fn().mockReturnValue(res);
  return res;
};

const app = express();
app.use(express.json());
app.use('/recommendations', recommendationRouter);

// Données de test
const year = new Date().getFullYear() - 1;

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

const sampleCity2 = { ...sampleCity, id: 'city-2', name: 'Lyon', latitude: 45.75, longitude: 4.85 };

const buildWeatherResponse = (maxTemps: number[], minTemps: number[], dates: string[]) => ({
  ok: true,
  json: jest.fn().mockResolvedValue({
    daily: {
      time: dates,
      temperature_2m_max: maxTemps,
      temperature_2m_min: minTemps,
    },
  }),
});

const makeEvent = (maxCapacity: number, startDate: Date, endDate: Date) => ({
  id: 'ev-1',
  title: 'Test',
  type: 'FESTIVAL',
  startDate,
  endDate,
  isOutdoor: true,
  nbGuests: 500,
  maxCapacity,
  FK_cityId: 'city-1',
});

// ─────────────────────── VALIDATION DES PARAMÈTRES ───────────────────────

describe('Recommendation Controller - validation paramètres', () => {
  it('devrait retourner 400 si "month" manquant', async () => {
    const req = makeReq({ duration: '3', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('month') }),
    );
  });

  it('devrait retourner 400 si "duration" manquant', async () => {
    const req = makeReq({ month: '7', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('duration') }),
    );
  });

  it('devrait retourner 400 si "isOutdoor" manquant', async () => {
    const req = makeReq({ month: '7', duration: '3', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('isOutdoor') }),
    );
  });

  it('devrait retourner 400 si "isOutdoor" invalide (ni true ni false)', async () => {
    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'maybe', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si "nbGuests" manquant', async () => {
    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('nbGuests') }),
    );
  });

  it('devrait retourner 400 si month est NaN', async () => {
    const req = makeReq({ month: 'abc', duration: '3', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si month < 1', async () => {
    const req = makeReq({ month: '0', duration: '3', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si month > 12', async () => {
    const req = makeReq({ month: '13', duration: '3', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si duration est NaN', async () => {
    const req = makeReq({ month: '7', duration: 'abc', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si duration < 1', async () => {
    const req = makeReq({ month: '7', duration: '0', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si nbGuests est NaN', async () => {
    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: 'abc' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 400 si nbGuests < 1', async () => {
    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: '0' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });
});

// ─────────────────────── MODE OUTDOOR ───────────────────────

describe('Recommendation Controller - mode outdoor', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('devrait retourner 200 avec le top 3 en mode outdoor', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 0 événements → avgMaxCapacity = 5000 (fallback), nbGuests=50 < 100 → score capacity = 100
    mockEventFindMany.mockResolvedValue([]);

    // Dates du mois 7 de l'année précédente
    const dates = [`${year}-07-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([20], [0], dates));

    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.message).toBe('Top 3 villes récupérées avec succès.');
    expect(body.result).toHaveLength(1);
    expect(body.isOutdoor).toBe(true);
  });

  it('devrait couvrir temp <= 0 (score temp = 0)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);
    const dates = [`${year}-07-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([-5], [-10], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir temp 20-30°C (score temp décroissant de 100 à 80)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);
    const dates = [`${year}-07-15`];
    // avgTemp = (30+20)/2 = 25°C → dans [20,30]
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([30], [20], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir temp 30-40°C (score temp décroissant de 80 à 0)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);
    const dates = [`${year}-07-15`];
    // avgTemp = (40+30)/2 = 35°C → dans [30,40]
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([40], [30], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir temp > 40°C (score temp = 0)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);
    const dates = [`${year}-07-15`];
    // avgTemp = (50+45)/2 = 47.5°C → > 40
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([50], [45], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir score capacity = 0 (nbGuests > maxCapacity)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 1 événement avec maxCapacity = 10, nbGuests = 500 → score capacity = 0
    mockEventFindMany.mockResolvedValue([
      makeEvent(10, new Date(`${year}-07-01`), new Date(`${year}-07-31`)),
    ]);
    const dates = [`${year}-07-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([20], [10], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '500' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir score capacity intermédiaire (nbGuests >= 100 && <= maxCapacity)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // maxCapacity = 1000, nbGuests = 200 → ratio = 0.2 → score = 80
    mockEventFindMany.mockResolvedValue([
      makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`)),
    ]);
    const dates = [`${year}-07-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([20], [10], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '200' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir score events = 50 (2-3 événements)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 2 événements
    mockEventFindMany.mockResolvedValue([
      makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`)),
      makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`)),
    ]);
    const dates = [`${year}-07-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([20], [10], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir score events = 0 (4+ événements)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 4 événements
    const ev = makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`));
    mockEventFindMany.mockResolvedValue([ev, ev, ev, ev]);
    const dates = [`${year}-07-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([20], [10], dates));

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait ignorer une ville si fetch échoue', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity, sampleCity2]);
    mockEventFindMany.mockResolvedValue([]);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false }) // city-1: fetch fails
      .mockResolvedValueOnce(buildWeatherResponse([20], [10], [`${year}-07-15`])); // city-2: ok

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    const body = (res as any).json.mock.calls[0][0];
    // Seule city-2 passe (city-1 ignorée à cause du fetch failed)
    expect(body.result).toHaveLength(1);
  });

  it('devrait ignorer une ville si aucune donnée météo valide', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);

    // Dates hors de la plage du mois → validDays = 0
    (global.fetch as jest.Mock).mockResolvedValue(
      buildWeatherResponse([20], [10], [`${year}-08-15`]), // hors du mois 7
    );

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    const body = (res as any).json.mock.calls[0][0];
    expect(body.result).toHaveLength(0);
  });

  it('devrait ignorer les données météo avec valeurs null', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        daily: {
          time: [`${year}-07-15`, `${year}-07-16`],
          temperature_2m_max: [null, 20],
          temperature_2m_min: [null, 10],
        },
      }),
    });

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait retourner au maximum 3 villes', async () => {
    const cities = [
      { ...sampleCity, id: 'c1', name: 'Paris' },
      { ...sampleCity, id: 'c2', name: 'Lyon' },
      { ...sampleCity, id: 'c3', name: 'Marseille' },
      { ...sampleCity, id: 'c4', name: 'Bordeaux' },
    ];
    mockCityFindMany.mockResolvedValue(cities);
    mockEventFindMany.mockResolvedValue([]);

    const weatherOk = buildWeatherResponse([20], [10], [`${year}-07-15`]);
    (global.fetch as jest.Mock).mockResolvedValue(weatherOk);

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    const body = (res as any).json.mock.calls[0][0];
    expect(body.result.length).toBeLessThanOrEqual(3);
  });
});

// ─────────────────────── MODE INDOOR ───────────────────────

describe('Recommendation Controller - mode indoor', () => {
  it('devrait retourner 200 avec le top 3 en mode indoor', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 1 événement → score events = 100 (count = 1)
    mockEventFindMany.mockResolvedValue([
      makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`)),
    ]);

    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'false', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.isOutdoor).toBe(false);
    expect(body.result).toHaveLength(1);
  });

  it('devrait couvrir score events = 50 en mode indoor (2-3 événements simultanés)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 2 événements couvrant tout le mois
    const ev = makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`));
    mockEventFindMany.mockResolvedValue([ev, ev]);

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'false', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait couvrir score events = 0 en mode indoor (4+ événements simultanés)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    // 4 événements couvrant tout le mois
    const ev = makeEvent(1000, new Date(`${year}-07-01`), new Date(`${year}-07-31`));
    mockEventFindMany.mockResolvedValue([ev, ev, ev, ev]);

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'false', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('devrait gérer 0 événements (fallback avgMaxCapacity = 5000)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'false', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result[0].avgMaxCapacity).toBe(5000);
  });

  it('devrait gérer liste de villes vide', async () => {
    mockCityFindMany.mockResolvedValue([]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'false', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result).toHaveLength(0);
  });
});

// ─────────────────────── ERREUR SERVEUR ───────────────────────

describe('Recommendation Controller - couverture ternaire getDateRange', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('devrait fonctionner avec un mois >= 10 (branche "month >= 10" du ternaire)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);

    const yearPrev = new Date().getFullYear() - 1;
    const dates = [`${yearPrev}-11-15`];
    (global.fetch as jest.Mock).mockResolvedValue(buildWeatherResponse([20], [10], dates));

    const req = makeReq({ month: '11', duration: '1', isOutdoor: 'true', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.month).toBe(11);
  });

  it('devrait fonctionner en indoor avec mois >= 10', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '12', duration: '1', isOutdoor: 'false', nbGuests: '50' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.month).toBe(12);
  });
});

describe('Recommendation Controller - erreur serveur', () => {
  it('devrait retourner 500 si prisma.city.findMany échoue', async () => {
    mockCityFindMany.mockRejectedValue(new Error('DB error'));

    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: '100' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Erreur lors du calcul des recommandations.' }),
    );
  });
});

// ─────────────────────── ROUTER INTEGRATION TESTS ───────────────────────

describe('Recommendation Router', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('GET / devrait retourner 400 si paramètres manquants', async () => {
    const res = await request(app).get('/recommendations/');
    expect(res.status).toBe(400);
  });

  it('GET / devrait retourner 200 avec paramètres valides (indoor)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/recommendations/')
      .query({ month: '7', duration: '3', isOutdoor: 'false', nbGuests: '100' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Top 3 villes récupérées avec succès.');
  });

  it('GET / devrait retourner 200 avec paramètres valides (outdoor)', async () => {
    mockCityFindMany.mockResolvedValue([sampleCity]);
    mockEventFindMany.mockResolvedValue([]);
    (global.fetch as jest.Mock).mockResolvedValue(
      buildWeatherResponse([20], [10], [`${year}-07-15`]),
    );

    const res = await request(app)
      .get('/recommendations/')
      .query({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: '100' });

    expect(res.status).toBe(200);
  });
});
