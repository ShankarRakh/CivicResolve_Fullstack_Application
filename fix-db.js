const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  console.log('Fixing schema permissions...');
  try {
    await prisma.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    await prisma.$executeRawUnsafe('GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await prisma.$executeRawUnsafe('GRANT EXECUTE ON FUNCTION match_complaints TO authenticated, anon;');
    console.log('Successfully updated permissions');
  } catch(e) {
    console.error('Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
