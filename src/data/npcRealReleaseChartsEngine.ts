// Real NPC Release Charts & Playlist Aggregation Engine
// Builds all in-game charts (Spotify, Billboard, iTunes, YouTube) and Spotify Playlists
// 100% from the actual active releases (npc.songs & npc.albums) of REAL_WORLD_NPCS
// and the Player's released catalog — with zero mock filler data.

import { ChartItem, Project, Song } from '../types';
import { COUNTRY_TIERS } from '../constants';
import { REAL_WORLD_NPCS, resolveRealWorldCoverArt } from './realWorldArtistCatalog';
import { getNpcVideoThumbnail } from './npcYoutubeThumbnails';
import { syncNpcRealisticReleaseWorkflow } from './npcRealisticReleaseWorkflowEngine';
import { isNpcMatchingPlayerName, syncPlayerNameNpcDeduplication } from './npcPlayerDeduplicationEngine';
import {
  calculateAuthenticBillboardPoints
} from './billboardFormulaEngine';
import {
  getCountryMarketProfile,
  calculateSongTerritorialBreakdown
} from './countryMarketSystem';
import {
  getDailyCompetitiveRankWave,
  synchronizeAndEnrichChartMovements
} from './chartMovementAndReEntryEngine';
import { resolveSongMetadataAndCollabCredits } from './spotifyTrackMetadataAndCollabEngine';
import {
  getNpcLivingAttributes,
  calculateUnifiedYoutubeViewsFromStreams
} from './npcLivingArtistAttributesAndMarketEngine';
import {
  calculateCalibratedPlayerTerritoryMetrics,
  getPlayerHomeMarketAffinityMultiplier
} from './homeCountryAndMarketStabilityImprover';

export interface RealNpcSinglesChartParams {
  platform: 'spotify' | 'billboard' | 'itunes' | 'youtube';
  region: string; // 'global' or ISO country code ('US', 'GB', 'ID', 'KR', 'JP', etc.)
  playerSongs: Song[];
  playerName: string;
  playerCountry: string;
  playerPopularity: number;
  playerHype: number;
  isWeekly?: boolean;
  currentDate?: Date | string;
  limit?: number;
}

export interface RealNpcAlbumsChartParams {
  platform: 'billboard' | 'itunes';
  region: string; // 'global' or ISO country code
  playerProjects: Project[];
  playerSongs: Song[];
  playerName: string;
  playerCountry: string;
  currentDate?: Date | string;
  limit?: number;
}

function getTerritoryMarketFraction(countryCode: string): number {
  if (countryCode === 'global') return 1.0;
  const profile = getCountryMarketProfile(countryCode);
  // Total global weight across all territories is ~520
  return Math.max(0.008, profile.marketSizeWeight / 320);
}

function getNpcTerritorialAffinityMultiplier(
  npcCountry: string,
  npcGenre: string,
  targetRegion: string
): number {
  if (targetRegion === 'global') return 1.0;

  const targetProfile = getCountryMarketProfile(targetRegion);
  const npcProfile = getCountryMarketProfile(npcCountry);

  // Strong home-country chart affinity (e.g. Indonesian artists in ID, K-Pop in KR, J-Pop in JP, UK artists in GB)
  if (npcCountry === targetRegion) {
    if (targetRegion === 'ID' || targetRegion === 'KR' || targetRegion === 'JP' || targetRegion === 'NG' || targetRegion === 'BR') {
      return 4.2;
    }
    if (targetRegion === 'US' || targetRegion === 'GB') {
      return 1.35;
    }
    return 2.8;
  }

  // Regional group crossover (e.g. Latin artists across MX/CO/AR/ES, K-Pop across JP/ID/PH/TH, US/CA/GB/AU crossover)
  if (npcProfile.regionGroup === targetProfile.regionGroup) {
    return 1.45;
  }

  const g = (npcGenre || '').toLowerCase();
  if (
    (g.includes('k-pop') && ['JP', 'ID', 'PH', 'TH', 'VN', 'TW', 'SG', 'MY'].includes(targetRegion)) ||
    (g.includes('latin') || g.includes('reggaeton') ? ['US', 'ES', 'MX', 'CO', 'AR', 'CL', 'PE'].includes(targetRegion) : false) ||
    (g.includes('afrobeats') && ['NG', 'ZA', 'GB', 'FR'].includes(targetRegion))
  ) {
    return 1.55;
  }

  // International resistance based on domestic loyalty of target market
  return Math.max(0.35, 1.0 - targetProfile.domesticLoyalty * 0.45);
}

