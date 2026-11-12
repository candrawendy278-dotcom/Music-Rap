import { GameState } from '../types';
import {
  ImprintSignedArtist,
  LabelAccountingStatementItem,
  getEnsuredRecordLabelState,
} from './recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  ensureRosterArtistFullFields,
} from './recordLabelCeoEngine';
import { getRosterTrustAndHiatusInfo } from './rosterTrustHiatusPayrollEngine';
import { syncActiveRosterArtistsToSharedWorld } from './rosterSharedWorldBridge';
import { purgeDuplicateNpcFromGameState } from './npcPlayerDeduplicationEngine';

export type RosterGroupNamingStyle = 'of' | 'bracket' | 'space';

export type RosterMemberContractScope =
  | 'full_dual'      // Label holds BOTH Group Contract + Solo Exclusive Contract (Full Rights)
  | 'group_only'     // Member only renewed Group Contract; Solo career is independent/elsewhere (No Solo Management Rights)
  | 'expired_both';  // Both Group and Solo contracts have expired

export interface ImprintRosterGroup {
  id: string;
  groupName: string;
  fandomName: string;
  avatarUrl: string;
  genre: string;
  country: string;
  namingStyle: RosterGroupNamingStyle;
  memberArtistIds: string[];
  leaderArtistId: string;
  groupRosterArtistId: string; // ID of the Group entity in imprint.signedRoster
  formedDate: string;
  groupChemistry: number; // 0 to 100
  contractTermMonths: number;
}

export interface ArtistDualContractStatus {
  isGroupMember: boolean;
  isGroupEntity: boolean;
  groupId?: string;
  groupName?: string;
  namingStyle?: RosterGroupNamingStyle;
  baseStageName: string;
  formattedStageName: string;
  contractScope: RosterMemberContractScope;
  groupContractDaysLeft: number;
  soloContractDaysLeft: number;
  labelTrust: number;
  canManageSoloStudio: boolean;
  canParticipateInGroupRelease: boolean;
  soloLockReason: string | null;
  renewalOutcomePreview: 'full_dual' | 'group_only' | 'refuse_all';
  renewalOutcomeLabel: string;
  renewalOutcomeDetail: string;
}

export const GROUP_NAMING_STYLE_OPTIONS: Array<{
  id: RosterGroupNamingStyle;
  label: string;
  example: (member: string, group: string) => string;
}> = [
  {
    id: 'of',
    label: 'Name of Group',
    example: (m, g) => `${m} of ${g}`,
  },
  {
    id: 'bracket',
    label: 'Name [Group]',
    example: (m, g) => `${m} [${g}]`,
  },
  {
    id: 'space',
    label: 'Name Group',
    example: (m, g) => `${m} ${g}`,
  },
];

/**
 * Formats an individual member's display stage name according to their Group's chosen naming convention.
 */
export function formatMemberStageNameWithGroup(
  baseStageName: string,
  groupName: string,
  style: RosterGroupNamingStyle = 'of'
): string {
  const cleanMember = (baseStageName || 'Member').trim();
  const cleanGroup = (groupName || 'Group').trim();
  if (!cleanGroup) return cleanMember;

  if (style === 'bracket') {
    return `${cleanMember} [${cleanGroup}]`;
  }
  if (style === 'space') {
    return `${cleanMember} ${cleanGroup}`;
  }
  return `${cleanMember} of ${cleanGroup}`;
}

/**
 * Strips any existing group suffix from a stage name to recover the clean base stage name.
 */
export function extractCleanBaseStageName(
  rawName: string,
  groupName?: string
): string {
  let clean = (rawName || 'Artist').trim();
  if (!groupName) return clean;
  const g = groupName.trim();
  if (!g) return clean;

  const ofSuffix = ` of ${g}`;
  const bracketSuffix = ` [${g}]`;
  const spaceSuffix = ` ${g}`;

  if (clean.toLowerCase().endsWith(ofSuffix.toLowerCase())) {
    clean = clean.slice(0, clean.length - ofSuffix.length).trim();
  } else if (clean.toLowerCase().endsWith(bracketSuffix.toLowerCase())) {
    clean = clean.slice(0, clean.length - bracketSuffix.length).trim();
  } else if (
    clean.toLowerCase().endsWith(spaceSuffix.toLowerCase()) &&
    clean.length > spaceSuffix.length
  ) {
    clean = clean.slice(0, clean.length - spaceSuffix.length).trim();
  }
  return clean || rawName;
}

