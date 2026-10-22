/**
 * musicCatalog.ts
 * Curated authentic music catalog with realistic artist names, song titles,
 * album titles, and authentic real-world photography / graphic album art.
 * Eliminates repetitive "Artist - Hits 1" or generic AI-looking artwork.
 */

import { resolveTypographyCover } from './typographyCoverGenerator';

export interface CatalogSong {
  title: string;
  artist: string;
  genre: string;
  cover: string;
}

export interface CatalogAlbum {
  title: string;
  artist: string;
  genre: string;
  cover: string;
}

// Authentic real-world music photography: vinyl sleeves, analog studio gear,
// concert microphones, vintage cassette tape aesthetics, 35mm film mood, real audio equipment.
// Free of uncanny AI-generated surrealism / 3D neon plastic renders.
export const AUTHENTIC_COVER_ARTS: string[] = [
  // 1. Vinyl Record on Turntable / Analog Tone
  'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=85',
  // 2. Vintage Cassette Tape & Headphone aesthetic
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=85',
  // 3. Studio condenser mic with warm acoustic lighting
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=85',
  // 4. Monochrome acoustic guitar & songwriter mood
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=85',
  // 5. Retro 70s vinyl sleeve in crate
  'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=85',
  // 6. Moody urban night rain / cinematic street
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=85',
  // 7. Analog synthesizer keys & patch cables
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=85',
  // 8. Editorial stage silhouette under tungsten spotlight
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=85',
  // 9. Minimalist darkroom portrait & vinyl shadows
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=85',
  // 10. Warm golden hour California highway
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=85',
  // 11. Retro neon diner in twilight haze
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=85',
  // 12. Vintage drum kit in recording studio
  'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&auto=format&fit=crop&q=85',
  // 13. Grungy underground rock club microphone
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=85',
  // 14. Classic grand piano keys close-up
  'https://images.unsplash.com/photo-1520523839898-507127053e14?w=600&auto=format&fit=crop&q=85',
  // 15. Sun-bleached coastal haze
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=85',
  // 16. Analog reel-to-reel tape recorder
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=85',
  // 17. Electric Fender Stratocaster body
  'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=600&auto=format&fit=crop&q=85',
  // 18. Film noir smoke and city skyline
  'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=600&auto=format&fit=crop&q=85',
  // 19. Velvet curtain theater stage
  'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=85',
  // 20. Vinyl grooves spinning under needle
  'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=85'
];

/**
 * Authentic procedural SVG Album Cover Generator
 * Creates graphic designer quality record sleeves with clean typography,
 * genuine palette pairing, subtle vinyl grooving, and record label insignia.
 */
export function generateGraphicCoverDataUrl(artist: string, title: string): string {
  const seed = Math.abs((artist + title).split('').reduce((acc, c) => (acc * 33 + c.charCodeAt(0)) | 0, 0));
  
  const PALETTES = [
    { bg: '#0F172A', accent: '#38BDF8', text: '#F8FAFC', sub: '#94A3B8', style: 'Midnight Noir' },
    { bg: '#18181B', accent: '#F43F5E', text: '#FFFFFF', sub: '#A1A1AA', style: 'Crimson Velvet' },
    { bg: '#1C1917', accent: '#F59E0B', text: '#FEF3C7', sub: '#D97706', style: 'Analog Amber' },
    { bg: '#064E3B', accent: '#34D399', text: '#ECFDF5', sub: '#6EE7B7', style: 'Emerald Forest' },
    { bg: '#311042', accent: '#C084FC', text: '#FAF5FF', sub: '#E9D5FF', style: 'Deep Violet' },
    { bg: '#1E1E24', accent: '#E0E2EC', text: '#FFFFFF', sub: '#8E9099', style: 'Minimalist Monochrome' },
    { bg: '#451A03', accent: '#FB923C', text: '#FFF7ED', sub: '#FDBA74', style: 'Sepia Vinyl' },
    { bg: '#0A0A0A', accent: '#22C55E', text: '#FFFFFF', sub: '#71717A', style: 'Club Darkroom' }
  ];

  const palette = PALETTES[seed % PALETTES.length];
  const safeArtist = artist.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="40%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.65" />
      </radialGradient>
      <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.2" />
        <stop offset="50%" stop-color="${palette.accent}" stop-opacity="0.0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.4" />
      </linearGradient>
    </defs>
    
    <!-- Outer record sleeve -->
    <rect width="500" height="500" fill="${palette.bg}" />
    <rect width="500" height="500" fill="url(#shine)" />
    
    <!-- Vinyl record texture rings -->
    <circle cx="250" cy="250" r="230" fill="none" stroke="${palette.accent}" stroke-opacity="0.06" stroke-width="1.5" />
    <circle cx="250" cy="250" r="190" fill="none" stroke="${palette.accent}" stroke-opacity="0.08" stroke-width="1" />
    <circle cx="250" cy="250" r="150" fill="none" stroke="${palette.accent}" stroke-opacity="0.05" stroke-width="1" />
    <circle cx="250" cy="250" r="110" fill="none" stroke="${palette.accent}" stroke-opacity="0.07" stroke-width="1" />
    
    <!-- Subtle top bar record header -->
    <rect x="36" y="36" width="428" height="3" fill="${palette.accent}" fill-opacity="0.5" />
    <text x="36" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="${palette.sub}" text-transform="uppercase">STEREO RECORDING • 33⅓ RPM</text>
    
    <!-- Center Graphic Badge -->
    <circle cx="250" cy="230" r="72" fill="#000000" fill-opacity="0.35" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.4" />
    <circle cx="250" cy="230" r="24" fill="${palette.accent}" fill-opacity="0.2" />
    <circle cx="250" cy="230" r="5" fill="${palette.text}" />
    
    <!-- Vignette filter -->
    <rect width="500" height="500" fill="url(#vignette)" pointer-events="none" />
    
    <!-- Lower Card Info: Authentic typography -->
    <g transform="translate(36, 380)">
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" letter-spacing="-0.5" fill="${palette.text}">${safeTitle.length > 24 ? safeTitle.slice(0, 22) + '...' : safeTitle}</text>
      <text x="0" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" letter-spacing="0.5" fill="${palette.sub}">${safeArtist}</text>
    </g>
    
    <!-- Parental Advisory / Label Stamp subtle watermark -->
    <rect x="396" y="420" width="68" height="26" fill="#000000" fill-opacity="0.7" rx="3" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="0.75" />
    <text x="430" y="437" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8" font-weight="800" letter-spacing="1" fill="#FFFFFF" text-anchor="middle">ORIGINAL</text>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

import {
  REAL_WORLD_NPCS,
  UNIQUE_REAL_WORLD_SINGLES,
  UNIQUE_REAL_WORLD_ALBUMS,
  resolveRealWorldCoverArt,
  normalizeRealArtistName
} from './realWorldArtistCatalog';

// Extensive library of authentic real-world songs per mainstream artist (auto-synced with all 46 NPCs + extended catalog)
export const REALISTIC_ARTIST_SONGS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const npc of REAL_WORLD_NPCS) {
    map[npc.name] = npc.songs.map(s => s.title);
  }
  for (const single of UNIQUE_REAL_WORLD_SINGLES) {
    if (!map[single.artist]) map[single.artist] = [];
    if (!map[single.artist].includes(single.title)) {
      map[single.artist].push(single.title);
    }
  }
  return map;
})();

