import type { Request, Response } from 'express';
import { prisma } from '../client.js';

// In-memory cache for recommendations results (TTL: 1 hour)
// Weather data is now pre-seeded in DB, but cache avoids redundant DB queries for identical requests
const cache = new Map<string, { result: object; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in ms

// Transform temp in score
// 0°C = score 0, 20°C = score 100, 30°C = score 80, 40°C = score 0
function calcScoreTemp(temp: number): number {
    if (temp <= 0) return 0;

    if (temp <= 20) {
        const t = temp / 20; // Normalize between 0 and 1
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

// Return the date range for a given month ex : 2025-07-31
function getDateRange(month: number): { start: string; end: string } {
    const year = new Date().getFullYear() - 1;

    // Format the month to 2 digits: 7 -> 07
    const monthStr = month < 10 ? '0' + month : '' + month;

    // Last day of the month (the next month - 1 day)
    const lastDay = new Date(year, month, 0).getDate(); // 0 for last day and getDate for extract only the day number

    return {
        start: `${year}-${monthStr}-01`,
        end: `${year}-${monthStr}-${lastDay}`,
    };
}

// Add days to a date string: "2025-07-30" + 3 => "2025-08-02"
function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0] ?? '';
}

/**
 * GET /recommendations/
 * Return top 3 of cities with the best score for the given month and duration.
 * If isOutdoor=true: score = temp*0.5 + capacity*0.3 + events*0.2
 * If isOutdoor=false: score = capacity*0.4 + events*0.6
 * Weather data is read from CityWeather table (pre-seeded) for deterministic results.
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

    // Check cache before computing — avoids redundant DB queries for identical requests
    const cacheKey = `${month}-${duration}-${isOutdoor}-${nbGuests}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        res.status(200).json(cached.result);
        return;
    }

    const isNotNull = <T>(value: T | null): value is T => value !== null;

    // main logic
    try {
        const { start, end } = getDateRange(month); // format "2025-07-01", "2025-07-31"
        const fetchEndDate = addDays(end, duration - 1);

        // Fetch all cities with their pre-seeded weather data for the requested month
        const cities = await prisma.city.findMany({
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            include: { cityWeathers: { where: { month } } },
        });

        type CityWithoutWeathers = Omit<(typeof cities)[number], 'cityWeathers'>;
        type RecommendationResult = {
            city: CityWithoutWeathers;
            score: number;
            avgTemp?: number;
            avgMaxCapacity?: number;
            monthlyAverage?: object;
            days: object[];
        };

        // for each city, compute score from DB weather + events in parallel
        let results: RecommendationResult[] = [];

        if (isOutdoor) {
            // Outdoor: score = temp*0.5 + capacity*0.3 + events*0.2
            const cityResults = await Promise.all(cities.map(async (city) => {
                // Use pre-seeded weather data from CityWeather table (deterministic, no HTTP call)
                const weather = city.cityWeathers[0];
                if (!weather) return null; // skip city if no weather data seeded for this month

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

                // Global score outdoor: 50% temp + 30% capacity + 20% events
                const globalScore = Math.round(
                    calcScoreTemp(weather.avgTemp) * 0.5 +
                    calcScoreCapacity(nbGuests, avgMaxCapacity) * 0.3 +
                    eventScore * 0.2
                );

                // Remove cityWeather from city object before returning
                const { cityWeathers, ...cityWithoutWeather } = city;
                void cityWeathers;

                return {
                    city: cityWithoutWeather,
                    avgTemp: weather.avgTemp,
                    avgMaxCapacity: Math.round(avgMaxCapacity),
                    score: globalScore,
                    days: [], // no daily breakdown — weather is stored as monthly averages
                    monthlyAverage: {
                        avgTemp: weather.avgTemp,
                        avgPrecip: weather.avgPrecip,
                        avgSun: weather.avgSun,
                    },
                };
            }));

            // Filter null results (no weather data seeded for this month)
            results = cityResults.filter(isNotNull);

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

                // Remove cityWeather from city object before returning
                const { cityWeathers, ...cityWithoutWeather } = city;
                void cityWeathers;

                return {
                    city: cityWithoutWeather,
                    avgMaxCapacity: Math.round(avgMaxCapacity),
                    score: globalScore,
                    days: dailyScores,
                };
            }));

            // Filter null results
            results = cityResults.filter(isNotNull);
        }

        // Sort by score descending, tiebreak by avgTemp desc, then alphabetically
        results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;

            // Tiebreak by average temperature (outdoor) — higher temp wins
            const aTemp = a.avgTemp ?? 0;
            const bTemp = b.avgTemp ?? 0;
            if (bTemp !== aTemp) return bTemp - aTemp;

            // Final tiebreak alphabetically for deterministic ordering
            const byName = a.city.name.localeCompare(b.city.name, 'fr', { sensitivity: 'base' });
            if (byName !== 0) return byName;

            return a.city.id.localeCompare(b.city.id);
        });

        const top3 = results.slice(0, 3);

        const responseBody = {
            message: 'Top 3 villes récupérées avec succès.',
            month,
            duration,
            isOutdoor,
            nbGuests,
            startDate: start,
            endDate: end,
            fetchEndDate,
            result: top3,
        };

        // Store in cache for identical future requests
        cache.set(cacheKey, { result: responseBody, timestamp: Date.now() });

        res.status(200).json(responseBody);

    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du calcul des recommandations.', detail: error });
    }
};