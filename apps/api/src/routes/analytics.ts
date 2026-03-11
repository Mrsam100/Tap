import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '@tap/db';
import { requireAuth } from '../middleware/auth';
import { profileOwnership } from '../middleware/ownership';
import type { AppEnv } from '../types';

export const analyticsRoutes = new Hono<AppEnv>();

analyticsRoutes.use('*', requireAuth);

// ── Helper: parse date range from query params ────────────────────

function getDateRange(c: { req: { query: (key: string) => string | undefined } }) {
  const period = c.req.query('period') || '30d';
  const end = new Date();
  let start: Date;

  switch (period) {
    case '7d':
      start = new Date(end.getTime() - 7 * 86400_000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 86400_000);
      break;
    case '90d':
      start = new Date(end.getTime() - 90 * 86400_000);
      break;
    case '12m':
      start = new Date(end.getTime() - 365 * 86400_000);
      break;
    case 'all':
      start = new Date('2020-01-01');
      break;
    default:
      start = new Date(end.getTime() - 30 * 86400_000);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    period,
  };
}

// Helper to get rows from Neon execute result
function rows<T>(result: { rows: T[] }): T[] {
  return result.rows;
}

// ── GET /api/profiles/:profileId/analytics/overview ───────────────

analyticsRoutes.get(
  '/profiles/:profileId/analytics/overview',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const { startDate, endDate } = getDateRange(c);

    // Current period: views + clicks from daily_stats, unique visitors from page_views
    const [statsResult, uniqueResult, engResult] = await Promise.all([
      db.execute(sql`
        SELECT
          COALESCE(SUM(views), 0) as total_views,
          COALESCE(SUM(total_clicks), 0) as total_clicks
        FROM daily_stats
        WHERE profile_id = ${profileId}
          AND date >= ${startDate}
          AND date <= ${endDate}
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT ip_hash) as unique_visitors
        FROM page_views
        WHERE profile_id = ${profileId}
          AND created_at >= ${startDate}::date
          AND created_at <= (${endDate}::date + interval '1 day')
      `),
      db.execute(sql`
        SELECT
          COALESCE(ROUND(AVG(time_on_page)), 0) as avg_time,
          COALESCE(ROUND(AVG(scroll_depth)), 0) as avg_scroll
        FROM page_views
        WHERE profile_id = ${profileId}
          AND created_at >= ${startDate}::date
          AND created_at <= (${endDate}::date + interval '1 day')
          AND time_on_page IS NOT NULL
      `),
    ]);

    const currentStats = rows(statsResult)[0] as Record<string, string> | undefined;
    const uniqueStats = rows(uniqueResult)[0] as Record<string, string> | undefined;
    const engagement = rows(engResult)[0] as Record<string, string> | undefined;

    // Previous period stats (for comparison)
    const daysDiff = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400_000
    );
    const prevStart = new Date(
      new Date(startDate).getTime() - daysDiff * 86400_000
    ).toISOString().slice(0, 10);

    const [prevStatsResult, prevUniqueResult] = await Promise.all([
      db.execute(sql`
        SELECT
          COALESCE(SUM(views), 0) as total_views,
          COALESCE(SUM(total_clicks), 0) as total_clicks
        FROM daily_stats
        WHERE profile_id = ${profileId}
          AND date >= ${prevStart}
          AND date < ${startDate}
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT ip_hash) as unique_visitors
        FROM page_views
        WHERE profile_id = ${profileId}
          AND created_at >= ${prevStart}::date
          AND created_at < ${startDate}::date
      `),
    ]);

    const prevStats = rows(prevStatsResult)[0] as Record<string, string> | undefined;
    const prevUnique = rows(prevUniqueResult)[0] as Record<string, string> | undefined;

    const current = {
      views: Number(currentStats?.total_views ?? 0),
      uniqueVisitors: Number(uniqueStats?.unique_visitors ?? 0),
      clicks: Number(currentStats?.total_clicks ?? 0),
    };

    const previous = {
      views: Number(prevStats?.total_views ?? 0),
      uniqueVisitors: Number(prevUnique?.unique_visitors ?? 0),
      clicks: Number(prevStats?.total_clicks ?? 0),
    };

    function pctChange(curr: number, prev: number): number {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    }

    const ctr = current.views > 0
      ? Math.round((current.clicks / current.views) * 1000) / 10
      : 0;

    return c.json({
      overview: {
        views: current.views,
        viewsChange: pctChange(current.views, previous.views),
        uniqueVisitors: current.uniqueVisitors,
        visitorsChange: pctChange(current.uniqueVisitors, previous.uniqueVisitors),
        clicks: current.clicks,
        clicksChange: pctChange(current.clicks, previous.clicks),
        ctr,
        avgTimeOnPage: Number(engagement?.avg_time ?? 0),
        avgScrollDepth: Number(engagement?.avg_scroll ?? 0),
      },
    });
  }
);

