import { prisma } from './lib/prisma';
import { signToken } from './lib/jwt';
import { CATEGORIES } from './lib/constants';

async function main() {
  console.log("=== Testing Auto-Assigning Wards via API ===");

  // 1. Ensure we have a citizen user
  let user = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
  if (!user) {
    console.log("No citizen found, creating one...");
    user = await prisma.user.create({
      data: {
        email: `test-citizen-${Date.now()}@example.com`,
        phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        passwordHash: 'dummy-hash',
        name: 'Test Citizen',
        role: 'CITIZEN'
      }
    });
  }

  // 2. Get a target ward to test coordinates (e.g. Kothrud, Zone 4)
  const targetWard = await prisma.ward.findFirst({
    where: { centerLat: { not: null }, centerLng: { not: null } }
  });

  if (!targetWard) {
    console.error("No wards with coordinates found in the database. Please run seed script first.");
    return;
  }

  // Generate slightly offset coordinates from the center
  const testLat = Number(targetWard.centerLat) + 0.001;
  const testLng = Number(targetWard.centerLng) + 0.001;

  console.log(`Targeting Ward: ${targetWard.name} (${targetWard.zone})`);
  console.log(`Using Coordinates: Lat ${testLat}, Lng ${testLng}`);

  // 3. Generate a token
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  // 4. Find valid category and subcategory from constants
  const validCategory = CATEGORIES[0];
  const validSubcategory = validCategory.subcategories?.[0];

  if (!validSubcategory) {
      console.error("No valid subcategory found in constants.");
      return;
  }

  // 5. Make the API request
  console.log("\nSending POST request to http://localhost:3000/api/complaints...");
  
  const payload = {
    categoryId: validCategory.id,
    subcategoryId: validSubcategory.id,
    description: "Testing auto-assignment functionality via script. Large pothole reported.",
    latitude: testLat,
    longitude: testLng
    // Intentionally omitting wardId
  };

  const response = await fetch("http://localhost:3000/api/complaints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Request Failed:", response.status, errorText);
    return;
  }

  const result = await response.json();
  console.log("API Response:", result);

  // 6. Verify the DB
  console.log("\nVerifying the database record...");
  const createdComplaint = await prisma.complaint.findUnique({
    where: { id: result.id },
    include: { ward: true }
  });

  if (!createdComplaint) {
    console.error("Complaint not found in database!");
    return;
  }

  if (createdComplaint.wardId === targetWard.id) {
    console.log(`✅ SUCCESS! The complaint was automatically assigned to Ward: ${createdComplaint.ward?.name} (ID: ${createdComplaint.wardId})`);
  } else if (createdComplaint.wardId) {
    console.log(`⚠️ ASSIGNED TO DIFFERENT WARD: Expected ${targetWard.name}, but got ${createdComplaint.ward?.name}`);
  } else {
    console.log("❌ FAILED! The wardId is null. Auto-assignment did not work.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
