import type { Request, Response } from 'express';
import { prisma } from '../client.js';

const OPEN_METEO_URL = 'https://archive-api.open-meteo.com/v1/archive';

// Transform temp in score
// 0°C = score 0, 30°C = score 100
function calcScoreTemp(temp: number): number {
    if (temp <= 0) {
        return 0;
    }

    if (temp <= 20) {
        const t = (temp - 0) / (20 - 0); // Normalize between 0 and 1
        return Math.round(0 + t * (100 - 0)); // Scale from 0 to 100
    }

    if (temp <= 30) {
        const t = (temp - 20) / (30 - 20); // Normalize between 0 and 1
        return Math.round(100 + t * (80 - 100)); // Unscale from 100 to 80 per 2 points 
    }

    if (temp <= 40) {
        const t = (temp - 30) / (40 - 30); // Normalize between 0 and 1
        return Math.round(80 + t * (0 - 80)); // Unscale from 80 to 0 per 8 points
    }

    return 0;
}
// Return the date range for a given month ex : 2023-07-31
function getDateRange(month: number): { start: string; end: string } {
    const year = new Date().getFullYear() - 1;

    // Format the month to 2 digits: 7 ->07
    const monthStr = month < 10 ? '0' + month : '' + month;

    // Last day of the month (the next month - 1 day)
    const lastDay = new Date(year, month, 0).getDate(); // 0 for last day and getDAte for extract only the day number

    return {
        start: year + '-' + monthStr + '-01',
        end: year + '-' + monthStr + '-' + lastDay,
    };
}

/**
 * GET /recommendations?month=??
 * Return top 3 of cities with the best average temperature for the given month
 */
export const getTopCities = async (req: Request, res: Response) => {
    const month = parseInt(req.query.month as string);

    if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
        return;
    }

    try {
        const cities = await prisma.city.findMany();
        const { start, end } = getDateRange(month); // format : YYYY-MM-DD 
        const results = [];
        // FEtch all of cities weather data and calculate average temperature and score
        for (const city of cities) {
            const url =
                OPEN_METEO_URL +
                '?latitude=' + city.latitude + // from bdd
                '&longitude=' + city.longitude + // from bdd
                '&start_date=' + start + // recupera from function
                '&end_date=' + end + // recuperate from function
                '&daily=temperature_2m_max,temperature_2m_min&timezone=auto'; // fixed param from api weather
            // fetch url with concat
            const response = await fetch(url);
            // PArse data and build array of max and min temps
            const data = await response.json() as {
                daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
            };

            const maxTemps = data.daily.temperature_2m_max;
            const minTemps = data.daily.temperature_2m_min;
            // Calculate average temperature for the month
            const days = data.daily.time;
            let total = 0;
            for (let i = 0 ; i < days.length; i++) {
                total +=((maxTemps[i] ?? 0) + (minTemps[i] ?? 0))/ 2; // if temp is null, use 0

            }
            const avgTemp = total / days.length;
            // push in array the city, average temp and score
            results.push({
                city,
                avgTemp: Math.round(avgTemp * 10) / 10,
                score: calcScoreTemp(avgTemp),
            });
        }

        // Sort by score descending and keep the top 3
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
 * GET /recommendations/:cityId?startDate=2025-07-30&duration=4 for example so parameter startDate and duration
 * Return a score between 0 and 
 */
// export const getCityScores = async (req: Request, res: Response) => {
// };