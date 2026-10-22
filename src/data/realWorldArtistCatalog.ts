// Real-World Artist, Discography, Profile Photo & Official Cover Art Registry
// Provides 45+ authentic real-world NPC artists with full discographies,
// 225+ unique real-world studio albums (zero duplicates on Billboard 200),
// 240+ unique real-world hit singles (zero duplicates on Global 200),
// live Wikipedia REST API artist portrait resolution, and iTunes 600x600 cover art caching.

import type { DetailedNPC } from './npcAssets';
import {
  EXPANDED_REAL_WORLD_NPCS,
  EXPANDED_ARTIST_WIKIPEDIA_SLUGS
} from './expandedNpcRosterData';
import {
  MEGA_EXPANDED_NPCS_WAVE_2,
  MEGA_EXPANDED_WIKIPEDIA_SLUGS_WAVE_2
} from './megaExpandedNpcRosterWave2';
import { COMPLETE_REAL_WORLD_ALBUM_TRACKLISTS } from './completeAlbumTracklistRegistry';
import {
  VERIFIED_SPOTIFY_NPC_PORTRAITS,
  VERIFIED_OFFICIAL_ALBUM_COVERS,
  VERIFIED_OFFICIAL_SONG_COVERS,
  getVerifiedSpotifyNpcPortrait,
  getVerifiedOfficialReleaseCover,
  sanitizeArtworkCdnUrl
} from './spotifyOfficialNpcPortraitsAndCovers';

// Legacy parody name to Real-World Artist name mapper
export const LEGACY_ARTIST_NAME_MAP: Record<string, string> = {
  'taylor shift': 'Taylor Swift',
  'taylor swiftly': 'Taylor Swift',
  'drakeo': 'Drake',
  'bad bunnyito': 'Bad Bunny',
  'billie eyelash': 'Billie Eilish',
  'the kid laro': 'The Kid LAROI',
  'rosalia x': 'ROSALÍA',
  'the weekend': 'The Weeknd',
  'the weekday': 'The Weeknd',
  'sabrina wood': 'Sabrina Carpenter',
  'billie & chappell / chappell roan': 'Chappell Roan',
  'bruno stars': 'Bruno Mars',
  'dua peepa': 'Dua Lipa',
  'ed shearin': 'Ed Sheeran',
  'ariana grande venti': 'Ariana Grande',
  'posty': 'Post Malone',
  'olivia rodrigoa': 'Olivia Rodrigo',
  'kendrick llama': 'Kendrick Lamar',
  'justin beebs': 'Justin Bieber',
  'doja kitty': 'Doja Cat',
  'future & metro': 'Future & Metro Boomin',
  'beyonce': 'Beyoncé',
  'central drill': 'Central Cee',
  'burna rhythm': 'Burna Boy',
  'rema groove': 'Rema',
  'tyla water': 'Tyla',
  'peso pluma beat': 'Peso Pluma',
  'feid club': 'Feid',
  'newwaves (kr)': 'NewJeans',
  'yoasobi beat': 'YOASOBI',
  'fujii wind': 'Fujii Kaze',
  'tulus harmony': 'Tulus',
  'bernadya melancholy': 'Bernadya',
  'mahalini vocals': 'Mahalini',
  'hindia satire': 'Hindia'
};

// Legacy parody song/album title to Real-World title mapper
export const LEGACY_TITLE_MAP: Record<string, string> = {
  'cruel daylight': 'Cruel Summer',
  'midnight rain glow': 'Midnight Rain',
  'cardigan nights': 'cardigan',
  'anti-hero dreams': 'Anti-Hero',
  'the midnight chronicles': 'Midnights',
  "god's blueprint": "God's Plan",
  'certified lover vibes': 'Rich Flex',
  'hotline 3am': 'Hotline Bling',
  'nocturnal thoughts': 'Passionfruit',
  'nocturnal chronicles': 'For All The Dogs',
  'verano sin ti (remix)': 'DtMF',
  'titi me pregunto': 'Tití Me Preguntó',
  'monaco nights': 'MONACO',
  'moscow mule afterparty': 'Moscow Mule',
  'un verano especial': 'Un Verano Sin Ti',
  'ocean whispers': 'ocean eyes',
  'bad guy (bass boost)': 'bad guy',
  'happier than before': 'Happier Than Ever',
  'birds of a feather': 'BIRDS OF A FEATHER',
  'lunch break': 'LUNCH',
  'chihiro echoes': 'CHIHIRO',
  'hit me hard and softly': 'HIT ME HARD AND SOFT',
  'stay forever': 'STAY',
  'without your love': 'WITHOUT YOU',
  'bleed for you': 'BLEED',
  'thousand miles': 'THOUSAND MILES',
  'f*ck love & memories': 'THE FIRST TIME',
  'motomami rush': 'SAOKO',
  'despecha fiesta': 'DESPECHÁ',
  'saoko wheels': 'BIZCOCHITO',
  'motomami deluxe': 'MOTOMAMI',
  'espresso buzz': 'Espresso',
  'espresso double shot': 'Espresso',
  'good luck dreamer': 'Good Luck, Babe!',
  'not like them': 'Not Like Us',
  'not like us (west coast)': 'Not Like Us',
  'apple season': 'Apple',
  'apple slices': 'Apple',
  'houdini illusion': 'Houdini',
  'houdini magic': 'Houdini',
  'chemical highway': 'I Had Some Help',
  'chemical reactions': 'Chemical',
  'as it began': 'As It Was',
  'as it was then': 'As It Was',
  'snooze button': 'Snooze',
  'snooze through morning': 'Snooze',
  'kill bill heart': 'Kill Bill',
  'saturn rings': 'Saturn',
  'vampire teeth': 'vampire',
  'vampire fangs': 'vampire',
  'blinding neon': 'Blinding Lights',
  'blinding highways': 'Blinding Lights',
  'peaches & cream': 'Peaches',
  'paint the city red': 'Paint The Town Red',
  'yes, and so what': "we can't be friends (wait for your love)",
  'euphoria rush': 'luther',
  'fe!n anthem': 'FE!N',
  'like that beat': 'Like That',
  'lose control soul': 'Lose Control',
  'too sweet nectar': 'Too Sweet',
  'pink pony club anthem': 'Pink Pony Club',
  '360 camera': '360',
  'humble. flow': 'HUMBLE.',
  'levitating lights': 'Levitating',
  'circles in the sand': 'Circles',
  'watermelon sugar high': 'Watermelon Sugar',
  'drivers license lane': 'drivers license',
  'good 4 u tonight': 'good 4 u',
  'shape of memories': 'Shape of You',
  'bad habits at 2am': 'Bad Habits',
  'starboy neon': 'Starboy',
  'sunflower fields': 'Sunflower',
  'von dutch velocity': 'Von dutch',
  'hot to go rhythm': 'HOT TO GO!',
  'taste of revenge': 'Taste'
};

export function normalizeRealArtistName(name: string): string {
  if (!name) return name;
  const lookup = LEGACY_ARTIST_NAME_MAP[name.trim().toLowerCase()];
  return lookup || name;
}

export function normalizeRealTitle(title: string, artistName?: string, isAlbum: boolean = false): string {
  if (!title) return title;
  const hasMvSuffix = /\s*\((Official Music Video|Music Video|Video Oficial|Vídeo Oficial)\)/i.exec(title);
  const base = title
    .replace(/\s*\((Official Music Video|Music Video|Video Oficial|Vídeo Oficial)\)/i, '')
    .trim();
  const mapped = LEGACY_TITLE_MAP[base.toLowerCase()];
  if (mapped) {
    return hasMvSuffix ? `${mapped} (${hasMvSuffix[1]})` : mapped;
  }

  // If a legacy save or generator created a generic placeholder title (e.g. "Artist - Hits 1", "Studio Album", "Album 1"),
  // map it to an authentic song or album by that artist
  if (
    artistName &&
    (/^(hits|track|song|single|album|project|studio|untitled|demo|ep)\s*#?\d*$/i.test(base) ||
      /\s-\s*(hits|track|album|single)\s*#?\d*$/i.test(base) ||
      /\bstudio album$/i.test(base))
  ) {
    try {
      const cleanArtist = normalizeRealArtistName(artistName).toLowerCase();
      const primaryArtist = cleanArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
      const npc = REAL_WORLD_NPCS.find(
        n => n.name.toLowerCase() === cleanArtist || n.name.toLowerCase() === primaryArtist
      );
      if (isAlbum) {
        if (npc && npc.albums.length > 0) return npc.albums[0].title;
        const albMatch = UNIQUE_REAL_WORLD_ALBUMS.find(
          a => a.artist.toLowerCase() === cleanArtist || a.artist.toLowerCase() === primaryArtist
        );
        if (albMatch) return albMatch.title;
      } else {
        if (npc && npc.songs.length > 0) return npc.songs[0].title;
        const sngMatch = UNIQUE_REAL_WORLD_SINGLES.find(
          s => s.artist.toLowerCase() === cleanArtist || s.artist.toLowerCase() === primaryArtist
        );
        if (sngMatch) return sngMatch.title;
      }
    } catch {
      // Ignore if called before catalog arrays finish initializing
    }
  }

  return hasMvSuffix ? `${base} (${hasMvSuffix[1]})` : base;
}

// Exact Wikipedia Page Slugs for Real-World Artists (used by Wikipedia REST API to fetch official artist portraits)
export const ARTIST_WIKIPEDIA_SLUGS: Record<string, string> = {
  'Taylor Swift': 'Taylor_Swift',
  'Drake': 'Drake_(musician)',
  'Bad Bunny': 'Bad_Bunny',
  'Billie Eilish': 'Billie_Eilish',
  'The Weeknd': 'The_Weeknd',
  'Sabrina Carpenter': 'Sabrina_Carpenter',
  'Kendrick Lamar': 'Kendrick_Lamar',
  'SZA': 'SZA',
  'Ariana Grande': 'Ariana_Grande',
  'Bruno Mars': 'Bruno_Mars',
  'Olivia Rodrigo': 'Olivia_Rodrigo',
  'Post Malone': 'Post_Malone',
  'Travis Scott': 'Travis_Scott',
  'Dua Lipa': 'Dua_Lipa',
  'Chappell Roan': 'Chappell_Roan',
  'Charli XCX': 'Charli_XCX',
  'Harry Styles': 'Harry_Styles',
  'Ed Sheeran': 'Ed_Sheeran',
  'Justin Bieber': 'Justin_Bieber',
  'Doja Cat': 'Doja_Cat',
  'Eminem': 'Eminem',
  'Rihanna': 'Rihanna',
  'Beyoncé': 'Beyoncé',
  'Lady Gaga': 'Lady_Gaga',
  'Coldplay': 'Coldplay',
  'Kanye West': 'Kanye_West',
  'Future': 'Future_(rapper)',
  'Metro Boomin': 'Metro_Boomin',
  'J. Cole': 'J._Cole',
  'Nicki Minaj': 'Nicki_Minaj',
  'Karol G': 'Karol_G',
  'Peso Pluma': 'Peso_Pluma',
  'Feid': 'Feid',
  'Shakira': 'Shakira',
  'ROSALÍA': 'Rosalía',
  'The Kid LAROI': 'The_Kid_Laroi',
  'Jung Kook': 'Jungkook',
  'BLACKPINK': 'Blackpink',
  'BTS': 'BTS',
  'NewJeans': 'NewJeans',
  'Stray Kids': 'Stray_Kids',
  'TWICE': 'Twice',
  'Lana Del Rey': 'Lana_Del_Rey',
  'Tyler, The Creator': 'Tyler,_the_Creator',
  'Hozier': 'Hozier',
  'Benson Boone': 'Benson_Boone',
  'Morgan Wallen': 'Morgan_Wallen',
  'Zach Bryan': 'Zach_Bryan',
  'Tate McRae': 'Tate_McRae',
  'Burna Boy': 'Burna_Boy',
  'Tyla': 'Tyla',
  'Central Cee': 'Central_Cee',
  'Rema': 'Rema',
  '21 Savage': '21_Savage',
  'Playboi Carti': 'Playboi_Carti',
  'Lil Baby': 'Lil_Baby',
  'Imagine Dragons': 'Imagine_Dragons',
  'Miley Cyrus': 'Miley_Cyrus',
  'Adele': 'Adele',
  'Katy Perry': 'Katy_Perry',
  'Selena Gomez': 'Selena_Gomez',
  'Shawn Mendes': 'Shawn_Mendes',
  'Gracie Abrams': 'Gracie_Abrams',
  'Teddy Swims': 'Teddy_Swims',
  'Noah Kahan': 'Noah_Kahan',
  'Luke Combs': 'Luke_Combs',
  'Frank Ocean': 'Frank_Ocean',
  'Arctic Monkeys': 'Arctic_Monkeys',
  'Linkin Park': 'Linkin_Park',
  'Tulus': 'Tulus_(singer)',
  'Bernadya': 'Bernadya',
  'Mahalini': 'Mahalini_Raharja',
  'YOASOBI': 'Yoasobi',
  'Fujii Kaze': 'Fujii_Kaze',
  'IU': 'IU_(singer)',
  'aespa': 'Aespa',
  ...EXPANDED_ARTIST_WIKIPEDIA_SLUGS,
  ...MEGA_EXPANDED_WIKIPEDIA_SLUGS_WAVE_2
};

// Persistent caches for official Spotify/Apple Music covers and artist photos (v20 purges legacy {c}.jpg caches)
const COVER_CACHE_STORAGE_KEY = 'mr_itunes_official_covers_v20';
const ARTIST_PHOTO_CACHE_KEY = 'mr_official_artist_photos_v20';

const memoryCoverCache: Record<string, string> = {};
const memoryArtistPhotoCache: Record<string, string> = { ...VERIFIED_SPOTIFY_NPC_PORTRAITS };
const inflightCoverPromises: Map<string, Promise<string | null>> = new Map();
const inflightArtistPromises: Map<string, Promise<string | null>> = new Map();
const inflightArtistBatchPromises: Map<string, Promise<void>> = new Map();
const fetchedArtistBatches: Set<string> = new Set();
const coverListeners: Set<() => void> = new Set();

// Seed memoryCoverCache with all pre-verified official album & song covers
for (const [k, url] of Object.entries(VERIFIED_OFFICIAL_ALBUM_COVERS)) {
  const cleanUrl = sanitizeArtworkCdnUrl(url);
  if (cleanUrl) memoryCoverCache[`album::${k}`] = cleanUrl;
}
for (const [k, url] of Object.entries(VERIFIED_OFFICIAL_SONG_COVERS)) {
  const cleanUrl = sanitizeArtworkCdnUrl(url);
  if (cleanUrl) memoryCoverCache[`song::${k}`] = cleanUrl;
}

// Preserves each NPC's original signature hit tracks and studio albums BEFORE workflow mutation
const ORIGINAL_NPC_SIGNATURE_HINTS: Map<string, { tracks: string[]; albums: string[] }> = new Map();

function isValidArtworkUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.startsWith('http')) return false;
  if (url.includes('{c}') || url.includes('{w}') || url.includes('{h}')) return false;
  const lower = url.toLowerCase();
  if (lower.includes('unsplash.com') || lower.includes('picsum.photos')) return false;
  if (lower.includes('upload.wikimedia.org') && lower.includes('/600px-')) return false;
  if (lower.includes('/images/artist//') || lower.includes('/images/cover//') || lower.includes('0000000000000000')) return false;
  if (lower.includes('default_artist') || lower.includes('default_')) return false;
  if (lower.includes('dzcdn.net/images/artist') && !/\/images\/artist\/[a-f0-9]{24,40}\//i.test(url)) return false;
  if (lower.includes('dzcdn.net/images/cover') && !/\/images\/cover\/[a-f0-9]{24,40}\//i.test(url)) return false;
  if (lower.endsWith('.svg') || lower.includes('.svg.png') || lower.includes('wordmark') || lower.includes('_logo')) return false;
  return true;
}

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Purge legacy polluted cache keys so wrong profile photos & covers are cleared immediately
    [
      'mr_itunes_official_covers_v6',
      'mr_official_artist_photos_v8',
      'mr_itunes_official_covers_v16',
      'mr_official_artist_photos_v16',
      'mr_itunes_official_covers_v17',
      'mr_official_artist_photos_v17',
      'mr_itunes_official_covers_v18',
      'mr_official_artist_photos_v18',
      'mr_itunes_official_covers_v19',
      'mr_official_artist_photos_v19'
    ].forEach(oldKey => {
      try {
        window.localStorage.removeItem(oldKey);
      } catch {}
    });

    const savedCovers = window.localStorage.getItem(COVER_CACHE_STORAGE_KEY);
    if (savedCovers) {
      const parsed = JSON.parse(savedCovers);
      for (const [k, url] of Object.entries(parsed)) {
        const sanitized = sanitizeArtworkCdnUrl(typeof url === 'string' ? url : null);
        if (sanitized && isValidArtworkUrl(sanitized) && !memoryCoverCache[k]) {
          memoryCoverCache[k] = sanitized;
        }
      }
    }
    const savedArtistPhotos = window.localStorage.getItem(ARTIST_PHOTO_CACHE_KEY);
    if (savedArtistPhotos) {
      const parsedPhotos = JSON.parse(savedArtistPhotos);
      for (const [k, url] of Object.entries(parsedPhotos)) {
        if (isValidArtworkUrl(url) && !memoryArtistPhotoCache[k]) {
          memoryArtistPhotoCache[k] = url;
        }
      }
    }
  }
} catch {
  // Ignore localStorage read errors
}

let persistCoverTimer: ReturnType<typeof setTimeout> | null = null;
function persistCoverCache() {
  if (persistCoverTimer) return;
  persistCoverTimer = setTimeout(() => {
    persistCoverTimer = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(COVER_CACHE_STORAGE_KEY, JSON.stringify(memoryCoverCache));
      }
    } catch {
      // Ignore quota errors
    }
  }, 400);
}

function persistArtistPhotoCache() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ARTIST_PHOTO_CACHE_KEY, JSON.stringify(memoryArtistPhotoCache));
    }
  } catch {
    // Ignore quota errors
  }
}

export function subscribeToArtworkUpdates(listener: () => void): () => void {
  coverListeners.add(listener);
  return () => {
    coverListeners.delete(listener);
  };
}

let notifyTimer: ReturnType<typeof setTimeout> | null = null;
function notifyArtworkListeners() {
  if (notifyTimer) return;
  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    coverListeners.forEach(fn => {
      try {
        fn();
      } catch {
        // Ignore listener error
      }
    });
  }, 60);
}

