import { ChartItem, Song } from '../types';
import { getTrackCoverArt } from './npcAssets';
import { SPOTIFY_PLAYLISTS } from '../constants';

export interface PlaylistSongSeed {
  title: string;
  artist: string;
  genre: string;
  popularityScore: number; // 1 - 100
  isNew?: boolean;
  isViral?: boolean;
}

// Curated seed catalog for Spotify playlists covering diverse genres and real-world archetype hits
export const PLAYLIST_SEED_CATALOG: PlaylistSongSeed[] = [
  // Today's Top Hits & Pop Rising & Viral
  { title: 'Cruel Daylight', artist: 'Taylor Shift', genre: 'Pop', popularityScore: 98, isNew: false, isViral: true },
  { title: "God's Blueprint", artist: 'Drakeo', genre: 'Hip-Hop', popularityScore: 96, isNew: true, isViral: true },
  { title: 'Espresso Buzz', artist: 'Sabrina Carpenter', genre: 'Pop', popularityScore: 95, isNew: true, isViral: true },
  { title: 'Birds of a Feather', artist: 'Billie Eyelash', genre: 'Alt-Pop', popularityScore: 94, isNew: false, isViral: true },
  { title: 'Good Luck Dreamer', artist: 'Chappell Roan', genre: 'Pop', popularityScore: 92, isNew: true, isViral: true },
  { title: 'Titi Me Pregunto', artist: 'Bad Bunnyito', genre: 'Reggaeton', popularityScore: 91, isNew: false, isViral: false },
  { title: 'Not Like Them', artist: 'Kendrick Llama', genre: 'Hip-Hop', popularityScore: 90, isNew: true, isViral: true },
  { title: 'Fein Rush', artist: 'Travis Scott', genre: 'Hip-Hop', popularityScore: 89, isNew: false, isViral: true },
  { title: 'Blinding Neon City', artist: 'The Weekend', genre: 'R&B / Pop', popularityScore: 88, isNew: false, isViral: false },
  { title: 'Saturn Rings', artist: 'SZA', genre: 'R&B', popularityScore: 87, isNew: true, isViral: true },
  { title: 'Water Ripple', artist: 'Tyla South', genre: 'Afrobeats', popularityScore: 86, isNew: true, isViral: true },
  { title: 'Greedy Tempo', artist: 'Tate McRae', genre: 'Pop', popularityScore: 85, isNew: true, isViral: true },
  { title: 'Rich Baby Daddy', artist: 'Drakeo', genre: 'Hip-Hop', popularityScore: 84, isNew: false, isViral: true },
  { title: 'Like That Beat', artist: 'Future & Metro', genre: 'Hip-Hop', popularityScore: 83, isNew: true, isViral: true },
  { title: 'Paint The Town Red', artist: 'Doja Kitty', genre: 'Hip-Hop / Pop', popularityScore: 83, isNew: false, isViral: true },
  { title: 'Fukumean Flow', artist: 'Gunna Wunna', genre: 'Hip-Hop', popularityScore: 82, isNew: false, isViral: true },
  { title: 'Sprinter London', artist: 'Central Cee', genre: 'UK Drill', popularityScore: 81, isNew: false, isViral: true },
  { title: 'Type Shit', artist: 'Playboi Carti', genre: 'Hip-Hop', popularityScore: 80, isNew: true, isViral: true },
  { title: 'Redrum Cold', artist: '21 Savage', genre: 'Hip-Hop', popularityScore: 79, isNew: true, isViral: true },
  { title: 'Lovin On Me', artist: 'Jack Harlow', genre: 'Hip-Hop', popularityScore: 78, isNew: false, isViral: true },
  { title: 'Carnival Night', artist: 'Kanye West', genre: 'Hip-Hop', popularityScore: 78, isNew: true, isViral: true },
  { title: 'Agora Hills', artist: 'Doja Kitty', genre: 'R&B / Hip-Hop', popularityScore: 77, isNew: true, isViral: true },
  { title: 'Too Sweet', artist: 'Hozier', genre: 'Indie Rock', popularityScore: 77, isNew: true, isViral: true },
  { title: 'Beautiful Things', artist: 'Benson Boone', genre: 'Pop', popularityScore: 76, isNew: true, isViral: true },
  { title: 'Please Please Please', artist: 'Sabrina Carpenter', genre: 'Pop', popularityScore: 76, isNew: true, isViral: true },
  { title: 'HOT TO GO!', artist: 'Chappell Roan', genre: 'Pop', popularityScore: 75, isNew: true, isViral: true },
  { title: 'Lunch Hour', artist: 'Billie Eyelash', genre: 'Alt-Pop', popularityScore: 75, isNew: true, isViral: false },
  { title: 'Midnight Rain Glow', artist: 'Taylor Shift', genre: 'Pop', popularityScore: 74, isNew: false, isViral: false },
  { title: 'Bleed For You', artist: 'The Kid Laro', genre: 'Pop', popularityScore: 73, isNew: false, isViral: false },
  { title: 'Thousand Miles', artist: 'The Kid Laro', genre: 'Pop', popularityScore: 72, isNew: false, isViral: false },
  { title: 'Despecha Fiesta', artist: 'Rosalia X', genre: 'Latin Pop', popularityScore: 72, isNew: false, isViral: true },
  { title: 'Bizcochito', artist: 'Rosalia X', genre: 'Latin Pop', popularityScore: 71, isNew: false, isViral: false },
  { title: 'Snooze Forever', artist: 'SZA', genre: 'R&B', popularityScore: 70, isNew: false, isViral: false },
  { title: 'Vampire Anthem', artist: 'Olivia Rodrigoa', genre: 'Pop Rock', popularityScore: 70, isNew: false, isViral: false },
  { title: 'Bad Idea Right', artist: 'Olivia Rodrigoa', genre: 'Pop Rock', popularityScore: 69, isNew: false, isViral: false },
  { title: 'Houdini Magic', artist: 'Dua Peepa', genre: 'Dance Pop', popularityScore: 68, isNew: true, isViral: false },
  { title: 'Training Season', artist: 'Dua Peepa', genre: 'Dance Pop', popularityScore: 67, isNew: true, isViral: false },
  { title: 'Late Night Talking', artist: 'Harry Styles', genre: 'Pop', popularityScore: 66, isNew: false, isViral: false },
  { title: 'As It Was Then', artist: 'Harry Styles', genre: 'Pop', popularityScore: 65, isNew: false, isViral: false },
  { title: 'Starboy Nights', artist: 'The Weekend', genre: 'R&B / Synthpop', popularityScore: 65, isNew: false, isViral: false },
  { title: 'Die For You Echo', artist: 'The Weekend', genre: 'R&B', popularityScore: 64, isNew: false, isViral: false },
  { title: 'Seven Days A Week', artist: 'Jung Kook BTS', genre: 'K-Pop', popularityScore: 64, isNew: false, isViral: true },
  { title: 'Standing Next To You', artist: 'Jung Kook BTS', genre: 'K-Pop', popularityScore: 63, isNew: false, isViral: false },
  { title: 'Pink Venom Strike', artist: 'BLACKPINK Nova', genre: 'K-Pop', popularityScore: 63, isNew: false, isViral: false },
  { title: 'Super Shy Groove', artist: 'NewJeans Star', genre: 'K-Pop', popularityScore: 62, isNew: false, isViral: true },
  { title: 'OMG Heartbeat', artist: 'NewJeans Star', genre: 'K-Pop', popularityScore: 61, isNew: false, isViral: true },
  { title: 'Satu Bulan', artist: 'Bernadya', genre: 'Indonesian Pop', popularityScore: 61, isNew: true, isViral: true },
  { title: 'Untungnya Hidup', artist: 'Bernadya', genre: 'Indonesian Pop', popularityScore: 60, isNew: true, isViral: true },
  { title: 'Hati-Hati Di Jalan', artist: 'Tulus', genre: 'Indo Soul', popularityScore: 60, isNew: false, isViral: false },
  { title: 'Evaluasi Tenang', artist: 'Hindia', genre: 'Indie Rock', popularityScore: 59, isNew: false, isViral: false }
];

