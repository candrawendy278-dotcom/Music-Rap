/**
 * Artist Growth Engine
 * Dedicated system governing dynamic Popularity and Hype progression,
 * viral surges, streaming conversion, and natural industry cooling/decay.
 */

import { Song, Project } from '../types';

export interface GrowthMetricsInput {
  currentPopularity: number;
  currentHype: number;
  dailyStreamsTotal: number;
  dailyViewsTotal: number;
  dailyPureSalesTotal: number;
  releasedSongs: Song[];
  releasedProjects: Project[];
  currentDateStr: string;
  isHiatus?: boolean;
}

export interface GrowthMetricsOutput {
  newPopularity: number;
  newHype: number;
  popDelta: number;
  hypeDelta: number;
  trend: 'exploding' | 'growing' | 'steady' | 'cooling' | 'stagnant';
  statusDescription: string;
}

export function getPopularityTierInfo(popularity: number, releasedSongsCount = 0): {
  tierName: string;
  badgeColor: string;
  badgeClass: string;
  careerFloor: number;
  streamMultiplier: string;
  perkDescription: string;
  nextTierAt: number;
  progressInTier: number;
} {
  const careerFloor = Math.max(2.0, Math.min(35.0, Number((releasedSongsCount * 0.8).toFixed(1))));
  const pop = Math.max(0, Math.min(100, popularity || 0));
  const mult = (1 + (pop / 100) * 2.2).toFixed(2) + 'x';

  if (pop >= 88) {
    const cls = 'bg-amber-500/15 text-amber-700 border border-amber-300';
    return {
      tierName: 'Generational Icon',
      badgeColor: cls,
      badgeClass: cls,
      careerFloor,
      streamMultiplier: mult,
      perkDescription: `${mult} organic stream reach · Maximum global tour & chart prestige`,
      nextTierAt: 100,
      progressInTier: 100
    };
  }
  if (pop >= 72) {
    const cls = 'bg-purple-500/15 text-purple-700 border border-purple-300';
    return {
      tierName: 'Global Superstar',
      badgeColor: cls,
      badgeClass: cls,
      careerFloor,
      streamMultiplier: mult,
      perkDescription: `${mult} organic stream reach · Priority editorial & global radio rotation`,
      nextTierAt: 88,
      progressInTier: Math.round(((pop - 72) / 16) * 100)
    };
  }
  if (pop >= 52) {
    const cls = 'bg-blue-500/15 text-blue-700 border border-blue-300';
    return {
      tierName: 'Chart Headliner',
      badgeColor: cls,
      badgeClass: cls,
      careerFloor,
      streamMultiplier: mult,
      perkDescription: `${mult} organic stream reach · Strong first-week debuts & playlisting`,
      nextTierAt: 72,
      progressInTier: Math.round(((pop - 52) / 20) * 100)
    };
  }
  if (pop >= 32) {
    const cls = 'bg-emerald-500/15 text-emerald-700 border border-emerald-300';
    return {
      tierName: 'Mainstream Contender',
      badgeColor: cls,
      badgeClass: cls,
      careerFloor,
      streamMultiplier: mult,
      perkDescription: `${mult} organic stream reach · Growing radio & mainstream recognition`,
      nextTierAt: 52,
      progressInTier: Math.round(((pop - 32) / 20) * 100)
    };
  }
  if (pop >= 15) {
    const cls = 'bg-sky-500/15 text-sky-700 border border-sky-300';
    return {
      tierName: 'Rising Star',
      badgeColor: cls,
      badgeClass: cls,
      careerFloor,
      streamMultiplier: mult,
      perkDescription: `${mult} organic stream reach · Breakout momentum across streaming charts`,
      nextTierAt: 32,
      progressInTier: Math.round(((pop - 15) / 17) * 100)
    };
  }
  if (pop >= 6) {
    const cls = 'bg-teal-500/15 text-teal-700 border border-teal-300';
    return {
      tierName: 'Emerging Act',
      badgeColor: cls,
      badgeClass: cls,
      careerFloor,
      streamMultiplier: mult,
      perkDescription: `${mult} organic stream reach · Building early indie buzz & playlist discovery`,
      nextTierAt: 15,
      progressInTier: Math.round(((pop - 6) / 9) * 100)
    };
  }
  const cls = 'bg-neutral-100 text-neutral-600 border border-neutral-200';
  return {
    tierName: 'Underground Act',
    badgeColor: cls,
    badgeClass: cls,
    careerFloor,
    streamMultiplier: mult,
    perkDescription: `${mult} organic stream reach · Release singles & build Hype to grow fanbase`,
    nextTierAt: 6,
    progressInTier: Math.round((pop / 6) * 100)
  };
}

