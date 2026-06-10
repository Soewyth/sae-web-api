import type { Request, Response } from 'express';
import { prisma } from '../client.js';

const OPEN_METEO_URL = 'https://archive-api.open-meteo.com/v1/archive';

// Transform temp in score
// 0°C = score 0, 20°C = score 100, 30°C = score 80, 40°C = score 0
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
    const lastDay = new Date(year, month, 0).getDate(); // 0 for last day and getDate for extract only the day number

    return {
        start: year + '-' + monthStr + '-01',
        end: year + '-' + monthStr + '-' + lastDay,
    };
}

// Add days to a date string: "2025-07-30" + 3 => "2025-08-02"
function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);

    return date.toISOString().split('T')[0] ?? '';
}
// Check if a date is in a range of dates (inclusive)
function isDateInRange(date: string, start: string, end: string): boolean {
    return date >= start && date <= end;
}
/**
 * GET /recommendations/
 * Return top 3 of cities with the best average temperature for the given month
 */
export const getTopCities = async (req: Request, res: Response) => {
    const monthParam = req.query.month;
    const durationParam = req.query.duration;


    if (typeof monthParam !== 'string') {
        res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
        return;
    }

    if (typeof durationParam !== 'string') {
        res.status(400).json({ error: 'Le paramètre "duration" doit être un nombre supérieur à 0.' });
        return;
    }

    const month = parseInt(monthParam, 10);
    const duration = parseInt(durationParam, 10);

    if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
        return;
    }

    if (isNaN(duration) || duration < 1) {
        res.status(400).json({ error: 'Le paramètre "duration" doit être un nombre supérieur à 0.' });
        return;
    }
    try {
        const cities = await prisma.city.findMany();
        const { start, end } = getDateRange(month); // format : YYYY-MM-DD 
        // Need extra days after the end of the month for frontend selection with duration
        const fetchEndDate = addDays(end, duration - 1);
        const results = [];

        // Fetch all of cities weather data and calculate average temperature and score
        for (const city of cities) {
            const url =
                OPEN_METEO_URL +
                '?latitude=' + city.latitude + // from bdd
                '&longitude=' + city.longitude + // from bdd
                '&start_date=' + start + // recuperate from function
                '&end_date=' + fetchEndDate + // recuperate from function + duration
                '&daily=temperature_2m_max,temperature_2m_min&timezone=auto'; // fixed param from api weather

            // fetch url with concat
            const response = await fetch(url);

            if (!response.ok) {
                res.status(500).json({ error: `Erreur lors de l'appel à Open-Meteo pour la ville ${city.name}` });
                return;
            }

            // Parse data and build array of max and min temps
            const data = await response.json() as {
                daily: {
                    time: string[];
                    temperature_2m_max: Array<number | null>;
                    temperature_2m_min: Array<number | null>;
                };
            };

            const dailyScores = [];

            // Calculate average temperature for the selected month only
            let total = 0;
            let validDays = 0;

            for (let i = 0; i < data.daily.time.length; i++) {
                const date = data.daily.time[i];
                const maxTemp = data.daily.temperature_2m_max[i];
                const minTemp = data.daily.temperature_2m_min[i];

                if (!date || maxTemp == null || minTemp == null) continue; // skip null temps

                const avgTemp = (maxTemp + minTemp) / 2;

                dailyScores.push({
                    date,
                    maxTemp,
                    minTemp,
                    avgTemp: Math.round(avgTemp * 10) / 10,
                    score: calcScoreTemp(avgTemp),
                });

                // Only selected month is used for city ranking
                if (isDateInRange(date, start, end)) {
                    total += avgTemp;
                    validDays++;
                }
            }

            if (validDays === 0) continue; // skip city if no valid data
            // Calculate average temp for the month
            const avgTemp = total / validDays;

            // push in array the city, average temp, score and days
            results.push({
                city,
                avgTemp: Math.round(avgTemp * 10) / 10,
                score: calcScoreTemp(avgTemp),
                days: dailyScores,
            });
        }

        // Sort by score descending and keep the top 3
        results.sort((a, b) => b.score - a.score);
        const top3 = results.slice(0, 3);

        res.status(200).json({
            message: 'Top 3 villes récupérées avec succès.',
            month,
            duration,
            startDate: start,
            endDate: end,
            fetchEndDate,
            result: top3,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du calcul des recommandations.', detail: error });
    }
};