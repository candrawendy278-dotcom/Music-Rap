import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { 
  getEnsuredSkillState, 
  calculateSkillUpgradeCost, 
  calculateTrainingDays,
  calculateMasteryRank, 
  getSkillTierLabel,
  SubSkill, 
  PlayerSkillState 
} from '../../data/skillSystemEngine';
import { getArtistMarketSynergySummary } from '../../data/skillMarketSynergyEngine';
import { formatNum } from '../../constants';

function formatScaledBonus(bonusEffect: string, level: number): { currentText: string; nextText: string } {
  const match = bonusEffect.match(/\+(\d+)%(.*)/);
  if (!match) {
    return { currentText: bonusEffect, nextText: bonusEffect };
  }
  const basePct = parseInt(match[1], 10);
  const rest = match[2];
  const currentPct = Math.round(basePct * (0.65 + level * 0.35));
  const nextPct = Math.round(basePct * (0.65 + Math.min(10, level + 1) * 0.35));
  return {
    currentText: `+${currentPct}%${rest}`,
    nextText: `+${nextPct}%`
  };
}

export default function SkillAcademyApp() {
  const { state, setState, setInfoModal } = useGameContext();
  const [activeCategory, setActiveCategory] = useState<'songwriting' | 'recording' | 'production'>('songwriting');
  const [filterMode, setFilterMode] = useState<'all' | 'training' | 'mastered'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const skills = getEnsuredSkillState(state.skills);
  const masteryRank = calculateMasteryRank(skills);
  const marketSynergy = getArtistMarketSynergySummary(skills);

  const handleClose = () => {
    setState(p => ({ ...p, activeApp: 'none' }));
  };

  const handleStartTraining = (category: 'songwriting' | 'recording' | 'production', subSkillKey: string) => {
    const currentSubSkill = (skills[category] as any)?.[subSkillKey] as SubSkill | undefined;
    if (!currentSubSkill) return;

    if (currentSubSkill.level >= currentSubSkill.maxLevel) {
      setInfoModal({
        title: 'Max Mastery Reached',
        desc: `${currentSubSkill.name} has already reached maximum mastery (Level ${currentSubSkill.maxLevel}).`
      });
      return;
    }

    if (currentSubSkill.training?.isTraining) {
      setInfoModal({
        title: 'Training Already In Progress',
        desc: `${currentSubSkill.name} is currently in session. Advance time for ${currentSubSkill.training.daysRemaining} days on the Dashboard to complete this level.`
      });
      return;
    }

    const cost = calculateSkillUpgradeCost(currentSubSkill.level);
    if (state.money < cost) {
      setInfoModal({
        title: 'Insufficient Studio Funds',
        desc: `You need $${cost.toLocaleString()} to begin training ${currentSubSkill.name}. Current balance: $${state.money.toLocaleString()}`
      });
      return;
    }

    const targetLevel = currentSubSkill.level + 1;
    const trainingDays = calculateTrainingDays(targetLevel);

    const updatedSubSkill: SubSkill = {
      ...currentSubSkill,
      training: {
        isTraining: true,
        targetLevel,
        daysRemaining: trainingDays,
        totalDays: trainingDays
      }
    };

    const nextSkills: PlayerSkillState = {
      ...skills,
      [category]: {
        ...skills[category],
        [subSkillKey]: updatedSubSkill
      },
      totalPointsSpent: (skills.totalPointsSpent || 0) + cost
    };

    setState(prev => ({
      ...prev,
      money: prev.money - cost,
      skills: nextSkills
    }));

    setNotification(`Enrolled in ${currentSubSkill.name} → Lv. ${targetLevel} (${trainingDays} days)`);
    setTimeout(() => setNotification(null), 3200);
  };

  // Active trainings across all 3 categories
  const activeTrainingsList = useMemo(() => {
    const list: { category: 'songwriting' | 'recording' | 'production'; key: string; skill: SubSkill }[] = [];
    (['songwriting', 'recording', 'production'] as const).forEach(cat => {
      Object.entries(skills[cat] || {}).forEach(([k, s]) => {
        if (s?.training?.isTraining) {
          list.push({ category: cat, key: k, skill: s });
        }
      });
    });
    return list;
  }, [skills]);

  const currentSkillsEntries = useMemo(() => {
    const raw = Object.entries(skills[activeCategory] || {}) as [string, SubSkill][];
    if (filterMode === 'training') {
      return raw.filter(([, s]) => !!s.training?.isTraining);
    }
    if (filterMode === 'mastered') {
      return raw.filter(([, s]) => s.level >= s.maxLevel);
    }
    return raw;
  }, [skills, activeCategory, filterMode]);

  return (
    <div className="fixed inset-0 bg-[#F4F4F6] z-50 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-6 duration-300 font-sans">
      {/* Top App Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center active:scale-95 transition cursor-pointer"
          >
            <i className="ph-bold ph-arrow-left text-base"></i>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-neutral-900 tracking-tight">Mastery Academy</h2>
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-bold tracking-wide">
                {masteryRank.title}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">22 Studio Disciplines · Craft & Sonic Architecture</p>
          </div>
        </div>

        <button 
          onClick={handleClose}
          className="text-xs font-bold text-neutral-900 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full transition cursor-pointer"
        >
          Done
        </button>
      </header>

      {/* Main Scrollable App Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-16">
        {/* Hero Conservatory Mastery Card */}
        <div className="bg-[#0B0C10] text-white rounded-2xl p-5 shadow-lg border border-neutral-800 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-1.5">
                <i className="ph-fill ph-crown text-amber-400 text-xs"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Artist Craft Index
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mt-0.5">
                {masteryRank.score} <span className="text-sm font-semibold text-neutral-500">/ {masteryRank.maxScore}</span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Next Rank: <span className="text-white font-semibold">{masteryRank.nextRankTitle}</span> ({Math.max(0, masteryRank.nextRankScore - masteryRank.score)} pts left)
              </p>
            </div>

            <div className="text-right bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Studio Funds</div>
              <div className="text-base font-black text-emerald-400 mt-0.5 tabular-nums">${formatNum(state.money)}</div>
            </div>
          </div>

          {/* Overall Progress Meter */}
          <div className="space-y-1.5 pb-3.5 border-b border-white/10 relative z-10">
            <div className="flex justify-between text-[11px] font-semibold text-neutral-400">
              <span>Academy Completion</span>
              <span className="text-white tabular-nums">{Math.round((masteryRank.score / masteryRank.maxScore) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (masteryRank.score / masteryRank.maxScore) * 100)}%` }}
              />
            </div>
          </div>

          {/* 3-Pillar Discipline Averages */}
          <div className="grid grid-cols-3 gap-2 py-3 border-b border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Songwriting</div>
              <div className="text-sm font-black text-white mt-0.5 tabular-nums">Lv. {masteryRank.categoryAverages.songwriting}</div>
              <div className="text-[9px] text-purple-300 font-medium">8 Disciplines</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Recording</div>
              <div className="text-sm font-black text-white mt-0.5 tabular-nums">Lv. {masteryRank.categoryAverages.recording}</div>
              <div className="text-[9px] text-rose-300 font-medium">8 Disciplines</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Production</div>
              <div className="text-sm font-black text-white mt-0.5 tabular-nums">Lv. {masteryRank.categoryAverages.production}</div>
              <div className="text-[9px] text-sky-300 font-medium">6 Disciplines</div>
            </div>
          </div>

          {/* Real Commercial Market Impact Driven by Skills */}
          <div className="pt-3 grid grid-cols-3 gap-2 text-left">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <i className="ph-fill ph-headphones text-emerald-400"></i>
                <span>DSP Boost</span>
              </div>
              <div className="text-sm font-black text-emerald-400 mt-0.5 tabular-nums">
                {marketSynergy.streamingBoost}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                {marketSynergy.longevityBonus}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <i className="ph-fill ph-shopping-bag text-sky-400"></i>
                <span>Pure Sales</span>
              </div>
              <div className="text-sm font-black text-sky-400 mt-0.5 tabular-nums">
                {marketSynergy.salesBoost}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                iTunes conversion
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <i className="ph-fill ph-broadcast text-amber-400"></i>
                <span>Airplay</span>
              </div>
              <div className="text-sm font-black text-amber-400 mt-0.5 tabular-nums">
                {marketSynergy.radioBoost}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                {marketSynergy.programmerBonus}
              </div>
            </div>
          </div>
        </div>

        {/* Active Training Sessions Queue */}
        {activeTrainingsList.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-amber-300/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  Active Studio Training ({activeTrainingsList.length})
                </span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Advances Daily
              </span>
            </div>

            <div className="space-y-2">
              {activeTrainingsList.map(({ skill }, idx) => {
                const t = skill.training!;
                const elapsed = Math.max(0, t.totalDays - t.daysRemaining);
                const pct = Math.min(100, Math.round((elapsed / Math.max(1, t.totalDays)) * 100));
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <i className={`ph-fill ${skill.icon} text-amber-600`}></i>
                        <span>{skill.name}</span>
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Lv. {skill.level} → {t.targetLevel}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 tabular-nums">
                        {t.daysRemaining}d left ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(12, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upgrade Notification */}
        {notification && (
          <div className="bg-neutral-900 text-white text-xs font-semibold px-4 py-3 rounded-xl text-center shadow-lg animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2 border border-neutral-700">
            <i className="ph-fill ph-check-circle text-emerald-400 text-base"></i>
            <span>{notification}</span>
          </div>
        )}

        {/* Category Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-200/80 rounded-xl">
          {[
            { id: 'songwriting', label: 'Songwriting', icon: 'ph-pen-nib', avg: masteryRank.categoryAverages.songwriting },
            { id: 'recording', label: 'Recording', icon: 'ph-microphone-stage', avg: masteryRank.categoryAverages.recording },
            { id: 'production', label: 'Production', icon: 'ph-Sliders', avg: masteryRank.categoryAverages.production }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center ${
                activeCategory === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-semibold text-neutral-400 mt-0.5">Avg Lv. {tab.avg}</span>
            </button>
          ))}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {(['all', 'training', 'mastered'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                  filterMode === mode
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {mode === 'all' ? 'All Disciplines' : mode === 'training' ? 'In Training' : 'Mastered'}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-neutral-500 font-semibold">
            {currentSkillsEntries.length} shown
          </span>
        </div>

        {/* Category Subskills List */}
        <div className="space-y-3">
          {currentSkillsEntries.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200/80">
              <p className="text-sm font-bold text-neutral-800">No disciplines match this filter</p>
              <p className="text-xs text-neutral-500 mt-1">Switch back to "All Disciplines" to view and train skills.</p>
            </div>
          ) : (
            currentSkillsEntries.map(([subKey, subSkill]) => {
              const isMax = subSkill.level >= subSkill.maxLevel;
              const targetLevel = subSkill.level + 1;
              const cost = calculateSkillUpgradeCost(subSkill.level);
              const trainingDays = calculateTrainingDays(targetLevel);
              const canAfford = state.money >= cost;
              const isCurrentlyTraining = !!subSkill.training?.isTraining;
              const daysRemaining = subSkill.training?.daysRemaining || 0;
              const totalDays = subSkill.training?.totalDays || trainingDays;
              const tierInfo = getSkillTierLabel(subSkill.level);
              const scaledBonus = formatScaledBonus(subSkill.bonusEffect, subSkill.level);

              return (
                <div 
                  key={subKey}
                  className={`bg-white rounded-2xl p-4 border transition-all space-y-3 ${
                    isCurrentlyTraining 
                      ? 'border-amber-400 shadow-sm ring-1 ring-amber-400/20' 
                      : isMax
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-neutral-200/90 shadow-xs hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 mt-0.5 ${
                        isMax
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : isCurrentlyTraining
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-neutral-100 border-neutral-200/80 text-neutral-800'
                      }`}>
                        <i className={`ph-fill ${subSkill.icon}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="text-sm font-black text-neutral-900 leading-snug">{subSkill.name}</h4>
                          <span className="text-xs font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200 tabular-nums">
                            Lv. {subSkill.level}/{subSkill.maxLevel}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierInfo.badgeClass}`}>
                            {tierInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed mt-1">
                          {subSkill.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Level Pips (1 to 10 visual indicators with milestone markers at 5 and 10) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const filled = idx < subSkill.level;
                        const inTrainingTarget = isCurrentlyTraining && idx === subSkill.level;
                        return (
                          <div 
                            key={idx}
                            className={`h-2 flex-1 rounded-xs transition-all ${
                              filled 
                                ? isMax ? 'bg-emerald-600' : 'bg-neutral-900' 
                                : inTrainingTarget 
                                ? 'bg-amber-400 animate-pulse' 
                                : 'bg-neutral-100 border border-neutral-200/70'
                            }`}
                          />
                        );
                      })}
                    </div>
                    {isCurrentlyTraining && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 pt-0.5">
                        <span>Session Progress: {Math.max(0, totalDays - daysRemaining)}/{totalDays} days completed</span>
                        <span>{daysRemaining}d remaining</span>
                      </div>
                    )}
                  </div>

                  {/* Perk and Action row */}
                  <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-neutral-100 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Active Craft Buff</div>
                      <div className="text-xs text-neutral-800 font-bold truncate mt-0.5">
                        {scaledBonus.currentText}
                        {!isMax && (
                          <span className="text-emerald-600 font-extrabold ml-1.5">
                            (Next: {scaledBonus.nextText})
                          </span>
                        )}
                      </div>
                    </div>

                    {isMax ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shrink-0 flex items-center gap-1">
                        <i className="ph-fill ph-seal-check"></i>
                        <span>Mastered</span>
                      </span>
                    ) : isCurrentlyTraining ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shrink-0 flex items-center gap-1.5">
                        <i className="ph-bold ph-hourglass animate-spin"></i>
                        <span>{daysRemaining}d left</span>
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => handleStartTraining(activeCategory, subKey)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          canAfford 
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs' 
                            : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                        }`}
                      >
                        <i className="ph-bold ph-trend-up"></i>
                        <span>Train (${cost.toLocaleString()} · {trainingDays}d)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

