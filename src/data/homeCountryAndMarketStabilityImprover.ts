// Home Country Support & Post-Debut Market Stability Improver
// 1. Strong Hometown Pride & Guaranteed Domestic Chart Sync (Spotify, iTunes, YouTube, Billboard)
// 2. Smooth First-Week Hold & Multi-Week iTunes Digital Pure Sales Longevity
// 3. Realistic Post-Debut Hold for Daily Spotify Streams & YouTube Views (Soft Day 2 Dip, Stable Weeks 1-4)

import { Song } from '../types';
import { getCountryMarketProfile } from './countryMarketSystem';
import { calculateAuthenticBillboardPoints } from './billboardFormulaEngine';

export interface StabilizedStreamsAndViewsInput {
  song: Song;
  daysSinceRelease: number;
  computedDailyStreams: number;
  computedDailyViews: number;
  artistPopularity: number;
  artistHype: number;
  isSingle: boolean;
  weekendLift: number;
  organicVariance: number;
}

export interface StabilizedStreamsAndViewsResult {
  stabilizedDailyStreams: number;
  stabilizedDailyViews: number;
}

export interface StabilizedPureSalesInput {
  song: Song;
  daysSinceRelease: number;
  stabilizedDailyStreams: number;
  computedDailySales: number;
  artistPopularity: number;
  artistHype: number;
  playerFans: number;
  isSingle: boolean;
  organicVariance: number;
}

export interface CalibratedPlayerTerritoryInput {
  song: Song;
  platform: 'spotify' | 'billboard' | 'itunes' | 'youtube';
  region: string;
  playerCountry: string;
  playerPopularity: number;
  playerHype: number;
  isWeekly: boolean;
  topGlobalNpcScore: number;
  topRegionNpcScore: number;
}

export interface CalibratedPlayerTerritoryResult {
  points: number;
  streams: number;
  sales: number;
  radio: number;
  views: number;
}

/**
 * Returns the home-country affinity multiplier for the player's home market,
 * matching and slightly exceeding the local NPC territorial affinity so the player's
 * home country always rallies strongly behind hometown releases.
 */
export function getPlayerHomeMarketAffinityMultiplier(
  countryCode: string,
  hitScope?: 'local_gem' | 'domestic_sensation' | 'regional_hit' | 'global_crossover'
): number {
  const cc = (countryCode || 'US').toUpperCase();

  // Base domestic affinity calibrated to match/exceed local NPC affinity (4.2x in ID/KR/JP/NG/BR, 2.8x regional, 1.35x US/GB)
  let baseHomeAffinity = 3.4;
  if (['ID', 'KR', 'JP', 'NG', 'BR', 'PH', 'MX', 'IN', 'TH', 'VN', 'TR', 'AR', 'CO', 'PL'].includes(cc)) {
    baseHomeAffinity = 4.65;
  } else if (['US', 'GB'].includes(cc)) {
    baseHomeAffinity = 1.65;
  } else if (['CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'].includes(cc)) {
    baseHomeAffinity = 3.1;
  }

  if (hitScope === 'local_gem' || hitScope === 'domestic_sensation') {
    return baseHomeAffinity * 1.45;
  }
  if (hitScope === 'regional_hit') {
    return baseHomeAffinity * 1.2;
  }
  return baseHomeAffinity;
}

/**
 * 1. Stabilizes Daily Spotify Streams & YouTube Views from Day 2 onward:
 *    - Soft Day 2 dip (-9% to -16% instead of -40% stacked decay; viral/acclaimed songs can even hold 92%-103%)
 *    - Smooth Week 1 hold (Days 3-7)
 *    - Stable Weeks 2-4 run (compensates for stacked decay across multiple engines)
 */
