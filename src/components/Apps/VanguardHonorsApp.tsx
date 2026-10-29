import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Lock,
  Music,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  X
} from 'lucide-react';
import { useGameContext } from '../../GameContext';
import ArtistTrophyRoomModal from '../Modals/ArtistTrophyRoomModal';
import {
  VANGUARD_CALENDAR_CONFIG,
  VANGUARD_CAMPAIGN_TIERS
} from '../../data/vanguardHonorsConfig';
import {
  VanguardCategoryResult,
  VanguardNominee,
  VanguardSeasonRecord,
  getEnsuredVanguardState,
  purchaseVanguardCampaignTier,
  setVanguardPreferredSubmission,
  simulateVanguardSeason
} from '../../data/vanguardHonorsEngine';

/**
 * Custom Haute-Couture SVG Emblem: The Obsidian Vanguard Monolith
 * Faceted obsidian prism with brushed champagne gold edges and an emerald crystal core.
 */
export const VanguardMonolithEmblem: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  className?: string;
}> = ({ size = 'md', glow = true, className = '' }) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${dimensions} ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37]/30 via-emerald-400/25 to-[#F3E5AB]/30 blur-xl animate-pulse pointer-events-none" />
      )}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_20px_rgba(212,175,55,0.35)]"
      >
        <defs>
          <linearGradient id="vmhGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#9A7B1C" />
            <stop offset="100%" stopColor="#F3E5AB" />
          </linearGradient>
          <linearGradient id="vmhObsidianLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2433" />
            <stop offset="100%" stopColor="#07090E" />
          </linearGradient>
          <linearGradient id="vmhObsidianRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F131D" />
            <stop offset="100%" stopColor="#040508" />
          </linearGradient>
          <linearGradient id="vmhEmeraldCore" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer Halo Rings */}
        <circle
          cx="60"
          cy="56"
          r="46"
          stroke="url(#vmhGoldGrad)"
          strokeWidth="1.25"
          strokeDasharray="4 3"
          opacity="0.55"
        />
        <circle
          cx="60"
          cy="56"
          r="39"
          stroke="url(#vmhGoldGrad)"
          strokeWidth="0.75"
          opacity="0.3"
        />

        {/* Pedestal Base */}
        <path
          d="M32 98L40 88H80L88 98H32Z"
          fill="url(#vmhObsidianLeft)"
          stroke="url(#vmhGoldGrad)"
          strokeWidth="1.6"
        />
        <path
          d="M26 105L32 98H88L94 105H26Z"
          fill="url(#vmhGoldGrad)"
        />

        {/* Left Obsidian Monolith Wing */}
        <path
          d="M60 12L35 76L60 88V12Z"
          fill="url(#vmhObsidianLeft)"
          stroke="url(#vmhGoldGrad)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Right Obsidian Monolith Wing */}
        <path
          d="M60 12L85 76L60 88V12Z"
          fill="url(#vmhObsidianRight)"
          stroke="url(#vmhGoldGrad)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Inner V-Crown Gold Inlay */}
        <path
          d="M44 46L60 76L76 46"
          stroke="url(#vmhGoldGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Emerald Crystal Core */}
        <polygon
          points="60,24 68,48 60,68 52,48"
          fill="url(#vmhEmeraldCore)"
          stroke="#FFF2B2"
          strokeWidth="1.2"
        />

        {/* Apex Crown Star */}
        <circle cx="60" cy="12" r="2.5" fill="#FFF2B2" />
      </svg>
    </div>
  );
};