export interface GeneratePlaylistsOptions {
  playerSongs: Song[];
  playerName: string;
  playerPopularity: number;
}

/**
 * Builds realistic, correctly-scaled, and monotonically descending tracklists
 * for each of Spotify's official curated playlists.
 */
export function generateSpotifyPlaylists(options: GeneratePlaylistsOptions): Record<string, ChartItem[]> {
  const { playerSongs, playerName, playerPopularity } = options;
  const result: Record<string, ChartItem[]> = {};

  const releasedPlayerSongs = playerSongs.filter(s => s.status === 'released');

  // Helper to construct a ChartItem with verified cover art
  const createItem = (title: string, artist: string, points: number, isPlayer: boolean, cover?: string): ChartItem => ({
    title,
    artist,
    points: Math.max(1000, Math.round(points)),
    isPlayer,
    cover: cover || getTrackCoverArt(artist, title),
    lastPosition: null
  });

  SPOTIFY_PLAYLISTS.forEach(pl => {
    let pool: PlaylistSongSeed[] = [];
    let topStreamTarget = 8500000;
    let bottomStreamTarget = 2400000;

    if (pl.id === 'tth') {
      // Today's Top Hits: 34.5M followers. The biggest 50 tracks in the world.
      pool = [...PLAYLIST_SEED_CATALOG].sort((a, b) => b.popularityScore - a.popularityScore);
      topStreamTarget = 8850000;
      bottomStreamTarget = 2750000;
    } else if (pl.id === 'nmf') {
      // New Music Friday: Fresh tracks with high buzz
      pool = PLAYLIST_SEED_CATALOG.filter(s => s.isNew || s.popularityScore > 75)
        .sort((a, b) => b.popularityScore - a.popularityScore);
      topStreamTarget = 4900000;
      bottomStreamTarget = 1200000;
    } else if (pl.id === 'rc') {
      // RapCaviar: Hip-Hop & Rap culture
      pool = PLAYLIST_SEED_CATALOG.filter(s => s.genre.toLowerCase().includes('hip-hop') || s.genre.toLowerCase().includes('drill') || s.genre.toLowerCase().includes('rap'))
        .sort((a, b) => b.popularityScore - a.popularityScore);
      // If pool is under 50, pad with top catalog items
      if (pool.length < 50) {
        const others = PLAYLIST_SEED_CATALOG.filter(s => !pool.some(p => p.title === s.title));
        pool = [...pool, ...others];
      }
      topStreamTarget = 6600000;
      bottomStreamTarget = 1500000;
    } else if (pl.id === 'pr') {
      // Pop Rising: Pop, Alt-Pop, and emerging indie
      pool = PLAYLIST_SEED_CATALOG.filter(s => s.genre.toLowerCase().includes('pop') || s.genre.toLowerCase().includes('indie'))
        .sort((a, b) => (b.isNew ? b.popularityScore + 10 : b.popularityScore) - (a.isNew ? a.popularityScore + 10 : a.popularityScore));
      topStreamTarget = 3900000;
      bottomStreamTarget = 850000;
    } else if (pl.id === 'v50') {
      // Viral 50 - Global: Highly viral tracks
      pool = PLAYLIST_SEED_CATALOG.filter(s => s.isViral || s.isNew)
        .sort((a, b) => b.popularityScore - a.popularityScore);
      topStreamTarget = 7200000;
      bottomStreamTarget = 1800000;
    }

    // Take top 50
    const selectedSeeds = pool.slice(0, 50);

    // Generate smoothly declining realistic streams along Zipfian / power decay
    const items: ChartItem[] = selectedSeeds.map((seed, idx) => {
      const decay = Math.pow(0.975, idx);
      const points = bottomStreamTarget + (topStreamTarget - bottomStreamTarget) * decay;
      return createItem(seed.title, seed.artist, points, false);
    });

    // Insert Player's Songs if pitched or placed in this playlist
    releasedPlayerSongs.forEach(song => {
      const isPlaced = song.playlistPlacements?.includes(pl.id);
      if (isPlaced) {
        // Player stream in this playlist matches player momentum and tier
        const baseDaily = song.dailyStreams || Math.round((song.basePotential || 1) * (250 + playerPopularity * 200));
        // Bonus boost from playlist exposure
        const playlistPoints = Math.max(
          Math.round(bottomStreamTarget * 0.8),
          Math.min(topStreamTarget * 0.95, Math.round(baseDaily * 1.6))
        );

        items.push(createItem(song.title, playerName || 'Player Artist', playlistPoints, true, song.cover));
      }
    });

    // Strictly sort descending by points so stream order is completely realistic and harmonious
    items.sort((a, b) => b.points - a.points);

    result[pl.id] = items.slice(0, 50);
  });

  return result;
}