export function calculateStabilizedStreamsAndViewsHold(
  input: StabilizedStreamsAndViewsInput
): StabilizedStreamsAndViewsResult {
  const {
    song,
    daysSinceRelease,
    computedDailyStreams,
    computedDailyViews,
    artistPopularity,
    artistHype,
    isSingle,
    weekendLift,
    organicVariance
  } = input;

  const quality = Math.max(40, Math.min(100, song.quality || 70));
  const qualityNorm = (quality - 40) / 60; // 0.0 to 1.0
  const popNorm = Math.max(0, Math.min(1, artistPopularity / 100));
  const hypeNorm = Math.max(0, Math.min(1, artistHype / 100));
  const playlistCount = Array.isArray(song.playlistPlacements)
    ? song.playlistPlacements.length
    : 0;
  const playlistStabilityBonus = Math.min(0.06, playlistCount * 0.012);

  const prevStreams = song.dailyStreams || 0;
  const prevViews = song.dailyViews || 0;

  let stabilizedStreams = computedDailyStreams;
  let stabilizedViews = computedDailyViews;

  // Apply multi-engine stack compensation for Days 2-28 (daysSinceRelease 1..28)
  if (daysSinceRelease >= 1 && daysSinceRelease <= 28) {
    // Compensate for simultaneous decay from debutCurve * lifecycleCurve * chemistryCurve * momentum
    const stackCompensation =
      daysSinceRelease === 1
        ? 1.24 + qualityNorm * 0.14
        : daysSinceRelease <= 6
        ? 1.28 + qualityNorm * 0.18 + playlistStabilityBonus
        : daysSinceRelease <= 14
        ? 1.26 + qualityNorm * 0.20 + playlistStabilityBonus
        : 1.20 + qualityNorm * 0.18 + playlistStabilityBonus;

    stabilizedStreams = Math.round(computedDailyStreams * stackCompensation);
    if (song.hasMV && computedDailyViews > 0) {
      stabilizedViews = Math.round(computedDailyViews * (stackCompensation * 0.96));
    }
  }

  // Day-over-day envelope protection so streams & views hold realistically from Day 2 through Week 4
  if (prevStreams > 0 && daysSinceRelease >= 1) {
    let minStreamRetention: number;
    let maxStreamGrowth: number;

    if (daysSinceRelease === 1) {
      // Day 2 Settle: soft, realistic hold (84% to 92% of Day 1 Debut, or up to 104% if viral/high playlist pickup)
      minStreamRetention = (isSingle ? 0.84 : 0.80) + qualityNorm * 0.06 + playlistStabilityBonus * 0.5;
      maxStreamGrowth = 1.06;
    } else if (daysSinceRelease <= 6) {
      // Days 3-7 (Rest of Week 1): very stable daily hold (93.5% to 98.5% per day, boosted on weekends)
      const weekendFactor = weekendLift >= 1.02 ? 1.03 : 1.0;
      minStreamRetention =
        (0.935 + qualityNorm * 0.035 + popNorm * 0.015 + playlistStabilityBonus * 0.4) *
        weekendFactor *
        organicVariance;
      maxStreamGrowth = 1.12;
    } else if (daysSinceRelease <= 28) {
      // Weeks 2-4: smooth multi-week chart run (95.5% to 99.0% daily retention)
      const weekendFactor = weekendLift >= 1.02 ? 1.025 : 1.0;
      minStreamRetention =
        (0.952 + qualityNorm * 0.028 + popNorm * 0.01 + playlistStabilityBonus * 0.35) *
        weekendFactor *
        organicVariance;
      maxStreamGrowth = 1.09;
    } else {
      // Catalog hold (Day 29+)
      minStreamRetention = 0.945 * organicVariance;
      maxStreamGrowth = 1.08;
    }

    const floorStreams = Math.round(prevStreams * Math.min(0.99, minStreamRetention));
    const ceilStreams = Math.round(prevStreams * maxStreamGrowth);
    stabilizedStreams = Math.max(floorStreams, Math.min(Math.max(stabilizedStreams, floorStreams), Math.max(ceilStreams, stabilizedStreams)));
  }

  // Stabilize YouTube daily MV views with the same realistic Day 2 & Week 1-4 hold
  if (song.hasMV && prevViews > 0 && daysSinceRelease >= 1) {
    let minViewRetention: number;
    if (daysSinceRelease === 1) {
      // Soft Day 2 MV settle (82% to 90% of Day 1 premiere views)
      minViewRetention = 0.82 + qualityNorm * 0.06 + hypeNorm * 0.03;
    } else if (daysSinceRelease <= 6) {
      // Week 1 MV hold
      minViewRetention = (0.93 + qualityNorm * 0.035) * organicVariance;
    } else if (daysSinceRelease <= 28) {
      // Weeks 2-4 MV hold
      minViewRetention = (0.948 + qualityNorm * 0.028) * organicVariance;
    } else {
      minViewRetention = 0.94 * organicVariance;
    }

    const floorViews = Math.round(prevViews * Math.min(0.985, minViewRetention));
    stabilizedViews = Math.max(floorViews, stabilizedViews);
  }

  return {
    stabilizedDailyStreams: Math.max(0, stabilizedStreams),
    stabilizedDailyViews: Math.max(0, stabilizedViews)
  };
}

/**
 * 2. Stabilizes Daily Pure Digital Sales (iTunes Longevity):
 *    - Eliminates the Day 2 & Day 3+ pure sales cliff caused by stream pool compression and double-taper
 *    - Aligns player stream-to-sales conversion with the NPC iTunes baseline (~0.18% of daily streams)
 *    - Provides a smooth Week 1 hold and multi-week iTunes chart longevity
 */
