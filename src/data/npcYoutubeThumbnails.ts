// Dedicated NPC YouTube Video Thumbnail Generator
// Generates authentic 16:9 widescreen YouTube music video thumbnails
// with cinematic styling, custom NPC atmospheres, 4K badges, and video metadata.

import { ChartItem } from '../types';
import { generateAuthenticRegionalChart } from './countryMarketSystem';

export interface VideoThumbnailOptions {
  title: string;
  artist: string;
  badge?: string;
  stylePreset?: string;
}

interface ThumbnailTheme {
  bgStart: string;
  bgEnd: string;
  accent: string;
  glowColor: string;
  titleColor: string;
  artistColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  tagline: string;
  overlayGradient: string;
}

const NPC_THEMES: Record<string, ThumbnailTheme> = {
  'taylor shift': {
    bgStart: '#1E1B4B',
    bgEnd: '#0F0E17',
    accent: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    titleColor: '#FFFBEB',
    artistColor: '#FDE68A',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeBorder: 'rgba(245, 158, 11, 0.6)',
    badgeText: '#F59E0B',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(124, 58, 237, 0.2)'
  },
  'drakeo': {
    bgStart: '#090D16',
    bgEnd: '#020408',
    accent: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    titleColor: '#F0F9FF',
    artistColor: '#7DD3FC',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.5)',
    badgeText: '#38BDF8',
    tagline: 'OFFICIAL MUSIC VIDEO • VEVO',
    overlayGradient: 'rgba(14, 165, 233, 0.15)'
  },
  'bad bunnyito': {
    bgStart: '#431407',
    bgEnd: '#1C0603',
    accent: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    titleColor: '#FFF7ED',
    artistColor: '#FED7AA',
    badgeBg: 'rgba(249, 115, 22, 0.25)',
    badgeBorder: 'rgba(249, 115, 22, 0.7)',
    badgeText: '#FB923C',
    tagline: 'VIDEO OFICIAL • 4K ULTRA HD',
    overlayGradient: 'rgba(234, 88, 12, 0.2)'
  },
  'billie eyelash': {
    bgStart: '#022C22',
    bgEnd: '#01120E',
    accent: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    titleColor: '#ECFDF5',
    artistColor: '#6EE7B7',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(16, 185, 129, 0.6)',
    badgeText: '#34D399',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(5, 150, 105, 0.18)'
  },
  'the kid laro': {
    bgStart: '#3F0808',
    bgEnd: '#120202',
    accent: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    titleColor: '#FEF2F2',
    artistColor: '#FCA5A5',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
    badgeBorder: 'rgba(239, 68, 68, 0.65)',
    badgeText: '#F87171',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(220, 38, 38, 0.2)'
  },
  'rosalia x': {
    bgStart: '#2A0612',
    bgEnd: '#0F0105',
    accent: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.3)',
    titleColor: '#FDF2F8',
    artistColor: '#F472B6',
    badgeBg: 'rgba(236, 72, 153, 0.2)',
    badgeBorder: 'rgba(236, 72, 153, 0.6)',
    badgeText: '#F472B6',
    tagline: 'VÍDEO OFICIAL • MOTOMAMI',
    overlayGradient: 'rgba(219, 39, 119, 0.2)'
  },
  'kendrick llama': {
    bgStart: '#1C1917',
    bgEnd: '#0C0A09',
    accent: '#A8A29E',
    glowColor: 'rgba(168, 162, 158, 0.3)',
    titleColor: '#F5F5F4',
    artistColor: '#D6D3D1',
    badgeBg: 'rgba(168, 162, 158, 0.2)',
    badgeBorder: 'rgba(168, 162, 158, 0.5)',
    badgeText: '#E7E5E4',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(87, 83, 78, 0.2)'
  },
  'sabrina carpenter': {
    bgStart: '#4C1D95',
    bgEnd: '#1E1B4B',
    accent: '#F472B6',
    glowColor: 'rgba(244, 114, 182, 0.3)',
    titleColor: '#FDF2F8',
    artistColor: '#FBCFE8',
    badgeBg: 'rgba(244, 114, 182, 0.2)',
    badgeBorder: 'rgba(244, 114, 182, 0.6)',
    badgeText: '#F472B6',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(236, 72, 153, 0.2)'
  },
  'chappell roan': {
    bgStart: '#831843',
    bgEnd: '#3B0764',
    accent: '#FDE047',
    glowColor: 'rgba(253, 224, 71, 0.3)',
    titleColor: '#FEF9C3',
    artistColor: '#FEF08A',
    badgeBg: 'rgba(253, 224, 71, 0.2)',
    badgeBorder: 'rgba(253, 224, 71, 0.6)',
    badgeText: '#FACC15',
    tagline: 'OFFICIAL MUSIC VIDEO • 4K',
    overlayGradient: 'rgba(234, 179, 8, 0.2)'
  }
};

