import React, { useState, useRef, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { resolveAuthenticCover } from '../../data/musicCatalog';
import { compressImageFile } from '../../utils/imageOptimizer';
import { getEnsuredSkillState } from '../../data/skillSystemEngine';

interface EnhancedProjectCreatorModalProps {
  onClose: () => void;
}

const PROJECT_FORMATS = [
  {
    id: 'single_pack',
    name: 'Single Pack',
    minTracks: 1,
    maxTracks: 3,
    badge: '1–3 Tracks',
    desc: 'Maxi-single bundle or A-Side / B-Side pairing for quick streaming momentum.',
    icon: 'ph-disc'
  },
  {
    id: 'ep',
    name: 'Extended Play (EP)',
    minTracks: 3,
    maxTracks: 8,
    badge: '3–8 Tracks',
    desc: 'Cohesive mini-project that builds core fanbase loyalty and chart presence.',
    icon: 'ph-vinyl-record'
  },
  {
    id: 'album',
    name: 'Studio Album (LP)',
    minTracks: 8,
    maxTracks: 30,
    badge: '8+ Tracks',
    desc: 'Full-length era statement. Maximizes pure album sales, tour demand & Apple Music/Spotify dominance.',
    icon: 'ph-albums'
  }
] as const;

export default function EnhancedProjectCreatorModal({ onClose }: EnhancedProjectCreatorModalProps) {
  const { state, setState, setInfoModal } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eligibleSongs = useMemo(
    () => state.songs.filter(s => s.status === 'recorded' || s.status === 'released'),
    [state.songs]
  );

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [projType, setProjType] = useState<'single_pack' | 'ep' | 'album'>('ep');
  const [selectedSongIds, setSelectedSongIds] = useState<number[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const skills = getEnsuredSkillState(state.skills);
  const activeFormat = PROJECT_FORMATS.find(f => f.id === projType) || PROJECT_FORMATS[1];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setImagePreview(compressed);
      }
    }
  };

  const toggleSongSelection = (id: number) => {
    setErrorMsg(null);
    setSelectedSongIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const moveTrackOrder = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= selectedSongIds.length) return;
    const copy = [...selectedSongIds];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSelectedSongIds(copy);
  };

  // Ordered selected song objects
  const orderedSelectedSongs = useMemo(() => {
    return selectedSongIds
      .map(id => eligibleSongs.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [selectedSongIds, eligibleSongs]);

  // Calculate Project Quality & Sonic Cohesion
  const projectMetrics = useMemo(() => {
    if (orderedSelectedSongs.length === 0) {
      return {
        avgTrackQuality: 0,
        cohesionBonus: 0,
        finalQuality: 0,
        dominantGenre: 'Mixed',
        unreleasedCount: 0,
        leadSingleCount: 0
      };
    }

    const rawAvg = orderedSelectedSongs.reduce((acc, s) => acc + (s.quality || 50), 0) / orderedSelectedSongs.length;

    // Genre cohesion check
    const genreCounts: Record<string, number> = {};
    orderedSelectedSongs.forEach(s => {
      const g = s.genre || 'Pop';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    const dominantGenre = sortedGenres[0]?.[0] || 'Pop';
    const genreMatchRatio = (sortedGenres[0]?.[1] || 1) / orderedSelectedSongs.length;

    // Arrangement & Mastering skill synergy for sequencing an album
    const arrangementLv = skills.production?.arrangement?.level || 1;
    const masteringLv = skills.production?.mastering?.level || 1;
    const skillSequencingBonus = ((arrangementLv + masteringLv) / 200) * 3.5;

    const cohesionBonus = Number(((genreMatchRatio * 3.0) + skillSequencingBonus).toFixed(1));
    const finalQuality = Math.min(100, Math.round(rawAvg + cohesionBonus));

    const unreleasedCount = orderedSelectedSongs.filter(s => s.status === 'recorded').length;
    const leadSingleCount = orderedSelectedSongs.filter(s => s.status === 'released').length;

    return {
      avgTrackQuality: Math.round(rawAvg),
      cohesionBonus,
      finalQuality,
      dominantGenre,
      unreleasedCount,
      leadSingleCount
    };
  }, [orderedSelectedSongs, skills]);

  const isTrackCountValid =
    orderedSelectedSongs.length >= activeFormat.minTracks &&
    orderedSelectedSongs.length <= activeFormat.maxTracks;

  const handleSubmit = () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a project title first.');
      setCurrentStep(1);
      return;
    }

    if (!isTrackCountValid) {
      setErrorMsg(
        `${activeFormat.name} requires ${
          activeFormat.id === 'album'
            ? 'at least 8 tracks'
            : `${activeFormat.minTracks} to ${activeFormat.maxTracks} tracks`
        } (currently ${orderedSelectedSongs.length} selected).`
      );
      return;
    }

    const cover = imagePreview || resolveAuthenticCover(state.artist?.name || 'Artist', title.trim());

    const newProj = {
      id: state.projectIdCounter,
      title: title.trim(),
      type: projType,
      cover,
      songs: orderedSelectedSongs.map(s => ({
        ...s,
        status: s.status === 'released' ? ('released' as const) : ('packaged' as const)
      })),
      status: 'created' as const,
      quality: projectMetrics.finalQuality,
      basePotential: 0,
      momentum: 1.0,
      pureSales: 0,
      weeklyPureSales: 0
    };

    setState(p => ({
      ...p,
      projects: [...p.projects, newProj],
      projectIdCounter: p.projectIdCounter + 1,
      songs: p.songs.map(s =>
        selectedSongIds.includes(s.id)
          ? { ...s, status: s.status === 'released' ? 'released' : 'packaged' }
          : s
      )
    }));

    setInfoModal({
      title: 'Project Mastered & Packaged',
      desc: `"${title.trim()}" (${activeFormat.name} · ${orderedSelectedSongs.length} tracks) has been assembled with a Final Project Quality of ${projectMetrics.finalQuality}/100 (+${projectMetrics.cohesionBonus} Sonic Cohesion). Head to "Release" to schedule its global drop!`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F7] w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                Project Packaging
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs font-semibold text-neutral-600">Step {currentStep} of 2</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight mt-1">
              {currentStep === 1 ? 'Format, Title & Cover Art' : 'Tracklist Curation & Sequencing'}
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
              { num: 1, name: 'Project Identity & Format' },
              { num: 2, name: 'Tracklist & Sequence' }
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

        {eligibleSongs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 text-xl mx-auto">
              <i className="ph-bold ph-folders"></i>
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">No Mastered Tracks Available</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Record at least one written song in the Recording Studio before assembling a Single Pack, EP, or Studio Album.
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
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <i className="ph-fill ph-warning-circle text-sm shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Cover Art + Title */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-200/80 shadow-xs flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-xl border border-neutral-200 bg-neutral-100 hover:border-neutral-400 flex items-center justify-center cursor-pointer relative overflow-hidden group shrink-0 transition"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!imagePreview && (
                        <div className="flex flex-col items-center text-neutral-400 group-hover:text-neutral-700">
                          <i className="ph-bold ph-camera text-xl"></i>
                          <span className="text-[9px] font-semibold mt-1">Cover Art</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Project Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. After Hours, SOS, Utopia..."
                        value={title}
                        onChange={e => {
                          setTitle(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        autoFocus
                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-bold text-sm transition"
                      />
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Tap cover box to upload custom artwork or auto-generate official cover art.
                      </p>
                    </div>
                  </div>

                  {/* Format Selector Cards */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Select Release Format
                    </label>
                    <div className="space-y-2.5">
                      {PROJECT_FORMATS.map(fmt => {
                        const isSelected = projType === fmt.id;
                        return (
                          <div
                            key={fmt.id}
                            onClick={() => {
                              setProjType(fmt.id as any);
                              setErrorMsg(null);
                            }}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              <i className={`ph-fill ${fmt.icon}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-neutral-900">{fmt.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {fmt.badge}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{fmt.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Track Requirement Status Banner */}
                  <div className="p-3 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {activeFormat.name} Tracklist ({orderedSelectedSongs.length} selected)
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Required: {activeFormat.badge} · Unreleased masters become album tracks; released singles become Lead Singles
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        isTrackCountValid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isTrackCountValid ? 'Ready' : `Need ${activeFormat.badge}`}
                    </span>
                  </div>

                  {/* Available Catalog Tracks to Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Available Recorded & Released Tracks ({eligibleSongs.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const maxSlice = eligibleSongs.slice(0, activeFormat.maxTracks).map(s => s.id);
                          setSelectedSongIds(
                            selectedSongIds.length === maxSlice.length ? [] : maxSlice
                          );
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {selectedSongIds.length > 0 ? 'Clear Selection' : `Auto-Select (${Math.min(eligibleSongs.length, activeFormat.maxTracks)})`}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {eligibleSongs.map(s => {
                        const trackNumber = selectedSongIds.indexOf(s.id) + 1;
                        const isSelected = trackNumber > 0;
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleSongSelection(s.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
                                : 'bg-white/80 border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              {isSelected ? trackNumber : '+'}
                            </div>
                            <img
                              src={s.cover}
                              alt={s.title}
                              className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0 border border-neutral-200/60"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-neutral-900 truncate">{s.title}</span>
                                <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
                                  Qual {Math.round(s.quality)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                                <span>{s.subgenre || s.genre}</span>
                                <span>·</span>
                                <span
                                  className={`font-semibold ${
                                    s.status === 'released' ? 'text-blue-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {s.status === 'released' ? 'Pre-Release Single' : 'Unreleased Master'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sequenced Tracklist Order & Cohesion Preview */}
                  {orderedSelectedSongs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          Tracklist Sequence (Use Arrows to Reorder)
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-500">
                          Dominant Sound: <strong className="text-neutral-800">{projectMetrics.dominantGenre}</strong>
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-neutral-200/80 divide-y divide-neutral-100 max-h-40 overflow-y-auto">
                        {orderedSelectedSongs.map((track, idx) => (
                          <div key={track.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[11px] font-black text-neutral-400 w-4">{idx + 1}.</span>
                              <span className="font-bold text-neutral-900 truncate">{track.title}</span>
                              {idx === 0 && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">
                                  Opener
                                </span>
                              )}
                              {track.status === 'released' && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                  Lead Single
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveTrackOrder(idx, -1)}
                                className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 flex items-center justify-center text-neutral-700 cursor-pointer"
                              >
                                <i className="ph-bold ph-caret-up text-[10px]"></i>
                              </button>
                              <button
                                type="button"
                                disabled={idx === orderedSelectedSongs.length - 1}
                                onClick={() => moveTrackOrder(idx, 1)}
                                className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 flex items-center justify-center text-neutral-700 cursor-pointer"
                              >
                                <i className="ph-bold ph-caret-down text-[10px]"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Master Summary Card */}
                  <div className="bg-neutral-900 text-white rounded-xl p-4 border border-neutral-800 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Projected Project Rating
                        </span>
                        <div className="text-xs text-neutral-300 mt-0.5">
                          {projectMetrics.unreleasedCount} New Tracks · {projectMetrics.leadSingleCount} Pre-Released Singles
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white tracking-tight">
                          {projectMetrics.finalQuality}
                          <span className="text-xs font-normal text-neutral-400"> / 100</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-neutral-800">
                      <div className="flex justify-between text-neutral-400">
                        <span>Tracklist Avg:</span>
                        <span className="font-semibold text-white">{projectMetrics.avgTrackQuality}/100</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Sonic Cohesion:</span>
                        <span className="font-semibold text-emerald-400">+{projectMetrics.cohesionBonus}</span>
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
                  onClick={() => {
                    if (!title.trim()) {
                      setErrorMsg('Please enter a project title first.');
                      return;
                    }
                    setErrorMsg(null);
                    setCurrentStep(2);
                  }}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>Next: Curate Tracklist</span>
                  <i className="ph-bold ph-arrow-right"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <i className="ph-fill ph-check-circle text-emerald-400 text-sm"></i>
                  <span>Package {activeFormat.name}</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
