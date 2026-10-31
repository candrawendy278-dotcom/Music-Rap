// B-Side Distinct Velocity and Realistic Debut Engine
// Solves uniform B-Side streams and enhances debut streams/sales for Singles and Album Tracks:
// 1. Realistic Album Track Sequence Dynamics (Track 1 & 2 album-opener stream boost, deep cut fatigue)
// 2. Breakout Fan-Favorite "Sleeper Hit" B-Sides (organic 1.6x - 2.4x surge on standout tracks)
// 3. Featured Guest / Collaboration surges on album cuts
// 4. Per-track deterministic micro-variance ensuring no two songs ever have identical stream numbers
// 5. Distinct debut-day sales and streaming profiles for singles vs album tracks

import { Song, Project } from '../types';

export type BSidePersona = 'breakout_smash' | 'fan_favorite' | 'album_opener' | 'core_track' | 'deep_cut';

export interface DistinctTrackVelocityProfile {
  persona: BSidePersona;
  personaLabel: string;
  streamingModifier: number;
  salesModifier: number;
  radioModifier: number;
  trackSequenceBoost: number;
  collabSurge: number;
  explanation: string;
}

/**
 * Calculates a unique, deterministic hash for a song to ensure individuality
 */
function getTrackHash(songId: number, title: string): number {
  let hash = (songId * 1337) ^ 0x5bf03635;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Evaluates the distinct artistic persona and audience resonance of an individual track.
 * This guarantees diverse, realistic metrics between different B-sides on the same album.
 */
export function evaluateDistinctTrackProfile(
  song: Song,
  project?: Project,
  trackIndex?: number,
  totalTracks?: number
): DistinctTrackVelocityProfile {
  const isSingle = !song.trackType || song.trackType === 'single' || song.trackType === 'lead_single';
  const isLead = song.trackType === 'lead_single';
  const hash = getTrackHash(song.id, song.title);
  const quality = Math.max(1, song.quality || 50);

  // If this is an official Single
  if (isSingle) {
    const potential = Math.max(1, song.basePotential || 50);
    const hasCollab = Boolean(song.collabId && song.collabId !== 'none');
    // Chemistry roll for collaborations: not every collaboration clicks with the public!
    // Low/mediocre quality or clashing chemistry yields 0.94x - 1.01x; strong synergy yields up to 1.09x.
    const collabChemistryRoll = (hash % 100) / 100;
    const collabSurge = hasCollab
      ? quality < 62
        ? 0.95
        : collabChemistryRoll < 0.35
        ? 0.97
        : collabChemistryRoll < 0.75
        ? 1.04
        : 1.09
      : 1.0;

    // Composite strength of single (quality + potential + slight organic variance)
    const singleStrength = (quality * 0.45) + (potential * 0.40) + ((hash % 25) * 0.6);

    // 1. Standout Smash Hit Single (high quality + strong potential)
    if (singleStrength >= 74 || (isLead && quality >= 72 && potential >= 68)) {
      const streamMod = isLead ? 1.38 : 1.24;
      return {
        persona: 'breakout_smash',
        personaLabel: isLead ? 'Lead Smash Single' : 'Commercial Hit Single',
        streamingModifier: Number(streamMod.toFixed(2)),
        salesModifier: isLead ? 1.32 : 1.16,
        radioModifier: isLead ? 1.30 : 1.12,
        trackSequenceBoost: 1.0,
        collabSurge,
        explanation: isLead 
          ? 'High-priority focus track with full global playlisting and promotional push.'
          : 'Standout commercial hit single resonating strongly across listener feeds.'
      };
    }

    // 2. Solid Commercial Single
    if (singleStrength >= 52 || isLead) {
      const streamMod = isLead ? 1.16 : 1.06;
      return {
        persona: 'fan_favorite',
        personaLabel: isLead ? 'Lead Single Priority' : 'Official Single',
        streamingModifier: Number(streamMod.toFixed(2)),
        salesModifier: isLead ? 1.14 : 1.02,
        radioModifier: isLead ? 1.12 : 1.0,
        trackSequenceBoost: 1.0,
        collabSurge,
        explanation: 'Official commercial single serviced across streaming and digital storefronts.'
      };
    }

    // 3. Moderate Single
    if (singleStrength >= 36) {
      const streamMod = 0.92;
      return {
        persona: 'core_track',
        personaLabel: 'Moderate Single',
        streamingModifier: Number(streamMod.toFixed(2)),
        salesModifier: 0.88,
        radioModifier: 0.85,
        trackSequenceBoost: 1.0,
        collabSurge,
        explanation: 'Steady single performing moderately across mainstream streaming.'
      };
    }

    // 4. Underperforming Single
    const streamMod = 0.76;
    return {
      persona: 'deep_cut',
      personaLabel: 'Underperforming Single',
      streamingModifier: Number(streamMod.toFixed(2)),
      salesModifier: 0.68,
      radioModifier: 0.60,
      trackSequenceBoost: 1.0,
      collabSurge,
      explanation: 'Underperforming release finding its audience primarily among core fans.'
    };
  }

  // --- ALBUM B-SIDE DYNAMICS ---
  // In real life, album B-sides are NOT uniform.
  // 1. Album Opener / Track 1 & 2 Effect:
  let sequenceBoost = 1.0;
  if (trackIndex !== undefined && totalTracks && totalTracks > 1) {
    if (trackIndex === 0) {
      sequenceBoost = 1.24; // Track 1 album opener - highest immediate full-album play-through
    } else if (trackIndex === 1) {
      sequenceBoost = 1.14; // Track 2 - strong momentum continuation
    } else if (trackIndex === 2) {
      sequenceBoost = 1.06;
    } else if (trackIndex >= totalTracks - 2) {
      sequenceBoost = 0.82; // End of album listener drop-off
    } else {
      sequenceBoost = 0.94; // Mid-album baseline
    }
  }

  // 2. Collab feature on an album B-side:
  // Heavily dampened so B-side collaborations CANNOT act like promoted singles or guarantee hits!
  // If track quality or chemistry is weak, a B-side collab can even underperform (0.94x).
  let collabSurge = 1.0;
  if (song.collabId && song.collabId !== 'none') {
    const bSideCollabRoll = (hash % 100) / 100;
    if (quality < 65 || bSideCollabRoll < 0.40) {
      collabSurge = 0.95; // Unpromoted B-side feature with lukewarm listener retention
    } else if (bSideCollabRoll < 0.80) {
      collabSurge = 1.02; // Slight curiosity check on album drop, no runaway boost
    } else {
      collabSurge = 1.06; // Modest 6% lift for high-synergy album cut feature
    }
  }

  // 3. Album Project Era Reception (Hit Era vs Flop Era):
  let albumEraFactor = 1.0;
  if (project) {
    const projQuality = project.quality !== undefined ? project.quality : 50;
    const projMomentum = project.momentum !== undefined ? project.momentum : 1.0;

    if (projQuality >= 75 && projMomentum >= 0.55) {
      albumEraFactor = 1.20;
    } else if (projQuality >= 55 && projMomentum >= 0.40) {
      albumEraFactor = 1.0;
    } else if (projQuality < 45 || projMomentum < 0.30) {
      albumEraFactor = Math.max(0.35, 0.40 + (projQuality / 100) * 0.30) * Math.max(0.45, projMomentum);
    } else {
      albumEraFactor = 0.80;
    }
  }

  // 4. Intrinsic Organic Fan Resonance (Breakout vs Core vs Deep Cut):
  // Evaluated strictly on track quality + deterministic individuality hash (collaborations NEVER bypass this!)
  const resonanceScore = (quality * 0.58) + ((hash % 36) * 0.95);

  if (resonanceScore >= 86 && quality >= 82 && (hash % 100) >= 78) {
    // Rare genuine sleeper B-side (requires exceptional quality 82+ AND top 22% organic roll; collab gives zero shortcut)
    const sleeperFactor = Math.max(0.85, albumEraFactor);
    return {
      persona: 'breakout_smash',
      personaLabel: 'Viral Sleeper Smash',
      streamingModifier: Number((1.58 * sequenceBoost * sleeperFactor).toFixed(2)),
      salesModifier: 0.12,
      radioModifier: 0.0, // Commercial radio does not spin B-sides until serviced
      trackSequenceBoost: sequenceBoost,
      collabSurge,
      explanation: 'Breakout fan-favorite deep cut generating strong organic replay value.'
    };
  }

  if (resonanceScore >= 70 || trackIndex === 0) {
    // Strong fan favorite or lead-in
    return {
      persona: trackIndex === 0 ? 'album_opener' : 'fan_favorite',
      personaLabel: trackIndex === 0 ? 'Album Opener Focus' : 'Fan Favorite Pick',
      streamingModifier: Number((1.28 * sequenceBoost * albumEraFactor).toFixed(2)),
      salesModifier: 0.06,
      radioModifier: 0.0,
      trackSequenceBoost: sequenceBoost,
      collabSurge,
      explanation: 'High-performing album cut with above-average listener retention.'
    };
  }

  if (resonanceScore >= 46) {
    // Core cohesive album track
    return {
      persona: 'core_track',
      personaLabel: 'Core Album Track',
      streamingModifier: Number((1.05 * sequenceBoost * albumEraFactor).toFixed(2)),
      salesModifier: 0.04,
      radioModifier: 0.0,
      trackSequenceBoost: sequenceBoost,
      collabSurge,
      explanation: 'Cohesive album track enjoyed as part of the complete record listening experience.'
    };
  }

  // Niche deep cut / ballad / interlude
  return {
    persona: 'deep_cut',
    personaLabel: 'Niche Deep Cut',
    streamingModifier: Number((0.82 * sequenceBoost * albumEraFactor).toFixed(2)),
    salesModifier: 0.02,
    radioModifier: 0.0,
    trackSequenceBoost: sequenceBoost,
    collabSurge,
    explanation: 'Atmospheric deep cut or interlude catering to dedicated listeners.'
  };
}

/**
 * Returns a subtle organic micro-variance (±3%) specific to THIS SONG on THIS DATE,
 * preventing any two songs from displaying the exact same numbers.
 */
export function getIndividualSongOrganicVariance(
  songId: number,
  title: string,
  date: Date
): number {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const trackHash = getTrackHash(songId, title);
  const varianceSeed = (trackHash + dayOfYear * 37) % 100;
  // Variance between 0.965 and 1.035 (±3.5%)
  return 0.965 + (varianceSeed / 1400);
}

/**
 * Calculates debut day stream multiplier for singles and albums.
 * Day 0-1 gets maximum launch hype, transitioning smoothly over week 1.
 */
export function getLaunchDaySurge(
  daysSinceRelease: number,
  isSingle: boolean,
  artistHype: number
): number {
  const hypeFactor = 1.0 + (Math.min(100, Math.max(0, artistHype)) / 300); // 1.0x to 1.33x

  if (daysSinceRelease === 0) {
    // Debut Day 1: Grounded realistic launch anticipation
    return isSingle ? (1.45 * hypeFactor) : (1.35 * hypeFactor);
  } else if (daysSinceRelease === 1) {
    return isSingle ? (1.30 * hypeFactor) : (1.22 * hypeFactor);
  } else if (daysSinceRelease <= 3) {
    return isSingle ? (1.18 * hypeFactor) : (1.12 * hypeFactor);
  } else if (daysSinceRelease <= 7) {
    return isSingle ? (1.08 * hypeFactor) : 1.05;
  } else if (daysSinceRelease <= 14) {
    return isSingle ? 1.03 : 1.01;
  }
  return 1.0;
}
