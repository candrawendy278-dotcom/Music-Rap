import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Crown,
  FileSignature,
  FileText,
  Globe,
  ImagePlus,
  Send,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { GameState } from '../../types';
import { useGameContext } from '../../GameContext';
import {
  IMPRINT_SCOUT_POOL,
  ImprintScoutCandidate,
  RECORD_DEAL_STRUCTURES,
  RECORD_LABEL_PARTNERS,
  RecordDealTypeId,
  RecordLabelPartner,
  RecordLabelTier,
  buyBackMasterCatalogRights,
  buyoutOrCompleteRecordContract,
  calculateDealFinancialTargets,
  evaluateRecordContractProposal,
  foundPlayerRecordImprint,
  fundImprintArtistCampaign,
  getDefaultImprintLogoSvg,
  getEnsuredRecordLabelState,
  getRecordLabelById,
  requisitionLabelMarketingGrant,
  signArtistRecordDeal,
  submitRecordLabelPitch,
  updatePlayerImprintLogo,
} from '../../data/recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  ensureRosterArtistFullFields,
  getEnsuredLabelXAccount,
  getEnsuredLabelYouTubeChannel,
  hireStaffForRosterOrLabel,
  releaseStaffFromRosterOrLabel,
} from '../../data/recordLabelCeoEngine';
import {
  STAFF_CANDIDATE_POOL,
  STAFF_ROLE_DEFINITIONS,
  STAFF_ROLE_ORDER,
  StaffRoleId,
} from '../../data/staffTeamEngine';
import {
  RosterArtistCeoManagerModal,
  RosterPaperContractModal,
} from './RecordLabelCeoStudioModal';
import {
  canRosterArtistRenewContract,
  isRosterArtistContractExpired,
  renewExpiredRosterArtistContract,
} from '../../data/rosterLifecycleAndNpcDedupEngine';
import { MIN_RECORD_LABEL_CAPITAL_INVESTMENT } from '../../data/rosterTrustHiatusPayrollEngine';
import {
  LabelStaffPayrollSummaryBanner,
  RecordLabelPrerequisitesChecklistCard,
  RosterTrustAndHiatusPanel,
} from './RosterTrustAndHiatusCard';
import {
  RosterInternationalShowsModal,
  RosterShowQuickBanner,
} from './RosterInternationalShowsPanel';

interface RecordLabelAppProps {
  gameState?: GameState;
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
  onBack?: () => void;
}

type MainTab = 'labels' | 'my_deal' | 'imprint' | 'ledger';

