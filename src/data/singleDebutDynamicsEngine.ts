// Single Debut Dynamics & Release Proximity Cannibalization Engine
// Provides authentic, distinct debut stream velocity, release-day digital sales surge,
// premiere YouTube music video momentum, and realistic market cannibalization when
// multiple singles are dropped too close together.

import { Song } from '../types';

export interface SingleDebutProfile {
  debutStreamMultiplier: number;
  debutSalesMultiplier: number;
  debutYoutubeMultiplier: number;
  cannibalizationFactor: number;
  viralDebutRating: 'moderate' | 'solid' | 'smash' | 'viral_blockbuster';
  uniqueTrackFactor: number;
}

/**
 * Deterministic yet high-entropy hash combining song ID, title, genre, theme, and releaseDate
 * so no two singles ever share identical launch numbers.
 */
function getSingleTrackHash(song: Song): number {
  const seedStr = `${song.id}_${song.title}_${song.genre || ''}_${song.subgenre || ''}_${song.theme || ''}_${song.releaseDate || ''}_${Math.round((song.quality || 50) * 10)}`;
  let hash = (song.id * 2654435761) ^ 0x45d9f3b;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Evaluates market oversaturation & audience cannibalization when an artist drops singles
 * back-to-back within a short window, or anticipation bonus when spacing releases out.
 */
export function evaluateReleaseProximityFactor(
  currentSong: Song,
  allReleasedSongs?: Song[]
): {
  streamProximityFactor: number;
  salesWalletFactor: number;
  olderTrackSpotlightPenalty: number;
} {
  if (!allReleasedSongs || allReleasedSongs.length <= 1) {
    return {
      streamProximityFactor: 1.0,
      salesWalletFactor: 1.0,
      olderTrackSpotlightPenalty: 1.0
    };
  }

  const currentRelTime = currentSong.releaseDate ? new Date(currentSong.releaseDate).getTime() : 0;
  const currentAge = currentSong.daysSinceRelease ?? 0;

  let closestPriorDaysGap = 999;
  let sameDayStandaloneCount = 0;
  let newerReleaseDroppedAfterDays = 999;

  for (const other of allReleasedSongs) {
    if (other.id === currentSong.id || other.status !== 'released') continue;
    // Ignore album B-sides when checking standalone single cannibalization
    if (other.trackType === 'b_side' && currentSong.trackType === 'b_side') continue;

    const otherRelTime = other.releaseDate ? new Date(other.releaseDate).getTime() : 0;
    const otherAge = other.daysSinceRelease ?? 0;

    if (currentRelTime > 0 && otherRelTime > 0) {
      const diffDays = Math.round((currentRelTime - otherRelTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 0 && other.id < currentSong.id) {
        sameDayStandaloneCount += 1;
      } else if (diffDays > 0 && diffDays < closestPriorDaysGap) {
        closestPriorDaysGap = diffDays;
      } else if (diffDays < 0) {
        const newerGap = Math.abs(diffDays);
        if (newerGap < newerReleaseDroppedAfterDays) {
          newerReleaseDroppedAfterDays = newerGap;
        }
      }
    } else if (otherAge > currentAge) {
      const gap = otherAge - currentAge;
      if (gap < closestPriorDaysGap) closestPriorDaysGap = gap;
    } else if (otherAge < currentAge) {
      const newerGap = currentAge - otherAge;
      if (newerGap < newerReleaseDroppedAfterDays) newerReleaseDroppedAfterDays = newerGap;
    }
  }

  // 1. Debut & active run saturation if this song was dropped too soon after a previous release
  let streamProximityFactor = 1.0;
  let salesWalletFactor = 1.0;

  if (sameDayStandaloneCount > 0) {
    // Multiple standalone singles dropped on the exact same day split listener attention heavily
    streamProximityFactor = Math.max(0.45, Math.pow(0.68, sameDayStandaloneCount));
    salesWalletFactor = Math.max(0.40, Math.pow(0.62, sameDayStandaloneCount));
  } else if (closestPriorDaysGap <= 2) {
    // Dropped within 1-2 days of previous single: severe audience & playlist cannibalization
    streamProximityFactor = 0.58 + (closestPriorDaysGap * 0.04);
    salesWalletFactor = 0.52 + (closestPriorDaysGap * 0.04);
  } else if (closestPriorDaysGap <= 6) {
    // Dropped within 3-6 days: noticeable attention split
    streamProximityFactor = 0.68 + ((closestPriorDaysGap - 2) * 0.035);
    salesWalletFactor = 0.64 + ((closestPriorDaysGap - 2) * 0.04);
  } else if (closestPriorDaysGap <= 14) {
    // Dropped within 1-2 weeks: mild overlap
    streamProximityFactor = 0.84 + ((closestPriorDaysGap - 6) * 0.018);
    salesWalletFactor = 0.82 + ((closestPriorDaysGap - 6) * 0.02);
  } else if (closestPriorDaysGap >= 28 && closestPriorDaysGap < 900) {
    // Proper era spacing (4+ weeks): fan anticipation builds naturally
    const anticipation = Math.min(0.16, (closestPriorDaysGap - 28) * 0.0035);
    streamProximityFactor = 1.0 + anticipation;
    salesWalletFactor = 1.0 + anticipation * 1.1;
  }

  // 2. If the artist drops a NEWER single while this older single is still in its first 3 weeks,
  // this older single loses promotional spotlight faster
  let olderTrackSpotlightPenalty = 1.0;
  if (newerReleaseDroppedAfterDays <= 3 && currentAge <= 21) {
    olderTrackSpotlightPenalty = 0.66;
  } else if (newerReleaseDroppedAfterDays <= 7 && currentAge <= 21) {
    olderTrackSpotlightPenalty = 0.76;
  } else if (newerReleaseDroppedAfterDays <= 14 && currentAge <= 28) {
    olderTrackSpotlightPenalty = 0.86;
  }

  return {
    streamProximityFactor: Number(streamProximityFactor.toFixed(3)),
    salesWalletFactor: Number(salesWalletFactor.toFixed(3)),
    olderTrackSpotlightPenalty: Number(olderTrackSpotlightPenalty.toFixed(3))
  };
}

/**
 * Calculates distinct, dynamic debut characteristics for a released single.
 */
export function evaluateSingleDebutDynamics(params: {
  song: Song;
  daysSinceRelease: number;
  artistHype: number;
  artistPopularity: number;
  isLeadSingle: boolean;
  fans?: number;
  allReleasedSongs?: Song[];
}): SingleDebutProfile {
  const {
    song,
    daysSinceRelease,
    artistHype,
    artistPopularity,
    isLeadSingle,
    fans = 0,
    allReleasedSongs
  } = params;

  const quality = Math.max(1, song.quality || 50);
  const potential = Math.max(1, song.basePotential || 50);
  const hype = Math.max(0, Math.min(100, artistHype));
  const pop = Math.max(0, Math.min(100, artistPopularity));

  const trackHash = getSingleTrackHash(song);
  // Wide organic per-track public reception divergence (0.74 to 1.34)
  // Ensures two singles by the same artist never debut with identical cookie-cutter numbers!
  const uniqueTrackFactor = 0.74 + ((trackHash % 61) / 100);

  // Quality & potential synergy (continuous curve, no arbitrary caps)
  const qualitySynergy = Math.pow(quality / 60, 0.55) * Math.pow(Math.min(130, potential) / 60, 0.35);

  // Lead singles receive stronger editorial focus
  const leadPriorityBoost = isLeadSingle ? 1.18 : 1.0;

  // Collaboration boost on debut (dual fanbases unite on Day 1)
  const collabBoost = (song.collabId && song.collabId !== 'none') ? 1.22 : 1.0;

  // Release proximity / cannibalization check
  const proximity = evaluateReleaseProximityFactor(song, allReleasedSongs);
  const cannibalizationFactor = proximity.streamProximityFactor * proximity.olderTrackSpotlightPenalty;

  // Composite launch intensity
  const compositeLaunchStrength = (
    (uniqueTrackFactor * 0.42) +
    (qualitySynergy * 0.30) +
    (leadPriorityBoost * 0.13) +
    ((hype / 100) * 0.15)
  ) * collabBoost * proximity.streamProximityFactor;

  let viralDebutRating: 'moderate' | 'solid' | 'smash' | 'viral_blockbuster' = 'solid';
  if (compositeLaunchStrength >= 1.32) {
    viralDebutRating = 'viral_blockbuster';
  } else if (compositeLaunchStrength >= 1.10) {
    viralDebutRating = 'smash';
  } else if (compositeLaunchStrength < 0.90) {
    viralDebutRating = 'moderate';
  }

  // --- 1. STREAMING DEBUT MULTIPLIER (Front-loaded Day 1 Debut -> Natural Day 2-7 Cooldown) ---
  // Day 0 is the Day 1 premiere rush; Day 1 (Day 2 on charts) naturally cools down as curiosity streams settle.
  let debutStreamMultiplier = 1.0;
  if (daysSinceRelease === 0) {
    // Day 1 Debut Spike: Front-loaded launch rush
    debutStreamMultiplier = (1.38 + compositeLaunchStrength * 0.48) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease === 1) {
    // Day 2: Natural post-premiere cooldown (-20% to -32% from Day 1 peak)
    debutStreamMultiplier = (1.06 + compositeLaunchStrength * 0.24) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease === 2) {
    // Day 3: Settling into true daily listener velocity
    debutStreamMultiplier = (0.98 + compositeLaunchStrength * 0.14) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease <= 5) {
    // Days 4-6: Mid-week stabilization
    debutStreamMultiplier = (0.94 + compositeLaunchStrength * 0.08) * proximity.olderTrackSpotlightPenalty;
  } else {
    // Day 7+: Handed off completely to organic lifecycle & fanbase retention
    debutStreamMultiplier = 1.0 * proximity.olderTrackSpotlightPenalty;
  }

  // --- 2. DIGITAL PURE SALES DEBUT SURGE (Front-loaded Stan Rush on Day 1, Tapering Days 2-7) ---
  // Note: Fan loyalty and hype conversion are already applied in calculateOrganicDailySales,
  // so this multiplier provides a clean Day 1 pre-order/launch surge without exponential double-counting.
  const stanLaunchBoost = (0.92 + (hype / 100) * 0.28 + (pop / 100) * 0.18) * proximity.salesWalletFactor;

  let debutSalesMultiplier = 1.0;
  if (daysSinceRelease === 0) {
    // Day 1: Pre-order fulfillment & launch day buying rush
    debutSalesMultiplier = 1.48 * stanLaunchBoost * (isLeadSingle ? 1.14 : 1.05) * uniqueTrackFactor;
  } else if (daysSinceRelease === 1) {
    // Day 2: Post-debut sales cooldown as Day 1 pre-orders clear
    debutSalesMultiplier = 1.12 * stanLaunchBoost * uniqueTrackFactor;
  } else if (daysSinceRelease === 2) {
    debutSalesMultiplier = 0.96 * stanLaunchBoost * uniqueTrackFactor;
  } else if (daysSinceRelease <= 6) {
    // Days 4-7: Gradual taper through end of Week 1
    const dayTaper = Math.max(0.76, 0.92 - (daysSinceRelease - 2) * 0.04);
    debutSalesMultiplier = dayTaper * proximity.salesWalletFactor * uniqueTrackFactor;
  } else {
    debutSalesMultiplier = 0.72 * proximity.olderTrackSpotlightPenalty;
  }

  // --- 3. YOUTUBE MUSIC VIDEO PREMIERE VELOCITY (Balanced with NPC YouTube Engine) ---
  let debutYoutubeMultiplier = 1.0;
  if (daysSinceRelease === 0) {
    debutYoutubeMultiplier = (1.18 + compositeLaunchStrength * 0.20) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease === 1) {
    debutYoutubeMultiplier = (1.08 + compositeLaunchStrength * 0.14) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease === 2) {
    debutYoutubeMultiplier = (1.02 + compositeLaunchStrength * 0.10) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease <= 6) {
    debutYoutubeMultiplier = (0.96 + compositeLaunchStrength * 0.06) * proximity.olderTrackSpotlightPenalty;
  } else {
    debutYoutubeMultiplier = 0.88 * proximity.olderTrackSpotlightPenalty;
  }

  return {
    debutStreamMultiplier: Number(debutStreamMultiplier.toFixed(3)),
    debutSalesMultiplier: Number(debutSalesMultiplier.toFixed(3)),
    debutYoutubeMultiplier: Number(debutYoutubeMultiplier.toFixed(3)),
    cannibalizationFactor: Number(cannibalizationFactor.toFixed(3)),
    viralDebutRating,
    uniqueTrackFactor
  };
}

