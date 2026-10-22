// X (Twitter) Custom Account Profile Pictures & Expanded Living Tweets Engine
// 1. Generates crisp, iconic profile pictures (SVG Data URIs + verified fan portraits)
//    for every media, chart, platform, critic, and fanbase account on X so avatars NEVER fail or look blank.
// 2. Generates additional high-variety, lively daily tweets (@Genius, @RollingStone, @Pitchfork,
//    @AppleMusic, @ComplexMusic, @[handle]nation, @[handle]global, and viral listener posts)
//    using 100% live GameState telemetry across both new and older catalog releases.

import { GameState, Song } from '../types';
import { formatNumFull } from '../constants';
import { resolveAuthenticCover } from './musicCatalog';
import { XPost, getEnsuredXProfile } from './xSocialEngine';
import { resolveSongMetadataAndCollabCredits } from './spotifyTrackMetadataAndCollabEngine';

function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

/**
 * Iconic custom SVG profile pictures for official music industry accounts on X
 */
export const X_BRAND_PROFILE_PICTURES: Record<string, string> = {
  chartdata: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#0B0F17"/>
      <rect x="8" y="8" width="104" height="104" rx="22" fill="#111827" stroke="#38BDF8" stroke-width="2.5"/>
      <rect x="26" y="66" width="14" height="30" rx="3" fill="#38BDF8"/>
      <rect x="46" y="46" width="14" height="50" rx="3" fill="#60A5FA"/>
      <rect x="66" y="30" width="14" height="66" rx="3" fill="#818CF8"/>
      <rect x="86" y="18" width="14" height="78" rx="3" fill="#22D3EE"/>
      <text x="60" y="25" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#F8FAFC" text-anchor="middle" letter-spacing="1.5">CHART</text>
    </svg>
  `),
  spotify: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#121212"/>
      <circle cx="60" cy="60" r="46" fill="#1DB954"/>
      <path d="M35 46 C52 40, 74 42, 87 50" stroke="#000000" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M39 62 C53 57, 71 59, 82 66" stroke="#000000" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      <path d="M42 77 C54 73, 67 74, 76 80" stroke="#000000" stroke-width="5.5" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  spotifycharts: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="spg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1DB954"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#spg)"/>
      <circle cx="60" cy="52" r="28" fill="#090D16"/>
      <path d="M44 44 C54 40, 68 41, 76 46" stroke="#1DB954" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M47 54 C55 51, 66 52, 73 56" stroke="#1DB954" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <path d="M49 63 C56 61, 64 61, 70 65" stroke="#1DB954" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <rect x="20" y="88" width="80" height="18" rx="9" fill="#090D16"/>
      <text x="60" y="100" font-family="Arial, sans-serif" font-weight="900" font-size="10.5" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">CHARTS</text>
    </svg>
  `),
  billboard: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#000000"/>
      <circle cx="34" cy="34" r="14" fill="#EF4444"/>
      <circle cx="86" cy="34" r="14" fill="#F59E0B"/>
      <circle cx="34" cy="86" r="14" fill="#3B82F6"/>
      <circle cx="86" cy="86" r="14" fill="#10B981"/>
      <text x="60" y="79" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="68" fill="#FFFFFF" text-anchor="middle">b</text>
    </svg>
  `),
  talkofthecharts: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="totc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#312E81"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#totc)"/>
      <polyline points="16,84 40,62 60,72 82,36 104,24" fill="none" stroke="#38BDF8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="82" cy="36" r="6" fill="#F43F5E"/>
      <circle cx="104" cy="24" r="7" fill="#22D3EE"/>
      <text x="60" y="104" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#E0E7FF" text-anchor="middle" letter-spacing="2">TOTC</text>
    </svg>
  `),
  popbase: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="pb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7C3AED"/>
          <stop offset="50%" stop-color="#C026D3"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#pb)"/>
      <rect x="14" y="14" width="92" height="92" rx="24" fill="#0F0720" fill-opacity="0.28" stroke="#FFFFFF" stroke-width="3"/>
      <text x="60" y="56" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="30" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">POP</text>
      <text x="60" y="85" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="25" fill="#FDE047" text-anchor="middle" letter-spacing="1.5">BASE</text>
    </svg>
  `),
  popcrave: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="pc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FF512F"/>
          <stop offset="100%" stop-color="#DD2476"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#pc)"/>
      <circle cx="60" cy="60" r="46" fill="#FFFFFF" fill-opacity="0.14" stroke="#FFFFFF" stroke-width="3"/>
      <text x="60" y="55" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="27" fill="#FFFFFF" text-anchor="middle">POP</text>
      <text x="60" y="82" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="21" fill="#FEF08A" text-anchor="middle" letter-spacing="1">CRAVE</text>
    </svg>
  `),
  youtubemusic: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#0F0F0F"/>
      <circle cx="60" cy="60" r="44" fill="#FF0000"/>
      <circle cx="60" cy="60" r="24" fill="none" stroke="#FFFFFF" stroke-width="4"/>
      <polygon points="53,47 53,73 75,60" fill="#FFFFFF"/>
    </svg>
  `),
  applemusic: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="am" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FA233B"/>
          <stop offset="100%" stop-color="#FB5C74"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#am)"/>
      <path d="M48 78 V38 L82 31 V71" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="41" cy="79" r="10" fill="#FFFFFF"/>
      <circle cx="75" cy="72" r="10" fill="#FFFFFF"/>
    </svg>
  `),
  itunes: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="it" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#EC4899"/>
          <stop offset="50%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#06B6D4"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#it)"/>
      <circle cx="60" cy="60" r="42" fill="#FFFFFF" fill-opacity="0.16" stroke="#FFFFFF" stroke-width="3"/>
      <polygon points="60,24 69,48 95,48 74,63 82,88 60,73 38,88 46,63 25,48 51,48" fill="#FFFFFF"/>
    </svg>
  `),
  genius: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#FFFF64"/>
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#0F0F0F"/>
      <text x="60" y="64" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="21" fill="#FFFF64" text-anchor="middle" letter-spacing="1">GENIUS</text>
      <path d="M34 78 H86" stroke="#FFFF64" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `),
  rollingstone: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#DC2626"/>
      <circle cx="60" cy="60" r="46" fill="#991B1B" stroke="#FFFFFF" stroke-width="3"/>
      <text x="60" y="74" font-family="Georgia, serif" font-weight="900" font-style="italic" font-size="44" fill="#FFFFFF" text-anchor="middle">RS</text>
    </svg>
  `),
  pitchfork: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#111111"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#EF4444" stroke-width="4"/>
      <text x="60" y="75" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="42" fill="#FFFFFF" text-anchor="middle">P4K</text>
    </svg>
  `),
  complexmusic: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#09090B"/>
      <rect x="14" y="34" width="92" height="52" rx="8" fill="#EF4444"/>
      <text x="60" y="67" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">COMPLEX</text>
    </svg>
  `),
  poptingz: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="ptz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F43F5E"/>
          <stop offset="50%" stop-color="#D946EF"/>
          <stop offset="100%" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#ptz)"/>
      <circle cx="60" cy="60" r="46" fill="#0F172A" fill-opacity="0.28" stroke="#FFFFFF" stroke-width="3"/>
      <text x="60" y="54" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">POP</text>
      <text x="60" y="82" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="22" fill="#FDE047" text-anchor="middle" letter-spacing="1.2">TINGZ</text>
    </svg>
  `),
  statsspotify: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#06140D"/>
      <rect x="10" y="10" width="100" height="100" rx="22" fill="#0D2818" stroke="#1DB954" stroke-width="3"/>
      <rect x="26" y="64" width="12" height="28" rx="3" fill="#1DB954"/>
      <rect x="44" y="48" width="12" height="44" rx="3" fill="#22C55E"/>
      <rect x="62" y="34" width="12" height="58" rx="3" fill="#4ADE80"/>
      <rect x="80" y="22" width="12" height="70" rx="3" fill="#86EFAC"/>
      <text x="60" y="106" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#1DB954" text-anchor="middle" letter-spacing="1.5">STATS</text>
    </svg>
  `),
  hitsdd: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#1E293B"/>
      <rect x="10" y="24" width="100" height="72" rx="12" fill="#F59E0B"/>
      <text x="60" y="62" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="30" fill="#0F172A" text-anchor="middle">HITS</text>
      <text x="60" y="84" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#0F172A" text-anchor="middle" letter-spacing="1.5">DAILY DOUBLE</text>
    </svg>
  `),
  riaa: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#0F172A"/>
      <circle cx="60" cy="54" r="34" fill="#F59E0B" stroke="#FEF08A" stroke-width="3"/>
      <circle cx="60" cy="54" r="11" fill="#0F172A"/>
      <text x="60" y="106" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="18" fill="#FDE047" text-anchor="middle" letter-spacing="3">RIAA</text>
    </svg>
  `),
  mediabase: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#0B132B"/>
      <circle cx="60" cy="54" r="34" fill="none" stroke="#38BDF8" stroke-width="5"/>
      <circle cx="60" cy="54" r="20" fill="none" stroke="#818CF8" stroke-width="5"/>
      <circle cx="60" cy="54" r="7" fill="#F43F5E"/>
      <text x="60" y="105" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="#E0F2FE" text-anchor="middle" letter-spacing="1.5">MEDIABASE</text>
    </svg>
  `),
  nme: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#E11D48"/>
      <rect x="10" y="28" width="100" height="64" rx="8" fill="#09090B"/>
      <text x="60" y="74" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="36" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">NME</text>
    </svg>
  `),
  vulture: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#0284C7"/>
      <circle cx="60" cy="60" r="44" fill="#0F172A"/>
      <text x="60" y="78" font-family="Georgia, serif" font-weight="900" font-size="54" fill="#38BDF8" text-anchor="middle">V</text>
    </svg>
  `),
  viralpopclips: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="vpc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#vpc)"/>
      <polygon points="48,36 48,74 80,55" fill="#FFFFFF"/>
      <text x="60" y="102" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="13" fill="#FEF08A" text-anchor="middle" letter-spacing="1.5">VIRAL CLIPS</text>
    </svg>
  `)
};

/**
 * Generates a vibrant, customized avatar for fan update accounts & stan Twitter accounts
 * (`@handlecharts`, `@handledaily`, `@handlehq`, `@handlevault`, `@handleera`, `@handlenation`, etc.)
 */
function buildStanOrFanClubAvatar(authorHandle: string, authorName: string): string {
  const clean = (authorHandle || authorName || 'fan').toLowerCase().replace(/^@/, '');

  const palettes = [
    { bg1: '#EC4899', bg2: '#8B5CF6', accent: '#FDE047', badge: 'DAILY' },
    { bg1: '#06B6D4', bg2: '#3B82F6', accent: '#A7F3D0', badge: 'CHARTS' },
    { bg1: '#F43F5E', bg2: '#FB923C', accent: '#FEF08A', badge: 'HQ' },
    { bg1: '#8B5CF6', bg2: '#4F46E5', accent: '#F9A8D4', badge: 'VAULT' },
    { bg1: '#10B981', bg2: '#059669', accent: '#FEF08A', badge: 'ERA' },
    { bg1: '#F59E0B', bg2: '#DC2626', accent: '#FFFFFF', badge: 'NATION' },
    { bg1: '#3B82F6', bg2: '#1D4ED8', accent: '#7DD3FC', badge: 'GLOBAL' }
  ];

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }

  let badgeLabel = palettes[hash % palettes.length].badge;
  if (clean.includes('chart')) badgeLabel = 'CHARTS';
  else if (clean.includes('daily')) badgeLabel = 'DAILY';
  else if (clean.includes('hq')) badgeLabel = 'HQ';
  else if (clean.includes('vault')) badgeLabel = 'VAULT';
  else if (clean.includes('era')) badgeLabel = 'ERA';
  else if (clean.includes('update')) badgeLabel = 'UPDATES';
  else if (clean.includes('nation')) badgeLabel = 'NATION';
  else if (clean.includes('global')) badgeLabel = 'GLOBAL';
  else if (clean.includes('archive')) badgeLabel = 'ARCHIVE';
  else if (clean.includes('stats')) badgeLabel = 'STATS';

  const pal = palettes[hash % palettes.length];
  const initials = (authorName || 'ST')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || 'FN';

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="fg_${hash % 99}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${pal.bg1}"/>
          <stop offset="100%" stop-color="${pal.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#fg_${hash % 99})"/>
      <circle cx="60" cy="48" r="26" fill="#0F172A" fill-opacity="0.35" stroke="#FFFFFF" stroke-width="2.5"/>
      <text x="60" y="57" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">${initials}</text>
      <rect x="16" y="84" width="88" height="22" rx="11" fill="#0F172A" fill-opacity="0.82"/>
      <text x="60" y="99" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="${pal.accent}" text-anchor="middle" letter-spacing="1.2">${badgeLabel}</text>
    </svg>
  `);
}

