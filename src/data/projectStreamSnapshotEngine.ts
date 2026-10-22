// Project Streaming Daily Snapshot Engine
// Computes and formats comprehensive Spotify/Streaming album & single daily snapshots
// matching authentic @the.ch4rt & Spotify Daily Data music industry infographics.

import { Project, Song, GameState } from '../types';

export interface SnapshotTrackItem {
  trackNumber: number;
  id: number;
  title: string;
  isSingle: boolean;
  trackTypeLabel: 'Lead Single' | 'Single' | 'Promo' | 'B-Side';
  dailyStreams: number;
  prevDailyStreams: number;
  change: number;
  changePercent: number;
  totalStreams: number;
  shareOfDaily: number;
  milestoneBadge: string | null;
}

export interface ProjectSnapshotData {
  projectTitle: string;
  artistName: string;
  cover: string;
  projectType: 'single_pack' | 'ep' | 'album' | 'song';
  projectTypeLabel: string;
  releaseYear: number;
  daysSinceRelease: number;
  formattedDate: string;
  dayOfWeek: string;
  fullDateLabel: string;
  dailyStreams: number;
  prevDailyStreams: number;
  change: number;
  changePercent: number;
  totalStreams: number;
  avgDailyPerTrack: number;
  avgTotalPerTrack: number;
  tracks: SnapshotTrackItem[];
}

/**
 * Formats a game date string into "SEPTEMBER 15, 2026 • TUESDAY"
 */
export function formatSnapshotDate(dateInput: Date | string): {
  fullDateLabel: string;
  formattedDate: string;
  dayOfWeek: string;
} {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const safeDate = isNaN(d.getTime()) ? new Date() : d;

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const days = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
  ];

  const month = months[safeDate.getMonth()];
  const day = safeDate.getDate();
  const year = safeDate.getFullYear();
  const dayOfWeek = days[safeDate.getDay()];

  const formattedDate = `${month} ${day}, ${year}`;
  const fullDateLabel = `${formattedDate} • ${dayOfWeek}`;

  return { fullDateLabel, formattedDate, dayOfWeek };
}

/**
 * Formats numbers into clean localized string with commas (e.g. 9,965,134)
 */
export function formatSnapshotNumber(num: number): string {
  return Math.round(num || 0).toLocaleString('en-US');
}

/**
 * Formats stream change with sign (e.g. +18,525 or -2,147)
 */
export function formatStreamChange(change: number): string {
  const rounded = Math.round(change || 0);
  if (rounded > 0) return `+${rounded.toLocaleString('en-US')}`;
  if (rounded < 0) return `-${Math.abs(rounded).toLocaleString('en-US')}`;
  return '0';
}

/**
 * Formats stream percentage change with arrow (e.g. ↑ 3.21% or ↓ 0.98%)
 */
export function formatStreamChangePercent(percent: number): {
  label: string;
  isPositive: boolean;
} {
  const safePct = Number.isFinite(percent) ? percent : 0;
  const isPositive = safePct >= 0;
  const arrow = isPositive ? '↑' : '↓';
  const val = Math.abs(safePct).toFixed(2);
  return {
    label: `${arrow} ${val}%`,
    isPositive
  };
}

function getStreamMilestoneBadge(totalStreams: number): string | null {
  if (totalStreams >= 1_000_000_000) return '1B+';
  if (totalStreams >= 500_000_000) return '500M+';
  if (totalStreams >= 100_000_000) return '100M+';
  if (totalStreams >= 50_000_000) return '50M+';
  if (totalStreams >= 10_000_000) return '10M+';
  if (totalStreams >= 1_000_000) return '1M+';
  return null;
}

/**
 * Calculates complete snapshot data for a project (or standalone song)
 */
