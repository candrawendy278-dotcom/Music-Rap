import React, { useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Crown,
  ExternalLink,
  Lock,
  TrendingUp,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { GameState } from '../../types';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  ensureRosterArtistFullFields,
} from '../../data/recordLabelCeoEngine';
import { getArtistDualContractStatus } from '../../data/rosterGroupAndDualContractEngine';
import {
  ROSTER_FYC_CAMPAIGN_TIERS,
  getEnsuredRosterAwardFycEntry,
  purchaseRosterArtistFycCampaign,
  submitRosterArtistAwardFycEntry,
} from '../../data/rosterBrandDealsAndAwardsEngine';
import { AwardShowType } from '../../data/awardsCategoriesConfig';
import { BrandDealsApp } from './BrandDealsApp';

interface RosterBrandDealsAndAwardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  initialTab?: 'brands' | 'awards';
  initialArtistId?: string;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

export const RosterBrandDealsAndAwardsModal: React.FC<
  RosterBrandDealsAndAwardsModalProps
> = ({
  isOpen,
  onClose,
  gameState,
  setGameState,
  initialTab = 'brands',
  initialArtistId,
  onNotify,
}) => {
  const rl = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const imprint = rl.imprint;
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';

  const rosterList = useMemo(
    () =>
      (imprint.signedRoster || []).map((r) => ensureRosterArtistFullFields(r, dateStr)),
    [imprint.signedRoster, dateStr]
  );

  const [activeTab, setActiveTab] = useState<'brands' | 'awards'>(initialTab);
  const [selectedArtistId, setSelectedArtistId] = useState<string>(
    () => initialArtistId || rosterList[0]?.id || ''
  );
  const [awardShow, setAwardShow] = useState<AwardShowType>('grammys');

  // Sync when modal opens with a specific artist or tab
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialArtistId) {
        setSelectedArtistId(initialArtistId);
      } else if (!selectedArtistId && rosterList[0]?.id) {
        setSelectedArtistId(rosterList[0].id);
      }
    }
  }, [isOpen, initialTab, initialArtistId, rosterList]);

  const currentArtist = useMemo(() => {
    return (
      rosterList.find((a) => a.id === selectedArtistId) || rosterList[0] || null
    );
  }, [rosterList, selectedArtistId]);

  const dualStatus = useMemo(
    () => (currentArtist ? getArtistDualContractStatus(currentArtist) : null),
    [currentArtist]
  );

  const fycEntry = useMemo(
    () =>
      currentArtist
        ? getEnsuredRosterAwardFycEntry(gameState, currentArtist)
        : null,
    [gameState, currentArtist]
  );

  const currentShowFyc = fycEntry
    ? awardShow === 'grammys'
      ? fycEntry.grammys
      : fycEntry.vmas
    : null;

  const [songIdInput, setSongIdInput] = useState<number | null>(null);
  const [albumIdInput, setAlbumIdInput] = useState<number | null>(null);
  const [videoIdInput, setVideoIdInput] = useState<number | null>(null);
  const [priorityFieldInput, setPriorityFieldInput] = useState<string>('general');

  React.useEffect(() => {
    if (currentShowFyc) {
      setSongIdInput(currentShowFyc.preferredSongId);
      setAlbumIdInput(currentShowFyc.preferredAlbumId);
      setVideoIdInput(currentShowFyc.preferredVideoSongId);
      setPriorityFieldInput(currentShowFyc.priorityField);
    }
  }, [
    selectedArtistId,
    awardShow,
    currentShowFyc?.preferredSongId,
    currentShowFyc?.preferredAlbumId,
    currentShowFyc?.preferredVideoSongId,
    currentShowFyc?.priorityField,
  ]);

  if (!isOpen) return null;

  const releasedSongs = (currentArtist?.songs || []).filter(
    (s) => s && s.status === 'released'
  );
  const releasedProjects = (currentArtist?.projects || []).filter(
    (p) => p && p.status === 'released'
  );
  const releasedVideos = releasedSongs.filter((s) => s.hasMV);

  const isSoloLocked = Boolean(
    dualStatus?.isGroupMember && !dualStatus?.canManageSoloStudio
  );

  const handleSaveFycSubmission = () => {
    if (!currentArtist) return;
    const res = submitRosterArtistAwardFycEntry(
      gameState,
      currentArtist.id,
      awardShow,
      {
        preferredSongId: songIdInput,
        preferredAlbumId: albumIdInput,
        preferredVideoSongId: videoIdInput,
        priorityField: priorityFieldInput,
      }
    );
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleBuyFycCampaign = (tierId: string) => {
    if (!currentArtist) return;
    const res = purchaseRosterArtistFycCampaign(gameState, currentArtist.id, tierId);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const jumpToAppWithArtist = (targetApp: 'itunes' | 'x') => {
    if (!currentArtist || !dualStatus) return;
    setGameState((prev) => ({
      ...prev,
      activeApp: targetApp,
      selectedRosterProfileArtistId: currentArtist.id,
      selectedItunesArtistName: dualStatus.formattedStageName,
    } as any));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-amber-500/35 bg-[#0C0A14] text-white shadow-2xl">
        {/* Top Executive Header */}
        <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#1E152A] via-[#151120] to-[#0C0A14] p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  {imprint.imprintName} • Executive Division
                </span>
              </div>
              <h2 className="mt-0.5 text-base font-black tracking-tight text-white">
                Roster Brand Deals &amp; Award FYC Hub
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Primary Mode Switcher: Brand Deals vs Award Entries */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-black/50 p-1">
            <button
              onClick={() => setActiveTab('brands')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition ${
                activeTab === 'brands'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Roster Brand Deals</span>
            </button>
            <button
              onClick={() => setActiveTab('awards')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition ${
                activeTab === 'awards'
                  ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>CEO Award Entries</span>
            </button>
          </div>

          {/* Roster Artist / Group Selector Pills */}
          {rosterList.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {rosterList.map((art) => {
                const d = getArtistDualContractStatus(art);
                const isSelected = art.id === currentArtist?.id;
                const isGrp = Boolean((art as any).isGroupEntity);
                return (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArtistId(art.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-black transition ${
                      isSelected
                        ? isGrp
                          ? 'border-pink-400 bg-pink-500/25 text-white shadow'
                          : 'border-amber-400 bg-amber-500/25 text-white shadow'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <img
                      src={
                        art.avatarUrl ||
                        buildRosterArtistAvatarSvg(d.formattedStageName)
                      }
                      alt={d.formattedStageName}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <span className="max-w-[120px] truncate">{d.formattedStageName}</span>
                    {isGrp && (
                      <span className="rounded bg-pink-500/30 px-1 py-0.2 text-[8px] text-pink-200">
                        GRP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentArtist || !dualStatus ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-xs text-zinc-400">
              Sign at least one Roster Artist in the CEO Suite to manage their Brand
              Endorsements and Award FYC Submissions.
            </div>
          ) : (
            <>
              {/* Selected Roster Artist Summary Banner + Quick iTunes / X Profile Jumps */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        currentArtist.avatarUrl ||
                        buildRosterArtistAvatarSvg(dualStatus.formattedStageName)
                      }
                      alt={dualStatus.formattedStageName}
                      className="h-12 w-12 shrink-0 rounded-2xl border border-amber-400/50 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300">
                          {(currentArtist as any).isGroupEntity
                            ? 'OFFICIAL GROUP'
                            : dualStatus.isGroupMember
                            ? dualStatus.contractScope === 'full_dual'
                              ? 'GROUP + SOLO DUAL'
                              : 'GROUP-ONLY (SOLO LOCKED)'
                            : 'SOLO ROSTER ACT'}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-300 font-bold">
                          Label Cut: {(currentArtist as any).imprintRoyaltyPct || 70}%
                        </span>
                      </div>
                      <h3 className="truncate text-sm font-black text-white mt-0.5">
                        {dualStatus.formattedStageName}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        Pop {currentArtist.popularity}/100 • Hype {currentArtist.hype}% •
                        Trust {(currentArtist as any).labelTrust ?? 78}% •{' '}
                        {(currentArtist.fans || 0).toLocaleString()} Fans
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Jump Buttons to Artist's iTunes Store & X Profile */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <button
                    onClick={() => jumpToAppWithArtist('itunes')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 py-1.5 text-[10px] font-black text-sky-200 hover:bg-sky-500/25"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View iTunes Store Profile</span>
                  </button>
                  <button
                    onClick={() => jumpToAppWithArtist('x')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-500/15 py-1.5 text-[10px] font-black text-pink-200 hover:bg-pink-500/25"
                  >
                    <Users className="h-3 w-3" />
                    <span>View X &amp; Fandom Updates</span>
                  </button>
                </div>

                {isSoloLocked && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-2.5 text-[11px] text-rose-200">
                    <Lock className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <strong>Solo Contract Held by Outside Agency:</strong>{' '}
                      {dualStatus.formattedStageName} only renewed their Group Contract.
                      Select their Official Group (<strong>{dualStatus.groupName}</strong>)
                      above to sign Group Brand Deals &amp; Group Award Entries, or
                      re-acquire their Solo Contract in the Group Hub!
                    </div>
                  </div>
                )}
              </div>

              {/* ===============================================================
                  TAB 1: ROSTER BRAND DEALS & MAISONS (100% IDENTICAL TO PLAYER BRAND DEALS APP)
                 =============================================================== */}
              {activeTab === 'brands' && currentArtist && (
                <div className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl border-t border-white/10">
                  <BrandDealsApp
                    embeddedMode
                    forcedRosterArtistId={currentArtist.id}
                    gameState={gameState}
                    onUpdateState={(next) => setGameState(next)}
                    onShowAlert={(title, message) => {
                      const lower = title.toLowerCase();
                      const isErr =
                        lower.includes('cannot') ||
                        lower.includes('unavailable') ||
                        lower.includes('locked') ||
                        lower.includes('error');
                      onNotify(`${title} — ${message}`, isErr ? 'error' : 'success');
                    }}
                  />
                </div>
              )}

              {/* ===============================================================
                  TAB 2: CEO AWARD ENTRIES (FOR YOUR CONSIDERATION & CAMPAIGNS)
                 =============================================================== */}
              {activeTab === 'awards' && currentShowFyc && (
                <div className="space-y-3.5">
                  {/* Award Show Selector: GRAMMYs vs MTV VMAs */}
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                      onClick={() => setAwardShow('grammys')}
                      className={`rounded-lg py-1.5 text-xs font-black transition ${
                        awardShow === 'grammys'
                          ? 'bg-[#D4AF37] text-black shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🏆 The GRAMMY Awards
                    </button>
                    <button
                      onClick={() => setAwardShow('vmas')}
                      className={`rounded-lg py-1.5 text-xs font-black transition ${
                        awardShow === 'vmas'
                          ? 'bg-pink-500 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🚀 MTV VMAs
                    </button>
                  </div>

                  {/* Official Ballot Entry Form */}
                  <div className="rounded-2xl border border-amber-500/35 bg-white/[0.03] p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          CEO Official FYC Ballot Submission
                        </span>
                        <h4 className="text-xs font-black text-white">
                          Select Priority Entries for {dualStatus.formattedStageName}
                        </h4>
                      </div>
                      <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 font-mono text-[10px] font-black text-emerald-300">
                        +{currentShowFyc.campaignBonusScore.toFixed(1)} Ballot Pts
                      </span>
                    </div>

                    {/* 1. Preferred Song Submission */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400">
                        Record / Song of the Year Entry
                      </label>
                      <select
                        disabled={isSoloLocked}
                        value={songIdInput ?? ''}
                        onChange={(e) =>
                          setSongIdInput(e.target.value ? Number(e.target.value) : null)
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold text-white"
                      >
                        <option value="">Auto-Select Highest Charting Track</option>
                        {releasedSongs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} — Quality {s.quality}/100 ({(s.streams || 0).toLocaleString()}{' '}
                            streams)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Preferred Album / EP Submission */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400">
                        Album of the Year / Best Vocal Album Entry
                      </label>
                      <select
                        disabled={isSoloLocked}
                        value={albumIdInput ?? ''}
                        onChange={(e) =>
                          setAlbumIdInput(e.target.value ? Number(e.target.value) : null)
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold text-white"
                      >
                        <option value="">Auto-Select Flagship Project</option>
                        {releasedProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.type.toUpperCase()}) —{' '}
                            {(p.pureSales || 0).toLocaleString()} pure sales
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Preferred Music Video Submission */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400">
                        Best Music Video / Video of the Year Entry
                      </label>
                      <select
                        disabled={isSoloLocked}
                        value={videoIdInput ?? ''}
                        onChange={(e) =>
                          setVideoIdInput(e.target.value ? Number(e.target.value) : null)
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold text-white"
                      >
                        <option value="">Auto-Select Most Viewed Official MV</option>
                        {releasedVideos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title} (Official MV) — {(v.views || 0).toLocaleString()} views
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Priority Category Focus */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400">
                        Priority Academy Category Push
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-1.5">
                        {(awardShow === 'grammys'
                          ? [
                              { id: 'general', label: 'Big Four (ROTY/SOTY/AOTY)' },
                              { id: 'pop_group', label: 'Best Pop Duo/Group Perf.' },
                              { id: 'bna', label: 'Best New Artist Push' },
                              { id: 'genre', label: 'Genre Field Dominance' },
                            ]
                          : [
                              { id: 'voty', label: 'Video of the Year' },
                              { id: 'group', label: 'Best Group / K-Pop' },
                              { id: 'bna', label: 'Best New Artist' },
                              { id: 'pop', label: 'Song of the Year' },
                            ]
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isSoloLocked}
                            onClick={() => setPriorityFieldInput(opt.id)}
                            className={`rounded-xl border px-2.5 py-2 text-left text-[10px] font-black transition ${
                              priorityFieldInput === opt.id
                                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                                : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={isSoloLocked}
                      onClick={handleSaveFycSubmission}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-2.5 text-xs font-black text-black shadow hover:opacity-95 disabled:opacity-40"
                    >
                      <Award className="h-4 w-4" />
                      <span>
                        Register Official{' '}
                        {awardShow === 'grammys' ? 'GRAMMY' : 'MTV VMA'} Ballot Entry
                      </span>
                    </button>
                  </div>

                  {/* Label FYC Academy Outreach Campaigns */}
                  <div className="space-y-2">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Fund Label FYC Outreach Campaigns
                    </div>
                    {ROSTER_FYC_CAMPAIGN_TIERS.filter((t) => t.show === awardShow).map(
                      (tier) => {
                        const isPurchased =
                          currentShowFyc.purchasedCampaignTiers.includes(tier.id);
                        return (
                          <div
                            key={tier.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                                {tier.badge} • +{tier.bonusScore} BALLOT PTS
                              </span>
                              <div className="mt-0.5 text-xs font-black text-white">
                                {tier.title}
                              </div>
                              <p className="text-[10px] text-zinc-400 leading-snug">
                                {tier.subtitle}
                              </p>
                            </div>
                            <button
                              disabled={isPurchased || isSoloLocked}
                              onClick={() => handleBuyFycCampaign(tier.id)}
                              className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black ${
                                isPurchased
                                  ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40'
                              }`}
                            >
                              {isPurchased
                                ? 'Active ✓'
                                : `$${tier.cost.toLocaleString()}`}
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