/**
 * Returns all formed Roster Groups under the Player's Record Label Imprint.
 */
export function getEnsuredImprintGroups(state: GameState): ImprintRosterGroup[] {
  const labelState = getEnsuredRecordLabelState(state);
  const rawGroups = (labelState.imprint as any).rosterGroups;
  return Array.isArray(rawGroups) ? rawGroups : [];
}

/**
 * Inspects a Roster Artist's Group membership and Dual Contract (Group vs. Solo) status.
 *
 * K-Pop / Global Idol Dual Contract Rules:
 * - Label Trust >= 74%: Willing to renew BOTH Group Contract + Solo Exclusive Contract (`full_dual`)
 * - Label Trust 48% - 73%: Willing to renew GROUP CONTRACT ONLY (`group_only`). The artist leaves for solo activities
 *   at an outside agency, meaning the Player CANNOT manage or release solo music for that member, though the member
 *   still participates in Group releases!
 * - Label Trust < 48%: Refuses both Group and Solo contract renewal (`refuse_all`).
 */
export function getArtistDualContractStatus(
  artist: ImprintSignedArtist
): ArtistDualContractStatus {
  const raw = artist as any;
  const isGroupEntity = Boolean(raw.isGroupEntity);
  const groupId: string | undefined = raw.groupId;
  const groupName: string | undefined = raw.groupName;
  const isGroupMember = Boolean(!isGroupEntity && groupId && groupName);
  const namingStyle: RosterGroupNamingStyle = raw.groupNamingStyle || 'of';

  const baseStageName = isGroupMember
    ? raw.baseStageName || extractCleanBaseStageName(artist.stageName || artist.name, groupName)
    : artist.stageName || artist.name;

  const formattedStageName = isGroupMember && groupName
    ? formatMemberStageNameWithGroup(baseStageName, groupName, namingStyle)
    : baseStageName;

  const trustInfo = getRosterTrustAndHiatusInfo(artist);
  const labelTrust = trustInfo.labelTrust;

  const baseDaysLeft = Math.max(0, Number(artist.daysRemaining ?? 720));
  const groupContractDaysLeft = isGroupMember
    ? Math.max(0, Number(raw.groupContractDaysLeft ?? baseDaysLeft))
    : baseDaysLeft;
  const soloContractDaysLeft = isGroupMember
    ? Math.max(0, Number(raw.soloContractDaysLeft ?? baseDaysLeft))
    : baseDaysLeft;

  let contractScope: RosterMemberContractScope =
    raw.contractScope || 'full_dual';

  if (isGroupMember) {
    if (groupContractDaysLeft <= 0 && soloContractDaysLeft <= 0) {
      contractScope = 'expired_both';
    } else if (raw.contractScope === 'group_only' || (groupContractDaysLeft > 0 && soloContractDaysLeft <= 0)) {
      contractScope = 'group_only';
    } else {
      contractScope = 'full_dual';
    }
  } else {
    contractScope = baseDaysLeft <= 0 || artist.contractExpired ? 'expired_both' : 'full_dual';
  }

  let renewalOutcomePreview: 'full_dual' | 'group_only' | 'refuse_all' = 'full_dual';
  let renewalOutcomeLabel = 'Will Renew Group + Solo (Full Rights)';
  let renewalOutcomeDetail =
    'High trust! Artist wants to renew both their Group Contract and Solo Exclusive Contract with your label.';

  if (isGroupMember) {
    if (labelTrust >= 74) {
      renewalOutcomePreview = 'full_dual';
      renewalOutcomeLabel = 'Dual Renewal: Group + Solo (100% Rights)';
      renewalOutcomeDetail = `${baseStageName} trusts your leadership (${labelTrust}% Trust) and will renew BOTH Group & Solo contracts.`;
    } else if (labelTrust >= 48) {
      renewalOutcomePreview = 'group_only';
      renewalOutcomeLabel = 'Group-Only Renewal (Solo Rights Lost!)';
      renewalOutcomeDetail = `Moderate trust (${labelTrust}%). ${baseStageName} will ONLY renew their ${groupName} Group Contract and will take their Solo career to another agency unless you raise Trust to 74%+.`;
    } else {
      renewalOutcomePreview = 'refuse_all';
      renewalOutcomeLabel = 'Refuses Both Group & Solo Renewal';
      renewalOutcomeDetail = `Broken trust (${labelTrust}%). ${baseStageName} refuses to renew either contract. Grant a Goodwill Bonus or Hiatus immediately!`;
    }
  } else {
    if (labelTrust >= 48) {
      renewalOutcomePreview = 'full_dual';
      renewalOutcomeLabel = 'Willing to Renew Contract';
      renewalOutcomeDetail = `Trust is ${labelTrust}%. Ready to extend recording contract.`;
    } else {
      renewalOutcomePreview = 'refuse_all';
      renewalOutcomeLabel = 'Refuses Contract Renewal';
      renewalOutcomeDetail = `Trust is too low (${labelTrust}%). Grant a Goodwill Bonus or rest break to restore trust.`;
    }
  }

  const canManageSoloStudio =
    isGroupEntity
      ? baseDaysLeft > 0 && !artist.contractExpired
      : contractScope === 'full_dual' && soloContractDaysLeft > 0 && !artist.contractExpired;

  const canParticipateInGroupRelease =
    isGroupMember
      ? (contractScope === 'full_dual' || contractScope === 'group_only') && groupContractDaysLeft > 0
      : true;

  let soloLockReason: string | null = null;
  if (isGroupMember && contractScope === 'group_only') {
    soloLockReason = `${formattedStageName} only signed a Group Contract with your label (Solo Exclusive Contract is held by an outside agency). You can still release music and manage activities for ${groupName}, but you have no rights to manage or release solo music for ${baseStageName} until you raise their Label Trust to 76%+ and execute a Solo Contract Buy-In.`;
  } else if (contractScope === 'expired_both') {
    soloLockReason = `${formattedStageName}'s contract has expired. Renew their contract to manage their studio and releases.`;
  }

  return {
    isGroupMember,
    isGroupEntity,
    groupId,
    groupName,
    namingStyle,
    baseStageName,
    formattedStageName,
    contractScope,
    groupContractDaysLeft,
    soloContractDaysLeft,
    labelTrust,
    canManageSoloStudio,
    canParticipateInGroupRelease,
    soloLockReason,
    renewalOutcomePreview,
    renewalOutcomeLabel,
    renewalOutcomeDetail,
  };
}

