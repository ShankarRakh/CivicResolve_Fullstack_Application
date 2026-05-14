const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { departmentId: 'dept-water', role: 'OFFICER' },
  select: {
    id: true,
    name: true,
    _count: {
      select: {
        complaintsAssigned: {
          where: { status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } }
        }
      }
    }
  }
}).then(r => console.log(JSON.stringify(r, null, 2))).finally(() => prisma.$disconnect());
