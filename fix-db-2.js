const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking upvotes_count...');
    await prisma.$executeRawUnsafe('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;');
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