function formatCompactMetric(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatNomineeCredential(nom: VanguardNominee, subjectType: string): string {
  if (subjectType === 'tour') {
    return nom.tourGross > 0
      ? `$${formatCompactMetric(nom.tourGross)} Boxscore`
      : `Critics ${nom.criticScore}`;
  }
  const peakBadge = nom.chartPeak ? `Peak #${nom.chartPeak}` : 'Council Selection';
  const streamBadge =
    nom.streams > 0 ? `${formatCompactMetric(nom.streams)} Streams` : `Critics ${nom.criticScore}`;
  return `${peakBadge} · ${streamBadge}`;
}

/**
 * Live Gala & Nominations Broadcast Modal
 * Strictly enforces Anti-Spoiler rules:
 * - In Nominations mode (`season.phase === 'nominations_announced'`): Only announces the 6 official nominees per category in unranked ballot order (no winner, no composite scores).
 * - In Live Ceremony mode (`season.phase === 'ceremony_completed'`): Every category starts SEALED. Winner and 5-Pillar Council Scores are ONLY shown after the player unseals that category's Obsidian Envelope on stage.
 */
export const VanguardCeremonyLiveModal: React.FC<{
  season: VanguardSeasonRecord;
  onClose: () => void;
}> = ({ season, onClose }) => {
  const isNominationsMode = season.phase === 'nominations_announced';
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [showAuditBreakdown, setShowAuditBreakdown] = useState(false);

  const categories = season.categories || [];
  const currentCat: VanguardCategoryResult | undefined = categories[activeIndex];
  const isRevealed = isNominationsMode
    ? false
    : currentCat
    ? revealedIds.includes(currentCat.categoryId)
    : false;

  const handleRevealEnvelope = () => {
    if (!currentCat || isNominationsMode) return;
    if (!revealedIds.includes(currentCat.categoryId)) {
      setRevealedIds(prev => [...prev, currentCat.categoryId]);
    }
  };

  const handleRevealAll = () => {
    if (isNominationsMode) return;
    setRevealedIds(categories.map(c => c.categoryId));
  };

  const allRevealed = isNominationsMode || revealedIds.length === categories.length;

  if (!currentCat) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-[#04060A]/95 backdrop-blur-2xl flex flex-col overflow-hidden text-white">
      {/* Haute-Couture Obsidian & Brushed Champagne Gold Stage Spotlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-gradient-to-b from-[#D4AF37]/25 via-[#D4AF37]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(212,175,55,0.9) 1px, transparent 0)',
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      {/* Top Broadcast Header */}
      <div className="relative z-10 px-4 sm:px-5 pt-5 pb-4 border-b border-[#D4AF37]/25 bg-gradient-to-r from-[#080B12]/90 via-[#101522]/90 to-[#080B12]/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <VanguardMonolithEmblem size="md" glow />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.22em] bg-gradient-to-r from-[#D4AF37]/25 to-emerald-500/20 text-[#F3E5AB] border border-[#D4AF37]/40">
                {isNominationsMode
                  ? 'Official May 10 Press Slate'
                  : 'June 20 Live Sovereign Gala'}
              </span>
              <span className="text-[10px] font-mono text-white/50">
                {season.editionLabel}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF3B8] via-[#D4AF37] to-emerald-300 mt-0.5">
              {VANGUARD_CALENDAR_CONFIG.showName}
            </h2>
            <p className="text-[10px] text-white/45">
              {VANGUARD_CALENDAR_CONFIG.organization} · 1 Artist Per Category Charter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNominationsMode && !allRevealed && (
            <button
              onClick={handleRevealAll}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-[#D4AF37]/30 text-[10px] font-black uppercase tracking-wider text-[#F3E5AB] transition-all"
            >
              Unseal All ({revealedIds.length}/{categories.length})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Category Progress Ribbon */}
      <div className="relative z-10 px-4 py-2.5 bg-[#070A10]/90 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat, idx) => {
          const catRevealed = !isNominationsMode && revealedIds.includes(cat.categoryId);
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={cat.categoryId}
              onClick={() => setActiveIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isCurrent
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B68D24] text-black border-[#FFF2B2] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : catRevealed
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/[0.03] text-white/45 border-white/[0.07] hover:text-white/75'
              }`}
            >
              <span>{idx + 1}.</span>
              <span>{cat.shortName}</span>
              {catRevealed && (
                <Sparkles size={10} className={isCurrent ? 'text-black' : 'text-emerald-300'} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Broadcast Stage Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-2xl mx-auto w-full">
        {/* Category Stage Pedestal Banner */}
        <div className="relative rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/35 bg-gradient-to-br from-[#121724]/95 via-[#090C14]/95 to-[#06080D]/95 shadow-[0_20px_60px_rgba(0,0,0,0.75)] overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-15 pointer-events-none">
            <VanguardMonolithEmblem size="xl" glow={false} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.22em] bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/35">
              {currentCat.field}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Charter Rule: Max 1 Entry / Artist
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFF2B2] to-[#D4AF37]">
            {currentCat.categoryName}
          </h1>
          <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
            {currentCat.description}
          </p>
        </div>

        {/* Sealed Obsidian Envelope or Revealed Monolith Winner (Live Ceremony Only) */}
        {!isNominationsMode && (
          <div className="rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#141A29] via-[#0B0E17] to-[#07090F] p-6 text-center relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.65)]">
            {!isRevealed ? (
              <div className="py-4 space-y-5">
                <div className="mx-auto flex justify-center">
                  <VanguardMonolithEmblem size="xl" glow />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[9px] font-black uppercase tracking-[0.25em] text-[#F3E5AB]">
                    <Lock size={11} />
                    <span>Vanguard Academy Vault · Sealed Envelope</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white pt-1">
                    And the Obsidian Vanguard Monolith goes to...
                  </h3>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    All 6 official nominees below are presented in unranked ballot order. Unseal the royal envelope to reveal the Academy&apos;s verdict live on stage.
                  </p>
                </div>
                <button
                  onClick={handleRevealEnvelope}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#B38728] hover:brightness-110 text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_35px_rgba(212,175,55,0.45)] transition-all active:scale-95"
                >
                  Unseal Obsidian Envelope
                </button>
              </div>
            ) : (
              <div className="py-2 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-[0.22em]">
                  <Crown size={12} />
                  <span>Official Obsidian Monolith Winner</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-1">
                  <div className="relative">
                    {currentCat.winner.coverArt ? (
                      <img
                        src={currentCat.winner.coverArt}
                        alt={currentCat.winner.workTitle}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-[0_0_35px_rgba(212,175,55,0.45)]"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37]/30 to-emerald-500/20 border-2 border-[#D4AF37] flex items-center justify-center">
                        <VanguardMonolithEmblem size="lg" glow={false} />
                      </div>
                    )}
                    {currentCat.winner.isPlayer && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-black uppercase tracking-wider shadow-lg">
                        YOU WON
                      </span>
                    )}
                  </div>

                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-emerald-300">
                      {currentCat.winner.workTitle}
                    </h3>
                    <p className="text-sm font-bold text-white/85 mt-0.5">
                      {currentCat.winner.artistName}
                    </p>
                    <p className="text-xs text-white/55 mt-1">
                      {currentCat.winner.secondaryLabel} ·{' '}
                      {formatNomineeCredential(currentCat.winner, currentCat.subjectType)}
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.06] border border-[#D4AF37]/35">
                      <span className="text-[10px] uppercase tracking-wider text-white/55">
                        Council Composite Score
                      </span>
                      <span className="text-xs font-mono font-black text-[#F3E5AB]">
                        {currentCat.winner.scoreBreakdown.finalWeightedScore.toFixed(1)} / 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Official 6-Nominee Ballot List (Strict Anti-Spoiler when unsealed) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                {isNominationsMode
                  ? 'Official 6-Nominee Press Slate · Winners Sealed Until June 20'
                  : isRevealed
                  ? 'Verified Council Ballot & Final Audit'
                  : 'Official Sealed Ballot (Unranked Order)'}
              </span>
            </div>
            {!isNominationsMode && isRevealed && (
              <button
                onClick={() => setShowAuditBreakdown(prev => !prev)}
                className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
              >
                {showAuditBreakdown ? 'Hide 5-Pillar Council Audit' : 'Inspect 5-Pillar Council Audit'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentCat.nominees.map((nom: VanguardNominee, idx: number) => {
              const isWinner =
                !isNominationsMode && isRevealed && nom.id === currentCat.winner.id;

              return (
                <div
                  key={nom.id}
                  className={`rounded-2xl p-3.5 border transition-all ${
                    isWinner
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 via-emerald-500/15 to-[#0D121D] border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]'
                      : nom.isPlayer
                      ? 'bg-emerald-500/[0.08] border-emerald-400/40'
                      : 'bg-[#0B0F19]/90 border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border ${
                          isWinner
                            ? 'bg-gradient-to-br from-[#FFF2B2] to-[#D4AF37] text-black border-[#FFF2B2]'
                            : nom.isPlayer
                            ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                            : 'bg-white/[0.04] text-[#D4AF37]/80 border-[#D4AF37]/20'
                        }`}
                      >
                        {isWinner ? <Crown size={14} /> : `0${idx + 1}`}
                      </div>

                      {nom.coverArt ? (
                        <img
                          src={nom.coverArt}
                          alt={nom.workTitle}
                          className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                          <Award size={18} className="text-[#D4AF37]" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-white truncate">
                            {nom.workTitle}
                          </p>
                          {nom.isPlayer && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase">
                              Your Entry
                            </span>
                          )}
                          {isWinner && (
                            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-black text-[9px] font-black uppercase">
                              Monolith Winner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/65 truncate">
                          {nom.artistName} ·{' '}
                          <span className="text-white/45">{nom.secondaryLabel}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-[#F3E5AB]">
                        {formatNomineeCredential(nom, currentCat.subjectType)}
                      </div>
                      {!isNominationsMode && isRevealed ? (
                        <div className="text-[10px] font-mono text-emerald-300 font-bold">
                          Council Score: {nom.scoreBreakdown.finalWeightedScore.toFixed(1)}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white/40">
                          <Lock size={9} className="text-[#D4AF37]/70" />
                          <span>Ballot Sealed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5-Pillar Council Breakdown (Strictly hidden until revealed in Live Ceremony) */}
                  {!isNominationsMode && isRevealed && showAuditBreakdown && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.08] grid grid-cols-5 gap-1.5 text-center">
                      <div className="bg-black/40 rounded-lg p-1.5 border border-white/[0.04]">
                        <div className="text-[8px] uppercase text-white/40">Critics</div>
                        <div className="text-[10px] font-mono font-bold text-[#F3E5AB]">
                          {nom.scoreBreakdown.criticalAcclaim}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-1.5 border border-white/[0.04]">
                        <div className="text-[8px] uppercase text-white/40">Charts</div>
                        <div className="text-[10px] font-mono font-bold text-white/85">
                          {nom.scoreBreakdown.chartImpact}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-1.5 border border-white/[0.04]">
                        <div className="text-[8px] uppercase text-white/40">Streams</div>
                        <div className="text-[10px] font-mono font-bold text-white/85">
                          {nom.scoreBreakdown.commercialVolume}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-1.5 border border-white/[0.04]">
                        <div className="text-[8px] uppercase text-white/40">Touring</div>
                        <div className="text-[10px] font-mono font-bold text-emerald-300">
                          {nom.scoreBreakdown.touringAndVisualImpact}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-1.5 border border-white/[0.04]">
                        <div className="text-[8px] uppercase text-white/40">Hype</div>
                        <div className="text-[10px] font-mono font-bold text-[#D4AF37]">
                          {nom.scoreBreakdown.fanAndCulturalHype}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Broadcast Controls */}
      <div className="relative z-10 px-5 py-4 border-t border-[#D4AF37]/25 bg-[#070A10]/95 flex items-center justify-between">
        <button
          onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
          disabled={activeIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <ChevronLeft size={15} />
          <span>Previous</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
            Category {activeIndex + 1} of {categories.length}
          </span>
        </div>

        {activeIndex < categories.length - 1 ? (
          <button
            onClick={() => setActiveIndex(prev => Math.min(categories.length - 1, prev + 1))}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#B68D24] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all"
          >
            <span>Next Category</span>
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-[#D4AF37] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
          >
            <CheckCircle2 size={15} />
            <span>{isNominationsMode ? 'Close Press Slate' : 'Conclude Sovereign Gala'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default function VanguardHonorsApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<'gala' | 'categories' | 'fyc' | 'vault'>('gala');
  const [selectedDivision, setSelectedDivision] = useState<'all' | 'major' | 'genre'>('all');
  const [selectedArchiveYear, setSelectedArchiveYear] = useState<number | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [liveModalSeason, setLiveModalSeason] = useState<VanguardSeasonRecord | null>(null);
  const [showTrophyRoom, setShowTrophyRoom] = useState(false);
  const [trophyRoomArtist, setTrophyRoomArtist] = useState<string | undefined>(undefined);

  const openArtistTrophyRoom = (artistName?: string) => {
    const primaryArtist = artistName
      ? artistName.split(/\s+(?:&|feat\.|ft\.|with|x|,)\s+/i)[0]?.trim()
      : undefined;
    setTrophyRoomArtist(primaryArtist);
    setShowTrophyRoom(true);
  };

  const vanguardState = useMemo(() => getEnsuredVanguardState(state), [state]);
  const currentDateObj = useMemo(
    () => (state.date ? new Date(state.date) : new Date('2026-01-01T00:00:00.000Z')),
    [state.date]
  );
  const currentYear = currentDateObj.getUTCFullYear();
  const currentMonth = currentDateObj.getUTCMonth() + 1;
  const currentDay = currentDateObj.getUTCDate();

  // Determine the current season record (either active from May 10 / June 20, or live eligibility preview)
  const currentSeason = useMemo(() => {
    const completedThisYear = vanguardState.history.find(h => h.editionYear === currentYear);
    if (completedThisYear) return completedThisYear;
    if (vanguardState.activeSeason && vanguardState.activeSeason.editionYear === currentYear) {
      return vanguardState.activeSeason;
    }
    return simulateVanguardSeason(state, currentYear, 'nominations_announced');
  }, [vanguardState, state, currentYear]);

  // Calculate current phase of the annual calendar
  const seasonPhase = useMemo(() => {
    const completedThisYear = vanguardState.history.find(
      h => h.editionYear === currentYear && h.phase === 'ceremony_completed'
    );
    if (completedThisYear) {
      return {
        code: 'ceremony_completed' as const,
        badge: 'June 20 Gala Completed',
        headline: `${completedThisYear.editionLabel} Concluded`,
        subline: `All 12 Obsidian Vanguard Monoliths for ${currentYear} have been officially awarded and archived in the Vault.`
      };
    }

    const isPastMay10 =
      currentMonth > VANGUARD_CALENDAR_CONFIG.nominationsMonth ||
      (currentMonth === VANGUARD_CALENDAR_CONFIG.nominationsMonth &&
        currentDay >= VANGUARD_CALENDAR_CONFIG.nominationsDay);

    if (
      (vanguardState.activeSeason && vanguardState.activeSeason.editionYear === currentYear) ||
      isPastMay10
    ) {
      return {
        code: 'nominations_announced' as const,
        badge: 'Official Slate Live · Winners Sealed',
        headline: 'Official 6-Nominee Slates Announced — Envelopes Sealed Until June 20',
        subline:
          'Every category enforces the 1-Artist-Per-Category Charter. Final Council scores and winners remain strictly classified until Ceremony Night on June 20.'
      };
    }

    return {
      code: 'eligibility_open' as const,
      badge: 'Eligibility & Council Screening',
      headline: `${currentYear} Vanguard Council Screening Window Open`,
      subline:
        'Select your preferred For Your Consideration (FYC) submissions and launch Council showcases before the May 10 Official Nominations.'
    };
  }, [vanguardState, currentYear, currentMonth, currentDay]);

  const isCurrentSeasonCeremonyCompleted = seasonPhase.code === 'ceremony_completed';

  // Career summary across all completed seasons in history
  const careerSummary = useMemo(() => {
    let totalWins = 0;
    let totalMajorWins = 0;
    let totalNominations = 0;

    vanguardState.history.forEach(season => {
      if (season.phase !== 'ceremony_completed') return;
      const pTally = season.artistTallies.find(t => t.isPlayer);
      if (pTally) {
        totalWins += pTally.wins;
        totalMajorWins += pTally.majorWins;
        totalNominations += pTally.nominations;
      }
    });

    return { totalWins, totalMajorWins, totalNominations };
  }, [vanguardState.history]);

  const releasedSongs = useMemo(
    () => (state.songs || []).filter(s => s.isReleased),
    [state.songs]
  );
  const releasedAlbums = useMemo(
    () => (state.projects || []).filter(p => p.isReleased),
    [state.projects]
  );

  const handleCloseApp = () => {
    setState(prev => ({ ...prev, activeApp: null }));
  };

  const handlePurchaseCampaign = (tierId: string) => {
    const res = purchaseVanguardCampaignTier(state, tierId);
    setFeedbackBanner({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success) {
      setState(prev => ({
        ...prev,
        money: res.updatedMoney,
        hype: res.updatedHype,
        vanguardState: res.updatedVanguardState
      } as any));
    }
  };

  const handleSelectPreferred = (type: 'song' | 'album', itemId: number | null) => {
    const updatedVanguard = setVanguardPreferredSubmission(state, type, itemId);
    setState(prev => ({
      ...prev,
      vanguardState: updatedVanguard
    } as any));
    setFeedbackBanner({
      type: 'info',
      text: `Updated your official ${currentYear} Vanguard Council ${
        type === 'song' ? 'Single' : 'Album/Project'
      } lead submission.`
    });
  };

  const filteredCategories = useMemo(() => {
    const cats = currentSeason.categories || [];
    if (selectedDivision === 'all') return cats;
    if (selectedDivision === 'major') return cats.filter(c => c.isMajor);
    return cats.filter(c => !c.isMajor);
  }, [currentSeason.categories, selectedDivision]);

  const completedHistory = useMemo(
    () => vanguardState.history.filter(h => h.phase === 'ceremony_completed'),
    [vanguardState.history]
  );

  const activeArchiveRecord = useMemo(() => {
    if (completedHistory.length === 0) return null;
    if (selectedArchiveYear) {
      return (
        completedHistory.find(h => h.editionYear === selectedArchiveYear) || completedHistory[0]
      );
    }
    return completedHistory[0];
  }, [completedHistory, selectedArchiveYear]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05070C] text-white overflow-y-auto overflow-x-hidden pb-28">
      {/* Luxury Obsidian, Brushed Champagne Gold & Emerald Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-gradient-to-b from-[#D4AF37]/22 via-[#D4AF37]/6 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-64 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-32 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
      </div>

      {/* Sticky Haute-Couture Header */}
      <div className="sticky top-0 z-30 backdrop-blur-2xl bg-[#05070C]/90 border-b border-[#D4AF37]/25 px-4 pt-4 pb-3 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCloseApp}
              className="w-9 h-9 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-[#D4AF37]/30 flex items-center justify-center text-[#F3E5AB] transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <VanguardMonolithEmblem size="sm" glow={false} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                    Sovereign Music Council
                  </span>
                </div>
                <h1 className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF4B8] via-[#D4AF37] to-emerald-300">
                  {VANGUARD_CALENDAR_CONFIG.showName}
                </h1>
              </div>
            </div>
          </div>

          {/* Interactive Trophy Room Button (Matches GRAMMYs & MTV VMAs) */}
          <button
            onClick={() => openArtistTrophyRoom( undefined )}
            className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#D4AF37]/20 to-emerald-500/15 hover:from-[#D4AF37]/30 hover:to-emerald-500/25 border border-[#D4AF37]/45 flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Trophy size={14} className="text-[#FFF2B2]" />
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#FFF2B2] leading-tight">
                Trophy Room
              </div>
              <div className="text-[9px] font-bold text-emerald-300 leading-tight">
                {careerSummary.totalWins} Wins · {careerSummary.totalNominations} Noms
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mt-3.5 bg-[#0A0E17] p-1 rounded-2xl border border-white/[0.07]">
          {[
            { id: 'gala', label: 'Gala Hub', icon: Crown },
            { id: 'categories', label: 'Ballot (12)', icon: Award },
            { id: 'fyc', label: 'FYC Lobby', icon: Flame },
            { id: 'vault', label: 'Vault', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#B88A22] text-black shadow-[0_4px_20px_rgba(212,175,55,0.35)]'
                    : 'text-white/50 hover:text-white/85'
                }`}
              >
                <Icon size={12} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Container */}
      <div className="relative z-10 px-4 pt-4 space-y-4 max-w-md mx-auto">
        {feedbackBanner && (
          <div
            className={`rounded-2xl p-3 border text-xs font-bold flex items-center justify-between gap-2 ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : feedbackBanner.type === 'error'
                ? 'bg-red-500/15 border-red-400/40 text-red-200'
                : 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#FFF2B2]'
            }`}
          >
            <span>{feedbackBanner.text}</span>
            <button onClick={() => setFeedbackBanner(null)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* TAB 1: SOVEREIGN GALA HUB */}
        {activeTab === 'gala' && (
          <>
            {/* Grand Obsidian Monolith Hero Card */}
            <div className="relative rounded-3xl p-5 border border-[#D4AF37]/40 bg-gradient-to-br from-[#131926] via-[#0B0F18] to-[#06080D] shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
                <VanguardMonolithEmblem size="xl" glow />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/40">
                    <Radio size={10} className="text-emerald-400 animate-pulse" />
                    <span>{seasonPhase.badge}</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-white leading-snug">
                    {seasonPhase.headline}
                  </h2>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {seasonPhase.subline}
                  </p>
                </div>
                <VanguardMonolithEmblem size="lg" glow />
              </div>

              {/* Edition & Charter Metadata */}
              <div className="mt-4 pt-3.5 border-t border-white/[0.08] grid grid-cols-3 gap-2">
                <div className="bg-black/35 rounded-2xl p-2.5 border border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-white/40">Trophy</div>
                  <div className="text-[11px] font-black text-[#F3E5AB] mt-0.5 truncate">
                    Obsidian Monolith
                  </div>
                </div>
                <div className="bg-black/35 rounded-2xl p-2.5 border border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-white/40">
                    Ballot Rule
                  </div>
                  <div className="text-[11px] font-black text-emerald-300 mt-0.5">
                    1 Artist / Cat.
                  </div>
                </div>
                <div className="bg-black/35 rounded-2xl p-2.5 border border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-white/40">FYC Bonus</div>
                  <div className="text-[11px] font-black text-white mt-0.5">
                    +{vanguardState.campaign.totalBonusScore.toFixed(1)} Pts
                  </div>
                </div>
              </div>

              {/* Action Buttons (Strictly Anti-Spoiler before June 20) */}
              <div className="mt-4 flex flex-col gap-2">
                {seasonPhase.code === 'ceremony_completed' ? (
                  <button
                    onClick={() => setLiveModalSeason(currentSeason)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#B68D24] text-black text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(212,175,55,0.35)]"
                  >
                    <Sparkles size={15} />
                    <span>Open {currentYear} Live Gala Envelope Reveal</span>
                  </button>
                ) : seasonPhase.code === 'nominations_announced' ? (
                  <button
                    onClick={() =>
                      setLiveModalSeason({
                        ...currentSeason,
                        phase: 'nominations_announced'
                      })
                    }
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37]/25 to-emerald-500/20 hover:from-[#D4AF37]/35 hover:to-emerald-500/30 border border-[#D4AF37]/50 text-[#FFF2B2] text-xs font-black uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all"
                  >
                    <Award size={15} />
                    <span>View Official 6-Nominee Slate (Winners Sealed)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="w-full py-3 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-[#D4AF37]/35 text-[#F3E5AB] text-xs font-black uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all"
                  >
                    <ShieldCheck size={15} />
                    <span>Inspect Sealed Ballot Contenders</span>
                  </button>
                )}
              </div>
            </div>

            {/* Annual Gala Timeline */}
            <div className="rounded-3xl p-4 bg-[#0A0E17] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#D4AF37]" />
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#F3E5AB]">
                    Annual Sovereign Calendar
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-white/45">
                  {currentMonth}/{currentDay}/{currentYear}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`rounded-2xl p-3 border ${
                    seasonPhase.code === 'eligibility_open'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]'
                      : 'bg-black/30 border-white/[0.06]'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#D4AF37]">
                    Jan 1 – May 9
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    Screening
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">
                    Submit FYC priorities & build tour boxscores.
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-3 border ${
                    seasonPhase.code === 'nominations_announced'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]'
                      : 'bg-black/30 border-white/[0.06]'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                    May 10
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    Official Slate
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">
                    6 nominees locked. Max 1 entry per artist.
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-3 border ${
                    seasonPhase.code === 'ceremony_completed'
                      ? 'bg-emerald-500/15 border-emerald-400'
                      : 'bg-black/30 border-white/[0.06]'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#FFF2B2]">
                    June 20
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    Live Gala Night
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">
                    Envelopes unsealed live on stage.
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Pillar Voting Formula & Strict 1-Artist Rule Card */}
            <div className="rounded-3xl p-4 bg-gradient-to-br from-[#0E1320] to-[#080B12] border border-[#D4AF37]/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">
                    Vanguard Charter & 5 Pillars
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[9px] font-black uppercase text-emerald-300">
                  1 Entry / Artist
                </span>
              </div>

              <p className="text-xs text-white/65 leading-relaxed">
                Under the official Vanguard Academy Charter,{' '}
                <span className="text-[#FFF2B2] font-bold">
                  an artist (whether lead or featured) can only hold 1 entry per category
                </span>
                , ensuring a competitive 6-artist slate. All winner envelopes remain sealed until the June 20 Live Gala.
              </p>

              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[
                  { label: 'Critics & Craft', weight: '30%', color: 'text-[#F3E5AB]' },
                  { label: 'Chart Peaks', weight: '25%', color: 'text-white' },
                  { label: 'Streams & Sales', weight: '20%', color: 'text-white' },
                  { label: 'Touring Power', weight: '15%', color: 'text-emerald-300' },
                  { label: 'Cultural Hype', weight: '10%', color: 'text-[#D4AF37]' }
                ].map(p => (
                  <div
                    key={p.label}
                    className="rounded-xl bg-black/40 border border-white/[0.06] p-2 text-center"
                  >
                    <div className={`text-xs font-black ${p.color}`}>{p.weight}</div>
                    <div className="text-[9px] text-white/50 mt-0.5 leading-tight">{p.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: CATEGORIES & SEALED BALLOT */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {/* Anti-Spoiler Security Header */}
            <div className="rounded-3xl p-4 bg-gradient-to-r from-[#121726] via-[#0B0F19] to-[#121726] border border-[#D4AF37]/35 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-[#D4AF37]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F3E5AB]">
                    {isCurrentSeasonCeremonyCompleted
                      ? `${currentYear} Official Gala Results`
                      : `${currentYear} Official Sealed Ballot · Zero Spoilers`}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {isCurrentSeasonCeremonyCompleted
                    ? 'The June 20 Gala has concluded. Official Monolith winners and Council scores are unlocked below.'
                    : 'All 6 contenders per category are listed in unranked ballot order (01–06). Final Council scores and winners remain strictly sealed until the June 20 Live Gala.'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All (12)' },
                  { id: 'major', label: 'Supreme (6)' },
                  { id: 'genre', label: 'Genre & Craft (6)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedDivision(f.id as typeof selectedDivision)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                      selectedDivision === f.id
                        ? 'bg-[#D4AF37] text-black border-[#FFF2B2]'
                        : 'bg-white/[0.04] text-white/55 border-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
              {filteredCategories.map(cat => (
                <div
                  key={cat.categoryId}
                  className="rounded-3xl p-4 bg-[#0A0E17] border border-[#D4AF37]/25 space-y-3 shadow-[0_12px_35px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30">
                          {cat.isMajor ? 'Supreme Monolith' : 'Genre & Sonic Craft'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300 font-bold">
                          1 Artist / Category
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white mt-1">
                        {cat.categoryName}
                      </h3>
                      <p className="text-[11px] text-white/50 mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  {/* 6 Nominees in Official Unspoiled Ballot Order */}
                  <div className="space-y-2">
                    {cat.nominees.map((nom, idx) => {
                      const isRevealedWinner =
                        isCurrentSeasonCeremonyCompleted && nom.id === cat.winner.id;

                      return (
                        <div
                          key={nom.id}
                          className={`rounded-2xl p-2.5 border flex items-center justify-between gap-3 ${
                            isRevealedWinner
                              ? 'bg-gradient-to-r from-[#D4AF37]/20 to-emerald-500/10 border-[#D4AF37]'
                              : nom.isPlayer
                              ? 'bg-emerald-500/[0.08] border-emerald-400/40'
                              : 'bg-black/35 border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 border ${
                                isRevealedWinner
                                  ? 'bg-[#D4AF37] text-black border-[#FFF2B2]'
                                  : nom.isPlayer
                                  ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                                  : 'bg-white/[0.04] text-[#D4AF37]/75 border-[#D4AF37]/20'
                              }`}
                            >
                              {isRevealedWinner ? <Crown size={12} /> : `0${idx + 1}`}
                            </span>

                            {nom.coverArt ? (
                              <img
                                src={nom.coverArt}
                                alt={nom.workTitle}
                                className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                                <Music size={14} className="text-[#D4AF37]" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-white truncate">
                                  {nom.workTitle}
                                </span>
                                {nom.isPlayer && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[8px] font-black uppercase">
                                    YOU
                                  </span>
                                )}
                                {isRevealedWinner && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#D4AF37] text-black text-[8px] font-black uppercase">
                                    WINNER
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => openArtistTrophyRoom(nom.artistName)}
                                className="text-[11px] text-white/60 hover:text-[#FFF2B2] truncate block text-left underline decoration-white/20 hover:decoration-[#D4AF37] transition-colors cursor-pointer"
                              >
                                {nom.artistName} · {nom.secondaryLabel}
                              </button>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-bold text-[#F3E5AB]">
                              {formatNomineeCredential(nom, cat.subjectType)}
                            </div>
                            {isCurrentSeasonCeremonyCompleted ? (
                              <div className="text-[9px] font-mono text-emerald-300 font-bold">
                                Score: {nom.scoreBreakdown.finalWeightedScore.toFixed(1)}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[9px] font-mono text-white/40">
                                <Lock size={9} className="text-[#D4AF37]/70" />
                                <span>Sealed · Jun 20</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FOR YOUR CONSIDERATION (FYC) LOBBY */}
        {activeTab === 'fyc' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-5 bg-gradient-to-br from-[#141A29] via-[#0B0F18] to-[#07090E] border border-[#D4AF37]/35 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[9px] font-black uppercase tracking-[0.2em] text-[#F3E5AB]">
                <Sparkles size={11} />
                <span>Sovereign Academy Relations</span>
              </div>
              <h2 className="text-lg font-black text-white">
                For Your Consideration (FYC) & Priority Submissions
              </h2>
              <p className="text-xs text-white/60 leading-relaxed">
                Because each artist is limited to 1 entry per category, you can designate your priority Single and Album for the {currentYear} Vanguard Council and fund luxury FYC showcases.
              </p>
            </div>

            {/* Preferred Single & Album Selector */}
            <div className="rounded-3xl p-4 bg-[#0A0E17] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#F3E5AB]">
                Priority Council Entry Selection
              </h3>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/55">
                  Lead Single Submission (1 Entry Per Category Rule)
                </label>
                <select
                  value={vanguardState.campaign.preferredSongId ?? ''}
                  onChange={e =>
                    handleSelectPreferred(
                      'song',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full rounded-xl bg-black/50 border border-[#D4AF37]/30 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Auto-Select Highest Scoring Single</option>
                  {releasedSongs.map(song => (
                    <option key={song.id} value={song.id}>
                      {song.title} ({song.genre || 'Pop'} · {formatCompactMetric(Number(song.streams) || 0)} streams)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/55">
                  Lead Album / EP Submission
                </label>
                <select
                  value={vanguardState.campaign.preferredAlbumId ?? ''}
                  onChange={e =>
                    handleSelectPreferred(
                      'album',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full rounded-xl bg-black/50 border border-[#D4AF37]/30 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Auto-Select Highest Scoring Album / EP</option>
                  {releasedAlbums.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title} ({proj.type?.toUpperCase() || 'ALBUM'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FYC Campaign Showcases */}
            <div className="space-y-3">
              {VANGUARD_CAMPAIGN_TIERS.map(tier => {
                const isPurchased = vanguardState.campaign.purchasedCampaignIds.includes(tier.id);
                return (
                  <div
                    key={tier.id}
                    className={`rounded-3xl p-4 border transition-all ${
                      isPurchased
                        ? 'bg-gradient-to-r from-emerald-500/15 via-[#D4AF37]/10 to-[#0B0F18] border-emerald-400/50'
                        : 'bg-[#0A0E17] border-[#D4AF37]/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30">
                            +{tier.scoreBonus} Council Pts
                          </span>
                          <span className="text-[10px] font-mono font-black text-emerald-300">
                            +{tier.hypeGain} Cultural Hype
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-white pt-0.5">{tier.name}</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {tier.subtitle}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-black text-[#FFF2B2]">
                          ${tier.cost.toLocaleString()}
                        </div>
                        <button
                          onClick={() => handlePurchaseCampaign(tier.id)}
                          disabled={isPurchased}
                          className={`mt-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            isPurchased
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                              : 'bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#B68D24] text-black hover:brightness-110 shadow-[0_6px_20px_rgba(212,175,55,0.3)]'
                          }`}
                        >
                          {isPurchased ? 'Active' : 'Commission'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MONOLITH VAULT (HISTORICAL ARCHIVE) */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            {/* Career Trophy Cabinet Summary */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-[#131826] via-[#0B0F18] to-[#06080D] border border-[#D4AF37]/35 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                  Personal Trophy Vault
                </span>
                <h2 className="text-xl font-black text-white">
                  {careerSummary.totalWins} Obsidian Monoliths Won
                </h2>
                <p className="text-xs text-white/55">
                  {careerSummary.totalMajorWins} Supreme Monoliths ·{' '}
                  {careerSummary.totalNominations} Career Nominations
                </p>
                <button
                  onClick={() => openArtistTrophyRoom(undefined)}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#B68D24] text-black text-[10px] font-black uppercase tracking-wider shadow-md cursor-pointer"
                >
                  <Trophy size={12} />
                  <span>Open Artist Trophy Room Profile</span>
                </button>
              </div>
              <VanguardMonolithEmblem size="lg" glow />
            </div>

            {completedHistory.length === 0 ? (
              <div className="rounded-3xl p-8 bg-[#0A0E17] border border-white/[0.08] text-center space-y-3">
                <div className="mx-auto flex justify-center">
                  <VanguardMonolithEmblem size="lg" glow={false} />
                </div>
                <h3 className="text-sm font-black text-white">
                  No Completed Galas in the Vault Yet
                </h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  Advance the calendar to June 20 to experience the Live Sovereign Gala and archive every Obsidian Monolith winner.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {completedHistory.map(rec => (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedArchiveYear(rec.editionYear)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border whitespace-nowrap transition-all ${
                        activeArchiveRecord?.editionYear === rec.editionYear
                          ? 'bg-[#D4AF37] text-black border-[#FFF2B2]'
                          : 'bg-[#0A0E17] text-white/60 border-white/10'
                      }`}
                    >
                      {rec.editionYear} Gala
                    </button>
                  ))}
                </div>

                {activeArchiveRecord && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-4 bg-[#0A0E17] border border-[#D4AF37]/30 flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-[#FFF2B2]">
                          {activeArchiveRecord.editionLabel}
                        </h3>
                        <p className="text-[11px] text-white/55">
                          Ceremony Night: {activeArchiveRecord.ceremonyDate}
                        </p>
                      </div>
                      <button
                        onClick={() => setLiveModalSeason(activeArchiveRecord)}
                        className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[10px] font-black uppercase tracking-wider text-[#FFF2B2]"
                      >
                        Replay Stage Gala
                      </button>
                    </div>

                    {activeArchiveRecord.categories.map(cat => (
                      <div
                        key={cat.categoryId}
                        className="rounded-2xl p-3.5 bg-[#0A0E17] border border-white/[0.08] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[9px] font-black uppercase tracking-wider text-[#D4AF37]">
                            {cat.categoryName}
                          </div>
                          <div className="text-sm font-black text-white truncate mt-0.5">
                            {cat.winner.workTitle}{' '}
                            {cat.winner.isPlayer && (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-400 text-black text-[8px] font-black uppercase">
                                YOU WON
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/60 truncate">
                            {cat.winner.artistName} ·{' '}
                            {formatNomineeCredential(cat.winner, cat.subjectType)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-black text-emerald-300">
                            {cat.winner.scoreBreakdown.finalWeightedScore.toFixed(1)} pts
                          </div>
                          <div className="text-[10px] text-white/40">Monolith Winner</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Live Ceremony / Press Slate Modal */}
      {liveModalSeason && (
        <VanguardCeremonyLiveModal
          season={liveModalSeason}
          onClose={() => setLiveModalSeason(null)}
        />
      )}

      {/* Official Artist Profile & Trophy Room Modal */}
      {showTrophyRoom && (
        <ArtistTrophyRoomModal
          initialArtistName={trophyRoomArtist}
          initialShow="vanguard"
          onClose={() => setShowTrophyRoom(false)}
        />
      )}
    </div>
  );
}