export const REALISTIC_ARTIST_ALBUMS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const npc of REAL_WORLD_NPCS) {
    map[npc.name] = npc.albums.map(a => a.title);
  }
  for (const album of UNIQUE_REAL_WORLD_ALBUMS) {
    if (!map[album.artist]) map[album.artist] = [];
    if (!map[album.artist].includes(album.title)) {
      map[album.artist].push(album.title);
    }
  }
  return map;
})();

export const DIVERSE_SONG_TITLES: string[] = UNIQUE_REAL_WORLD_SINGLES.map(s => s.title);

export const DIVERSE_ALBUM_TITLES: string[] = UNIQUE_REAL_WORLD_ALBUMS.map(a => a.title);

/**
 * Returns a realistic, authentic song title for any given artist.
 */
export function getRealisticTrackTitle(artist: string, index: number = 0): string {
  const realArtist = normalizeRealArtistName(artist);
  const songs = REALISTIC_ARTIST_SONGS[realArtist] || REALISTIC_ARTIST_SONGS[artist];
  if (songs && songs.length > 0) {
    return songs[index % songs.length];
  }
  return DIVERSE_SONG_TITLES[index % DIVERSE_SONG_TITLES.length];
}

/**
 * Returns a realistic authentic studio album title for an artist and index.
 */
export function getRealisticAlbumTitle(artist: string, index: number = 0): string {
  const realArtist = normalizeRealArtistName(artist);
  const albums = REALISTIC_ARTIST_ALBUMS[realArtist] || REALISTIC_ARTIST_ALBUMS[artist];
  if (albums && albums.length > 0) {
    return albums[index % albums.length];
  }
  return DIVERSE_ALBUM_TITLES[index % DIVERSE_ALBUM_TITLES.length];
}

/**
 * Provides official cover art (via iTunes API cache or fallback sleeve) for any track or album.
 */
export function resolveAuthenticCover(artist: string, title?: string): string {
  return resolveRealWorldCoverArt(artist, title, false);
}

export const SIMULATED_ARTISTS: string[] = REAL_WORLD_NPCS.map(npc => npc.name);

export function getSimulatedSingleEntry(index: number): { artist: string; title: string; cover: string } {
  const entry = UNIQUE_REAL_WORLD_SINGLES[index % UNIQUE_REAL_WORLD_SINGLES.length];
  return {
    artist: entry.artist,
    title: entry.title,
    cover: resolveRealWorldCoverArt(entry.artist, entry.title, false)
  };
}

export function getSimulatedAlbumEntry(index: number): { artist: string; title: string; cover: string } {
  const entry = UNIQUE_REAL_WORLD_ALBUMS[index % UNIQUE_REAL_WORLD_ALBUMS.length];
  return {
    artist: entry.artist,
    title: entry.title,
    cover: resolveRealWorldCoverArt(entry.artist, entry.title, true)
  };
}

export function getSimulatedVideoEntry(index: number): { artist: string; title: string; cover: string } {
  const entry = UNIQUE_REAL_WORLD_SINGLES[index % UNIQUE_REAL_WORLD_SINGLES.length];
  const videoSuffixes = [' (Official Music Video)', ' (Official Video)', ' (Lyric Video)', ' (Live Performance)'];
  const trk = `${entry.title}${videoSuffixes[index % videoSuffixes.length]}`;
  return {
    artist: entry.artist,
    title: trk,
    cover: resolveRealWorldCoverArt(entry.artist, entry.title, false)
  };
}
