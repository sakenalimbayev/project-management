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
    { city: 'Astana', region: null },
    { city: 'Almaty', region: null },
    { city: 'Shymkent', region: null },
    { city: null, region: 'Akmola' },
    { city: 'Karaganda', region: 'Karagandy' }
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
