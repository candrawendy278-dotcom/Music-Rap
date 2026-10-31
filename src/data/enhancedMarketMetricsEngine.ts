import { Song, Project } from '../types';

export interface EnhancedSongMarketMultiplierResult {
  streamMultiplier: number;
  salesMultiplier: number;
  playlistOrganicBoost: number;
  viralVelocityBonus: number;
  catalogCarryoverBonus: number;
  superfanSalesBonus: number;
}

/**
 * Calculates enhanced, realistic market multipliers for daily streams, pure sales,
 * and YouTube Music Video views. Rewards high song quality, active playlisting,
 * algorithmic repeat-listener retention, collaboration chemistry, catalog halo effects,
 * and first-week superfan collector support.
 */
export function computeEnhancedSongMarketMultipliers(
  song: Song,
  artistPopularity: number,
  artistHype: number,
  playerFans: number,
  daysOut: number,
  allReleasedSongs: Song[]
): EnhancedSongMarketMultiplierResult {
  const quality = Math.max(10, Math.min(100, Number(song.quality || 60)));
  const hype = Math.max(0, Math.min(100, Number(artistHype || 0)));
  const pop = Math.max(0, Math.min(100, Number(artistPopularity || 0)));
  const fans = Math.max(0, Number(playerFans || 0));
  const momentum = Math.max(0.05, Number(song.momentum ?? 1.0));

  // 1. Word-of-Mouth Quality & Listener Replay Value Multiplier
  // Rare 96-100 masterpieces get stronger post-debut retention; low-quality tracks decay faster after Week 1
  let qualityReplayMult = 1.0;
  if (quality >= 96) {
    qualityReplayMult = daysOut <= 7 ? 1.22 : 1.26;
  } else if (quality >= 91) {
    qualityReplayMult = daysOut <= 7 ? 1.15 : 1.18;
  } else if (quality >= 85) {
    qualityReplayMult = 1.11;
  } else if (quality >= 76) {
    qualityReplayMult = 1.05;
  } else if (quality < 48) {
    qualityReplayMult = daysOut <= 3 ? 0.94 : 0.84;
  } else if (quality < 58 && daysOut > 7) {
    qualityReplayMult = 0.91;
  }

  // 2. Catalog Halo / Carryover Effect
  // When the player has a recent active hit (released within 21 days with strong streams),
  // older discography tracks get an organic discovery lift as new listeners explore the catalog.
  let catalogCarryoverBonus = 1.0;
  if (daysOut > 14 && allReleasedSongs.length > 1) {
    const activeSmash = allReleasedSongs.find(other => {
      if (other.id === song.id) return false;
      const otherDays = other.daysSinceRelease ?? 99;
      return otherDays <= 21 && (other.dailyStreams || 0) >= 65_000;
    });
    if (activeSmash) {
      const smashScale = Math.min(1.18, 1.08 + ((activeSmash.dailyStreams || 0) / 2_500_000) * 0.08);
      catalogCarryoverBonus = smashScale;
    }
  }

  // 3. Collaboration Crossover & Cross-Fanbase Discovery (Singles only, modest & quality-gated)
  const hasCollab = Boolean(song.collabId && song.collabId !== 'none' && song.collabId !== '');
  const isBSide = song.trackType === 'b_side';
  const collabMult =
    hasCollab && !isBSide && quality >= 65
      ? (daysOut <= 7 ? 1.05 : daysOut <= 21 ? 1.02 : 1.0)
      : 1.0;

  // 4. Organic Playlist Reach & Algorithmic Autoplay / Discover Weekly Pickups
  const playlistCount = Array.isArray(song.playlistPlacements) ? song.playlistPlacements.length : 0;
  let playlistOrganicBoost = 0;
  if (playlistCount > 0) {
    const tenureDecay = daysOut <= 14 ? 1.15 : daysOut <= 35 ? 1.0 : Math.max(0.45, 1.0 - (daysOut - 35) * 0.012);
    playlistOrganicBoost = Math.round(
      playlistCount * (1950 + Math.round(quality * 32) + Math.round(pop * 18)) * tenureDecay
    );
  }
  if (daysOut <= 24 && quality >= 74) {
    const algorithmicLift = Math.round(
      (quality - 66) * 260 * (daysOut <= 7 ? 1.45 : daysOut <= 14 ? 1.15 : 0.85) * Math.max(0.65, momentum)
    );
    playlistOrganicBoost += algorithmicLift;
  }

  // 5. Viral Velocity & Audio-Video Synergy Bonus
  let viralVelocityBonus = 1.0;
  if (daysOut <= 14 && quality >= 84 && hype >= 55) {
    viralVelocityBonus = 1.14;
  } else if (daysOut <= 28 && pop >= 68 && quality >= 78) {
    viralVelocityBonus = 1.08;
  }
  // Active Music Video halo on audio streams during premiere fortnight
  if (song.hasMV && daysOut <= 10) {
    viralVelocityBonus *= 1.04;
  }

  // 6. Superfan Pure Sales, Chart-Push Buying & First-Week Collector Surge
  const fanLoyaltyBonus = Math.min(0.18, (fans / 2_200_000) * 0.14);
  let superfanSalesBonus = 1.0 + fanLoyaltyBonus;
  if (daysOut <= 3) {
    superfanSalesBonus *= 1.14; // Opening 72-hour digital buyer rush
  } else if (daysOut <= 7) {
    superfanSalesBonus *= 1.08; // First-week chart tracking push
  } else if (daysOut <= 14 && hype >= 70) {
    superfanSalesBonus *= 1.05; // Second-week stan defense buying
  } else if (daysOut > 30 && quality < 75) {
    superfanSalesBonus *= 0.88; // Faster post-launch pure sales saturation for average tracks
  }

  const streamMultiplier = Number(
    Math.min(1.92, qualityReplayMult * catalogCarryoverBonus * collabMult * viralVelocityBonus).toFixed(3)
  );
  const salesMultiplier = Number(
    Math.min(
      1.42,
      superfanSalesBonus *
        (hasCollab && !isBSide && quality >= 68 ? 1.02 : 1.0) *
        (quality >= 92 ? 1.10 : quality >= 84 ? 1.05 : 1.0)
    ).toFixed(3)
  );

  return {
    streamMultiplier,
    salesMultiplier,
    playlistOrganicBoost,
    viralVelocityBonus,
    catalogCarryoverBonus,
    superfanSalesBonus
  };
}

