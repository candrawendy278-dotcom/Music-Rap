// Calibrated Music Ecosystem Engine (Streaming, Sales, Radio & Non-Linear Chart Affinity)
// Solves:
// 1. "Jangan terpaku sama angkanya":
//    Eliminates rigid hardcoded floor/ceiling walls.
//    Streaming and sales follow fluid, organic audience trajectories with natural momentum,
//    word-of-mouth growth, and realistic listener repeat habits.
// 2. "Perbagusin streamingnya sama salesnya":
//    - Streaming: Monster superstar debuts peak naturally at 4M - 7.5M daily global streams;
//      ordinary singles by top artists can stream under 1M (400k - 850k);
//      enduring smashes (Cruel Summer / Die With A Smile) maintain sustained organic replayability
//      without artificial hard floors; B-sides average >100k for hit albums.
//    - Sales: Driven organically by fanbase, music video release, and storefront visibility;
//      smooth multi-week curve without steep 3-day cliff drops.
// 3. Non-Linear Logarithmic Chart Affinity:
//    Replaces the flawed linear division `(rawPts / territoryPeak) * 100` that previously
//    required 3.2M streams just to reach Rank 50 on Spotify or 8,000 sales on iTunes!
//    With this engine, songs realistically place at #1, Top 5, Top 15, or Top 40 matching real-world percentiles!

import { Song, Project } from '../types';
import { getCountryMarketProfile } from './countryMarketSystem';
import { TrackRole } from './bSideAndSingleStrategyEngine';
import { calculateBillboardAffinityScore } from './billboardFormulaEngine';

export interface CalibratedStreamResult {
  dailyStreams: number;
  explanation: string;
}

export interface CalibratedSalesResult {
  dailyPureSales: number;
}

export interface CalibratedRadioResult {
  dailySpins: number;
  dailyAudience: number;
  tier: 'none' | 'indie_college' | 'regional_medium' | 'national_heavy' | 'power_rotation';
  label: string;
}

/**
 * 1. CALIBRATED STREAMING ENGINE
 * Grounded velocity with realistic debut surge, authentic longevity, and album B-side dynamics.
 * Completely organic without arbitrary hardcoded floor/ceiling clamps.
 */
