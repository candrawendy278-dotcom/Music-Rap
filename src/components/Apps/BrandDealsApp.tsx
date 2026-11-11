import React, { useState, useMemo } from 'react';
import { GameState } from '../../types';
import { useGameContext } from '../../GameContext';
import {
  BRAND_OFFERS_CATALOG,
  AMBASSADOR_ROLE_TIERS,
  getAmbassadorRoleTierMeta,
  BrandOfferDefinition,
  BrandSignatureProduct,
  BrandVertical,
  AmbassadorRoleTierId,
  IncomingBrandProposal,
  getEnsuredBrandDealsState,
  getActiveIncomingBrandProposals,
  acceptIncomingBrandProposal,
  declineIncomingBrandProposal,
  pitchBrandForProposal,
  promoteBrandContractTier,
  executeBrandCampaignDeliverable,
  launchBrandSignatureCapsuleDrop,
  terminateBrandContractEarly,
} from '../../data/brandDealsEngine';
import {
  getRealBrandVisualConfig,
  getRealProductAssetMeta,
  calculateBrandImpactReport,
  calculateGlobalBrandImpactSummary,
} from '../../data/brandRealAssetsAndImpactEngine';
import {
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Camera,
  Crown,
  ChevronRight,
  XCircle,
  Globe,
  LineChart,
  Activity,
  Mail,
  Send,
  Clock,
} from 'lucide-react';

interface BrandDealsAppProps {
  gameState?: GameState;
  onUpdateState?: (newState: GameState) => void;
  onShowAlert?: (title: string, message: string) => void;
}

const VERTICAL_FILTERS: { id: 'all' | BrandVertical; label: string }[] = [
  { id: 'all', label: 'All Maisons' },
  { id: 'fashion', label: 'Haute Couture' },
  { id: 'horology_beauty', label: 'Watches & Jewelry' },
  { id: 'streetwear', label: 'Sneakers & Street' },
  { id: 'tech_audio', label: 'Tech & Gaming' },
  { id: 'beverage_lifestyle', label: 'Auto & Spirits' },
];

/**
 * Renders the authentic brand logo from Wikimedia Commons / SimpleIcons with an automatic
 * crisp SVG monogram fallback if the network image fails or is blocked.
 */
