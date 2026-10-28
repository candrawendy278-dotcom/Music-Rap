import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull } from '../../constants';
import {
  RIAA_CERTIFICATION_TIERS,
  RIAA_FRAME_STYLES,
  RIAA_MATBOARD_STYLES,
  RIAA_DISC_LAYOUTS,
  RiaaFrameStyle,
  RiaaMatboardStyle,
  RiaaDiscLayout,
  RiaaItemAuditEvaluation,
  RiaaCertifiedRecord,
  ensureRiaaState,
  evaluateAllPlayerRiaaItems,
  submitRiaaCertificationAudit,
  updateCertifiedPlaqueDesign,
  buildGlobalRiaaLeaderboard
} from '../../data/riaaCertificationEngine';
import { RiaaPlaqueVisual, RiaaCertBadge } from './RiaaPlaqueVisual';

export default function RiaaCertificationApp() {
  const { state, setState } = useGameContext();
  const artistName = state.artist?.name || 'Artist';

  const riaaState = useMemo(() => ensureRiaaState(state), [state]);
  const playerEval = useMemo(() => evaluateAllPlayerRiaaItems(state), [state]);
  const leaderboard = useMemo(() => buildGlobalRiaaLeaderboard(state), [state]);

  const [activeTab, setActiveTab] = useState<
    'audit' | 'plaques' | 'leaderboard' | 'ledger'
  >('audit');

  const [auditFilter, setAuditFilter] = useState<
    'all' | 'eligible' | 'song' | 'project'
  >('all');

  const [leaderboardSort, setLeaderboardSort] = useState<
    'units' | 'diamonds' | 'plaques'
  >('units');

  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: 'ok' | 'err';
  } | null>(null);

  // Modal state for submitting a new RIAA Audit OR customizing an existing Certified Plaque
  const [activeAuditModalItem, setActiveAuditModalItem] =
    useState<RiaaItemAuditEvaluation | null>(null);
  const [activeInspectorPlaque, setActiveInspectorPlaque] =
    useState<RiaaCertifiedRecord | null>(null);

  // Customizer form state
  const [customFrame, setCustomFrame] =
    useState<RiaaFrameStyle>('obsidian_gallery');
  const [customMatboard, setCustomMatboard] =
    useState<RiaaMatboardStyle>('royal_obsidian');
  const [customDiscLayout, setCustomDiscLayout] =
    useState<RiaaDiscLayout>('classic_crest');
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [customDedication, setCustomDedication] = useState<string>('');

  const triggerToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3400);
  };

  const closeApp = () => {
    setState(p => ({ ...p, activeApp: 'none' }));
  };

  const openAuditClaimModal = (item: RiaaItemAuditEvaluation) => {
    const topTier = item.highestEligibleTier;
    const existing = item.currentCertifiedRecord?.plaqueConfig;

    setCustomFrame(
      existing?.frameStyle ||
        (topTier?.metalClass === 'diamond'
          ? 'brushed_chrome'
          : topTier?.metalClass === 'gold'
          ? 'gold_leaf_executive'
          : 'obsidian_gallery')
    );
    setCustomMatboard(
      existing?.matboardStyle ||
        (topTier?.metalClass === 'diamond'
          ? 'midnight_sapphire'
          : 'royal_obsidian')
    );
    setCustomDiscLayout(
      existing?.discLayout ||
        ((topTier?.platinumMultiplier || 0) >= 2
          ? 'collector_shrine'
          : (topTier?.platinumMultiplier || 0) >= 1
          ? 'double_symphony'
          : 'classic_crest')
    );
    setCustomRecipient(
      existing?.recipientLine || `PRESENTED TO ${artistName.toUpperCase()}`
    );
    setCustomDedication(
      existing?.dedicationNote ||
        `TO COMMEMORATE ${formatNumFull(
          topTier?.unitsRequired || 500_000
        )} CERTIFIED RIAA® UNITS OF "${item.title.toUpperCase()}"`
    );
    setActiveAuditModalItem(item);
  };

  const openPlaqueInspector = (cert: RiaaCertifiedRecord) => {
    setCustomFrame(cert.plaqueConfig.frameStyle);
    setCustomMatboard(cert.plaqueConfig.matboardStyle);
    setCustomDiscLayout(cert.plaqueConfig.discLayout);
    setCustomRecipient(cert.plaqueConfig.recipientLine);
    setCustomDedication(cert.plaqueConfig.dedicationNote);
    setActiveInspectorPlaque(cert);
  };

  const handleConfirmAuditSubmission = () => {
    if (!activeAuditModalItem) return;

    const res = submitRiaaCertificationAudit({
      state,
      itemKey: activeAuditModalItem.key,
      plaqueConfig: {
        frameStyle: customFrame,
        matboardStyle: customMatboard,
        discLayout: customDiscLayout,
        recipientLine: customRecipient,
        dedicationNote: customDedication
      }
    });

    if (!res.success) {
      triggerToast(res.error || 'Could not complete RIAA audit.', 'err');
      return;
    }

    setState(res.updatedState);
    setActiveAuditModalItem(null);
    triggerToast(
      `Certified "${activeAuditModalItem.title}" as ${res.newlyClaimedTier?.label}! @RIAA posted on X.`,
      'ok'
    );
  };

  const handleSavePlaqueCustomization = () => {
    if (!activeInspectorPlaque) return;
    const nextState = updateCertifiedPlaqueDesign(
      state,
      activeInspectorPlaque.key,
      {
        frameStyle: customFrame,
        matboardStyle: customMatboard,
        discLayout: customDiscLayout,
        recipientLine: customRecipient,
        dedicationNote: customDedication
      }
    );
    setState(nextState);
    const updatedRiaa = ensureRiaaState(nextState);
    setActiveInspectorPlaque(
      updatedRiaa.certifiedRecords[activeInspectorPlaque.key] || null
    );
    triggerToast('Commemorative RIAA plaque frame & engraving updated!', 'ok');
  };

  const filteredAuditItems = useMemo(() => {
    return playerEval.allItems.filter(item => {
      if (auditFilter === 'eligible') return item.isEligibleForNewAudit;
      if (auditFilter === 'song') return item.itemType === 'song';
      if (auditFilter === 'project') return item.itemType === 'project';
      return true;
    });
  }, [playerEval.allItems, auditFilter]);

  const sortedLeaderboard = useMemo(() => {
    const copy = [...leaderboard];
    if (leaderboardSort === 'diamonds') {
      copy.sort(
        (a, b) =>
          b.diamondCount - a.diamondCount ||
          b.totalCertifiedUnits - a.totalCertifiedUnits
      );
    } else if (leaderboardSort === 'plaques') {
      copy.sort(
        (a, b) =>
          b.totalPlaques - a.totalPlaques ||
          b.totalCertifiedUnits - a.totalCertifiedUnits
      );
    } else {
      copy.sort((a, b) => b.totalCertifiedUnits - a.totalCertifiedUnits);
    }
    return copy;
  }, [leaderboard, leaderboardSort]);

  const playerRank = useMemo(() => {
    const idx = sortedLeaderboard.findIndex(e => e.isPlayer);
    return idx >= 0 ? idx + 1 : sortedLeaderboard.length;
  }, [sortedLeaderboard]);

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#09090D] text-zinc-100 z-50 flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* TOP RIAA WASHINGTON D.C. REGISTRY BAR */}
      <div className="bg-gradient-to-r from-[#181409] via-[#27200C] to-[#181409] text-amber-300/90 px-3.5 py-1.5 text-[10px] font-mono tracking-wider uppercase flex items-center justify-between border-b border-amber-500/20 shrink-0">
        <span className="truncate">
          RECORDING INDUSTRY ASSOCIATION OF AMERICA® • GOLD & PLATINUM PROGRAM
        </span>
        <span className="font-bold text-amber-200 shrink-0 ml-2">EST. 1958</span>
      </div>

      {/* MAIN NAVIGATION HEADER */}
      <header className="px-4 pt-3 pb-3 bg-[#101017]/95 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={closeApp}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition cursor-pointer shrink-0"
            >
              <i className="ph-bold ph-arrow-left text-base"></i>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-wider uppercase truncate text-white">
                RIAA® Gold & Platinum Registry
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono tabular-nums">
                <span>Cash: ${formatNum(state.money)}</span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">
                  {playerEval.summary.totalPlaques} Certified Plaques
                </span>
              </div>
            </div>
          </div>

          {playerEval.eligibleItems.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('audit');
                setAuditFilter('eligible');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-zinc-950 text-[11px] font-black flex items-center gap-1 shadow-sm hover:bg-amber-300 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <i className="ph-fill ph-seal-check text-xs"></i>
              <span>{playerEval.eligibleItems.length} Eligible</span>
            </button>
          )}
        </div>

        {/* 4-Tab Segmented Switcher */}
        <div className="grid grid-cols-4 gap-1 mt-3 p-1 bg-[#181822] rounded-lg border border-white/5">
          {[
            {
              id: 'audit' as const,
              label: `Audit (${playerEval.allItems.length})`
            },
            {
              id: 'plaques' as const,
              label: `Plaques (${playerEval.certifiedItems.length})`
            },
            { id: 'leaderboard' as const, label: 'Global Rank' },
            { id: 'ledger' as const, label: 'Rules & Log' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 text-[10.5px] font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* TOAST FEEDBACK */}
      {toastMsg && (
        <div
          className={`mx-4 mt-2 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between shadow-lg z-30 ${
            toastMsg.type === 'err'
              ? 'bg-rose-600 text-white'
              : 'bg-amber-400 text-zinc-950'
          }`}
        >
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* MAIN SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* ARTIST RIAA CAREER TROPHY VAULT BANNER */}
        <div className="mx-4 mt-4 rounded-xl bg-gradient-to-br from-[#191924] via-[#12121A] to-[#0D0D13] border border-amber-500/25 p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                OFFICIAL ARTIST CERTIFICATION SUMMARY
              </div>
              <h2 className="text-base font-black text-white truncate mt-0.5">
                {artistName} — {formatNumFull(playerEval.summary.totalCertifiedUnits)}{' '}
                Certified Units
              </h2>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-xs font-black text-amber-300">
                Rank #{playerRank}
              </div>
              <div className="text-[9px] text-zinc-400">All-Time Global</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-white/10 text-center font-mono tabular-nums">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-400/25">
              <div className="text-sm font-black text-sky-300">
                {playerEval.summary.diamondCount}
              </div>
              <div className="text-[9px] text-sky-200/80 font-sans uppercase font-bold">
                Diamond (10M+)
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-200/10 border border-zinc-300/25">
              <div className="text-sm font-black text-white">
                {playerEval.summary.multiPlatinumCount}
              </div>
              <div className="text-[9px] text-zinc-300 font-sans uppercase font-bold">
                Multi-Plat
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-400/10 border border-zinc-400/20">
              <div className="text-sm font-black text-zinc-200">
                {playerEval.summary.platinumCount}
              </div>
              <div className="text-[9px] text-zinc-400 font-sans uppercase font-bold">
                1x Platinum
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/25">
              <div className="text-sm font-black text-amber-300">
                {playerEval.summary.goldCount}
              </div>
              <div className="text-[9px] text-amber-200/80 font-sans uppercase font-bold">
                Gold (500K+)
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: RIAA AUDIT CENTER (REAL-TIME SEA / TEA / PURE UNIT TRACKER)
           ===================================================================== */}
        {activeTab === 'audit' && (
          <div className="px-4 mt-4 space-y-3.5">
            {/* Filter Controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {[
                {
                  id: 'all' as const,
                  label: `All Releases (${playerEval.allItems.length})`
                },
                {
                  id: 'eligible' as const,
                  label: `Eligible for Audit (${playerEval.eligibleItems.length})`
                },
                { id: 'project' as const, label: 'Albums & EPs (SEA + TEA + Pure)' },
                { id: 'song' as const, label: 'Singles (1:150 Ratio)' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAuditFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    auditFilter === f.id
                      ? 'bg-white text-zinc-950'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredAuditItems.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#13131C] p-7 text-center">
                <div className="w-11 h-11 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-2.5">
                  <i className="ph-duotone ph-disc text-2xl text-amber-400"></i>
                </div>
                <h3 className="text-sm font-bold text-white">
                  {auditFilter === 'eligible'
                    ? 'No Releases Waiting for Audit Right Now'
                    : 'No Released Songs or Albums Found'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  {auditFilter === 'eligible'
                    ? 'Keep accumulating Spotify streams, YouTube views, iTunes downloads, and Official Store Vinyl/CD sales to cross the next 500K Gold or 1M Platinum threshold.'
                    : 'Release a Single, EP, or Album from the Studio to begin tracking official RIAA certification units.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAuditItems.map(item => {
                  const cert = item.currentCertifiedRecord;
                  return (
                    <div
                      key={item.key}
                      className={`rounded-xl border p-3.5 transition ${
                        item.isEligibleForNewAudit
                          ? 'bg-[#171622] border-amber-400/50 shadow-[0_0_24px_rgba(251,191,36,0.08)]'
                          : 'bg-[#13131C] border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={item.cover}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-13 h-13 rounded-lg object-cover border border-white/15 shrink-0 bg-zinc-900"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                {item.releaseSubtype}
                              </span>
                              <span>·</span>
                              <span className="text-[10px] text-zinc-400 truncate">
                                {item.recordLabel}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white truncate mt-0.5">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {cert ? (
                                <RiaaCertBadge
                                  shortBadge={cert.shortBadge}
                                  metalClass={cert.metalClass}
                                  isCertified={true}
                                  isEligibleForUpgrade={item.isEligibleForNewAudit}
                                />
                              ) : (
                                <span className="text-[10px] font-mono text-zinc-500">
                                  Uncertified
                                </span>
                              )}
                              {item.isEligibleForNewAudit &&
                                item.highestEligibleTier && (
                                  <span className="text-[10px] font-mono font-bold text-amber-400">
                                    → Eligible for {item.highestEligibleTier.shortBadge}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-sm font-black text-white">
                            {formatNumFull(item.totalEligibleRiaaUnits)}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            RIAA Eligible Units
                          </div>
                        </div>
                      </div>

                      {/* Exact RIAA Unit Conversion Breakdown */}
                      <div className="grid grid-cols-3 gap-1.5 mt-3 p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono tabular-nums">
                        <div>
                          <div className="text-zinc-400 font-sans">
                            {item.itemType === 'project'
                              ? 'Pure & Vinyl/CD'
                              : 'Pure Sales (1:1)'}
                          </div>
                          <div className="font-bold text-white mt-0.5">
                            {formatNumFull(item.pureSalesUnits)} u
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-400 font-sans">
                            {item.itemType === 'project'
                              ? 'SEA (Streams ÷ 1500)'
                              : 'Streams/MV (÷ 150)'}
                          </div>
                          <div className="font-bold text-emerald-400 mt-0.5">
                            {formatNumFull(item.streamingEquivalentUnits)} u
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-400 font-sans">
                            {item.itemType === 'project'
                              ? 'TEA (Track Sales ÷ 10)'
                              : 'Raw Streams + Views'}
                          </div>
                          <div className="font-bold text-sky-400 mt-0.5">
                            {item.itemType === 'project'
                              ? `${formatNumFull(item.trackEquivalentUnits)} u`
                              : formatNum(item.totalRawStreamsAndViews)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar to Next Tier */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-zinc-400 mb-1">
                          <span>
                            Next Target: {item.nextUpcomingTier?.label} (
                            {formatNumFull(
                              item.nextUpcomingTier?.unitsRequired || 0
                            )}{' '}
                            u)
                          </span>
                          <span>
                            {item.unitsNeededForNext > 0
                              ? `${formatNumFull(item.unitsNeededForNext)} u needed`
                              : 'Threshold Reached'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              item.isEligibleForNewAudit
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.progressToNextPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Bar when Eligible for New Audit */}
                      {item.isEligibleForNewAudit && item.highestEligibleTier && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-zinc-300 font-mono tabular-nums">
                            <span>
                              Audit Fee:{' '}
                              <strong className="text-white">
                                ${formatNumFull(item.netArtistAuditFee)}
                              </strong>
                            </span>
                            {item.labelSubsidyAmount > 0 && (
                              <span className="text-emerald-400 ml-1">
                                (Label paid ${formatNumFull(item.labelSubsidyAmount)})
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => openAuditClaimModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            Certify {item.highestEligibleTier.shortBadge} & Frame Plaque
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: INTERACTIVE 3D-STYLE FRAMED PLAQUE WALL & CUSTOMIZER
           ===================================================================== */}
        {activeTab === 'plaques' && (
          <div className="px-4 mt-4 space-y-4">
            {playerEval.certifiedItems.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#13131C] p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-3">
                  <i className="ph-duotone ph-frame-corners text-2xl text-amber-400"></i>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Your RIAA Plaque Wall is Empty
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Once a Single or Album reaches 500,000 RIAA units, submit an official audit in the Audit Center to commission your first framed Gold, Platinum, or Diamond plaque.
                </p>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="mt-4 px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 text-xs font-black cursor-pointer"
                >
                  Go to Audit Center
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {playerEval.certifiedItems.map(cert => (
                  <div
                    key={cert.key}
                    onClick={() => openPlaqueInspector(cert)}
                    className="rounded-2xl bg-[#13131D] border border-white/10 p-3.5 hover:border-amber-400/40 transition cursor-pointer space-y-3"
                  >
                    <RiaaPlaqueVisual
                      title={cert.title}
                      artistName={artistName}
                      releaseSubtype={cert.releaseSubtype}
                      cover={cert.cover}
                      tierLabel={cert.highestTierLabel}
                      shortBadge={cert.shortBadge}
                      metalClass={cert.metalClass}
                      certifiedUnits={cert.certifiedUnitsAtAudit}
                      dateCertified={cert.dateCertified}
                      serialNumber={cert.serialNumber}
                      recordLabel={cert.recordLabel}
                      plaqueConfig={cert.plaqueConfig}
                      size="md"
                    />

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <span className="font-bold text-white">{cert.title}</span>
                        <span className="text-zinc-400 ml-1.5 font-mono text-[11px]">
                          ({formatNumFull(cert.certifiedUnitsAtAudit)} Audited Units)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400">
                        Customize Frame →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: GLOBAL ARTIST LEADERBOARD (PLAYER VS. NPC SUPERSTARS)
           ===================================================================== */}
        {activeTab === 'leaderboard' && (() => {
          const playerRankIndex = sortedLeaderboard.findIndex(e => e.isPlayer);
          const playerEntry = sortedLeaderboard[playerRankIndex];
          return (
          <div className="px-4 mt-4 space-y-3.5">
            {playerEntry && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#181622] to-[#13131C] border border-amber-400/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="px-2 py-1 rounded-lg bg-amber-400 text-zinc-950 font-mono text-xs font-black shrink-0">
                    #{playerRankIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {playerEntry.name} (Your Global Standing)
                    </div>
                    <div className="text-[10px] text-zinc-300 font-mono tabular-nums">
                      {playerEntry.diamondCount} Diamond · {playerEntry.multiPlatinumCount} Multi-Plat · {playerEntry.goldCount} Gold
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-xs font-black text-amber-300">
                    {formatNum(playerEntry.totalCertifiedUnits)} u
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {playerEntry.totalPlaques} plaques
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                All-Time RIAA Certified Artists ({sortedLeaderboard.length})
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-[#181822] rounded-lg border border-white/10">
                {[
                  { id: 'units' as const, label: 'Units' },
                  { id: 'diamonds' as const, label: 'Diamonds' },
                  { id: 'plaques' as const, label: 'Plaques' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setLeaderboardSort(s.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      leaderboardSort === s.id
                        ? 'bg-amber-400 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {sortedLeaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    entry.isPlayer
                      ? 'bg-amber-500/10 border-amber-400/50'
                      : 'bg-[#13131C] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-6 text-center font-mono text-xs font-black shrink-0 ${
                        idx === 0
                          ? 'text-amber-300'
                          : idx === 1
                          ? 'text-zinc-200'
                          : idx === 2
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0 bg-zinc-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {entry.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate">
                          {entry.name}
                        </span>
                        {entry.isPlayer && (
                          <span className="text-[9px] font-mono font-bold uppercase text-amber-300">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        Signature: {entry.signatureDiamondTitle}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums mt-0.5">
                        <span className="text-sky-300 font-bold">
                          {entry.diamondCount} Diamond
                        </span>
                        <span>·</span>
                        <span className="text-zinc-200">
                          {entry.multiPlatinumCount} Multi-Plat
                        </span>
                        <span>·</span>
                        <span className="text-amber-300">
                          {entry.goldCount} Gold
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs font-black text-white">
                      {formatNum(entry.totalCertifiedUnits)}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {entry.totalPlaques} plaques
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* =====================================================================
            TAB 4: OFFICIAL RIAA AUDIT HISTORY LEDGER & CONVERSION RULES
           ===================================================================== */}
        {activeTab === 'ledger' && (
          <div className="px-4 mt-4 space-y-5">
            {/* Official RIAA Conversion Formula Reference */}
            <div className="rounded-xl bg-[#13131C] border border-white/10 p-3.5 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Official RIAA Unit Audit Standards
              </h3>
              <div className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
                <p>
                  <strong className="text-white">
                    Digital & Physical Single Award:
                  </strong>{' '}
                  1 RIAA Unit = <strong>1 Pure Sale</strong> (iTunes or D2C Single Vinyl/CD) OR{' '}
                  <strong>150 On-Demand Audio/Video Streams</strong> (Spotify + YouTube MV/Visualizer/Lyric Views).
                </p>
                <p>
                  <strong className="text-white">
                    Album & EP Award (SEA + TEA + Pure):
                  </strong>{' '}
                  1 RIAA Album Unit = <strong>1 Pure Album Sale</strong> (iTunes + Official Store 12&quot; Vinyl LP, CD, Cassette, or Box Set) +{' '}
                  <strong>1,500 On-Demand Track Streams (SEA)</strong> +{' '}
                  <strong>10 Individual Track Sales (TEA)</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono text-[10px] tabular-nums">
                <div className="p-2 rounded bg-black/40">
                  <span className="text-amber-300 font-bold block">
                    RIAA Gold®
                  </span>
                  <span className="text-zinc-400">500,000 Certified Units</span>
                </div>
                <div className="p-2 rounded bg-black/40">
                  <span className="text-zinc-100 font-bold block">
                    RIAA Platinum®
                  </span>
                  <span className="text-zinc-400">1,000,000 Certified Units</span>
                </div>
                <div className="p-2 rounded bg-black/40">
                  <span className="text-white font-bold block">
                    RIAA Multi-Platinum®
                  </span>
                  <span className="text-zinc-400">2,000,000 – 9,000,000 Units</span>
                </div>
                <div className="p-2 rounded bg-black/40">
                  <span className="text-sky-300 font-bold block">
                    RIAA Diamond®
                  </span>
                  <span className="text-zinc-400">10,000,000+ Certified Units</span>
                </div>
              </div>
            </div>

            {/* Official Audit History Ledger */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Official RIAA Serialized Audit Log ({riaaState.auditLogs.length})
              </h3>
              {riaaState.auditLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No RIAA audits submitted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {riaaState.auditLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#13131C] border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={log.cover}
                          alt={log.title}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate">
                            {log.title} → {log.newTierLabel}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {log.date} · #{log.serialNumber} · Fee $
                            {formatNumFull(log.auditFeePaid)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="font-bold text-amber-300">
                          {formatNumFull(log.auditedUnits)} u
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {log.releaseSubtype}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: SUBMIT RIAA AUDIT & CUSTOMIZE COMMEMORATIVE PLAQUE
         ===================================================================== */}
      {activeAuditModalItem && activeAuditModalItem.highestEligibleTier && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-[#12121A] text-zinc-100 rounded-t-2xl border-t border-amber-400/30 max-h-[92vh] overflow-y-auto p-4 pb-8 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  OFFICIAL RIAA AUDIT & PLAQUE COMMISSION
                </span>
                <h3 className="text-sm font-black text-white">
                  Certify &quot;{activeAuditModalItem.title}&quot; as{' '}
                  {activeAuditModalItem.highestEligibleTier.label}
                </h3>
              </div>
              <button
                onClick={() => setActiveAuditModalItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <i className="ph-bold ph-x text-sm"></i>
              </button>
            </div>

            {/* Live 3D Plaque Preview */}
            <RiaaPlaqueVisual
              title={activeAuditModalItem.title}
              artistName={artistName}
              releaseSubtype={activeAuditModalItem.releaseSubtype}
              cover={activeAuditModalItem.cover}
              tierLabel={activeAuditModalItem.highestEligibleTier.label}
              shortBadge={activeAuditModalItem.highestEligibleTier.shortBadge}
              metalClass={activeAuditModalItem.highestEligibleTier.metalClass}
              certifiedUnits={activeAuditModalItem.totalEligibleRiaaUnits}
              dateCertified={state.date}
              serialNumber="RIAA-PREVIEW"
              recordLabel={activeAuditModalItem.recordLabel}
              plaqueConfig={{
                frameStyle: customFrame,
                matboardStyle: customMatboard,
                discLayout: customDiscLayout,
                recipientLine: customRecipient,
                dedicationNote: customDedication
              }}
              size="lg"
            />

            {/* Plaque Customization Controls */}
            <div className="space-y-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  01. Select Gallery Frame Material
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RIAA_FRAME_STYLES.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCustomFrame(f.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                        customFrame === f.id
                          ? 'border-amber-400 bg-amber-400/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-300'
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">
                        {f.label}
                      </div>
                      <div className="text-[9px] text-zinc-400 truncate">
                        {f.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  02. Select Velvet Matboard Backdrop
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RIAA_MATBOARD_STYLES.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCustomMatboard(m.id)}
                      className={`p-2 rounded-lg border flex items-center gap-2 text-left text-xs transition cursor-pointer ${
                        customMatboard === m.id
                          ? 'border-amber-400 bg-amber-400/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: m.swatchHex }}
                      />
                      <span className="font-bold text-[11px] truncate">
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  03. Metallic Award Disc Configuration
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RIAA_DISC_LAYOUTS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setCustomDiscLayout(d.id)}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        customDiscLayout === d.id
                          ? 'border-amber-400 bg-amber-400/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-300'
                      }`}
                    >
                      <div className="font-bold text-[10px] leading-tight">
                        {d.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Engraved Recipient Line
                  </label>
                  <input
                    type="text"
                    value={customRecipient}
                    onChange={e => setCustomRecipient(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#09090D] border border-white/10 text-xs font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Engraved Commemoration Plate Text
                  </label>
                  <input
                    type="text"
                    value={customDedication}
                    onChange={e => setCustomDedication(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#09090D] border border-white/10 text-xs text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Audit Summary & Prestige Rewards */}
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-1.5 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-300 font-sans">
                  Milestones Included in Audit:
                </span>
                <span className="font-bold text-amber-300">
                  {activeAuditModalItem.newlyUnclaimedTiers
                    .map(t => t.shortBadge)
                    .join(' → ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300 font-sans">
                  Career Prestige Boost:
                </span>
                <span className="font-bold text-emerald-400">
                  +{activeAuditModalItem.totalPopReward} Pop · +
                  {activeAuditModalItem.totalHypeReward} Hype · +
                  {formatNumFull(activeAuditModalItem.totalFanReward)} Fans
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-zinc-300 font-sans">
                  Net Artist Audit & Plaque Fee:
                </span>
                <span className="font-black text-white">
                  ${formatNumFull(activeAuditModalItem.netArtistAuditFee)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmAuditSubmission}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              Submit Official RIAA Audit & Commission Plaque ($
              {formatNumFull(activeAuditModalItem.netArtistAuditFee)})
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: INSPECT & RE-FRAME EXISTING CERTIFIED PLAQUE
         ===================================================================== */}
      {activeInspectorPlaque && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-[#12121A] text-zinc-100 rounded-t-2xl border-t border-white/15 max-h-[92vh] overflow-y-auto p-4 pb-8 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  RIAA PLAQUE ARCHIVE & ATELIER
                </span>
                <h3 className="text-sm font-black text-white">
                  {activeInspectorPlaque.title} —{' '}
                  {activeInspectorPlaque.highestTierLabel}
                </h3>
              </div>
              <button
                onClick={() => setActiveInspectorPlaque(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <i className="ph-bold ph-x text-sm"></i>
              </button>
            </div>

            <RiaaPlaqueVisual
              title={activeInspectorPlaque.title}
              artistName={artistName}
              releaseSubtype={activeInspectorPlaque.releaseSubtype}
              cover={activeInspectorPlaque.cover}
              tierLabel={activeInspectorPlaque.highestTierLabel}
              shortBadge={activeInspectorPlaque.shortBadge}
              metalClass={activeInspectorPlaque.metalClass}
              certifiedUnits={activeInspectorPlaque.certifiedUnitsAtAudit}
              dateCertified={activeInspectorPlaque.dateCertified}
              serialNumber={activeInspectorPlaque.serialNumber}
              recordLabel={activeInspectorPlaque.recordLabel}
              plaqueConfig={{
                frameStyle: customFrame,
                matboardStyle: customMatboard,
                discLayout: customDiscLayout,
                recipientLine: customRecipient,
                dedicationNote: customDedication
              }}
              size="lg"
            />

            {/* Milestone History Timeline */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Certification Progression History
              </div>
              <div className="space-y-1.5 font-mono text-[11px] tabular-nums">
                {activeInspectorPlaque.historyMilestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-zinc-300"
                  >
                    <span className="font-bold text-amber-300">
                      {m.tierLabel}
                    </span>
                    <span>
                      {m.certifiedDate} ({formatNumFull(m.unitsAtAudit)} u)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Frame & Matboard Re-Customizer */}
            <div className="space-y-2.5 p-3 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Customize Frame, Matboard & Engraving
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {RIAA_FRAME_STYLES.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCustomFrame(f.id)}
                    className={`p-2 rounded-lg border text-left text-[11px] font-bold cursor-pointer ${
                      customFrame === f.id
                        ? 'border-amber-400 bg-amber-400/15 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {RIAA_MATBOARD_STYLES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCustomMatboard(m.id)}
                    className={`p-2 rounded-lg border text-left text-[11px] font-bold cursor-pointer ${
                      customMatboard === m.id
                        ? 'border-amber-400 bg-amber-400/15 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {RIAA_DISC_LAYOUTS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setCustomDiscLayout(d.id)}
                    className={`p-2 rounded-lg border text-center text-[10px] font-bold cursor-pointer ${
                      customDiscLayout === d.id
                        ? 'border-amber-400 bg-amber-400/15 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customRecipient}
                onChange={e => setCustomRecipient(e.target.value)}
                placeholder="Engraved Recipient Line"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#09090D] border border-white/10 text-xs font-bold text-white"
              />
              <input
                type="text"
                value={customDedication}
                onChange={e => setCustomDedication(e.target.value)}
                placeholder="Engraved Dedication Note"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#09090D] border border-white/10 text-xs text-zinc-200"
              />
            </div>

            <button
              type="button"
              onClick={handleSavePlaqueCustomization}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Save Plaque Customization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
