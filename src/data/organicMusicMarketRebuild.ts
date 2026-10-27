// Organic Music Market Rebuild Engine
// Completely dynamic, fluid simulation of Streaming, Pure Sales, and Radio Airplay.
//
// Key Design Principles:
// 1. "Jangan terpaku sama angka":
//    - NO rigid hardcoded ceilings, no artificial stair-step clamps, no arbitrary walls.
//    - Seamless continuous mathematical curves that respond organically to Hype, Popularity,
//      Song Quality, Artist Craft Mastery, Track Roles, and Natural Lifecycle.
// 2. Multi-Factor Organic Synergy:
//    - Hype: Viral acceleration, debut buzz, short-term explosive spikes.
//    - Popularity: Core dedicated fanbase, baseline streaming floor, purchase loyalty.
//    - Song Craft & Mastery: Listener completion rates, repeat play loops, radio programmer confidence.
//    - Track Role & Album Era: Distinction between lead singles, standalone hits, promo singles, and album B-sides.
//    - Real-world Market Dynamics: Seasonality (weekend spikes), playlist pickups, radio adoption waves.

import { Song, Project } from '../types';
import { PlayerSkillState, getEnsuredSkillState } from './skillSystemEngine';
import { getCountryMarketProfile } from './countryMarketSystem';
import { TrackRole } from './bSideAndSingleStrategyEngine';
import { getFanMarketSynergy } from './fansSystemEngine';
import { evaluateSongHitViability } from './songHitViabilityEngine';
import { evaluateEnhancedStreamingCurve } from './enhancedStreamingCurveEngine';
import { evaluateSongPublicChemistry } from './publicChemistryLongevityEngine';

export interface OrganicDailyMarketResult {
  dailyStreams: number;
  dailyPureSales: number;
  dailyRadioSpins: number;
  dailyRadioAudience: number;
  dailyViews: number;
  momentum: number;
}

/**
 * Calculates continuous, organic streaming velocity for any released track.
 * Does not clamp to rigid floors/ceilings; allows organic hits to soar and flopped songs to settle naturally.
 */