const BrandRealLogoBadge: React.FC<{
  offer: BrandOfferDefinition;
  size?: 'sm' | 'md' | 'lg';
}> = ({ offer, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const visualCfg = getRealBrandVisualConfig(offer.id);

  const dims =
    size === 'sm'
      ? 'w-11 h-11 rounded-xl p-1.5'
      : size === 'lg'
      ? 'w-16 h-16 rounded-2xl p-2.5'
      : 'w-13 h-13 rounded-2xl p-2';

  return (
    <div
      className={`${dims} shrink-0 flex items-center justify-center border border-white/20 shadow-lg relative overflow-hidden bg-zinc-950`}
      title={`${offer.brandName} Official Mark`}
    >
      {visualCfg.officialLogoUrl && !imgError ? (
        <img
          src={visualCfg.officialLogoUrl}
          alt={offer.brandName}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <img
          src={visualCfg.authenticMonogramSvgDataUri}
          alt={offer.brandName}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
};

/**
 * Renders the authentic real-world product photograph with automatic fallback
 * to secondary photography if the primary URL fails.
 */
const BrandRealProductPhoto: React.FC<{
  product: BrandSignatureProduct;
  className?: string;
}> = ({ product, className = 'w-20 h-20' }) => {
  const [useFallback, setUseFallback] = useState(false);
  const prodMeta = getRealProductAssetMeta(product);

  return (
    <div
      className={`${className} rounded-xl bg-zinc-950 border border-white/15 overflow-hidden relative shrink-0 flex items-center justify-center group`}
    >
      <img
        src={useFallback ? prodMeta.fallbackPhotoUrl : prodMeta.realPhotoUrl}
        alt={prodMeta.officialProductName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={() => {
          if (!useFallback) setUseFallback(true);
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export const BrandDealsApp: React.FC<BrandDealsAppProps> = ({
  gameState: propGameState,
  onUpdateState: propOnUpdateState,
  onShowAlert: propOnShowAlert,
}) => {
  const context = useGameContext();
  const gameState = propGameState || context.state;
  const onUpdateState =
    propOnUpdateState || ((nextState: GameState) => context.setState(nextState));
  const onShowAlert =
    propOnShowAlert ||
    ((title: string, message: string) =>
      context.setInfoModal({ title, desc: message }));

  const handleCloseApp = () => {
    context.setState((prev) => ({ ...prev, activeApp: 'none' }));
  };

  const [activeTab, setActiveTab] = useState<'inbox' | 'contracts' | 'products' | 'impact'>(
    'inbox'
  );
  const [selectedVertical, setSelectedVertical] = useState<'all' | BrandVertical>('all');
  const [inspectProposalModal, setInspectProposalModal] = useState<{
    offer: BrandOfferDefinition;
    proposal: IncomingBrandProposal;
  } | null>(null);
  const [inspectImpactOffer, setInspectImpactOffer] = useState<BrandOfferDefinition | null>(
    null
  );

  const brandState = useMemo(() => getEnsuredBrandDealsState(gameState), [gameState]);
  const incomingProposals = useMemo(
    () => getActiveIncomingBrandProposals(gameState),
    [gameState]
  );
  const globalImpact = useMemo(
    () => calculateGlobalBrandImpactSummary(gameState),
    [gameState]
  );

  const proposalMap = useMemo(() => {
    const map = new Map<string, IncomingBrandProposal>();
    for (const p of incomingProposals) {
      map.set(p.offerId, p);
    }
    return map;
  }, [incomingProposals]);

  const filteredOffers = useMemo(() => {
    return BRAND_OFFERS_CATALOG.filter((offer) =>
      selectedVertical === 'all' ? true : offer.vertical === selectedVertical
    );
  }, [selectedVertical]);

  const formatMoney = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Math.round(val).toLocaleString()}`;
  };

  const formatNumber = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return Math.round(val).toLocaleString();
  };

  const getTierBadgeStyle = (roleTierId?: AmbassadorRoleTierId) => {
    switch (roleTierId) {
      case 'face_of_brand':
        return 'bg-gradient-to-r from-amber-500/30 via-yellow-400/25 to-amber-500/30 text-amber-200 border-amber-400/50';
      case 'global_ambassador':
        return 'bg-purple-500/25 text-purple-200 border-purple-400/40';
      case 'house_ambassador':
        return 'bg-sky-500/25 text-sky-200 border-sky-400/40';
      case 'brand_ambassador':
        return 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const handleAcceptProposal = (offerId: string) => {
    const res = acceptIncomingBrandProposal(gameState, offerId);
    onUpdateState(res.updatedState);
    if (res.success) {
      setInspectProposalModal(null);
      setActiveTab('contracts');
    }
    onShowAlert(res.success ? 'Contract Signed' : 'Cannot Sign Offer', res.message);
  };

  const handleDeclineProposal = (offerId: string) => {
    const res = declineIncomingBrandProposal(gameState, offerId);
    onUpdateState(res.updatedState);
    setInspectProposalModal(null);
    onShowAlert('Offer Declined', res.message);
  };

  const handlePitchBrand = (offerId: string) => {
    const res = pitchBrandForProposal(gameState, offerId);
    onUpdateState(res.updatedState);
    onShowAlert(res.success ? 'Board Offer Received!' : 'Maison Evaluation', res.message);
  };

  const handlePromoteTier = (offerId: string) => {
    const res = promoteBrandContractTier(gameState, offerId);
    onUpdateState(res.updatedState);
    onShowAlert(res.success ? 'Tier Elevated!' : 'Board Review', res.message);
  };

  const handleCampaignShoot = (offerId: string) => {
    const res = executeBrandCampaignDeliverable(gameState, offerId);
    onUpdateState(res.updatedState);
    onShowAlert(res.success ? 'Campaign Delivered' : 'Action Unavailable', res.message);
  };

  const handleCapsuleDrop = (offerId: string, productId: string) => {
    const res = launchBrandSignatureCapsuleDrop(gameState, offerId, productId);
    onUpdateState(res.updatedState);
    onShowAlert(res.success ? 'Collab Capsule Dropped!' : 'Drop Unavailable', res.message);
  };

  const handleTerminate = (offerId: string) => {
    const res = terminateBrandContractEarly(gameState, offerId);
    onUpdateState(res.updatedState);
    onShowAlert(res.success ? 'Contract Terminated' : 'Error', res.message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07070a] text-white flex flex-col overflow-y-auto animate-fade-in pb-28">
      <div className="max-w-md mx-auto w-full">
        {/* Mobile-First Sticky Header */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-amber-500/15 via-zinc-900/95 to-[#07070a] px-4 pt-4 pb-3.5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={handleCloseApp}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 cursor-pointer"
                title="Back to Apps"
              >
                <i className="ph-bold ph-arrow-left text-base"></i>
              </button>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-5 h-5 text-black" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-amber-300 font-bold">
                    Maison Endorsements
                  </span>
                </div>
                <h1 className="text-base font-black tracking-tight text-white truncate">
                  Global Brand Deals
                </h1>
              </div>
            </div>

            <div className="text-right shrink-0 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                Brand Earnings
              </div>
              <div className="text-xs font-black text-emerald-400">
                {formatMoney(brandState.totalEndorsementIncomeAllTime)}
              </div>
            </div>
          </div>

          {/* Mobile 2x2 KPI Summary Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                  Inbox Offers
                </div>
                <div className="text-sm font-black text-amber-300 flex items-center gap-1">
                  {incomingProposals.length}
                  <span className="text-[10px] font-medium text-zinc-400">from Brands</span>
                </div>
              </div>
              <Mail className="w-4 h-4 text-amber-400/80 shrink-0" />
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                  Active Deals
                </div>
                <div className="text-sm font-black text-white">
                  {brandState.activeContracts.length}
                  <span className="text-[10px] font-medium text-zinc-400"> signed</span>
                </div>
              </div>
              <Award className="w-4 h-4 text-sky-400/80 shrink-0" />
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                  Earned Media (MIV)
                </div>
                <div className="text-sm font-black text-sky-300">
                  {formatMoney(globalImpact.totalEMVGenerated)}
                </div>
              </div>
              <Activity className="w-4 h-4 text-sky-400/80 shrink-0" />
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                  Avg Sales Surge
                </div>
                <div className="text-sm font-black text-emerald-400">
                  +{globalImpact.avgSalesLiftPct}%
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400/80 shrink-0" />
            </div>
          </div>

          {/* Automatic Tier Promotion Notification Banner (if triggered recently) */}
          {brandState.lastAutoPromotionMessage && (
            <div className="mb-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 px-3 py-2 flex items-center gap-2">
              <Crown className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-[10px] font-bold text-emerald-200 leading-snug">
                {brandState.lastAutoPromotionMessage}
              </span>
            </div>
          )}

          {/* 4-Tab Mobile Navigation Bar */}
          <div className="grid grid-cols-4 gap-1 bg-zinc-900/95 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
                activeTab === 'inbox'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Offers</span>
                {incomingProposals.length > 0 && (
                  <span
                    className={`text-[9px] px-1 rounded-full font-black ${
                      activeTab === 'inbox'
                        ? 'bg-black text-amber-300'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {incomingProposals.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
                activeTab === 'contracts'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>Contracts</span>
                {brandState.activeContracts.length > 0 && (
                  <span
                    className={`text-[9px] px-1 rounded-full font-black ${
                      activeTab === 'contracts'
                        ? 'bg-black text-amber-300'
                        : 'bg-emerald-400/20 text-emerald-300'
                    }`}
                  >
                    {brandState.activeContracts.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
                activeTab === 'products'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Products</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('impact')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
                activeTab === 'impact'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <LineChart className="w-3.5 h-3.5" />
                <span>Impact</span>
              </div>
            </button>
          </div>
        </div>

        {/* ============================================================
            TAB 1: INCOMING BRAND PROPOSALS INBOX + MAISON DIRECTORY
           ============================================================ */}
        {activeTab === 'inbox' && (
          <div className="p-3.5 space-y-5">
            {/* How Brand-Initiated Contracts Work Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-400/25 p-3.5">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-white">
                    Brands Invite You & Decide Your Ambassador Tier
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                    Global Maisons evaluate your Popularity, Hype, Flex Score & Commercial Impact to send
                    official contract proposals. Sign an offer and build impact—the Brand Board will
                    automatically promote your Ambassador Tier over time!
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION A: INCOMING OFFERS FROM BRANDS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Incoming Proposals From Brands ({incomingProposals.length})
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    Official contract offers sent by Maison Executive Boards
                  </p>
                </div>
              </div>

              {incomingProposals.length === 0 ? (
                <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-5 text-center space-y-2">
                  <Mail className="w-7 h-7 text-zinc-500 mx-auto" />
                  <div className="text-xs font-bold text-white">No Pending Offers Right Now</div>
                  <p className="text-[11px] text-zinc-400">
                    New brand proposals arrive automatically as your Hype and Impact grow, or pitch a
                    Maison below to request an immediate Board review.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingProposals.map((proposal) => {
                    const offer = BRAND_OFFERS_CATALOG.find((o) => o.id === proposal.offerId);
                    if (!offer) return null;

                    const impact = calculateBrandImpactReport(gameState, offer);
                    const visualCfg = getRealBrandVisualConfig(offer.id);

                    return (
                      <div
                        key={proposal.id}
                        className="rounded-2xl bg-zinc-900/95 border border-amber-400/30 overflow-hidden shadow-xl"
                      >
                        {/* Top Header with Brand Logo & Brand-Selected Tier */}
                        <div
                          className="p-3.5 border-b border-white/10"
                          style={{
                            background: `linear-gradient(135deg, ${offer.accentColor}22 0%, rgba(24,24,27,0.96) 75%)`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <BrandRealLogoBadge offer={offer} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 truncate">
                                  {offer.parentGroup} • {offer.heritageLabel}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 shrink-0">
                                  <Clock className="w-2.5 h-2.5" />
                                  {proposal.expiresInDays}d left
                                </span>
                              </div>

                              <h3 className="text-base font-black text-white truncate mt-0.5">
                                {offer.brandName}
                              </h3>

                              {/* Brand-Determined Tier Pill */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${getTierBadgeStyle(
                                    proposal.offeredRoleTierId
                                  )}`}
                                >
                                  Brand Offer: {proposal.offeredRoleTitle}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10">
                                  {proposal.offeredDurationDays} Days
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Executive Board Offer Quote */}
                          <div className="mt-3 rounded-xl bg-black/45 border border-white/10 p-2.5">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/90 mb-0.5">
                              {proposal.executiveName} — {proposal.executiveTitle}
                            </div>
                            <p className="text-[11px] text-zinc-300 italic leading-relaxed">
                              {proposal.offerLetterQuote}
                            </p>
                          </div>
                        </div>

                        {/* 2x2 Financial Terms Grid */}
                        <div className="p-3.5 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                              <div className="text-[9px] uppercase text-zinc-400">
                                Upfront Signing Bonus
                              </div>
                              <div className="text-sm font-black text-emerald-400 mt-0.5">
                                {formatMoney(proposal.signingBonus)}
                              </div>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                              <div className="text-[9px] uppercase text-zinc-400">
                                Daily Cash Retainer
                              </div>
                              <div className="text-sm font-black text-white mt-0.5">
                                {formatMoney(proposal.dailyRetainer)}
                                <span className="text-[10px] font-normal text-zinc-400">/day</span>
                              </div>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                              <div className="text-[9px] uppercase text-zinc-400">
                                Product Royalty Cut
                              </div>
                              <div className="text-sm font-black text-amber-300 mt-0.5">
                                {proposal.productRoyaltyPct}%
                                <span className="text-[10px] font-normal text-zinc-400">
                                  {' '}
                                  (~{formatMoney(proposal.estimatedDailyProductRoyalty)}/d)
                                </span>
                              </div>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                              <div className="text-[9px] uppercase text-zinc-400">
                                Projected Impact
                              </div>
                              <div className="text-sm font-black text-sky-300 mt-0.5">
                                +{impact.salesConversionLiftPct}% Sales
                              </div>
                            </div>
                          </div>

                          {/* Horizontal Mini Preview of Official Brand Products */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                              <span className="font-bold uppercase tracking-wider">
                                Royalty-Bearing Hero Products ({offer.signatureProducts.length})
                              </span>
                              <span className="text-emerald-400 font-semibold">
                                {visualCfg.stockTicker}
                              </span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {offer.signatureProducts.map((prod) => {
                                const realProd = getRealProductAssetMeta(prod);
                                return (
                                  <div
                                    key={prod.id}
                                    className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 pr-2.5 shrink-0 max-w-[215px]"
                                  >
                                    <BrandRealProductPhoto product={prod} className="w-10 h-10" />
                                    <div className="min-w-0">
                                      <div className="text-[10px] font-bold text-white truncate">
                                        {realProd.officialProductName}
                                      </div>
                                      <div className="text-[9px] text-amber-300 font-semibold">
                                        ${prod.retailPrice.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Mobile Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleAcceptProposal(offer.id)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all min-h-[44px] flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Accept Offer
                            </button>

                            <button
                              onClick={() => setInspectProposalModal({ offer, proposal })}
                              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 min-h-[44px]"
                            >
                              Details
                            </button>

                            <button
                              onClick={() => handleDeclineProposal(offer.id)}
                              className="py-2.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold min-h-[44px]"
                              title="Decline Offer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION B: ALL 18 GLOBAL MAISONS DIRECTORY (PITCH OR INSPECT) */}
            <div className="pt-2 space-y-3 border-t border-white/10">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Global Maison Directory ({BRAND_OFFERS_CATALOG.length} Real-World Houses)
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Browse every Maison or send a PR Lookbook Pitch so their Executive Board evaluates
                  you for an official contract proposal.
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {VERTICAL_FILTERS.map((vf) => (
                  <button
                    key={vf.id}
                    onClick={() => setSelectedVertical(vf.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                      selectedVertical === vf.id
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900/90 text-zinc-400 border-white/10'
                    }`}
                  >
                    {vf.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredOffers.map((offer) => {
                  const activeContract = brandState.activeContracts.find(
                    (c) => c.offerId === offer.id
                  );
                  const existingProposal = proposalMap.get(offer.id);
                  const affinity = brandState.brandAffinityByOfferId?.[offer.id] || 0;
                  const impact = calculateBrandImpactReport(gameState, offer);

                  return (
                    <div
                      key={offer.id}
                      className="rounded-2xl bg-zinc-900/80 border border-white/10 p-3 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <BrandRealLogoBadge offer={offer} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-zinc-400 truncate">
                              {offer.verticalLabel}
                            </span>
                            <span className="text-[9px] text-amber-300 font-bold shrink-0">
                              Affinity: {Math.round(affinity)} XP
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white truncate">
                            {offer.brandName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>Est. Lift: +{impact.salesConversionLiftPct}%</span>
                            <span>•</span>
                            <span>MIV: {formatMoney(impact.earnedMediaValueEMV)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                        {activeContract ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Signed: {activeContract.roleTitle}
                            </span>
                            <button
                              onClick={() => setActiveTab('contracts')}
                              className="text-[10px] font-bold text-amber-300 underline"
                            >
                              Manage
                            </button>
                          </div>
                        ) : existingProposal ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-amber-300 truncate pr-2">
                              Offer Waiting: {existingProposal.offeredRoleTitle}
                            </span>
                            <button
                              onClick={() => handleAcceptProposal(offer.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-[10px] font-black shrink-0"
                            >
                              Accept Offer
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[10px] text-zinc-400 truncate">
                              Req: Pop {offer.minPopularity} • Hype {offer.minHype}%
                              {offer.minFlexScore > 0 ? ` • Flex ${offer.minFlexScore}` : ''}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setInspectImpactOffer(offer)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-bold border border-white/10"
                              >
                                Impact
                              </button>
                              <button
                                onClick={() => handlePitchBrand(offer.id)}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-black text-white text-[10px] font-black border border-white/15 transition-all flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Pitch Maison
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: MY ACTIVE CONTRACTS & AUTOMATIC TIER PROGRESSION
           ============================================================ */}
        {activeTab === 'contracts' && (
          <div className="p-3.5 space-y-4">
            {brandState.activeContracts.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-8 text-center space-y-3">
                <Award className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-black text-white">No Active Ambassador Contracts</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Open the <span className="text-amber-300 font-bold">Offers</span> tab to review
                  incoming contract proposals sent by global brands, or pitch a Maison to get an
                  invitation.
                </p>
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs shadow-lg"
                >
                  View Incoming Brand Offers ({incomingProposals.length})
                </button>
              </div>
            ) : (
              brandState.activeContracts.map((contract) => {
                const offer = BRAND_OFFERS_CATALOG.find((o) => o.id === contract.offerId);
                if (!offer) return null;

                const currentRoleMeta = getAmbassadorRoleTierMeta(contract.roleTierId);
                const nextRoleMeta = AMBASSADOR_ROLE_TIERS.find(
                  (t) => t.order === currentRoleMeta.order + 1
                );

                const currentAffinity = Math.round(
                  contract.brandAffinityXp ||
                    brandState.brandAffinityByOfferId?.[offer.id] ||
                    0
                );
                const requiredAffinity = nextRoleMeta
                  ? nextRoleMeta.requiredAffinityForPromotion
                  : 125;
                const progressPct = nextRoleMeta
                  ? Math.min(
                      100,
                      Math.round((currentAffinity / Math.max(1, requiredAffinity)) * 100)
                    )
                  : 100;

                const impactReport = calculateBrandImpactReport(gameState, offer, contract);
                const shootReady = contract.daysSinceLastShoot >= contract.shootCooldownDays;
                const shootWaitDays = Math.max(
                  0,
                  contract.shootCooldownDays - contract.daysSinceLastShoot
                );

                return (
                  <div
                    key={contract.offerId}
                    className="rounded-2xl bg-zinc-900/95 border border-white/15 overflow-hidden shadow-xl space-y-3.5 p-3.5"
                  >
                    {/* Contract Header */}
                    <div className="flex items-start gap-3">
                      <BrandRealLogoBadge offer={offer} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 truncate">
                            {offer.parentGroup}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-300">
                            {contract.daysRemaining}d remaining
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white truncate">
                          {offer.brandName}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${getTierBadgeStyle(
                              contract.roleTierId
                            )}`}
                          >
                            {contract.roleTitle || `${offer.brandName} ${currentRoleMeta.title}`}
                          </span>
                          {contract.isExclusive && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                              Exclusive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Automatic Brand Board Tier Progression Card */}
                    <div className="rounded-xl bg-gradient-to-br from-amber-500/10 via-black/60 to-black/60 border border-amber-400/25 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5" />
                          {nextRoleMeta
                            ? `Next Tier: ${
                                nextRoleMeta.id === 'face_of_brand'
                                  ? offer.faceOfDesignation
                                  : nextRoleMeta.title
                              }`
                            : 'Pinnacle Tier Achieved'}
                        </div>
                        <span className="text-[10px] font-bold text-white shrink-0">
                          {currentAffinity} / {requiredAffinity} Impact XP
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {nextRoleMeta
                            ? 'Your Ambassador Tier upgrades automatically as your daily Brand Impact & Affinity XP hit 100%, or request an immediate Board review.'
                            : `You have reached ${offer.faceOfDesignation} — the highest rank at ${offer.brandName}.`}
                        </p>
                        {nextRoleMeta && (
                          <button
                            onClick={() => handlePromoteTier(contract.offerId)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all ${
                              progressPct >= 100
                                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                                : 'bg-white/10 text-zinc-300 border border-white/10'
                            }`}
                          >
                            Board Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2x2 Contract Earnings & Impact Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[9px] uppercase text-zinc-400">Daily Retainer</div>
                        <div className="text-sm font-black text-white mt-0.5">
                          {formatMoney(contract.dailyRetainer)}/day
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[9px] uppercase text-zinc-400">Royalty Share</div>
                        <div className="text-sm font-black text-amber-300 mt-0.5">
                          {contract.productRoyaltyPct ?? 4}% Cut
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[9px] uppercase text-zinc-400">
                          Total Earned on Deal
                        </div>
                        <div className="text-sm font-black text-emerald-400 mt-0.5">
                          {formatMoney(contract.totalEarnedFromContract)}
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[9px] uppercase text-zinc-400">Your Sales Lift</div>
                        <div className="text-sm font-black text-sky-300 mt-0.5">
                          +{impactReport.salesConversionLiftPct}% Surge
                        </div>
                      </div>
                    </div>

                    {/* Campaign Deliverable Action */}
                    <div className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-2.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{contract.shootDeliverableName}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          +{formatMoney(contract.shootBonusPayout)} • +{contract.shootHypeGain}%
                          Hype • <span className="text-amber-300 font-bold">+22 Impact XP</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCampaignShoot(contract.offerId)}
                        className={`px-3 py-2 rounded-xl font-black text-xs shrink-0 min-h-[40px] ${
                          shootReady
                            ? 'bg-amber-400 hover:bg-amber-300 text-black'
                            : 'bg-white/10 text-zinc-400 border border-white/10'
                        }`}
                      >
                        {shootReady ? 'Shoot Campaign' : `${shootWaitDays}d Cooldown`}
                      </button>
                    </div>

                    {/* Signature Product Co-Design Capsule Drops */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">
                        Launch Co-Branded Product Drop (+30 Impact XP)
                      </div>
                      <div className="space-y-2">
                        {offer.signatureProducts.map((prod) => {
                          const realProd = getRealProductAssetMeta(prod);
                          return (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between gap-2.5 bg-black/45 border border-white/10 rounded-xl p-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <BrandRealProductPhoto product={prod} className="w-12 h-12" />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">
                                    {realProd.officialProductName}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    Retail ${prod.retailPrice.toLocaleString()} •{' '}
                                    {contract.productRoyaltyPct ?? 4}% royalty
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleCapsuleDrop(contract.offerId, prod.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-black shrink-0"
                              >
                                Drop Capsule
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <button
                        onClick={() => setInspectImpactOffer(offer)}
                        className="text-[11px] font-bold text-sky-300 flex items-center gap-1"
                      >
                        <LineChart className="w-3.5 h-3.5" />
                        View Brand Impact Report
                      </button>
                      <button
                        onClick={() => handleTerminate(contract.offerId)}
                        className="text-[11px] font-bold text-rose-400/80 hover:text-rose-300"
                      >
                        Buyout Contract ({formatMoney(contract.terminationPenalty)})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: OFFICIAL REAL-WORLD BRAND PRODUCTS SHOWCASE
           ============================================================ */}
        {activeTab === 'products' && (
          <div className="p-3.5 space-y-3.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {VERTICAL_FILTERS.map((vf) => (
                <button
                  key={vf.id}
                  onClick={() => setSelectedVertical(vf.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                    selectedVertical === vf.id
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-zinc-900/90 text-zinc-400 border-white/10'
                  }`}
                >
                  {vf.label}
                </button>
              ))}
            </div>

            {filteredOffers.map((offer) => {
              const activeContract = brandState.activeContracts.find(
                (c) => c.offerId === offer.id
              );
              const impact = calculateBrandImpactReport(gameState, offer, activeContract);

              return (
                <div
                  key={offer.id}
                  className="rounded-2xl bg-zinc-900/90 border border-white/10 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandRealLogoBadge offer={offer} size="sm" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white truncate">
                          {offer.brandName}
                        </h3>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {offer.parentGroup} • +{impact.salesConversionLiftPct}% Player Lift
                        </div>
                      </div>
                    </div>
                    {activeContract && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                        Signed ({activeContract.productRoyaltyPct ?? 4}%)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {offer.signatureProducts.map((prod) => {
                      const realProd = getRealProductAssetMeta(prod);
                      const attr = impact.productBreakdowns.find(
                        (p) => p.productId === prod.id
                      );

                      return (
                        <div
                          key={prod.id}
                          className="rounded-xl bg-black/50 border border-white/10 p-2.5 flex items-start gap-3"
                        >
                          <BrandRealProductPhoto product={prod} className="w-20 h-20" />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-mono text-amber-300/90 truncate">
                                {realProd.officialSkuOrRef}
                              </span>
                              <span className="text-xs font-black text-white shrink-0">
                                ${prod.retailPrice.toLocaleString()}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-white leading-snug">
                              {realProd.officialProductName}
                            </h4>

                            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {prod.description}
                            </p>

                            {attr && (
                              <div className="pt-1 flex items-center justify-between text-[10px] border-t border-white/5">
                                <span className="text-zinc-400">
                                  Base:{' '}
                                  <strong className="text-zinc-200">
                                    {attr.baselineDailyUnits}/d
                                  </strong>
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  With You: {attr.playerBoostedDailyUnits}/d (+
                                  {attr.addedUnitsFromPlayerPerDay})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================
            TAB 4: PLAYER IMPACT ON BRAND ANALYTICS (MIV / SALES / STOCK)
           ============================================================ */}
        {activeTab === 'impact' && (
          <div className="p-3.5 space-y-3.5">
            {/* Global Impact Card */}
            <div className="rounded-2xl bg-gradient-to-br from-sky-500/15 via-zinc-900 to-zinc-950 border border-sky-400/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-sky-300 font-bold">
                    Launchmetrics MIV® & Retail Attribution
                  </span>
                  <h2 className="text-sm font-black text-white">
                    Your Commercial Impact on Partner Maisons
                  </h2>
                </div>
                <LineChart className="w-5 h-5 text-sky-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                  <div className="text-[9px] uppercase text-zinc-400">Total Earned Media</div>
                  <div className="text-sm font-black text-sky-300">
                    {formatMoney(globalImpact.totalEMVGenerated)}
                  </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                  <div className="text-[9px] uppercase text-zinc-400">Incremental GMV</div>
                  <div className="text-sm font-black text-emerald-400">
                    {formatMoney(globalImpact.totalDailyBrandRevenueDriven)}/d
                  </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                  <div className="text-[9px] uppercase text-zinc-400">Brand ROI Multiple</div>
                  <div className="text-sm font-black text-amber-300">
                    {globalImpact.avgBrandRoiMultiple}x Return
                  </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
                  <div className="text-[9px] uppercase text-zinc-400">Extra Units Sold</div>
                  <div className="text-sm font-black text-white">
                    +{formatNumber(globalImpact.totalDailyUnitsDriven)}/day
                  </div>
                </div>
              </div>
            </div>

            {/* Per-Brand Impact Cards */}
            {filteredOffers.map((offer) => {
              const report = calculateBrandImpactReport(gameState, offer);
              const isSigned = brandState.activeContracts.some((c) => c.offerId === offer.id);

              return (
                <div
                  key={offer.id}
                  className={`rounded-2xl p-3.5 space-y-3 border ${
                    isSigned
                      ? 'bg-zinc-900/95 border-emerald-400/35'
                      : 'bg-zinc-900/75 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandRealLogoBadge offer={offer} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-white truncate">
                            {offer.brandName}
                          </h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                            {report.stockTicker}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Daily Media Impressions: {formatNumber(report.dailyMediaImpressions)}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${
                        isSigned
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-white/5 text-zinc-400 border border-white/10'
                      }`}
                    >
                      {isSigned ? 'Active Partner' : 'Projected'}
                    </span>
                  </div>

                  {/* 2x2 Impact Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2">
                      <div className="text-[9px] uppercase text-zinc-400">Sales Surge</div>
                      <div className="text-xs font-black text-emerald-400">
                        +{report.salesConversionLiftPct}% Conversion
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2">
                      <div className="text-[9px] uppercase text-zinc-400">Media Impact (MIV)</div>
                      <div className="text-xs font-black text-sky-300">
                        {formatMoney(report.earnedMediaValueEMV)}
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2">
                      <div className="text-[9px] uppercase text-zinc-400">Stock Sentiment</div>
                      <div className="text-xs font-black text-amber-300">
                        +{report.stockValuationLiftPct}% ({report.stockTicker})
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2">
                      <div className="text-[9px] uppercase text-zinc-400">Lyst Heat Index</div>
                      <div className="text-xs font-black text-white">
                        {report.lystHeatIndexScore}/100 ({report.brandRoiMultiple}x ROI)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectImpactOffer(offer)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-zinc-200 flex items-center justify-center gap-1"
                  >
                    Inspect Product Sales Attribution
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================
          MODAL 1: INCOMING PROPOSAL FULL EXECUTIVE BREAKDOWN
         ============================================================ */}
      {inspectProposalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandRealLogoBadge offer={inspectProposalModal.offer} size="md" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                    Official Executive Board Proposal
                  </span>
                  <h3 className="text-base font-black text-white">
                    {inspectProposalModal.offer.brandName}
                  </h3>
                  <div className="text-[11px] text-zinc-400">
                    Offered Role:{' '}
                    <strong className="text-amber-300">
                      {inspectProposalModal.proposal.offeredRoleTitle}
                    </strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectProposalModal(null)}
                className="p-1.5 rounded-full bg-white/10 text-zinc-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-1.5">
              <div className="text-[10px] font-bold text-amber-300">
                {inspectProposalModal.proposal.executiveName} —{' '}
                {inspectProposalModal.proposal.executiveTitle}
              </div>
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                {inspectProposalModal.proposal.offerLetterQuote}
              </p>
            </div>

            {/* Automatic Tier Ladder Explanation */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Maison Ambassador Ladder (Upgrades Automatically With Your Impact)
              </div>
              <div className="space-y-1">
                {AMBASSADOR_ROLE_TIERS.map((t) => {
                  const isOffered = t.id === inspectProposalModal.proposal.offeredRoleTierId;
                  return (
                    <div
                      key={t.id}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${
                        isOffered
                          ? 'bg-amber-400/15 border-amber-400/50 text-amber-200 font-black'
                          : 'bg-black/40 border-white/5 text-zinc-400'
                      }`}
                    >
                      <span>
                        {t.id === 'face_of_brand'
                          ? inspectProposalModal.offer.faceOfDesignation
                          : t.title}
                      </span>
                      <span className="text-[10px]">
                        {isOffered ? '← Brand Offered Tier' : `${t.productRoyaltyPct}% Royalties`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleAcceptProposal(inspectProposalModal.offer.id)}
                className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-black text-xs shadow-lg"
              >
                Sign Official Contract
              </button>
              <button
                onClick={() => setInspectProposalModal(null)}
                className="px-4 py-3 rounded-xl bg-white/10 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: PRODUCT-BY-PRODUCT BRAND IMPACT ATTRIBUTION
         ============================================================ */}
      {inspectImpactOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto p-4 space-y-4">
            {(() => {
              const report = calculateBrandImpactReport(gameState, inspectImpactOffer);
              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BrandRealLogoBadge offer={inspectImpactOffer} size="md" />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-sky-300 font-bold">
                          Product Sales & Media Attribution
                        </span>
                        <h3 className="text-base font-black text-white">
                          {inspectImpactOffer.brandName} ({report.stockTicker})
                        </h3>
                        <div className="text-[11px] text-emerald-400 font-bold">
                          +{report.salesConversionLiftPct}% Sales Lift • MIV{' '}
                          {formatMoney(report.earnedMediaValueEMV)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setInspectImpactOffer(null)}
                      className="p-1.5 rounded-full bg-white/10 text-zinc-300"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {report.productBreakdowns.map((attr) => {
                      const prod = inspectImpactOffer.signatureProducts.find(
                        (p) => p.id === attr.productId
                      );
                      if (!prod) return null;
                      return (
                        <div
                          key={attr.productId}
                          className="rounded-xl bg-zinc-900 border border-white/10 p-3 space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <BrandRealProductPhoto product={prod} className="w-14 h-14" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-mono text-amber-300">
                                {attr.officialSkuOrRef}
                              </div>
                              <div className="text-xs font-black text-white truncate">
                                {attr.officialProductName}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                Retail: ${attr.retailPrice.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center bg-black/40 rounded-lg p-2">
                            <div>
                              <div className="text-[8px] uppercase text-zinc-400">Baseline</div>
                              <div className="text-[11px] font-bold text-zinc-300">
                                {attr.baselineDailyUnits}/d
                              </div>
                            </div>
                            <div>
                              <div className="text-[8px] uppercase text-zinc-400">With You</div>
                              <div className="text-[11px] font-black text-emerald-400">
                                {attr.playerBoostedDailyUnits}/d
                              </div>
                            </div>
                            <div>
                              <div className="text-[8px] uppercase text-zinc-400">
                                Your Royalty
                              </div>
                              <div className="text-[11px] font-black text-amber-300">
                                {formatMoney(attr.playerDailyRoyaltyCut)}/d
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setInspectImpactOffer(null)}
                    className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                  >
                    Close Report
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDealsApp;
