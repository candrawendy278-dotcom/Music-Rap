// Spotify Track Metadata, Explicit ('E') Classifier, Music Video Badge & Bilateral Collab Engine
// Handles:
// 1. Accurate Explicit ('E') badge detection (fixes the bug where every song was labeled 'E').
// 2. Authentic Spotify "Music video" TV badge detection for Player & NPC tracks with MVs.
// 3. Collaboration / Featured Artist credits ("Player, Feat NPC" or "NPC 1, NPC 2"),
//    automatic replacement of any non-in-game featured artist (e.g., BTS if not in roster)
//    with a valid in-game NPC from REAL_WORLD_NPCS, and bilateral artist profile sync
//    so every collab song appears on BOTH the primary artist's and featured artist's profiles!

import { GameState, Song } from '../types';
import { NPCS } from '../constants';
import { REAL_WORLD_NPCS, normalizeRealArtistName, normalizeRealTitle } from './realWorldArtistCatalog';
import { isNpcMatchingPlayerName } from './npcPlayerDeduplicationEngine';

export interface ResolvedTrackMetadata {
  cleanTitle: string;
  primaryArtist: string;
  featuredArtists: string[];
  allArtists: string[];
  formattedArtistCredits: string; // e.g. "Taylor Swift, Sabrina Carpenter" or "Player, Sabrina Carpenter"
  isExplicit: boolean;
  hasMusicVideo: boolean;
  isCollab: boolean;
}