export function calculateOrganicDailyStreams(params: {
  song: Song;
  parentProject?: Project;
  artistPopularity: number;
  artistHype: number;
  artistTier: number;
  artistCountry: string;
  skills?: PlayerSkillState;
  daysSinceRelease: number;
  trackRole: TrackRole;
  albumEraFactor: number;
  weekendLift: number;
  organicVariance: number;
  collabMultiplier?: number;
  bSideModifier?: number;
  trackIndex?: number;
  launchSurge?: number;
  fans?: number;
}): number {
  const {
    song,
    artistPopularity,
    artistHype,
    skills,
    daysSinceRelease,
    trackRole,
    albumEraFactor,
    weekendLift,
    organicVariance,
    collabMultiplier,
    bSideModifier,
    trackIndex,
    launchSurge,
    fans
  } = params;

  const safeSkills = getEnsuredSkillState(skills);
  const pop = Math.max(0, Math.min(100, artistPopularity));
  const hype = Math.max(0, Math.min(100, artistHype));
  const quality = Math.max(1, song.quality || 50);
  const potential = Math.max(1, song.basePotential || 50);
  const isSingle = trackRole !== 'b_side';
  const isLead = trackRole === 'lead_single';

  // --- 1. CONTINUOUS BASE AUDIENCE FOUNDATION WITH FANS & HYPE (NO HARDCODED WALLS) ---
  // Scales fluidly from underground rookies to global icons and massive custom fanbases
  const fanSynergy = getFanMarketSynergy(fans || 0, safeSkills);
  const fanBaseScale = Math.pow(pop / 10, 2.12) * 520;
  const viralHypeScale = Math.pow(hype / 10, 1.88) * 260;
  const baseListenerPool = Math.max(40, fanBaseScale + viralHypeScale + (fanSynergy.fanStreamingBase * 0.95));

  // --- 2. SONG CRAFT & MASTER PRODUCTION SYNERGY ---
  const hookLv = safeSkills.songwriting.melodyHook?.level || 1;
  const flowLv = safeSkills.recording.flowCadence?.level || 1;
  const storyLv = safeSkills.songwriting.storytelling?.level || 1;
  const depthLv = safeSkills.songwriting.depth?.level || 1;
  const audioLv = safeSkills.production.audioEngineering?.level || 1;
  const masterLv = safeSkills.production.masteringPolish?.level || 1;

  const skillBoostFraction = (
    (hookLv - 1) * 0.024 +
    (flowLv - 1) * 0.018 +
    (storyLv - 1) * 0.018 +
    (depthLv - 1) * 0.014 +
    (audioLv - 1) * 0.014 +
    (masterLv - 1) * 0.018
  );

  const viability = evaluateSongHitViability({
    song,
    daysSinceRelease,
    artistPopularity: pop,
    artistHype: hype,
    isSingle
  });

  // Enhanced Streaming Curve: smooth continuous quality curve + fanbase/hype retention
  const enhancedCurve = evaluateEnhancedStreamingCurve({
    song,
    daysSinceRelease,
    artistPopularity: pop,
    artistHype: hype,
    fans: fans || 250,
    isSingle,
    archetype: viability.archetype,
    synergyScore: viability.synergyScore,
    skills: safeSkills
  });

  const qualityFactor = Math.pow(quality / 55, 0.72) * (1.0 + skillBoostFraction * 0.65) * viability.synergyScore;
  const potentialFactor = Math.pow(Math.min(145, potential) / 55, 0.68);

  // --- 3. SMOOTH CONTINUOUS LIFECYCLE TRAJECTORY ---
  let lifecycleTrajectory: number;

  if (isSingle) {
    const leadBoost = (isLead && daysSinceRelease <= 14) ? 1.12 : 1.0;
    lifecycleTrajectory =
      enhancedCurve.continuousLifecycleFactor *
      viability.mainstreamAppeal *
      leadBoost *
      Math.min(1.25, Math.pow(enhancedCurve.fanAndHypeRetentionBoost, 0.35));
  } else {
    lifecycleTrajectory =
      enhancedCurve.continuousLifecycleFactor *
      Math.min(1.18, Math.pow(enhancedCurve.fanAndHypeRetentionBoost, 0.28));
  }

  // --- 4. TRACK ROLE & INDIVIDUAL TRACK PERSONALITY IN ECOSYSTEM ---
  const trackSonicHash = Math.abs((song.id * 97) ^ (song.title.length * 53) ^ Math.round((song.quality || 50) * 13)) % 100;
  const trackSonicAppeal = 0.80 + (trackSonicHash / 240); // 0.80x to 1.21x natural track personality

  let roleFactor = 1.0;
  if (isLead) {
    roleFactor = 1.22 * trackSonicAppeal;
  } else if (isSingle) {
    roleFactor = 1.08 * trackSonicAppeal;
  } else {
    const distinctMod = (bSideModifier !== undefined && bSideModifier > 0) ? (bSideModifier / 1.18) : 1.0;
    const qualitySleeperBonus = quality >= 75 ? 1.26 : (potential >= 75 ? 1.14 : 1.0);
    
    let debutTrackWeight = 1.0;
    if (daysSinceRelease <= 1) {
      if (trackIndex === 0) debutTrackWeight = 1.28;
      else if (trackIndex === 1) debutTrackWeight = 1.15;
      else if (trackIndex === 2) debutTrackWeight = 1.05;
      else if (qualitySleeperBonus > 1.15) debutTrackWeight = 1.20;
      else debutTrackWeight = 0.84;
    }

    if (daysSinceRelease <= 7) {
      roleFactor = (0.68 + (hype / 100) * 0.18) * albumEraFactor * qualitySleeperBonus * distinctMod * trackSonicAppeal * debutTrackWeight;
    } else if (daysSinceRelease <= 28) {
      roleFactor = (0.52 + Math.min(0.20, (quality - 50) * 0.007)) * albumEraFactor * qualitySleeperBonus * distinctMod * trackSonicAppeal;
    } else {
      roleFactor = Math.max(0.25, 0.42 * albumEraFactor * Math.pow(quality / 50, 0.85)) * qualitySleeperBonus * distinctMod * trackSonicAppeal;
    }
  }

  // --- 5. DSP PLAYLIST VISIBILITY & REACH ---
  let playlistLift = 1.0;
  if (song.playlistPlacements && song.playlistPlacements.length > 0) {
    const count = song.playlistPlacements.length;
    playlistLift = 1.0 + Math.log2(1 + count * 0.42) * 0.26;
  }

  // --- 6. PUBLIC CHEMISTRY POST-DEBUT LONGEVITY (STRICTLY 1.0x ON DAY 1 DEBUT!) ---
  const publicChemistry = evaluateSongPublicChemistry({
    song,
    daysSinceRelease,
    isSingle
  });

  // --- 7. COMPOSE FINAL DAILY STREAMS (100% UNCLAMPED — NO 28M/31M WALL!) ---
  const launchBonus = (launchSurge ?? 1.0);
  const rawStreams = baseListenerPool
    * qualityFactor
    * potentialFactor
    * lifecycleTrajectory
    * publicChemistry.postDebutStreamMultiplier
    * roleFactor
    * playlistLift
    * (song.momentum || 1.0)
    * (collabMultiplier ?? 1.0)
    * weekendLift
    * launchBonus
    * organicVariance;

  return enhancedCurve.stabilizedDailyStreams(rawStreams);
}