/**
 * Enhances daily YouTube video views for Official Music Videos
 * with VEVO distribution, visual replay value, premiere trending momentum,
 * and viral audio-to-video spillover while maintaining realistic industry ratios.
 */
export function computeEnhancedYoutubeDailyViews(
  baseViews: number,
  song: Song,
  dailyStreams: number,
  daysSinceRelease: number
): number {
  if (!song.hasMV || baseViews <= 0) return baseViews;

  const quality = Math.max(10, Math.min(100, Number(song.quality || 60)));
  const hasCollab = Boolean(song.collabId && song.collabId !== 'none' && song.collabId !== '');
  let mult = 1.0;

  // 1. VEVO distribution network & homepage curation reach (+7%)
  if (song.mvDistributor === 'vevo') {
    mult *= 1.07;
  }

  // 2. Song & Visual Replay Quality Synergy
  if (quality >= 94) {
    mult *= 1.10;
  } else if (quality >= 86) {
    mult *= 1.06;
  } else if (quality >= 78) {
    mult *= 1.03;
  } else if (quality < 50 && daysSinceRelease > 3) {
    mult *= 0.88;
  }

  // 3. Collaboration Star Power on YouTube Trending (+5% in first 2 weeks)
  if (hasCollab && daysSinceRelease <= 14) {
    mult *= 1.05;
  }

  // 4. Premiere Week YouTube Trending Tab Boost (Days 0-4)
  if (daysSinceRelease <= 2 && quality >= 80) {
    mult *= 1.06;
  } else if (daysSinceRelease <= 5 && quality >= 85) {
    mult *= 1.03;
  }

  // 5. Audio-to-Video Spillover when daily audio streams are surging
  let spilloverViews = 0;
  if ((song.dailyChangePercent || 0) > 5 && daysSinceRelease > 1 && daysSinceRelease <= 30) {
    spilloverViews = Math.round(dailyStreams * 0.035);
  }

  // Cap daily views so they never unnaturally exceed realistic global MV-to-audio ratios
  const maxReasonableViews =
    (song.mvAdsDays || 0) > 0
      ? Math.round(dailyStreams * 1.55 + 50_000)
      : daysSinceRelease <= 2
      ? Math.round(dailyStreams * 1.42)
      : Math.round(dailyStreams * 1.32);

  return Math.max(0, Math.min(maxReasonableViews, Math.round(baseViews * mult + spilloverViews)));
}

/**
 * Enhances daily Album/EP pure & physical/digital sales based on tracklist depth,
 * average track quality, tracklist cohesion, and first-week collector demand.
 */
export function computeEnhancedProjectSales(
  baseProjectSales: number,
  project: Project,
  artistHype: number,
  daysOut: number
): number {
  let mult = 1.0;
  const tracks = Array.isArray(project.songs) ? project.songs : [];
  const trackCount = tracks.length;

  // 1. Tracklist Depth & Format Value
  if (trackCount >= 12) {
    mult *= 1.20;
  } else if (trackCount >= 8) {
    mult *= 1.14;
  } else if (trackCount >= 5) {
    mult *= 1.08;
  }

  // 2. Album Quality & Tracklist Cohesion (rewards critically acclaimed, filler-free projects)
  const projQuality = Number(project.quality || 65);
  if (projQuality >= 92) {
    mult *= 1.18;
  } else if (projQuality >= 85) {
    mult *= 1.11;
  } else if (projQuality >= 76) {
    mult *= 1.05;
  } else if (projQuality < 52) {
    mult *= 0.85;
  }

  // 3. First-Week Physical/Vinyl/Digital Collector Rush vs. Catalog Tail
  if (daysOut <= 2) {
    mult *= 1.28; // Launch weekend pre-order & collector fulfillment
  } else if (daysOut <= 7) {
    mult *= 1.18; // First-week chart push
  } else if (daysOut <= 14 && (artistHype || 0) >= 65) {
    mult *= 1.08;
  }

  // 4. Era Hype Amplification
  if ((artistHype || 0) >= 80) {
    mult *= 1.15;
  } else if ((artistHype || 0) >= 60) {
    mult *= 1.09;
  }

  return Math.max(0, Math.round(baseProjectSales * mult));
}