export interface BilateralCollabTrackEntry {
  id: string;
  title: string;
  primaryArtist: string;
  featuredArtists: string[];
  formattedArtistCredits: string;
  streams: number;
  dailyStreams: number;
  sales: number;
  cover?: string;
  year: number;
  releaseDate?: string;
  isPlayerPrimary: boolean;
  hasMusicVideo: boolean;
  isExplicit: boolean;
  trackType: 'single' | 'lead_single' | 'b_side';
  rawPlayerSong?: Song;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Checks if an artist name exists in the active in-game `REAL_WORLD_NPCS` catalog
 * (and is not deduplicated by the player's name).
 */
export function findInGameNpcByName(
  rawName: string,
  playerName?: string
): (typeof REAL_WORLD_NPCS)[number] | undefined {
  if (!rawName) return undefined;
  const normalized = normalizeRealArtistName(rawName).trim();
  const lower = normalized.toLowerCase();

  return REAL_WORLD_NPCS.find(npc => {
    if (playerName && isNpcMatchingPlayerName(npc.name, playerName)) return false;
    return npc.name.toLowerCase() === lower;
  });
}

/**
 * Guarantees that any featured/collab artist is a real, active in-game NPC in `REAL_WORLD_NPCS`.
 * If the target featured artist (e.g., "BTS" or an external artist) is NOT in `REAL_WORLD_NPCS`,
 * deterministically replaces them with a compatible in-game NPC artist from `REAL_WORLD_NPCS`.
 */
export function ensureInGameNpcCollaborator(
  candidateFeatArtist: string,
  primaryArtist: string,
  genreHint: string = 'Pop',
  playerName?: string
): string {
  const existing = findInGameNpcByName(candidateFeatArtist, playerName);
  if (existing && existing.name.toLowerCase() !== primaryArtist.toLowerCase()) {
    return existing.name;
  }

  // Candidate is not in the in-game NPC roster — pick a matching in-game NPC from REAL_WORLD_NPCS!
  const cleanPrimary = primaryArtist.toLowerCase().trim();
  const targetGenre = (genreHint || 'Pop').toLowerCase();

  const eligiblePool = REAL_WORLD_NPCS.filter(npc => {
    if (npc.name.toLowerCase() === cleanPrimary) return false;
    if (playerName && isNpcMatchingPlayerName(npc.name, playerName)) return false;
    return true;
  });

  if (eligiblePool.length === 0) return 'Sabrina Carpenter';

  // Prefer same genre family or high-tier pop/hip-hop crossover stars
  const genreMatches = eligiblePool.filter(npc => {
    const g = (npc.genre || '').toLowerCase();
    if (targetGenre.includes('hip') || targetGenre.includes('rap') || targetGenre.includes('trap')) {
      return g.includes('hip') || g.includes('rap') || g.includes('trap') || g.includes('r&b');
    }
    if (targetGenre.includes('k-pop') || candidateFeatArtist.toLowerCase() === 'bts') {
      return g.includes('k-pop') || g.includes('pop');
    }
    if (targetGenre.includes('latin') || targetGenre.includes('reggaeton')) {
      return g.includes('latin') || g.includes('reggaeton') || g.includes('urbano');
    }
    if (targetGenre.includes('r&b')) {
      return g.includes('r&b') || g.includes('pop') || g.includes('hip');
    }
    return g.includes('pop') || npc.pop >= 84;
  });

  const pool = genreMatches.length > 0 ? genreMatches : eligiblePool;
  const seed = hashSeed(`${primaryArtist}::${candidateFeatArtist}`);
  return pool[seed % pool.length].name;
}

/**
 * Resolves a player's `song.collabId` (which may be a legacy ID like 'npc_1', an NPC id, or an NPC name)
 * into a guaranteed in-game NPC artist name from `REAL_WORLD_NPCS`.
 */
export function resolvePlayerCollabNpcName(
  collabId: string | undefined,
  playerName: string = '',
  genreHint: string = 'Pop'
): string | null {
  if (!collabId || collabId === 'none' || collabId.trim() === '') return null;

  // 1. Check direct match in REAL_WORLD_NPCS by id or name
  const directRealNpc = REAL_WORLD_NPCS.find(
    n =>
      n.id.toLowerCase() === collabId.toLowerCase() ||
      n.name.toLowerCase() === collabId.toLowerCase()
  );
  if (directRealNpc && !isNpcMatchingPlayerName(directRealNpc.name, playerName)) {
    return directRealNpc.name;
  }

  // 2. Check legacy NPCS array from constants.ts and normalize parody name to real-world NPC
  const legacyNpc = NPCS.find(
    n => n.id === collabId || n.name.toLowerCase() === collabId.toLowerCase()
  );
  if (legacyNpc) {
    const normalized = normalizeRealArtistName(legacyNpc.name);
    return ensureInGameNpcCollaborator(normalized, playerName, genreHint, playerName);
  }

  // 3. Fallback through normalizeRealArtistName + ensureInGameNpcCollaborator
  const normalizedName = normalizeRealArtistName(collabId);
  return ensureInGameNpcCollaborator(normalizedName, playerName, genreHint, playerName);
}

// Curated registry of iconic real-world NPC collaborations (Primary Artist + Song Title -> Featured Artist)
const AUTHENTIC_NPC_COLLAB_REGISTRY: Record<string, string[]> = {
  'lady gaga::die with a smile': ['Bruno Mars'],
  'bruno mars::die with a smile': ['Lady Gaga'],
  'bruno mars::apt.': ['Jennie'],
  'taylor swift::fortnight': ['Post Malone'],
  'taylor swift::snow on the beach': ['Lana Del Rey'],
  'taylor swift::more lana': ['Lana Del Rey'],
  'taylor swift::exile': ['Bon Iver'],
  'taylor swift::bad blood': ['Kendrick Lamar'],
  'taylor swift::end game': ['Ed Sheeran', 'Future'],
  'taylor swift::karma': ['Ice Spice'],
  'taylor swift::nothing new': ['Phoebe Bridgers'],
  'taylor swift::florida!!!': ['Sabrina Carpenter'],
  'sabrina carpenter::taste': ['Taylor Swift'],
  'gracie abrams::us.': ['Taylor Swift'],
  'post malone::i had some help': ['Morgan Wallen'],
  'post malone::one right now': ['The Weeknd'],
  'post malone::sunflower': ['Travis Scott'],
  'post malone::rockstar': ['21 Savage'],
  'post malone::psycho': ['Ty Dolla $ign'],
  'post malone::goodbyes': ['Young Thug'],
  'post malone::die for me': ['Future', 'Halsey'],
  'post malone::pour me a drink': ['Luke Combs'],
  'post malone::guy for that': ['Luke Combs'],
  'kendrick lamar::luther': ['SZA'],
  'kendrick lamar::all the stars': ['SZA'],
  'kendrick lamar::gloria': ['SZA'],
  'kendrick lamar::like that': ['Future'],
  'kendrick lamar::family ties': ['Baby Keem'],
  'sza::kiss me more': ['Doja Cat'],
  'sza::ghost in the machine': ['Phoebe Bridgers'],
  'sza::open arms': ['Travis Scott'],
  'travis scott::fe!n': ['Playboi Carti'],
  'travis scott::meltdown': ['Drake'],
  'travis scott::telekinesis': ['SZA', 'Future'],
  'travis scott::sicko mode': ['Drake'],
  'travis scott::k-pop': ['Bad Bunny', 'The Weeknd'],
  'travis scott::topia twins': ['21 Savage'],
  'the weeknd::timeless': ['Playboi Carti'],
  'the weeknd::save your tears': ['Ariana Grande'],
  'the weeknd::die for you': ['Ariana Grande'],
  'the weeknd::starboy': ['Daft Punk'],
  'the weeknd::creepin\'': ['21 Savage', 'Metro Boomin'],
  'the weeknd::popular': ['Playboi Carti', 'Madonna'],
  'ariana grande::rain on me': ['Lady Gaga'],
  'ariana grande::the boy is mine': ['Brandy'],
  'ariana grande::love me harder': ['The Weeknd'],
  'ariana grande::stuck with u': ['Justin Bieber'],
  'billie eilish::guess': ['Charli XCX'],
  'billie eilish::lovely': ['Khalid'],
  'charli xcx::guess': ['Billie Eilish'],
  'charli xcx::girl, so confusing': ['Lorde'],
  'drake::rich flex': ['21 Savage'],
  'drake::first person shooter': ['J. Cole'],
  'drake::life is good': ['Future'],
  'drake::wait for u': ['Future'],
  'drake::idgaf': ['Yeat'],
  'future & metro boomin::like that': ['Kendrick Lamar'],
  'future & metro boomin::type shit': ['Travis Scott', 'Playboi Carti'],
  'future & metro boomin::cinderella': ['Travis Scott'],
  'bad bunny::un x100to': ['Peso Pluma'],
  'bad bunny::la canción': ['J Balvin'],
  'bad bunny::dakiti': ['Feid'],
  'bad bunny::ojitos lindos': ['ROSALÍA'],
  'rosalía::la noche de anoche': ['Bad Bunny'],
  'rosalía::beso': ['Rauw Alejandro'],
  'karol g::tqg': ['Shakira'],
  'peso pluma::qlona': ['Karol G'],
  'peso pluma::ella baila sola': ['Feid'],
  'dua lipa::cold heart': ['Elton John'],
  'dua lipa::one kiss': ['Calvin Harris'],
  'justin bieber::stay': ['The Kid LAROI'],
  'the kid laroi::stay': ['Justin Bieber'],
  'ed sheeran::i don\'t care': ['Justin Bieber'],
  'ed sheeran::river': ['Eminem'],
  'central cee::band4band': ['Lil Baby'],
  'central cee::sprinter': ['Dave'],
  'rema::calm down': ['Selena Gomez']
};

/**
 * Strips `(feat. ...)`, `(with ...)`, `(ft. ...)` from a song title and returns both
 * the clean song title and any extracted featured artist names.
 */
export function parseTitleFeaturedArtists(rawTitle: string): {
  cleanTitle: string;
  extractedFeat: string[];
} {
  if (!rawTitle) return { cleanTitle: '', extractedFeat: [] };

  const extracted: string[] = [];
  let working = rawTitle;

  const regex = /\s*[\(\[](?:feat\.?|ft\.?|with|featuring)\s+([^\)\]]+)[\)\]]/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawTitle)) !== null) {
    const inside = match[1];
    inside
      .split(/,|&|\band\b/i)
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(a => extracted.push(a));
  }

  working = working
    .replace(regex, '')
    .replace(/\s*\(official music video\)/gi, '')
    .replace(/\s*\(music video\)/gi, '')
    .trim();

  return {
    cleanTitle: working || rawTitle,
    extractedFeat: extracted
  };
}

