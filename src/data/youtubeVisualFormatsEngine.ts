// YouTube Visual Formats Engine (Official Audio Visualizer & Official Lyric Video System)
// Separate module managing production, visual aesthetic styles, and independent daily/total view
// velocity curves for Official Audio Visualizers and Official Lyric Videos on YouTube.

import { GameState, Song } from '../types';

export type YouTubeExtraVisualType = 'visualizer' | 'lyric_video';

export interface VisualFormatStyleOption {
  id: string;
  formatType: YouTubeExtraVisualType;
  name: string;
  badge: string;
  cost: number;
  viewMultiplier: number; // Relative to base format velocity
  hypeBoost: number;
  streamDiscoveryBonus: number;
  description: string;
}

export const YOUTUBE_VISUAL_STYLE_OPTIONS: VisualFormatStyleOption[] = [
  // Official Audio Visualizer Styles
  {
    id: 'vis_vinyl_loop',
    formatType: 'visualizer',
    name: 'Spinning Vinyl & Aura Loop',
    badge: 'STANDARD VISUALIZER',
    cost: 1500,
    viewMultiplier: 1.0,
    hypeBoost: 1.5,
    streamDiscoveryBonus: 0.05,
    description: 'Minimalist looping vinyl record and atmospheric color-graded studio lighting.'
  },
  {
    id: 'vis_vhs_retro',
    formatType: 'visualizer',
    name: 'VHS Camcorder & Behind-The-Scenes',
    badge: 'AESTHETIC CUT',
    cost: 2800,
    viewMultiplier: 1.22,
    hypeBoost: 2.2,
    streamDiscoveryBonus: 0.07,
    description: 'Lo-fi 90s camcorder grain, studio session snippets, and moody candid b-roll.'
  },
  {
    id: 'vis_3d_cgi',
    formatType: 'visualizer',
    name: '3D Unreal Engine World Loop',
    badge: 'HIGH-CONCEPT 3D',
    cost: 4800,
    viewMultiplier: 1.48,
    hypeBoost: 3.2,
    streamDiscoveryBonus: 0.10,
    description: 'Futuristic 3D CGI environment reactive to bass and vocal stems in 4K.'
  },

  // Official Lyric Video Styles
  {
    id: 'lyr_kinetic_type',
    formatType: 'lyric_video',
    name: 'Kinetic Typography & Neon Cut',
    badge: 'KINETIC LYRICS',
    cost: 2500,
    viewMultiplier: 1.0,
    hypeBoost: 2.0,
    streamDiscoveryBonus: 0.07,
    description: 'Fast-paced editorial typography synced to every syllable and beat drop.'
  },
  {
    id: 'lyr_scrapbook_zine',
    formatType: 'lyric_video',
    name: 'Handwritten Scrapbook & Polaroid',
    badge: 'FAN FAVORITE',
    cost: 4200,
    viewMultiplier: 1.28,
    hypeBoost: 3.0,
    streamDiscoveryBonus: 0.10,
    description: 'Stop-motion notebook pages, torn magazine letters, and intimate lyric annotations.'
  },
  {
    id: 'lyr_anime_motion',
    formatType: 'lyric_video',
    name: 'Illustrated Motion Comic Lyrics',
    badge: 'PREMIERE LYRIC VIDEO',
    cost: 7000,
    viewMultiplier: 1.55,
    hypeBoost: 4.2,
    streamDiscoveryBonus: 0.14,
    description: 'Custom 2D illustrated storyboards with cinematic camera pans and glowing subtitles.'
  }
];

export function getVisualStyleById(styleId?: string): VisualFormatStyleOption | undefined {
  if (!styleId) return undefined;
  return YOUTUBE_VISUAL_STYLE_OPTIONS.find(s => s.id === styleId);
}

/**
 * Computes daily views & likes for a song's Official Visualizer and Official Lyric Video.
 * Views are intentionally distinct from (and lower than) a flagship Official Music Video (MV):
 * - Official MV: 100% visual flagship velocity (often 0.65x - 1.35x of daily streams)
 * - Official Lyric Video: ~38% - 54% of MV velocity (strong early fan replay while learning lyrics)
 * - Official Visualizer: ~22% - 34% of MV velocity (steady ambient & album-track YouTube listening)
 */
