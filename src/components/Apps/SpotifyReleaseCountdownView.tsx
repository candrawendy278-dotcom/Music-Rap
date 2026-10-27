import React, { useState, useEffect, useRef } from 'react';
import { GameState, Project, Song } from '../../types';
import { formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  calculateReleaseCountdownBreakdown,
  getProjectCopyrightLines,
  getTrackRoleBadgeMeta,
  NpcUpcomingCountdownData,
  ExtendedTrackRole
} from '../../data/preReleaseCountdownEngine';

export interface UnifiedCountdownRelease {
  id: string | number;
  isPlayer: boolean;
  title: string;
  artistName: string;
  artistAvatar?: string;
  type: 'album' | 'ep' | 'single_pack';
  releaseDate: string;
  cover?: string;
  preSaves: number;
  dailyPreSaves?: number;
  distributor?: string;
  labelName?: string;
  rawProject?: Project;
  tracks: Array<{
    id: number | string;
    title: string;
    artistName: string;
    isReleased: boolean;
    trackType?: ExtendedTrackRole | string;
    streams?: number;
    isExplicit?: boolean;
    rawSong?: Song;
  }>;
}

/**
 * Converts a Player's scheduled Project into a UnifiedCountdownRelease for the Spotify Profile & Countdown Page.
 */
export function buildPlayerUnifiedCountdown(
  project: Project,
  state: GameState
): UnifiedCountdownRelease {
  const artistName = state.artist?.name || 'Artist';
  const liveTracks = (project.songs || []).map(ps => {
    const liveSong = state.songs.find(s => s.id === ps.id) || ps;
    const isReleased = liveSong.status === 'released';
    return {
      id: liveSong.id,
      title: liveSong.title,
      artistName,
      isReleased,
      trackType: liveSong.trackType || (isReleased ? 'pre_release_single' : 'b_side'),
      streams: liveSong.streams || 0,
      isExplicit: liveSong.isExplicit,
      rawSong: liveSong
    };
  });

  return {
    id: project.id,
    isPlayer: true,
    title: project.title,
    artistName,
    artistAvatar: state.artist?.image,
    type: project.type,
    releaseDate: project.releaseDate || state.date,
    cover: project.cover,
    preSaves: project.preSaves || 0,
    dailyPreSaves: project.dailyPreSaves || 0,
    distributor: project.distributor,
    labelName: project.recordLabel,
    rawProject: project,
    tracks: liveTracks
  };
}

/**
 * Converts an NPC's upcoming countdown data into a UnifiedCountdownRelease.
 */
export function buildNpcUnifiedCountdown(
  npcCountdown: NpcUpcomingCountdownData
): UnifiedCountdownRelease {
  return {
    id: npcCountdown.id,
    isPlayer: false,
    title: npcCountdown.title,
    artistName: npcCountdown.artistName,
    artistAvatar: npcCountdown.artistAvatar,
    type: npcCountdown.type,
    releaseDate: npcCountdown.releaseDate,
    cover: npcCountdown.cover,
    preSaves: npcCountdown.preSaves,
    labelName: npcCountdown.labelName,
    tracks: npcCountdown.tracks.map(t => ({
      id: t.id,
      title: t.title,
      artistName: t.artistName,
      isReleased: t.isReleased,
      trackType: t.trackType,
      streams: t.streams,
      isExplicit: t.isExplicit
    }))
  };
}

interface SpotifyArtistUpcomingReleaseBannerProps {
  countdownRelease: UnifiedCountdownRelease;
  currentDateStr: string;
  onOpenCountdownPage: () => void;
}

/**
 * Embedded "Upcoming release" countdown card shown exclusively on the Spotify Artist Profile page.
 */
export const SpotifyArtistUpcomingReleaseBanner: React.FC<
  SpotifyArtistUpcomingReleaseBannerProps