const GENERIC_PALETTES: ThumbnailTheme[] = [
  {
    bgStart: '#0B132B',
    bgEnd: '#040814',
    accent: '#48CAE4',
    glowColor: 'rgba(72, 202, 228, 0.3)',
    titleColor: '#FFFFFF',
    artistColor: '#90E0EF',
    badgeBg: 'rgba(72, 202, 228, 0.2)',
    badgeBorder: 'rgba(72, 202, 228, 0.5)',
    badgeText: '#48CAE4',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(0, 119, 182, 0.2)'
  },
  {
    bgStart: '#1F0322',
    bgEnd: '#0D010E',
    accent: '#E0AAFF',
    glowColor: 'rgba(224, 170, 255, 0.3)',
    titleColor: '#FFFFFF',
    artistColor: '#C77DFF',
    badgeBg: 'rgba(224, 170, 255, 0.2)',
    badgeBorder: 'rgba(224, 170, 255, 0.5)',
    badgeText: '#E0AAFF',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(123, 44, 191, 0.2)'
  },
  {
    bgStart: '#1A1403',
    bgEnd: '#0A0801',
    accent: '#FFD166',
    glowColor: 'rgba(255, 209, 102, 0.3)',
    titleColor: '#FFFFFF',
    artistColor: '#FFE3A8',
    badgeBg: 'rgba(255, 209, 102, 0.2)',
    badgeBorder: 'rgba(255, 209, 102, 0.5)',
    badgeText: '#FFD166',
    tagline: 'OFFICIAL MUSIC VIDEO • 4K',
    overlayGradient: 'rgba(244, 162, 97, 0.2)'
  },
  {
    bgStart: '#06283D',
    bgEnd: '#010D17',
    accent: '#00B4D8',
    glowColor: 'rgba(0, 180, 216, 0.3)',
    titleColor: '#FFFFFF',
    artistColor: '#90E0EF',
    badgeBg: 'rgba(0, 180, 216, 0.2)',
    badgeBorder: 'rgba(0, 180, 216, 0.5)',
    badgeText: '#00B4D8',
    tagline: 'OFFICIAL MUSIC VIDEO',
    overlayGradient: 'rgba(0, 119, 182, 0.2)'
  }
];

function escapeXml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate an authentic 16:9 YouTube Music Video Thumbnail Data URI
 */
