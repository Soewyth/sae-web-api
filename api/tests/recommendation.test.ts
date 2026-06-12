import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';

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

const makeReq = (query: Record<string, string>): Request =>
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

const baseCity = {
  id: 'city-1',
  name: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  inseeCode: '75056',
  postalCode: '75001',
  imageUrl: null,
  region: 'Ile-de-France',
};

const cityWithWeather = (
  city: typeof baseCity,
  month: number,
  avgTemp: number,
  avgPrecip = 1,
  avgSun = 6,
) => ({
  ...city,
  cityWeathers: [
    {
      id: `cw-${city.id}-${month}`,
      FK_cityId: city.id,
      month,
      avgTemp,
      avgPrecip,
      avgSun,
    },
  ],
});

const makeEvent = (
  maxCapacity: number,
  startDate: Date,
  endDate: Date,
  cityId = 'city-1',
) => ({
  id: `ev-${cityId}-${maxCapacity}`,
  title: 'Test',
  type: 'FESTIVAL',
  startDate,
  endDate,
  isOutdoor: true,
  nbGuests: 500,
  maxCapacity,
  FK_cityId: cityId,
});

let queryNonce = 0;
const uniqueGuests = () => String(100 + queryNonce++);

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: jest.fn(),
  }) as unknown as typeof fetch;
});

