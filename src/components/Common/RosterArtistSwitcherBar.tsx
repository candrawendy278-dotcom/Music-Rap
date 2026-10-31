import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Disc,
  Flame,
  Music,
  Play,
  Plus,
  Sparkles,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react';
import { GameState } from '../../types';
import {
  ImprintSignedArtist,
  getDefaultImprintLogoSvg,
  getEnsuredRecordLabelState,
} from '../../data/recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  buildRosterReleaseCoverSvg,
  ensureRosterArtistFullFields,
  getEnsuredLabelYouTubeChannel,
} from '../../data/recordLabelCeoEngine';
import { produceRosterArtistVideoPlayerStyle } from '../../data/rosterSharedWorldBridge';
import { formatNum, formatNumFull } from '../../constants';
import { Song } from '../../types';

interface RosterArtistSwitcherBarProps {
  gameState: GameState;
  selectedArtistId: 'player' | string;
  onSelectArtistId?: (id: 'player' | string) => void;
  onSelectArtist?: (id: 'player' | string) => void;
  accentColorClass?: string;
  accentColor?: string;
  labelPrefix?: string;
}

/**
 * Reusable top switcher bar for Spotify, Studio, RIAA, Pitchfork, and Metacritic
 * allowing the player to toggle between their own Artist Profile and any signed Roster Artist.
 */
