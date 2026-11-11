import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGameContext } from '../../GameContext';
import {
  EXTENDED_PROJECT_FORMATS,
  EDITION_AUDIO_ENGINEERS,
  AdvancedEditionVariantId,
  EditionAudioEngineerId,
  getVariantsForFormat,
  getEditionVariantById,
  getEditionEngineerById,
  createAdvancedEditionProject
} from '../../data/advancedProjectFormatsEngine';
import { resolveAuthenticCover } from '../../data/musicCatalog';
import { compressImageFile } from '../../utils/imageOptimizer';
import { formatMoney } from '../../constants';

interface AdvancedEditionsCreatorModalProps {
  onClose: () => void;
}

export default function AdvancedEditionsCreatorModal({
  onClose
}: AdvancedEditionsCreatorModalProps) {
  const { state, setState, setInfoModal } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFormat, setSelectedFormat] = useState<
    'deluxe' | 'mixtape' | 'remaster' | 'compilation'
  >('deluxe');

  const formatVariants = useMemo(
    () => getVariantsForFormat(selectedFormat),
    [selectedFormat]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<AdvancedEditionVariantId>(
    'deluxe_standard'
  );
  const [selectedEngineerId, setSelectedEngineerId] =
    useState<EditionAudioEngineerId>('standard_inhouse');

  useEffect(() => {
    const firstVar = getVariantsForFormat(selectedFormat)[0];
    if (firstVar) {
      setSelectedVariantId(firstVar.id);
    }
  }, [selectedFormat]);

  const [parentProjectId, setParentProjectId] = useState<number | null>(() => {
    const firstReleasedAlbum = (state.projects || []).find(
      p => p.status === 'released' && (p.type === 'album' || p.type === 'ep')
    );
    return firstReleasedAlbum ? firstReleasedAlbum.id : null;
  });

  const [title, setTitle] = useState('');
  const [linerNotes, setLinerNotes] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<number[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const activeFormatMeta = useMemo(
    () =>
      EXTENDED_PROJECT_FORMATS.find(f => f.id === selectedFormat) ||
      EXTENDED_PROJECT_FORMATS[4],
    [selectedFormat]
  );

  const activeVariant = useMemo(
    () => getEditionVariantById(selectedVariantId) || formatVariants[0],
    [selectedVariantId, formatVariants]
  );

  const activeEngineer = useMemo(
    () => getEditionEngineerById(selectedEngineerId),
    [selectedEngineerId]
  );

  const releasedParentAlbums = useMemo(
    () =>
      (state.projects || []).filter(
        p => p.status === 'released' && (p.type === 'album' || p.type === 'ep')
      ),
    [state.projects]
  );

  const selectedParentAlbum = useMemo(
    () => releasedParentAlbums.find(p => p.id === parentProjectId) || null,
    [releasedParentAlbums, parentProjectId]
  );

  const parentTrackIdsSet = useMemo(() => {
    if (!selectedParentAlbum) return new Set<number>();
    return new Set((selectedParentAlbum.songs || []).map(s => s.id));
  }, [selectedParentAlbum]);

  const candidateSongs = useMemo(() => {
    const allSongs = state.songs || [];
    if (selectedFormat === 'deluxe') {
      return allSongs
        .filter(
          s =>
            (s.status === 'recorded' || s.status === 'packaged') &&
            !parentTrackIdsSet.has(s.id)
        )
        .sort((a, b) => (Number(b.quality) || 0) - (Number(a.quality) || 0));
    }
    if (selectedFormat === 'remaster') {
      return allSongs
        .filter(
          s =>
            (s.status === 'recorded' || s.status === 'released') &&
            !parentTrackIdsSet.has(s.id)
        )
        .sort((a, b) => (Number(b.quality) || 0) - (Number(a.quality) || 0));
    }
    if (selectedFormat === 'compilation') {
      return [...allSongs]
        .filter(s => s.status === 'released' || s.status === 'recorded')
        .sort((a, b) => (Number(b.streams) || 0) - (Number(a.streams) || 0));
    }
    return [...allSongs]
      .filter(s => s.status === 'recorded' || s.status === 'released')
      .sort((a, b) => (Number(b.quality) || 0) - (Number(a.quality) || 0));
  }, [state.songs, selectedFormat, parentTrackIdsSet]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) setImagePreview(compressed);
    }
  };

  const toggleTrack = (id: number) => {
    setSelectedSongIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAutoSelectOptimalTracks = () => {
    const targetCount =
      selectedFormat === 'deluxe'
        ? Math.min(4, candidateSongs.length)
        : selectedFormat === 'remaster'
        ? Math.min(3, candidateSongs.length)
        : selectedFormat === 'compilation'
        ? Math.min(10, candidateSongs.length)
        : Math.min(8, candidateSongs.length);

    setSelectedSongIds(candidateSongs.slice(0, targetCount).map(s => s.id));
  };

  const defaultSuggestedTitle = useMemo(() => {
    const suffix = activeVariant?.defaultSuffix || '(Deluxe)';
    if ((selectedFormat === 'deluxe' || selectedFormat === 'remaster') && selectedParentAlbum) {
      return `${selectedParentAlbum.title} ${suffix}`;
    }
    if (selectedFormat === 'compilation') {
      return `${state.artist?.name || 'Artist'}${suffix}`;
    }
    if (selectedFormat === 'mixtape') {
      return `Street Sessions ${suffix}`;
    }
    return '';
  }, [selectedFormat, selectedParentAlbum, activeVariant, state.artist?.name]);

  // Projected combined songs & quality preview
  const editionPreviewStats = useMemo(() => {
    const chosenBonusSongs = candidateSongs.filter(s => selectedSongIds.includes(s.id));
    const parentSongs =
      (selectedFormat === 'deluxe' || selectedFormat === 'remaster') && selectedParentAlbum
        ? selectedParentAlbum.songs || []
        : [];
    const combined = [...parentSongs, ...chosenBonusSongs];
    const rawAvg =
      combined.length > 0
        ? combined.reduce((sum, s) => sum + (Number(s.quality) || 65), 0) / combined.length
        : 70;
    const totalBonusQuality =
      (activeVariant?.qualityBonus || 3) + activeEngineer.qualityBonus;
    const projectedQuality = Math.min(100, Math.round(rawAvg + totalBonusQuality));

    const hypeMult = Number(
      ((activeVariant?.hypeMultiplier || activeFormatMeta.hypeMultiplier) *
        (1 + activeEngineer.hypeBonusPct / 100)).toFixed(2)
    );
    const streamMult = Number(
      (activeVariant?.streamVelocityMultiplier || activeFormatMeta.streamVelocityMultiplier).toFixed(2)
    );
    const salesMult = Number(
      ((activeVariant?.pureSalesMultiplier || activeFormatMeta.pureSalesMultiplier) *
        (1 + activeEngineer.salesBonusPct / 100)).toFixed(2)
    );

    return {
      parentCount: parentSongs.length,
      bonusCount: chosenBonusSongs.length,
      totalTracks: combined.length,
      projectedQuality,
      totalBonusQuality,
      hypeMult,
      streamMult,
      salesMult
    };
  }, [
    candidateSongs,
    selectedSongIds,
    selectedFormat,
    selectedParentAlbum,
    activeVariant,
    activeEngineer,
    activeFormatMeta
  ]);

  const effectiveUpfrontCost =
    (activeVariant?.upfrontCost ?? activeFormatMeta.upfrontPackagingCost) +
    activeEngineer.fee;

  const previewCover =
    imagePreview ||
    selectedParentAlbum?.cover ||
    resolveAuthenticCover(
      state.artist?.name || 'Artist',
      title.trim() || defaultSuggestedTitle || 'Deluxe'
    );

  const handleCreate = () => {
    const res = createAdvancedEditionProject({
      state,
      format: selectedFormat,
      title: title.trim() || defaultSuggestedTitle,
      cover: imagePreview,
      parentProjectId,
      selectedSongIds,
      mixtapeModel: activeVariant?.mixtapeModel || 'commercial',
      variantId: activeVariant?.id,
      engineerId: activeEngineer.id,
      linerNotes
    });

    if (!res.success) {
      setInfoModal({ title: 'Unable to Package Edition', desc: res.message });
      return;
    }

    setState(res.updatedState);
    setInfoModal({ title: 'Edition Packaged & Mastered', desc: res.message });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-fade-in">
      <div className="bg-[#0B0E14] text-white w-full max-w-xl rounded-3xl border border-white/15 flex flex-col max-h-[93vh] overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#111622]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-[10px] font-black uppercase tracking-wider text-sky-300">
                Archival &amp; Era Expansion Desk
              </span>
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                Balance: {formatMoney(state.money || 0)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate mt-0.5">
              Deluxe, Mixtapes, Remasters &amp; Greatest Hits
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer shrink-0"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Step 1: Primary Format Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'deluxe', label: 'Deluxe LP', icon: 'ph-sparkle' },
                { id: 'mixtape', label: 'Mixtape', icon: 'ph-cassette-tape' },
                { id: 'remaster', label: 'Remaster + Vault', icon: 'ph-speaker-high' },
                { id: 'compilation', label: 'Greatest Hits', icon: 'ph-trophy' }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedFormat(tab.id);
                  setSelectedSongIds([]);
                }}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedFormat === tab.id
                    ? 'bg-sky-500 text-black border-sky-300 shadow-lg shadow-sky-500/20'
                    : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:text-white'
                }`}
              >
                <i className={`ph-fill ${tab.icon} text-sm`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Live Collector Sleeve & Era Multipliers Preview Card */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-[#151C2C] via-[#101520] to-[#0B0E14] border border-sky-500/25 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/15 shrink-0 bg-black">
              <img
                src={previewCover}
                alt="Edition Sleeve"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] font-black text-amber-300 text-center py-0.5 uppercase tracking-wider truncate px-1">
                {activeVariant?.badgeLabel}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  {activeVariant?.badgeLabel}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  Projected Master: {editionPreviewStats.projectedQuality}/100 (+{editionPreviewStats.totalBonusQuality} Boost)
                </span>
              </div>

              <div className="text-sm font-black text-white truncate">
                {title.trim() || defaultSuggestedTitle || 'Untitled Special Edition'}
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div className="rounded-lg bg-black/45 border border-white/10 px-2.5 py-1.5">
                  <div className="text-[9px] uppercase text-neutral-400 font-bold">
                    Hype Surge
                  </div>
                  <div className="text-xs font-mono font-black text-sky-400 tabular-nums">
                    {editionPreviewStats.hypeMult}x
                  </div>
                </div>
                <div className="rounded-lg bg-black/45 border border-white/10 px-2.5 py-1.5">
                  <div className="text-[9px] uppercase text-neutral-400 font-bold">
                    Stream Velocity
                  </div>
                  <div className="text-xs font-mono font-black text-emerald-400 tabular-nums">
                    {editionPreviewStats.streamMult}x
                  </div>
                </div>
                <div className="rounded-lg bg-black/45 border border-white/10 px-2.5 py-1.5">
                  <div className="text-[9px] uppercase text-neutral-400 font-bold">
                    Pure Sales
                  </div>
                  <div className="text-xs font-mono font-black text-amber-300 tabular-nums">
                    {editionPreviewStats.salesMult}x
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Edition Sub-Variant Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-300">
                1. Choose Edition Configuration &amp; Packaging Tier
              </label>
              <span className="text-[11px] font-mono text-sky-400">
                {formatVariants.length} Formats
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {formatVariants.map(variant => {
                const isSelected = activeVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-white truncate">
                          {variant.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-mono font-bold text-amber-300 shrink-0">
                          +{variant.qualityBonus} Quality
                        </span>
                      </div>
                      <span className="text-xs font-mono font-black text-sky-300 shrink-0 tabular-nums">
                        {variant.upfrontCost === 0
                          ? 'FREE ($0)'
                          : formatMoney(variant.upfrontCost)}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 mt-1">
                      {variant.subtitle}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {variant.perks.map((perk, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-neutral-300"
                        >
                          • {perk}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Parent Album Picker (for Deluxe & Remaster) */}
          {(selectedFormat === 'deluxe' || selectedFormat === 'remaster') && (
            <div className="space-y-2 rounded-2xl p-3.5 bg-[#121723] border border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-200">
                  2. Target Catalog Album to Upgrade ({releasedParentAlbums.length} Eligible)
                </label>
                {selectedParentAlbum && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    +{selectedParentAlbum.songs?.length || 0} Base Tracks Included
                  </span>
                )}
              </div>

              {releasedParentAlbums.length === 0 ? (
                <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  You need at least 1 released Album or EP in your catalog before packaging a {activeFormatMeta.shortLabel}.
                </div>
              ) : (
                <>
                  <select
                    value={parentProjectId || ''}
                    onChange={e => setParentProjectId(Number(e.target.value))}
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                  >
                    {releasedParentAlbums.map(alb => (
                      <option key={alb.id} value={alb.id}>
                        {alb.title} ({alb.songs?.length || 0} Tracks · Quality {Math.round(alb.quality || 70)} · {(alb.pureSales || 0).toLocaleString()} Sales)
                      </option>
                    ))}
                  </select>

                  {selectedParentAlbum && (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                      <div className="rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/5">
                        <span className="text-neutral-400 block text-[9px]">ORIGINAL LP</span>
                        <span className="text-white font-bold">
                          {selectedParentAlbum.songs?.length || 0} Tracks · Q{Math.round(selectedParentAlbum.quality || 70)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/5">
                        <span className="text-neutral-400 block text-[9px]">BONUS / VAULT</span>
                        <span className="text-sky-400 font-bold">
                          +{selectedSongIds.length} New Tracks
                        </span>
                      </div>
                      <div className="rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/5">
                        <span className="text-neutral-400 block text-[9px]">COMBINED ERA</span>
                        <span className="text-emerald-400 font-bold">
                          {editionPreviewStats.totalTracks} Tracks · Q{editionPreviewStats.projectedQuality}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 4: Audio Mastering Engineer / DJ Host */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-300">
              {selectedFormat === 'mixtape'
                ? '2. Select DJ Host & Mastering Chain'
                : '3. Select Audio Mastering & Lacquer Suite'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EDITION_AUDIO_ENGINEERS.map(eng => {
                const isSelected = activeEngineer.id === eng.id;
                return (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setSelectedEngineerId(eng.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white truncate">
                        {eng.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-300 shrink-0">
                        {eng.fee === 0 ? '$0' : formatMoney(eng.fee)}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                      {eng.studioLocation} · +{eng.qualityBonus} Q
                      {eng.hypeBonusPct > 0 ? ` · +${eng.hypeBonusPct}% Hype` : ''}
                      {eng.salesBonusPct > 0 ? ` · +${eng.salesBonusPct}% Sales` : ''}
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2">
                      {eng.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Edition Title, Liner Notes & Custom Cover */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300">
                Edition Release Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={defaultSuggestedTitle || 'Enter edition title...'}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300">
                Edition Sleeve Art:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[38px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white cursor-pointer truncate"
              >
                {imagePreview ? 'Custom Art Loaded' : 'Upload Alt Cover'}
              </button>
            </div>
          </div>

          {/* Step 6: Bonus / Vault / Anthology Tracklist Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-neutral-200 block">
                  {selectedFormat === 'deluxe'
                    ? 'Select Disc 2 Bonus Tracks (2–8 Recorded Songs)'
                    : selectedFormat === 'remaster'
                    ? 'Select "From The Vault" Bonus Tracks (1–6 Songs)'
                    : selectedFormat === 'compilation'
                    ? 'Curate Anthology Tracklist (6–25 Hit Songs)'
                    : 'Curate Mixtape Tracklist (5–20 Songs)'}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {selectedSongIds.length} selected · Total Edition Tracklist: {editionPreviewStats.totalTracks} tracks
                </span>
              </div>

              {candidateSongs.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoSelectOptimalTracks}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[11px] font-bold text-sky-300 cursor-pointer"
                >
                  Auto-Pick Best Tracks
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-white/10 rounded-2xl bg-black/50 border border-white/10">
              {candidateSongs.length === 0 ? (
                <div className="p-4 text-xs text-neutral-400 text-center">
                  No eligible tracks found outside the parent album. Record new songs in the Studio first!
                </div>
              ) : (
                candidateSongs.map((song, idx) => {
                  const isChecked = selectedSongIds.includes(song.id);
                  const sampleBadge = song.sampleInfo
                    ? song.sampleInfo.clearanceStatus === 'cleared'
                      ? 'SAMPLE CLEARED'
                      : 'UNCLEARED SAMPLE'
                    : null;

                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => toggleTrack(song.id)}
                      className={`w-full p-3 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors ${
                        isChecked ? 'bg-sky-500/15' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-500">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {song.title}
                          </span>
                          {sampleBadge && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                song.sampleInfo?.clearanceStatus === 'cleared'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              {sampleBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono tabular-nums mt-0.5">
                          {song.genre} · {song.status.toUpperCase()} · Q{Math.round(song.quality)}
                          {song.streams > 0
                            ? ` · ${song.streams.toLocaleString()} streams`
                            : ''}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                          isChecked
                            ? 'bg-sky-500 text-black'
                            : 'bg-white/10 text-neutral-300'
                        }`}
                      >
                        {isChecked ? 'Included' : '+ Add'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Optional Archival Liner Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-400">
              Collector Booklet / Archival Liner Notes (Optional):
            </label>
            <input
              type="text"
              value={linerNotes}
              onChange={e => setLinerNotes(e.target.value)}
              placeholder="e.g., Dedicated to day-one fans. Recorded at Electric Lady Studios..."
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black cursor-pointer font-mono tabular-nums shadow-lg shadow-sky-500/20"
            >
              Package {activeVariant?.badgeLabel || activeFormatMeta.shortLabel} ({formatMoney(effectiveUpfrontCost)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
