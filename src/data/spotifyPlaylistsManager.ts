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

import { computePlayerTrackPlaylistRank } from './enhancedPlaylistCurationEngine';

/**
 * Builds realistic, consistent Spotify playlists 100% from actual NPC releases (`npc.songs`)
 * and integrates pitched/placed player tracks at merit-based positions (#1 Cover Star to #48).
 */
export function generateCuratedSpotifyPlaylists(
  playerSongs: Song[],
  playerName: string,
  artistPopularity: number = 30
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
    const npcItems: PlaylistTrackItem[] = [];
    const seenKeys = new Set<string>();

    const placedPlayerSongs = playerSongs.filter(
      s => s.status === 'released' && s.playlistPlacements?.includes(plId)
    );

    placedPlayerSongs.forEach(song => {
      const key = `${(playerName || 'player').toLowerCase()}::${song.title.toLowerCase()}`;
      seenKeys.add(key);
    });

    // Collect actual released NPC songs matching this playlist's vibe/theme
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

        npcItems.push({
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

    npcItems.sort((a, b) => (b.points || 0) - (a.points || 0));
    const finalRoster: PlaylistTrackItem[] = [...npcItems.slice(0, 50)];
    const npcScores = finalRoster.map(item => item.points || 0);

    // Insert placed player songs at their merit-based editorial rank
    placedPlayerSongs
      .sort((a, b) => (b.dailyStreams || b.streams || 0) - (a.dailyStreams || a.streams || 0))
      .forEach(song => {
        const playerStreams = song.streams || 0;
        const targetRank = computePlayerTrackPlaylistRank(song, plId, npcScores, artistPopularity);
        const insertIdx = Math.max(0, Math.min(finalRoster.length, targetRank - 1));

        const playerEntry: PlaylistTrackItem = {
          id: song.id,
          title: song.title,
          artist: playerName || 'Player Artist',
          points: playerStreams,
          streams: playerStreams,
          isPlayer: true,
          cover: song.cover || resolveRealWorldCoverArt(playerName, song.title, false),
          lastPosition: null,
          duration: '3:15',
          collabId: song.collabId,
          hasMV: song.hasMV,
          isExplicit: song.isExplicit
        };

        finalRoster.splice(insertIdx, 0, playerEntry);
      });

    result[plId] = finalRoster.slice(0, 50);
  });

  return result;
}