export function generateYoutubeVideoThumbnail(title: string, artist: string): string {
  const cleanTitle = (title || 'Official Video')
    .replace(/\s*\(Official Music Video\)/i, '')
    .replace(/\s*\(Music Video\)/i, '')
    .replace(/\s*\(Video Oficial\)/i, '')
    .replace(/\s*\(Vídeo Oficial\)/i, '')
    .replace(/\s*\(Lyric Video\)/i, '')
    .replace(/\s*\(Visualizer\)/i, '')
    .trim();
  const cleanArtist = (artist || 'Artist').trim();

  const key = cleanArtist.toLowerCase();
  let theme = NPC_THEMES[key];

  if (!theme) {
    let hash = 0;
    const s = `${cleanArtist}_${cleanTitle}`;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % GENERIC_PALETTES.length;
    theme = GENERIC_PALETTES[idx];
  }

  // Generate unique seed for SVG defs
  let seed = 0;
  for (let i = 0; i < cleanTitle.length; i++) {
    seed = (seed * 31 + cleanTitle.charCodeAt(i)) | 0;
  }
  const id = Math.abs(seed);

  // Split title if too long
  let line1 = cleanTitle;
  let line2 = '';
  if (cleanTitle.length > 18) {
    const words = cleanTitle.split(' ');
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="yt_bg_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgStart}" />
      <stop offset="65%" stop-color="${theme.bgEnd}" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>

    <!-- Center Stage Spotlight -->
    <radialGradient id="yt_spot_${id}" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.35" />
      <stop offset="45%" stop-color="${theme.overlayGradient}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Anamorphic Flare Line -->
    <linearGradient id="yt_flare_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0" />
      <stop offset="50%" stop-color="${theme.accent}" stop-opacity="0.5" />
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Base 16:9 Canvas -->
  <rect width="640" height="360" fill="url(#yt_bg_${id})" />
  <rect width="640" height="360" fill="url(#yt_spot_${id})" />

  <!-- Cinematic horizontal flare beam -->
  <rect x="0" y="170" width="640" height="2" fill="url(#yt_flare_${id})" />

  <!-- Diagonal Studio Texture Lines -->
  <line x1="40" y1="0" x2="140" y2="360" stroke="rgba(255,255,255,0.03)" stroke-width="1.5" />
  <line x1="500" y1="0" x2="600" y2="360" stroke="rgba(255,255,255,0.03)" stroke-width="1.5" />

  <!-- Top Badge: Official Music Video -->
  <g transform="translate(320, 52)">
    <rect x="-115" y="-14" width="230" height="28" rx="14" fill="${theme.badgeBg}" stroke="${theme.badgeBorder}" stroke-width="1.2" />
    <text x="0" y="4" fill="${theme.badgeText}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" letter-spacing="2" text-anchor="middle">
      ${escapeXml(theme.tagline)}
    </text>
  </g>

  <!-- 4K UHD Tag Top Right -->
  <g transform="translate(585, 42)">
    <rect x="-24" y="-10" width="48" height="20" rx="4" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <text x="0" y="4" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="800" font-size="9" letter-spacing="0.5" text-anchor="middle">4K UHD</text>
  </g>

  <!-- Top Left Channel Watermark -->
  <g transform="translate(48, 44)">
    <circle cx="0" cy="0" r="12" fill="${theme.accent}" fill-opacity="0.25" stroke="${theme.accent}" stroke-width="1" />
    <polygon points="-3,-5 6,0 -3,5" fill="${theme.accent}" />
    <text x="18" y="4" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-weight="800" font-size="11" letter-spacing="1">MUSIC</text>
  </g>

  <!-- Video Main Title -->
  <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.85))">
    ${line2 ? `
      <text x="320" y="172" fill="${theme.titleColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" letter-spacing="-0.5" text-anchor="middle">
        ${escapeXml(line1.toUpperCase())}
      </text>
      <text x="320" y="214" fill="${theme.titleColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" letter-spacing="-0.5" text-anchor="middle">
        ${escapeXml(line2.toUpperCase())}
      </text>
    ` : `
      <text x="320" y="195" fill="${theme.titleColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" letter-spacing="-0.5" text-anchor="middle">
        ${escapeXml(line1.toUpperCase())}
      </text>
    `}
  </g>

  <!-- Artist Sub-line -->
  <text x="320" y="${line2 ? 260 : 248}" fill="${theme.artistColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" letter-spacing="3" text-anchor="middle">
    ${escapeXml(cleanArtist.toUpperCase())}
  </text>

  <!-- Bottom Left: Premiere Specs -->
  <g transform="translate(48, 320)">
    <text x="0" y="0" fill="rgba(255,255,255,0.5)" font-family="monospace" font-size="10" letter-spacing="1">
      OFFICIAL PREMIERE // DOLBY AUDIO
    </text>
  </g>

  <!-- Bottom Right: Video duration badge -->
  <g transform="translate(585, 320)">
    <rect x="-22" y="-12" width="44" height="20" rx="4" fill="rgba(0,0,0,0.85)" />
    <text x="0" y="2" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">3:45</text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns authentic 16:9 YouTube video thumbnail for an artist/song.
 */
export function getNpcVideoThumbnail(artist: string, title?: string): string {
  return generateYoutubeVideoThumbnail(title || 'Official Music Video', artist || 'Artist');
}

