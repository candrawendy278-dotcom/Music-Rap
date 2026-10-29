import React from 'react';
import type { TourCooldownStatus } from '../../data/tourCooldownEngine';

interface TourCooldownBannerProps {
  cooldown: TourCooldownStatus;
  compact?: boolean;
}

export default function TourCooldownBanner({
  cooldown,
  compact = false
}: TourCooldownBannerProps) {
  if (!cooldown.isOnCooldown) {
    return null;
  }

  const approxMonths = (cooldown.daysRemaining / 30).toFixed(1);

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#131626] to-[#0C0F1A] border border-amber-400/40 space-y-2.5 shadow-lg">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <i className="ph-fill ph-hourglass-medium text-amber-300 text-lg" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider">
                POST-TOUR RECOVERY COOLDOWN
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                ~{approxMonths} Months Rest
              </span>
            </div>
            <h3 className="text-xs font-black text-white mt-1 truncate">
              {cooldown.statusHeadline}
            </h3>
          </div>
        </div>

        <div className="text-right font-mono tabular-nums shrink-0">
          <div className="text-sm font-black text-amber-300">
            {cooldown.daysRemaining}d
          </div>
          <div className="text-[9.5px] text-zinc-400">
            of {cooldown.totalCooldownDays}d
          </div>
        </div>
      </div>

      {/* Recovery Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-300">
            Artist &amp; Crew Recovery Progress
          </span>
          <span className="text-emerald-400 font-bold">
            {cooldown.recoveryProgressPct}% Rested
          </span>
        </div>
        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all"
            style={{ width: `${cooldown.recoveryProgressPct}%` }}
          />
        </div>
      </div>

      {!compact && (
        <p className="text-[11px] text-zinc-300 leading-relaxed">
          {cooldown.statusDescription}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/10 font-mono text-[10px] tabular-nums">
        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
          <span className="text-zinc-400 block font-sans text-[9.5px]">
            Completed Era Tour
          </span>
          <strong className="text-white truncate block mt-0.5">
            {cooldown.lastTourTitle || 'Previous World Tour'}
          </strong>
        </div>
        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
          <span className="text-zinc-400 block font-sans text-[9.5px]">
            Cleared for Next Tour
          </span>
          <strong className="text-emerald-400 block mt-0.5">
            {cooldown.cooldownEndDate || 'Pending'}
          </strong>
        </div>
      </div>
    </div>
  );
}
