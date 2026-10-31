// Roster Artist Lifecycle, Contract Expiration ("Former Roster"), & NPC Name Deduplication Engine
// 1. Suppresses any NPC from REAL_WORLD_NPCS, DETAILED_NPCS, and NPCS whose name matches the Player OR any Active/Former Roster Artist.
// 2. Restores the original NPC automatically if the Former Roster Artist is deleted in Settings.
// 3. Handles Contract Expiration: when a Roster Artist's contract ends and is not renewed, they become a
//    Former Roster Artist — their existing catalog keeps streaming and charting passively, but they stop releasing new music.

import { GameState } from '../types';
import { NPCS } from '../constants';
import { REAL_WORLD_NPCS, RealWorldArtist, normalizeRealArtistName } from './realWorldArtistCatalog';
import { DETAILED_NPCS, DetailedNPC } from './npcAssets';
import { ImprintSignedArtist } from './recordLabelSystemEngine';
import { getRosterTrustAndHiatusInfo } from './rosterTrustHiatusPayrollEngine';

const MASTER_REAL_WORLD_NPCS_SNAPSHOT: RealWorldArtist[] = REAL_WORLD_NPCS.map(npc => ({
  ...npc,
  songs: (npc.songs || []).map(s => ({ ...s })),
  albums: (npc.albums || []).map(a => ({
    ...a,
    tracks: (a.tracks || []).map(t => ({ ...t }))
  }))
}));

const MASTER_DETAILED_NPCS_SNAPSHOT: DetailedNPC[] = DETAILED_NPCS.map(npc => ({
  ...npc,
  songs: (npc.songs || []).map(s => ({ ...s })),
  albums: (npc.albums || []).map(a => ({
    ...a,
    tracks: (a.tracks || []).map(t => ({ ...t }))
  }))
}));

const MASTER_CONSTANTS_NPCS_SNAPSHOT = NPCS.map(npc => ({ ...npc }));

let lastDedupSignature = '__UNINITIALIZED__';

