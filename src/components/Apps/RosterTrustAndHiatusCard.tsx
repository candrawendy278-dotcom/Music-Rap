import React from 'react';
import { GameState } from '../../types';
import { ImprintSignedArtist } from '../../data/recordLabelSystemEngine';
import {
  MIN_RECORD_LABEL_CAPITAL_INVESTMENT,
  approveRosterArtistHiatus,
  calculateLabelAndRosterStaffPayrollSummary,
  evaluateRecordLabelFoundingEligibility,
  forceRosterArtistComebackOverHiatus,
  getRosterTrustAndHiatusInfo,
  grantRosterArtistTrustBonus,
} from '../../data/rosterTrustHiatusPayrollEngine';

interface RecordLabelPrerequisitesChecklistCardProps {
  gameState: GameState;
  selectedCapitalInvestment: number;
  onChangeCapitalInvestment: (amount: number) => void;
}

/**
 * Displays the Executive Prerequisites & $100,000,000 Minimum Capital Investment
 * required to unlock and incorporate a Record Label Imprint.
 */
export const RecordLabelPrerequisitesChecklistCard: React.FC<
  RecordLabelPrerequisitesChecklistCardProps
> = ({ gameState, selectedCapitalInvestment, onChangeCapitalInvestment }) => {
  const eligibility = evaluateRecordLabelFoundingEligibility(
    gameState,
    selectedCapitalInvestment
  );

  const investmentTiers = [
    {
      amount: 100_000_000,
      label: '$100M Standard Imprint Capital',
      tag: 'Minimum Required • $200M Initial Valuation',
    },
    {
      amount: 150_000_000,
      label: '$150M Global JV Capital',
      tag: '+15 Prestige • $300M Initial Valuation',
    },
    {
      amount: 250_000_000,
      label: '$250M Empire Conglomerate Capital',
      tag: '+30 Prestige • $500M Initial Valuation',
    },
  ];

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-black/50 p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            Executive Incorporation Requirements
          </span>
          <h4 className="text-xs font-black text-white mt-0.5">
            Minimum $100,000,000 Capital &amp; Career Standing
          </h4>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
            eligibility.allRequirementsMet
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {eligibility.allRequirementsMet ? '✓ Eligible to Launch' : 'Locked • Milestones Needed'}
        </span>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {eligibility.requirements.map((req) => (
          <div
            key={req.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
              req.met
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                : 'border-white/10 bg-white/[0.03] text-zinc-300'
            }`}
          >
            <div className="min-w-0 pr-2">
              <div className="font-bold text-[11px] flex items-center gap-1.5">
                <span className={req.met ? 'text-emerald-400' : 'text-rose-400'}>
                  {req.met ? '✓' : '✕'}
                </span>
                <span className="truncate">{req.label}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Target: <span className="text-zinc-200 font-semibold">{req.targetText}</span>
              </div>
            </div>
            <div className="text-right font-mono text-[10px] font-black shrink-0">
              <span className={req.met ? 'text-emerald-300' : 'text-amber-300'}>
                {req.currentText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Capital Investment Selector (Minimum $100,000,000) */}
      <div className="space-y-1.5 pt-1 border-t border-white/10">
        <label className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
          Capital Investment into Record Label (Min $100,000,000)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {investmentTiers.map((t) => {
            const active =
              Math.max(MIN_RECORD_LABEL_CAPITAL_INVESTMENT, selectedCapitalInvestment) ===
              t.amount;
            return (
              <button
                key={t.amount}
                type="button"
                onClick={() => onChangeCapitalInvestment(t.amount)}
                className={`rounded-xl border p-2 text-left transition cursor-pointer ${
                  active
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-black text-amber-200">{t.label}</div>
                <div className="text-[9px] text-zinc-300 mt-0.5">{t.tag}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface LabelStaffPayrollSummaryBannerProps {
  gameState: GameState;
}

/**
 * Displays recurring Staff Salary Payroll across the Label Executive Division and Roster Artist Teams.
 */
export const LabelStaffPayrollSummaryBanner: React.FC<
  LabelStaffPayrollSummaryBannerProps
> = ({ gameState }) => {
  const payroll = calculateLabelAndRosterStaffPayrollSummary(gameState);

  if (payroll.totalStaffCount === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/35 px-3.5 py-2.5 flex items-center justify-between text-xs text-zinc-400">
        <span>Staff Payroll System (Exec Division &amp; Roster Teams)</span>
        <span className="font-mono text-[11px] text-zinc-300">$0 / month (0 Hired)</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/15 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-300">
            Recurring Staff Salary Payroll ({payroll.totalStaffCount} Active Staff)
          </span>
          <div className="text-[11px] text-zinc-300 mt-0.5">
            Exec Division: {payroll.execStaffCount} • Roster Artist Teams:{' '}
            {payroll.rosterStaffCount}
          </div>
        </div>
        <div className="text-right font-mono">
          <div className="text-xs font-black text-rose-300">
            -${payroll.totalMonthlyEquivalent.toLocaleString()} / mo
          </div>
          <div className="text-[10px] text-zinc-400">
            (~${payroll.totalDailyEquivalent.toLocaleString()}/day amortized)
          </div>
        </div>
      </div>

      {payroll.upcomingPaydays.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-white/10">
          {payroll.upcomingPaydays.slice(0, 6).map((item, idx) => (
            <div
              key={`${item.ownerLabel}_${item.staffName}_${idx}`}
              className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[10px]"
            >
              <div className="font-bold text-white truncate max-w-[160px]">
                {item.staffName} • <span className="text-sky-300">{item.roleTitle}</span>
              </div>
              <div className="font-mono text-[9px] text-zinc-400">
                {item.ownerLabel} • ${item.salaryDue.toLocaleString()} ({item.payrollCycle}) in{' '}
                <span className="text-amber-300 font-bold">{item.daysLeft}d</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RosterTrustAndHiatusPanelProps {
  artist: ImprintSignedArtist;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  compact?: boolean;
}

/**
 * Renders the Roster Artist's Label Trust Bar (0-100%), Contract Renewal Outlook,
 * Comeback Fatigue Meter, and Mandatory Hiatus Request / Approval / Force Comeback controls.
 */
export const RosterTrustAndHiatusPanel: React.FC<RosterTrustAndHiatusPanelProps> = ({
  artist,
  gameState,
  setGameState,
  onNotify,
  compact = false,
}) => {
  const info = getRosterTrustAndHiatusInfo(artist);
  const stageName = artist.stageName || artist.name;

  const handleApproveHiatus = () => {
    const res = approveRosterArtistHiatus(gameState, artist.id, 28);
    if (!res.success) {
      onNotify?.(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify?.(res.message, 'success');
  };

  const handleForceComeback = () => {
    const res = forceRosterArtistComebackOverHiatus(gameState, artist.id);
    if (!res.success) {
      onNotify?.(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify?.(res.message, 'error');
  };

  const handleGrantBonus = () => {
    const res = grantRosterArtistTrustBonus(gameState, artist.id);
    if (!res.success) {
      onNotify?.(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify?.(res.message, 'success');
  };

  return (
    <div
      className={`rounded-2xl border p-3 space-y-2.5 ${
        info.hiatusStatus === 'requesting_hiatus'
          ? 'border-amber-400/60 bg-amber-500/10'
          : info.hiatusStatus === 'on_hiatus'
          ? 'border-sky-400/50 bg-sky-500/10'
          : 'border-white/10 bg-black/35'
      }`}
    >
      {/* Top Row: Label Trust Bar + Contract Renewal Outlook */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black uppercase tracking-wider text-zinc-200">
              Label Trust:
            </span>
            <span className={`font-mono font-black ${info.trustColorClass}`}>
              {info.labelTrust}% ({info.trustTierLabel})
            </span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
              info.willingToRenew
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
            }`}
          >
            {info.willingToRenew
              ? `Will Renew Contract (${info.renewalChancePct}%)`
              : `Refuses Renewal (${info.renewalChancePct}% • Low Trust)`}
          </span>
        </div>

        {/* Visual Trust Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              info.labelTrust >= 65
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : info.labelTrust >= 48
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-rose-600 to-orange-500'
            }`}
            style={{ width: `${info.labelTrust}%` }}
          />
        </div>
      </div>

      {/* Second Row: Comeback Fatigue & Hiatus Status */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-300 flex-wrap">
        <div className="flex items-center gap-2">
          <span>
            Comeback Fatigue:{' '}
            <strong
              className={
                info.fatigueScore >= 70
                  ? 'text-rose-400'
                  : info.fatigueScore >= 45
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }
            >
              {info.fatigueScore}%
            </strong>
          </span>
          <span>•</span>
          <span>
            Status:{' '}
            <strong
              className={
                info.hiatusStatus === 'on_hiatus'
                  ? 'text-sky-300'
                  : info.hiatusStatus === 'requesting_hiatus'
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }
            >
              {info.hiatusStatus === 'on_hiatus'
                ? `On Hiatus (${info.hiatusDaysLeft}d left)`
                : info.hiatusStatus === 'requesting_hiatus'
                ? 'Requesting Hiatus!'
                : 'Active'}
            </strong>
          </span>
        </div>

        {!compact && (
          <span className="text-[10px] text-zinc-400">
            Last Comeback: {info.daysSinceLastComeback}d ago
          </span>
        )}
      </div>

      {/* Alert Banner when Requesting Hiatus or On Hiatus */}
      {(info.hiatusStatus === 'requesting_hiatus' || info.hiatusStatus === 'on_hiatus') && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-[11px] text-zinc-200 space-y-2">
          <p className="leading-snug">{info.hiatusReason}</p>
          <div className="flex flex-wrap gap-1.5">
            {info.hiatusStatus === 'requesting_hiatus' && (
              <button
                type="button"
                onClick={handleApproveHiatus}
                className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-black hover:bg-emerald-400 cursor-pointer"
              >
                ✓ Approve 28-Day Hiatus (+14% Trust)
              </button>
            )}
            <button
              type="button"
              onClick={handleForceComeback}
              className="rounded-lg bg-rose-500/25 border border-rose-500/40 px-2.5 py-1 text-[10px] font-black text-rose-200 hover:bg-rose-500 hover:text-white cursor-pointer"
            >
              ⚡ Force Comeback Now (-{info.hiatusStatus === 'on_hiatus' ? 35 : 30}% Trust)
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons in Full View (Grant Rest or Goodwill Bonus) */}
      {!compact && info.hiatusStatus === 'active' && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {info.fatigueScore >= 30 && (
            <button
              type="button"
              onClick={handleApproveHiatus}
              className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[10px] font-black text-sky-200 hover:bg-sky-500 hover:text-black cursor-pointer"
            >
              Grant 28-Day Rest Hiatus (+14% Trust)
            </button>
          )}
          {info.labelTrust < 95 && (
            <button
              type="button"
              onClick={handleGrantBonus}
              className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black text-amber-200 hover:bg-amber-500 hover:text-black cursor-pointer"
            >
              Pay $75k Goodwill Bonus (+12% Trust • -20% Fatigue for {stageName})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
