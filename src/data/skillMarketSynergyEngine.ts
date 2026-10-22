// Skill Market Synergy Engine
// Connects the 22 player craft disciplines directly to real-world Streaming, Pure Sales, and Radio Airplay metrics.
//
// 1. Streaming Synergy:
//    - Melody Hooks, Theme Concept & Ad-Libs drive early debut velocity and playlist engagement.
//    - Storytelling & Philosophical Depth reduce stream decay, providing sustained smash longevity.
//    - Vocal Flow & Spatial Acoustics drive repeat listen loops on DSP platforms.
//
// 2. Pure Digital Sales Synergy:
//    - Casual listeners stream; passionate fans BUY.
//    - Emotional Vulnerability, Lyrical Meaning & Poetic Depth convert listeners into iTunes / digital purchasers.
//
// 3. Commercial Radio Airplay Synergy:
//    - Program Directors (CHR, Top 40, Hot AC) look for radio structure, vocal projection, and broadcast-ready LUFS mastering.
//    - Song Structure, Vocal Delivery & Audio Mastering accelerate station adds and elevate songs into Power Rotation.

import { Song } from '../types';
import { PlayerSkillState, getEnsuredSkillState } from './skillSystemEngine';

export interface SkillMarketSynergy {
  streamingMultiplier: number;
  decayReductionFactor: number;
  streamingReasons: string[];

  salesMultiplier: number;
  salesReasons: string[];

  radioSpinsMultiplier: number;
  radioProgrammerScoreBonus: number;
  radioReasons: string[];

  summary: {
    streamingPercent: number;
    salesPercent: number;
    radioPercent: number;
  };
}

/**
 * Calculates how the artist's current skill levels boost Streaming, Sales, and Radio Airplay.
 */
