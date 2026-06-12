import type { Request, Response } from 'express';
import { prisma } from '../client.js';

const OPEN_METEO_URL = 'https://archive-api.open-meteo.com/v1/archive';

// Transform temp in score
// 0°C = score 0, 20°C = score 100, 30°C = score 80, 40°C = score 0
function calcScoreTemp(temp: number): number {
    if (temp <= 0) return 0;

    if (temp <= 20) {
        const t = (temp) / (20); // Normalize between 0 and 1
        return Math.round(t * 100); // Scale from 0 to 100
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

// Score based on capacity vs nbGuests
// nbGuests > maxCapacity → 0, nbGuests < 100 → 100, otherwise scale from 100 to 0
function calcScoreCapacity(nbGuests: number, maxCapacity: number): number {
    if (nbGuests > maxCapacity) return 0;
    if (nbGuests < 100) return 100;
    const ratio = nbGuests / maxCapacity; // between 0 and 1
    return Math.round((1 - ratio) * 100); // scale from 100 to 0
}
// Score based on number of concurrent events in the city
// 0-1 event → 100, 2-3 events → 50, 4+ events → 0
function calcScoreEvents(count: number): number {
    if (count <= 1) return 100;
    if (count <= 3) return 50;
    return 0;
}

// Return the date range for a given month ex : 2023-07-31
function getDateRange(month: number): { start: string; end: string } {
    const year = new Date().getFullYear() - 1;

    // Format the month to 2 digits: 7 -> 07
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
 * Return top 3 of cities with the best score for the given month and duration.
 * If isOutdoor=true: score = temp*0.5 + capacity*0.3 + events*0.2
 * If isOutdoor=false: score = capacity*0.4 + events*0.6
 */
export const getTopCities = async (req: Request, res: Response) => {
    const monthParam = req.query.month;
    const durationParam = req.query.duration;
    const isOutdoorParam = req.query.isOutdoor;
    const nbGuestsParam = req.query.nbGuests;

    // validate parameters
    if (typeof monthParam !== 'string') {
        res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
        return;
    }

    if (typeof durationParam !== 'string') {
        res.status(400).json({ error: 'Le paramètre "duration" doit être un nombre supérieur à 0.' });
        return;
    }

    if (typeof isOutdoorParam !== 'string' || (isOutdoorParam !== 'true' && isOutdoorParam !== 'false')) {
        res.status(400).json({ error: 'Le paramètre "isOutdoor" doit être "true" ou "false".' });
        return;
    }

    if (typeof nbGuestsParam !== 'string') {
        res.status(400).json({ error: 'Le paramètre "nbGuests" est requis.' });
        return;
    }

    // parse params
    const month = parseInt(monthParam, 10);
    const duration = parseInt(durationParam, 10);
    const isOutdoor = isOutdoorParam === 'true';
    const nbGuests = parseInt(nbGuestsParam, 10);

    // validate values
    if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({ error: 'Le paramètre "month" doit être un nombre entre 1 et 12.' });
        return;
    }

    if (isNaN(duration) || duration < 1) {
        res.status(400).json({ error: 'Le paramètre "duration" doit être un nombre supérieur à 0.' });
        return;
    }

    if (isNaN(nbGuests) || nbGuests < 1) {
        res.status(400).json({ error: 'Le paramètre "nbGuests" doit être un nombre supérieur à 0.' });
        return;
    }

    // main logic
    try {
        const cities = await prisma.city.findMany();
        const { start, end } = getDateRange(month); // format "2025-07-01", "2025-07-31"
        const fetchEndDate = addDays(end, duration - 1);

        // for each city, fetch weather or events in parallel and calculate score
        let results: {
            city: typeof cities[0];
            score: number;
            avgTemp?: number;
            avgMaxCapacity?: number;
            days: object[];
        }[] = [];

        if (isOutdoor) {
            // Outdoor: score = temp*0.5 + capacity*0.3 + events*0.2
            const cityResults = await Promise.all(cities.map(async (city) => {
                // Fetch events for this city to get average maxCapacity and event score
                const cityEvents = await prisma.event.findMany({
                    where: {
                        FK_cityId: city.id,
                        startDate: { lte: new Date(fetchEndDate) }, // keep events between the start and end of selectable date
                        endDate: { gte: new Date(start) },
                    },
                });

                // Calculate average maxCapacity for this city, fallback to 5000 if no events
                const avgMaxCapacity = cityEvents.length > 0
                    ? cityEvents.reduce((sum, e) => sum + (e.maxCapacity ?? 0), 0) / cityEvents.length
                    : 5000;

                // Count events for events score
                const eventScore = calcScoreEvents(cityEvents.length);

                const url =
                    OPEN_METEO_URL +
                    '?latitude=' + city.latitude + // from bdd
                    '&longitude=' + city.longitude + // from bdd
                    '&start_date=' + start + // from function
                    '&end_date=' + fetchEndDate + // from function
                    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration&timezone=auto'; // from the API

                const response = await fetch(url);
                if (!response.ok) return null; // skip city if fetch fails

                const data = await response.json() as {
                    daily: {
                        time: string[];
                        temperature_2m_max: Array<number | null>;
                        temperature_2m_min: Array<number | null>;
                        precipitation_sum: Array<number | null>;
                        sunshine_duration: Array<number | null>;
                    };
                };

                // Calculate daily scores and average for the month (only for days in the selectable range)
                const dailyScores = [];
                let total = 0;
                let validDays = 0;
                let totalPrecip = 0;
                let totalSun = 0;

                for (let i = 0; i < data.daily.time.length; i++) {
                    const date = data.daily.time[i];
                    const maxTemp = data.daily.temperature_2m_max[i];
                    const minTemp = data.daily.temperature_2m_min[i];
                    const dayPrecip = data.daily.precipitation_sum[i];
                    const daySun = data.daily.sunshine_duration[i];

                    if (!date || maxTemp == null || minTemp == null) continue; // skip null values

                    const avgTemp = (maxTemp + minTemp) / 2;
                    const windowStart = new Date(date);
                    const windowEnd = new Date(addDays(date, duration - 1));
                    const eventCount = cityEvents.filter(
                        (e) => e.startDate <= windowEnd && e.endDate >= windowStart,
                    ).length;

                    // Calculate score for this day and store it with the date and temps for the response
                    dailyScores.push({
                        date,
                        windowStart: date,
                        windowEnd: addDays(date, duration - 1),
                        eventCount,
                        maxTemp,
                        minTemp,
                        avgTemp: Math.round(avgTemp * 10) / 10, // round to 1 decimal
                        score: calcScoreTemp(avgTemp),
                    });

                    // Only include days in selectable range
                    if (isDateInRange(date, start, end)) {
                        total += avgTemp;
                        totalPrecip += dayPrecip ?? 0;
                        totalSun += daySun ?? 0;
                        validDays++;
                    }
                }

                if (validDays === 0) return null; // skip city if no valid data

                const avgTemp = total / validDays;

                // Global score outdoor: 50% temp + 30% capacity + 20% events
                const globalScore = Math.round(
                    calcScoreTemp(avgTemp) * 0.5 +
                    calcScoreCapacity(nbGuests, avgMaxCapacity) * 0.3 +
                    eventScore * 0.2
                );

                return {
                    city,
                    avgMaxCapacity: Math.round(avgMaxCapacity),
                    score: globalScore,
                    days: dailyScores,
                    monthlyAverage: {
                        avgTemp: Math.round(avgTemp * 10) / 10,
                        avgPrecip: Math.round((totalPrecip / validDays) * 10) / 10,  // mm/day
                        avgSun: Math.round((totalSun / validDays / 3600) * 10) / 10  // hours (seconds → hours)
                    }
                };
            }));

            // Filter null results (failed fetches or no valid data)
            results = cityResults.filter((r) => r !== null) as typeof results;

        } else {
            // Indoor: score = capacity*0.4 + events*0.6
            const cityResults = await Promise.all(cities.map(async (city) => {
                // Fetch events for this city that overlap with the full selectable range
                const cityEvents = await prisma.event.findMany({
                    where: {
                        FK_cityId: city.id,
                        startDate: { lte: new Date(fetchEndDate) }, // keep events between the start and end of selectable date
                        endDate: { gte: new Date(start) },
                    },
                });

                // Calculate average maxCapacity for this city, fallback to 5000 if no events
                const avgMaxCapacity = cityEvents.length > 0
                    ? cityEvents.reduce((sum, e) => sum + (e.maxCapacity ?? 0), 0) / cityEvents.length
                    : 5000;

                // Calculate daily scores and average for the month (only for days in the selectable range)
                const dailyScores = [];
                let totalScore = 0;
                let validDays = 0;

                // For each day in the month, count how many events are happening in the city and calculate score
                let currentDate = start;
                while (currentDate <= end) {
                    const windowStart = new Date(currentDate);
                    const windowEnd = new Date(addDays(currentDate, duration - 1));

                    // Count how many events overlap with this day (windowStart to windowEnd)
                    const count = cityEvents.filter(
                        (e) => e.startDate <= windowEnd && e.endDate >= windowStart,
                    ).length;

                    // Score function of number of events
                    const score = calcScoreEvents(count);

                    // Push in array
                    dailyScores.push({
                        date: currentDate,
                        windowStart: currentDate,
                        windowEnd: addDays(currentDate, duration - 1),
                        eventCount: count,
                        score,
                    });

                    totalScore += score;
                    validDays++;

                    // Move to the next day
                    currentDate = addDays(currentDate, 1);
                }

                if (validDays === 0) return null;

                // Average event score for the month
                const avgScore = Math.round(totalScore / validDays);

                // Global score indoor: 40% capacity + 60% events
                const globalScore = Math.round(
                    calcScoreCapacity(nbGuests, avgMaxCapacity) * 0.4 +
                    avgScore * 0.6
                );

                return {
                    city,
                    avgMaxCapacity: Math.round(avgMaxCapacity),
                    score: globalScore,
                    days: dailyScores,
                };
            }));

            // Filter null results
            results = cityResults.filter((r) => r !== null) as typeof results;
        }

        // Sort by score descending and keep the top 3
        results.sort((a, b) => b.score - a.score);
        const top3 = results.slice(0, 3);

        res.status(200).json({
            message: 'Top 3 villes récupérées avec succès.',
            month,
            duration,
            isOutdoor,
            nbGuests,
            startDate: start,
            endDate: end,
            fetchEndDate,
            result: top3,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du calcul des recommandations.', detail: error });
    }
};