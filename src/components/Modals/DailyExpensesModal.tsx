import React, { useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatMoney } from '../../constants';
import { calculateDailyExpensesBreakdown } from '../../data/dailyExpensesEngine';

interface DailyExpensesModalProps {
  onClose: () => void;
}

export default function DailyExpensesModal({ onClose }: DailyExpensesModalProps) {
  const { state } = useGameContext();

  const breakdown = useMemo(() => calculateDailyExpensesBreakdown(state), [state]);

  const activeCollabSongs = useMemo(() => {
    return (state.songs || [])
      .filter(s => s.status === 'released' && s.collabId && s.collabId !== 'none' && (s.collabRoyaltyPaidToday || 0) > 0)
      .sort((a, b) => (b.collabRoyaltyPaidToday || 0) - (a.collabRoyaltyPaidToday || 0));
  }, [state.songs]);

  const isPositiveNet = breakdown.netDailyCashflow >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-apple-card border border-apple-border/60 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-4 border-b border-apple-border/50 flex items-center justify-between bg-apple-bg/60">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">
              Financial Ledger · Cashflow Audit
            </p>
            <h2 className="text-lg font-black text-apple-text tracking-tight mt-0.5">
              Daily Expenses & Breakdown
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200/70 dark:bg-white/10 text-apple-text flex items-center justify-center hover:opacity-80 active:scale-95 transition-all cursor-pointer"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Cashflow Summary Banner */}
          <div className="rounded-[24px] bg-[#0F0F13] text-white p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Net Daily Cashflow (Today)
                </p>
                <p
                  className={`text-2xl font-black tracking-tight tabular-nums mt-0.5 ${
                    isPositiveNet ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositiveNet ? `+${formatMoney(breakdown.netDailyCashflow)}` : `-${formatMoney(Math.abs(breakdown.netDailyCashflow))}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Current Balance
                </p>
                <p className="text-base font-black text-white tabular-nums mt-0.5">
                  {formatMoney(state.money)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Daily Revenue (Net)
                </span>
                <span className="text-sm font-black text-emerald-400 tabular-nums">
                  +{formatMoney(state.dailyIncome || 0)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Daily Overhead (Recurring)
                </span>
                <span className="text-sm font-black text-rose-400 tabular-nums">
                  -{formatMoney(breakdown.effectiveRecurringExpense)}
                </span>
              </div>
            </div>

            {state.isHiatus && breakdown.hiatusSavings > 0 && (
              <div className="pt-2.5 border-t border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <i className="ph-fill ph-moon-stars text-indigo-400"></i>
                  Hiatus Mode Discount (-80% Overhead)
                </span>
                <span className="font-black text-emerald-400 tabular-nums">
                  Saved {formatMoney(breakdown.hiatusSavings)}/day
                </span>
              </div>
            )}
          </div>

          {/* Section 1: Recurring Daily Expenses (Deducted directly from wallet every day) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-black text-apple-text tracking-tight">
                  1. Recurring Daily Overhead
                </h3>
                <p className="text-[11px] text-apple-subtext">
                  Fixed daily career & lifestyle costs deducted directly from your balance each day
                </p>
              </div>
              <span className="text-xs font-black text-rose-500 tabular-nums">
                -{formatMoney(breakdown.effectiveRecurringExpense)}/d
              </span>
            </div>

            <div className="bg-apple-bg/60 dark:bg-white/[0.03] rounded-[22px] border border-apple-border/60 divide-y divide-apple-border/40 overflow-hidden">
              {breakdown.recurringItems.map(item => (
                <div key={item.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                      <i className={`ph-bold ${item.icon} text-sm`}></i>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-apple-text">{item.title}</span>
                        {item.detailBadge && (
                          <span className="text-[10px] font-semibold text-apple-subtext">
                            · {item.detailBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-apple-subtext mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-rose-500 tabular-nums">
                      -{formatMoney(item.amount)}
                    </div>
                    {state.isHiatus && item.rawAmount && item.rawAmount > item.amount ? (
                      <div className="text-[10px] text-apple-subtext line-through tabular-nums">
                        {formatMoney(item.rawAmount)}
                      </div>
                    ) : (
                      <div className="text-[10px] text-apple-subtext font-medium">per day</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Operational & Revenue-Split Deductions Today */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-black text-apple-text tracking-tight">
                  2. Operational & Revenue Splits
                </h3>
                <p className="text-[11px] text-apple-subtext">
                  Collaborator royalties, merch warehousing, & tour show costs (auto-deducted from gross revenue)
                </p>
              </div>
              <span className="text-xs font-black text-amber-500 tabular-nums">
                {formatMoney(breakdown.operationalDeductionsToday)}/d
              </span>
            </div>

            <div className="bg-apple-bg/60 dark:bg-white/[0.03] rounded-[22px] border border-apple-border/60 divide-y divide-apple-border/40 overflow-hidden">
              {breakdown.operationalItems.map(item => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <i className={`ph-bold ${item.icon} text-sm`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-apple-text">{item.title}</span>
                          {item.detailBadge && (
                            <span className="text-[10px] font-semibold text-apple-subtext">
                              · {item.detailBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-apple-subtext mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-amber-500 tabular-nums">
                        {item.amount > 0 ? `-${formatMoney(item.amount)}` : '$0'}
                      </div>
                      <div className="text-[10px] text-apple-subtext font-medium">
                        {item.amount > 0 ? 'auto-deducted' : 'inactive'}
                      </div>
                    </div>
                  </div>

                  {/* Per-song Collab Royalty sub-list if active */}
                  {item.id === 'collab_royalty_splits' && activeCollabSongs.length > 0 && (
                    <div className="pl-12 pt-1 space-y-1.5">
                      {activeCollabSongs.slice(0, 6).map(song => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between text-[11px] text-apple-subtext bg-black/[0.03] dark:bg-white/[0.03] px-3 py-1.5 rounded-lg"
                        >
                          <span className="truncate max-w-[210px] font-medium text-apple-text">
                            "{song.title}" <span className="text-apple-subtext">({song.collabRoyaltyPercent || 15}% split)</span>
                          </span>
                          <span className="font-bold text-amber-500 tabular-nums shrink-0">
                            -{formatMoney(song.collabRoyaltyPaidToday || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total Combined Footprint Footer Note */}
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-apple-border/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-apple-text">
                Total Combined Daily Outflow
              </p>
              <p className="text-[11px] text-apple-subtext">
                Recurring Overhead ({formatMoney(breakdown.effectiveRecurringExpense)}) + Operational Splits ({formatMoney(breakdown.operationalDeductionsToday)})
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-rose-500 tabular-nums">
                -{formatMoney(breakdown.totalAllExpensesToday)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-apple-border/50 bg-apple-bg/80">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
          >
            Close Expense Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
