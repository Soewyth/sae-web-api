import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { EnumType, EnumMethod } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Récupère l'URL de la photo principale d'une ville depuis l'API REST de Wikipédia en français.
// Renvoie null si aucune image n'est trouvée, si la requête échoue, ou si l'URL est trop longue
// pour la colonne imageUrl (VarChar(250)).
async function fetchCityImageUrl(cityName: string): Promise<string | null> {
  try {
    const title = encodeURIComponent(cityName)
    const response = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { headers: { 'User-Agent': 'sae-web-api-seed/1.0 (https://github.com/sae-web-api)' } }
    )
    if (!response.ok) return null
    const data = await response.json()
    const url: unknown = data.thumbnail?.source ?? data.originalimage?.source ?? null
    // imageUrl column is limited to 250 chars, skip URLs that don't fit
    if (typeof url === 'string' && url.length <= 250) return url
    return null
  } catch {
    return null
  }
}

// function maps type from datatourisme to our event type in our db
function mapType(types: string[]): string {
  if (types.includes('Festival')) return 'FESTIVAL'
  if (types.includes('Concert')) return 'CONCERT'
  if (types.includes('Market') || types.includes('SaleEvent')) return 'MARCHE'
  if (types.includes('Rambling')) return 'RUNNING'
  if (types.includes('Conference') || types.includes('Congress')) return 'CONFERENCE'
  if (types.includes('SportsEvent') || types.includes('SportsCompetition')) return 'SPORT'
  if (types.includes('ShowEvent')) return 'SPECTACLE'
  if (types.includes('Exhibition')) return 'EXPOSITION'
  if (types.includes('LocalAnimation') || types.includes('SocialEvent')) return 'ANIMATION'
  if (types.includes('ScreeningEvent')) return 'CINEMA'
  if (types.includes('TheaterEvent')) return 'THEATRE'
  return 'ANIMATION'
}

