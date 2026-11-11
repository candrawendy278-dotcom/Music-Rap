import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import {
  LUXURY_ASSETS_CATALOG,
  LUXURY_ASSET_CATEGORIES,
  LuxuryAssetCategory,
  LuxuryAssetItem,
  calculateLuxuryPortfolioMetrics,
  purchaseLuxuryAsset,
  sellLuxuryAsset
} from '../../data/luxuryAssetsEngine';
import { formatMoney } from '../../constants';

/**
 * Displays each luxury asset's visual with high-res photography and an interactive
 * bespoke item illustration overlay/fallback so every single item has a distinct visual.
 */
const LuxuryAssetVisualBanner: React.FC<{
  asset: LuxuryAssetItem;
  isOwned: boolean;
  onInspect: () => void;
}> = ({ asset, isOwned, onInspect }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [viewMode, setViewMode] = useState<'photo' | 'blueprint'>('photo');

  const showSvg = imgFailed || viewMode === 'blueprint';

  return (
    <div className="relative h-48 w-full bg-[#060908] overflow-hidden group">
      <img
        src={showSvg ? asset.svgIllustration : asset.image}
        alt={asset.name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        onClick={onInspect}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
      />

      {/* Subtle item-specific illustration thumbnail inset in corner when in photo mode */}
      {!showSvg && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setViewMode('blueprint');
          }}
          className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 p-1 pr-2.5 text-[10px] font-semibold text-zinc-200 hover:border-emerald-400/50 transition-colors cursor-pointer"
          title="Switch to Item Spec Render"
        >
          <img
            src={asset.svgIllustration}
            alt={`${asset.name} render`}
            className="w-8 h-6 rounded-lg object-cover border border-white/10"
          />
          <span>Spec Render</span>
        </button>
      )}

      {showSvg && !imgFailed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setViewMode('photo');
          }}
          className="absolute top-3 left-3 z-20 rounded-xl bg-black/70 backdrop-blur-md border border-emerald-400/40 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 cursor-pointer"
        >
          Photo View
        </button>
      )}

      {/* Top-Right Status Text */}
      <div className="absolute top-3 right-3 z-20">
        {isOwned ? (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-black tracking-wide">
            IN COLLECTION
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-zinc-200 text-[10px] font-mono tabular-nums">
            +{asset.flexPoints} Flex
          </span>
        )}
      </div>

      {/* Measured Contrast Scrim */}
      <div
        onClick={onInspect}
        className="absolute inset-0 bg-gradient-to-t from-[#0B100F] via-black/40 to-transparent cursor-pointer"
      />

      {/* Bottom Title & Price Overlay */}
      <div
        onClick={onInspect}
        className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 cursor-pointer"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-emerald-300 truncate">
            {asset.categoryLabel} · {asset.locationOrSpec}
          </div>
          <h3 className="text-base font-black text-white leading-tight truncate mt-0.5">
            {asset.name}
          </h3>
        </div>

        <div className="text-right font-mono tabular-nums shrink-0">
          <div className="text-sm font-black text-white">
            {formatMoney(asset.price)}
          </div>
          <div className="text-[10px] text-rose-300">
            -{formatMoney(asset.dailyUpkeep)}/day
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LuxuryAssetsApp() {
  const { state, setState, setInfoModal } = useGameContext();
  const [activeTab, setActiveTab] = useState<'showroom' | 'portfolio'>('showroom');
  const [selectedCategory, setSelectedCategory] = useState<LuxuryAssetCategory | 'all'>('all');
  const [inspectAsset, setInspectAsset] = useState<LuxuryAssetItem | null>(null);

  const portfolio = useMemo(() => calculateLuxuryPortfolioMetrics(state), [state]);
  const ownedIds = useMemo(
    () => new Set(portfolio.ownedItems.map(i => i.id)),
    [portfolio.ownedItems]
  );

  const filteredCatalog = useMemo(() => {
    return LUXURY_ASSETS_CATALOG.filter(item =>
      selectedCategory === 'all' ? true : item.category === selectedCategory
    );
  }, [selectedCategory]);

  const handleCloseApp = () => {
    setState(prev => ({ ...prev, activeApp: 'none' }));
  };

  const handleBuy = (assetId: string) => {
    const res = purchaseLuxuryAsset(state, assetId);
    if (!res.success) {
      setInfoModal({ title: 'Acquisition Declined', desc: res.message });
      return;
    }
    setState(res.updatedState);
    setInspectAsset(null);
    setInfoModal({ title: 'Luxury Asset Acquired', desc: res.message });
  };

  const handleSell = (assetId: string) => {
    const res = sellLuxuryAsset(state, assetId);
    if (!res.success) {
      setInfoModal({ title: 'Unable to Liquidate', desc: res.message });
      return;
    }
    setState(res.updatedState);
    setInspectAsset(null);
    setInfoModal({ title: 'Asset Liquidated', desc: res.message });
  };

  const currentPop = Number(state.popularity) || 0;
  const currentMoney = Number(state.money) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#060908] text-white flex flex-col overflow-y-auto animate-fade-in pb-28">
      <div className="max-w-md mx-auto w-full">
        {/* Mobile-First Header */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-emerald-500/15 via-[#0B110F] to-[#060908] px-4 pt-4 pb-3.5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={handleCloseApp}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 cursor-pointer"
                title="Back to Apps"
              >
                <i className="ph-bold ph-arrow-left text-base"></i>
              </button>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-emerald-400 truncate">
                  Sotheby’s Private Client · {portfolio.flexRankLabel}
                </div>
                <h1 className="text-base font-black tracking-tight text-white truncate">
                  Luxury Estates &amp; Exotic Flex
                </h1>
              </div>
            </div>

            <button
              onClick={() => setState(prev => ({ ...prev, activeApp: 'brands' }))}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Brand Deals
            </button>
          </div>

          {/* Mobile 2x2 Portfolio KPI Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
              <div className="text-[10px] text-zinc-400">Portfolio Valuation</div>
              <div className="text-sm font-black text-white font-mono tabular-nums mt-0.5">
                {formatMoney(portfolio.totalPortfolioValue)}
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
              <div className="text-[10px] text-zinc-400">Flex Score &amp; Floor</div>
              <div className="text-sm font-black text-amber-300 font-mono tabular-nums mt-0.5">
                {portfolio.flexScore}/100{' '}
                <span className="text-[10px] font-normal text-emerald-400">
                  (+{portfolio.dailyHypeFloorBonus}% Hype)
                </span>
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
              <div className="text-[10px] text-zinc-400">Liquid Cash</div>
              <div className="text-sm font-black text-emerald-400 font-mono tabular-nums mt-0.5">
                {formatMoney(currentMoney)}
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
              <div className="text-[10px] text-zinc-400">Daily Upkeep</div>
              <div className="text-sm font-black text-rose-400 font-mono tabular-nums mt-0.5">
                -{formatMoney(portfolio.totalDailyUpkeep)}/day
              </div>
            </div>
          </div>

          {/* Segmented Tab Bar */}
          <div className="grid grid-cols-2 gap-1 bg-zinc-900/95 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('showroom')}
              className={`min-h-[44px] py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'showroom'
                  ? 'bg-emerald-400 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Showroom ({LUXURY_ASSETS_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`min-h-[44px] py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-400 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              My Collection ({portfolio.ownedCount})
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        {activeTab === 'showroom' ? (
          <div className="p-3.5 space-y-3.5">
            {/* Category Filter Controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {LUXURY_ASSET_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900/90 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Luxury Asset Cards */}
            <div className="space-y-3.5">
              {filteredCatalog.map(asset => {
                const isOwned = ownedIds.has(asset.id);
                const popMet = currentPop >= asset.minPopularityReq;
                const canAfford = currentMoney >= asset.price;

                return (
                  <div
                    key={asset.id}
                    className={`rounded-2xl overflow-hidden bg-[#0B100F] border transition-colors ${
                      isOwned ? 'border-emerald-400/40' : 'border-white/10'
                    }`}
                  >
                    <LuxuryAssetVisualBanner
                      asset={asset}
                      isOwned={isOwned}
                      onInspect={() => setInspectAsset(asset)}
                    />

                    <div className="p-3.5 space-y-3">
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {asset.description}
                      </p>

                      {/* Technical Specs Preview */}
                      <div className="rounded-xl bg-black/45 border border-white/10 p-2.5 space-y-1.5">
                        {asset.specs.map((sp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <span className="text-zinc-400">{sp.label}</span>
                            <span className="text-zinc-200 font-semibold text-right truncate">
                              {sp.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Unboxed Impact Metadata */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono tabular-nums pt-0.5">
                        <span>
                          +{asset.instantHypeBoost}% Hype · +{asset.flexPoints} Flex · +
                          {asset.dailyHypeFloorBonus}% Floor
                        </span>
                        <span>Req: {asset.minPopularityReq}% Pop</span>
                      </div>

                      {/* Action Row */}
                      <div className="flex items-center gap-2 pt-1">
                        {isOwned ? (
                          <button
                            onClick={() => handleSell(asset.id)}
                            className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 whitespace-nowrap cursor-pointer font-mono tabular-nums"
                          >
                            Liquidate ({formatMoney(Math.round(asset.price * 0.75))})
                          </button>
                        ) : (
                          <button
                            disabled={!popMet || !canAfford}
                            onClick={() => handleBuy(asset.id)}
                            className={`flex-1 min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                              popMet && canAfford
                                ? 'bg-emerald-400 text-black hover:bg-emerald-300 cursor-pointer'
                                : 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed'
                            }`}
                          >
                            {!popMet
                              ? `Locked (Needs ${asset.minPopularityReq}% Pop)`
                              : !canAfford
                              ? `Insufficient Funds (${formatMoney(asset.price)})`
                              : `Acquire (${formatMoney(asset.price)})`}
                          </button>
                        )}

                        <button
                          onClick={() => setInspectAsset(asset)}
                          className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Owned Portfolio & Daily Upkeep Ledger */
          <div className="p-3.5 space-y-3.5">
            {portfolio.ownedItems.length === 0 ? (
              <div className="rounded-2xl p-8 bg-[#0B100F] border border-white/10 text-center space-y-3">
                <p className="text-sm font-bold text-white">
                  Your Luxury Portfolio Is Empty
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Acquire mansions, penthouses, supercars, private jets, and custom jewelry to
                  raise your Hype retention floor and unlock Tier-1 luxury brand ambassadorships.
                </p>
                <button
                  onClick={() => setActiveTab('showroom')}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-400 text-black text-xs font-black cursor-pointer"
                >
                  Explore Private Showroom
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-[#0B100F] border border-emerald-500/30 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Total Liquidation Value (75%)</span>
                    <span className="font-mono font-black text-emerald-400 tabular-nums">
                      {formatMoney(portfolio.totalResaleValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Daily Hype Floor Protection</span>
                    <span className="font-mono font-bold text-amber-300 tabular-nums">
                      +{portfolio.dailyHypeFloorBonus}% Baseline Floor
                    </span>
                  </div>
                </div>

                {portfolio.ownedItems.map(item => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-3 bg-[#0B100F] border border-white/10 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.svgIllustration}
                        alt={item.name}
                        className="w-20 h-16 rounded-xl object-cover border border-white/15 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-emerald-400 truncate">
                          {item.categoryLabel} · Acquired {item.purchasedDate}
                        </div>
                        <h3 className="text-sm font-black text-white truncate mt-0.5">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-mono tabular-nums mt-0.5">
                          +{item.flexPoints} Flex · +{item.dailyHypeFloorBonus}% Floor · Upkeep -
                          {formatMoney(item.dailyUpkeep)}/d
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => setInspectAsset(item)}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 cursor-pointer"
                      >
                        Inspect Asset
                      </button>
                      <button
                        onClick={() => handleSell(item.id)}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold whitespace-nowrap cursor-pointer font-mono tabular-nums"
                      >
                        Sell ({formatMoney(Math.round(item.price * 0.75))})
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom-Sheet Asset Detail Modal */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto p-4 space-y-4">
            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-white/15">
              <img
                src={inspectAsset.svgIllustration}
                alt={inspectAsset.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setInspectAsset(null)}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 border border-white/20 text-xs font-bold text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-emerald-400">
                {inspectAsset.categoryLabel} · {inspectAsset.locationOrSpec}
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">{inspectAsset.name}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1.5">
                {inspectAsset.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                <div className="text-[10px] text-zinc-400 font-sans">Acquisition Price</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {formatMoney(inspectAsset.price)}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                <div className="text-[10px] text-zinc-400 font-sans">Daily Maintenance</div>
                <div className="text-sm font-black text-rose-400 mt-0.5">
                  -{formatMoney(inspectAsset.dailyUpkeep)}/day
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                <div className="text-[10px] text-zinc-400 font-sans">Instant Hype Surge</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  +{inspectAsset.instantHypeBoost}% Hype
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                <div className="text-[10px] text-zinc-400 font-sans">Status Impact</div>
                <div className="text-sm font-black text-amber-300 mt-0.5">
                  +{inspectAsset.flexPoints} Flex · +{inspectAsset.dailyHypeFloorBonus}% Floor
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-black/50 border border-white/10 p-3 space-y-2">
              <div className="text-xs font-bold text-white">Bespoke Specifications</div>
              {inspectAsset.specs.map((sp, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-zinc-400">{sp.label}</span>
                  <span className="text-zinc-200 font-semibold text-right">{sp.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              {ownedIds.has(inspectAsset.id) ? (
                <button
                  onClick={() => handleSell(inspectAsset.id)}
                  className="flex-1 min-h-[44px] py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs cursor-pointer"
                >
                  Liquidate for {formatMoney(Math.round(inspectAsset.price * 0.75))}
                </button>
              ) : (
                <button
                  disabled={
                    currentPop < inspectAsset.minPopularityReq ||
                    currentMoney < inspectAsset.price
                  }
                  onClick={() => handleBuy(inspectAsset.id)}
                  className={`flex-1 min-h-[44px] py-3 rounded-xl font-black text-xs ${
                    currentPop >= inspectAsset.minPopularityReq &&
                    currentMoney >= inspectAsset.price
                      ? 'bg-emerald-400 text-black cursor-pointer'
                      : 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  {currentPop < inspectAsset.minPopularityReq
                    ? `Requires ${inspectAsset.minPopularityReq}% Popularity`
                    : currentMoney < inspectAsset.price
                    ? 'Insufficient Funds'
                    : `Acquire for ${formatMoney(inspectAsset.price)}`}
                </button>
              )}
              <button
                onClick={() => setInspectAsset(null)}
                className="min-h-[44px] px-4 py-3 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
