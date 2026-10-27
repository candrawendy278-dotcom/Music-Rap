import React, { useState, useMemo } from 'react';
import { GameState } from '../../types';
import { formatNum, formatNumFull, SPOTIFY_PLAYLISTS } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  AUTHENTIC_SPOTIFY_PLAYLISTS,
  SpotifyPlaylistDefinition
} from '../../data/authenticSpotifyPlaylistSystem';
import { EXPANDED_SPOTIFY_PLAYLISTS } from '../../data/spotifyCatalogExpanded';
import {
  evaluateSongPitchPreview,
  buildPlayerPlaylistAnalytics
} from '../../data/enhancedPlaylistCurationEngine';
import { generateCuratedSpotifyPlaylists } from '../../data/spotifyPlaylistsManager';

interface SpotifyPlaylistPitchModalProps {
  playlistId: string;
  state: GameState;
  onClose: () => void;
  onPitchSong: (songId: number, playlistId: string) => void;
  onExitPlaylist: (songId: number, playlistId: string) => void;
}

export const SpotifyPlaylistPitchModal: React.FC<SpotifyPlaylistPitchModalProps> = ({
  playlistId,
  state,
  onClose,
  onPitchSong,
  onExitPlaylist
}) => {
  const pl =
    AUTHENTIC_SPOTIFY_PLAYLISTS.find(p => p.id === playlistId) ||
    EXPANDED_SPOTIFY_PLAYLISTS.find(p => p.id === playlistId) ||
    SPOTIFY_PLAYLISTS.find(p => p.id === playlistId);

  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

  if (!pl) return null;

  const releasedSongs = [...state.songs]
    .filter(s => s.status === 'released')
    .sort((a, b) => new Date(b.releaseDate || state.date).getTime() - new Date(a.releaseDate || state.date).getTime());

  const gradient = (pl as any).gradient || 'from-emerald-700 to-zinc-900';
  const followers = (pl as any).followers || 2_500_000;
  const curator = (pl as any).curator || 'Spotify Editorial';

  return (
    <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-end justify-center sm:items-center animate-in fade-in">
      <div className="bg-[#181818] border border-white/10 w-full max-w-md h-[86vh] sm:h-[78vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Top Editorial Banner */}
        <div className={`relative p-4 pb-5 bg-gradient-to-br ${gradient} border-b border-white/10 shrink-0`}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/45 to-black/25" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow">
                <i className="ph-fill ph-spotify-logo text-base"></i>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954] block">
                  Spotify for Artists • Pitch Desk
                </span>
                <span className="text-[11px] text-white/80 font-medium">
                  {curator} • {formatNum(followers)} saves
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center transition cursor-pointer"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>

          <div className="relative z-10 mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
              {pl.name}
            </h3>
            <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">
              {pl.desc}
            </p>
          </div>
        </div>

        {/* Song Selection & Pre-Pitch Telemetry */}
        <div className="p-4 flex-1 overflow-y-auto hide-scrollbar space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#A7A7A7] px-0.5">
            <span>Select Track to Pitch ({releasedSongs.length})</span>
            <span className="text-[#1DB954]">Live Editorial Odds</span>
          </div>

          {releasedSongs.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] rounded-xl border border-white/5 p-6">
              <i className="ph ph-music-notes-Simple text-3xl text-zinc-500 mb-2 block"></i>
              <p className="text-sm font-bold text-white">Belum Ada Lagu Rilis</p>
              <p className="text-xs text-zinc-400 mt-1">
                Rilis lagu atau single terlebih dahulu di Studio untuk mengajukan pitch ke kurator Spotify.
              </p>
            </div>
          ) : (
            releasedSongs.map(song => {
              const preview = evaluateSongPitchPreview(song, playlistId, state);
              const isExpanded = expandedSongId === song.id || preview.alreadyPlaced;
              const isBSide = song.trackType === 'b_side';

              let chanceBadgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
              if (preview.alreadyPlaced) {
                chanceBadgeClass = 'bg-[#1DB954]/20 text-[#1DB954] border-[#1DB954]/40';
              } else if (preview.acceptanceChancePercent >= 75) {
                chanceBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              } else if (preview.acceptanceChancePercent >= 45) {
                chanceBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              } else if (preview.acceptanceChancePercent > 0) {
                chanceBadgeClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
              } else {
                chanceBadgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
              }

              return (
                <div
                  key={song.id}
                  className={`rounded-xl border transition overflow-hidden ${
                    preview.alreadyPlaced
                      ? 'bg-[#1DB954]/10 border-[#1DB954]/35'
                      : 'bg-[#222222] border-white/8 hover:border-white/15'
                  }`}
                >
                  <div className="p-3 flex items-center justify-between gap-2.5">
                    <div
                      onClick={() => setExpandedSongId(expandedSongId === song.id ? null : song.id)}
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <OfficialArtworkImg
                        artist={state.artist?.name || 'Artist'}
                        title={song.title}
                        isAlbum={false}
                        isPlayer={true}
                        explicitSrc={song.cover}
                        className="w-12 h-12 rounded-[6px] object-cover shrink-0 bg-zinc-800 shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                              isBSide
                                ? 'bg-purple-950/60 text-purple-300 border-purple-700/40'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
                            }`}
                          >
                            {isBSide ? 'B-Side' : 'Single'}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[11px] text-[#A7A7A7] tabular-nums">
                          <span>Q: <strong className="text-white">{Math.round(song.quality || 50)}</strong></span>
                          <span>•</span>
                          <span>{formatNum(song.dailyStreams || 0)}/day</span>
                          <span>•</span>
                          <span className="text-[#1DB954] font-semibold">
                            Est. +{formatNum(preview.estimatedDailyStreamBoost)}/d
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border tabular-nums ${chanceBadgeClass}`}
                      >
                        {preview.alreadyPlaced
                          ? 'ACTIVE'
                          : `${preview.acceptanceChancePercent}% Odds`}
                      </span>

                      {preview.alreadyPlaced ? (
                        <button
                          onClick={() => onExitPlaylist(song.id, playlistId)}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => onPitchSong(song.id, playlistId)}
                          className="text-xs font-black px-3.5 py-1 rounded-full bg-[#1DB954] text-black hover:bg-[#1ed760] active:scale-95 transition cursor-pointer shadow"
                        >
                          Submit Pitch
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Criteria Inspection Bar */}
                  <div className="px-3 pb-2.5 pt-1 border-t border-white/5 bg-black/25">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                      <span>
                        Projected Entry: <strong className="text-white tabular-nums">#{preview.estimatedEntryRank}</strong>
                      </span>
                      <button
                        onClick={() => setExpandedSongId(expandedSongId === song.id ? null : song.id)}
                        className="text-[#1DB954] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{isExpanded ? 'Hide Criteria' : 'Editorial Criteria'}</span>
                        <i className={`ph ph-caret-${isExpanded ? 'up' : 'down'}`}></i>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-1.5 pt-1 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-1.5">
                          {preview.criteria.map((c, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border text-[10px] flex items-center justify-between ${
                                c.passed
                                  ? 'bg-emerald-950/25 border-emerald-500/25 text-emerald-200'
                                  : 'bg-rose-950/25 border-rose-500/25 text-rose-200'
                              }`}
                            >
                              <div className="min-w-0 pr-1">
                                <div className="text-[9px] uppercase tracking-wider opacity-75 truncate">
                                  {c.label}
                                </div>
                                <div className="font-bold text-white tabular-nums truncate">
                                  {c.currentValue}{' '}
                                  <span className="opacity-60 font-normal">({c.targetValue})</span>
                                </div>
                              </div>
                              <i
                                className={`ph-fill ${
                                  c.passed
                                    ? 'ph-check-circle text-[#1DB954]'
                                    : 'ph-warning-circle text-rose-400'
                                } text-sm shrink-0`}
                              ></i>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed pt-0.5">
                          {preview.curatorNote}
                        </p>
                      </div>
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
};

interface SpotifyPlaylistAnalyticsHubModalProps {
  state: GameState;
  onClose: () => void;
  onOpenPlaylist: (pl: SpotifyPlaylistDefinition) => void;
  onOpenPitchModal: (playlistId: string) => void;
  onExitPlaylist: (songId: number, playlistId: string) => void;
}

export const SpotifyPlaylistAnalyticsHubModal: React.FC<SpotifyPlaylistAnalyticsHubModalProps> = ({
  state,
  onClose,
  onOpenPlaylist,
  onOpenPitchModal,
  onExitPlaylist
}) => {
  const [hubTab, setHubTab] = useState<'active' | 'directory'>('active');
  const [catFilter, setCatFilter] = useState<'all' | 'flagship' | 'mood' | 'algorithmic'>('all');

  const curatedMap = useMemo(() => {
    return generateCuratedSpotifyPlaylists(
      state.songs,
      state.artist?.name || '',
      state.popularity || 30
    );
  }, [state.songs, state.artist?.name, state.popularity]);

  const analytics = useMemo(() => {
    return buildPlayerPlaylistAnalytics(state, curatedMap);
  }, [state, curatedMap]);

  const filteredDirectory = useMemo(() => {
    if (catFilter === 'all') return AUTHENTIC_SPOTIFY_PLAYLISTS;
    if (catFilter === 'flagship') {
      return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p => p.category === 'flagship');
    }
    if (catFilter === 'algorithmic') {
      return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p => p.category === 'algorithmic');
    }
    return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(
      p => p.category === 'mood' || p.category === 'focus' || p.category === 'party'
    );
  }, [catFilter]);

  return (
    <div className="fixed inset-0 z-[72] bg-black/85 backdrop-blur-sm flex items-end justify-center sm:items-center animate-in fade-in">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md h-[90vh] sm:h-[84vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-gradient-to-b from-[#1DB954]/25 via-[#181818] to-[#121212] border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow">
                <i className="ph-fill ph-playlist text-lg"></i>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954] block">
                  Spotify for Artists
                </span>
                <h2 className="text-lg font-black text-white tracking-tight leading-none">
                  Editorial & Playlisting Hub
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>

          {/* 4-Metric Telemetry Strip */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-[#1E1E1E] border border-white/8 rounded-xl p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#A7A7A7]">
                Active Spots
              </div>
              <div className="text-base font-black text-white tabular-nums mt-0.5">
                {analytics.placements.length}
              </div>
            </div>
            <div className="bg-[#1E1E1E] border border-white/8 rounded-xl p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#A7A7A7]">
                Daily Boost
              </div>
              <div className="text-base font-black text-[#1DB954] tabular-nums mt-0.5">
                +{formatNum(analytics.totalDailyPlaylistStreams)}
              </div>
            </div>
            <div className="bg-[#1E1E1E] border border-white/8 rounded-xl p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#A7A7A7]">
                Cover Stars
              </div>
              <div className="text-base font-black text-amber-400 tabular-nums mt-0.5">
                {analytics.coverStarCount}
              </div>
            </div>
            <div className="bg-[#1E1E1E] border border-white/8 rounded-xl p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#A7A7A7]">
                Total Reach
              </div>
              <div className="text-base font-black text-white tabular-nums mt-0.5">
                {formatNum(analytics.totalPlaylistReachFollowers)}
              </div>
            </div>
          </div>

          {/* Sub-Navigation Switch */}
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 mt-3.5">
            <button
              onClick={() => setHubTab('active')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                hubTab === 'active'
                  ? 'bg-[#1DB954] text-black font-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active Placements ({analytics.placements.length})
            </button>
            <button
              onClick={() => setHubTab('directory')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                hubTab === 'directory'
                  ? 'bg-[#1DB954] text-black font-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pitch to Curators (18)
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto hide-scrollbar space-y-3">
          {hubTab === 'active' ? (
            analytics.placements.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-white/8 p-6">
                <i className="ph-fill ph-spotify-logo text-4xl text-[#1DB954] mb-2 block"></i>
                <h3 className="text-base font-black text-white">No Active Playlist Placements</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Pitch your released singles to Spotify editors or build momentum on Release Radar & Discover Weekly to unlock playlist reach.
                </p>
                <button
                  onClick={() => setHubTab('directory')}
                  className="mt-4 px-5 py-2 rounded-full bg-[#1DB954] text-black font-black text-xs hover:bg-[#1ed760] transition cursor-pointer"
                >
                  Browse 18 Playlists to Pitch
                </button>
              </div>
            ) : (
              analytics.placements.map((item, idx) => (
                <div
                  key={`${item.playlistId}-${item.songId}-${idx}`}
                  className="bg-[#1C1C1C] hover:bg-[#242424] border border-white/8 rounded-xl p-3 transition"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div
                      onClick={() => {
                        onClose();
                        onOpenPlaylist(item.playlistDef);
                      }}
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-[6px] overflow-hidden relative shrink-0 bg-zinc-900 shadow">
                        <OfficialArtworkImg
                          artist={state.artist?.name || 'Artist'}
                          title={item.songTitle}
                          explicitSrc={item.songCover}
                          isPlayer={true}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-45`} />
                        <span
                          className={`absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded shadow tabular-nums ${
                            item.isCoverStar
                              ? 'bg-amber-400 text-black'
                              : 'bg-black/85 text-[#1DB954]'
                          }`}
                        >
                          #{item.rank}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB954] truncate">
                            {item.playlistName}
                          </span>
                          {item.isCoverStar && (
                            <span className="text-[8px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded shrink-0">
                              ★ COVER STAR
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-white truncate mt-0.5">
                          {item.songTitle}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5 tabular-nums">
                          <span className="text-emerald-400 font-bold">
                            +{formatNumFull(item.dailyStreamBoost)} streams/day
                          </span>
                          <span>•</span>
                          <span>Day {item.daysOnPlaylist}/{item.maxTenureDays}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.statusTag === 'COVER STAR'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : item.statusTag === 'POWER ROTATION'
                            ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40'
                            : item.statusTag === 'EXPIRING SOON'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-white/10 text-zinc-300'
                        }`}
                      >
                        {item.statusTag}
                      </span>
                      <button
                        onClick={() => onExitPlaylist(item.songId, item.playlistId)}
                        className="text-[10px] font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 px-2.5 py-1 rounded-full border border-rose-500/30 transition cursor-pointer"
                      >
                        Exit
                      </button>
                    </div>
                  </div>

                  {/* Tenure Progress Bar */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="flex-1 bg-black/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.tenureHealthPercent > 35 ? 'bg-[#1DB954]' : 'bg-amber-400'
                        }`}
                        style={{ width: `${item.tenureHealthPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">
                      {formatNum(item.followers)} reach
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-3">
              {/* Category Filter Chips */}
              <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-1">
                {(
                  [
                    { id: 'all', label: 'All Playlists (18)' },
                    { id: 'flagship', label: 'Flagship Editorial' },
                    { id: 'mood', label: 'Mood & Genre' },
                    { id: 'algorithmic', label: 'Algorithmic' }
                  ] as const
                ).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCatFilter(c.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition cursor-pointer ${
                      catFilter === c.id
                        ? 'bg-white text-black'
                        : 'bg-[#242424] text-zinc-300 hover:bg-[#303030]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {filteredDirectory.map(pl => {
                const activeOnPl = analytics.placements.filter(p => p.playlistId === pl.id);
                return (
                  <div
                    key={pl.id}
                    className="bg-[#1C1C1C] hover:bg-[#242424] border border-white/8 rounded-xl p-3 flex items-center justify-between gap-3 transition"
                  >
                    <div
                      onClick={() => {
                        onClose();
                        onOpenPlaylist(pl);
                      }}
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-[6px] bg-gradient-to-br ${pl.gradient} flex flex-col justify-between p-1.5 shrink-0 shadow relative overflow-hidden`}
                      >
                        <i className="ph-fill ph-spotify-logo text-white text-xs"></i>
                        <span className="text-[8px] font-black text-white leading-tight line-clamp-2">
                          {pl.name}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-sm font-black text-white truncate">{pl.name}</h4>
                          {activeOnPl.length > 0 && (
                            <span className="text-[9px] font-black bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 px-1.5 py-0.2 rounded-full shrink-0 tabular-nums">
                              {activeOnPl.length} Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{pl.desc}</p>
                        <div className="text-[10px] text-zinc-500 mt-0.5 tabular-nums">
                          {pl.curator} • {formatNum(pl.followers)} saves
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenPitchModal(pl.id)}
                      className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-[#1DB954] font-black text-xs transition shrink-0 cursor-pointer shadow active:scale-95"
                    >
                      Pitch
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
