// Server entry point — starts HTTP server and connects to DB
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const prisma = require('./utils/prisma');

const { setDbConnected, getDbStatus } = require('./utils/dbState');

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  // Test database connection if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    const errorMsg = 'Environment variable not found: DATABASE_URL';
    setDbConnected(false, errorMsg);
    if (isProduction) {
      console.error(`❌ Fatal: ${errorMsg}`);
      process.exit(1);
    }
    console.warn(`⚠️  Warning: ${errorMsg}. Server starting in offline development mode.`);
  } else {
    try {
      await prisma.$connect();
      setDbConnected(true, null);
      console.log('✅ Database connected successfully');
      const { warmupFareCache } = require('./services/fareCalculationService');
      warmupFareCache().catch(() => {});
    } catch (error) {
      setDbConnected(false, error.message);
      if (isProduction) {
        console.error('❌ Failed to connect to database in production:', error.message);
        await prisma.$disconnect();
        process.exit(1);
      }
      console.warn('⚠️  Warning: Database connection failed. Server starting in offline development mode.');
      console.warn(`   Reason: ${error.message}`);
      if (!isProduction) {
        const retryTimer = setInterval(async () => {
          try {
            await prisma.$connect();
            setDbConnected(true, null);
            clearInterval(retryTimer);
            console.log('✅ Database connected successfully (recovered in background)');
            const { warmupFareCache } = require('./services/fareCalculationService');
            warmupFareCache().catch(() => {});
          } catch {
            // Will retry in 5 seconds
          }
        }, 5000);
      }
    }
  }

  // Start HTTP server
  const http = require('http');
  const server = http.createServer(app);
  server.listen({ port: PORT, exclusive: false }, () => {
    const dbStatus = getDbStatus();
    console.log(`\n🚀 Pune ↔ Mumbai Travel API`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Server:   http://localhost:${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/health`);
    console.log(`   Env:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Database: ${dbStatus.connected ? 'Connected' : 'Disconnected (Offline Mode)'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n⏳ Shutting down gracefully...');
    server.close(async () => {
      if (getDbStatus().connected) {
        await prisma.$disconnect();
      }
      console.log('✅ Server disconnected');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