async function main() {
  // Clear existing data
  await prisma.log.deleteMany();
  await prisma.userReview.deleteMany();
  await prisma.event.deleteMany();
  await prisma.cityWeather.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();
  // create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: await bcrypt.hash("admin", 10),
      username: "admin",
      isAdmin: true
    },
  });
  // create user
  const user = await prisma.user.create({
    data: {
      email: "user@gmail.com",
      password: await bcrypt.hash("user", 10),
      username: "user",
      isAdmin: false
    }
  });

  // ***                ***
  //         CITY 
  // ***                ***
  // Fetch cities from DataTourisme( API)
  // create a map to store cities with their insee code as key
  const cities = new Map<string, { name: string; inseeCode: string; longitude?: number; latitude?: number; postalCode?: string; id?: string; region: string; imageUrl?: string | null }>();
  for (let page = 1; page <= 3; page++) {
    const response = await fetch(
      `https://api.datatourisme.fr/v1/entertainmentAndEvent?api_key=${process.env.DATATOURISME_API_KEY}&fields=isLocatedAt,hasMainRepresentation&lang=fr&page_size=100&page=${page}`
    )
    // data contains objects and meta key
    const data = await response.json()
    // objects arrays of events
    const objects = data.objects ?? []

    // loop through objects and extract from api the datas
    for (const obj of objects) {
      const loc = obj.isLocatedAt?.[0];
      const address = loc?.address?.[0];

      const name = address?.addressLocality
      const inseeCode = address?.hasAddressCity?.insee
      const latitude = loc?.geo?.latitude
      const longitude = loc?.geo?.longitude
      const postalCode = address?.postalCode
      const region = address?.hasAddressCity?.isPartOfDepartment?.isPartOfRegion?.label?.['@fr']

      // if name and insee code are present, add city to map in memory for create after that
      if (name && inseeCode) {
        cities.set(inseeCode, {
          name: name,
          inseeCode: inseeCode,
          longitude: longitude,
          latitude: latitude,
          postalCode: postalCode,
          region: region ?? 'Inconnue'

        });
      }
    }
  }

  // Enrich each city with its photo URL from the Wikipedia API (in parallel)
  await Promise.all(
    [...cities.values()].map(async (city) => {
      city.imageUrl = await fetchCityImageUrl(city.name)
    })
  )

  // Insert cities into the database
  for (const city of cities.values()) {
    const created = await prisma.city.create({
      data: {
        name: city.name,
        inseeCode: city.inseeCode,
        longitude: city.longitude ?? 0,
        latitude: city.latitude ?? 0,
        postalCode: city.postalCode ?? '00000',
        region: city.region,
        imageUrl: city.imageUrl ?? null
      }
    })
    city.id = created.id; // for store the city id after creation in db
  }

  // ***                ***
  //         EVENTS
  // ***                ***
  // Fetchs events from DataTourisme (API)
  for (let page = 1; page <= 3; page++) {
    const response = await fetch(
      `https://api.datatourisme.fr/v1/entertainmentAndEvent?api_key=${process.env.DATATOURISME_API_KEY}&fields=label,type,takesPlaceAt,isLocatedAt,hasMainRepresentation&lang=fr&page_size=100&page=${page}`
    )
    // data contains objects and meta key
    const data = await response.json()
    // objects arrays of events
    const objects = data.objects ?? []

    // loop through objects and extract from api the datas
    for (const obj of objects) {
      const loc = obj.isLocatedAt?.[0];
      const address = loc?.address?.[0];
      const inseeCode = address?.hasAddressCity?.insee
      const cityId = cities.get(inseeCode)?.id
      if (!cityId) continue // if city not found, skip the event

      const takesPlaceAt = obj.takesPlaceAt?.[0]
      if (!takesPlaceAt?.startDate) continue // if no date, skip the event
      // api have 4 keys for date, so concat them in one for date, same for end
      const startDate = new Date(`${takesPlaceAt.startDate}T${takesPlaceAt.startTime ?? '00:00'}:00`)
      const endDate = new Date(`${takesPlaceAt.endDate ?? takesPlaceAt.startDate}T${takesPlaceAt.endTime ?? '23:59'}:00`)

      const title = (obj.label?.['@fr'] ?? 'Sans titre').substring(0, 100)
      const imageUrl = obj.hasMainRepresentation?.[0]?.hasRelatedResource?.[0]?.locator?.[0] ?? null

      await prisma.event.create({
        data: {
          title: title,
          type: mapType(obj.type ?? []) as EnumType,
          startDate,
          endDate,
          FK_cityId: cityId,
          imageUrl,
          maxCapacity: Math.floor(Math.random() * 5000) // random capacity between 100 and 5000
        }
      })
    }
  }
  // ***                ***
  //       USER REVIEWS
  // ***                ***
  // ~70% of events get 1 to 4 reviews with random ratings (1-5) so that
  // the rankings (cities, events, regions) have varied scores
  const allEvents = await prisma.event.findMany()
  const reviewers = [admin, user]
  const commentsByRating = [
    "Très déçu, à éviter.",
    "Pas terrible, l'organisation est à revoir.",
    "Bien mais peut mieux faire.",
    "Très bon moment, je recommande.",
    "Excellent événement, très bien organisé !",
  ]

  const reviews = []
  for (const event of allEvents) {
    if (Math.random() < 0.3) continue // ~30% of events stay without review
    const nbReviews = 1 + Math.floor(Math.random() * 4) // 1 to 4 reviews
    for (let i = 0; i < nbReviews; i++) {
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)]!
      const rating = 1 + Math.floor(Math.random() * 5) // random rating between 1 and 5
      const review = await prisma.userReview.create({
        data: {
          rating: rating,
          comment: commentsByRating[rating - 1]!,
          FK_EventId: event.id,
          FK_userId: reviewer.id,
          createdBy: reviewer.id
        }
      })
      reviews.push(review)
    }
  }

  // ***                ***
  //         LOGS
  // ***                ***
  // create review  logs for each review and event logs for each event,  by admin user
  for (const review of reviews) {
    await prisma.log.create({
      data: {
        method: EnumMethod.POST,
        FK_userId: review.createdBy ?? admin.id,
        fk_reviewId: review.id
      }
    })
  }

  for (const event of allEvents) {
    await prisma.log.create({
      data: {
        method: EnumMethod.GET,
        FK_userId: admin.id,
        fk_eventId: event.id
      }
    })
  }
  const METEO_URL = 'https://archive-api.open-meteo.com/v1/archive';
  const year = new Date().getFullYear() - 1;
  const allCities = await prisma.city.findMany();

  // Process cities in batches of 10 to avoid rate limiting
  const BATCH_SIZE = 10;
  for (let i = 0; i < allCities.length; i += BATCH_SIZE) {
    const batch = allCities.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (city) => {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month < 10 ? '0' + month : '' + month;
        const lastDay = new Date(year, month, 0).getDate();
        const start = `${year}-${monthStr}-01`;
        const end = `${year}-${monthStr}-${lastDay}`;

        try {
          const url = `${METEO_URL}?latitude=${city.latitude}&longitude=${city.longitude}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration&timezone=auto`;
          const response = await fetch(url);
          if (!response.ok) return;

          const data = await response.json() as {
            daily: {
              time: string[];
              temperature_2m_max: Array<number | null>;
              temperature_2m_min: Array<number | null>;
              precipitation_sum: Array<number | null>;
              sunshine_duration: Array<number | null>;
            }
          };

          let totalTemp = 0, totalPrecip = 0, totalSun = 0, validDays = 0;

          for (let d = 0; d < data.daily.time.length; d++) {
            const maxT = data.daily.temperature_2m_max[d];
            const minT = data.daily.temperature_2m_min[d];
            if (maxT == null || minT == null) continue;
            totalTemp += (maxT + minT) / 2;
            totalPrecip += data.daily.precipitation_sum[d] ?? 0;
            totalSun += data.daily.sunshine_duration[d] ?? 0;
            validDays++;
          }

          if (validDays === 0) return;

          await prisma.cityWeather.upsert({
            where: { FK_cityId_month: { FK_cityId: city.id, month } },
            update: {
              avgTemp: Math.round((totalTemp / validDays) * 10) / 10,
              avgPrecip: Math.round((totalPrecip / validDays) * 10) / 10,
              avgSun: Math.round((totalSun / validDays / 3600) * 10) / 10,
            },
            create: {
              FK_cityId: city.id,
              month,
              avgTemp: Math.round((totalTemp / validDays) * 10) / 10,
              avgPrecip: Math.round((totalPrecip / validDays) * 10) / 10,
              avgSun: Math.round((totalSun / validDays / 3600) * 10) / 10,
            }
          });
        } catch {
          // skip city/month on error
        }
      }
    }));

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < allCities.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });