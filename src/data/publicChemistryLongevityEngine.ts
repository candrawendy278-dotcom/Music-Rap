// Public Chemistry, Market Trend Alignment & Post-Debut Chart Longevity Engine
//
// Operates invisibly behind the scenes (no UI spoilers) to give every released track
// a distinct post-debut chart life (Front-Loaded Flop, Underperform/Biasa, Normal,
// Solid Hit, Sleeper Hit, or Cultural Mega Hit) without altering Day 1 (daysSinceRelease === 0) debut numbers.

import { Song } from '../types';

export type PublicChemistryTier =
  | 'front_loaded_flop'
  | 'underperform'
  | 'normal'
  | 'solid_hit'
  | 'sleeper_hit'
  | 'mega_hit';

export interface PublicChemistryEvaluation {
  tier: PublicChemistryTier;
  compositeChemistryScore: number;
  qualitySynergyScore: number;
  marketTrendScore: number;
  organicSurpriseScore: number;
  postDebutStreamMultiplier: number;
  postDebutFloorMultiplier: number;
  maxDailyDropAllowance: number;
}

/**
 * High-entropy deterministic hash per song so a track's Public Chemistry profile
 * remains 100% consistent across every daily tick without requiring save schema migrations.
 */
function getPublicChemistryHash(song: Song, salt = 0): number {
  const str = `${song.id}_${song.title || ''}_${song.genre || ''}_${song.subgenre || ''}_${song.theme || ''}_${song.meaning || ''}_${song.releaseDate || ''}_${salt}`;
  let h = (song.id * 1664525 + 1013904223) ^ (salt * 0x9e3779b9);
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
  }
  return Math.abs(h ^ (h >>> 16));
}

/**
 * Evaluates Pillar 1: Song Quality & Studio Creative Synergy (0.55 to 1.38)
 */
function evaluateQualityAndStudioSynergy(song: Song): number {
  const quality = Math.max(1, Math.min(100, song.quality || 55));
  const potential = Math.max(1, Math.min(130, song.basePotential || 55));

  // Base quality & potential curve
  const baseCraft = (quality / 100) * 0.72 + (Math.min(100, potential) / 100) * 0.28;

  const genre = (song.genre || 'pop').toLowerCase();
  const theme = (song.theme || '').toLowerCase();
  const meaning = (song.meaning || '').toLowerCase();
  const recStyle = (song.recordingStyle || '').toLowerCase();
  const vocalFocus = (song.vocalFocus || '').toLowerCase();

  let studioHarmony = 1.0;

  // High-replayability earworm alignment
  if (
    (genre.includes('pop') || genre.includes('dance') || genre.includes('hip-hop') || genre.includes('r&b')) &&
    (meaning.includes('catchy') || meaning.includes('earworm') || theme.includes('party') || theme.includes('romance'))
  ) {
    studioHarmony += 0.12;
  }

  // Emotional resonance alignment
  if (
    (theme.includes('heartbreak') || theme.includes('introspection') || theme.includes('romance')) &&
    (meaning.includes('raw') || meaning.includes('honesty') || meaning.includes('authenticity') || recStyle.includes('melodic'))
  ) {
    studioHarmony += 0.11;
  }

  // Sonic polish & vocal match
  if (vocalFocus.includes('clean') || vocalFocus.includes('warm') || vocalFocus.includes('commercial')) {
    studioHarmony += 0.05;
  }

  // Clashing studio concepts (e.g., club party theme with heavy existential poetry)
  if (
    (theme.includes('party') || theme.includes('club')) &&
    (meaning.includes('existential') || meaning.includes('metaphorical'))
  ) {
    studioHarmony -= 0.14;
  }

  return Math.max(0.52, Math.min(1.38, (0.52 + baseCraft * 0.68) * studioHarmony));
}

/**
 * Evaluates Pillar 2: Dynamic Market Trend Alignment at the time of release (0.55 to 1.38)
 * Simulates shifting public appetite across calendar months and yearly sonic cycles.
 */
