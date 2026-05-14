const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to add column manually...');
    await prisma.$executeRawUnsafe('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_image TEXT;');
    console.log('Column added (or already exists).');
    
    // Also check other columns if necessary
    // await prisma.$executeRawUnsafe('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;');
    
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