/**
 * Forms a new Official Group from 2 to 7 signed Roster Artists:
 * 1. Renames each selected member to `{Name} of {Group}`, `{Name} [{Group}]`, or `{Name} {Group}`.
 * 2. Initializes each member's Dual Contract (`full_dual`: Group Contract + Solo Exclusive Contract).
 * 3. Creates a synchronized Group Artist Entity on the active roster so the Player can release
 *    Group Singles, Group EPs/Albums, Group MVs, and Group World Tours alongside Solo member releases!
 */
export function createRosterGroupFromMembers(
  state: GameState,
  params: {
    groupName: string;
    fandomName?: string;
    genre?: string;
    country?: string;
    namingStyle: RosterGroupNamingStyle;
    memberArtistIds: string[];
    leaderArtistId?: string;
    avatarUrl?: string;
    formationBudget?: number;
  }
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (!labelState.imprint.isFounded) {
    return {
      nextState: state,
      success: false,
      message: 'Incorporate your Record Label Imprint first before forming a roster group.',
    };
  }

  const cleanGroupName = (params.groupName || '').trim();
  if (!cleanGroupName) {
    return {
      nextState: state,
      success: false,
      message: 'Please enter an official Group Name.',
    };
  }

  const uniqueMemberIds = Array.from(new Set(params.memberArtistIds));
  if (uniqueMemberIds.length < 2 || uniqueMemberIds.length > 7) {
    return {
      nextState: state,
      success: false,
      message: 'Select between 2 and 7 signed solo roster artists to form a Group.',
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const formationCost = params.formationBudget ?? 120_000;
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < formationCost) {
    return {
      nextState: state,
      success: false,
      message: `Forming & debuting "${cleanGroupName}" requires $${formationCost.toLocaleString()} in group branding, choreography & A&R setup.`,
    };
  }

  const existingGroups = getEnsuredImprintGroups(state);
  if (
    existingGroups.some(
      (g) => g.groupName.toLowerCase() === cleanGroupName.toLowerCase()
    )
  ) {
    return {
      nextState: state,
      success: false,
      message: `A group named "${cleanGroupName}" already exists on your label.`,
    };
  }

  const selectedMembers = uniqueMemberIds
    .map((id) => labelState.imprint.signedRoster.find((a) => a.id === id))
    .filter((a): a is ImprintSignedArtist => Boolean(a && !(a as any).isGroupEntity));

  if (selectedMembers.length < 2) {
    return {
      nextState: state,
      success: false,
      message: 'Could not find enough eligible solo roster artists to form this group.',
    };
  }

  // Check none of the selected members are already in another group
  const alreadyGrouped = selectedMembers.find((m) => Boolean((m as any).groupId));
  if (alreadyGrouped) {
    return {
      nextState: state,
      success: false,
      message: `${alreadyGrouped.stageName || alreadyGrouped.name} is already a member of "${(alreadyGrouped as any).groupName}".`,
    };
  }

  const groupId = `grp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const groupRosterArtistId = `roster_group_${groupId}`;
  const leaderId =
    params.leaderArtistId && uniqueMemberIds.includes(params.leaderArtistId)
      ? params.leaderArtistId
      : selectedMembers[0].id;

  const avgPop = Math.min(
    96,
    Math.round(
      selectedMembers.reduce((sum, m) => sum + (Number(m.popularity) || 32), 0) /
        selectedMembers.length +
        selectedMembers.length * 2.5
    )
  );
  const avgPot = Math.min(
    99,
    Math.round(
      selectedMembers.reduce((sum, m) => sum + (Number(m.potential) || 82), 0) /
        selectedMembers.length +
        4
    )
  );
  const combinedFans = Math.round(
    selectedMembers.reduce((sum, m) => sum + (Number(m.fans) || 35000), 0) * 0.85 +
      45000
  );
  const primaryGenre = params.genre || selectedMembers[0].genre || 'K-Pop / Global Pop';
  const primaryCountry = params.country || selectedMembers[0].country || 'KR';
  const groupAvatar =
    params.avatarUrl || buildRosterArtistAvatarSvg(cleanGroupName, '#EC4899', '#160D24');
  const fandomName =
    params.fandomName?.trim() || `${cleanGroupName.toUpperCase()} STANS`;

  // Update each individual member's stageName to follow the Group Naming Style and initialize Dual Contracts
  const updatedRoster = labelState.imprint.signedRoster.map((art) => {
    if (!uniqueMemberIds.includes(art.id)) return art;
    const ensured = ensureRosterArtistFullFields(art, dateStr);
    const baseName = extractCleanBaseStageName(
      (ensured as any).baseStageName || ensured.stageName || ensured.name,
      (ensured as any).groupName
    );
    const formattedName = formatMemberStageNameWithGroup(
      baseName,
      cleanGroupName,
      params.namingStyle
    );
    const currentDays = Math.max(360, Number(ensured.daysRemaining ?? 720));

    const updatedMemberSongs = (ensured.songs || []).map((s) => ({
      ...s,
      artist: formattedName,
    }));
    const updatedMemberProjects = (ensured.projects || []).map((p) => ({
      ...p,
      songs: (p.songs || []).map((ps) => ({
        ...ps,
        artist: formattedName,
      })),
    }));

    const updatedMember: ImprintSignedArtist = {
      ...ensured,
      name: formattedName,
      stageName: formattedName,
      songs: updatedMemberSongs,
      projects: updatedMemberProjects,
      daysRemaining: currentDays,
      bio: `${
        art.id === leaderId ? 'Leader & ' : ''
      }Official Member of ${cleanGroupName} (${fandomName}) under ${
        labelState.imprint.imprintName
      }. Dual Group & Solo Recording Contract.`,
    };
    (updatedMember as any).baseStageName = baseName;
    (updatedMember as any).groupId = groupId;
    (updatedMember as any).groupName = cleanGroupName;
    (updatedMember as any).groupNamingStyle = params.namingStyle;
    (updatedMember as any).isGroupLeader = art.id === leaderId;
    (updatedMember as any).contractScope = 'full_dual';
    (updatedMember as any).groupContractDaysLeft = currentDays;
    (updatedMember as any).soloContractDaysLeft = currentDays;

    return updatedMember;
  });

  const memberDisplayNames = updatedRoster
    .filter((a) => uniqueMemberIds.includes(a.id))
    .map((a) => (a as any).baseStageName || a.stageName || a.name);

  // Create the synchronized Group Artist Entity on the Roster so the CEO can produce Group music, albums & MVs
  const groupEntityArtist: ImprintSignedArtist = {
    id: groupRosterArtistId,
    name: cleanGroupName,
    stageName: cleanGroupName,
    realName: `${cleanGroupName} (${selectedMembers.length}-Member Group: ${memberDisplayNames.join(', ')})`,
    avatarUrl: groupAvatar,
    initials: cleanGroupName.slice(0, 2).toUpperCase(),
    genre: primaryGenre,
    country: primaryCountry,
    bio: `Official ${selectedMembers.length}-member flagship group (${memberDisplayNames.join(
      ', '
    )}) formed by ${labelState.imprint.imprintName}. Official Fandom: ${fandomName}.`,
    popularity: avgPop,
    fans: combinedFans,
    monthlyListeners: 0,
    hype: 68,
    potential: avgPot,
    signedDate: dateStr,
    contractRef: `GRP-${cleanGroupName.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}`,
    termMonths: 36,
    daysRemaining: 1080,
    advancePaid: formationCost,
    unrecoupedAdvance: formationCost,
    imprintRoyaltyCutPct: 55,
    ancillary360CutPct: 20,
    albumsCommitted: 3,
    albumsReleased: 0,
    singlesCommitted: 6,
    singlesReleased: 0,
    daysUntilNextRelease: 21,
    totalStreamsGenerated: 0,
    dailyStreams: 0,
    totalGrossGenerated: 0,
    totalNetProfitForImprint: 0,
    latestReleaseTitle: 'No Group Releases Yet',
    latestReleaseQuality: 0,
    songs: [],
    projects: [],
    staffRoster: {},
    riaaCertifications: [],
    labelTrust: 84,
  };
  (groupEntityArtist as any).isGroupEntity = true;
  (groupEntityArtist as any).groupId = groupId;
  (groupEntityArtist as any).memberArtistIds = uniqueMemberIds;
  (groupEntityArtist as any).fandomName = fandomName;
  (groupEntityArtist as any).groupNamingStyle = params.namingStyle;

  const newGroup: ImprintRosterGroup = {
    id: groupId,
    groupName: cleanGroupName,
    fandomName,
    avatarUrl: groupAvatar,
    genre: primaryGenre,
    country: primaryCountry,
    namingStyle: params.namingStyle,
    memberArtistIds: uniqueMemberIds,
    leaderArtistId: leaderId,
    groupRosterArtistId,
    formedDate: dateStr,
    groupChemistry: 88,
    contractTermMonths: 36,
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_grp_form_${Date.now()}`,
    date: dateStr,
    title: `Formed Official Roster Group: ${cleanGroupName} (${selectedMembers.length} Members)`,
    detail: `Members: ${updatedRoster
      .filter((a) => uniqueMemberIds.includes(a.id))
      .map((a) => a.stageName)
      .join(' • ')}. Dual Group + Solo Contracts active.`,
    amount: formationCost,
    direction: 'debit',
    category: 'imprint',
  };

  const rawNextState: GameState = {
    ...state,
    money: currentMoney - formationCost,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: [groupEntityArtist, ...updatedRoster],
        rosterGroups: [newGroup, ...existingGroups],
        prestige: Math.min(100, (labelState.imprint.prestige || 30) + 8),
        valuation: (labelState.imprint.valuation || 200_000_000) + formationCost * 4,
      } as any,
      statements: [stmt, ...labelState.statements].slice(0, 45),
    },
  };

  syncActiveRosterArtistsToSharedWorld(rawNextState);
  const nextState = purgeDuplicateNpcFromGameState(rawNextState);

  return {
    nextState,
    success: true,
    message: `Officially formed "${cleanGroupName}" (${selectedMembers.length} members)! Each member now carries the "${GROUP_NAMING_STYLE_OPTIONS.find((o) => o.id === params.namingStyle)?.example('Member', cleanGroupName)}" stage credit and holds a Dual Group + Solo Contract.`,
  };
}