function foldAccents(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function simplifyTitleForMatch(raw: string): string {
  const folded = foldAccents(raw || '');
  if (!folded) return '';
  if (/^[?=+\-0-9a-z]{1,3}$/.test(folded)) {
    return folded;
  }
  const stripped = folded
    .replace(
      /\s*\((official music video|official video|music video|video oficial|vídeo oficial|lyric video|visualizer|live|performance video|deluxe[^)]*|taylor's version|feat\.[^)]+|ft\.[^)]+|with [^)]+|part \d+)\)/gi,
      ''
    )
    .replace(/\s*:\s*(the anthology|lana|deluxe.*)$/gi, '')
    .replace(/\s*-\s*(single|ep|deluxe.*|remastered.*)$/gi, '')
    .replace(/['’`".!,;:()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || folded;
}

export function getCacheKey(artist: string, title?: string, isAlbum = false): string {
  const normArtist = foldAccents(normalizeRealArtistName(artist || ''));
  const cleanTitle = foldAccents(
    normalizeRealTitle(title || '', artist, isAlbum)
      .replace(
        /\s*\((Official Music Video|Official Video|Music Video|Video Oficial|Vídeo Oficial|Lyric Video|Visualizer|Live|Performance Video)\)/gi,
        ''
      )
  );
  return `${isAlbum ? 'album' : 'song'}::${normArtist}::${cleanTitle}`;
}

function storeCoverInCache(artist: string, title: string, url: string, isAlbum = false) {
  if (!isValidArtworkUrl(url)) return;
  const normArtist = foldAccents(normalizeRealArtistName(artist));
  const primaryArtist = normArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  const prefix = isAlbum ? 'album' : 'song';

  const exactKey = getCacheKey(artist, title, isAlbum);
  memoryCoverCache[exactKey] = url;

  const simpleTitle = simplifyTitleForMatch(title);
  if (simpleTitle) {
    const simpleKey = `${prefix}::${normArtist}::${simpleTitle}`;
    memoryCoverCache[simpleKey] = url;
    const primarySimpleKey = `${prefix}::${primaryArtist}::${simpleTitle}`;
    memoryCoverCache[primarySimpleKey] = url;
  }
}

export function evictBrokenCoverUrl(artist: string, title?: string, brokenUrl?: string) {
  if (!brokenUrl) return;
  for (const [k, v] of Object.entries(memoryCoverCache)) {
    if (v === brokenUrl) {
      delete memoryCoverCache[k];
    }
  }
  for (const [k, v] of Object.entries(memoryArtistPhotoCache)) {
    if (v === brokenUrl) {
      delete memoryArtistPhotoCache[k];
    }
  }
  inflightCoverPromises.delete(getCacheKey(artist, title, false));
  inflightCoverPromises.delete(getCacheKey(artist, title, true));
}

let parentAlbumLookupIndex: Record<string, string> | null = null;

function getParentAlbumLookupIndex(): Record<string, string> {
  if (parentAlbumLookupIndex) return parentAlbumLookupIndex;
  const idx: Record<string, string> = {};
  for (const [key, tracks] of Object.entries(COMPLETE_REAL_WORLD_ALBUM_TRACKLISTS)) {
    const [albArtist, albTitle] = key.split('::');
    if (!albArtist || !albTitle || !Array.isArray(tracks)) continue;
    const normArt = foldAccents(albArtist);
    const primArt = normArt.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
    for (const t of tracks) {
      const cleanT = simplifyTitleForMatch(t);
      if (!cleanT) continue;
      const k1 = `${normArt}::${cleanT}`;
      const k2 = `${primArt}::${cleanT}`;
      if (!idx[k1]) idx[k1] = albTitle;
      if (!idx[k2]) idx[k2] = albTitle;
    }
  }
  parentAlbumLookupIndex = idx;
  return idx;
}

/**
 * Finds the parent album title in O(1) time if a song belongs to one of the artist's known studio albums
 * or their current active album era.
 */
function findParentAlbumForSong(artist: string, songTitle: string): string | null {
  if (!artist || !songTitle) return null;
  const normArtist = foldAccents(normalizeRealArtistName(artist));
  const primaryArtist = normArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  const targetClean = simplifyTitleForMatch(songTitle);
  if (!targetClean) return null;

  const idx = getParentAlbumLookupIndex();
  const fromStatic = idx[`${normArtist}::${targetClean}`] || idx[`${primaryArtist}::${targetClean}`];
  if (fromStatic) return fromStatic;

  try {
    const npcObj = REAL_WORLD_NPCS.find(
      n => foldAccents(n.name) === primaryArtist || foldAccents(n.name) === normArtist
    );
    if (npcObj) {
      for (const alb of npcObj.albums || []) {
        if ((alb.tracks || []).some(t => simplifyTitleForMatch(t.title) === targetClean)) {
          return alb.title;
        }
      }
    }
  } catch {}

  return null;
}

export function lookupCachedCoverUrl(artist: string, title?: string, isAlbum = false): string | null {
  const realArtist = normalizeRealArtistName(artist || '');
  const realTitle = normalizeRealTitle(title || '', realArtist, isAlbum);
  const parentAlb = !isAlbum && realTitle ? findParentAlbumForSong(realArtist, realTitle) || undefined : undefined;

  const preVerified = getVerifiedOfficialReleaseCover(realArtist, realTitle, isAlbum, parentAlb);
  if (preVerified && isValidArtworkUrl(preVerified)) {
    return preVerified;
  }

  const normArtist = foldAccents(realArtist);
  const primaryArtist = normArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  const prefix = isAlbum ? 'album' : 'song';
  const simpleTitle = simplifyTitleForMatch(realTitle);

  const exactKey = getCacheKey(artist, title, isAlbum);
  if (memoryCoverCache[exactKey] && isValidArtworkUrl(memoryCoverCache[exactKey])) {
    return memoryCoverCache[exactKey];
  }

  if (simpleTitle) {
    const simpleKey = `${prefix}::${normArtist}::${simpleTitle}`;
    if (memoryCoverCache[simpleKey] && isValidArtworkUrl(memoryCoverCache[simpleKey])) {
      return memoryCoverCache[simpleKey];
    }

    const primarySimpleKey = `${prefix}::${primaryArtist}::${simpleTitle}`;
    if (memoryCoverCache[primarySimpleKey] && isValidArtworkUrl(memoryCoverCache[primarySimpleKey])) {
      return memoryCoverCache[primarySimpleKey];
    }

    const altPrefix = isAlbum ? 'song' : 'album';
    const altKey = `${altPrefix}::${primaryArtist}::${simpleTitle}`;
    if (memoryCoverCache[altKey] && isValidArtworkUrl(memoryCoverCache[altKey])) {
      return memoryCoverCache[altKey];
    }
  }

  if (!isAlbum && parentAlb) {
    const parentSimple = simplifyTitleForMatch(parentAlb);
    const albKey = `album::${primaryArtist}::${parentSimple}`;
    if (memoryCoverCache[albKey] && isValidArtworkUrl(memoryCoverCache[albKey])) {
      return memoryCoverCache[albKey];
    }
    const exactAlbKey = getCacheKey(artist, parentAlb, true);
    if (memoryCoverCache[exactAlbKey] && isValidArtworkUrl(memoryCoverCache[exactAlbKey])) {
      return memoryCoverCache[exactAlbKey];
    }
  }

  return null;
}

// Throttled request queue for artwork & external APIs so 100 chart rows never trigger rate-limits
const itunesQueue: Array<() => Promise<void>> = [];
let activeItunesWorkers = 0;
const MAX_ITUNES_CONCURRENT = 5;

function enqueueItunesTask<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    itunesQueue.push(async () => {
      try {
        const res = await task();
        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
    pumpItunesQueue();
  });
}

function pumpItunesQueue() {
  while (activeItunesWorkers < MAX_ITUNES_CONCURRENT && itunesQueue.length > 0) {
    const nextTask = itunesQueue.shift();
    if (!nextTask) break;
    activeItunesWorkers++;
    nextTask().finally(() => {
      setTimeout(() => {
        activeItunesWorkers--;
        pumpItunesQueue();
      }, 45);
    });
  }
}

function getArtistSignatureHints(artistName: string): { tracks: string[]; albums: string[] } {
  const realArtist = normalizeRealArtistName(artistName || '').trim();
  const primaryArtist = realArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  const lowerPrimary = foldAccents(primaryArtist);
  const lowerFull = foldAccents(realArtist);

  const trackSet = new Set<string>();
  const albumSet = new Set<string>();

  const sig = ORIGINAL_NPC_SIGNATURE_HINTS.get(lowerPrimary) || ORIGINAL_NPC_SIGNATURE_HINTS.get(lowerFull);
  if (sig) {
    sig.tracks.forEach(t => trackSet.add(t));
    sig.albums.forEach(a => albumSet.add(a));
  }

  try {
    const npcObj = REAL_WORLD_NPCS.find(
      n => foldAccents(n.name) === lowerPrimary || foldAccents(n.name) === lowerFull
    );
    if (npcObj) {
      (npcObj.songs || []).slice(0, 4).forEach(s => trackSet.add(s.title));
      (npcObj.albums || []).slice(0, 3).forEach(a => albumSet.add(a.title));
    }
  } catch {}

  return {
    tracks: Array.from(trackSet).slice(0, 5),
    albums: Array.from(albumSet).slice(0, 3)
  };
}

/**
 * Fetches an entire artist's verified top songs, albums & portrait in ONE batch request.
 * Anchors the artist lookup on their original flagship songs & albums so homonyms never mismatch.
 */
export async function fetchArtistCatalogBatchFromITunes(artistName: string): Promise<void> {
  const realArtist = normalizeRealArtistName(artistName || '').trim();
  if (!realArtist) return;
  const primaryArtist = realArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  const lowerArtist = foldAccents(primaryArtist);

  if (fetchedArtistBatches.has(lowerArtist)) return;
  const existingBatch = inflightArtistBatchPromises.get(lowerArtist);
  if (existingBatch) return existingBatch;

  const batchPromise = enqueueItunesTask(async () => {
    try {
      const hints = getArtistSignatureHints(realArtist);
      const hintTracksParam = hints.tracks.slice(0, 3).join('|');
      const hintAlbumsParam = hints.albums.slice(0, 2).join('|');

      const srvRes = await fetch(
        `/api/artwork/artist-batch?artist=${encodeURIComponent(primaryArtist)}&hintTracks=${encodeURIComponent(hintTracksParam)}&hintAlbum=${encodeURIComponent(hintAlbumsParam)}`
      );
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        let cachedAny = false;
        if (srvData?.artistPhoto && isValidArtworkUrl(srvData.artistPhoto)) {
          const rawLower = realArtist.toLowerCase();
          if (!memoryArtistPhotoCache[rawLower]) {
            memoryArtistPhotoCache[rawLower] = srvData.artistPhoto;
          }
          if (!memoryArtistPhotoCache[lowerArtist]) {
            memoryArtistPhotoCache[lowerArtist] = srvData.artistPhoto;
          }
          persistArtistPhotoCache();
          cachedAny = true;
        }
        if (srvData?.songCovers && typeof srvData.songCovers === 'object') {
          for (const [trkTitle, coverUrl] of Object.entries(srvData.songCovers)) {
            if (isValidArtworkUrl(coverUrl)) {
              storeCoverInCache(realArtist, trkTitle, coverUrl, false);
              storeCoverInCache(primaryArtist, trkTitle, coverUrl, false);
              cachedAny = true;
            }
          }
        }
        if (srvData?.albumCovers && typeof srvData.albumCovers === 'object') {
          for (const [albTitle, coverUrl] of Object.entries(srvData.albumCovers)) {
            if (isValidArtworkUrl(coverUrl)) {
              storeCoverInCache(realArtist, albTitle, coverUrl, true);
              storeCoverInCache(primaryArtist, albTitle, coverUrl, true);
              cachedAny = true;
            }
          }
        }
        if (cachedAny) {
          fetchedArtistBatches.add(lowerArtist);
          persistCoverCache();
          notifyArtworkListeners();
        }
      }
    } catch {
      // Ignore network error
    }
  }).finally(() => {
    inflightArtistBatchPromises.delete(lowerArtist);
  });

  inflightArtistBatchPromises.set(lowerArtist, batchPromise);
  return batchPromise;
}

/**
 * Resolves official high-resolution studio artist portrait:
 * Passes the artist's original signature hit songs, studio albums, and disambiguated Wikipedia slug
 * to `/api/artwork?isPortrait=true` so homonym artists (LISA, ROSÉ, JENNIE, IU, Dave, Future, etc.) 100% match.
 */
export async function fetchOfficialArtistPhoto(artistName: string): Promise<string | null> {
  const realName = normalizeRealArtistName(artistName || '').trim();
  if (!realName) return null;

  const lowerKey = realName.toLowerCase();
  const foldedKey = foldAccents(realName);

  const verifiedSpotify = getVerifiedSpotifyNpcPortrait(realName);
  if (verifiedSpotify && isValidArtworkUrl(verifiedSpotify)) {
    memoryArtistPhotoCache[lowerKey] = verifiedSpotify;
    memoryArtistPhotoCache[foldedKey] = verifiedSpotify;
    return verifiedSpotify;
  }

  if (memoryArtistPhotoCache[lowerKey] && isValidArtworkUrl(memoryArtistPhotoCache[lowerKey])) {
    return memoryArtistPhotoCache[lowerKey];
  }

  const existingPromise = inflightArtistPromises.get(lowerKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      const primaryName = realName.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
      const wikiSlug =
        ARTIST_WIKIPEDIA_SLUGS[realName] ||
        ARTIST_WIKIPEDIA_SLUGS[primaryName] ||
        primaryName.replace(/\s+/g, '_');

      const hints = getArtistSignatureHints(realName);
      const hintTracks = hints.tracks.slice(0, 4).join('|');
      const hintAlbum = hints.albums.slice(0, 3).join('|');

      // 1. Primary: Track/Album-Anchored Deezer + Contributor + Wikipedia Portrait Resolver on Server
      const srvPhotoUrl = await enqueueItunesTask(async () => {
        try {
          const srvRes = await fetch(
            `/api/artwork?artist=${encodeURIComponent(primaryName)}&isPortrait=true&hintTracks=${encodeURIComponent(hintTracks)}&hintAlbum=${encodeURIComponent(hintAlbum)}&wikiSlug=${encodeURIComponent(wikiSlug)}`
          );
          if (srvRes.ok) {
            const srvData = await srvRes.json();
            if (srvData?.url && isValidArtworkUrl(srvData.url)) {
              return String(srvData.url);
            }
          }
        } catch {}
        return null;
      });

      if (srvPhotoUrl) {
        memoryArtistPhotoCache[lowerKey] = srvPhotoUrl;
        memoryArtistPhotoCache[foldAccents(primaryName)] = srvPhotoUrl;
        persistArtistPhotoCache();
        try {
          const npcObj = REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === lowerKey);
          if (npcObj) {
            npcObj.avatar = srvPhotoUrl;
            npcObj.image = srvPhotoUrl;
          }
        } catch {}
        notifyArtworkListeners();
        return srvPhotoUrl;
      }

      // 2. Fallback: Direct client-side Wikipedia REST API summary using disambiguated wikiSlug
      try {
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`
        );
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const photoUrl: string | undefined =
            wikiData?.originalimage?.source || wikiData?.thumbnail?.source;
          if (photoUrl && isValidArtworkUrl(photoUrl)) {
            memoryArtistPhotoCache[lowerKey] = photoUrl;
            memoryArtistPhotoCache[foldAccents(primaryName)] = photoUrl;
            persistArtistPhotoCache();
            try {
              const npcObj = REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === lowerKey);
              if (npcObj) {
                npcObj.avatar = photoUrl;
                npcObj.image = photoUrl;
              }
            } catch {}
            notifyArtworkListeners();
            return photoUrl;
          }
        }
      } catch {}
    } catch {
      // Offline fallback handled by caller
    } finally {
      inflightArtistPromises.delete(lowerKey);
    }
    return null;
  })();

  inflightArtistPromises.set(lowerKey, promise);
  return promise;
}

/**
 * Fetches official high-resolution album/single artwork with strict artist + title verification
 * and parent-album / artist catalog fallback so covers are NEVER missing.
 */
export async function fetchOfficialCoverFromITunes(
  artist: string,
  title?: string,
  isAlbum = false,
  forceRefresh = false
): Promise<string | null> {
  const realArtist = normalizeRealArtistName(artist);
  const realTitle = normalizeRealTitle(title || '', realArtist, isAlbum)
    .replace(
      /\s*\((Official Music Video|Official Video|Music Video|Video Oficial|Vídeo Oficial|Lyric Video|Visualizer|Live|Performance Video)\)/gi,
      ''
    )
    .trim();

  if (!forceRefresh) {
    const cached = lookupCachedCoverUrl(realArtist, realTitle, isAlbum);
    if (cached) return cached;
  }

  const key = getCacheKey(realArtist, realTitle, isAlbum);
  if (!forceRefresh) {
    const existingInflight = inflightCoverPromises.get(key);
    if (existingInflight) {
      return existingInflight;
    }
  }

  const promise = (async (): Promise<string | null> => {
    try {
      const primaryArtist = realArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();

      // Step 1: Run deduplicated Artist Catalog Batch first (caches 50 top songs + 50 albums in 1 request!)
      await fetchArtistCatalogBatchFromITunes(primaryArtist);
      if (!forceRefresh) {
        const afterBatchCached = lookupCachedCoverUrl(realArtist, realTitle, isAlbum);
        if (afterBatchCached) {
          return afterBatchCached;
        }
      }

      const hints = getArtistSignatureHints(realArtist);
      const parentAlbum = !isAlbum ? findParentAlbumForSong(realArtist, realTitle) || '' : '';
      const albumHintList = [parentAlbum, ...hints.albums].filter(Boolean).slice(0, 3).join('|');
      const hintTracksParam = hints.tracks.slice(0, 3).join('|');

      // Step 2: Query our throttled & verified backend `/api/artwork` resolver
      const srvCoverUrl = await enqueueItunesTask(async () => {
        try {
          const srvRes = await fetch(
            `/api/artwork?artist=${encodeURIComponent(primaryArtist)}&title=${encodeURIComponent(realTitle)}&isAlbum=${isAlbum ? 'true' : 'false'}&albumHint=${encodeURIComponent(albumHintList)}&hintTracks=${encodeURIComponent(hintTracksParam)}`
          );
          if (srvRes.ok) {
            const srvData = await srvRes.json();
            if (srvData?.url && isValidArtworkUrl(srvData.url)) {
              return String(srvData.url);
            }
          }
        } catch {}
        return null;
      });

      if (srvCoverUrl) {
        storeCoverInCache(realArtist, realTitle, srvCoverUrl, isAlbum);
        persistCoverCache();
        notifyArtworkListeners();
        return srvCoverUrl;
      }

      // Step 3: Targeted client-side throttled iTunes search
      const cleanQueryTitle = realTitle.replace(/['’"`]/g, '').trim();
      const targetSimple = simplifyTitleForMatch(realTitle);
      const lowerPrimary = foldAccents(primaryArtist);
      const query = encodeURIComponent(`${primaryArtist} ${cleanQueryTitle}`.trim());
      const entity = isAlbum ? 'album' : 'song';

      const itunesDirectUrl = await enqueueItunesTask(async () => {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${query}&media=music&entity=${entity}&limit=15`
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const match = data.results.find((r: any) => {
            const rArtist = foldAccents(String(r.artistName || ''));
            const rTitle = simplifyTitleForMatch(
              String(isAlbum ? r.collectionName || '' : r.trackName || '')
            );
            return (
              rArtist.includes(lowerPrimary) &&
              (rTitle === targetSimple ||
                rTitle.startsWith(targetSimple) ||
                targetSimple.startsWith(rTitle))
            );
          });
          if (match && match.artworkUrl100) {
            return String(match.artworkUrl100).replace('100x100bb', '600x600bb');
          }
        }
        return null;
      });

      if (itunesDirectUrl && isValidArtworkUrl(itunesDirectUrl)) {
        storeCoverInCache(realArtist, realTitle, itunesDirectUrl, isAlbum);
        persistCoverCache();
        notifyArtworkListeners();
        return itunesDirectUrl;
      }
    } catch {
      // Ignore network error
    } finally {
      inflightCoverPromises.delete(key);
    }
    return null;
  })();

  inflightCoverPromises.set(key, promise);
  return promise;
}

export function generateFallbackCoverSvg(artist: string, title: string): string {
  const cleanArtist = (artist || 'Artist').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanTitle = (title || 'Single').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const seed = Math.abs((cleanArtist + cleanTitle).split('').reduce((acc, c) => (acc * 33 + c.charCodeAt(0)) | 0, 0));
  const palettes = [
    { bg: '#0F172A', accent: '#38BDF8', text: '#F8FAFC', sub: '#94A3B8' },
    { bg: '#18181B', accent: '#F43F5E', text: '#FFFFFF', sub: '#A1A1AA' },
    { bg: '#1C1917', accent: '#F59E0B', text: '#FEF3C7', sub: '#D97706' },
    { bg: '#064E3B', accent: '#34D399', text: '#ECFDF5', sub: '#6EE7B7' },
    { bg: '#311042', accent: '#C084FC', text: '#FAF5FF', sub: '#E9D5FF' },
    { bg: '#1E1E24', accent: '#E0E2EC', text: '#FFFFFF', sub: '#8E9099' }
  ];
  const palette = palettes[seed % palettes.length];
  const displayTitle = cleanTitle.length > 24 ? cleanTitle.slice(0, 22) + '...' : cleanTitle;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <rect width="500" height="500" fill="${palette.bg}" />
    <circle cx="250" cy="230" r="190" fill="none" stroke="${palette.accent}" stroke-opacity="0.1" stroke-width="1.5" />
    <circle cx="250" cy="230" r="130" fill="none" stroke="${palette.accent}" stroke-opacity="0.08" stroke-width="1" />
    <circle cx="250" cy="230" r="72" fill="#000000" fill-opacity="0.35" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.4" />
    <circle cx="250" cy="230" r="22" fill="${palette.accent}" fill-opacity="0.25" />
    <circle cx="250" cy="230" r="5" fill="${palette.text}" />
    <rect x="36" y="36" width="428" height="3" fill="${palette.accent}" fill-opacity="0.5" />
    <text x="36" y="60" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="${palette.sub}">OFFICIAL RELEASE • STEREO</text>
    <text x="36" y="404" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="900" fill="${palette.text}">${displayTitle}</text>
    <text x="36" y="434" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="600" fill="${palette.sub}">${cleanArtist}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateFallbackArtistAvatar(artistName: string): string {
  const clean = (artistName || 'Artist').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const initials = clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || 'AR';
  const seed = Math.abs(clean.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0));
  const hues = [
    ['#1DB954', '#0A2E17'],
    ['#E11D48', '#310814'],
    ['#3B82F6', '#0B1D3A'],
    ['#A855F7', '#250B3A'],
    ['#F59E0B', '#382005'],
    ['#06B6D4', '#062C33']
  ];
  const [accent, dark] = hues[seed % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${dark}" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#ag)" />
    <circle cx="150" cy="115" r="46" fill="#FFFFFF" fill-opacity="0.18" />
    <path d="M70 255 C70 195 230 195 230 255" fill="#FFFFFF" fill-opacity="0.18" />
    <text x="150" y="168" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="68" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Pure synchronous cache lookup (only returns verified cached cover for this exact song/album).
 */
export function resolveRealWorldCoverArt(
  artist: string,
  title?: string,
  isAlbum = false,
  explicitSrc?: string
): string {
  if (
    explicitSrc &&
    explicitSrc.startsWith('data:image/') &&
    !explicitSrc.startsWith('data:image/svg+xml')
  ) {
    return explicitSrc;
  }

  const realArtist = normalizeRealArtistName(artist || 'Artist');
  const realTitle = normalizeRealTitle(title || realArtist, realArtist, isAlbum);

  const cached = lookupCachedCoverUrl(realArtist, realTitle, isAlbum);
  if (cached) {
    return cached;
  }

  if (explicitSrc && isValidArtworkUrl(explicitSrc)) {
    return explicitSrc;
  }

  return generateFallbackCoverSvg(realArtist, realTitle);
}

/**
 * Pure synchronous artist photo cache lookup (never falls back to album covers).
 */
export function resolveRealWorldArtistPhoto(artistNameOrId: string, explicitSrc?: string): string {
  if (
    explicitSrc &&
    explicitSrc.startsWith('data:image/') &&
    !explicitSrc.startsWith('data:image/svg+xml')
  ) {
    return explicitSrc;
  }

  let realName = normalizeRealArtistName(artistNameOrId);
  try {
    const npcById = REAL_WORLD_NPCS.find(
      n => n.id === artistNameOrId || n.name.toLowerCase() === realName.toLowerCase()
    );
    if (npcById) realName = npcById.name;
  } catch {
    // Ignore if REAL_WORLD_NPCS is still initializing
  }
  const lowerKey = realName.toLowerCase();
  const foldedKey = foldAccents(realName);

  const verifiedSpotify = getVerifiedSpotifyNpcPortrait(realName);
  if (verifiedSpotify && isValidArtworkUrl(verifiedSpotify)) {
    return verifiedSpotify;
  }

  if (memoryArtistPhotoCache[lowerKey]) {
    return memoryArtistPhotoCache[lowerKey];
  }

  if (memoryArtistPhotoCache[foldedKey]) {
    return memoryArtistPhotoCache[foldedKey];
  }

  if (explicitSrc && isValidArtworkUrl(explicitSrc)) {
    return explicitSrc;
  }

  return generateFallbackArtistAvatar(realName);
}

// -----------------------------------------------------------------------------------------
// 45+ REAL-WORLD NPC SUPERSTARS WITH FULL AUTHENTIC DISCOGRAPHIES
// -----------------------------------------------------------------------------------------
export const REAL_WORLD_NPCS: DetailedNPC[] = [
  {
    id: 'npc1',
    name: 'Taylor Swift',
    pop: 99,
    hype: 97,
    tier: 1,
    country: 'US',
    genre: 'Pop / Synth-Pop / Folk-Pop',
    bio: '14-time Grammy winner and historic global stadium phenomenon known for record-breaking eras and narrative songwriting.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Cruel Summer', streams: 2680000000, radio: 310000, sales: 1950000, cover: '' },
      { title: 'Fortnight', streams: 1120000000, radio: 225000, sales: 1340000, cover: '' },
      { title: 'Anti-Hero', streams: 1790000000, radio: 275000, sales: 1620000, cover: '' },
      { title: 'Blank Space', streams: 2150000000, radio: 260000, sales: 1850000, cover: '' },
      { title: 'cardigan', streams: 1490000000, radio: 185000, sales: 1120000, cover: '' },
      { title: 'Midnight Rain', streams: 1180000000, radio: 165000, sales: 920000, cover: '' },
      { title: 'Lover', streams: 1640000000, radio: 210000, sales: 1380000, cover: '' },
      { title: 'I Can Do It With a Broken Heart', streams: 940000000, radio: 190000, sales: 860000, cover: '' }
    ],
    albums: [
      { title: 'THE TORTURED POETS DEPARTMENT', cover: '' },
      { title: 'Midnights', cover: '' },
      { title: '1989 (Taylor\'s Version)', cover: '' },
      { title: 'folklore', cover: '' },
      { title: 'Lover', cover: '' },
      { title: 'reputation', cover: '' },
      { title: 'evermore', cover: '' },
      { title: 'Red (Taylor\'s Version)', cover: '' }
    ]
  },
  {
    id: 'npc2',
    name: 'The Weeknd',
    pop: 98,
    hype: 95,
    tier: 1,
    country: 'CA',
    genre: 'Synth-Pop / Alternative R&B',
    bio: 'Global streaming titan holding the all-time Spotify monthly listener record with cinematic synth-wave anthems.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Blinding Lights', streams: 4580000000, radio: 380000, sales: 2850000, cover: '' },
      { title: 'Starboy', streams: 3620000000, radio: 310000, sales: 2150000, cover: '' },
      { title: 'Save Your Tears', streams: 2240000000, radio: 275000, sales: 1680000, cover: '' },
      { title: 'Die For You', streams: 2490000000, radio: 285000, sales: 1720000, cover: '' },
      { title: 'Timeless', streams: 920000000, radio: 195000, sales: 840000, cover: '' },
      { title: 'The Hills', streams: 2410000000, radio: 260000, sales: 1790000, cover: '' }
    ],
    albums: [
      { title: 'Hurry Up Tomorrow', cover: '' },
      { title: 'Dawn FM', cover: '' },
      { title: 'After Hours', cover: '' },
      { title: 'Starboy', cover: '' },
      { title: 'Beauty Behind the Madness', cover: '' },
      { title: 'My Dear Melancholy,', cover: '' }
    ]
  },
  {
    id: 'npc3',
    name: 'Bruno Mars',
    pop: 98,
    hype: 96,
    tier: 1,
    country: 'US',
    genre: 'Pop / R&B / Funk / Soul',
    bio: '15-time Grammy winner and Diamond-certified showman dominating global charts with Die With A Smile and APT.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Die With A Smile', streams: 2150000000, radio: 340000, sales: 1950000, cover: '' },
      { title: 'APT.', streams: 1680000000, radio: 290000, sales: 1580000, cover: '' },
      { title: 'Locked Out of Heaven', streams: 2290000000, radio: 275000, sales: 1840000, cover: '' },
      { title: 'That\'s What I Like', streams: 2380000000, radio: 285000, sales: 1920000, cover: '' },
      { title: 'When I Was Your Man', streams: 2440000000, radio: 260000, sales: 1890000, cover: '' },
      { title: 'Leave The Door Open', streams: 1490000000, radio: 245000, sales: 1210000, cover: '' }
    ],
    albums: [
      { title: '24K Magic', cover: '' },
      { title: 'An Evening With Silk Sonic', cover: '' },
      { title: 'Unorthodox Jukebox', cover: '' },
      { title: 'Doo-Wops & Hooligans', cover: '' }
    ]
  },
  {
    id: 'npc4',
    name: 'Bad Bunny',
    pop: 96,
    hype: 98,
    tier: 1,
    country: 'PR',
    genre: 'Reggaeton / Latin Trap / Urbano',
    bio: 'Puerto Rican global icon who revolutionized Spanish-language music on worldwide charts with historic stadium tours.',
    image: '',
    avatar: '',
    songs: [
      { title: 'DtMF', streams: 1380000000, radio: 225000, sales: 1250000, cover: '' },
      { title: 'Tití Me Preguntó', streams: 1680000000, radio: 215000, sales: 1290000, cover: '' },
      { title: 'Me Porto Bonito', streams: 1950000000, radio: 230000, sales: 1440000, cover: '' },
      { title: 'MONACO', streams: 1080000000, radio: 175000, sales: 890000, cover: '' },
      { title: 'Moscow Mule', streams: 1340000000, radio: 188000, sales: 1020000, cover: '' },
      { title: 'Ojitos Lindos', streams: 1590000000, radio: 192000, sales: 1180000, cover: '' }
    ],
    albums: [
      { title: 'DeBÍ TiRAR MáS FOToS', cover: '' },
      { title: 'nadie sabe lo que va a pasar mañana', cover: '' },
      { title: 'Un Verano Sin Ti', cover: '' },
      { title: 'YHLQMDLG', cover: '' },
      { title: 'El Último Tour Del Mundo', cover: '' },
      { title: 'X 100PRE', cover: '' }
    ]
  },
  {
    id: 'npc5',
    name: 'Billie Eilish',
    pop: 96,
    hype: 95,
    tier: 1,
    country: 'US',
    genre: 'Alt-Pop / Indie Electro-Pop',
    bio: 'Two-time Academy Award and 9-time Grammy winner acclaimed for atmospheric production and generation-defining albums.',
    image: '',
    avatar: '',
    songs: [
      { title: 'BIRDS OF A FEATHER', streams: 2180000000, radio: 295000, sales: 1780000, cover: '' },
      { title: 'bad guy', streams: 2690000000, radio: 270000, sales: 1920000, cover: '' },
      { title: 'LUNCH', streams: 1020000000, radio: 188000, sales: 840000, cover: '' },
      { title: 'WILDFLOWER', streams: 1090000000, radio: 175000, sales: 890000, cover: '' },
      { title: 'CHIHIRO', streams: 940000000, radio: 162000, sales: 790000, cover: '' },
      { title: 'What Was I Made For?', streams: 1380000000, radio: 210000, sales: 1240000, cover: '' }
    ],
    albums: [
      { title: 'HIT ME HARD AND SOFT', cover: '' },
      { title: 'Happier Than Ever', cover: '' },
      { title: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?', cover: '' },
      { title: 'dont smile at me', cover: '' }
    ]
  },
  {
    id: 'npc6',
    name: 'Drake',
    pop: 96,
    hype: 92,
    tier: 1,
    country: 'CA',
    genre: 'Hip-Hop / Melodic Rap / R&B',
    bio: 'Toronto superstar and the most-streamed hip-hop artist in history with 13 Billboard Hot 100 #1 hits.',
    image: '',
    avatar: '',
    songs: [
      { title: 'One Dance', streams: 3390000000, radio: 295000, sales: 2100000, cover: '' },
      { title: "God's Plan", streams: 2690000000, radio: 280000, sales: 1890000, cover: '' },
      { title: 'Rich Flex', streams: 1140000000, radio: 195000, sales: 950000, cover: '' },
      { title: 'Passionfruit', streams: 1820000000, radio: 210000, sales: 1320000, cover: '' },
      { title: 'Jimmy Cooks', streams: 1090000000, radio: 182000, sales: 880000, cover: '' },
      { title: 'First Person Shooter', streams: 860000000, radio: 174000, sales: 790000, cover: '' }
    ],
    albums: [
      { title: 'For All The Dogs', cover: '' },
      { title: 'Her Loss', cover: '' },
      { title: 'Certified Lover Boy', cover: '' },
      { title: 'Scorpion', cover: '' },
      { title: 'Views', cover: '' },
      { title: 'Take Care', cover: '' },
      { title: 'Nothing Was the Same', cover: '' },
      { title: 'More Life', cover: '' }
    ]
  },
  {
    id: 'npc7',
    name: 'Kendrick Lamar',
    pop: 95,
    hype: 98,
    tier: 1,
    country: 'US',
    genre: 'West Coast Hip-Hop / Conscious Rap',
    bio: 'Pulitzer Prize-winning lyricist and Super Bowl LIX headliner whose cultural anthems define modern hip-hop.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Not Like Us', streams: 1580000000, radio: 275000, sales: 1590000, cover: '' },
      { title: 'luther', streams: 1120000000, radio: 245000, sales: 1060000, cover: '' },
      { title: 'HUMBLE.', streams: 2380000000, radio: 260000, sales: 1850000, cover: '' },
      { title: 'tv off', streams: 890000000, radio: 195000, sales: 820000, cover: '' },
      { title: 'squabble up', streams: 810000000, radio: 185000, sales: 780000, cover: '' },
      { title: 'All The Stars', streams: 1980000000, radio: 240000, sales: 1420000, cover: '' }
    ],
    albums: [
      { title: 'GNX', cover: '' },
      { title: 'Mr. Morale & The Big Steppers', cover: '' },
      { title: 'DAMN.', cover: '' },
      { title: 'To Pimp a Butterfly', cover: '' },
      { title: 'good kid, m.A.A.d city', cover: '' }
    ]
  },
  {
    id: 'npc8',
    name: 'Sabrina Carpenter',
    pop: 94,
    hype: 96,
    tier: 1,
    country: 'US',
    genre: 'Pop / Disco-Pop',
    bio: 'Grammy-winning pop sensation behind global smashes Espresso, Please Please Please, and Taste.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Espresso', streams: 1980000000, radio: 295000, sales: 1640000, cover: '' },
      { title: 'Please Please Please', streams: 1480000000, radio: 255000, sales: 1320000, cover: '' },
      { title: 'Taste', streams: 1120000000, radio: 230000, sales: 1020000, cover: '' },
      { title: 'Bed Chem', streams: 820000000, radio: 190000, sales: 760000, cover: '' },
      { title: 'Feather', streams: 1090000000, radio: 215000, sales: 890000, cover: '' }
    ],
    albums: [
      { title: "Short n' Sweet", cover: '' },
      { title: "emails i can't send", cover: '' },
      { title: 'Singular: Act I', cover: '' }
    ]
  },
  {
    id: 'npc9',
    name: 'Ariana Grande',
    pop: 94,
    hype: 92,
    tier: 1,
    country: 'US',
    genre: 'Pop / R&B',
    bio: 'Multi-platinum vocal powerhouse with a four-octave range and a string of record-breaking #1 debuts on the Hot 100.',
    image: '',
    avatar: '',
    songs: [
      { title: "we can't be friends (wait for your love)", streams: 1380000000, radio: 245000, sales: 1180000, cover: '' },
      { title: '7 rings', streams: 2420000000, radio: 265000, sales: 1780000, cover: '' },
      { title: 'thank u, next', streams: 2010000000, radio: 250000, sales: 1560000, cover: '' },
      { title: 'positions', streams: 1620000000, radio: 235000, sales: 1290000, cover: '' },
      { title: 'yes, and?', streams: 860000000, radio: 180000, sales: 760000, cover: '' }
    ],
    albums: [
      { title: 'eternal sunshine', cover: '' },
      { title: 'Positions', cover: '' },
      { title: 'thank u, next', cover: '' },
      { title: 'Sweetener', cover: '' },
      { title: 'Dangerous Woman', cover: '' }
    ]
  },
  {
    id: 'npc10',
    name: 'SZA',
    pop: 93,
    hype: 93,
    tier: 1,
    country: 'US',
    genre: 'Contemporary R&B / Neo-Soul',
    bio: 'Grammy-winning R&B auteur whose album SOS became one of the longest-running top 10 albums in Billboard 200 history.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Kill Bill', streams: 2310000000, radio: 275000, sales: 1620000, cover: '' },
      { title: 'Snooze', streams: 1640000000, radio: 255000, sales: 1290000, cover: '' },
      { title: 'Saturn', streams: 1050000000, radio: 205000, sales: 890000, cover: '' },
      { title: 'BMF', streams: 740000000, radio: 175000, sales: 680000, cover: '' },
      { title: 'Good Days', streams: 1420000000, radio: 195000, sales: 1080000, cover: '' }
    ],
    albums: [
      { title: 'SOS Deluxe: LANA', cover: '' },
      { title: 'SOS', cover: '' },
      { title: 'Ctrl', cover: '' }
    ]
  },
  {
    id: 'npc11',
    name: 'Lady Gaga',
    pop: 95,
    hype: 95,
    tier: 1,
    country: 'US',
    genre: 'Pop / Dance-Pop / Electropop',
    bio: '13-time Grammy and Academy Award-winning pop icon dominating worldwide charts with MAYHEM and Die With A Smile.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Abracadabra', streams: 880000000, radio: 215000, sales: 920000, cover: '' },
      { title: 'Shallow', streams: 2690000000, radio: 280000, sales: 2150000, cover: '' },
      { title: 'Bad Romance', streams: 1540000000, radio: 245000, sales: 1750000, cover: '' },
      { title: 'Poker Face', streams: 1680000000, radio: 255000, sales: 1890000, cover: '' },
      { title: 'Disease', streams: 640000000, radio: 165000, sales: 610000, cover: '' }
    ],
    albums: [
      { title: 'MAYHEM', cover: '' },
      { title: 'Chromatica', cover: '' },
      { title: 'A Star Is Born Soundtrack', cover: '' },
      { title: 'The Fame Monster', cover: '' },
      { title: 'Born This Way', cover: '' }
    ]
  },
  {
    id: 'npc12',
    name: 'Post Malone',
    pop: 93,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Pop / Country / Melodic Hip-Hop',
    bio: 'Diamond-certified hitmaker effortlessly crossing between hip-hop, pop, rock, and stadium country.',
    image: '',
    avatar: '',
    songs: [
      { title: 'I Had Some Help', streams: 1460000000, radio: 285000, sales: 1420000, cover: '' },
      { title: 'Sunflower', streams: 3680000000, radio: 310000, sales: 2450000, cover: '' },
      { title: 'Circles', streams: 2740000000, radio: 295000, sales: 1920000, cover: '' },
      { title: 'rockstar', streams: 3090000000, radio: 265000, sales: 2100000, cover: '' }
    ],
    albums: [
      { title: 'F-1 Trillion', cover: '' },
      { title: 'Austin', cover: '' },
      { title: 'Hollywood\'s Bleeding', cover: '' },
      { title: 'beerbongs & bentleys', cover: '' },
      { title: 'Stoney', cover: '' }
    ]
  },
  {
    id: 'npc13',
    name: 'Travis Scott',
    pop: 93,
    hype: 95,
    tier: 1,
    country: 'US',
    genre: 'Hip-Hop / Psychedelic Trap',
    bio: 'Houston trap visionary and stadium tour phenomenon behind ASTROWORLD and UTOPIA.',
    image: '',
    avatar: '',
    songs: [
      { title: 'FE!N', streams: 1390000000, radio: 210000, sales: 1180000, cover: '' },
      { title: 'SICKO MODE', streams: 2340000000, radio: 245000, sales: 1850000, cover: '' },
      { title: 'goosebumps', streams: 2610000000, radio: 230000, sales: 1790000, cover: '' },
      { title: 'MY EYES', streams: 890000000, radio: 165000, sales: 740000, cover: '' },
      { title: 'I KNOW ?', streams: 940000000, radio: 185000, sales: 790000, cover: '' }
    ],
    albums: [
      { title: 'UTOPIA', cover: '' },
      { title: 'ASTROWORLD', cover: '' },
      { title: 'Birds in the Trap Sing McKnight', cover: '' },
      { title: 'Rodeo', cover: '' }
    ]
  },
  {
    id: 'npc14',
    name: 'Olivia Rodrigo',
    pop: 92,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'Pop-Rock / Alt-Pop',
    bio: 'Three-time Grammy winner blending confessional bedroom pop with explosive alt-rock anthems.',
    image: '',
    avatar: '',
    songs: [
      { title: 'vampire', streams: 1390000000, radio: 240000, sales: 1190000, cover: '' },
      { title: 'drivers license', streams: 2380000000, radio: 275000, sales: 1820000, cover: '' },
      { title: 'good 4 u', streams: 2310000000, radio: 268000, sales: 1760000, cover: '' },
      { title: 'deja vu', streams: 1780000000, radio: 225000, sales: 1340000, cover: '' }
    ],
    albums: [
      { title: 'GUTS', cover: '' },
      { title: 'SOUR', cover: '' }
    ]
  },
  {
    id: 'npc15',
    name: 'Chappell Roan',
    pop: 90,
    hype: 95,
    tier: 1,
    country: 'US',
    genre: 'Synth-Pop / Camp Pop',
    bio: 'Best New Artist Grammy winner whose theatrical synth-pop anthems ignited a worldwide festival movement.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Good Luck, Babe!', streams: 1450000000, radio: 245000, sales: 1290000, cover: '' },
      { title: 'Pink Pony Club', streams: 980000000, radio: 195000, sales: 910000, cover: '' },
      { title: 'HOT TO GO!', streams: 890000000, radio: 185000, sales: 840000, cover: '' },
      { title: 'Red Wine Supernova', streams: 720000000, radio: 160000, sales: 680000, cover: '' }
    ],
    albums: [
      { title: 'The Rise and Fall of a Midwest Princess', cover: '' }
    ]
  },
  {
    id: 'npc16',
    name: 'Dua Lipa',
    pop: 92,
    hype: 89,
    tier: 1,
    country: 'GB',
    genre: 'Dance-Pop / Nu-Disco',
    bio: 'British-Albanian pop superstar and multi-Grammy winner known for disco-infused global dancefloor smashes.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Levitating', streams: 2390000000, radio: 290000, sales: 1850000, cover: '' },
      { title: "Don't Start Now", streams: 2680000000, radio: 285000, sales: 1920000, cover: '' },
      { title: 'Houdini', streams: 890000000, radio: 195000, sales: 780000, cover: '' },
      { title: 'Cold Heart', streams: 2150000000, radio: 265000, sales: 1620000, cover: '' }
    ],
    albums: [
      { title: 'Radical Optimism', cover: '' },
      { title: 'Future Nostalgia', cover: '' },
      { title: 'Dua Lipa', cover: '' }
    ]
  },
  {
    id: 'npc17',
    name: 'Eminem',
    pop: 95,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'Hip-Hop / Rap',
    bio: 'Rock & Roll Hall of Fame inductee and one of the best-selling music artists of all time.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Houdini', streams: 860000000, radio: 195000, sales: 920000, cover: '' },
      { title: 'Without Me', streams: 2450000000, radio: 250000, sales: 2100000, cover: '' },
      { title: 'Lose Yourself', streams: 2380000000, radio: 260000, sales: 2350000, cover: '' },
      { title: 'Mockingbird', streams: 2050000000, radio: 215000, sales: 1680000, cover: '' }
    ],
    albums: [
      { title: 'The Death of Slim Shady (Coup de Grâce)', cover: '' },
      { title: 'The Eminem Show', cover: '' },
      { title: 'The Marshall Mathers LP', cover: '' },
      { title: 'Recovery', cover: '' },
      { title: 'Music to Be Murdered By', cover: '' }
    ]
  },
  {
    id: 'npc18',
    name: 'Rihanna',
    pop: 96,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Pop / R&B / Dancehall',
    bio: '9-time Grammy winner and cultural mogul with 14 Billboard Hot 100 #1 singles and timeless catalog smashes.',
    image: '',
    avatar: '',
    songs: [
      { title: 'We Found Love', streams: 1980000000, radio: 285000, sales: 1950000, cover: '' },
      { title: 'Diamonds', streams: 1850000000, radio: 270000, sales: 1820000, cover: '' },
      { title: 'Love On The Brain', streams: 1720000000, radio: 255000, sales: 1540000, cover: '' },
      { title: 'Umbrella', streams: 1790000000, radio: 265000, sales: 1890000, cover: '' }
    ],
    albums: [
      { title: 'ANTI', cover: '' },
      { title: 'Good Girl Gone Bad', cover: '' },
      { title: 'Loud', cover: '' },
      { title: 'Unapologetic', cover: '' }
    ]
  },
  {
    id: 'npc19',
    name: 'Coldplay',
    pop: 95,
    hype: 91,
    tier: 1,
    country: 'GB',
    genre: 'Alternative Rock / Pop-Rock',
    bio: 'British stadium rock legends behind the highest-grossing rock tour in history.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Yellow', streams: 2790000000, radio: 275000, sales: 2050000, cover: '' },
      { title: 'Viva La Vida', streams: 2480000000, radio: 280000, sales: 1980000, cover: '' },
      { title: 'Something Just Like This', streams: 2950000000, radio: 295000, sales: 2150000, cover: '' },
      { title: 'Sparks', streams: 1420000000, radio: 185000, sales: 1120000, cover: '' }
    ],
    albums: [
      { title: 'Moon Music', cover: '' },
      { title: 'Parachutes', cover: '' },
      { title: 'A Rush of Blood to the Head', cover: '' },
      { title: 'Viva la Vida or Death and All His Friends', cover: '' },
      { title: 'Music of the Spheres', cover: '' }
    ]
  },
  {
    id: 'npc20',
    name: 'Beyoncé',
    pop: 95,
    hype: 93,
    tier: 1,
    country: 'US',
    genre: 'Pop / R&B / Country-Pop',
    bio: 'The most-awarded Grammy artist in history with 35 wins and Album of the Year for COWBOY CARTER.',
    image: '',
    avatar: '',
    songs: [
      { title: "TEXAS HOLD 'EM", streams: 960000000, radio: 240000, sales: 1150000, cover: '' },
      { title: 'CUFF IT', streams: 1180000000, radio: 245000, sales: 1080000, cover: '' },
      { title: 'Crazy In Love', streams: 1520000000, radio: 255000, sales: 1680000, cover: '' },
      { title: 'Halo', streams: 1790000000, radio: 260000, sales: 1750000, cover: '' }
    ],
    albums: [
      { title: 'COWBOY CARTER', cover: '' },
      { title: 'RENAISSANCE', cover: '' },
      { title: 'Lemonade', cover: '' },
      { title: 'BEYONCÉ', cover: '' }
    ]
  },
  {
    id: 'npc21',
    name: 'Ed Sheeran',
    pop: 93,
    hype: 88,
    tier: 1,
    country: 'GB',
    genre: 'Pop / Acoustic Folk-Pop',
    bio: 'British singer-songwriter behind Shape of You and the Mathematics Stadium Tour.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Shape of You', streams: 4120000000, radio: 360000, sales: 2650000, cover: '' },
      { title: 'Perfect', streams: 3250000000, radio: 310000, sales: 2240000, cover: '' },
      { title: 'Bad Habits', streams: 1920000000, radio: 270000, sales: 1520000, cover: '' },
      { title: 'Photograph', streams: 2680000000, radio: 250000, sales: 1850000, cover: '' }
    ],
    albums: [
      { title: '÷ (Divide)', cover: '' },
      { title: '=', cover: '' },
      { title: 'x (Multiply)', cover: '' },
      { title: '- (Subtract)', cover: '' }
    ]
  },
  {
    id: 'npc22',
    name: 'Justin Bieber',
    pop: 93,
    hype: 88,
    tier: 1,
    country: 'CA',
    genre: 'Pop / R&B',
    bio: 'Canadian global pop icon with multi-billion-stream smashes across two decades.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Love Yourself', streams: 2620000000, radio: 295000, sales: 2050000, cover: '' },
      { title: 'Sorry', streams: 2380000000, radio: 280000, sales: 1920000, cover: '' },
      { title: 'Peaches', streams: 1740000000, radio: 255000, sales: 1380000, cover: '' },
      { title: 'Ghost', streams: 1820000000, radio: 265000, sales: 1420000, cover: '' }
    ],
    albums: [
      { title: 'Justice', cover: '' },
      { title: 'Purpose', cover: '' },
      { title: 'Changes', cover: '' },
      { title: 'Believe', cover: '' }
    ]
  },
  {
    id: 'npc23',
    name: 'Harry Styles',
    pop: 91,
    hype: 88,
    tier: 1,
    country: 'GB',
    genre: 'Pop-Rock / Soft Rock',
    bio: 'Album of the Year Grammy winner acclaimed for As It Was and Fine Line.',
    image: '',
    avatar: '',
    songs: [
      { title: 'As It Was', streams: 3580000000, radio: 330000, sales: 2280000, cover: '' },
      { title: 'Watermelon Sugar', streams: 2840000000, radio: 295000, sales: 1950000, cover: '' },
      { title: 'Sign of the Times', streams: 1890000000, radio: 230000, sales: 1520000, cover: '' },
      { title: 'Adore You', streams: 1960000000, radio: 255000, sales: 1480000, cover: '' }
    ],
    albums: [
      { title: "Harry's House", cover: '' },
      { title: 'Fine Line', cover: '' },
      { title: 'Harry Styles', cover: '' }
    ]
  },
  {
    id: 'npc24',
    name: 'Doja Cat',
    pop: 90,
    hype: 89,
    tier: 1,
    country: 'US',
    genre: 'Pop-Rap / R&B',
    bio: 'Genre-bending rap and pop chameleon behind Paint The Town Red, Kiss Me More, and Say So.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Paint The Town Red', streams: 1380000000, radio: 245000, sales: 1120000, cover: '' },
      { title: 'Kiss Me More', streams: 1980000000, radio: 265000, sales: 1480000, cover: '' },
      { title: 'Woman', streams: 1820000000, radio: 235000, sales: 1320000, cover: '' },
      { title: 'Agora Hills', streams: 860000000, radio: 195000, sales: 740000, cover: '' }
    ],
    albums: [
      { title: 'Scarlet', cover: '' },
      { title: 'Planet Her', cover: '' },
      { title: 'Hot Pink', cover: '' }
    ]
  },
  {
    id: 'npc25',
    name: 'Charli XCX',
    pop: 89,
    hype: 94,
    tier: 1,
    country: 'GB',
    genre: 'Hyperpop / Club Pop / Electropop',
    bio: 'British avant-pop pioneer whose album BRAT defined global club culture and won multiple Grammys.',
    image: '',
    avatar: '',
    songs: [
      { title: '360', streams: 690000000, radio: 175000, sales: 680000, cover: '' },
      { title: 'Apple', streams: 740000000, radio: 182000, sales: 710000, cover: '' },
      { title: 'Guess', streams: 820000000, radio: 188000, sales: 790000, cover: '' },
      { title: 'Von dutch', streams: 590000000, radio: 155000, sales: 560000, cover: '' }
    ],
    albums: [
      { title: 'BRAT', cover: '' },
      { title: 'Brat and it\'s completely different but also still brat', cover: '' },
      { title: 'CRASH', cover: '' },
      { title: 'how i\'m feeling now', cover: '' }
    ]
  },
  {
    id: 'npc26',
    name: 'Lana Del Rey',
    pop: 92,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Alternative Pop / Dream Pop',
    bio: 'Iconic Americana singer-songwriter whose album Born to Die spent over a decade on the Billboard 200.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Summertime Sadness', streams: 2150000000, radio: 220000, sales: 1680000, cover: '' },
      { title: 'Young and Beautiful', streams: 1780000000, radio: 195000, sales: 1420000, cover: '' },
      { title: 'West Coast', streams: 1120000000, radio: 165000, sales: 950000, cover: '' },
      { title: 'Video Games', streams: 1340000000, radio: 175000, sales: 1180000, cover: '' }
    ],
    albums: [
      { title: 'Born to Die', cover: '' },
      { title: 'Norman Fucking Rockwell!', cover: '' },
      { title: 'Did you know that there\'s a tunnel under Ocean Blvd', cover: '' },
      { title: 'Ultraviolence', cover: '' }
    ]
  },
  {
    id: 'npc27',
    name: 'Future',
    pop: 91,
    hype: 92,
    tier: 1,
    country: 'US',
    genre: 'Atlanta Trap / Hip-Hop',
    bio: 'Atlanta trap kingpin with 11 Billboard 200 #1 albums and historic chart runs.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Like That', streams: 1080000000, radio: 225000, sales: 980000, cover: '' },
      { title: 'WAIT FOR U', streams: 1290000000, radio: 245000, sales: 1120000, cover: '' },
      { title: 'Mask Off', streams: 1950000000, radio: 230000, sales: 1580000, cover: '' },
      { title: 'Type Shit', streams: 760000000, radio: 175000, sales: 690000, cover: '' }
    ],
    albums: [
      { title: 'WE DON\'T TRUST YOU', cover: '' },
      { title: 'MIXTAPE PLUTO', cover: '' },
      { title: 'I NEVER LIKED YOU', cover: '' },
      { title: 'DS2', cover: '' }
    ]
  },
  {
    id: 'npc28',
    name: 'Morgan Wallen',
    pop: 92,
    hype: 93,
    tier: 1,
    country: 'US',
    genre: 'Country / Country-Pop',
    bio: 'Country music juggernaut whose albums Dangerous and One Thing at a Time shattered Billboard 200 longevity records.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Last Night', streams: 1620000000, radio: 310000, sales: 1580000, cover: '' },
      { title: 'Love Somebody', streams: 790000000, radio: 225000, sales: 840000, cover: '' },
      { title: 'Wasted On You', streams: 1180000000, radio: 245000, sales: 1120000, cover: '' },
      { title: 'You Proof', streams: 1290000000, radio: 265000, sales: 1240000, cover: '' }
    ],
    albums: [
      { title: 'One Thing at a Time', cover: '' },
      { title: 'Dangerous: The Double Album', cover: '' },
      { title: 'If I Know Me', cover: '' }
    ]
  },
  {
    id: 'npc29',
    name: 'Zach Bryan',
    pop: 89,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Americana / Alt-Country / Folk',
    bio: 'Grammy-winning folk-country storyteller selling out stadiums with raw acoustic anthems.',
    image: '',
    avatar: '',
    songs: [
      { title: 'I Remember Everything', streams: 1280000000, radio: 215000, sales: 1150000, cover: '' },
      { title: 'Something in the Orange', streams: 1590000000, radio: 225000, sales: 1380000, cover: '' },
      { title: 'Pink Skies', streams: 740000000, radio: 175000, sales: 720000, cover: '' },
      { title: '28', streams: 610000000, radio: 155000, sales: 590000, cover: '' }
    ],
    albums: [
      { title: 'The Great American Bar Scene', cover: '' },
      { title: 'Zach Bryan', cover: '' },
      { title: 'American Heartbreak', cover: '' }
    ]
  },
  {
    id: 'npc30',
    name: 'Hozier',
    pop: 89,
    hype: 88,
    tier: 1,
    country: 'IE',
    genre: 'Indie Rock / Soul / Folk-Rock',
    bio: 'Irish singer-songwriter who topped the Hot 100 a decade after Take Me to Church with the global smash Too Sweet.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Too Sweet', streams: 1480000000, radio: 265000, sales: 1320000, cover: '' },
      { title: 'Take Me to Church', streams: 2890000000, radio: 275000, sales: 2150000, cover: '' },
      { title: 'Work Song', streams: 920000000, radio: 165000, sales: 780000, cover: '' }
    ],
    albums: [
      { title: 'Unheard', cover: '' },
      { title: 'Unreal Unearth', cover: '' },
      { title: 'Hozier', cover: '' }
    ]
  },
  {
    id: 'npc31',
    name: 'Benson Boone',
    pop: 88,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'Pop-Rock',
    bio: 'Breakout vocal powerhouse behind the IFPI #1 global single of the year, Beautiful Things.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Beautiful Things', streams: 1920000000, radio: 295000, sales: 1680000, cover: '' },
      { title: 'Slow It Down', streams: 780000000, radio: 185000, sales: 690000, cover: '' },
      { title: 'In The Stars', streams: 960000000, radio: 190000, sales: 820000, cover: '' }
    ],
    albums: [
      { title: 'Fireworks & Rollerblades', cover: '' }
    ]
  },
  {
    id: 'npc32',
    name: 'Teddy Swims',
    pop: 88,
    hype: 89,
    tier: 1,
    country: 'US',
    genre: 'Soul / R&B / Pop',
    bio: 'Soulful powerhouse vocalist whose single Lose Control broke the all-time Billboard Hot 100 Top 10 longevity record.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Lose Control', streams: 1860000000, radio: 320000, sales: 1640000, cover: '' },
      { title: 'The Door', streams: 740000000, radio: 210000, sales: 680000, cover: '' },
      { title: 'Bad Dreams', streams: 590000000, radio: 175000, sales: 540000, cover: '' }
    ],
    albums: [
      { title: "I've Tried Everything But Therapy (Part 1)", cover: '' },
      { title: "I've Tried Everything But Therapy (Part 2)", cover: '' }
    ]
  },
  {
    id: 'npc33',
    name: 'Tate McRae',
    pop: 89,
    hype: 92,
    tier: 1,
    country: 'CA',
    genre: 'Dance-Pop / R&B-Pop',
    bio: 'Canadian pop-dance triple threat dominating global charts with greedy, Sports car, and So Close To What.',
    image: '',
    avatar: '',
    songs: [
      { title: 'greedy', streams: 1740000000, radio: 275000, sales: 1420000, cover: '' },
      { title: 'exes', streams: 860000000, radio: 195000, sales: 740000, cover: '' },
      { title: 'It\'s ok I\'m ok', streams: 690000000, radio: 180000, sales: 620000, cover: '' },
      { title: 'Sports car', streams: 640000000, radio: 175000, sales: 590000, cover: '' }
    ],
    albums: [
      { title: 'So Close To What', cover: '' },
      { title: 'THINK LATER', cover: '' },
      { title: 'i used to think i could fly', cover: '' }
    ]
  },
  {
    id: 'npc34',
    name: 'Tyler, The Creator',
    pop: 91,
    hype: 94,
    tier: 1,
    country: 'US',
    genre: 'Alternative Hip-Hop / Neo-Soul',
    bio: 'Two-time Grammy winner and visionary producer behind CHROMAKOPIA, IGOR, and CALL ME IF YOU GET LOST.',
    image: '',
    avatar: '',
    songs: [
      { title: 'See You Again', streams: 2150000000, radio: 215000, sales: 1580000, cover: '' },
      { title: 'Sticky', streams: 780000000, radio: 185000, sales: 740000, cover: '' },
      { title: 'EARFQUAKE', streams: 1420000000, radio: 195000, sales: 1180000, cover: '' },
      { title: 'Like Him', streams: 690000000, radio: 165000, sales: 640000, cover: '' }
    ],
    albums: [
      { title: 'CHROMAKOPIA', cover: '' },
      { title: 'CALL ME IF YOU GET LOST', cover: '' },
      { title: 'IGOR', cover: '' },
      { title: 'Flower Boy', cover: '' }
    ]
  },
  {
    id: 'npc35',
    name: 'Karol G',
    pop: 92,
    hype: 93,
    tier: 1,
    country: 'CO',
    genre: 'Reggaeton / Latin Pop',
    bio: 'Colombian Bichota superstar and the first woman to debut at #1 on the Billboard 200 with an all-Spanish album.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Si Antes Te Hubiera Conocido', streams: 1290000000, radio: 235000, sales: 1120000, cover: '' },
      { title: 'TQG', streams: 1480000000, radio: 225000, sales: 1240000, cover: '' },
      { title: 'PROVENZA', streams: 1420000000, radio: 215000, sales: 1180000, cover: '' },
      { title: 'QLONA', streams: 1050000000, radio: 190000, sales: 890000, cover: '' }
    ],
    albums: [
      { title: 'MAÑANA SERÁ BONITO', cover: '' },
      { title: 'MAÑANA SERÁ BONITO (BICHOTA SEASON)', cover: '' },
      { title: 'KG0516', cover: '' }
    ]
  },
  {
    id: 'npc36',
    name: 'Peso Pluma',
    pop: 90,
    hype: 91,
    tier: 2,
    country: 'MX',
    genre: 'Regional Mexican / Corridos Tumbados',
    bio: 'Mexican global trailblazer who took Corridos Tumbados to the top of the Billboard Global 200.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Ella Baila Sola', streams: 1580000000, radio: 210000, sales: 1290000, cover: '' },
      { title: 'LADY GAGA', streams: 980000000, radio: 175000, sales: 820000, cover: '' },
      { title: 'La Bebe (Remix)', streams: 1190000000, radio: 185000, sales: 940000, cover: '' }
    ],
    albums: [
      { title: 'ÉXODO', cover: '' },
      { title: 'GÉNESIS', cover: '' }
    ]
  },
  {
    id: 'npc37',
    name: 'Feid',
    pop: 89,
    hype: 91,
    tier: 2,
    country: 'CO',
    genre: 'Reggaeton / Urbano Medellin',
    bio: 'Colombian Ferxxo hitmaker dominating Latin and global streaming charts with LUNA and CLASSY 101.',
    image: '',
    avatar: '',
    songs: [
      { title: 'LUNA', streams: 1190000000, radio: 195000, sales: 960000, cover: '' },
      { title: 'CLASSY 101', streams: 1120000000, radio: 188000, sales: 910000, cover: '' },
      { title: 'Feliz Cumpleaños Ferxxo', streams: 1080000000, radio: 180000, sales: 870000, cover: '' }
    ],
    albums: [
      { title: 'FERXXOCALIPSIS', cover: '' },
      { title: 'MOR, No Le Temas a La Oscuridad', cover: '' },
      { title: 'FELIZ CUMPLEAÑOS FERXXO TE PIRATEAMOS EL ÁLBUM', cover: '' }
    ]
  },
  {
    id: 'npc38',
    name: 'Jung Kook',
    pop: 92,
    hype: 95,
    tier: 1,
    country: 'KR',
    genre: 'Pop / K-Pop / R&B',
    bio: 'Global pop superstar whose solo debut Seven became the fastest song in history to surpass 1 billion streams.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Seven (feat. Latto)', streams: 2290000000, radio: 245000, sales: 1850000, cover: '' },
      { title: 'Standing Next to You', streams: 1280000000, radio: 195000, sales: 1320000, cover: '' },
      { title: '3D', streams: 940000000, radio: 175000, sales: 980000, cover: '' }
    ],
    albums: [
      { title: 'GOLDEN', cover: '' }
    ]
  },
  {
    id: 'npc39',
    name: 'BLACKPINK',
    pop: 93,
    hype: 95,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Hip-Hop / Dance-Pop',
    bio: 'Record-breaking global girl group and Coachella headliners topping both the Billboard 200 and UK Official Charts.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Pink Venom', streams: 1120000000, radio: 185000, sales: 1180000, cover: '' },
      { title: 'Shut Down', streams: 980000000, radio: 175000, sales: 1020000, cover: '' },
      { title: 'How You Like That', streams: 1320000000, radio: 190000, sales: 1350000, cover: '' }
    ],
    albums: [
      { title: 'BORN PINK', cover: '' },
      { title: 'THE ALBUM', cover: '' }
    ]
  },
  {
    id: 'npc40',
    name: 'NewJeans',
    pop: 89,
    hype: 92,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / UK Garage / R&B',
    bio: 'Fifth-generation K-Pop phenomenon acclaimed for Y2K R&B grooves and #1 Billboard 200 success.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Super Shy', streams: 890000000, radio: 175000, sales: 840000, cover: '' },
      { title: 'OMG', streams: 960000000, radio: 168000, sales: 880000, cover: '' },
      { title: 'Ditto', streams: 910000000, radio: 160000, sales: 850000, cover: '' },
      { title: 'Hype Boy', streams: 870000000, radio: 155000, sales: 810000, cover: '' }
    ],
    albums: [
      { title: 'Get Up', cover: '' },
      { title: 'New Jeans', cover: '' }
    ]
  },
  {
    id: 'npc41',
    name: 'Stray Kids',
    pop: 89,
    hype: 93,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Hip-Hop / Electronic',
    bio: 'Self-producing K-Pop powerhouse group with six consecutive #1 debuts on the Billboard 200.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Chk Chk Boom', streams: 640000000, radio: 155000, sales: 890000, cover: '' },
      { title: 'LALALALA', streams: 590000000, radio: 148000, sales: 820000, cover: '' },
      { title: 'MANIAC', streams: 680000000, radio: 150000, sales: 850000, cover: '' }
    ],
    albums: [
      { title: 'ATE', cover: '' },
      { title: '5-STAR', cover: '' },
      { title: 'ROCK-STAR', cover: '' },
      { title: 'HOP', cover: '' }
    ]
  },
  {
    id: 'npc42',
    name: 'ROSALÍA',
    pop: 89,
    hype: 90,
    tier: 1,
    country: 'ES',
    genre: 'Flamenco Urbano / Avant-Pop / Reggaeton',
    bio: 'Spanish Grammy and Latin Grammy winner blending experimental production with flamenco and dembow rhythms.',
    image: '',
    avatar: '',
    songs: [
      { title: 'DESPECHÁ', streams: 1260000000, radio: 205000, sales: 1080000, cover: '' },
      { title: 'BESO', streams: 940000000, radio: 185000, sales: 820000, cover: '' },
      { title: 'LA FAMA', streams: 790000000, radio: 170000, sales: 710000, cover: '' },
      { title: 'SAOKO', streams: 640000000, radio: 155000, sales: 610000, cover: '' }
    ],
    albums: [
      { title: 'MOTOMAMI', cover: '' },
      { title: 'El Mal Querer', cover: '' }
    ]
  },
  {
    id: 'npc43',
    name: 'Burna Boy',
    pop: 89,
    hype: 90,
    tier: 2,
    country: 'NG',
    genre: 'Afro-Fusion / Afrobeats',
    bio: 'Grammy-winning Nigerian African Giant headlining global stadiums with Afro-fusion anthems.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Last Last', streams: 1090000000, radio: 195000, sales: 920000, cover: '' },
      { title: 'City Boys', streams: 690000000, radio: 165000, sales: 640000, cover: '' },
      { title: 'Ye', streams: 880000000, radio: 170000, sales: 780000, cover: '' }
    ],
    albums: [
      { title: 'I Told Them...', cover: '' },
      { title: 'Love, Damini', cover: '' },
      { title: 'African Giant', cover: '' }
    ]
  },
  {
    id: 'npc44',
    name: 'Tyla',
    pop: 88,
    hype: 92,
    tier: 2,
    country: 'ZA',
    genre: 'Popiano / Amapiano / R&B',
    bio: 'South African Grammy winner bringing Amapiano and Popiano to the worldwide top 10.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Water', streams: 1290000000, radio: 245000, sales: 1120000, cover: '' },
      { title: 'PUSH 2 START', streams: 680000000, radio: 185000, sales: 640000, cover: '' },
      { title: 'Truth or Dare', streams: 590000000, radio: 165000, sales: 560000, cover: '' }
    ],
    albums: [
      { title: 'TYLA', cover: '' }
    ]
  },
  {
    id: 'npc45',
    name: 'Central Cee',
    pop: 88,
    hype: 91,
    tier: 1,
    country: 'GB',
    genre: 'UK Rap / UK Drill',
    bio: 'London rap phenomenon behind Sprinter, BAND4BAND, and Can\'t Rush Greatness.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Sprinter', streams: 1180000000, radio: 195000, sales: 980000, cover: '' },
      { title: 'BAND4BAND', streams: 860000000, radio: 180000, sales: 790000, cover: '' },
      { title: 'Doja', streams: 940000000, radio: 170000, sales: 820000, cover: '' }
    ],
    albums: [
      { title: "Can't Rush Greatness", cover: '' },
      { title: '23', cover: '' },
      { title: 'Wild West', cover: '' }
    ]
  },
  {
    id: 'npc46',
    name: 'Gracie Abrams',
    pop: 88,
    hype: 92,
    tier: 1,
    country: 'US',
    genre: 'Indie Pop / Singer-Songwriter',
    bio: 'Acclaimed indie-pop songwriter dominating global streaming charts with That\'s So True and I Love You, I\'m Sorry.',
    image: '',
    avatar: '',
    songs: [
      { title: "That's So True", streams: 1090000000, radio: 225000, sales: 980000, cover: '' },
      { title: "I Love You, I'm Sorry", streams: 860000000, radio: 195000, sales: 790000, cover: '' },
      { title: 'Close To You', streams: 690000000, radio: 175000, sales: 640000, cover: '' }
    ],
    albums: [
      { title: 'The Secret of Us', cover: '' },
      { title: 'Good Riddance', cover: '' }
    ]
  },
  ...EXPANDED_REAL_WORLD_NPCS,
  ...MEGA_EXPANDED_NPCS_WAVE_2
];

// -----------------------------------------------------------------------------------------
// MASSIVE 225+ UNIQUE REAL-WORLD STUDIO ALBUMS POOL (ZERO DUPLICATES FOR BILLBOARD 200)
// -----------------------------------------------------------------------------------------
export const UNIQUE_REAL_WORLD_ALBUMS: Array<{ artist: string; title: string }> = [
  { artist: 'Taylor Swift', title: 'THE TORTURED POETS DEPARTMENT' },
  { artist: 'Kendrick Lamar', title: 'GNX' },
  { artist: 'Sabrina Carpenter', title: "Short n' Sweet" },
  { artist: 'Billie Eilish', title: 'HIT ME HARD AND SOFT' },
  { artist: 'Bad Bunny', title: 'DeBÍ TiRAR MáS FOToS' },
  { artist: 'The Weeknd', title: 'Hurry Up Tomorrow' },
  { artist: 'SZA', title: 'SOS Deluxe: LANA' },
  { artist: 'Lady Gaga', title: 'MAYHEM' },
  { artist: 'Chappell Roan', title: 'The Rise and Fall of a Midwest Princess' },
  { artist: 'Morgan Wallen', title: 'One Thing at a Time' },
  { artist: 'Tyler, The Creator', title: 'CHROMAKOPIA' },
  { artist: 'Tate McRae', title: 'So Close To What' },
  { artist: 'Gracie Abrams', title: 'The Secret of Us' },
  { artist: 'Post Malone', title: 'F-1 Trillion' },
  { artist: 'Ariana Grande', title: 'eternal sunshine' },
  { artist: 'Charli XCX', title: 'BRAT' },
  { artist: 'Zach Bryan', title: 'The Great American Bar Scene' },
  { artist: 'Future', title: "WE DON'T TRUST YOU" },
  { artist: 'Drake', title: 'For All The Dogs' },
  { artist: 'Noah Kahan', title: 'Stick Season' },
  { artist: 'Benson Boone', title: 'Fireworks & Rollerblades' },
  { artist: 'Teddy Swims', title: "I've Tried Everything But Therapy (Part 1)" },
  { artist: 'Olivia Rodrigo', title: 'GUTS' },
  { artist: 'Taylor Swift', title: 'Lover' },
  { artist: 'Taylor Swift', title: 'Midnights' },
  { artist: 'Taylor Swift', title: 'folklore' },
  { artist: 'Taylor Swift', title: "1989 (Taylor's Version)" },
  { artist: 'Morgan Wallen', title: 'Dangerous: The Double Album' },
  { artist: 'Bad Bunny', title: 'Un Verano Sin Ti' },
  { artist: 'The Weeknd', title: 'After Hours' },
  { artist: 'The Weeknd', title: 'Starboy' },
  { artist: 'Travis Scott', title: 'UTOPIA' },
  { artist: 'Kendrick Lamar', title: 'DAMN.' },
  { artist: 'Kendrick Lamar', title: 'good kid, m.A.A.d city' },
  { artist: 'Fleetwood Mac', title: 'Rumours' },
  { artist: 'Eminem', title: 'The Death of Slim Shady (Coup de Grâce)' },
  { artist: 'Beyoncé', title: 'COWBOY CARTER' },
  { artist: 'Dua Lipa', title: 'Radical Optimism' },
  { artist: 'Dua Lipa', title: 'Future Nostalgia' },
  { artist: 'Hozier', title: 'Unreal Unearth' },
  { artist: 'Lana Del Rey', title: 'Born to Die' },
  { artist: 'Olivia Rodrigo', title: 'SOUR' },
  { artist: 'Drake', title: 'Take Care' },
  { artist: 'Drake', title: 'Certified Lover Boy' },
  { artist: 'Drake', title: 'Her Loss' },
  { artist: 'Drake', title: 'Scorpion' },
  { artist: 'Drake', title: 'Views' },
  { artist: 'Travis Scott', title: 'ASTROWORLD' },
  { artist: 'SZA', title: 'Ctrl' },
  { artist: 'Billie Eilish', title: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?' },
  { artist: 'Billie Eilish', title: 'Happier Than Ever' },
  { artist: 'Taylor Swift', title: 'reputation' },
  { artist: 'Taylor Swift', title: "Red (Taylor's Version)" },
  { artist: 'Taylor Swift', title: 'evermore' },
  { artist: 'Taylor Swift', title: "Fearless (Taylor's Version)" },
  { artist: 'Taylor Swift', title: "Speak Now (Taylor's Version)" },
  { artist: 'Zach Bryan', title: 'Zach Bryan' },
  { artist: 'Zach Bryan', title: 'American Heartbreak' },
  { artist: 'Rihanna', title: 'ANTI' },
  { artist: 'Rihanna', title: 'Good Girl Gone Bad' },
  { artist: 'Bruno Mars', title: '24K Magic' },
  { artist: 'Bruno Mars', title: 'Doo-Wops & Hooligans' },
  { artist: 'Bruno Mars', title: 'Unorthodox Jukebox' },
  { artist: 'Bruno Mars', title: 'An Evening With Silk Sonic' },
  { artist: 'Karol G', title: 'MAÑANA SERÁ BONITO' },
  { artist: 'Peso Pluma', title: 'GÉNESIS' },
  { artist: 'Peso Pluma', title: 'ÉXODO' },
  { artist: 'Feid', title: 'FERXXOCALIPSIS' },
  { artist: 'Bad Bunny', title: 'nadie sabe lo que va a pasar mañana' },
  { artist: 'Bad Bunny', title: 'YHLQMDLG' },
  { artist: 'Jung Kook', title: 'GOLDEN' },
  { artist: 'Stray Kids', title: 'ATE' },
  { artist: 'Stray Kids', title: 'HOP' },
  { artist: 'NewJeans', title: 'Get Up' },
  { artist: 'BLACKPINK', title: 'BORN PINK' },
  { artist: 'Central Cee', title: "Can't Rush Greatness" },
  { artist: 'Tyla', title: 'TYLA' },
  { artist: 'Burna Boy', title: 'I Told Them...' },
  { artist: 'ROSALÍA', title: 'MOTOMAMI' },
  { artist: 'Harry Styles', title: "Harry's House" },
  { artist: 'Harry Styles', title: 'Fine Line' },
  { artist: 'Ed Sheeran', title: '÷ (Divide)' },
  { artist: 'Ed Sheeran', title: '=' },
  { artist: 'Ed Sheeran', title: 'x (Multiply)' },
  { artist: 'Justin Bieber', title: 'Justice' },
  { artist: 'Justin Bieber', title: 'Purpose' },
  { artist: 'Doja Cat', title: 'Planet Her' },
  { artist: 'Doja Cat', title: 'Scarlet' },
  { artist: 'Doja Cat', title: 'Hot Pink' },
  { artist: 'Post Malone', title: "Hollywood's Bleeding" },
  { artist: 'Post Malone', title: 'beerbongs & bentleys' },
  { artist: 'Post Malone', title: 'Stoney' },
  { artist: 'Post Malone', title: 'Austin' },
  { artist: 'J. Cole', title: '2014 Forest Hills Drive' },
  { artist: 'J. Cole', title: 'The Off-Season' },
  { artist: 'J. Cole', title: 'Might Delete Later' },
  { artist: 'Kanye West', title: 'Graduation' },
  { artist: 'Kanye West', title: 'My Beautiful Dark Twisted Fantasy' },
  { artist: 'Kanye West', title: 'The Life of Pablo' },
  { artist: 'Kanye West', title: 'The College Dropout' },
  { artist: 'Kanye West', title: 'Late Registration' },
  { artist: 'Eminem', title: 'The Eminem Show' },
  { artist: 'Eminem', title: 'The Marshall Mathers LP' },
  { artist: 'Eminem', title: 'Recovery' },
  { artist: 'Eminem', title: 'Curtain Call: The Hits' },
  { artist: 'Future', title: 'I NEVER LIKED YOU' },
  { artist: 'Future', title: 'DS2' },
  { artist: 'Future', title: 'MIXPLUTO' },
  { artist: 'Metro Boomin', title: 'HEROES & VILLAINS' },
  { artist: 'Metro Boomin', title: 'NOT ALL HEROES WEAR CAPES' },
  { artist: '21 Savage', title: 'american dream' },
  { artist: '21 Savage', title: 'i am > i was' },
  { artist: 'Lil Baby', title: 'My Turn' },
  { artist: 'Lil Baby', title: 'WHAM' },
  { artist: 'Playboi Carti', title: 'Whole Lotta Red' },
  { artist: 'Playboi Carti', title: 'Die Lit' },
  { artist: 'Playboi Carti', title: 'MUSIC' },
  { artist: 'Tyler, The Creator', title: 'IGOR' },
  { artist: 'Tyler, The Creator', title: 'CALL ME IF YOU GET LOST' },
  { artist: 'Tyler, The Creator', title: 'Flower Boy' },
  { artist: 'Frank Ocean', title: 'Blonde' },
  { artist: 'Frank Ocean', title: 'channel ORANGE' },
  { artist: 'The Weeknd', title: 'Dawn FM' },
  { artist: 'The Weeknd', title: 'Beauty Behind the Madness' },
  { artist: 'The Weeknd', title: 'House of Balloons' },
  { artist: 'Ariana Grande', title: 'thank u, next' },
  { artist: 'Ariana Grande', title: 'Positions' },
  { artist: 'Ariana Grande', title: 'Sweetener' },
  { artist: 'Ariana Grande', title: 'Dangerous Woman' },
  { artist: 'Ariana Grande', title: 'My Everything' },
  { artist: 'Lady Gaga', title: 'The Fame' },
  { artist: 'Lady Gaga', title: 'Chromatica' },
  { artist: 'Lady Gaga', title: 'Born This Way' },
  { artist: 'Beyoncé', title: 'RENAISSANCE' },
  { artist: 'Beyoncé', title: 'Lemonade' },
  { artist: 'Beyoncé', title: 'Dangerously in Love' },
  { artist: 'Adele', title: '21' },
  { artist: 'Adele', title: '25' },
  { artist: 'Adele', title: '30' },
  { artist: 'Katy Perry', title: 'Teenage Dream' },
  { artist: 'Miley Cyrus', title: 'Endless Summer Vacation' },
  { artist: 'Miley Cyrus', title: 'Plastic Hearts' },
  { artist: 'Selena Gomez', title: 'Rare' },
  { artist: 'Sabrina Carpenter', title: "emails i can't send" },
  { artist: 'Tate McRae', title: 'THINK LATER' },
  { artist: 'Gracie Abrams', title: 'Good Riddance' },
  { artist: 'Lana Del Rey', title: 'Norman Fucking Rockwell!' },
  { artist: 'Lana Del Rey', title: 'Ultraviolence' },
  { artist: 'Lana Del Rey', title: "Did you know that there's a tunnel under Ocean Blvd" },
  { artist: 'Arctic Monkeys', title: 'AM' },
  { artist: 'Arctic Monkeys', title: 'Favourite Worst Nightmare' },
  { artist: 'Coldplay', title: 'Moon Music' },
  { artist: 'Coldplay', title: 'Parachutes' },
  { artist: 'Coldplay', title: 'A Rush of Blood to the Head' },
  { artist: 'Coldplay', title: 'Viva la Vida or Death and All His Friends' },
  { artist: 'Imagine Dragons', title: 'Night Visions' },
  { artist: 'Imagine Dragons', title: 'Evolve' },
  { artist: 'Imagine Dragons', title: 'LOOM' },
  { artist: 'Linkin Park', title: 'From Zero' },
  { artist: 'Linkin Park', title: 'Hybrid Theory' },
  { artist: 'Linkin Park', title: 'Meteora' },
  { artist: 'Nirvana', title: 'Nevermind' },
  { artist: 'Queen', title: 'Greatest Hits' },
  { artist: 'Michael Jackson', title: 'Thriller' },
  { artist: 'ABBA', title: 'Gold: Greatest Hits' },
  { artist: 'Elton John', title: 'Diamonds' },
  { artist: 'Luke Combs', title: 'This One\'s for You' },
  { artist: 'Luke Combs', title: 'Gettin\' Old' },
  { artist: 'Luke Combs', title: 'Fathers & Sons' },
  { artist: 'Chris Stapleton', title: 'Traveller' },
  { artist: 'Chris Stapleton', title: 'Higher' },
  { artist: 'Jelly Roll', title: 'Beautifully Broken' },
  { artist: 'Shaboozey', title: 'Where I\'ve Been, Isn\'t Where I\'m Going' },
  { artist: 'Kacey Musgraves', title: 'Deeper Well' },
  { artist: 'Hozier', title: 'Hozier' },
  { artist: 'The Kid LAROI', title: 'THE FIRST TIME' },
  { artist: 'The Kid LAROI', title: 'F*CK LOVE' },
  { artist: 'Shawn Mendes', title: 'Shawn' },
  { artist: 'Shawn Mendes', title: 'Illuminate' },
  { artist: 'Camila Cabello', title: 'C,XOXO' },
  { artist: 'Nicki Minaj', title: 'Pink Friday 2' },
  { artist: 'Nicki Minaj', title: 'Pink Friday' },
  { artist: 'Cardi B', title: 'Invasion of Privacy' },
  { artist: 'Megan Thee Stallion', title: 'MEGAN' },
  { artist: 'GloRilla', title: 'GLORIOUS' },
  { artist: 'Doechii', title: 'Alligator Bites Never Heal' },
  { artist: 'Gunna', title: 'One of Wun' },
  { artist: 'Don Toliver', title: 'HARDSTONE PSYCHO' },
  { artist: 'Juice WRLD', title: 'Goodbye & Good Riddance' },
  { artist: 'Juice WRLD', title: 'Legends Never Die' },
  { artist: 'XXXTENTACION', title: '?' },
  { artist: 'Pop Smoke', title: 'Shoot for the Stars, Aim for the Moon' },
  { artist: 'Lil Uzi Vert', title: 'Luv Is Rage 2' },
  { artist: 'Lil Uzi Vert', title: 'Pink Tape' },
  { artist: 'Rod Wave', title: 'Last Lap' },
  { artist: 'Rod Wave', title: 'Nostalgia' },
  { artist: 'Summer Walker', title: 'Over It' },
  { artist: 'Bryson Tiller', title: 'T R A P S O U L' },
  { artist: 'Brent Faiyaz', title: 'WASTELAND' },
  { artist: 'Daniel Caesar', title: 'Freudian' },
  { artist: 'Kali Uchis', title: 'ORQUÍDEAS' },
  { artist: 'Rauw Alejandro', title: 'Cosa Nuestra' },
  { artist: 'Rauw Alejandro', title: 'Vice Versa' },
  { artist: 'Shakira', title: 'Las Mujeres Ya No Lloran' },
  { artist: 'Fuerza Regida', title: 'PERO NO TE ENAMORES' },
  { artist: 'Junior H', title: '$AD BOYZ 4 LIFE II' },
  { artist: 'BTS', title: 'Proof' },
  { artist: 'BTS', title: 'Map of the Soul: 7' },
  { artist: 'TWICE', title: 'STRATEGY' },
  { artist: 'SEVENTEEN', title: 'SPILL THE FEELS' },
  { artist: 'aespa', title: 'Armageddon' },
  { artist: 'ENHYPEN', title: 'ROMANCE : UNTOLD' },
  { artist: 'ATEEZ', title: 'GOLDEN HOUR : Part.2' },
  { artist: 'LE SSERAFIM', title: 'CRAZY' },
  { artist: 'ROSÉ', title: 'rosie' },
  { artist: 'LISA', title: 'Alter Ego' },
  { artist: 'JENNIE', title: 'Ruby' },
  { artist: 'Rema', title: 'HEIS' },
  { artist: 'Rema', title: 'Rave & Roses' },
  { artist: 'Asake', title: 'Lungu Boy' },
  { artist: 'Dave', title: 'We\'re All Alone in This Together' },
  { artist: 'Fred again..', title: 'ten days' },
  { artist: 'RAYE', title: 'My 21st Century Blues' },
  { artist: 'Charli XCX', title: 'CRASH' },
  { artist: 'Daft Punk', title: 'Random Access Memories' }
];

// -----------------------------------------------------------------------------------------
// MASSIVE 230+ UNIQUE REAL-WORLD HIT SINGLES POOL (ZERO DUPLICATES FOR GLOBAL 200)
// -----------------------------------------------------------------------------------------
export const UNIQUE_REAL_WORLD_SINGLES: Array<{ artist: string; title: string }> = [
  { artist: 'Bruno Mars', title: 'Die With A Smile' },
  { artist: 'Bruno Mars', title: 'APT.' },
  { artist: 'Billie Eilish', title: 'BIRDS OF A FEATHER' },
  { artist: 'Sabrina Carpenter', title: 'Espresso' },
  { artist: 'Kendrick Lamar', title: 'luther' },
  { artist: 'Kendrick Lamar', title: 'Not Like Us' },
  { artist: 'Bad Bunny', title: 'DtMF' },
  { artist: 'Lady Gaga', title: 'Abracadabra' },
  { artist: 'Chappell Roan', title: 'Good Luck, Babe!' },
  { artist: 'Taylor Swift', title: 'Cruel Summer' },
  { artist: 'Sabrina Carpenter', title: 'Taste' },
  { artist: 'Sabrina Carpenter', title: 'Please Please Please' },
  { artist: 'Gracie Abrams', title: "That's So True" },
  { artist: 'Teddy Swims', title: 'Lose Control' },
  { artist: 'Benson Boone', title: 'Beautiful Things' },
  { artist: 'Hozier', title: 'Too Sweet' },
  { artist: 'Post Malone', title: 'I Had Some Help' },
  { artist: 'Shaboozey', title: 'A Bar Song (Tipsy)' },
  { artist: 'Billie Eilish', title: 'WILDFLOWER' },
  { artist: 'The Weeknd', title: 'Timeless' },
  { artist: 'The Weeknd', title: 'Blinding Lights' },
  { artist: 'Kendrick Lamar', title: 'tv off' },
  { artist: 'Kendrick Lamar', title: 'squabble up' },
  { artist: 'SZA', title: 'BMF' },
  { artist: 'SZA', title: 'Snooze' },
  { artist: 'SZA', title: 'Saturn' },
  { artist: 'SZA', title: 'Kill Bill' },
  { artist: 'Taylor Swift', title: 'Fortnight' },
  { artist: 'Taylor Swift', title: 'I Can Do It With a Broken Heart' },
  { artist: 'Taylor Swift', title: 'Anti-Hero' },
  { artist: 'Ariana Grande', title: "we can't be friends (wait for your love)" },
  { artist: 'Chappell Roan', title: 'Pink Pony Club' },
  { artist: 'Chappell Roan', title: 'HOT TO GO!' },
  { artist: 'Charli XCX', title: 'Guess' },
  { artist: 'Charli XCX', title: 'Apple' },
  { artist: 'Charli XCX', title: '360' },
  { artist: 'Tate McRae', title: 'Sports car' },
  { artist: 'Tate McRae', title: 'greedy' },
  { artist: 'Tate McRae', title: "It's ok I'm ok" },
  { artist: 'Bad Bunny', title: 'BAILE INoLVIDABLE' },
  { artist: 'Bad Bunny', title: 'NUEVAYoL' },
  { artist: 'Bad Bunny', title: 'Tití Me Preguntó' },
  { artist: 'Bad Bunny', title: 'Me Porto Bonito' },
  { artist: 'Bad Bunny', title: 'MONACO' },
  { artist: 'Karol G', title: 'Si Antes Te Hubiera Conocido' },
  { artist: 'Feid', title: 'LUNA' },
  { artist: 'Peso Pluma', title: 'Ella Baila Sola' },
  { artist: 'Drake', title: 'One Dance' },
  { artist: 'Drake', title: "God's Plan" },
  { artist: 'Drake', title: 'Nokia' },
  { artist: 'Drake', title: 'Rich Flex' },
  { artist: 'Drake', title: 'Passionfruit' },
  { artist: 'Travis Scott', title: 'FE!N' },
  { artist: 'Travis Scott', title: 'goosebumps' },
  { artist: 'Travis Scott', title: 'SICKO MODE' },
  { artist: 'Future', title: 'Like That' },
  { artist: 'Future', title: 'Type Shit' },
  { artist: 'Morgan Wallen', title: 'Love Somebody' },
  { artist: 'Morgan Wallen', title: 'Last Night' },
  { artist: 'Zach Bryan', title: 'I Remember Everything' },
  { artist: 'Zach Bryan', title: 'Pink Skies' },
  { artist: 'Zach Bryan', title: 'Something in the Orange' },
  { artist: 'Noah Kahan', title: 'Stick Season' },
  { artist: 'Olivia Rodrigo', title: 'vampire' },
  { artist: 'Olivia Rodrigo', title: 'drivers license' },
  { artist: 'Olivia Rodrigo', title: 'good 4 u' },
  { artist: 'Olivia Rodrigo', title: 'deja vu' },
  { artist: 'Sabrina Carpenter', title: 'Bed Chem' },
  { artist: 'Sabrina Carpenter', title: 'Juno' },
  { artist: 'Sabrina Carpenter', title: 'Feather' },
  { artist: 'Billie Eilish', title: 'LUNCH' },
  { artist: 'Billie Eilish', title: 'CHIHIRO' },
  { artist: 'Billie Eilish', title: 'What Was I Made For?' },
  { artist: 'Billie Eilish', title: 'bad guy' },
  { artist: 'Billie Eilish', title: 'ocean eyes' },
  { artist: 'The Weeknd', title: 'Starboy' },
  { artist: 'The Weeknd', title: 'Die For You' },
  { artist: 'The Weeknd', title: 'Save Your Tears' },
  { artist: 'The Weeknd', title: 'One Of The Girls' },
  { artist: 'The Weeknd', title: 'The Hills' },
  { artist: 'Tyler, The Creator', title: 'Sticky' },
  { artist: 'Tyler, The Creator', title: 'See You Again' },
  { artist: 'Tyler, The Creator', title: 'Like Him' },
  { artist: 'Gracie Abrams', title: "I Love You, I'm Sorry" },
  { artist: 'Gracie Abrams', title: 'Close To You' },
  { artist: 'Teddy Swims', title: 'The Door' },
  { artist: 'Teddy Swims', title: 'Bad Dreams' },
  { artist: 'Benson Boone', title: 'Slow It Down' },
  { artist: 'Benson Boone', title: 'Mystical Magical' },
  { artist: 'Dua Lipa', title: 'Houdini' },
  { artist: 'Dua Lipa', title: 'Training Season' },
  { artist: 'Dua Lipa', title: 'Levitating' },
  { artist: 'Dua Lipa', title: "Don't Start Now" },
  { artist: 'Harry Styles', title: 'As It Was' },
  { artist: 'Harry Styles', title: 'Watermelon Sugar' },
  { artist: 'Ed Sheeran', title: 'Shape of You' },
  { artist: 'Ed Sheeran', title: 'Perfect' },
  { artist: 'Ed Sheeran', title: 'Bad Habits' },
  { artist: 'Justin Bieber', title: 'Ghost' },
  { artist: 'Justin Bieber', title: 'Peaches' },
  { artist: 'Justin Bieber', title: 'Love Yourself' },
  { artist: 'The Kid LAROI', title: 'STAY' },
  { artist: 'The Kid LAROI', title: 'NIGHTS LIKE THIS' },
  { artist: 'Doja Cat', title: 'Paint The Town Red' },
  { artist: 'Doja Cat', title: 'Agora Hills' },
  { artist: 'Doja Cat', title: 'Woman' },
  { artist: 'Eminem', title: 'Houdini' },
  { artist: 'Eminem', title: 'Without Me' },
  { artist: 'Eminem', title: 'Mockingbird' },
  { artist: 'Eminem', title: 'Lose Yourself' },
  { artist: 'Rihanna', title: 'We Found Love' },
  { artist: 'Rihanna', title: 'Diamonds' },
  { artist: 'Rihanna', title: 'Love On The Brain' },
  { artist: 'Beyoncé', title: "TEXAS HOLD 'EM" },
  { artist: 'Beyoncé', title: 'CUFF IT' },
  { artist: 'Lady Gaga', title: 'Disease' },
  { artist: 'Lady Gaga', title: 'Shallow' },
  { artist: 'Lady Gaga', title: 'Poker Face' },
  { artist: 'Coldplay', title: 'Yellow' },
  { artist: 'Coldplay', title: 'Viva La Vida' },
  { artist: 'Coldplay', title: 'Sparks' },
  { artist: 'Coldplay', title: 'feelslikeimfallinginlove' },
  { artist: 'Arctic Monkeys', title: 'I Wanna Be Yours' },
  { artist: 'Arctic Monkeys', title: '505' },
  { artist: 'Lana Del Rey', title: 'Summertime Sadness' },
  { artist: 'Lana Del Rey', title: 'Young and Beautiful' },
  { artist: 'Linkin Park', title: 'The Emptiness Machine' },
  { artist: 'Linkin Park', title: 'In the End' },
  { artist: 'Linkin Park', title: 'Numb' },
  { artist: 'Imagine Dragons', title: 'Believer' },
  { artist: 'Imagine Dragons', title: 'Bones' },
  { artist: 'Post Malone', title: 'Sunflower' },
  { artist: 'Post Malone', title: 'Circles' },
  { artist: 'Post Malone', title: 'Pour Me A Drink' },
  { artist: 'Bruno Mars', title: 'Locked Out of Heaven' },
  { artist: 'Bruno Mars', title: 'When I Was Your Man' },
  { artist: 'Bruno Mars', title: "That's What I Like" },
  { artist: 'Jung Kook', title: 'Seven (feat. Latto)' },
  { artist: 'Jung Kook', title: 'Standing Next to You' },
  { artist: 'JIMIN', title: 'Who' },
  { artist: 'LISA', title: 'Rockstar' },
  { artist: 'LISA', title: 'New Woman' },
  { artist: 'JENNIE', title: 'Mantra' },
  { artist: 'aespa', title: 'Supernova' },
  { artist: 'aespa', title: 'Whiplash' },
  { artist: 'ILLIT', title: 'Magnetic' },
  { artist: 'NewJeans', title: 'Super Shy' },
  { artist: 'NewJeans', title: 'How Sweet' },
  { artist: 'LE SSERAFIM', title: 'CRAZY' },
  { artist: 'Stray Kids', title: 'Chk Chk Boom' },
  { artist: 'BLACKPINK', title: 'Pink Venom' },
  { artist: 'YOASOBI', title: 'Idol' },
  { artist: 'Fujii Kaze', title: 'Shinunoga E-Wa' },
  { artist: 'Creepy Nuts', title: 'Bling-Bang-Bang-Born' },
  { artist: 'Mrs. GREEN APPLE', title: 'Lilac' },
  { artist: 'Tyla', title: 'Water' },
  { artist: 'Tyla', title: 'PUSH 2 START' },
  { artist: 'Burna Boy', title: 'Last Last' },
  { artist: 'Burna Boy', title: 'City Boys' },
  { artist: 'Rema', title: 'Calm Down' },
  { artist: 'Rema', title: 'Ozeba' },
  { artist: 'Central Cee', title: 'Sprinter' },
  { artist: 'Central Cee', title: 'BAND4BAND' },
  { artist: 'Central Cee', title: 'GBP' },
  { artist: 'Dave', title: 'Starlight' },
  { artist: 'RAYE', title: 'Escapism.' },
  { artist: 'Fred again..', title: 'places to be' },
  { artist: 'ROSALÍA', title: 'DESPECHÁ' },
  { artist: 'Karol G', title: 'TQG' },
  { artist: 'Karol G', title: 'QLONA' },
  { artist: 'Rauw Alejandro', title: 'Khé?' },
  { artist: 'Rauw Alejandro', title: 'Santa' },
  { artist: 'Shakira', title: 'Soltera' },
  { artist: 'Myke Towers', title: 'LALA' },
  { artist: 'Myke Towers', title: 'DEGENERE' },
  { artist: 'FloyyMenor', title: 'Gata Only' },
  { artist: 'Oscar Maydon', title: 'Tu Boda' },
  { artist: 'Fuerza Regida', title: 'NEL' },
  { artist: 'Junior H', title: 'Y LLORO' },
  { artist: 'Tommy Richman', title: 'MILLION DOLLAR BABY' },
  { artist: 'GloRilla', title: 'TGIF' },
  { artist: 'GloRilla', title: 'WHATCHU KNO ABOUT ME' },
  { artist: 'Doechii', title: 'DENIAL IS A RIVER' },
  { artist: 'Megan Thee Stallion', title: 'Mamushi' },
  { artist: 'Gunna', title: 'fukumean' },
  { artist: 'Don Toliver', title: 'NEW DROP' },
  { artist: 'Playboi Carti', title: 'ALL RED' },
  { artist: '21 Savage', title: 'redrum' },
  { artist: 'Metro Boomin', title: 'Creepin\'' },
  { artist: 'J. Cole', title: 'No Role Modelz' },
  { artist: 'Kanye West', title: 'Flashing Lights' },
  { artist: 'Kanye West', title: 'Heartless' },
  { artist: 'Frank Ocean', title: 'Pink + White' },
  { artist: 'Daniel Caesar', title: 'Best Part' },
  { artist: 'Kali Uchis', title: 'telepatía' },
  { artist: 'Miley Cyrus', title: 'Flowers' },
  { artist: 'Adele', title: 'Easy On Me' },
  { artist: 'Adele', title: 'Rolling in the Deep' },
  { artist: 'Sia', title: 'Unstoppable' },
  { artist: 'OneRepublic', title: 'I Ain\'t Worried' },
  { artist: 'Glass Animals', title: 'Heat Waves' },
  { artist: 'The Neighbourhood', title: 'Sweater Weather' },
  { artist: 'Hozier', title: 'Take Me to Church' },
  { artist: 'Vance Joy', title: 'Riptide' },
  { artist: 'Lewis Capaldi', title: 'Someone You Loved' },
  { artist: 'Sam Smith', title: 'Unholy' },
  { artist: 'Tate McRae', title: 'exes' },
  { artist: 'Ariana Grande', title: 'the boy is mine' },
  { artist: 'Ariana Grande', title: '7 rings' },
  { artist: 'Ariana Grande', title: 'thank u, next' },
  { artist: 'Taylor Swift', title: 'Blank Space' },
  { artist: 'Taylor Swift', title: 'Lover' },
  { artist: 'Taylor Swift', title: 'cardigan' },
  { artist: 'Taylor Swift', title: 'August' },
  { artist: 'Taylor Swift', title: 'Style' },
  { artist: 'Taylor Swift', title: 'Don\'t Blame Me' },
  { artist: 'Kendrick Lamar', title: 'HUMBLE.' },
  { artist: 'Kendrick Lamar', title: 'All The Stars' },
  { artist: 'Kendrick Lamar', title: 'Money Trees' },
  { artist: 'Kendrick Lamar', title: 'hey now' },
  { artist: 'Kendrick Lamar', title: 'reincarnated' },
  { artist: 'Bernadya', title: 'Satu Bulan' },
  { artist: 'Bernadya', title: 'Untungnya, Hidup Harus Tetap Berjalan' },
  { artist: 'Tulus', title: 'Hati-Hati di Jalan' },
  { artist: 'Mahalini', title: 'Sial' },
  { artist: 'Sal Priadi', title: 'Gala Bunga Matahari' },
  { artist: 'Juicy Luicy', title: 'Lantas' }
];

// Record each NPC's original signature hit tracks and studio albums BEFORE workflow mutation
// and populate initial portrait & cached cover references on REAL_WORLD_NPCS
const hasCachedPortraits = Object.keys(memoryArtistPhotoCache).length > 0;
const hasCachedCovers = Object.keys(memoryCoverCache).length > 0;

REAL_WORLD_NPCS.forEach(npc => {
  const sigKey = foldAccents(npc.name);
  const primKey = foldAccents(npc.name.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim());
  const sigPayload = {
    tracks: (npc.songs || []).map(s => s.title).filter(Boolean),
    albums: (npc.albums || []).map(a => a.title).filter(Boolean)
  };
  ORIGINAL_NPC_SIGNATURE_HINTS.set(sigKey, sigPayload);
  ORIGINAL_NPC_SIGNATURE_HINTS.set(primKey, sigPayload);

  npc.avatar = hasCachedPortraits
    ? resolveRealWorldArtistPhoto(npc.name)
    : generateFallbackArtistAvatar(npc.name);
  npc.image = npc.avatar;
  if (hasCachedCovers) {
    npc.songs.forEach(song => {
      const cachedSongCover = lookupCachedCoverUrl(npc.name, song.title, false);
      if (cachedSongCover) song.cover = cachedSongCover;
    });
    npc.albums.forEach(album => {
      const cachedAlbumCover = lookupCachedCoverUrl(npc.name, album.title, true);
      if (cachedAlbumCover) album.cover = cachedAlbumCover;
    });
  }
});

/**
 * Pre-warms flagship NPC artist portraits and covers without flooding the network.
 */
let hasStartedPrewarm = false;
export function prewarmRealWorldArtworkCache() {
  if (hasStartedPrewarm || typeof window === 'undefined') return;
  hasStartedPrewarm = true;

  // Gently prewarm flagship top 24 NPCs; remaining NPCs resolve on-demand when rendered via OfficialArtworkImg
  REAL_WORLD_NPCS.slice(0, 24).forEach((npc, index) => {
    setTimeout(() => {
      fetchOfficialArtistPhoto(npc.name).catch(() => {});
    }, 150 + index * 180);
  });

  REAL_WORLD_NPCS.slice(0, 14).forEach((npc, index) => {
    setTimeout(() => {
      fetchArtistCatalogBatchFromITunes(npc.name).catch(() => {});
    }, 600 + index * 320);
  });
}

