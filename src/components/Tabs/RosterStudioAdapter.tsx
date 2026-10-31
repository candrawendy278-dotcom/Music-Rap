// Roster Artist Studio Adapter
// Provides the EXACT 100% identical Player Studio interface (Create Song, Record Studio,
// Create Project, Release, YouTube Video Studio, and Your Catalog) for any signed Roster Artist,
// while measuring Song & Recording Quality 100% from the Player's own skills (`state.skills`).

import React, { useState, useMemo, useCallback } from 'react';
import { GameContext, useGameContext } from '../../GameContext';
import { GameState, Project, Song } from '../../types';
import { ImprintSignedArtist, getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';
import { ensureRosterArtistFullFields } from '../../data/recordLabelCeoEngine';
import { isRosterArtistContractExpired, renewRosterArtistContract } from '../../data/rosterLifecycleAndNpcDedupEngine';
import EnhancedWritingWizard from '../Modals/EnhancedWritingWizard';
import EnhancedRecordingStudio from '../Modals/EnhancedRecordingStudio';
import EnhancedProjectCreatorModal from '../Modals/EnhancedProjectCreatorModal';
import EnhancedReleaseModal from '../Modals/EnhancedReleaseModal';
import YouTubeVisualFormatModal from '../Modals/YouTubeVisualFormatModal';
import CatalogItem from './CatalogItem';
import { ProjectStreamSnapshotModal } from '../Modals/ProjectStreamSnapshotModal';
import { formatNum } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  applyRosterComebackReleaseFatigue,
  getRosterTrustAndHiatusInfo
} from '../../data/rosterTrustHiatusPayrollEngine';
import { RosterTrustAndHiatusPanel } from '../Apps/RosterTrustAndHiatusCard';

interface RosterStudioAdapterProps {
  rosterArtist: ImprintSignedArtist;
  onOpenExecutiveModal?: () => void;
  embeddedInCeoModal?: boolean;
}