/**
 * Switches the Member Stage Name Format (`Name of Group`, `Name [Group]`, or `Name Group`)
 * for all members of an existing Roster Group.
 */
export function updateRosterGroupNamingStyle(
  state: GameState,
  groupId: string,
  newStyle: RosterGroupNamingStyle
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const groups = getEnsuredImprintGroups(state);
  const targetGroup = groups.find((g) => g.id === groupId);
  if (!targetGroup) {
    return { nextState: state, success: false, message: 'Group not found.' };
  }

  const updatedGroups = groups.map((g) =>
    g.id === groupId ? { ...g, namingStyle: newStyle } : g
  );

  const updatedRoster = labelState.imprint.signedRoster.map((art) => {
    const raw = art as any;
    if (raw.groupId !== groupId) return art;
    if (raw.isGroupEntity) {
      return { ...art, groupNamingStyle: newStyle } as any;
    }
    const baseName =
      raw.baseStageName ||
      extractCleanBaseStageName(art.stageName || art.name, targetGroup.groupName);
    const formatted = formatMemberStageNameWithGroup(
      baseName,
      targetGroup.groupName,
      newStyle
    );
    const syncedSongs = (art.songs || []).map((s) => ({
      ...s,
      artist: formatted,
    }));
    const syncedProjects = (art.projects || []).map((p) => ({
      ...p,
      songs: (p.songs || []).map((ps) => ({
        ...ps,
        artist: formatted,
      })),
    }));
    return {
      ...art,
      name: formatted,
      stageName: formatted,
      songs: syncedSongs,
      projects: syncedProjects,
      baseStageName: baseName,
      groupNamingStyle: newStyle,
    } as any;
  });

  const rawNextState: GameState = {
    ...state,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: updatedRoster,
        rosterGroups: updatedGroups,
      } as any,
    },
  };

  syncActiveRosterArtistsToSharedWorld(rawNextState);
  const nextState = purgeDuplicateNpcFromGameState(rawNextState);

  const sampleFormat = formatMemberStageNameWithGroup(
    'Member',
    targetGroup.groupName,
    newStyle
  );
  return {
    nextState,
    success: true,
    message: `Updated ${targetGroup.groupName} member stage credits to "${sampleFormat}" format!`,
  };
}

