import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Crown,
  Disc,
  HeartHandshake,
  ImagePlus,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import { GameState } from '../../types';
import {
  ImprintSignedArtist,
  getEnsuredRecordLabelState,
} from '../../data/recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  ensureRosterArtistFullFields,
} from '../../data/recordLabelCeoEngine';
import { grantRosterArtistTrustBonus } from '../../data/rosterTrustHiatusPayrollEngine';
import {
  GROUP_NAMING_STYLE_OPTIONS,
  ImprintRosterGroup,
  RosterGroupNamingStyle,
  createRosterGroupFromMembers,
  extractCleanBaseStageName,
  formatMemberStageNameWithGroup,
  getArtistDualContractStatus,
  getEnsuredImprintGroups,
  reacquireMemberSoloContract,
  renewMemberDualOrGroupContract,
  updateRosterGroupNamingStyle,
} from '../../data/rosterGroupAndDualContractEngine';

interface RosterGroupCreatorAndManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onOpenArtistStudio: (artistId: string) => void;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
  initialMode?: 'manage' | 'create';
}

export const RosterGroupCreatorAndManagerModal: React.FC<
  RosterGroupCreatorAndManagerModalProps
> = ({
  isOpen,
  onClose,
  gameState,
  setGameState,
  onOpenArtistStudio,
  onNotify,
  initialMode = 'manage',
}) => {
  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const imprint = labelState.imprint;
  const groups = useMemo(() => getEnsuredImprintGroups(gameState), [gameState]);
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';

  const [mode, setMode] = useState<'manage' | 'create'>(() =>
    groups.length === 0 ? 'create' : initialMode
  );

  // Create Group Form State
  const [groupNameInput, setGroupNameInput] = useState<string>('VALKYRIE');
  const [fandomNameInput, setFandomNameInput] = useState<string>('VALKYRIES');
  const [namingStyle, setNamingStyle] = useState<RosterGroupNamingStyle>('of');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [leaderArtistId, setLeaderArtistId] = useState<string>('');
  const [customGroupAvatar, setCustomGroupAvatar] = useState<string>('');
  const groupAvatarRef = useRef<HTMLInputElement | null>(null);

  // Eligible ungrouped solo roster artists
  const eligibleSoloCandidates = useMemo(() => {
    return (imprint.signedRoster || [])
      .map((a) => ensureRosterArtistFullFields(a, dateStr))
      .filter((a) => !(a as any).isGroupEntity && !(a as any).groupId && !a.isFormerRoster);
  }, [imprint.signedRoster, dateStr]);

  if (!isOpen) return null;

  const toggleSelectMember = (artistId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(artistId)) {
        const next = prev.filter((id) => id !== artistId);
        if (leaderArtistId === artistId) {
          setLeaderArtistId(next[0] || '');
        }
        return next;
      }
      if (prev.length >= 7) {
        onNotify('A roster group can have up to 7 members maximum.', 'error');
        return prev;
      }
      const next = [...prev, artistId];
      if (!leaderArtistId) setLeaderArtistId(artistId);
      return next;
    });
  };

  const handleGroupAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomGroupAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = () => {
    const res = createRosterGroupFromMembers(gameState, {
      groupName: groupNameInput,
      fandomName: fandomNameInput,
      namingStyle,
      memberArtistIds: selectedMemberIds,
      leaderArtistId: leaderArtistId || selectedMemberIds[0],
      avatarUrl: customGroupAvatar || undefined,
      formationBudget: 120_000,
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    setSelectedMemberIds([]);
    setMode('manage');
    onNotify(res.message, 'success');
  };

  const handleSwitchGroupNamingStyle = (
    groupId: string,
    nextStyle: RosterGroupNamingStyle
  ) => {
    const res = updateRosterGroupNamingStyle(gameState, groupId, nextStyle);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleRenewContract = (
    artistId: string,
    reqMode: 'auto' | 'full_dual' | 'group_only'
  ) => {
    const res = renewMemberDualOrGroupContract(gameState, artistId, reqMode);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleReacquireSoloContract = (artistId: string) => {
    const res = reacquireMemberSoloContract(gameState, artistId);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleGoodwillBonus = (artistId: string) => {
    const res = grantRosterArtistTrustBonus(gameState, artistId);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const previewCleanGroup = groupNameInput.trim() || 'GROUP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-pink-500/35 bg-[#0F0B17] text-white shadow-2xl">
        {/* Top Header */}
        <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#231230] via-[#181026] to-[#0F0B17] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-pink-400" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-pink-300">
                  K-Pop &amp; Global Group Architecture
                </span>
              </div>
              <h2 className="mt-0.5 text-base font-black text-white">
                Roster Groups &amp; Dual Contract Hub
              </h2>
              <p className="text-[11px] text-zinc-400">
                Form multi-member groups &amp; manage Group vs. Solo Exclusive Contracts
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setMode('manage')}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition ${
                mode === 'manage'
                  ? 'border-pink-400 bg-pink-500/20 text-pink-200'
                  : 'border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Active Groups ({groups.length})</span>
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition ${
                mode === 'create'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Form New Group</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Dual Contract Explainer Card */}
          <div className="rounded-2xl border border-pink-500/25 bg-pink-500/[0.06] p-3 text-[11px] leading-relaxed text-zinc-200">
            <div className="flex items-center gap-1.5 font-black uppercase text-pink-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>How Group vs. Solo Dual Contracts Work</span>
            </div>
            <p className="mt-1 text-zinc-300">
              • <strong className="text-emerald-300">High Trust (74%+)</strong>: Member renews{' '}
              <strong>BOTH Group + Solo Contract</strong> — you have 100% full rights to release
              music for the <strong>Group</strong> and the <strong>Member Solo</strong>.
              <br />• <strong className="text-amber-300">Moderate Trust (48%–73%)</strong>: Member
              renews <strong>GROUP CONTRACT ONLY</strong> — they stay in the group for Group
              comebacks, but you <strong>lose the right to manage or release their Solo music</strong>{' '}
              until you raise Trust to 76%+ and buy back their Solo Contract!
            </p>
          </div>

          {mode === 'create' ? (
            <div className="space-y-4">
              {/* Step 1: Group Identity & Avatar */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  1. Group Identity &amp; Official Fandom
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      customGroupAvatar ||
                      buildRosterArtistAvatarSvg(previewCleanGroup, '#EC4899', '#160D24')
                    }
                    alt={previewCleanGroup}
                    className="h-16 w-16 shrink-0 rounded-2xl border-2 border-pink-400/60 object-cover shadow-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400">
                        Official Group Name
                      </label>
                      <input
                        type="text"
                        value={groupNameInput}
                        onChange={(e) => setGroupNameInput(e.target.value)}
                        placeholder="e.g., BLACKPINK, AESPA, CORTIS..."
                        className="mt-0.5 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-black text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400">
                        Official Fandom Name
                      </label>
                      <input
                        type="text"
                        value={fandomNameInput}
                        onChange={(e) => setFandomNameInput(e.target.value)}
                        placeholder="e.g., BLINKS, MYs..."
                        className="mt-0.5 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold text-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <input
                    ref={groupAvatarRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGroupAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => groupAvatarRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-pink-400/40 bg-pink-500/15 py-2 text-xs font-black text-pink-200"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Upload Custom Group Concept Photo
                  </button>
                </div>
              </div>

              {/* Step 2: Member Stage Credit Naming Style */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  2. Member Stage Credit Format
                </div>
                <p className="text-[11px] text-zinc-400">
                  Choose how every member&apos;s stage name will be credited across charts, Spotify,
                  and your roster:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {GROUP_NAMING_STYLE_OPTIONS.map((opt) => {
                    const active = namingStyle === opt.id;
                    const sampleMember =
                      eligibleSoloCandidates.find((a) => selectedMemberIds.includes(a.id))
                        ?.stageName || 'Jennie';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNamingStyle(opt.id)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? 'border-pink-400 bg-pink-500/20 text-white'
                            : 'border-white/10 bg-black/40 text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black">{opt.label}</div>
                          <div className="font-mono text-[11px] text-pink-300">
                            Preview: {opt.example(sampleMember, previewCleanGroup)}
                          </div>
                        </div>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                            active
                              ? 'bg-pink-400 text-black'
                              : 'bg-white/10 text-zinc-400'
                          }`}
                        >
                          {active ? 'Selected' : 'Use'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Select 2 to 7 Signed Solo Roster Artists */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                    3. Select Members ({selectedMemberIds.length}/7 Selected • Min 2)
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {eligibleSoloCandidates.length} Eligible Soloists
                  </span>
                </div>

                {eligibleSoloCandidates.length < 2 ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    You need at least <strong>2 ungrouped Solo Roster Artists</strong> signed to
                    your label to form a Group. Sign more artists from the A&amp;R Scout Pool or
                    Custom Paper Deal first!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eligibleSoloCandidates.map((cand) => {
                      const isSelected = selectedMemberIds.includes(cand.id);
                      const isLeader = leaderArtistId === cand.id;
                      const baseName = extractCleanBaseStageName(
                        cand.stageName || cand.name
                      );
                      const formattedPreview = formatMemberStageNameWithGroup(
                        baseName,
                        previewCleanGroup,
                        namingStyle
                      );

                      return (
                        <div
                          key={cand.id}
                          className={`rounded-xl border p-2.5 transition ${
                            isSelected
                              ? 'border-pink-400/60 bg-pink-500/15'
                              : 'border-white/10 bg-black/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            <div
                              onClick={() => toggleSelectMember(cand.id)}
                              className="flex flex-1 cursor-pointer items-center gap-2.5 min-w-0"
                            >
                              <img
                                src={
                                  cand.avatarUrl || buildRosterArtistAvatarSvg(baseName)
                                }
                                alt={baseName}
                                className="h-11 w-11 shrink-0 rounded-xl border border-white/15 object-cover"
                              />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-black text-white">
                                  {isSelected ? formattedPreview : baseName}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {cand.genre} • {cand.country} • Pop {cand.popularity} •
                                  Trust {cand.labelTrust ?? 78}%
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={() => setLeaderArtistId(cand.id)}
                                  className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${
                                    isLeader
                                      ? 'bg-amber-400 text-black'
                                      : 'border border-white/15 bg-white/5 text-zinc-300'
                                  }`}
                                >
                                  {isLeader ? '★ Leader' : 'Set Leader'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleSelectMember(cand.id)}
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
                                  isSelected
                                    ? 'bg-pink-500 text-white'
                                    : 'border border-white/15 bg-white/10 text-zinc-200'
                                }`}
                              >
                                {isSelected ? 'Added ✓' : '+ Add'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  disabled={selectedMemberIds.length < 2}
                  onClick={handleCreateGroup}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg disabled:opacity-40 cursor-pointer"
                >
                  Form Official Group &ldquo;{previewCleanGroup}&rdquo; ($120,000 Debut Setup)
                </button>
              </div>
            </div>
          ) : (
            /* =================================================================
               MODE: MANAGE EXISTING GROUPS & MEMBER DUAL CONTRACTS
               ================================================================= */
            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-3">
                  <Users className="mx-auto h-9 w-9 text-pink-400" />
                  <h3 className="text-sm font-black text-white">
                    No Roster Groups Formed Yet
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Combine 2 to 7 signed Roster Artists into an official Group to unlock Group
                    Comebacks, Group Naming Styles (<em>Member of Group</em>,{' '}
                    <em>Member [Group]</em>, <em>Member Group</em>), and K-Pop Dual Contracts!
                  </p>
                  <button
                    onClick={() => setMode('create')}
                    className="rounded-xl bg-pink-500 px-4 py-2 text-xs font-black uppercase text-white"
                  >
                    Form Your First Roster Group
                  </button>
                </div>
              ) : (
                groups.map((grp: ImprintRosterGroup) => {
                  const groupEntity = imprint.signedRoster.find(
                    (a) => a.id === grp.groupRosterArtistId
                  );
                  const memberArtists = grp.memberArtistIds
                    .map((id) => imprint.signedRoster.find((a) => a.id === id))
                    .filter((a): a is ImprintSignedArtist => Boolean(a));

                  return (
                    <div
                      key={grp.id}
                      className="rounded-2xl border border-pink-500/35 bg-white/[0.03] p-4 space-y-3.5"
                    >
                      {/* Group Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              groupEntity?.avatarUrl ||
                              grp.avatarUrl ||
                              buildRosterArtistAvatarSvg(grp.groupName, '#EC4899', '#160D24')
                            }
                            alt={grp.groupName}
                            className="h-14 w-14 shrink-0 rounded-2xl border-2 border-pink-400/60 object-cover shadow-lg"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-pink-300">
                                {memberArtists.length}-Member Official Group
                              </span>
                              <span className="font-mono text-[10px] text-amber-300">
                                Fandom: {grp.fandomName}
                              </span>
                            </div>
                            <h3 className="mt-0.5 truncate text-base font-black text-white">
                              {grp.groupName}
                            </h3>
                            <p className="text-[11px] text-zinc-400">
                              Pop {groupEntity?.popularity ?? 65} • Fans{' '}
                              {(groupEntity?.fans ?? 120000).toLocaleString()} •{' '}
                              {(groupEntity?.songs || []).length} Group Songs
                            </p>
                          </div>
                        </div>

                        {groupEntity && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenArtistStudio(groupEntity.id);
                            }}
                            className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 px-3 py-2 text-[11px] font-black text-black shadow hover:opacity-95 cursor-pointer"
                          >
                            <Disc className="mr-1 inline h-3.5 w-3.5" />
                            Group Studio
                          </button>
                        )}
                      </div>

                      {/* Live Naming Style Switcher */}
                      <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase text-zinc-400">
                            Member Stage Name Format
                          </span>
                          <span className="font-mono text-[10px] text-pink-300">
                            Updates All {memberArtists.length} Members Live
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {GROUP_NAMING_STYLE_OPTIONS.map((opt) => {
                            const active = grp.namingStyle === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() =>
                                  handleSwitchGroupNamingStyle(grp.id, opt.id)
                                }
                                className={`rounded-lg border py-1.5 px-2 text-[10px] font-black transition ${
                                  active
                                    ? 'border-pink-400 bg-pink-500/25 text-pink-200'
                                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {opt.example('Name', grp.groupName)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Individual Members & Dual Contract Status */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          Member Dual Contracts (Group Contract vs. Solo Exclusive Contract)
                        </div>

                        {memberArtists.map((mem) => {
                          const dual = getArtistDualContractStatus(mem);
                          const isLeader = grp.leaderArtistId === mem.id;

                          return (
                            <div
                              key={mem.id}
                              className={`rounded-xl border p-3 space-y-2 ${
                                dual.contractScope === 'group_only'
                                  ? 'border-amber-500/45 bg-amber-950/15'
                                  : dual.contractScope === 'expired_both'
                                  ? 'border-rose-500/45 bg-rose-950/15'
                                  : 'border-white/10 bg-black/45'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={
                                      mem.avatarUrl ||
                                      buildRosterArtistAvatarSvg(dual.baseStageName)
                                    }
                                    alt={dual.formattedStageName}
                                    className="h-10 w-10 shrink-0 rounded-xl border border-white/15 object-cover"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="truncate text-xs font-black text-white">
                                        {dual.formattedStageName}
                                      </span>
                                      {isLeader && (
                                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300">
                                          Leader
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[10px]">
                                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono font-bold text-emerald-300">
                                        Group Deal: {dual.groupContractDaysLeft}d
                                      </span>
                                      {dual.contractScope === 'full_dual' ? (
                                        <span className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono font-bold text-sky-300">
                                          Solo Deal: {dual.soloContractDaysLeft}d (Full Rights)
                                        </span>
                                      ) : (
                                        <span className="rounded bg-rose-500/25 px-1.5 py-0.5 font-mono font-black text-rose-300">
                                          Solo Deal: Outside Agency (Locked)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-[9px] uppercase text-zinc-400">
                                    Label Trust
                                  </div>
                                  <div
                                    className={`font-mono text-xs font-black ${
                                      dual.labelTrust >= 74
                                        ? 'text-emerald-400'
                                        : dual.labelTrust >= 48
                                        ? 'text-amber-300'
                                        : 'text-rose-400'
                                    }`}
                                  >
                                    {dual.labelTrust}%
                                  </div>
                                </div>
                              </div>

                              {/* Renewal Forecast / Solo Lock Notice */}
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-zinc-300">
                                <span className="font-black text-white">
                                  {dual.renewalOutcomeLabel}:
                                </span>{' '}
                                {dual.renewalOutcomeDetail}
                              </div>

                              {/* Member Actions */}
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {dual.canManageSoloStudio ? (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      onOpenArtistStudio(mem.id);
                                    }}
                                    className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-black text-black"
                                  >
                                    <Unlock className="h-3 w-3" />
                                    Solo Studio
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      onNotify(
                                        dual.soloLockReason ||
                                          'Solo rights are held by an outside agency.',
                                        'error'
                                      )
                                    }
                                    className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-[10px] font-black text-rose-200"
                                  >
                                    <Lock className="h-3 w-3" />
                                    Solo Locked (Group-Only)
                                  </button>
                                )}

                                <button
                                  onClick={() => handleGoodwillBonus(mem.id)}
                                  className="flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-black text-emerald-200"
                                >
                                  <HeartHandshake className="h-3 w-3" />
                                  +Trust Bonus
                                </button>

                                {dual.contractScope === 'group_only' ? (
                                  <button
                                    onClick={() => handleReacquireSoloContract(mem.id)}
                                    className="flex items-center gap-1 rounded-lg border border-sky-400/50 bg-sky-500/20 px-2.5 py-1.5 text-[10px] font-black text-sky-200"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Buy Back Solo Contract (Req 76% Trust)
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleRenewContract(mem.id, 'full_dual')
                                      }
                                      className="rounded-lg border border-pink-400/40 bg-pink-500/20 px-2.5 py-1.5 text-[10px] font-black text-pink-200"
                                    >
                                      Renew Group+Solo
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRenewContract(mem.id, 'group_only')
                                      }
                                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-zinc-300"
                                    >
                                      Renew Group-Only
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RosterGroupCreatorAndManagerModal;
