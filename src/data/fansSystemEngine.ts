// Fans System Engine
// Handles player fan base acquisition, loyalty tiers, retention, and ecosystem influence.
//
// Key Principles:
// 1. Organic Fan Acquisition:
//    - New releases, viral streams, chart hits, and YouTube music videos attract new listeners.
//    - High Emotional Resonance, Storytelling, and Lyrical Depth turn passive listeners into devoted fans.
// 2. Multi-tier Fan Demographics:
//    - Casual Listeners: Stream current hits, influenced by hype and playlist placement.
//    - Core Fans: Stream singles repeatedly, save tracks to library, attend to releases.
//    - Superfans (Stanbase): Buy pure digital sales on iTunes/webstores, stream catalog front-to-back.
// 3. Market Protection:
//    - Fans provide a permanent audience floor so daily streams do not crash to zero when hype cools down.

import { Song, Project, GameState } from '../types';
import { PlayerSkillState, getEnsuredSkillState } from './skillSystemEngine';

export interface FanEcosystemSnapshot {
  totalFans: number;
  dailyNewFans: number;
  casualFans: number;
  coreFans: number;
  superFans: number;
  fanLoyaltyPercentage: number;
  streamingFloorBoost: number;
  pureSalesDevotionMultiplier: number;
}

/**
 * Returns current fan count or calculates a seamless baseline for existing saves.
 */
export function getEnsuredPlayerFans(state: Partial<GameState>): number {
  if (state.fans !== undefined && state.fans >= 0) {
    return state.fans;
  }
  // Initialize organically from popularity, spotify followers, and released songs
  const pop = state.popularity || 2.0;
  const followers = state.spotify?.followers || 0;
  const releasedCount = (state.songs || []).filter(s => s.status === 'released').length;
  
  const initialFans = Math.max(
    50,
    Math.round((pop * 160) + (followers * 0.75) + (releasedCount * 220))
  );
  return initialFans;
}

/**
 * Calculates daily fan gains and retention across the player's music ecosystem.
 */
