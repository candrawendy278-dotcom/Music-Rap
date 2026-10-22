import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNumFull, formatMoney } from '../../constants';
import { getEnsuredSkillState } from '../../data/skillSystemEngine';
import { getDetailedFanDemographics } from '../../data/fansSystemEngine';
import {
  triggerRivalCounterReleaseOnPlayerDrop,
  injectRivalCounterReleaseIntoNpcCatalog,
  getEnsuredRivalState
} from '../../data/rivalBeefSystemEngine';

interface EnhancedReleaseModalProps {
  onClose: () => void;
}

const DISTRIBUTORS = [
  {
    id: 'indie',
    name: 'Independent Distro',
    cost: 0,
    hypeMult: 1.0,
    potMult: 1.0,
    badge: 'Free · 100% Independent',
    desc: 'Direct-to-DSP upload. Standard algorithmic discovery with zero upfront fee.'
  },
  {
    id: 'boutique',
    name: 'Boutique Indie Label',
    cost: 1000,
    hypeMult: 1.15,
    potMult: 1.08,
    badge: '$1,000 · Editorial Pitching',
    desc: 'Curated indie playlist pitching and blog coverage (+15% Hype & +8% Reach).'
  },
  {
    id: 'major',
    name: 'Major Record Label',
    cost: 5000,
    hypeMult: 1.35,
    potMult: 1.18,
    badge: '$5,000 · DSP Frontpage',
    desc: 'Priority Spotify & Apple Music New Music Friday placement (+35% Hype & +18% Reach).'
  },
  {
    id: 'global',
    name: 'Global Music Conglomerate',
    cost: 20000,
    hypeMult: 1.75,
    potMult: 1.32,
    badge: '$20,000 · Worldwide Syndicate',
    desc: 'Global radio syndication, banner takeovers & physical retail push (+75% Hype & +32% Reach).'
  }
] as const;

const MARKETING_CAMPAIGNS = [
  {
    id: 'indie',
    name: 'Organic Social Drop',
    cost: 0,
    baseHypeBoost: 10,
    badge: 'Free · +10 Base Hype',
    desc: 'Word-of-mouth rollout driven by your existing fanbase and X timeline.'
  },
  {
    id: 'ad_campaign',
    name: 'Viral Digital & Short-Form Ads',
    cost: 8000,
    baseHypeBoost: 35,
    badge: '$8,000 · +35 Base Hype',
    desc: 'Targeted algorithmic audio ads, creator sound trends, and pre-save campaigns.'
  },
  {
    id: 'major_push',
    name: 'Global Press, Times Square & Radio Blitz',
    cost: 30000,
    baseHypeBoost: 70,
    badge: '$30,000 · +70 Base Hype',
    desc: 'Full-scale blockbuster era rollout: billboards, late-night press & pop radio impact.'
  }
] as const;