/**
 * Determines whether a track is genuinely Explicit ('E') so that NOT every song shows 'E'.
 * - Clean Pop, Ballads, Acoustic, K-Pop, J-Pop, Indie, and non-explicit tracks return `false`.
 * - Hip-Hop/Rap/Trap/Drill and known explicit pop/R&B/rock tracks return `true`.
 */
export function isTrackExplicit(
  songOrItem: any,
  artistName: string = '',
  genreHint?: string
): boolean {
  if (!songOrItem) return false;

  // 1. If explicitly boolean on the object, respect it
  if (typeof songOrItem.isExplicit === 'boolean') {
    return songOrItem.isExplicit;
  }

  const rawTitle = String(songOrItem.title || '').trim();
  const { cleanTitle } = parseTitleFeaturedArtists(rawTitle);
  const lowerTitle = cleanTitle.toLowerCase();
  const cleanArtist = normalizeRealArtistName(artistName || songOrItem.artist || '').toLowerCase();
  const genre = String(songOrItem.genre || genreHint || '').toLowerCase();
  const subgenre = String(songOrItem.subgenre || '').toLowerCase();
  const theme = String(songOrItem.theme || '').toLowerCase();

  // 2. Known 100% CLEAN Real-World Hit Songs (never show 'E')
  const KNOWN_CLEAN_TITLES = new Set([
    'die with a smile',
    'birds of a feather',
    'what was i made for?',
    'ocean eyes',
    'everything i wanted',
    'cruel summer',
    'anti-hero',
    'lover',
    'cardigan',
    'willow',
    'blank space',
    'shake it off',
    'style',
    'you belong with me',
    'love story',
    'enchanted',
    'blinding lights',
    'save your tears',
    'die for you',
    'dancing in the flames',
    'as it was',
    'watermelon sugar',
    'adore you',
    'late night talking',
    'sign of the times',
    'good luck, babe!',
    'hot to go!',
    'pink pony club',
    'espresso',
    'levitating',
    'don\'t start now',
    'houdini',
    'training season',
    'illusion',
    'dance the night',
    'shape of you',
    'perfect',
    'bad habits',
    'shivers',
    'photograph',
    'thinking out loud',
    'flowers',
    'angels like you',
    'wrecking ball',
    'party in the u.s.a.',
    'easy on me',
    'rolling in the deep',
    'someone like you',
    'hello',
    'set fire to the rain',
    'skyfall',
    'viva la vida',
    'yellow',
    'fix you',
    'a sky full of stars',
    'sparks',
    'feelslikeimfallinginlove',
    'beautiful things',
    'lose control',
    'too sweet',
    'take me to church',
    'stick season',
    'sunflower',
    'circles',
    'chemical',
    'apt.',
    'seven',
    'standing next to you',
    'dynamite',
    'butter',
    'super shy',
    'ditto',
    'hype boy',
    'omg',
    'attention',
    'supernova',
    'whiplash',
    'drama',
    'spicy',
    'magnetic',
    'smart',
    'crazy',
    'antifragile',
    'perfect night',
    'idol',
    'yoru ni kakeru',
    'shinunoga e-wa',
    'michiteyuku',
    'きらり',
    'hati-hati di jalan',
    'monokrom',
    'interaksi',
    'untungnya, hidup harus tetap berjalan',
    'satu bulan',
    'kata mereka ini berlebihan',
    'apa mungkin',
    'sial',
    'melawan restu',
    'mati-matian',
    'evaluasi',
    'secukupnya',
    'cincin',
    'calm down',
    'water',
    'push 2 start',
    'peaches',
    'ghost',
    'stay',
    'love yourself',
    'sorry',
    'locked out of heaven',
    'that\'s what i like',
    '24k magic',
    'treasure',
    'just the way you are',
    'grenade',
    'uptown funk'
  ]);

  if (KNOWN_CLEAN_TITLES.has(lowerTitle)) {
    return false;
  }

  // 3. Known Clean Artists (unless title itself contains explicit words)
  const CLEAN_ARTISTS = new Set([
    'bruno mars',
    'ed sheeran',
    'adele',
    'coldplay',
    'newjeans',
    'yoasobi',
    'fujii kaze',
    'iu',
    'aespa',
    'le sserafim',
    'illit',
    'twice',
    'stray kids',
    'babymonster',
    'tulus',
    'bernadya',
    'mahalini',
    'hindia',
    'shawn mendes',
    'selena gomez',
    'katy perry',
    'benson boone',
    'teddy swims',
    'hozier',
    'elton john',
    'celine dion',
    'michael jackson',
    'queen',
    'imagine dragons',
    'one direction',
    'harry styles'
  ]);

  const hasExplicitWordInTitle =
    /\b(f\*ck|fuck|sh\*t|shit|b\*tch|bitch|ass|damn|hell|sex|drugs|kill|die|blood|toxic|savage|demon|devil|freak|slut|whore|pussy|dick|nigga|hoe)\b/i.test(
      lowerTitle
    );

  if (hasExplicitWordInTitle) {
    return true;
  }

  if (CLEAN_ARTISTS.has(cleanArtist)) {
    return false;
  }

  // 4. Known Explicit Real-World Tracks
  const KNOWN_EXPLICIT_TITLES = new Set([
    'not like us',
    'squabble up',
    'tv off',
    'luther',
    'like that',
    'humble.',
    'dna.',
    'money trees',
    'all the stars',
    'euphoria',
    'please please please',
    'taste',
    'bed chem',
    'nonsense',
    'feather',
    'lunch',
    'bad guy',
    'happier than ever',
    'therefore i am',
    'guess',
    '360',
    'von dutch',
    'vampire',
    'drivers license',
    'good 4 u',
    'bad idea right?',
    'get him back!',
    'deja vu',
    'kill bill',
    'snooze',
    'saturn',
    'good days',
    'kiss me more',
    'paint the town red',
    'agora hills',
    'woman',
    'need to know',
    'say so',
    'starboy',
    'the hills',
    'timeless',
    'creepin\'',
    'popular',
    'heartless',
    'fe!n',
    'meltdown',
    'sicko mode',
    'goosebumps',
    'telekinesis',
    'my eyes',
    'hyaena',
    'rockstar',
    'psycho',
    'i had some help',
    'goodbyes',
    'rich flex',
    'first person shooter',
    'god\'s plan',
    'one dance',
    'jimmy cooks',
    'knife talk',
    'wait for u',
    'life is good',
    'type shit',
    'cinderella',
    'band4band',
    'sprinter',
    'doja',
    'monaco',
    'tití me preguntó',
    'me porto bonito',
    'dtmf',
    'perro negro',
    'qlona',
    'ella baila sola',
    'tqg',
    'fortnight',
    'down bad',
    'icdiwabh',
    'vigilante shit',
    'karma',
    'champagne problems',
    'all too well (10 minute version)'
  ]);

  if (KNOWN_EXPLICIT_TITLES.has(lowerTitle)) {
    return true;
  }

  // 5. Genre-based & deterministic classification for Player songs and other NPC tracks
  if (
    genre.includes('hip-hop') ||
    genre.includes('rap') ||
    genre.includes('trap') ||
    genre.includes('drill') ||
    subgenre.includes('trap') ||
    subgenre.includes('drill') ||
    subgenre.includes('boom bap')
  ) {
    // ~80% of Hip-Hop/Trap/Drill tracks are Explicit
    const h = hashSeed(`${cleanArtist}::${lowerTitle}`);
    return h % 10 < 8;
  }

  // Check if artist is a known Hip-Hop / Rap / Trap artist
  const npcMatch = REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === cleanArtist);
  const npcGenre = (npcMatch?.genre || '').toLowerCase();
  if (
    npcGenre.includes('hip-hop') ||
    npcGenre.includes('rap') ||
    npcGenre.includes('trap') ||
    npcGenre.includes('drill')
  ) {
    const h = hashSeed(`${cleanArtist}::${lowerTitle}`);
    return h % 10 < 8;
  }

  if (
    theme.includes('rebellion') ||
    theme.includes('fame') ||
    theme.includes('heartbreak') && subgenre.includes('alt')
  ) {
    const h = hashSeed(`${cleanArtist}::${lowerTitle}`);
    return h % 10 < 4;
  }

  if (genre.includes('r&b') || npcGenre.includes('r&b') || genre.includes('latin') || npcGenre.includes('latin')) {
    const h = hashSeed(`${cleanArtist}::${lowerTitle}`);
    return h % 10 < 3; // 30% explicit
  }

  // For Pop, Rock, Electronic, Indie, Country, etc.: only ~15% are Explicit
  const h = hashSeed(`${cleanArtist}::${lowerTitle}`);
  return h % 100 < 15;
}