// ── GET /api/profiles/:profileId/analytics/timeseries ─────────────

analyticsRoutes.get(
  '/profiles/:profileId/analytics/timeseries',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const { startDate, endDate, period } = getDateRange(c);

    // For long ranges (all/12m), aggregate by week to cap data points
    const aggregateByWeek = period === 'all' || period === '12m';

    const tsRows = aggregateByWeek
      ? rows(await db.execute(sql`
          SELECT
            DATE_TRUNC('week', date::date)::date::text as date,
            SUM(views)::int as views,
            SUM(unique_visitors)::int as unique_visitors,
            SUM(total_clicks)::int as total_clicks
          FROM daily_stats
          WHERE profile_id = ${profileId}
            AND date >= ${startDate}
            AND date <= ${endDate}
          GROUP BY DATE_TRUNC('week', date::date)
          ORDER BY date ASC
        `)) as Array<Record<string, string>>
      : rows(await db.execute(sql`
          SELECT date, views, unique_visitors, total_clicks
          FROM daily_stats
          WHERE profile_id = ${profileId}
            AND date >= ${startDate}
            AND date <= ${endDate}
          ORDER BY date ASC
        `)) as Array<Record<string, string>>;

    if (aggregateByWeek) {
      // For weekly aggregation, return rows directly (no gap-fill needed)
      return c.json({
        timeseries: tsRows.map((row) => ({
          date: row.date,
          views: Number(row.views),
          visitors: Number(row.unique_visitors),
          clicks: Number(row.total_clicks),
        })),
      });
    }

    // Daily: fill gaps with zeroes
    const dataMap = new Map<string, { views: number; visitors: number; clicks: number }>();
    for (const row of tsRows) {
      dataMap.set(row.date, {
        views: Number(row.views),
        visitors: Number(row.unique_visitors),
        clicks: Number(row.total_clicks),
      });
    }

    const series: Array<{ date: string; views: number; visitors: number; clicks: number }> = [];
    const cursor = new Date(startDate);
    const end = new Date(endDate);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      series.push({
        date: key,
        ...(dataMap.get(key) || { views: 0, visitors: 0, clicks: 0 }),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return c.json({ timeseries: series });
  }
);

// ── GET /api/profiles/:profileId/analytics/referrers ──────────────

analyticsRoutes.get(
  '/profiles/:profileId/analytics/referrers',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const { startDate, endDate } = getDateRange(c);

    const refRows = rows(await db.execute(sql`
      SELECT
        COALESCE(referrer, 'Direct') as referrer,
        COUNT(*) as count
      FROM page_views
      WHERE profile_id = ${profileId}
        AND created_at >= ${startDate}::date
        AND created_at <= (${endDate}::date + interval '1 day')
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 20
    `)) as Array<Record<string, string>>;

    return c.json({
      referrers: refRows.map((r) => ({
        source: r.referrer,
        count: Number(r.count),
      })),
    });
  }
);

