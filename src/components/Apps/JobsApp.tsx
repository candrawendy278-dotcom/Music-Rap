import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNumFull } from '../../constants';
import { saveGameStateSafely } from '../../utils/saveStateOptimizer';
import {
  JOB_LISTINGS,
  STEADY_DAILY_CONTRACTS,
  JobListing,
  JobTierCategory,
  getEnsuredJobsState,
  checkJobEligibility,
  getPlayerAverageSkillLevel
} from '../../data/jobsSystemEngine';

export default function JobsApp() {
  const { state, setState } = useGameContext();
  const [selectedCategory, setSelectedCategory] = useState<'all' | JobTierCategory>('all');
  const [activeTab, setActiveTab] = useState<'gigs' | 'contracts' | 'history'>('gigs');
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const jobsState = useMemo(() => getEnsuredJobsState(state), [state]);
  const avgSkill = useMemo(() => getPlayerAverageSkillLevel(state), [state.skills]);
  const currentPop = state.popularity || 0;
  const shiftsRemaining = Math.max(0, jobsState.maxShiftsPerDay - jobsState.shiftsWorkedToday);

  const activeContract = useMemo(
    () => STEADY_DAILY_CONTRACTS.find(c => c.id === jobsState.activeSteadyContractId) || null,
    [jobsState.activeSteadyContractId]
  );

  const filteredJobs = useMemo(() => {
    if (selectedCategory === 'all') return JOB_LISTINGS;
    return JOB_LISTINGS.filter(j => j.category === selectedCategory);
  }, [selectedCategory]);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => setToastBanner(null), 3200);
  };

  const handleClose = () => {
    setState(p => ({ ...p, activeApp: 'none' }));
  };

  const handleWorkShift = (job: JobListing) => {
    if (shiftsRemaining <= 0) {
      showToast('No energy left today! Advance to the Next Day to refresh your shifts.');
      return;
    }

    const check = checkJobEligibility(job, state);
    if (!check.eligible) {
      showToast(check.reason || 'Requirements not met yet.');
      return;
    }

    const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';

    setState(prev => {
      const currentJobs = getEnsuredJobsState(prev);
      if (currentJobs.shiftsWorkedToday >= currentJobs.maxShiftsPerDay) return prev;

      const pay = job.payPerShift;
      const fanGain = job.fanBonus || 0;
      const hypeGain = job.hypeBonus || 0;

      const newRecord = {
        id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        jobTitle: job.title,
        company: job.company,
        amount: pay,
        date: dateStr,
        type: 'shift' as const
      };

      const nextJobsState = {
        ...currentJobs,
        lastWorkedDate: dateStr,
        shiftsWorkedToday: currentJobs.shiftsWorkedToday + 1,
        totalJobEarnings: (currentJobs.totalJobEarnings || 0) + pay,
        totalShiftsCompleted: (currentJobs.totalShiftsCompleted || 0) + 1,
        recentPaychecks: [newRecord, ...(currentJobs.recentPaychecks || [])].slice(0, 20)
      };

      const updated = {
        ...prev,
        money: (prev.money || 0) + pay,
        fans: (prev.fans || 0) + fanGain,
        hype: Math.min(100, Number(((prev.hype || 0) + hypeGain).toFixed(2))),
        jobsState: nextJobsState
      } as any;

      saveGameStateSafely(updated).catch(console.error);
      return updated;
    });

    const bonusParts: string[] = [`+$${formatNumFull(job.payPerShift)}`];
    if (job.fanBonus) bonusParts.push(`+${formatNumFull(job.fanBonus)} Fans`);
    if (job.hypeBonus) bonusParts.push(`+${job.hypeBonus}% Hype`);
    showToast(`Shift Completed: ${job.title} (${bonusParts.join(' • ')})`);
  };

  const handleSelectDailyContract = (contractId: string, minPop: number, title: string) => {
    if (currentPop < minPop) {
      showToast(`Requires ${minPop}% Popularity to sign this contract.`);
      return;
    }

    setState(prev => {
      const currentJobs = getEnsuredJobsState(prev);
      const updated = {
        ...prev,
        jobsState: {
          ...currentJobs,
          activeSteadyContractId: contractId
        }
      } as any;
      saveGameStateSafely(updated).catch(console.error);
      return updated;
    });

    showToast(`Signed daily employment contract: ${title}!`);
  };

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#F5F5F7] text-[#1D1D1F] z-50 overflow-y-auto flex flex-col font-sans animate-in fade-in hide-scrollbar">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <i className="ph-bold ph-arrow-left text-lg text-neutral-900"></i>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-neutral-900">
                Career &amp; Side Jobs
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">
                HustleHub
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Work daily shifts &amp; freelance gigs to fund your music career
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Balance
          </div>
          <div className="text-sm font-black font-mono text-emerald-600 tabular-nums">
            ${formatNumFull(Math.round(state.money || 0))}
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastBanner && (
        <div className="sticky top-[61px] z-30 bg-neutral-900 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-check-circle text-emerald-400 text-base"></i>
            <span>{toastBanner}</span>
          </div>
          <button onClick={() => setToastBanner(null)} className="text-white/60 hover:text-white">
            <i className="ph-bold ph-x text-xs"></i>
          </button>
        </div>
      )}

      <div className="p-4 space-y-4 pb-20">
        {/* Top Hero Summary Card */}
        <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Daily Work Stamina
              </span>
              <h2 className="text-xl font-black tracking-tight mt-0.5">
                {shiftsRemaining} of {jobsState.maxShiftsPerDay} Shifts Left Today
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Stamina resets automatically every Next Day
              </p>
            </div>
            <div className="flex gap-1.5 pt-1">
              {Array.from({ length: jobsState.maxShiftsPerDay }).map((_, idx) => {
                const isAvailable = idx < shiftsRemaining;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-8 rounded-full transition-all ${
                      isAvailable
                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        : 'bg-white/15'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
            <div className="bg-white/[0.06] rounded-2xl p-2.5">
              <div className="text-[10px] text-neutral-400 font-semibold">Total Job Income</div>
              <div className="text-sm font-black font-mono text-emerald-400 tabular-nums mt-0.5">
                ${formatNumFull(jobsState.totalJobEarnings || 0)}
              </div>
            </div>
            <div className="bg-white/[0.06] rounded-2xl p-2.5">
              <div className="text-[10px] text-neutral-400 font-semibold">Daily Salary</div>
              <div className="text-sm font-black font-mono text-white tabular-nums mt-0.5">
                +${formatNumFull(activeContract?.dailySalary || 0)}/d
              </div>
            </div>
            <div className="bg-white/[0.06] rounded-2xl p-2.5">
              <div className="text-[10px] text-neutral-400 font-semibold">Avg Studio Skill</div>
              <div className="text-sm font-black font-mono text-amber-300 tabular-nums mt-0.5">
                Lv. {avgSkill}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex bg-neutral-200/80 p-1 rounded-2xl">
          {(
            [
              { id: 'gigs', label: 'Quick Shifts & Gigs', icon: 'ph-fill ph-lightning' },
              { id: 'contracts', label: 'Daily Salary Job', icon: 'ph-fill ph-briefcase' },
              { id: 'history', label: 'Paychecks', icon: 'ph-fill ph-receipt' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: QUICK SHIFTS & FREELANCE GIGS */}
        {activeTab === 'gigs' && (
          <div className="space-y-3">
            {/* Category Filter Row */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {(
                [
                  { id: 'all', label: 'All Jobs (12)' },
                  { id: 'part_time', label: 'Part-Time Hustles' },
                  { id: 'studio_gig', label: 'Studio Freelance' },
                  { id: 'vip_contract', label: 'VIP Contracts' }
                ] as const
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 border border-black/[0.06] hover:bg-neutral-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Job Cards */}
            <div className="space-y-3">
              {filteredJobs.map(job => {
                const eligibility = checkJobEligibility(job, state);
                const canWork = eligibility.eligible && shiftsRemaining > 0;

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-2xl p-4 border transition shadow-sm ${
                      eligibility.eligible
                        ? 'border-black/[0.06]'
                        : 'border-black/[0.05] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${job.accentColor}`}
                        >
                          <i className={`${job.icon} text-xl`}></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              {job.categoryLabel}
                            </span>
                            {job.fanBonus && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                +{job.fanBonus} Fans
                              </span>
                            )}
                            {job.hypeBonus && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                +{job.hypeBonus}% Hype
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-neutral-900 mt-0.5">
                            {job.title}
                          </h3>
                          <p className="text-xs font-medium text-neutral-500">
                            {job.company}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black font-mono text-emerald-600 tabular-nums">
                          +${formatNumFull(job.payPerShift)}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-semibold">
                          per shift
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                      {eligibility.eligible ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <i className="ph-fill ph-check-circle"></i>
                          Qualified &amp; Ready
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                          <i className="ph-fill ph-lock-key"></i>
                          {eligibility.reason}
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={!canWork}
                        onClick={() => handleWorkShift(job)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                          canWork
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-95'
                            : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        }`}
                      >
                        {!eligibility.eligible
                          ? 'Locked'
                          : shiftsRemaining <= 0
                          ? 'No Shifts Left'
                          : `Work Shift (+$${formatNumFull(job.payPerShift)})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STEADY DAILY EMPLOYMENT CONTRACTS */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-900">
              <div className="font-bold flex items-center gap-1.5">
                <i className="ph-fill ph-calendar-check text-emerald-600 text-base"></i>
                <span>Automatic Daily Paycheck</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                Your active employment contract pays out automatically every time you advance to the Next Day, even while you record in the studio!
              </p>
            </div>

            {STEADY_DAILY_CONTRACTS.map(contract => {
              const isCurrent = jobsState.activeSteadyContractId === contract.id;
              const isUnlocked = currentPop >= contract.minPopularity;

              return (
                <div
                  key={contract.id}
                  className={`bg-white rounded-2xl p-4 border transition shadow-sm ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                      : 'border-black/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                        <i className={`${contract.icon} text-xl`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-neutral-900">
                            {contract.title}
                          </h3>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                              Active Job
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">{contract.employer}</p>
                        <p className="text-xs text-neutral-600 mt-1.5">
                          {contract.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black font-mono text-emerald-600 tabular-nums">
                        +${formatNumFull(contract.dailySalary)}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-semibold">
                        per day
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-500">
                      {contract.minPopularity > 0
                        ? `Requires ${contract.minPopularity}% Popularity`
                        : 'Entry-Level (No Requirements)'}
                    </span>

                    <button
                      type="button"
                      disabled={isCurrent || !isUnlocked}
                      onClick={() =>
                        handleSelectDailyContract(
                          contract.id,
                          contract.minPopularity,
                          contract.title
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : isUnlocked
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-95'
                          : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      {isCurrent
                        ? 'Currently Employed'
                        : isUnlocked
                        ? 'Sign Contract'
                        : 'Locked'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: PAYCHECK HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-black/[0.06] divide-y divide-neutral-100 overflow-hidden shadow-sm">
            {jobsState.recentPaychecks.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs">
                No paychecks recorded yet. Complete a shift above to earn instant cash!
              </div>
            ) : (
              jobsState.recentPaychecks.map(rec => (
                <div key={rec.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        rec.type === 'daily_salary'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <i
                        className={
                          rec.type === 'daily_salary'
                            ? 'ph-fill ph-calendar-check text-base'
                            : 'ph-fill ph-currency-dollar text-base'
                        }
                      ></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 truncate">
                        {rec.jobTitle}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {rec.company} • {rec.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-black font-mono text-emerald-600 tabular-nums shrink-0">
                    +${formatNumFull(rec.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