function evaluateMarketTrendAlignment(song: Song): number {
  const relDate = song.releaseDate ? new Date(song.releaseDate) : new Date(2025, 5, 15);
  const month = isNaN(relDate.getMonth()) ? 5 : relDate.getMonth(); // 0..11
  const year = isNaN(relDate.getFullYear()) ? 2025 : relDate.getFullYear();

  const genre = (song.genre || 'pop').toLowerCase();
  const subgenre = (song.subgenre || '').toLowerCase();
  const theme = (song.theme || '').toLowerCase();
  const meaning = (song.meaning || '').toLowerCase();

  // Rotating market cycle index (shifts every 2 months so market trends feel alive)
  const biMonthlyCycle = (year * 6 + Math.floor(month / 2)) % 6;

  let trendFit = 0.92;

  // Seasonal appetite waves
  const isSummer = month >= 4 && month <= 7; // May - Aug: upbeat, summer anthems, club, pop, dance, energetic hip-hop
  const isAutumnWinter = month >= 8 || month <= 1; // Sep - Feb: emotional, heartbreak, R&B, storytelling, melodic
  const isSpring = month >= 2 && month <= 3; // Mar - Apr: fresh crossover, rhythmic, experimental

  if (isSummer) {
    if (
      genre.includes('pop') ||
      genre.includes('dance') ||
      genre.includes('electronic') ||
      theme.includes('party') ||
      theme.includes('summer') ||
      meaning.includes('catchy') ||
      meaning.includes('earworm')
    ) {
      trendFit += 0.18;
    } else if (theme.includes('introspection') && meaning.includes('existential')) {
      trendFit -= 0.12;
    }
  } else if (isAutumnWinter) {
    if (
      genre.includes('r&b') ||
      genre.includes('soul') ||
      genre.includes('indie') ||
      genre.includes('pop') ||
      theme.includes('heartbreak') ||
      theme.includes('romance') ||
      theme.includes('introspection') ||
      meaning.includes('raw') ||
      meaning.includes('narrative')
    ) {
      trendFit += 0.18;
    }
  } else if (isSpring) {
    if (
      genre.includes('hip-hop') ||
      genre.includes('rap') ||
      genre.includes('pop') ||
      genre.includes('latin') ||
      theme.includes('hustle') ||
      theme.includes('luxury')
    ) {
      trendFit += 0.16;
    }
  }

  // Bi-monthly micro-trend resonance (simulates viral TikTok / DSP subgenre waves)
  const songTrendBucket = getPublicChemistryHash(song, 77) % 6;
  const cycleDistance = Math.abs(biMonthlyCycle - songTrendBucket);
  if (cycleDistance === 0) {
    trendFit += 0.22; // Direct bullseye on current viral market wave
  } else if (cycleDistance === 1 || cycleDistance === 5) {
    trendFit += 0.09; // Adjacent to current market wave
  } else if (cycleDistance === 3) {
    trendFit -= 0.16; // Market fatigue / out-of-cycle sound
  }

  // Subgenre freshness bonus
  if (subgenre && subgenre.length > 2) {
    trendFit += 0.04;
  }

  return Math.max(0.55, Math.min(1.38, trendFit));
}

/**
 * Evaluates Pillar 3: Organic Surprise Factor (0.50 to 1.45)
 * Captures the unpredictable magic of the music industry where a song can unexpectedly
 * underperform with the general public or explode into a cultural phenomenon.
 */
function evaluateOrganicSurpriseFactor(song: Song): {
  surpriseScore: number;
  rawPercentile: number;
  sleeperTriggerRoll: number;
} {
  const h1 = getPublicChemistryHash(song, 101);
  const h2 = getPublicChemistryHash(song, 202);
  const h3 = getPublicChemistryHash(song, 303);

  // Triangular distribution centered near 0.50 with realistic tails toward 0.0 and 1.0
  const u1 = (h1 % 10000) / 10000;
  const u2 = (h2 % 10000) / 10000;
  const centeredRoll = u1 * 0.62 + u2 * 0.38; // 0.0 to 1.0

  const sleeperTriggerRoll = (h3 % 1000) / 1000;

  let surpriseScore = 0.55 + centeredRoll * 0.85; // 0.55 to 1.40

  // Rare extreme outlier tails (5% chance of lightning-in-a-bottle viral surge, 6% chance of unexpected public apathy)
  if (u1 >= 0.94) {
    surpriseScore = 1.38 + (u2 * 0.10);
  } else if (u1 <= 0.06) {
    surpriseScore = 0.50 + (u2 * 0.12);
  }

  return {
    surpriseScore: Math.max(0.50, Math.min(1.48, surpriseScore)),
    rawPercentile: centeredRoll,
    sleeperTriggerRoll
  };
}

/**
 * Main evaluator: Computes the invisible Public Chemistry tier and post-debut trajectory multiplier
 * for any released track.
 *
 * CRITICAL GUARANTEE:
 * When daysSinceRelease === 0 (Debut Day 1), postDebutStreamMultiplier is strictly 1.0
 * so Day 1 debut numbers are NEVER altered.
 */