/**
 * Calculates continuous, organic digital pure sales (iTunes / webstore downloads).
 * Driven organically by dedicated fan devotion, emotional connection, and release momentum
 * with ZERO hardcoded caps.
 */
export function calculateOrganicDailySales(params: {
  dailyStreams: number;
  song: Song;
  artistPopularity: number;
  artistHype: number;
  skills?: PlayerSkillState;
  daysSinceRelease: number;
  isSingle: boolean;
  organicVariance: number;
  salesModifier?: number;
  fans?: number;
}): number {
  const {
    dailyStreams,
    song,
    artistPopularity,
    artistHype,
    skills,
    daysSinceRelease,
    isSingle,
    organicVariance,
    salesModifier,
    fans
  } = params;

  if (dailyStreams <= 0) return 0;

  const safeSkills = getEnsuredSkillState(skills);
  const pop = Math.max(0, Math.min(100, artistPopularity));
  const hype = Math.max(0, Math.min(100, artistHype));
  const quality = Math.max(1, song.quality || 50);
  const potential = Math.max(1, song.basePotential || 50);

  // Emotional connection & lyrical depth convert streaming listeners into buyers:
  const emotionLv = safeSkills.songwriting.emotionalResonance?.level || 1;
  const lyricsLv = safeSkills.songwriting.lyrics?.level || 1;
  const depthLv = safeSkills.songwriting.depth?.level || 1;
  const melodicLv = safeSkills.recording.melodicCadence?.level || 1;

  const buyerConversionMultiplier = 1.0 + (
    (emotionLv - 1) * 0.018 +
    (lyricsLv - 1) * 0.014 +
    (depthLv - 1) * 0.015 +
    (melodicLv - 1) * 0.012
  );

  // Authentic Sales Lifecycle (Front-loaded Day 1 Stan Rush -> Natural Day 2-7 Taper -> Long-Term Conversion):
  let lifecycleSalesFactor: number;
  if (daysSinceRelease === 0) {
    // Launch Day 1: Peak stanbase & pre-order fulfillment
    lifecycleSalesFactor = 1.35 + (hype / 100) * 0.45;
  } else if (daysSinceRelease === 1) {
    // Day 2: Post-launch cooldown
    lifecycleSalesFactor = 1.05 + (hype / 100) * 0.25;
  } else if (daysSinceRelease <= 6) {
    // Days 3-7: Gradual first-week taper
    lifecycleSalesFactor = Math.max(0.72, 0.96 - (daysSinceRelease - 1) * 0.045);
  } else if (daysSinceRelease <= 21) {
    lifecycleSalesFactor = 0.62;
  } else if (daysSinceRelease <= 60) {
    lifecycleSalesFactor = 0.46;
  } else {
    lifecycleSalesFactor = 0.32;
  }

  // B-sides pure digital sales
  const bsideQualityBonus = quality >= 75 ? 1.18 : (potential >= 75 ? 1.10 : 1.0);
  let singleSalesFactor = 1.0;
  if (!isSingle) {
    if (daysSinceRelease <= 7) {
      singleSalesFactor = 0.28 * bsideQualityBonus;
    } else if (daysSinceRelease <= 30) {
      singleSalesFactor = 0.18 * bsideQualityBonus;
    } else {
      singleSalesFactor = Math.max(0.08, 0.14 * Math.pow(quality / 50, 0.65)) * bsideQualityBonus;
    }
  }

  // Music video presence boosts pure digital sales (+8%)
  const mvFactor = song.hasMV ? 1.08 : 1.0;

  // Sub-linear viral stream compression for digital downloads:
  // Passive playlist streams above 1.2M/day convert at a diminishing rate because only core fans buy digital copies on iTunes.
  const effectiveStreamPool =
    dailyStreams <= 1_200_000
      ? dailyStreams
      : 1_200_000 + Math.pow(dailyStreams - 1_200_000, 0.78) * 16.5;

  const fanSynergy = getFanMarketSynergy(fans || 0, safeSkills);
  const basePurchaseRate = isSingle
    ? (daysSinceRelease === 0 ? 0.00032 : daysSinceRelease <= 3 ? 0.00022 : 0.00015)
    : 0.00009;
  const fanLoyaltyFactor = (1.0 + (pop / 100) * 0.28) * Math.min(1.45, Math.pow(fanSynergy.fanSalesBoost, 0.65));
  const qualityAppeal = Math.pow(quality / 58, 0.55);

  const rawSales = effectiveStreamPool
    * basePurchaseRate
    * fanLoyaltyFactor
    * buyerConversionMultiplier
    * lifecycleSalesFactor
    * singleSalesFactor
    * mvFactor
    * qualityAppeal
    * Math.min(2.2, salesModifier ?? 1.0)
    * organicVariance;

  return Math.max(0, Math.round(rawSales));
}