// ── GET /api/profiles/:profileId/analytics/devices ────────────────

analyticsRoutes.get(
  '/profiles/:profileId/analytics/devices',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const { startDate, endDate } = getDateRange(c);

    const [deviceResult, browserResult, osResult] = await Promise.all([
      db.execute(sql`
        SELECT device_type, COUNT(*) as count
        FROM page_views
        WHERE profile_id = ${profileId}
          AND created_at >= ${startDate}::date
          AND created_at <= (${endDate}::date + interval '1 day')
          AND device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
      `),
      db.execute(sql`
        SELECT browser, COUNT(*) as count
        FROM page_views
        WHERE profile_id = ${profileId}
          AND created_at >= ${startDate}::date
          AND created_at <= (${endDate}::date + interval '1 day')
          AND browser IS NOT NULL
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 10
      `),
      db.execute(sql`
        SELECT os, COUNT(*) as count
        FROM page_views
        WHERE profile_id = ${profileId}
          AND created_at >= ${startDate}::date
          AND created_at <= (${endDate}::date + interval '1 day')
          AND os IS NOT NULL
        GROUP BY os
        ORDER BY count DESC
        LIMIT 10
      `),
    ]);

    const deviceRows = rows(deviceResult) as Array<Record<string, string>>;
    const browserRows = rows(browserResult) as Array<Record<string, string>>;
    const osRows = rows(osResult) as Array<Record<string, string>>;

    return c.json({
      devices: deviceRows.map((r) => ({ type: r.device_type, count: Number(r.count) })),
      browsers: browserRows.map((r) => ({ name: r.browser, count: Number(r.count) })),
      operatingSystems: osRows.map((r) => ({ name: r.os, count: Number(r.count) })),
    });
  }
);

// ── GET /api/profiles/:profileId/analytics/locations ──────────────

analyticsRoutes.get(
  '/profiles/:profileId/analytics/locations',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const { startDate, endDate } = getDateRange(c);

    const locRows = rows(await db.execute(sql`
      SELECT
        COALESCE(country, 'Unknown') as country,
        COALESCE(city, 'Unknown') as city,
        COUNT(*) as count
      FROM page_views
      WHERE profile_id = ${profileId}
        AND created_at >= ${startDate}::date
        AND created_at <= (${endDate}::date + interval '1 day')
      GROUP BY country, city
      ORDER BY count DESC
      LIMIT 50
    `)) as Array<Record<string, string>>;

    // Aggregate by country
    const countryMap = new Map<string, number>();
    for (const r of locRows) {
      countryMap.set(r.country, (countryMap.get(r.country) || 0) + Number(r.count));
    }
    const countries = [...countryMap.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    return c.json({
      countries,
      cities: locRows.map((r) => ({
        country: r.country,
        city: r.city,
        count: Number(r.count),
      })),
    });
  }
);

// ── GET /api/profiles/:profileId/analytics/links ──────────────────

analyticsRoutes.get(
  '/profiles/:profileId/analytics/links',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const { startDate, endDate } = getDateRange(c);

    const linkRows = rows(await db.execute(sql`
      SELECT
        l.id as link_id,
        COALESCE(l.label, 'Untitled') as label,
        COALESCE(l.url, '#') as url,
        l.type,
        COUNT(lc.id) as clicks
      FROM links l
      LEFT JOIN link_clicks lc ON lc.link_id = l.id
        AND lc.created_at >= ${startDate}::date
        AND lc.created_at <= (${endDate}::date + interval '1 day')
      WHERE l.profile_id = ${profileId}
        AND l.is_archived = false
      GROUP BY l.id, l.label, l.url, l.type, l.position
      ORDER BY clicks DESC, l.position ASC
    `)) as Array<Record<string, string>>;

    return c.json({
      links: linkRows.map((r) => ({
        linkId: r.link_id,
        label: r.label,
        url: r.url,
        type: r.type,
        clicks: Number(r.clicks),
      })),
    });
  }
);
