const { performance } = require('perf_hooks');
const jwt = require('jsonwebtoken');
const prisma = require('../src/utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret-min-32-characters-long-ajtravel';

async function benchmark() {
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const token = jwt.sign(
    { userId: adminUser?.id || 'admin', role: 'ADMIN', email: adminUser?.email || 'admin@punetravelagency.in' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const endpoints = [
    { name: 'Locations API', url: 'http://localhost:3001/api/locations' },
    { name: 'Vehicles API', url: 'http://localhost:3001/api/vehicles' },
    { name: 'Routes API', url: 'http://localhost:3001/api/routes' },
    { name: 'Blogs API (Public)', url: 'http://localhost:3001/api/blogs' },
    { name: 'Admin Fares Configs', url: 'http://localhost:3001/api/fares/admin/configs', auth: true },
    { name: 'Admin Bookings', url: 'http://localhost:3001/api/bookings/admin', auth: true },
    { name: 'Admin Enquiries', url: 'http://localhost:3001/api/enquiries/admin', auth: true },
    { name: 'Admin Blogs', url: 'http://localhost:3001/api/admin/blogs', auth: true },
    { name: 'Admin Dashboard Stats', url: 'http://localhost:3001/api/admin/dashboard-stats', auth: true },
  ];

  console.log('--- PERFORMANCE BENCHMARK WITH AUTH ---');
  for (const ep of endpoints) {
    const times = [];
    let size = 0;
    let status = 0;
    for (let i = 0; i < 3; i++) {
      const headers = ep.auth ? { Authorization: `Bearer ${token}` } : {};
      const start = performance.now();
      try {
        const res = await fetch(ep.url, { headers });
        status = res.status;
        const data = await res.json();
        const dur = performance.now() - start;
        times.push(dur);
        size = JSON.stringify(data).length;
      } catch (err) {
        console.error(`${ep.name} failed:`, err.message);
      }
    }
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
    const min = Math.min(...times).toFixed(1);
    console.log(`${ep.name}: avg ${avg}ms (min: ${min}ms), status ${status}, size ${(size / 1024).toFixed(2)} KB`);
  }
  await prisma.$disconnect();
}

benchmark();
