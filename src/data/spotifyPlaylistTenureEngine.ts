// Spotify Playlist Dynamic Lifecycle & Tenure Engine
// Solves: "Harusnya Lagu Player Bisa Keluar Dari Playlist Gak Di Dalam Playlist Terus Bisa Masuk Keluar"
// Implements realistic editorial playlist rotation:
// - Songs enter playlists upon pitch or algorithmic discovery
// - Songs have authentic tenures (e.g. New Music Friday: 7-14 days; Release Radar: 28 days)
// - Songs naturally exit (keluar) when their tenure or momentum expires
// - Songs can re-enter (masuk kembali) if they experience a resurgence or promo revival
// - Player has full manual control to remove/exit songs from playlists directly in the UI

import { Song } from '../types';

export interface PlaylistRotationEvent {
  songId: number;
  songTitle: string;
  playlistId: string;
  playlistName: string;
  type: 'exit' | 'entry' | 'resurgence';
  reason: string;
}

export interface PlaylistLifecycleCheckResult {
  updatedSongs: Song[];
  events: PlaylistRotationEvent[];
}

// Standard editorial tenures (in days)
const PLAYLIST_MAX_TENURE_DAYS: Record<string, number> = {
  nmf: 14,             // New Music Friday: strictly 7 to 14 days
  release_radar: 28,   // Release Radar: 28 days post-release
  discover_weekly: 21, // Discover Weekly: 14 - 21 days
  daily_mix_1: 45,     // Daily Mix: 45 days
  v50: 35,             // Viral 50: rotates as viral wave subsides
  pr: 42,              // Pop Rising: 6 weeks
  rc: 56,              // RapCaviar: 8 weeks
  tth: 70,             // Today's Top Hits: 10 weeks max unless maintaining >1.2M daily streams
  chill_vibes: 60,
  workout_energy: 60,
  late_night: 60,
  feel_good: 60,
  sad_hour: 60,
  sunset_chill: 60,
  deep_focus: 90
};

const PLAYLIST_DISPLAY_NAMES: Record<string, string> = {
  tth: "Today's Top Hits",
  nmf: "New Music Friday",
  rc: "RapCaviar",
  pr: "Pop Rising",
  v50: "Viral 50",
  release_radar: "Release Radar",
  discover_weekly: "Discover Weekly",
  daily_mix_1: "Daily Mix 1",
  chill_vibes: "Chill Vibes",
  workout_energy: "Workout Energy",
  late_night: "Late Night Drive",
  feel_good: "Feel-Good Indie",
  sad_hour: "Sad Hour",
  sunset_chill: "Sunset Acoustic",
  deep_focus: "Deep Focus"
};

/**
 * Evaluates active playlist tenures and naturally rotates tracks OUT of playlists
 * when their promotional cycle or streaming momentum concludes.
 */
export function evaluatePlaylistTenureAndRotations(
  songs: Song[],
  currentDate: Date
): PlaylistLifecycleCheckResult {
  const events: PlaylistRotationEvent[] = [];

  const updatedSongs = songs.map(song => {
    if (song.status !== 'released' || !song.playlistPlacements || song.playlistPlacements.length === 0) {
      return song;
    }

    const releaseDate = song.releaseDate ? new Date(song.releaseDate) : currentDate;
    const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyStreams = song.dailyStreams || 0;
    const momentum = song.momentum || 1.0;

    const remainingPlacements: string[] = [];

    song.playlistPlacements.forEach(plId => {
      let shouldExit = false;
      let exitReason = '';

      const maxTenure = PLAYLIST_MAX_TENURE_DAYS[plId] || 60;
      const plName = PLAYLIST_DISPLAY_NAMES[plId] || plId;

      // 1. New Music Friday: strictly rotates out after 14 days
      if (plId === 'nmf' && daysSinceRelease > 14) {
        shouldExit = true;
        exitReason = 'Weekly rotation: newer releases replaced track in New Music Friday.';
      }
      // 2. Release Radar: expires after 28 days
      else if (plId === 'release_radar' && daysSinceRelease > 28) {
        shouldExit = true;
        exitReason = 'Follower window completed after 4 weeks of Release Radar spotlight.';
      }
      // 3. Discover Weekly: rotates every 3 weeks unless momentum is exceptionally high
      else if (plId === 'discover_weekly' && (daysSinceRelease > maxTenure && momentum < 1.1)) {
        shouldExit = true;
        exitReason = 'Algorithmic curation cycled new discovery recommendations.';
      }
      // 4. Viral 50: drops out when viral hype fades
      else if (plId === 'v50' && (momentum < 0.85 || daysSinceRelease > 45)) {
        shouldExit = true;
        exitReason = 'Viral momentum cooled down below the Viral 50 threshold.';
      }
      // 5. Today's Top Hits: stays while mega-smash streams continue, but exits if streams drop or after tenure
      else if (plId === 'tth') {
        const isMegaSmash = dailyStreams >= 1500000;
        if (daysSinceRelease > maxTenure && !isMegaSmash) {
          shouldExit = true;
          exitReason = 'Completed premier run on Today\'s Top Hits and rotated out for fresh charting tracks.';
        }
      }
      // 6. Generic Mood & Genre playlists: rotate out after maximum tenure
      else if (daysSinceRelease > maxTenure && momentum < 0.75) {
        shouldExit = true;
        exitReason = `Standard catalog rotation cycled out of ${plName}.`;
      }

      if (shouldExit) {
        events.push({
          songId: song.id,
          songTitle: song.title,
          playlistId: plId,
          playlistName: plName,
          type: 'exit',
          reason: exitReason
        });
      } else {
        remainingPlacements.push(plId);
      }
    });

    if (remainingPlacements.length !== song.playlistPlacements.length) {
      return {
        ...song,
        playlistPlacements: remainingPlacements
      };
    }

    return song;
  });

  return {
    updatedSongs,
    events
  };
}

/**
 * Manually removes a song from a specific playlist (user triggered "Exit Playlist").
 */
export function removeSongFromPlaylist(
  songId: number,
  playlistId: string,
  songs: Song[]
): Song[] {
  return songs.map(song => {
    if (song.id !== songId) return song;
    const current = song.playlistPlacements || [];
    return {
      ...song,
      playlistPlacements: current.filter(p => p !== playlistId)
    };
  });
}

/**
 * Checks whether a track can re-enter a playlist after having previously exited.
 * Re-entry occurs when momentum revives, marketing pushes occur, or viral spikes happen.
 */
export function canSongReEnterPlaylist(
  song: Song,
  playlistId: string
): { eligible: boolean; reason?: string } {
  const current = song.playlistPlacements || [];
  if (current.includes(playlistId)) {
    return { eligible: false, reason: 'Already in playlist' };
  }

  const momentum = song.momentum || 1.0;
  const quality = song.quality || 50;
  const streams = song.dailyStreams || 0;

  if (playlistId === 'tth') {
    if (streams >= 1200000 && momentum >= 1.0) {
      return { eligible: true };
    }
    return { eligible: false, reason: 'Requires >1.2M daily streams and strong momentum for Today\'s Top Hits return.' };
  }

  if (playlistId === 'v50') {
    if (momentum >= 1.25) {
      return { eligible: true };
    }
    return { eligible: false, reason: 'Requires viral surge (momentum >= 1.25).' };
  }

  if (quality >= 50 && momentum >= 0.6) {
    return { eligible: true };
  }

  return { eligible: false, reason: 'Requires catalog momentum revival.' };
}
