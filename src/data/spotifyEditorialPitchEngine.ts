// Spotify Editorial Pitch Engine
// Simulates authentic, highly selective editorial curation for major Spotify playlists
// (Today's Top Hits, RapCaviar, New Music Friday, Pop Rising, Viral 50)
// Resolves user request: Making it substantially harder to get accepted into top playlists,
// even after submitting an official pitch, enforcing strict quality, velocity, genre, and recency requirements.

import { Song } from '../types';
import { SPOTIFY_PLAYLISTS } from '../constants';
import { EXPANDED_SPOTIFY_PLAYLISTS } from './spotifyCatalogExpanded';

export interface EditorialReviewResult {
  accepted: boolean;
  playlistId: string;
  playlistName: string;
  badge: 'accepted' | 'declined' | 'ineligible';
  headline: string;
  editorialFeedback: string;
  addedPosition?: number;
}

/**
 * Evaluates an artist's pitch to a Spotify editorial playlist.
 */
export function evaluateEditorialPitch(
  song: Song,
  playlistId: string,
  artistPopularity: number,
  artistHype: number,
  currentDateStr: string
): EditorialReviewResult {
  const pl = EXPANDED_SPOTIFY_PLAYLISTS.find(p => p.id === playlistId) || SPOTIFY_PLAYLISTS.find(p => p.id === playlistId);
  const playlistName = pl?.name || 'Editorial Playlist';

  // 1. Check if already placed
  if (song.playlistPlacements && song.playlistPlacements.includes(playlistId)) {
    return {
      accepted: false,
      playlistId,
      playlistName,
      badge: 'ineligible',
      headline: 'Already On Playlist',
      editorialFeedback: `"${song.title}" is already rotating on ${playlistName}.`
    };
  }

  // 2. Days elapsed since release
  const songRelease = song.releaseDate ? new Date(song.releaseDate).getTime() : new Date(currentDateStr).getTime();
  const current = new Date(currentDateStr).getTime();
  const daysSinceRelease = Math.max(0, Math.floor((current - songRelease) / (1000 * 60 * 60 * 24)));

  const safeQuality = song.quality || 50;
  const safeDailyStreams = song.dailyStreams || (song.streams ? Math.round(song.streams / 14) : 0);
  const isBSide = song.trackType === 'b_side';
  const genreLower = (song.genre || '').toLowerCase();
  const subgenreLower = (song.subgenre || '').toLowerCase();

  // -------------------------------------------------------------
  // PLAYLIST 1: TODAY'S TOP HITS (The biggest & strictest playlist on earth)
  // -------------------------------------------------------------
  if (playlistId === 'tth') {
    // TTH strictly rejects unpromoted B-sides
    if (isBSide && !song.hasMV) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Declined by Editorial Team',
        editorialFeedback: "Today's Top Hits editors only curate flagship singles. Deep-cut album B-sides are not eligible without an official single campaign or massive viral breakout."
      };
    }

    // High popularity threshold
    if (artistPopularity < 70) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Insufficient Artist Footprint',
        editorialFeedback: `Today's Top Hits curators require a minimum Artist Popularity of 70+ (current: ${artistPopularity.toFixed(0)}). Build broader mainstream awareness before pitching to Spotify's #1 playlist.`
      };
    }

    // High song quality threshold
    if (safeQuality < 80) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Quality Threshold Not Met',
        editorialFeedback: `Curators rated track potential below TTH standards (Track Quality: ${safeQuality}/100, requires 80+). Polish production, mixing, and hooks.`
      };
    }

    // Daily streams traction threshold
    if (safeDailyStreams < 120000 && artistPopularity < 90) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Velocity Too Low',
        editorialFeedback: `Today's Top Hits editors require proven organic momentum (at least 120,000+ daily streams). "${song.title}" currently generates ${safeDailyStreams.toLocaleString()} streams/day.`
      };
    }

    // Highly selective probability roll
    // Even superstars face curated editorial competition:
    let acceptanceScore = (safeQuality * 0.45) + (artistPopularity * 0.35) + (artistHype * 0.20);
    if (song.hasMV) acceptanceScore += 8;
    if (safeDailyStreams > 350000) acceptanceScore += 10;

    // Pass threshold is 84+ score with RNG factor
    const seed = ((song.id * 17) + Math.floor(current / (1000 * 60 * 60 * 24))) % 100;
    const passesCurators = acceptanceScore >= 84 && seed < 65;

    if (!passesCurators) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Editorial Capacity Full',
        editorialFeedback: "Editorial review acknowledged the strong potential, but Today's Top Hits has limited weekly rotation slots. Try pitching to Pop Rising or New Music Friday first to build velocity."
      };
    }

    const assignedRank = Math.floor(Math.random() * 25) + 10; // Placed between #10 - #35
    return {
      accepted: true,
      playlistId,
      playlistName,
      badge: 'accepted',
      headline: 'Pitch Approved by Global Editors!',
      editorialFeedback: `Spotify's Global Curation Team placed "${song.title}" on Today's Top Hits at #${assignedRank}! Expect a major surge in worldwide daily streams.`,
      addedPosition: assignedRank
    };
  }

  // -------------------------------------------------------------
  // PLAYLIST 2: RAPCAVIAR (Hip-Hop's biggest playlist)
  // -------------------------------------------------------------
  if (playlistId === 'rc') {
    const isHipHop = genreLower.includes('rap') || genreLower.includes('hip') || genreLower.includes('trap') ||
                     genreLower.includes('drill') || genreLower.includes('r&b') || subgenreLower.includes('rap') ||
                     subgenreLower.includes('hip') || subgenreLower.includes('trap');

    if (!isHipHop) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Genre Mismatch',
        editorialFeedback: `RapCaviar strictly curates Hip-Hop, Rap, Trap, and Urban releases. Pitch "${song.title}" (${song.genre}) to an appropriate genre-specific playlist.`
      };
    }

    if (artistPopularity < 45) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Street Buzz Needed',
        editorialFeedback: `RapCaviar curators require an established presence (Popularity 45+, current: ${artistPopularity.toFixed(0)}). Grow your fanbase with regional tastemakers first.`
      };
    }

    if (safeQuality < 72) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Declined by Curation Lead',
        editorialFeedback: `Beat production or vocal delivery did not meet RapCaviar benchmark standards (Quality: ${safeQuality}/100, requires 72+).`
      };
    }

    const score = (safeQuality * 0.5) + (artistPopularity * 0.3) + (artistHype * 0.2);
    if (score < 68) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Passed Over for Other Releases',
        editorialFeedback: "Heavy competition in this week's RapCaviar refresh. Keep building momentum and pitch your next release."
      };
    }

    const assignedRank = Math.floor(Math.random() * 20) + 12;
    return {
      accepted: true,
      playlistId,
      playlistName,
      badge: 'accepted',
      headline: 'Added to RapCaviar!',
      editorialFeedback: `RapCaviar lead curator approved "${song.title}" at spot #${assignedRank}! Heavy rotation unlocked across urban streaming.`,
      addedPosition: assignedRank
    };
  }

  // -------------------------------------------------------------
  // PLAYLIST 3: NEW MUSIC FRIDAY (New release launchpad)
  // -------------------------------------------------------------
  if (playlistId === 'nmf') {
    if (daysSinceRelease > 14) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Release Window Expired',
        editorialFeedback: `New Music Friday only accepts tracks within 14 days of launch. "${song.title}" was released ${daysSinceRelease} days ago.`
      };
    }

    if (safeQuality < 68) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Declined by Friday Editorial Board',
        editorialFeedback: `Song production quality (${safeQuality}/100) fell short of the 68+ benchmark required for the global New Music Friday roundup.`
      };
    }

    if (artistPopularity < 15) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Artist Profile Too Early',
        editorialFeedback: `New Music Friday requires a baseline verified artist footprint (Popularity 15+). Release more singles to build history.`
      };
    }

    const assignedRank = Math.floor(Math.random() * 30) + 5;
    return {
      accepted: true,
      playlistId,
      playlistName,
      badge: 'accepted',
      headline: 'Selected for New Music Friday!',
      editorialFeedback: `"${song.title}" was handpicked by Spotify's editorial board for this week's New Music Friday playlist (#${assignedRank})!`,
      addedPosition: assignedRank
    };
  }

  // -------------------------------------------------------------
  // PLAYLIST 4: POP RISING (Emerging pop smashes)
  // -------------------------------------------------------------
  if (playlistId === 'pr') {
    const isPop = genreLower.includes('pop') || genreLower.includes('dance') || genreLower.includes('electronic') ||
                  genreLower.includes('indie') || subgenreLower.includes('pop') || subgenreLower.includes('dance');

    if (!isPop) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Genre Mismatch',
        editorialFeedback: `Pop Rising focuses on Pop, Dance, and crossover hits. "${song.title}" is tagged as ${song.genre}.`
      };
    }

    if (safeQuality < 70) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Quality Requirement Not Met',
        editorialFeedback: `Pop Rising requires a 70+ track quality score (current: ${safeQuality}/100). Focus on stronger hooks.`
      };
    }

    if (artistPopularity < 25) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Popularity Too Low',
        editorialFeedback: `Pop Rising curators seek tracks from artists with at least 25+ Popularity (current: ${artistPopularity.toFixed(0)}).`
      };
    }

    const assignedRank = Math.floor(Math.random() * 25) + 8;
    return {
      accepted: true,
      playlistId,
      playlistName,
      badge: 'accepted',
      headline: 'Added to Pop Rising!',
      editorialFeedback: `Curators loved the track! "${song.title}" is now spinning on Pop Rising at #${assignedRank}.`,
      addedPosition: assignedRank
    };
  }

  // -------------------------------------------------------------
  // PLAYLIST 5: VIRAL 50 - GLOBAL (Algorithm & Trend Driven)
  // -------------------------------------------------------------
  if (playlistId === 'v50') {
    const momentum = song.momentum || 1.0;
    const hasViralSpike = momentum >= 1.25 || artistHype >= 40 || (song.dailyViews || 0) > 40000;

    if (!hasViralSpike) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Insufficient Viral Velocity',
        editorialFeedback: `Viral 50 tracking algorithms detect trends from rapid sharing and velocity surges. "${song.title}" currently lacks high momentum (requires momentum 1.25+ or Hype 40+). Run marketing campaigns or release a Music Video.`
      };
    }

    if (safeQuality < 60) {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Quality Check Failed',
        editorialFeedback: "Viral retention algorithms indicate listeners are skipping after the preview. Quality must be at least 60+."
      };
    }

    const assignedRank = Math.floor(Math.random() * 30) + 15;
    return {
      accepted: true,
      playlistId,
      playlistName,
      badge: 'accepted',
      headline: 'Trending on Viral 50 Global!',
      editorialFeedback: `Strong sharing velocity triggered Viral 50 entry at #${assignedRank}! Listeners are sharing "${song.title}" across social media.`,
      addedPosition: assignedRank
    };
  }

  // -------------------------------------------------------------
  // MOOD & VIBE PLAYLISTS (Chill Vibes, Workout Energy, Late Night, Feel-Good, Sad Hour)
  // -------------------------------------------------------------
  if (['chill_vibes', 'workout_energy', 'late_night', 'feel_good', 'sad_hour', 'release_radar', 'discover_weekly'].includes(playlistId)) {
    if (safeQuality >= 58) {
      const assignedRank = Math.floor(Math.random() * 25) + 5;
      return {
        accepted: true,
        playlistId,
        playlistName,
        badge: 'accepted',
        headline: `Added to ${playlistName}!`,
        editorialFeedback: `Spotify curators accepted "${song.title}" for its sonic fit, musicality, and strong listener resonance at #${assignedRank}.`,
        addedPosition: assignedRank
      };
    } else {
      return {
        accepted: false,
        playlistId,
        playlistName,
        badge: 'declined',
        headline: 'Tone & Quality Misalignment',
        editorialFeedback: `The editorial team for ${playlistName} enjoyed the track, but required higher overall recording quality (minimum 58+).`
      };
    }
  }

  // Generic fallback
  return {
    accepted: false,
    playlistId,
    playlistName,
    badge: 'declined',
    headline: 'Curator Review Completed',
    editorialFeedback: "Song was reviewed by Spotify editorial staff but not selected for this rotation cycle."
  };
}