/**
 * Calculates continuous, organic commercial radio airplay.
 * Radio station programmers add tracks based on listener momentum, star power, vocal delivery, and broadcast audio polish.
 */
export function calculateOrganicRadioAirplay(params: {
  song: Song;
  dailyStreams: number;
  artistPopularity: number;
  artistHype: number;
  artistCountry: string;
  skills?: PlayerSkillState;
  daysSinceRelease: number;
  isSingle: boolean;
  radioModifier?: number;
  radioEligibilityMultiplier?: number;
}): {
  dailySpins: number;
  dailyAudience: number;
  tierLabel: string;
} {
  const {
    song,
    dailyStreams,
    artistPopularity,
    artistHype,
    artistCountry,
    skills,
    daysSinceRelease,
    isSingle,
    radioModifier,
    radioEligibilityMultiplier
  } = params;

  // Commercial radio does not service non-single album tracks
  if (!isSingle) {
    return {
      dailySpins: 0,
      dailyAudience: 0,
      tierLabel: 'Unserviced Album Cut'
    };
  }

  const safeSkills = getEnsuredSkillState(skills);
  const pop = Math.max(0, Math.min(100, artistPopularity));
  const hype = Math.max(0, Math.min(100, artistHype));
  const quality = Math.max(1, song.quality || 50);
  const momentum = Math.max(0.1, song.momentum || 1.0);

  // Country market radio share
  const countryProfile = getCountryMarketProfile(artistCountry);
  const territoryPropensity = Math.min(2.0, Math.max(0.5, countryProfile.radioShare / 0.05));

  const structureLv = safeSkills.songwriting.songStructure?.level || 1;
  const vocalLv = safeSkills.recording.vocalDelivery?.level || 1;
  const pitchLv = safeSkills.recording.pitchControl?.level || 1;
  const audioLv = safeSkills.production.audioEngineering?.level || 1;
  const masterLv = safeSkills.production.masteringPolish?.level || 1;

  const programmerSkillScore = (
    (structureLv - 1) * 2.5 +
    (vocalLv - 1) * 2.2 +
    (pitchLv - 1) * 1.5 +
    (audioLv - 1) * 2.0 +
    (masterLv - 1) * 2.8
  );

  const streamingProofScore = Math.min(35, Math.log10(Math.max(10, dailyStreams)) * 6.0);
  const compositeRadioPower = (pop * 0.40) + (hype * 0.18) + (quality * 0.22) + streamingProofScore + programmerSkillScore;

  let waveMultiplier: number;
  if (daysSinceRelease <= 7) {
    // Week 1: Initial impact & station adds
    waveMultiplier = 0.22 + (daysSinceRelease * 0.065);
  } else if (daysSinceRelease <= 35) {
    // Weeks 2-5: Climbing Sub-Power to Heavy Rotation
    waveMultiplier = 0.68 + ((daysSinceRelease - 7) * 0.016);
  } else if (daysSinceRelease <= 56) {
    // Weeks 6-8: Peak Power Rotation window
    waveMultiplier = 1.12 - ((daysSinceRelease - 35) * 0.004);
  } else if (daysSinceRelease <= 98) {
    // Weeks 9-14: Callout burnout & rotation step-down (Power -> Heavy -> Medium)
    const burnoutProgress = (daysSinceRelease - 56) / 42;
    waveMultiplier = Math.max(0.26, 1.03 - (burnoutProgress * 0.77));
  } else if (daysSinceRelease <= 133) {
    // Weeks 15-19: Recurrent transition phase
    const lateProgress = (daysSinceRelease - 98) / 35;
    waveMultiplier = Math.max(0.07, 0.26 - (lateProgress * 0.19));
  } else {
    // Week 20+: Gold / Recurrent catalog airplay only
    waveMultiplier = Math.max(0.025, 0.07 * Math.pow(0.975, daysSinceRelease - 133));
  }

  const eligibility = radioEligibilityMultiplier ?? 1.0;
  const mod = radioModifier ?? 1.0;
  const rawSpins = Math.pow(Math.max(1, compositeRadioPower) / 12, 1.82) * 22 * waveMultiplier * momentum * territoryPropensity * eligibility * mod;
  const dailySpins = Math.max(0, Math.round(rawSpins));

  let tierLabel = 'Indie / College Airplay';
  if (dailySpins >= 950) {
    tierLabel = 'National Power Rotation (Top 40 / CHR)';
  } else if (dailySpins >= 380) {
    tierLabel = 'National Heavy Rotation';
  } else if (dailySpins >= 90) {
    tierLabel = 'Regional Commercial Medium';
  } else if (dailySpins >= 15) {
    tierLabel = 'Emerging Commercial Light';
  }

  const audiencePerSpin = 4800 + Math.min(3500, dailySpins * 2.2);
  const dailyAudience = Math.round(dailySpins * audiencePerSpin);

  return {
    dailySpins,
    dailyAudience,
    tierLabel
  };
}

