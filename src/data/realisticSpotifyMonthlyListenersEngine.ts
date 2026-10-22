// Realistic Spotify Monthly Listeners Engine
// Models the official Spotify 28-day rolling unique listener window.
// Ensures that massive daily streams (e.g. 22M/day) produce authentic superstar figures
// (65M - 95M monthly listeners, on par with The Weeknd, Taylor Swift, Billie Eilish)
// and NEVER absurd values like 200 Million!

export interface MonthlyListenerCalcParams {
  dailyStreams: number;
  popularity: number; // 0 - 100
  hype: number;       // 0 - 100
  followers: number;
  previousListeners?: number;
}

/**
 * Calculates authentic Spotify Monthly Listeners based on real-world music industry metrics.
 * 
 * Real-world benchmarks:
 * - World Record Peak on Spotify: ~120M - 125M (The Weeknd, Bruno Mars)
 * - Global Superstar Tier (Taylor Swift, Billie Eilish, Drake): 70M - 105M
 * - Mainstream Star (Sabrina Carpenter, Chappell Roan, Dua Lipa): 30M - 65M
 * - Mid-Tier Artist: 2M - 15M
 * - Emerging Act: 100K - 1.5M
 * - Rookie / Underground: 500 - 50K
 */
export function calculateRealisticMonthlyListeners(params: MonthlyListenerCalcParams): number {
  const { dailyStreams, popularity, hype, followers, previousListeners = 0 } = params;

  // 1. Estimated 28-day monthly stream volume:
  // A day's stream count reflects the active velocity.
  const estimatedMonthlyStreams = Math.max(0, dailyStreams * 28);

  // 2. Average streams per unique listener per month:
  // Casual listeners stream 3-4 tracks; loyal fanbases stream 7-11 tracks per month.
  // Higher popularity & hype increases repeat listening density per user.
  const repeatRate = 4.2 + (popularity / 100) * 3.8 + (hype / 100) * 1.5; // ~4.2x to 9.5x streams/user

  // 3. Raw listener pool from streaming volume:
  const streamDerivedListeners = estimatedMonthlyStreams > 0 
    ? Math.round(estimatedMonthlyStreams / repeatRate) 
    : 0;

  // 4. Baseline organic catalog presence based on existing followers & career popularity:
  // Even during a slow release lull, artists maintain passive catalog listeners (passive playlisting, favorites).
  const popFactor = Math.pow(Math.max(1, popularity) / 100, 2.2);
  const baselineCatalogListeners = Math.round(popFactor * 42000000) + Math.round(followers * 0.28) + 150;

  // 5. Target Monthly Listeners (blended active + baseline):
  const rawTarget = Math.max(baselineCatalogListeners, streamDerivedListeners);

  // 6. Enforce realistic tier boundaries and Spotify historical world ceilings:
  let boundedTarget = rawTarget;
  if (popularity <= 15) {
    boundedTarget = Math.min(boundedTarget, 35000);
  } else if (popularity <= 30) {
    boundedTarget = Math.min(boundedTarget, 850000);
  } else if (popularity <= 50) {
    boundedTarget = Math.min(boundedTarget, 6500000);
  } else if (popularity <= 70) {
    boundedTarget = Math.min(boundedTarget, 28000000);
  } else if (popularity <= 85) {
    boundedTarget = Math.min(boundedTarget, 65000000);
  } else {
    // Absolute world ceiling: No human has ever exceeded 125,000,000 on Spotify
    boundedTarget = Math.min(boundedTarget, 118000000);
  }

  // Minimum floor
  boundedTarget = Math.max(120, boundedTarget);

  // 7. Smooth 28-day moving average transition:
  // If previousListeners exists, smoothly adjust by ~12%-20% per day so numbers don't jump wildly overnight.
  if (previousListeners > 0) {
    const delta = boundedTarget - previousListeners;
    const smoothRate = delta > 0 ? 0.20 : 0.08; // Rises faster during release surges, decays slowly
    return Math.round(previousListeners + delta * smoothRate);
  }

  return boundedTarget;
}
