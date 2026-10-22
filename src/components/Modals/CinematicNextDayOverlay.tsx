import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatNumFull, formatMoney } from '../../constants';
import { useGameContext } from '../../GameContext';

export interface CinematicNextDayProps {
  isLoading: boolean;
  stepMessage?: string;
  progressPercent?: number;
  currentDate?: string;
  nextDate?: string;
}

export default function CinematicNextDayOverlay({
  isLoading,
  stepMessage = 'Simulating 24h global streams & airplay...',
  progressPercent = 45,
  currentDate,
  nextDate
}: CinematicNextDayProps) {
  const { state } = useGameContext();
  const [displayPct, setDisplayPct] = useState(0);
  const [rollingTick, setRollingTick] = useState(0);

  // Smoothly interpolate percentage counter & live rolling numbers
  useEffect(() => {
    if (!isLoading) {
      setDisplayPct(0);
      setRollingTick(0);
      return;
    }

    const target = Math.min(100, Math.max(8, progressPercent || 30));
    const interval = setInterval(() => {
      setDisplayPct(prev => {
        if (prev >= target) return target;
        const step = Math.max(1, Math.ceil((target - prev) * 0.28));
        return Math.min(target, prev + step);
      });
      setRollingTick(t => t + 1);
    }, 32);

    return () => clearInterval(interval);
  }, [isLoading, progressPercent]);

  const latestRelease = useMemo(() => {
    const released = (state.songs || []).filter(s => s.status === 'released');
    if (released.length > 0) {
      return released[released.length - 1];
    }
    return null;
  }, [state.songs]);

  if (!isLoading) return null;

  const currentFormatted = currentDate ? formatDate(currentDate) : 'TODAY';
  const nextFormatted = nextDate ? formatDate(nextDate) : 'TOMORROW';
  const isMondayChartDay = nextDate ? new Date(nextDate).getDay() === 1 : false;

  const pct = Math.min(100, Math.max(0, displayPct));
  const isStage1Done = pct >= 48;
  const isStage2Active = pct >= 35 && pct < 82;
  const isStage2Done = pct >= 82;
  const isStage3Active = pct >= 75 && pct < 100;
  const isStage3Done = pct >= 99;

  // Simulated live rolling preview metrics based on current daily performance
  const estStreamsBase = Math.max(120, state.dailyStreamsTotal || Math.round((state.popularity || 2) * 1850 + (state.fans || 250) * 3));
  const estIncomeBase = Math.max(15, state.dailyIncome || Math.round(estStreamsBase * 0.0042));
  const liveSimulatedStreams = Math.round(estStreamsBase * (pct / 100) * (0.96 + ((rollingTick % 7) * 0.01)));
  const liveSimulatedRoyalties = Math.round(estIncomeBase * (pct / 100));

  const centerArt = latestRelease?.cover || state.artist?.image || '';

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          id="next-day-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#06070B]/88 backdrop-blur-2xl px-4 overflow-hidden select-none"
        >
          {/* Dynamic Ambient Studio Aura */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.22, 0.38, 0.22]
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 w-96 h-96 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1.1, 0.95, 1.1],
              opacity: [0.18, 0.32, 0.18]
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none"
          />

          {/* Main Studio Console Card */}
          <motion.div
            id="next-day-loading-card"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="w-full max-w-sm bg-gradient-to-b from-[#15171E] via-[#101218] to-[#0B0C10] text-white rounded-[32px] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-white/12 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Top Animated Laser Sweep Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-white/5 overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="w-full h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              />
            </div>

            {/* Header Status Row */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <i className="ph-fill ph-vinyl-record text-amber-400 text-base animate-spin" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-300">
                  Studio Master Clock
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-400 tabular-nums">
                {isMondayChartDay ? 'CHART TRACKING LOCK' : '24H CYCLE'}
              </span>
            </div>

            {/* Interactive Turntable Platter + Tonearm Assembly */}
            <div className="relative w-36 h-36 my-1 flex items-center justify-center">
              {/* Outer Strobe Platter Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/25 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-amber-500/15 via-transparent to-emerald-500/15 blur-md" />

              {/* Spinning Vinyl Record */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                className="w-32 h-32 rounded-full bg-[#070709] shadow-2xl relative flex items-center justify-center border border-white/15 overflow-hidden"
                style={{
                  boxShadow: '0 12px 35px rgba(0,0,0,0.9), inset 0 0 0 2px rgba(255,255,255,0.06)'
                }}
              >
                {/* Micro Vinyl Grooves */}
                <div className="absolute inset-2.5 rounded-full border border-white/[0.06] pointer-events-none" />
                <div className="absolute inset-5 rounded-full border border-white/[0.05] pointer-events-none" />
                <div className="absolute inset-7 rounded-full border border-white/[0.07] pointer-events-none" />
                <div className="absolute inset-9 rounded-full border border-white/[0.05] pointer-events-none" />

                {/* Iridescent Conic Vinyl Sheen */}
                <div
                  className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
                  style={{
                    background:
                      'conic-gradient(from 30deg, transparent 0deg, rgba(251,191,36,0.35) 55deg, rgba(255,255,255,0.45) 90deg, transparent 140deg, rgba(52,211,153,0.3) 235deg, rgba(255,255,255,0.4) 270deg, transparent 320deg)'
                  }}
                />

                {/* Center Record Label (Shows Latest Release Cover or Gold Studio Crest) */}
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 flex items-center justify-center shadow-inner relative z-10 border-2 border-amber-200/50 overflow-hidden">
                  {centerArt ? (
                    <img
                      src={centerArt}
                      alt="Center Label"
                      className="w-full h-full object-cover opacity-90"
                    />
                  ) : (
                    <i className="ph-fill ph-music-notes text-black text-base" />
                  )}
                </div>

                {/* Chrome Spindle Center Pin */}
                <div className="absolute w-3 h-3 rounded-full bg-[#15171E] border-2 border-zinc-300 shadow z-20" />
              </motion.div>

              {/* Articulated Turntable Tonearm */}
              <motion.div
                initial={{ rotate: -18 }}
                animate={{ rotate: 14 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ transformOrigin: '85% 15%' }}
                className="absolute top-1 right-1 w-14 h-24 pointer-events-none z-30"
              >
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-700 border border-zinc-400 shadow-md" />
                <div className="absolute top-3 right-2.5 w-1 h-16 bg-gradient-to-b from-zinc-300 to-zinc-500 rounded-full origin-top rotate-[22deg] shadow" />
                <div className="absolute bottom-3 left-3.5 w-2.5 h-3.5 bg-amber-400 rounded-xs rotate-[22deg] shadow-md" />
              </motion.div>

              {/* Reactive Multi-Bar Equalizer Badge */}
              <div className="absolute -bottom-1.5 px-3 py-1 rounded-full bg-[#0B0C10]/95 border border-white/15 flex items-end gap-1 h-6 z-30 shadow-lg">
                {[0, 1, 2, 3, 4, 5, 6].map(bar => (
                  <motion.span
                    key={bar}
                    animate={{
                      height: ['30%', '95%', '45%', '85%', '35%']
                    }}
                    transition={{
                      duration: 0.65 + (bar % 3) * 0.15,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: bar * 0.07
                    }}
                    className={`w-1 rounded-full ${
                      bar % 2 === 0 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3D Calendar Date Transition Card */}
            <div className="w-full bg-white/[0.04] rounded-2xl p-3 border border-white/10 mt-3 mb-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-left min-w-0">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 block tracking-wider">
                    Completed Day
                  </span>
                  <p className="text-xs font-bold text-zinc-400 truncate mt-0.5">
                    {currentFormatted}
                  </p>
                </div>

                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0"
                >
                  <i className="ph-bold ph-fast-forward text-sm" />
                </motion.div>

                <motion.div
                  key={nextFormatted}
                  initial={{ rotateX: -75, opacity: 0, y: -8 }}
                  animate={{ rotateX: 0, opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
                  className="flex-1 text-right min-w-0"
                >
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">
                    {isMondayChartDay ? 'Chart Day (Mon)' : 'New Day'}
                  </span>
                  <p className="text-xs font-black text-white truncate mt-0.5">
                    {nextFormatted}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Live Rolling Daily Telemetry Preview */}
            <div className="w-full grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 text-left">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <i className="ph-fill ph-headphones text-sky-400" />
                  <span>24h Stream Pulse</span>
                </div>
                <div className="text-sm font-black text-white font-mono tabular-nums mt-0.5">
                  +{formatNumFull(liveSimulatedStreams)}
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 text-left">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <i className="ph-fill ph-Coins text-emerald-400" />
                  <span>Est. Royalties</span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono tabular-nums mt-0.5">
                  +{formatMoney(liveSimulatedRoyalties)}
                </div>
              </div>
            </div>

            {/* 3-Stage Simulation Pipeline */}
            <div className="w-full space-y-1.5 text-left mb-3.5">
              {/* Stage 1 */}
              <div
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all duration-200 ${
                  isStage1Done
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`ph-fill text-sm ${
                      isStage1Done
                        ? 'ph-check-circle text-emerald-400'
                        : 'ph-waveform text-amber-400 animate-pulse'
                    }`}
                  />
                  <span className="font-semibold">Global DSP Streams & Radio</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">
                  {isStage1Done ? 'Synced' : 'Active'}
                </span>
              </div>

              {/* Stage 2 */}
              <div
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all duration-200 ${
                  isStage2Done
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                    : isStage2Active
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`ph-fill text-sm ${
                      isStage2Done
                        ? 'ph-check-circle text-emerald-400'
                        : isStage2Active
                        ? 'ph-chart-line-up text-amber-400 animate-bounce'
                        : 'ph-circle text-zinc-600'
                    }`}
                  />
                  <span className="font-semibold">
                    {isMondayChartDay ? 'Billboard Weekly & Global Charts' : 'Spotify, iTunes & YouTube Charts'}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">
                  {isStage2Done ? 'Ranked' : isStage2Active ? 'Updating' : 'Wait'}
                </span>
              </div>

              {/* Stage 3 */}
              <div
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all duration-200 ${
                  isStage3Done
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                    : isStage3Active
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`ph-fill text-sm ${
                      isStage3Done
                        ? 'ph-check-circle text-emerald-400'
                        : isStage3Active
                        ? 'ph-users-three text-emerald-400 animate-pulse'
                        : 'ph-circle text-zinc-600'
                    }`}
                  />
                  <span className="font-semibold">Fanbase Retention & Royalties</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">
                  {isStage3Done ? 'Settled' : isStage3Active ? 'Applying' : 'Wait'}
                </span>
              </div>
            </div>

            {/* Smooth High-Precision Progress Bar */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold px-0.5">
                <span className="text-zinc-400 truncate max-w-[225px]">{stepMessage}</span>
                <span className="text-amber-400 font-mono tabular-nums">{pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  initial={{ width: '8%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full relative shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-sm" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