/**
 * Determines whether a track has an official Music Video on Spotify (shows the `[📺 Music video]` badge).
 * - For Player songs: true ONLY when the player has produced an MV (`song.hasMV === true`).
 * - For NPC songs: true when `song.hasMV === true` or the track is a released Single / Lead Single.
 */
export function hasTrackMusicVideo(
  songOrItem: any,
  artistName: string = '',
  state?: GameState
): boolean {
  if (!songOrItem) return false;

  const { cleanTitle } = parseTitleFeaturedArtists(String(songOrItem.title || ''));
  const lowerTitle = cleanTitle.toLowerCase();

  // 1. Check if this is a Player track
  const isPlayerTrack =
    Boolean(songOrItem.isPlayer) ||
    (state?.artist?.name &&
      artistName &&
      artistName.toLowerCase() === state.artist.name.toLowerCase());

  if (isPlayerTrack) {
    if (typeof songOrItem.hasMV === 'boolean') {
      return songOrItem.hasMV;
    }
    if (state?.songs) {
      const match = state.songs.find(
        s => s.title.toLowerCase().trim() === lowerTitle
      );
      if (match) return Boolean(match.hasMV);
    }
    return false;
  }

  // 2. For NPC tracks:
  if (typeof songOrItem.hasMV === 'boolean') {
    return songOrItem.hasMV;
  }
  if (songOrItem.trackType === 'b_side') {
    return false; // B-sides don't have official MVs
  }
  if (songOrItem.trackType === 'single' || songOrItem.trackType === 'lead_single') {
    return true;
  }

  // Check if the track is in the NPC's active singles list (`npc.songs`)
  const cleanArtist = normalizeRealArtistName(artistName || songOrItem.artist || '').toLowerCase();
  const npc = REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === cleanArtist);
  if (npc && npc.songs) {
    const inSingles = npc.songs.some(s => {
      const parsed = parseTitleFeaturedArtists(s.title).cleanTitle.toLowerCase();
      return parsed === lowerTitle && (s as any).trackType !== 'b_side';
    });
    if (inSingles) return true;
  }

  // Fallback for chart items: top charting singles have official MVs (~75%)
  const seed = hashSeed(`${cleanArtist}::${lowerTitle}`);
  return seed % 100 < 72;
}