const NPC_CHART_VIDEOS: Array<{ artist: string; title: string; views: number }> = [
  { artist: 'Bruno Mars & Lady Gaga', title: 'Die With A Smile (Official Music Video)', views: 24500000 },
  { artist: 'Kendrick Lamar', title: 'Not Like Us (Official Music Video)', views: 22800000 },
  { artist: 'Billie Eilish', title: 'BIRDS OF A FEATHER (Official Music Video)', views: 21300000 },
  { artist: 'Sabrina Carpenter', title: 'Espresso (Official Music Video)', views: 19800000 },
  { artist: 'Taylor Swift', title: 'Fortnight (Official Music Video)', views: 18500000 },
  { artist: 'Chappell Roan', title: 'Good Luck, Babe! (Official Music Video)', views: 17200000 },
  { artist: 'Bad Bunny', title: 'DtMF (Video Oficial)', views: 16400000 },
  { artist: 'Sabrina Carpenter', title: 'Taste (Official Music Video)', views: 15300000 },
  { artist: 'The Weeknd', title: 'Timeless (Official Music Video)', views: 14700000 },
  { artist: 'Charli XCX', title: '360 (Official Music Video)', views: 13900000 },
  { artist: 'Dua Lipa', title: 'Houdini (Official Music Video)', views: 13200000 },
  { artist: 'Post Malone', title: 'I Had Some Help (Official Music Video)', views: 12500000 },
  { artist: 'Taylor Swift', title: 'Cruel Summer (Official Music Video)', views: 11900000 },
  { artist: 'Drake', title: "God's Plan (Official Music Video)", views: 11200000 },
  { artist: 'Bad Bunny', title: 'Tití Me Preguntó (Video Oficial)', views: 10600000 },
  { artist: 'Billie Eilish', title: 'LUNCH (Official Music Video)', views: 10100000 },
  { artist: 'Harry Styles', title: 'As It Was (Official Music Video)', views: 9700000 },
  { artist: 'SZA', title: 'Kill Bill (Official Music Video)', views: 9300000 },
  { artist: 'Olivia Rodrigo', title: 'vampire (Official Music Video)', views: 8900000 },
  { artist: 'The Weeknd', title: 'Blinding Lights (Official Music Video)', views: 8500000 },
  { artist: 'Justin Bieber', title: 'Peaches (Official Music Video)', views: 8100000 },
  { artist: 'Doja Cat', title: 'Paint The Town Red (Official Music Video)', views: 7700000 },
  { artist: 'Taylor Swift', title: 'Anti-Hero (Official Music Video)', views: 7400000 },
  { artist: 'Drake', title: 'Rich Flex (Official Music Video)', views: 7100000 },
  { artist: 'ROSALÍA', title: 'DESPECHÁ (Vídeo Oficial)', views: 6800000 },
  { artist: 'The Kid LAROI', title: 'STAY (Official Music Video)', views: 6500000 },
  { artist: 'Billie Eilish', title: 'CHIHIRO (Official Music Video)', views: 6200000 },
  { artist: 'Ariana Grande', title: "we can't be friends (wait for your love) (Official Music Video)", views: 5900000 },
  { artist: 'Kendrick Lamar', title: 'squabble up (Official Music Video)', views: 5600000 },
  { artist: 'Bad Bunny', title: 'MONACO (Video Oficial)', views: 5300000 }
];

/**
 * Returns a rich, populated initial YouTube Trending Music Video chart.
 */
export function getInitialYoutubeChart(region = 'global'): ChartItem[] {
  if (region !== 'global') {
    const regionalChart = generateAuthenticRegionalChart({
      platform: 'youtube',
      region,
      playerSongs: [],
      playerName: '',
      playerCountry: '',
      playerPopularity: 0,
      playerHype: 0,
      limit: 50
    });
    if (regionalChart && regionalChart.length > 0) {
      return regionalChart.map((item, idx) => ({
        ...item,
        lastPosition: idx > 2 ? idx + ((idx % 3 === 0) ? -1 : 1) : null
      }));
    }
  }

  return NPC_CHART_VIDEOS.map((item, idx) => {
    const factor = region === 'global' ? 1 : 0.25 + ((idx * 7) % 10) * 0.05;
    return {
      title: item.title,
      artist: item.artist,
      points: Math.round(item.views * factor),
      isPlayer: false,
      cover: getNpcVideoThumbnail(item.artist, item.title),
      lastPosition: idx > 2 ? idx + ((idx % 3 === 0) ? -1 : 1) : null
    };
  });
}