export default function EnhancedReleaseModal({ onClose }: EnhancedReleaseModalProps) {
  const { state, setState, setInfoModal } = useGameContext();

  const todayStr = state.date.split('T')[0];

  const releaseItems = useMemo(() => {
    const singles = state.songs
      .filter(s => s.status === 'recorded')
      .map(s => ({
        key: `song_${s.id}`,
        kind: 'single' as const,
        id: s.id,
        title: s.title,
        subtitle: `${s.subgenre || s.genre} · Standalone Single`,
        cover: s.cover,
        quality: Math.round(s.quality || 50),
        trackCount: 1,
        hasCollab: s.collabId && s.collabId !== 'none'
      }));

    const projects = state.projects
      .filter(p => p.status === 'created')
      .map(p => ({
        key: `proj_${p.id}`,
        kind: 'project' as const,
        id: p.id,
        title: p.title,
        subtitle: `${p.type === 'album' ? 'Studio Album' : p.type === 'ep' ? 'EP' : 'Single Pack'} · ${p.songs.length} Tracks`,
        cover: p.cover,
        quality: Math.round(p.quality || 50),
        trackCount: p.songs.length,
        hasCollab: p.songs.some(s => s.collabId && s.collabId !== 'none')
      }));

    return [...projects, ...singles];
  }, [state.songs, state.projects]);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [releaseTarget, setReleaseTarget] = useState<string>(
    releaseItems.length > 0 ? releaseItems[0].key : ''
  );
  const [distributor, setDistributor] = useState<string>('indie');
  const [strategy, setStrategy] = useState<string>('indie');
  const [releaseDate, setReleaseDate] = useState<string>(todayStr);

  const selectedItem = releaseItems.find(item => item.key === releaseTarget);
  const activeDistro = DISTRIBUTORS.find(d => d.id === distributor) || DISTRIBUTORS[0];
  const activeCampaign = MARKETING_CAMPAIGNS.find(c => c.id === strategy) || MARKETING_CAMPAIGNS[0];

  const totalCost = activeDistro.cost + activeCampaign.cost;
  const isImmediateRelease = releaseDate <= todayStr;

  // Commercial & Hype Forecast Calculation
  const forecast = useMemo(() => {
    if (!selectedItem) {
      return {
        hypeGain: 0,
        projectedHype: state.hype || 0,
        basePotential: 0,
        estFirstDayStreams: 0,
        estFirstWeekPureSales: 0
      };
    }

    const rawHypeBoost = activeCampaign.baseHypeBoost * activeDistro.hypeMult;
    const projectedHype = Math.min(100, Number(((state.hype || 0) + rawHypeBoost).toFixed(1)));
    const hypeGain = Number((projectedHype - (state.hype || 0)).toFixed(1));

    const tierMultiplier = state.artist?.tier === 1 ? 1.4 : state.artist?.tier === 2 ? 1.7 : 1.0;
    const collabBonus = selectedItem.hasCollab ? 25 : 0;

    const rawPot =
      selectedItem.kind === 'single'
        ? ((selectedItem.quality * 0.5) + ((state.popularity || 0) * 0.3) + (projectedHype * 0.2) + collabBonus) *
          tierMultiplier *
          activeDistro.potMult
        : ((selectedItem.quality * 0.5) + ((state.popularity || 0) * 0.4) + (projectedHype * 0.15)) *
          tierMultiplier *
          activeDistro.potMult;

    const skills = getEnsuredSkillState(state.skills);
    const fanDemo = getDetailedFanDemographics(state.fans ?? 250, state.popularity || 0, projectedHype, skills);

    const singleDayStreamEst = Math.round(
      (rawPot * 950 + fanDemo.dailyStreamingFloor) * (1 + projectedHype / 120)
    );
    const estFirstDayStreams =
      selectedItem.kind === 'project'
        ? Math.round(singleDayStreamEst * Math.min(selectedItem.trackCount, 12) * 0.68)
        : singleDayStreamEst;

    const estFirstWeekPureSales = Math.round(
      (fanDemo.superfansStans * 0.42 + rawPot * 45) *
        fanDemo.pureSalesMultiplier *
        (selectedItem.kind === 'project' ? 1.65 : 0.75)
    );

    return {
      hypeGain,
      projectedHype,
      basePotential: Math.round(rawPot),
      estFirstDayStreams,
      estFirstWeekPureSales
    };
  }, [selectedItem, activeCampaign, activeDistro, state.hype, state.popularity, state.fans, state.artist, state.skills]);

  const handleSubmit = () => {
    if (!selectedItem) return;

    if (state.money < totalCost) {
      return setInfoModal({
        title: 'Insufficient Funds',
        desc: `You need ${formatMoney(totalCost)} for this distribution and marketing rollout (Available: ${formatMoney(state.money)}).`
      });
    }

    const newMoney = state.money - totalCost;
    const newHype = forecast.projectedHype;
    const tierMultiplier = state.artist?.tier === 1 ? 1.4 : state.artist?.tier === 2 ? 1.7 : 1.0;
    const targetStatus = isImmediateRelease ? 'released' : 'scheduled';

    setState(p => {
      const nextP = { ...p, money: newMoney, hype: newHype };

      if (releaseTarget.startsWith('song_')) {
        const id = parseInt(releaseTarget.split('_')[1]);
        nextP.songs = nextP.songs.map(s => {
          if (s.id === id) {
            const collabBonus = s.collabId && s.collabId !== 'none' ? 25 : 0;
            const calcPot =
              ((s.quality * 0.5) + (state.popularity * 0.3) + (newHype * 0.2) + collabBonus) *
              tierMultiplier *
              activeDistro.potMult;
            return {
              ...s,
              status: targetStatus,
              releaseDate,
              trackType: 'single' as const,
              basePotential: calcPot
            };
          }
          return s;
        });
      } else if (releaseTarget.startsWith('proj_')) {
        const id = parseInt(releaseTarget.split('_')[1]);
        let projBasePot = 0;

        nextP.projects = nextP.projects.map(pr => {
          if (pr.id === id) {
            projBasePot =
              ((pr.quality * 0.5) + (state.popularity * 0.4) + (newHype * 0.15)) *
              tierMultiplier *
              activeDistro.potMult;
            return { ...pr, status: targetStatus, releaseDate, basePotential: projBasePot };
          }
          return pr;
        });

        const project = state.projects.find(pr => pr.id === id);
        if (project) {
          const projSongIds = project.songs.map(s => s.id);
          nextP.songs = nextP.songs.map(s => {
            if (projSongIds.includes(s.id)) {
              if (s.status !== 'released') {
                return {
                  ...s,
                  status: targetStatus,
                  releaseDate,
                  trackType: project.type === 'single_pack' ? ('single' as const) : ('b_side' as const),
                  basePotential:
                    projBasePot *
                    (project.type === 'single_pack'
                      ? 0.95
                      : 0.58 + (s.quality / 100) * 0.25 + (s.collabId !== 'none' ? 0.2 : 0.0)),
                  cover: project.cover
                };
              } else {
                return {
                  ...s,
                  trackType: 'lead_single' as const
                };
              }
            }
            return s;
          });

          nextP.projects = nextP.projects.map(pr => {
            if (pr.id === id) {
              return {
                ...pr,
                songs: pr.songs.map(ps => ({
                  ...ps,
                  status: targetStatus === 'released' || ps.status === 'released' ? 'released' : 'scheduled',
                  basePotential: ps.status !== 'released' ? projBasePot * 0.75 : ps.basePotential,
                  cover: pr.cover
                }))
              };
            }
            return pr;
          });
        }
      }

      // Trigger Rival Chart-Block Counter-Release when player drops a Single or Project!
      if (isImmediateRelease) {
        const rivalDrop = triggerRivalCounterReleaseOnPlayerDrop(
          nextP,
          selectedItem.title,
          selectedItem.kind,
          forecast.estFirstDayStreams
        );
        (nextP as any).rivalState = rivalDrop.updatedRivalState;
        nextP.xPosts = [...rivalDrop.counterDropTweets, ...(nextP.xPosts || [])];
        injectRivalCounterReleaseIntoNpcCatalog(nextP);
      }

      return nextP;
    });

    const activeRival = getEnsuredRivalState(state);

    if (isImmediateRelease) {
      setInfoModal({
        title: 'Worldwide Release Live & Rival Chart Alert!',
        desc: `"${selectedItem.title}" is now out globally (+${forecast.hypeGain}% Hype)! 🚨 CHART BLOCK ALERT: Your rival ${activeRival.rivalName} just surprise-dropped on the exact same day to try and block you from #1 on the charts!`
      });
    } else {
      setInfoModal({
        title: 'Global Release Scheduled',
        desc: `"${selectedItem.title}" is locked in for ${releaseDate} via ${activeDistro.name}. Pre-release Hype surged to ${newHype.toFixed(1)}% (+${forecast.hypeGain}%).`
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F7] w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Global Distribution
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs font-semibold text-neutral-600">Step {currentStep} of 2</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight mt-1">
              {currentStep === 1 ? 'Select Master & Release Date' : 'Distributor & Marketing Rollout'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* Stepper */}
        <div className="px-5 pt-3 pb-2.5 bg-white border-b border-neutral-100">
          <div className="grid grid-cols-2 gap-3">
            {[
              { num: 1, name: 'Master Selection & Date' },
              { num: 2, name: 'Distribution & Campaign' }
            ].map(s => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num as 1 | 2)}
                  className="text-left cursor-pointer"
                >
                  <div className="h-1.5 rounded-full overflow-hidden bg-neutral-100 mb-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCurrent ? 'bg-neutral-900 w-full' : isPast ? 'bg-emerald-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      0{s.num}
                    </span>
                    <span className={`text-[11px] font-semibold ${isCurrent ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {s.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {releaseItems.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 text-xl mx-auto">
              <i className="ph-bold ph-rocket-launch"></i>
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">No Masters Ready for Release</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Finish recording a song in the Recording Studio or package a project in Create Project before launching a release.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl mt-2 active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Select Recorded Single or Packaged Project ({releaseItems.length})
                      </label>
                    </div>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {releaseItems.map(item => {
                        const isSelected = releaseTarget === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => setReleaseTarget(item.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <img
                              src={item.cover}
                              alt={item.title}
                              className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200/60"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-neutral-900 truncate">{item.title}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                                  Master {item.quality}/100
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">{item.subtitle}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    item.kind === 'project'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-purple-50 text-purple-700'
                                  }`}
                                >
                                  {item.kind === 'project' ? 'Project Release' : 'Single Release'}
                                </span>
                                {item.hasCollab && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Feat. Collab (+25 Pot)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Release Date Timing */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Release Schedule</div>
                        <div className="text-[11px] text-neutral-500">
                          Drop immediately today or schedule a future launch date
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isImmediateRelease
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isImmediateRelease ? 'Immediate Drop' : `Scheduled: ${releaseDate}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReleaseDate(todayStr)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isImmediateRelease
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        Drop Today ({todayStr})
                      </button>
                      <input
                        type="date"
                        value={releaseDate}
                        min={todayStr}
                        onChange={e => setReleaseDate(e.target.value || todayStr)}
                        className="bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Digital Distributor Selection */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Digital Distribution Partner
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {DISTRIBUTORS.map(d => {
                        const isSelected = distributor === d.id;
                        return (
                          <div
                            key={d.id}
                            onClick={() => setDistributor(d.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-neutral-900">{d.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                                  {d.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5">{d.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Marketing Campaign Selection */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Marketing & Promotional Rollout
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {MARKETING_CAMPAIGNS.map(c => {
                        const isSelected = strategy === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setStrategy(c.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-neutral-900">{c.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200/60">
                                  {c.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5">{c.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-Time Commercial Forecast Card */}
                  <div className="bg-neutral-900 text-white rounded-xl p-4 border border-neutral-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Commercial Rollout Forecast
                        </span>
                        <div className="text-xs text-neutral-300 mt-0.5">
                          {selectedItem?.title} · {activeDistro.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">
                          Hype: {(state.hype || 0).toFixed(0)}% → {forecast.projectedHype}% (+{forecast.hypeGain}%)
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          Total Budget: {totalCost > 0 ? formatMoney(totalCost) : 'Free'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-center">
                      <div className="bg-neutral-800/70 rounded-lg p-2">
                        <div className="text-[10px] text-neutral-400">Est. Day 1 Streams</div>
                        <div className="text-xs font-black text-white mt-0.5">
                          ~{formatNumFull(forecast.estFirstDayStreams)}
                        </div>
                      </div>
                      <div className="bg-neutral-800/70 rounded-lg p-2">
                        <div className="text-[10px] text-neutral-400">Est. Week 1 Sales</div>
                        <div className="text-xs font-black text-emerald-400 mt-0.5">
                          ~{formatNumFull(forecast.estFirstWeekPureSales)}
                        </div>
                      </div>
                      <div className="bg-neutral-800/70 rounded-lg p-2">
                        <div className="text-[10px] text-neutral-400">Hit Potential</div>
                        <div className="text-xs font-black text-amber-300 mt-0.5">
                          {forecast.basePotential} Pts
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-3.5 border-t border-neutral-200/80 bg-white flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ph-bold ph-arrow-left"></i>
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep === 1 ? (
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>Next: Distribution & Promo</span>
                  <i className="ph-bold ph-arrow-right"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <i className="ph-fill ph-rocket-launch text-white text-sm"></i>
                  <span>
                    {isImmediateRelease ? 'Launch Worldwide Now' : 'Confirm Scheduled Drop'} (
                    {totalCost > 0 ? formatMoney(totalCost) : 'Free'})
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
