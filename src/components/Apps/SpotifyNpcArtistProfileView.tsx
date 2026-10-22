import React, { useState, useMemo, useEffect } from 'react';
import { DetailedNPC, getDetailedNPC } from '../../data/npcAssets';
import { formatNum, formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { REAL_WORLD_NPCS, normalizeRealArtistName } from '../../data/realWorldArtistCatalog';
import { useGameContext } from '../../GameContext';
import {
  fetchAuthenticAlbumTracklistFromServer,
  subscribeToAlbumTracklistUpdates
} from '../../data/npcAnnualReleaseCycleAndTracklistEngine';
import { syncNpcRealisticReleaseWorkflow } from '../../data/npcRealisticReleaseWorkflowEngine';
import { SpotifyTrackSubRow } from '../Common/SpotifyTrackSubRow';
import {
  getCollaborationsForNpcArtist,
  resolveSongMetadataAndCollabCredits
} from '../../data/spotifyTrackMetadataAndCollabEngine';

interface SpotifyNpcArtistProfileViewProps {
  npc: DetailedNPC;
  onClose: () => void;
}

interface NpcReleaseItem {
  id: string;
  title: string;
  type: 'album' | 'single';
  cover?: string;
  year: number;
  streams: number;
  primaryArtist?: string;
  isPlayerCollab?: boolean;
  tracks: Array<{
    title: string;
    streams: number;
    trackType: 'single' | 'lead_single' | 'b_side';
    artist?: string;
    collabId?: string;
    hasMV?: boolean;
    isExplicit?: boolean;
    isPlayer?: boolean;
  }>;
}

export const SpotifyNpcArtistProfileView: React.FC<SpotifyNpcArtistProfileViewProps> = ({
  npc,
  onClose
}) => {
  const { state } = useGameContext();
  const [currentNpcTarget, setCurrentNpcTarget] = useState<DetailedNPC>(npc);
  const [selectedRelease, setSelectedRelease] = useState<NpcReleaseItem | null>(null);
  const [tracklistVersion, setTracklistVersion] = useState(0);

  useEffect(() => {
    setCurrentNpcTarget(npc);
    setSelectedRelease(null);
  }, [npc]);

  useEffect(() => {
    return subscribeToAlbumTracklistUpdates(() => {
      syncNpcRealisticReleaseWorkflow(state?.date, true);
      setTracklistVersion(v => v + 1);
    });
  }, [state?.date]);

  const currentYear = useMemo(() => {
    const d = state?.date ? new Date(state.date) : new Date('2026-01-01T00:00:00');
    return Number.isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
  }, [state?.date]);

  const enrichedNpc = useMemo(() => {
    syncNpcRealisticReleaseWorkflow(state?.date, tracklistVersion > 0);
    const cleanName = normalizeRealArtistName(currentNpcTarget.name);
    const catalogMatch = REAL_WORLD_NPCS.find(
      r => r.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (catalogMatch) {
      return {
        ...currentNpcTarget,
        name: catalogMatch.name,
        genre: catalogMatch.genre || currentNpcTarget.genre,
        country: catalogMatch.country || currentNpcTarget.country,
        pop: catalogMatch.pop || currentNpcTarget.pop,
        bio: catalogMatch.bio || currentNpcTarget.bio,
        avatar: catalogMatch.avatar || currentNpcTarget.avatar,
        image: catalogMatch.image || currentNpcTarget.image,
        songs: catalogMatch.songs ?? [],
        albums: catalogMatch.albums ?? []
      };
    }
    return getDetailedNPC(cleanName) || currentNpcTarget;
  }, [currentNpcTarget, currentYear, state?.date, tracklistVersion]);

  useEffect(() => {
    (enrichedNpc.albums || []).forEach(alb => {
      fetchAuthenticAlbumTracklistFromServer(enrichedNpc.name, alb.title).catch(() => {});
    });
  }, [enrichedNpc]);

  // Bilateral Collaborations: find all Player and other NPC songs where this NPC is a featured collaborator!
  const bilateralCollabs = useMemo(() => {
    return getCollaborationsForNpcArtist(enrichedNpc.name, state);
  }, [enrichedNpc.name, state?.songs, state?.date, tracklistVersion]);

  const monthlyListeners = useMemo(() => {
    const ownStreamSum = (enrichedNpc.songs || []).reduce(
      (acc, s) => acc + (s.dailyStreams ?? Math.floor((s.streams ?? 0) / 28)),
      0
    );
    const collabStreamSum = bilateralCollabs.reduce(
      (acc, c) => acc + (c.dailyStreams || Math.floor((c.streams || 0) / 28)) * 0.45,
      0
    );
    return Math.floor((ownStreamSum + collabStreamSum) * 18);
  }, [enrichedNpc, bilateralCollabs]);

  const topSongs = useMemo(() => {
    const combined: Array<{
      title: string;
      streams: number;
      cover?: string;
      artist: string;
      isPlayerPrimary?: boolean;
      hasMV?: boolean;
      isExplicit?: boolean;
      trackType?: 'single' | 'lead_single' | 'b_side';
      rawSong?: any;
    }> = [];
    const seen = new Set<string>();

    (enrichedNpc.songs || []).forEach(s => {
      const meta = resolveSongMetadataAndCollabCredits(s, enrichedNpc.name, state);
      const key = meta.cleanTitle.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push({
          title: meta.cleanTitle,
          streams: Math.floor(s.streams ?? 0),
          cover: s.cover,
          artist: meta.formattedArtistCredits,
          isPlayerPrimary: false,
          hasMV: meta.hasMusicVideo,
          isExplicit: meta.isExplicit,
          trackType: (s as any).trackType || 'single',
          rawSong: s
        });
      }
    });

    bilateralCollabs.forEach(c => {
      const key = c.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push({
          title: c.title,
          streams: Math.floor(c.streams || 0),
          cover: c.cover,
          artist: c.formattedArtistCredits,
          isPlayerPrimary: c.isPlayerPrimary,
          hasMV: c.hasMusicVideo,
          isExplicit: c.isExplicit,
          trackType: c.trackType,
          rawSong: c.rawPlayerSong || c
        });
      }
    });

    return combined.sort((a, b) => b.streams - a.streams).slice(0, 10);
  }, [enrichedNpc.songs, enrichedNpc.name, bilateralCollabs, state]);

  const allReleases = useMemo<NpcReleaseItem[]>(() => {
    const releases: NpcReleaseItem[] = [];
    const songs = enrichedNpc.songs || [];
    const albums = enrichedNpc.albums || [];

    albums.forEach((alb, idx) => {
      const albumTracks =
        alb.tracks && alb.tracks.length > 0
          ? alb.tracks.map(t => {
              const meta = resolveSongMetadataAndCollabCredits(t, enrichedNpc.name, state);
              return {
                title: meta.cleanTitle,
                streams: Math.floor(t.streams ?? 0),
                trackType: t.trackType,
                artist: meta.formattedArtistCredits,
                hasMV: meta.hasMusicVideo,
                isExplicit: meta.isExplicit
              };
            })
          : [
              {
                title: alb.title,
                streams: 0,
                trackType: 'lead_single' as const,
                artist: enrichedNpc.name
              }
            ];

      const totalStreams = albumTracks.reduce((sum, t) => sum + (t.streams ?? 0), 0);

      releases.push({
        id: `npc_alb_${idx}_${alb.title}`,
        title: alb.title,
        type: 'album',
        cover: alb.cover,
        year: alb.year || currentYear - idx,
        streams: totalStreams,
        primaryArtist: enrichedNpc.name,
        tracks: albumTracks
      });
    });

    // Include own released Singles
    songs
      .filter(s => (s as any).trackType !== 'b_side')
      .forEach((s, idx) => {
        const meta = resolveSongMetadataAndCollabCredits(s, enrichedNpc.name, state);
        const songStreams = Math.floor(s.streams ?? 0);
        releases.push({
          id: `npc_sng_${idx}_${meta.cleanTitle}`,
          title: meta.cleanTitle,
          type: 'single',
          cover: s.cover,
          year: currentYear,
          streams: songStreams,
          primaryArtist: meta.formattedArtistCredits,
          tracks: [
            {
              title: meta.cleanTitle,
              streams: songStreams,
              trackType: (s as any).trackType || 'single',
              artist: meta.formattedArtistCredits,
              hasMV: meta.hasMusicVideo,
              isExplicit: meta.isExplicit
            }
          ]
        });
      });

    // Include Bilateral Collaborations in Discography so collab singles appear on the featured artist's profile too!
    bilateralCollabs.forEach((c, idx) => {
      if (releases.some(r => r.title.toLowerCase() === c.title.toLowerCase())) return;
      releases.push({
        id: `npc_bilateral_collab_${idx}_${c.title}`,
        title: c.title,
        type: 'single',
        cover: c.cover,
        year: c.year || currentYear,
        streams: c.streams,
        primaryArtist: c.formattedArtistCredits,
        isPlayerCollab: c.isPlayerPrimary,
        tracks: [
          {
            title: c.title,
            streams: c.streams,
            trackType: c.trackType,
            artist: c.formattedArtistCredits,
            hasMV: c.hasMusicVideo,
            isExplicit: c.isExplicit,
            isPlayer: c.isPlayerPrimary
          }
        ]
      });
    });

    return releases;
  }, [enrichedNpc, bilateralCollabs, currentYear, tracklistVersion, state]);

  const activeRelease = useMemo(() => {
    if (!selectedRelease) return null;
    return allReleases.find(r => r.id === selectedRelease.id) || selectedRelease;
  }, [selectedRelease, allReleases]);

  const handleBack = () => {
    if (selectedRelease) {
      setSelectedRelease(null);
    } else {
      onClose();
    }
  };

  const handleSelectAnotherArtist = (artName: string, isPl: boolean) => {
    if (isPl) {
      onClose();
      return;
    }
    const targetNpc = getDetailedNPC(artName);
    if (targetNpc) {
      setSelectedRelease(null);
      setCurrentNpcTarget(targetNpc);
    }
  };

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#121212] z-50 overflow-y-auto animate-in fade-in hide-scrollbar">
      {/* Top Left Back Button matching Player Spotify Profile */}
      <div className="absolute top-4 left-4 z-40">
        <button
          onClick={handleBack}
          className="bg-black/50 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/70 active:scale-95 transition cursor-pointer backdrop-blur-md"
        >
          <i className="ph ph-caret-left text-xl"></i>
        </button>
      </div>

      {activeRelease ? (
        /* NPC Release Detail View (Identical to Player's renderReleaseDetail) */
        <div className="pb-24">
          <div className="relative pt-16 px-4 pb-6 bg-gradient-to-b from-gray-600 to-[#121212] z-0">
            <div className="flex flex-col items-center mt-4">
              <OfficialArtworkImg
                artist={enrichedNpc.name}
                title={activeRelease.title}
                isAlbum={activeRelease.type === 'album'}
                isPlayer={Boolean(activeRelease.isPlayerCollab)}
                explicitSrc={activeRelease.cover}
                className="w-56 h-56 object-cover shadow-2xl mb-6 rounded-sm"
              />
              <h2 className="text-3xl font-black text-white text-center leading-tight">
                {activeRelease.title}
              </h2>
              <div
                className="flex items-center space-x-2 mt-3 cursor-pointer"
                onClick={() => setSelectedRelease(null)}
              >
                <OfficialArtworkImg
                  artist={enrichedNpc.name}
                  isArtistPortrait={true}
                  explicitSrc={enrichedNpc.image || enrichedNpc.avatar}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-white text-sm font-bold hover:underline">
                  {activeRelease.primaryArtist || enrichedNpc.name}
                </span>
              </div>
              <p className="text-gray-400 text-sm capitalize font-medium mt-1">
                {activeRelease.type} • {activeRelease.year} •{' '}
                <span className="text-white font-bold">
                  {formatNum(activeRelease.streams)} streams
                </span>
              </p>
            </div>
          </div>

          <div className="px-4 mb-6 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex space-x-6 items-center">
                <i className="ph ph-heart text-3xl text-[#1DB954] hover:text-[#1ed760] transition cursor-pointer"></i>
                <i className="ph ph-arrow-circle-down text-3xl text-gray-400 hover:text-white transition cursor-pointer"></i>
                <i className="ph ph-dots-three text-3xl text-gray-400 hover:text-white transition cursor-pointer"></i>
              </div>
              <button className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-lg hover:bg-[#1ed760] hover:scale-105 cursor-pointer">
                <i className="ph-fill ph-play text-2xl translate-x-[2px]"></i>
              </button>
            </div>
          </div>

          <div className="px-4 relative z-10 space-y-1">
            {activeRelease.tracks.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 hover:bg-white/10 rounded-md transition group cursor-pointer px-3 -mx-3"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1 pr-3">
                  <span className="text-gray-400 font-medium w-4 text-center text-sm shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <h4 className="text-white font-medium text-base leading-tight truncate">
                        {s.title}
                      </h4>
                      {s.trackType === 'b_side' ? (
                        <span className="text-[8px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/40 uppercase font-bold shrink-0">
                          B-Side
                        </span>
                      ) : s.trackType === 'lead_single' ? (
                        <span className="text-[8px] bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/40 uppercase font-bold shrink-0">
                          Lead Single
                        </span>
                      ) : (
                        <span className="text-[8px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/40 uppercase font-bold shrink-0">
                          Single
                        </span>
                      )}
                    </div>
                    <SpotifyTrackSubRow
                      songOrItem={s}
                      fallbackArtistName={s.artist || enrichedNpc.name}
                      state={state}
                      onSelectArtistName={handleSelectAnotherArtist}
                    />
                  </div>
                </div>
                <div className="text-gray-400 text-xs text-right flex items-center space-x-3 shrink-0">
                  <span className="text-gray-300 font-semibold">
                    {formatNum(s.streams || 0)}
                  </span>
                  <i className="ph ph-dots-three text-xl hover:text-white transition"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* NPC Main Spotify Profile View (Identical to Player's renderProfile) */
        <div className="pb-24">
          <div className="relative h-[40vh] min-h-[300px] overflow-hidden bg-zinc-900">
            <OfficialArtworkImg
              artist={enrichedNpc.name}
              explicitSrc={enrichedNpc.image || enrichedNpc.avatar}
              isArtistPortrait={true}
              alt={enrichedNpc.name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center space-x-1.5 mb-2">
                <i className="ph-fill ph-check-circle text-blue-400 text-lg"></i>
                <span className="text-xs font-semibold text-white tracking-widest uppercase">
                  Verified Artist
                </span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-2 leading-none">
                {enrichedNpc.name}
              </h1>
              <p className="text-gray-300 font-medium text-sm">
                {formatNumFull(monthlyListeners)} monthly listeners
              </p>
            </div>
          </div>

          <div className="p-4 -mt-2 relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-4 items-center">
                <button className="px-4 py-1.5 rounded-full border border-gray-400 text-white text-xs font-bold hover:border-white active:scale-95 transition cursor-pointer">
                  Following
                </button>
                <button className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-white active:scale-95 transition cursor-pointer">
                  <i className="ph ph-dots-three text-xl"></i>
                </button>
              </div>
              <button className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-lg hover:bg-[#1ed760] cursor-pointer">
                <i className="ph-fill ph-play text-2xl translate-x-[2px]"></i>
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Popular</h3>
            <div className="space-y-1 mb-10">
              {topSongs.length > 0 ? (
                topSongs.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 hover:bg-white/10 rounded-md transition group cursor-pointer"
                    onClick={() =>
                      setSelectedRelease({
                        id: `pop_${i}_${s.title}`,
                        title: s.title,
                        type: 'single',
                        cover: s.cover,
                        year: currentYear,
                        streams: Math.floor(s.streams ?? 0),
                        primaryArtist: s.artist,
                        isPlayerCollab: s.isPlayerPrimary,
                        tracks: [
                          {
                            title: s.title,
                            streams: Math.floor(s.streams ?? 0),
                            trackType: s.trackType || 'single',
                            artist: s.artist,
                            hasMV: s.hasMV,
                            isExplicit: s.isExplicit,
                            isPlayer: s.isPlayerPrimary
                          }
                        ]
                      })
                    }
                  >
                    <div className="flex items-center space-x-4 min-w-0 flex-1 pr-3">
                      <span className="text-gray-400 font-medium w-4 text-center text-sm shrink-0">
                        {i + 1}
                      </span>
                      <OfficialArtworkImg
                        artist={s.artist.split(',')[0].trim() || enrichedNpc.name}
                        title={s.title}
                        isAlbum={false}
                        isPlayer={Boolean(s.isPlayerPrimary)}
                        explicitSrc={s.cover}
                        className="w-12 h-12 rounded object-cover bg-gray-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm leading-tight truncate">
                          {s.title}
                        </h4>
                        <SpotifyTrackSubRow
                          songOrItem={{
                            ...s.rawSong,
                            title: s.title,
                            artist: s.artist,
                            hasMV: s.hasMV,
                            isExplicit: s.isExplicit,
                            isPlayer: s.isPlayerPrimary
                          }}
                          fallbackArtistName={s.artist}
                          state={state}
                          showArtists={true}
                          customSubText={formatNumFull(Math.floor(s.streams))}
                          onSelectArtistName={handleSelectAnotherArtist}
                        />
                      </div>
                    </div>
                    <i className="ph ph-dots-three text-xl text-gray-400 group-hover:text-white transition shrink-0"></i>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No releases yet.
                </p>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Discography</h3>
            <div className="flex overflow-x-auto space-x-4 hide-scrollbar pb-4 -mx-4 px-4">
              {allReleases.length > 0 ? (
                allReleases.map(p => (
                  <div
                    key={p.id}
                    className="w-36 flex-shrink-0 group cursor-pointer"
                    onClick={() => setSelectedRelease(p)}
                  >
                    <OfficialArtworkImg
                      artist={(p.primaryArtist || enrichedNpc.name).split(',')[0].trim()}
                      title={p.title}
                      isAlbum={p.type !== 'single'}
                      isPlayer={Boolean(p.isPlayerCollab)}
                      explicitSrc={p.cover}
                      className="w-36 h-36 object-cover rounded-md mb-3 shadow-md"
                    />
                    <h4 className="text-white font-bold text-sm truncate">
                      {p.title}
                    </h4>
                    <p className="text-gray-400 text-xs mt-1 capitalize truncate">
                      {p.type} • {p.year}
                      {p.primaryArtist && p.primaryArtist.includes(',')
                        ? ` • ${p.primaryArtist}`
                        : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-3 text-center w-full">
                  No releases yet.
                </p>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-4 mt-8">About</h3>
            <div className="bg-[#282828] rounded-xl hover:bg-[#333] transition cursor-pointer relative overflow-hidden mb-8 h-80 group">
              <OfficialArtworkImg
                artist={enrichedNpc.name}
                explicitSrc={enrichedNpc.image || enrichedNpc.avatar}
                isArtistPortrait={true}
                alt={enrichedNpc.name}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-black text-2xl">
                  {formatNumFull(monthlyListeners)}
                </p>
                <p className="text-gray-300 text-sm font-medium uppercase tracking-widest mt-0.5">
                  Monthly Listeners
                </p>
                <p className="text-gray-300 text-xs mt-3 leading-relaxed line-clamp-3">
                  {enrichedNpc.bio ||
                    `Hailing from ${enrichedNpc.country || 'US'}, ${enrichedNpc.name} is breaking records in the global ${enrichedNpc.genre || 'Pop'} music industry.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