export function processDailyFanGrowth(params: {
  currentFans: number;
  popularity: number;
  hype: number;
  dailyStreams: number;
  dailyViews: number;
  dailyPureSales: number;
  releasedSongs: Song[];
  skills?: PlayerSkillState;
  hasRecentRelease: boolean;
}): {
  updatedFans: number;
  dailyGain: number;
  casualFans: number;
  coreFans: number;
  superFans: number;
  loyaltyScore: number;
} {
  const {
    currentFans,
    popularity,
    hype,
    dailyStreams,
    dailyViews,
    dailyPureSales,
    releasedSongs,
    skills,
    hasRecentRelease
  } = params;

  const safeSkills = getEnsuredSkillState(skills);
  const pop = Math.max(0, Math.min(100, popularity));
  const hp = Math.max(0, Math.min(100, hype));

  // 1. Skill-based fan conversion:
  // Emotional connection & lyrical depth turn casual streams into loyal devotees
  const emotionLv = safeSkills.songwriting.emotionalResonance?.level || 1;
  const storyLv = safeSkills.songwriting.storytelling?.level || 1;
  const lyricsLv = safeSkills.songwriting.lyrics?.level || 1;
  const vocalLv = safeSkills.recording.vocalDelivery?.level || 1;

  const fanConversionRate = 1.0 + (
    (emotionLv - 1) * 0.05 +
    (storyLv - 1) * 0.04 +
    (lyricsLv - 1) * 0.03 +
    (vocalLv - 1) * 0.03
  );

  // 2. Sources of daily new fans:
  // - Streaming discovery (realistic listener-to-fan conversion curve)
  const streamDiscoveryFans = dailyStreams > 0 
    ? Math.pow(dailyStreams, 0.48) * 0.34 * fanConversionRate
    : 0;

  // - YouTube MV visual engagement
  const videoDiscoveryFans = dailyViews > 0
    ? Math.pow(dailyViews, 0.45) * 0.24
    : 0;

  // - Pure digital buyers: most pure sales come from existing fans, with a realistic fraction of new collector converts
  const buyerSuperfans = dailyPureSales > 0
    ? Math.pow(dailyPureSales, 0.62) * 1.35
    : 0;

  // - Organic viral word-of-mouth from Hype & Popularity
  const organicWordOfMouth = Math.pow(hp / 10, 1.32) * (1 + pop / 35) * 1.4;

  // - Release momentum bonus
  const releaseBonus = hasRecentRelease ? (25 + hp * 1.2) : 0;

  const rawGains = streamDiscoveryFans + videoDiscoveryFans + buyerSuperfans + organicWordOfMouth + releaseBonus;

  // 3. Realistic Market Saturation & Diminishing Returns:
  // When an artist is small, listener conversion is brisk; as fanbase reaches millions, addressable market saturates naturally.
  const marketSaturationFactor = currentFans <= 15000 
    ? 1.0 
    : Math.max(0.06, 1 / (1 + Math.pow(currentFans / 650000, 0.48)));

  // Natural minor listener attrition / casual drift when artist has huge inactive fanbase without recent drops
  const naturalChurn = (!hasRecentRelease && currentFans > 50000)
    ? Math.round(currentFans * 0.00018 * Math.max(0.1, 1 - (pop / 100)))
    : 0;

  // Realistic daily ceiling scaled by artist popularity, hype, and active streaming reach
  // Prevents any single-day百万 (million+) fan spike exploit while allowing viral smash eras to grow strongly
  const realisticDailyCap = Math.round(
    350 +
      Math.pow(Math.max(1, pop), 1.68) * 16 +
      Math.min(38000, Math.pow(Math.max(0, dailyStreams), 0.56) * 1.45) +
      (hasRecentRelease ? 2500 : 0)
  );

  const unclampedGain = Math.max(0, Math.round(rawGains * marketSaturationFactor) - naturalChurn);
  const totalEffectiveGain = Math.min(realisticDailyCap, unclampedGain);
  const dailyGain = totalEffectiveGain;

  const updatedFans = Math.max(25, currentFans + dailyGain);

  // 4. Demographic breakdown:
  // As skills and catalog mature, a larger % becomes Core and Superfans
  const loyaltyScore = Math.min(100, Math.round(
    35 + (emotionLv * 3.5) + (storyLv * 3.0) + (pop * 0.25)
  ));

  const superFanPct = Math.min(0.25, 0.05 + (loyaltyScore / 500));
  const coreFanPct = Math.min(0.55, 0.25 + (loyaltyScore / 300));
  const casualPct = Math.max(0.20, 1.0 - superFanPct - coreFanPct);

  const superFans = Math.round(updatedFans * superFanPct);
  const coreFans = Math.round(updatedFans * coreFanPct);
  const casualFans = Math.round(updatedFans * casualPct);

  return {
    updatedFans,
    dailyGain,
    casualFans,
    coreFans,
    superFans,
    loyaltyScore
  };
}

/**
 * Calculates fan-driven streaming baseline and pure sales boost.
 * Gives songs enduring playback loyalty so singles don't drop relentlessly!
 */
export function getFanMarketSynergy(fans: number, skills?: PlayerSkillState): {
  fanStreamingBase: number;
  fanSalesBoost: number;
  fanDecayCushion: number;
} {
  const safeSkills = getEnsuredSkillState(skills);
  const emotionLv = safeSkills.songwriting.emotionalResonance?.level || 1;
  const storyLv = safeSkills.songwriting.storytelling?.level || 1;

  const fanStreamingBase = Math.pow(Math.max(10, fans), 0.78) * 0.85;
  const fanSalesBoost = 1.0 + Math.log10(1 + fans / 1000) * 0.18;
  const fanDecayCushion = 1.0 + (Math.log10(1 + fans / 500) * 0.15) + ((emotionLv - 1) * 0.04) + ((storyLv - 1) * 0.03);

  return {
    fanStreamingBase,
    fanSalesBoost,
    fanDecayCushion
  };
}

