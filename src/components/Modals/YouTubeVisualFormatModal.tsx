import React, { useState, useRef, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { Song } from '../../types';
import {
  YOUTUBE_VISUAL_STYLE_OPTIONS,
  produceYouTubeExtraVisual,
  getVisualStyleById
} from '../../data/youtubeVisualFormatsEngine';
import { formatMoney, formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { compressImageFile } from '../../utils/imageOptimizer';

export type UnifiedVideoTab = 'mv' | 'lyric_video' | 'visualizer';

interface YouTubeVisualFormatModalProps {
  song?: Song | null;
  initialTab?: UnifiedVideoTab;
  onClose: () => void;
}

export default function YouTubeVisualFormatModal({
  song: initialSong = null,
  initialTab = 'mv',
  onClose
}: YouTubeVisualFormatModalProps) {
  const { state, setState, setInfoModal } = useGameContext();
  const mvThumbInputRef = useRef<HTMLInputElement>(null);
  const extraThumbInputRef = useRef<HTMLInputElement>(null);

  // Eligible songs for video production (released, scheduled, or recorded)
  const eligibleSongs = useMemo(() => {
    return (state.songs || [])
      .filter(s => s.status === 'released' || s.status === 'scheduled' || s.status === 'recorded')
      .slice()
      .reverse();
  }, [state.songs]);

  const [selectedSongId, setSelectedSongId] = useState<number>(
    initialSong?.id ?? (eligibleSongs[0]?.id || 0)
  );

  const currentSong = useMemo(() => {
    return (
      (state.songs || []).find(s => s.id === selectedSongId) ||
      initialSong ||
      eligibleSongs[0] ||
      null
    );
  }, [state.songs, selectedSongId, initialSong, eligibleSongs]);

  const [activeType, setActiveType] = useState<UnifiedVideoTab>(initialTab);

  // Official MV production states
  const [mvDistributor, setMvDistributor] = useState<'indie' | 'vevo'>('indie');
  const [mvUseAds, setMvUseAds] = useState<'no' | 'yes'>('no');
  const [mvThumbnailPreview, setMvThumbnailPreview] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Custom thumbnail for Lyric Video / Visualizer (optional; defaults to song cover art when null)
  const [extraThumbnailPreview, setExtraThumbnailPreview] = useState<string | null>(null);

  // Visualizer / Lyric Video style selection
  const filteredStyles = YOUTUBE_VISUAL_STYLE_OPTIONS.filter(
    s => s.formatType === (activeType === 'mv' ? 'visualizer' : activeType)
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string>(
    YOUTUBE_VISUAL_STYLE_OPTIONS.find(s => s.formatType === 'lyric_video')?.id ||
      YOUTUBE_VISUAL_STYLE_OPTIONS[0]?.id ||
      ''
  );

  const handleSwitchType = (type: UnifiedVideoTab) => {
    setActiveType(type);
    if (type === 'visualizer' || type === 'lyric_video') {
      const first = YOUTUBE_VISUAL_STYLE_OPTIONS.find(s => s.formatType === type);
      if (first) setSelectedStyleId(first.id);
    }
  };

  const handleMvImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setMvThumbnailPreview(compressed);
      }
    }
  };

  const handleExtraImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setExtraThumbnailPreview(compressed);
      }
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Produce Official Music Video (MV)
  const handleLaunchOfficialMV = () => {
    if (!currentSong) return;
    if (currentSong.hasMV) {
      setInfoModal({
        title: 'Official MV Already Live',
        desc: `"${currentSong.title}" already has an Official Music Video on YouTube.`
      });
      return;
    }

    const isVevo = mvDistributor === 'vevo';
    let cost = isVevo ? 8000 : 3000;
    if (!isVevo && mvUseAds === 'yes') cost += 15000;

    if ((state.money || 0) < cost) {
      setInfoModal({
        title: 'Insufficient Funds',
        desc: `You need ${formatMoney(cost)} to produce this Official Music Video.`
      });
      return;
    }

    const newMoney = (state.money || 0) - cost;
    const newHype = Math.min(100, (state.hype || 0) + (isVevo ? 35 : 25));
    const mvThumbnailImg = mvThumbnailPreview || currentSong.cover;

    setState(p => ({
      ...p,
      money: newMoney,
      hype: newHype,
      songs: p.songs.map(s =>
        s.id === currentSong.id
          ? {
              ...s,
              hasMV: true,
              mvAdsDays: !isVevo && mvUseAds === 'yes' ? 10 : 0,
              mvDistributor: mvDistributor as any,
              mvThumbnail: mvThumbnailImg,
              customVideoUrl: videoPreviewUrl || undefined
            }
          : s
      )
    }));

    setInfoModal({
      title: 'Official Music Video Produced!',
      desc: `Official MV for "${currentSong.title}" is ready! ${
        currentSong.status === 'released'
          ? 'It is now streaming live on YouTube!'
          : 'It will premiere on YouTube as soon as the track drops.'
      }`
    });
    onClose();
  };

  // Produce Official Visualizer or Lyric Video
  const handleLaunchExtraFormat = () => {
    if (!currentSong) return;
    const res = produceYouTubeExtraVisual(
      state,
      currentSong.id,
      selectedStyleId,
      extraThumbnailPreview || currentSong.cover
    );
    if (!res.success) {
      setInfoModal({ title: 'YouTube Creator Studio', desc: res.message });
      return;
    }
    setState(res.updatedState);
    setInfoModal({ title: 'YouTube Premiere Live', desc: res.message });
    onClose();
  };

  const existingVisStyle = getVisualStyleById(currentSong?.visualizerStyle);
  const existingLyrStyle = getVisualStyleById(currentSong?.lyricVideoStyle);

  const mvTotalCost =
    (mvDistributor === 'vevo' ? 8000 : 3000) +
    (mvDistributor !== 'vevo' && mvUseAds === 'yes' ? 15000 : 0);

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[85] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#121217] text-white border border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FF0000]/15 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0">
              <i className="ph-fill ph-youtube-logo text-2xl"></i>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF0033]">
                YOUTUBE CREATOR STUDIO
              </div>
              <h3 className="text-base font-black text-white truncate">
                Release MV, Lyric Video & Visualizer
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-zinc-300 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {eligibleSongs.length === 0 || !currentSong ? (
          <div className="py-10 text-center space-y-2">
            <i className="ph-fill ph-video-camera-slash text-3xl text-zinc-500"></i>
            <p className="text-sm font-bold text-white">No Eligible Songs Yet</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Record or release a song in the Studio first to produce an Official MV, Lyric Video, or Visualizer.
            </p>
          </div>
        ) : (
          <>
            {/* Song Selector Bar */}
            <div className="mt-3.5 mb-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Select Track ({eligibleSongs.length} available)
              </label>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <OfficialArtworkImg
                  src={currentSong.cover}
                  alt={currentSong.title}
                  className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <select
                    value={currentSong.id}
                    onChange={e => setSelectedSongId(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer truncate"
                  >
                    {eligibleSongs.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#18181F] text-white">
                        {s.title} ({s.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span>{currentSong.genre}</span>
                    <span>•</span>
                    <span>Quality {Math.round(currentSong.quality || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Video Format Breakdown Card */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div
                onClick={() => handleSwitchType('mv')}
                className={`rounded-xl p-2.5 border cursor-pointer transition ${
                  activeType === 'mv'
                    ? 'bg-[#FF0000]/15 border-[#FF0000]/60'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider text-red-400">
                  Official MV
                </div>
                <div className="text-xs font-black text-white mt-0.5">
                  {currentSong.hasMV ? formatNumFull(currentSong.views || 0) : 'Not Released'}
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">
                  {currentSong.hasMV
                    ? `+${formatNumFull(currentSong.dailyViews || 0)}/day`
                    : '100% Main Views'}
                </div>
              </div>

              <div
                onClick={() => handleSwitchType('lyric_video')}
                className={`rounded-xl p-2.5 border cursor-pointer transition ${
                  activeType === 'lyric_video'
                    ? 'bg-amber-500/15 border-amber-400/60'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                  Lyric Video
                </div>
                <div className="text-xs font-black text-white mt-0.5">
                  {currentSong.hasLyricVideo
                    ? formatNumFull(currentSong.lyricVideoViews || 0)
                    : 'Not Released'}
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">
                  {currentSong.hasLyricVideo
                    ? `+${formatNumFull(currentSong.dailyLyricVideoViews || 0)}/day`
                    : '~45% MV Scale'}
                </div>
              </div>

              <div
                onClick={() => handleSwitchType('visualizer')}
                className={`rounded-xl p-2.5 border cursor-pointer transition ${
                  activeType === 'visualizer'
                    ? 'bg-sky-500/15 border-sky-400/60'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider text-sky-400">
                  Visualizer
                </div>
                <div className="text-xs font-black text-white mt-0.5">
                  {currentSong.hasVisualizer
                    ? formatNumFull(currentSong.visualizerViews || 0)
                    : 'Not Released'}
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">
                  {currentSong.hasVisualizer
                    ? `+${formatNumFull(currentSong.dailyVisualizerViews || 0)}/day`
                    : '~28% MV Scale'}
                </div>
              </div>
            </div>

            {/* Unified 3-Format Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => handleSwitchType('mv')}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeType === 'mv'
                    ? 'bg-[#FF0000] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🎬 Official MV</span>
                {currentSong.hasMV && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('lyric_video')}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeType === 'lyric_video'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>📝 Lyrics</span>
                {currentSong.hasLyricVideo && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('visualizer')}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeType === 'visualizer'
                    ? 'bg-sky-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🌀 Visualizer</span>
                {currentSong.hasVisualizer && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            {/* TAB 1: OFFICIAL MUSIC VIDEO (MV) */}
            {activeType === 'mv' && (
              currentSong.hasMV ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center my-2">
                  <div className="w-24 h-14 mx-auto mb-2.5 rounded-lg overflow-hidden border border-white/15 bg-zinc-900">
                    <OfficialArtworkImg
                      src={currentSong.mvThumbnail || currentSong.cover}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-black text-red-400 uppercase tracking-wider mb-1">
                    Official Music Video Active on YouTube
                  </div>
                  <div className="text-sm font-bold text-white">
                    {currentSong.title} (Official Music Video)
                  </div>
                  <div className="text-xs text-zinc-300 mt-2">
                    Total Views:{' '}
                    <span className="font-bold text-white">
                      {formatNumFull(currentSong.views || 0)}
                    </span>{' '}
                    · Daily:{' '}
                    <span className="font-bold text-red-400">
                      +{formatNumFull(currentSong.dailyViews || 0)}/day
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Optional Custom Thumbnail & Video */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      onClick={() => mvThumbInputRef.current?.click()}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition"
                    >
                      <div
                        className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 bg-cover bg-center overflow-hidden border border-white/10"
                        style={{
                          backgroundImage: `url(${mvThumbnailPreview || currentSong.cover})`
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          Thumbnail
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {mvThumbnailPreview ? 'Custom Uploaded' : 'Song Cover Default'}
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={mvThumbInputRef}
                        onChange={handleMvImageChange}
                      />
                    </div>

                    <div
                      onClick={() => document.getElementById('unified-mv-video-upload')?.click()}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        {videoPreviewUrl ? (
                          <i className="ph-fill ph-check-circle text-lg text-emerald-400"></i>
                        ) : (
                          <i className="ph-fill ph-video-camera text-lg text-zinc-300"></i>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          Custom Video
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {videoPreviewUrl ? 'Video Ready' : 'Optional'}
                        </div>
                      </div>
                      <input
                        id="unified-mv-video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoChange}
                      />
                    </div>
                  </div>

                  {/* Distributor Choice */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Network & Distribution Tier
                    </label>
                    <div
                      onClick={() => setMvDistributor('indie')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        mvDistributor === 'indie'
                          ? 'bg-red-500/15 border-red-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                            STANDARD UPLOAD
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            Independent Official Channel
                          </h4>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400">$3,000</div>
                          <div className="text-[10px] text-zinc-400">+25% Hype</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Direct premiere on your artist channel. Eligible for paid YouTube Ad campaigns.
                      </p>
                    </div>

                    <div
                      onClick={() => setMvDistributor('vevo')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        mvDistributor === 'vevo'
                          ? 'bg-red-500/15 border-red-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                            VEVO SYNDICATION
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            VEVO Global Network
                          </h4>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400">$8,000</div>
                          <div className="text-[10px] text-zinc-400">+35% Hype</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        High-budget VEVO premiere with homepage editorial boost & organic algorithmic reach.
                      </p>
                    </div>
                  </div>

                  {/* Optional Ad Campaign for Indie MV */}
                  {mvDistributor !== 'vevo' && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">
                          Paid YouTube Ad Campaign (+10 Days)
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          +$15,000 · Massive pre-roll view surge
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMvUseAds(mvUseAds === 'yes' ? 'no' : 'yes')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          mvUseAds === 'yes'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white/10 text-zinc-300'
                        }`}
                      >
                        {mvUseAds === 'yes' ? 'Ads Active (+$15k)' : 'Add Ads'}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLaunchOfficialMV}
                    className="w-full mt-2 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-[#FF0000] hover:bg-[#D90000] text-white shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Shoot & Premiere Official MV ({formatMoney(mvTotalCost)})
                  </button>
                </div>
              )
            )}

            {/* TAB 2 & 3: LYRIC VIDEO OR VISUALIZER */}
            {activeType !== 'mv' && (
              activeType === 'visualizer' && currentSong.hasVisualizer ? (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 text-center my-3">
                  <div className="w-24 h-14 mx-auto mb-2.5 rounded-lg overflow-hidden border border-white/15 bg-zinc-900">
                    <OfficialArtworkImg
                      src={currentSong.visualizerThumbnail || currentSong.cover}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-black text-sky-400 uppercase tracking-wider mb-1">
                    Official Visualizer Active on YouTube
                  </div>
                  <div className="text-sm font-bold text-white">
                    {existingVisStyle?.name || 'Official Audio Visualizer'}
                  </div>
                  <div className="text-xs text-zinc-300 mt-2">
                    Total Views:{' '}
                    <span className="font-bold text-white">
                      {formatNumFull(currentSong.visualizerViews || 0)}
                    </span>{' '}
                    · Daily:{' '}
                    <span className="font-bold text-sky-400">
                      +{formatNumFull(currentSong.dailyVisualizerViews || 0)}/day
                    </span>
                  </div>
                </div>
              ) : activeType === 'lyric_video' && currentSong.hasLyricVideo ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center my-3">
                  <div className="w-24 h-14 mx-auto mb-2.5 rounded-lg overflow-hidden border border-white/15 bg-zinc-900">
                    <OfficialArtworkImg
                      src={currentSong.lyricVideoThumbnail || currentSong.cover}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                    Official Lyric Video Active on YouTube
                  </div>
                  <div className="text-sm font-bold text-white">
                    {existingLyrStyle?.name || 'Official Lyric Video'}
                  </div>
                  <div className="text-xs text-zinc-300 mt-2">
                    Total Views:{' '}
                    <span className="font-bold text-white">
                      {formatNumFull(currentSong.lyricVideoViews || 0)}
                    </span>{' '}
                    · Daily:{' '}
                    <span className="font-bold text-amber-400">
                      +{formatNumFull(currentSong.dailyLyricVideoViews || 0)}/day
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Optional Custom Thumbnail Picker (Defaults to Song Cover Art) */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div
                      onClick={() => extraThumbInputRef.current?.click()}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-14 h-10 rounded-xl bg-zinc-900 border border-white/15 overflow-hidden shrink-0 relative">
                        <OfficialArtworkImg
                          src={extraThumbnailPreview || currentSong.cover}
                          alt={currentSong.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {activeType === 'visualizer'
                            ? 'Visualizer Thumbnail'
                            : 'Lyric Video Thumbnail'}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {extraThumbnailPreview
                            ? 'Custom Thumbnail Uploaded'
                            : 'Defaulting to Song Cover Art (Optional)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {extraThumbnailPreview && (
                        <button
                          type="button"
                          onClick={() => setExtraThumbnailPreview(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[10px] font-bold text-zinc-300 cursor-pointer"
                        >
                          Use Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => extraThumbInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white cursor-pointer"
                      >
                        {extraThumbnailPreview ? 'Change' : 'Custom Image'}
                      </button>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={extraThumbInputRef}
                      onChange={handleExtraImageChange}
                    />
                  </div>

                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                    {activeType === 'visualizer'
                      ? 'Official Audio Visualizers are cost-effective and generate a dedicated, separate view stream (~25-35% of MV scale) to boost daily fan engagement.'
                      : 'Official Lyric Videos deliver high early-week replay value (~40-55% of MV scale) as fans learn the lyrics and share quotes.'}
                  </div>

                  {filteredStyles.map(style => {
                    const isSelected = selectedStyleId === style.id;
                    const canAfford = (state.money || 0) >= style.cost;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? activeType === 'visualizer'
                              ? 'bg-sky-500/15 border-sky-400 shadow-sm'
                              : 'bg-amber-500/15 border-amber-400 shadow-sm'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                              {style.badge}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1">{style.name}</h4>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              className={`text-sm font-black ${
                                canAfford ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {formatMoney(style.cost)}
                            </div>
                            <div className="text-[10px] font-semibold text-zinc-400">
                              {style.viewMultiplier}x View Boost
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
                          {style.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-zinc-300">
                          <span>🔥 +{style.hypeBoost}% Hype</span>
                          <span>
                            📈 +{Math.round(style.streamDiscoveryBonus * 100)}% Stream Discovery
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleLaunchExtraFormat}
                    className={`w-full mt-3 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-[0.99] transition-all cursor-pointer ${
                      activeType === 'visualizer'
                        ? 'bg-sky-400 text-black hover:bg-sky-300'
                        : 'bg-amber-400 text-black hover:bg-amber-300'
                    }`}
                  >
                    {currentSong.status === 'released'
                      ? `Premiere ${
                          activeType === 'visualizer' ? 'Visualizer' : 'Lyric Video'
                        } on YouTube`
                      : `Produce ${
                          activeType === 'visualizer' ? 'Visualizer' : 'Lyric Video'
                        }`}
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