export function normalizeArtistComparisonKey(name?: string | null): string {
  if (!name) return '';
  return normalizeRealArtistName(String(name))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isMatchingArtistName(nameA?: string | null, nameB?: string | null): boolean {
  const normA = normalizeArtistComparisonKey(nameA);
  const normB = normalizeArtistComparisonKey(nameB);
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Collects all reserved artist names (Player + all Active & Former Roster Artists that have not been deleted).
 */
export function getReservedPlayerAndRosterNames(
  playerName?: string | null,
  rosterArtists?: ImprintSignedArtist[] | null
): string[] {
  const names: string[] = [];
  if (playerName && String(playerName).trim()) {
    names.push(String(playerName).trim());
  }
  if (Array.isArray(rosterArtists)) {
    rosterArtists.forEach(art => {
      if (!art) return;
      if (art.stageName && String(art.stageName).trim()) {
        names.push(String(art.stageName).trim());
      }
      if (art.name && String(art.name).trim()) {
        names.push(String(art.name).trim());
      }
    });
  }
  return names;
}

export function isNpcSuppressedByPlayerOrRoster(
  npcName?: string | null,
  playerName?: string | null,
  rosterArtists?: ImprintSignedArtist[] | null
): boolean {
  const normNpc = normalizeArtistComparisonKey(npcName);
  if (!normNpc) return false;
  const reserved = getReservedPlayerAndRosterNames(playerName, rosterArtists);
  return reserved.some(r => normalizeArtistComparisonKey(r) === normNpc);
}

/**
 * Synchronizes REAL_WORLD_NPCS, DETAILED_NPCS, and NPCS in-place:
 * - Removes any NPC matching the Player's name OR any Active/Former Roster Artist's name.
 * - Restores any previously removed NPC as soon as a Former Roster Artist with that name is deleted in Settings!
 */
export function syncWorldNpcDeduplicationWithRoster(
  playerName?: string | null,
  rosterArtists?: ImprintSignedArtist[] | null
): { suppressedNpcNames: string[] } {
  const reservedNormSet = new Set(
    getReservedPlayerAndRosterNames(playerName, rosterArtists)
      .map(n => normalizeArtistComparisonKey(n))
      .filter(Boolean)
  );

  const signature = Array.from(reservedNormSet).sort().join('||');
  if (signature === lastDedupSignature) {
    const currentSuppressed = MASTER_REAL_WORLD_NPCS_SNAPSHOT.filter(npc =>
      reservedNormSet.has(normalizeArtistComparisonKey(npc.name))
    ).map(n => n.name);
    return { suppressedNpcNames: currentSuppressed };
  }

  lastDedupSignature = signature;
  const suppressedNpcNames: string[] = [];

  // 1. Rebuild REAL_WORLD_NPCS in-place while preserving live song/album progress on non-suppressed NPCs
  const liveRealMap = new Map<string, RealWorldArtist>();
  REAL_WORLD_NPCS.forEach(npc => {
    liveRealMap.set(npc.id, npc);
  });

  const nextRealWorldNpcs: RealWorldArtist[] = [];
  for (const masterNpc of MASTER_REAL_WORLD_NPCS_SNAPSHOT) {
    const norm = normalizeArtistComparisonKey(masterNpc.name);
    if (reservedNormSet.has(norm)) {
      suppressedNpcNames.push(masterNpc.name);
      continue;
    }
    const existingLive = liveRealMap.get(masterNpc.id);
    nextRealWorldNpcs.push(existingLive || masterNpc);
  }
  REAL_WORLD_NPCS.splice(0, REAL_WORLD_NPCS.length, ...nextRealWorldNpcs);

  // 2. Rebuild DETAILED_NPCS in-place
  const liveDetailedMap = new Map<string, DetailedNPC>();
  DETAILED_NPCS.forEach(npc => {
    liveDetailedMap.set(npc.id, npc);
  });

  const nextDetailedNpcs: DetailedNPC[] = [];
  for (const masterDet of MASTER_DETAILED_NPCS_SNAPSHOT) {
    const norm = normalizeArtistComparisonKey(masterDet.name);
    if (reservedNormSet.has(norm)) {
      continue;
    }
    const existingLive = liveDetailedMap.get(masterDet.id);
    nextDetailedNpcs.push(existingLive || masterDet);
  }
  DETAILED_NPCS.splice(0, DETAILED_NPCS.length, ...nextDetailedNpcs);

  // 3. Rebuild NPCS in-place
  const nextConstantsNpcs = MASTER_CONSTANTS_NPCS_SNAPSHOT.filter(
    npc => !reservedNormSet.has(normalizeArtistComparisonKey(npc.name))
  );
  NPCS.splice(0, NPCS.length, ...nextConstantsNpcs);

  return { suppressedNpcNames };
}

/**
 * Checks if a Roster Artist's contract has expired (`daysRemaining <= 0` or `isFormerRoster === true`).
 */
export function isRosterArtistContractExpired(artist: ImprintSignedArtist): boolean {
  if (!artist) return false;
  return Boolean((artist as any).isFormerRoster || (artist as any).contractExpired || (artist.daysRemaining ?? 1) <= 0);
}

/**
 * Evaluates whether an expired Roster Artist is willing to renew their contract with the player's label.
 * Driven directly by the Roster Artist's Label Trust Bar (`labelTrust: 0-100`).
 */
export function isRosterArtistWillingToRenew(artist: ImprintSignedArtist): boolean {
  if (!artist) return false;
  const info = getRosterTrustAndHiatusInfo(artist);
  return info.willingToRenew;
}

/**
 * Returns all Former / Contract-Expired Roster Artists from the game state.
 */
export function getFormerAndExpiredRosterArtists(state: GameState): Array<{
  artist: ImprintSignedArtist;
  willingToRenew: boolean;
  replacesRealNpcName: string | null;
}> {
  const signedRoster: ImprintSignedArtist[] =
    state?.recordLabelState?.imprint?.signedRoster || [];

  return signedRoster
    .filter(art => isRosterArtistContractExpired(art))
    .map(art => {
      const stageOrName = art.stageName || art.name;
      const norm = normalizeArtistComparisonKey(stageOrName);
      const matchedNpc = MASTER_REAL_WORLD_NPCS_SNAPSHOT.find(
        n => normalizeArtistComparisonKey(n.name) === norm
      );
      return {
        artist: art,
        willingToRenew: isRosterArtistWillingToRenew(art),
        replacesRealNpcName: matchedNpc ? matchedNpc.name : null
      };
    });
}

/**
 * Renews an expired (or expiring) Roster Artist's contract, reactivating their active career under the Player's label.
 */
export function renewRosterArtistContract(
  state: GameState,
  artistId: string,
  options?: {
    termYears?: number;
    labelRoyaltySplit?: number;
    advancePaid?: number;
    albumsQuota?: number;
  }
): { nextState: GameState; success: boolean; message: string } {
  const rl = state.recordLabelState;
  if (!rl || !rl.imprint?.isFounded) {
    return { nextState: state, success: false, message: 'Launch your Record Label Imprint first.' };
  }

  const target = (rl.imprint.signedRoster || []).find(a => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const trustInfo = getRosterTrustAndHiatusInfo(target);
  if (!trustInfo.willingToRenew) {
    return {
      nextState: state,
      success: false,
      message: `${target.stageName || target.name} refused to renew their contract because their Label Trust is too low (${trustInfo.labelTrust}% • ${trustInfo.trustTierLabel}).`
    };
  }

  const termYears = options?.termYears || 2;
  const advanceCost = options?.advancePaid ?? Math.max(35_000, Math.round((target.popularity || 40) * 1800));
  const labelSplit = options?.labelRoyaltySplit ?? target.labelRoyaltySplit ?? 50;
  const addQuota = options?.albumsQuota ?? 2;

  if (state.money < advanceCost) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient cash for renewal advance ($${advanceCost.toLocaleString()}).`
    };
  }

  const updatedRoster = (rl.imprint.signedRoster || []).map(a => {
    if (a.id !== artistId) return a;
    return {
      ...a,
      daysRemaining: Math.max(0, a.daysRemaining || 0) + termYears * 365,
      albumsQuota: (a.albumsQuota || 1) + addQuota,
      labelRoyaltySplit: labelSplit,
      artistRoyaltySplit: Math.max(15, 100 - labelSplit),
      advancePaid: (a.advancePaid || 0) + advanceCost,
      unrecoupedBalance: (a.unrecoupedBalance || 0) + advanceCost,
      morale: Math.min(100, (a.morale || 75) + 15),
      isFormerRoster: false,
      contractExpired: false,
      willingToRenew: true
    } as ImprintSignedArtist;
  });

  const nextState: GameState = {
    ...state,
    money: state.money - advanceCost,
    recordLabelState: {
      ...rl,
      imprint: {
        ...rl.imprint,
        signedRoster: updatedRoster,
        totalImprintExpenses: (rl.imprint.totalImprintExpenses || 0) + advanceCost
      }
    }
  };

  return {
    nextState,
    success: true,
    message: `Renewed ${target.stageName || target.name}'s contract for ${termYears} years (+${addQuota} albums quota)!`
  };
}

/**
 * Deletes a Former / Expired-Contract Roster Artist from the game world (invoked from SettingsTab).
 * Removes the artist and their catalog from the label roster and immediately restores any original NPC with the same name.
 */
export function deleteFormerRosterArtistFromWorld(
  state: GameState,
  artistId: string
): {
  nextState: GameState;
  success: boolean;
  message: string;
  restoredNpcName: string | null;
} {
  const rl = state.recordLabelState;
  if (!rl || !rl.imprint) {
    return {
      nextState: state,
      success: false,
      message: 'No Record Label state found.',
      restoredNpcName: null
    };
  }

  const target = (rl.imprint.signedRoster || []).find(a => a.id === artistId);
  if (!target) {
    return {
      nextState: state,
      success: false,
      message: 'Roster artist not found.',
      restoredNpcName: null
    };
  }

  if (!isRosterArtistContractExpired(target)) {
    return {
      nextState: state,
      success: false,
      message: `${target.stageName || target.name} still has an active contract (${target.daysRemaining} days remaining). Only artists with expired contracts can be removed here.`,
      restoredNpcName: null
    };
  }

  const stageOrName = target.stageName || target.name;
  const norm = normalizeArtistComparisonKey(stageOrName);
  const matchedMasterNpc = MASTER_REAL_WORLD_NPCS_SNAPSHOT.find(
    n => normalizeArtistComparisonKey(n.name) === norm
  );

  const remainingRoster = (rl.imprint.signedRoster || []).filter(a => a.id !== artistId);

  // Immediately resync world NPCs so the original NPC artist is restored if they shared a name
  syncWorldNpcDeduplicationWithRoster(state.artist?.name, remainingRoster);

  const nextState: GameState = {
    ...state,
    recordLabelState: {
      ...rl,
      imprint: {
        ...rl.imprint,
        signedRoster: remainingRoster
      }
    }
  };

  return {
    nextState,
    success: true,
    restoredNpcName: matchedMasterNpc ? matchedMasterNpc.name : null,
    message: matchedMasterNpc
      ? `Removed former roster artist "${stageOrName}" from the world. Original NPC artist "${matchedMasterNpc.name}" has returned to the global music industry!`
      : `Removed former roster artist "${stageOrName}" and their inactive catalog from the game world.`
  };
}

export const canRosterArtistRenewContract = isRosterArtistWillingToRenew;
export const renewExpiredRosterArtistContract = renewRosterArtistContract;