export function calculateSkillMarketSynergy(params: {
  skills?: PlayerSkillState;
  song?: Partial<Song>;
}): SkillMarketSynergy {
  const safeSkills = getEnsuredSkillState(params.skills);
  const song = params.song;

  // --- 1. STREAMING SYNERGY CALCULATION ---
  // Subskills influencing streaming:
  // - melodyHook: Catchy chorus -> +4.5% velocity per level (max +45%)
  // - themeConcept: Compelling concept -> +2.5% velocity per level (max +25%)
  // - flowCadence: Infectious rhythmic groove -> +3.0% velocity per level (max +30%)
  // - adLibCraft: Viral hooks -> +2.0% velocity per level (max +20%)
  // - storytelling: Retention & narrative -> -4.0% decay per level (max -40% decay)
  // - depth: Thought-provoking -> -3.0% decay per level (max -30% decay)
  // - spatialAcoustics: Dolby Atmos / headphone repeat -> +2.5% repeat rate per level
  const hookLv = safeSkills.songwriting.melodyHook?.level || 1;
  const conceptLv = safeSkills.songwriting.themeConcept?.level || 1;
  const flowLv = safeSkills.recording.flowCadence?.level || 1;
  const adLibLv = safeSkills.recording.adLibCraft?.level || 1;
  const storyLv = safeSkills.songwriting.storytelling?.level || 1;
  const depthLv = safeSkills.songwriting.depth?.level || 1;
  const spatialLv = safeSkills.production.spatialAcoustics?.level || 1;
  const tuningLv = safeSkills.production.vocalTuning?.level || 1;

  let streamBonusRaw = 0;
  streamBonusRaw += (hookLv - 1) * 0.045;
  streamBonusRaw += (conceptLv - 1) * 0.025;
  streamBonusRaw += (flowLv - 1) * 0.030;
  streamBonusRaw += (adLibLv - 1) * 0.020;
  streamBonusRaw += (spatialLv - 1) * 0.025;
  streamBonusRaw += (tuningLv - 1) * 0.020;

  // Song thematic alignment boost if the song matches the theme focus
  if (song?.writingFocus && song.writingFocus === 'melodyHook') {
    streamBonusRaw += 0.06;
  }
  if (song?.theme && song.theme.includes('Viral') || song?.theme?.includes('Party')) {
    streamBonusRaw += 0.04;
  }

  // Streaming velocity multiplier (1.00x at level 1, up to ~1.85x at maxed skills)
  const streamingMultiplier = Math.max(1.0, 1.0 + streamBonusRaw);

  // Longevity / Decay Reduction Factor:
  // Reduces the daily momentum decay rate by up to 45%, so hits stay on charts for months!
  const decayReductionRaw = ((storyLv - 1) * 0.035) + ((depthLv - 1) * 0.025);
  const decayReductionFactor = Math.max(0.55, 1.0 - Math.min(0.45, decayReductionRaw));

  const streamingReasons: string[] = [];
  if (hookLv > 1) streamingReasons.push(`Melodic Hook Lv. ${hookLv} (+${Math.round((hookLv - 1) * 4.5)}% Streams)`);
  if (flowLv > 1) streamingReasons.push(`Flow & Cadence Lv. ${flowLv} (+${Math.round((flowLv - 1) * 3)}% Repeat Plays)`);
  if (storyLv > 1) streamingReasons.push(`Storytelling Lv. ${storyLv} (-${Math.round((storyLv - 1) * 3.5)}% Daily Decay)`);
  if (spatialLv > 1) streamingReasons.push(`Spatial Acoustics Lv. ${spatialLv} (+${Math.round((spatialLv - 1) * 2.5)}% DSP Reach)`);

  // --- 2. PURE DIGITAL SALES SYNERGY CALCULATION ---
  // Subskills influencing digital track / album sales:
  // - emotionalResonance: Vulnerability creates buyers -> +5.0% sales per level (max +50%)
  // - lyrics: Poetic diction & rhyme -> +3.5% sales per level (max +35%)
  // - depth: Meaningful song -> +4.0% sales per level (max +40%)
  // - wordplayPunchlines: Quoting & collectibles -> +2.5% sales per level (max +25%)
  // - melodicCadence: Instant iTunes download impulse -> +3.0% sales per level (max +30%)
  const emotionLv = safeSkills.songwriting.emotionalResonance?.level || 1;
  const lyricsLv = safeSkills.songwriting.lyrics?.level || 1;
  const wordplayLv = safeSkills.songwriting.wordplayPunchlines?.level || 1;
  const melodicCadenceLv = safeSkills.recording.melodicCadence?.level || 1;

  let salesBonusRaw = 0;
  salesBonusRaw += (emotionLv - 1) * 0.050;
  salesBonusRaw += (lyricsLv - 1) * 0.035;
  salesBonusRaw += (depthLv - 1) * 0.040;
  salesBonusRaw += (wordplayLv - 1) * 0.025;
  salesBonusRaw += (melodicCadenceLv - 1) * 0.030;

  if (song?.writingFocus && (song.writingFocus === 'emotionalResonance' || song.writingFocus === 'depth')) {
    salesBonusRaw += 0.08;
  }

  // Pure sales multiplier (1.00x at level 1, up to ~2.00x at maxed skills)
  const salesMultiplier = Math.max(1.0, 1.0 + salesBonusRaw);

  const salesReasons: string[] = [];
  if (emotionLv > 1) salesReasons.push(`Emotional Resonance Lv. ${emotionLv} (+${Math.round((emotionLv - 1) * 5)}% Buyer Conversion)`);
  if (lyricsLv > 1) salesReasons.push(`Lyrical Craft Lv. ${lyricsLv} (+${Math.round((lyricsLv - 1) * 3.5)}% Purchases)`);
  if (depthLv > 1) salesReasons.push(`Philosophical Depth Lv. ${depthLv} (+${Math.round((depthLv - 1) * 4)}% Storefront Sales)`);

  // --- 3. COMMERCIAL RADIO AIRPLAY SYNERGY CALCULATION ---
  // Subskills influencing Radio Programmer Adoption & Daily Spins:
  // - songStructure: Commercial radio format (verse/chorus pacing) -> +4.0% spins per level
  // - vocalDelivery: Powerful presence on broadcast -> +4.0% spins per level
  // - pitchControl: Vocal stability -> +3.0% spins per level
  // - audioEngineering: Spectral clarity -> +4.0% spins per level
  // - dynamicProcessing: Punchy transients -> +3.0% spins per level
  // - masteringPolish: Competitive commercial LUFS loudness -> +5.0% spins per level
  // - breathControl: Live & broadcast endurance -> +2.0% spins per level
  const structureLv = safeSkills.songwriting.songStructure?.level || 1;
  const vocalDeliveryLv = safeSkills.recording.vocalDelivery?.level || 1;
  const pitchLv = safeSkills.recording.pitchControl?.level || 1;
  const audioEngLv = safeSkills.production.audioEngineering?.level || 1;
  const dynamicProcLv = safeSkills.production.dynamicProcessing?.level || 1;
  const masterPolishLv = safeSkills.production.masteringPolish?.level || 1;
  const timingLv = safeSkills.recording.timingPrecision?.level || 1;

  let radioSpinsBonusRaw = 0;
  radioSpinsBonusRaw += (structureLv - 1) * 0.040;
  radioSpinsBonusRaw += (vocalDeliveryLv - 1) * 0.040;
  radioSpinsBonusRaw += (pitchLv - 1) * 0.030;
  radioSpinsBonusRaw += (audioEngLv - 1) * 0.040;
  radioSpinsBonusRaw += (dynamicProcLv - 1) * 0.030;
  radioSpinsBonusRaw += (masterPolishLv - 1) * 0.050;
  radioSpinsBonusRaw += (timingLv - 1) * 0.025;

  const radioSpinsMultiplier = Math.max(1.0, 1.0 + radioSpinsBonusRaw);

  // Radio Programmer StarPower Bonus:
  // High mastery in radio arrangement, vocal delivery, and mastering adds directly to starPower (up to +24 points),
  // enabling emerging artists to crack Heavy and Power rotation earlier!
  const radioProgrammerScoreBonus = Math.round(
    ((structureLv - 1) * 0.9) +
    ((vocalDeliveryLv - 1) * 0.9) +
    ((masterPolishLv - 1) * 1.1) +
    ((audioEngLv - 1) * 0.8)
  );

  const radioReasons: string[] = [];
  if (masterPolishLv > 1) radioReasons.push(`Mastering Polish Lv. ${masterPolishLv} (+${Math.round((masterPolishLv - 1) * 5)}% Radio Punch)`);
  if (vocalDeliveryLv > 1) radioReasons.push(`Vocal Delivery Lv. ${vocalDeliveryLv} (+${Math.round((vocalDeliveryLv - 1) * 4)}% Station Acceptance)`);
  if (structureLv > 1) radioReasons.push(`Song Structure Lv. ${structureLv} (+${Math.round((structureLv - 1) * 4)}% Programmer Adds)`);
  if (audioEngLv > 1) radioReasons.push(`Audio Engineering Lv. ${audioEngLv} (+${Math.round((audioEngLv - 1) * 4)}% Broadcast Clarity)`);

  return {
    streamingMultiplier: Math.round(streamingMultiplier * 1000) / 1000,
    decayReductionFactor: Math.round(decayReductionFactor * 1000) / 1000,
    streamingReasons,

    salesMultiplier: Math.round(salesMultiplier * 1000) / 1000,
    salesReasons,

    radioSpinsMultiplier: Math.round(radioSpinsMultiplier * 1000) / 1000,
    radioProgrammerScoreBonus,
    radioReasons,

    summary: {
      streamingPercent: Math.round((streamingMultiplier - 1.0) * 100),
      salesPercent: Math.round((salesMultiplier - 1.0) * 100),
      radioPercent: Math.round((radioSpinsMultiplier - 1.0) * 100)
    }
  };
}

/**
 * Quick summary of current market synergy boosts for display in the Mastery Academy or Dashboard.
 */
export function getArtistMarketSynergySummary(skills?: PlayerSkillState) {
  const synergy = calculateSkillMarketSynergy({ skills });
  return {
    streamingBoost: `+${synergy.summary.streamingPercent}%`,
    salesBoost: `+${synergy.summary.salesPercent}%`,
    radioBoost: `+${synergy.summary.radioPercent}%`,
    longevityBonus: `${Math.round((1 - synergy.decayReductionFactor) * 100)}% slower decay`,
    programmerBonus: `+${synergy.radioProgrammerScoreBonus} Programmer Affinity`,
    synergy
  };
}
