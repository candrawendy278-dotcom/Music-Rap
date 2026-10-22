/**
 * global200AggregationEngine.ts
 *
 * Authentic Billboard Global 200 Aggregation Engine.
 * Guarantees 200 unique entries by aggregating regional charts across all countries
 * and filling any remaining slots from UNIQUE_REAL_WORLD_SINGLES with zero duplicates.
 */

import { ChartItem, Song } from '../types';
import { COUNTRY_TIERS } from '../constants';
import { getCountryMarketProfile } from './countryMarketSystem';
import {
  resolveRealWorldCoverArt,
  normalizeRealArtistName,
  normalizeRealTitle
} from './realWorldArtistCatalog';
import { generateRealNpcSinglesChart } from './npcRealReleaseChartsEngine';
import { isNpcMatchingPlayerName } from './npcPlayerDeduplicationEngine';

export interface GlobalTrackAggregate {
  title: string;
  artist: string;
  isPlayer: boolean;
  cover: string | null;
  totalGlobalStreams: number;
  totalGlobalSales: number;
  territoryCount: number;
  topTerritory: string;
  topTerritoryStreams: number;
}

/**
 * Aggregates regional singles charts from all countries in the game into
 * an authentic 200-entry Billboard Global 200 chart strictly from real NPC & Player releases.
 */
