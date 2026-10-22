// B-Side and Single Strategy Engine
// Manages the realistic music industry dynamics distinguishing official Singles vs Album B-Sides:
// - Singles receive full promotional push: heavy playlisting, radio adds, MV views, long decay.
// - B-Sides receive an initial album release week rush, followed by steep natural decay.
// - B-Sides get NO or negligible radio airplay (radio programmers only spin official singles).
// - B-Sides have minimal individual track sales (fans buy the album, not deep cut downloads).
// - Recalibrates superstar (100 Pop / 100 Hype) streaming ceilings to realistic industry bounds.

import { Song, Project } from '../types';

export type TrackRole = 'lead_single' | 'single' | 'promotional_single' | 'b_side';

export interface TrackPromotionProfile {
  role: TrackRole;
  isSingle: boolean;
  streamingMultiplier: number;
  radioEligibilityMultiplier: number;
  pureSalesMultiplier: number;
  decayAcceleration: number;
}

/**
 * Evaluates whether a song functions as an official Single or an Album B-Side track.
 */
export function evaluateTrackRole(song: Song, allProjects: Project[]): TrackRole {
  // 1. If explicitly marked in track data
  if ((song as any).trackType) {
    return (song as any).trackType as TrackRole;
  }

  // 2. Songs with official music videos or distributor push are treated as singles
  if (song.hasMV || (song.playlistPlacements && song.playlistPlacements.length > 0)) {
    return 'single';
  }

  // 3. Check if song belongs to an EP or Album project
  const parentProject = allProjects.find(p => 
    p.songs && p.songs.some(ps => ps.id === song.id)
  );

  if (parentProject) {
    if (parentProject.type === 'single_pack') {
      return 'single';
    }
    // If it's on an EP or Album:
    // Was it released BEFORE the album? (Lead single)
    if (song.releaseDate && parentProject.releaseDate && song.releaseDate < parentProject.releaseDate) {
      return 'lead_single';
    }
    // If it was released with the album and has no MV / no playlist placement, it's a B-Side!
    return 'b_side';
  }

  // Default standalone release without an album is a single
  return 'single';
}

/**
 * Computes promotional coefficients for a track based on its role and days since release.
 */
export function getTrackPromotionProfile(
  role: TrackRole,
  daysSinceRelease: number
): TrackPromotionProfile {
  if (role === 'b_side') {
    // B-Sides maintain healthy, realistic album consumption:
    let albumRushMultiplier = 0.36;
    if (daysSinceRelease <= 2) {
      albumRushMultiplier = 0.52; // Day 1-2 initial album binge listening
    } else if (daysSinceRelease <= 7) {
      albumRushMultiplier = 0.42; // Week 1 strong album presence
    } else if (daysSinceRelease <= 14) {
      albumRushMultiplier = 0.35; // Week 2 healthy listening
    } else if (daysSinceRelease <= 30) {
      albumRushMultiplier = 0.30; // Month 1 sustained play
    } else {
      albumRushMultiplier = 0.25; // Long tail catalog listening (healthy baseline, NOT collapsing!)
    }

    return {
      role: 'b_side',
      isSingle: false,
      streamingMultiplier: albumRushMultiplier,
      // Radio programmers DO NOT spin album deep cuts unless serviced as official singles:
      radioEligibilityMultiplier: 0.0,
      // Fans buy the full album, occasional individual downloads for B-sides:
      pureSalesMultiplier: 0.045,
      // B-sides decay gently without falling off a cliff
      decayAcceleration: 1.08
    };
  }

  if (role === 'lead_single') {
    return {
      role: 'lead_single',
      isSingle: true,
      streamingMultiplier: 1.20,
      radioEligibilityMultiplier: 1.25,
      pureSalesMultiplier: 1.20,
      decayAcceleration: 0.75 // Superior longevity
    };
  }

  // Standard Single
  return {
    role: 'single',
    isSingle: true,
    streamingMultiplier: 1.05,
    radioEligibilityMultiplier: 1.0,
    pureSalesMultiplier: 1.0,
    decayAcceleration: 1.0
  };
}