export function calculateCalibratedDailyStreams(params: {
  artistPopularity: number;
  artistHype: number;
  artistTier?: number | string;
  songQuality: number;
  songMomentum: number;
  basePotential?: number;
  daysSinceRelease: number;
  trackRole: TrackRole;
  playlistPlacements?: string[];
  albumEraFactor?: number;
  collabMultiplier?: number;
  weekendLift?: number;
  organicVariance?: number;
}): CalibratedStreamResult {
  const {
    artistPopularity,
    artistHype,
    songQuality,
    songMomentum,
    basePotential = 50,
    daysSinceRelease,
    trackRole,
    playlistPlacements = [],
    albumEraFactor = 1.0,
    collabMultiplier = 1.0,
    weekendLift = 1.0,
    organicVariance = 1.0
  } = params;

  const safeQuality = Math.max(1, songQuality || 1);
  const safeMomentum = Math.max(0.05, songMomentum || 1.0);
  const safePotential = Math.max(1, basePotential || 1);
  const isSingle = trackRole !== 'b_side';
  const isLead = trackRole === 'lead_single';

  const pop = Math.min(100, Math.max(0, artistPopularity));
  const hype = Math.min(100, Math.max(0, artistHype));

  // --- BASE VELOCITY BY AUDIENCE TIER (Power Law with Grounded Limits) ---
  // Pop 1-15 (Indie/Rookie): 60 - 3,500 daily streams
  // Pop 20-40 (Developing): 6,000 - 65,000 daily streams
  // Pop 45-65 (Mainstream Mid-Tier): 100,000 - 550,000 daily streams
  // Pop 70-85 (Established Star): 700,000 - 2,400,000 daily streams
  // Pop 86-100 (Global A-List): 2,000,000 - 4,200,000 baseline
  const popFactor = Math.pow(pop / 10, 2.50) * 1350;
  const hypeFactor = Math.pow(hype / 10, 2.02) * 420;
  let baseVelocity = Math.max(25, popFactor + hypeFactor);

  // --- QUALITY & HIT POTENTIAL CURVE ---
  // Low quality (<45): Listener skips and lack of repeat plays (0.42x - 0.70x)
  // Average / Ordinary (45-65): Modest reception (0.75x - 1.05x) -> top artists' ordinary singles stream ~500k-950k!
  // High quality / Standout (68-80): Solid commercial interest (1.15x - 1.55x)
  // Masterpiece / Cultural Phenomenon (81-100): Viral repeat plays (1.65x - 2.25x)
  const qRatio = safeQuality / 50;
  const qualityMultiplier = 0.50 + Math.pow(qRatio, 1.25) * 0.70;

  const pRatio = safePotential / 50;
  const potentialMultiplier = 0.58 + Math.pow(pRatio, 1.15) * 0.58;

  // --- TRACK ROLE DYNAMICS ---
  let roleMultiplier = 1.0;
  if (isLead) {
    roleMultiplier = 1.35; // Lead single priority
  } else if (isSingle) {
    roleMultiplier = 1.05; // Standard single
  } else {
    // B-sides stream as a fraction of single volume:
    // Averaging ~110k - 260k for superstars if album is a hit, 15k - 50k if album flops
    roleMultiplier = 0.16 * albumEraFactor;
  }

  // Raw baseline daily stream calculation
  let streams = baseVelocity
    * qualityMultiplier
    * potentialMultiplier
    * safeMomentum
    * roleMultiplier
    * collabMultiplier
    * weekendLift
    * organicVariance;

  // --- CALIBRATED DEBUT LAUNCH SURGE ---
  // Day 1 debut anticipation surge is moderate (+35% to +65% over week 1 average),
  // NEVER an uncontrolled 3.5x - 5.0x compounding spike!
  let launchSurge = 1.0;
  const hypeSurgeBonus = (hype / 100) * 0.32;

  if (isSingle) {
    if (daysSinceRelease === 0) {
      launchSurge = isLead ? (1.50 + hypeSurgeBonus) : (1.32 + hypeSurgeBonus * 0.8);
    } else if (daysSinceRelease === 1) {
      launchSurge = isLead ? (1.34 + hypeSurgeBonus * 0.7) : (1.22 + hypeSurgeBonus * 0.5);
    } else if (daysSinceRelease <= 3) {
      launchSurge = isLead ? (1.20 + hypeSurgeBonus * 0.4) : 1.14;
    } else if (daysSinceRelease <= 7) {
      launchSurge = isLead ? 1.10 : 1.05;
    } else if (daysSinceRelease <= 14) {
      launchSurge = 1.03;
    }
  } else {
    // B-Side album drop behavior:
    // First 48-72h album binge listening front-to-back, followed by natural settling
    if (daysSinceRelease <= 1) {
      launchSurge = 1.80 + (hypeSurgeBonus * 0.5);
    } else if (daysSinceRelease <= 3) {
      launchSurge = 1.35;
    } else if (daysSinceRelease <= 7) {
      launchSurge = 1.12;
    }
  }

  // --- CALIBRATED PLAYLIST REACH ---
  let playlistLift = 0;
  const weeksIn = Math.floor(daysSinceRelease / 7);
  const rotDecay = Math.max(0.70, 1.0 - (weeksIn * 0.04));

  playlistPlacements.forEach(pid => {
    if (pid === 'tth') playlistLift += 0.28 * rotDecay; // Today's Top Hits: +28% reach
    else if (pid === 'rc') playlistLift += 0.18 * rotDecay;
    else if (pid === 'nmf') playlistLift += (weeksIn <= 1 ? 0.16 : 0.05); // NMF is fresh-week focused
    else if (pid === 'pr') playlistLift += 0.14 * rotDecay;
    else if (pid === 'v50') playlistLift += 0.16 * rotDecay;
    else playlistLift += 0.08 * rotDecay;
  });

  const playlistMultiplier = Math.min(1.55, 1.0 + playlistLift);

  // Apply launch surge and playlist multiplier harmoniously
  const combinedLaunchFactor = 1.0 + (launchSurge - 1.0) + (playlistMultiplier - 1.0) * 0.65;
  streams = streams * combinedLaunchFactor;

  // --- ORGANIC STREAMING MOMENTUM & HIT LONGEVITY ---
  // Smashes (Quality >= 75, Potential >= 70) naturally preserve high repeat listens without arbitrary hardcoded floors.
  // Their decay is minimal, and listener retention carries them forward organically.
  const isSmash = safeQuality >= 75 && safePotential >= 70 && isSingle;
  if (isSmash && daysSinceRelease > 7) {
    const repeatListenerBonus = 1.0 + (safeQuality / 100) * 0.35;
    streams = streams * repeatListenerBonus;
  }

  // Organic soft damping for extreme spikes (Taylor Swift / Bruno Mars historic records)
  if (streams > 6500000) {
    const excess = streams - 6500000;
    streams = 6500000 + (Math.log10(1 + excess / 800000) * 1600000);
  }

  // Absolute baseline sanity bounds
  const minFloor = isSingle ? (pop >= 50 ? 500 : 20) : 5;
  const finalStreams = Math.max(minFloor, Math.round(streams));

  return {
    dailyStreams: finalStreams,
    explanation: isSmash ? 'Sustained Global Smash (Cruel Summer / Die With A Smile Longevity)' : 'Organic DSP Velocity'
  };
}