export function getHypeStatusInfo(hype: number, _popularity = 0): {
  stateName: string;
  statusLabel: string;
  badgeColor: string;
  badgeClass: string;
  debutSurgeBonus: string;
  streamMultiplier: number;
  conversionPotential: string;
  coolingRateLabel: string;
  decayRateLabel: string;
} {
  const hp = Math.max(0, Math.min(100, hype || 0));
  const debutBonus = `+${Math.round(hp * 1.35)}%`;
  const streamMultiplier = Number((1 + (hp / 100) * 1.35).toFixed(2));
  const popConversionPerDay = hp > 22 ? Number(((hp - 18) * 0.013).toFixed(2)) : 0;
  const conversionPotential = popConversionPerDay > 0 ? `+${popConversionPerDay}%/d` : 'Needs >22% Hype';

  if (hp >= 85) {
    const cls = 'bg-rose-500/15 text-rose-600 border border-rose-300';
    return {
      stateName: 'Cultural Phenomenon',
      statusLabel: 'Cultural Phenomenon',
      badgeColor: cls,
      badgeClass: cls,
      debutSurgeBonus: debutBonus,
      streamMultiplier,
      conversionPotential,
      coolingRateLabel: 'High volatility',
      decayRateLabel: 'Peak viral buzz (fast natural cooling)'
    };
  }
  if (hp >= 65) {
    const cls = 'bg-orange-500/15 text-orange-600 border border-orange-300';
    return {
      stateName: 'Viral Fever',
      statusLabel: 'Viral Fever',
      badgeColor: cls,
      badgeClass: cls,
      debutSurgeBonus: debutBonus,
      streamMultiplier,
      conversionPotential,
      coolingRateLabel: 'Active buzz',
      decayRateLabel: 'Strong viral wave'
    };
  }
  if (hp >= 42) {
    const cls = 'bg-amber-500/15 text-amber-700 border border-amber-300';
    return {
      stateName: 'High Voltage',
      statusLabel: 'High Voltage',
      badgeColor: cls,
      badgeClass: cls,
      debutSurgeBonus: debutBonus,
      streamMultiplier,
      conversionPotential,
      coolingRateLabel: 'Moderate decay',
      decayRateLabel: 'Sustained media & social attention'
    };
  }
  if (hp >= 22) {
    const cls = 'bg-emerald-500/15 text-emerald-700 border border-emerald-300';
    return {
      stateName: 'Building Buzz',
      statusLabel: 'Building Buzz',
      badgeColor: cls,
      badgeClass: cls,
      debutSurgeBonus: debutBonus,
      streamMultiplier,
      conversionPotential,
      coolingRateLabel: 'Stable attention',
      decayRateLabel: 'Converting buzz into core fans'
    };
  }
  if (hp >= 10) {
    const cls = 'bg-sky-500/15 text-sky-700 border border-sky-300';
    return {
      stateName: 'Steady Attention',
      statusLabel: 'Steady Attention',
      badgeColor: cls,
      badgeClass: cls,
      debutSurgeBonus: debutBonus,
      streamMultiplier,
      conversionPotential,
      coolingRateLabel: 'Low decay',
      decayRateLabel: 'Mild daily cooling'
    };
  }
  const cls = 'bg-neutral-100 text-neutral-500 border border-neutral-200';
  return {
    stateName: 'Quiet Cycle',
    statusLabel: 'Quiet Cycle',
    badgeColor: cls,
    badgeClass: cls,
    debutSurgeBonus: debutBonus,
    streamMultiplier,
    conversionPotential,
    coolingRateLabel: 'Needs new release',
    decayRateLabel: 'Drop a single or MV to spark Hype'
  };
}