export function calculateStabilizedDailyPureSales(
  input: StabilizedPureSalesInput
): number {
  const {
    song,
    daysSinceRelease,
    stabilizedDailyStreams,
    computedDailySales,
    artistPopularity,
    artistHype,
    playerFans,
    isSingle,
    organicVariance
  } = input;

  const quality = Math.max(40, Math.min(100, song.quality || 70));
  const qualityNorm = (quality - 40) / 60; // 0.0 to 1.0
  const hypeNorm = Math.max(0, Math.min(1, artistHype / 100));
  const popNorm = Math.max(0, Math.min(1, artistPopularity / 100));

  // NPCs use `rawDailyStreams * 0.0018 * salesSynergyMultiplier` (~0.0018 to 0.0024).
  // We calibrate the player's conversion rate on the exact same iTunes market scale so player singles
  // compete fairly and hold on iTunes Global & Regional charts across Week 1 and Weeks 2-6.
  let targetConversionRate: number;
  if (daysSinceRelease === 0) {
    // Day 1 Debut: strong fan buying surge
    targetConversionRate = 0.00215 + hypeNorm * 0.00055 + qualityNorm * 0.00035;
  } else if (daysSinceRelease === 1) {
    // Day 2 Hold: smooth 86%-90% retention of conversion rate (no Day 2 cliff!)
    targetConversionRate = 0.00192 + hypeNorm * 0.00045 + qualityNorm * 0.00032;
  } else if (daysSinceRelease <= 6) {
    // Days 3-7 (Week 1 Hold): strong first-week iTunes stability
    const dayOffset = daysSinceRelease - 2; // 0..4
    const gentleTaper = 1 - dayOffset * 0.025; // 1.0 -> 0.90 across Days 3-7
    targetConversionRate = (0.00182 + hypeNorm * 0.00038 + qualityNorm * 0.00030) * gentleTaper;
  } else if (daysSinceRelease <= 28) {
    // Weeks 2-4: Multi-week iTunes longevity
    const weeksOut = (daysSinceRelease - 7) / 21; // 0.0 to 1.0
    const multiWeekHold = 0.92 - weeksOut * 0.20; // 0.92 -> 0.72 across Weeks 2-4
    targetConversionRate = (0.00172 + popNorm * 0.00028 + qualityNorm * 0.00028) * multiWeekHold;
  } else if (daysSinceRelease <= 60) {
    // Weeks 5-8: Extended catalog iTunes presence for hits
    targetConversionRate = (0.00135 + qualityNorm * 0.00025) * Math.max(0.55, song.momentum || 0.65);
  } else {
    targetConversionRate = 0.00105 + qualityNorm * 0.00020;
  }

  if (!isSingle) {
    // Album cuts / B-sides have lower standalone track downloads than official singles
    targetConversionRate *= 0.42;
  }

  // Dedicated core fanbase purchase support during Week 1
  const fanSupportBonus =
    isSingle && daysSinceRelease <= 6
      ? Math.round(
          Math.min(1800, Math.pow(Math.max(0, playerFans), 0.54) * 0.14) *
            (daysSinceRelease === 0 ? 1.0 : daysSinceRelease === 1 ? 0.85 : 0.72)
        )
      : 0;

  const calibratedStreamSales = Math.round(
    stabilizedDailyStreams * targetConversionRate * organicVariance + fanSupportBonus
  );

  let finalSales = Math.max(computedDailySales, calibratedStreamSales);

  // Enforce smooth day-over-day pure sales retention during Week 1 & Weeks 2-4
  const prevSales = song.dailyPureSales || 0;
  if (prevSales > 0 && daysSinceRelease >= 1) {
    let minSalesRetention: number;
    if (daysSinceRelease === 1) {
      // Day 2 iTunes hold: at least 84%-89% of Day 1 sales
      minSalesRetention = 0.84 + qualityNorm * 0.05;
    } else if (daysSinceRelease <= 6) {
      // Days 3-7 iTunes hold: at least 92%-96% day-over-day retention across Week 1
      minSalesRetention = (0.925 + qualityNorm * 0.035) * organicVariance;
    } else if (daysSinceRelease <= 28) {
      // Weeks 2-4 iTunes hold: at least 94%-97% day-over-day retention
      minSalesRetention = (0.94 + qualityNorm * 0.03) * organicVariance;
    } else {
      minSalesRetention = 0.92 * organicVariance;
    }

    const salesFloor = Math.round(prevSales * Math.min(0.98, minSalesRetention));
    finalSales = Math.max(finalSales, salesFloor);
  }

  return Math.max(0, finalSales);
}

