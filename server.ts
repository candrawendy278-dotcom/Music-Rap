import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, saveGameState, getGameState } from './src/db/users.ts';
import { authService } from './server/authService.ts';
import { serverStorage } from './server/storage.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Import pre-verified Spotify profile photos and official album/single covers
  const {
    VERIFIED_SPOTIFY_ARTIST_IDS,
    VERIFIED_SPOTIFY_NPC_PORTRAITS,
    VERIFIED_OFFICIAL_ALBUM_COVERS,
    VERIFIED_OFFICIAL_SONG_COVERS
  } = await import("./src/data/spotifyOfficialNpcPortraitsAndCovers.ts");

  // In-memory cache for official cover art & artist portraits
  const serverArtworkCache = new Map<string, string>();
  const serverArtistBatchCache = new Map<string, any>();

  let activeExternalFetches = 0;
  const externalFetchQueue: Array<() => void> = [];
  const MAX_CONCURRENT_EXTERNAL = 6;

  async function throttledTextFetch(url: string, options?: RequestInit, retries = 2): Promise<string | null> {
    if (activeExternalFetches >= MAX_CONCURRENT_EXTERNAL) {
      await new Promise<void>(resolve => externalFetchQueue.push(resolve));
    }
    activeExternalFetches++;
    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, {
            ...options,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
              "Accept-Language": "en-US,en;q=0.9",
              ...(options?.headers || {})
            }
          });
          if (res.status === 429 || res.status === 503) {
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
              continue;
            }
            return null;
          }
          if (!res.ok) return null;
          return await res.text();
        } catch {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
            continue;
          }
          return null;
        }
      }
      return null;
    } finally {
      activeExternalFetches--;
      const next = externalFetchQueue.shift();
      if (next) next();
    }
  }

  async function throttledJsonFetch(url: string, options?: RequestInit, retries = 2): Promise<any> {
    const txt = await throttledTextFetch(url, options, retries);
    if (!txt) return null;
    try {
      const data = JSON.parse(txt);
      if (data?.error) return null;
      return data;
    } catch {
      return null;
    }
  }

  function normStr(s: string): string {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normAlnum(s: string): string {
    return normStr(s)
      .replace(/\$/g, "s")
      .replace(/[^a-z0-9]/g, "");
  }

  function isFakeOrKaraoke(text: string): boolean {
    const t = normStr(text);
    return (
      t.includes("karaoke") ||
      t.includes("tribute") ||
      t.includes("made famous") ||
      t.includes("in the style of") ||
      t.includes("8-bit") ||
      t.includes("lullaby") ||
      t.includes("ringtone") ||
      t.includes("cover band") ||
      t.includes("instrumental version") ||
      t.includes("piano version")
    );
  }

  function isValidPortraitUrl(url: unknown): url is string {
    if (typeof url !== "string" || !url.startsWith("http")) return false;
    const lower = url.toLowerCase();
    if (lower.includes("/images/artist//") || lower.includes("0000000000000000")) return false;
    if (lower.includes("default_artist") || lower.includes("default_")) return false;
    if (lower.includes("dzcdn.net/images/artist") && !/\/images\/artist\/[a-f0-9]{24,40}\//i.test(url)) {
      return false;
    }
    if (lower.endsWith(".svg") || lower.includes(".svg.png") || lower.includes("wordmark") || lower.includes("_logo")) {
      return false;
    }
    return true;
  }

  function isValidCoverUrl(url: unknown): url is string {
    if (typeof url !== "string" || !url.startsWith("http")) return false;
    const lower = url.toLowerCase();
    if (lower.includes("/images/cover//") || lower.includes("/images/artist//")) return false;
    if (lower.includes("0000000000000000") || lower.includes("default_")) return false;
    if (lower.includes("dzcdn.net/images/cover") && !/\/images\/cover\/[a-f0-9]{24,40}\//i.test(url)) {
      return false;
    }
    return true;
  }

  function isArtistMatch(candidateArtist: string, targetArtist: string): "exact" | "collab" | "none" {
    if (!candidateArtist || !targetArtist) return "none";
    if (isFakeOrKaraoke(candidateArtist)) return "none";

    const cNorm = normStr(candidateArtist);
    const tNorm = normStr(targetArtist);
    if (cNorm === tNorm) return "exact";

    const cAlnum = normAlnum(candidateArtist);
    const tAlnum = normAlnum(targetArtist);
    if (tAlnum.length >= 1 && cAlnum === tAlnum) return "exact";

    const cParts = candidateArtist
      .split(/\s*(?:&|,|feat\.?|ft\.?|with|x|\+|and|\/)\s*/i)
      .map(p => p.trim())
      .filter(Boolean);
    const tParts = targetArtist
      .split(/\s*(?:&|,|feat\.?|ft\.?|with|x|\+|and|\/)\s*/i)
      .map(p => p.trim())
      .filter(Boolean);

    for (const cp of cParts) {
      for (const tp of tParts) {
        if (normStr(cp) === normStr(tp)) return "collab";
        const cpAlnum = normAlnum(cp);
        const tpAlnum = normAlnum(tp);
        if (tpAlnum.length >= 2 && cpAlnum === tpAlnum) return "collab";
      }
    }

    return "none";
  }

  function cleanTitleForCompare(raw: string): string {
    const folded = normStr(raw || "").replace(/[’‘`]/g, "'");
    if (!folded) return "";
    if (/^[?=+\-0-9a-z]{1,3}$/.test(folded)) {
      return folded;
    }
    const stripped = folded
      .replace(
        /\s*\((official music video|official video|music video|video oficial|vídeo oficial|lyric video|visualizer|live|performance video|deluxe[^)]*|expanded[^)]*|special edition[^)]*|complete edition[^)]*|standard edition[^)]*|spilled[^)]*|slightly deluxe[^)]*|bichota season[^)]*|3am edition[^)]*|til dawn edition[^)]*|taylor's version|from the vault|feat\.[^)]+|ft\.[^)]+|with [^)]+|from [^)]+|part \d+|bonus track[^)]*|remastered[^)]*|explicit|clean)\)/gi,
        ""
      )
      .replace(/\s*\[[^\]]*\]/g, "")
      .replace(/\s*:\s*(the anthology|lana|deluxe.*)$/gi, "")
      .replace(/\s*-\s*(single|ep|deluxe.*|remastered.*|bonus track.*)$/gi, "")
      .replace(/['"`.,!:;()-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return stripped || folded;
  }

  function isTitleMatch(candidateTitle: string, targetTitle: string): "exact" | "clean" | "none" {
    if (!candidateTitle || !targetTitle) return "none";
    if (isFakeOrKaraoke(candidateTitle)) return "none";

    const cNorm = normStr(candidateTitle).replace(/[’‘`]/g, "'");
    const tNorm = normStr(targetTitle).replace(/[’‘`]/g, "'");
    if (cNorm === tNorm) return "exact";

    const cClean = cleanTitleForCompare(candidateTitle);
    const tClean = cleanTitleForCompare(targetTitle);
    if (cClean && tClean && cClean === tClean) return "clean";

    const cAlnum = normAlnum(cClean || candidateTitle);
    const tAlnum = normAlnum(tClean || targetTitle);
    if (cAlnum && tAlnum && cAlnum === tAlnum) return "clean";

    const cRawAlnum = normAlnum(candidateTitle);
    const tRawAlnum = normAlnum(targetTitle);
    if (tRawAlnum.length >= 4 && cRawAlnum.length >= 4) {
      if (cRawAlnum.includes(tRawAlnum) || tRawAlnum.includes(cRawAlnum)) {
        return "clean";
      }
    }

    const cBase = cleanTitleForCompare(candidateTitle.split(/\s*(?:\(|\[| - |:)\s*/)[0]);
    const tBase = cleanTitleForCompare(targetTitle.split(/\s*(?:\(|\[| - |:)\s*/)[0]);
    if (cBase && tBase && cBase.length >= 2 && cBase === tBase) {
      return "clean";
    }

    return "none";
  }

  function formatAppleArtUrl(url: unknown): string | null {
    if (typeof url !== "string" || !url.startsWith("http")) return null;
    return url.replace("{w}x{h}", "600x600").replace("{f}", "jpg");
  }

  /**
   * Parses Apple Music US Storefront SSR search results (`music.apple.com/us/search`).
   * Never returns 403 or geo-blocked empty arrays, and returns official AMCArtistImages portraits + 600x600 album/song covers.
   */
  async function parseAppleMusicSearch(query: string): Promise<{
    artists: Array<{ name: string; art: string; adamId: string }>;
    albums: Array<{ title: string; artist: string; art: string; url: string; adamId: string }>;
    songs: Array<{ title: string; artist: string; art: string; url: string; adamId: string }>;
  }> {
    const html = await throttledTextFetch(
      `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`
    );
    if (!html) return { artists: [], albums: [], songs: [] };
    const m = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) return { artists: [], albums: [], songs: [] };

    try {
      const parsed = JSON.parse(m[1]);
      const sections = parsed?.data?.[0]?.data?.sections || [];
      const artists: Array<{ name: string; art: string; adamId: string }> = [];
      const albums: Array<{ title: string; artist: string; art: string; url: string; adamId: string }> = [];
      const songs: Array<{ title: string; artist: string; art: string; url: string; adamId: string }> = [];

      for (const sec of sections) {
        const sid = String(sec.id || "");
        for (const item of sec.items || []) {
          const title = String(item.title || item.titleLinks?.[0]?.title || "").trim();
          const subtitle = String(item.subtitleLinks?.[0]?.title || "").trim();
          const art = formatAppleArtUrl(item.artwork?.dictionary?.url);
          const url = String(item.contentDescriptor?.url || "");
          const adamId = String(item.contentDescriptor?.identifiers?.storeAdamID || "");
          const kind = String(item.contentDescriptor?.kind || sec.itemKind || "");
          if (!art) continue;

          if (sid.includes("artist") || kind === "artist") {
            artists.push({ name: title, art, adamId });
          } else if (sid.includes("album") || kind === "album") {
            albums.push({
              title: title.replace(/\s*-\s*(Single|EP)$/i, "").trim(),
              artist: subtitle,
              art,
              url,
              adamId
            });
          } else if (sid.includes("song") || sid.includes("track") || kind === "song") {
            songs.push({ title, artist: subtitle, art, url, adamId });
          }
        }
      }
      return { artists, albums, songs };
    } catch {
      return { artists: [], albums: [], songs: [] };
    }
  }

  /**
   * Resolves an artist's official Spotify profile photo (`image-cdn-ak.spotifycdn.com`)
   * using their Spotify Artist ID or Wikidata P1902 claim -> Spotify oEmbed API.
   */
  async function resolveOfficialSpotifyPortrait(artistName: string): Promise<string | null> {
    const normArtist = normStr(artistName);
    if (VERIFIED_SPOTIFY_NPC_PORTRAITS[normArtist]) {
      return VERIFIED_SPOTIFY_NPC_PORTRAITS[normArtist];
    }

    const knownSpId = VERIFIED_SPOTIFY_ARTIST_IDS[normArtist];
    if (knownSpId) {
      const oe = await throttledJsonFetch(
        `https://open.spotify.com/oembed?url=https://open.spotify.com/artist/${knownSpId}`
      );
      if (isValidPortraitUrl(oe?.thumbnail_url)) {
        return String(oe.thumbnail_url);
      }
    }

    // Query Wikidata P1902 (Spotify Artist ID) -> Spotify oEmbed
    try {
      const sData = await throttledJsonFetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(artistName)}&language=en&format=json&limit=6`
      );
      const ids = (sData?.search || []).map((x: any) => x.id).join("|");
      if (ids) {
        const eData = await throttledJsonFetch(
          `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=claims|labels|descriptions&format=json`
        );
        for (const item of sData?.search || []) {
          const ent = eData?.entities?.[item.id];
          const spId = ent?.claims?.P1902?.[0]?.mainsnak?.datavalue?.value;
          if (!spId) continue;
          const desc = String(ent?.descriptions?.en?.value || "").toLowerCase();
          if (desc.includes("album by") || desc.includes("song by") || desc.includes("single by")) continue;
          const oe = await throttledJsonFetch(
            `https://open.spotify.com/oembed?url=https://open.spotify.com/artist/${spId}`
          );
          if (
            isValidPortraitUrl(oe?.thumbnail_url) &&
            isArtistMatch(String(oe?.title || artistName), artistName) !== "none"
          ) {
            return String(oe.thumbnail_url);
          }
        }
      }
    } catch {}

    return null;
  }

  app.get("/api/artwork", async (req, res) => {
    try {
      const artist = String(req.query.artist || "").trim();
      const title = String(req.query.title || "").trim();
      const isAlbum = req.query.isAlbum === "true";
      const isPortrait = req.query.isPortrait === "true";
      const hintTracksRaw = String(req.query.hintTracks || "").trim();
      const hintAlbumRaw = String(req.query.hintAlbum || req.query.albumHint || "").trim();

      if (!artist && !title) {
        return res.json({ url: null });
      }

      const primaryArtist = artist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
      const normPrimary = normStr(primaryArtist);
      const cleanTitle = cleanTitleForCompare(title);

      // 1. Check pre-verified Spotify / Apple Music static registry first (0ms instant response!)
      if (isPortrait) {
        const verifiedPortrait =
          VERIFIED_SPOTIFY_NPC_PORTRAITS[normStr(artist)] ||
          VERIFIED_SPOTIFY_NPC_PORTRAITS[normPrimary];
        if (verifiedPortrait) {
          return res.json({ url: verifiedPortrait });
        }
      } else if (cleanTitle) {
        const preKey1 = `${normStr(artist)}::${cleanTitle}`;
        const preKey2 = `${normPrimary}::${cleanTitle}`;
        const verifiedCover = isAlbum
          ? VERIFIED_OFFICIAL_ALBUM_COVERS[preKey1] ||
            VERIFIED_OFFICIAL_ALBUM_COVERS[preKey2] ||
            VERIFIED_OFFICIAL_SONG_COVERS[preKey1] ||
            VERIFIED_OFFICIAL_SONG_COVERS[preKey2]
          : VERIFIED_OFFICIAL_SONG_COVERS[preKey1] ||
            VERIFIED_OFFICIAL_SONG_COVERS[preKey2] ||
            VERIFIED_OFFICIAL_ALBUM_COVERS[preKey1] ||
            VERIFIED_OFFICIAL_ALBUM_COVERS[preKey2];
        if (verifiedCover) {
          return res.json({ url: verifiedCover });
        }
      }

      const cacheKey = isPortrait
        ? `portrait_v5::${normPrimary}`
        : `${isAlbum ? "album_v5" : "song_v5"}::${normPrimary}::${cleanTitle}`;

      const cached = serverArtworkCache.get(cacheKey);
      if (cached) {
        return res.json({ url: cached });
      }

      const hintTracks = hintTracksRaw
        ? hintTracksRaw.split("|").map(s => s.trim()).filter(Boolean)
        : [];
      const hintAlbums = hintAlbumRaw
        ? hintAlbumRaw.split("|").map(s => s.trim()).filter(Boolean)
        : [];

      // -----------------------------------------------------------------------
      // 2. ARTIST PORTRAIT RESOLUTION (Spotify Official oEmbed + Apple Music AMCArtistImages)
      // -----------------------------------------------------------------------
      if (isPortrait) {
        // Step 2A: Official Spotify Profile Photo via Spotify oEmbed
        const spotifyPortrait = await resolveOfficialSpotifyPortrait(primaryArtist);
        if (spotifyPortrait) {
          serverArtworkCache.set(cacheKey, spotifyPortrait);
          return res.json({ url: spotifyPortrait });
        }

        // Step 2B: Official Apple Music Studio Artist Identity Avatar (AMCArtistImages)
        const appleSearch = await parseAppleMusicSearch(
          hintTracks[0] ? `${primaryArtist} ${hintTracks[0]}` : primaryArtist
        );
        const matchedAppleArtist = appleSearch.artists.find(
          a => isArtistMatch(a.name, primaryArtist) !== "none" && isValidPortraitUrl(a.art)
        );
        if (matchedAppleArtist?.art) {
          serverArtworkCache.set(cacheKey, matchedAppleArtist.art);
          return res.json({ url: matchedAppleArtist.art });
        }

        return res.json({ url: null });
      }

      // -----------------------------------------------------------------------
      // 3. ALBUM & SINGLE COVER ART RESOLUTION (Apple Music US Search + Parent Album Fallback)
      // -----------------------------------------------------------------------
      const appleResult = await parseAppleMusicSearch(`${primaryArtist} ${title}`);
      if (isAlbum) {
        const matchedAlb =
          appleResult.albums.find(
            a =>
              isArtistMatch(a.artist, primaryArtist) !== "none" &&
              isTitleMatch(a.title, title) !== "none"
          ) ||
          appleResult.albums.find(a => isArtistMatch(a.artist, primaryArtist) !== "none") ||
          appleResult.songs.find(
            s =>
              isArtistMatch(s.artist, primaryArtist) !== "none" &&
              isTitleMatch(s.title, title) !== "none"
          );

        if (matchedAlb?.art && isValidCoverUrl(matchedAlb.art)) {
          serverArtworkCache.set(cacheKey, matchedAlb.art);
          return res.json({ url: matchedAlb.art });
        }
      } else {
        const matchedSng =
          appleResult.songs.find(
            s =>
              isArtistMatch(s.artist, primaryArtist) !== "none" &&
              isTitleMatch(s.title, title) !== "none"
          ) ||
          appleResult.albums.find(
            a =>
              isArtistMatch(a.artist, primaryArtist) !== "none" &&
              isTitleMatch(a.title, title) !== "none"
          ) ||
          appleResult.songs.find(s => isArtistMatch(s.artist, primaryArtist) !== "none");

        if (matchedSng?.art && isValidCoverUrl(matchedSng.art)) {
          serverArtworkCache.set(cacheKey, matchedSng.art);
          return res.json({ url: matchedSng.art });
        }
      }

      // Check parent album hint if provided
      for (const hAlb of hintAlbums) {
        const hAlbKey = `${normPrimary}::${cleanTitleForCompare(hAlb)}`;
        if (VERIFIED_OFFICIAL_ALBUM_COVERS[hAlbKey]) {
          serverArtworkCache.set(cacheKey, VERIFIED_OFFICIAL_ALBUM_COVERS[hAlbKey]);
          return res.json({ url: VERIFIED_OFFICIAL_ALBUM_COVERS[hAlbKey] });
        }
      }

      // Fallback to any verified album cover of this exact artist so cover is never blank
      const anyArtistAlbum = Object.entries(VERIFIED_OFFICIAL_ALBUM_COVERS).find(([k]) =>
        k.startsWith(`${normPrimary}::`)
      );
      if (anyArtistAlbum?.[1]) {
        return res.json({ url: anyArtistAlbum[1] });
      }

      return res.json({ url: null });
    } catch {
      return res.json({ url: null });
    }
  });

  // In-memory cache for real YouTube & Apple Music Video 16:9 thumbnails
  const serverMvThumbnailCache = new Map<string, string>();

  app.get("/api/mv-thumbnail", async (req, res) => {
    try {
      const artist = String(req.query.artist || "").trim();
      const title = String(req.query.title || "").trim();
      if (!artist && !title) {
        return res.json({ url: null });
      }

      const primaryArtist = artist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
      const cleanTitle = title
        .replace(
          /\s*\((Official Music Video|Official Video|Music Video|Video Oficial|Vídeo Oficial|Lyric Video|Visualizer|Live Performance|Live|Performance Video)\)/gi,
          ""
        )
        .trim();

      const cacheKey = `mv::${primaryArtist.toLowerCase()}::${cleanTitle.toLowerCase()}`;
      const cached = serverMvThumbnailCache.get(cacheKey);
      if (cached) {
        return res.json({ url: cached });
      }

      try {
        const ytQuery = `${primaryArtist} ${cleanTitle} Official Music Video`;
        const ytHtml = await throttledTextFetch(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}&hl=en`
        );
        if (ytHtml) {
          const match = ytHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (match && match[1]) {
            const ytThumb = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
            serverMvThumbnailCache.set(cacheKey, ytThumb);
            return res.json({ url: ytThumb });
          }
        }
      } catch {}

      return res.json({ url: null });
    } catch {
      return res.json({ url: null });
    }
  });

  // In-memory cache for authentic full album tracklists
  const serverAlbumTracklistCache = new Map<string, string[]>();

  app.get("/api/album-tracks", async (req, res) => {
    try {
      const artist = String(req.query.artist || "").trim();
      const album = String(req.query.album || "").trim();
      if (!artist || !album) {
        return res.json({ tracks: [] });
      }

      const primaryArtist = artist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
      const cacheKey = `${normStr(primaryArtist)}::${normStr(album)}`;
      if (serverAlbumTracklistCache.has(cacheKey)) {
        return res.json({ tracks: serverAlbumTracklistCache.get(cacheKey) });
      }

      // Fetch via Apple Music US Search -> Album Page Tracklist (never 403s!)
      const searchRes = await parseAppleMusicSearch(`${primaryArtist} ${album}`);
      const matchedAlb =
        searchRes.albums.find(
          a =>
            isArtistMatch(a.artist, primaryArtist) !== "none" &&
            isTitleMatch(a.title, album) !== "none" &&
            a.url
        ) || searchRes.albums.find(a => isArtistMatch(a.artist, primaryArtist) !== "none" && a.url);

      if (matchedAlb?.url) {
        const albHtml = await throttledTextFetch(matchedAlb.url);
        if (albHtml) {
          const m = albHtml.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/i);
          if (m) {
            const parsed = JSON.parse(m[1]);
            const secs = parsed?.data?.[0]?.data?.sections || [];
            const trkSec = secs.find((s: any) => String(s.id || "").includes("track-list") && Array.isArray(s.items) && s.items.length >= 3);
            if (trkSec?.items) {
              const trackTitles = trkSec.items
                .map((t: any) => String(t.title || t.titleLinks?.[0]?.title || "").trim())
                .filter(Boolean);
              if (trackTitles.length >= 3) {
                serverAlbumTracklistCache.set(cacheKey, trackTitles);
                return res.json({ tracks: trackTitles });
              }
            }
          }
        }
      }

      return res.json({ tracks: [] });
    } catch {
      return res.json({ tracks: [] });
    }
  });

  app.get("/api/artwork/artist-batch", async (req, res) => {
    try {
      const artist = String(req.query.artist || "").trim();
      const hintTrackRaw = String(req.query.hintTrack || req.query.hintTracks || "").trim();
      if (!artist) return res.json({ songCovers: {}, albumCovers: {}, artistPhoto: null });

      const primaryArtist = artist.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
      const lowerArtist = normStr(primaryArtist);

      if (serverArtistBatchCache.has(lowerArtist)) {
        return res.json(serverArtistBatchCache.get(lowerArtist));
      }

      const songCovers: Record<string, string> = {};
      const albumCovers: Record<string, string> = {};
      let artistPhoto: string | null = VERIFIED_SPOTIFY_NPC_PORTRAITS[lowerArtist] || null;

      // Populate from pre-verified static maps first
      for (const [k, v] of Object.entries(VERIFIED_OFFICIAL_ALBUM_COVERS)) {
        if (k.startsWith(`${lowerArtist}::`)) {
          const t = k.split("::")[1];
          if (t) albumCovers[t] = v;
        }
      }
      for (const [k, v] of Object.entries(VERIFIED_OFFICIAL_SONG_COVERS)) {
        if (k.startsWith(`${lowerArtist}::`)) {
          const t = k.split("::")[1];
          if (t) songCovers[t] = v;
        }
      }

      // If not already in pre-verified registry, query Apple Music US Search + Spotify oEmbed
      if (!artistPhoto || Object.keys(songCovers).length === 0) {
        const hintTracks = hintTrackRaw
          ? hintTrackRaw.split("|").map(s => s.trim()).filter(Boolean)
          : [];
        const [spPhoto, appleData] = await Promise.all([
          artistPhoto ? Promise.resolve(artistPhoto) : resolveOfficialSpotifyPortrait(primaryArtist),
          parseAppleMusicSearch(hintTracks[0] ? `${primaryArtist} ${hintTracks[0]}` : primaryArtist)
        ]);

        if (spPhoto) artistPhoto = spPhoto;
        if (!artistPhoto) {
          const matchedArt = appleData.artists.find(a => isArtistMatch(a.name, primaryArtist) !== "none");
          if (matchedArt?.art) artistPhoto = matchedArt.art;
        }
        for (const s of appleData.songs) {
          if (isArtistMatch(s.artist, primaryArtist) !== "none" && s.title && s.art) {
            songCovers[s.title] = s.art;
          }
        }
        for (const a of appleData.albums) {
          if (isArtistMatch(a.artist, primaryArtist) !== "none" && a.title && a.art) {
            albumCovers[a.title] = a.art;
          }
        }
      }

      const payload = { songCovers, albumCovers, artistPhoto };
      serverArtistBatchCache.set(lowerArtist, payload);
      return res.json(payload);
    } catch {
      return res.json({ songCovers: {}, albumCovers: {}, artistPhoto: null });
    }
  });

  // Auth: Register with Email & Password
  app.post("/api/auth/register", (req, res) => {
    try {
      const { email, password } = req.body;
      const result = authService.register(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Registration failed.' });
    }
  });

  // Auth: Login - Direct authentication without 2FA codes
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const result = authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Login failed.' });
    }
  });

  // Auth: Direct password reset without verification codes
  app.post("/api/auth/reset-password", (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const result = authService.resetPasswordDirect(email, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Password reset failed.' });
    }
  });

  // Auth: Get current profile from token
  app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // Legacy sync endpoint
  app.post("/api/auth", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user) {
        try {
          const user = await getOrCreateUser(req.user.uid, req.user.email || '');
          res.json({ user });
        } catch {
          res.json({ user: req.user });
        }
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/save", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user) {
        const state = req.body;
        // Always save to persistent server storage with UID and email
        serverStorage.saveGameState(req.user.uid, state, req.user.email);
        // Also attempt SQL database in background if available
        saveGameState(req.user.uid, state).catch(() => {});
        res.json({ success: true });
      }
    } catch (error: any) {
      console.error("Save error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/load", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user) {
        // Try server storage first (with email fallback)
        let state = serverStorage.getGameState(req.user.uid, req.user.email);
        if (!state) {
          try {
            state = await getGameState(req.user.uid);
          } catch {
            // DB fallback
          }
        }
        res.json({ state });
      }
    } catch (error: any) {
      console.error("Load error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