interface PrecomputedNpcSongCandidate {
  npcId: string;
  npcIdx: number;
  npcName: string;
  npcCountry: string;
  npcGenre: string;
  sIdx: number;
  rawTitle: string;
  youtubeTitle: string;
  formattedArtistCredits: string;
  featuredArtists: string[];
  isExplicit: boolean;
  hasMusicVideo: boolean;
  daysOut: number;
  weeksOnChart: number;
  rawDailyStreams: number;
  rawWeeklyStreams: number;
  rawDailySales: number;
  rawWeeklySales: number;
  rawRadio: number;
  globalDailyViews: number;
  globalWeeklyViews: number;
  audioCover: string;
  videoCover: string;
}

let cachedNpcPoolKey = '';
let cachedNpcPool: PrecomputedNpcSongCandidate[] = [];

function getPrecomputedNpcPoolForDay(
  effectiveDate: Date,
  dayOfYear: number,
  playerName: string
): PrecomputedNpcSongCandidate[] {
  const topNpcLeadTitle = REAL_WORLD_NPCS[0]?.songs?.[0]?.title || '';
  const cacheKey = `${effectiveDate.getUTCFullYear()}_${dayOfYear}_${(playerName || '').toLowerCase()}_${topNpcLeadTitle}`;
  if (cachedNpcPoolKey === cacheKey && cachedNpcPool.length > 0) {
    return cachedNpcPool;
  }

  const pool: PrecomputedNpcSongCandidate[] = [];
  const seenKeys = new Set<string>();

  REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
    if (playerName && isNpcMatchingPlayerName(npc.name, playerName)) {
      return;
    }

    const activeSongs = [...(npc.songs || [])];
    if (npc.albums && npc.albums.length > 0 && npc.albums[0].tracks) {
      for (const albTrk of npc.albums[0].tracks) {
        if (!activeSongs.some(s => s.title.toLowerCase() === albTrk.title.toLowerCase())) {
          activeSongs.push({
            title: albTrk.title,
            streams: albTrk.streams || 0,
            dailyStreams: (albTrk as any).dailyStreams || 0,
            weeklyStreams: (albTrk as any).weeklyStreams || 0,
            sales: (albTrk as any).sales || 0,
            dailySales: (albTrk as any).dailySales || 0,
            radio: (albTrk as any).radio || 0,
            daysSinceRelease: (albTrk as any).daysSinceRelease ?? 0,
            cover: (albTrk as any).cover || npc.albums[0].cover
          });
        }
      }
    }

    const hasRecentDrop = activeSongs.some(s => (s.daysSinceRelease ?? 99) <= 14);
    const npcAttributes = getNpcLivingAttributes(npc.name, dayOfYear, hasRecentDrop);

    activeSongs.forEach((song, sIdx) => {
      const daysOut = song.daysSinceRelease ?? (dayOfYear > 0 ? 1 : 0);
      if (dayOfYear > 0 && daysOut <= 0 && (song.streams || 0) === 0 && (song.dailyStreams || 0) === 0) {
        return;
      }

      const rawTitle = song.title;
      const youtubeTitle = !rawTitle.toLowerCase().includes('music video')
        ? `${rawTitle} (Official Music Video)`
        : rawTitle;

      const dedupeKey = `${npc.name.toLowerCase()}::${rawTitle.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) return;
      seenKeys.add(dedupeKey);

      const fallbackDay0Streams =
        dayOfYear === 0
          ? Math.max(
              15000,
              Math.floor(
                3100000 *
                  Math.pow(Math.max(30, npcAttributes.popularity) / 100, 2.8) *
                  npcAttributes.streamSynergyMultiplier *
                  (sIdx === 0 ? 1.0 : Math.pow(0.72, sIdx))
              )
            )
          : 0;

      const rawDailyStreams =
        song.dailyStreams && song.dailyStreams > 0
          ? song.dailyStreams
          : song.streams && song.streams > 0
          ? Math.max(1000, Math.floor(song.streams / Math.max(1, daysOut)))
          : fallbackDay0Streams;

      const rawWeeklyStreams =
        song.weeklyStreams && song.weeklyStreams > 0
          ? song.weeklyStreams
          : song.streams && song.streams > 0
          ? Math.min(song.streams, rawDailyStreams * Math.min(7, Math.max(1, daysOut)))
          : rawDailyStreams * 7;

      const rawDailySales =
        song.dailySales && song.dailySales > 0
          ? song.dailySales
          : Math.max(5, Math.floor(rawDailyStreams * 0.0018 * npcAttributes.salesSynergyMultiplier));

      const rawWeeklySales =
        song.sales && song.sales > 0
          ? Math.min(song.sales, rawDailySales * Math.min(7, Math.max(1, daysOut)))
          : rawDailySales * 7;

      const rawRadio =
        song.radio && song.radio > 0
          ? song.radio
          : Math.floor(rawDailyStreams * 0.015);

      const npcYoutubeViews = calculateUnifiedYoutubeViewsFromStreams({
        dailyStreams: rawDailyStreams,
        weeklyStreams: rawWeeklyStreams,
        artistCountry: npc.country || 'US',
        artistPopularity: npcAttributes.popularity,
        artistHype: npcAttributes.hype,
        artistFans: npcAttributes.fans,
        visualSkillLevel: npcAttributes.skills.visuals,
        daysSinceRelease: daysOut,
        hasVEVO: true,
        hasAdCampaign: daysOut <= 7 && sIdx === 0 && npcAttributes.popularity >= 75,
        uniqueSeed: npcIdx * 31 + sIdx * 17 + dayOfYear
      });

      const weeksOnChart = Math.max(1, Math.ceil(Math.max(1, daysOut) / 7));
      const audioCover = song.cover || resolveRealWorldCoverArt(npc.name, rawTitle, false);
      const videoCover = getNpcVideoThumbnail(npc.name, rawTitle);
      const meta = resolveSongMetadataAndCollabCredits(song, npc.name);

      pool.push({
        npcId: npc.id,
        npcIdx,
        npcName: npc.name,
        npcCountry: npc.country || 'US',
        npcGenre: npc.genre || 'Pop',
        sIdx,
        rawTitle,
        youtubeTitle,
        formattedArtistCredits: meta.formattedArtistCredits,
        featuredArtists: meta.featuredArtists,
        isExplicit: meta.isExplicit,
        hasMusicVideo: meta.hasMusicVideo,
        daysOut,
        weeksOnChart,
        rawDailyStreams,
        rawWeeklyStreams,
        rawDailySales,
        rawWeeklySales,
        rawRadio,
        globalDailyViews: npcYoutubeViews.dailyViews,
        globalWeeklyViews: npcYoutubeViews.weeklyViews,
        audioCover,
        videoCover
      });
    });
  });

  cachedNpcPoolKey = cacheKey;
  cachedNpcPool = pool;
  return pool;
}

/**
 * Generates any Singles chart (Spotify Daily/Weekly, Billboard Hot 100/Global 200/Regional,
 * iTunes Top Songs, YouTube Trending Videos) 100% from actual NPC releases + Player releases.
 */
export function generateRealNpcSinglesChart(params: RealNpcSinglesChartParams): ChartItem[] {
  const {
    platform,
    region,
    playerSongs,
    playerName,
    playerCountry,
    playerPopularity,
    playerHype,
    isWeekly = false,
    currentDate,
    limit = platform === 'billboard' ? (region === 'global' ? 200 : 100) : 50
  } = params;

  const effectiveDate = currentDate
    ? typeof currentDate === 'string'
      ? new Date(currentDate)
      : currentDate
    : new Date('2026-01-01T00:00:00Z');

  // 1. Ensure NPC release workflow & Player-NPC deduplication are synced to current date
  syncPlayerNameNpcDeduplication(playerName);
  const { dayOfYear } = syncNpcRealisticReleaseWorkflow(effectiveDate);

  const isGlobal = region === 'global';
  const marketFraction = getTerritoryMarketFraction(region);
  const profile = isGlobal ? null : getCountryMarketProfile(region);

  const candidates: ChartItem[] = [];
  const precomputedPool = getPrecomputedNpcPoolForDay(effectiveDate, dayOfYear, playerName);

  let topGlobalNpcScore = 0;
  let topRegionNpcScore = 0;

  // 2. Score precomputed NPC songs for the target platform & territory
  for (let i = 0; i < precomputedPool.length; i++) {
    const item = precomputedPool[i];
    const territorialAffinity = isGlobal
      ? 1.0
      : getNpcTerritorialAffinityMultiplier(item.npcCountry, item.npcGenre, region);
    const territoryScale = isGlobal ? 1.0 : marketFraction * territorialAffinity;

    const territoryDailyStreams = Math.max(100, Math.round(item.rawDailyStreams * territoryScale));
    const territoryWeeklyStreams = Math.max(500, Math.round(item.rawWeeklyStreams * territoryScale));
    const territoryDailySales = Math.max(2, Math.round(item.rawDailySales * territoryScale));
    const territoryWeeklySales = Math.max(10, Math.round(item.rawWeeklySales * territoryScale));
    const territoryRadio = isGlobal ? 0 : Math.max(50, Math.round(item.rawRadio * territoryScale));

    const territoryDailyViews = Math.max(150, Math.round(item.globalDailyViews * territoryScale));
    const territoryWeeklyViews = Math.max(800, Math.round(item.globalWeeklyViews * territoryScale));

    let globalBenchmarkPts = 0;
    let points = 0;
    let stats = {
      streams: territoryWeeklyStreams,
      sales: territoryWeeklySales,
      radio: territoryRadio
    };

    if (platform === 'spotify') {
      globalBenchmarkPts = isWeekly ? item.rawWeeklyStreams : item.rawDailyStreams;
      points = isWeekly ? territoryWeeklyStreams : territoryDailyStreams;
      stats = {
        streams: points,
        sales: isWeekly ? territoryWeeklySales : territoryDailySales,
        radio: territoryRadio
      };
    } else if (platform === 'youtube') {
      globalBenchmarkPts = item.globalDailyViews;
      points = territoryDailyViews;
      stats = {
        streams: territoryDailyViews,
        sales: territoryDailySales,
        radio: territoryRadio
      };
    } else if (platform === 'itunes') {
      globalBenchmarkPts = item.rawDailySales;
      points = territoryDailySales;
      stats = {
        streams: territoryDailyStreams,
        sales: territoryDailySales,
        radio: territoryRadio
      };
    } else {
      globalBenchmarkPts = calculateAuthenticBillboardPoints({
        weeklyAudioStreams: item.rawWeeklyStreams,
        weeklyVideoViews: item.globalWeeklyViews,
        weeklyPureSales: item.rawWeeklySales,
        weeklyRadioPlays: 0,
        isGlobal: true
      });
      points = calculateAuthenticBillboardPoints({
        weeklyAudioStreams: territoryWeeklyStreams,
        weeklyVideoViews: territoryWeeklyViews,
        weeklyPureSales: territoryWeeklySales,
        weeklyRadioPlays: territoryRadio,
        isGlobal
      });
      stats = {
        streams: territoryWeeklyStreams,
        sales: territoryWeeklySales,
        radio: territoryRadio
      };
    }

    if (points <= 0) continue;

    const rankWave = getDailyCompetitiveRankWave(
      item.npcName,
      item.rawTitle,
      effectiveDate,
      platform,
      region
    );
    points = Math.max(1, Math.round(points * rankWave));

    if (globalBenchmarkPts > topGlobalNpcScore) {
      topGlobalNpcScore = globalBenchmarkPts;
    }
    if (points > topRegionNpcScore) {
      topRegionNpcScore = points;
    }

    candidates.push({
      id: `npc_single_${region}_${item.npcId}_${item.sIdx}`,
      title: platform === 'youtube' ? item.youtubeTitle : item.rawTitle,
      artist: item.formattedArtistCredits,
      primaryArtist: item.npcName,
      featuredArtists: item.featuredArtists,
      isExplicit: item.isExplicit,
      hasMV: item.hasMusicVideo,
      daysSinceRelease: item.daysOut,
      isPlayer: false,
      cover: platform === 'youtube' ? item.videoCover : item.audioCover,
      points,
      score: points,
      streams: stats.streams,
      sales: stats.sales,
      radio: stats.radio,
      weeksOnChart: item.weeksOnChart,
      weeks: item.weeksOnChart,
      lastPosition: null,
      peakPosition: 1,
      stats
    } as any);
  }

  // 3. Evaluate Player's Released Songs using the exact same metric rules
  playerSongs
    .filter(s => s.status === 'released')
    .forEach(s => {
      if (platform === 'youtube' && !s.hasMV) return;

      let rawPts = 0;
      let stats = {
        streams: s.weeklyStreams || s.dailyStreams || 0,
        sales: s.weeklyPureSales || s.dailyPureSales || 0,
        radio: s.weeklyRadioPlays || s.dailyRadioPlays || 0
      };

      if (isGlobal) {
        if (platform === 'billboard') {
          const weeklySales =
            s.weeklyPureSales && s.weeklyPureSales > 0
              ? s.weeklyPureSales
              : (s.dailyPureSales || 0) * 7;
          const weeklyStreams =
            s.weeklyStreams && s.weeklyStreams > 0
              ? s.weeklyStreams
              : (s.dailyStreams || 0) * 7;
          const weeklyRadio =
            s.weeklyRadioPlays && s.weeklyRadioPlays > 0
              ? s.weeklyRadioPlays
              : (s.dailyRadioPlays || 0) * 7;
          const weeklyVideo = s.hasMV
            ? s.weeklyViews && s.weeklyViews > 0
              ? s.weeklyViews
              : (s.dailyViews || 0) * 7
            : 0;
          rawPts = calculateAuthenticBillboardPoints({
            weeklyAudioStreams: weeklyStreams,
            weeklyVideoViews: weeklyVideo,
            weeklyPureSales: weeklySales,
            weeklyRadioPlays: weeklyRadio,
            isGlobal: true
          });
          stats = { streams: weeklyStreams, sales: weeklySales, radio: 0 };
        } else if (platform === 'spotify') {
          rawPts = isWeekly
            ? s.weeklyStreams && s.weeklyStreams > 0
              ? s.weeklyStreams
              : (s.dailyStreams || 0) * 7
            : s.dailyStreams || 0;
          stats = {
            streams: rawPts,
            sales: isWeekly ? s.weeklyPureSales || 0 : s.dailyPureSales || 0,
            radio: s.dailyRadioPlays || 0
          };
        } else if (platform === 'youtube') {
          rawPts = s.dailyViews || 0;
          stats = {
            streams: rawPts,
            sales: s.dailyPureSales || 0,
            radio: 0
          };
        } else if (platform === 'itunes') {
          rawPts = s.dailyPureSales || 0;
          stats = {
            streams: s.dailyStreams || 0,
            sales: rawPts,
            radio: 0
          };
        }
      } else {
        const calibratedTerritory = calculateCalibratedPlayerTerritoryMetrics({
          song: s,
          platform,
          region,
          playerCountry,
          playerPopularity,
          playerHype,
          isWeekly: Boolean(isWeekly),
          topGlobalNpcScore,
          topRegionNpcScore
        });

        rawPts = calibratedTerritory.points;
        stats = {
          streams: platform === 'youtube' ? calibratedTerritory.views : calibratedTerritory.streams,
          sales: calibratedTerritory.sales,
          radio: calibratedTerritory.radio
        };
      }

      const finalPlayerPts = Math.round(rawPts);
      if (finalPlayerPts > 0) {
        const weeksOut = Math.max(1, Math.ceil(Math.max(1, s.daysSinceRelease || 1) / 7));
        const meta = resolveSongMetadataAndCollabCredits(s, playerName || 'Player Artist');
        candidates.push({
          id: `player_single_${region}_${s.id}`,
          title: s.title,
          artist: meta.formattedArtistCredits,
          primaryArtist: playerName || 'Player Artist',
          featuredArtists: meta.featuredArtists,
          collabId: s.collabId,
          hasMV: s.hasMV,
          genre: s.genre,
          isExplicit: meta.isExplicit,
          daysSinceRelease: s.daysSinceRelease || 1,
          isPlayer: true,
          cover:
            platform === 'youtube'
              ? s.mvThumbnail || s.cover
              : s.cover || resolveRealWorldCoverArt(playerName, s.title, false),
          points: finalPlayerPts,
          score: finalPlayerPts,
          streams: stats.streams,
          sales: stats.sales,
          radio: stats.radio,
          weeksOnChart: weeksOut,
          weeks: weeksOut,
          lastPosition: null,
          peakPosition: 1,
          stats
        } as any);
      }
    });

  // 4. Sort strictly descending by real points and take top `limit`
  candidates.sort((a, b) => b.points - a.points);

  const sliced = candidates.slice(0, limit).map((item, idx) => {
    const rank = idx + 1;
    return {
      ...item,
      peak: Math.min(item.peak || rank, rank),
      peakPosition: Math.min(item.peakPosition || rank, rank)
    };
  });

  return synchronizeAndEnrichChartMovements(
    sliced,
    null,
    `${platform}_${isWeekly ? 'weekly' : 'daily'}_${region}`,
    Boolean(isWeekly || platform === 'billboard'),
    effectiveDate
  );
}

/**
 * Generates any Albums chart (Billboard 200 Albums & iTunes Top Albums)
 * 100% from actual released NPC albums (`npc.albums`) + Player's released projects.
 */
export function generateRealNpcAlbumsChart(params: RealNpcAlbumsChartParams): ChartItem[] {
  const {
    platform,
    region,
    playerProjects,
    playerSongs,
    playerName,
    playerCountry,
    currentDate,
    limit = platform === 'billboard' ? 200 : 50
  } = params;

  const effectiveDate = currentDate
    ? typeof currentDate === 'string'
      ? new Date(currentDate)
      : currentDate
    : new Date('2026-01-01T00:00:00Z');

  syncPlayerNameNpcDeduplication(playerName);
  const { dayOfYear } = syncNpcRealisticReleaseWorkflow(effectiveDate);

  const isGlobal = region === 'global';
  const marketFraction = getTerritoryMarketFraction(region);

  const albums: ChartItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Add Player's released projects
  playerProjects
    .filter(p => p.status === 'released')
    .forEach(p => {
      const projSongs = playerSongs.filter(
        s => p.songs && p.songs.some(ps => ps.id === s.id)
      );
      const projWeeklyStreams = projSongs.reduce(
        (acc, s) => acc + (s.weeklyStreams || (s.dailyStreams || 0) * 7),
        0
      );
      const trackEquivAlbumsDaily = Math.round(
        projSongs.reduce((acc, s) => acc + (s.dailyPureSales || 0), 0) / 10
      );
      const projDailySales = (p.dailyPureSales || 0) + Math.min(4500, trackEquivAlbumsDaily);
      const projWeeklySales =
        (p.weeklyPureSales && p.weeklyPureSales > 0)
          ? p.weeklyPureSales
          : projDailySales * 7;

      const seaUnits = Math.round(projWeeklyStreams / 1500);
      const totalWeeklyUnits = Math.max(0, seaUnits + Math.round(projWeeklySales));

      let points =
        platform === 'billboard' ? totalWeeklyUnits : Math.round(projDailySales);

      if (!isGlobal) {
        const isHome = playerCountry === region;
        const homeAffinity = isHome ? getPlayerHomeMarketAffinityMultiplier(playerCountry) : 1.05;
        const share = Math.min(0.76, marketFraction * homeAffinity);
        points = Math.round(points * share);
      }

      if (points > 0) {
        albums.push({
          id: `player_album_${region}_${p.id}`,
          title: p.title,
          artist: playerName || 'Player Artist',
          isPlayer: true,
          cover: p.cover,
          points,
          score: points,
          streams: projWeeklyStreams,
          sales: platform === 'billboard' ? Math.round(projWeeklySales) : points,
          radio: 0,
          lastPosition: null,
          peakPosition: 1,
          weeksOnChart: 1,
          stats: {
            streams: projWeeklyStreams,
            sales: Math.round(projWeeklySales),
            radio: 0
          }
        });
      }
    });

  // 2. Add all released NPC albums directly from REAL_WORLD_NPCS (`npc.albums`)
  REAL_WORLD_NPCS.forEach(npc => {
    if (playerName && isNpcMatchingPlayerName(npc.name, playerName)) {
      return;
    }

    const affinity = getNpcTerritorialAffinityMultiplier(npc.country, npc.genre, region);
    const scale = isGlobal ? 1.0 : Math.min(0.68, marketFraction * affinity);

    (npc.albums || []).forEach((alb, aIdx) => {
      const key = `${npc.name.toLowerCase()}::${alb.title.toLowerCase()}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const daysOut = alb.daysSinceRelease ?? (dayOfYear > 0 ? 1 : 0);
      const trackTotalStreams = (alb.tracks || []).reduce(
        (sum, t) => sum + (t.streams || 0),
        0
      );
      const trackWeeklyStreams = (alb.tracks || []).reduce(
        (sum, t) => sum + ((t as any).weeklyStreams || 0),
        0
      );

      // On Day 0 (initial load before Day 1 tick), compute opening album rate so Billboard 200 / iTunes Albums is ordered
      const fallbackDay0WeeklyStreams =
        dayOfYear === 0
          ? Math.max(
              450000,
              Math.floor(
                85000000 *
                  Math.pow(Math.max(30, npc.pop) / 100, 2.8) *
                  Math.pow(0.75, aIdx)
              )
            )
          : 0;

      const effectiveWeeklyStreams =
        trackWeeklyStreams > 0
          ? trackWeeklyStreams
          : trackTotalStreams > 0
          ? trackTotalStreams
          : fallbackDay0WeeklyStreams;

      const effectiveDailySales =
        (alb as any).dailySales && (alb as any).dailySales > 0
          ? (alb as any).dailySales
          : Math.max(
              35,
              Math.floor(
                Math.pow(Math.max(1000, effectiveWeeklyStreams / 7), 0.74) *
                  (daysOut <= 2 ? 0.36 : 0.22)
              )
            );

      const effectiveWeeklySales =
        (alb as any).weeklySales && (alb as any).weeklySales > 0
          ? (alb as any).weeklySales
          : effectiveDailySales * Math.min(7, Math.max(1, daysOut || 7));

      const seaUnits = Math.round(effectiveWeeklyStreams / 1500);
      const weeklyTotalUnits = Math.max(100, seaUnits + effectiveWeeklySales);

      const albumWave = getDailyCompetitiveRankWave(
        npc.name,
        alb.title,
        effectiveDate,
        `${platform}_albums`,
        region
      );
      const rawPoints =
        platform === 'billboard'
          ? Math.max(50, Math.round(weeklyTotalUnits * scale))
          : Math.max(10, Math.round(effectiveDailySales * scale));
      const points = Math.max(10, Math.round(rawPoints * albumWave));

      const weeksOnChart = Math.max(1, Math.ceil(Math.max(1, daysOut) / 7));
      const cover = alb.cover || resolveRealWorldCoverArt(npc.name, alb.title, true);

      albums.push({
        id: `npc_album_${region}_${npc.id}_${aIdx}`,
        title: alb.title,
        artist: npc.name,
        daysSinceRelease: daysOut,
        isPlayer: false,
        cover,
        points,
        score: points,
        streams: Math.round(effectiveWeeklyStreams * scale),
        sales: Math.round(effectiveWeeklySales * scale),
        radio: 0,
        lastPosition: null,
        peakPosition: 1,
        weeksOnChart,
        weeks: weeksOnChart,
        stats: {
          streams: Math.round(effectiveWeeklyStreams * scale),
          sales: Math.round(effectiveWeeklySales * scale),
          radio: 0
        }
      } as any);
    });
  });

  albums.sort((a, b) => b.points - a.points);

  const slicedAlbums = albums.slice(0, limit).map((item, idx) => {
    const rank = idx + 1;
    return {
      ...item,
      peak: Math.min(item.peak || rank, rank),
      peakPosition: Math.min(item.peakPosition || rank, rank)
    };
  });

  return synchronizeAndEnrichChartMovements(
    slicedAlbums,
    null,
    `${platform}_albums_${region}`,
    platform === 'billboard',
    effectiveDate
  );
}