/**
 * Resolves full artist credits (`Primary Artist, Featured Artist`), Explicit status, and Music Video status
 * for ANY Player or NPC song/chart item.
 * Guarantees that any featured artist is an active in-game NPC from `REAL_WORLD_NPCS`.
 */
export function resolveSongMetadataAndCollabCredits(
  songOrItem: any,
  fallbackArtistName: string = '',
  state?: GameState
): ResolvedTrackMetadata {
  const playerName = state?.artist?.name || '';
  const rawTitle = String(songOrItem?.title || '');
  const { cleanTitle, extractedFeat } = parseTitleFeaturedArtists(rawTitle);

  const explicitItemArtist = String(songOrItem?.artist || '').trim();
  const effectiveArtistHint = explicitItemArtist || String(fallbackArtistName || '').trim();

  const isRosterTrack =
    Boolean(songOrItem?.isRosterArtist) ||
    (Boolean(songOrItem?.collabId !== undefined) &&
      songOrItem?.isPlayer !== true &&
      Boolean(effectiveArtistHint) &&
      (!playerName || effectiveArtistHint.toLowerCase() !== playerName.toLowerCase()));

  const isPlayerTrack =
    !isRosterTrack &&
    (Boolean(songOrItem?.isPlayer) ||
      (playerName &&
        effectiveArtistHint &&
        effectiveArtistHint.toLowerCase() === playerName.toLowerCase()) ||
      Boolean(
        songOrItem?.collabId !== undefined &&
          !explicitItemArtist &&
          (!fallbackArtistName ||
            (playerName && fallbackArtistName.toLowerCase() === playerName.toLowerCase()))
      ));

  if (isPlayerTrack || isRosterTrack) {
    const primaryArtist = isRosterTrack
      ? effectiveArtistHint || fallbackArtistName || 'Artist'
      : playerName || fallbackArtistName || 'Player';
    let livePlayerSong: Song | undefined =
      songOrItem?.collabId !== undefined ? songOrItem : undefined;
    if (!isRosterTrack && !livePlayerSong && state?.songs) {
      livePlayerSong = state.songs.find(
        s => s.title.toLowerCase().trim() === cleanTitle.toLowerCase()
      );
    }

    const featuredArtists: string[] = [];
    const collabNpc = resolvePlayerCollabNpcName(
      livePlayerSong?.collabId || songOrItem?.collabId,
      primaryArtist,
      livePlayerSong?.genre || songOrItem?.genre || 'Pop'
    );
    if (collabNpc && collabNpc.toLowerCase() !== primaryArtist.toLowerCase()) {
      featuredArtists.push(collabNpc);
    }

    // Also check if "(feat. X)" was written in the title
    extractedFeat.forEach(rawFeat => {
      const validNpc = ensureInGameNpcCollaborator(
        rawFeat,
        primaryArtist,
        livePlayerSong?.genre || songOrItem?.genre || 'Pop',
        primaryArtist
      );
      if (
        validNpc &&
        validNpc.toLowerCase() !== primaryArtist.toLowerCase() &&
        !featuredArtists.some(f => f.toLowerCase() === validNpc.toLowerCase())
      ) {
        featuredArtists.push(validNpc);
      }
    });

    const allArtists = [primaryArtist, ...featuredArtists];
    const formattedArtistCredits = allArtists.join(', ');

    return {
      cleanTitle,
      primaryArtist,
      featuredArtists,
      allArtists,
      formattedArtistCredits,
      isExplicit: isTrackExplicit(livePlayerSong || songOrItem, primaryArtist),
      hasMusicVideo: isRosterTrack
        ? Boolean((livePlayerSong || songOrItem)?.hasMV) ||
          hasTrackMusicVideo(livePlayerSong || songOrItem, primaryArtist, state)
        : hasTrackMusicVideo(livePlayerSong || songOrItem, primaryArtist, state),
      isCollab: featuredArtists.length > 0
    };
  }

  // NPC Track resolution
  const rawArtistField = String(songOrItem?.artist || fallbackArtistName || 'Artist');
  // If rawArtistField already contains comma-separated artists, split primary vs featured
  const splitExistingArtists = rawArtistField
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const primaryArtist = normalizeRealArtistName(splitExistingArtists[0] || fallbackArtistName);
  const npcObj = REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === primaryArtist.toLowerCase());
  const npcGenre = npcObj?.genre || songOrItem?.genre || 'Pop';

  const rawFeatCandidates: string[] = [];

  // 1. Existing comma-separated secondary artists
  if (splitExistingArtists.length > 1) {
    splitExistingArtists.slice(1).forEach(a => rawFeatCandidates.push(a));
  }

  // 2. Explicit `featArtist` / `collabArtist` property on NPC song object
  if (songOrItem?.featArtist) {
    rawFeatCandidates.push(String(songOrItem.featArtist));
  }
  if (Array.isArray(songOrItem?.featuredArtists)) {
    songOrItem.featuredArtists.forEach((a: string) => rawFeatCandidates.push(a));
  }

  // 3. Extracted `(feat. X)` from song title
  extractedFeat.forEach(a => rawFeatCandidates.push(a));

  // 4. Lookup in AUTHENTIC_NPC_COLLAB_REGISTRY
  const registryKey = `${primaryArtist.toLowerCase()}::${cleanTitle.toLowerCase()}`;
  const registryFeats = AUTHENTIC_NPC_COLLAB_REGISTRY[registryKey];
  if (registryFeats && registryFeats.length > 0) {
    registryFeats.forEach(a => rawFeatCandidates.push(a));
  }

  // 5. If still empty, check if this NPC song in `REAL_WORLD_NPCS` has a deterministic in-game NPC collab (~18% of singles)
  if (rawFeatCandidates.length === 0 && songOrItem?.trackType !== 'b_side') {
    const seed = hashSeed(`${primaryArtist}::${cleanTitle}`);
    if (seed % 100 < 18) {
      const autoCollab = ensureInGameNpcCollaborator(
        `auto_collab_${seed}`,
        primaryArtist,
        npcGenre,
        playerName
      );
      if (autoCollab) {
        rawFeatCandidates.push(autoCollab);
      }
    }
  }

  // Validate and remap every featured artist so 100% of them exist in REAL_WORLD_NPCS!
  const featuredArtists: string[] = [];
  rawFeatCandidates.forEach(cand => {
    const validInGameNpc = ensureInGameNpcCollaborator(
      cand,
      primaryArtist,
      npcGenre,
      playerName
    );
    if (
      validInGameNpc &&
      validInGameNpc.toLowerCase() !== primaryArtist.toLowerCase() &&
      !featuredArtists.some(f => f.toLowerCase() === validInGameNpc.toLowerCase())
    ) {
      featuredArtists.push(validInGameNpc);
    }
  });

  const allArtists = [primaryArtist, ...featuredArtists];
  const formattedArtistCredits = allArtists.join(', ');

  return {
    cleanTitle: normalizeRealTitle(cleanTitle, primaryArtist, false),
    primaryArtist,
    featuredArtists,
    allArtists,
    formattedArtistCredits,
    isExplicit: isTrackExplicit(songOrItem, primaryArtist, npcGenre),
    hasMusicVideo: hasTrackMusicVideo(songOrItem, primaryArtist, state),
    isCollab: featuredArtists.length > 0
  };
}

