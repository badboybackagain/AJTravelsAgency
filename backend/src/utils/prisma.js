// Singleton Prisma Client
// Prevents multiple connections in development hot-reload

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}
prisma = globalForPrisma.__prisma;

module.exports = prisma;
