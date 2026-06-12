import type { Request, Response } from 'express';
import { prisma } from '../client.js';

// Cache mémoire des photos de régions récupérées depuis l'API Wikipédia
// (nom de région -> URL d'image ou null si introuvable)
const regionImageCache = new Map<string, string | null>();

// Récupère l'image d'une page Wikipédia (fr) via l'API REST summary.
// Renvoie null si aucune image n'est trouvée ou si la requête échoue.
async function fetchWikipediaImageUrl(title: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        headers: {
          'User-Agent': 'sae-web-api/1.0 (https://github.com/sae-web-api)',
        },
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    return data.thumbnail?.source ?? data.originalimage?.source ?? null;
  } catch {
    return null;
  }
}

// Récupère l'URL de la photo d'une région depuis l'API Wikipédia, en essayant
// d'abord le nom seul puis le titre administratif (ex : "Occitanie (région
// administrative)").
async function fetchRegionImageUrl(region: string): Promise<string | null> {
  if (regionImageCache.has(region)) {
    return regionImageCache.get(region) ?? null;
  }

  const imageUrl =
    (await fetchWikipediaImageUrl(region)) ??
    (await fetchWikipediaImageUrl(`${region} (région administrative)`));

  regionImageCache.set(region, imageUrl);
  return imageUrl;
}

// Lit les paramètres de pagination ?page et ?limit (20 éléments par page
// par défaut, 100 maximum)
function getPagination(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20),
  );
  return { page, limit };
}

//##### GET #####
/**
 * Récupérer le classement des villes (table CityRanking maintenue par
 * le trigger plpgsql refresh_city_ranking), paginé
 */
export const getCityRanking = async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req);
  try {
    const [total, rankings] = await Promise.all([
      prisma.cityRanking.count(),
      prisma.cityRanking.findMany({
        orderBy: { rank: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          city: {
            select: {
              id: true,
              name: true,
              region: true,
              imageUrl: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      message: 'Classement des villes récupéré avec succès.',
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      result: rankings.map((ranking) => ({
        rank: ranking.rank,
        score: Math.round(ranking.score * 10) / 10,
        eventCount: ranking.eventCount,
        city: ranking.city,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message:
        'Une erreur est survenue lors de la récupération du classement des villes.',
      error: error,
    });
  }
};

/**
 * Récupérer le classement de tous les événements par score, paginé
 * (score = moyenne des ratings des reviews de l'événement,
 * 0 si l'événement n'a pas encore de review)
 */
export const getEventRanking = async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req);
  try {
    // Moyenne et nombre de reviews par événement noté
    const reviewStats = await prisma.userReview.groupBy({
      by: ['FK_EventId'],
      _avg: { rating: true },
      _count: { rating: true },
    });

    // On récupère tous les événements avec leur ville
    const events = await prisma.event.findMany({
      include: {
        city: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    });

    const statsByEventId = new Map(
      reviewStats.map((stat) => [stat.FK_EventId, stat]),
    );

    const ranked = events
      .map((event) => {
        const stats = statsByEventId.get(event.id);
        return {
          score: Math.round((stats?._avg.rating ?? 0) * 10) / 10,
          reviewCount: stats?._count.rating ?? 0,
          event: {
            id: event.id,
            title: event.title,
            type: event.type,
            startDate: event.startDate,
            endDate: event.endDate,
            imageUrl: event.imageUrl,
            city: event.city,
          },
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.reviewCount !== a.reviewCount)
          return b.reviewCount - a.reviewCount;
        return a.event.title.localeCompare(b.event.title, 'fr', {
          sensitivity: 'base',
        });
      })
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    res.status(200).json({
      message: 'Classement des événements récupéré avec succès.',
      page: page,
      limit: limit,
      total: ranked.length,
      totalPages: Math.max(1, Math.ceil(ranked.length / limit)),
      result: ranked.slice((page - 1) * limit, page * limit),
    });
  } catch (error) {
    res.status(500).json({
      message:
        'Une erreur est survenue lors de la récupération du classement des événements.',
      error: error,
    });
  }
};

/**
 * Récupérer le classement des régions, paginé
 * (score = moyenne des scores des villes notées de la région,
 * photo récupérée depuis l'API Wikipédia)
 */
export const getRegionRanking = async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req);
  try {
    const rankings = await prisma.cityRanking.findMany({
      include: {
        city: {
          select: {
            region: true,
          },
        },
      },
    });

    // Agrégation des villes par région
    const regions = new Map<
      string,
      {
        totalScore: number;
        scoredCities: number;
        eventCount: number;
        cityCount: number;
      }
    >();

    for (const ranking of rankings) {
      const region = ranking.city.region;
      const aggregate = regions.get(region) ?? {
        totalScore: 0,
        scoredCities: 0,
        eventCount: 0,
        cityCount: 0,
      };

      // Seules les villes avec un score (au moins un événement) comptent dans la moyenne
      if (ranking.score > 0) {
        aggregate.totalScore += ranking.score;
        aggregate.scoredCities += 1;
      }
      aggregate.eventCount += ranking.eventCount;
      aggregate.cityCount += 1;
      regions.set(region, aggregate);
    }

    const ranked = [...regions.entries()]
      .map(([region, aggregate]) => ({
        region: region,
        score:
          aggregate.scoredCities > 0
            ? Math.round((aggregate.totalScore / aggregate.scoredCities) * 10) /
              10
            : 0,
        eventCount: aggregate.eventCount,
        cityCount: aggregate.cityCount,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.eventCount !== a.eventCount) return b.eventCount - a.eventCount;
        return a.region.localeCompare(b.region, 'fr', { sensitivity: 'base' });
      })
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    // Enrichit uniquement la page demandée avec les photos Wikipédia
    // (en parallèle, avec cache)
    const result = await Promise.all(
      ranked.slice((page - 1) * limit, page * limit).map(async (entry) => ({
        ...entry,
        imageUrl:
          entry.region === 'Inconnue'
            ? null
            : await fetchRegionImageUrl(entry.region),
      })),
    );

    res.status(200).json({
      message: 'Classement des régions récupéré avec succès.',
      page: page,
      limit: limit,
      total: ranked.length,
      totalPages: Math.max(1, Math.ceil(ranked.length / limit)),
      result: result,
    });
  } catch (error) {
    res.status(500).json({
      message:
        'Une erreur est survenue lors de la récupération du classement des régions.',
      error: error,
    });
  }
};