/**
 * 3. Calibrates Player Territory Metrics & Guarantees Home Country Chart Sync:
 *    - Places Player regional metrics on the exact same `marketSizeWeight / 320` baseline as NPCs
 *    - Applies Strong Hometown Pride in `playerCountry`
 *    - Guarantees that if a player song is charting high on Global (e.g. #1 Global), its Home Country
 *      performance is synchronized so the player never debuts #1 Global while missing or lagging in their Home Country.
 */
export function calculateCalibratedPlayerTerritoryMetrics(
  input: CalibratedPlayerTerritoryInput
): CalibratedPlayerTerritoryResult {
  const {
    song,
    platform,
    region,
    playerCountry,
    playerPopularity,
    playerHype,
    isWeekly,
    topGlobalNpcScore,
    topRegionNpcScore
  } = input;

  const targetRegion = (region || 'US').toUpperCase();
  const homeCountry = (playerCountry || 'US').toUpperCase();
  const isHomeMarket = targetRegion === homeCountry;

  const targetProfile = getCountryMarketProfile(targetRegion);
  const homeProfile = getCountryMarketProfile(homeCountry);
  const isSameRegionGroup = targetProfile.regionGroup === homeProfile.regionGroup;

  // Same base market fraction formula used by NPCs in npcRealReleaseChartsEngine.ts (`marketSizeWeight / 320`)
  const npcCompatibleMarketFraction = Math.max(0.008, targetProfile.marketSizeWeight / 320);

  // Determine territorial affinity multiplier on the same scale as NPCs, with Strong Hometown Pride for Home Market
  let affinityMultiplier: number;
  if (isHomeMarket) {
    affinityMultiplier = getPlayerHomeMarketAffinityMultiplier(homeCountry);
    // Early/mid-career artists have even stronger relative concentration in their home country
    if (playerPopularity < 55) {
      affinityMultiplier *= 1.18;
    }
  } else if (isSameRegionGroup) {
    affinityMultiplier = 1.48;
  } else {
    const popCrossover = Math.max(0.55, Math.min(1.15, (playerPopularity + playerHype * 0.35) / 85));
    affinityMultiplier = Math.max(0.42, (1.0 - targetProfile.domesticLoyalty * 0.38) * popCrossover);
  }

  const effectiveTerritoryScale = npcCompatibleMarketFraction * affinityMultiplier;

  // Global metrics for the song
  const globalDailyStreams = song.dailyStreams || 0;
  const globalWeeklyStreams =
    song.weeklyStreams && song.weeklyStreams > 0 ? song.weeklyStreams : globalDailyStreams * 7;

  const globalDailySales = song.dailyPureSales || 0;
  const globalWeeklySales =
    song.weeklyPureSales && song.weeklyPureSales > 0 ? song.weeklyPureSales : globalDailySales * 7;

  const globalDailyRadio = song.dailyRadioPlays || 0;
  const globalWeeklyRadio =
    song.weeklyRadioPlays && song.weeklyRadioPlays > 0 ? song.weeklyRadioPlays : globalDailyRadio * 7;

  const globalDailyViews = song.hasMV ? song.dailyViews || 0 : 0;
  const globalWeeklyViews = song.hasMV
    ? song.weeklyViews && song.weeklyViews > 0
      ? song.weeklyViews
      : globalDailyViews * 7
    : 0;

  // Cultural platform propensity adjustments (subtle and bounded so no country gets penalized unfairly)
  const streamCultureBoost = isHomeMarket
    ? Math.max(1.0, targetProfile.streamingShare / 0.58)
    : Math.max(0.82, targetProfile.streamingShare / 0.60);
  const viewCultureBoost = isHomeMarket
    ? Math.max(1.05, targetProfile.youtubeShare / 0.28)
    : Math.max(0.85, targetProfile.youtubeShare / 0.30);
  const salesCultureBoost = isHomeMarket
    ? Math.max(1.05, Math.min(1.85, targetProfile.salesShare / 0.048))
    : Math.max(0.85, Math.min(1.8, targetProfile.salesShare / 0.05));
  const radioCultureBoost = isHomeMarket
    ? Math.max(1.05, targetProfile.radioShare / 0.038)
    : Math.max(0.85, targetProfile.radioShare / 0.04);

  let territoryStreams = Math.round(
    (isWeekly ? globalWeeklyStreams : globalDailyStreams) *
      effectiveTerritoryScale *
      streamCultureBoost
  );
  let territoryWeeklyStreams = Math.round(
    globalWeeklyStreams * effectiveTerritoryScale * streamCultureBoost
  );
  let territorySales = Math.round(
    (isWeekly || platform === 'billboard' ? globalWeeklySales : globalDailySales) *
      effectiveTerritoryScale *
      salesCultureBoost
  );
  let territoryRadio = Math.round(
    (isWeekly || platform === 'billboard' ? globalWeeklyRadio : globalDailyRadio) *
      effectiveTerritoryScale *
      radioCultureBoost
  );
  let territoryViews = Math.round(
    (isWeekly || platform === 'billboard' ? globalWeeklyViews : globalDailyViews) *
      effectiveTerritoryScale *
      viewCultureBoost
  );

  // Calculate player's Global score on this platform to check Global-to-Home Chart Sync
  let playerGlobalScore = 0;
  if (platform === 'spotify') {
    playerGlobalScore = isWeekly ? globalWeeklyStreams : globalDailyStreams;
  } else if (platform === 'youtube') {
    playerGlobalScore = globalDailyViews;
  } else if (platform === 'itunes') {
    playerGlobalScore = globalDailySales;
  } else if (platform === 'billboard') {
    playerGlobalScore = calculateAuthenticBillboardPoints({
      weeklyAudioStreams: globalWeeklyStreams,
      weeklyVideoViews: globalWeeklyViews,
      weeklyPureSales: globalWeeklySales,
      weeklyRadioPlays: globalWeeklyRadio,
      isGlobal: true
    });
  }

  let points = 0;
  if (platform === 'spotify') {
    points = territoryStreams;
  } else if (platform === 'youtube') {
    points = territoryViews;
  } else if (platform === 'itunes') {
    points = Math.min(Math.max(1, Math.round(globalDailySales * 0.78)), territorySales);
    territorySales = points;
  } else {
    points = calculateAuthenticBillboardPoints({
      weeklyAudioStreams: territoryWeeklyStreams,
      weeklyVideoViews: territoryViews,
      weeklyPureSales: territorySales,
      weeklyRadioPlays: territoryRadio,
      isGlobal: false
    });
  }

  // HOME COUNTRY CHART SYNC GUARANTEE:
  // If this is the player's Home Country (`isHomeMarket`), the player has a natural hometown advantage:
  // a song's relative standing vs. the #1 song in the player's Home Country must ALWAYS be at least
  // 1.15x stronger than its relative standing vs. the #1 song on the Global chart!
  // This guarantees that if the player is #1 on Global (ratio >= 1.0), they are comfortably #1 in their
  // Home Country too, and even if they are #15 Global, they are a major Top 5-10 contender at home.
  if (isHomeMarket && topGlobalNpcScore > 0 && topRegionNpcScore > 0 && playerGlobalScore > 0) {
    const globalRelativeRatio = playerGlobalScore / topGlobalNpcScore;
    // Hometown pride boost: stronger relative chart standing at home than globally
    const homePrideRatioMultiplier = playerPopularity < 60 ? 1.28 : 1.16;
    const syncedHomeRatio = globalRelativeRatio * homePrideRatioMultiplier;
    const syncedHomeFloorPoints = Math.round(topRegionNpcScore * syncedHomeRatio);

    // Cap so territory streams/sales never exceed global totals
    const maxAllowedByGlobal =
      platform === 'billboard'
        ? Math.max(points, Math.round(playerGlobalScore * 0.85))
        : Math.max(points, Math.round(playerGlobalScore * 0.72));

    const targetSyncedPoints = Math.min(maxAllowedByGlobal, syncedHomeFloorPoints);

    if (targetSyncedPoints > points && points > 0) {
      const boostRatio = targetSyncedPoints / points;
      points = targetSyncedPoints;
      territoryStreams = Math.min(
        isWeekly ? globalWeeklyStreams : globalDailyStreams,
        Math.round(territoryStreams * boostRatio)
      );
      territoryWeeklyStreams = Math.min(
        globalWeeklyStreams,
        Math.round(territoryWeeklyStreams * boostRatio)
      );
      territorySales = Math.min(
        isWeekly || platform === 'billboard' ? globalWeeklySales : globalDailySales,
        Math.round(territorySales * boostRatio)
      );
      territoryViews = Math.min(
        isWeekly || platform === 'billboard' ? globalWeeklyViews : globalDailyViews,
        Math.round(territoryViews * boostRatio)
      );
    }
  }

  return {
    points: Math.max(0, Math.round(points)),
    streams: Math.max(0, territoryStreams),
    sales: Math.max(0, territorySales),
    radio: Math.max(0, territoryRadio),
    views: Math.max(0, territoryViews)
  };
}
