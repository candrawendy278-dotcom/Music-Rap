import React, { useEffect, useState } from 'react';
import {
  normalizeRealArtistName,
  normalizeRealTitle,
  fetchOfficialCoverFromITunes,
  resolveRealWorldCoverArt
} from '../../data/realWorldArtistCatalog';
import { generateYoutubeVideoThumbnail } from '../../data/npcYoutubeThumbnails';

const MV_CACHE_STORAGE_KEY = 'mr_official_mv_thumbs_v2';
const memoryMvCache: Record<string, string> = {};
const inflightMvPromises: Map<string, Promise<string | null>> = new Map();

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(MV_CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.startsWith('http')) {
          memoryMvCache[k] = v;
        }
      }
    }
  }
} catch {
  // Ignore storage errors
}

function persistMvCache() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MV_CACHE_STORAGE_KEY, JSON.stringify(memoryMvCache));
    }
  } catch {
    // Ignore storage quota errors
  }
}

// Curated official YouTube video IDs for instant 0ms widescreen 16:9 MV thumbnail resolution
const CURATED_YOUTUBE_VIDEO_IDS: Record<string, string> = {
  'taylor swift::fortnight': 'q3zqJs7JUCQ',
  'taylor swift::cruel summer': 'ic8j13piAhQ',
  'taylor swift::anti-hero': 'b1kbLwvqugk',
  'taylor swift::blank space': 'e-ORhEE9VVg',
  'taylor swift::shake it off': 'nfWlot6h_JM',
  'taylor swift::lover': '-BjZmE2gtdo',
  'taylor swift::cardigan': 'K-a8s8OLBSE',
  'taylor swift::i can do it with a broken heart': 'Sl6en1NPTYM',
  'kendrick lamar::not like us': 'H58vbez_m4E',
  'kendrick lamar::humble.': 'tvTRZJ-4EyI',
  'kendrick lamar::squabble up': 'fuV4yQWdn_4',
  'kendrick lamar::all the stars': 'JQbjS0_ZfJ0',
  'sabrina carpenter::espresso': 'eVli-tstM5E',
  'sabrina carpenter::please please please': 'cF1Na4AIecM',
  'sabrina carpenter::taste': 'KEG7b851Ric',
  'sabrina carpenter::feather': 'kLbn61Z4LDI',
  'billie eilish::birds of a feather': 'V9PVRfjEBTI',
  'billie eilish::lunch': 'MB3VkzPdgLA',
  'billie eilish::chihiro': 'BY_XwvKogC8',
  'billie eilish::bad guy': 'DyDfgMOUjCI',
  'billie eilish::happier than ever': '5GJWxDKyk3A',
  'billie eilish::what was i made for?': 'cW8VLC9nnTo',
  'bad bunny::titi me pregunto': 'Cr8K88UcO0s',
  'bad bunny::tití me preguntó': 'Cr8K88UcO0s',
  'bad bunny::monaco': '_PJvpq8uOZM',
  'bad bunny::moscow mule': 'p38WgakuYDo',
  'bad bunny::dtmf': 'v9T_MGfzq7I',
  'bad bunny::baile inolvidable': 'a1femq4NPxs',
  'the weeknd::blinding lights': '4NRXx6U8ABQ',
  'the weeknd::starboy': '34Na4j8AVgA',
  'the weeknd::save your tears': 'XXYlFuWEuKI',
  'the weeknd::timeless': '5EpyN_6dqyk',
  'the weeknd::dancing in the flames': 'MLlSSJ0z7xM',
  'drake::gods plan': 'xpVfcZ0ZcFM',
  "drake::god's plan": 'xpVfcZ0ZcFM',
  'drake::hotline bling': 'uxpDa-c-4Mc',
  'drake::rich flex': 'I4DjHHVHWAE',
  'drake::first person shooter': 'Xty2gi5cMa8',
  'chappell roan::good luck, babe!': '1RKqOmSkGgM',
  'chappell roan::hot to go!': 'xaPNR-_Cfn0',
  'chappell roan::pink pony club': 'GR3Liudev18',
  'bruno mars::die with a smile': 'kPa7bsKwL-c',
  'lady gaga::die with a smile': 'kPa7bsKwL-c',
  'bruno mars::apt.': 'ekr2nIex040',
  'bruno mars::uptown funk': 'OPf0YbXqDm0',
  'bruno mars::24k magic': 'UqyT8IEBkvY',
  'ariana grande::we cant be friends (wait for your love)': 'KNtJGQkC-WI',
  "ariana grande::we can't be friends (wait for your love)": 'KNtJGQkC-WI',
  'ariana grande::yes, and?': 'eB6txyhHFG4',
  'ariana grande::7 rings': 'QYh6mYIJG2Y',
  'ariana grande::thank u, next': 'gl1aHhXnN1k',
  'sza::kill bill': 'MSRcC626prw',
  'sza::snooze': 'LDZX4ooRsWs',
  'sza::good days': '0BdlKkvjEgA',
  'olivia rodrigo::vampire': 'RlPNh_PBZb4',
  'olivia rodrigo::drivers license': 'ZmDBbnmKpqQ',
  'olivia rodrigo::good 4 u': 'gNi_6U5Pm_o',
  'olivia rodrigo::bad idea right?': 'Dj9qJsJTsjQ',
  'post malone::i had some help': '4QIZE708gJ4',
  'post malone::sunflower': 'ApXoWvfEYVU',
  'post malone::circles': 'wXhTHyIgQ_U',
  'post malone::chemical': 'IzPQ_jA00bk',
  'travis scott::fe!n': 'B9synWjqBn8',
  'travis scott::sicko mode': '6ONRf7h3Mdk',
  'travis scott::goosebumps': 'Dst9gZkq1a8',
  'dua lipa::houdini': 'suAR1PYFNYA',
  'dua lipa::levitating': 'TUVcZfQe-Kw',
  'dua lipa::dont start now': 'oygrmJFKYZY',
  "dua lipa::don't start now": 'oygrmJFKYZY',
  'charli xcx::360': 'O_HoOpJ60C0',
  'charli xcx::von dutch': 'cwZ1L_0326A',
  'charli xcx::guess': 'huGd4efgdPA',
  'harry styles::as it was': 'H5v3kku4y6Q',
  'harry styles::watermelon sugar': 'E07s5ZYygMg',
  'ed sheeran::shape of you': 'JGwWNGJdvx8',
  'ed sheeran::bad habits': 'orJSJGHjBLI',
  'ed sheeran::perfect': '2Vv-BfVoq4g',
  'justin bieber::peaches': 'tQ0yjYUFKAE',
  'justin bieber::stay': 'kTJczUoc26U',
  'the kid laroi::stay': 'kTJczUoc26U',
  'the kid laroi::nights like this': 'M2cckDmNLMI',
  'doja cat::paint the town red': 'm4_9TFeMfJE',
  'doja cat::agora hills': '0c66ksfigtU',
  'doja cat::woman': 'yxW5yuzVi8w',
  'rosalía::despechá': '5g2hT4GmAGU',
  'rosalia::despecha': '5g2hT4GmAGU',
  'rosalía::saoko': '6o7bCAZSxsg',
  'karol g::si antes te hubiera conocido': 'MgsdDfdGdHc',
  'karol g::tqg': 'jZGpkLElSu8',
  'peso pluma::ella baila sola': 'lZiaYpD9ZrI',
  'jung kook::seven (feat. latto)': 'QU9c0053UAU',
  'jung kook::standing next to you': 'UNo0TG9LwwI',
  'blackpink::pink venom': 'gQlMMD8auMs',
  'blackpink::shut down': 'POe9SOEKotk',
  'newjeans::super shy': 'ArmDp-zijuc',
  'newjeans::omg': '_ZAgIHmHLdc',
  'stray kids::chk chk boom': '0P0aQreFs8w',
  'tyla::water': 'XoiOOiuH8iI',
  'burna boy::last last': '421w1j87fEM',
  'central cee::sprinter': 'pDddlvCfTiw',
  'central cee::band4band': 'pDddlvCfTiw',
  'benson boone::beautiful things': 'Oa_RSwwpPaA',
  'hozier::too sweet': 'NTpbbQUBbuo',
  'teddy swims::lose control': 'GZ3zL7kT6_c',
  'tate mcrae::greedy': 'To4SWGZkEPk',
  'gracie abrams::thats so true': 'W_YOJWZIjxo',
  "gracie abrams::that's so true": 'W_YOJWZIjxo'
};

