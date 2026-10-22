// Enhanced Organic Streaming Curve & Fanbase/Hype Retention Engine
// Delivers:
// 1. Authentic front-loaded Debut Day -> Day 2-7 natural cooldown -> Week 2+ trajectory
//    driven by Song Quality, Studio Synergy, Hype, and Dedicated Fanbase.
// 2. Zero hardcoded stream ceilings or artificial walls.
// 3. Natural day-to-day breathing room without locking a track to its Day 1 debut number.

import { Song } from '../types';
import { HitArchetype } from './songHitViabilityEngine';
import { PlayerSkillState, getEnsuredSkillState } from './skillSystemEngine';

export interface EnhancedStreamingStabilityResult {
  continuousLifecycleFactor: number;
  fanAndHypeRetentionBoost: number;
  recurrentCatalogFloorStreams: number;
  stabilizedDailyStreams: (rawCalculatedStreams: number) => number;
}

/**
 * Calculates a continuous, non-stepped lifecycle retention factor based on:
 * - Song Quality (1 - 100)
 * - Hit Archetype & Studio Synergy
 * - Artist Hype & Dedicated Fanbase
 * - Days Since Release (0 = Debut Day 1, 1 = Day 2, etc.)
 */
export function evaluateEnhancedStreamingCurve(params: {
  song: Song;
  daysSinceRelease: number;
  artistPopularity: number;
  artistHype: number;
  fans: number;
  isSingle: boolean;
  archetype: HitArchetype;
  synergyScore: number;
  skills?: PlayerSkillState;
}): EnhancedStreamingStabilityResult {
  const {
    song,
    daysSinceRelease,
    artistPopularity,
    artistHype,
    fans,
    isSingle,
    archetype,
    synergyScore,
    skills
  } = params;

  const safeSkills = getEnsuredSkillState(skills);
  const quality = Math.max(1, Math.min(100, song.quality || 50));
  const potential = Math.max(1, Math.min(130, song.basePotential || 50));
  const pop = Math.max(0, Math.min(100, artistPopularity || 2));
  const hype = Math.max(0, Math.min(100, artistHype || 15));
  const safeFans = Math.max(50, fans || 250);

  // 1. Quality & Craft Longevity Index
  const emotionLv = safeSkills.songwriting.emotionalResonance?.level || 1;
  const storyLv = safeSkills.songwriting.storytelling?.level || 1;
  const hookLv = safeSkills.songwriting.melodyHook?.level || 1;
  const masterLv = safeSkills.production.masteringPolish?.level || 1;

  const craftLongevityBonus =
    (emotionLv - 1) * 0.02 +
    (storyLv - 1) * 0.02 +
    (hookLv - 1) * 0.018 +
    (masterLv - 1) * 0.012;

  const qualityNormalized = quality / 100;
  const qualityStabilityScore = Math.min(
    1.28,
    (qualityNormalized * 0.58) + ((Math.min(100, potential) / 100) * 0.18) + ((synergyScore - 0.8) * 0.30) + craftLongevityBonus
  );

  // 2. Fanbase & Hype Long-Term Retention Cushion
  const fanLogScale = Math.log10(1 + safeFans / 500);
  const hypeSustainedPower = Math.pow(hype / 100, 0.85);

  const fanAndHypeRetentionBoost =
    1.0 +
    (fanLogScale * 0.065) +
    (hypeSustainedPower * 0.16) +
    (quality >= 75 ? (quality - 70) * 0.004 : 0);

  // 3. Realistic Lifecycle Curve (Front-Loaded Day 1 Debut -> Natural Week 1 Settle -> Long-Term Run)
  let continuousLifecycleFactor = 1.0;

  if (isSingle) {
    let baseHalfLifeDays = 32;
    if (archetype === 'mega_smash') baseHalfLifeDays = 68;
    else if (archetype === 'solid_hit') baseHalfLifeDays = 46;
    else if (archetype === 'critical_darling') baseHalfLifeDays = 38;
    else if (archetype === 'polarizing_flop') baseHalfLifeDays = 14;

    const effectiveHalfLife =
      baseHalfLifeDays *
      (0.75 + qualityStabilityScore * 0.55) *
      (1.0 + fanLogScale * 0.10 + hypeSustainedPower * 0.15);

    // Target ratio at Day 7 (daysSinceRelease === 6) relative to Day 1 post-launch baseline:
    const week1TargetRatio =
      archetype === 'mega_smash'
        ? 0.76
        : archetype === 'solid_hit'
        ? 0.66
        : archetype === 'critical_darling'
        ? 0.58
        : archetype === 'polarizing_flop'
        ? 0.38
        : 0.56;

    if (daysSinceRelease === 0) {
      // Debut Day 1: Full premiere baseline (multiplied further by launchSurge)
      continuousLifecycleFactor = 1.0;
    } else if (daysSinceRelease <= 6) {
      // Days 2 to 7 (daysSinceRelease 1..6): Smooth exponential settle from 1.0 toward week1TargetRatio
      const progress = daysSinceRelease / 6;
      const curveProgress = 1 - Math.pow(1 - progress, 1.35);
      continuousLifecycleFactor = 1.0 - (1.0 - week1TargetRatio) * curveProgress;
    } else if (daysSinceRelease <= 35) {
      // Weeks 2 to 5: Organic chart run from week1TargetRatio
      const elapsedPostWeek1 = daysSinceRelease - 6;
      const exponentialHold = Math.exp(-elapsedPostWeek1 / Math.max(16, effectiveHalfLife));

      // Subtle second-wind wave ONLY for high-synergy smashes in Weeks 2-3
      const secondWindWave =
        archetype === 'mega_smash' && quality >= 82 && hype >= 50
          ? 1.0 + Math.sin((elapsedPostWeek1 / 24) * Math.PI) * 0.06
          : 1.0;

      continuousLifecycleFactor = Math.max(0.20, week1TargetRatio * exponentialHold * secondWindWave);
    } else {
      // Day 36+: Smooth transition into recurrent catalog streams
      const day35Val = Math.max(0.22, week1TargetRatio * Math.exp(-29 / Math.max(16, effectiveHalfLife)));
      const catalogElapsed = daysSinceRelease - 35;
      const slowDecay = Math.exp(-catalogElapsed / Math.max(40, effectiveHalfLife * 1.8));

      const permanentFloorRatio = Math.min(
        0.34,
        (archetype === 'mega_smash' ? 0.18 : archetype === 'solid_hit' ? 0.12 : 0.07) *
          (0.85 + qualityNormalized * 0.35) *
          (1.0 + fanLogScale * 0.06 + (pop / 100) * 0.12)
      );

      continuousLifecycleFactor =
        permanentFloorRatio + (day35Val - permanentFloorRatio) * slowDecay;
    }
  } else {
    // Album B-Sides: Front-loaded album release day, then settling into album cut streams
    const bSideHalfLife = (18 + quality * 0.28) * (1.0 + fanLogScale * 0.08);
    const permanentBSideFloor = Math.min(0.26, (0.09 + qualityNormalized * 0.10) * (1.0 + fanLogScale * 0.05));
    continuousLifecycleFactor =
      permanentBSideFloor + (1.0 - permanentBSideFloor) * Math.exp(-daysSinceRelease / bSideHalfLife);
  }

  // 4. Recurrent Catalog Floor Streams from Loyal Fanbase
  const fanBaseDailyPerTrack = Math.pow(safeFans, 0.72) * (isSingle ? 0.38 : 0.16);
  const hypeDailyCatalyst = Math.pow(hype, 1.25) * (isSingle ? 8 : 3.5);
  const qualityRetentionMultiplier = Math.pow(quality / 55, 0.85);
  const recurrentCatalogFloorStreams = Math.round(
    (fanBaseDailyPerTrack + hypeDailyCatalyst) * qualityRetentionMultiplier * continuousLifecycleFactor
  );

  // 5. Natural Daily Stream Stabilizer
  // Does NOT block Week 1 post-debut cooldown! Only prevents erratic 40%+ single-day drops in deep catalog (Day 10+)
  const stabilizedDailyStreams = (rawCalculatedStreams: number): number => {
    const withFloor = Math.max(rawCalculatedStreams, recurrentCatalogFloorStreams);
    const prevDaily = song.dailyStreams;

    // During Week 1 (daysSinceRelease 0..7), let the natural post-debut cooldown & daily variance happen freely!
    if (prevDaily && prevDaily > 0 && daysSinceRelease >= 8) {
      const maxAllowedDropRatio =
        quality >= 80
          ? 0.12
          : quality >= 65
          ? 0.15
          : 0.20;
      const minSmoothThreshold = prevDaily * (1.0 - maxAllowedDropRatio);

      const blended = withFloor < minSmoothThreshold
        ? (minSmoothThreshold * 0.55 + withFloor * 0.45)
        : (prevDaily * 0.15 + withFloor * 0.85);

      return Math.max(25, Math.round(blended));
    }

    return Math.max(25, Math.round(withFloor));
  };

  return {
    continuousLifecycleFactor: Number(continuousLifecycleFactor.toFixed(4)),
    fanAndHypeRetentionBoost: Number(fanAndHypeRetentionBoost.toFixed(3)),
    recurrentCatalogFloorStreams,
    stabilizedDailyStreams
  };
}

