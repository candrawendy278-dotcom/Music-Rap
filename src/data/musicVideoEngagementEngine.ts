// Music Video Engagement & Like Engine
// Computes authentic YouTube MV engagement metrics:
// - Dynamic, realistic Like-to-View ratios reflecting song quality, artist hype, release window, and distributor
// - Realistic comment counts and authentic community reactions
// - Premiere engagement spikes (Day 0-3 super-fan like ratios)

import { Song } from '../types';

export interface MusicVideoEngagement {
  likes: number;
  commentsCount: number;
  likeToViewRatio: number; // e.g. 0.068 (6.8%)
  engagementTier: 'viral_sensation' | 'fan_favorite' | 'mainstream_hit' | 'solid' | 'rookie_buzz';
  topComments: { author: string; handle: string; text: string; timeAgo: string; likes: number }[];
}

/**
 * Calculates authentic like-to-view ratio and total likes for a music video.
 */
export function calculateMusicVideoEngagement(
  song: Song,
  artistName = 'Player Artist',
  artistHype = 20,
  currentDateStr?: string
): MusicVideoEngagement {
  const views = Math.max(0, song.views || 0);
  if (views === 0) {
    return {
      likes: 0,
      commentsCount: 0,
      likeToViewRatio: 0.05,
      engagementTier: 'rookie_buzz',
      topComments: []
    };
  }

  // Days since release
  let daysSinceRelease = 30;
  if (song.releaseDate && currentDateStr) {
    const r = new Date(song.releaseDate).getTime();
    const c = new Date(currentDateStr).getTime();
    daysSinceRelease = Math.max(0, Math.floor((c - r) / (1000 * 60 * 60 * 24)));
  }

  const quality = song.quality || 50;

  // Real-world YouTube like curve:
  // In real life (Blackpink 2.2B views -> 26M likes = ~1.18%, BTS Dynamite 1.8B -> 37M = ~2.0%, Adele 3.1B -> 19M = ~0.61%)
  // Hardcore stans like on day 1-3, but as views scale into hundreds of millions / billions,
  // repeat streaming and casual listeners compress the overall like ratio down to 1.0% - 1.8%.
  
  // Base tier modifiers:
  const qualityFactor = 0.85 + (quality / 100) * 0.30; // 0.85x to 1.15x
  const hypeFactor = 0.90 + (Math.min(100, artistHype) / 100) * 0.20; // 0.90x to 1.10x
  const distBoost = song.mvDistributor === 'vevo' ? 1.04 : 1.0;

  let computedLikes = 0;
  let finalRatio = 0.035;

  if (views <= 250000) {
    // Early stage / launch buzz: 3.2% - 4.5% like ratio
    finalRatio = 0.038 * qualityFactor * hypeFactor * distBoost;
    computedLikes = Math.round(views * finalRatio);
  } else if (views <= 5000000) {
    // Growing hit (250K - 5M views): 2.2% - 3.2%
    const baseEarly = 250000 * 0.038;
    finalRatio = 0.024 * qualityFactor * hypeFactor;
    computedLikes = Math.round(baseEarly + (views - 250000) * finalRatio);
  } else if (views <= 100000000) {
    // Mainstream hit (5M - 100M views): 1.6% - 2.2%
    const baseMid = 123500; // ~123.5K likes at 5M
    finalRatio = 0.018 * qualityFactor * hypeFactor;
    computedLikes = Math.round(baseMid + (views - 5000000) * finalRatio);
  } else {
    // Mega Smash / Billion views tier: 1.0% - 1.4%
    // At 1 Billion views: ~13M - 16M likes.
    // At 2.2 Billion views (like Blackpink): ~25M - 27M likes.
    const baseHundredM = 1833500; // ~1.83M likes at 100M views
    finalRatio = 0.0115 * qualityFactor * hypeFactor;
    computedLikes = Math.round(baseHundredM + (views - 100000000) * finalRatio);
  }

  // Hard safety ceiling:
  // In real life, no YouTube music video has EVER reached 60M likes (Despacito at 8.5B has ~53M).
  // At 1B views, max likes is capped at ~18M - 20M.
  // At 2.2B views (Blackpink), max likes is ~26M - 28M.
  const realisticRatioCeiling = views >= 1000000000 ? 0.016 : views >= 100000000 ? 0.022 : 0.045;
  const hardViewCeiling = Math.round(views * realisticRatioCeiling);
  const absoluteMaxLikes = Math.min(53000000, Math.max(10, hardViewCeiling));
  computedLikes = Math.max(1, Math.min(computedLikes, absoluteMaxLikes));

  // If previous saved mvLikes was bloated by older algorithms, strictly override with realistic computed value
  if (song.mvLikes && song.mvLikes > 0 && song.mvLikes > absoluteMaxLikes) {
    computedLikes = Math.min(computedLikes, absoluteMaxLikes);
  }

  const effectiveRatio = computedLikes / Math.max(1, views);

  // Realistic comments count (~0.03% - 0.08% of views, e.g. ~350K - 800K on 1B views)
  const commentRatio = Math.min(0.0009, 0.00035 + (quality / 100) * 0.0003 + (artistHype / 100) * 0.0002);
  const commentsCount = Math.max(12, Math.round(views * commentRatio));

  // Determine engagement tier
  let engagementTier: MusicVideoEngagement['engagementTier'] = 'solid';
  if (effectiveRatio >= 0.030) {
    engagementTier = 'viral_sensation';
  } else if (effectiveRatio >= 0.020) {
    engagementTier = 'fan_favorite';
  } else if (effectiveRatio >= 0.012) {
    engagementTier = 'mainstream_hit';
  }

  // Authentic YouTube comments tailored to track and artist
  const topComments = generateAuthenticComments(song.title, artistName, quality, artistHype);

  return {
    likes: computedLikes,
    commentsCount,
    likeToViewRatio: effectiveRatio,
    engagementTier,
    topComments
  };
}

/**
 * Generates realistic top comments for the YouTube video page.
 */
function generateAuthenticComments(
  title: string,
  artist: string,
  quality: number,
  hype: number
) {
  const comments = [];

  if (quality >= 80) {
    comments.push({
      author: 'MelodySeeker',
      handle: '@MelodySeeker99',
      text: `The cinematography and vocal layering on "${title}" is unmatched. ${artist} really delivered a masterpiece here! 🔥`,
      timeAgo: '2 days ago',
      likes: Math.floor(quality * 14 + hype * 8)
    });
    comments.push({
      author: 'VibeCritic',
      handle: '@VibeCriticOfficial',
      text: 'Who else has this on repeat since the premiere? The bridge gives chills every single time. Definitely Song of the Year contender.',
      timeAgo: '1 day ago',
      likes: Math.floor(quality * 11 + hype * 6)
    });
  } else {
    comments.push({
      author: 'MusicHead',
      handle: '@MusicHead_24',
      text: `Catchy beat and solid visuals on "${title}"! Excited to see where ${artist} takes this next.`,
      timeAgo: '3 days ago',
      likes: Math.floor(quality * 6 + hype * 3)
    });
  }

  comments.push({
    author: 'DailyStreams',
    handle: '@DailyStreamsHQ',
    text: `Stream ${title} on Spotify and Apple Music! Let's get this to #1 on the charts! 📈🚀`,
    timeAgo: '18 hours ago',
    likes: Math.floor(hype * 7 + 45)
  });

  return comments;
}
