import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { 
  getEnsuredSkillState, 
  RECORDING_VOCAL_STYLES, 
  AUDIO_ENGINEERING_OPTIONS, 
  calculateRecordingQualityBoost,
  getSkillTierLabel
} from '../../data/skillSystemEngine';

interface EnhancedRecordingStudioProps {
  onClose: () => void;
}

export default function EnhancedRecordingStudio({ onClose }: EnhancedRecordingStudioProps) {
  const { state, setState, setInfoModal } = useGameContext();

  const writtenSongs = state.songs.filter(s => s.status === 'written');

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [selectedSongId, setSelectedSongId] = useState<string>(
    writtenSongs.length > 0 ? writtenSongs[0].id.toString() : ''
  );
  const [studioType, setStudioType] = useState<'home' | 'pro'>('home');
  const [recordDays, setRecordDays] = useState('2');
  const [selectedVocalId, setSelectedVocalId] = useState(RECORDING_VOCAL_STYLES[0].id);
  const [selectedAudioId, setSelectedAudioId] = useState(AUDIO_ENGINEERING_OPTIONS[0].id);

  const skills = getEnsuredSkillState(state.skills);

  const targetSong = state.songs.find(s => s.id === parseInt(selectedSongId));

  // Deterministic recording boost calculation driven by actual skills
  const recordingBoostCalc = useMemo(() => {
    if (!targetSong) {
      return {
        qualityBoost: 0,
        finalQuality: 0,
        expectedRange: [0, 0] as [number, number],
        breakdown: { studioBase: 0, skillsBoost: 0, vocalSynergy: 0, audioSynergy: 0, durationBoost: 0 }
      };
    }

    return calculateRecordingQualityBoost({
      skills,
      currentSongQuality: targetSong.quality || 50,
      vocalStyleId: selectedVocalId,
      audioEngineeringId: selectedAudioId,
      studioType,
      recordingDays: parseInt(recordDays),
      deterministic: true
    });
  }, [skills, targetSong, selectedVocalId, selectedAudioId, studioType, recordDays]);

  const handleSubmit = () => {
    if (!selectedSongId || !targetSong) {
      return;
    }

    const cost = studioType === 'pro' ? 1500 * parseInt(recordDays) : 0;
    if (state.money < cost) {
      return setInfoModal({
        title: 'Insufficient Funds',
        desc: `You need $${cost.toLocaleString()} for the Commercial Studio session.`
      });
    }

    // Perform authentic session roll on submit
    const sessionRoll = calculateRecordingQualityBoost({
      skills,
      currentSongQuality: targetSong.quality || 50,
      vocalStyleId: selectedVocalId,
      audioEngineeringId: selectedAudioId,
      studioType,
      recordingDays: parseInt(recordDays),
      deterministic: false
    });

    const selectedVocalObj = RECORDING_VOCAL_STYLES.find(v => v.id === selectedVocalId) || RECORDING_VOCAL_STYLES[0];
    const selectedAudioObj = AUDIO_ENGINEERING_OPTIONS.find(a => a.id === selectedAudioId) || AUDIO_ENGINEERING_OPTIONS[0];

    const newMoney = state.money - cost;

    setState(prev => ({
      ...prev,
      money: newMoney,
      songs: prev.songs.map(s => {
        if (s.id === targetSong.id) {
          return {
            ...s,
            status: 'recording',
            daysLeft: parseInt(recordDays),
            quality: sessionRoll.finalQuality,
            recordingStyle: selectedVocalObj.name,
            vocalFocus: selectedAudioObj.name
          };
        }
        return s;
      })
    }));

    setInfoModal({
      title: 'Studio Recording Started',
      desc: `"${targetSong.title}" is now tracking in the ${studioType === 'pro' ? 'Commercial Studio' : 'Bedroom Studio'} (${selectedVocalObj.name} · ${selectedAudioObj.name}). Final Master Quality: ${sessionRoll.finalQuality}/100 (+${sessionRoll.qualityBoost} boost). Advance time for ${recordDays} day(s) to finish recording.`
    });

    onClose();
  };

  const stepLabels = [
    { num: 1, name: 'Setup', desc: 'Track & Acoustic Environment' },
    { num: 2, name: 'Vocal Delivery', desc: 'Projection & Flow Cadence' },
    { num: 3, name: 'Mastering', desc: 'Mixing Board & Loudness' }
  ];

  const selectedVocalObj = RECORDING_VOCAL_STYLES.find(v => v.id === selectedVocalId) || RECORDING_VOCAL_STYLES[0];
  const selectedAudioObj = AUDIO_ENGINEERING_OPTIONS.find(a => a.id === selectedAudioId) || AUDIO_ENGINEERING_OPTIONS[0];
  const sessionCost = studioType === 'pro' ? 1500 * parseInt(recordDays) : 0;

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F7] w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                Recording Facility
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs font-semibold text-neutral-600">Step {currentStep} of 3</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight mt-1">
              {stepLabels[currentStep - 1].name}: {stepLabels[currentStep - 1].desc}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* Modern Segmented Stepper */}
        <div className="px-5 pt-3 pb-2.5 bg-white border-b border-neutral-100">
          <div className="grid grid-cols-3 gap-2.5">
            {stepLabels.map(s => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num as any)}
                  className="text-left group transition-all cursor-pointer"
                >
                  <div className="h-1.5 rounded-full overflow-hidden bg-neutral-100 mb-1.5">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-neutral-900 w-full' 
                          : isPast 
                          ? 'bg-emerald-500 w-full' 
                          : 'w-0'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold ${
                      isCurrent ? 'text-neutral-900' : isPast ? 'text-emerald-600' : 'text-neutral-400'
                    }`}>
                      0{s.num}
                    </span>
                    <span className={`text-[10px] font-semibold hidden sm:inline ${
                      isCurrent ? 'text-neutral-900' : 'text-neutral-500'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state if no written songs */}
        {writtenSongs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 text-xl mx-auto">
              <i className="ph-bold ph-music-note"></i>
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">No Written Songs Available</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              You must write a song first in "Create Song" and complete its writing days before entering the recording studio.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl mt-2 active:scale-95 cursor-pointer"
            >
              Close Studio
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Step Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* STEP 1: Select Song & Studio Type */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Select Written Track ({writtenSongs.length} Ready)
                      </label>
                      <span className="text-[11px] text-neutral-400 font-medium">Tap to select</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {writtenSongs.map(s => {
                        const isSelected = selectedSongId === s.id.toString();
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedSongId(s.id.toString())}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <img 
                              src={s.cover} 
                              alt={s.title} 
                              className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0 border border-neutral-200/60" 
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold text-neutral-900 truncate">{s.title}</div>
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md shrink-0">
                                  Writing: {Math.round(s.quality)}/100
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5 truncate">
                                <span className="font-semibold text-neutral-700">{s.subgenre || s.genre}</span>
                                {s.theme && (
                                  <>
                                    <span className="text-neutral-300">·</span>
                                    <span>{s.theme}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Studio Type Cards */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Acoustic Environment
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setStudioType('home')}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                          studioType === 'home' 
                            ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/10 shadow-sm' 
                            : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">Bedroom Studio</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Free</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          +4 Base Boost · Relies heavily on your skills
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioType('pro')}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                          studioType === 'pro' 
                            ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/10 shadow-sm' 
                            : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">Commercial Studio</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">$1,500/d</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          +13 Base Boost · Neve preamps & vocal booth
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Duration Selection */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Tracking Duration (In-game Days)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { d: '1', label: '1 Day', note: studioType === 'pro' ? '+7 Qual · $1.5k' : '+4 Qual · Free' },
                        { d: '2', label: '2 Days', note: studioType === 'pro' ? '+14 Qual · $3k' : '+8 Qual · Free' },
                        { d: '3', label: '3 Days', note: studioType === 'pro' ? '+21 Qual · $4.5k' : '+12 Qual · Free' }
                      ].map(item => (
                        <button
                          key={item.d}
                          type="button"
                          onClick={() => setRecordDays(item.d)}
                          className={`py-2.5 px-2 rounded-xl border text-center transition cursor-pointer ${
                            recordDays === item.d 
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs' 
                              : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${recordDays === item.d ? 'text-emerald-300' : 'text-neutral-400'}`}>
                            {item.note}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Vocal Delivery Style & Flow */}
              {currentStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Vocal Delivery & Flow Style
                    </span>
                    <span className="text-xs text-neutral-500">
                      Synergizes with Recording skills
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {RECORDING_VOCAL_STYLES.map(style => {
                      const isSelected = selectedVocalId === style.id;
                      const skillLevel = skills.recording[style.bestFitSubSkill]?.level || 1;
                      const skillName = skills.recording[style.bestFitSubSkill]?.name || '';
                      const tierBadge = getSkillTierLabel(skillLevel);

                      return (
                        <div
                          key={style.id}
                          onClick={() => setSelectedVocalId(style.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected 
                              ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm' 
                              : 'bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-900 shadow-xs'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                            isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            <i className="ph-fill ph-waveform"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-sm font-bold text-neutral-900 tracking-tight">{style.name}</h5>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierBadge.badgeBg}`}>
                                {skillName} · Lv.{skillLevel}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                              {style.description}
                            </p>
                          </div>
                          <div className="mt-1 shrink-0">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'
                            }`}>
                              {isSelected && <i className="ph-bold ph-check text-[10px]"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Audio Engineering & Final Preview */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Audio Engineering & Saturation Console
                    </span>
                    <span className="text-xs text-neutral-500">
                      Synergizes with Production skills
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {AUDIO_ENGINEERING_OPTIONS.map(opt => {
                      const isSelected = selectedAudioId === opt.id;
                      const skillLevel = skills.production[opt.bestFitSubSkill]?.level || 1;
                      const skillName = skills.production[opt.bestFitSubSkill]?.name || '';
                      const tierBadge = getSkillTierLabel(skillLevel);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedAudioId(opt.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected 
                              ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm' 
                              : 'bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-900 shadow-xs'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                            isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            <i className="ph-fill ph-equalizer"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-sm font-bold text-neutral-900 tracking-tight">{opt.name}</h5>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierBadge.badgeBg}`}>
                                {skillName} · Lv.{skillLevel}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                              {opt.description}
                            </p>
                          </div>
                          <div className="mt-1 shrink-0">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'
                            }`}>
                              {isSelected && <i className="ph-bold ph-check text-[10px]"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Modern Master Quality Projection Card */}
                  <div className="bg-neutral-900 text-white rounded-xl p-4 border border-neutral-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Projected Master Quality
                        </span>
                        <div className="text-xs text-neutral-300 mt-0.5">
                          Writing Base: {targetSong ? Math.round(targetSong.quality) : 0} · Studio Boost: +{recordingBoostCalc.qualityBoost}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white tracking-tight">
                          {recordingBoostCalc.finalQuality}
                          <span className="text-xs font-normal text-neutral-400"> / 100</span>
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-400">
                          Master Range: {recordingBoostCalc.expectedRange[0]}–{recordingBoostCalc.expectedRange[1]}
                        </div>
                      </div>
                    </div>

                    {/* Visual Master Progress Bar */}
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-purple-500 h-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, targetSong?.quality || 0)}%` }} 
                        title="Writing Base Quality"
                      />
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-300" 
                        style={{ width: `${Math.min(100 - (targetSong?.quality || 0), recordingBoostCalc.qualityBoost)}%` }} 
                        title="Recording & Mastering Boost"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-neutral-800">
                      <div className="flex justify-between text-neutral-400">
                        <span>Vocals & Prod Skills:</span>
                        <span className="font-semibold text-white">+{recordingBoostCalc.breakdown.skillsBoost}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Vocal Synergy:</span>
                        <span className="font-semibold text-emerald-400">+{recordingBoostCalc.breakdown.vocalSynergy}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Audio Engineering:</span>
                        <span className="font-semibold text-emerald-400">+{recordingBoostCalc.breakdown.audioSynergy}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Studio & Takes:</span>
                        <span className="font-semibold text-amber-300">
                          +{recordingBoostCalc.breakdown.studioBase + recordingBoostCalc.breakdown.durationBoost}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Session Specs Strip */}
            <div className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-500">
              <div className="truncate max-w-[270px]">
                <span className="font-bold text-neutral-800">{targetSong?.title || 'Track'}</span>
                <span className="mx-1.5 text-neutral-300">·</span>
                <span>{studioType === 'pro' ? 'Commercial Studio' : 'Bedroom'}</span>
                {currentStep >= 2 && (
                  <>
                    <span className="mx-1.5 text-neutral-300">·</span>
                    <span>{selectedVocalObj.name}</span>
                  </>
                )}
              </div>
              <div className="text-right font-bold text-neutral-900 shrink-0">
                Master: {recordingBoostCalc.expectedRange[0]}–{recordingBoostCalc.expectedRange[1]}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-3.5 border-t border-neutral-200/80 bg-white flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as any)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ph-bold ph-arrow-left"></i>
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep((currentStep + 1) as any)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>Next: {stepLabels[currentStep].name}</span>
                  <i className="ph-bold ph-arrow-right"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <i className="ph-fill ph-microphone text-emerald-400 text-sm"></i>
                  <span>Begin Tracking ({sessionCost > 0 ? `$${sessionCost.toLocaleString()}` : 'Free'})</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