export const RosterArtistSwitcherBar: React.FC<RosterArtistSwitcherBarProps> = ({
  gameState,
  selectedArtistId,
  onSelectArtistId,
  onSelectArtist,
  accentColorClass = 'border-amber-400 bg-amber-500/20 text-amber-200',
  labelPrefix = 'Active Artist',
}) => {
  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const imprint = labelState.imprint;
  const roster = imprint.signedRoster || [];

  if (!imprint.isFounded || roster.length === 0) {
    return null;
  }

  const handleSelect = (id: 'player' | string) => {
    if (onSelectArtistId) onSelectArtistId(id);
    if (onSelectArtist) onSelectArtist(id);
  };

  return (
    <div className="border-b border-white/10 bg-[#0D0C14]/95 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span>
          {labelPrefix} • {imprint.imprintName} Roster Switcher
        </span>
        <span className="font-mono text-amber-300">{roster.length} Signed</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => handleSelect('player')}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
            selectedArtistId === 'player'
              ? accentColorClass
              : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <span>★ {gameState.artist?.name || 'My Artist'} (You)</span>
        </button>

        {roster.map((rawArt) => {
          const stageName = rawArt.stageName || rawArt.name;
          const isSelected = selectedArtistId === rawArt.id;
          return (
            <button
              key={rawArt.id}
              type="button"
              onClick={() => handleSelect(rawArt.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-black transition ${
                isSelected
                  ? accentColorClass
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <img
                src={rawArt.avatarUrl || buildRosterArtistAvatarSvg(stageName)}
                alt={stageName}
                className="h-4 w-4 rounded-full object-cover"
              />
              <span>{stageName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface RosterArtistSpotifyProfilePanelProps {
  gameState: GameState;
  artistId: string;
  onOpenStudioForArtist?: () => void;
}

/**
 * Full Spotify Artist Profile View for a Signed Roster Artist (Monthly Listeners, Fans, Top Tracks, Discography).
 */
export const RosterArtistSpotifyProfilePanel: React.FC<
  RosterArtistSpotifyProfilePanelProps
> = ({ gameState, artistId, onOpenStudioForArtist }) => {
  const [discogFilter, setDiscogFilter] = useState<'all' | 'albums' | 'singles'>('all');

  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);

  if (!rawArtist) return null;
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const stageName = artist.stageName || artist.name;

  const releasedSongs = (artist.songs || [])
    .filter((s) => s.status === 'released')
    .sort((a, b) => (b.streams || 0) - (a.streams || 0));

  const releasedProjects = (artist.projects || []).filter(
    (p) => p.status === 'released'
  );

  return (
    <div className="space-y-5 pb-20 text-white">
      {/* Spotify Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1DB954]/30 via-[#121212] to-[#121212] p-5">
        <div className="flex items-center gap-4">
          <img
            src={artist.avatarUrl || buildRosterArtistAvatarSvg(stageName)}
            alt={stageName}
            className="h-24 w-24 shrink-0 rounded-full border-2 border-[#1DB954] object-cover shadow-2xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1DB954]">
              <CheckCircle2 className="h-4 w-4 fill-[#1DB954] text-black" />
              <span>Verified Artist • {labelState.imprint.imprintName}</span>
            </div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-white">
              {stageName}
            </h1>
            <p className="mt-1 font-mono text-xs font-bold text-zinc-300">
              {(artist.monthlyListeners || 0).toLocaleString()} monthly listeners
            </p>
            <p className="text-[11px] text-zinc-400">
              {(artist.fans || 0).toLocaleString()} followers • Popularity {artist.popularity}/100
            </p>
          </div>
        </div>

        {onOpenStudioForArtist && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={onOpenStudioForArtist}
              className="flex items-center gap-1.5 rounded-full bg-[#1DB954] px-4 py-2 text-xs font-black text-black transition hover:brightness-105"
            >
              <Disc className="h-4 w-4" />
              Produce Song / Album for {stageName}
            </button>
          </div>
        )}
      </div>

      {/* Popular Tracks */}
      <div className="px-1">
        <h3 className="text-base font-black text-white">Popular</h3>
        <div className="mt-2.5 space-y-2">
          {releasedSongs.slice(0, 5).map((song, idx) => (
            <div
              key={song.id}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-4 font-mono text-xs font-bold text-zinc-400">
                  {idx + 1}
                </span>
                <img
                  src={
                    song.cover ||
                    buildRosterReleaseCoverSvg(stageName, song.title, 'Single')
                  }
                  alt={song.title}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-black text-white">
                    {song.title}
                  </div>
                  <div className="font-mono text-[11px] text-zinc-400">
                    {(song.streams || 0).toLocaleString()} streams • +
                    {(song.dailyStreams || 0).toLocaleString()}/day
                  </div>
                </div>
              </div>
              <span className="rounded-md bg-[#1DB954]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#1DB954]">
                Q:{song.quality}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Discography */}
      <div className="px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">Discography</h3>
          <div className="flex gap-1">
            {(['all', 'albums', 'singles'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDiscogFilter(f)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${
                  discogFilter === f
                    ? 'bg-[#1DB954] text-black'
                    : 'bg-white/10 text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          {(discogFilter === 'all' || discogFilter === 'albums') &&
            releasedProjects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#181818] p-3"
              >
                <img
                  src={proj.cover}
                  alt={proj.title}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-white">
                    {proj.title}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {proj.releaseDate?.slice(0, 4) || '2026'} • {proj.type.toUpperCase()} •{' '}
                    {proj.songs?.length || 0} songs
                  </div>
                  <div className="font-mono text-[11px] text-[#1DB954]">
                    {(proj.pureSales || 0).toLocaleString()} pure album sales
                  </div>
                </div>
              </div>
            ))}

          {(discogFilter === 'all' || discogFilter === 'singles') &&
            releasedSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#181818] p-3"
              >
                <img
                  src={
                    song.cover ||
                    buildRosterReleaseCoverSvg(stageName, song.title, 'Single')
                  }
                  alt={song.title}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-white">
                    {song.title}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {song.releaseDate?.slice(0, 4) || '2026'} • Single • {song.genre}
                  </div>
                  <div className="font-mono text-[11px] text-zinc-300">
                    {(song.streams || 0).toLocaleString()} total streams
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* About Artist Card */}
      <div className="rounded-3xl border border-white/10 bg-[#181818] p-4">
        <h4 className="text-sm font-black text-white">About {stageName}</h4>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
          {artist.bio ||
            `${stageName} (${artist.realName}) is an official recording artist signed to ${labelState.imprint.imprintName}.`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
          <div>
            <span className="text-zinc-400">Record Label: </span>
            <strong className="text-white">{labelState.imprint.imprintName}</strong>
          </div>
          <div>
            <span className="text-zinc-400">Origin: </span>
            <strong className="text-white">{artist.country}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LabelOfficialYouTubeChannelPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onSelectVideo?: (video: Song) => void;
  externalOpenCreateModal?: boolean;
  onCloseExternalCreateModal?: () => void;
}

/**
 * Dedicated Official Record Label YouTube Channel View — 100% identical in layout & functionality
 * to the Player's YouTube Channel (Home, Videos with Latest/Popular/Oldest sort, Releases, About,
 * clickable Watch Page, and full Player-identical MV/Lyric/Visualizer production with VEVO & Ad Campaigns).
 */
export const LabelOfficialYouTubeChannelPanel: React.FC<
  LabelOfficialYouTubeChannelPanelProps
> = ({
  gameState,
  setGameState,
  onSelectVideo,
  externalOpenCreateModal,
  onCloseExternalCreateModal,
}) => {
  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const imprint = labelState.imprint;
  const labelYt = useMemo(() => getEnsuredLabelYouTubeChannel(gameState), [gameState]);
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';

  const roster = useMemo(
    () =>
      (imprint.signedRoster || []).map((a) => ensureRosterArtistFullFields(a, dateStr)),
    [imprint.signedRoster, dateStr]
  );

  const [channelTab, setChannelTab] = useState<'home' | 'videos' | 'releases' | 'about'>('home');
  const [videoSort, setVideoSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string>(
    () => roster[0]?.id || ''
  );
  const [selectedSongId, setSelectedSongId] = useState<number | undefined>(() => {
    const firstArt = roster[0];
    return firstArt?.songs?.[0]?.id;
  });
  const [visualType, setVisualType] = useState<'mv' | 'lyric_video' | 'visualizer'>('mv');
  const [mvDistributor, setMvDistributor] = useState<'standard' | 'vevo'>('vevo');
  const [useAds, setUseAds] = useState<boolean>(false);
  const [lyricStyle, setLyricStyle] = useState<'kinetic_neon' | 'minimalist_studio' | 'motion_3d'>('kinetic_neon');
  const [visualizerStyle, setVisualizerStyle] = useState<'vinyl_loop' | 'cyberpunk_city' | 'abstract_waveform'>('vinyl_loop');
  const [customThumb, setCustomThumb] = useState<string>('');
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [customVideoName, setCustomVideoName] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const isModalOpen = Boolean(showUploadModal || externalOpenCreateModal);
  const closeModal = () => {
    setShowUploadModal(false);
    if (onCloseExternalCreateModal) onCloseExternalCreateModal();
  };

  const activeArtist =
    roster.find((a) => a.id === selectedArtistId) || roster[0] || null;
  const releasedArtistSongs = (activeArtist?.songs || []).filter(
    (s) => s.status === 'released'
  );

  const sortedUploads = useMemo(() => {
    const list = [...(labelYt.uploads || [])];
    if (videoSort === 'popular') {
      return list.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    if (videoSort === 'oldest') {
      return list.sort(
        (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      );
    }
    return list.sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  }, [labelYt.uploads, videoSort]);

  const allRosterAudioReleases = useMemo(() => {
    const items: Array<{
      id: string;
      artistName: string;
      title: string;
      type: string;
      year: string;
      cover: string;
      streams: number;
    }> = [];
    roster.forEach((art) => {
      const aName = art.stageName || art.name;
      (art.projects || [])
        .filter((p) => p.status === 'released')
        .forEach((p) => {
          const pStreams = (p.songs || []).reduce((acc, s) => acc + (s.streams || 0), 0);
          items.push({
            id: `proj_${art.id}_${p.id}`,
            artistName: aName,
            title: p.title,
            type: p.type === 'ep' ? 'EP' : 'Album',
            year: (p.releaseDate || dateStr).slice(0, 4),
            cover: p.cover || buildRosterReleaseCoverSvg(aName, p.title, 'Album'),
            streams: pStreams,
          });
        });
      (art.songs || [])
        .filter((s) => s.status === 'released')
        .forEach((s) => {
          items.push({
            id: `sng_${art.id}_${s.id}`,
            artistName: aName,
            title: s.title,
            type: 'Single',
            year: (s.releaseDate || dateStr).slice(0, 4),
            cover: s.cover || buildRosterReleaseCoverSvg(aName, s.title, 'Single'),
            streams: s.streams || 0,
          });
        });
    });
    return items.sort((a, b) => b.streams - a.streams);
  }, [roster, dateStr]);

  const computedTotalCost = useMemo(() => {
    if (visualType === 'mv') {
      return (mvDistributor === 'vevo' ? 8000 : 3000) + (useAds ? 15000 : 0);
    }
    if (visualType === 'lyric_video') {
      return lyricStyle === 'motion_3d' ? 3200 : 1800;
    }
    return visualizerStyle === 'abstract_waveform' ? 1500 : 950;
  }, [visualType, mvDistributor, useAds, lyricStyle, visualizerStyle]);

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCustomThumb(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomVideoUrl(url);
    setCustomVideoName(file.name);
  };

  const handleOpenWatchPage = (vid: (typeof labelYt.uploads)[number]) => {
    if (!onSelectVideo) return;
    const art = roster.find((a) => a.id === vid.artistId);
    const liveSong = art?.songs?.find((s) => s.id === vid.songId);
    const watchableSong: Song = {
      ...(liveSong || {
        id: vid.songId || Date.now(),
        title: vid.videoTitle,
        genre: art?.genre || 'Pop',
        subgenre: art?.genre || 'Pop',
        collabId: 'none',
        quality: 85,
        status: 'released',
        streams: vid.views * 2,
        dailyStreams: vid.dailyViews * 2,
        weeklyStreams: vid.dailyViews * 14,
        pureSales: 500,
        dailyPureSales: 50,
        weeklyPureSales: 350,
        radioPlays: 0,
        dailyRadioPlays: 0,
        weeklyRadioPlays: 0,
        mvAdsDays: 0,
        momentum: 80,
        basePotential: 85,
      }),
      title: vid.videoTitle,
      artist: vid.artistStageName,
      isPlayer: false,
      hasMV: true,
      views: vid.views,
      dailyViews: vid.dailyViews,
      mvLikes: vid.likes,
      releaseDate: vid.releaseDate,
      mvThumbnail: vid.thumbnailUrl,
      cover: vid.thumbnailUrl,
    } as any;
    onSelectVideo(watchableSong);
  };

  const handleUploadVisual = () => {
    if (!activeArtist) return;
    const targetSongId = selectedSongId ?? releasedArtistSongs[0]?.id;
    if (!targetSongId) {
      setFeedback('Release a song for this roster artist first.');
      return;
    }
    const res = produceRosterArtistVideoPlayerStyle(gameState, {
      artistId: activeArtist.id,
      songId: targetSongId,
      visualType,
      mvDistributor,
      useAds,
      customThumbnailUrl: customThumb || undefined,
      customVideoUrl: customVideoUrl || undefined,
      customVideoName: customVideoName || undefined,
      lyricStyle,
      visualizerStyle,
    });
    if (!res.success) {
      setFeedback(res.message);
      return;
    }
    setGameState(res.nextState);
    closeModal();
    setCustomThumb('');
    setCustomVideoUrl('');
    setCustomVideoName('');
    setFeedback(res.message);
  };

  const featuredVideo = sortedUploads[0];
  const labelLogoSrc =
    imprint.logoUrl ||
    labelYt.avatarUrl ||
    getDefaultImprintLogoSvg(imprint.imprintName);

  return (
    <div className="pb-24 bg-[#0F0F0F] min-h-screen text-[#F1F1F1]">
      {/* 1. CHANNEL BANNER — Uses Record Label Logo */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-[#181818]">
        <img
          src={labelLogoSrc}
          alt={labelYt.channelName}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/25 to-transparent" />
      </div>

      {/* 2. CHANNEL IDENTITY HEADER — Identical to YouTubeArtistProfileView */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex items-end space-x-3.5">
          <div className="relative shrink-0">
            <img
              src={labelLogoSrc}
              alt={labelYt.channelName}
              className="w-20 h-20 rounded-full object-cover border-4 border-[#0F0F0F] shadow-xl bg-[#272727]"
            />
          </div>
          <div className="pb-1 min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {labelYt.channelName}
              </h1>
              <i
                className="ph-fill ph-music-note-simple text-sm text-[#AAAAAA] shrink-0"
                title="Official Record Label Channel"
              />
            </div>
            <p className="text-xs text-[#AAAAAA] truncate mt-0.5">{labelYt.handle}</p>
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#AAAAAA] mt-0.5">
              <span className="text-zinc-200 font-semibold">
                {formatNum(labelYt.subscribers)} subscribers
              </span>
              <span>•</span>
              <span>{labelYt.uploads.length} videos</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                +${formatNum(labelYt.totalAdRevenueEarned)} ad rev
              </span>
            </div>
          </div>
        </div>

        {/* Short Bio Preview Line */}
        <div
          onClick={() => setChannelTab('about')}
          className="mt-3 text-xs text-[#AAAAAA] line-clamp-2 cursor-pointer hover:text-zinc-300 transition flex items-center justify-between"
        >
          <span className="truncate pr-2">{labelYt.description}</span>
          <i className="ph ph-caret-right text-xs shrink-0"></i>
        </div>

        {/* Action Button Row (Official Channel + Produce Video) */}
        <div className="mt-3.5 flex items-center gap-2">
          <button className="flex-1 py-2 rounded-full bg-[#272727] text-white text-xs font-bold flex items-center justify-center space-x-1.5">
            <i className="ph-fill ph-check-circle text-emerald-400 text-sm"></i>
            <span>Official Label Channel</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex-1 py-2 rounded-full bg-[#F1F1F1] hover:bg-zinc-200 text-[#0F0F0F] text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <i className="ph-bold ph-video-camera text-sm text-[#FF0000]"></i>
            <span>Produce Video</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-200">
          {feedback}
        </div>
      )}

      {/* 3. AUTHENTIC YOUTUBE CHANNEL TABS (Home | Videos | Releases | About) */}
      <div className="mt-4 border-b border-white/10 px-4 flex space-x-6 overflow-x-auto hide-scrollbar sticky top-[53px] bg-[#0F0F0F]/95 backdrop-blur-md z-20">
        {(
          [
            { id: 'home', label: 'Home' },
            { id: 'videos', label: `Videos (${labelYt.uploads.length})` },
            { id: 'releases', label: `Releases (${allRosterAudioReleases.length})` },
            { id: 'about', label: 'About' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setChannelTab(tab.id)}
            className={`py-3 text-xs font-bold whitespace-nowrap border-b-2 transition cursor-pointer ${
              channelTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-[#AAAAAA] hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. TAB CONTENT */}
      <div className="px-4 pt-4">
        {channelTab === 'home' && (
          <div className="space-y-6">
            {featuredVideo ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#AAAAAA]">
                    Featured Roster Premiere
                  </span>
                  <span className="text-[10px] font-semibold text-[#FF0000] bg-[#FF0000]/10 px-2 py-0.5 rounded">
                    #{1} on Label Channel
                  </span>
                </div>
                <div
                  onClick={() => handleOpenWatchPage(featuredVideo)}
                  className="rounded-xl overflow-hidden bg-[#181818] border border-white/[0.06] cursor-pointer group"
                >
                  <div className="relative aspect-video w-full bg-[#272727] overflow-hidden">
                    <img
                      src={featuredVideo.thumbnailUrl}
                      alt={featuredVideo.videoTitle}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">
                      3:42
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">
                      {featuredVideo.videoTitle}
                    </h3>
                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#AAAAAA] mt-1.5">
                      <span>{featuredVideo.artistStageName}</span>
                      <span>•</span>
                      <span>{formatNumFull(featuredVideo.views)} views</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        +{formatNum(featuredVideo.dailyViews)} today
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-[#181818] rounded-xl border border-white/5 p-6">
                <i className="ph ph-video-camera-slash text-4xl text-[#AAAAAA] mb-2 block"></i>
                <p className="text-white font-bold text-sm">No Roster Videos Uploaded Yet</p>
                <p className="text-[#AAAAAA] text-xs mt-1">
                  Produce an Official Music Video, Lyric Video, or Visualizer for any signed artist on your roster.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 rounded-full bg-[#FF0000] text-white text-xs font-bold hover:bg-red-600 transition cursor-pointer"
                >
                  Produce First Roster Video
                </button>
              </div>
            )}

            {/* Popular Videos Shelf */}
            {sortedUploads.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white">Popular Roster Videos</h2>
                  <button
                    onClick={() => {
                      setVideoSort('popular');
                      setChannelTab('videos');
                    }}
                    className="text-xs text-[#3EA6FF] font-semibold cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {[...labelYt.uploads]
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 5)
                    .map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleOpenWatchPage(v)}
                        className="flex space-x-3 cursor-pointer group"
                      >
                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-[#272727] shrink-0">
                          <img
                            src={v.thumbnailUrl}
                            alt={v.videoTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-semibold px-1 py-0.2 rounded">
                            3:38
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h4 className="text-white font-semibold text-xs leading-snug line-clamp-2 group-hover:text-[#3EA6FF] transition">
                            {v.videoTitle}
                          </h4>
                          <p className="text-[#AAAAAA] text-[11px] mt-1">
                            {v.artistStageName} • {formatNum(v.views)} views
                          </p>
                          <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">
                            +{formatNum(v.dailyViews)} daily views
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {channelTab === 'videos' && (
          <div>
            {/* Filter Pills: Latest | Popular | Oldest — Identical to YouTubeArtistProfileView */}
            <div className="flex space-x-2 mb-4">
              {(
                [
                  { id: 'latest', label: 'Latest' },
                  { id: 'popular', label: 'Popular' },
                  { id: 'oldest', label: 'Oldest' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setVideoSort(s.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    videoSort === s.id
                      ? 'bg-[#F1F1F1] text-[#0F0F0F]'
                      : 'bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {sortedUploads.length === 0 ? (
              <p className="text-center text-[#AAAAAA] text-xs py-12">
                No videos uploaded on this channel yet.
              </p>
            ) : (
              <div className="space-y-3.5">
                {sortedUploads.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleOpenWatchPage(v)}
                    className="flex space-x-3 cursor-pointer group"
                  >
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-[#272727] shrink-0">
                      <img
                        src={v.thumbnailUrl}
                        alt={v.videoTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-semibold px-1 py-0.2 rounded">
                        {v.visualType === 'mv'
                          ? 'MV'
                          : v.visualType === 'lyric_video'
                          ? 'LYRIC'
                          : 'VISUAL'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4 className="text-white font-semibold text-xs leading-snug line-clamp-2 group-hover:text-[#3EA6FF] transition">
                        {v.videoTitle}
                      </h4>
                      <p className="text-[#AAAAAA] text-[11px] mt-1">
                        {v.artistStageName} • {formatNumFull(v.views)} views
                      </p>
                      <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">
                        +{formatNum(v.dailyViews)} views today
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {channelTab === 'releases' && (
          <div>
            <p className="text-xs text-[#AAAAAA] mb-3">
              Official albums, EPs, and singles distributed by {imprint.imprintName} on YouTube Music
            </p>
            {allRosterAudioReleases.length === 0 ? (
              <p className="text-center text-[#AAAAAA] text-xs py-10">
                No official audio releases found.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {allRosterAudioReleases.map((rel) => (
                  <div
                    key={rel.id}
                    className="bg-[#181818] p-2.5 rounded-xl border border-white/[0.06] flex flex-col"
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#272727] mb-2">
                      <img
                        src={rel.cover}
                        alt={rel.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                        {rel.type}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-xs truncate">{rel.title}</h4>
                    <p className="text-[#AAAAAA] text-[11px] mt-0.5 truncate">
                      {rel.artistName} • {rel.year}
                    </p>
                    <p className="text-zinc-400 text-[10px] font-mono mt-0.5">
                      {formatNum(rel.streams)} streams
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {channelTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.06]">
              <h3 className="text-white font-bold text-sm mb-2">Description</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">{labelYt.description}</p>
            </div>

            <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.06] space-y-2.5">
              <h3 className="text-white font-bold text-sm mb-1">Channel Details</h3>
              <div className="flex items-center space-x-3 text-xs text-zinc-300">
                <i className="ph ph-at text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{labelYt.handle}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-zinc-300">
                <i className="ph ph-users text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{formatNumFull(labelYt.subscribers)} subscribers</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-zinc-300">
                <i className="ph ph-chart-line-up text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{formatNumFull(labelYt.totalViews)} total channel views</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-zinc-300">
                <i className="ph ph-currency-dollar text-base text-emerald-400 w-5 text-center"></i>
                <span className="text-emerald-400 font-bold">
                  ${formatNumFull(labelYt.totalAdRevenueEarned)} total YouTube ad revenue
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player-Identical MV / Lyric Video / Visualizer Production Modal for Roster Artists */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/15 bg-[#181818] p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">
                  {labelYt.channelName} • Studio Production
                </span>
                <h3 className="text-base font-black">Produce Roster Video</h3>
              </div>
              <button
                onClick={closeModal}
                className="rounded-xl bg-white/5 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {roster.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">
                Sign at least one artist to your Record Label Imprint first!
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      1. Roster Artist
                    </label>
                    <select
                      value={activeArtist?.id || ''}
                      onChange={(e) => {
                        const nextArt = roster.find((a) => a.id === e.target.value);
                        setSelectedArtistId(e.target.value);
                        const nextReleased = (nextArt?.songs || []).filter(
                          (s) => s.status === 'released'
                        );
                        setSelectedSongId(nextReleased[0]?.id);
                      }}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 text-xs font-bold text-white"
                    >
                      {roster.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.stageName || a.name} ({a.genre})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      2. Released Track
                    </label>
                    <select
                      value={selectedSongId ?? releasedArtistSongs[0]?.id ?? ''}
                      onChange={(e) => setSelectedSongId(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 text-xs font-bold text-white"
                    >
                      {releasedArtistSongs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} (Q:{s.quality})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Visual Format Selector (Identical to Player's YouTubeVisualFormatModal) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">
                    3. Select Visual Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mv' as const, label: 'Official MV', sub: 'VEVO / Indie' },
                      { id: 'lyric_video' as const, label: 'Lyric Video', sub: 'Typography' },
                      { id: 'visualizer' as const, label: 'Visualizer', sub: 'Canvas Loop' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVisualType(v.id)}
                        className={`rounded-xl border p-2.5 text-center transition cursor-pointer ${
                          visualType === v.id
                            ? 'border-[#FF0000] bg-[#FF0000]/20 text-white'
                            : 'border-white/10 bg-black/40 text-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-black">{v.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{v.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format-Specific Player-Identical Options */}
                {visualType === 'mv' && (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">
                        Distributor Network
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMvDistributor('standard')}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            mvDistributor === 'standard'
                              ? 'border-white bg-white/15 text-white'
                              : 'border-white/10 bg-black/40 text-zinc-400'
                          }`}
                        >
                          <div className="text-xs font-black">Standard Indie</div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">$3,000</div>
                          <div className="text-[10px] text-zinc-400">Direct Upload</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMvDistributor('vevo')}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            mvDistributor === 'vevo'
                              ? 'border-[#FF0000] bg-[#FF0000]/20 text-white'
                              : 'border-white/10 bg-black/40 text-zinc-400'
                          }`}
                        >
                          <div className="text-xs font-black">VEVO Network</div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">$8,000</div>
                          <div className="text-[10px] text-amber-300">+20% Views &amp; Hype</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">
                        YouTube Ad Promotion Campaign
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUseAds(false)}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            !useAds
                              ? 'border-white bg-white/15 text-white'
                              : 'border-white/10 bg-black/40 text-zinc-400'
                          }`}
                        >
                          <div className="text-xs font-black">Organic Premiere</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">No Ad Spend</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseAds(true)}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            useAds
                              ? 'border-amber-400 bg-amber-500/20 text-white'
                              : 'border-white/10 bg-black/40 text-zinc-400'
                          }`}
                        >
                          <div className="text-xs font-black">Paid YouTube Ads</div>
                          <div className="text-[10px] text-amber-300 font-mono mt-0.5">+$15,000</div>
                          <div className="text-[10px] text-emerald-300">10-Day Viral Boost</div>
                        </button>
                      </div>
                    </div>

                    {/* Optional Custom Video MV File Upload */}
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-2.5">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-zinc-200">Custom Video MV File</div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {customVideoName || 'Optional MP4/WebM video file'}
                        </div>
                      </div>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="shrink-0 flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 cursor-pointer"
                      >
                        <Upload className="h-3 w-3" />
                        {customVideoUrl ? 'Video Ready ✓' : 'Upload Video'}
                      </button>
                    </div>
                  </div>
                )}

                {visualType === 'lyric_video' && (
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">
                      Lyric Video Typography Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'kinetic_neon' as const, label: 'Kinetic Neon', cost: '$1,800' },
                        { id: 'minimalist_studio' as const, label: 'Minimal Studio', cost: '$1,800' },
                        { id: 'motion_3d' as const, label: '3D Motion', cost: '$3,200' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setLyricStyle(st.id)}
                          className={`rounded-xl border p-2 text-center cursor-pointer ${
                            lyricStyle === st.id
                              ? 'border-fuchsia-400 bg-fuchsia-500/20 text-white'
                              : 'border-white/10 bg-black/40 text-zinc-400'
                          }`}
                        >
                          <div className="text-[11px] font-black">{st.label}</div>
                          <div className="text-[10px] font-mono text-emerald-400">{st.cost}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {visualType === 'visualizer' && (
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">
                      Visualizer Canvas Loop Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'vinyl_loop' as const, label: 'Vinyl Loop', cost: '$950' },
                        { id: 'cyberpunk_city' as const, label: 'Cyberpunk', cost: '$950' },
                        { id: 'abstract_waveform' as const, label: '3D Waveform', cost: '$1,500' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setVisualizerStyle(st.id)}
                          className={`rounded-xl border p-2 text-center cursor-pointer ${
                            visualizerStyle === st.id
                              ? 'border-cyan-400 bg-cyan-500/20 text-white'
                              : 'border-white/10 bg-black/40 text-zinc-400'
                          }`}
                        >
                          <div className="text-[11px] font-black">{st.label}</div>
                          <div className="text-[10px] font-mono text-emerald-400">{st.cost}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Thumbnail Upload */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <span className="text-xs font-bold text-zinc-200">Custom 16:9 Thumbnail</span>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 cursor-pointer"
                  >
                    <Upload className="h-3 w-3" />
                    {customThumb ? 'Thumbnail Ready ✓' : 'Upload Thumbnail'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleUploadVisual}
                  className="w-full rounded-xl bg-[#FF0000] hover:bg-red-600 py-3 text-xs font-black uppercase tracking-wider text-white transition cursor-pointer"
                >
                  Premiere Video (${computedTotalCost.toLocaleString()})
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default RosterArtistSwitcherBar;