/**
 * Calculates daily shifts for artist Popularity and Hype.
 * - Hype is volatile public attention (rises quickly with hits, cools down when quiet).
 * - Popularity is long-term core fanbase & industry status (converts from sustained hype & streaming).
 */
export function calculateDailyArtistGrowth(input: GrowthMetricsInput): GrowthMetricsOutput {
  const {
    currentPopularity,
    currentHype,
    dailyStreamsTotal,
    dailyViewsTotal,
    dailyPureSalesTotal,
    releasedSongs,
    releasedProjects,
    currentDateStr,
    isHiatus = false
  } = input;

  // 1. Check for recent releases (within 14 days)
  const currentTs = new Date(currentDateStr).getTime();
  let hasRecentRelease = false;
  let hotTracksCount = 0;

  releasedSongs.forEach(song => {
    if (song.releaseDate) {
      const daysSinceRelease = (currentTs - new Date(song.releaseDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRelease >= 0 && daysSinceRelease <= 14) {
        hasRecentRelease = true;
      }
    }
    if ((song.momentum || 0) > 0.75 || (song.dailyStreams || 0) > 100000) {
      hotTracksCount++;
    }
  });

  // -----------------------------------------------------------------------------------
  // A. HYPE CALCULATION (Volatile Cultural Momentum: 1.0% - 100.0%)
  // -----------------------------------------------------------------------------------
  let hypeGain = 0;
  let hypeLoss = 0;

  // Natural attention decay: higher hype decays faster as public attention moves on
  if (isHiatus) {
    hypeLoss = currentHype * 0.005;
  } else if (currentHype > 75) {
    hypeLoss = 1.45 + (currentHype * 0.020);
  } else if (currentHype > 40) {
    hypeLoss = 0.8 + (currentHype * 0.014);
  } else if (currentHype > 15) {
    hypeLoss = 0.35 + (currentHype * 0.011);
  } else {
    hypeLoss = 0.18 + (currentHype * 0.007);
  }

  // Boost 1: Daily Streaming Volume Buzz
  if (dailyStreamsTotal > 5000000) {
    hypeGain += 4.6 + Math.min(3.5, (dailyStreamsTotal / 5000000) * 1.5);
  } else if (dailyStreamsTotal > 1000000) {
    hypeGain += 2.5 + (dailyStreamsTotal / 1000000) * 0.85;
  } else if (dailyStreamsTotal > 250000) {
    hypeGain += 1.25 + (dailyStreamsTotal / 250000) * 0.5;
  } else if (dailyStreamsTotal > 50000) {
    hypeGain += 0.55 + (dailyStreamsTotal / 50000) * 0.3;
  } else if (dailyStreamsTotal > 10000) {
    hypeGain += 0.28;
  }

  // Boost 2: YouTube Video Virality
  if (dailyViewsTotal > 3000000) {
    hypeGain += 2.5;
  } else if (dailyViewsTotal > 800000) {
    hypeGain += 1.2;
  } else if (dailyViewsTotal > 100000) {
    hypeGain += 0.45;
  }

  // Boost 3: Direct Sales Buzz
  if (dailyPureSalesTotal > 1000) {
    hypeGain += 1.1;
  } else if (dailyPureSalesTotal > 200) {
    hypeGain += 0.4;
  }

  // Boost 4: Fresh Release Energy (active promotional era)
  if (hasRecentRelease) {
    hypeGain += 1.3;
  }

  // Boost 5: Multiple Charting/Hot Tracks Buzz
  if (hotTracksCount > 0) {
    hypeGain += Math.min(2.2, hotTracksCount * 0.48);
  }

  const rawHypeDelta = hypeGain - hypeLoss;
  const newHype = Math.min(100, Math.max(1.0, currentHype + rawHypeDelta));
  const hypeDelta = newHype - currentHype;

  // -----------------------------------------------------------------------------------
  // B. POPULARITY CALCULATION (Core Fanbase & Industry Prestige: 1.0% - 100.0%)
  // -----------------------------------------------------------------------------------
  let popGain = 0;
  let popLoss = 0;

  // Gain 1: Conversion from sustained Hype into permanent followers
  if (currentHype > 22) {
    popGain += (currentHype - 18) * 0.013;
  }

  // Gain 2: Cumulative streaming footprint prestige
  if (dailyStreamsTotal > 2000000) {
    popGain += 0.38;
  } else if (dailyStreamsTotal > 500000) {
    popGain += 0.20;
  } else if (dailyStreamsTotal > 100000) {
    popGain += 0.09;
  } else if (dailyStreamsTotal > 25000) {
    popGain += 0.04;
  }

  // Gain 3: Catalog Foundation (albums & EPs released give solid permanent respect)
  const fullAlbumsCount = releasedProjects.filter(p => p.type === 'album').length;
  const epsCount = releasedProjects.filter(p => p.type === 'ep').length;
  if ((fullAlbumsCount > 0 || epsCount > 0) && dailyStreamsTotal > 35000) {
    popGain += Math.min(0.18, fullAlbumsCount * 0.045 + epsCount * 0.02);
  }

  // Decay: Inactivity and fading relevance
  if (!hasRecentRelease && currentHype < 18 && dailyStreamsTotal < 15000) {
    const inactivityFactor = currentHype < 10 ? 0.16 : 0.07;
    popLoss = isHiatus ? 0.02 : inactivityFactor;
  } else if (currentHype < 12 && dailyStreamsTotal < 5000) {
    popLoss = 0.20;
  }

  // Protect established artists from dropping below a legacy floor
  const careerFloor = Math.max(2.0, Math.min(35.0, releasedSongs.length * 0.8));
  if (currentPopularity <= careerFloor) {
    popLoss = Math.min(popLoss, 0.02);
  }

  const rawPopDelta = popGain - popLoss;
  const newPopularity = Math.min(100, Math.max(careerFloor, currentPopularity + rawPopDelta));
  const popDelta = newPopularity - currentPopularity;

  // -----------------------------------------------------------------------------------
  // C. TREND ASSESSMENT & STATUS DESCRIPTION
  // -----------------------------------------------------------------------------------
  let trend: GrowthMetricsOutput['trend'] = 'steady';
  let statusDescription = 'Your career metrics are steady.';

  if (hypeDelta > 2.0 || popDelta > 0.4) {
    trend = 'exploding';
    statusDescription = 'Virality is surging! Streams and social buzz are driving rapid growth.';
  } else if (hypeDelta > 0.3 || popDelta > 0.1) {
    trend = 'growing';
    statusDescription = 'Solid upward momentum driven by consistent listening.';
  } else if (hypeDelta < -1.5 && popDelta < -0.05) {
    trend = 'stagnant';
    statusDescription = 'Attention is fading due to lack of recent releases or viral hits.';
  } else if (hypeDelta < -0.4) {
    trend = 'cooling';
    statusDescription = 'Public buzz is cooling down. Consider releasing new music or promo.';
  }

  return {
    newPopularity: Number(newPopularity.toFixed(2)),
    newHype: Number(newHype.toFixed(2)),
    popDelta: Number(popDelta.toFixed(2)),
    hypeDelta: Number(hypeDelta.toFixed(2)),
    trend,
    statusDescription
  };
}