export const RecordLabelApp: React.FC<RecordLabelAppProps> = ({
  gameState: propGameState,
  setGameState: propSetGameState,
  onBack,
}) => {
  const ctx = useGameContext();
  const gameState = propGameState ?? ctx.state;
  const setGameState = propSetGameState ?? ctx.setState;
  const handleClose =
    onBack ?? (() => setGameState((prev) => ({ ...prev, activeApp: 'none' })));

  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const activeContract = labelState.activeContract;
  const imprint = labelState.imprint;
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';

  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (imprint.isFounded) return 'imprint';
    if (activeContract) return 'my_deal';
    return 'labels';
  });

  const [tierFilter, setTierFilter] = useState<'all' | RecordLabelTier>('all');
  const [bannerMsg, setBannerMsg] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  // Pitching & Negotiating with NPC Labels (for Player's own Artist career)
  const [selectedDemoSongId, setSelectedDemoSongId] = useState<number | undefined>(
    () => (gameState.songs || [])[0]?.id
  );
  const [negotiatingLabel, setNegotiatingLabel] = useState<RecordLabelPartner | null>(null);
  const [dealType, setDealType] = useState<RecordDealTypeId>('exclusive_royalty');
  const [proposedAdvance, setProposedAdvance] = useState<number>(250000);
  const [proposedArtistRoyaltyPct, setProposedArtistRoyaltyPct] = useState<number>(24);
  const [proposedAlbumsQuota, setProposedAlbumsQuota] = useState<number>(2);
  const [proposedSinglesQuota, setProposedSinglesQuota] = useState<number>(4);
  const [showActivePaperContractModal, setShowActivePaperContractModal] =
    useState<boolean>(false);

  // Player CEO Imprint Incorporation & Logo Upload
  const [imprintNameInput, setImprintNameInput] = useState<string>(
    imprint.imprintName || `${gameState.artist?.name || 'Sovereign'} Records`
  );
  const [imprintHqInput, setImprintHqInput] = useState<string>(
    imprint.headquarters || 'Los Angeles / London'
  );
  const [imprintDistPartner, setImprintDistPartner] = useState<
    'indie_direct' | 'awal_orchard' | 'major_umg_jv'
  >('awal_orchard');
  const [imprintCapitalInvestment, setImprintCapitalInvestment] = useState<number>(
    MIN_RECORD_LABEL_CAPITAL_INVESTMENT
  );
  const [imprintLogoPreview, setImprintLogoPreview] = useState<string>(
    imprint.logoUrl || getDefaultImprintLogoSvg(imprint.imprintName)
  );
  const imprintLogoInputRef = useRef<HTMLInputElement | null>(null);

  // CEO Modals: Recruiting Roster Artist (Paper Contract) & Managing Signed Roster Artist
  const [recruitingCandidate, setRecruitingCandidate] = useState<{
    open: boolean;
    candidate: ImprintScoutCandidate | null;
  }>({ open: false, candidate: null });
  const [managingRosterArtistId, setManagingRosterArtistId] = useState<string | null>(
    null
  );
  const [showsModalArtistId, setShowsModalArtistId] = useState<string | null>(null);
  const [showLabelDivisionStaffModal, setShowLabelDivisionStaffModal] =
    useState<boolean>(false);
  const [selectedExecRole, setSelectedExecRole] = useState<StaffRoleId>('manager');

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setBannerMsg({ text, tone });
    setTimeout(() => setBannerMsg(null), 4200);
  };

  const openNegotiationWithLabel = (label: RecordLabelPartner) => {
    const defaultDeal = label.preferredDealType || 'exclusive_royalty';
    const targets = calculateDealFinancialTargets(label, defaultDeal, 2);
    setNegotiatingLabel(label);
    setDealType(defaultDeal);
    setProposedAdvance(targets.targetAdvance);
    setProposedArtistRoyaltyPct(targets.royaltyTarget);
    setProposedAlbumsQuota(2);
    setProposedSinglesQuota(targets.singleQuota);
  };

  const handleDealTypeChange = (nextDeal: RecordDealTypeId) => {
    setDealType(nextDeal);
    if (!negotiatingLabel) return;
    const targets = calculateDealFinancialTargets(
      negotiatingLabel,
      nextDeal,
      proposedAlbumsQuota
    );
    setProposedAdvance(targets.targetAdvance);
    setProposedArtistRoyaltyPct(targets.royaltyTarget);
    setProposedSinglesQuota(targets.singleQuota);
  };

  const negotiationTargets = useMemo(() => {
    if (!negotiatingLabel) return null;
    return calculateDealFinancialTargets(
      negotiatingLabel,
      dealType,
      proposedAlbumsQuota
    );
  }, [negotiatingLabel, dealType, proposedAlbumsQuota]);

  const negotiationEvaluation = useMemo(() => {
    if (!negotiatingLabel) return null;
    return evaluateRecordContractProposal(gameState, {
      labelId: negotiatingLabel.id,
      dealType,
      albumQuota: proposedAlbumsQuota,
      singleQuota: proposedSinglesQuota,
      offeredAdvance: proposedAdvance,
      artistRoyaltyPct: proposedArtistRoyaltyPct,
    });
  }, [
    gameState,
    negotiatingLabel,
    dealType,
    proposedAlbumsQuota,
    proposedSinglesQuota,
    proposedAdvance,
    proposedArtistRoyaltyPct,
  ]);

  const handleSignPlayerDeal = () => {
    if (!negotiatingLabel) return;
    const res = signArtistRecordDeal(gameState, {
      labelId: negotiatingLabel.id,
      dealType,
      albumQuota: proposedAlbumsQuota,
      singleQuota: proposedSinglesQuota,
      offeredAdvance: proposedAdvance,
      artistRoyaltyPct: proposedArtistRoyaltyPct,
    });
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    setNegotiatingLabel(null);
    setActiveTab('my_deal');
    showToast(res.message, 'success');
  };

  const handleSubmitPitch = (labelId: string) => {
    const res = submitRecordLabelPitch(gameState, labelId, selectedDemoSongId);
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.message, 'success');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImprintLogoPreview(reader.result);
        if (imprint.isFounded) {
          const nextState = updatePlayerImprintLogo(gameState, reader.result);
          setGameState(nextState);
          showToast('Updated your Record Label Imprint logo!', 'success');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFoundImprint = () => {
    const res = foundPlayerRecordImprint(
      gameState,
      imprintNameInput,
      imprintHqInput,
      imprintDistPartner,
      imprintLogoPreview,
      imprintCapitalInvestment
    );
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.message, 'success');
  };

  const filteredLabels = useMemo(() => {
    return RECORD_LABEL_PARTNERS.filter((l) =>
      tierFilter === 'all' ? true : l.tier === tierFilter
    );
  }, [tierFilter]);

  const labelYt = useMemo(() => getEnsuredLabelYouTubeChannel(gameState), [gameState]);
  const labelX = useMemo(() => getEnsuredLabelXAccount(gameState), [gameState]);
  const labelStaffMap: Partial<Record<StaffRoleId, any>> =
    (imprint as any).labelStaffRoster || {};

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col overflow-hidden bg-[#09080E] text-white">
      {/* Top Executive Masthead */}
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-[#141122] via-[#1C162E] to-[#141122] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  A&amp;R &amp; Global Imprint HQ
                </span>
              </div>
              <h1 className="text-base font-black tracking-tight text-white">
                Record Labels &amp; CEO Suite
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase text-zinc-400">Treasury</div>
            <div className="font-mono text-xs font-black text-emerald-400">
              ${Math.round(Number(gameState.money) || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            { id: 'labels' as const, label: 'Labels', icon: Building2 },
            {
              id: 'my_deal' as const,
              label: activeContract ? 'My Deal ★' : 'My Deal',
              icon: FileSignature,
            },
            {
              id: 'imprint' as const,
              label: imprint.isFounded
                ? `CEO (${imprint.signedRoster.length})`
                : 'Launch CEO',
              icon: Crown,
            },
            { id: 'ledger' as const, label: 'Ledger', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-black transition ${
                  active
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {bannerMsg && (
        <div
          className={`mx-4 mt-2.5 flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-bold ${
            bannerMsg.tone === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          <span>{bannerMsg.text}</span>
          <button onClick={() => setBannerMsg(null)} className="ml-2 text-white/60">
            ✕
          </button>
        </div>
      )}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {/* ===================================================================
            TAB 1: BROWSE RECORD LABELS & SUBMIT 7-DAY A&R DEMO PITCHES
           =================================================================== */}
        {activeTab === 'labels' && (
          <div className="space-y-4">
            {/* Demo Selector for A&R Pitching */}
            <div className="rounded-2xl border border-amber-500/25 bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  1. Select Demo Track for A&amp;R Pitch (1-Week Review)
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  Pop {gameState.popularity}/100
                </span>
              </div>
              <select
                value={selectedDemoSongId || ''}
                onChange={(e) => setSelectedDemoSongId(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white"
              >
                {(gameState.songs || []).length === 0 ? (
                  <option value="">Studio EPK Demo Tape (Default)</option>
                ) : (
                  (gameState.songs || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — Quality {s.quality}/100 ({s.status})
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1.5 text-[11px] text-zinc-400">
                Pitching a label sends your EPK to their A&amp;R board. Advance to{' '}
                <strong className="text-amber-200">Next Week (7 days)</strong> to receive their
                official contract offer!
              </p>
            </div>

            {/* Tier Filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all' as const, label: 'All Labels (10)' },
                { id: 1 as const, label: 'Indie Boutique' },
                { id: 2 as const, label: 'Mid-Major' },
                { id: 3 as const, label: 'Global Major' },
              ].map((f) => (
                <button
                  key={String(f.id)}
                  onClick={() => setTierFilter(f.id)}
                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                    tierFilter === f.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Record Label Cards with Custom Vector Crest Logos */}
            <div className="space-y-3">
              {filteredLabels.map((label) => {
                const pitch = labelState.pitches[label.id];
                const isSignedHere = activeContract?.labelId === label.id;

                return (
                  <div
                    key={label.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={label.logoDataUri}
                        alt={label.name}
                        className="h-16 w-16 shrink-0 rounded-2xl border border-amber-400/40 object-cover shadow-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                            {label.tierLabel}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            Min Pop {label.minPopularity}
                          </span>
                        </div>
                        <h3 className="mt-1 truncate text-base font-black text-white">
                          {label.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          {label.headquarters} • Prestige {label.prestigeScore}/100
                        </p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-300">{label.bio}</p>

                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5 text-center font-mono">
                      <div>
                        <div className="text-[9px] uppercase text-zinc-400">
                          Advance / Album
                        </div>
                        <div className="text-xs font-black text-emerald-400">
                          ${label.baseAdvancePerAlbum.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-zinc-400">Global Reach</div>
                        <div className="text-xs font-black text-amber-300">
                          {label.globalDistributionReachPct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-zinc-400">Promo / Album</div>
                        <div className="text-xs font-black text-sky-300">
                          ${label.baseMarketingBudgetPerAlbum.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Pitch Status Banner */}
                    {pitch && (
                      <div
                        className={`rounded-xl border p-2.5 text-xs ${
                          pitch.status === 'interested'
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                            : pitch.status === 'pending_review'
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                            : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                        }`}
                      >
                        <div className="font-black uppercase">
                          {pitch.status === 'interested'
                            ? `✓ A&R Approved (Official Contract Offer Ready)`
                            : pitch.status === 'pending_review'
                            ? `⏳ Under A&R Review (${pitch.daysRemaining}d left until Next Week)`
                            : `✕ A&R Passed (${pitch.cooldownDaysLeft || 0}d cooldown)`}
                        </div>
                        <p className="mt-1 text-[11px] opacity-90">{pitch.arFeedback}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    {isSignedHere ? (
                      <button
                        onClick={() => setActiveTab('my_deal')}
                        className="w-full rounded-xl bg-emerald-500/20 border border-emerald-400/50 py-2.5 text-xs font-black uppercase text-emerald-300"
                      >
                        Currently Signed Here • View Deal
                      </button>
                    ) : pitch?.status === 'interested' ? (
                      <button
                        onClick={() => openNegotiationWithLabel(label)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-black uppercase text-black shadow-lg hover:bg-amber-400"
                      >
                        <FileSignature className="h-4 w-4" />
                        Open Official Contract Paper &amp; Negotiate
                      </button>
                    ) : (
                      <button
                        disabled={
                          Boolean(activeContract) || pitch?.status === 'pending_review'
                        }
                        onClick={() => handleSubmitPitch(label.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2.5 text-xs font-black uppercase text-amber-200 hover:bg-amber-500 hover:text-black disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {pitch?.status === 'pending_review'
                          ? `Awaiting Next Week Decision (${pitch.daysRemaining}d)`
                          : 'Pitch Demo to A&R Board (Wait 1 Week)'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: ACTIVE ARTIST RECORD DEAL, GRANTS & PAPER CONTRACT
           =================================================================== */}
        {activeTab === 'my_deal' && (
          <div className="space-y-4">
            {!activeContract ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-3">
                <FileSignature className="mx-auto h-10 w-10 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  You Are Currently an Independent Artist
                </h3>
                <p className="text-xs text-zinc-400">
                  You retain 100% of your master royalties. Pitch a demo to an Indie, Mid-Major,
                  or Global Major Record Label in the Labels tab and wait 1 week for their
                  contract offer, or launch your own Record Label Imprint in the CEO tab!
                </p>
                <button
                  onClick={() => setActiveTab('labels')}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black uppercase text-black"
                >
                  Browse Record Labels
                </button>
              </div>
            ) : (
              <>
                {/* Signed Label Header Card */}
                <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-[#1C162B] to-[#0E0B16] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          getRecordLabelById(activeContract.labelId)?.logoDataUri ||
                          getDefaultImprintLogoSvg(activeContract.labelName)
                        }
                        alt={activeContract.labelName}
                        className="h-14 w-14 rounded-2xl border border-amber-400/50 object-cover"
                      />
                      <div>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                          {activeContract.dealTypeName}
                        </span>
                        <h3 className="mt-0.5 text-base font-black text-white">
                          {activeContract.labelName}
                        </h3>
                        <p className="font-mono text-[10px] text-zinc-400">
                          REF: {activeContract.contractRef} • Signed {activeContract.signedDate}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowActivePaperContractModal(true)}
                      className="rounded-xl border border-amber-400/50 bg-[#FBF8F1] px-3 py-2 text-[11px] font-black text-[#181613] shadow"
                    >
                      View Paper Contract
                    </button>
                  </div>

                  {/* Advance Recoupment Progress */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">Advance Recoupment Status</span>
                      <span className="font-mono text-amber-300">
                        {activeContract.unrecoupedBalance <= 0
                          ? '100% RECOUPED'
                          : `$${activeContract.unrecoupedBalance.toLocaleString()} Unrecouped`}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (activeContract.totalRoyaltiesRecouped /
                                Math.max(1, activeContract.totalAdvanceReceived)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>
                        Recouped: ${activeContract.totalRoyaltiesRecouped.toLocaleString()} / $
                        {activeContract.totalAdvanceReceived.toLocaleString()}
                      </span>
                      <span>
                        Split: {activeContract.artistRoyaltyPct}% Artist /{' '}
                        {100 - activeContract.artistRoyaltyPct}% Label
                      </span>
                    </div>
                  </div>

                  {/* Quotas */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                      <div className="text-[9px] uppercase text-zinc-400">Albums Quota</div>
                      <div className="text-sm font-black text-white">
                        {activeContract.albumsDelivered} / {activeContract.albumQuotaTotal}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                      <div className="text-[9px] uppercase text-zinc-400">Singles Quota</div>
                      <div className="text-sm font-black text-white">
                        {activeContract.singlesDelivered} / {activeContract.singleQuotaTotal}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                      <div className="text-[9px] uppercase text-zinc-400">A&amp;R Trust</div>
                      <div className="text-sm font-black text-emerald-400">
                        {activeContract.arTrustScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requisition Marketing Grants */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Requisition Label Marketing Budget
                    </h4>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      ${activeContract.availableMarketingBudget.toLocaleString()} Pool Left
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'mv_production', label: 'VEVO MV Grant' },
                        { id: 'radio_playlist_blitz', label: 'Radio & DSP Push' },
                        { id: 'studio_ar_session', label: 'Studio A&R Session' },
                      ] as const
                    ).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          const res = requisitionLabelMarketingGrant(gameState, g.id);
                          if (!res.success) showToast(res.message, 'error');
                          else {
                            setGameState(res.nextState);
                            showToast(res.message, 'success');
                          }
                        }}
                        className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-left hover:border-amber-400/50"
                      >
                        <div className="text-[11px] font-black text-white">{g.label}</div>
                        <div className="font-mono text-[9px] text-amber-300">
                          Disburse Grant
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Master Buyback & Contract Buyout */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      const res = buyBackMasterCatalogRights(gameState);
                      if (!res.success) showToast(res.message, 'error');
                      else {
                        setGameState(res.nextState);
                        showToast(res.message, 'success');
                      }
                    }}
                    className="rounded-xl border border-amber-400/40 bg-amber-500/15 p-3 text-xs font-black text-amber-200"
                  >
                    Buy Back Master Ownership ($
                    {activeContract.masterBuybackPrice.toLocaleString()})
                  </button>
                  <button
                    onClick={() => {
                      const res = buyoutOrCompleteRecordContract(gameState);
                      if (!res.success) showToast(res.message, 'error');
                      else {
                        setGameState(res.nextState);
                        showToast(res.message, 'success');
                      }
                    }}
                    className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs font-black text-rose-200"
                  >
                    Complete / Buyout Contract
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 3: PLAYER RECORD LABEL CEO SUITE (ROSTER, STUDIO, STAFF, YT & X)
           =================================================================== */}
        {activeTab === 'imprint' && (
          <div className="space-y-4">
            {!imprint.isFounded ? (
              <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-b from-[#1A1426] to-[#0E0B16] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={imprintLogoPreview}
                    alt="Imprint Logo"
                    className="h-16 w-16 rounded-2xl border-2 border-amber-400 object-cover shadow-xl"
                  />
                  <div>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                      CEO Founder Suite
                    </span>
                    <h3 className="mt-1 text-lg font-black text-white">
                      Launch Your Record Label Imprint
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Sign roster artists with paper contracts, produce their singles &amp;
                      albums, hire staff, and run your Label YouTube &amp; X accounts.
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    ref={imprintLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imprintLogoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2 text-xs font-black text-amber-200"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload Custom Record Label Logo
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Record Label Name
                    </label>
                    <input
                      type="text"
                      value={imprintNameInput}
                      onChange={(e) => setImprintNameInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Global Headquarters
                    </label>
                    <input
                      type="text"
                      value={imprintHqInput}
                      onChange={(e) => setImprintHqInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Upstream Distribution Partner
                    </label>
                    <select
                      value={imprintDistPartner}
                      onChange={(e) => setImprintDistPartner(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white"
                    >
                      <option value="indie_direct">
                        Independent Direct (6% Dist Fee • +18 Prestige)
                      </option>
                      <option value="awal_orchard">
                        The Orchard / AWAL Global (12% Dist Fee • +32 Prestige)
                      </option>
                      <option value="major_umg_jv">
                        Universal / Republic JV (18% Dist Fee • +50 Prestige • +25% Reach)
                      </option>
                    </select>
                  </div>
                </div>

                {/* $100M Capital Investment & Career Milestones Checklist */}
                <RecordLabelPrerequisitesChecklistCard
                  gameState={gameState}
                  selectedCapitalInvestment={imprintCapitalInvestment}
                  onChangeCapitalInvestment={setImprintCapitalInvestment}
                />

                <button
                  onClick={handleFoundImprint}
                  className="w-full rounded-xl bg-amber-500 py-3 text-xs font-black uppercase text-black shadow-lg hover:bg-amber-400 cursor-pointer"
                >
                  Incorporate Record Label Imprint ($
                  {imprintCapitalInvestment.toLocaleString()} Capital)
                </button>
              </div>
            ) : (
              <>
                {/* CEO Executive Dashboard Card */}
                <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#1D162B] via-[#13101D] to-[#0B0A10] p-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            imprint.logoUrl ||
                            getDefaultImprintLogoSvg(imprint.imprintName)
                          }
                          alt={imprint.imprintName}
                          className="h-16 w-16 rounded-2xl border-2 border-amber-400 object-cover shadow-xl"
                        />
                        <input
                          ref={imprintLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        <button
                          onClick={() => imprintLogoInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 rounded-lg bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-black shadow"
                        >
                          Logo
                        </button>
                      </div>
                      <div>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                          CEO Executive HQ • Prestige {imprint.prestige}/100
                        </span>
                        <h2 className="mt-0.5 text-lg font-black text-white">
                          {imprint.imprintName}
                        </h2>
                        <p className="text-[11px] text-zinc-400">
                          {imprint.headquarters} • {imprint.distributionPartnerName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Channel Metrics (Mobile Friendly 2x2 on Android) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                      <div className="text-[9px] uppercase text-zinc-400">Valuation</div>
                      <div className="text-xs font-black text-amber-300">
                        ${(imprint.valuation || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                      <div className="text-[9px] uppercase text-zinc-400">Daily Net</div>
                      <div className="text-xs font-black text-emerald-400">
                        +${(imprint.dailyImprintNetIncome || 0).toLocaleString()}/d
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                      <div className="text-[9px] uppercase text-zinc-400">Label YT Subs</div>
                      <div className="text-xs font-black text-rose-300">
                        {(labelYt.subscribers || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                      <div className="text-[9px] uppercase text-zinc-400">Label X Followers</div>
                      <div className="text-xs font-black text-sky-300">
                        {(labelX.followers || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Quick CEO Ecosystem Shortcuts */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        setGameState((prev) => ({ ...prev, activeApp: 'youtube' }))
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 py-2 text-[11px] font-black text-rose-200"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Label YouTube
                    </button>
                    <button
                      onClick={() =>
                        setGameState((prev) => ({ ...prev, activeApp: 'x' }))
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 py-2 text-[11px] font-black text-sky-200"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Label X (@HQ)
                    </button>
                    <button
                      onClick={() =>
                        setShowLabelDivisionStaffModal(!showLabelDivisionStaffModal)
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2 text-[11px] font-black text-amber-200"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Exec Staff ({Object.keys(labelStaffMap).length}/6)
                    </button>
                  </div>

                  {/* Recurring Staff Payroll Summary Banner */}
                  <LabelStaffPayrollSummaryBanner gameState={gameState} />
                </div>

                {/* Optional Collapsible Label-Wide Executive Staff Division */}
                {showLabelDivisionStaffModal && (
                  <div className="rounded-2xl border border-amber-500/35 bg-black/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-300">
                        {imprint.imprintName} Executive Staff Division (Buffs Entire Roster)
                      </span>
                      <button
                        onClick={() => setShowLabelDivisionStaffModal(false)}
                        className="text-xs text-zinc-400"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {STAFF_ROLE_ORDER.map((rId) => (
                        <button
                          key={rId}
                          onClick={() => setSelectedExecRole(rId)}
                          className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black ${
                            selectedExecRole === rId
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                              : 'border-white/10 bg-white/5 text-zinc-400'
                          }`}
                        >
                          {STAFF_ROLE_DEFINITIONS[rId].shortTitle}{' '}
                          {labelStaffMap[rId] ? '✓' : ''}
                        </button>
                      ))}
                    </div>

                    {labelStaffMap[selectedExecRole] && (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs">
                        <div>
                          <div className="font-black text-white">
                            {labelStaffMap[selectedExecRole].name} (
                            {labelStaffMap[selectedExecRole].tierLabel})
                          </div>
                          <div className="text-[10px] text-zinc-300">
                            {labelStaffMap[selectedExecRole].specialtyTag}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const next = releaseStaffFromRosterOrLabel(
                              gameState,
                              'label',
                              selectedExecRole
                            );
                            setGameState(next);
                            showToast('Released executive staff member.', 'success');
                          }}
                          className="rounded bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-200"
                        >
                          Release
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {STAFF_CANDIDATE_POOL.filter(
                        (c) => c.roleId === selectedExecRole
                      ).map((cand) => (
                        <div
                          key={cand.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5"
                        >
                          <div>
                            <div className="text-xs font-black text-white">
                              {cand.name}{' '}
                              <span className="text-[10px] text-amber-300">
                                ({cand.tierLabel})
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {cand.specialtyTag} • Retainer $
                              {cand.signingBonus.toLocaleString()} +{' '}
                              <span className="text-rose-300 font-bold">
                                ${(cand.baseDailyRate * 29).toLocaleString()}/mo Salary
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const res = hireStaffForRosterOrLabel(
                                gameState,
                                'label',
                                cand.id,
                                'monthly',
                                undefined,
                                12
                              );
                              if (!res.success) showToast(res.message, 'error');
                              else {
                                setGameState(res.nextState);
                                showToast(res.message, 'success');
                              }
                            }}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-black text-black"
                          >
                            Hire
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Signed Roster Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Active Signed Roster ({imprint.signedRoster.length})
                    </h3>
                    <button
                      onClick={() =>
                        setRecruitingCandidate({ open: true, candidate: null })
                      }
                      className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black shadow hover:bg-amber-400"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Sign Custom Artist (Paper Deal)
                    </button>
                  </div>

                  {imprint.signedRoster.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center text-xs text-zinc-400">
                      No artists signed yet. Recruit a scouted talent below or click
                      &ldquo;Sign Custom Artist&rdquo; to execute your first Physical Paper
                      Recording Contract!
                    </div>
                  ) : (
                    imprint.signedRoster.map((rawArt) => {
                      const art = ensureRosterArtistFullFields(rawArt, dateStr);
                      const stageName = art.stageName || art.name;
                      const staffCount = Object.keys(art.staffRoster || {}).length;
                      const riaaCount = (art.riaaCertifications || []).length;
                      const isExpired = isRosterArtistContractExpired(art);
                      const canRenew = canRosterArtistRenewContract(art);
                      const promoCooldown = Number(art.promoCooldownDaysLeft || 0);

                      return (
                        <div
                          key={art.id}
                          className={`rounded-2xl border p-4 space-y-3 ${
                            isExpired
                              ? 'border-rose-500/40 bg-rose-950/15'
                              : 'border-amber-500/30 bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={
                                  art.avatarUrl || buildRosterArtistAvatarSvg(stageName)
                                }
                                alt={stageName}
                                className="h-14 w-14 shrink-0 rounded-2xl border border-amber-400/50 object-cover shadow-md"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300">
                                    {art.genre} • {art.country || 'US'}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-400">
                                    {art.imprintRoyaltyCutPct}% Label Cut
                                  </span>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                      isExpired
                                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                                        : 'bg-emerald-500/15 text-emerald-300'
                                    }`}
                                  >
                                    {isExpired
                                      ? canRenew
                                        ? 'Expired • Open to Renew'
                                        : 'Former Roster • Retired'
                                      : `${art.daysRemaining ?? 720}d Contract`}
                                  </span>
                                </div>
                                <h4 className="truncate text-base font-black text-white">
                                  {stageName}
                                </h4>
                                <p className="truncate text-[11px] text-zinc-400">
                                  {art.realName} • {(art.fans || 0).toLocaleString()} Fans •{' '}
                                  {(art.monthlyListeners || 0).toLocaleString()} Listeners
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setManagingRosterArtistId(art.id)}
                              className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-black shadow hover:bg-amber-400"
                            >
                              CEO Studio &amp; Manage
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5 text-center font-mono">
                            <div className="rounded-lg bg-white/[0.03] py-1">
                              <div className="text-[9px] text-zinc-400">Pop / Hype</div>
                              <div className="text-xs font-black text-white">
                                {art.popularity} / {art.hype}
                              </div>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] py-1">
                              <div className="text-[9px] text-zinc-400">Discog</div>
                              <div className="text-xs font-black text-amber-300">
                                {(art.projects || []).length}LP • {(art.songs || []).length}S
                              </div>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] py-1">
                              <div className="text-[9px] text-zinc-400">Staff / RIAA</div>
                              <div className="text-xs font-black text-sky-300">
                                {staffCount}/6 • {riaaCount}🏆
                              </div>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] py-1">
                              <div className="text-[9px] text-zinc-400">Daily Strms</div>
                              <div className="text-xs font-black text-emerald-400">
                                +{(art.dailyStreams || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Label Trust Bar, Comeback Fatigue & Hiatus Status */}
                          <RosterTrustAndHiatusPanel
                            artist={art}
                            gameState={gameState}
                            setGameState={setGameState}
                            onNotify={showToast}
                            compact={true}
                          />

                          {/* International Shows, Country Expansion & Staff Auto-Booking */}
                          {!isExpired && (
                            <RosterShowQuickBanner
                              artist={art}
                              gameState={gameState}
                              setGameState={setGameState}
                              onOpenModal={(id) => setShowsModalArtistId(id)}
                              onNotify={showToast}
                            />
                          )}

                          {isExpired ? (
                            <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-black/40 p-2.5 text-[11px]">
                              <span className="text-zinc-300">
                                {canRenew
                                  ? 'Contract expired. Catalog still streams passively; renew deal to resume releases.'
                                  : 'Artist declined renewal and paused active releases. You can delete them in Settings.'}
                              </span>
                              {canRenew && (
                                <button
                                  onClick={() => {
                                    const res = renewExpiredRosterArtistContract(
                                      gameState,
                                      art.id,
                                      24
                                    );
                                    if (!res.success) showToast(res.message, 'error');
                                    else {
                                      setGameState(res.nextState);
                                      showToast(res.message, 'success');
                                    }
                                  }}
                                  className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black"
                                >
                                  Renew (24M)
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setManagingRosterArtistId(art.id)}
                                className="flex-1 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2 text-[11px] font-black text-amber-200 hover:bg-amber-500 hover:text-black"
                              >
                                Write/Produce Song, Album, Edit Name &amp; Staff
                              </button>
                              <button
                                disabled={promoCooldown > 0}
                                onClick={() => {
                                  const res = fundImprintArtistCampaign(gameState, art.id);
                                  if (!res.success) showToast(res.message, 'error');
                                  else {
                                    setGameState(res.nextState);
                                    showToast(res.message, 'success');
                                  }
                                }}
                                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold text-zinc-200 hover:bg-white/10 disabled:opacity-45"
                              >
                                {promoCooldown > 0
                                  ? `Promo (${promoCooldown}d)`
                                  : `Promo ($${Math.round(
                                      (25000 + art.popularity * 850) / 1000
                                    )}k)`}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* A&R Scouting Pool */}
                <div className="space-y-2.5 pt-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                    A&amp;R Global Scouting Pool (Recruit via Paper Contract)
                  </h3>
                  {IMPRINT_SCOUT_POOL.map((cand) => {
                    const alreadySigned = imprint.signedRoster.some(
                      (r) => r.id === cand.id
                    );
                    return (
                      <div
                        key={cand.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={buildRosterArtistAvatarSvg(cand.name)}
                            alt={cand.name}
                            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-white">
                                {cand.name}
                              </span>
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                {cand.genre} • {cand.country}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-zinc-400">
                              Pop {cand.popularity} • Potential {cand.potential} • Ask $
                              {cand.askingAdvance.toLocaleString()}
                            </div>
                            <p className="truncate text-[10px] text-zinc-400">
                              {cand.bio}
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={alreadySigned}
                          onClick={() =>
                            setRecruitingCandidate({ open: true, candidate: cand })
                          }
                          className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-[11px] font-black text-black disabled:opacity-40"
                        >
                          {alreadySigned ? 'Signed' : 'Draft Contract'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 4: ROYALTY, RECOUPMENT & IMPRINT ACCOUNTING LEDGER
           =================================================================== */}
        {activeTab === 'ledger' && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Official Label &amp; Imprint Accounting Statements
            </h3>
            {labelState.statements.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-zinc-400">
                No accounting statements recorded yet.
              </div>
            ) : (
              labelState.statements.map((st) => (
                <div
                  key={st.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400">
                      {st.date} • {st.category.toUpperCase()}
                    </span>
                    {st.amount > 0 && (
                      <span
                        className={`font-mono text-xs font-black ${
                          st.direction === 'credit'
                            ? 'text-emerald-400'
                            : st.direction === 'recoup'
                            ? 'text-amber-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {st.direction === 'credit'
                          ? '+'
                          : st.direction === 'debit'
                          ? '-'
                          : ''}
                        ${st.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs font-black text-white">{st.title}</div>
                  <p className="mt-0.5 text-[11px] text-zinc-400">{st.detail}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL A: PLAYER NEGOTIATING PHYSICAL PAPER CONTRACT WITH NPC LABEL
         ===================================================================== */}
      {negotiatingLabel && negotiationEvaluation && negotiationTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border-4 border-[#8B7355] bg-[#FBF8F1] p-5 text-[#181613] shadow-2xl">
            <div className="border-2 border-[#8B7355]/60 p-4 font-serif">
              <div className="flex items-start justify-between border-b-2 border-[#181613] pb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={negotiatingLabel.logoDataUri}
                    alt={negotiatingLabel.name}
                    className="h-12 w-12 rounded-xl border border-[#8B7355] object-cover"
                  />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#5C4D3C]">
                      OFFICIAL RECORDING CONTRACT
                    </div>
                    <h2 className="text-base font-black uppercase">
                      {negotiatingLabel.name}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setNegotiatingLabel(null)}
                  className="rounded-lg border border-[#8B7355] p-1 text-[#5C4D3C]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="block font-sans text-[10px] font-bold uppercase text-[#5C4D3C]">
                    1. Deal Architecture
                  </label>
                  <select
                    value={dealType}
                    onChange={(e) =>
                      handleDealTypeChange(e.target.value as RecordDealTypeId)
                    }
                    className="mt-1 w-full rounded border border-[#8B7355] bg-white px-2.5 py-1.5 font-sans text-xs font-bold"
                  >
                    {Object.values(RECORD_DEAL_STRUCTURES).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.shortTag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-sans text-[10px] font-bold uppercase text-[#5C4D3C]">
                    <span>2. Signing Advance</span>
                    <span className="font-mono text-xs font-black text-[#181613]">
                      ${proposedAdvance.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={negotiationTargets.minAdvance}
                    max={Math.max(100000, negotiationTargets.maxAdvance)}
                    step={25000}
                    value={proposedAdvance}
                    onChange={(e) => setProposedAdvance(Number(e.target.value))}
                    className="mt-1 w-full accent-[#181613]"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-sans text-[10px] font-bold uppercase text-[#5C4D3C]">
                    <span>3. Your Artist Master Royalty Share</span>
                    <span className="font-mono text-xs font-black text-[#181613]">
                      {proposedArtistRoyaltyPct}% Artist / {100 - proposedArtistRoyaltyPct}% Label
                    </span>
                  </div>
                  <input
                    type="range"
                    min={negotiationTargets.royaltyMin}
                    max={negotiationTargets.royaltyMax}
                    step={1}
                    value={proposedArtistRoyaltyPct}
                    onChange={(e) => setProposedArtistRoyaltyPct(Number(e.target.value))}
                    className="mt-1 w-full accent-[#181613]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 font-sans">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#5C4D3C]">
                      Album Quota
                    </label>
                    <select
                      value={proposedAlbumsQuota}
                      onChange={(e) => setProposedAlbumsQuota(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-[#8B7355] bg-white px-2 py-1 text-xs font-bold"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} Album{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#5C4D3C]">
                      Single Quota
                    </label>
                    <select
                      value={proposedSinglesQuota}
                      onChange={(e) => setProposedSinglesQuota(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-[#8B7355] bg-white px-2 py-1 text-xs font-bold"
                    >
                      {[2, 4, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} Singles
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded border border-[#8B7355] bg-[#EFE9D8] p-2.5 font-sans">
                  <div className="flex justify-between text-xs font-black">
                    <span>A&amp;R Board Approval Odds:</span>
                    <span>{negotiationEvaluation.approvalChancePct}%</span>
                  </div>
                  <p className="mt-1 text-[11px] italic text-[#3A332C]">
                    {negotiationEvaluation.boardReaction}
                  </p>
                </div>

                <button
                  onClick={handleSignPlayerDeal}
                  className="w-full rounded-xl bg-[#181613] py-3 font-sans text-xs font-black uppercase tracking-wider text-[#FBF8F1]"
                >
                  Execute &amp; Sign Official Record Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL B: VIEW ACTIVE PLAYER PAPER CONTRACT
         ===================================================================== */}
      {showActivePaperContractModal && activeContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-4 border-[#8B7355] bg-[#FBF8F1] p-5 text-[#181613] shadow-2xl">
            <div className="border-2 border-[#8B7355]/60 p-4 font-serif space-y-3 text-xs">
              <div className="flex items-center justify-between border-b-2 border-[#181613] pb-3">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#5C4D3C]">
                    EXECUTED RECORDING AGREEMENT • {activeContract.contractRef}
                  </div>
                  <h3 className="text-base font-black uppercase">
                    {activeContract.labelName} × {gameState.artist?.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowActivePaperContractModal(false)}
                  className="rounded border border-[#8B7355] px-2 py-1 font-sans text-xs font-bold"
                >
                  Close
                </button>
              </div>
              <p>
                <strong>1. SIGNING ADVANCE:</strong> $
                {activeContract.totalAdvanceReceived.toLocaleString()} (Unrecouped Balance: $
                {activeContract.unrecoupedBalance.toLocaleString()}).
              </p>
              <p>
                <strong>2. ROYALTY SPLIT:</strong> {activeContract.artistRoyaltyPct}% Artist
                / {100 - activeContract.artistRoyaltyPct}% Label (360 Cut:{' '}
                {activeContract.ancillary360CutPct}%).
              </p>
              <p>
                <strong>3. DELIVERY QUOTA:</strong> {activeContract.albumsDelivered}/
                {activeContract.albumQuotaTotal} Albums &amp;{' '}
                {activeContract.singlesDelivered}/{activeContract.singleQuotaTotal} Singles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL C: RECRUIT ROSTER ARTIST PAPER CONTRACT MODAL
         ===================================================================== */}
      {recruitingCandidate.open && (
        <RosterPaperContractModal
          gameState={gameState}
          setGameState={setGameState}
          candidate={recruitingCandidate.candidate}
          onClose={() => setRecruitingCandidate({ open: false, candidate: null })}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* =====================================================================
          MODAL D: FULL CEO STUDIO, PROFILE, STAFF & VISUALS FOR ROSTER ARTIST
         ===================================================================== */}
      {managingRosterArtistId && (
        <RosterArtistCeoManagerModal
          gameState={gameState}
          setGameState={setGameState}
          artistId={managingRosterArtistId}
          onClose={() => setManagingRosterArtistId(null)}
        />
      )}

      {/* =====================================================================
          MODAL E: ROSTER INTERNATIONAL SHOWS, COUNTRY EXPANSION & STAFF BOOKING
         ===================================================================== */}
      <RosterInternationalShowsModal
        isOpen={Boolean(showsModalArtistId)}
        initialArtistId={showsModalArtistId}
        onClose={() => setShowsModalArtistId(null)}
        gameState={gameState}
        setGameState={setGameState}
        onNotify={showToast}
      />
    </div>
  );
};

export default RecordLabelApp;
