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
  // Wide organic per-track public reception divergence (0.48 to 1.34)
  // Prevents high-skill player or roster tracks from going viral on every single release!
  const uniqueTrackFactor = 0.48 + ((trackHash % 87) / 100);

  // Normalized around 78 so high quality helps without guaranteeing a viral smash every time
  const qualitySynergy = Math.pow(quality / 78, 0.45) * Math.pow(Math.min(130, potential) / 78, 0.30);

  // Lead singles receive stronger editorial focus
  const leadPriorityBoost = isLeadSingle ? 1.15 : 1.0;

  // Collaboration modifier on debut (chemistry-dependent: forced features can underperform, strong synergy gives a modest lift)
  const hasCollab = Boolean(song.collabId && song.collabId !== 'none');
  const collabBoost = hasCollab
    ? (uniqueTrackFactor < 0.82 || quality < 62 ? 0.92 : uniqueTrackFactor >= 1.15 && quality >= 78 ? 1.08 : 1.02)
    : 1.0;

  // Release proximity / cannibalization check
  const proximity = evaluateReleaseProximityFactor(song, allReleasedSongs);
  const cannibalizationFactor = proximity.streamProximityFactor * proximity.olderTrackSpotlightPenalty;

  // Composite launch intensity
  const compositeLaunchStrength = (
    (uniqueTrackFactor * 0.48) +
    (qualitySynergy * 0.24) +
    (leadPriorityBoost * 0.13) +
    ((hype / 100) * 0.15)
  ) * collabBoost * proximity.streamProximityFactor;

  let viralDebutRating: 'moderate' | 'solid' | 'smash' | 'viral_blockbuster' = 'solid';
  if (compositeLaunchStrength >= 1.18) {
    viralDebutRating = 'viral_blockbuster';
  } else if (compositeLaunchStrength >= 1.02) {
    viralDebutRating = 'smash';
  } else if (compositeLaunchStrength < 0.86) {
    viralDebutRating = 'moderate';
  }

  // --- 1. STREAMING DEBUT MULTIPLIER (Front-loaded Day 1 Debut -> Natural Day 2-7 Cooldown) ---
  // Tracks that miss public reception (compositeLaunchStrength < 0.84) experience a noticeably softer debut and faster drop.
  const isLukewarmOrFlop = compositeLaunchStrength < 0.84;
  let debutStreamMultiplier = 1.0;
  if (daysSinceRelease === 0) {
    // Day 1 Debut Spike: Viral hits surge; lukewarm/flop singles underperform expectations
    debutStreamMultiplier = (isLukewarmOrFlop
      ? 0.64 + compositeLaunchStrength * 0.38
      : 1.18 + compositeLaunchStrength * 0.46) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease === 1) {
    // Day 2: Natural post-premiere cooldown
    debutStreamMultiplier = (isLukewarmOrFlop
      ? 0.52 + compositeLaunchStrength * 0.25
      : 0.96 + compositeLaunchStrength * 0.24) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease === 2) {
    // Day 3: Settling into true daily listener velocity
    debutStreamMultiplier = (isLukewarmOrFlop
      ? 0.48 + compositeLaunchStrength * 0.20
      : 0.90 + compositeLaunchStrength * 0.16) * proximity.olderTrackSpotlightPenalty;
  } else if (daysSinceRelease <= 5) {
    // Days 4-6: Mid-week stabilization
    debutStreamMultiplier = (isLukewarmOrFlop
      ? 0.45 + compositeLaunchStrength * 0.16
      : 0.88 + compositeLaunchStrength * 0.10) * proximity.olderTrackSpotlightPenalty;
  } else {
    // Day 7+: Handed off completely to organic lifecycle & fanbase retention
    debutStreamMultiplier = (isLukewarmOrFlop ? 0.78 : 1.0) * proximity.olderTrackSpotlightPenalty;
  }

  // --- 2. DIGITAL PURE SALES DEBUT SURGE (Front-loaded Stan Rush on Day 1, Tapering Days 2-7) ---
  const stanLaunchBoost = (0.94 + (hype / 100) * 0.34 + (pop / 100) * 0.22) * proximity.salesWalletFactor;
  const receptionSalesFactor = isLukewarmOrFlop
    ? Math.max(0.45, uniqueTrackFactor * 0.78)
    : compositeLaunchStrength >= 1.15
    ? uniqueTrackFactor * 1.22
    : uniqueTrackFactor * 1.04;

  let debutSalesMultiplier = 1.0;
  if (daysSinceRelease === 0) {
    // Day 1: Pre-order fulfillment & launch day buying rush
    debutSalesMultiplier = 1.62 * stanLaunchBoost * (isLeadSingle ? 1.18 : 1.06) * receptionSalesFactor;
  } else if (daysSinceRelease === 1) {
    // Day 2: Post-debut sales cooldown as Day 1 pre-orders clear
    debutSalesMultiplier = 1.18 * stanLaunchBoost * receptionSalesFactor;
  } else if (daysSinceRelease === 2) {
    debutSalesMultiplier = 0.98 * stanLaunchBoost * receptionSalesFactor;
  } else if (daysSinceRelease <= 6) {
    // Days 4-7: Gradual taper through end of Week 1
    const dayTaper = Math.max(0.74, 0.92 - (daysSinceRelease - 2) * 0.04);
    debutSalesMultiplier = dayTaper * proximity.salesWalletFactor * receptionSalesFactor;
  } else {
    debutSalesMultiplier = 0.74 * proximity.olderTrackSpotlightPenalty * (isLukewarmOrFlop ? 0.68 : 1.0);
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