function cleanVideoTitle(rawTitle: string, artist: string): string {
  const normalized = normalizeRealTitle(rawTitle || '', artist, false);
  return normalized
    .replace(/\s*\((Official Music Video|Official Video|Music Video|Video Oficial|Vídeo Oficial|Lyric Video|Visualizer|Live Performance|Live|Performance Video)\)/gi, '')
    .trim();
}

function getMvCacheKey(artist: string, title: string): string {
  const a = normalizeRealArtistName(artist || '')
    .split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0]
    .trim()
    .toLowerCase();
  const t = cleanVideoTitle(title, artist).toLowerCase();
  return `${a}::${t}`;
}

export function resolveSyncMvThumbnail(artist: string, title: string): string | null {
  const key = getMvCacheKey(artist, title);
  if (memoryMvCache[key]) return memoryMvCache[key];

  const ytId = CURATED_YOUTUBE_VIDEO_IDS[key];
  if (ytId) {
    const url = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    memoryMvCache[key] = url;
    return url;
  }

  return null;
}

export async function fetchOfficialMvThumbnail(artist: string, title: string): Promise<string | null> {
  const syncUrl = resolveSyncMvThumbnail(artist, title);
  if (syncUrl) return syncUrl;

  const key = getMvCacheKey(artist, title);
  const existing = inflightMvPromises.get(key);
  if (existing) return existing;

  const realArtist = normalizeRealArtistName(artist || '').trim();
  const primaryArtist = realArtist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  const strippedTitle = cleanVideoTitle(title, realArtist);

  const promise = (async (): Promise<string | null> => {
    try {
      // 1. Server-side YouTube & Apple Music Video 16:9 Thumbnail Resolver
      try {
        const res = await fetch(
          `/api/mv-thumbnail?artist=${encodeURIComponent(primaryArtist)}&title=${encodeURIComponent(strippedTitle)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.url && typeof data.url === 'string' && data.url.startsWith('http')) {
            memoryMvCache[key] = data.url;
            persistMvCache();
            return data.url;
          }
        }
      } catch {
        // Fallback to client iTunes Music Video API
      }

      // 2. Client-side iTunes Music Video API fallback
      try {
        const itunesRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(`${primaryArtist} ${strippedTitle}`)}&media=musicVideo&entity=musicVideo&limit=5`
        );
        if (itunesRes.ok) {
          const mvData = await itunesRes.json();
          if (mvData && Array.isArray(mvData.results) && mvData.results.length > 0) {
            const match = mvData.results[0];
            if (match?.artworkUrl100) {
              const mvThumb = String(match.artworkUrl100).replace(/100x100[a-z]*/, '640x360mv');
              memoryMvCache[key] = mvThumb;
              persistMvCache();
              return mvThumb;
            }
          }
        }
      } catch {
        // Fallback to official song cover
      }

      // 3. Fallback to official song cover art
      const coverUrl = await fetchOfficialCoverFromITunes(primaryArtist, strippedTitle, false);
      if (coverUrl && coverUrl.startsWith('http')) {
        memoryMvCache[key] = coverUrl;
        persistMvCache();
        return coverUrl;
      }
    } catch {
      // Ignore network errors
    } finally {
      inflightMvPromises.delete(key);
    }
    return null;
  })();

  inflightMvPromises.set(key, promise);
  return promise;
}

