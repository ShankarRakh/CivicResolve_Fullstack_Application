const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { departmentId: { not: null } },
  select: { id: true, role: true, departmentId: true }
}).then(r => console.log(JSON.stringify(r, null, 2))).finally(() => prisma.$disconnect());
