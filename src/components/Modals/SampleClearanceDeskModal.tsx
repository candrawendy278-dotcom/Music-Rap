import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import {
  SAMPLE_CATALOG,
  SAMPLE_FLIP_TECHNIQUES,
  SAMPLE_CLEARANCE_STRUCTURES,
  SampleCatalogItem,
  SampleFlipTechnique,
  SampleClearanceDealStructure,
  SongSampleInfo,
  getEnsuredSampleLegalState,
  getLegalCounselClearanceDiscount,
  calculateEffectiveSampleClearanceTerms,
  clearSongSampleInAdvance,
  resolveCopyrightDispute
} from '../../data/sampleClearanceAndLegalEngine';
import { formatMoney } from '../../constants';

interface SampleClearanceDeskModalProps {
  onClose: () => void;
}

export default function SampleClearanceDeskModal({ onClose }: SampleClearanceDeskModalProps) {
  const { state, setState, setInfoModal } = useGameContext();
  const legalState = useMemo(() => getEnsuredSampleLegalState(state), [state]);
  const legalDiscount = useMemo(() => getLegalCounselClearanceDiscount(state), [state]);

  const [activeTab, setActiveTab] = useState<'clearance' | 'crate' | 'disputes'>(
    legalState.activeDisputes.length > 0 ? 'disputes' : 'crate'
  );
  const [selectedTierFilter, setSelectedTierFilter] = useState<
    'all' | 'underground' | 'classic' | 'megahit'
  >('all');
  const [selectedSongIdForCrate, setSelectedSongIdForCrate] = useState<number | ''>('');
  const [selectedFlipTechnique, setSelectedFlipTechnique] =
    useState<SampleFlipTechnique>('chopped_pitched');
  const [selectedDealStructure, setSelectedDealStructure] =
    useState<SampleClearanceDealStructure>('standard');

  const sampledSongs = useMemo(() => {
    return (state.songs || []).filter(s => {
      const info = (s as any).sampleInfo as SongSampleInfo | undefined;
      return Boolean(info && info.tier !== 'none');
    });
  }, [state.songs]);

  const unsampledStudioSongs = useMemo(() => {
    return (state.songs || []).filter(s => {
      const info = (s as any).sampleInfo as SongSampleInfo | undefined;
      return (!info || info.tier === 'none') && s.status !== 'released';
    });
  }, [state.songs]);

  const activeTargetSong = useMemo(() => {
    if (selectedSongIdForCrate !== '') {
      return unsampledStudioSongs.find(s => s.id === Number(selectedSongIdForCrate)) || null;
    }
    return unsampledStudioSongs[0] || null;
  }, [unsampledStudioSongs, selectedSongIdForCrate]);

  const filteredVaultSamples = useMemo(() => {
    return SAMPLE_CATALOG.filter(item =>
      selectedTierFilter === 'all' ? true : item.tier === selectedTierFilter
    );
  }, [selectedTierFilter]);

  const activeFlipMeta = useMemo(
    () =>
      SAMPLE_FLIP_TECHNIQUES.find(f => f.id === selectedFlipTechnique) ||
      SAMPLE_FLIP_TECHNIQUES[0],
    [selectedFlipTechnique]
  );

  const handleClearSample = (songId: number) => {
    const res = clearSongSampleInAdvance(state, songId, selectedDealStructure);
    if (!res.success) {
      setInfoModal({ title: 'Unable to Clear Sample', desc: res.message });
      return;
    }
    setState(res.updatedState);
    setInfoModal({ title: 'Sample Officially Cleared', desc: res.message });
  };

  const handleAttachSampleToStudioSong = (
    sample: SampleCatalogItem,
    mode: 'cleared' | 'uncleared'
  ) => {
    const targetSong = activeTargetSong;
    if (!targetSong) {
      setInfoModal({
        title: 'Select an Unreleased Song',
        desc: 'Write or select an unreleased studio track first to interpolate this sample.'
      });
      return;
    }

    const terms = calculateEffectiveSampleClearanceTerms(
      state,
      sample,
      selectedFlipTechnique,
      selectedDealStructure
    );
    const upfrontCost = mode === 'cleared' ? terms.effectiveUpfrontFee : 0;
    const currentMoney = Number(state.money) || 0;

    if (mode === 'cleared' && currentMoney < upfrontCost) {
      setInfoModal({
        title: 'Insufficient Funds for Pre-Clearance',
        desc: `Clearing "${sample.sampleTitle}" requires ${formatMoney(upfrontCost)} upfront (or switch to Low-Advance Points Deal / Uncleared mode).`
      });
      return;
    }

    const hasGenreSynergy = sample.genreFit.includes(targetSong.genre);
    const synergyBonus = hasGenreSynergy ? 2 : 0;
    const totalQualityGain = terms.effectiveQualityBoost + synergyBonus;

    const newSampleInfo: SongSampleInfo = {
      sampleId: sample.id,
      tier: sample.tier,
      sampleTitle: sample.sampleTitle,
      originalArtist: sample.originalArtist,
      eraLabel: sample.eraLabel,
      bpmAndKey: sample.bpmAndKey,
      elementType: sample.elementType,
      flipTechnique: selectedFlipTechnique,
      dealStructure: selectedDealStructure,
      qualityBoost: totalQualityGain,
      viralPotentialMult: sample.viralPotentialMult,
      clearanceStatus: mode,
      upfrontFeePaid: upfrontCost,
      publishingRoyaltyPct: mode === 'cleared' ? terms.effectiveRoyaltyPct : 0,
      royaltyPaidToday: 0,
      royaltyPaidTotal: 0
    };

    const nextSongs = (state.songs || []).map(s => {
      if (s.id !== targetSong.id) return s;
      return {
        ...s,
        quality: Math.min(100, Math.round((s.quality || 60) + totalQualityGain)),
        sampleInfo: newSampleInfo
      } as any;
    });

    setState(prev => ({
      ...prev,
      money: Math.max(0, currentMoney - upfrontCost),
      songs: nextSongs
    }));

    setInfoModal({
      title: mode === 'cleared' ? 'Sample Flipped & Licensed' : 'Uncleared Sample Interpolated',
      desc:
        mode === 'cleared'
          ? `Flipped "${sample.sampleTitle}" via ${activeFlipMeta.shortLabel} into "${targetSong.title}" (+${totalQualityGain} Quality${hasGenreSynergy ? ' incl. Genre Synergy' : ''}). Paid ${formatMoney(upfrontCost)} advance with a ${terms.effectiveRoyaltyPct}% publishing split.`
          : `Interpolated uncleared sample "${sample.sampleTitle}" (${activeFlipMeta.shortLabel}) into "${targetSong.title}" (+${totalQualityGain} Quality, $0 upfront). Warning: ${sample.publisherEstate} may file a copyright claim once streams cross ${sample.minStreamsForLawsuitCheck.toLocaleString()}!`
    });
    setActiveTab('clearance');
  };

  const handleResolveDispute = (
    disputeId: string,
    resolution: 'settle_cash' | 'surrender_publishing' | 'fight_in_court'
  ) => {
    const res = resolveCopyrightDispute(state, disputeId, resolution);
    if (!res.success) {
      setInfoModal({ title: 'Action Required', desc: res.message });
      return;
    }
    setState(res.updatedState);
    setInfoModal({ title: 'Copyright Dispute Resolution', desc: res.message });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in">
      <div className="bg-[#0B0F17] text-white w-full max-w-md sm:max-w-xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/15 flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#101622]">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-amber-400">
              MPC Sample Lab · Music Publishing &amp; Copyright Law
            </p>
            <h2 className="text-base font-black text-white tracking-tight truncate">
              Sample Clearance &amp; Legal Desk
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer shrink-0"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 2x2 Legal & Royalty KPI Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#131B29] border border-white/10 p-2.5">
              <div className="text-[10px] text-zinc-400">Legal Retainer Status</div>
              <div className="text-xs font-black text-white mt-0.5 truncate">
                {legalDiscount.hasLegalCounsel
                  ? `Attorney Lv.${legalDiscount.counselLevel} (-${Math.round((1 - legalDiscount.feeDiscountMultiplier) * 100)}% Fee)`
                  : 'No Counsel Retained'}
              </div>
            </div>

            <div className="rounded-xl bg-[#131B29] border border-white/10 p-2.5">
              <div className="text-[10px] text-zinc-400">Copyright Dockets</div>
              <div
                className={`text-xs font-black font-mono tabular-nums mt-0.5 ${
                  legalState.activeDisputes.length > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {legalState.activeDisputes.length} Active · {legalState.resolvedDisputesCount} Closed
              </div>
            </div>

            <div className="rounded-xl bg-[#131B29] border border-white/10 p-2.5">
              <div className="text-[10px] text-zinc-400">Royalties Paid Today</div>
              <div className="text-xs font-black text-amber-300 font-mono tabular-nums mt-0.5">
                {formatMoney(legalState.sampleRoyaltiesPaidToday)}/day
              </div>
            </div>

            <div className="rounded-xl bg-[#131B29] border border-white/10 p-2.5">
              <div className="text-[10px] text-zinc-400">Available Studio Cash</div>
              <div className="text-xs font-black text-emerald-400 font-mono tabular-nums mt-0.5">
                {formatMoney(state.money || 0)}
              </div>
            </div>
          </div>

          {/* 3-Tab Segmented Bar */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900 border border-white/10">
            <button
              onClick={() => setActiveTab('crate')}
              className={`min-h-[42px] py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'crate'
                  ? 'bg-amber-400 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sample Vault ({SAMPLE_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveTab('clearance')}
              className={`min-h-[42px] py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'clearance'
                  ? 'bg-amber-400 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              My Tracks ({sampledSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`min-h-[42px] py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'disputes'
                  ? 'bg-rose-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lawsuits ({legalState.activeDisputes.length})
            </button>
          </div>

          {/* ============================================================
              TAB 1: SAMPLE VAULT, MPC FLIP LAB & PUBLISHER NEGOTIATION
             ============================================================ */}
          {activeTab === 'crate' && (
            <div className="space-y-4">
              {/* Target Song Selector */}
              <div className="rounded-2xl p-3.5 bg-[#121824] border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-zinc-200">
                  1. Select Unreleased Track to Sample Into:
                </label>
                {unsampledStudioSongs.length === 0 ? (
                  <p className="text-xs text-amber-300 leading-relaxed">
                    You have no unsampled unreleased songs in the Studio right now. Start a new song in "Create Song" or inspect your existing sampled tracks in "My Tracks".
                  </p>
                ) : (
                  <select
                    value={activeTargetSong?.id || ''}
                    onChange={e =>
                      setSelectedSongIdForCrate(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    {unsampledStudioSongs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.genre} · {s.status.toUpperCase()} · Quality {Math.round(s.quality)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Sample Flip Technique Selector */}
              <div className="rounded-2xl p-3.5 bg-[#121824] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    2. MPC Sample Flipping Technique:
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    +{activeFlipMeta.extraQualityBonus} Prod Quality
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {SAMPLE_FLIP_TECHNIQUES.map(flip => (
                    <button
                      key={flip.id}
                      type="button"
                      onClick={() => setSelectedFlipTechnique(flip.id)}
                      className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                        selectedFlipTechnique === flip.id
                          ? 'bg-amber-400/15 border-amber-400 text-white'
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px] font-black text-white truncate">
                        {flip.shortLabel}
                      </div>
                      <div className="text-[9px] text-zinc-400 font-mono mt-0.5">
                        {flip.unclearedDetectionMultiplier < 1
                          ? `${Math.round((1 - flip.unclearedDetectionMultiplier) * 100)}% Safer ID`
                          : '100% Hook ID'}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {activeFlipMeta.description}
                </p>
              </div>

              {/* Step 3: Publisher Clearance Structure */}
              <div className="rounded-2xl p-3.5 bg-[#121824] border border-white/10 space-y-2">
                <span className="block text-xs font-bold text-zinc-200">
                  3. Publisher Clearance Deal Structure:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SAMPLE_CLEARANCE_STRUCTURES.map(deal => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => setSelectedDealStructure(deal.id)}
                      className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                        selectedDealStructure === deal.id
                          ? 'bg-emerald-400/15 border-emerald-400 text-white'
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px] font-black text-white truncate">
                        {deal.shortLabel}
                      </div>
                      <div className="text-[9px] text-emerald-300 font-mono mt-0.5">
                        {deal.upfrontMultiplier}x Advance · {deal.royaltyMultiplier}x Split
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(
                  [
                    { id: 'all', label: `All Samples (${SAMPLE_CATALOG.length})` },
                    { id: 'underground', label: 'Crate Digs ($4K–$7K)' },
                    { id: 'classic', label: 'Genre Classics ($26K–$38K)' },
                    { id: 'megahit', label: 'Megahit Hooks ($85K–$125K)' }
                  ] as const
                ).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTierFilter(t.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border cursor-pointer ${
                      selectedTierFilter === t.id
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sample Vault Cards */}
              <div className="space-y-3">
                {filteredVaultSamples.map(sample => {
                  const terms = calculateEffectiveSampleClearanceTerms(
                    state,
                    sample,
                    selectedFlipTechnique,
                    selectedDealStructure
                  );
                  const hasGenreSynergy = Boolean(
                    activeTargetSong && sample.genreFit.includes(activeTargetSong.genre)
                  );
                  const totalQuality =
                    terms.effectiveQualityBoost + (hasGenreSynergy ? 2 : 0);

                  return (
                    <div
                      key={sample.id}
                      className="rounded-2xl p-3.5 bg-[#121824] border border-white/10 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-amber-400 truncate">
                            {sample.tierLabel} · {sample.eraLabel}
                          </div>
                          <h4 className="text-sm font-black text-white leading-snug mt-0.5">
                            {sample.sampleTitle}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {sample.originalArtist} · {sample.publisherEstate}
                          </p>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-xs font-black text-emerald-400">
                            +{totalQuality} Quality
                          </div>
                          <div className="text-[10px] text-sky-300">
                            +{Math.round((sample.viralPotentialMult - 1) * 100)}% Viral Hook
                          </div>
                        </div>
                      </div>

                      {/* Audio Waveform & Technical Specs Bar */}
                      <div className="rounded-xl bg-black/50 border border-white/10 p-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-end gap-1 h-7 shrink-0">
                          {sample.waveformPreview.map((bar, idx) => (
                            <span
                              key={idx}
                              className="w-1.5 rounded-full bg-amber-400/80"
                              style={{ height: `${Math.max(20, bar)}%` }}
                            />
                          ))}
                        </div>
                        <div className="text-right min-w-0">
                          <div className="text-[10px] font-mono font-bold text-white truncate">
                            {sample.bpmAndKey}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {sample.elementType}
                          </div>
                        </div>
                      </div>

                      {/* Genre Fit & Terms */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>
                          Best Fit: {sample.genreFit.join(', ')}
                          {hasGenreSynergy ? ' (+2 Synergy!)' : ''}
                        </span>
                        <span className="font-mono tabular-nums text-zinc-300">
                          {formatMoney(terms.effectiveUpfrontFee)} + {terms.effectiveRoyaltyPct}%
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          disabled={!activeTargetSong}
                          onClick={() => handleAttachSampleToStudioSong(sample, 'uncleared')}
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                        >
                          Flip Uncleared ($0)
                        </button>
                        <button
                          disabled={!activeTargetSong}
                          onClick={() => handleAttachSampleToStudioSong(sample, 'cleared')}
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-xs font-black text-black cursor-pointer font-mono tabular-nums"
                        >
                          Clear &amp; Flip ({formatMoney(terms.effectiveUpfrontFee)})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: SAMPLED SONGS IN CATALOG
             ============================================================ */}
          {activeTab === 'clearance' && (
            <div className="space-y-3.5">
              {/* Deal Structure Selector for Retroactive Pre-Clearance */}
              <div className="rounded-2xl p-3 bg-[#121824] border border-white/10 space-y-2">
                <div className="text-[11px] font-bold text-zinc-300">
                  Clearance Deal Structure for Uncleared Tracks:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {SAMPLE_CLEARANCE_STRUCTURES.map(deal => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => setSelectedDealStructure(deal.id)}
                      className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                        selectedDealStructure === deal.id
                          ? 'bg-emerald-400/15 border-emerald-400 text-white'
                          : 'bg-black/40 border-white/10 text-zinc-400'
                      }`}
                    >
                      <div className="text-[10px] font-black text-white truncate">
                        {deal.shortLabel}
                      </div>
                      <div className="text-[9px] text-emerald-300 font-mono">
                        {deal.upfrontMultiplier}x Fee · {deal.royaltyMultiplier}x Split
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {sampledSongs.length === 0 ? (
                <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 text-center space-y-2.5">
                  <p className="text-sm font-bold text-white">No Sampled Tracks Yet</p>
                  <p className="text-xs text-zinc-400">
                    Open the Sample Vault tab to flip a sample into an unreleased song or select a sample inside the Create Song wizard.
                  </p>
                  <button
                    onClick={() => setActiveTab('crate')}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-black cursor-pointer"
                  >
                    Open Sample Vault
                  </button>
                </div>
              ) : (
                sampledSongs.map(song => {
                  const info = (song as any).sampleInfo as SongSampleInfo;
                  const catalogRef = SAMPLE_CATALOG.find(c => c.id === info.sampleId);
                  const terms = catalogRef
                    ? calculateEffectiveSampleClearanceTerms(
                        state,
                        catalogRef,
                        info.flipTechnique || 'direct_loop',
                        selectedDealStructure
                      )
                    : {
                        effectiveUpfrontFee: 10000,
                        effectiveRoyaltyPct: 15,
                        effectiveQualityBoost: 5,
                        hasLegalDiscount: false
                      };

                  const isCleared =
                    info.clearanceStatus === 'cleared' || info.clearanceStatus === 'settled';

                  return (
                    <div
                      key={song.id}
                      className="rounded-2xl p-3.5 bg-[#121824] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] text-zinc-400">
                            {song.title} · {song.status.toUpperCase()} · +{info.qualityBoost} Quality
                          </div>
                          <h4 className="text-sm font-black text-white truncate mt-0.5">
                            Samples "{info.sampleTitle}"
                          </h4>
                          <p className="text-xs text-zinc-400 font-mono tabular-nums mt-0.5">
                            {info.originalArtist} ·{' '}
                            {isCleared
                              ? `Licensed (${info.publishingRoyaltyPct}% Split · Paid ${formatMoney(info.royaltyPaidTotal || 0)})`
                              : info.clearanceStatus === 'disputed'
                              ? 'ACTIVE COPYRIGHT LAWSUIT'
                              : 'Uncleared (Lawsuit Risk)'}
                          </p>
                        </div>
                      </div>

                      {!isCleared && info.clearanceStatus !== 'disputed' ? (
                        <button
                          onClick={() => handleClearSample(song.id)}
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-400 text-black text-xs font-black cursor-pointer font-mono tabular-nums"
                        >
                          Pre-Clear Now ({formatMoney(terms.effectiveUpfrontFee)} +{' '}
                          {terms.effectiveRoyaltyPct}% Royalties)
                        </button>
                      ) : info.clearanceStatus === 'disputed' ? (
                        <button
                          onClick={() => setActiveTab('disputes')}
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black cursor-pointer"
                        >
                          Open Lawsuit Defense Console
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ============================================================
              TAB 3: ACTIVE COPYRIGHT LAWSUITS & FEDERAL COURT CONSOLE
             ============================================================ */}
          {activeTab === 'disputes' && (
            <div className="space-y-4">
              {legalState.activeDisputes.length === 0 ? (
                <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 text-center space-y-2">
                  <p className="text-sm font-bold text-emerald-400">
                    Zero Active Copyright Lawsuits
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your catalog is currently free of copyright infringement claims. Using MPC Micro-Chops, pre-clearing samples, or releasing on Free Street Mixtapes minimizes legal exposure.
                  </p>
                </div>
              ) : (
                legalState.activeDisputes.map(dispute => {
                  const discountedSettlement = Math.round(
                    dispute.settlementDemandAmount * legalDiscount.feeDiscountMultiplier
                  );
                  const settledSplit = Math.max(
                    15,
                    Math.round(dispute.punitiveRoyaltyPct * 0.55)
                  );
                  const disputedSong = (state.songs || []).find(s => s.id === dispute.songId);
                  const songSampleInfo = (disputedSong as any)?.sampleInfo as
                    | SongSampleInfo
                    | undefined;
                  const flipMeta =
                    SAMPLE_FLIP_TECHNIQUES.find(f => f.id === songSampleInfo?.flipTechnique) ||
                    SAMPLE_FLIP_TECHNIQUES[0];
                  const winOddsPct = Math.round(
                    (0.34 +
                      legalDiscount.courtWinBonusChance +
                      flipMeta.courtDefenseBonusChance) *
                      100
                  );

                  return (
                    <div
                      key={dispute.id}
                      className="rounded-2xl p-4 bg-[#1B1116] border border-rose-500/40 space-y-3.5"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-rose-400">
                          COPYRIGHT INFRINGEMENT DOCKET · Filed {dispute.filedDate}
                        </div>
                        <h4 className="text-base font-black text-white mt-0.5">
                          "{dispute.songTitle}" vs. {dispute.originalArtist}
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {dispute.publisherEstate || dispute.originalArtist} alleges unauthorized
                          commercial reproduction of "{dispute.sampleTitle}" (Audio-ID Match:{' '}
                          {dispute.fingerprintMatchPct || 92}%).
                        </p>
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'settle_cash')}
                          className="w-full min-h-[46px] p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-black text-emerald-300">
                              1. Out-of-Court Cash Settlement
                            </div>
                            <div className="text-[11px] text-zinc-300">
                              Dismisses lawsuit immediately &amp; lowers royalty demand
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-white tabular-nums shrink-0">
                            {formatMoney(discountedSettlement)} + {settledSplit}%
                          </span>
                        </button>

                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'surrender_publishing')}
                          className="w-full min-h-[46px] p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 flex items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-black text-amber-300">
                              2. Retroactive Publishing Assignment
                            </div>
                            <div className="text-[11px] text-zinc-300">
                              Pay $0 upfront cash · Assigns co-writer share to estate
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-white tabular-nums shrink-0">
                            $0 Cash · {dispute.punitiveRoyaltyPct}% Split
                          </span>
                        </button>

                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'fight_in_court')}
                          className="w-full min-h-[46px] p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 flex items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-black text-rose-300">
                              3. Contest in Federal Court (Fair Use Defense)
                            </div>
                            <div className="text-[11px] text-zinc-300">
                              {winOddsPct}% Win Odds (Keep 100% royalties if victorious)
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-white tabular-nums shrink-0">
                            {formatMoney(dispute.courtDefenseCost)} Trial
                          </span>
                        </button>
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
}
