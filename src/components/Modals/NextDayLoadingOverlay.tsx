import React from 'react';
import { formatDate } from '../../constants';

export interface NextDayLoadingProps {
  isLoading: boolean;
  stepMessage?: string;
  progressPercent?: number;
  currentDate?: string;
  nextDate?: string;
}

export default function NextDayLoadingOverlay({
  isLoading,
  stepMessage = 'Processing streams & chart positions...',
  progressPercent = 45,
  currentDate,
  nextDate
}: NextDayLoadingProps) {
  if (!isLoading) return null;

  const currentFormatted = currentDate ? formatDate(currentDate) : 'Today';
  const nextFormatted = nextDate ? formatDate(nextDate) : 'Tomorrow';

  // Compute stage statuses for the 3 visual milestones
  const pct = Math.min(100, Math.max(0, progressPercent));
  const isStage1Done = pct >= 50;
  const isStage2Active = pct >= 40 && pct < 85;
  const isStage2Done = pct >= 85;
  const isStage3Active = pct >= 80 && pct < 100;
  const isStage3Done = pct >= 100;

  return (
    <div 
      id="next-day-loading-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl px-5 transition-opacity duration-300"
      style={{ animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Ambient background bloom */}
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -top-10"></div>
      <div className="absolute w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -bottom-10"></div>

      <div 
        id="next-day-loading-card"
        className="w-full max-w-sm bg-[#121316]/95 text-white rounded-[32px] p-6 shadow-2xl border border-white/10 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-2xl"
      >
        {/* Subtle top sheen accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"></div>

        {/* Top Header Tag */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            Advancing Day
          </span>
        </div>

        {/* Realistic Animated Vinyl Disc with Spindle & Reflection */}
        <div className="relative w-28 h-28 my-1 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-md animate-pulse"></div>

          {/* Vinyl Disc Body */}
          <div 
            className="w-28 h-28 rounded-full bg-[#0a0a0c] shadow-2xl relative flex items-center justify-center border border-white/15 overflow-hidden animate-[spin_4s_linear_infinite]"
            style={{
              boxShadow: '0 8px 30px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.05)'
            }}
          >
            {/* Vinyl Concentric Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>
            <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
            <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none"></div>
            <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none"></div>

            {/* Specular Vinyl Reflection Conic Angle */}
            <div 
              className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
              style={{
                background: 'conic-gradient(from 45deg, transparent, rgba(255,255,255,0.3) 25%, transparent 50%, rgba(255,255,255,0.3) 75%, transparent)'
              }}
            ></div>

            {/* Center Label */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex flex-col items-center justify-center shadow-md relative z-10 border border-amber-300/40">
              <i className="ph-fill ph-vinyl-record text-black text-sm"></i>
              <span className="text-[6px] font-black text-black tracking-tighter leading-none mt-0.5">STUDIO</span>
            </div>

            {/* Center Spindle Hole */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-[#121316] border border-white/30 z-20"></div>
          </div>

          {/* Mini Soundwave Equalizer overlay on right corner */}
          <div className="absolute -bottom-1 -right-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center space-x-0.5 z-20 shadow-lg">
            <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
            <span className="w-0.5 h-4 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]"></span>
            <span className="w-0.5 h-2.5 bg-yellow-300 rounded-full animate-bounce [animation-delay:300ms]"></span>
            <span className="w-0.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:200ms]"></span>
          </div>
        </div>

        {/* Calendar Flip Date Transition Display */}
        <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/5 my-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-wider">Current</span>
              <p className="text-xs font-bold text-gray-300 truncate">{currentFormatted}</p>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-400 shrink-0 mx-2 shadow-inner">
              <i className="ph-bold ph-arrow-right text-sm animate-pulse"></i>
            </div>

            <div className="flex-1 text-right">
              <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider flex items-center justify-end space-x-1">
                <span>New Day</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
              </span>
              <p className="text-xs font-black text-white truncate">{nextFormatted}</p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Simulation Checklist */}
        <div className="w-full space-y-2 text-left mb-4">
          {/* Milestone 1: Streams */}
          <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl transition-colors ${isStage1Done ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-gray-300'}`}>
            <div className="flex items-center space-x-2">
              <i className={`ph-fill ${isStage1Done ? 'ph-check-circle text-emerald-400' : 'ph-music-notes text-amber-400 animate-pulse'}`}></i>
              <span className="font-medium">Streams & Airplay</span>
            </div>
            <span className="text-[10px] font-bold opacity-80">
              {isStage1Done ? 'Complete' : 'Simulating...'}
            </span>
          </div>

          {/* Milestone 2: Charts */}
          <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl transition-colors ${isStage2Done ? 'bg-emerald-500/10 text-emerald-300' : isStage2Active ? 'bg-amber-500/10 text-amber-300' : 'bg-white/5 text-gray-500'}`}>
            <div className="flex items-center space-x-2">
              <i className={`ph-fill ${isStage2Done ? 'ph-check-circle text-emerald-400' : isStage2Active ? 'ph-trend-up text-amber-400 animate-bounce' : 'ph-circle text-gray-600'}`}></i>
              <span className="font-medium">Charts & Rankings</span>
            </div>
            <span className="text-[10px] font-bold opacity-80">
              {isStage2Done ? 'Updated' : isStage2Active ? 'Computing...' : 'Queued'}
            </span>
          </div>

          {/* Milestone 3: Earnings */}
          <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl transition-colors ${isStage3Done ? 'bg-emerald-500/10 text-emerald-300' : isStage3Active ? 'bg-amber-500/10 text-amber-300' : 'bg-white/5 text-gray-500'}`}>
            <div className="flex items-center space-x-2">
              <i className={`ph-fill ${isStage3Done ? 'ph-check-circle text-emerald-400' : isStage3Active ? 'ph-currency-circle-dollar text-emerald-400 animate-spin' : 'ph-circle text-gray-600'}`}></i>
              <span className="font-medium">Financial Balance</span>
            </div>
            <span className="text-[10px] font-bold opacity-80">
              {isStage3Done ? 'Settled' : isStage3Active ? 'Collecting...' : 'Queued'}
            </span>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold px-0.5">
            <span className="text-gray-400 truncate max-w-[200px]">{stepMessage}</span>
            <span className="text-amber-400 font-mono">{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 ease-out shadow-sm shadow-amber-400/50 relative"
              style={{ width: `${pct}%` }}
            >
              {/* Highlight pip at the tip */}
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
