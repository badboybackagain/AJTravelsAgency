// Server entry point — starts HTTP server and connects to DB
require('dotenv').config();

const app = require('./app');
const prisma = require('./utils/prisma');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Pune ↔ Mumbai Travel API`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Server:   http://localhost:${PORT}`);
      console.log(`   Health:   http://localhost:${PORT}/health`);
      console.log(`   Env:      ${process.env.NODE_ENV || 'development'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n⏳ Shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Server and database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
