// Realistic Music Industry Metrics Engine
// Calculates authentic DSP streaming, YouTube video views, radio airplay rotations,
// pure sales, and Billboard unit conversions grounded in real music industry standards.

import { Song, Project } from '../types';
import { getCountryMarketProfile, evaluateSongHitScope } from './countryMarketSystem';

export interface DailyMetricsBreakdown {
  streams: number;
  views: number;
  radioPlays: number;
  radioAudience: number;
  pureSales: number;
  revenue: number;
}

export interface RadioRotationStatus {
  tier: 'none' | 'indie_college' | 'regional_medium' | 'national_heavy' | 'power_rotation';
  label: string;
  dailySpins: number;
  dailyAudience: number;
}

/**
 * Calculates authentic radio rotation status based on artist popularity, hype,
 * song quality, and days since release (simulating real radio programmer pickup lag).
 */
export function calculateRadioAirplayRotation(
  song: Song,
  artistPopularity: number,
  artistHype: number,
  artistCountry: string,
  daysSinceRelease: number
): RadioRotationStatus {
  const profile = getCountryMarketProfile(artistCountry);
  const radioPropensity = profile.radioShare / 0.04;
  const quality = Math.max(1, song.quality || 1);
  const momentum = song.momentum || 1.0;

  // In real radio, stations test songs with callout research:
  // Week 1-2: adds (slow pickup)
  // Week 3-6: climb to peak rotation
  // Week 7+: hold or recurrent
  let radioCycleMultiplier = 1.0;
  if (daysSinceRelease <= 7) {
    radioCycleMultiplier = 0.25 + (daysSinceRelease * 0.08); // Initial radio testing phase
  } else if (daysSinceRelease <= 28) {
    radioCycleMultiplier = 0.8 + ((daysSinceRelease - 7) * 0.02); // Ramp-up
  } else if (daysSinceRelease <= 70) {
    radioCycleMultiplier = 1.25; // Peak rotation window
  } else {
    radioCycleMultiplier = Math.max(0.2, 1.25 - ((daysSinceRelease - 70) * 0.015)); // Gradual recurrent phase
  }

  const effectiveStarPower = artistPopularity + (artistHype * 0.25) + (quality * 0.2);

  // 1. Superstars on Power Rotation (CHR / Urban / Top 40)
  if (effectiveStarPower >= 55 && momentum >= 0.3) {
    const dailySpins = Math.round((1200 + (effectiveStarPower * 22) + (momentum * 600)) * radioCycleMultiplier * radioPropensity);
    const dailyAudience = Math.round(dailySpins * 6800); // ~8M - 25M daily audience impressions
    return {
      tier: 'power_rotation',
      label: 'Power Rotation (National Top 40)',
      dailySpins,
      dailyAudience
    };
  }

  // 2. Mainstream Heavy Rotation
  if (effectiveStarPower >= 30 && momentum >= 0.15) {
    const dailySpins = Math.round((450 + (effectiveStarPower * 14) + (momentum * 350)) * radioCycleMultiplier * radioPropensity);
    const dailyAudience = Math.round(dailySpins * 4200); // ~2M - 6M daily audience impressions
    return {
      tier: 'national_heavy',
      label: 'Heavy Rotation (National Commercial)',
      dailySpins,
      dailyAudience
    };
  }

  // 3. Regional Commercial / Medium Rotation
  if (effectiveStarPower >= 12 && momentum >= 0.08) {
    const dailySpins = Math.round((90 + (effectiveStarPower * 8) + (momentum * 120)) * radioCycleMultiplier * radioPropensity);
    const dailyAudience = Math.round(dailySpins * 2200); // ~250K - 1M daily audience impressions
    return {
      tier: 'regional_medium',
      label: 'Medium Rotation (Regional Commercial)',
      dailySpins,
      dailyAudience
    };
  }

  // 4. Indie / College / Community Stations for Rookies & Early Career
  if (effectiveStarPower >= 2 || (song.quality || 0) >= 30) {
    const dailySpins = Math.max(3, Math.round((8 + (effectiveStarPower * 1.8)) * radioCycleMultiplier * radioPropensity));
    const dailyAudience = Math.round(dailySpins * 850); // ~5K - 40K daily audience impressions
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
 * Computes authentic YouTube views velocity.
 * Incorporates:
 * - Premiere burst for the first 3 days
 * - Territory video consumption culture (IN, ID, BR, MX have much higher YouTube shares)
 * - MV Paid Ads campaigns
 * - Steady organic visual catalog views
 */
export function calculateYouTubeViewVelocity(
  song: Song,
  dailyStreams: number,
  artistCountry: string,
  daysSinceRelease: number,
  organicVariance: number,
  customPremiereMultiplier?: number
): { dailyViews: number; remainingAdDays: number } {
  if (!song.hasMV) {
    return { dailyViews: 0, remainingAdDays: 0 };
  }

  const profile = getCountryMarketProfile(artistCountry);
  // Clamped video consumption propensity so no territory inflates views unrealistically
  const videoPropensity = Math.max(0.80, Math.min(1.22, profile.youtubeShare / 0.30));

  // Balanced Premiere Multiplier (matches NPC YouTube premiere curve):
  // Day 0: ~1.38x (yields ~85% - 115% of daily audio streams on launch day)
  // Day 1: ~1.24x
  // Day 2-3: ~1.12x
  // Day 4-7: ~1.02x
  // Day 8+: ~0.82x - 0.92x (steady visual catalog ratio)
  let premiereMultiplier = customPremiereMultiplier
    ? Math.min(1.42, Math.max(0.75, customPremiereMultiplier))
    : 1.0;

  if (!customPremiereMultiplier) {
    if (daysSinceRelease === 0) {
      premiereMultiplier = 1.38;
    } else if (daysSinceRelease === 1) {
      premiereMultiplier = 1.24;
    } else if (daysSinceRelease <= 3) {
      premiereMultiplier = 1.12;
    } else if (daysSinceRelease <= 7) {
      premiereMultiplier = 1.02;
    } else if (daysSinceRelease <= 21) {
      premiereMultiplier = 0.90;
    } else {
      premiereMultiplier = 0.80;
    }
  }

  // In the real music industry, daily official MV views are typically ~58% - 82% of daily global Spotify streams
  let baseViews = dailyStreams * (0.64 * videoPropensity) * premiereMultiplier;

  // MV Ads Campaign (Google/YouTube Discovery Ads)
  let remainingAdDays = song.mvAdsDays || 0;
  if (remainingAdDays > 0) {
    const adDailyViews = (28000 + Math.floor(dailyStreams * 0.12)) * organicVariance;
    baseViews += adDailyViews;
    remainingAdDays -= 1;
  }

  const dailyViews = Math.max(25, Math.floor(baseViews * organicVariance));
  return { dailyViews, remainingAdDays };
}

/**
 * Computes realistic digital download / pure track sales
 * In modern era (2024-2026), pure sales are a fraction of streams (~0.08% - 0.25%)
 * plus extra stan buying in launch week.
 */
export function calculatePureSales(
  dailyStreams: number,
  artistPopularity: number,
  artistCountry: string,
  daysSinceRelease: number
): number {
  const profile = getCountryMarketProfile(artistCountry);
  const salesPropensity = profile.salesShare / 0.05;

  // Realistic buyer saturation decay:
  // Fans purchase the $1.29 download during release weeks; after week 2-3, sales drop
  // as the core audience already owns the file.
  let buyerCycleMultiplier = 1.0;
  if (daysSinceRelease <= 3) {
    buyerCycleMultiplier = 2.2; // Release weekend download rush
  } else if (daysSinceRelease <= 7) {
    buyerCycleMultiplier = 1.4;
  } else if (daysSinceRelease <= 14) {
    buyerCycleMultiplier = 0.85;
  } else if (daysSinceRelease <= 30) {
    buyerCycleMultiplier = 0.50;
  } else if (daysSinceRelease <= 60) {
    buyerCycleMultiplier = 0.28;
  } else {
    buyerCycleMultiplier = 0.15; // Stable catalog purchase baseline
  }

  const baseFraction = 0.00065 * salesPropensity * (1 + (artistPopularity * 0.005)) * buyerCycleMultiplier;
  return Math.max(0, Math.floor(dailyStreams * baseFraction));
}

/**
 * Calculates Billboard Hot 100 & Global 200 points breakdown
 * In real Billboard formulas:
 * 1 Single Unit / Point ≈
 * - 375 ad-supported / 150 paid streams (weighted average ~300)
 * - 1 Pure Track Download = 1.0 Unit (1.1 - 1.3 points weight in modern formula)
 * - 1 Radio Spin ≈ 0.25 - 0.4 points depending on audience
 */
export function convertToBillboardBreakdown(
  weeklyStreams: number,
  weeklyPureSales: number,
  weeklyRadioPlays: number
): { totalUnits: number; streamsSEA: number; pureSalesTEA: number; radioAirplay: number } {
  const streamsSEA = Math.round(weeklyStreams / 300);
  const pureSalesTEA = Math.round(weeklyPureSales * 1.25);
  const radioAirplay = Math.round(weeklyRadioPlays * 0.35);
  const totalUnits = Math.max(1, streamsSEA + pureSalesTEA + radioAirplay);

  return {
    totalUnits,
    streamsSEA,
    pureSalesTEA,
    radioAirplay
  };
}
