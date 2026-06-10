import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { EnumType, EnumMethod } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

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
  const cities = new Map<string, { name: string; inseeCode: string; longitude?: number; latitude?: number; postalCode?: string; id?: string; region: string }>();
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

  // Insert cities into the database
  for (const city of cities.values()) {
    const created = await prisma.city.create({
      data: {
        name: city.name,
        inseeCode: city.inseeCode,
        longitude: city.longitude ?? 0,
        latitude: city.latitude ?? 0,
        postalCode: city.postalCode ?? '00000',
        region: city.region
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

      const title = (obj.label?.['@fr'] ?? 'Sans titre').substring(0,100)
      const imageUrl = obj.hasMainRepresentation?.[0]?.hasRelatedResource?.[0]?.locator?.[0] ?? null

      await prisma.event.create({
        data: {
          title: title,
          type: mapType(obj.type ?? []) as EnumType,
          startDate,
          endDate,
          FK_cityId: cityId,
          imageUrl
        }
      })
    }
  }
  // ***                ***
  //       USER REVIEWS
  // ***                ***
  // recuperate from bdd first event on our base
  const eventsByType = await Promise.all([
    prisma.event.findFirst({ where: { type: 'FESTIVAL' } }),
    prisma.event.findFirst({ where: { type: 'CONCERT' } }),
    prisma.event.findFirst({ where: { type: 'MARCHE' } }),
    prisma.event.findFirst({ where: { type: 'CONFERENCE' } }),
    prisma.event.findFirst({ where: { type: 'RUNNING' } }),
    prisma.event.findFirst({ where: { type: 'SPORT' } }),
    prisma.event.findFirst({ where: { type: 'SPECTACLE' } }),
    prisma.event.findFirst({ where: { type: 'EXPOSITION' } }),
    prisma.event.findFirst({ where: { type: 'ANIMATION' } }),
    prisma.event.findFirst({ where: { type: 'CINEMA' } }),
    prisma.event.findFirst({ where: { type: 'THEATRE' } }),
  ])

  // filter null events skip them (types not found in seed data)
  const validEvents = eventsByType.filter((e) => e !== null) as NonNullable<typeof eventsByType[0]>[]

  const reviews = []
  // for each event, create 2 reviews, one by admin and one by user
  for (const event of validEvents) {
    const r1 = await prisma.userReview.create({
      data: {
        rating: 5,
        comment: "Excellent événement, très bien organisé !",
        FK_EventId: event.id,
        FK_userId: admin.id,
        createdBy: admin.id
      }
    })
    const r2 = await prisma.userReview.create({
      data: {
        rating: 3,
        comment: "Bien mais peut mieux faire.",
        FK_EventId: event.id,
        FK_userId: user.id,
        createdBy: user.id
      }
    })
    reviews.push(r1, r2)
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

  for (const event of validEvents) {
    await prisma.log.create({
      data: {
        method: EnumMethod.GET,
        FK_userId: admin.id,
        fk_eventId: event.id
      }
    })
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