/**
 * Resolves a guaranteed crisp, iconic profile picture for ANY X tweet author or Quote Tweet author!
 */
export function resolveXAccountAvatar(params: {
  authorHandle?: string;
  authorName?: string;
  explicitAvatar?: string;
  playerAvatar?: string;
  isPlayerPost?: boolean;
}): string {
  const { authorHandle = '', authorName = '', explicitAvatar, playerAvatar, isPlayerPost } = params;

  if (isPlayerPost && playerAvatar && playerAvatar.trim() !== '') {
    return playerAvatar;
  }

  // If explicitAvatar is already a custom data:image URI, use it directly
  if (explicitAvatar && explicitAvatar.startsWith('data:image/')) {
    return explicitAvatar;
  }

  const handleKey = authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameKey = authorName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (X_BRAND_PROFILE_PICTURES[handleKey]) {
    return X_BRAND_PROFILE_PICTURES[handleKey];
  }
  if (X_BRAND_PROFILE_PICTURES[nameKey]) {
    return X_BRAND_PROFILE_PICTURES[nameKey];
  }

  // Partial matches for brand accounts
  for (const [brandKey, svgUri] of Object.entries(X_BRAND_PROFILE_PICTURES)) {
    if (handleKey.includes(brandKey) || nameKey.includes(brandKey)) {
      return svgUri;
    }
  }

  // If the player uploaded a custom non-placeholder avatar AND this is the official "[Artist] Charts" page,
  // use the player's photo if it's a real data URI or valid URL; otherwise use our custom Fan Club emblem!
  if (
    playerAvatar &&
    !playerAvatar.includes('placehold.co') &&
    (handleKey.endsWith('charts') || handleKey.endsWith('official'))
  ) {
    return playerAvatar;
  }

  return buildStanOrFanClubAvatar(authorHandle, authorName);
}