export function evaluateSongPublicChemistry(params: {
  song: Song;
  daysSinceRelease: number;
  isSingle: boolean;
}): PublicChemistryEvaluation {
  const { song, daysSinceRelease, isSingle } = params;

  const qualitySynergyScore = evaluateQualityAndStudioSynergy(song);
  const marketTrendScore = evaluateMarketTrendAlignment(song);
  const { surpriseScore, rawPercentile, sleeperTriggerRoll } = evaluateOrganicSurpriseFactor(song);

  // Weighted composite: 40% Quality & Synergy, 30% Market Trend Alignment, 30% Organic Surprise
  const compositeChemistryScore =
    qualitySynergyScore * 0.40 +
    marketTrendScore * 0.30 +
    surpriseScore * 0.30;

  // Determine the invisible Public Chemistry Tier
  let tier: PublicChemistryTier = 'normal';

  if (compositeChemistryScore >= 1.17 || (compositeChemistryScore >= 1.11 && rawPercentile >= 0.84)) {
    tier = 'mega_hit';
  } else if (
    isSingle &&
    compositeChemistryScore >= 0.96 &&
    compositeChemistryScore < 1.17 &&
    sleeperTriggerRoll >= 0.76
  ) {
    // Sleeper Hit: solid quality/trend foundation that catches a delayed viral wave in Week 2-3
    tier = 'sleeper_hit';
  } else if (compositeChemistryScore >= 1.04) {
    tier = 'solid_hit';
  } else if (compositeChemistryScore <= 0.79 || (rawPercentile <= 0.11 && compositeChemistryScore < 0.95)) {
    tier = 'front_loaded_flop';
  } else if (compositeChemistryScore <= 0.90) {
    tier = 'underperform';
  } else {
    tier = 'normal';
  }

  // CRITICAL: Day 1 Debut (daysSinceRelease === 0) is strictly 1.0x!
  // The artist's fanbase, hype, and promotion fully dictate Day 1.
  if (daysSinceRelease <= 0) {
    return {
      tier,
      compositeChemistryScore: Number(compositeChemistryScore.toFixed(3)),
      qualitySynergyScore: Number(qualitySynergyScore.toFixed(3)),
      marketTrendScore: Number(marketTrendScore.toFixed(3)),
      organicSurpriseScore: Number(surpriseScore.toFixed(3)),
      postDebutStreamMultiplier: 1.0,
      postDebutFloorMultiplier: 1.0,
      maxDailyDropAllowance: 0.25
    };
  }

  // Calculate post-debut trajectory multiplier for daysSinceRelease >= 1
  let postDebutStreamMultiplier = 1.0;
  let postDebutFloorMultiplier = 0.85;
  let maxDailyDropAllowance = 0.16;

  switch (tier) {
    case 'front_loaded_flop': {
      // Fanbase checked it out on Day 1, but GP quickly drops it.
      // Steep drop across Days 2-14 and fast chart exit.
      if (daysSinceRelease === 1) {
        postDebutStreamMultiplier = 0.76;
      } else if (daysSinceRelease <= 3) {
        postDebutStreamMultiplier = 0.58 - (daysSinceRelease - 2) * 0.08; // 0.58 -> 0.50
      } else if (daysSinceRelease <= 7) {
        postDebutStreamMultiplier = 0.44 - ((daysSinceRelease - 4) / 3) * 0.12; // 0.44 -> 0.32
      } else if (daysSinceRelease <= 14) {
        const w2Progress = (daysSinceRelease - 7) / 7;
        postDebutStreamMultiplier = 0.32 - w2Progress * 0.14; // 0.32 -> 0.18
      } else if (daysSinceRelease <= 28) {
        const w3Progress = (daysSinceRelease - 14) / 14;
        postDebutStreamMultiplier = 0.18 - w3Progress * 0.06; // 0.18 -> 0.12
      } else {
        postDebutStreamMultiplier = 0.10;
      }
      postDebutFloorMultiplier = 0.18;
      maxDailyDropAllowance = 0.34; // Allows authentic steep daily chart drops
      break;
    }

    case 'underperform': {
      // Lukewarm reception ("Biasa"): holds okay for a few days, then fades faster in Weeks 2-4
      if (daysSinceRelease <= 3) {
        postDebutStreamMultiplier = 0.88 - (daysSinceRelease - 1) * 0.05; // 0.88 -> 0.78
      } else if (daysSinceRelease <= 7) {
        postDebutStreamMultiplier = 0.74 - ((daysSinceRelease - 4) / 3) * 0.10; // 0.74 -> 0.64
      } else if (daysSinceRelease <= 21) {
        const progress = (daysSinceRelease - 7) / 14;
        postDebutStreamMultiplier = 0.62 - progress * 0.20; // 0.62 -> 0.42
      } else if (daysSinceRelease <= 45) {
        const progress = (daysSinceRelease - 21) / 24;
        postDebutStreamMultiplier = 0.42 - progress * 0.10; // 0.42 -> 0.32
      } else {
        postDebutStreamMultiplier = 0.28;
      }
      postDebutFloorMultiplier = 0.42;
      maxDailyDropAllowance = 0.24;
      break;
    }

    case 'normal': {
      // Standard healthy release lifecycle
      if (daysSinceRelease <= 7) {
        postDebutStreamMultiplier = 0.96;
      } else if (daysSinceRelease <= 28) {
        postDebutStreamMultiplier = 0.92;
      } else {
        postDebutStreamMultiplier = 0.88;
      }
      postDebutFloorMultiplier = 0.82;
      maxDailyDropAllowance = 0.16;
      break;
    }

    case 'solid_hit': {
      // Strong public replay value: resists post-debut decay and holds well for 6-10 weeks
      if (daysSinceRelease <= 6) {
        postDebutStreamMultiplier = 1.04 + (daysSinceRelease / 6) * 0.08; // 1.04 -> 1.12
      } else if (daysSinceRelease <= 35) {
        const holdWave = Math.sin(((daysSinceRelease - 6) / 29) * Math.PI) * 0.10;
        postDebutStreamMultiplier = 1.16 + holdWave; // 1.16 -> 1.26 -> 1.16
      } else if (daysSinceRelease <= 75) {
        const progress = (daysSinceRelease - 35) / 40;
        postDebutStreamMultiplier = 1.16 - progress * 0.12; // 1.16 -> 1.04
      } else {
        postDebutStreamMultiplier = 1.04;
      }
      postDebutFloorMultiplier = 1.15;
      maxDailyDropAllowance = 0.10;
      break;
    }

    case 'sleeper_hit': {
      // Normal start on Days 1-5, then catches a viral algorithmic/word-of-mouth wave in Days 7-25!
      if (daysSinceRelease <= 4) {
        postDebutStreamMultiplier = 0.92 - (daysSinceRelease - 1) * 0.02; // 0.92 -> 0.86
      } else if (daysSinceRelease <= 22) {
        // Viral climb phase: surges upward through Week 2 and Week 3
        const climbProgress = (daysSinceRelease - 4) / 18;
        const surgeCurve = Math.sin(climbProgress * (Math.PI * 0.75));
        postDebutStreamMultiplier = 0.90 + surgeCurve * 0.68; // climbs up to ~1.58x!
      } else if (daysSinceRelease <= 60) {
        // Extended post-viral residency
        const progress = (daysSinceRelease - 22) / 38;
        postDebutStreamMultiplier = 1.48 - progress * 0.30; // 1.48 -> 1.18
      } else {
        postDebutStreamMultiplier = 1.14;
      }
      postDebutFloorMultiplier = 1.25;
      maxDailyDropAllowance = 0.09;
      break;
    }

    case 'mega_hit': {
      // Cultural phenomenon: rock-solid Week 1 hold, multi-week peak residency, massive catalog longevity
      if (daysSinceRelease <= 6) {
        // Holds near or slightly above debut baseline as GP joins the fanbase
        postDebutStreamMultiplier = 1.08 + Math.sin((daysSinceRelease / 6) * Math.PI) * 0.14;
      } else if (daysSinceRelease <= 45) {
        // Dominant multi-week chart reign
        const reignWave = Math.sin(((daysSinceRelease - 6) / 39) * Math.PI) * 0.22;
        postDebutStreamMultiplier = 1.28 + reignWave; // 1.28 -> 1.50 -> 1.28
      } else if (daysSinceRelease <= 100) {
        const progress = (daysSinceRelease - 45) / 55;
        postDebutStreamMultiplier = 1.28 - progress * 0.16; // 1.28 -> 1.12
      } else {
        postDebutStreamMultiplier = 1.12;
      }
      postDebutFloorMultiplier = 1.42;
      maxDailyDropAllowance = 0.07;
      break;
    }
  }

  // Album B-sides have a slightly gentler version of the multiplier so album tracks remain cohesive
  if (!isSingle && daysSinceRelease >= 1) {
    postDebutStreamMultiplier = 1.0 + (postDebutStreamMultiplier - 1.0) * 0.72;
  }

  return {
    tier,
    compositeChemistryScore: Number(compositeChemistryScore.toFixed(3)),
    qualitySynergyScore: Number(qualitySynergyScore.toFixed(3)),
    marketTrendScore: Number(marketTrendScore.toFixed(3)),
    organicSurpriseScore: Number(surpriseScore.toFixed(3)),
    postDebutStreamMultiplier: Number(postDebutStreamMultiplier.toFixed(4)),
    postDebutFloorMultiplier: Number(postDebutFloorMultiplier.toFixed(3)),
    maxDailyDropAllowance: Number(maxDailyDropAllowance.toFixed(3))
  };
}
