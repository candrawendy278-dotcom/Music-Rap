// Song Hit Viability, Studio Synergy & Longevity Decay Engine
//
// Key Responsibilities:
// 1. Wizard & Recording Studio Synergy:
//    - Technical Quality 100 DOES NOT automatically equal a massive hit!
//    - Evaluates the creative alignment of Genre + Theme + Meaning + Vocal Style + Audio Mix.
//    - Synergistic combinations unlock commercial virality and listener loop potential.
//    - Clashing combinations risk polarizing reception or mainstream fatigue.
// 2. Not Every Single is a Hit (Realistic Superstar Flops & Underperformers):
//    - Even global icons release singles that underperform or flop ("ME!", "Woman's World", etc.).
//    - Distinct Archetypes: 'mega_smash' | 'solid_hit' | 'moderate_single' | 'polarizing_flop' | 'critical_darling'.
// 3. Authentic Post-Debut Longevity & Decay:
//    - Eliminates the unrealistic phenomenon of a song holding 18M for a week and 10M+ for months.
//    - Day 1-3 natural weekend cooldown (debut day is front-loaded).
//    - Week 2-4 realistic trajectory based on audience connection.
//    - Deep catalog (>60-90 days) settles naturally into healthy catalog streams (300k - 3.5M), never stuck at 10M+.

import { Song } from '../types';

export type HitArchetype = 
  | 'mega_smash'        // Cultural zeitgeist hit (Espresso, Blinding Lights, As It Was)
  | 'solid_hit'         // Strong successful single, stable chart run
  | 'moderate_single'   // Decent performance, standard radio/playlist cycle
  | 'polarizing_flop'   // Front-loaded stan debut that crashes fast (listener fatigue / disconnect)
  | 'critical_darling'; // Quality 90-100, loved by critics/stans, but niche mainstream consumption

export interface SongViabilityProfile {
  archetype: HitArchetype;
  archetypeLabel: string;
  synergyScore: number;       // 0.65 to 1.45 multiplier based on wizard & recording alignment
  mainstreamAppeal: number;   // 0.50 to 1.35 public appetite
  longevityDecayFactor: number; // Daily dynamic decay multiplier for this specific day
  description: string;
}

/**
 * Deterministic hash combining song ID and title to guarantee every track has an individual public reception roll.
 */