export function calculateDailyVisualizerAndLyricViews(params: {
  song: Song;
  dailyStreams: number;
  artistPopularity: number;
  artistHype: number;
  daysSinceRelease: number;
}): {
  dailyVisualizerViews: number;
  dailyLyricVideoViews: number;
  newVisualizerLikes: number;
  newLyricVideoLikes: number;
} {
  const { song, dailyStreams, artistPopularity, artistHype, daysSinceRelease } = params;

  const qualityFactor = Math.pow(Math.max(30, song.quality || 65) / 75, 1.35);
  const popFactor = 0.65 + (Math.max(1, artistPopularity) / 100) * 0.75;
  const hypeFactor = 0.85 + (Math.max(1, artistHype) / 100) * 0.45;

  // 1. Official Audio Visualizer Daily Views
  let dailyVisualizerViews = 0;
  let newVisualizerLikes = 0;
  if (song.hasVisualizer) {
    const visStyle = getVisualStyleById(song.visualizerStyle) || YOUTUBE_VISUAL_STYLE_OPTIONS[0];
    // Visualizer peaks in Week 1-2 then settles into steady ambient listening
    const visAgeCurve =
      daysSinceRelease <= 7
        ? 1.25 - daysSinceRelease * 0.03
        : daysSinceRelease <= 30
        ? 1.04 - (daysSinceRelease - 7) * 0.018
        : Math.max(0.16, 0.62 * Math.pow(0.985, daysSinceRelease - 30));

    // Base visualizer ratio is ~16% - 24% of daily audio streams (distinct from MV!)
    const rawVis =
      (dailyStreams * 0.17 + Math.pow(Math.max(10, artistPopularity), 1.65) * 18) *
      qualityFactor *
      popFactor *
      visStyle.viewMultiplier *
      visAgeCurve;

    const jitter = 0.91 + (((song.id * 17 + daysSinceRelease * 13) % 19) / 100);
    dailyVisualizerViews = Math.max(25, Math.round(rawVis * jitter));
    newVisualizerLikes = Math.max(2, Math.round(dailyVisualizerViews * 0.038));
  }

  // 2. Official Lyric Video Daily Views
  let dailyLyricVideoViews = 0;
  let newLyricVideoLikes = 0;
  if (song.hasLyricVideo) {
    const lyrStyle = getVisualStyleById(song.lyricVideoStyle) || YOUTUBE_VISUAL_STYLE_OPTIONS[3];
    // Lyric videos have a stronger initial surge in Weeks 1-3 while fans search for lyrics
    const lyrAgeCurve =
      daysSinceRelease <= 10
        ? 1.42 - daysSinceRelease * 0.025
        : daysSinceRelease <= 35
        ? 1.17 - (daysSinceRelease - 10) * 0.022
        : Math.max(0.20, 0.62 * Math.pow(0.986, daysSinceRelease - 35));

    // Base lyric video ratio is ~28% - 38% of daily audio streams (higher than Visualizer, lower than full MV)
    const rawLyr =
      (dailyStreams * 0.28 + Math.pow(Math.max(10, artistPopularity), 1.72) * 26) *
      qualityFactor *
      popFactor *
      hypeFactor *
      lyrStyle.viewMultiplier *
      lyrAgeCurve;

    const jitter = 0.90 + (((song.id * 23 + daysSinceRelease * 19) % 21) / 100);
    dailyLyricVideoViews = Math.max(45, Math.round(rawLyr * jitter));
    newLyricVideoLikes = Math.max(4, Math.round(dailyLyricVideoViews * 0.046));
  }

  return {
    dailyVisualizerViews,
    dailyLyricVideoViews,
    newVisualizerLikes,
    newLyricVideoLikes
  };
}

/**
/**
 * Produces and releases an Official Visualizer or Official Lyric Video for a song.
 * If customThumbnail is omitted or empty, defaults to the song's cover art (s.cover).
 */