/**
 * Finds ALL released songs across the entire game (both Player songs and other NPCs' songs/album tracks)
 * where `targetNpcName` is a Featured / Collaborating Artist!
 * Ensures that if Taylor Swift collaborates with Sabrina Carpenter (or Player collaborates with Sabrina Carpenter),
 * that song automatically appears on Sabrina Carpenter's Spotify and iTunes profile!
 */
export function getCollaborationsForNpcArtist(
  targetNpcName: string,
  state?: GameState
): BilateralCollabTrackEntry[] {
  if (!targetNpcName) return [];
  const cleanTarget = normalizeRealArtistName(targetNpcName).trim().toLowerCase();
  const playerName = state?.artist?.name || 'Player';
  const currentYear = state?.date ? new Date(state.date).getFullYear() : 2026;

  const results: BilateralCollabTrackEntry[] = [];
  const seenKeys = new Set<string>();

  // 1. Check all Player's released songs where `targetNpcName` is the collaborator
  (state?.songs || [])
    .filter(s => s.status === 'released')
    .forEach(s => {
      const meta = resolveSongMetadataAndCollabCredits(s, playerName, state);
      const isFeaturedHere = meta.featuredArtists.some(
        f => f.toLowerCase() === cleanTarget
      );
      if (isFeaturedHere) {
        const dedupeKey = `${meta.primaryArtist.toLowerCase()}::${meta.cleanTitle.toLowerCase()}`;
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          results.push({
            id: `player_collab_${s.id}`,
            title: meta.cleanTitle,
            primaryArtist: meta.primaryArtist,
            featuredArtists: meta.featuredArtists,
            formattedArtistCredits: meta.formattedArtistCredits,
            streams: s.streams || 0,
            dailyStreams: s.dailyStreams || 0,
            sales: s.pureSales || 0,
            cover: s.cover,
            year: s.releaseDate ? new Date(s.releaseDate).getFullYear() : currentYear,
            releaseDate: s.releaseDate || state?.date?.split('T')[0],
            isPlayerPrimary: true,
            hasMusicVideo: meta.hasMusicVideo,
            isExplicit: meta.isExplicit,
            trackType: (s.trackType === 'b_side' ? 'b_side' : s.trackType === 'lead_single' ? 'lead_single' : 'single'),
            rawPlayerSong: s
          });
        }
      }
    });

  // 2. Check all other NPCs' active songs and album tracks where `targetNpcName` is a featured artist
  REAL_WORLD_NPCS.forEach(otherNpc => {
    if (otherNpc.name.toLowerCase() === cleanTarget) return;
    if (playerName && isNpcMatchingPlayerName(otherNpc.name, playerName)) return;

    (otherNpc.songs || []).forEach((s, idx) => {
      const meta = resolveSongMetadataAndCollabCredits(s, otherNpc.name, state);
      const isFeaturedHere = meta.featuredArtists.some(
        f => f.toLowerCase() === cleanTarget
      );
      if (isFeaturedHere) {
        const dedupeKey = `${meta.primaryArtist.toLowerCase()}::${meta.cleanTitle.toLowerCase()}`;
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          const streams = Math.floor(s.streams || 0);
          const dailyStreams = Math.floor((s as any).dailyStreams || Math.max(5000, streams / 25));
          const sales = Math.floor((s as any).sales || Math.max(500, streams * 0.0018));
          results.push({
            id: `npc_collab_${otherNpc.id}_${idx}`,
            title: meta.cleanTitle,
            primaryArtist: meta.primaryArtist,
            featuredArtists: meta.featuredArtists,
            formattedArtistCredits: meta.formattedArtistCredits,
            streams,
            dailyStreams,
            sales,
            cover: s.cover,
            year: currentYear,
            releaseDate: (s as any).releaseDate || `${currentYear}-01-15`,
            isPlayerPrimary: false,
            hasMusicVideo: meta.hasMusicVideo,
            isExplicit: meta.isExplicit,
            trackType: (s as any).trackType === 'b_side' ? 'b_side' : 'single'
          });
        }
      }
    });
  });

  return results.sort((a, b) => b.streams - a.streams);
}
