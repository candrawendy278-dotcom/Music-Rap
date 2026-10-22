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
    const hasCollab = !!song.collabId && song.collabId !== 'none';
    const collabSurge = hasCollab ? 1.25 : 1.0;
    // Composite strength of single (quality + potential + slight organic variance)
    const singleStrength = (quality * 0.45) + (potential * 0.40) + ((hash % 25) * 0.6);

    // 1. Standout Smash Hit Single (high quality + strong potential)
    if (singleStrength >= 72 || (isLead && quality >= 68 && potential >= 65)) {
      const streamMod = (isLead ? 1.45 : 1.30) * collabSurge;
      return {
        persona: 'breakout_smash',
        personaLabel: isLead ? 'Lead Smash Single' : 'Commercial Hit Single',
        streamingModifier: Number(streamMod.toFixed(2)),
        salesModifier: isLead ? 1.40 : 1.20,
        radioModifier: isLead ? 1.35 : 1.15,
        trackSequenceBoost: 1.0,
        collabSurge,
        explanation: isLead 
          ? 'High-priority focus track with full global playlisting and promotional push.'
          : 'Standout commercial hit single resonating strongly across listener feeds.'
      };
    }

    // 2. Solid Commercial Single
    if (singleStrength >= 50 || isLead) {
      const streamMod = (isLead ? 1.20 : 1.10) * collabSurge;
      return {
        persona: 'fan_favorite',
        personaLabel: isLead ? 'Lead Single Priority' : 'Official Single',
        streamingModifier: Number(streamMod.toFixed(2)),
        salesModifier: isLead ? 1.18 : 1.05,
        radioModifier: isLead ? 1.15 : 1.0,
        trackSequenceBoost: 1.0,
        collabSurge,
        explanation: 'Official commercial single serviced across streaming and digital storefronts.'
      };
    }

    // 3. Moderate Single
    if (singleStrength >= 34) {
      const streamMod = 0.95 * collabSurge;
      return {
        persona: 'core_track',
        personaLabel: 'Moderate Single',
        streamingModifier: Number(streamMod.toFixed(2)),
        salesModifier: 0.90,
        radioModifier: 0.85,
        trackSequenceBoost: 1.0,
        collabSurge,
        explanation: 'Steady single performing moderately across mainstream streaming.'
      };
    }

    // 4. Underperforming Single
    const streamMod = 0.80 * collabSurge;
    return {
      persona: 'deep_cut',
      personaLabel: 'Underperforming Single',
      streamingModifier: Number(streamMod.toFixed(2)),
      salesModifier: 0.70,
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
      sequenceBoost = 1.32; // Track 1 album opener - highest immediate full-album play-through
    } else if (trackIndex === 1) {
      sequenceBoost = 1.20; // Track 2 - strong momentum continuation
    } else if (trackIndex === 2) {
      sequenceBoost = 1.10;
    } else if (trackIndex >= totalTracks - 2) {
      sequenceBoost = 0.82; // End of album listener drop-off
    } else {
      sequenceBoost = 0.95; // Mid-album baseline
    }
  }

  // 2. Collab feature on an album track:
  let collabSurge = 1.0;
  if (song.collabId && song.collabId !== 'none') {
    collabSurge = 1.55; // Collab cuts get direct fan flocking!
  }

  // 3. Album Project Era Reception (Hit Era vs Flop Era):
  // As observed in the real industry, top artist B-sides average >100k daily streams when the album is a hit era,
  // but if the album flops or loses momentum, casual listeners stop binging deep tracks and B-sides fall significantly.
  let albumEraFactor = 1.0;
  if (project) {
    const projQuality = project.quality !== undefined ? project.quality : 50;
    const projMomentum = project.momentum !== undefined ? project.momentum : 1.0;

    if (projQuality >= 75 && projMomentum >= 0.55) {
      // Smash / Hit Album Era (e.g. Midnights, SOS, Hit Me Hard and Soft)
      albumEraFactor = 1.25;
    } else if (projQuality >= 55 && projMomentum >= 0.40) {
      // Solid Album Era
      albumEraFactor = 1.0;
    } else if (projQuality < 45 || projMomentum < 0.30) {
      // Flop Album Era (low critical score or abandoned momentum)
      albumEraFactor = Math.max(0.35, 0.40 + (projQuality / 100) * 0.30) * Math.max(0.45, projMomentum);
    } else {
      // Lukewarm / Average Album Era
      albumEraFactor = 0.80;
    }
  }

  // 4. Intrinsic Organic Fan Resonance (Breakout vs Core vs Deep Cut):
  // Evaluated based on track quality + deterministic individuality hash
  const resonanceScore = (quality * 0.6) + ((hash % 40) * 1.0);

  if (resonanceScore >= 82 || (song.collabId && song.collabId !== 'none' && quality >= 70)) {
    // The "Cruel Summer" / "Snooze" phenomenon:
    // A breakout B-side that fans replay obsessively! True sleepers transcend even a lukewarm era.
    const sleeperFactor = Math.max(0.85, albumEraFactor);
    return {
      persona: 'breakout_smash',
      personaLabel: 'Viral Sleeper Smash',
      streamingModifier: Number((2.05 * sequenceBoost * collabSurge * sleeperFactor).toFixed(2)),
      salesModifier: 0.16 * collabSurge, // Standout downloads
      radioModifier: 0.0, // Commercial radio does not spin B-sides until serviced
      trackSequenceBoost: sequenceBoost,
      collabSurge,
      explanation: 'Breakout fan-favorite deep cut generating massive viral replay value.'
    };
  }

  if (resonanceScore >= 68 || trackIndex === 0) {
    // Strong fan favorite or lead-in
    return {
      persona: trackIndex === 0 ? 'album_opener' : 'fan_favorite',
      personaLabel: trackIndex === 0 ? 'Album Opener Focus' : 'Fan Favorite Pick',
      streamingModifier: Number((1.55 * sequenceBoost * collabSurge * albumEraFactor).toFixed(2)),
      salesModifier: 0.08 * collabSurge,
      radioModifier: 0.0,
      trackSequenceBoost: sequenceBoost,
      collabSurge,
      explanation: 'High-performing album cut with above-average listener retention.'
    };
  }

  if (resonanceScore >= 45) {
    // Core cohesive album track
    return {
      persona: 'core_track',
      personaLabel: 'Core Album Track',
      streamingModifier: Number((1.18 * sequenceBoost * collabSurge * albumEraFactor).toFixed(2)),
      salesModifier: 0.05,
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
    streamingModifier: Number((0.88 * sequenceBoost * albumEraFactor).toFixed(2)),
    salesModifier: 0.025,
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
