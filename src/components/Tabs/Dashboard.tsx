import { useGameContext } from '../../GameContext';
import { formatMoney, formatNumFull } from '../../constants';
import { useState, useMemo } from 'react';
import SkillSystemModal from '../Modals/SkillSystemModal';
import RivalBeefModal from '../Modals/RivalBeefModal';
import ArtistTrophyRoomModal from '../Modals/ArtistTrophyRoomModal';
import DailyExpensesModal from '../Modals/DailyExpensesModal';
import { getEnsuredSkillState, calculateMasteryRank } from '../../data/skillSystemEngine';
import { getPopularityTierInfo, getHypeStatusInfo } from '../../data/artistGrowthEngine';
import { getDetailedFanDemographics } from '../../data/fansSystemEngine';
import { getHiatusStatusSummary } from '../../data/hiatusSystemEngine';
import { getEnsuredRivalState } from '../../data/rivalBeefSystemEngine';
import { getArtistTrophyRoomSummary } from '../../data/awardsFormulaAndSimulationEngine';
import { calculateDailyExpensesBreakdown } from '../../data/dailyExpensesEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

export default function Dashboard() {
  const { state, setState, nextDay, nextDayLoading } = useGameContext();
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showRivalModal, setShowRivalModal] = useState(false);
  const [showTrophyRoomModal, setShowTrophyRoomModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  const skills = getEnsuredSkillState(state.skills);
  const masteryRank = calculateMasteryRank(skills);

  const popInfo = useMemo(() => getPopularityTierInfo(state.popularity || 0), [state.popularity]);
  const hypeInfo = useMemo(() => getHypeStatusInfo(state.hype || 0, state.popularity || 0), [state.hype, state.popularity]);
  const fanDemographics = useMemo(
    () => getDetailedFanDemographics(state.fans ?? 250, state.popularity || 0, state.hype || 0, skills),
    [state.fans, state.popularity, state.hype, skills]
  );
  const hiatusSummary = useMemo(() => getHiatusStatusSummary(state), [state.isHiatus, (state as any).hiatusDays]);
  const rivalState = useMemo(() => getEnsuredRivalState(state), [state]);
  const trophySummary = useMemo(() => getArtistTrophyRoomSummary(state), [state]);
  const expensesBreakdown = useMemo(() => calculateDailyExpensesBreakdown(state), [state]);

  const activeTrainings = useMemo(() => {
    const list: { name: string; targetLevel: number; daysRemaining: number; totalDays: number }[] = [];
    (['songwriting', 'recording', 'production'] as const).forEach(cat => {
      Object.values(skills[cat] || {}).forEach((s: any) => {
        if (s?.training?.isTraining) {
          list.push({
            name: s.name,
            targetLevel: s.training.targetLevel,
            daysRemaining: s.training.daysRemaining,
            totalDays: s.training.totalDays
          });
        }
      });
    });
    return list;
  }, [skills]);

  return (
    <div className="space-y-4 pb-4 animate-in fade-in">
      {/* Primary Time Control Hero */}
      <div className="rounded-[28px] bg-[#0F0F12] dark:bg-[#161620] text-white shadow-[0_14px_34px_-12px_rgba(0,0,0,0.35)] border border-white/10 overflow-hidden">
        {state.gameMode === 'realtime' ? (
          <div className="p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Live Simulation</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">Real-Time Mode</h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">Streams and royalties process continuously every second</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
              <i className="ph-fill ph-clock text-xl text-white animate-pulse"></i>
            </div>
          </div>
        ) : (
          <button
            onClick={nextDay}
            disabled={nextDayLoading?.isLoading}
            className="w-full p-5 flex items-center justify-between text-left active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-70 disabled:cursor-not-allowed hover:bg-white/[0.02]"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${state.isHiatus ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  {state.isHiatus ? `Hiatus Mode · Day ${hiatusSummary.hiatusDays}` : 'Career Progression'}
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>Advance Time</span>
                {nextDayLoading?.isLoading && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">
                {state.isHiatus
                  ? '2x Studio Training speed · -80% Living Overhead · Popularity Frozen'
                  : 'Simulate next day streams, chart updates & active campaigns'}
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-white text-neutral-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              <i className={`ph-fill ph-fast-forward text-xl ${nextDayLoading?.isLoading ? 'animate-spin' : ''}`}></i>
            </div>
          </button>
        )}

        {/* Integrated Hiatus Status Strip when active */}
        {state.isHiatus && (
          <div className="px-5 py-3 bg-indigo-950/60 border-t border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ph-fill ph-moon-stars text-indigo-400 text-sm"></i>
              <span className="text-[11px] font-semibold text-indigo-200">
                Comeback Hype Stored: <strong className="text-white font-black">+{hiatusSummary.comebackHypeBonus.toFixed(1)}%</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              {hiatusSummary.trainingSpeedMultiplier}x Training · -80% Cost
            </span>
          </div>
        )}
      </div>

      {/* Primary Telemetry Strip: Daily Revenue, Daily Expenses & Streams */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-apple-card rounded-[24px] p-4.5 border border-apple-border/60 shadow-ios flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-apple-subtext uppercase tracking-[0.14em]">Daily Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i className="ph-bold ph-trend-up text-xs"></i>
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
            +{formatMoney(state.dailyIncome)}
          </p>
          <p className="text-[11px] text-apple-subtext font-medium mt-1">
            Royalties & catalog payout
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExpensesModal(true)}
          className="bg-apple-card rounded-[24px] p-4.5 border border-apple-border/60 shadow-ios flex flex-col justify-between text-left hover:bg-neutral-50/70 dark:hover:bg-white/[0.03] active:scale-[0.99] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2 w-full">
            <span className="text-[10px] font-bold text-apple-subtext uppercase tracking-[0.14em]">Daily Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <i className="ph-bold ph-receipt text-xs"></i>
            </div>
          </div>
          <p className="text-xl font-black text-rose-500 tracking-tight tabular-nums">
            -{formatMoney(expensesBreakdown.effectiveRecurringExpense)}
          </p>
          <p className="text-[11px] text-apple-subtext font-medium mt-1 flex items-center justify-between w-full">
            <span>{state.isHiatus ? 'Hiatus -80% active' : 'Tap for full breakdown'}</span>
            <i className="ph-bold ph-caret-right text-[10px] text-apple-subtext"></i>
          </p>
        </button>
      </div>

      {/* Compact Daily Streams & Itemized Expense Breakdown Strip */}
      <div className="bg-apple-card rounded-[24px] border border-apple-border/60 shadow-ios overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-apple-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900/5 dark:bg-white/10 text-neutral-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
              <i className="ph-fill ph-headphones text-sm"></i>
            </div>
            <div>
              <span className="text-[10px] font-bold text-apple-subtext uppercase tracking-[0.14em] block">
                {state.gameMode === 'realtime' ? 'Streams / Sec' : 'Daily Streams'}
              </span>
              <span className="text-base font-black text-apple-text tracking-tight tabular-nums">
                {state.gameMode === 'realtime'
                  ? `+${formatNumFull(state.currentStreamRate || 0)}`
                  : formatNumFull(state.dailyStreamsTotal)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExpensesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 text-apple-text text-[11px] font-bold flex items-center gap-1.5 hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          >
            <i className="ph-bold ph-list-Numbers text-xs ph-list-bullets"></i>
            <span>Expense Breakdown</span>
          </button>
        </div>

        {/* Quick 4-Column Expense Breakdown Preview */}
        <div
          onClick={() => setShowExpensesModal(true)}
          className="grid grid-cols-4 divide-x divide-apple-border/40 bg-neutral-50/50 dark:bg-white/[0.02] cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-white/[0.04] transition-colors"
        >
          <div className="p-3 text-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-apple-subtext truncate">Lifestyle</div>
            <div className="text-xs font-black text-rose-500 tabular-nums mt-0.5">
              -{formatMoney(expensesBreakdown.recurringItems[0]?.amount || 0)}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-apple-subtext truncate">Studio & PR</div>
            <div className="text-xs font-black text-rose-500 tabular-nums mt-0.5">
              -{formatMoney((expensesBreakdown.recurringItems[1]?.amount || 0) + (expensesBreakdown.recurringItems[2]?.amount || 0))}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-apple-subtext truncate">Catalog/Sec</div>
            <div className="text-xs font-black text-rose-500 tabular-nums mt-0.5">
              -{formatMoney((expensesBreakdown.recurringItems[3]?.amount || 0) + (expensesBreakdown.recurringItems[4]?.amount || 0))}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-apple-subtext truncate">Ops & Splits</div>
            <div className="text-xs font-black text-amber-500 tabular-nums mt-0.5">
              {expensesBreakdown.operationalDeductionsToday > 0
                ? `-${formatMoney(expensesBreakdown.operationalDeductionsToday)}`
                : '$0'}
            </div>
          </div>
        </div>
      </div>

      {/* Stature & Viral Momentum Ledger */}
      <div className="bg-apple-card rounded-[28px] border border-apple-border/60 shadow-ios overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-apple-border/40">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-apple-subtext">Artist Stature</p>
            <h3 className="text-base font-black text-apple-text tracking-tight mt-0.5">Popularity & Viral Hype</h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black text-apple-text uppercase tracking-wider bg-neutral-100 dark:bg-white/10 px-3 py-1 rounded-lg border border-apple-border/50">
              {popInfo.tierName}
            </span>
          </div>
        </div>

        <div className="divide-y divide-apple-border/40">
          {/* Popularity Row */}
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-apple-text">Popularity Index</span>
                  {state.popDelta !== undefined && Math.abs(state.popDelta) > 0.001 && (
                    <span className={`text-[11px] font-bold tabular-nums ${
                      state.popDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}>
                      {state.popDelta > 0 ? `+${state.popDelta.toFixed(2)}%` : `${state.popDelta.toFixed(2)}%`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-apple-subtext mt-0.5">{popInfo.perkDescription}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-apple-text tabular-nums leading-none">
                  {(state.popularity || 0).toFixed(1)}%
                </div>
                {popInfo.nextTierAt < 100 && (
                  <div className="text-[10px] text-apple-subtext font-semibold mt-1 tabular-nums">
                    Next tier at {popInfo.nextTierAt}%
                  </div>
                )}
              </div>
            </div>

            <div className="w-full bg-neutral-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-neutral-950 dark:bg-indigo-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, state.popularity || 0)}%` }}
              />
            </div>
          </div>

          {/* Hype & Virality Row */}
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-apple-text">Hype & Virality</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/15 px-2 py-0.5 rounded-md">
                    {hypeInfo.statusLabel}
                  </span>
                  {state.hypeDelta !== undefined && Math.abs(state.hypeDelta) > 0.001 && (
                    <span className={`text-[11px] font-bold tabular-nums ${
                      state.hypeDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}>
                      {state.hypeDelta > 0 ? `+${state.hypeDelta.toFixed(2)}%` : `${state.hypeDelta.toFixed(2)}%`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-apple-subtext mt-0.5">
                  Stream Surge <strong className="text-apple-text font-bold tabular-nums">{hypeInfo.streamMultiplier.toFixed(2)}x</strong>
                  {' · '}Pop Conversion <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{hypeInfo.conversionPotential}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-orange-500 tabular-nums leading-none">
                  {(state.hype || 0).toFixed(1)}%
                </div>
                <div className="text-[10px] text-apple-subtext font-semibold mt-1">
                  {state.isHiatus ? 'Protected on Hiatus' : hypeInfo.decayRateLabel}
                </div>
              </div>
            </div>

            <div className="w-full bg-neutral-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, state.hype || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Fans Ecosystem Card */}
      <div className="bg-apple-card rounded-[28px] border border-apple-border/60 shadow-ios overflow-hidden">
        <div className="p-5 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-apple-subtext">Audience Architecture</p>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 rounded-md">
                {fanDemographics.fanbaseTierName}
              </span>
            </div>
            <h3 className="text-base font-black text-apple-text tracking-tight mt-0.5">Dedicated Fans</h3>
            <p className="text-xs text-apple-subtext mt-0.5">
              Loyalty Index <strong className="text-apple-text font-bold tabular-nums">{fanDemographics.loyaltyScore}%</strong>
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xl font-black text-apple-text tabular-nums leading-none">
                {formatNumFull(fanDemographics.totalFans)}
              </span>
            </div>
            {state.fansDelta !== undefined && state.fansDelta > 0 ? (
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                +{formatNumFull(state.fansDelta)} today
              </div>
            ) : (
              <div className="text-[10px] font-semibold text-apple-subtext mt-1">
                Total Active Listeners
              </div>
            )}
          </div>
        </div>

        {/* Clean 3-Segment Composition Bar */}
        <div className="px-5 pb-4">
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-white/10 gap-0.5">
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{ width: `${fanDemographics.casualPct}%` }}
              title="Casual Listeners"
            />
            <div
              className="bg-indigo-600 h-full transition-all duration-500"
              style={{ width: `${fanDemographics.corePct}%` }}
              title="Core Supporters"
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${fanDemographics.stanPct}%` }}
              title="Superfans / Stans"
            />
          </div>
        </div>

        {/* Hairline 3-Column Cohort Breakdown */}
        <div className="grid grid-cols-3 divide-x divide-apple-border/40 border-t border-apple-border/40">
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-apple-subtext">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Casual · {fanDemographics.casualPct}%</span>
            </div>
            <div className="text-sm font-black text-apple-text tabular-nums mt-1">
              {formatNumFull(fanDemographics.casualListeners)}
            </div>
            <div className="text-[10px] text-apple-subtext font-medium mt-0.5">Playlist & radio</div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-apple-subtext">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Core · {fanDemographics.corePct}%</span>
            </div>
            <div className="text-sm font-black text-apple-text tabular-nums mt-1">
              {formatNumFull(fanDemographics.coreSupporters)}
            </div>
            <div className="text-[10px] text-apple-subtext font-medium mt-0.5">Daily stream base</div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-apple-subtext">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Stans · {fanDemographics.stanPct}%</span>
            </div>
            <div className="text-sm font-black text-apple-text tabular-nums mt-1">
              {formatNumFull(fanDemographics.superfansStans)}
            </div>
            <div className="text-[10px] text-apple-subtext font-medium mt-0.5">First-week buyers</div>
          </div>
        </div>

        {/* Bottom Market Impact Strip */}
        <div className="px-5 py-3 bg-neutral-50/80 dark:bg-white/[0.03] border-t border-apple-border/40 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] font-semibold text-apple-subtext uppercase tracking-wider">Stream Floor</div>
            <div className="text-xs font-black text-apple-text tabular-nums mt-0.5">
              +{formatNumFull(fanDemographics.dailyStreamingFloor)}/d
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-apple-subtext uppercase tracking-wider">Pure Sales</div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {fanDemographics.pureSalesMultiplier.toFixed(2)}x
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-apple-subtext uppercase tracking-wider">Decay Shield</div>
            <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
              +{Math.round((fanDemographics.retentionShield - 1) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Craft Mastery & Studio Academy Card */}
      <div className="bg-apple-card rounded-[28px] border border-apple-border/60 shadow-ios overflow-hidden">
        <div
          onClick={() => setState(p => ({ ...p, activeApp: 'skills' }))}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-white/[0.03] transition-colors group"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-apple-subtext">Craft & Artistry</p>
              <span className="text-[10px] font-bold text-apple-text bg-neutral-100 dark:bg-white/10 px-2 py-0.5 rounded-md tabular-nums">
                {masteryRank.title} · {masteryRank.score}/{masteryRank.maxScore}
              </span>
            </div>
            <h3 className="text-base font-black text-apple-text tracking-tight mt-0.5">
              Mastery Academy
            </h3>
            <p className="text-xs text-apple-subtext mt-0.5">
              Train songwriting, vocal execution & studio engineering
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-neutral-950 dark:bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <i className="ph-bold ph-arrow-up-right text-sm"></i>
          </div>
        </div>

        {/* 3-Discipline Summary Grid */}
        <div className="grid grid-cols-3 divide-x divide-apple-border/40 border-t border-apple-border/40 bg-neutral-50/40 dark:bg-white/[0.02]">
          <div className="p-3.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-apple-subtext">Songwriting</div>
            <div className="text-sm font-black text-apple-text tabular-nums mt-0.5">
              Lv. {masteryRank.averages.songwriting}
            </div>
          </div>
          <div className="p-3.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-apple-subtext">Vocals</div>
            <div className="text-sm font-black text-apple-text tabular-nums mt-0.5">
              Lv. {masteryRank.averages.recording}
            </div>
          </div>
          <div className="p-3.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-apple-subtext">Production</div>
            <div className="text-sm font-black text-apple-text tabular-nums mt-0.5">
              Lv. {masteryRank.averages.production}
            </div>
          </div>
        </div>

        {/* Active Training Queue */}
        {activeTrainings.length > 0 && (
          <div className="p-4 bg-neutral-950 text-white space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Active Studio Training ({activeTrainings.length})</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400">
                {state.isHiatus ? '2x Hiatus Speed Active' : 'Advances daily'}
              </span>
            </div>

            <div className="space-y-2">
              {activeTrainings.map((t, idx) => {
                const daysElapsed = Math.max(0, t.totalDays - t.daysRemaining);
                const progressPct = Math.round((daysElapsed / t.totalDays) * 100);

                return (
                  <div key={idx} className="bg-white/6 rounded-xl p-2.5 border border-white/10 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{t.name} <span className="text-neutral-400">→ Lv. {t.targetLevel}</span></span>
                      <span className="text-[11px] font-bold text-amber-400 tabular-nums">{t.daysRemaining}d left</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(12, progressPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Industry Rival & Chart Beef Command Card */}
      <div className="bg-apple-card rounded-[28px] border border-apple-border/60 shadow-ios overflow-hidden">
        <div
          onClick={() => setShowRivalModal(true)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-white/[0.03] transition-colors group"
        >
          {rivalState.hasActiveRival ? (
            <div className="flex items-center gap-3.5 min-w-0">
              <OfficialArtworkImg
                artist={rivalState.rivalName}
                explicitSrc={rivalState.rivalAvatar}
                isArtistPortrait={true}
                className="w-12 h-12 rounded-full object-cover border-2 border-rose-500 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
                    Arch-Rival · {rivalState.beefStatusLabel}
                  </p>
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 rounded-md tabular-nums">
                    {rivalState.beefHeat}% Heat
                  </span>
                </div>
                <h3 className="text-base font-black text-apple-text tracking-tight mt-0.5 truncate">
                  vs. {rivalState.rivalName}
                </h3>
                <p className="text-xs text-apple-subtext mt-0.5 truncate">
                  {rivalState.activeCounterRelease
                    ? `🚨 Blocking attempt: "${rivalState.activeCounterRelease.title}" (${formatNumFull(rivalState.activeCounterRelease.dailyStreams)}/d)`
                    : rivalState.rivalryOriginReason ||
                      `Head-to-Head Chart War · ${rivalState.playerChartWins}W - ${rivalState.rivalChartWins}L`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-white/10 border border-apple-border/60 text-apple-subtext flex items-center justify-center shrink-0">
                <i className="ph-bold ph-shield-check text-lg"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-apple-subtext">
                    Industry Feud Radar · Peaceful
                  </p>
                </div>
                <h3 className="text-base font-black text-apple-text tracking-tight mt-0.5 truncate">
                  No Active Industry Rival
                </h3>
                <p className="text-xs text-apple-subtext mt-0.5 truncate">
                  Rivalries ignite from chart clashes, same-day release collisions, or public callouts on X.
                </p>
              </div>
            </div>
          )}
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${
              rivalState.hasActiveRival
                ? 'bg-rose-600 text-white'
                : 'bg-neutral-900 dark:bg-white/10 text-white'
            }`}
          >
            <i className={`ph-bold ${rivalState.hasActiveRival ? 'ph-fire' : 'ph-lightning'} text-sm`}></i>
          </div>
        </div>
      </div>

      {/* Artist Profile & Trophy Room Card */}
      <div className="bg-[#0F0F13] text-white rounded-[28px] border border-[#D4AF37]/30 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.28)] overflow-hidden">
        <div
          onClick={() => setShowTrophyRoomModal(true)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <OfficialArtworkImg
              artist={state.artist?.name || 'Artist'}
              explicitSrc={state.artist?.image}
              isArtistPortrait={true}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                Artist Profile · Trophy Room
              </p>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5 truncate">
                {state.artist?.name || 'Artist'} Honors & Accolades
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5 tabular-nums truncate">
                {trophySummary.grammyWins} GRAMMYs ({trophySummary.grammyNominations} Noms) · {trophySummary.vmaWins} MTV VMAs ({trophySummary.vmaNominations} Noms)
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <i className="ph-fill ph-trophy text-base"></i>
          </div>
        </div>
      </div>

      {showSkillModal && (
        <SkillSystemModal onClose={() => setShowSkillModal(false)} />
      )}

      {showRivalModal && (
        <RivalBeefModal onClose={() => setShowRivalModal(false)} />
      )}

      {showTrophyRoomModal && (
        <ArtistTrophyRoomModal onClose={() => setShowTrophyRoomModal(false)} />
      )}

      {showExpensesModal && (
        <DailyExpensesModal onClose={() => setShowExpensesModal(false)} />
      )}
    </div>
  );
}
