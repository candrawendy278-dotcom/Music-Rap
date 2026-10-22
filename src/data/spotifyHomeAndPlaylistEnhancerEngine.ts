import { GameState } from '../types';
import {
  AUTHENTIC_SPOTIFY_PLAYLISTS,
  SpotifyPlaylistDefinition
} from './authenticSpotifyPlaylistSystem';
import { generateCuratedSpotifyPlaylists } from './spotifyPlaylistsManager';

export interface PlayerPlaylistPlacementDetail {
  playlistId: string;
  playlistName: string;
  playlistGradient: string;
  playlistBadge: string;
  playlistFollowers: number;
  songId: number | string;
  songTitle: string;
  songCover?: string;
  positionInPlaylist: number;
  estimatedDailyBoost: number;
  playlistDef: SpotifyPlaylistDefinition;
}

export interface SpotifyHomeCurationSummary {
  activePlayerPlacements: PlayerPlaylistPlacementDetail[];
  totalDailyPlaylistStreamBoost: number;
  editorialRadarPlaylists: SpotifyPlaylistDefinition[];
  globalViralPlaylists: SpotifyPlaylistDefinition[];
  daylistTitle: string;
  daylistDesc: string;
  daylistPlaylist: SpotifyPlaylistDefinition;
}

/**
 * Enhances Spotify Home with:
 * - Active Player Playlist Placements & Live Daily Stream Boost telemetry
 * - Dynamic Spotify "daylist" / "On Repeat" algorithmic curation tailored to the player's era
 * - Expanded Genre & Global Crossover shelves
 */
export function buildEnhancedSpotifyHomeAndPlaylistCuration(
  state: GameState
): SpotifyHomeCurationSummary {
  const playerName = state.artist?.name || 'Artist';
  const curatedMap = generateCuratedSpotifyPlaylists(state.songs, playerName);

  const activePlayerPlacements: PlayerPlaylistPlacementDetail[] = [];
  let totalDailyPlaylistStreamBoost = 0;

  AUTHENTIC_SPOTIFY_PLAYLISTS.forEach(pl => {
    const stateTracks = state.spotify?.playlists?.[pl.id];
    const tracks =
      stateTracks && stateTracks.length > 0
        ? stateTracks
        : curatedMap[pl.id] || [];

    tracks.forEach((track: any, idx: number) => {
      if (track.isPlayer) {
        const position = idx + 1;
        const baseEditorialBoost =
          pl.id === 'tth'
            ? 46_000
            : pl.id === 'rc'
            ? 32_000
            : pl.id === 'nmf'
            ? 28_000
            : pl.id === 'v50'
            ? 29_500
            : pl.category === 'flagship'
            ? 24_000
            : pl.category === 'algorithmic'
            ? 16_500
            : 12_000;

        const posFactor = Math.max(0.35, 1.2 - (position - 1) * 0.045);
        const estimatedDailyBoost = Math.round(baseEditorialBoost * posFactor);
        totalDailyPlaylistStreamBoost += estimatedDailyBoost;

        activePlayerPlacements.push({
          playlistId: pl.id,
          playlistName: pl.name,
          playlistGradient: pl.gradient,
          playlistBadge: pl.curator,
          playlistFollowers: pl.followers,
          songId: track.id || `${pl.id}-${idx}`,
          songTitle: track.title,
          songCover: track.cover,
          positionInPlaylist: position,
          estimatedDailyBoost,
          playlistDef: pl
        });
      }
    });
  });

  activePlayerPlacements.sort((a, b) => b.estimatedDailyBoost - a.estimatedDailyBoost);

  // Dynamic Daylist title based on current game date & genre
  const dateObj = new Date(state.date || Date.now());
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dateObj.getDay()] || 'Friday';
  const genreLabel = (state.songs[0]?.genre || 'Pop').toLowerCase();

  const daylistTitle = `main character ${genreLabel} ${dayName.toLowerCase()} night`;
  const daylistDesc = `You listened to ${playerName} and global chart-toppers on ${dayName}. Here's your custom daylist mix.`;

  const daylistPlaylist: SpotifyPlaylistDefinition =
    AUTHENTIC_SPOTIFY_PLAYLISTS.find(p => p.id === 'discover_weekly') ||
    AUTHENTIC_SPOTIFY_PLAYLISTS[0];

  const editorialRadarPlaylists = AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p =>
    ['tth', 'nmf', 'pr', 'rc', 'v50'].includes(p.id)
  );

  const globalViralPlaylists = AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p =>
    ['v50', 'release_radar', 'discover_weekly', 'late_night', 'workout_energy'].includes(p.id)
  );

  return {
    activePlayerPlacements,
    totalDailyPlaylistStreamBoost,
    editorialRadarPlaylists,
    globalViralPlaylists,
    daylistTitle,
    daylistDesc,
    daylistPlaylist
  };
}