export function generateProjectStreamSnapshot(
  item: Project | Song,
  state: GameState
): ProjectSnapshotData {
  const isProj = 'type' in item;
  const artistName = state.artist?.name || 'Artist';
  const { fullDateLabel, formattedDate, dayOfWeek } = formatSnapshotDate(state.date);

  let rawSongs: Song[] = [];
  let cover = '';
  let projectTitle = '';
  let projectType: 'single_pack' | 'ep' | 'album' | 'song' = 'album';
  let projectTypeLabel = 'STUDIO ALBUM';
  let releaseDateStr = state.date;

  if (isProj) {
    const proj = item as Project;
    projectTitle = proj.title;
    cover = proj.cover;
    projectType = proj.type;
    projectTypeLabel =
      proj.type === 'album'
        ? 'STUDIO ALBUM'
        : proj.type === 'ep'
        ? 'EXTENDED PLAY (EP)'
        : 'SINGLE PACK';
    releaseDateStr = proj.releaseDate || state.date;
    // Map with live songs from state to ensure latest streams
    rawSongs = (proj.songs || []).map(ps => {
      const live = state.songs.find(s => s.id === ps.id);
      return live || ps;
    });
  } else {
    const song = item as Song;
    const liveSong = state.songs.find(s => s.id === song.id) || song;
    projectTitle = liveSong.title;
    cover = liveSong.cover;
    projectType = 'song';
    projectTypeLabel = 'OFFICIAL SINGLE';
    releaseDateStr = liveSong.releaseDate || state.date;
    rawSongs = [liveSong];
  }

  const relDateObj = new Date(releaseDateStr);
  const currDateObj = new Date(state.date);
  const releaseYear = !isNaN(relDateObj.getTime())
    ? relDateObj.getFullYear()
    : currDateObj.getFullYear();
  const primarySongDays = rawSongs[0]?.daysSinceRelease;
  const diffDays =
    primarySongDays !== undefined
      ? Math.max(1, primarySongDays + 1)
      : !isNaN(relDateObj.getTime()) && !isNaN(currDateObj.getTime())
      ? Math.max(1, Math.floor((currDateObj.getTime() - relDateObj.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

  // First pass: calculate track metrics
  const preliminaryTracks = rawSongs.map((song, idx) => {
    const daily = song.dailyStreams || 0;
    const isSingle =
      !song.trackType ||
      song.trackType === 'single' ||
      song.trackType === 'lead_single';

    const trackTypeLabel: 'Lead Single' | 'Single' | 'Promo' | 'B-Side' =
      song.trackType === 'lead_single'
        ? 'Lead Single'
        : song.trackType === 'b_side'
        ? 'B-Side'
        : song.trackType === 'promotional_single'
        ? 'Promo'
        : 'Single';

    // Calculate or derive previous daily streams
    let prev = song.prevDailyStreams;
    if (prev === undefined || prev === 0) {
      const seed = (song.id * 17 + song.title.length) % 100;
      const factor = 1 - (seed - 45) / 1000;
      prev = Math.max(0, Math.round(daily * factor));
    }

    const change = daily - prev;
    const changePercent =
      prev > 0 ? (change / prev) * 100 : daily > 0 ? 100 : 0;
    const total = song.streams || 0;

    return {
      trackNumber: idx + 1,
      id: song.id,
      title: song.title,
      isSingle,
      trackTypeLabel,
      dailyStreams: daily,
      prevDailyStreams: prev,
      change,
      changePercent,
      totalStreams: total,
      milestoneBadge: getStreamMilestoneBadge(total)
    };
  });

  // Calculate totals
  const totalDaily = preliminaryTracks.reduce((acc, t) => acc + t.dailyStreams, 0);
  const totalPrev = preliminaryTracks.reduce((acc, t) => acc + t.prevDailyStreams, 0);
  const totalChange = totalDaily - totalPrev;
  const totalChangePercent =
    totalPrev > 0 ? (totalChange / totalPrev) * 100 : totalDaily > 0 ? 100 : 0;
  const totalCumulative = preliminaryTracks.reduce((acc, t) => acc + t.totalStreams, 0);

  const trackCount = Math.max(1, preliminaryTracks.length);
  const avgDailyPerTrack = Math.round(totalDaily / trackCount);
  const avgTotalPerTrack = Math.round(totalCumulative / trackCount);

  const tracks: SnapshotTrackItem[] = preliminaryTracks.map(t => ({
    ...t,
    shareOfDaily: totalDaily > 0 ? (t.dailyStreams / totalDaily) * 100 : 0
  }));

  return {
    projectTitle,
    artistName,
    cover,
    projectType,
    projectTypeLabel,
    releaseYear,
    daysSinceRelease: diffDays,
    formattedDate,
    dayOfWeek,
    fullDateLabel,
    dailyStreams: totalDaily,
    prevDailyStreams: totalPrev,
    change: totalChange,
    changePercent: totalChangePercent,
    totalStreams: totalCumulative,
    avgDailyPerTrack,
    avgTotalPerTrack,
    tracks
  };
}