export function aggregateGlobal200Chart(
  regionalSingles: Record<string, ChartItem[]>,
  playerSongs: Song[],
  playerName: string
): ChartItem[] {
  const trackMap = new Map<string, GlobalTrackAggregate>();

  // 1. Aggregate streams & sales across every country's regional chart
  const countryCodes = Object.keys(regionalSingles);

  for (const cc of countryCodes) {
    const countryChart = regionalSingles[cc] || [];
    const tier = COUNTRY_TIERS[cc] || 3;
    const marketProfile = getCountryMarketProfile(cc);

    const tierTerritoryWeight = tier === 1 ? 1.85 : tier === 2 ? 1.15 : 0.55;
    const marketScaleWeight = tierTerritoryWeight * (0.65 + ((marketProfile as any).marketScaleFactor || 1.0) * 0.5);

    for (let idx = 0; idx < countryChart.length; idx++) {
      const entry = countryChart[idx];
      if (!entry.isPlayer && isNpcMatchingPlayerName(entry.artist, playerName)) {
        continue;
      }

      const cleanArtist = entry.isPlayer ? entry.artist : normalizeRealArtistName(entry.artist);
      const cleanTitle = entry.isPlayer ? entry.title : normalizeRealTitle(entry.title, cleanArtist, false);
      const key = `${cleanArtist.toLowerCase()}___${cleanTitle.toLowerCase()}`;

      let countryStreams = entry.stats?.streams || 0;
      let countrySales = entry.stats?.sales || 0;

      if (countryStreams <= 0) {
        countryStreams = Math.round(entry.points * 210 * marketScaleWeight);
      } else {
        countryStreams = Math.round(countryStreams * (0.75 + tierTerritoryWeight * 0.25));
      }

      if (countrySales <= 0) {
        countrySales = Math.round(entry.points * 0.14 * marketScaleWeight * ((marketProfile as any).itunesAffinity || 1.0));
      }

      const existing = trackMap.get(key);
      if (existing) {
        existing.totalGlobalStreams += countryStreams;
        existing.totalGlobalSales += countrySales;
        existing.territoryCount += 1;
        if (countryStreams > existing.topTerritoryStreams) {
          existing.topTerritoryStreams = countryStreams;
          existing.topTerritory = cc;
        }
      } else {
        trackMap.set(key, {
          title: cleanTitle,
          artist: cleanArtist,
          isPlayer: entry.isPlayer,
          cover: entry.isPlayer ? entry.cover : resolveRealWorldCoverArt(cleanArtist, cleanTitle, false, entry.cover || undefined),
          totalGlobalStreams: countryStreams,
          totalGlobalSales: countrySales,
          territoryCount: 1,
          topTerritory: cc,
          topTerritoryStreams: countryStreams
        });
      }
    }
  }

  // 2. Ensure released player songs with active weekly streams are accurately represented
  const releasedPlayerSongs = playerSongs.filter(
    s => s.status === 'released' && ((s.weeklyStreams || 0) > 0 || (s.dailyStreams || 0) > 0)
  );

  for (const pSong of releasedPlayerSongs) {
    const key = `${playerName.toLowerCase()}___${pSong.title.toLowerCase()}`;
    const actualWeeklyStreams = Math.max(pSong.weeklyStreams || 0, (pSong.dailyStreams || 0) * 7);
    const actualWeeklySales = Math.max(pSong.weeklyPureSales || 0, (pSong.dailyPureSales || 0) * 7);

    const existing = trackMap.get(key);
    if (existing) {
      existing.totalGlobalStreams = Math.max(existing.totalGlobalStreams, actualWeeklyStreams);
      existing.totalGlobalSales = Math.max(existing.totalGlobalSales, actualWeeklySales);
      existing.cover = pSong.cover || existing.cover;
      existing.isPlayer = true;
    } else if (actualWeeklyStreams > 5000 || actualWeeklySales > 50) {
      trackMap.set(key, {
        title: pSong.title,
        artist: playerName,
        isPlayer: true,
        cover: pSong.cover,
        totalGlobalStreams: actualWeeklyStreams,
        totalGlobalSales: actualWeeklySales,
        territoryCount: Math.max(1, Object.keys((pSong as any).regionalStreams || {}).length),
        topTerritory: 'US',
        topTerritoryStreams: Math.round(actualWeeklyStreams * 0.25)
      });
    }
  }

  // 3. Convert aggregated global totals into official Billboard Global 200 units
  const globalEntries: ChartItem[] = [];

  trackMap.forEach(agg => {
    const streamUnits = agg.totalGlobalStreams / 200;
    const salesUnits = agg.totalGlobalSales * 1.0;
    const territoryBonus = Math.min(1.22, 1.0 + Math.max(0, agg.territoryCount - 1) * 0.008);
    const globalPoints = Math.max(15, Math.round((streamUnits + salesUnits) * territoryBonus));

    globalEntries.push({
      title: agg.title,
      artist: agg.artist,
      points: globalPoints,
      isPlayer: agg.isPlayer,
      cover: agg.cover,
      lastPosition: null,
      stats: {
        streams: Math.round(agg.totalGlobalStreams),
        sales: Math.round(agg.totalGlobalSales),
        radio: 0
      }
    });
  });

  // 4. Sort descending by global points
  globalEntries.sort((a, b) => b.points - a.points);

  // 5. Fill any remaining slots up to 200 strictly from real active NPC releases (`npc.songs`)
  if (globalEntries.length < 200) {
    const realGlobalPool = generateRealNpcSinglesChart({
      platform: 'billboard',
      region: 'global',
      playerSongs,
      playerName,
      playerCountry: 'US',
      playerPopularity: 50,
      playerHype: 50,
      limit: 200
    });

    for (const item of realGlobalPool) {
      if (globalEntries.length >= 200) break;
      const key = `${item.artist.toLowerCase()}___${item.title.toLowerCase()}`;
      if (trackMap.has(key)) continue;
      trackMap.set(key, {
        title: item.title,
        artist: item.artist,
        isPlayer: item.isPlayer,
        cover: item.cover,
        totalGlobalStreams: item.stats?.streams || 0,
        totalGlobalSales: item.stats?.sales || 0,
        territoryCount: 1,
        topTerritory: 'US',
        topTerritoryStreams: 0
      });
      globalEntries.push(item);
    }
  }

  globalEntries.sort((a, b) => b.points - a.points);
  return globalEntries.slice(0, 200);
}