function getSongArt(song: Song | undefined, artistName: string, artistAvatar: string): string {
  if (!song) return artistAvatar;
  if (song.cover && song.cover.trim() !== '') return song.cover;
  if (song.mvThumbnail && song.mvThumbnail.trim() !== '') return song.mvThumbnail;
  return resolveAuthenticCover(artistName, song.title);
}

/**
 * Generates additional high-variety, living daily tweets from music publications,
 * lyric databases (@Genius), streaming platforms (@AppleMusic), and diverse Stan Twitter accounts
 * covering BOTH older catalog classics and newest releases.
 */
export function generateExpandedPublicationAndFanTweets(state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const artistName = profile.name;
  const cleanHandle = profile.handle.replace(/^@/, '');
  const artistAvatar =
    state.artist?.image ||
    `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;

  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  if (releasedSongs.length === 0) return [];

  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const dayNum = Math.max(
    1,
    Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24))
  );
  const timestamp = Date.now();
  const followers = profile.followers || 1000;

  const latestSong = releasedSongs[releasedSongs.length - 1];
  const olderSongs = releasedSongs.slice(0, -1);

  // Pick a song to spotlight (alternates between older catalog songs and newest release so older songs get constant attention!)
  const catalogTarget =
    olderSongs.length > 0 && dayNum % 2 === 0
      ? olderSongs[(dayNum + olderSongs.length) % olderSongs.length]
      : latestSong;

  const meta = resolveSongMetadataAndCollabCredits(catalogTarget, artistName, state);
  const cover = getSongArt(catalogTarget, artistName, artistAvatar);
  const dailyStreams = catalogTarget.dailyStreams || 0;
  const totalStreams = catalogTarget.streams || 0;
  const totalSales = catalogTarget.pureSales || 0;
  const daysOut = (catalogTarget.daysSinceRelease ?? 0) + 1;

  const posts: XPost[] = [];

  // 1. @Genius — Songwriting, Lyricism & Production Breakdown
  posts.push({
    id: `exp-genius-${timestamp}-1`,
    authorName: 'Genius',
    authorHandle: '@Genius',
    authorAvatar: X_BRAND_PROFILE_PICTURES.genius,
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    timeAgo: '1h',
    dateCreated: dateStr,
    content: `The lyricism and vocal delivery on ${meta.formattedArtistCredits}'s "${meta.cleanTitle}" are driving massive lyric lookups today as the track crosses ${formatNumFull(totalStreams)} total Spotify streams (+${formatNumFull(dailyStreams)} today). 📖✨`,
    image: cover,
    mediaBadge: 'TRENDING LYRICS ON GENIUS',
    mediaTitle: `${meta.cleanTitle} — ${meta.formattedArtistCredits}`,
    mediaSubtitle: `${formatNumFull(totalStreams)} Total Streams • Verified Lyrics`,
    likes: Math.max(1850, Math.round(followers * 0.072 + 780)),
    reposts: Math.max(390, Math.round(followers * 0.018 + 160)),
    replies: 94,
    views: Math.max(46000, Math.round(followers * 0.58 + 19000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // 2. @RollingStone or @Pitchfork — Editorial Music Journalism & Catalog Praise
  const isRollingStone = dayNum % 2 === 0;
  posts.push({
    id: `exp-press-${timestamp}-2`,
    authorName: isRollingStone ? 'Rolling Stone' : 'Pitchfork',
    authorHandle: isRollingStone ? '@RollingStone' : '@Pitchfork',
    authorAvatar: isRollingStone
      ? X_BRAND_PROFILE_PICTURES.rollingstone
      : X_BRAND_PROFILE_PICTURES.pitchfork,
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    timeAgo: '2h',
    dateCreated: dateStr,
    content: isRollingStone
      ? `How ${artistName} crafted an undeniable modern anthem: "${meta.cleanTitle}" continues to resonate deeply with listeners on Day ${daysOut}, adding +${formatNumFull(dailyStreams)} daily streams (${formatNumFull(totalStreams)} total) and ${formatNumFull(totalSales)} pure sales.`
      : `With ${formatNumFull(totalStreams)} cumulative streams and counting (+${formatNumFull(dailyStreams)} in the past 24 hours), "${meta.cleanTitle}" stands as a defining centerpiece in ${artistName}'s evolving discography.`,
    image: cover,
    mediaBadge: isRollingStone ? 'ROLLING STONE FEATURE' : 'PITCHFORK TRACK REVIEW',
    likes: Math.max(2200, Math.round(followers * 0.08 + 920)),
    reposts: Math.max(470, Math.round(followers * 0.02 + 210)),
    replies: 118,
    views: Math.max(55000, Math.round(followers * 0.64 + 23000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // 3. @AppleMusic — Spatial Audio & Catalog Streaming Spotlight
  const secondTarget =
    olderSongs.length > 0
      ? olderSongs[(dayNum * 2) % olderSongs.length]
      : latestSong;
  const secondMeta = resolveSongMetadataAndCollabCredits(secondTarget, artistName, state);
  const secondCover = getSongArt(secondTarget, artistName, artistAvatar);

  posts.push({
    id: `exp-applemusic-${timestamp}-3`,
    authorName: 'Apple Music',
    authorHandle: '@AppleMusic',
    authorAvatar: X_BRAND_PROFILE_PICTURES.applemusic,
    isVerified: true,
    verifiedType: 'gold',
    category: 'platform',
    timeAgo: '3h',
    dateCreated: dateStr,
    content: `Experience every layer of "${secondMeta.cleanTitle}" by ${secondMeta.formattedArtistCredits} in Lossless & Spatial Audio with Dolby Atmos. Now past ${formatNumFull(secondTarget.streams || 0)} global streams. 🎧🔊`,
    image: secondCover,
    mediaBadge: 'DOLBY ATMOS • SPATIAL AUDIO',
    mediaTitle: secondMeta.cleanTitle,
    mediaSubtitle: `${secondMeta.formattedArtistCredits} • Apple Music`,
    likes: Math.max(2400, Math.round(followers * 0.085 + 1050)),
    reposts: Math.max(510, Math.round(followers * 0.021 + 220)),
    replies: 102,
    views: Math.max(61000, Math.round(followers * 0.68 + 25000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // 4. @[handle]nation — Lively Stan Community Viral Appreciation
  const nationTemplates = [
    `friendly reminder that ${artistName}'s entire discography (${releasedSongs.length} released tracks and counting!) is a 10/10 skipless masterpiece 😭🔥 "${secondMeta.cleanTitle}" pulling +${formatNumFull(secondTarget.dailyStreams || 0)} streams today proves REAL music always wins!!`,
    `watching "${secondMeta.cleanTitle}" hit ${formatNumFull(secondTarget.streams || 0)} total streams (+${formatNumFull(secondTarget.dailyStreams || 0)} today) makes me so emotional 🥹🕯️ We've been streaming since day one and ${artistName} keeps raising the bar every single era!!`,
    `Wait because why did "${secondMeta.cleanTitle}" just hit even harder today than the first time I heard it?! 😭🎧 +${formatNumFull(secondTarget.dailyStreams || 0)} daily streams and ${formatNumFull(secondTarget.pureSales || 0)} pure copies sold — ${secondMeta.formattedArtistCredits} put pure magic in the studio!`
  ];

  posts.push({
    id: `exp-nation-${timestamp}-4`,
    authorName: `${artistName} Nation`,
    authorHandle: `@${cleanHandle}nation`,
    authorAvatar: buildStanOrFanClubAvatar(`@${cleanHandle}nation`, `${artistName} Nation`),
    isVerified: false,
    category: 'fanbase',
    timeAgo: '4h',
    dateCreated: dateStr,
    content: nationTemplates[dayNum % nationTemplates.length],
    image: secondCover,
    mediaBadge: 'FANDOM SPOTLIGHT',
    likes: Math.max(1380, Math.round(followers * 0.076 + 510)),
    reposts: Math.max(360, Math.round(followers * 0.022 + 145)),
    replies: 112,
    views: Math.max(31000, Math.round(followers * 0.59 + 12500)),
    isPlayerPost: false,
    daysOld: 0
  });

  return posts;
}
