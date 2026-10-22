import React from 'react';
import { ChartItem } from '../../types';
import { resolveChartItemMovement } from '../../data/chartMovementAndReEntryEngine';

interface ChartMovementBadgeProps {
  item: ChartItem;
  currentRank: number;
  chartLimit?: number;
  currentDate?: string | Date;
  variant?: 'spotify' | 'billboard' | 'itunes' | 'youtube';
}

export const ChartMovementBadge: React.FC<ChartMovementBadgeProps> = ({
  item,
  currentRank,
  chartLimit = 50,
  currentDate,
  variant = 'spotify'
}) => {
  const move = resolveChartItemMovement(item, currentRank, chartLimit, currentDate);

  if (variant === 'billboard') {
    if (move.status === 'new') {
      return (
        <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter leading-none">
          NEW
        </span>
      );
    }
    if (move.status === 're-entry') {
      return (
        <span
          className="text-[8px] font-black text-purple-700 bg-purple-100 px-1 py-0.5 rounded-sm uppercase tracking-tighter leading-none whitespace-nowrap"
          title="Re-Entry on Chart"
        >
          RE-ENTRY
        </span>
      );
    }
    if (move.status === 'up') {
      return (
        <span className="text-xs font-black text-emerald-600 flex items-center justify-center leading-none tabular-nums">
          <i className="ph-fill ph-caret-up mr-0.5 text-[11px]"></i>+{move.delta}
        </span>
      );
    }
    if (move.status === 'down') {
      return (
        <span className="text-xs font-black text-red-500 flex items-center justify-center leading-none tabular-nums">
          <i className="ph-fill ph-caret-down mr-0.5 text-[11px]"></i>
          {move.delta}
        </span>
      );
    }
    return (
      <span className="text-xs font-black text-gray-400 leading-none" title="No Movement (=)">
        =
      </span>
    );
  }

  if (variant === 'itunes') {
    if (move.status === 'new') {
      return (
        <span className="text-[9px] font-bold tracking-tight text-[#0a84ff] uppercase">
          NEW
        </span>
      );
    }
    if (move.status === 're-entry') {
      return (
        <span
          className="text-[9px] font-bold tracking-tight text-purple-400 uppercase"
          title="Re-Entry"
        >
          RE
        </span>
      );
    }
    if (move.status === 'up') {
      return (
        <span className="flex items-center text-emerald-400 text-[11px] font-mono font-bold tabular-nums">
          ▲+{move.delta}
        </span>
      );
    }
    if (move.status === 'down') {
      return (
        <span className="flex items-center text-rose-400 text-[11px] font-mono font-bold tabular-nums">
          ▼{move.delta}
        </span>
      );
    }
    return (
      <span className="text-zinc-400 font-mono text-xs font-bold" title="No Movement (=)">
        =
      </span>
    );
  }

  if (variant === 'youtube') {
    if (move.status === 'new') {
      return (
        <span className="text-[8px] font-black text-[#3EA6FF] bg-[#3EA6FF]/15 px-1 py-0.5 rounded uppercase tracking-tight mt-0.5 leading-none">
          NEW
        </span>
      );
    }
    if (move.status === 're-entry') {
      return (
        <span
          className="text-[8px] font-black text-purple-400 bg-purple-500/15 px-1 py-0.5 rounded uppercase tracking-tight mt-0.5 leading-none"
          title="Re-Entry"
        >
          RE
        </span>
      );
    }
    if (move.status === 'up') {
      return (
        <span className="text-[10px] font-bold text-emerald-400 flex items-center mt-0.5 tabular-nums leading-none">
          <i className="ph-fill ph-caret-up mr-0.5 text-[9px]"></i>+{move.delta}
        </span>
      );
    }
    if (move.status === 'down') {
      return (
        <span className="text-[10px] font-bold text-[#FF4E45] flex items-center mt-0.5 tabular-nums leading-none">
          <i className="ph-fill ph-caret-down mr-0.5 text-[9px]"></i>
          {move.delta}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-black text-[#888888] mt-0.5 leading-none" title="No Movement (=)">
        =
      </span>
    );
  }

  // Default: Spotify variant
  if (move.status === 'new') {
    return (
      <span className="text-[8px] font-black bg-[#3D91F4]/20 text-[#3D91F4] px-1 py-0.5 rounded-[2px] uppercase tracking-tighter mt-0.5 leading-none">
        NEW
      </span>
    );
  }
  if (move.status === 're-entry') {
    return (
      <span
        className="text-[8px] font-black bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded-[2px] uppercase tracking-tighter mt-0.5 leading-none"
        title="Re-Entry"
      >
        RE
      </span>
    );
  }
  if (move.status === 'up') {
    return (
      <span className="text-[10px] font-bold text-[#1DB954] flex items-center justify-center mt-0.5 tabular-nums leading-none">
        <i className="ph-fill ph-caret-up text-[9px] mr-0.5"></i>+{move.delta}
      </span>
    );
  }
  if (move.status === 'down') {
    return (
      <span className="text-[10px] font-bold text-red-400 flex items-center justify-center mt-0.5 tabular-nums leading-none">
        <i className="ph-fill ph-caret-down text-[9px] mr-0.5"></i>
        {move.delta}
      </span>
    );
  }
  return (
    <span
      className="text-[11px] font-extrabold text-[#A7A7A7] flex items-center justify-center mt-0.5 leading-none"
      title="No Movement (=)"
    >
      =
    </span>
  );
};