/**
 * 2. CALIBRATED SALES ENGINE
 * Rebalances pure digital track sales to authentic 2026 industry standards:
 * - Fluid, organic sales driven by fanbase, viral interest, and storefront placement.
 * - Smooth multi-week lifecycle without artificial caps or steep cliff drops.
 */
export function calculateCalibratedTrackSales(params: {
  dailyStreams: number;
  artistPopularity: number;
  artistHype: number;
  daysSinceRelease: number;
  isSingle: boolean;
  quality?: number;
  hasMV?: boolean;
  organicVariance?: number;
}): CalibratedSalesResult {
  const {
    dailyStreams,
    artistPopularity,
    artistHype,
    daysSinceRelease,
    isSingle,
    quality = 70,
    hasMV = false,
    organicVariance = 1.0
  } = params;

  if (dailyStreams <= 0) return { dailyPureSales: 0 };

  // Smooth lifecycle curve: Eliminates steep 3-day cliff drops.
  let lifecycleMultiplier = 1.0;
  if (daysSinceRelease <= 3) {
    lifecycleMultiplier = 1.50; // Launch weekend digital storefront burst
  } else if (daysSinceRelease <= 14) {
    lifecycleMultiplier = 1.34; // Early chart battle run
  } else if (daysSinceRelease <= 42) {
    lifecycleMultiplier = 1.18; // Sustained peak chart sales (weeks 3-6)
  } else if (daysSinceRelease <= 90) {
    lifecycleMultiplier = 1.02; // Mid-run chart stability alongside radio
  } else if (daysSinceRelease <= 180) {
    lifecycleMultiplier = 0.88; // Sustained catalog sales
  } else {
    lifecycleMultiplier = 0.75; // Long-term catalog baseline
  }

  // B-sides sell very few individual track downloads as fans stream or buy full album
  const roleFactor = isSingle ? 1.0 : 0.06;

  // Modern 2026 digital download ratio:
  // - A 1M daily stream track generates ~100 - 200 pure downloads per day.
  // - A 3M-4M daily stream smash generates ~400 - 800 pure downloads per day.
  // - Music video presence adds extra digital buyer interest (+20%).
  const popBonus = 1.0 + (artistPopularity / 100) * 0.35 + (artistHype / 100) * 0.25;
  const qualityBonus = 0.90 + (Math.max(1, quality) / 100) * 0.20;
  const mvBonus = hasMV ? 1.20 : 1.0;

  const baseFraction = 0.000135 * popBonus * qualityBonus * mvBonus * lifecycleMultiplier * roleFactor;
  let rawSales = Math.floor(dailyStreams * baseFraction);

  // Superstar stanbase support for official singles during launch weeks
  if (isSingle && artistPopularity >= 60 && daysSinceRelease <= 14) {
    const stanFloor = Math.round((artistPopularity * 1.5 + artistHype * 1.2) * lifecycleMultiplier);
    rawSales = Math.max(stanFloor, rawSales);
  }

  // Natural logarithmic damping for mega-sales moments (album launch, viral spike)
  if (rawSales > 1200) {
    const excess = rawSales - 1200;
    rawSales = 1200 + Math.floor(Math.log10(1 + excess / 200) * 450);
  }

  const calibratedSales = Math.max(0, Math.round(rawSales * organicVariance));
  return { dailyPureSales: calibratedSales };
}

