import 'dotenv/config';
import { signToken } from './lib/jwt';
import { prisma } from './lib/prisma';

/**
 * IMPORTANT: Before running this script, ensure that your Next.js server
 * is running in a separate terminal using: pnpm dev
 * The server must be accessible at http://localhost:3000
 */

async function test() {
  console.log("=== Testing Semantic Duplicate Detection ===");

  const user = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
  if (!user) {
    console.error("No citizen user found. Cannot test.");
    return;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  const description = "There is a massive pothole on the main road causing traffic accidents.";

  console.log(`\nChecking duplicates for description: "${description}"`);

  const response = await fetch("http://localhost:3000/api/complaints/check-duplicate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ description })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Check Duplicate Failed:", response.status, error);
    return;
  }

  const result = await response.json();
  console.log("\nDuplicate Matches Found:", result.matches?.length || 0);
  
  if (result.matches && result.matches.length > 0) {
    result.matches.forEach((m: any, i: number) => {
      console.log(`\nMatch ${i + 1}:`);
      console.log(`- ID: ${m.display_id}`);
      console.log(`- Similarity: ${(m.similarity * 100).toFixed(2)}%`);
      console.log(`- Description: ${m.description}`);
    });
  } else {
    console.log("No duplicates found. The system is working correctly!");
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
