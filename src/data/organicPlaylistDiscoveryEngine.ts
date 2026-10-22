// Organic Spotify Playlist Discovery Engine
// Mirrors real-world Spotify curation:
// Even if the artist NEVER manually pitches a song, Spotify's automated algorithms
// and human editorial team organically pick up songs based on:
// 1. Release Radar (Automatic for all newly released songs during week 1)
// 2. Discover Weekly & Radio (Organic algorithmic pick-up after week 1)
// 3. Mood & Vibe Playlists (Chill Vibes, Workout Energy, Late Night, Feel-Good, Sad Hour) based on quality & tone
// 4. Flagship Editorial Pickups (Pop Rising, RapCaviar, Viral 50, Today's Top Hits) when streaming momentum surges

import { Song, GameState } from '../types';

export interface OrganicPlacementResult {
  songId: number;
  songTitle: string;
  playlistId: string;
  playlistName: string;
  reason: string;
}

/**
 * Evaluates all released player songs daily for organic Spotify playlist pickups.
 * Returns updated songs with new playlist placements plus a list of any newly gained placements.
 */
export function evaluateDailyOrganicPlaylistPickups(
  songs: Song[],
  artistPopularity: number,
  artistHype: number,
  currentDate: Date
): { updatedSongs: Song[]; newPlacements: OrganicPlacementResult[] } {
  const newPlacements: OrganicPlacementResult[] = [];

  const updatedSongs = songs.map(song => {
    if (song.status !== 'released') return song;

    const currentPlacements = new Set(song.playlistPlacements || []);
    const initialCount = currentPlacements.size;

    const releaseDate = song.releaseDate ? new Date(song.releaseDate) : currentDate;
    const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)));
    const quality = song.quality || 50;
    const momentum = song.momentum || 1.0;
    const dailyStreams = song.dailyStreams || 0;

    // 1. Automatic "Release Radar" for newly released songs (Day 0 - Day 21)
    if (daysSinceRelease <= 21 && !currentPlacements.has('release_radar')) {
      currentPlacements.add('release_radar');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'release_radar',
        playlistName: 'Release Radar',
        reason: 'Automatically pushed to all followers and active listeners upon release.'
      });
    }

    // 2. Algorithmic "Discover Weekly" after week 1 if quality >= 52
    if (daysSinceRelease >= 7 && daysSinceRelease <= 90 && quality >= 52 && !currentPlacements.has('discover_weekly')) {
      // 35% weekly discovery probability
      const hash = (song.id * 31 + currentDate.getDate()) % 100;
      if (hash < 40) {
        currentPlacements.add('discover_weekly');
        newPlacements.push({
          songId: song.id,
          songTitle: song.title,
          playlistId: 'discover_weekly',
          playlistName: 'Discover Weekly',
          reason: 'Algorithmic curation recommended this track to personalized listener feeds.'
        });
      }
    }

    // 3. Organic Mood Curation:
    // Spotify editors curate tracks that fit specific moods
    const trackHash = (song.id * 17 + song.title.length * 23) % 5;

    // A. Chill Vibes (Melodic, smooth quality cuts)
    if (quality >= 60 && !currentPlacements.has('chill_vibes') && (trackHash === 0 || trackHash === 1)) {
      currentPlacements.add('chill_vibes');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'chill_vibes',
        playlistName: 'Chill Vibes',
        reason: 'Added organically by Spotify editorial team for smooth mellow curation.'
      });
    }

    // B. Workout Energy (High momentum or hype tracks)
    if ((artistHype >= 35 || quality >= 70) && !currentPlacements.has('workout_energy') && trackHash === 2) {
      currentPlacements.add('workout_energy');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'workout_energy',
        playlistName: 'Workout Energy',
        reason: 'Selected by Spotify fitness curators for peak gym playlisting.'
      });
    }

    // C. Late Night Drive (Atmospheric tracks)
    if (quality >= 62 && !currentPlacements.has('late_night') && trackHash === 3) {
      currentPlacements.add('late_night');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'late_night',
        playlistName: 'Late Night Drive',
        reason: 'Curated into Spotify nocturnal listening rotation.'
      });
    }

    // D. Feel-Good Indie or Sad Hour
    if (quality >= 65 && !currentPlacements.has('feel_good') && !currentPlacements.has('sad_hour') && trackHash === 4) {
      const isFeelGood = song.id % 2 === 0;
      const targetPl = isFeelGood ? 'feel_good' : 'sad_hour';
      const plName = isFeelGood ? 'Feel-Good Indie' : 'Sad Hour';
      currentPlacements.add(targetPl);
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: targetPl,
        playlistName: plName,
        reason: `Added organically to Spotify's ${plName} editorial shelf.`
      });
    }

    // 4. Breakout Editorial Promotion:
    // If a track is performing well (streaming velocity, rising popularity), Spotify editorial
    // organically promotes it to flagship lists even without a pitch!
    
    // Pop Rising (Rising songs with healthy momentum)
    if (momentum >= 0.75 && dailyStreams >= 80000 && !currentPlacements.has('pr')) {
      currentPlacements.add('pr');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'pr',
        playlistName: 'Pop Rising',
        reason: 'Spotted by Spotify talent scouts as a fast-rising commercial breakthrough.'
      });
    }

    // Viral 50 - Global (High organic sharing / TikTok buzz)
    if ((artistHype >= 55 || momentum >= 0.88) && dailyStreams >= 120000 && !currentPlacements.has('v50')) {
      currentPlacements.add('v50');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'v50',
        playlistName: 'Viral 50 - Global',
        reason: 'Rapid social media engagement propelled this track onto the Global Viral chart.'
      });
    }

    // Today's Top Hits (The Holy Grail - organically given to true smashes)
    if (dailyStreams >= 450000 && (artistPopularity >= 50 || momentum >= 0.90) && !currentPlacements.has('tth')) {
      currentPlacements.add('tth');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'tth',
        playlistName: "Today's Top Hits",
        reason: 'Unstoppable streaming numbers earned this track flagship placement on TTH!'
      });
    }

    if (currentPlacements.size > initialCount) {
      return {
        ...song,
        playlistPlacements: Array.from(currentPlacements)
      };
    }

    return song;
  });

  return { updatedSongs, newPlacements };
}
