import React, { useState } from 'react';
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

interface SkillSystemModalProps {
  onClose: () => void;
}

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

export default function SkillSystemModal({ onClose }: SkillSystemModalProps) {
  const { state, setState, setInfoModal } = useGameContext();
  const [activeTab, setActiveTab] = useState<'songwriting' | 'recording' | 'production'>('songwriting');
  const [notification, setNotification] = useState<string | null>(null);

  const skills = getEnsuredSkillState(state.skills);
  const masteryRank = calculateMasteryRank(skills);
  const marketSynergy = getArtistMarketSynergySummary(skills);

  const handleStartTraining = (category: 'songwriting' | 'recording' | 'production', subSkillKey: string) => {
    const currentSubSkill = (skills[category] as any)?.[subSkillKey] as SubSkill | undefined;
    if (!currentSubSkill) return;

    if (currentSubSkill.level >= currentSubSkill.maxLevel) {
      setInfoModal({
        title: 'Max Mastery Reached',
        desc: `${currentSubSkill.name} has reached maximum mastery (Level ${currentSubSkill.maxLevel}).`
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
    setTimeout(() => setNotification(null), 3000);
  };

  const currentSkills = skills[activeTab] || {};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FBFBFD] w-full max-w-lg rounded-2xl shadow-xl border border-neutral-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-neutral-900 tracking-tight">Mastery Academy</h3>
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-bold">
                {masteryRank.title}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Next Rank: <span className="font-semibold text-neutral-800">{masteryRank.nextRankTitle}</span> ({Math.max(0, masteryRank.nextRankScore - masteryRank.score)} pts left)
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer"
          >
            <i className="ph-bold ph-x text-base"></i>
          </button>
        </div>

        {/* Overview bar with Commercial Market Impact */}
        <div className="px-5 py-3 bg-neutral-900 text-white space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-400 font-medium">Mastery Index:</span>{' '}
              <span className="font-black text-white tabular-nums">{masteryRank.score} / {masteryRank.maxScore}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-medium">Studio Funds:</span>{' '}
              <span className="font-black text-emerald-400 tabular-nums">${formatNum(state.money)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px]">
            <div>
              <span className="text-neutral-400">DSP Streams:</span>{' '}
              <span className="font-bold text-emerald-400">{marketSynergy.streamingBoost}</span>
            </div>
            <div>
              <span className="text-neutral-400">Pure Sales:</span>{' '}
              <span className="font-bold text-sky-400">{marketSynergy.salesBoost}</span>
            </div>
            <div>
              <span className="text-neutral-400">Radio Airplay:</span>{' '}
              <span className="font-bold text-amber-400">{marketSynergy.radioBoost}</span>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-4 mt-3 bg-neutral-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl text-center shadow-md animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
            <i className="ph-fill ph-check-circle text-emerald-400 text-sm"></i>
            <span>{notification}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            {([
              { id: 'songwriting', label: 'Songwriting', avg: masteryRank.categoryAverages.songwriting },
              { id: 'recording', label: 'Recording', avg: masteryRank.categoryAverages.recording },
              { id: 'production', label: 'Production', avg: masteryRank.categoryAverages.production }
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center ${
                  activeTab === t.id
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <span>{t.label}</span>
                <span className="text-[10px] font-medium text-neutral-400">Avg Lv. {t.avg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subskills List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(Object.entries(currentSkills) as [string, SubSkill][]).map(([subKey, subSkill]) => {
            const isMax = subSkill.level >= subSkill.maxLevel;
            const targetLevel = subSkill.level + 1;
            const cost = calculateSkillUpgradeCost(subSkill.level);
            const trainingDays = calculateTrainingDays(targetLevel);
            const canAfford = state.money >= cost;
            const isCurrentlyTraining = !!subSkill.training?.isTraining;
            const daysRemaining = subSkill.training?.daysRemaining || 0;
            const tierInfo = getSkillTierLabel(subSkill.level);
            const scaledBonus = formatScaledBonus(subSkill.bonusEffect, subSkill.level);

            return (
              <div 
                key={subKey}
                className={`bg-white rounded-xl p-3.5 border transition-all space-y-2.5 ${
                  isCurrentlyTraining 
                    ? 'border-amber-300 shadow-xs bg-amber-50/20' 
                    : 'border-neutral-200/80 shadow-xs hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-700 text-base shrink-0 mt-0.5">
                      <i className={`ph-fill ${subSkill.icon}`}></i>
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <h4 className="text-sm font-bold text-neutral-900">{subSkill.name}</h4>
                        <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                          Lv. {subSkill.level}/{subSkill.maxLevel}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tierInfo.badgeClass}`}>
                          {tierInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-snug mt-0.5 line-clamp-2">
                        {subSkill.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Level Pips */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const filled = idx < subSkill.level;
                    const inTrainingTarget = isCurrentlyTraining && idx === subSkill.level;
                    return (
                      <div 
                        key={idx}
                        className={`h-1.5 flex-1 rounded-xs transition-all ${
                          filled 
                            ? 'bg-neutral-900' 
                            : inTrainingTarget 
                            ? 'bg-amber-400 animate-pulse' 
                            : 'bg-neutral-100 border border-neutral-200/50'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Perk and Action row */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
                  <div className="text-[11px] text-neutral-700 font-semibold truncate">
                    {scaledBonus.currentText}
                    {!isMax && (
                      <span className="text-emerald-600 font-bold ml-1">
                        (Next: {scaledBonus.nextText})
                      </span>
                    )}
                  </div>

                  {isMax ? (
                    <span className="text-[11px] font-bold text-emerald-600">Mastered</span>
                  ) : isCurrentlyTraining ? (
                    <span className="text-[11px] font-bold text-amber-700">
                      Training ({daysRemaining}d)
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => handleStartTraining(activeTab, subKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer ${
                        canAfford 
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs' 
                          : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                      }`}
                    >
                      Train (${cost.toLocaleString()} · {trainingDays}d)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200/80 bg-white text-center text-xs text-neutral-400 font-normal">
          Training progresses naturally when advancing days on your Dashboard.
        </div>
      </div>
    </div>
  );
}