/**
 * Renews a Group Member's Contract using authentic K-Pop Dual Contract rules:
 * - If `labelTrust >= 74%`: Member renews BOTH Group Contract + Solo Exclusive Contract (`full_dual`).
 *   Player retains 100% full management & release rights for both the Group and the Member's solo career.
 * - If `48% <= labelTrust < 74%` (or if `requestedMode === 'group_only'`): Member ONLY renews their
 *   Group Contract (`group_only`) and signs their Solo representation with an outside agency!
 *   Player can still release Group music/albums, but loses the right to manage or release Solo music for this member.
 * - If `labelTrust < 48%`: Member refuses both Group and Solo renewal!
 */
export function renewMemberDualOrGroupContract(
  state: GameState,
  artistId: string,
  requestedMode: 'auto' | 'full_dual' | 'group_only' = 'auto'
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const dualStatus = getArtistDualContractStatus(target);
  const trust = dualStatus.labelTrust;

  if (trust < 48) {
    return {
      nextState: state,
      success: false,
      message: `${dualStatus.formattedStageName} refused to renew either their Group or Solo contract because their Label Trust is too low (${trust}% < 48%). Pay a Goodwill Bonus or grant a Hiatus first!`,
    };
  }

  if (requestedMode === 'full_dual' && trust < 74) {
    return {
      nextState: state,
      success: false,
      message: `${dualStatus.baseStageName} declined a Solo Exclusive renewal (${trust}% Label Trust; requires 74%+ Trust for Dual Group + Solo renewal). At ${trust}% Trust, they are only willing to sign a Group-Only Contract with your label!`,
    };
  }

  const effectiveScope: 'full_dual' | 'group_only' =
    !dualStatus.isGroupMember
      ? 'full_dual'
      : requestedMode === 'group_only'
      ? 'group_only'
      : trust >= 74
      ? 'full_dual'
      : 'group_only';

  const baseAdvance = Math.max(40_000, Math.round((target.popularity || 40) * 1850));
  const renewalAdvance =
    effectiveScope === 'full_dual' ? Math.round(baseAdvance * 1.35) : Math.round(baseAdvance * 0.65);

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < renewalAdvance) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient funds for ${dualStatus.formattedStageName}'s $${renewalAdvance.toLocaleString()} contract renewal advance.`,
    };
  }

  const addedDays = 730; // 24 Months (2 Years)
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';

  const updatedRoster = labelState.imprint.signedRoster.map((art) => {
    if (art.id !== artistId) return art;
    const nextGroupDays = Math.max(0, dualStatus.groupContractDaysLeft) + addedDays;
    const nextSoloDays =
      effectiveScope === 'full_dual'
        ? Math.max(0, dualStatus.soloContractDaysLeft) + addedDays
        : 0;

    const updated: ImprintSignedArtist = {
      ...art,
      daysRemaining: nextGroupDays,
      advancePaid: (art.advancePaid || 0) + renewalAdvance,
      unrecoupedAdvance: (art.unrecoupedAdvance || 0) + renewalAdvance,
      albumsCommitted: (art.albumsCommitted || 2) + (effectiveScope === 'full_dual' ? 2 : 1),
      isFormerRoster: false,
      contractExpired: false,
      willingToRenew: true,
    };
    (updated as any).contractScope = effectiveScope;
    (updated as any).groupContractDaysLeft = nextGroupDays;
    (updated as any).soloContractDaysLeft = nextSoloDays;
    (updated as any).labelTrust = Math.min(100, trust + (effectiveScope === 'full_dual' ? 8 : 4));

    return updated;
  });

  // Also extend the parent Group Entity's contract if this member renewed their Group Contract
  const finalRoster = updatedRoster.map((art) => {
    if (
      dualStatus.groupId &&
      (art as any).isGroupEntity &&
      (art as any).groupId === dualStatus.groupId
    ) {
      return {
        ...art,
        daysRemaining: Math.max(art.daysRemaining || 720, 730),
        isFormerRoster: false,
        contractExpired: false,
      };
    }
    return art;
  });

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_dual_renew_${Date.now()}_${artistId}`,
    date: dateStr,
    title:
      effectiveScope === 'full_dual'
        ? `Executed Dual Contract Renewal (Group + Solo): ${dualStatus.formattedStageName}`
        : `Executed Group-Only Contract Renewal: ${dualStatus.formattedStageName}`,
    detail:
      effectiveScope === 'full_dual'
        ? `Wired $${renewalAdvance.toLocaleString()} advance. ${labelState.imprint.imprintName} retains 100% Full Rights for both ${dualStatus.groupName || 'Group'} and ${dualStatus.baseStageName} Solo releases (+24 Months).`
        : `Wired $${renewalAdvance.toLocaleString()} group retainer. ${dualStatus.baseStageName} renewed ONLY for ${dualStatus.groupName} group activities; Solo management rights moved to an outside agency.`,
    amount: renewalAdvance,
    direction: 'debit',
    category: 'imprint',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - renewalAdvance,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: finalRoster,
      },
      statements: [stmt, ...labelState.statements].slice(0, 45),
    },
  };

  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message:
      effectiveScope === 'full_dual'
        ? `Renewed ${dualStatus.formattedStageName}'s Group + Solo Exclusive Contract for 24 months! You have 100% full rights to release music for both ${dualStatus.groupName || 'the group'} and ${dualStatus.baseStageName} solo.`
        : `${dualStatus.formattedStageName} renewed ONLY their ${dualStatus.groupName} Group Contract (Label Trust ${trust}%). You can release music for ${dualStatus.groupName}, but ${dualStatus.baseStageName}'s Solo studio is locked until you rebuild Trust to 76%+ and buy back their Solo Contract!`,
  };
}