> = ({ countdownRelease, currentDateStr, onOpenCountdownPage }) => {
  const [tickSeconds, setTickSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timer = calculateReleaseCountdownBreakdown(
    currentDateStr,
    countdownRelease.releaseDate,
    tickSeconds
  );

  const formatLabel =
    countdownRelease.type === 'ep'
      ? 'EP'
      : countdownRelease.type === 'single_pack'
      ? 'Single'
      : 'Album';

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">Upcoming release</h3>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1ED760] bg-[#1ED760]/10 px-2.5 py-0.5 rounded-full border border-[#1ED760]/30">
          Countdown Active
        </span>
      </div>

      <div
        onClick={onOpenCountdownPage}
        className="bg-gradient-to-br from-[#242424] via-[#1A1A1A] to-[#141414] hover:from-[#2A2A2A] hover:to-[#181818] border border-white/10 rounded-xl p-3.5 transition cursor-pointer shadow-xl group"
      >
        {/* Top Row: Artwork + Metadata */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <OfficialArtworkImg
              artist={countdownRelease.artistName}
              title={countdownRelease.title}
              isAlbum={true}
              isPlayer={countdownRelease.isPlayer}
              explicitSrc={countdownRelease.cover}
              className="w-16 h-16 rounded-md object-cover shadow-lg bg-[#282828]"
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1ED760] block">
              {formatLabel} • Releases {timer.shortReleaseDate}
            </span>
            <h4 className="text-white font-black text-base truncate mt-0.5 group-hover:underline">
              {countdownRelease.title}
            </h4>
          </div>
        </div>

        {/* Bottom Row: Authentic 4-Column Countdown Strip */}
        <div className="mt-3.5 bg-[#121212]/90 rounded-lg py-2.5 px-3 border border-white/5 grid grid-cols-4 divide-x divide-white/10 text-center">
          <div>
            <div className="text-base font-black text-white tabular-nums leading-tight">
              {String(timer.days).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-[#A7A7A7] font-medium">Days</div>
          </div>
          <div>
            <div className="text-base font-black text-white tabular-nums leading-tight">
              {String(timer.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-[#A7A7A7] font-medium">Hours</div>
          </div>
          <div>
            <div className="text-base font-black text-white tabular-nums leading-tight">
              {String(timer.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-[#A7A7A7] font-medium">Minutes</div>
          </div>
          <div>
            <div className="text-base font-black text-[#1ED760] tabular-nums leading-tight">
              {String(timer.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-[#A7A7A7] font-medium">Seconds</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SpotifyReleaseCountdownPageProps {
  countdownRelease: UnifiedCountdownRelease;
  currentDateStr: string;
  onBack: () => void;
  onSelectTrack?: (track: UnifiedCountdownRelease['tracks'][number]) => void;
  onEarlyReleaseTrack?: (
    projectId: number,
    songId: number,
    role: 'lead_single' | 'pre_release_single' | 'promotional_single' | 'single'
  ) => void;
}

/**
 * Full-screen authentic Spotify Countdown Page modeled directly after the reference screenshots:
 * - Sticky compact countdown bar on scroll
 * - Large centered square artwork
 * - Dark rounded countdown card with mini cover + Days | Hours | Minutes | Seconds
 * - Project Title, Artist Avatar & Name, "EP/Album • Releases on Month Day, Year"
 * - Share button & green "Pre-save (+)" pill button
 * - "Tracklist preview" with bright playable pre-released singles & muted grey locked tracks
 * - Player-only Pre-Release Single launcher so players can drop pre-release singles during the countdown
 * - Copyright & Phonographic footer (© / ℗)
 */
export const SpotifyReleaseCountdownPage: React.FC<SpotifyReleaseCountdownPageProps> = ({
  countdownRelease,
  currentDateStr,
  onBack,
  onSelectTrack,
  onEarlyReleaseTrack
}) => {
  const [tickSeconds, setTickSeconds] = useState(0);
  const [isPreSaved, setIsPreSaved] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [earlyDropTargetSongId, setEarlyDropTargetSongId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolledPastHero(scrollTop > 250);
  };

  const timer = calculateReleaseCountdownBreakdown(
    currentDateStr,
    countdownRelease.releaseDate,
    tickSeconds
  );

  const formatLabel =
    countdownRelease.type === 'ep'
      ? 'EP'
      : countdownRelease.type === 'single_pack'
      ? 'Single'
      : 'Album';

  const { copyrightLine, phonographicLine } = getProjectCopyrightLines(
    countdownRelease.artistName,
    countdownRelease.releaseDate,
    countdownRelease.distributor,
    countdownRelease.labelName
  );

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="fixed inset-0 w-full max-w-md mx-auto bg-[#121212] z-[60] overflow-y-auto hide-scrollbar animate-in fade-in duration-200 pb-28"
    >
      {/* STICKY COMPACT COUNTDOWN BAR ON SCROLL (Screenshot 1) */}
      {isScrolledPastHero ? (
        <div className="sticky top-0 left-0 right-0 z-50 px-3 pt-3 pb-2 bg-[#121212]/95 backdrop-blur-md">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onBack}
                className="text-white hover:text-[#1ED760] transition p-1 cursor-pointer"
              >
                <i className="ph-bold ph-arrow-left text-lg"></i>
              </button>
              <OfficialArtworkImg
                artist={countdownRelease.artistName}
                title={countdownRelease.title}
                isAlbum={true}
                isPlayer={countdownRelease.isPlayer}
                explicitSrc={countdownRelease.cover}
                className="w-11 h-11 rounded-[6px] object-cover shadow"
              />
            </div>

            <div className="flex-1 grid grid-cols-4 divide-x divide-white/10 text-center mx-2">
              <div>
                <div className="text-[17px] font-black text-white tabular-nums leading-tight">
                  {String(timer.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-[#A7A7A7]">Days</div>
              </div>
              <div>
                <div className="text-[17px] font-black text-white tabular-nums leading-tight">
                  {String(timer.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-[#A7A7A7]">Hours</div>
              </div>
              <div>
                <div className="text-[17px] font-black text-white tabular-nums leading-tight">
                  {String(timer.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-[#A7A7A7]">Minutes</div>
              </div>
              <div>
                <div className="text-[17px] font-black text-white tabular-nums leading-tight">
                  {String(timer.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-[#A7A7A7]">Seconds</div>
              </div>
            </div>

            <button className="text-white/80 hover:text-white p-1 shrink-0 cursor-pointer">
              <i className="ph-bold ph-dots-three-vertical text-lg"></i>
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD TOP NAV BAR (Screenshot 2) */
        <div className="sticky top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-4 pb-2 bg-transparent">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <i className="ph-bold ph-arrow-left text-xl"></i>
          </button>
          <button className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-md">
            <i className="ph-bold ph-dots-three-vertical text-xl"></i>
          </button>
        </div>
      )}

      {/* HERO ARTWORK & COUNTDOWN HEADER */}
      <div className="relative px-4 pt-2 pb-4 bg-gradient-to-b from-[#2c3e4c]/85 via-[#182026]/70 to-[#121212] -mt-12 pt-14">
        {/* Large Centered Album Artwork */}
        <div className="flex justify-center mb-6">
          <OfficialArtworkImg
            artist={countdownRelease.artistName}
            title={countdownRelease.title}
            isAlbum={true}
            isPlayer={countdownRelease.isPlayer}
            explicitSrc={countdownRelease.cover}
            className="w-64 h-64 rounded-[8px] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.75)] bg-[#282828]"
          />
        </div>

        {/* Authentic Spotify Countdown Bar with Mini Cover & 4 Columns */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-xl mb-6">
          <OfficialArtworkImg
            artist={countdownRelease.artistName}
            title={countdownRelease.title}
            isAlbum={true}
            isPlayer={countdownRelease.isPlayer}
            explicitSrc={countdownRelease.cover}
            className="w-13 h-13 rounded-[6px] object-cover shrink-0 shadow"
          />

          <div className="flex-1 grid grid-cols-4 divide-x divide-white/10 text-center ml-2">
            <div className="px-1">
              <div className="text-[20px] font-black text-white tabular-nums leading-tight">
                {String(timer.days).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-[#A7A7A7] font-medium mt-0.5">Days</div>
            </div>
            <div className="px-1">
              <div className="text-[20px] font-black text-white tabular-nums leading-tight">
                {String(timer.hours).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-[#A7A7A7] font-medium mt-0.5">Hours</div>
            </div>
            <div className="px-1">
              <div className="text-[20px] font-black text-white tabular-nums leading-tight">
                {String(timer.minutes).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-[#A7A7A7] font-medium mt-0.5">Minutes</div>
            </div>
            <div className="px-1">
              <div className="text-[20px] font-black text-white tabular-nums leading-tight">
                {String(timer.seconds).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-[#A7A7A7] font-medium mt-0.5">Seconds</div>
            </div>
          </div>
        </div>

        {/* Project Title, Artist Row, and Release Date */}
        <div className="text-left">
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">
            {countdownRelease.title}
          </h1>

          <div
            onClick={onBack}
            className="flex items-center space-x-2 mt-2.5 cursor-pointer w-fit"
          >
            <OfficialArtworkImg
              artist={countdownRelease.artistName}
              isArtistPortrait={true}
              isPlayer={countdownRelease.isPlayer}
              explicitSrc={countdownRelease.artistAvatar}
              className="w-6 h-6 rounded-full object-cover bg-zinc-800"
            />
            <span className="text-white text-xs font-extrabold tracking-wide uppercase hover:underline">
              {countdownRelease.artistName}
            </span>
          </div>

          <p className="text-[#A7A7A7] text-xs font-medium mt-2.5">
            {formatLabel} • Releases on {timer.formattedReleaseDate}
          </p>
        </div>

        {/* Share & Pre-save Action Bar */}
        <div className="flex items-center justify-between mt-4 pt-1">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                setShareToast(true);
                setTimeout(() => setShareToast(false), 2200);
              }}
              className="text-white/90 hover:text-white transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Share Countdown"
            >
              <i className="ph ph-share-network text-2xl"></i>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPreSaved(p => !p)}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 transition active:scale-95 cursor-pointer ${
              isPreSaved
                ? 'bg-white/15 text-white border border-white/30'
                : 'bg-[#1ED760] hover:bg-[#1fdf64] text-black shadow-lg'
            }`}
          >
            <span>{isPreSaved ? 'Pre-saved' : 'Pre-save'}</span>
            <i className={`ph-bold ${isPreSaved ? 'ph-check-circle' : 'ph-plus-circle'} text-base`}></i>
          </button>
        </div>

        {shareToast && (
          <div className="mt-3 bg-[#1ED760]/15 border border-[#1ED760]/40 text-[#1ED760] text-xs font-semibold px-3 py-2 rounded-lg">
            Countdown link copied! Fans can now pre-save "{countdownRelease.title}" on Spotify.
          </div>
        )}
      </div>

      {/* TRACKLIST PREVIEW SECTION */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-white tracking-tight">Tracklist preview</h2>
          {countdownRelease.isPlayer && (
            <span className="text-[11px] text-[#A7A7A7]">
              Tap "Drop Single" on any locked track to release early
            </span>
          )}
        </div>

        <div className="space-y-4">
          {countdownRelease.tracks.map((trk, idx) => {
            const isUnlocked = trk.isReleased;
            const roleBadge = getTrackRoleBadgeMeta(trk.trackType);
            const isSelectingRole =
              countdownRelease.isPlayer && earlyDropTargetSongId === Number(trk.id);

            return (
              <div key={trk.id || idx} className="group">
                <div
                  onClick={() => {
                    if (isUnlocked && onSelectTrack) {
                      onSelectTrack(trk);
                    }
                  }}
                  className={`flex items-center justify-between py-1 rounded-lg transition ${
                    isUnlocked ? 'cursor-pointer hover:bg-white/5 px-2 -mx-2' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-[15px] font-semibold truncate ${
                          isUnlocked ? 'text-white' : 'text-[#727272]'
                        }`}
                      >
                        {trk.title}
                      </h4>
                      {isUnlocked && (
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {trk.isExplicit && (
                        <span
                          className={`text-[9px] font-black px-1 rounded-xs leading-tight ${
                            isUnlocked
                              ? 'bg-[#A7A7A7] text-[#121212]'
                              : 'bg-[#525252] text-[#121212]'
                          }`}
                        >
                          E
                        </span>
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          isUnlocked ? 'text-[#A7A7A7]' : 'text-[#5A5A5A]'
                        }`}
                      >
                        {trk.artistName}
                        {isUnlocked && trk.streams !== undefined && trk.streams > 0
                          ? ` • ${formatNumFull(trk.streams)} streams`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Playable indicator for unlocked tracks OR "Drop Early" for Player's locked tracks */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isUnlocked ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#1ED760] bg-[#1ED760]/10 px-2 py-0.5 rounded-full">
                          Out Now
                        </span>
                        <i className="ph-fill ph-play-circle text-2xl text-[#1ED760]"></i>
                      </div>
                    ) : countdownRelease.isPlayer && onEarlyReleaseTrack ? (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setEarlyDropTargetSongId(
                            earlyDropTargetSongId === Number(trk.id) ? null : Number(trk.id)
                          );
                        }}
                        className="text-[10px] font-bold text-white/80 hover:text-black bg-white/10 hover:bg-[#1ED760] border border-white/15 hover:border-[#1ED760] px-2.5 py-1 rounded-full transition cursor-pointer"
                      >
                        {isSelectingRole ? 'Cancel' : 'Drop Single'}
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Inline Single Role Picker when Player chooses to drop an unreleased track early during the countdown */}
                {isSelectingRole && countdownRelease.rawProject && onEarlyReleaseTrack && (
                  <div className="mt-2 p-3 rounded-xl bg-[#1E1E1E] border border-white/15 space-y-2 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-white flex items-center justify-between">
                      <span>Release "{trk.title}" early while countdown runs:</span>
                      <span className="text-[10px] text-[#1ED760]">Instant Global Drop</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          role: 'pre_release_single' as const,
                          title: 'Pre-Release Single',
                          sub: '+45% Pre-Saves · Official Single'
                        },
                        {
                          role: 'promotional_single' as const,
                          title: 'Promo Single',
                          sub: 'Instant-Grat Teaser · Fan Buzz'
                        },
                        {
                          role: 'lead_single' as const,
                          title: 'Lead Single',
                          sub: '+25% Radio & Editorial Push'
                        },
                        {
                          role: 'single' as const,
                          title: 'Standard Single',
                          sub: 'Balanced Official Single'
                        }
                      ].map(opt => (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => {
                            onEarlyReleaseTrack(
                              countdownRelease.rawProject!.id,
                              Number(trk.id),
                              opt.role
                            );
                            setEarlyDropTargetSongId(null);
                          }}
                          className="p-2 rounded-lg bg-[#121212] hover:bg-[#1ED760]/15 border border-white/10 hover:border-[#1ED760]/50 text-left transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-white">{opt.title}</div>
                          <div className="text-[10px] text-[#A7A7A7] mt-0.5">{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Copyright & Phonographic Footer matching Screenshot 1 */}
        <div className="mt-10 pt-4 border-t border-white/5 text-[11px] font-semibold text-[#A7A7A7] space-y-0.5 tracking-wide">
          <div>{copyrightLine}</div>
          <div>{phonographicLine}</div>
        </div>
      </div>
    </div>
  );
};
