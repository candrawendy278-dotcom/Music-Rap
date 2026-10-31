// Record Label Official Merch & Vinyl Webstore View
// Rendered inside ArtistMerchStoreApp when the user switches the top switcher from "Player Store" to "Record Label Store".
// Allows the Player/CEO to press Vinyl LPs, Picture Discs, Deluxe CDs, Box Sets, and 480GSM Streetwear for any signed Roster Artist.

import React, { useState, useMemo } from 'react';
import { GameState } from '../../types';
import { formatNum, formatNumFull } from '../../constants';
import {
  MERCH_FORMAT_TEMPLATES,
  VINYL_AND_MERCH_COLORWAYS,
  BATCH_PRESSING_OPTIONS,
  MERCH_PROMO_CAMPAIGNS,
  MERCH_SPEC_TIERS,
  MerchCategory,
  MerchFormatId,
  MerchSpecTier,
  isPhysicalMusicCategory,
  getMerchFormatTemplate,
  getMerchSpecTierMeta
} from '../../data/merchWebstoreEngine';
import {
  ensureRecordLabelMerchStoreState,
  createRecordLabelMerchProduct,
  restockRecordLabelMerchProduct,
  updateRecordLabelMerchPrice,
  setRecordLabelMerchPromoCampaign,
  removeRecordLabelMerchProduct,
  LabelMerchProductItem
} from '../../data/recordLabelMerchEngine';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';
import { ensureRosterArtistFullFields } from '../../data/recordLabelCeoEngine';
import { isRosterArtistContractExpired } from '../../data/rosterLifecycleAndNpcDedupEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

interface RecordLabelMerchStoreViewProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  showToast: (text: string, type?: 'ok' | 'err') => void;
}

