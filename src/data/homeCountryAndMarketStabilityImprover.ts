// Home Country Support & Post-Debut Market Stability Improver
// 1. Strong Hometown Pride & Guaranteed Domestic Chart Sync (Spotify, iTunes, YouTube, Billboard)
// 2. Smooth First-Week Hold & Multi-Week iTunes Digital Pure Sales Longevity
// 3. Realistic Post-Debut Hold for Daily Spotify Streams & YouTube Views (Soft Day 2 Dip, Stable Weeks 1-4)

import { Song } from '../types';
import { getCountryMarketProfile } from './countryMarketSystem';
import { calculateAuthenticBillboardPoints } from './billboardFormulaEngine';
import { evaluateSongRegionalBreakoutProfile } from './selectiveRegionalBreakoutEngine';
import { evaluateSongPublicChemistry, PublicChemistryTier } from './publicChemistryLongevityEngine';

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
 * Computes a realistic, role-aware and chemistry-aware daily stream ceiling for a track
 * so album B-sides and standard singles never artificially inflate to 16M+ daily streams,
 * while genuine rare mega-hits from top stars can still reach blockbuster peaks.
 */
export function getTrackRealisticStreamCeiling(params: {
  artistPopularity: number;
  artistHype: number;
  quality: number;
  isSingle: boolean;
  chemistryTier: PublicChemistryTier;
}): number {
  const { artistPopularity, artistHype, quality, isSingle, chemistryTier } = params;
  const pop = Math.max(4, Math.min(100, artistPopularity || 15));
  const hype = Math.max(5, Math.min(100, artistHype || 20));
  const qualNorm = Math.max(0, Math.min(1, (quality - 45) / 55));

  // Base artist scale at 100 pop is ~4.2M for a standard release
  const baseArtistScale = 25000 + Math.pow(pop, 2.18) * 180 + Math.pow(hype, 1.75) * 95;

  if (!isSingle) {
    // Album B-sides / non-singles: naturally much lower ceiling than lead singles (max ~1.6M - 2.3M at 100 pop)
    const bSideTierMult =
      chemistryTier === 'solid_hit'
        ? 0.52
        : chemistryTier === 'normal'
        ? 0.38
        : chemistryTier === 'underperform'
        ? 0.26
        : 0.18;
    return Math.round(baseArtistScale * bSideTierMult * (0.82 + qualNorm * 0.25));
  }

  // Standalone Singles / Lead Singles: ceiling depends on Public Chemistry Tier
  let tierCeilingMult = 0.72;
  if (chemistryTier === 'mega_hit') {
    // Rare cultural mega-hit: up to ~10.5M - 13.5M for a 95-100 pop superstar with high quality
    tierCeilingMult = 2.45 + qualNorm * 0.45;
  } else if (chemistryTier === 'sleeper_hit') {
    // Viral sleeper hit: up to ~5.5M - 7.2M at top popularity
    tierCeilingMult = 1.48 + qualNorm * 0.28;
  } else if (chemistryTier === 'solid_hit') {
    // Solid hit: up to ~4.8M - 6.2M at top popularity
    tierCeilingMult = 1.25 + qualNorm * 0.22;
  } else if (chemistryTier === 'normal') {
    // Normal single: up to ~3.0M - 3.8M at top popularity
    tierCeilingMult = 0.82 + qualNorm * 0.14;
  } else if (chemistryTier === 'underperform') {
    tierCeilingMult = 0.58 + qualNorm * 0.10;
  } else {
    // front_loaded_flop
    tierCeilingMult = 0.42 + qualNorm * 0.08;
  }

  return Math.round(baseArtistScale * tierCeilingMult);
}

/**
 * Returns a balanced home-country affinity multiplier for the player's home market:
 * Contributes meaningfully as a supportive domestic fanbase pillar without monopolizing
 * the player's global market share.
 */
export function getPlayerHomeMarketAffinityMultiplier(
  countryCode: string,
  hitScope?: 'local_gem' | 'domestic_sensation' | 'regional_hit' | 'global_crossover'
): number {
  const cc = (countryCode || 'US').toUpperCase();

  let baseHomeAffinity = 2.05;
  if (['ID', 'KR', 'JP', 'NG', 'BR', 'PH', 'MX', 'IN', 'TH', 'VN', 'TR', 'AR', 'CO', 'PL'].includes(cc)) {
    baseHomeAffinity = 2.65;
  } else if (['US', 'GB'].includes(cc)) {
    baseHomeAffinity = 1.28;
  } else if (['CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'].includes(cc)) {
    baseHomeAffinity = 1.95;
  }

  if (hitScope === 'local_gem' || hitScope === 'domestic_sensation') {
    return baseHomeAffinity * 1.30;
  }
  if (hitScope === 'regional_hit') {
    return baseHomeAffinity * 1.12;
  }
  return baseHomeAffinity;
}

