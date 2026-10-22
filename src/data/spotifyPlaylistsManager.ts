// Dedicated Spotify Playlist Manager
// Curates and synchronizes authentic Spotify playlists (Today's Top Hits, New Music Friday, RapCaviar, etc.)
// 100% from the actual released songs of REAL_WORLD_NPCS and the Player's placed tracks.

import { ChartItem, Song } from '../types';
import { REAL_WORLD_NPCS, resolveRealWorldCoverArt } from './realWorldArtistCatalog';
import { isNpcMatchingPlayerName, syncPlayerNameNpcDeduplication } from './npcPlayerDeduplicationEngine';

export interface PlaylistTrackItem extends ChartItem {
  streams?: number;
  addedDate?: string;
  duration?: string;
}

function matchesPlaylistTheme(playlistId: string, genre: string, npcIdx: number, songIdx: number): boolean {
  const g = (genre || '').toLowerCase();
  if (playlistId === 'tth' || playlistId === 'v50' || playlistId === 'daily_mix_1') return true;
  if (playlistId === 'nmf' || playlistId === 'release_radar' || playlistId === 'discover_weekly') {
    return songIdx === 0;
  }
  if (playlistId === 'rc' || playlistId === 'beast_mode') {
    return g.includes('hip-hop') || g.includes('rap') || g.includes('trap') || g.includes('drill') || g.includes('r&b');
  }
  if (playlistId === 'pr' || playlistId === 'feel_good') {
    return g.includes('pop') || g.includes('indie') || g.includes('k-pop') || g.includes('j-pop');
  }
  if (playlistId === 'club_hits' || playlistId === 'workout_energy') {
    return g.includes('dance') || g.includes('edm') || g.includes('electronic') || g.includes('pop') || g.includes('trap') || g.includes('reggaeton') || g.includes('afrobeats');
  }
  if (playlistId === 'chill_vibes' || playlistId === 'late_night' || playlistId === 'sad_hour' || playlistId === 'sunset_chill' || playlistId === 'deep_focus' || playlistId === 'peaceful_lofi') {
    return g.includes('r&b') || g.includes('indie') || g.includes('folk') || g.includes('soul') || g.includes('ballad') || g.includes('alt') || (npcIdx % 2 === 0);
  }
  return true;
}

/**
 * Builds realistic, consistent Spotify playlists 100% from actual NPC releases (`npc.songs`)
 * and integrates pitched/placed player tracks at top positions with real player stats.
 */
export function generateCuratedSpotifyPlaylists(
  playerSongs: Song[],
  playerName: string
): Record<string, PlaylistTrackItem[]> {
  syncPlayerNameNpcDeduplication(playerName);
  const result: Record<string, PlaylistTrackItem[]> = {};

  const playlistIds = [
    'tth', 'nmf', 'rc', 'pr', 'v50',
    'chill_vibes', 'workout_energy', 'late_night', 'feel_good', 'sad_hour',
    'sunset_chill', 'deep_focus', 'peaceful_lofi', 'club_hits', 'beast_mode',
    'release_radar', 'discover_weekly', 'daily_mix_1'
  ];

  playlistIds.forEach((plId, plIdx) => {
    const items: PlaylistTrackItem[] = [];
    const seenKeys = new Set<string>();

    // 1. Insert player's placed songs into this playlist
    const placedPlayerSongs = playerSongs.filter(
      s => s.status === 'released' && s.playlistPlacements?.includes(plId)
    );

    placedPlayerSongs.forEach(song => {
      const playerStreams = song.streams || 0;
      const key = `${(playerName || 'player').toLowerCase()}::${song.title.toLowerCase()}`;
      seenKeys.add(key);
      items.push({
        title: song.title,
        artist: playerName || 'Player Artist',
        points: playerStreams,
        streams: playerStreams,
        isPlayer: true,
        cover: song.cover || resolveRealWorldCoverArt(playerName, song.title, false),
        lastPosition: null,
        duration: '3:15'
      });
    });

    // 2. Collect actual released NPC songs matching this playlist's vibe/theme
    REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
      if (playerName && isNpcMatchingPlayerName(npc.name, playerName)) return;

      (npc.songs || []).forEach((s, sIdx) => {
        if (!matchesPlaylistTheme(plId, npc.genre, npcIdx + plIdx, sIdx)) return;
        const key = `${npc.name.toLowerCase()}::${s.title.toLowerCase()}`;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const actualStreams = Math.max(0, Math.floor(s.streams || 0));
        const sortWeight = actualStreams > 0 ? actualStreams : (npc.pop * 10000 + npc.hype * 100 - sIdx * 500);
        const cover = s.cover || resolveRealWorldCoverArt(npc.name, s.title, false);

        items.push({
          title: s.title,
          artist: npc.name,
          points: sortWeight,
          streams: actualStreams,
          isPlayer: false,
          cover,
          lastPosition: null,
          duration: `3:${10 + ((npcIdx * 7 + sIdx * 13) % 45)}`
        });
      });
    });

    const playerItems = items.filter(i => i.isPlayer);
    const npcItems = items
      .filter(i => !i.isPlayer)
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    result[plId] = [...playerItems, ...npcItems].slice(0, 50);
  });

  return result;
}

