import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient()

async function main() {
  // ---- Ministries ----
  const ministries = [
    { name: 'Ministry of Defense' },
    { name: 'Ministry of Economics' },
    { name: 'Ministry of Health' },
    { name: 'Ministry of Education' },
  ]

  for (const ministry of ministries) {
    await prisma.ministry.upsert({
      where: { name: ministry.name },
      update: {},
      create: ministry,
    })
  }

  // ---- Locations ----
  const locations = [
    { city: 'Astana', region: null, latitude: 51.1694, longitude: 71.4491 },
    { city: 'Almaty', region: null, latitude: 43.238949, longitude: 76.889709 },
    { city: 'Shymkent', region: null, latitude: 42.341783, longitude: 69.590329 },
    { city: null, region: 'Akmola', latitude: 53.2833, longitude: 69.3833 },
    { city: 'Karaganda', region: 'Karagandy', latitude: 49.8028, longitude: 73.0885 },
  ]

  for (const loc of locations) {
    const where =
      loc.city && loc.region
        ? { city: loc.city, region: loc.region }
        : loc.city
          ? { city: loc.city, region: null }
          : loc.region
            ? { city: null, region: loc.region }
            : null

    if (!where) continue

    const exists = await prisma.location.findFirst({ where })

    if (!exists) {
      await prisma.location.create({ data: loc })
    } else {
      await prisma.location.update({
        where: { id: exists.id },
        data: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
      })
    }
  }
}

main()
  .then(() => {
    console.log('🌱 Seed completed')
  })
  .catch((e) => {
    console.error('❌ Seed failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