/**
 * Re-acquires a Group Member's Solo Exclusive Contract if they previously signed a Group-Only renewal.
 * Requires the Player to first rebuild the member's Label Trust to at least 76%.
 */
export function reacquireMemberSoloContract(
  state: GameState,
  artistId: string
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const dualStatus = getArtistDualContractStatus(target);
  if (dualStatus.contractScope === 'full_dual') {
    return {
      nextState: state,
      success: false,
      message: `You already hold ${dualStatus.formattedStageName}'s Solo Exclusive Contract!`,
    };
  }

  if (dualStatus.labelTrust < 76) {
    return {
      nextState: state,
      success: false,
      message: `${dualStatus.baseStageName} requires at least 76% Label Trust (currently ${dualStatus.labelTrust}%) before bringing their Solo Exclusive Contract back to ${labelState.imprint.imprintName}. Grant a Goodwill Bonus first!`,
    };
  }

  const buyInFee = Math.max(95_000, Math.round((target.popularity || 45) * 2600));
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < buyInFee) {
    return {
      nextState: state,
      success: false,
      message: `Acquiring ${dualStatus.baseStageName}'s Solo Exclusive Contract requires a $${buyInFee.toLocaleString()} signing advance.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const updatedRoster = labelState.imprint.signedRoster.map((art) => {
    if (art.id !== artistId) return art;
    const syncDays = Math.max(720, dualStatus.groupContractDaysLeft);
    const updated: ImprintSignedArtist = {
      ...art,
      daysRemaining: syncDays,
      advancePaid: (art.advancePaid || 0) + buyInFee,
      unrecoupedAdvance: (art.unrecoupedAdvance || 0) + buyInFee,
    };
    (updated as any).contractScope = 'full_dual';
    (updated as any).groupContractDaysLeft = syncDays;
    (updated as any).soloContractDaysLeft = syncDays;
    (updated as any).labelTrust = Math.min(100, dualStatus.labelTrust + 6);
    return updated;
  });

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_solo_reacq_${Date.now()}_${artistId}`,
    date: dateStr,
    title: `Acquired Solo Exclusive Contract: ${dualStatus.formattedStageName}`,
    detail: `Paid $${buyInFee.toLocaleString()} solo signing advance. Restored 100% Full Dual Rights (Group + Solo) for ${dualStatus.formattedStageName}.`,
    amount: buyInFee,
    direction: 'debit',
    category: 'imprint',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - buyInFee,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: updatedRoster,
      },
      statements: [stmt, ...labelState.statements].slice(0, 45),
    },
  };

  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Signed ${dualStatus.formattedStageName} to a Solo Exclusive Contract ($${buyInFee.toLocaleString()} advance)! You now hold 100% Full Rights to manage and release both ${dualStatus.groupName} Group music and ${dualStatus.baseStageName} Solo projects!`,
  };
}
