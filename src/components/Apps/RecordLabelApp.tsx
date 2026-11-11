import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Crown,
  ExternalLink,
  FileSignature,
  FileText,
  Globe,
  ImagePlus,
  Send,
  Trophy,
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
import { RosterGroupCreatorAndManagerModal } from './RosterGroupCreatorAndManagerModal';
import {
  getArtistDualContractStatus,
  getEnsuredImprintGroups,
  reacquireMemberSoloContract,
  renewMemberDualOrGroupContract,
} from '../../data/rosterGroupAndDualContractEngine';
import { RosterBrandDealsAndAwardsModal } from './RosterBrandDealsAndAwardsModal';
import { getEnsuredRosterBrandDealsRecord } from '../../data/rosterBrandDealsAndAwardsEngine';

interface RecordLabelAppProps {
  gameState?: GameState;
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
  onBack?: () => void;
}

type MainTab = 'labels' | 'my_deal' | 'imprint' | 'ledger';
type CeoSubView = 'roster' | 'groups' | 'scouting' | 'exec_staff';

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
  const imprintGroups = useMemo(() => getEnsuredImprintGroups(gameState), [gameState]);
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';

  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (imprint.isFounded) return 'imprint';
    if (activeContract) return 'my_deal';
    return 'labels';
  });
  const [ceoSubView, setCeoSubView] = useState<CeoSubView>('roster');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'groups' | 'soloists'>('all');
  const [groupModalState, setGroupModalState] = useState<{
    open: boolean;
    mode: 'manage' | 'create';
  }>({ open: false, mode: 'manage' });
  const [rosterBrandAwardModal, setRosterBrandAwardModal] = useState<{
    open: boolean;
    tab: 'brands' | 'awards';
    artistId?: string;
  }>({ open: false, tab: 'brands' });

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
                <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#1F1630] via-[#130F1E] to-[#0A0810] p-4 space-y-3.5 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
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
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                            CEO Executive HQ • Prestige {imprint.prestige}/100
                          </span>
                          <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-pink-300">
                            {imprintGroups.length} Group{imprintGroups.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <h2 className="mt-0.5 truncate text-lg font-black text-white">
                          {imprint.imprintName}
                        </h2>
                        <p className="truncate text-[11px] text-zinc-400">
                          {imprint.headquarters} • {imprint.distributionPartnerName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Channel Metrics (Mobile Friendly 2x2 Grid) */}
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="rounded-2xl border border-white/10 bg-black/45 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                        Label Valuation
                      </div>
                      <div className="mt-0.5 text-xs font-black text-amber-300">
                        ${(imprint.valuation || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/45 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                        Daily Imprint Net
                      </div>
                      <div className="mt-0.5 text-xs font-black text-emerald-400">
                        +${(imprint.dailyImprintNetIncome || 0).toLocaleString()}/d
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/45 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                        Label YouTube Subs
                      </div>
                      <div className="mt-0.5 text-xs font-black text-rose-300">
                        {(labelYt.subscribers || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/45 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                        Label X Followers
                      </div>
                      <div className="mt-0.5 text-xs font-black text-sky-300">
                        {(labelX.followers || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Quick CEO Ecosystem & Group Formation Bar */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        setGameState((prev) => ({ ...prev, activeApp: 'youtube' }))
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 py-2 text-[11px] font-black text-rose-200"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Label YT
                    </button>
                    <button
                      onClick={() =>
                        setGameState((prev) => ({ ...prev, activeApp: 'x' }))
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 py-2 text-[11px] font-black text-sky-200"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Label X
                    </button>
                    <button
                      onClick={() =>
                        setGroupModalState({
                          open: true,
                          mode: imprintGroups.length === 0 ? 'create' : 'manage',
                        })
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-pink-400/50 bg-pink-500/20 py-2 text-[11px] font-black text-pink-200 shadow"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Group Hub
                    </button>
                  </div>

                  {/* CEO Roster Brand Deals & Award FYC Shortcuts */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setRosterBrandAwardModal({
                          open: true,
                          tab: 'brands',
                          artistId: imprint.signedRoster[0]?.id,
                        })
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 py-2 text-[11px] font-black text-amber-200 shadow hover:bg-amber-500 hover:text-black"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      Roster Brand Deals
                    </button>
                    <button
                      onClick={() =>
                        setRosterBrandAwardModal({
                          open: true,
                          tab: 'awards',
                          artistId: imprint.signedRoster[0]?.id,
                        })
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-yellow-400/50 bg-yellow-500/20 py-2 text-[11px] font-black text-yellow-200 shadow hover:bg-yellow-400 hover:text-black"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      CEO Award FYC Hub
                    </button>
                  </div>

                  {/* Recurring Staff Payroll Summary Banner */}
                  <LabelStaffPayrollSummaryBanner gameState={gameState} />
                </div>

                {/* Sleek Mobile-Friendly CEO Sub-Navigation Deck */}
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
                  {[
                    {
                      id: 'roster' as const,
                      label: `Roster (${imprint.signedRoster.length})`,
                    },
                    {
                      id: 'groups' as const,
                      label: `Groups (${imprintGroups.length})`,
                    },
                    {
                      id: 'scouting' as const,
                      label: `Scout (${IMPRINT_SCOUT_POOL.length})`,
                    },
                    {
                      id: 'exec_staff' as const,
                      label: `Staff (${Object.keys(labelStaffMap).length}/6)`,
                    },
                  ].map((sub) => {
                    const active = ceoSubView === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setCeoSubView(sub.id)}
                        className={`rounded-xl py-2 text-[10px] font-black uppercase tracking-tight transition ${
                          active
                            ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-black shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>

                {/* =============================================================
                    CEO SUB-VIEW 4: LABEL-WIDE EXECUTIVE STAFF DIVISION
                   ============================================================= */}
                {ceoSubView === 'exec_staff' && (
                  <div className="rounded-2xl border border-amber-500/35 bg-black/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-300">
                        {imprint.imprintName} Executive Staff Division (Buffs Entire Roster)
                      </span>
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

                {/* =============================================================
                    CEO SUB-VIEW 2: GROUPS & K-POP DUAL CONTRACTS OVERVIEW
                   ============================================================= */}
                {ceoSubView === 'groups' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">
                          Official Roster Groups ({imprintGroups.length})
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Combine 2–7 signed roster artists &amp; manage Group vs. Solo Contracts
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setGroupModalState({ open: true, mode: 'create' })
                        }
                        className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 px-3 py-2 text-[11px] font-black text-black shadow"
                      >
                        + Form New Group
                      </button>
                    </div>

                    {imprintGroups.length === 0 ? (
                      <div className="rounded-2xl border border-pink-500/30 bg-pink-500/[0.05] p-5 text-center space-y-3">
                        <Users className="mx-auto h-8 w-8 text-pink-400" />
                        <div className="text-sm font-black text-white">
                          No Official Roster Groups Yet
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Sign at least 2 Solo Roster Artists, then form a Group! Each member
                          will automatically carry your chosen stage credit format (
                          <strong>Name of Group</strong>, <strong>Name [Group]</strong>, or{' '}
                          <strong>Name Group</strong>) and hold a{' '}
                          <strong>Group Contract + Solo Exclusive Contract</strong>.
                        </p>
                        <button
                          onClick={() =>
                            setGroupModalState({ open: true, mode: 'create' })
                          }
                          className="rounded-xl bg-pink-500 px-4 py-2 text-xs font-black uppercase text-white"
                        >
                          Open Group Creator &amp; Dual Contract Hub
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {imprintGroups.map((grp) => {
                          const grpEntity = imprint.signedRoster.find(
                            (a) => a.id === grp.groupRosterArtistId
                          );
                          const members = grp.memberArtistIds
                            .map((id) => imprint.signedRoster.find((a) => a.id === id))
                            .filter(Boolean);

                          return (
                            <div
                              key={grp.id}
                              className="rounded-2xl border border-pink-500/35 bg-white/[0.04] p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={
                                      grpEntity?.avatarUrl ||
                                      grp.avatarUrl ||
                                      buildRosterArtistAvatarSvg(grp.groupName)
                                    }
                                    alt={grp.groupName}
                                    className="h-14 w-14 shrink-0 rounded-2xl border-2 border-pink-400 object-cover"
                                  />
                                  <div className="min-w-0">
                                    <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-pink-300">
                                      {members.length}-Member Flagship Group • Fandom: {grp.fandomName}
                                    </span>
                                    <h4 className="mt-0.5 truncate text-base font-black text-white">
                                      {grp.groupName}
                                    </h4>
                                    <p className="text-[11px] text-zinc-400">
                                      Pop {grpEntity?.popularity ?? 65} • Fans{' '}
                                      {(grpEntity?.fans ?? 100000).toLocaleString()} •{' '}
                                      {(grpEntity?.songs || []).length} Group Songs
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5 shrink-0">
                                  {grpEntity && (
                                    <button
                                      onClick={() => setManagingRosterArtistId(grpEntity.id)}
                                      className="rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black"
                                    >
                                      Group Studio
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      setGroupModalState({ open: true, mode: 'manage' })
                                    }
                                    className="rounded-xl border border-pink-400/50 bg-pink-500/20 px-3 py-1.5 text-[10px] font-black text-pink-200"
                                  >
                                    Dual Contracts
                                  </button>
                                </div>
                              </div>

                              {/* Member Pills Preview */}
                              <div className="flex flex-wrap gap-1.5">
                                {members.map((m) => {
                                  if (!m) return null;
                                  const d = getArtistDualContractStatus(m);
                                  return (
                                    <span
                                      key={m.id}
                                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                                        d.contractScope === 'full_dual'
                                          ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                                          : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                                      }`}
                                    >
                                      {d.formattedStageName} •{' '}
                                      {d.contractScope === 'full_dual'
                                        ? 'Group+Solo'
                                        : 'Group-Only (No Solo)'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* =============================================================
                    CEO SUB-VIEW 1: ACTIVE SIGNED ROSTER (GROUPS, MEMBERS & SOLOISTS)
                   ============================================================= */}
                {ceoSubView === 'roster' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Active Signed Roster ({imprint.signedRoster.length})
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setGroupModalState({
                              open: true,
                              mode: imprintGroups.length === 0 ? 'create' : 'manage',
                            })
                          }
                          className="flex items-center gap-1 rounded-xl border border-pink-400/50 bg-pink-500/20 px-2.5 py-1.5 text-[11px] font-black text-pink-200 shadow hover:bg-pink-500 hover:text-black"
                        >
                          <Users className="h-3.5 w-3.5" />
                          Form Group
                        </button>
                        <button
                          onClick={() =>
                            setRecruitingCandidate({ open: true, candidate: null })
                          }
                          className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black shadow hover:bg-amber-400"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Sign Artist
                        </button>
                      </div>
                    </div>

                    {/* Roster Filter Pills */}
                    {imprint.signedRoster.length > 0 && (
                      <div className="flex gap-1.5">
                        {[
                          { id: 'all' as const, label: `All (${imprint.signedRoster.length})` },
                          {
                            id: 'groups' as const,
                            label: `Official Groups (${
                              imprint.signedRoster.filter((a) => (a as any).isGroupEntity).length
                            })`,
                          },
                          {
                            id: 'soloists' as const,
                            label: `Soloists & Members (${
                              imprint.signedRoster.filter((a) => !(a as any).isGroupEntity).length
                            })`,
                          },
                        ].map((rf) => (
                          <button
                            key={rf.id}
                            onClick={() => setRosterFilter(rf.id)}
                            className={`rounded-xl border px-3 py-1 text-[10px] font-black ${
                              rosterFilter === rf.id
                                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                                : 'border-white/10 bg-white/5 text-zinc-400'
                            }`}
                          >
                            {rf.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {imprint.signedRoster.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center text-xs text-zinc-400">
                        No artists signed yet. Open the{' '}
                        <strong className="text-amber-300">Scout</strong> sub-tab or click
                        &ldquo;Sign Artist&rdquo; to execute your first Physical Paper
                        Recording Contract!
                      </div>
                    ) : (
                      imprint.signedRoster
                        .filter((rawArt) => {
                          if (rosterFilter === 'groups')
                            return Boolean((rawArt as any).isGroupEntity);
                          if (rosterFilter === 'soloists')
                            return !Boolean((rawArt as any).isGroupEntity);
                          return true;
                        })
                        .map((rawArt) => {
                          const art = ensureRosterArtistFullFields(rawArt, dateStr);
                          const dualStatus = getArtistDualContractStatus(art);
                          const stageName = dualStatus.isGroupMember
                            ? dualStatus.formattedStageName
                            : art.stageName || art.name;
                          const staffCount = Object.keys(art.staffRoster || {}).length;
                          const riaaCount = (art.riaaCertifications || []).length;
                          const isExpired = isRosterArtistContractExpired(art);
                          const canRenew = canRosterArtistRenewContract(art);
                          const promoCooldown = Number(art.promoCooldownDaysLeft || 0);
                          const parentGroup = dualStatus.groupId
                            ? imprintGroups.find((g) => g.id === dualStatus.groupId)
                            : undefined;

                          return (
                            <div
                              key={art.id}
                              className={`rounded-2xl border p-4 space-y-3 ${
                                isExpired
                                  ? 'border-rose-500/40 bg-rose-950/15'
                                  : dualStatus.isGroupEntity
                                  ? 'border-pink-500/45 bg-gradient-to-br from-[#23122E] to-[#120D1B]'
                                  : dualStatus.contractScope === 'group_only'
                                  ? 'border-amber-500/45 bg-amber-950/10'
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
                                    className={`h-14 w-14 shrink-0 rounded-2xl border object-cover shadow-md ${
                                      dualStatus.isGroupEntity
                                        ? 'border-pink-400'
                                        : 'border-amber-400/50'
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300">
                                        {art.genre} • {art.country || 'US'}
                                      </span>
                                      {dualStatus.isGroupEntity && (
                                        <span className="rounded bg-pink-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-pink-200">
                                          Official Group •{' '}
                                          {((art as any).memberArtistIds || []).length} Members
                                        </span>
                                      )}
                                      {dualStatus.isGroupMember && (
                                        <span
                                          className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                            dualStatus.contractScope === 'full_dual'
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : 'bg-rose-500/25 text-rose-300'
                                          }`}
                                        >
                                          {dualStatus.contractScope === 'full_dual'
                                            ? `Dual Deal: Group + Solo (${dualStatus.groupName})`
                                            : `Group-Only Deal • No Solo Rights`}
                                        </span>
                                      )}
                                      {!dualStatus.isGroupMember && (
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
                                      )}
                                    </div>
                                    <h4 className="mt-0.5 truncate text-base font-black text-white">
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
                                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black shadow ${
                                    dualStatus.isGroupEntity
                                      ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-black'
                                      : dualStatus.contractScope === 'group_only'
                                      ? 'border border-rose-400/50 bg-rose-500/20 text-rose-200'
                                      : 'bg-amber-500 text-black hover:bg-amber-400'
                                  }`}
                                >
                                  {dualStatus.isGroupEntity
                                    ? 'Group Studio'
                                    : dualStatus.contractScope === 'group_only'
                                    ? 'View Deal (Solo Locked)'
                                    : 'CEO Studio & Manage'}
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

                              {/* K-Pop Dual Contract Status Strip for Group Members */}
                              {dualStatus.isGroupMember && (
                                <div
                                  className={`rounded-xl border p-2.5 text-[11px] space-y-1.5 ${
                                    dualStatus.contractScope === 'group_only'
                                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                                      : 'border-pink-500/30 bg-pink-500/[0.06] text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-mono text-[10px]">
                                    <span>
                                      Group Deal ({dualStatus.groupName}):{' '}
                                      <strong className="text-emerald-300">
                                        {dualStatus.groupContractDaysLeft}d
                                      </strong>
                                    </span>
                                    <span>
                                      Solo Deal:{' '}
                                      <strong
                                        className={
                                          dualStatus.contractScope === 'full_dual'
                                            ? 'text-sky-300'
                                            : 'text-rose-300'
                                        }
                                      >
                                        {dualStatus.contractScope === 'full_dual'
                                          ? `${dualStatus.soloContractDaysLeft}d (100% Rights)`
                                          : 'Outside Agency (No Solo Rights)'}
                                      </strong>
                                    </span>
                                  </div>
                                  {dualStatus.contractScope === 'group_only' && (
                                    <p className="text-[10px] text-rose-200/90 leading-relaxed">
                                      {dualStatus.baseStageName} only renewed their{' '}
                                      <strong>{dualStatus.groupName}</strong> Group Contract with
                                      your label. You can release Group music, but cannot manage or
                                      release their Solo music unless you raise Trust to 76%+ and
                                      buy back their Solo Contract!
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {dualStatus.contractScope === 'group_only' ? (
                                      <>
                                        <button
                                          onClick={() => {
                                            const res = reacquireMemberSoloContract(
                                              gameState,
                                              art.id
                                            );
                                            if (!res.success) showToast(res.message, 'error');
                                            else {
                                              setGameState(res.nextState);
                                              showToast(res.message, 'success');
                                            }
                                          }}
                                          className="rounded-lg bg-sky-500 px-2.5 py-1 text-[10px] font-black text-black"
                                        >
                                          Buy Back Solo Contract (Req 76% Trust)
                                        </button>
                                        {parentGroup && (
                                          <button
                                            onClick={() =>
                                              setManagingRosterArtistId(
                                                parentGroup.groupRosterArtistId
                                              )
                                            }
                                            className="rounded-lg border border-pink-400/50 bg-pink-500/20 px-2.5 py-1 text-[10px] font-black text-pink-200"
                                          >
                                            Open {dualStatus.groupName} Group Studio
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            const res = renewMemberDualOrGroupContract(
                                              gameState,
                                              art.id,
                                              'full_dual'
                                            );
                                            if (!res.success) showToast(res.message, 'error');
                                            else {
                                              setGameState(res.nextState);
                                              showToast(res.message, 'success');
                                            }
                                          }}
                                          className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-200"
                                        >
                                          Renew Group+Solo (74%+ Trust)
                                        </button>
                                        <button
                                          onClick={() => {
                                            const res = renewMemberDualOrGroupContract(
                                              gameState,
                                              art.id,
                                              'group_only'
                                            );
                                            if (!res.success) showToast(res.message, 'error');
                                            else {
                                              setGameState(res.nextState);
                                              showToast(res.message, 'success');
                                            }
                                          }}
                                          className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black text-amber-200"
                                        >
                                          Renew Group-Only (48%+ Trust)
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Label Trust Bar, Comeback Fatigue & Hiatus Status */}
                              <RosterTrustAndHiatusPanel
                                artist={art}
                                gameState={gameState}
                                setGameState={setGameState}
                                onNotify={showToast}
                                compact={true}
                              />

                              {/* International Shows, Country Expansion & Staff Auto-Booking */}
                              {!isExpired && dualStatus.canManageSoloStudio && (
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
                                        const res = dualStatus.isGroupMember
                                          ? renewMemberDualOrGroupContract(
                                              gameState,
                                              art.id,
                                              'auto'
                                            )
                                          : renewExpiredRosterArtistContract(
                                              gameState,
                                              art.id,
                                              { termYears: 2 }
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
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setManagingRosterArtistId(art.id)}
                                      className="flex-1 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2 text-[11px] font-black text-amber-200 hover:bg-amber-500 hover:text-black"
                                    >
                                      {dualStatus.isGroupEntity
                                        ? `Release ${art.stageName} Group Song, Album & MV`
                                        : dualStatus.contractScope === 'group_only'
                                        ? 'Solo Studio Locked (Group-Only Deal)'
                                        : 'Write/Produce Song, Album, Edit Name & Staff'}
                                    </button>
                                    <button
                                      disabled={promoCooldown > 0}
                                      onClick={() => {
                                        const res = fundImprintArtistCampaign(
                                          gameState,
                                          art.id
                                        );
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

                                  {/* Expanded Roster Ecosystem Bar: Brand Deals, Award FYC, iTunes Profile, X & Fandom */}
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                      onClick={() =>
                                        setRosterBrandAwardModal({
                                          open: true,
                                          tab: 'brands',
                                          artistId: art.id,
                                        })
                                      }
                                      className="flex items-center justify-center gap-1 rounded-xl border border-amber-400/35 bg-amber-500/10 py-1.5 text-[10px] font-black text-amber-200 hover:bg-amber-500 hover:text-black"
                                    >
                                      <Briefcase className="h-3 w-3" />
                                      <span>
                                        Brands (
                                        {
                                          getEnsuredRosterBrandDealsRecord(
                                            gameState,
                                            art
                                          ).activeContracts.length
                                        }
                                        )
                                      </span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        setRosterBrandAwardModal({
                                          open: true,
                                          tab: 'awards',
                                          artistId: art.id,
                                        })
                                      }
                                      className="flex items-center justify-center gap-1 rounded-xl border border-yellow-400/35 bg-yellow-500/10 py-1.5 text-[10px] font-black text-yellow-200 hover:bg-yellow-400 hover:text-black"
                                    >
                                      <Trophy className="h-3 w-3" />
                                      <span>Award FYC</span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        setGameState((prev) => ({
                                          ...prev,
                                          activeApp: 'itunes',
                                          selectedItunesArtistName: stageName,
                                        } as any))
                                      }
                                      className="flex items-center justify-center gap-1 rounded-xl border border-sky-400/35 bg-sky-500/10 py-1.5 text-[10px] font-black text-sky-200 hover:bg-sky-500 hover:text-black"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span>iTunes</span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        setGameState((prev) => ({
                                          ...prev,
                                          activeApp: 'x',
                                          selectedRosterProfileArtistId: art.id,
                                        } as any))
                                      }
                                      className="flex items-center justify-center gap-1 rounded-xl border border-pink-400/35 bg-pink-500/10 py-1.5 text-[10px] font-black text-pink-200 hover:bg-pink-500 hover:text-black"
                                    >
                                      <Users className="h-3 w-3" />
                                      <span>X &amp; Stans</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {/* =============================================================
                    CEO SUB-VIEW 3: A&R GLOBAL SCOUTING POOL
                   ============================================================= */}
                {ceoSubView === 'scouting' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                        A&amp;R Global Scouting Pool
                      </h3>
                      <button
                        onClick={() =>
                          setRecruitingCandidate({ open: true, candidate: null })
                        }
                        className="rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-black text-black"
                      >
                        + Custom Artist Deal
                      </button>
                    </div>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
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
                )}
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
          onNotify={(msg, tone) => showToast(msg, tone || 'success')}
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
          onNotify={(msg, tone) => showToast(msg, tone || 'success')}
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

      {/* =====================================================================
          MODAL F: ROSTER GROUP CREATOR & K-POP DUAL CONTRACT MANAGER
         ===================================================================== */}
      <RosterGroupCreatorAndManagerModal
        isOpen={groupModalState.open}
        initialMode={groupModalState.mode}
        onClose={() => setGroupModalState((prev) => ({ ...prev, open: false }))}
        gameState={gameState}
        setGameState={setGameState}
        onOpenArtistStudio={(id) => setManagingRosterArtistId(id)}
        onNotify={showToast}
      />

      {/* =====================================================================
          MODAL G: ROSTER BRAND DEALS & CEO AWARD FYC HUB
         ===================================================================== */}
      <RosterBrandDealsAndAwardsModal
        isOpen={rosterBrandAwardModal.open}
        initialTab={rosterBrandAwardModal.tab}
        initialArtistId={rosterBrandAwardModal.artistId}
        onClose={() => setRosterBrandAwardModal((prev) => ({ ...prev, open: false }))}
        gameState={gameState}
        setGameState={setGameState}
        onNotify={showToast}
      />
    </div>
  );
};

export default RecordLabelApp;
