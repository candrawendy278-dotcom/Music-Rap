import React, { useState } from 'react';
import { Globe, Sparkles, Tv, Radio, Users, CheckCircle2, Clock, Plane } from 'lucide-react';
import { GameState } from '../../types';
import { ImprintSignedArtist, getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';
import { ensureRosterArtistFullFields, buildRosterArtistAvatarSvg } from '../../data/recordLabelCeoEngine';
import {
  ActiveRosterInternationalShow,
  CompletedRosterShowHistoryItem,
  ROSTER_INTERNATIONAL_COUNTRIES,
  ROSTER_SHOW_FORMATS,
  RosterShowFormatId,
  StaffShowAutoStrategy,
  configureRosterStaffShowAutomation,
  getEnsuredRosterCountryExpansionMap,
  getRosterArtistCountryExpansionMultiplier,
  getRosterShowStaffSynergy,
  sendRosterArtistToInternationalShow,
} from '../../data/rosterInternationalShowsEngine';
import { getRosterTrustAndHiatusInfo } from '../../data/rosterTrustHiatusPayrollEngine';

interface RosterShowQuickBannerProps {
  artist: ImprintSignedArtist;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onOpenModal: (artistId: string) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

/**
 * Compact status strip & action button rendered on each Roster Artist card in RecordLabelApp.
 */
export const RosterShowQuickBanner: React.FC<RosterShowQuickBannerProps> = ({
  artist,
  gameState,
  setGameState,
  onOpenModal,
  onNotify,
}) => {
  const activeShow: ActiveRosterInternationalShow | null =
    (artist as any).activeInternationalShow || null;
  const cooldown = Math.max(0, Number((artist as any).showCooldownDaysLeft) || 0);
  const autoStaff = Boolean((artist as any).staffAutoBookShows);
  const synergy = getRosterShowStaffSynergy(gameState, artist);
  const map = getEnsuredRosterCountryExpansionMap(artist);

  // Count how many countries have >= 50% market penetration
  const strongMarketsCount = ROSTER_INTERNATIONAL_COUNTRIES.filter(
    (c) => (map[c.countryCode] || 0) >= 50
  ).length;

  const handleToggleStaffAuto = () => {
    if (!autoStaff && !synergy.hasQualifiedShowStaff) {
      onNotify?.(
        'Hire a Booking Agent, Publicist, Marketing VP, or Manager (on the Artist Team or Label Exec Division) to enable Staff Auto-Booking!',
        'error'
      );
      return;
    }
    const res = configureRosterStaffShowAutomation(gameState, artist.id, !autoStaff);
    setGameState(res.nextState);
    onNotify?.(res.message, 'success');
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <Globe className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 truncate">
            Global Shows &amp; Country Expansion ({strongMarketsCount}/12 Strong Markets)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleStaffAuto}
            className={`rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase transition cursor-pointer ${
              autoStaff
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                : 'border-white/15 bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            {autoStaff ? '✓ Staff Auto-Shows: ON' : 'Staff Auto-Shows: OFF'}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal(artist.id)}
            className="rounded-lg bg-indigo-500 px-2.5 py-1 text-[10px] font-black text-white hover:bg-indigo-400 cursor-pointer flex items-center gap-1"
          >
            <Plane className="h-3 w-3" />
            Send to Show / Expand
          </button>
        </div>
      </div>

      {activeShow ? (
        <div className="flex items-center justify-between rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1.5 text-[10px]">
          <div className="min-w-0 pr-2">
            <span className="font-black text-white">
              {activeShow.flag} {activeShow.countryName}: {activeShow.showTitle}
            </span>
            <span className="text-indigo-200 ml-1.5">
              ({activeShow.formatLabel}
              {activeShow.bookedByStaff ? ' • Booked by Staff' : ''})
            </span>
          </div>
          <span className="shrink-0 font-mono font-black text-amber-300">
            {activeShow.daysRemaining}d left
          </span>
        </div>
      ) : cooldown > 0 ? (
        <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
          <span>Recovering from international show travel...</span>
          <span className="font-mono text-amber-300 font-bold">{cooldown}d cooldown</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[9px]">
          {ROSTER_INTERNATIONAL_COUNTRIES.slice(0, 6).map((c) => {
            const pct = map[c.countryCode] || 10;
            return (
              <span
                key={c.countryCode}
                className="shrink-0 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-zinc-300"
              >
                {c.flag} {c.countryCode}: <strong className="text-indigo-300">{pct}%</strong>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => onOpenModal(artist.id)}
            className="shrink-0 text-[9px] font-bold text-indigo-300 underline pl-1 cursor-pointer"
          >
            +6 more countries
          </button>
        </div>
      )}
    </div>
  );
};

interface RosterInternationalShowsModalProps {
  isOpen: boolean;
  initialArtistId: string | null;
  onClose: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

/**
 * Full interactive modal for dispatching Roster Artists to Shows across 12 countries
 * and configuring Staff Team Auto-Show Management.
 */
export const RosterInternationalShowsModal: React.FC<
  RosterInternationalShowsModalProps
> = ({ isOpen, initialArtistId, onClose, gameState, setGameState, onNotify }) => {
  const labelState = getEnsuredRecordLabelState(gameState);
  const signedRoster = labelState.imprint.signedRoster || [];

  const [selectedArtistId, setSelectedArtistId] = useState<string>(
    initialArtistId || signedRoster[0]?.id || ''
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');

  if (!isOpen || signedRoster.length === 0) return null;

  const rawArtist =
    signedRoster.find((a) => a.id === selectedArtistId) || signedRoster[0];
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const stageName = artist.stageName || artist.name;

  const expansionMap = getEnsuredRosterCountryExpansionMap(artist);
  const synergy = getRosterShowStaffSynergy(gameState, artist);
  const trustAndHiatus = getRosterTrustAndHiatusInfo(artist);
  const activeShow: ActiveRosterInternationalShow | null =
    (artist as any).activeInternationalShow || null;
  const cooldown = Math.max(0, Number((artist as any).showCooldownDaysLeft) || 0);
  const autoStaff = Boolean((artist as any).staffAutoBookShows);
  const autoStrategy: StaffShowAutoStrategy =
    (artist as any).staffShowStrategy || 'weakest_markets';
  const preferredTier: 'auto' | RosterShowFormatId =
    (artist as any).staffPreferredShowTier || 'auto';
  const recentHistory: CompletedRosterShowHistoryItem[] = Array.isArray(
    (artist as any).recentShowHistory
  )
    ? (artist as any).recentShowHistory
    : [];

  const selectedCountry =
    ROSTER_INTERNATIONAL_COUNTRIES.find((c) => c.countryCode === selectedCountryCode) ||
    ROSTER_INTERNATIONAL_COUNTRIES[0];
  const currentCountryPct = expansionMap[selectedCountry.countryCode] || 15;
  const currentCountryMult = getRosterArtistCountryExpansionMultiplier(
    artist,
    selectedCountry.countryCode
  );

  const handleBookShow = (formatId: RosterShowFormatId) => {
    const res = sendRosterArtistToInternationalShow(
      gameState,
      artist.id,
      selectedCountry.countryCode,
      formatId,
      false
    );
    if (!res.success) {
      onNotify?.(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify?.(res.message, 'success');
  };

  const handleUpdateAutomation = (
    targetId: string | 'ALL',
    nextEnabled: boolean,
    nextStrategy?: StaffShowAutoStrategy,
    nextTier?: 'auto' | RosterShowFormatId
  ) => {
    if (nextEnabled && !synergy.hasQualifiedShowStaff) {
      onNotify?.(
        'Hire a Booking Agent, Publicist, Marketing VP, or Manager first so your Staff Team can auto-book shows!',
        'error'
      );
      return;
    }
    const res = configureRosterStaffShowAutomation(
      gameState,
      targetId,
      nextEnabled,
      nextStrategy ?? autoStrategy,
      nextTier ?? preferredTier
    );
    setGameState(res.nextState);
    onNotify?.(res.message, 'success');
  };

  const formatKeys: RosterShowFormatId[] = [
    'radio_press_tour',
    'primetime_tv_show',
    'international_showcase_festival',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-indigo-500/40 bg-[#0D0B14] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-950/60 via-[#151126] to-[#0D0B14] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                Global Promotional Circuit &amp; Staff Booking Desk
              </span>
              <h3 className="text-sm font-black text-white">
                Roster International Shows &amp; Country Market Expansion
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/10 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Roster Artist Switcher */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Select Roster Artist ({signedRoster.length})
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {signedRoster.map((rArt) => {
                const rStage = rArt.stageName || rArt.name;
                const isSelected = rArt.id === artist.id;
                const rShow = (rArt as any).activeInternationalShow;
                return (
                  <button
                    key={rArt.id}
                    type="button"
                    onClick={() => setSelectedArtistId(rArt.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/20 text-white'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <img
                      src={rArt.avatarUrl || buildRosterArtistAvatarSvg(rStage)}
                      alt={rStage}
                      className="h-8 w-8 rounded-lg object-cover border border-white/15"
                    />
                    <div>
                      <div className="text-xs font-black">{rStage}</div>
                      <div className="text-[9px] text-zinc-400">
                        Pop {rArt.popularity}% •{' '}
                        {rShow ? `${rShow.flag} On Show (${rShow.daysRemaining}d)` : 'Ready'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Staff Team Delegation & Auto-Show Management Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-3.5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                    Staff Team Show Management &amp; Buffs
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  {synergy.hasQualifiedShowStaff
                    ? `Active Staff (${synergy.activeStaffNames.join(', ')}): -${synergy.costDiscountPct}% Booking Cost • ${synergy.expansionAndFanMult}x Country Expansion & Fans • -${synergy.fatigueReductionPct}% Show Fatigue.`
                    : 'No Booking Agent, Publicist, Marketing VP, or Manager hired yet. Hire staff in the CEO Studio or Exec Division to unlock Staff Auto-Booking and up to +50% expansion buffs!'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateAutomation(artist.id, !autoStaff)}
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase cursor-pointer ${
                    autoStaff
                      ? 'bg-emerald-500 text-black'
                      : 'border border-white/15 bg-black/50 text-zinc-300 hover:text-white'
                  }`}
                >
                  {autoStaff ? `✓ Auto-Manage ${stageName}: ON` : `Auto-Manage ${stageName}: OFF`}
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAutomation('ALL', true)}
                  className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-black text-emerald-200 hover:bg-emerald-500 hover:text-black cursor-pointer"
                >
                  Auto-Manage All Roster
                </button>
              </div>
            </div>

            {/* Staff Strategy & Format Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div>
                <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">
                  Staff Country Targeting Strategy
                </label>
                <select
                  value={autoStrategy}
                  onChange={(e) =>
                    handleUpdateAutomation(
                      artist.id,
                      true,
                      e.target.value as StaffShowAutoStrategy,
                      preferredTier
                    )
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-[11px] font-bold text-white"
                >
                  <option value="weakest_markets">
                    Expand Weakest Countries First (Global Balanced)
                  </option>
                  <option value="tier1_powerhouses">
                    Tier-1 Major Markets (US, UK, Japan, Germany, France)
                  </option>
                  <option value="asia_pacific">
                    Asia-Pacific &amp; SEA Focus (Japan, Korea, Indonesia, PH, AU)
                  </option>
                  <option value="americas_europe">
                    Americas &amp; Europe Focus (US, UK, Brazil, Mexico, Canada, EU)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">
                  Staff Preferred Show Scale
                </label>
                <select
                  value={preferredTier}
                  onChange={(e) =>
                    handleUpdateAutomation(
                      artist.id,
                      true,
                      autoStrategy,
                      e.target.value as 'auto' | RosterShowFormatId
                    )
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-[11px] font-bold text-white"
                >
                  <option value="auto">Auto-Scale by Label Budget &amp; Popularity</option>
                  <option value="radio_press_tour">
                    National Radio &amp; Viral Press Tour (3 Days • Low Fatigue)
                  </option>
                  <option value="primetime_tv_show">
                    Prime-Time TV Broadcast Show (5 Days • Balanced)
                  </option>
                  <option value="international_showcase_festival">
                    International Headline Showcase &amp; Festival (7 Days • Max Impact)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Active Show or Hiatus Warning */}
          {activeShow && (
            <div className="rounded-2xl border border-indigo-400/50 bg-indigo-500/15 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase text-indigo-300">
                  Currently On International Promotional Tour
                </div>
                <div className="text-xs font-black text-white mt-0.5">
                  {activeShow.flag} {activeShow.countryName} — {activeShow.showTitle}
                </div>
                <div className="text-[10px] text-zinc-300">
                  {activeShow.networkOrVenue} • Expected +{activeShow.expectedExpansionGain}%{' '}
                  {activeShow.countryName} Penetration &amp; +
                  {activeShow.expectedFansGain.toLocaleString()} Fans
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-xs font-black text-amber-300">
                  {activeShow.daysRemaining} / {activeShow.totalDays} Days Left
                </div>
                <div className="text-[9px] text-zinc-400">
                  Payout: +${activeShow.expectedAppearanceFee.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {trustAndHiatus.hiatusStatus !== 'active' && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
              <strong>Note:</strong> {trustAndHiatus.hiatusReason}
            </div>
          )}

          {/* 4. 12-Country Market Penetration Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                Select Target Country to Expand ({stageName}&apos;s Regional Footprint)
              </span>
              <span className="text-[10px] font-mono text-indigo-300">
                Selected: {selectedCountry.flag} {selectedCountry.countryName} ({currentCountryPct}% •{' '}
                {currentCountryMult}x Chart Power)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROSTER_INTERNATIONAL_COUNTRIES.map((c) => {
                const pct = expansionMap[c.countryCode] || 12;
                const mult = getRosterArtistCountryExpansionMultiplier(artist, c.countryCode);
                const isSelected = c.countryCode === selectedCountry.countryCode;
                const isHome = (artist.country || 'US') === c.countryCode;

                return (
                  <button
                    key={c.countryCode}
                    type="button"
                    onClick={() => setSelectedCountryCode(c.countryCode)}
                    className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/20 text-white shadow-md'
                        : 'border-white/10 bg-black/40 text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>
                        {c.flag} {c.countryName}
                      </span>
                      {isHome && (
                        <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] text-amber-300">
                          HOME
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
                      <span className="text-indigo-300 font-bold">{pct}% Reach</span>
                      <span className="text-emerald-300">{mult}x</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Available Shows in Selected Country */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Available Shows in {selectedCountry.flag} {selectedCountry.countryName} (Tier{' '}
              {selectedCountry.tier} Market)
            </h4>

            <div className="space-y-2">
              {formatKeys.map((fId) => {
                const formatDef = ROSTER_SHOW_FORMATS[fId];
                const showDetail = selectedCountry.shows[fId];
                const tierCostMult =
                  selectedCountry.tier === 1 ? 1.2 : selectedCountry.tier === 2 ? 1.0 : 0.85;
                const popScale = Math.max(0.75, (Number(artist.popularity) || 32) / 42);

                const netCost = Math.round(
                  formatDef.baseCost * tierCostMult * (1 - synergy.costDiscountPct / 100)
                );
                const estFee = Math.round(
                  formatDef.baseAppearanceFee *
                    tierCostMult *
                    popScale *
                    synergy.appearanceFeeMult
                );
                const estExpansion = Math.round(
                  formatDef.baseCountryExpansionGain * synergy.expansionAndFanMult
                );
                const estPop = Number(
                  (formatDef.baseGlobalPopGain * synergy.expansionAndFanMult).toFixed(1)
                );
                const estHype = Math.round(
                  formatDef.baseHypeGain * synergy.expansionAndFanMult
                );
                const estFans = Math.round(
                  formatDef.baseFansGain * popScale * synergy.expansionAndFanMult
                );
                const estFatigue = Math.max(
                  2,
                  Math.round(formatDef.baseFatigueCost * (1 - synergy.fatigueReductionPct / 100))
                );

                const canBook =
                  !activeShow &&
                  cooldown === 0 &&
                  trustAndHiatus.hiatusStatus === 'active' &&
                  (gameState.money || 0) >= netCost;

                return (
                  <div
                    key={fId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-300">
                          {formatDef.shortTag}
                        </span>
                        <span className="text-xs font-black text-white">
                          {showDetail.title}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-zinc-400">
                        {showDetail.networkOrVenue} — {showDetail.description}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                        <span className="text-emerald-300 font-bold">
                          +{estExpansion}% {selectedCountry.countryCode} Reach
                        </span>
                        <span className="text-sky-300">+{estFans.toLocaleString()} Fans</span>
                        <span className="text-amber-300">
                          +{estPop}% Pop / +{estHype} Hype
                        </span>
                        <span className="text-rose-300">+{estFatigue}% Fatigue</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                      <div className="text-right font-mono">
                        <div className="text-xs font-black text-white">
                          Cost: ${netCost.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-emerald-400">
                          Broadcast Fee: +${estFee.toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canBook}
                        onClick={() => handleBookShow(fId)}
                        className="rounded-xl bg-indigo-500 px-3.5 py-2 text-[11px] font-black text-white shadow hover:bg-indigo-400 disabled:opacity-40 cursor-pointer"
                      >
                        {activeShow
                          ? 'On Show'
                          : cooldown > 0
                          ? `Cooldown (${cooldown}d)`
                          : trustAndHiatus.hiatusStatus !== 'active'
                          ? 'On Hiatus'
                          : 'Send Roster Artist'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Recent International Show History */}
          {recentHistory.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Recent Completed International Shows ({stageName})
              </span>
              <div className="space-y-1">
                {recentHistory.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[10px]"
                  >
                    <div>
                      <span className="font-bold text-white">
                        {h.flag} {h.countryName}: {h.showTitle}
                      </span>
                      <span className="text-zinc-400 ml-1.5">
                        ({h.date} • {h.bookedByStaff ? 'Staff Auto-Booked' : 'CEO Dispatched'})
                      </span>
                    </div>
                    <span className="font-mono text-emerald-300 font-bold">
                      +{h.expansionGain}% Reach • +{h.fansGained.toLocaleString()} Fans
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
