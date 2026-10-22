import { calculateRealisticDailyAlbumSales } from './albumSalesAndMarketCalibrator';

// Chart Sales & Market Stability Rebalancer
// Resolves:
// 1. "Sales too much": In the modern streaming era, pure track/album downloads represent a small fraction
//    of consumption (~0.01% - 0.05% of streams). Rebalances pure sales to realistic industry volumes.
// 2. Billboard weighting calibration: Modern Billboard Hot 100/Global 200 weights 1 track sale = 1.0 unit (not 3x!).
// 3. Album pure sales rebalance: Prevents 10,000+ pure album sales/day; caps at realistic 200 - 1,200/day for superstars.
// 4. #1 Longevity & Stability calibration (Ella Langley / hit song dynamics):
//    Hit songs maintain strong runs, but face natural week-over-week decay (-6% to -14%) and competitive NPC turnover.
// 5. Non-pitched song stability: Eliminates the sharp cliff drop if a song is not pitched to playlists,
//    retaining a strong organic streaming floor supported by fanbase, Discover Weekly, and Radio.

export interface RebalancedSalesMetrics {
  dailyPureSales: number;
  salesRevenueUSD: number;
}

/**
 * Computes realistic modern digital download track sales (2024-2026 industry benchmark)
 * In real life:
 * - A 1M daily stream hit generates ~80 - 250 pure track sales per day.
 * - Debut week has extra stan purchases (1.5x - 2.0x), tapering down to a stable baseline.
 */
export function calculateRebalancedTrackSales(
  dailyStreams: number,
  artistPopularity: number,
  daysSinceRelease: number,
  isSingle: boolean
): number {
  if (dailyStreams <= 0) return 0;

  // Single track sales lifecycle:
  // Decays smoothly and steadily across charting weeks rather than collapsing off a cliff
  let cycleMultiplier = 1.0;
  if (daysSinceRelease <= 3) {
    cycleMultiplier = 1.48; // Release launch purchase burst
  } else if (daysSinceRelease <= 14) {
    cycleMultiplier = 1.32; // Early charting run
  } else if (daysSinceRelease <= 42) {
    cycleMultiplier = 1.15; // Peak chart longevity window (weeks 3-6)
  } else if (daysSinceRelease <= 90) {
    cycleMultiplier = 0.98; // Mid-run chart stability alongside radio
  } else if (daysSinceRelease <= 180) {
    cycleMultiplier = 0.85; // Sustained catalog sales
  } else {
    cycleMultiplier = 0.72; // Enduring catalog purchase baseline
  }

  // B-sides sell significantly fewer individual downloads as listeners stream the album
  const trackTypeMultiplier = isSingle ? 1.0 : 0.06;

  // Modern 2026 digital download ratio (~0.012% to 0.022% of daily streams)
  // Keeps sales healthy and competitive without making NPCs unable to compete
  const baseFraction = 0.000125 * (1 + (artistPopularity / 100) * 0.35) * cycleMultiplier * trackTypeMultiplier;
  const rawSales = Math.floor(dailyStreams * baseFraction);

  const maxCap = isSingle ? 850 : 45;
  return Math.max(0, Math.min(maxCap, rawSales));
}

/**
 * Computes realistic daily pure album sales
 * Calibrated so successful albums achieve real-world industry debut volumes
 * (40k - 180k+ debut week pure sales) and maintain healthy catalog sales,
 * enabling superstar albums to achieve hundreds of thousands to 1M+ lifetime pure sales.
 */
export function calculateRebalancedAlbumSales(
  basePotential: number,
  artistPopularity: number,
  momentum: number,
  daysSinceRelease: number,
  organicVariance: number,
  artistHype: number = 20,
  isEP: boolean = false
): number {
  return calculateRealisticDailyAlbumSales(
    basePotential,
    artistPopularity,
    artistHype,
    momentum,
    daysSinceRelease,
    isEP,
    organicVariance
  );
}

/**
 * Calibrated Billboard single points converter
 * In official Billboard Hot 100 & Global 200 rules:
 * - 1 Pure Track Sale = 1.0 Unit (was previously 3.0, which made sales overpowered!)
 * - Streaming: 1 Unit ≈ 300 blended streams (SEA)
 * - Radio: 1 Unit ≈ 1,000 audience impressions (~0.35 weight per spin)
 */
export function calculateRebalancedBillboardPoints(
  weeklyStreams: number,
  weeklyPureSales: number,
  weeklyRadioPlays: number
): number {
  const streamingPoints = Math.round(weeklyStreams / 300);
  const salesPoints = Math.round(weeklyPureSales * 1.05); // 1.05x weighting (balanced and realistic)
  const radioPoints = Math.round(weeklyRadioPlays * 0.35);

  return Math.max(1, streamingPoints + salesPoints + radioPoints);
}

/**
 * Smooth, realistic decay curve for non-pitched songs
 * Guarantees that tracks without playlist pitches DO NOT collapse off a cliff from their debut.
 */
export function calculateOrganicNonPitchedRetentionMultiplier(
  daysSinceRelease: number,
  quality: number,
  hasPlaylistPitch: boolean
): number {
  if (hasPlaylistPitch) {
    return 1.0; // Pitched songs have playlist reach
  }

  // Quality factor: high quality songs have strong organic word-of-mouth
  const qFactor = 0.85 + (quality / 100) * 0.30; // 0.85x to 1.15x

  if (daysSinceRelease <= 1) {
    return 1.0; // Full debut
  } else if (daysSinceRelease <= 3) {
    return Math.max(0.85, 0.90 * qFactor); // 85% - 94% retention
  } else if (daysSinceRelease <= 7) {
    return Math.max(0.78, 0.84 * qFactor); // 78% - 88% retention
  } else if (daysSinceRelease <= 21) {
    return Math.max(0.70, 0.76 * qFactor); // 70% - 82% retention
  } else if (daysSinceRelease <= 45) {
    return Math.max(0.62, 0.68 * qFactor); // 62% - 75% retention
  } else {
    return Math.max(0.52, 0.58 * qFactor); // Healthy catalog floor: ~52% - 65% of launch
  }
}

/**
 * Natural week-over-week chart attrition for long-running #1 hits
 * Allows historic runs (like Ella Langley / Shaboozey / Lil Nas X) while introducing
 * natural weekly attrition (-6% to -14%) so competing songs can eventually challenge.
 */
export function calculateChartLongevityDecay(
  weeksOnChart: number,
  currentRank: number
): number {
  if (weeksOnChart <= 2) {
    return 1.0; // Peak honeymoon period
  }

  // Week 3-6: Gentle 4% - 6% weekly decay
  if (weeksOnChart <= 6) {
    return Math.max(0.82, 1.0 - (weeksOnChart - 2) * 0.045);
  }

  // Week 7+: Natural attrition (8% - 12% per week), stabilizing at 40% floor
  const extraWeeks = weeksOnChart - 6;
  return Math.max(0.40, 0.82 - (extraWeeks * 0.065));
}