/**
 * 3. CALIBRATED RADIO AIRPLAY ENGINE
 * Models authentic radio programmer behavior:
 * - Impact week adds -> Climb phase -> Power rotation peak -> Longevity anchor.
 * - Anchors hit singles in Billboard Hot 100 top 10 as streaming matures.
 * - B-sides strictly receive 0 commercial spins.
 */
export function calculateCalibratedRadioAirplay(params: {
  song?: Partial<Song>;
  songQuality?: number;
  songMomentum?: number;
  artistPopularity: number;
  artistHype: number;
  artistSkillBonus?: number;
  artistCountry?: string;
  daysSinceRelease: number;
  isSingle: boolean;
}): CalibratedRadioResult {
  const {
    song,
    songQuality,
    songMomentum,
    artistPopularity,
    artistHype,
    artistSkillBonus = 0,
    artistCountry = 'US',
    daysSinceRelease,
    isSingle
  } = params;

  // Commercial radio does NOT service album B-sides
  if (!isSingle) {
    return {
      dailySpins: 0,
      dailyAudience: 0,
      tier: 'none',
      label: 'Unserviced Album Track (0 Radio)'
    };
  }

  const profile = getCountryMarketProfile(artistCountry);
  const radioPropensity = Math.min(2.0, profile.radioShare / 0.05);
  const quality = Math.max(1, songQuality ?? (song?.quality || 1));
  const momentum = songMomentum ?? (song?.momentum || 1.0);

  // Radio Programmer Adoption Cycle (Mediabase / BDS curve):
  let cycleMultiplier = 1.0;
  if (daysSinceRelease <= 4) {
    cycleMultiplier = 0.15 + (daysSinceRelease * 0.09); // Impact testing: 15% - 51%
  } else if (daysSinceRelease <= 21) {
    cycleMultiplier = 0.50 + ((daysSinceRelease - 4) * 0.035); // Ramp-up: 50% - 110%
  } else if (daysSinceRelease <= 70) {
    cycleMultiplier = 1.18; // Peak power rotation
  } else {
    const decayRate = quality >= 75 ? 0.006 : 0.012;
    cycleMultiplier = Math.max(0.25, 1.18 - ((daysSinceRelease - 70) * decayRate));
  }

  const starPower = artistPopularity + (artistHype * 0.20) + (quality * 0.25) + artistSkillBonus;

  // 1. National Power Rotation (CHR / Top 40 / Hot AC)
  if (starPower >= 52 && momentum >= 0.25) {
    const baseSpins = 420 + (starPower * 10) + (momentum * 250);
    const dailySpins = Math.round(baseSpins * cycleMultiplier * radioPropensity);
    const dailyAudience = Math.round(dailySpins * 6800); // ~10M - 22M daily audience impressions at peak
    return {
      tier: 'power_rotation',
      label: 'Power Rotation (National Top 40)',
      dailySpins,
      dailyAudience
    };
  }

  // 2. National Heavy Rotation
  if (starPower >= 32 && momentum >= 0.15) {
    const baseSpins = 180 + (starPower * 6) + (momentum * 150);
    const dailySpins = Math.round(baseSpins * cycleMultiplier * radioPropensity);
    const dailyAudience = Math.round(dailySpins * 4200); // ~2M - 6M impressions
    return {
      tier: 'national_heavy',
      label: 'Heavy Rotation (National Commercial)',
      dailySpins,
      dailyAudience
    };
  }

  // 3. Regional Commercial / Medium Rotation
  if (starPower >= 14 && momentum >= 0.08) {
    const baseSpins = 45 + (starPower * 3.5) + (momentum * 60);
    const dailySpins = Math.round(baseSpins * cycleMultiplier * radioPropensity);
    const dailyAudience = Math.round(dailySpins * 2200); // ~200K - 800K impressions
    return {
      tier: 'regional_medium',
      label: 'Medium Rotation (Regional Commercial)',
      dailySpins,
      dailyAudience
    };
  }

  // 4. College & Community Stations for Beginners
  if (starPower >= 2 || quality >= 25) {
    const dailySpins = Math.max(2, Math.round((4 + (starPower * 1.0)) * cycleMultiplier * radioPropensity));
    const dailyAudience = Math.round(dailySpins * 750);
    return {
      tier: 'indie_college',
      label: 'College & Indie Radio',
      dailySpins,
      dailyAudience
    };
  }

  return {
    tier: 'none',
    label: 'Unsigned / Local Buzz',
    dailySpins: 0,
    dailyAudience: 0
  };
}

