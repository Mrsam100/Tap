import { Hono } from 'hono';
import { db } from '@tap/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const healthRoutes = new Hono();

const startedAt = Date.now();

// Read version once at startup from the root package.json
let appVersion = '0.0.0';
try {
  const pkgPath = resolve(__dirname, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  appVersion = pkg.version || appVersion;
} catch {
  // fallback — file might not exist in some build setups
}

// Basic liveness probe — always returns 200 if process is alive
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: appVersion,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  });
});

// Readiness probe — checks DB connectivity
healthRoutes.get('/ready', async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
      version: appVersion,
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (err) {
    return c.json({
      status: 'degraded',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});