interface OfficialMvThumbnailImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  artist: string;
  title: string;
  isPlayer?: boolean;
  explicitSrc?: string | null;
}

export const OfficialMvThumbnailImg: React.FC<OfficialMvThumbnailImgProps> = ({
  artist,
  title,
  isPlayer = false,
  explicitSrc,
  className = '',
  alt,
  ...rest
}) => {
  const cleanArtist = isPlayer ? (artist || 'Artist') : normalizeRealArtistName(artist || 'Artist');
  const cleanTitle = isPlayer ? (title || 'Music Video') : normalizeRealTitle(title || 'Music Video', cleanArtist, false);

  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (isPlayer && explicitSrc && typeof explicitSrc === 'string' && explicitSrc.trim() !== '') {
      return explicitSrc;
    }
    const syncMv = resolveSyncMvThumbnail(cleanArtist, cleanTitle);
    if (syncMv) return syncMv;
    if (explicitSrc && typeof explicitSrc === 'string' && explicitSrc.startsWith('http')) {
      return explicitSrc;
    }
    return resolveRealWorldCoverArt(cleanArtist, cleanTitle, false);
  });

  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTriedFallback(false);

    if (isPlayer) {
      if (explicitSrc && typeof explicitSrc === 'string' && explicitSrc.trim() !== '') {
        setImgSrc(explicitSrc);
      } else {
        setImgSrc(generateYoutubeVideoThumbnail(cleanTitle, cleanArtist));
      }
      return;
    }

    const syncMv = resolveSyncMvThumbnail(cleanArtist, cleanTitle);
    if (syncMv) {
      setImgSrc(syncMv);
      return;
    }

    fetchOfficialMvThumbnail(cleanArtist, cleanTitle).then(resolved => {
      if (!cancelled && resolved) {
        setImgSrc(resolved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cleanArtist, cleanTitle, isPlayer, explicitSrc]);

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      fetchOfficialCoverFromITunes(cleanArtist, cleanTitle, false).then(coverUrl => {
        if (coverUrl && coverUrl !== imgSrc) {
          setImgSrc(coverUrl);
        } else {
          setImgSrc(generateYoutubeVideoThumbnail(cleanTitle, cleanArtist));
        }
      });
    } else {
      setImgSrc(generateYoutubeVideoThumbnail(cleanTitle, cleanArtist));
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || `${cleanTitle} - ${cleanArtist}`}
      className={className}
      onError={handleError}
      loading="lazy"
      {...rest}
    />
  );
};