export const RecordLabelMerchStoreView: React.FC<RecordLabelMerchStoreViewProps> = ({
  state,
  setState,
  showToast
}) => {
  const rl = useMemo(() => getEnsuredRecordLabelState(state), [state]);
  const labelStore = useMemo(() => ensureRecordLabelMerchStoreState(state), [state]);

  const activeRoster = useMemo(
    () =>
      (rl.imprint.signedRoster || [])
        .filter(a => !isRosterArtistContractExpired(a))
        .map(a => ensureRosterArtistFullFields(a)),
    [rl.imprint.signedRoster]
  );

  const [subTab, setSubTab] = useState<'storefront' | 'designer' | 'analytics'>('storefront');
  const [filterRosterId, setFilterRosterId] = useState<string>('ALL');

  // Designer state
  const [selectedRosterArtistId, setSelectedRosterArtistId] = useState<string>(
    activeRoster[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<MerchCategory>('vinyl');
  const [selectedFormatId, setSelectedFormatId] = useState<MerchFormatId>('vinyl_splatter');
  const [selectedColorwayId, setSelectedColorwayId] = useState<string>(
    VINYL_AND_MERCH_COLORWAYS[1]?.id || 'ruby_red'
  );
  const [selectedSpecTier, setSelectedSpecTier] = useState<MerchSpecTier>('deluxe_heavyweight');
  const [selectedReleaseKey, setSelectedReleaseKey] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [retailPrice, setRetailPrice] = useState<number>(38);
  const [batchUnits, setBatchUnits] = useState<number>(1000);
  const [isLimited, setIsLimited] = useState<boolean>(true);
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [hasObiStrip, setHasObiStrip] = useState<boolean>(true);

  const selectedRosterArtist = useMemo(() => {
    return (
      activeRoster.find(a => a.id === selectedRosterArtistId) || activeRoster[0] || null
    );
  }, [activeRoster, selectedRosterArtistId]);

  const eligibleRosterReleases = useMemo(() => {
    if (!selectedRosterArtist) return [];
    const list: Array<{
      key: string;
      type: 'project' | 'song';
      id: number;
      title: string;
      cover: string;
      status: string;
    }> = [];

    (selectedRosterArtist.projects || [])
      .filter(p => p.status === 'released' || p.status === 'scheduled')
      .forEach(p => {
        list.push({
          key: `project:${p.id}`,
          type: 'project',
          id: p.id,
          title: p.title,
          cover: p.cover || selectedRosterArtist.avatar,
          status: p.status
        });
      });

    (selectedRosterArtist.songs || [])
      .filter(s => s.status === 'released' || s.status === 'scheduled')
      .forEach(s => {
        list.push({
          key: `song:${s.id}`,
          type: 'song',
          id: s.id,
          title: s.title,
          cover: s.cover || selectedRosterArtist.avatar,
          status: s.status
        });
      });

    return list;
  }, [selectedRosterArtist]);

  const activeReleaseTarget = useMemo(() => {
    if (eligibleRosterReleases.length === 0) return null;
    return (
      eligibleRosterReleases.find(r => r.key === selectedReleaseKey) ||
      eligibleRosterReleases[0]
    );
  }, [eligibleRosterReleases, selectedReleaseKey]);

  const activeFormat = useMemo(
    () => getMerchFormatTemplate(selectedFormatId),
    [selectedFormatId]
  );

  const activeSpecMeta = useMemo(
    () => getMerchSpecTierMeta(selectedSpecTier),
    [selectedSpecTier]
  );

  const estimatedTotalCost = useMemo(() => {
    const batchOpt =
      BATCH_PRESSING_OPTIONS.find(b => b.units === batchUnits) ||
      BATCH_PRESSING_OPTIONS[1];
    const signedExtra = isSigned && activeFormat.supportsSignedOption ? 2.5 : 0;
    const obiExtra = hasObiStrip && activeFormat.category === 'vinyl' ? 1.25 : 0;
    const unitCost =
      (activeFormat.unitManufacturingCost * activeSpecMeta.costMultiplier +
        signedExtra +
        obiExtra) *
      batchOpt.costDiscountMultiplier;
    return Math.round(unitCost * batchUnits);
  }, [activeFormat, activeSpecMeta, batchUnits, isSigned, hasObiStrip]);

  const filteredItems = useMemo(() => {
    if (filterRosterId === 'ALL') return labelStore.items;
    return labelStore.items.filter(i => i.rosterArtistId === filterRosterId);
  }, [labelStore.items, filterRosterId]);

  if (!rl.imprint.isFounded) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
          <i className="ph-fill ph-vinyl-record text-3xl"></i>
        </div>
        <h3 className="text-base font-black text-white">
          Record Label Imprint Required
        </h3>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Launch your Record Label Imprint and sign Roster Artists first to manufacture and sell official Record Label Vinyl LPs, Box Sets, and Roster Streetwear.
        </p>
      </div>
    );
  }

  const handleCreateDrop = () => {
    if (!selectedRosterArtist) {
      showToast('Sign an active Roster Artist first!', 'err');
      return;
    }

    const isPhysical = isPhysicalMusicCategory(activeFormat.category);
    if (isPhysical && !activeReleaseTarget) {
      showToast(
        `Release or schedule a Song/Album for ${
          selectedRosterArtist.stageName || selectedRosterArtist.name
        } first to press physical vinyl/CDs!`,
        'err'
      );
      return;
    }

    const res = createRecordLabelMerchProduct({
      state,
      rosterArtistId: selectedRosterArtist.id,
      formatId: selectedFormatId,
      linkedReleaseType: isPhysical
        ? activeReleaseTarget!.type
        : 'standalone_merch',
      linkedReleaseId: isPhysical ? activeReleaseTarget!.id : undefined,
      linkedReleaseTitle: isPhysical
        ? activeReleaseTarget!.title
        : `${selectedRosterArtist.stageName || selectedRosterArtist.name} Capsule`,
      isPreOrderRelease: Boolean(
        isPhysical && activeReleaseTarget?.status === 'scheduled'
      ),
      coverArt: isPhysical
        ? activeReleaseTarget!.cover
        : selectedRosterArtist.avatar,
      colorwayId: selectedColorwayId,
      specTier: selectedSpecTier,
      hasObiStrip,
      customName,
      retailPrice,
      batchUnits,
      isLimitedEdition: isLimited,
      isSigned
    });

    if (!res.success) {
      showToast(res.error || 'Could not launch label drop.', 'err');
      return;
    }

    setState(res.updatedState);
    setCustomName('');
    setSubTab('storefront');
    showToast(`Launched ${res.newItem?.name} on the Record Label Store!`);
  };

  return (
    <div className="px-4 pt-3 pb-24 space-y-4">
      {/* Record Label Store Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-950/90 via-[#151226] to-[#0B0B10] border border-purple-500/30 p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                OFFICIAL RECORD LABEL D2C WEBSTORE
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {activeRoster.length} Active Roster Artist{activeRoster.length === 1 ? '' : 's'}
              </span>
            </div>
            <h2 className="text-base font-black text-white truncate mt-1">
              {rl.imprint.imprintName} — Roster Merch &amp; Vinyl Store
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Physical Vinyl &amp; CD sales automatically boost your Roster Artists on Billboard &amp; RIAA charts.
            </p>
          </div>
          <div className="text-right font-mono tabular-nums shrink-0">
            <div className="text-sm font-black text-emerald-400">
              +${formatNumFull(labelStore.dailyRevenue || 0)}/day
            </div>
            <div className="text-[10px] text-zinc-400">
              Net Profit: ${formatNumFull(labelStore.totalNetProfit || 0)}
            </div>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="grid grid-cols-3 gap-1.5 mt-3.5 p-1 bg-black/40 rounded-xl border border-white/10">
          {[
            {
              id: 'storefront' as const,
              label: `Label Catalog (${labelStore.items.length})`
            },
            { id: 'designer' as const, label: '+ Press Roster Drop' },
            { id: 'analytics' as const, label: 'Campaigns & Ledger' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                subTab === t.id
                  ? 'bg-purple-500 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: LABEL STOREFRONT */}
      {subTab === 'storefront' && (
        <div className="space-y-3">
          {/* Roster Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterRosterId('ALL')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition cursor-pointer shrink-0 ${
                filterRosterId === 'ALL'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              All Roster ({labelStore.items.length})
            </button>
            {activeRoster.map(art => {
              const sName = art.stageName || art.name;
              const count = labelStore.items.filter(
                i => i.rosterArtistId === art.id
              ).length;
              return (
                <button
                  key={art.id}
                  onClick={() => setFilterRosterId(art.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    filterRosterId === art.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{sName}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#12121A] p-7 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto text-purple-400">
                <i className="ph-duotone ph-t-shirt text-2xl"></i>
              </div>
              <h3 className="text-sm font-black text-white">
                No Roster Merch Drops Yet
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Press 180g Splatter Vinyl, Deluxe CDs, or 480GSM Streetwear for your signed Roster Artists to generate daily D2C revenue and Billboard pure sales.
              </p>
              <button
                onClick={() => setSubTab('designer')}
                className="px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-black hover:bg-purple-400 transition cursor-pointer"
              >
                + Create First Roster Merch Drop
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item: LabelMerchProductItem) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#12121A] p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <OfficialArtworkImg
                        artist={item.rosterArtistName}
                        title={item.linkedReleaseTitle}
                        explicitSrc={item.coverArt}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-white/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {item.rosterArtistName}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {item.formatLabel}
                          </span>
                          {item.countsForBillboard && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300">
                              Billboard Pure Sales
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-white truncate mt-0.5">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-sm font-black text-white">
                        ${item.retailPrice}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        +{formatNum(item.dailySold || 0)}/day
                      </div>
                    </div>
                  </div>

                  {/* Inventory & Revenue Progress */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono tabular-nums">
                    <div>
                      <div className="text-zinc-500">Stock Left</div>
                      <div className="font-bold text-white mt-0.5">
                        {formatNumFull(item.stockRemaining)} / {formatNumFull(item.totalPressed)}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Total Sold</div>
                      <div className="font-bold text-amber-300 mt-0.5">
                        {formatNumFull(item.totalSold)} units
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Label Net Cut</div>
                      <div className="font-bold text-emerald-400 mt-0.5">
                        ${formatNumFull(item.totalRevenue)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions: Restock / Price / Remove */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const res = restockRecordLabelMerchProduct(
                            state,
                            item.id,
                            1000
                          );
                          if (!res.success) {
                            showToast(res.error || 'Restock failed', 'err');
                            return;
                          }
                          setState(res.updatedState);
                          showToast(`Restocked +1,000 units of ${item.name}!`);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[10px] font-black transition cursor-pointer"
                      >
                        +1,000 Restock
                      </button>
                      <button
                        onClick={() =>
                          setState(prev =>
                            updateRecordLabelMerchPrice(
                              prev,
                              item.id,
                              item.retailPrice + 5
                            )
                          )
                        }
                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
                      >
                        +$5 Price
                      </button>
                      <button
                        onClick={() =>
                          setState(prev =>
                            updateRecordLabelMerchPrice(
                              prev,
                              item.id,
                              item.retailPrice - 5
                            )
                          )
                        }
                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
                      >
                        -$5 Price
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setState(prev => removeRecordLabelMerchProduct(prev, item.id));
                        showToast(`Archived ${item.name}`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-bold transition cursor-pointer"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESS ROSTER DROP DESIGNER */}
      {subTab === 'designer' && (
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            1. Select Signed Roster Artist
          </h3>
          {activeRoster.length === 0 ? (
            <div className="text-xs text-zinc-400">
              No active signed Roster Artists available. Sign an artist in the Record Label Hub first.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeRoster.map(art => {
                const sName = art.stageName || art.name;
                const isSel = selectedRosterArtist?.id === art.id;
                return (
                  <button
                    key={art.id}
                    onClick={() => {
                      setSelectedRosterArtistId(art.id);
                      setSelectedReleaseKey('');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSel
                        ? 'bg-purple-500/20 border-purple-400 text-white'
                        : 'bg-black/30 border-white/10 text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    <OfficialArtworkImg
                      artist={sName}
                      explicitSrc={art.avatar}
                      isArtistPortrait={true}
                      alt={sName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{sName}</div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        Fans {formatNum(art.fans)} • Split {art.labelRoyaltySplit}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Category & Format Selector */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              2. Choose Product Category &amp; Format
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'vinyl', label: '12" Vinyl' },
                  { id: 'physical_music', label: 'CD / Box Set' },
                  { id: 'apparel', label: 'Streetwear' },
                  { id: 'collectibles', label: 'Collectibles' }
                ] as const
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const firstFmt = MERCH_FORMAT_TEMPLATES.find(
                      f => f.category === cat.id
                    );
                    if (firstFmt) {
                      setSelectedFormatId(firstFmt.id);
                      setRetailPrice(firstFmt.suggestedRetailPrice);
                    }
                  }}
                  className={`py-2 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {MERCH_FORMAT_TEMPLATES.filter(f => f.category === selectedCategory).map(
                fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => {
                      setSelectedFormatId(fmt.id);
                      setRetailPrice(fmt.suggestedRetailPrice);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedFormatId === fmt.id
                        ? 'bg-purple-500/20 border-purple-400 text-white'
                        : 'bg-black/30 border-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-black">{fmt.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Base Cost ${fmt.unitManufacturingCost} • Sugg. ${fmt.suggestedRetailPrice}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Linked Release if physical music */}
          {isPhysicalMusicCategory(activeFormat.category) && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                3. Link Roster Artist Release (Counts for Billboard &amp; RIAA)
              </h3>
              {eligibleRosterReleases.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  This Roster Artist has no released or scheduled songs/albums yet. Release a song or album for them in the Studio first, or switch to Streetwear/Collectibles!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                  {eligibleRosterReleases.map(rel => {
                    const isSel = activeReleaseTarget?.key === rel.key;
                    return (
                      <button
                        key={rel.key}
                        onClick={() => setSelectedReleaseKey(rel.key)}
                        className={`p-2 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                          isSel
                            ? 'bg-emerald-500/15 border-emerald-400 text-white'
                            : 'bg-black/30 border-white/10 text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">
                          {rel.title} ({rel.type.toUpperCase()})
                        </span>
                        <span className="text-[10px] font-mono uppercase text-emerald-400">
                          {rel.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Colorway, Spec Tier, Batch & Price */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Colorway Edition
                </label>
                <select
                  value={selectedColorwayId}
                  onChange={e => setSelectedColorwayId(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  {VINYL_AND_MERCH_COLORWAYS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Manufacturing Tier
                </label>
                <select
                  value={selectedSpecTier}
                  onChange={e => setSelectedSpecTier(e.target.value as MerchSpecTier)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  {MERCH_SPEC_TIERS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Pressing Batch Run
                </label>
                <select
                  value={batchUnits}
                  onChange={e => setBatchUnits(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  {BATCH_PRESSING_OPTIONS.map(b => (
                    <option key={b.units} value={b.units}>
                      {b.label} ({b.discountLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Retail Price (${activeFormat.minRetailPrice}–${activeFormat.maxRetailPrice})
                </label>
                <input
                  type="number"
                  min={activeFormat.minRetailPrice}
                  max={activeFormat.maxRetailPrice}
                  value={retailPrice}
                  onChange={e => setRetailPrice(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLimited}
                  onChange={e => setIsLimited(e.target.checked)}
                />
                <span>Limited Numbered Run</span>
              </label>
              {activeFormat.supportsSignedOption && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSigned}
                    onChange={e => setIsSigned(e.target.checked)}
                  />
                  <span>Hand-Signed Insert</span>
                </label>
              )}
              {activeFormat.category === 'vinyl' && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasObiStrip}
                    onChange={e => setHasObiStrip(e.target.checked)}
                  />
                  <span>Japanese OBI Strip</span>
                </label>
              )}
            </div>

            <input
              type="text"
              placeholder="Optional Custom Product Title..."
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
            />

            <button
              onClick={handleCreateDrop}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-black uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              Manufacture &amp; Launch Label Drop (${formatNumFull(estimatedTotalCost)})
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: CAMPAIGNS & LEDGER */}
      {subTab === 'analytics' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4 space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">
              Label Store Promotional Campaign
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {MERCH_PROMO_CAMPAIGNS.map(c => {
                const isAct = labelStore.activePromoCampaign === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setState(prev => setRecordLabelMerchPromoCampaign(prev, c.id));
                      showToast(`Activated Label Store Campaign: ${c.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isAct
                        ? 'bg-purple-500/20 border-purple-400 text-white'
                        : 'bg-black/30 border-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-black">{c.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{c.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Recent Label D2C Fulfillment Ledger
            </h3>
            {labelStore.orderLogs.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Advance the day to process D2C orders for your Roster Artists.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {labelStore.orderLogs.slice(0, 15).map(log => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-white truncate">
                        {log.productName}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {log.date} • {formatNumFull(log.unitsSold)} units
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400 shrink-0">
                      +${formatNumFull(log.netPayout)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
