import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import ActionModal from '../Modals/ActionModal';
import CatalogItem from './CatalogItem';
import { ProjectStreamSnapshotModal } from '../Modals/ProjectStreamSnapshotModal';
import SkillSystemModal from '../Modals/SkillSystemModal';
import EnhancedWritingWizard from '../Modals/EnhancedWritingWizard';
import EnhancedRecordingStudio from '../Modals/EnhancedRecordingStudio';
import EnhancedProjectCreatorModal from '../Modals/EnhancedProjectCreatorModal';
import EnhancedReleaseModal from '../Modals/EnhancedReleaseModal';
import HiatusStudioLockView from './HiatusStudioLockView';
import { getEnsuredSkillState, calculateMasteryRank } from '../../data/skillSystemEngine';

export default function Studio() {
  const { state, setState } = useGameContext();
  const [modalType, setModalType] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'albums' | 'singles'>('all');
  const [selectedSnapshotItem, setSelectedSnapshotItem] = useState<any>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const skills = getEnsuredSkillState(state.skills);
  const masteryRank = calculateMasteryRank(skills);

  const projects = useMemo(() => [...state.projects].reverse(), [state.projects]);
  const songs = useMemo(() => [...state.songs].reverse().filter(s => s.status !== 'packaged'), [state.songs]);

  const studioCounts = useMemo(() => {
    const writingCount = state.songs.filter(s => s.status === 'writing').length;
    const writtenReadyToRecord = state.songs.filter(s => s.status === 'written').length;
    const recordedReady = state.songs.filter(s => s.status === 'recorded').length;
    const projectsReadyToRelease = state.projects.filter(p => p.status === 'created').length;
    return {
      writingCount,
      writtenReadyToRecord,
      recordedReady,
      readyToReleaseTotal: recordedReady + projectsReadyToRelease
    };
  }, [state.songs, state.projects]);

  const catalogList = useMemo(() => {
    if (!showCatalog) return null;

    const showProjects = catalogFilter === 'all' || catalogFilter === 'albums';
    const showSongs = catalogFilter === 'all' || catalogFilter === 'singles';

    const hasItems = (showProjects ? projects.length : 0) + (showSongs ? songs.length : 0) > 0;

    if (!hasItems) {
      return (
        <p className="text-sm font-medium text-apple-subtext text-center py-6">
          {catalogFilter === 'albums' 
            ? 'No albums or EPs in your catalog yet.' 
            : catalogFilter === 'singles' 
            ? 'No singles in your catalog yet.' 
            : 'No songs or projects created yet.'}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {showProjects && projects.map(p => (
          <CatalogItem key={`p-${p.id}`} item={p} onClick={() => setSelectedSnapshotItem(p)} />
        ))}
        {showSongs && songs.map(s => (
          <CatalogItem key={`s-${s.id}`} item={s} onClick={() => setSelectedSnapshotItem(s)} />
        ))}
      </div>
    );
  }, [projects, songs, showCatalog, catalogFilter]);

  return (
    <div className="space-y-4 animate-in fade-in pb-24">
      <div className="px-2 mb-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-apple-text tracking-tight">Studio</h2>
          <p className="text-sm font-medium text-apple-subtext">Write, record, package & distribute records.</p>
        </div>
      </div>

      {/* Modern Mastery Card */}
      <div 
        onClick={() => setState(p => ({ ...p, activeApp: 'skills' }))}
        className="w-full bg-neutral-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-800 active:scale-[0.99] transition cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-white text-lg shrink-0">
              <i className="ph-fill ph-sparkle"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Mastery Academy
                </span>
                <span className="text-neutral-500 text-xs">·</span>
                <span className="text-xs font-semibold text-neutral-300">
                  {masteryRank.title}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight mt-0.5">
                Artist Craft & Studio Disciplines
              </h4>
              <p className="text-[11px] text-neutral-400 font-normal line-clamp-1">
                Writing Lv.{masteryRank.averages.songwriting} · Vocals Lv.{masteryRank.averages.recording} · Prod Lv.{masteryRank.averages.production}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition">
            <span>Manage</span>
            <i className="ph-bold ph-arrow-right text-xs"></i>
          </div>
        </div>
      </div>
      
      {state.isHiatus ? (
        <HiatusStudioLockView />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setModalType('write')} className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 active:scale-95 transition-transform flex flex-col items-center text-center gap-2.5 cursor-pointer relative">
            {studioCounts.writingCount > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {studioCounts.writingCount} Writing
              </span>
            )}
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-2xl shadow-sm">
              <i className="ph-fill ph-pencil-simple"></i>
            </div>
            <div>
              <h4 className="font-bold text-apple-text text-sm">Create Song</h4>
              <p className="text-[11px] text-apple-subtext mt-0.5">Concept, lyrics & collab</p>
            </div>
          </button>

          <button onClick={() => setModalType('record')} className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 active:scale-95 transition-transform flex flex-col items-center text-center gap-2.5 cursor-pointer relative">
            {studioCounts.writtenReadyToRecord > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                {studioCounts.writtenReadyToRecord} Ready
              </span>
            )}
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 text-2xl shadow-sm">
              <i className="ph-fill ph-microphone-stage"></i>
            </div>
            <div>
              <h4 className="font-bold text-apple-text text-sm">Record Studio</h4>
              <p className="text-[11px] text-apple-subtext mt-0.5">Vocals, flow & mastering</p>
            </div>
          </button>

          <button onClick={() => setModalType('project')} className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 active:scale-95 transition-transform flex flex-col items-center text-center gap-2.5 cursor-pointer relative">
            {studioCounts.recordedReady > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {studioCounts.recordedReady} Masters
              </span>
            )}
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 text-2xl shadow-sm">
              <i className="ph-fill ph-folders"></i>
            </div>
            <div>
              <h4 className="font-bold text-apple-text text-sm">Create Project</h4>
              <p className="text-[11px] text-apple-subtext mt-0.5">Single Pack, EP & Album</p>
            </div>
          </button>

          <button onClick={() => setModalType('release')} className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 active:scale-95 transition-transform flex flex-col items-center text-center gap-2.5 relative overflow-hidden cursor-pointer">
            <div className="absolute inset-0 bg-emerald-50 opacity-50"></div>
            {studioCounts.readyToReleaseTotal > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 z-10">
                {studioCounts.readyToReleaseTotal} Ready
              </span>
            )}
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl shadow-sm relative z-10">
              <i className="ph-fill ph-rocket-launch"></i>
            </div>
            <div className="relative z-10">
              <h4 className="font-bold text-apple-text text-sm">Release</h4>
              <p className="text-[11px] text-apple-subtext mt-0.5">Distro, promo & rollout</p>
            </div>
          </button>
        </div>
      )}

      <div className="mt-6 bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-apple-border/30">
          <div>
            <h3 className="text-lg font-black text-apple-text">Your Catalog</h3>
            <p className="text-xs text-apple-subtext">Manage released projects and standalone singles</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCatalogFilter('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  catalogFilter === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-apple-text shadow-xs'
                    : 'text-apple-subtext hover:text-apple-text'
                }`}
              >
                All ({projects.length + songs.length})
              </button>
              <button
                onClick={() => setCatalogFilter('albums')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  catalogFilter === 'albums'
                    ? 'bg-white dark:bg-neutral-700 text-apple-text shadow-xs'
                    : 'text-apple-subtext hover:text-apple-text'
                }`}
              >
                Albums ({projects.length})
              </button>
              <button
                onClick={() => setCatalogFilter('singles')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  catalogFilter === 'singles'
                    ? 'bg-white dark:bg-neutral-700 text-apple-text shadow-xs'
                    : 'text-apple-subtext hover:text-apple-text'
                }`}
              >
                Singles ({songs.length})
              </button>
            </div>

            <button 
              onClick={() => setShowCatalog(!showCatalog)} 
              className="text-xs font-bold text-apple-blue bg-apple-blue/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform cursor-pointer"
            >
              {showCatalog ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        
        {catalogList}
      </div>

      {showSkillModal && (
        <SkillSystemModal onClose={() => setShowSkillModal(false)} />
      )}

      {modalType === 'write' && (
        <EnhancedWritingWizard onClose={() => setModalType(null)} />
      )}

      {modalType === 'record' && (
        <EnhancedRecordingStudio onClose={() => setModalType(null)} />
      )}

      {modalType === 'project' && (
        <EnhancedProjectCreatorModal onClose={() => setModalType(null)} />
      )}

      {modalType === 'release' && (
        <EnhancedReleaseModal onClose={() => setModalType(null)} />
      )}

      {modalType && !['write', 'record', 'project', 'release'].includes(modalType) && (
        <ActionModal type={modalType} onClose={() => setModalType(null)} />
      )}

      {selectedSnapshotItem && (
        <ProjectStreamSnapshotModal
          item={selectedSnapshotItem}
          state={state}
          onClose={() => setSelectedSnapshotItem(null)}
        />
      )}
    </div>
  );
}