/**
 * Calculates continuous, organic song momentum decay.
 * Eliminates the bug where momentum artificially multiplied >1.0 every day during Week 1-4.
 */
export function calculateOrganicMomentumDecay(params: {
  song: Song;
  trackRole: TrackRole;
  skills?: PlayerSkillState;
  decayAcceleration?: number;
  daysSinceRelease?: number;
  fans?: number;
}): number {
  const { song, trackRole, skills, decayAcceleration, daysSinceRelease = 0, fans = 0 } = params;
  const safeSkills = getEnsuredSkillState(skills);

  const quality = Math.max(1, song.quality || 50);
  const potential = Math.max(1, song.basePotential || 50);
  const isSmash = quality >= 80 && potential >= 75;
  const currentMomentum = Math.min(1.05, song.momentum || 1.0);

  // Debut Day 1 starts at 1.0 momentum
  if (daysSinceRelease === 0) {
    return 1.0;
  }

  const storyLv = safeSkills.songwriting.storytelling?.level || 1;
  const depthLv = safeSkills.songwriting.depth?.level || 1;
  const fanSynergy = getFanMarketSynergy(fans, safeSkills);

  // Natural daily momentum attrition (slower for smashes and high-skill artists, faster for weak tracks)
  let decayCoeff = isSmash ? 0.0065 : (quality >= 65 ? 0.012 : 0.024);

  const skillDecayResistance = Math.min(2.2, fanSynergy.fanDecayCushion * (1.0 + ((storyLv - 1) * 0.025) + ((depthLv - 1) * 0.020)));
  decayCoeff = decayCoeff / skillDecayResistance;

  const roleDecayMultiplier = (trackRole === 'b_side' ? 1.30 : (trackRole === 'lead_single' ? 0.80 : 0.92)) * (decayAcceleration ?? 1.0);
  const baseDecay = Math.min(0.045, (decayCoeff / Math.max(0.45, quality / 55)) * roleDecayMultiplier);

  const minFloor = trackRole === 'b_side' ? 0.12 : (isSmash ? 0.42 : 0.20);
  return Math.max(minFloor, Number((currentMomentum * (1.0 - baseDecay)).toFixed(4)));
}