function getSongZeitgeistSeed(songId: number, title: string): number {
  let hash = (songId * 48271) ^ 0x27bb2ee6;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Evaluates the creative synergy between songwriting choices and studio recording choices.
 */
function evaluateStudioSynergy(song: Song): { synergyMultiplier: number; synergyType: string } {
  const genre = (song.genre || 'Pop').toLowerCase();
  const theme = (song.theme || '').toLowerCase();
  const meaning = (song.meaning || '').toLowerCase();
  const recordingStyle = (song.recordingStyle || '').toLowerCase();
  const vocalFocus = (song.vocalFocus || '').toLowerCase();

  let synergy = 1.0;
  let type = 'Standard Alignment';

  // 1. High Commercial Club / Pop / Viral Synergy
  const isUpbeatGenre = genre.includes('pop') || genre.includes('hip-hop') || genre.includes('dance') || genre.includes('electronic');
  const isCatchyTheme = theme.includes('party') || theme.includes('luxury') || theme.includes('hustle');
  const isCatchyMeaning = meaning.includes('catchy') || meaning.includes('earworm');
  const isRadioAudio = vocalFocus.includes('clean') || vocalFocus.includes('commercial');

  if (isUpbeatGenre && isCatchyTheme && isCatchyMeaning && isRadioAudio) {
    synergy = 1.32;
    type = 'Radio-Ready Commercial Earworm';
  }

  // 2. Deep Emotional Heartbreak / Raw Vulnerability Synergy
  const isHeartbreak = theme.includes('heartbreak') || theme.includes('romance');
  const isRaw = meaning.includes('raw') || meaning.includes('authenticity') || meaning.includes('honesty');
  const isMelodicVocal = recordingStyle.includes('melodic') || recordingStyle.includes('smooth');
  const isWarmAudio = vocalFocus.includes('warm') || vocalFocus.includes('analog') || vocalFocus.includes('spatial');

  if (isHeartbreak && isRaw && isMelodicVocal && isWarmAudio) {
    synergy = 1.28;
    type = 'Emotional Heartbreak Sleeper';
  }

  // 3. Lyrical Mastery / Storytelling Synergy
  const isStoryTheme = theme.includes('introspection') || theme.includes('social') || theme.includes('street');
  const isPoeticMeaning = meaning.includes('narrative') || meaning.includes('metaphorical') || meaning.includes('poetry');
  const isComplexVocal = recordingStyle.includes('complex') || recordingStyle.includes('aggressive');

  if (isStoryTheme && isPoeticMeaning && isComplexVocal) {
    synergy = 1.22;
    type = 'Deep Lyrical Narrative';
  }

  // 4. Creative Clashing / Confusing Concepts (High Quality, but Weird Fit for Mainstream)
  // E.g. Party Nightlife + Metaphorical Lyrical Poetry + Chopper Rap + Spatial Binaural Audio
  const isPartyTheme = theme.includes('party') || theme.includes('club');
  const isHeavyPoetry = meaning.includes('metaphorical') || meaning.includes('existential');
  if (isPartyTheme && isHeavyPoetry) {
    synergy = 0.85;
    type = 'Conflicting Concept Clash';
  }

  // Deep Introspection on high-energy club beat
  const isIntrospection = theme.includes('introspection');
  const isAggressiveClub = recordingStyle.includes('aggressive') && isUpbeatGenre && !isStoryTheme;
  if (isIntrospection && isAggressiveClub) {
    synergy = 0.88;
    type = 'Acoustic / Energy Mismatch';
  }

  return { synergyMultiplier: synergy, synergyType: type };
}

/**
 * Evaluates the complete hit viability, audience reception archetype, and exact longevity decay
 * for a song based on its age, craft synergy, and public resonance.
 */
export function evaluateSongHitViability(params: {
  song: Song;
  daysSinceRelease: number;
  artistPopularity: number;
  artistHype: number;
  isSingle: boolean;
}): SongViabilityProfile {
  const { song, daysSinceRelease, artistPopularity, artistHype, isSingle } = params;

  const quality = Math.max(1, song.quality || 50);
  const potential = Math.max(1, song.basePotential || 50);
  const seed = getSongZeitgeistSeed(song.id, song.title);

  // Creative Studio Alignment from wizard choices
  const { synergyMultiplier, synergyType } = evaluateStudioSynergy(song);

  // Organic Zeitgeist roll (0.78 to 1.38)
  // Even a Quality 100 track can roll a lukewarm reception (0.80), while an 80 quality can roll a viral zeitgeist wave (1.30)!
  const zeitgeistRoll = 0.78 + ((seed % 61) / 100);

  // Mainstream public appetite vs niche appreciation
  const compositeResonance = (
    (synergyMultiplier * 0.40) +
    (zeitgeistRoll * 0.32) +
    ((potential / 50) * 0.15) +
    ((quality / 50) * 0.13)
  );

  // Determine Hit Archetype
  let archetype: HitArchetype = 'solid_hit';
  let archetypeLabel = 'Solid Commercial Hit';
  let description = 'Strong public reception with standard chart stability.';

  if (!isSingle) {
    archetype = 'moderate_single';
    archetypeLabel = 'Album Cut';
    description = 'Cohesive album track providing steady listener stream engagement.';
  } else if (compositeResonance >= 1.22) {
    archetype = 'mega_smash';
    archetypeLabel = 'Cultural Mega Smash';
    description = 'Infectious mainstream phenomenon resonating across global DSP algorithms.';
  } else if (compositeResonance >= 1.02) {
    archetype = 'solid_hit';
    archetypeLabel = 'Solid Mainstream Hit';
    description = 'Popular single enjoying solid playlist additions and repeat listens.';
  } else if (quality >= 88 && (synergyType.includes('Narrative') || synergyType.includes('Conflicting'))) {
    archetype = 'critical_darling';
    archetypeLabel = 'Critical Masterpiece';
    description = 'High technical quality celebrated by dedicated fans, but niche mainstream replayability.';
  } else if (compositeResonance <= 0.86) {
    archetype = 'polarizing_flop';
    archetypeLabel = 'Underperforming Single';
    description = 'Stanbase checked it out on debut, but casual listeners quickly moved on.';
  } else {
    archetype = 'moderate_single';
    archetypeLabel = 'Moderate Single';
    description = 'Respectable single performing moderately across mainstream streaming.';
  }

  // --- REALISTIC DYNAMIC DECAY TRAJECTORY ---
  // Calibrated to give satisfying, realistic longevity without rigid identical holds:
  // - Debut Day 0 is front-loaded with curious fans and Release Radar.
  // - Day 1-3 naturally drops 10-25% as casual listeners don't all loop it immediately.
  // - Week 2-4 trajectory diverges naturally by archetype.
  // - Month 2+ settles into authentic catalog numbers.

  let longevityDecayFactor = 1.0;

  if (isSingle) {
    if (daysSinceRelease === 0) {
      // Debut Day: Peak launch curiosity
      longevityDecayFactor = 1.0;
    } else if (daysSinceRelease === 1) {
      // Day 2 post-premiere cooldown
      longevityDecayFactor = archetype === 'mega_smash' ? 0.92 : (archetype === 'polarizing_flop' ? 0.74 : 0.86);
    } else if (daysSinceRelease <= 3) {
      // Opening weekend plateau
      longevityDecayFactor = archetype === 'mega_smash' ? 0.86 : (archetype === 'polarizing_flop' ? 0.60 : 0.78);
    } else if (daysSinceRelease <= 7) {
      // End of tracking week 1
      longevityDecayFactor = archetype === 'mega_smash' ? 0.80 : (archetype === 'polarizing_flop' ? 0.48 : 0.68);
    } else if (daysSinceRelease <= 14) {
      // Week 2: Critical public verdict
      if (archetype === 'mega_smash') {
        longevityDecayFactor = 0.74;
      } else if (archetype === 'solid_hit') {
        longevityDecayFactor = 0.58;
      } else if (archetype === 'critical_darling') {
        longevityDecayFactor = 0.44;
      } else if (archetype === 'polarizing_flop') {
        longevityDecayFactor = 0.28;
      } else {
        longevityDecayFactor = 0.48;
      }
    } else if (daysSinceRelease <= 28) {
      // Weeks 3-4: Settling phase
      if (archetype === 'mega_smash') {
        longevityDecayFactor = 0.64;
      } else if (archetype === 'solid_hit') {
        longevityDecayFactor = 0.46;
      } else if (archetype === 'critical_darling') {
        longevityDecayFactor = 0.32;
      } else if (archetype === 'polarizing_flop') {
        longevityDecayFactor = 0.18;
      } else {
        longevityDecayFactor = 0.35;
      }
    } else if (daysSinceRelease <= 60) {
      // Month 2: Transition out of active promotion into core rotation
      if (archetype === 'mega_smash') {
        longevityDecayFactor = 0.44;
      } else if (archetype === 'solid_hit') {
        longevityDecayFactor = 0.28;
      } else if (archetype === 'critical_darling') {
        longevityDecayFactor = 0.18;
      } else if (archetype === 'polarizing_flop') {
        longevityDecayFactor = 0.09;
      } else {
        longevityDecayFactor = 0.20;
      }
    } else if (daysSinceRelease <= 120) {
      // Month 3-4: Core catalog baseline
      if (archetype === 'mega_smash') {
        longevityDecayFactor = 0.30;
      } else if (archetype === 'solid_hit') {
        longevityDecayFactor = 0.18;
      } else if (archetype === 'critical_darling') {
        longevityDecayFactor = 0.12;
      } else if (archetype === 'polarizing_flop') {
        longevityDecayFactor = 0.05;
      } else {
        longevityDecayFactor = 0.13;
      }
    } else {
      // Deep Catalog (>4 months): Stable permanent listening floor
      const ageMonths = daysSinceRelease / 30;
      const slowCatalogDecay = Math.max(0.70, 1.0 - (ageMonths * 0.020));
      if (archetype === 'mega_smash') {
        longevityDecayFactor = 0.20 * slowCatalogDecay;
      } else if (archetype === 'solid_hit') {
        longevityDecayFactor = 0.11 * slowCatalogDecay;
      } else if (archetype === 'critical_darling') {
        longevityDecayFactor = 0.075 * slowCatalogDecay;
      } else if (archetype === 'polarizing_flop') {
        longevityDecayFactor = 0.030 * slowCatalogDecay;
      } else {
        longevityDecayFactor = 0.065 * slowCatalogDecay;
      }
    }
  } else {
    // Album B-Sides: Front-loaded album binge in week 1, then settling into deep cut streams
    if (daysSinceRelease <= 3) {
      longevityDecayFactor = 1.0;
    } else if (daysSinceRelease <= 7) {
      longevityDecayFactor = 0.82;
    } else if (daysSinceRelease <= 28) {
      longevityDecayFactor = 0.54;
    } else if (daysSinceRelease <= 90) {
      longevityDecayFactor = 0.28;
    } else {
      longevityDecayFactor = 0.15;
    }
  }

  return {
    archetype,
    archetypeLabel,
    synergyScore: Number(synergyMultiplier.toFixed(2)),
    mainstreamAppeal: Number(compositeResonance.toFixed(2)),
    longevityDecayFactor: Number(longevityDecayFactor.toFixed(3)),
    description
  };
}
