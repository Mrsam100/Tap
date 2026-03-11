import { apiFetch } from './api';
import type {
  AnalyticsOverview,
  TimeseriesPoint,
  ReferrerStat,
  DeviceStat,
  BrowserStat,
  OsStat,
  CountryStat,
  CityStat,
  LinkStat,
  AnalyticsPeriod,
} from '@tap/shared';

function qs(period: AnalyticsPeriod) {
  return `?period=${period}`;
}

export async function fetchAnalyticsOverview(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{ overview: AnalyticsOverview }>(
    `/profiles/${profileId}/analytics/overview${qs(period)}`
  );
}

export async function fetchTimeseries(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{ timeseries: TimeseriesPoint[] }>(
    `/profiles/${profileId}/analytics/timeseries${qs(period)}`
  );
}

export async function fetchReferrers(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{ referrers: ReferrerStat[] }>(
    `/profiles/${profileId}/analytics/referrers${qs(period)}`
  );
}

export async function fetchDevices(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{
    devices: DeviceStat[];
    browsers: BrowserStat[];
    operatingSystems: OsStat[];
  }>(`/profiles/${profileId}/analytics/devices${qs(period)}`);
}

export async function fetchLocations(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{
    countries: CountryStat[];
    cities: CityStat[];
  }>(`/profiles/${profileId}/analytics/locations${qs(period)}`);
}

export async function fetchLinkStats(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{ links: LinkStat[] }>(
    `/profiles/${profileId}/analytics/links${qs(period)}`
  );
}
