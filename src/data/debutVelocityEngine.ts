// Debut Velocity & Launch Strategy Engine
// Models realistic first-week and launch mechanics for official Singles and Album Tracks (B-Sides)
// - Lead Singles: High anticipation Day 1 stream spike, iTunes digital sales rush, radio adds week push, MV premiere wave.
// - Album Drops: First 48-72 hour full-album binge listening across all album tracks, followed by steep natural B-side drop.
// - Album B-Sides: 0 commercial radio, minimal individual downloads (fans buy the full album), front-loaded debut.

import { Song, Project } from '../types';

export interface DebutMultipliers {
  isDebutWeek: boolean;
  daysSinceRelease: number;
  streamMultiplier: number;
  pureSalesMultiplier: number;
  radioAddsMultiplier: number;
  videoPremiereMultiplier: number;
  debutPhase: 'day_one_launch' | 'launch_weekend' | 'debut_week' | 'post_debut' | 'deep_catalog';
  statusDescription: string;
}

/**
 * Calculates authentic debut velocity multipliers for singles and album tracks.
 */
export function calculateDebutVelocity(
  song: Song,
  currentDate: Date,
  parentProject?: Project,
  artistPopularity: number = 20,
  artistHype: number = 20
): DebutMultipliers {
  const songRelease = song.releaseDate ? new Date(song.releaseDate) : currentDate;
  const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - songRelease.getTime()) / (1000 * 60 * 60 * 24)));

  const isBSide = song.trackType === 'b_side';
  const isLeadSingle = song.trackType === 'lead_single';
  const isSingle = !isBSide;

  const hypeBonus = (Math.min(100, artistHype) / 100);
  const popBonus = (Math.min(100, artistPopularity) / 100);

  // Check if parent album was just released (Album Drop Window)
  let isAlbumDropWeek = false;
  if (parentProject && parentProject.releaseDate) {
    const projRelease = new Date(parentProject.releaseDate);
    const daysSinceAlbum = Math.max(0, Math.floor((currentDate.getTime() - projRelease.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysSinceAlbum <= 7) {
      isAlbumDropWeek = true;
    }
  }

  // -------------------------------------------------------------
  // 1. ALBUM TRACK / B-SIDE DEBUT DYNAMICS
  // -------------------------------------------------------------
  if (isBSide) {
    if (daysSinceRelease <= 1 || (isAlbumDropWeek && daysSinceRelease <= 2)) {
      // Day 1-2 Album Binge: Fans stream the album front-to-back
      return {
        isDebutWeek: true,
        daysSinceRelease,
        streamMultiplier: 0.85 + (hypeBonus * 0.35), // Strong initial album rush
        pureSalesMultiplier: 0.05, // Fans buy the full album, virtually zero individual track downloads
        radioAddsMultiplier: 0.0,  // Strictly zero commercial radio for unserviced album cuts
        videoPremiereMultiplier: song.hasMV ? 1.6 : 0,
        debutPhase: 'day_one_launch',
        statusDescription: 'Album Launch Rush (Front-to-back tracklist streaming)'
      };
    }

    if (daysSinceRelease <= 4) {
      // Days 3-4: Casuals begin filtering out non-singles
      return {
        isDebutWeek: true,
        daysSinceRelease,
        streamMultiplier: 0.50 + (hypeBonus * 0.15),
        pureSalesMultiplier: 0.035,
        radioAddsMultiplier: 0.0,
        videoPremiereMultiplier: song.hasMV ? 1.2 : 0,
        debutPhase: 'launch_weekend',
        statusDescription: 'Post-Launch Dropoff (Album track decay accelerating)'
      };
    }

    if (daysSinceRelease <= 7) {
      // Days 5-7: End of debut tracking week
      return {
        isDebutWeek: true,
        daysSinceRelease,
        streamMultiplier: 0.28,
        pureSalesMultiplier: 0.02,
        radioAddsMultiplier: 0.0,
        videoPremiereMultiplier: 1.0,
        debutPhase: 'debut_week',
        statusDescription: 'Debut Tracking Week Finale'
      };
    }

    if (daysSinceRelease <= 21) {
      return {
        isDebutWeek: false,
        daysSinceRelease,
        streamMultiplier: 0.12,
        pureSalesMultiplier: 0.015,
        radioAddsMultiplier: 0.0,
        videoPremiereMultiplier: 1.0,
        debutPhase: 'post_debut',
        statusDescription: 'Catalog Album Cut (Dedicated listeners only)'
      };
    }

    return {
      isDebutWeek: false,
      daysSinceRelease,
      streamMultiplier: 0.05,
      pureSalesMultiplier: 0.01,
      radioAddsMultiplier: 0.0,
      videoPremiereMultiplier: 1.0,
      debutPhase: 'deep_catalog',
      statusDescription: 'Deep Album Cut'
    };
  }

  // -------------------------------------------------------------
  // 2. OFFICIAL SINGLE DEBUT DYNAMICS (Lead Single & Standalone)
  // -------------------------------------------------------------
  if (daysSinceRelease <= 1) {
    // Day 1 Launch Spike: Maximum fan anticipation & media coverage
    const day1StreamBoost = isLeadSingle
      ? 2.2 + (hypeBonus * 0.6) + (popBonus * 0.4) // Up to 3.2x on Day 1 for hyped superstars
      : 1.7 + (hypeBonus * 0.4);

    const day1SalesBoost = 3.2 + (hypeBonus * 1.2); // Massive Day 1 digital storefront buying
    const radioBoost = isLeadSingle ? 1.5 : 1.2;     // Radio impact week adds

    return {
      isDebutWeek: true,
      daysSinceRelease,
      streamMultiplier: day1StreamBoost,
      pureSalesMultiplier: day1SalesBoost,
      radioAddsMultiplier: radioBoost,
      videoPremiereMultiplier: song.hasMV ? 2.6 : 0,
      debutPhase: 'day_one_launch',
      statusDescription: 'Global Single Premiere (Anticipation Spike)'
    };
  }

  if (daysSinceRelease <= 3) {
    // Launch Weekend: First 72 hours
    return {
      isDebutWeek: true,
      daysSinceRelease,
      streamMultiplier: isLeadSingle ? 1.75 + (hypeBonus * 0.3) : 1.35,
      pureSalesMultiplier: 2.2 + (hypeBonus * 0.5),
      radioAddsMultiplier: 1.35,
      videoPremiereMultiplier: song.hasMV ? 1.8 : 0,
      debutPhase: 'launch_weekend',
      statusDescription: 'Debut Weekend Push (Playlist pickup & radio rotation)'
    };
  }

  if (daysSinceRelease <= 7) {
    // Rest of Week 1: Chart battle for debut ranking
    return {
      isDebutWeek: true,
      daysSinceRelease,
      streamMultiplier: isLeadSingle ? 1.35 : 1.15,
      pureSalesMultiplier: 1.6,
      radioAddsMultiplier: 1.2,
      videoPremiereMultiplier: song.hasMV ? 1.3 : 0,
      debutPhase: 'debut_week',
      statusDescription: 'Debut Tracking Week Battle'
    };
  }

  if (daysSinceRelease <= 28) {
    // Week 2-4: Post-debut stabilization
    return {
      isDebutWeek: false,
      daysSinceRelease,
      streamMultiplier: isLeadSingle ? 1.10 : 0.95,
      pureSalesMultiplier: 1.1,
      radioAddsMultiplier: 1.15,
      videoPremiereMultiplier: 1.0,
      debutPhase: 'post_debut',
      statusDescription: 'Mainstream Chart Longevity Phase'
    };
  }

  // Sustained catalog
  return {
    isDebutWeek: false,
    daysSinceRelease,
    streamMultiplier: isLeadSingle ? 0.95 : 0.85,
    pureSalesMultiplier: 0.9,
    radioAddsMultiplier: 1.0,
    videoPremiereMultiplier: 1.0,
    debutPhase: 'deep_catalog',
    statusDescription: 'Established Catalog Single'
  };
}
