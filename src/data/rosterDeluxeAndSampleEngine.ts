// Dedicated Roster Deluxe Editions, Mixtapes, Remasters & Sample Clearance Engine
// Bridges the full Player Deluxe/Mixtape/Remaster/Compilation & Sample Clearance/Legal Dispute
// systems to Signed Roster Artists & Official Groups without mutating unrelated systems.

import type { GameState, Project, Song } from '../types';
import type { ImprintSignedArtist } from './recordLabelSystemEngine';
import {
  SampleLegalSystemState,
  SongSampleInfo,
  processDailySampleClearanceAndLawsuitsStep
} from './sampleClearanceAndLegalEngine';
import type { XPost } from './xSocialEngine';

export interface RosterStudioSpecialCounts {
  eligibleParentAlbumsCount: number;
  specialEditionsCount: number;
  sampledTracksCount: number;
  unclearedSamplesCount: number;
  activeLawsuitsCount: number;
}

/**
 * Ensures a signed Roster Artist or Group has a valid SampleLegalSystemState object.
 */
export function getEnsuredRosterSampleLegalState(
  artist: ImprintSignedArtist
): SampleLegalSystemState {
  const existing = (artist as any)?.sampleLegalState as SampleLegalSystemState | undefined;
  if (existing && existing.initialized && Array.isArray(existing.activeDisputes)) {
    return existing;
  }
  return {
    initialized: true,
    activeDisputes: [],
    resolvedDisputesCount: 0,
    totalSettlementsPaid: 0,
    totalSampleRoyaltiesPaid: 0,
    sampleRoyaltiesPaidToday: 0
  };
}

/**
 * Computes badge counts for Deluxe & Mixtapes and Sample & Legal cards in the Roster Studio.
 */
export function getRosterStudioSpecialCounts(
  artist: ImprintSignedArtist
): RosterStudioSpecialCounts {
  const songs: Song[] = Array.isArray(artist.songs) ? artist.songs : [];
  const projects: Project[] = Array.isArray(artist.projects) ? artist.projects : [];
  const legalState = getEnsuredRosterSampleLegalState(artist);

  const eligibleParentAlbumsCount = projects.filter(
    p => p.status === 'released' && (p.type === 'album' || p.type === 'ep')
  ).length;

  const specialEditionsCount = projects.filter(p =>
    ['deluxe', 'mixtape', 'remaster', 'compilation'].includes(String(p.type))
  ).length;

  const sampledTracksCount = songs.filter(s => {
    const info = (s as any).sampleInfo as SongSampleInfo | undefined;
    return Boolean(info && info.tier !== 'none');
  }).length;

  const unclearedSamplesCount = songs.filter(s => {
    const info = (s as any).sampleInfo as SongSampleInfo | undefined;
    return info?.clearanceStatus === 'uncleared';
  }).length;

  return {
    eligibleParentAlbumsCount,
    specialEditionsCount,
    sampledTracksCount,
    unclearedSamplesCount,
    activeLawsuitsCount: legalState.activeDisputes.length
  };
}

/**
 * Processes daily sample publishing royalty splits and uncleared sample copyright lawsuit checks
 * for a signed Roster Artist or Group during their daily simulation step.
 */
export function processDailyRosterSampleAndEditionStep(params: {
  state: GameState;
  artist: ImprintSignedArtist;
  songs: Song[];
  projects: Project[];
  grossRevenueToday: number;
  dateStr: string;
}): {
  updatedSongs: Song[];
  updatedProjects: Project[];
  updatedSampleLegalState: SampleLegalSystemState;
  sampleRoyaltyDeductedToday: number;
  newXPosts: XPost[];
} {
  const { state, artist, songs, projects, grossRevenueToday, dateStr } = params;
  const stageName = artist.stageName || artist.name;
  const currentLegalState = getEnsuredRosterSampleLegalState(artist);

  const proxyStateForSamples: GameState = {
    ...state,
    date: dateStr,
    artist: {
      name: stageName,
      country: artist.country || state.artist?.country || 'US',
      image: artist.avatarUrl || (artist as any).avatar || '',
      avatar: artist.avatarUrl || (artist as any).avatar || '',
      tier: (artist.popularity ?? 35) >= 75 ? 2 : (artist.popularity ?? 35) >= 45 ? 1 : 3,
      startYear: 2026
    },
    songs,
    projects,
    sampleLegalState: currentLegalState
  } as any;

  const sampleStep = processDailySampleClearanceAndLawsuitsStep(
    proxyStateForSamples,
    grossRevenueToday
  );

  const updatedSongMap = new Map<number, Song>();
  sampleStep.updatedSongs.forEach(s => updatedSongMap.set(s.id, s));

  const updatedProjects = projects.map(p => ({
    ...p,
    songs: (p.songs || []).map(ps => {
      const match = updatedSongMap.get(ps.id);
      return match ? { ...match } : ps;
    })
  }));

  return {
    updatedSongs: sampleStep.updatedSongs,
    updatedProjects,
    updatedSampleLegalState: sampleStep.updatedLegalState,
    sampleRoyaltyDeductedToday: sampleStep.totalSampleRoyaltyDeductedToday,
    newXPosts: sampleStep.newXPosts
  };
}