export const RosterStudioAdapter: React.FC<RosterStudioAdapterProps> = ({
  rosterArtist,
  onOpenExecutiveModal,
  embeddedInCeoModal = false
}) => {
  const parentGameContext = useGameContext();
  const { state: realState, setState: realSetState, setInfoModal } = parentGameContext;

  const [writeModal, setWriteModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [releaseModal, setReleaseModal] = useState(false);
  const [visualStudioModal, setVisualStudioModal] = useState(false);
  const [selectedSnapshotItem, setSelectedSnapshotItem] = useState<any>(null);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'albums' | 'singles' | 'in_progress'>('all');

  const ensuredArtist = useMemo(
    () => ensureRosterArtistFullFields(rosterArtist),
    [rosterArtist]
  );

  const isExpired = isRosterArtistContractExpired(ensuredArtist);
  const stageName = ensuredArtist.stageName || ensuredArtist.name;
  const trustAndHiatusInfo = useMemo(
    () => getRosterTrustAndHiatusInfo(ensuredArtist),
    [ensuredArtist]
  );

  // Build a proxied GameState where songs/projects/artist belong to the selected Roster Artist,
  // while skills (`state.skills`) and money (`state.money`) come directly from the Player!
  const proxiedState = useMemo<GameState>(() => {
    const artistSongs: Song[] = Array.isArray(ensuredArtist.songs) ? ensuredArtist.songs : [];
    const artistProjects: Project[] = Array.isArray(ensuredArtist.projects)
      ? ensuredArtist.projects
      : [];

    return {
      ...realState,
      artist: {
        name: stageName,
        country: ensuredArtist.country || realState.artist?.country || 'US',
        image: ensuredArtist.avatar || realState.artist?.image || '',
        avatar: ensuredArtist.avatar || realState.artist?.avatar || '',
        tier: (ensuredArtist.popularity ?? 35) >= 75 ? 2 : (ensuredArtist.popularity ?? 35) >= 45 ? 1 : 3,
        startYear: 2026
      },
      // IMPORTANT: Keep Player's own skills so Song Quality & Recording Quality are 100% measured from Player's skills!
      skills: realState.skills,
      money: realState.money,
      popularity: ensuredArtist.popularity ?? 35,
      hype: ensuredArtist.hype ?? 45,
      fans: ensuredArtist.fans ?? 15000,
      songs: artistSongs,
      projects: artistProjects,
      spotify: {
        ...realState.spotify,
        listeners: ensuredArtist.monthlyListeners || Math.round((ensuredArtist.dailyStreams || 5000) * 28)
      }
    };
  }, [realState, ensuredArtist, stageName]);

  // Intercept setState calls from EnhancedWritingWizard, EnhancedRecordingStudio, EnhancedProjectCreatorModal,
  // EnhancedReleaseModal, and YouTubeVisualFormatModal and persist changes back to the Roster Artist in recordLabelState!
  const proxiedSetState = useCallback<React.Dispatch<React.SetStateAction<GameState>>>(
    updater => {
      realSetState(prevRealState => {
        const rl = getEnsuredRecordLabelState(prevRealState);
        const rawTarget = rl.imprint.signedRoster.find(a => a.id === ensuredArtist.id);
        if (!rawTarget) return prevRealState;

        const liveTarget = ensureRosterArtistFullFields(rawTarget);
        const liveStageName = liveTarget.stageName || liveTarget.name;

        const currentProxy: GameState = {
          ...prevRealState,
          artist: {
            name: liveStageName,
            country: liveTarget.country || prevRealState.artist?.country || 'US',
            image: liveTarget.avatar || prevRealState.artist?.image || '',
            avatar: liveTarget.avatar || prevRealState.artist?.avatar || '',
            tier: (liveTarget.popularity ?? 35) >= 75 ? 2 : (liveTarget.popularity ?? 35) >= 45 ? 1 : 3,
            startYear: 2026
          },
          skills: prevRealState.skills,
          money: prevRealState.money,
          popularity: liveTarget.popularity ?? 35,
          hype: liveTarget.hype ?? 45,
          fans: liveTarget.fans ?? 15000,
          songs: Array.isArray(liveTarget.songs) ? liveTarget.songs : [],
          projects: Array.isArray(liveTarget.projects) ? liveTarget.projects : [],
          spotify: {
            ...prevRealState.spotify,
            listeners:
              liveTarget.monthlyListeners ||
              Math.round((liveTarget.dailyStreams || 5000) * 28)
          }
        };

        const nextProxy =
          typeof updater === 'function' ? updater(currentProxy) : updater;

        const prevReleasedProjIds = new Set(
          (liveTarget.projects || [])
            .filter(p => p.status === 'released')
            .map(p => p.id)
        );
        const newlyReleasedProjectsCount = (nextProxy.projects || []).filter(
          p => p.status === 'released' && !prevReleasedProjIds.has(p.id)
        ).length;

        const prevReleasedSongIds = new Set(
          (liveTarget.songs || [])
            .filter(s => s.status === 'released')
            .map(s => s.id)
        );
        const newlyReleasedSongsCount = (nextProxy.songs || []).filter(
          s => s.status === 'released' && !prevReleasedSongIds.has(s.id)
        ).length;

        const updatedSongs = (nextProxy.songs || []).map(s => ({
          ...s,
          artist: liveStageName
        }));

        const updatedProjects = (nextProxy.projects || []).map(p => ({
          ...p,
          recordLabel: p.recordLabel || rl.imprint.imprintName || 'Independent Imprint',
          songs: (p.songs || []).map(ps => {
            const matched = updatedSongs.find(us => us.id === ps.id);
            return matched ? { ...matched } : { ...ps, artist: liveStageName };
          })
        }));

        let updatedArtist: ImprintSignedArtist = {
          ...liveTarget,
          popularity: Math.min(100, Math.max(1, Number((nextProxy.popularity ?? liveTarget.popularity).toFixed(1)))),
          hype: Math.min(100, Math.max(0, Number((nextProxy.hype ?? liveTarget.hype).toFixed(1)))),
          fans: Math.max(0, Math.round(nextProxy.fans ?? liveTarget.fans)),
          songs: updatedSongs,
          projects: updatedProjects,
          releasesCount:
            (liveTarget.releasesCount || 0) +
            newlyReleasedProjectsCount +
            newlyReleasedSongsCount,
          albumsDelivered:
            (liveTarget.albumsDelivered || 0) + newlyReleasedProjectsCount
        };

        if (newlyReleasedProjectsCount > 0 || newlyReleasedSongsCount > 0) {
          updatedArtist = applyRosterComebackReleaseFatigue(
            updatedArtist,
            newlyReleasedProjectsCount > 0 ? 'project' : 'single'
          );
        }

        const nextRoster = rl.imprint.signedRoster.map(a =>
          a.id === liveTarget.id ? updatedArtist : a
        );

        return {
          ...prevRealState,
          money: nextProxy.money,
          skills: nextProxy.skills,
          songsIdCounter: nextProxy.songsIdCounter ?? prevRealState.songsIdCounter,
          projectIdCounter: nextProxy.projectIdCounter ?? prevRealState.projectIdCounter,
          xPosts: nextProxy.xPosts,
          npcs: nextProxy.npcs,
          activeTab: nextProxy.activeTab,
          activeApp: nextProxy.activeApp,
          recordLabelState: {
            ...rl,
            imprint: {
              ...rl.imprint,
              signedRoster: nextRoster
            }
          }
        };
      });
    },
    [realSetState, ensuredArtist.id]
  );

  const proxiedContextValue = useMemo(
    () => ({
      ...parentGameContext,
      state: proxiedState,
      setState: proxiedSetState
    }),
    [parentGameContext, proxiedState, proxiedSetState]
  );

  const allItems = useMemo(() => {
    const rawItems = [
      ...proxiedState.songs.map(s => ({ ...s, itemType: 'song' as const })),
      ...proxiedState.projects.map(p => ({ ...p, itemType: 'project' as const }))
    ];

    const filtered = rawItems.filter(item => {
      if (catalogFilter === 'albums') {
        return item.itemType === 'project' && ((item as any).type === 'album' || (item as any).type === 'ep');
      }
      if (catalogFilter === 'singles') {
        return (
          item.itemType === 'song' ||
          (item.itemType === 'project' && (item as any).type === 'single_pack')
        );
      }
      if (catalogFilter === 'in_progress') {
        return item.status !== 'released';
      }
      return true;
    });

    return filtered.sort((a, b) => b.id - a.id);
  }, [proxiedState.songs, proxiedState.projects, catalogFilter]);

  const writingCount = proxiedState.songs.filter(s => s.status === 'writing').length;
  const writtenReadyToRecordCount = proxiedState.songs.filter(s => s.status === 'written').length;
  const recordedReadyForProjectCount = proxiedState.songs.filter(
    s => s.status === 'recorded' || s.status === 'released'
  ).length;
  const readyToReleaseCount =
    proxiedState.songs.filter(
      s =>
        s.status === 'recorded' ||
        s.status === 'packaged' ||
        (s.status === 'released' && s.trackType === 'b_side') ||
        (s.status === 'scheduled' &&
          proxiedState.projects.some(
            p => p.status === 'scheduled' && p.songs?.some(ps => ps.id === s.id)
          ))
    ).length +
    proxiedState.projects.filter(
      p => p.status === 'created' || (p as any).status === 'ready'
    ).length;

  const releasedRosterSongsCount = proxiedState.songs.filter(
    s => s.status === 'released'
  ).length;

  const handleRenewContractClick = () => {
    const res = renewRosterArtistContract(realState, ensuredArtist.id);
    if (!res.success) {
      setInfoModal({
        title: 'Contract Renewal Notice',
        desc: res.message
      });
      return;
    }
    realSetState(res.nextState);
    setInfoModal({
      title: 'Roster Contract Renewed',
      desc: res.message
    });
  };

  return (
    <GameContext.Provider value={proxiedContextValue}>
      <div className={`space-y-6 animate-in fade-in ${embeddedInCeoModal ? 'pb-6' : 'pb-24'}`}>
        {/* Compact Roster Artist Status Strip */}
        <div className="bg-apple-card rounded-2xl p-3.5 shadow-ios border border-apple-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <OfficialArtworkImg
              artist={stageName}
              explicitSrc={ensuredArtist.avatar}
              isArtistPortrait={true}
              alt={stageName}
              className="w-11 h-11 rounded-full object-cover border border-purple-500/40 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm text-apple-text truncate">
                  {stageName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                  {ensuredArtist.genre} • {ensuredArtist.country || 'US'}
                </span>
                {isExpired && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                    Contract Expired (Inactive Career)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-apple-subtext mt-0.5 truncate">
                Pop {Math.round(ensuredArtist.popularity)}% • Hype {Math.round(ensuredArtist.hype)}% • Fans {formatNum(ensuredArtist.fans)} • Quality Driven by Your Skills
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isExpired && (
              <button
                onClick={handleRenewContractClick}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition cursor-pointer"
              >
                Renew Deal
              </button>
            )}
            {!embeddedInCeoModal && onOpenExecutiveModal && (
              <button
                onClick={onOpenExecutiveModal}
                className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[11px] font-black transition cursor-pointer flex items-center gap-1"
              >
                <i className="ph-bold ph-sliders-horizontal text-xs"></i>
                <span>Manage</span>
              </button>
            )}
          </div>
        </div>

        {/* Label Trust Bar, Comeback Fatigue & Mandatory Hiatus Request Panel */}
        <RosterTrustAndHiatusPanel
          artist={ensuredArtist}
          gameState={realState}
          setGameState={realSetState}
          onNotify={(msg) =>
            setInfoModal({
              title: `${stageName} • Label Relations`,
              desc: msg
            })
          }
        />

        {isExpired ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-200 space-y-2">
            <div className="font-black text-sm flex items-center gap-1.5">
              <i className="ph-fill ph-warning-circle text-base"></i>
              <span>{stageName}&apos;s Label Contract Has Ended</span>
            </div>
            <p className="leading-relaxed">
              {stageName}&apos;s existing discography continues to stream and chart passively around the world, but their active music career is paused until their contract is renewed. Note: Contract renewal depends on {stageName}&apos;s <strong>Label Trust ({trustAndHiatusInfo.labelTrust}%)</strong>. You can renew their deal above if their trust is high enough, or remove former roster artists in <strong>Settings</strong>.
            </p>
          </div>
        ) : (
          /* EXACT SAME 2x2 + YOUTUBE VIDEO STUDIO BUTTONS AS PLAYER STUDIO */
          <>
            <div className="grid grid-cols-2 gap-3.5">
              {/* Step 1: Create Song (Writing) */}
              <button
                onClick={() => {
                  if (!trustAndHiatusInfo.canStartNewComebackInStudio) {
                    return setInfoModal({
                      title: 'Artist Hiatus / Rest Request',
                      desc:
                        trustAndHiatusInfo.studioBlockReason ||
                        `${stageName} needs rest before starting a new comeback.`
                    });
                  }
                  setWriteModal(true);
                }}
                className="bg-apple-card p-4 rounded-3xl shadow-ios border border-apple-border/50 flex flex-col items-center justify-center space-y-2 active:scale-95 transition hover:border-blue-300 group cursor-pointer relative overflow-hidden"
              >
                {writingCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500 text-white shadow-xs">
                    {writingCount} Writing
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-1 shadow-sm group-hover:scale-105 transition">
                  <i className="ph-fill ph-pen-nib"></i>
                </div>
                <span className="font-bold text-sm text-apple-text">Create Song</span>
                <span className="text-[10px] text-apple-subtext font-medium">
                  Theme, Meaning &amp; Collab
                </span>
              </button>

              {/* Step 2: Record Studio (Production) */}
              <button
                onClick={() => {
                  if (!trustAndHiatusInfo.canStartNewComebackInStudio) {
                    return setInfoModal({
                      title: 'Artist Hiatus / Rest Request',
                      desc:
                        trustAndHiatusInfo.studioBlockReason ||
                        `${stageName} needs rest before recording.`
                    });
                  }
                  const written = proxiedState.songs.filter(s => s.status === 'written');
                  if (written.length === 0) {
                    return setInfoModal({
                      title: 'Notice',
                      desc: `No written songs available to record for ${stageName}! Create a song first (if a song is currently Writing, advance days until it finishes writing).`
                    });
                  }
                  setRecordModal(true);
                }}
                className="bg-apple-card p-4 rounded-3xl shadow-ios border border-apple-border/50 flex flex-col items-center justify-center space-y-2 active:scale-95 transition hover:border-red-300 group cursor-pointer relative overflow-hidden"
              >
                {writtenReadyToRecordCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white shadow-xs">
                    {writtenReadyToRecordCount} Ready
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-1 shadow-sm group-hover:scale-105 transition">
                  <i className="ph-fill ph-microphone-stage"></i>
                </div>
                <span className="font-bold text-sm text-apple-text">Record Studio</span>
                <span className="text-[10px] text-apple-subtext font-medium">
                  Vocal Style &amp; Mastering
                </span>
              </button>

              {/* Step 3: Create Project */}
              <button
                onClick={() => {
                  if (!trustAndHiatusInfo.canStartNewComebackInStudio) {
                    return setInfoModal({
                      title: 'Artist Hiatus / Rest Request',
                      desc:
                        trustAndHiatusInfo.studioBlockReason ||
                        `${stageName} needs rest before packaging a new project.`
                    });
                  }
                  const recorded = proxiedState.songs.filter(
                    s => s.status === 'recorded' || s.status === 'released'
                  );
                  if (recorded.length === 0) {
                    return setInfoModal({
                      title: 'Notice',
                      desc: `You need at least 1 recorded or released song for ${stageName} to assemble a project!`
                    });
                  }
                  setProjectModal(true);
                }}
                className="bg-apple-card p-4 rounded-3xl shadow-ios border border-apple-border/50 flex flex-col items-center justify-center space-y-2 active:scale-95 transition hover:border-purple-300 group cursor-pointer relative overflow-hidden"
              >
                {recordedReadyForProjectCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-600 text-white shadow-xs">
                    {recordedReadyForProjectCount} Masters
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-1 shadow-sm group-hover:scale-105 transition">
                  <i className="ph-fill ph-vinyl-record"></i>
                </div>
                <span className="font-bold text-sm text-apple-text">Create Project</span>
                <span className="text-[10px] text-apple-subtext font-medium">
                  Single Pack, EP &amp; LP
                </span>
              </button>

              {/* Step 4: Release */}
              <button
                onClick={() => {
                  if (!trustAndHiatusInfo.canStartNewComebackInStudio) {
                    return setInfoModal({
                      title: 'Artist Hiatus / Rest Request',
                      desc:
                        trustAndHiatusInfo.studioBlockReason ||
                        `${stageName} needs rest before launching a new comeback release.`
                    });
                  }
                  const relSongs = proxiedState.songs.filter(
                    s =>
                      s.status === 'recorded' ||
                      s.status === 'packaged' ||
                      (s.status === 'released' && s.trackType === 'b_side') ||
                      (s.status === 'scheduled' &&
                        proxiedState.projects.some(
                          p =>
                            p.status === 'scheduled' &&
                            p.songs?.some(ps => ps.id === s.id)
                        ))
                  );
                  const relProjs = proxiedState.projects.filter(
                    p => p.status === 'created' || (p as any).status === 'ready'
                  );
                  if (relSongs.length === 0 && relProjs.length === 0) {
                    return setInfoModal({
                      title: 'Notice',
                      desc: `Nothing ready to release for ${stageName}! Record a song or assemble a project first.`
                    });
                  }
                  setReleaseModal(true);
                }}
                className="bg-apple-card p-4 rounded-3xl shadow-ios border border-apple-border/50 flex flex-col items-center justify-center space-y-2 active:scale-95 transition hover:border-emerald-300 group cursor-pointer relative overflow-hidden"
              >
                {readyToReleaseCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                    {readyToReleaseCount} Ready
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-1 shadow-sm group-hover:scale-105 transition">
                  <i className="ph-fill ph-rocket-launch"></i>
                </div>
                <span className="font-bold text-sm text-apple-text">Release</span>
                <span className="text-[10px] text-apple-subtext font-medium">
                  Rollout &amp; Hype Push
                </span>
              </button>
            </div>

            {/* Dedicated YouTube Video Production Banner (MV, Lyric Video, Visualizer) */}
            <button
              onClick={() => {
                if (releasedRosterSongsCount === 0) {
                  return setInfoModal({
                    title: 'Notice',
                    desc: `Release at least one song for ${stageName} first before producing an Official Music Video, Lyric Video, or Audio Visualizer!`
                  });
                }
                setVisualStudioModal(true);
              }}
              className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 rounded-3xl shadow-md flex items-center justify-between active:scale-[0.99] transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3.5 text-left">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition">
                  <i className="ph-fill ph-film-slate"></i>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded-full">
                      YouTube Video Studio
                    </span>
                    <span className="text-[10px] font-bold text-white/90">
                      • {releasedRosterSongsCount} Eligible Track
                      {releasedRosterSongsCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h4 className="font-black text-base leading-tight mt-0.5">
                    Produce MV, Lyric Video &amp; Visualizer
                  </h4>
                  <p className="text-[11px] text-white/85 font-medium mt-0.5">
                    Upload directly to your Official Record Label YouTube Channel
                  </p>
                </div>
              </div>
              <i className="ph-bold ph-caret-right text-xl text-white/80 group-hover:translate-x-0.5 transition"></i>
            </button>
          </>
        )}

        {/* Catalog Section (Identical to Player Studio) */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-2 mb-3 flex-wrap gap-2">
            <h3 className="text-lg font-bold text-apple-text">
              {stageName}&apos;s Catalog ({allItems.length})
            </h3>
            <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
              {(['all', 'albums', 'singles', 'in_progress'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCatalogFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer capitalize ${
                    catalogFilter === f
                      ? 'bg-white text-black shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {allItems.length > 0 ? (
              allItems.map(item => (
                <CatalogItem
                  key={`${item.itemType}_${item.id}`}
                  item={item}
                  onClick={() => setSelectedSnapshotItem(item)}
                />
              ))
            ) : (
              <div className="text-center py-8 bg-apple-card rounded-3xl border border-apple-border/50">
                <i className="ph ph-music-notes text-3xl text-gray-300 mb-1 block"></i>
                <p className="text-xs text-apple-subtext">
                  No songs or projects in this filter for {stageName} yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modals rendered inside the proxied GameContext so they operate on the Roster Artist using Player's skills */}
        {writeModal && <EnhancedWritingWizard onClose={() => setWriteModal(false)} />}
        {recordModal && <EnhancedRecordingStudio onClose={() => setRecordModal(false)} />}
        {projectModal && (
          <EnhancedProjectCreatorModal onClose={() => setProjectModal(false)} />
        )}
        {releaseModal && <EnhancedReleaseModal onClose={() => setReleaseModal(false)} />}
        {visualStudioModal && (
          <YouTubeVisualFormatModal onClose={() => setVisualStudioModal(false)} />
        )}
        {selectedSnapshotItem && (
          <ProjectStreamSnapshotModal
            item={selectedSnapshotItem}
            state={proxiedState}
            onClose={() => setSelectedSnapshotItem(null)}
          />
        )}
      </div>
    </GameContext.Provider>
  );
};