describe('Recommendation Controller - validation parametres', () => {
  it('retourne 400 si month est absent', async () => {
    const req = makeReq({ duration: '2', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('retourne 400 si isOutdoor est invalide', async () => {
    const req = makeReq({ month: '7', duration: '2', isOutdoor: 'maybe', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('retourne 400 si duration est absent', async () => {
    const req = makeReq({ month: '7', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('retourne 400 si nbGuests est absent', async () => {
    const req = makeReq({ month: '7', duration: '2', isOutdoor: 'false' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('retourne 400 si month est hors limite', async () => {
    const req = makeReq({ month: '13', duration: '2', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('retourne 400 si duration est invalide', async () => {
    const req = makeReq({ month: '7', duration: '0', isOutdoor: 'false', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });

  it('retourne 400 si nbGuests est invalide', async () => {
    const req = makeReq({ month: '7', duration: '2', isOutdoor: 'false', nbGuests: '0' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(400);
  });
});

describe('Recommendation Controller - mode outdoor', () => {
  it('retourne 200 avec une ville ayant CityWeather', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 7, 20)]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '7', duration: '2', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result).toHaveLength(1);
    expect(body.result[0].monthlyAverage.avgTemp).toBe(20);
  });

  it('retourne 0 score temp quand la temperature depasse 40', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 7, 45)]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '7', duration: '2', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result[0].monthlyAverage.avgTemp).toBe(45);
  });

  it('utilise le cache pour une requete identique', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 7, 20)]);
    mockEventFindMany.mockResolvedValue([]);

    const query = { month: '7', duration: '2', isOutdoor: 'true', nbGuests: uniqueGuests() };
    const req = makeReq(query);
    const res = makeRes();

    await getTopCities(req, res);
    await getTopCities(req, res);

    expect(mockCityFindMany).toHaveBeenCalledTimes(1);
    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it('ignore les villes sans weather pour le mois', async () => {
    mockCityFindMany.mockResolvedValue([
      cityWithWeather(baseCity, 7, 21),
      { ...baseCity, id: 'city-2', name: 'Lyon', cityWeathers: [] },
    ]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result).toHaveLength(1);
    expect(body.result[0].city.id).toBe('city-1');
  });

  it('retourne 0 score events quand il y a 4 evenements ou plus', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 7, -5)]);
    const event = makeEvent(10, new Date('2025-07-01'), new Date('2025-07-31'));
    mockEventFindMany.mockResolvedValue([event, event, event, event]);

    const req = makeReq({ month: '7', duration: '3', isOutdoor: 'true', nbGuests: '500' });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result[0].score).toBe(0);
  });

  it('retourne max 3 villes', async () => {
    mockCityFindMany.mockResolvedValue([
      cityWithWeather({ ...baseCity, id: 'c1', name: 'Paris' }, 8, 18),
      cityWithWeather({ ...baseCity, id: 'c2', name: 'Lyon' }, 8, 19),
      cityWithWeather({ ...baseCity, id: 'c3', name: 'Marseille' }, 8, 20),
      cityWithWeather({ ...baseCity, id: 'c4', name: 'Bordeaux' }, 8, 21),
    ]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '8', duration: '1', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result.length).toBeLessThanOrEqual(3);
  });

  it('remplit les days en outdoor avec le fetch daily', async () => {
    mockCityFindMany.mockResolvedValue([
      cityWithWeather({ ...baseCity, id: 'c1', name: 'Paris' }, 7, 20),
    ]);
    mockEventFindMany.mockResolvedValue([
      makeEvent(1000, new Date('2025-07-01'), new Date('2025-07-31')),
    ]);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        daily: {
          time: ['2025-07-01'],
          temperature_2m_max: [30],
          temperature_2m_min: [20],
          precipitation_sum: [0],
          sunshine_duration: [3600],
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = makeReq({ month: '7', duration: '1', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result[0].days).toHaveLength(1);
    expect(body.result[0].days[0].eventCount).toBe(1);
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe('Recommendation Controller - mode indoor', () => {
  it('retourne 200 en indoor avec fallback capacity 5000 sans evenement', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 9, 22)]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '9', duration: '2', isOutdoor: 'false', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result[0].avgMaxCapacity).toBe(5000);
  });

  it('trie de facon deterministe en cas d egalite', async () => {
    mockCityFindMany.mockResolvedValue([
      cityWithWeather({ ...baseCity, id: 'c4', name: 'Lille' }, 10, 20),
      cityWithWeather({ ...baseCity, id: 'c2', name: 'Bordeaux' }, 10, 20),
      cityWithWeather({ ...baseCity, id: 'c1', name: 'Annecy' }, 10, 20),
      cityWithWeather({ ...baseCity, id: 'c3', name: 'Dijon' }, 10, 20),
    ]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '10', duration: '1', isOutdoor: 'false', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result.map((r: any) => r.city.name)).toEqual(['Annecy', 'Bordeaux', 'Dijon']);
  });

  it('utilise l id comme dernier critere de tri quand les noms sont identiques', async () => {
    mockCityFindMany.mockResolvedValue([
      cityWithWeather({ ...baseCity, id: 'c2', name: 'Nice' }, 10, 20),
      cityWithWeather({ ...baseCity, id: 'c1', name: 'Nice' }, 10, 20),
    ]);
    mockEventFindMany.mockResolvedValue([]);

    const req = makeReq({ month: '10', duration: '1', isOutdoor: 'false', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result.map((r: any) => r.city.id)).toEqual(['c1', 'c2']);
  });

  it('calcule avgMaxCapacity depuis les events', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 11, 20)]);
    mockEventFindMany.mockResolvedValue([
      makeEvent(1000, new Date('2025-11-01'), new Date('2025-11-15')),
      makeEvent(3000, new Date('2025-11-10'), new Date('2025-11-25')),
    ]);

    const req = makeReq({ month: '11', duration: '2', isOutdoor: 'false', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(200);
    const body = (res as any).json.mock.calls[0][0];
    expect(body.result[0].avgMaxCapacity).toBe(2000);
  });
});

describe('Recommendation Controller - erreur serveur', () => {
  it('retourne 500 si city.findMany echoue', async () => {
    mockCityFindMany.mockRejectedValue(new Error('DB error'));

    const req = makeReq({ month: '12', duration: '1', isOutdoor: 'true', nbGuests: uniqueGuests() });
    const res = makeRes();

    await getTopCities(req, res);

    expect((res as any).status).toHaveBeenCalledWith(500);
    expect((res as any).json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Erreur lors du calcul des recommandations.' }),
    );
  });
});

describe('Recommendation Router', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn(),
    }) as unknown as typeof fetch;
  });

  it('GET / retourne 400 si parametres manquants', async () => {
    const res = await request(app).get('/recommendations/');
    expect(res.status).toBe(400);
  });

  it('GET / retourne 200 en indoor', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 7, 20)]);
    mockEventFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/recommendations/')
      .query({ month: '7', duration: '2', isOutdoor: 'false', nbGuests: uniqueGuests() });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Top 3 villes récupérées avec succès.');
  });

  it('GET / retourne 200 en outdoor', async () => {
    mockCityFindMany.mockResolvedValue([cityWithWeather(baseCity, 8, 20)]);
    mockEventFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/recommendations/')
      .query({ month: '8', duration: '2', isOutdoor: 'true', nbGuests: uniqueGuests() });

    expect(res.status).toBe(200);
  });
});