/**
 * 1. Stabilizes Daily Spotify Streams & YouTube Views from Day 2 onward:
 *    - Anchors directly to the un-compounded organic `computedDailyStreams` curve
 *    - Eliminates the old stackCompensation upward ratchet that pushed every song to 16M
 *    - Respects Public Chemistry Tier so flops/underperformers/normal tracks naturally settle and taper,
 *      while only rare Sleeper Hits and Mega Hits can surge during their peak window.
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
  const playlistCount = Array.isArray(song.playlistPlacements)
    ? song.playlistPlacements.length
    : 0;
  const playlistStabilityBonus = Math.min(0.04, playlistCount * 0.008);

  const publicChemistry = evaluateSongPublicChemistry({
    song,
    daysSinceRelease,
    isSingle
  });

  const realisticMaxTrackStreams = getTrackRealisticStreamCeiling({
    artistPopularity,
    artistHype,
    quality,
    isSingle,
    chemistryTier: publicChemistry.tier
  });

  const prevStreams = song.dailyStreams || 0;
  const prevViews = song.dailyViews || 0;

  let stabilizedStreams = Math.min(realisticMaxTrackStreams, computedDailyStreams);
  let stabilizedViews = computedDailyViews;

  if (prevStreams > 0 && daysSinceRelease >= 1) {
    const safePrevStreams = Math.min(prevStreams, realisticMaxTrackStreams);
    const isWeekend = weekendLift >= 1.02;

    // Smoothly blend 75% today's organic target with 25% yesterday's actual streams to avoid jagged noise
    // without allowing yesterday's number to compound upward!
    const organicTarget = Math.min(realisticMaxTrackStreams, computedDailyStreams);
    const blendedTarget = Math.round(organicTarget * 0.76 + safePrevStreams * 0.24);

    let minStreamRetention: number;
    let maxStreamGrowth: number;

    switch (publicChemistry.tier) {
      case 'front_loaded_flop': {
        // Steep natural post-debut decay; never climbs back up
        minStreamRetention = (daysSinceRelease <= 3 ? 0.68 : 0.74) * organicVariance;
        maxStreamGrowth = isWeekend ? 0.96 : 0.92;
        break;
      }
      case 'underperform': {
        // Lukewarm track: steady downward taper after Day 1
        minStreamRetention = (daysSinceRelease === 1 ? 0.78 : 0.82) * organicVariance;
        maxStreamGrowth = isWeekend ? 0.99 : 0.95;
        break;
      }
      case 'normal': {
        // Healthy standard release or album cut: gentle settle after Day 1, small weekend breathing room, no runaway climb
        if (daysSinceRelease === 1) {
          minStreamRetention = (isSingle ? 0.82 : 0.76) + qualityNorm * 0.04;
          maxStreamGrowth = 0.96;
        } else if (daysSinceRelease <= 10) {
          minStreamRetention = (0.88 + qualityNorm * 0.03 + playlistStabilityBonus) * organicVariance;
          maxStreamGrowth = isWeekend ? 1.025 : 0.985;
        } else {
          minStreamRetention = (0.89 + qualityNorm * 0.02) * organicVariance;
          maxStreamGrowth = isWeekend ? 1.01 : 0.975;
        }
        break;
      }
      case 'solid_hit': {
        // Solid hit: holds steadily in Weeks 1-3, then gradually tapers
        if (daysSinceRelease === 1) {
          minStreamRetention = 0.86 + qualityNorm * 0.05;
          maxStreamGrowth = 1.02;
        } else if (daysSinceRelease <= 18) {
          minStreamRetention = (0.91 + qualityNorm * 0.03 + playlistStabilityBonus) * organicVariance;
          maxStreamGrowth = isWeekend ? 1.045 : 1.015;
        } else {
          minStreamRetention = (0.90 + qualityNorm * 0.02) * organicVariance;
          maxStreamGrowth = isWeekend ? 1.015 : 0.985;
        }
        break;
      }
      case 'sleeper_hit': {
        // Sleeper hit: modest Days 1-4, organic climb during Days 5-18 (strictly bounded by organicTarget), then tapers
        if (daysSinceRelease <= 4) {
          minStreamRetention = 0.84 * organicVariance;
          maxStreamGrowth = 0.98;
        } else if (daysSinceRelease <= 18) {
          minStreamRetention = (0.92 + playlistStabilityBonus) * organicVariance;
          maxStreamGrowth = isWeekend ? 1.065 : 1.04;
        } else {
          minStreamRetention = 0.90 * organicVariance;
          maxStreamGrowth = isWeekend ? 1.015 : 0.98;
        }
        break;
      }
      case 'mega_hit': {
        // Rare cultural phenomenon: strong Week 1-3 hold, bounded by organicTarget so it never ratchets infinitely
        if (daysSinceRelease === 1) {
          minStreamRetention = 0.90 + qualityNorm * 0.04;
          maxStreamGrowth = 1.04;
        } else if (daysSinceRelease <= 24) {
          minStreamRetention = (0.93 + qualityNorm * 0.025 + playlistStabilityBonus) * organicVariance;
          maxStreamGrowth = isWeekend ? 1.055 : 1.025;
        } else {
          minStreamRetention = 0.91 * organicVariance;
          maxStreamGrowth = isWeekend ? 1.015 : 0.985;
        }
        break;
      }
    }

    // Album B-sides are never allowed to ratchet upward day after day
    if (!isSingle && daysSinceRelease >= 1) {
      maxStreamGrowth = Math.min(maxStreamGrowth, isWeekend ? 1.01 : 0.97);
      minStreamRetention = Math.min(minStreamRetention, 0.88);
    }

    const floorStreams = Math.round(safePrevStreams * Math.min(0.96, minStreamRetention));
    const ceilStreams = Math.round(safePrevStreams * maxStreamGrowth);

    // Hard anchor: never allow day-over-day envelope to exceed 1.15x of today's pure organic target!
    const hardOrganicCap = Math.min(realisticMaxTrackStreams, Math.round(organicTarget * 1.15));

    stabilizedStreams = Math.min(
      hardOrganicCap,
      Math.max(floorStreams, Math.min(ceilStreams, blendedTarget))
    );
  }

  // Stabilize YouTube daily MV views in sync with the song's organic stream trajectory
  if (song.hasMV && prevViews > 0 && daysSinceRelease >= 1) {
    const maxRealisticViews = Math.max(100, Math.round(stabilizedStreams * 1.30));
    const safePrevViews = Math.min(prevViews, maxRealisticViews);
    const viewRetention =
      publicChemistry.tier === 'front_loaded_flop'
        ? 0.72
        : publicChemistry.tier === 'underperform'
        ? 0.80
        : daysSinceRelease === 1
        ? 0.84 + qualityNorm * 0.04
        : (0.89 + qualityNorm * 0.03) * organicVariance;

    const floorViews = Math.round(safePrevViews * Math.min(0.95, viewRetention));
    const ceilViews = Math.round(safePrevViews * (weekendLift >= 1.02 ? 1.03 : 0.99));
    const blendedViews = Math.round(computedDailyViews * 0.75 + safePrevViews * 0.25);

    stabilizedViews = Math.min(
      maxRealisticViews,
      Math.max(floorViews, Math.min(ceilViews, blendedViews))
    );
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
    // Weeks 5-8: Extended catalog iTunes presence for hits (clamp momentum to 0.55..1.20)
    const safeMom =
      song.momentum && song.momentum <= 2.5 ? Math.min(1.2, song.momentum) : 0.75;
    targetConversionRate = (0.00135 + qualityNorm * 0.00025) * Math.max(0.55, safeMom);
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

    const maxRealisticPrevSales = Math.max(150, Math.round(stabilizedDailyStreams * 0.0045));
    const safePrevSales = Math.min(prevSales, maxRealisticPrevSales);
    const salesFloor = Math.round(safePrevSales * Math.min(0.98, minSalesRetention));
    finalSales = Math.min(
      Math.max(250, Math.round(stabilizedDailyStreams * 0.006)),
      Math.max(finalSales, salesFloor)
    );
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
  const breakoutProfile = evaluateSongRegionalBreakoutProfile(
    song,
    homeCountry,
    playerPopularity,
    playerHype
  );

  // Same base market fraction formula used by NPCs in npcRealReleaseChartsEngine.ts (`marketSizeWeight / 320`)
  const npcCompatibleMarketFraction = Math.max(0.008, targetProfile.marketSizeWeight / 320);

  // Determine territorial affinity using the song's Selective Regional Breakout Profile:
  // - Home Market contributes solidly without monopolizing the global market
  // - Hot Breakout Countries (e.g. US + select European markets, or Asia-Pacific pockets) surge strongly
  // - Cold Countries (e.g. Indonesia/Asia on a Western/European-only hit, or Europe on an Asia-only hit) stay low
  let affinityMultiplier: number;
  const isBreakoutCountry = breakoutProfile.breakoutCountries.includes(targetRegion);
  const isColdCountry = breakoutProfile.coldCountries.includes(targetRegion);
  const songCountryMult = breakoutProfile.countryMultipliers[targetRegion] ?? 0.65;

  if (isHomeMarket) {
    affinityMultiplier = getPlayerHomeMarketAffinityMultiplier(homeCountry);
  } else if (isBreakoutCountry) {
    // Foreign country where this specific song caught fire!
    affinityMultiplier = songCountryMult * 1.42;
  } else if (isColdCountry) {
    // Country/region where this song did NOT connect (e.g., US/EU hit that didn't cross over to Indonesia/Asia)
    affinityMultiplier = songCountryMult * 0.72;
  } else {
    affinityMultiplier = songCountryMult;
  }

  const effectiveTerritoryScale = npcCompatibleMarketFraction * affinityMultiplier;

  // Global metrics for the song (strictly bounded so low-stream tracks never get phantom sales/radio/views spikes)
  const globalDailyStreams = Math.max(0, song.dailyStreams || 0);
  const rawWeeklyStreams =
    song.weeklyStreams && song.weeklyStreams > 0 ? song.weeklyStreams : globalDailyStreams * 7;
  const globalWeeklyStreams = Math.min(
    rawWeeklyStreams,
    Math.max(globalDailyStreams * 7, Math.round(globalDailyStreams * 8.5))
  );

  const maxRealisticDailySales = Math.max(25, Math.round(globalDailyStreams * 0.005));
  const globalDailySales = Math.min(maxRealisticDailySales, Math.max(0, song.dailyPureSales || 0));
  const rawWeeklySales =
    song.weeklyPureSales && song.weeklyPureSales > 0 ? song.weeklyPureSales : globalDailySales * 7;
  const globalWeeklySales = Math.min(
    rawWeeklySales,
    Math.max(globalDailySales * 7, Math.round(globalWeeklyStreams * 0.0055))
  );

  const maxRealisticDailyRadio = Math.max(
    15,
    Math.round(playerPopularity * 18 + globalDailyStreams * 0.005)
  );
  const globalDailyRadio = Math.min(maxRealisticDailyRadio, Math.max(0, song.dailyRadioPlays || 0));
  const rawWeeklyRadio =
    song.weeklyRadioPlays && song.weeklyRadioPlays > 0 ? song.weeklyRadioPlays : globalDailyRadio * 7;
  const globalWeeklyRadio = Math.min(
    rawWeeklyRadio,
    Math.max(globalDailyRadio * 7, Math.round(maxRealisticDailyRadio * 7))
  );

  const maxRealisticDailyViews = song.hasMV
    ? Math.max(100, Math.round(globalDailyStreams * 1.35))
    : 0;
  const globalDailyViews = song.hasMV
    ? Math.min(maxRealisticDailyViews, Math.max(0, song.dailyViews || 0))
    : 0;
  const rawWeeklyViews = song.hasMV
    ? song.weeklyViews && song.weeklyViews > 0
      ? song.weeklyViews
      : globalDailyViews * 7
    : 0;
  const globalWeeklyViews = song.hasMV
    ? Math.min(rawWeeklyViews, Math.max(globalDailyViews * 7, Math.round(globalWeeklyStreams * 1.35)))
    : 0;

  // Cultural platform propensity adjustments
  const streamCultureBoost = Math.max(0.82, targetProfile.streamingShare / 0.60);
  const viewCultureBoost = Math.max(0.85, targetProfile.youtubeShare / 0.30);
  const salesCultureBoost = Math.max(0.85, Math.min(1.8, targetProfile.salesShare / 0.05));
  const radioCultureBoost = Math.max(0.85, targetProfile.radioShare / 0.04);

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

  // Calculate player's Global score on this platform
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
    points = Math.min(Math.max(1, Math.round(globalDailySales * 0.45)), territorySales);
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

  // BALANCED HOME COUNTRY & SELECTIVE BREAKOUT SYNC:
  // 1. In the player's Home Country (`isHomeMarket`), guarantee a supportive hometown floor (0.85x-0.98x of global standing)
  //    so the player never has 0 streams or misses their home chart when charting globally,
  //    while capping home share at 28%-38% of global so the Home Country NEVER monopolizes the player's market!
  // 2. In a Hot Foreign Breakout Country (`isBreakoutCountry` && !isHomeMarket), allow the song to surge
  //    up to 1.05x-1.22x of its global relative ratio so a song can genuinely hit #1 or Top 5 in select countries!
  if (topGlobalNpcScore > 0 && topRegionNpcScore > 0 && playerGlobalScore > 0 && !isColdCountry) {
    const globalRelativeRatio = playerGlobalScore / topGlobalNpcScore;

    if (isHomeMarket) {
      const homeSupportRatio = globalRelativeRatio * 0.92;
      const homeSupportFloorPoints = Math.round(topRegionNpcScore * homeSupportRatio);
      // Cap Home Country so it contributes realistically (max 28% for medium markets, 38% for US) instead of dominating
      const maxHomeShareCap = homeCountry === 'US' ? 0.38 : 0.28;
      const maxAllowedByGlobal = Math.max(points, Math.round(playerGlobalScore * maxHomeShareCap));
      const targetHomePoints = Math.min(maxAllowedByGlobal, homeSupportFloorPoints);

      if (targetHomePoints > points && points > 0) {
        const boostRatio = targetHomePoints / points;
        points = targetHomePoints;
        territoryStreams = Math.min(
          Math.round((isWeekly ? globalWeeklyStreams : globalDailyStreams) * maxHomeShareCap),
          Math.round(territoryStreams * boostRatio)
        );
        territoryWeeklyStreams = Math.min(
          Math.round(globalWeeklyStreams * maxHomeShareCap),
          Math.round(territoryWeeklyStreams * boostRatio)
        );
        territorySales = Math.min(
          Math.round((isWeekly || platform === 'billboard' ? globalWeeklySales : globalDailySales) * maxHomeShareCap),
          Math.round(territorySales * boostRatio)
        );
        territoryViews = Math.min(
          Math.round((isWeekly || platform === 'billboard' ? globalWeeklyViews : globalDailyViews) * maxHomeShareCap),
          Math.round(territoryViews * boostRatio)
        );
      }
    } else if (isBreakoutCountry && songCountryMult >= 1.25) {
      // Selective foreign country breakout: allows a song to smash in specific countries/regions!
      const foreignBreakoutRatio = globalRelativeRatio * Math.min(1.18, songCountryMult * 0.72);
      const foreignBreakoutPoints = Math.round(topRegionNpcScore * foreignBreakoutRatio);
      const maxForeignCap = targetRegion === 'US' ? 0.36 : 0.24;
      const maxAllowedForeign = Math.max(points, Math.round(playerGlobalScore * maxForeignCap));
      const targetForeignPoints = Math.min(maxAllowedForeign, foreignBreakoutPoints);

      if (targetForeignPoints > points && points > 0) {
        const boostRatio = targetForeignPoints / points;
        points = targetForeignPoints;
        territoryStreams = Math.min(
          Math.round((isWeekly ? globalWeeklyStreams : globalDailyStreams) * maxForeignCap),
          Math.round(territoryStreams * boostRatio)
        );
        territoryWeeklyStreams = Math.min(
          Math.round(globalWeeklyStreams * maxForeignCap),
          Math.round(territoryWeeklyStreams * boostRatio)
        );
        territorySales = Math.min(
          Math.round((isWeekly || platform === 'billboard' ? globalWeeklySales : globalDailySales) * maxForeignCap),
          Math.round(territorySales * boostRatio)
        );
        territoryViews = Math.min(
          Math.round((isWeekly || platform === 'billboard' ? globalWeeklyViews : globalDailyViews) * maxForeignCap),
          Math.round(territoryViews * boostRatio)
        );
      }
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
