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
 * collaboration chemistry, catalog halo effects, and first-week superfan support.
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
  const fans = Math.max(0, Number(playerFans || 0));

  // 1. Word-of-Mouth Quality & Replay Value Multiplier
  let qualityReplayMult = 1.0;
  if (quality >= 92) {
    qualityReplayMult = 1.18;
  } else if (quality >= 85) {
    qualityReplayMult = 1.12;
  } else if (quality >= 75) {
    qualityReplayMult = 1.06;
  } else if (quality < 45) {
    qualityReplayMult = 0.92;
  }

  // 2. Catalog Halo / Carryover Effect
  // If the player has a recent active hit (released within 21 days with strong streams),
  // older catalog tracks get a realistic discovery boost as new fans check out older discography.
  let catalogCarryoverBonus = 1.0;
  if (daysOut > 14 && allReleasedSongs.length > 1) {
    const hasRecentActiveSmash = allReleasedSongs.some(other => {
      if (other.id === song.id) return false;
      const otherDays = other.daysSinceRelease ?? 99;
      return otherDays <= 21 && (other.dailyStreams || 0) >= 75_000;
    });
    if (hasRecentActiveSmash) {
      catalogCarryoverBonus = 1.14;
    }
  }

  // 3. Collaboration Crossover Momentum
  const hasCollab = Boolean(song.collabId && song.collabId !== 'none' && song.collabId !== '');
  const collabMult = hasCollab ? (daysOut <= 14 ? 1.14 : 1.06) : 1.0;

  // 4. Organic Playlist Reach & Algorithmic Pickups
  const playlistCount = Array.isArray(song.playlistPlacements) ? song.playlistPlacements.length : 0;
  let playlistOrganicBoost = 0;
  if (playlistCount > 0) {
    playlistOrganicBoost = playlistCount * (1800 + Math.round(quality * 28));
  }
  if (daysOut <= 21 && quality >= 72) {
    playlistOrganicBoost += Math.round((quality - 65) * 240 * (daysOut <= 7 ? 1.4 : 1.0));
  }

  // 5. Viral Velocity Bonus
  let viralVelocityBonus = 1.0;
  if (daysOut <= 14 && quality >= 82 && hype >= 55) {
    viralVelocityBonus = 1.12;
  } else if (daysOut <= 28 && artistPopularity >= 70 && quality >= 78) {
    viralVelocityBonus = 1.07;
  }

  // 6. Superfan Pure Sales & First-Week Collector Surge
  const fanLoyaltyBonus = Math.min(0.28, (fans / 2_000_000) * 0.25);
  let superfanSalesBonus = 1.0 + fanLoyaltyBonus;
  if (daysOut <= 7) {
    superfanSalesBonus *= 1.22;
  } else if (daysOut <= 14) {
    superfanSalesBonus *= 1.10;
  }

  const streamMultiplier = Number(
    Math.min(1.85, qualityReplayMult * catalogCarryoverBonus * collabMult * viralVelocityBonus).toFixed(3)
  );
  const salesMultiplier = Number(
    Math.min(2.1, superfanSalesBonus * (hasCollab ? 1.10 : 1.0) * (quality >= 85 ? 1.12 : 1.0)).toFixed(3)
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
 * with subtle VEVO distribution & song quality synergy without double-counting premiere spikes.
 */
export function computeEnhancedYoutubeDailyViews(
  baseViews: number,
  song: Song,
  dailyStreams: number,
  _daysSinceRelease: number
): number {
  if (!song.hasMV || baseViews <= 0) return baseViews;

  let mult = 1.0;

  // VEVO distribution network reach (+6%)
  if (song.mvDistributor === 'vevo') {
    mult *= 1.06;
  }

  // High song quality replay synergy (+4%)
  if ((song.quality || 0) >= 85) {
    mult *= 1.04;
  }

  // Cap daily views so they never unnaturally exceed 1.38x of daily audio streams unless an ad campaign is active
  const maxReasonableViews =
    (song.mvAdsDays || 0) > 0
      ? Math.round(dailyStreams * 1.52 + 45_000)
      : Math.round(dailyStreams * 1.35);

  return Math.max(0, Math.min(maxReasonableViews, Math.round(baseViews * mult)));
}

/**
 * Enhances daily Album/EP pure & equivalent sales based on tracklist strength and era momentum.
 */
export function computeEnhancedProjectSales(
  baseProjectSales: number,
  project: Project,
  artistHype: number,
  daysOut: number
): number {
  let mult = 1.0;
  const trackCount = Array.isArray(project.songs) ? project.songs.length : 0;

  if (trackCount >= 10) {
    mult *= 1.18;
  } else if (trackCount >= 5) {
    mult *= 1.09;
  }

  if (daysOut <= 7) {
    mult *= 1.22;
  }

  if ((artistHype || 0) >= 65) {
    mult *= 1.12;
  }

  return Math.max(0, Math.round(baseProjectSales * mult));
}
