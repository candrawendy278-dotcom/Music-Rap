import React, { useState, useRef, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { resolveAuthenticCover } from '../../data/musicCatalog';
import { NpcCollabCard } from './NpcCollabCard';
import {
  CollabOfferNegotiationPanel,
  SignedCollabContract
} from './CollabOfferNegotiationPanel';
import { formatNumFull } from '../../constants';
import { 
  getEnsuredSkillState, 
  WRITING_THEMES, 
  MEANING_FOCUS_OPTIONS, 
  calculateSongwritingQuality,
  getSkillTierLabel
} from '../../data/skillSystemEngine';
import { compressImageFile } from '../../utils/imageOptimizer';

interface EnhancedWritingWizardProps {
  onClose: () => void;
}

const SUBGENRE_PRESETS: Record<string, string[]> = {
  'Pop': ['Synth-Pop', 'Dance-Pop', 'Alt-Pop', 'Bedroom Pop'],
  'Hip-Hop': ['Melodic Trap', 'Boom Bap', 'Drill', 'Cloud Rap'],
  'R&B': ['Contemporary R&B', 'Alt-R&B', 'Neo-Soul', 'Trap Soul'],
  'Rock': ['Indie Rock', 'Alt-Rock', 'Pop-Punk', 'Post-Punk'],
  'Electronic': ['House', 'Synthwave', 'UK Garage', 'Electropop'],
  'Latin': ['Reggaeton', 'Latin Trap', 'Urbano', 'Latin Pop']
};

export default function EnhancedWritingWizard({ onClose }: EnhancedWritingWizardProps) {
  const { state, setState, setInfoModal } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [subgenre, setSubgenre] = useState('Synth-Pop');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [titleError, setTitleError] = useState(false);

  // Step 2: Theme
  const [selectedThemeId, setSelectedThemeId] = useState(WRITING_THEMES[0].id);

  // Step 3: Meaning & Depth
  const [selectedMeaningId, setSelectedMeaningId] = useState(MEANING_FOCUS_OPTIONS[0].id);

  // Step 4: Writers, Days, Collab & Royalty Negotiation
  const [writer, setWriter] = useState<'self' | 'pro'>('self');
  const [days, setDays] = useState('2');
  const [collab, setCollab] = useState('none');
  const [collabContract, setCollabContract] = useState<SignedCollabContract | null>(null);

  const skills = getEnsuredSkillState(state.skills);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setImagePreview(compressed);
      }
    }
  };

  // Deterministic real-time quality preview driven by player skills
  const qualityCalculation = useMemo(() => {
    let collabBonus = 0;
    if (collab !== 'none') {
      collabBonus = collabContract?.qualityBonus || 5;
    }

    return calculateSongwritingQuality({
      skills,
      themeId: selectedThemeId,
      meaningId: selectedMeaningId,
      writerType: writer,
      writingDays: parseInt(days),
      collabBonus,
      deterministic: true
    });
  }, [skills, selectedThemeId, selectedMeaningId, writer, days, collab, collabContract]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError(true);
      setCurrentStep(1);
      return;
    }

    if (collab !== 'none' && !collabContract?.signed) {
      return setInfoModal({
        title: 'Collaboration Offer Required',
        desc: `Please send a Collaboration Offer (Upfront Fee $ + Royalty Split %) to ${collab} and get their management's approval before starting the session!`
      });
    }

    const writerCost = writer === 'pro' ? 2500 : 0;
    const collabFee = collab !== 'none' && collabContract ? collabContract.agreedFee : 0;
    const totalCost = writerCost + collabFee;

    if (state.money < totalCost) {
      return setInfoModal({ 
        title: 'Insufficient Funds', 
        desc: `You need $${formatNumFull(totalCost)} ($${formatNumFull(writerCost)} Co-Writer + $${formatNumFull(collabFee)} Collab Feature Fee) to start this session.` 
      });
    }

    // Perform authentic session roll on submit
    const sessionRoll = calculateSongwritingQuality({
      skills,
      themeId: selectedThemeId,
      meaningId: selectedMeaningId,
      writerType: writer,
      writingDays: parseInt(days),
      collabBonus: collab !== 'none' ? (collabContract?.qualityBonus || 5) : 0,
      deterministic: false
    });

    const newMoney = state.money - totalCost;
    const cover = imagePreview || resolveAuthenticCover(state.artist?.name || 'Artist', title || 'Single');
    const selectedTheme = WRITING_THEMES.find(t => t.id === selectedThemeId) || WRITING_THEMES[0];
    const selectedMeaning = MEANING_FOCUS_OPTIONS.find(m => m.id === selectedMeaningId) || MEANING_FOCUS_OPTIONS[0];

    const newSong = {
      id: state.songsIdCounter,
      title: title.trim(),
      genre,
      subgenre: subgenre.trim() || `${genre} Core`,
      cover,
      status: 'writing' as const,
      daysLeft: parseInt(days),
      quality: sessionRoll.finalQuality,
      collabId: collab,
      collabFeePaid: collab !== 'none' && collabContract ? collabContract.agreedFee : 0,
      collabRoyaltyPercent: collab !== 'none' && collabContract ? collabContract.agreedRoyaltyPercent : 0,
      collabRoyaltyPaidToday: 0,
      collabRoyaltyPaidTotal: 0,
      theme: selectedTheme.name,
      meaning: selectedMeaning.name,
      writingFocus: selectedMeaning.subSkillBonus,
      basePotential: 0,
      momentum: 1.0,
      streams: 0,
      views: 0,
      pureSales: 0,
      radioPlays: 0,
      hasMV: false,
      mvAdsDays: 0,
      weeklyStreams: 0,
      weeklyViews: 0,
      weeklyPureSales: 0,
      weeklyRadioPlays: 0
    };

    setState(prev => ({
      ...prev,
      money: newMoney,
      songs: [...prev.songs, newSong],
      songsIdCounter: prev.songsIdCounter + 1
    }));

    const collabNote =
      collab !== 'none' && collabContract
        ? ` Collab Contract with ${collab}: $${formatNumFull(collabContract.agreedFee)} upfront fee + ${collabContract.agreedRoyaltyPercent}% backend royalties.`
        : '';

    setInfoModal({
      title: 'Songwriting Session Started',
      desc: `"${title.trim()}" (${genre} · ${subgenre.trim() || 'Core'}) has entered songwriting!${collabNote} Session Writing Quality: ${sessionRoll.finalQuality}/100. Advance time for ${days} day(s) to finish writing.`
    });

    onClose();
  };

  const stepLabels = [
    { num: 1, name: 'Identity', desc: 'Title, Genre & Artwork' },
    { num: 2, name: 'Concept', desc: 'Thematic Narrative' },
    { num: 3, name: 'Depth', desc: 'Lyrical Philosophy' },
    { num: 4, name: 'Session', desc: 'Writers & Tracking' }
  ];

  const selectedTheme = WRITING_THEMES.find(t => t.id === selectedThemeId) || WRITING_THEMES[0];
  const selectedMeaning = MEANING_FOCUS_OPTIONS.find(m => m.id === selectedMeaningId) || MEANING_FOCUS_OPTIONS[0];

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F7] w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                Songwriting Studio
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs font-semibold text-neutral-600">Step {currentStep} of 4</span>
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
          <div className="grid grid-cols-4 gap-2">
            {stepLabels.map(s => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;
              const canClick = s.num < currentStep || (title.trim().length > 0);

              return (
                <button
                  key={s.num}
                  disabled={!canClick}
                  onClick={() => canClick && setCurrentStep(s.num as any)}
                  className={`text-left group transition-all ${canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
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

        {/* Scrollable Step Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: Basic Identity & Cover */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-white rounded-xl border border-neutral-200/80 shadow-xs flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-xl border border-neutral-200 bg-neutral-100 hover:border-neutral-400 flex items-center justify-center cursor-pointer relative overflow-hidden group shrink-0 transition" 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {!imagePreview && (
                    <div className="flex flex-col items-center text-neutral-400 group-hover:text-neutral-700">
                      <i className="ph-bold ph-camera text-xl"></i>
                      <span className="text-[9px] font-semibold mt-1">Artwork</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Single Artwork</div>
                  <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Custom Cover Art</h4>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Upload custom artwork or let the studio generate authentic single cover art automatically.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    Track Title <span className="text-rose-500">*</span>
                  </label>
                  {titleError && !title.trim() && (
                    <span className="text-[11px] font-bold text-rose-500">Please enter a song title</span>
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Blinding Echoes, Midnight Cipher..." 
                  value={title} 
                  onChange={e => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError(false);
                  }} 
                  autoFocus
                  className={`w-full bg-white border ${
                    titleError && !title.trim() ? 'border-rose-400 ring-2 ring-rose-500/10' : 'border-neutral-300'
                  } text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-bold text-base transition shadow-xs`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Primary Genre</label>
                  <select 
                    value={genre} 
                    onChange={e => {
                      const nextGenre = e.target.value;
                      setGenre(nextGenre);
                      const presets = SUBGENRE_PRESETS[nextGenre] || [];
                      if (presets.length > 0) setSubgenre(presets[0]);
                    }} 
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-xs font-bold text-neutral-900 cursor-pointer shadow-xs"
                  >
                    <option value="Pop">Pop</option>
                    <option value="Hip-Hop">Hip-Hop / Rap</option>
                    <option value="R&B">R&B / Soul</option>
                    <option value="Rock">Rock / Alt</option>
                    <option value="Electronic">Electronic / Dance</option>
                    <option value="Latin">Latin / Reggaeton</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Sub-Genre Flavor</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Synth-Pop" 
                    value={subgenre} 
                    onChange={e => setSubgenre(e.target.value)} 
                    className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-xs" 
                  />
                </div>
              </div>

              {/* Sub-genre Quick Chips */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Popular {genre} Styles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(SUBGENRE_PRESETS[genre] || []).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSubgenre(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                        subgenre === preset
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Theme Selection */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Select Narrative Concept ({WRITING_THEMES.length} Themes)
                </span>
                <span className="text-xs text-neutral-500">
                  Synergizes with Songwriting skills
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {WRITING_THEMES.map(theme => {
                  const isSelected = selectedThemeId === theme.id;
                  const skillLevel = skills.songwriting[theme.bestFitSubSkill]?.level || 1;
                  const skillName = skills.songwriting[theme.bestFitSubSkill]?.name || '';
                  const tierBadge = getSkillTierLabel(skillLevel);

                  return (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected 
                          ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm' 
                          : 'bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-900 shadow-xs'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                        isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        <i className={`ph-fill ${theme.icon}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm font-bold text-neutral-900 tracking-tight">{theme.name}</h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierBadge.badgeBg}`}>
                            {skillName} · Lv.{skillLevel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                          {theme.description}
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

          {/* STEP 3: Meaning & Message Depth */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Select Lyrical Philosophy
                </span>
                <span className="text-xs text-neutral-500">
                  Concept: <span className="font-semibold text-neutral-800">{selectedTheme.name}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {MEANING_FOCUS_OPTIONS.map(meaning => {
                  const isSelected = selectedMeaningId === meaning.id;
                  const skillLevel = skills.songwriting[meaning.subSkillBonus]?.level || 1;
                  const skillName = skills.songwriting[meaning.subSkillBonus]?.name || '';
                  const tierBadge = getSkillTierLabel(skillLevel);

                  return (
                    <div
                      key={meaning.id}
                      onClick={() => setSelectedMeaningId(meaning.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected 
                          ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm' 
                          : 'bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-900 shadow-xs'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                        isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        <i className="ph-fill ph-brain"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm font-bold text-neutral-900 tracking-tight">{meaning.name}</h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierBadge.badgeBg}`}>
                            {skillName} · Lv.{skillLevel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                          {meaning.description}
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

          {/* STEP 4: Craft Setup, Duration & Quality Breakdown */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Writer Type Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Songwriter Setup
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWriter('self')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      writer === 'self' 
                        ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/10 shadow-sm' 
                        : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">Solo Independent</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Free</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      100% driven by your Songwriting mastery
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWriter('pro')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      writer === 'pro' 
                        ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/10 shadow-sm' 
                        : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">Pro Co-Writer</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">$2,500</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      +14 Quality Boost with top hitmakers
                    </div>
                  </button>
                </div>
              </div>

              {/* Writing Duration */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Session Duration (In-game Days to Write)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { d: '1', label: '1 Day', note: '+4.5 Qual' },
                    { d: '2', label: '2 Days', note: '+9 Qual' },
                    { d: '3', label: '3 Days', note: '+13.5 Qual' },
                    { d: '4', label: '4 Days', note: '+18 Qual' }
                  ].map(item => (
                    <button
                      key={item.d}
                      type="button"
                      onClick={() => setDays(item.d)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition cursor-pointer ${
                        days === item.d 
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs' 
                          : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 ${days === item.d ? 'text-emerald-300' : 'text-neutral-400'}`}>
                        {item.note}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collab NPC Card */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Featured Artist Collaboration (Optional · Negotiate Fee & Royalty Split)
                </label>
                <NpcCollabCard selectedNpcId={collab} onSelectNpc={setCollab} />
              </div>

              {/* Collaboration Offer & Royalty Split Negotiation Panel */}
              {collab !== 'none' && (
                <CollabOfferNegotiationPanel
                  selectedNpcName={collab}
                  playerPopularity={state.popularity || 2.0}
                  playerMoney={state.money || 0}
                  contract={collabContract}
                  onContractChange={setCollabContract}
                />
              )}

              {/* Modern Output Projection Card */}
              <div className="bg-neutral-900 text-white rounded-xl p-4 border border-neutral-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Projected Writing Quality
                    </span>
                    <div className="text-xs text-neutral-300 mt-0.5">
                      {selectedTheme.name} · {selectedMeaning.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {qualityCalculation.finalQuality}
                      <span className="text-xs font-normal text-neutral-400"> / 100</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-400">
                      Session Range: {qualityCalculation.expectedRange[0]}–{qualityCalculation.expectedRange[1]}
                    </div>
                  </div>
                </div>

                {/* Quality Composition Progress Bar */}
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, qualityCalculation.breakdown.base + qualityCalculation.breakdown.skillBonus)}%` }} 
                  />
                  <div 
                    className="bg-emerald-400 h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, qualityCalculation.breakdown.themeSynergyBonus + qualityCalculation.breakdown.meaningBonus)}%` }} 
                  />
                  <div 
                    className="bg-amber-400 h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, qualityCalculation.breakdown.daysBonus + qualityCalculation.breakdown.writerBonus + qualityCalculation.breakdown.collabBonus)}%` }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-neutral-800">
                  <div className="flex justify-between text-neutral-400">
                    <span>Songwriting Skills:</span>
                    <span className="font-semibold text-purple-300">+{qualityCalculation.breakdown.skillBonus}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Concept & Depth:</span>
                    <span className="font-semibold text-emerald-400">
                      +{qualityCalculation.breakdown.themeSynergyBonus + qualityCalculation.breakdown.meaningBonus}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Session Duration:</span>
                    <span className="font-semibold text-white">+{qualityCalculation.breakdown.daysBonus}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Co-Writer & Collab:</span>
                    <span className="font-semibold text-amber-300">
                      +{qualityCalculation.breakdown.writerBonus + qualityCalculation.breakdown.collabBonus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Draft Specs Strip */}
        <div className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-500">
          <div className="truncate max-w-[270px]">
            <span className="font-bold text-neutral-800">{title.trim() || 'Untitled Track'}</span>
            <span className="mx-1.5 text-neutral-300">·</span>
            <span>{subgenre.trim() || genre}</span>
            {currentStep >= 2 && (
              <>
                <span className="mx-1.5 text-neutral-300">·</span>
                <span>{selectedTheme.name}</span>
              </>
            )}
          </div>
          <div className="text-right font-bold text-neutral-900 shrink-0">
            Est. {qualityCalculation.expectedRange[0]}–{qualityCalculation.expectedRange[1]} Qual
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

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !title.trim()) {
                  setTitleError(true);
                  return;
                }
                setCurrentStep((currentStep + 1) as any);
              }}
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
              <i className="ph-fill ph-check-circle text-emerald-400 text-sm"></i>
              <span>
                Start Writing (
                {(() => {
                  const total =
                    (writer === 'pro' ? 2500 : 0) +
                    (collab !== 'none' && collabContract ? collabContract.agreedFee : 0);
                  return total > 0 ? `$${formatNumFull(total)}` : 'Free';
                })()}
                {collab !== 'none' && collabContract ? ` • ${collabContract.agreedRoyaltyPercent}% Royalty` : ''})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