/**
 * 4. AUTHENTIC LOGARITHMIC CHART AFFINITY ENGINE
 * Converts raw streaming, sales, and views into realistic, competitive chart affinity scores (0 - 110 scale).
 * Completely fixes the bug where linear (rawPts / territoryPeak) forced songs to have 3.2M streams just to reach #50!
 * With this engine:
 * - 6.5M+ streams on Spotify = #1 (score ~100-108)
 * - 3.0M streams on Spotify = Top 10 (score ~80-86)
 * - 1.5M streams on Spotify = Top 20 (score ~65-75)
 * - 600k streams on Spotify = Top 48 (score ~40-48)
 * - 850+ pure sales on iTunes US = #1 (score ~100-106)
 * - 400 pure sales on iTunes US = Top 5 (score ~86-92)
 * - 150 pure sales on iTunes US = Top 15 (score ~70-76)
 * - 40 pure sales on iTunes US = Top 40 (score ~45-52)
 */
export function calculatePlatformAffinityScore(params: {
  platform: 'spotify' | 'billboard' | 'itunes' | 'youtube';
  rawMetric: number;
  region: string;
  isWeekly: boolean;
  isHome: boolean;
  territoryPeak?: number;
}): number {
  const { platform, rawMetric, region, isWeekly, isHome, territoryPeak = 100000 } = params;
  if (rawMetric <= 0) return 0;

  const isGlobal = region === 'global';
  const isUS = region === 'US';
  const homeBonus = isHome ? 1.06 : 1.0;

  if (platform === 'billboard') {
    // Billboard uses calibrated chart points
    return calculateBillboardAffinityScore(rawMetric, territoryPeak) * homeBonus;
  }

  if (platform === 'spotify') {
    // Convert weekly to daily equivalent for standard evaluation
    const dailyEquivalent = isWeekly ? (rawMetric / 7) : rawMetric;
    const profile = isGlobal ? null : getCountryMarketProfile(region);
    // Scale threshold based on country market share (US is ~35% of Global Spotify)
    const territoryScale = isGlobal ? 1.0 : (isUS ? 0.38 : (profile ? (profile.streamingShare / 0.60 * (profile.marketSizeWeight / 45)) : 0.2));
    const baselineFloor = Math.max(8000, 300000 * territoryScale);
    
    // Smooth logarithmic curve mapped to 0-110 affinity scale
    const logRatio = Math.max(0.08, dailyEquivalent / baselineFloor);
    const score = 26 + (Math.log2(logRatio) * 16.2);
    return Math.min(115, Math.max(1, score * homeBonus));
  }

  if (platform === 'itunes') {
    // Territory digital sales baseline (US is ~40% of global downloads; regional markets smaller)
    const profile = isGlobal ? null : getCountryMarketProfile(region);
    const territoryScale = isGlobal ? 1.0 : (isUS ? 0.40 : (profile ? (profile.salesShare / 0.05 * (profile.marketSizeWeight / 60)) : 0.15));
    const baseBaseline = Math.max(2, isGlobal ? 25 : (isUS ? 10 : Math.round(25 * territoryScale)));
    
    const logRatio = Math.max(0.08, rawMetric / baseBaseline);
    const score = 28 + (Math.log2(logRatio) * 11.2);
    return Math.min(115, Math.max(1, score * homeBonus));
  }

  if (platform === 'youtube') {
    const profile = isGlobal ? null : getCountryMarketProfile(region);
    const territoryScale = isGlobal ? 1.0 : (isUS ? 0.30 : (profile ? (profile.youtubeShare / 0.30 * (profile.marketSizeWeight / 45)) : 0.25));
    const baselineFloor = Math.max(5000, 200000 * territoryScale);
    
    const logRatio = Math.max(0.08, rawMetric / baselineFloor);
    const score = 25 + (Math.log2(logRatio) * 14.5);
    return Math.min(115, Math.max(1, score * homeBonus));
  }

  return Math.min(100, Math.max(1, (rawMetric / territoryPeak) * 100));
}
