import { ChartItem } from '../types';
import {
  resolveRealWorldCoverArt,
  normalizeRealArtistName,
  normalizeRealTitle
} from './realWorldArtistCatalog';
import {
  generateRealNpcSinglesChart,
  generateRealNpcAlbumsChart
} from './npcRealReleaseChartsEngine';
import { isNpcMatchingPlayerName } from './npcPlayerDeduplicationEngine';

/**
 * Generates initial authentic Billboard Singles chart 100% from actual NPC releases:
 * - When region === 'global': up to 200 unique entries (Billboard Global 200)
 * - When region !== 'global': up to 100 unique entries (Billboard Hot 100 / Regional Top 100)
 */
export function getInitialBillboardSingles(region: string = 'global'): ChartItem[] {
  return generateRealNpcSinglesChart({
    platform: 'billboard',
    region,
    playerSongs: [],
    playerName: '',
    playerCountry: 'US',
    playerPopularity: 2.0,
    playerHype: 15.0,
    isWeekly: true,
    currentDate: '2026-01-01T00:00:00Z',
    limit: region === 'global' ? 200 : 100
  });
}

/**
 * Generates initial authentic Billboard Hot 100 chart (100 unique entries from actual NPC releases).
 */
export function getInitialHot100Singles(): ChartItem[] {
  return getInitialBillboardSingles('US');
}

/**
 * Generates initial authentic Billboard 200 Albums chart 100% from actual released NPC albums.
 */
export function getInitialBillboardAlbums(): ChartItem[] {
  return generateRealNpcAlbumsChart({
    platform: 'billboard',
    region: 'global',
    playerProjects: [],
    playerSongs: [],
    playerName: '',
    playerCountry: 'US',
    currentDate: '2026-01-01T00:00:00Z',
    limit: 200
  });
}

import { synchronizeAndEnrichChartMovements } from './chartMovementAndReEntryEngine';

/**
 * Ensures any Billboard 200 Albums chart array contains only authentic NPC and Player released albums
 * with zero duplicates and automatic Player-NPC name deduplication.
 */
export function ensureBillboard200Albums(
  existingChart?: ChartItem[],
  prevChart?: ChartItem[] | null,
  currentDate?: Date | string
): ChartItem[] {
  if (!existingChart || existingChart.length === 0) {
    return getInitialBillboardAlbums();
  }

  const deduped: ChartItem[] = [];
  const seenKeys = new Set<string>();
  const seenTitles = new Set<string>();

  for (const item of existingChart) {
    if (!item.isPlayer && isNpcMatchingPlayerName(item.artist)) {
      continue;
    }

    const primaryRaw = item.isPlayer ? item.artist : item.artist.split(',')[0].trim();
    const cleanPrimary = item.isPlayer ? item.artist : normalizeRealArtistName(primaryRaw);
    const cleanTitle = item.isPlayer ? item.title : normalizeRealTitle(item.title, cleanPrimary, true);
    const key = `${cleanPrimary.toLowerCase()}::${cleanTitle.toLowerCase()}`;
    const titleKey = cleanTitle.toLowerCase().trim();

    if (!item.isPlayer && (seenKeys.has(key) || seenTitles.has(titleKey))) {
      continue;
    }
    seenKeys.add(key);
    seenTitles.add(titleKey);

    deduped.push({
      ...item,
      artist: item.artist.includes(',') ? item.artist : cleanPrimary,
      title: cleanTitle,
      cover: item.isPlayer ? item.cover : resolveRealWorldCoverArt(cleanPrimary, cleanTitle, true, item.cover)
    });
  }

  const sliced = deduped.slice(0, 200);

  return synchronizeAndEnrichChartMovements(
    sliced,
    prevChart ?? null,
    'billboard_albums200',
    true,
    currentDate
  );
}

/**
 * Ensures any Billboard Singles chart contains only authentic NPC and Player released singles
 * with zero duplicates and automatic Player-NPC name deduplication.
 */
export function ensureBillboardSinglesChart(
  existingChart: ChartItem[] | undefined,
  region: string = 'global',
  prevChart?: ChartItem[] | null,
  currentDate?: Date | string
): ChartItem[] {
  const targetCount = region === 'global' ? 200 : 100;
  if (!existingChart || existingChart.length === 0) {
    return getInitialBillboardSingles(region);
  }

  const deduped: ChartItem[] = [];
  const seenKeys = new Set<string>();

  for (const item of existingChart) {
    if (!item.isPlayer && isNpcMatchingPlayerName(item.artist)) {
      continue;
    }

    const primaryRaw = item.isPlayer ? item.artist : item.artist.split(',')[0].trim();
    const cleanPrimary = item.isPlayer ? item.artist : normalizeRealArtistName(primaryRaw);
    const cleanTitle = item.isPlayer ? item.title : normalizeRealTitle(item.title, cleanPrimary, false);
    const key = `${cleanPrimary.toLowerCase()}::${cleanTitle.toLowerCase()}`;

    if (!item.isPlayer && seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);

    deduped.push({
      ...item,
      artist: item.artist.includes(',') ? item.artist : cleanPrimary,
      title: cleanTitle,
      cover: item.isPlayer ? item.cover : resolveRealWorldCoverArt(cleanPrimary, cleanTitle, false, item.cover)
    });
  }

  const sliced = deduped.slice(0, targetCount);

  return synchronizeAndEnrichChartMovements(
    sliced,
    prevChart ?? null,
    `billboard_singles_${region}`,
    true,
    currentDate
  );
}


