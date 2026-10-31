import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import {
  STAFF_ROLE_DEFINITIONS,
  STAFF_ROLE_ORDER,
  STAFF_CANDIDATE_POOL,
  StaffRoleId,
  StaffCandidate,
  StaffPayrollCycle,
  StaffContractTermMonths,
  getEnsuredStaffState,
  calculateStaffTeamSynergyBuffs,
  getCandidateSalaryRangeForCycle,
  evaluateStaffContractProposal,
  signStaffContractWithProposal,
  renewStaffContract,
  setStaffFocusSong,
  releaseStaffMember,
  payStaffMoraleBonus,
  getMemberEffectivenessMultiplier,
  getCandidateById,
  getCycleDaysCount,
} from '../../data/staffTeamEngine';

const CONTRACT_TERMS: { months: StaffContractTermMonths; label: string; sub: string }[] = [
  { months: 6, label: '6 Months', sub: '180 Days' },
  { months: 12, label: '1 Year', sub: '360 Days' },
  { months: 24, label: '2 Years', sub: '720 Days' },
  { months: 36, label: '3 Years', sub: '1,080 Days' },
];

export default function StaffTeamApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<'roster' | 'agency' | 'ledger'>('roster');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<StaffRoleId>('manager');
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Contract Negotiation Modal State
  const [negotiatingCandidate, setNegotiatingCandidate] = useState<StaffCandidate | null>(null);
  const [isRenewalMode, setIsRenewalMode] = useState(false);
  const [draftCycle, setDraftCycle] = useState<StaffPayrollCycle>('monthly');
  const [draftSalary, setDraftSalary] = useState<number>(0);
  const [draftTermMonths, setDraftTermMonths] = useState<StaffContractTermMonths>(12);

  const staffState = useMemo(() => getEnsuredStaffState(state), [state]);
  const synergy = useMemo(() => calculateStaffTeamSynergyBuffs(state), [state]);
  const allSongs = useMemo(() => state.songs || [], [state.songs]);

  const closeApp = () => {
    setState((prev) => ({ ...prev, activeApp: 'none' }));
  };

  // Open Contract Negotiation Modal for a candidate
  const openContractModal = (candidate: StaffCandidate, renewal = false) => {
    const existingMember = staffState.roster[candidate.roleId];
    const initialCycle =
      renewal && existingMember ? existingMember.payrollCycle : candidate.preferredCycle;
    const initialTerm =
      renewal && existingMember ? existingMember.contractTermMonths : candidate.preferredTermMonths;
    const range = getCandidateSalaryRangeForCycle(candidate, initialCycle);

    setNegotiatingCandidate(candidate);
    setIsRenewalMode(renewal);
    setDraftCycle(initialCycle);
    setDraftSalary(range.target);
    setDraftTermMonths(initialTerm);
  };

  // Switch billing cycle inside Contract Modal and recalibrate salary to target rate
  const handleSwitchDraftCycle = (newCycle: StaffPayrollCycle) => {
    if (!negotiatingCandidate) return;
    const range = getCandidateSalaryRangeForCycle(negotiatingCandidate, newCycle);
    setDraftCycle(newCycle);
    setDraftSalary(range.target);
  };

  const handleSubmitContract = () => {
    if (!negotiatingCandidate) return;

    if (isRenewalMode) {
      const res = renewStaffContract(
        state,
        negotiatingCandidate.roleId,
        draftTermMonths,
        draftCycle,
        draftSalary
      );
      setBannerFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        setState(res.nextState);
        setNegotiatingCandidate(null);
      }
      return;
    }

    const res = signStaffContractWithProposal(state, {
      candidateId: negotiatingCandidate.id,
      payrollCycle: draftCycle,
      offeredSalaryPerCycle: draftSalary,
      signingBonus: negotiatingCandidate.signingBonus,
      termMonths: draftTermMonths,
    });
    setBannerFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setState(res.nextState);
      setNegotiatingCandidate(null);
      setActiveTab('roster');
    }
  };

  const handleRelease = (roleId: StaffRoleId) => {
    const res = releaseStaffMember(state, roleId);
    setBannerFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setState(res.nextState);
    }
  };

  const handlePayBonus = (roleId: StaffRoleId) => {
    const res = payStaffMoraleBonus(state, roleId);
    setBannerFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setState(res.nextState);
    }
  };

  const handleChangeFocusSong = (roleId: StaffRoleId, songIdStr: string) => {
    const songId = songIdStr === 'auto' ? undefined : Number(songIdStr);
    const nextState = setStaffFocusSong(state, roleId, songId);
    setState(nextState);
  };

  const roleCandidates = useMemo(
    () => STAFF_CANDIDATE_POOL.filter((c) => c.roleId === selectedRoleFilter),
    [selectedRoleFilter]
  );

  const currentMoney = Math.round(Number(state.money) || 0);
  const currentPop = Number(state.popularity || 0);
  const formattedGameDate = state.date
    ? String(state.date).split('T')[0]
    : '2026-01-01';

  // Live evaluation for active Contract Modal
  const contractModalData = useMemo(() => {
    if (!negotiatingCandidate) return null;
    const range = getCandidateSalaryRangeForCycle(negotiatingCandidate, draftCycle);
    const evaluation = evaluateStaffContractProposal(negotiatingCandidate, {
      candidateId: negotiatingCandidate.id,
      payrollCycle: draftCycle,
      offeredSalaryPerCycle: draftSalary,
      signingBonus: negotiatingCandidate.signingBonus,
      termMonths: draftTermMonths,
    });
    const upfrontFee = isRenewalMode
      ? Math.round(negotiatingCandidate.signingBonus * 0.5)
      : negotiatingCandidate.signingBonus;

    const totalContractDays = draftTermMonths * 30;
    const cycleDays = getCycleDaysCount(draftCycle);
    const numberOfPayments = Math.max(1, Math.round(totalContractDays / cycleDays));
    const totalSalaryOverTerm = draftSalary * numberOfPayments;
    const totalContractValue = upfrontFee + totalSalaryOverTerm;
    const salaryStep = draftCycle === 'daily' ? 50 : draftCycle === 'monthly' ? 1000 : 10000;

    return {
      range,
      evaluation,
      upfrontFee,
      totalContractDays,
      numberOfPayments,
      totalSalaryOverTerm,
      totalContractValue,
      salaryStep,
    };
  }, [negotiatingCandidate, draftCycle, draftSalary, draftTermMonths, isRenewalMode]);

  return (
    <div className="fixed inset-0 z-50 bg-[#080A0F] text-zinc-100 flex flex-col max-w-md mx-auto overflow-hidden animate-fade-in">
      {/* Executive Header */}
      <div className="px-4 pt-4 pb-3.5 bg-gradient-to-b from-[#131824] to-[#0C1018] border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={closeApp}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <i className="ph-bold ph-caret-left text-sm"></i>
            <span>Apps</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous Operations
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {synergy.hiredCount}/{synergy.totalRoles} Signed
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
              Executive Management & Contracts
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Staff Team & Payroll
            </h1>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Artist Treasury</div>
            <div className="text-base font-mono font-black text-emerald-400">
              ${currentMoney.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Financial & Synergy Strip */}
        <div className="mt-3 grid grid-cols-3 gap-2 bg-[#080B11] p-2.5 rounded-xl border border-white/8">
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Team Synergy</div>
            <div className="text-[11px] font-bold text-amber-300 truncate mt-0.5">
              {synergy.synergyTierLabel}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Daily Burn Eq.</div>
            <div className="text-xs font-mono font-bold text-rose-300 mt-0.5">
              -${synergy.totalDailyEquivalentCost.toLocaleString()}/d
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Deliverables Run</div>
            <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
              {staffState.totalDeliverablesRun} Completed
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 bg-[#07090E] p-1 rounded-xl border border-white/8">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Active Team ({synergy.hiredCount})
          </button>
          <button
            onClick={() => setActiveTab('agency')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'agency'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Talent Agency
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Work & Payroll ({staffState.actionLogs.length})
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerFeedback && (
        <div
          className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
            bannerFeedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          <span className="pr-2">{bannerFeedback.text}</span>
          <button
            onClick={() => setBannerFeedback(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>
      )}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {activeTab === 'roster' && (
          <>
            {/* Active Department Metrics Matrix */}
            <div className="bg-[#101520] rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                  Live Department Output
                </span>
                {synergy.activePrShieldDays > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    PR SHIELD: {synergy.activePrShieldDays}D
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#090C12] p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-zinc-400">Overhead Audit</div>
                  <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                    -{synergy.expenseReductionPct}% Cost
                  </div>
                </div>
                <div className="bg-[#090C12] p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-zinc-400">Hype Stability</div>
                  <div className="text-xs font-mono font-bold text-purple-300 mt-0.5">
                    +{synergy.hypeRetentionBonusPct}% Hold
                  </div>
                </div>
                <div className="bg-[#090C12] p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-zinc-400">Studio Quality</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    +{synergy.qualityBonusPoints} Pts
                  </div>
                </div>
                <div className="bg-[#090C12] p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-zinc-400">Tour Savings</div>
                  <div className="text-xs font-mono font-bold text-sky-300 mt-0.5">
                    -{synergy.tourLogisticsSavingsPct}% Cost
                  </div>
                </div>
                <div className="bg-[#090C12] p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-zinc-400">Playlist Pitch</div>
                  <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                    {synergy.playlistPitchChancePct}% Rate
                  </div>
                </div>
                <div className="bg-[#090C12] p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-zinc-400">Visual Era</div>
                  <div className="text-xs font-mono font-bold text-rose-300 mt-0.5">
                    +{synergy.visualMomentumBonus} Mom.
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Executive Department Seats */}
            <div className="space-y-3.5">
              {STAFF_ROLE_ORDER.map((roleId) => {
                const roleDef = STAFF_ROLE_DEFINITIONS[roleId];
                const hired = staffState.roster[roleId];

                if (!hired) {
                  return (
                    <div
                      key={roleId}
                      className="bg-[#0E131D] rounded-2xl p-4 border border-dashed border-white/15 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <i className={`ph-fill ${roleDef.icon} ${roleDef.accentColor} text-xl`}></i>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            {roleDef.department}
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {roleDef.title}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            {roleDef.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRoleFilter(roleId);
                          setActiveTab('agency');
                        }}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Recruit
                      </button>
                    </div>
                  );
                }

                const effMult = getMemberEffectivenessMultiplier(hired);
                const xpPct = Math.min(100, Math.round((hired.xp / hired.xpToNextLevel) * 100));
                const autoTarget = hired.autonomousCycleTargetDays || roleDef.autonomousCycleDays;
                const autoProgress = hired.autonomousProgressDays || 0;
                const autoPct = Math.min(100, Math.round((autoProgress / autoTarget) * 100));
                const cycleUnit =
                  hired.payrollCycle === 'daily'
                    ? '/day'
                    : hired.payrollCycle === 'monthly'
                    ? '/mo'
                    : '/yr';
                const contractLow = (hired.contractDaysRemaining || 360) <= 30;
                const supportsSongFocus =
                  roleId === 'producer' || roleId === 'radio_plugger' || roleId === 'creative_director';

                return (
                  <div
                    key={roleId}
                    className="bg-[#111723] rounded-2xl p-4 border border-white/12 space-y-3.5 shadow-lg"
                  >
                    {/* Top Identity & Contract Badge Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/5 border border-amber-400/30 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-black text-amber-300">
                            {hired.initials || hired.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">
                            Lv.{hired.level}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              {hired.tierLabel}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/8 text-zinc-300">
                              {roleDef.shortTitle}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1">
                            {hired.name}
                          </h3>
                          <div className="text-xs text-zinc-400">{hired.agencyTitle}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-rose-300">
                          ${(hired.agreedSalaryPerCycle || hired.dailyRetainer).toLocaleString()}
                          {cycleUnit}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 uppercase">
                          {hired.payrollCycle === 'daily'
                            ? 'Billed Daily'
                            : `Next Payday: ${hired.nextPaydayDaysLeft}d`}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 font-bold ${
                            contractLow ? 'text-rose-400' : 'text-amber-300/90'
                          }`}
                        >
                          Tenure: {hired.contractDaysRemaining}d left
                        </div>
                      </div>
                    </div>

                    {/* Autonomous Work Engine Progress Card */}
                    <div className="bg-[#090C14] rounded-xl p-3 border border-white/8 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          AUTONOMOUS OPERATIONS ACTIVE
                        </span>
                        <span className="text-zinc-400">
                          {autoProgress}/{autoTarget}d to Deliverable
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white">
                        {roleDef.deliverableName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Active Duty: {hired.currentTaskLabel || roleDef.autonomousDuties[0]}
                      </div>

                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
                          style={{ width: `${autoPct}%` }}
                        />
                      </div>

                      {/* Optional Track Focus Selector for Studio, Radio, and Creative Roles */}
                      {supportsSongFocus && allSongs.length > 0 && (
                        <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-white/5">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 shrink-0">
                            Priority Track:
                          </span>
                          <select
                            value={hired.focusSongId ?? 'auto'}
                            onChange={(e) => handleChangeFocusSong(roleId, e.target.value)}
                            className="bg-[#121724] border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-200 max-w-[200px] truncate focus:outline-none"
                          >
                            <option value="auto">Auto (Latest Track)</option>
                            {allSongs.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title} ({s.status.toUpperCase()} • Q:{s.quality})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Seniority XP & Staff Morale Bars */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span>Seniority Lv.{hired.level}/10</span>
                          <span>{Math.round(effMult * 100)}% Output</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 transition-all"
                            style={{ width: `${xpPct}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span>Executive Morale</span>
                          <span>{hired.loyalty}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              hired.loyalty >= 80
                                ? 'bg-emerald-400'
                                : hired.loyalty >= 45
                                ? 'bg-sky-400'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${hired.loyalty}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contract & Management Footer Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/8">
                      <button
                        onClick={() => handlePayBonus(roleId)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Bonus (${((hired.dailyRetainer || 1000) * 5).toLocaleString()})
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const cand = getCandidateById(hired.candidateId);
                            if (cand) openContractModal(cand, true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Renew Contract
                        </button>
                        <button
                          onClick={() => handleRelease(roleId)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Terminate
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'agency' && (
          <>
            {/* Department Filter Pills */}
            <div className="grid grid-cols-3 gap-1.5">
              {STAFF_ROLE_ORDER.map((roleId) => {
                const def = STAFF_ROLE_DEFINITIONS[roleId];
                const isSelected = selectedRoleFilter === roleId;
                const isFilled = Boolean(staffState.roster[roleId]);
                return (
                  <button
                    key={roleId}
                    onClick={() => setSelectedRoleFilter(roleId)}
                    className={`px-2.5 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-[#101520] border-white/8 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold truncate">{def.shortTitle}</span>
                      {isFilled && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Department Overview Card */}
            <div className="bg-[#101520] rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  {STAFF_ROLE_DEFINITIONS[selectedRoleFilter].department}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Deliverable Cycle: {STAFF_ROLE_DEFINITIONS[selectedRoleFilter].autonomousCycleDays}d
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {STAFF_ROLE_DEFINITIONS[selectedRoleFilter].title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {STAFF_ROLE_DEFINITIONS[selectedRoleFilter].description}
              </p>
            </div>

            {/* Candidate Dossiers */}
            <div className="space-y-3.5">
              {roleCandidates.map((cand) => {
                const currentInRole = staffState.roster[cand.roleId];
                const isAlreadyHired = currentInRole?.candidateId === cand.id;
                const meetsPop = currentPop >= cand.minPopularity;
                const prefRange = getCandidateSalaryRangeForCycle(cand, cand.preferredCycle);

                return (
                  <div
                    key={cand.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isAlreadyHired
                        ? 'bg-emerald-950/25 border-emerald-500/40'
                        : 'bg-[#101520] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 ${
                            cand.tier === 3
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                              : cand.tier === 2
                              ? 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                              : 'bg-white/5 border-white/10 text-zinc-300'
                          }`}
                        >
                          {cand.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                cand.tier === 3
                                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                  : cand.tier === 2
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              Tier {cand.tier} • {cand.tierLabel}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-zinc-300">
                              Prefers {cand.preferredCycle}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white mt-1">
                            {cand.name}
                          </h4>
                          <div className="text-xs text-zinc-400">{cand.agencyTitle}</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                      {cand.bio}
                    </p>

                    {/* Salary Range & Contract Preferences Box */}
                    <div className="mt-3 grid grid-cols-2 gap-2 bg-[#090C12] p-2.5 rounded-xl border border-white/5 font-mono">
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase">
                          Retainer Range ({cand.preferredCycle})
                        </div>
                        <div className="text-xs font-bold text-rose-300 mt-0.5">
                          ${prefRange.min.toLocaleString()} – ${prefRange.max.toLocaleString()}
                          {prefRange.shortUnit}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase">
                          Signing Bonus & Term
                        </div>
                        <div className="text-xs font-bold text-amber-300 mt-0.5">
                          ${cand.signingBonus.toLocaleString()} • {cand.preferredTermMonths}M Term
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#090C12] border border-white/5 text-xs font-mono text-amber-200/90">
                      {cand.specialtyTag}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/8 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-zinc-400">
                        Req. Popularity:{' '}
                        <span
                          className={
                            meetsPop ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                          }
                        >
                          {cand.minPopularity}%
                        </span>
                      </div>

                      {isAlreadyHired ? (
                        <button
                          onClick={() => openContractModal(cand, true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer"
                        >
                          Signed • Renegotiate
                        </button>
                      ) : (
                        <button
                          onClick={() => openContractModal(cand, false)}
                          disabled={!meetsPop}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            meetsPop
                              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          {!meetsPop
                            ? `Locked (${cand.minPopularity}% Pop)`
                            : currentInRole
                            ? 'Negotiate Replacement'
                            : 'Draft Contract'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-[#101520] rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  Autonomous Work & Payroll Ledger
                </h3>
                <p className="text-xs text-zinc-400">
                  Real-time log of completed deliverables, contract signings, and salary disbursements.
                </p>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-zinc-400 uppercase">Total Disbursed</div>
                <div className="text-xs font-bold text-rose-300">
                  ${staffState.totalPayrollPaid.toLocaleString()}
                </div>
              </div>
            </div>

            {staffState.actionLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500">
                No staff activity logged yet. Recruit staff members to start autonomous operations.
              </div>
            ) : (
              <div className="space-y-2.5">
                {staffState.actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#090C12] p-3 rounded-xl border border-white/6 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          log.category === 'autonomous_work'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : log.category === 'payroll'
                            ? 'bg-sky-500/15 text-sky-300'
                            : log.category === 'contract'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-white/10 text-zinc-300'
                        }`}
                      >
                        {log.category.replace('_', ' ')}
                      </span>
                      <span className="text-zinc-400">{log.date}</span>
                    </div>
                    <div className="text-xs font-bold text-white pt-0.5">{log.title}</div>
                    <div className="text-[11px] text-zinc-400 leading-relaxed">
                      {log.detail}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formal Executive Employment Agreement Dossier Modal */}
      {negotiatingCandidate && contractModalData && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-2.5 animate-fade-in">
          <div className="w-full max-w-md bg-[#0D111A] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            {/* Official Legal Contract Top Seal */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#171D2B] via-[#1C2232] to-[#141926] border-b border-amber-500/25 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                    REF: EXEC-{negotiatingCandidate.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    DATE: {formattedGameDate}
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-1">
                  {isRenewalMode
                    ? 'EXECUTIVE CONTRACT EXTENSION AGREEMENT'
                    : 'EXECUTIVE EMPLOYMENT & RETAINER AGREEMENT'}
                </h3>
              </div>
              <button
                onClick={() => setNegotiatingCandidate(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <i className="ph-bold ph-x"></i>
              </button>
            </div>

            {/* Scrollable Contract Clauses */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Contracting Parties Box */}
              <div className="bg-[#080B11] rounded-2xl p-3.5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 border-b border-white/6 pb-1.5">
                  <span>Contracting Parties</span>
                  <span className="text-amber-300 font-bold">
                    Tier {negotiatingCandidate.tier} • {negotiatingCandidate.tierLabel} Executive
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                      Employer (Artist Entity)
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {state.artist?.name || 'Recording Artist'}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      Treasury: ${currentMoney.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                      Executive Appointee
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {negotiatingCandidate.name}
                    </div>
                    <div className="text-[10px] text-amber-300/90 truncate">
                      {STAFF_ROLE_DEFINITIONS[negotiatingCandidate.roleId].title}
                    </div>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-white/6 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Specialty Mandate:</span>
                  <span className="text-emerald-300 font-bold">
                    {negotiatingCandidate.specialtyTag}
                  </span>
                </div>
              </div>

              {/* Clause I: Payroll Disbursement Schedule */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    Clause I — Payroll Disbursement Schedule
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Prefers:{' '}
                    <strong className="text-white uppercase">
                      {negotiatingCandidate.preferredCycle}
                    </strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'monthly', 'yearly'] as StaffPayrollCycle[]).map((cyc) => {
                    const isSelected = draftCycle === cyc;
                    const isPreferred = negotiatingCandidate.preferredCycle === cyc;
                    return (
                      <button
                        key={cyc}
                        onClick={() => handleSwitchDraftCycle(cyc)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                            : 'bg-[#080B11] border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold capitalize">
                            {cyc === 'yearly' ? 'Annual' : cyc}
                          </span>
                          {isPreferred && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              PREF
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          {cyc === 'daily'
                            ? 'Every 24 Hours'
                            : cyc === 'monthly'
                            ? 'Every 30d (-5%)'
                            : 'Every 365d (-12%)'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clause II: Executive Retainer & Salary Negotiation */}
              <div className="bg-[#080B11] p-3.5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase text-amber-300">
                      Clause II — Executive Compensation
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {contractModalData.range.cycleLabel}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-black text-rose-300">
                      ${draftSalary.toLocaleString()}
                      {contractModalData.range.shortUnit}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      ~${Math.round(draftSalary / getCycleDaysCount(draftCycle)).toLocaleString()}/day eq
                    </div>
                  </div>
                </div>

                <input
                  type="range"
                  min={Math.round(contractModalData.range.min * 0.85)}
                  max={contractModalData.range.max}
                  step={contractModalData.salaryStep}
                  value={draftSalary}
                  onChange={(e) => setDraftSalary(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>
                    Floor: ${contractModalData.range.min.toLocaleString()}
                  </span>
                  <span>
                    Market: ${contractModalData.range.target.toLocaleString()}
                  </span>
                  <span>
                    Ceiling: ${contractModalData.range.max.toLocaleString()}
                  </span>
                </div>

                {/* Quick Salary Negotiation Presets */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => setDraftSalary(contractModalData.range.min)}
                    className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-300 cursor-pointer"
                  >
                    Floor Rate
                  </button>
                  <button
                    onClick={() => setDraftSalary(contractModalData.range.target)}
                    className="py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-mono text-amber-300 font-bold cursor-pointer"
                  >
                    Market Standard
                  </button>
                  <button
                    onClick={() => setDraftSalary(contractModalData.range.max)}
                    className="py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-mono text-emerald-300 cursor-pointer"
                  >
                    Executive Max
                  </button>
                </div>
              </div>

              {/* Clause III: Contract Term & Tenure */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    Clause III — Contract Term & Tenure
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {contractModalData.totalContractDays} Total Days
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CONTRACT_TERMS.map((t) => {
                    const isSelected = draftTermMonths === t.months;
                    const isPref = negotiatingCandidate.preferredTermMonths === t.months;
                    return (
                      <button
                        key={t.months}
                        onClick={() => setDraftTermMonths(t.months)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-[#080B11] border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[9px] font-mono text-zinc-400">{t.sub}</div>
                        {isPref && (
                          <div className="text-[8px] font-mono text-emerald-400 mt-0.5 font-bold">
                            PREF
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clause IV: Total Financial Commitment Summary & Counterparty Response */}
              <div className="bg-[#080B11] p-3.5 rounded-2xl border border-white/10 space-y-2.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Clause IV — Financial Commitment & Counterparty Response
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-center bg-[#0D111A] p-2 rounded-xl border border-white/5">
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase">
                      {isRenewalMode ? 'Renewal Fee' : 'Signing Bonus'}
                    </div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5">
                      ${contractModalData.upfrontFee.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase">
                      Term Retainers ({contractModalData.numberOfPayments}x)
                    </div>
                    <div className="text-xs font-bold text-rose-300 mt-0.5">
                      ${contractModalData.totalSalaryOverTerm.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase">Total Contract</div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      ${contractModalData.totalContractValue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-400 font-medium">Execution Probability</span>
                  <span
                    className={`font-mono font-black ${
                      contractModalData.evaluation.acceptanceChancePct >= 80
                        ? 'text-emerald-400'
                        : contractModalData.evaluation.acceptanceChancePct >= 50
                        ? 'text-amber-300'
                        : 'text-rose-400'
                    }`}
                  >
                    {contractModalData.evaluation.acceptanceChancePct}% Acceptance •{' '}
                    {contractModalData.evaluation.initialLoyalty}% Morale
                  </span>
                </div>
                <p className="text-xs italic text-zinc-300 bg-[#0D111A] p-2.5 rounded-xl border border-white/5">
                  {contractModalData.evaluation.reactionQuote}
                </p>

                {/* Digital Signature Lines */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/8 text-[10px] font-mono">
                  <div>
                    <div className="text-zinc-500 uppercase">Artist Signature</div>
                    <div className="text-amber-200/90 italic font-serif text-xs border-b border-white/15 pb-0.5 mt-0.5 truncate">
                      /s/ {state.artist?.name || 'Artist'}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 uppercase">Executive Signature</div>
                    <div className="text-emerald-300/90 italic font-serif text-xs border-b border-white/15 pb-0.5 mt-0.5 truncate">
                      {contractModalData.evaluation.isAcceptable
                        ? `/s/ ${negotiatingCandidate.name}`
                        : 'Awaiting Valid Offer'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Execution Bar */}
            <div className="px-5 py-3.5 bg-[#121724] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400">
                  Due Upon Execution
                </div>
                <div className="text-sm font-mono font-black text-amber-300">
                  ${contractModalData.upfrontFee.toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleSubmitContract}
                disabled={
                  !contractModalData.evaluation.isAcceptable ||
                  currentMoney < contractModalData.upfrontFee
                }
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                  contractModalData.evaluation.isAcceptable &&
                  currentMoney >= contractModalData.upfrontFee
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer shadow-lg'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {!contractModalData.evaluation.isAcceptable
                  ? 'Offer Below Floor'
                  : currentMoney < contractModalData.upfrontFee
                  ? 'Insufficient Treasury'
                  : isRenewalMode
                  ? 'Execute Extension'
                  : 'Execute & Sign Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