export function produceYouTubeExtraVisual(
  state: GameState,
  songId: number,
  styleId: string,
  customThumbnail?: string | null
): {
  updatedState: GameState;
  success: boolean;
  message: string;
} {
  const style = getVisualStyleById(styleId);
  if (!style) {
    return {
      updatedState: state,
      success: false,
      message: 'Selected visual format was not found.'
    };
  }

  const song = (state.songs || []).find(s => s.id === songId);
  if (!song) {
    return {
      updatedState: state,
      success: false,
      message: 'Selected track was not found.'
    };
  }

  if (style.formatType === 'visualizer' && song.hasVisualizer) {
    return {
      updatedState: state,
      success: false,
      message: `"${song.title}" already has an Official Audio Visualizer on YouTube.`
    };
  }

  if (style.formatType === 'lyric_video' && song.hasLyricVideo) {
    return {
      updatedState: state,
      success: false,
      message: `"${song.title}" already has an Official Lyric Video on YouTube.`
    };
  }

  if ((state.money || 0) < style.cost) {
    return {
      updatedState: state,
      success: false,
      message: `Insufficient funds. You need $${style.cost.toLocaleString()} to produce ${style.name}.`
    };
  }

  // Initial premiere day views (only if song is already released)
  const isReleased = song.status === 'released';
  const pop = Math.max(5, state.popularity || 10);
  const hype = Math.max(10, state.hype || 15);
  const premiereSeedViews = isReleased
    ? Math.round(
        (style.formatType === 'lyric_video' ? 18_500 : 11_200) *
          style.viewMultiplier *
          (0.6 + pop / 45) *
          (0.7 + hype / 60)
      )
    : 0;

  const updatedSongs = (state.songs || []).map(s => {
    if (s.id !== songId) return s;
    const resolvedThumb =
      customThumbnail && customThumbnail.trim() !== '' ? customThumbnail : s.cover;
    if (style.formatType === 'visualizer') {
      return {
        ...s,
        hasVisualizer: true,
        visualizerStyle: style.id,
        visualizerThumbnail: resolvedThumb,
        visualizerViews: (s.visualizerViews || 0) + premiereSeedViews,
        dailyVisualizerViews: premiereSeedViews,
        visualizerLikes: Math.round(premiereSeedViews * 0.052),
        visualizerReleaseDate: state.date,
        momentum: Math.min(2.5, (s.momentum || 1.0) + 0.06)
      };
    } else {
      return {
        ...s,
        hasLyricVideo: true,
        lyricVideoStyle: style.id,
        lyricVideoThumbnail: resolvedThumb,
        lyricVideoViews: (s.lyricVideoViews || 0) + premiereSeedViews,
        dailyLyricVideoViews: premiereSeedViews,
        lyricVideoLikes: Math.round(premiereSeedViews * 0.062),
        lyricVideoReleaseDate: state.date,
        momentum: Math.min(2.5, (s.momentum || 1.0) + 0.09)
      };
    }
  });

  // Also sync inside projects if track belongs to a project
  const updatedProjects = (state.projects || []).map(proj => ({
    ...proj,
    songs: (proj.songs || []).map(ps => {
      const match = updatedSongs.find(us => us.id === ps.id);
      return match ? { ...ps, ...match } : ps;
    })
  }));

  const formatLabel =
    style.formatType === 'visualizer' ? 'Official Audio Visualizer' : 'Official Lyric Video';

  const nextState: GameState = {
    ...state,
    money: (state.money || 0) - style.cost,
    hype: Math.min(100, Number(((state.hype || 10) + style.hypeBoost).toFixed(1))),
    youtube: {
      ...state.youtube,
      subs: (state.youtube?.subs || 0) + Math.round(premiereSeedViews * 0.015)
    },
    songs: updatedSongs,
    projects: updatedProjects
  };

  return {
    updatedState: nextState,
    success: true,
    message: isReleased
      ? `${formatLabel} (${style.name}) for "${song.title}" is now live on YouTube! Premiere earned ${premiereSeedViews.toLocaleString()} views & +${style.hypeBoost}% Hype.`
      : `${formatLabel} (${style.name}) for "${song.title}" has been produced and will premiere automatically when the song drops!`
  };
}