export function getDetailedFanDemographics(
  stateOrFans: Partial<GameState> | number,
  popularityArg?: number,
  _hypeArg?: number,
  skillsArg?: PlayerSkillState
): {
  totalFans: number;
  casualFans: number;
  casualListeners: number;
  coreFans: number;
  coreSupporters: number;
  superFans: number;
  superfansStans: number;
  casualPct: number;
  corePct: number;
  superPct: number;
  stanPct: number;
  loyaltyScore: number;
  fanbaseTierName: string;
  tierBadgeColor: string;
  tierBadgeClass: string;
  dailyStreamingFloor: number;
  pureSalesMultiplier: number;
  pureSalesMultiplierLabel: string;
  retentionShield: number;
  longevityRetentionLabel: string;
} {
  const isNumberInput = typeof stateOrFans === 'number';
  const totalFans = isNumberInput
    ? Math.max(50, Math.round(stateOrFans))
    : getEnsuredPlayerFans(stateOrFans);
  const safeSkills = getEnsuredSkillState(
    isNumberInput ? skillsArg : stateOrFans.skills
  );
  const pop = Math.max(
    0,
    Math.min(100, (isNumberInput ? popularityArg : stateOrFans.popularity) || 2)
  );

  const emotionLv = safeSkills.songwriting.emotionalResonance?.level || 1;
  const storyLv = safeSkills.songwriting.storytelling?.level || 1;

  const loyaltyScore = Math.min(100, Math.round(
    35 + (emotionLv * 3.5) + (storyLv * 3.0) + (pop * 0.25)
  ));

  const superFanRatio = Math.min(0.28, 0.06 + (loyaltyScore / 450));
  const coreFanRatio = Math.min(0.55, 0.26 + (loyaltyScore / 280));
  const casualRatio = Math.max(0.17, 1.0 - superFanRatio - coreFanRatio);

  const superFans = Math.round(totalFans * superFanRatio);
  const coreFans = Math.round(totalFans * coreFanRatio);
  const casualFans = Math.max(0, totalFans - superFans - coreFans);

  const superPct = Math.round(superFanRatio * 100);
  const corePct = Math.round(coreFanRatio * 100);
  const casualPct = Math.max(0, 100 - superPct - corePct);

  const synergy = getFanMarketSynergy(totalFans, safeSkills);

  let fanbaseTierName = 'Underground Circle';
  let tierBadgeColor = 'bg-neutral-100 text-neutral-600 border border-neutral-200';
  if (totalFans >= 5000000) {
    fanbaseTierName = 'Global Stan Empire';
    tierBadgeColor = 'bg-amber-500/15 text-amber-700 border border-amber-300';
  } else if (totalFans >= 1000000) {
    fanbaseTierName = 'Massive Stan Army';
    tierBadgeColor = 'bg-rose-500/15 text-rose-600 border border-rose-300';
  } else if (totalFans >= 200000) {
    fanbaseTierName = 'Devoted Fandom';
    tierBadgeColor = 'bg-purple-500/15 text-purple-700 border border-purple-300';
  } else if (totalFans >= 25000) {
    fanbaseTierName = 'Loyal Core Movement';
    tierBadgeColor = 'bg-emerald-500/15 text-emerald-700 border border-emerald-300';
  } else if (totalFans >= 2500) {
    fanbaseTierName = 'Cult Following';
    tierBadgeColor = 'bg-sky-500/15 text-sky-700 border border-sky-300';
  }

  const pureSalesMultiplier = Number(synergy.fanSalesBoost.toFixed(2));
  const retentionShield = Number(synergy.fanDecayCushion.toFixed(2));

  return {
    totalFans,
    casualFans,
    casualListeners: casualFans,
    coreFans,
    coreSupporters: coreFans,
    superFans,
    superfansStans: superFans,
    casualPct,
    corePct,
    superPct,
    stanPct: superPct,
    loyaltyScore,
    fanbaseTierName,
    tierBadgeColor,
    tierBadgeClass: tierBadgeColor,
    dailyStreamingFloor: Math.round(synergy.fanStreamingBase),
    pureSalesMultiplier,
    pureSalesMultiplierLabel: `${pureSalesMultiplier.toFixed(2)}x`,
    retentionShield,
    longevityRetentionLabel: `+${Math.round((synergy.fanDecayCushion - 1) * 100)}%`
  };
}

/**
 * Formats fan counts with clean, editorial music industry formatting.
 */
export function formatFanCount(fans: number): string {
  if (fans >= 1000000) {
    return (fans / 1000000).toFixed(1) + 'M';
  }
  if (fans >= 1000) {
    return (fans / 1000).toFixed(1) + 'K';
  }
  return fans.toLocaleString();
}

