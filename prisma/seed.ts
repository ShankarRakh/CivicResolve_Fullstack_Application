/**
 * Seed script — Pune wards with realistic GPS center points.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PUNE_WARDS = [
  { name: "Kothrud",       zone: "Zone 4", centerLat: 18.5074, centerLng: 73.8077 },
  { name: "Hadapsar",      zone: "Zone 5", centerLat: 18.5089, centerLng: 73.9260 },
  { name: "Baner",         zone: "Zone 4", centerLat: 18.5590, centerLng: 73.7868 },
  { name: "Viman Nagar",   zone: "Zone 5", centerLat: 18.5679, centerLng: 73.9143 },
  { name: "Kasba Peth",    zone: "Zone 3", centerLat: 18.5140, centerLng: 73.8569 },
  { name: "Shivajinagar",  zone: "Zone 3", centerLat: 18.5308, centerLng: 73.8474 },
  { name: "Deccan",        zone: "Zone 4", centerLat: 18.5170, centerLng: 73.8408 },
  { name: "Hinjewadi",     zone: "Zone 1", centerLat: 18.5912, centerLng: 73.7390 },
  { name: "Wakad",         zone: "Zone 1", centerLat: 18.5981, centerLng: 73.7630 },
  { name: "Kondhwa",       zone: "Zone 5", centerLat: 18.4637, centerLng: 73.8940 },
];

async function main() {
  console.log("🌱 Seeding Pune wards...");

  for (const ward of PUNE_WARDS) {
    await prisma.ward.upsert({
      where: { id: ward.name.toLowerCase().replace(/\s+/g, "-") },
      update: { centerLat: ward.centerLat, centerLng: ward.centerLng },
      create: {
        id: ward.name.toLowerCase().replace(/\s+/g, "-"),
        name: ward.name,
        zone: ward.zone,
        centerLat: ward.centerLat,
        centerLng: ward.centerLng,
      },
    });
    console.log(`  ✅ ${ward.name} (${ward.zone})`);
  }

  console.log(`\n🎉 Done — ${PUNE_WARDS.length} wards seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
