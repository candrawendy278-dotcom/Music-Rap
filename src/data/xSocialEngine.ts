// X (Social Media) Engine & Simulation System
// Handles:
// 1. Data models for Posts (XPost) and Profiles (XProfile)
// 2. Daily progression for social stats (views, likes, reposts, comments naturally grow every day)
// 3. Dynamic feed news generation reflecting player's real discography & chart feats
// 4. Player tweet composer with text & photo support and persistent storage

import { GameState } from '../types';
import { formatNumFull } from '../constants';
import { generateDailyTweetsForNewDay, getInitialFeedTweets } from './xIndustryFeedEngine';
import type { XVisualCardPayload } from './xRichVisualTweetsEngine';

export interface XQuoteTweet {
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  isVerified?: boolean;
  verifiedType?: 'blue' | 'gold' | 'grey';
  content: string;
}

export interface XPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isVerified?: boolean;
  verifiedType?: 'blue' | 'gold' | 'grey';
  category?: 'platform' | 'chart' | 'fanbase' | 'media';
  timeAgo: string;
  dateCreated?: string;
  content: string;
  image?: string;
  mediaBadge?: string;
  mediaTitle?: string;
  mediaSubtitle?: string;
  visualCard?: XVisualCardPayload;
  quoteTweet?: XQuoteTweet;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  bookmarks?: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  isPlayerPost?: boolean;
  daysOld?: number;
}

export interface XProfile {
  name?: string;
  handle?: string;
  bio?: string;
  banner?: string;
  followers?: number;
  following?: number;
}

/**
 * Returns canonical or fallback X profile information for the player
 */
export function getEnsuredXProfile(state: GameState): Required<XProfile> {
  const artist = state.artist;
  const defaultName = artist?.name || 'Artist';
  const defaultHandle = `@${defaultName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'player'}`;
  const defaultBio = `Official X account of ${defaultName}. Recording artist, songwriter & performer. Stream my music on Spotify, Apple Music & YouTube. 🎵✨`;

  const profile = state.xProfile || {};
  const name = profile.name?.trim() || defaultName;
  const rawHandle = profile.handle?.trim() || defaultHandle;
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
  const bio = profile.bio !== undefined ? profile.bio : defaultBio;
  const banner = profile.banner || '';

  const fans = state.fans || 250;
  const pop = state.popularity || 2;
  const postsCount = (state.xPosts || []).length;
  const followers = Math.max(100, Math.round(fans * 1.85 + pop * 8500 + postsCount * 350));
  const following = Math.min(320, Math.max(15, Math.round(18 + (state.songs?.length || 0) * 4)));

  return {
    name,
    handle,
    bio,
    banner,
    followers,
    following
  };
}

/**
 * Creates a new player tweet with text and optional photo
 */
export function createPlayerPost(
  state: GameState,
  content: string,
  image?: string
): XPost {
  const profile = getEnsuredXProfile(state);
  const avatar = state.artist?.image || `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent((profile.name || 'A').charAt(0))}`;
  const followers = profile.followers;

  // Initial engagement based on current follower base and popularity
  const baseViews = Math.max(25, Math.round(followers * (0.05 + Math.random() * 0.08)));
  const baseLikes = Math.max(2, Math.round(baseViews * (0.035 + Math.random() * 0.025)));
  const baseReposts = Math.max(0, Math.round(baseLikes * (0.18 + Math.random() * 0.12)));
  const baseReplies = Math.max(0, Math.round(baseLikes * (0.05 + Math.random() * 0.05)));

  return {
    id: `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    authorName: profile.name,
    authorHandle: profile.handle,
    authorAvatar: avatar,
    isVerified: true,
    verifiedType: 'blue',
    category: 'fanbase',
    timeAgo: 'Just now',
    dateCreated: state.date ? state.date.split('T')[0] : new Date().toISOString().split('T')[0],
    content: content.trim(),
    image: image || undefined,
    likes: baseLikes,
    reposts: baseReposts,
    replies: baseReplies,
    views: baseViews,
    isLiked: false,
    isReposted: false,
    isPlayerPost: true,
    daysOld: 0
  };
}

/**
 * Advances social engagement every in-game day:
 * Views, likes, reposts, and replies organically accumulate over time!
 */
export function advanceXSocialDaily(existingPosts: XPost[], state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const followers = profile.followers;
  const hypeFactor = Math.max(0.5, (state.hype || 15) / 20);

  // 1. Advance engagement & relative age on existing posts
  const updatedExisting = (existingPosts || []).map(post => {
    const currentDays = (post.daysOld || 0) + 1;
    let viewMultiplier = 0;
    
    // Newer posts have higher daily engagement velocity
    if (currentDays <= 1) {
      viewMultiplier = 0.40;
    } else if (currentDays <= 3) {
      viewMultiplier = 0.20;
    } else if (currentDays <= 7) {
      viewMultiplier = 0.08;
    } else if (currentDays <= 14) {
      viewMultiplier = 0.025;
    } else {
      viewMultiplier = 0.006; // Ever-green catalog impressions
    }

    const addedViews = Math.max(1, Math.round((followers * 0.015 * viewMultiplier + post.views * viewMultiplier) * hypeFactor));
    const addedLikes = Math.max(0, Math.round(addedViews * (0.03 + Math.random() * 0.02)));
    const addedReposts = Math.max(0, Math.round(addedLikes * 0.2));
    const addedReplies = Math.max(0, Math.round(addedLikes * 0.06));

    // Update relative time label based on age
    let timeLabel = post.timeAgo;
    if (currentDays === 1) timeLabel = '1d';
    else if (currentDays < 7) timeLabel = `${currentDays}d`;
    else if (currentDays < 30) timeLabel = `${Math.floor(currentDays / 7)}w`;
    else timeLabel = `${Math.floor(currentDays / 30)}mo`;

    return {
      ...post,
      daysOld: currentDays,
      timeAgo: timeLabel,
      views: post.views + addedViews,
      likes: post.likes + addedLikes,
      reposts: post.reposts + addedReposts,
      replies: post.replies + addedReplies
    };
  });

  // 2. Generate brand new tweets for this new day (each with cover art or artist picture)
  const newDailyTweets = generateDailyTweetsForNewDay(state);

  // 3. Keep ALL player posts, and keep up to 80 most recent industry/fan tweets
  const playerPosts = updatedExisting.filter(p => p.isPlayerPost);
  const existingIndustry = updatedExisting.filter(p => !p.isPlayerPost).slice(0, 140);

  return [...newDailyTweets, ...playerPosts, ...existingIndustry].sort((a, b) => (a.daysOld || 0) - (b.daysOld || 0));
}

/**
 * Dynamically synthesizes starter media & industry tweets that react to the player's career
 */
export function generateIndustryFeedTweets(state: GameState): XPost[] {
  return getInitialFeedTweets(state);
}
