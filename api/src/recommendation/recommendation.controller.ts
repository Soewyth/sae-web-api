import type { Request, Response } from 'express';
import { prisma } from '../client.js';

const OPEN_METEO_URL = 'https://archive-api.open-meteo.com/v1/archive';

// Transform temp in score
// 0°C = score 0, 30°C = score 100
function calcScore(temp: number): number {
  if (temp <= 0) return 0;
  if (temp >= 30) return 100; 
  return Math.round((temp / 30) * 100); // Linear Interpolation to 0-100
}

// Retourne l'année dernière et le mois demandé sous forme de dates : "2024-07-01" et "2024-07-31"
function getDateRange(month: number): { start: string; end: string } {
  const year = new Date().getFullYear() - 1;

  // On formate le mois sur 2 chiffres : 7 -> "07"
  const monthStr = month < 10 ? '0' + month : '' + month;

  // Dernier jour du mois (le mois suivant - 1 jour)
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: year + '-' + monthStr + '-01',
    end: year + '-' + monthStr + '-' + lastDay,
  };
}

/**
 * GET /recommendations?month=7
 * Retourne le top 3 des villes avec la meilleure météo pour le mois donné
 */
export const getTopCities = async (req: Request, res: Response) => {
  const month = parseInt(req.query.month as string);

  if (isNaN(month) || month < 1 || month > 12) {
    res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
    return;
  }

  try {
    const cities = await prisma.city.findMany();
    const { start, end } = getDateRange(month);
    const results = [];

    for (const city of cities) {
      const url =
        OPEN_METEO_URL +
        '?latitude=' + city.latitude +
        '&longitude=' + city.longitude +
        '&start_date=' + start +
        '&end_date=' + end +
        '&daily=temperature_2m_max,temperature_2m_min&timezone=auto';

      const response = await fetch(url);
      const data = await response.json() as {
        daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
      };

      const maxTemps = data.daily.temperature_2m_max;
      const minTemps = data.daily.temperature_2m_min;

      let total = 0;
      for (let i = 0; i < maxTemps.length; i++) {
        total += ((maxTemps[i] ?? 0) + (minTemps[i] ?? 0)) / 2;
      }
      const avgTemp = total / maxTemps.length;

      results.push({
        city,
        avgTemp: Math.round(avgTemp * 10) / 10,
        score: calcScore(avgTemp),
      });
    }

    // Trier par score décroissant et garder les 3 premiers
    results.sort((a, b) => b.score - a.score);
    const top3 = results.slice(0, 3);

    res.status(200).json({
      message: 'Top 3 villes récupérées avec succès.',
      month,
      result: top3,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du calcul des recommandations.', detail: error });
  }
};

/**
 * GET /recommendations/:cityId?month=7
 * Retourne un score par jour pour la ville et le mois donnés
 */
export const getCityScores = async (req: Request, res: Response) => {
  const cityId = req.params.cityId;
  const month = parseInt(req.query.month as string);

  if (isNaN(month) || month < 1 || month > 12) {
    res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
    return;
  }

  try {
    const city = await prisma.city.findUnique({ where: { id: cityId as string } });
    if (!city) {
      res.status(404).json({ error: 'Ville non trouvée.' });
      return;
    }

    const { start, end } = getDateRange(month);
    const url =
      OPEN_METEO_URL +
      '?latitude=' + city.latitude +
      '&longitude=' + city.longitude +
      '&start_date=' + start +
      '&end_date=' + end +
      '&daily=temperature_2m_max,temperature_2m_min&timezone=auto';

    const response = await fetch(url);
    const data = await response.json() as {
      daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
    };

    const dailyScores = [];
    for (let i = 0; i < data.daily.time.length; i++) {
      const avgTemp = ((data.daily.temperature_2m_max[i] ?? 0) + (data.daily.temperature_2m_min[i] ?? 0)) / 2;
      dailyScores.push({
        date: data.daily.time[i],
        avgTemp: Math.round(avgTemp * 10) / 10,
        score: calcScore(avgTemp),
      });
    }

    res.status(200).json({
      message: 'Scores journaliers récupérés avec succès.',
      city,
      month,
      result: dailyScores,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des scores.', detail: error });
  }
};