/**
 * Calculates realistic, grounded superstar daily stream velocity.
 * Resolves user feedback:
 * Even with popularity 100 and hype 100 (superstar tier like Taylor Swift or Drake),
 * breaking tens of millions of streams daily is NOT easy or automatic!
 * Smarter logarithmic diminishing returns ensure smashes reach 4M-9M daily,
 * with historic smashes reaching 10M-15M, NOT casual 50M-100M daily numbers.
 */
export function calculateRealisticArtistVelocity(
  artistPopularity: number,
  artistHype: number,
  artistTier: number,
  songQuality: number,
  songMomentum: number,
  basePotential: number,
  trackProfile: TrackPromotionProfile,
  weekendLift: number,
  organicVariance: number
): number {
  const safeQuality = Math.max(1, songQuality || 1);
  const safeMomentum = Math.max(0.05, songMomentum || 1.0);
  const safePotential = Math.max(1, basePotential || 1);

  // Logarithmic Star Power Curve:
  // Prevents linear runaway spikes where Pop 100 + Hype 100 generates 50M+ daily streams
  // Pop 1-10: Beginner (50 - 2,500 daily streams)
  // Pop 20-40: Rising Indie/Regional (5,000 - 60,000 daily streams)
  // Pop 50-75: Mainstream Star (120,000 - 950,000 daily streams)
  // Pop 80-95: A-List Superstar (1,200,000 - 4,500,000 daily streams)
  // Pop 100 + Hype 100: Global Titan (3,500,000 - 8,500,000 daily streams for Lead Singles)
  const normalizedPop = Math.min(100, Math.max(0, artistPopularity));
  const normalizedHype = Math.min(100, Math.max(0, artistHype));

  // Base audience tier calculation using realistic power law
  let starPowerBase = Math.pow(normalizedPop / 10, 2.65) * 1250;
  let hypeBonus = Math.pow(normalizedHype / 10, 2.1) * 450;
  
  // Rookie baseline protection
  starPowerBase = Math.max(35, starPowerBase);

  // Quality and hit potential factor with dynamic industry-calibrated responsive scaling:
  // Low quality (<45) / weak songs: listener rejection and steep drop in repeat plays (0.38x - 0.65x)
  // Moderate / ordinary songs (45-65): modest reception (0.75x - 1.05x), keeping them under 1M daily even for top artists!
  // High quality (65-80): commercial appeal and strong playlists (1.15x - 1.60x)
  // Masterpiece / Smash hit (80-100): viral repeat value and cultural longevity (1.70x - 2.45x) like Cruel Summer / Die With A Smile
  const qNorm = safeQuality / 50;
  const qualityFactor = 0.50 + Math.pow(qNorm, 1.35) * 0.75;
  
  const pNorm = safePotential / 50;
  const potentialFactor = 0.60 + Math.pow(pNorm, 1.20) * 0.65;

  // Combine factors with track promotion profile (Singles vs B-Sides)
  let rawDailyStreams = (starPowerBase + hypeBonus)
    * qualityFactor
    * potentialFactor
    * safeMomentum
    * trackProfile.streamingMultiplier
    * weekendLift
    * organicVariance;

  // Realistic Superstar Soft-Cap (Diminishing returns above 6M daily streams)
  // Even historical records (e.g. Taylor Swift's "Fortnight" Day 1 peak: 18M global Spotify)
  // require exceptional virality, not standard catalog performance.
  if (rawDailyStreams > 6000000) {
    const excess = rawDailyStreams - 6000000;
    // Compress excess with logarithmic damping
    rawDailyStreams = 6000000 + (Math.log10(1 + excess / 500000) * 1800000);
  }

  // Final sanity bounds
  const minStreams = trackProfile.isSingle ? 20 : 5;
  return Math.max(minStreams, Math.floor(rawDailyStreams));
}
