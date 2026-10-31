import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull } from '../../constants';
import ActionModal from '../Modals/ActionModal';
import { Song } from '../../types';
import { calculateMusicVideoEngagement } from '../../data/musicVideoEngagementEngine';
import { generateAuthenticRegionalChart } from '../../data/countryMarketSystem';
import { OfficialMvThumbnailImg } from '../Common/OfficialMvThumbnailImg';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';

import YouTubePremiere from './YouTubePremiere';
import YouTubeHomeView from './YouTubeHomeView';
import YouTubeChartsView from './YouTubeChartsView';
import YouTubeArtistProfileView, {
  YouTubeChannelTarget,
  resolveNpcMvReleaseDate
} from './YouTubeArtistProfileView';
import YouTubeVisualFormatModal from '../Modals/YouTubeVisualFormatModal';
import { LabelOfficialYouTubeChannelPanel } from '../Common/RosterArtistSwitcherBar';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';

function getTimeAgo(releaseDate: string | undefined, currentDate: string): string {
  if (!releaseDate) return 'Just now';
  const r = new Date(releaseDate).getTime();
  const c = new Date(currentDate).getTime();
  const diffDays = Math.floor((c - r) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Just now';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  if (diffDays < 730) return '1 year ago';
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function YouTubeApp() {
  const { state, setState } = useGameContext();
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Song | null>(null);
  const [visualFormatSong, setVisualFormatSong] = useState<Song | null>(null);
  const [showVisualSongPicker, setShowVisualSongPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'profile'>('home');
  const [youtubeChannelMode, setYoutubeChannelMode] = useState<'artist' | 'label_channel'>('artist');
  const [chartRegion, setChartRegion] = useState<string>('global');
  const [channelTarget, setChannelTarget] = useState<YouTubeChannelTarget>({
    isPlayer: true,
    artistName: state.artist?.name || 'Artist'
  });

  const rlState = useMemo(() => getEnsuredRecordLabelState(state), [state]);
  const imprint = rlState.imprint;

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));

  const handleOpenChannel = (artistName: string, isPlayer: boolean) => {
    setSelectedVideo(null);
    setChannelTarget({
      isPlayer,
      artistName: isPlayer ? (state.artist?.name || 'Artist') : artistName
    });
    setActiveTab('profile');
  };

  // Combine Official Music Videos, Official Lyric Videos, and Official Audio Visualizers
  // each with their own separate view count, daily views, and likes!
  const videos = useMemo(() => {
    const allVisualUploads: Song[] = [];
    (state.songs || []).forEach(s => {
      if (!s || s.status !== 'released') return;
      if (s.hasMV) {
        allVisualUploads.push(s);
      }
      if (s.hasLyricVideo) {
        allVisualUploads.push({
          ...s,
          id: s.id * 10000 + 1,
          title: `${s.title} (Official Lyric Video)`,
          views: s.lyricVideoViews || 0,
          dailyViews: s.dailyLyricVideoViews || 0,
          mvLikes: s.lyricVideoLikes || 0,
          releaseDate: s.lyricVideoReleaseDate || s.releaseDate,
          mvThumbnail: s.lyricVideoThumbnail || s.cover,
          hasMV: true
        });
      }
      if (s.hasVisualizer) {
        allVisualUploads.push({
          ...s,
          id: s.id * 10000 + 2,
          title: `${s.title} (Official Visualizer)`,
          views: s.visualizerViews || 0,
          dailyViews: s.dailyVisualizerViews || 0,
          mvLikes: s.visualizerLikes || 0,
          releaseDate: s.visualizerReleaseDate || s.releaseDate,
          mvThumbnail: s.visualizerThumbnail || s.cover,
          hasMV: true
        });
      }
    });
    return allVisualUploads.sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [state.songs]);

  const liveChart = state.youtube.charts?.[`daily_${chartRegion}`];
  const chartData = useMemo(() => {
    if (liveChart && liveChart.length > 0) return liveChart;
    return generateAuthenticRegionalChart({
      platform: 'youtube',
      region: chartRegion,
      playerSongs: state.songs.filter(s => s.status === 'released' && s.hasMV),
      playerName: state.artist?.name || '',
      playerCountry: state.artist?.country || 'US',
      playerPopularity: state.popularity || 2.0,
      playerHype: state.hype || 15.0,
      currentDate: new Date(state.date),
      limit: 50
    });
  }, [liveChart, chartRegion, state.songs, state.artist, state.popularity, state.hype, state.date]);

  if (selectedVideo) {
    const isPlayerVideo = (selectedVideo as any).isPlayer !== false;
    const videoArtistName = isPlayerVideo
      ? (state.artist?.name || 'Artist')
      : normalizeRealArtistName((selectedVideo as any).artist || 'Artist');
    const videoCleanTitle = isPlayerVideo
      ? selectedVideo.title
      : normalizeRealTitle(selectedVideo.title, videoArtistName, false);
    const isPremiere = isPlayerVideo && selectedVideo.releaseDate === state.date.split('T')[0];

    if (isPremiere) {
      return <YouTubePremiere video={selectedVideo} onClose={() => setSelectedVideo(null)} />;
    }

    const effectiveReleaseDate = isPlayerVideo
      ? selectedVideo.releaseDate
      : selectedVideo.releaseDate && selectedVideo.releaseDate !== state.date && selectedVideo.releaseDate !== state.date.split('T')[0]
      ? selectedVideo.releaseDate
      : resolveNpcMvReleaseDate(
          videoArtistName,
          videoCleanTitle,
          state.date,
          undefined,
          selectedVideo.views
        );

    const engagement = calculateMusicVideoEngagement(selectedVideo, videoArtistName, state.hype, state.date);

    return (
      <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0F0F0F] z-50 overflow-y-auto pb-12 animate-in fade-in hide-scrollbar">
        {/* Sticky 16:9 YouTube Player */}
        <div className="sticky top-0 z-20 bg-black">
          <div className="relative w-full aspect-video flex items-center justify-center group overflow-hidden bg-black">
            <OfficialMvThumbnailImg
              artist={videoArtistName}
              title={videoCleanTitle}
              isPlayer={isPlayerVideo}
              explicitSrc={selectedVideo.mvThumbnail || selectedVideo.cover}
              className="relative h-full object-cover z-10 w-full"
            />

            {/* Player Overlay Controls */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-3 z-20">
              <div className="flex justify-between items-start">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-white bg-black/50 p-1.5 hover:bg-black/75 rounded-full transition cursor-pointer"
                  aria-label="Minimize video"
                >
                  <i className="ph ph-caret-down text-xl"></i>
                </button>
                <div className="flex space-x-3 pt-1">
                  <i className="ph ph-screencast text-white text-lg drop-shadow cursor-pointer"></i>
                  <i className="ph ph-closed-captioning text-white text-lg drop-shadow cursor-pointer"></i>
                  <i className="ph ph-gear text-white text-lg drop-shadow cursor-pointer"></i>
                </div>
              </div>
              <div className="flex items-center justify-center absolute inset-0 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-sm pointer-events-auto cursor-pointer hover:bg-black/80 transition">
                  <i className="ph-fill ph-play text-2xl translate-x-[1px]"></i>
                </div>
              </div>
              <div className="flex justify-between items-end mb-1">
                <div className="flex items-center text-white text-xs font-mono drop-shadow">
                  1:18 / 3:48
                </div>
                <i className="ph ph-corners-out text-white text-lg drop-shadow cursor-pointer"></i>
              </div>
            </div>

            {/* Always-Visible Back Button on Mobile Top-Left */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-2.5 left-2.5 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer"
              aria-label="Back to YouTube"
            >
              <i className="ph ph-arrow-left text-base"></i>
            </button>

            {/* Red Scrubber Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/25 z-20">
              <div className="absolute top-0 left-0 h-full bg-[#FF0000] w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Watch Page Metadata */}
        <div className="p-3.5">
          <h1 className="text-[#F1F1F1] font-bold text-base sm:text-lg leading-snug">
            {videoCleanTitle.includes('Official')
              ? videoCleanTitle
              : `${videoCleanTitle} (Official Music Video)`}
          </h1>

          <div className="flex items-center flex-wrap gap-1.5 mt-1.5 mb-3.5 text-[#AAAAAA] text-xs">
            <span className="text-zinc-200 font-medium">{formatNumFull(selectedVideo.views)} views</span>
            <span>•</span>
            <span>{getTimeAgo(effectiveReleaseDate, state.date)}</span>
            <span>•</span>
            <span className="text-[#3EA6FF] font-medium">#OfficialMusicVideo</span>
            <span>•</span>
            <span>{(engagement.likeToViewRatio * 100).toFixed(1)}% like ratio</span>
          </div>

          {/* Channel Row (Clickable to open Artist Channel Profile) */}
          <div className="flex items-center justify-between py-2 mb-3.5">
            <div
              onClick={() => handleOpenChannel(videoArtistName, isPlayerVideo)}
              className="flex items-center min-w-0 flex-1 mr-3 cursor-pointer group"
            >
              <OfficialArtworkImg
                artist={videoArtistName}
                isArtistPortrait={true}
                isPlayer={isPlayerVideo}
                explicitSrc={isPlayerVideo ? (state.artist?.image || state.artist?.avatar) : undefined}
                className="w-9 h-9 rounded-full object-cover mr-2.5 shrink-0 bg-[#272727] group-hover:opacity-85 transition"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-[#F1F1F1] font-bold text-sm truncate group-hover:text-[#3EA6FF] transition">
                    {videoArtistName}
                  </h3>
                  <i className="ph-fill ph-music-note-simple text-xs text-[#AAAAAA] shrink-0"></i>
                </div>
                <p className="text-[#AAAAAA] text-[11px]">
                  {isPlayerVideo
                    ? formatNum(state.youtube.subs)
                    : formatNum(Math.max(12500000, Math.floor((selectedVideo.views || 15000000) * 1.4)))}{' '}
                  subscribers
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenChannel(videoArtistName, isPlayerVideo)}
              className="px-3.5 py-1.5 rounded-full bg-[#F1F1F1] hover:bg-zinc-200 text-[#0F0F0F] text-xs font-semibold shrink-0 cursor-pointer transition"
            >
              {isPlayerVideo ? 'View Channel' : 'Channel'}
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
            <div className="flex items-center bg-[#272727] rounded-full px-3.5 py-1.5 shrink-0">
              <i className="ph-fill ph-thumbs-up text-white mr-1.5 text-sm"></i>
              <span className="text-white text-xs font-semibold border-r border-white/15 pr-2.5 mr-2.5">
                {formatNum(engagement.likes)}
              </span>
              <i className="ph ph-thumbs-down text-white text-sm"></i>
            </div>
            <div className="flex items-center bg-[#272727] rounded-full px-3.5 py-1.5 shrink-0">
              <i className="ph ph-share-fat text-white mr-1.5 text-sm"></i>
              <span className="text-white text-xs font-medium">Share</span>
            </div>
            <div className="flex items-center bg-[#272727] rounded-full px-3.5 py-1.5 shrink-0">
              <i className="ph ph-download-simple text-white mr-1.5 text-sm"></i>
              <span className="text-white text-xs font-medium">Download</span>
            </div>
            <div className="flex items-center bg-[#272727] rounded-full px-3.5 py-1.5 shrink-0">
              <i className="ph ph-bookmark-simple text-white mr-1.5 text-sm"></i>
              <span className="text-white text-xs font-medium">Save</span>
            </div>
          </div>

          {/* Comments Preview Card */}
          <div className="bg-[#272727] rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-white font-bold text-xs">Comments</span>
              <span className="text-[#AAAAAA] text-xs">{formatNumFull(engagement.commentsCount)}</span>
            </div>
            {engagement.topComments.slice(0, 2).map((cmt, idx) => (
              <div key={idx} className="flex items-start mb-2 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-white text-[10px] font-bold mr-2.5 shrink-0">
                  {cmt.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F1F1F1] text-xs leading-relaxed">
                    <span className="font-semibold text-[#AAAAAA] mr-1.5">{cmt.handle}</span>
                    {cmt.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0F0F0F] z-50 overflow-y-auto animate-in fade-in hide-scrollbar">
      {/* AUTHENTIC YOUTUBE TOP APP BAR */}
      <header className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between z-30 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition cursor-pointer"
            aria-label="Close YouTube"
          >
            <i className="ph ph-arrow-left text-xl"></i>
          </button>
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1 cursor-pointer"
          >
            <i className="ph-fill ph-youtube-logo text-[#FF0000] text-2xl"></i>
            <span className="text-white font-bold tracking-tighter text-lg">YouTube</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white">
          <button
            onClick={() => setModalType('create_mv')}
            className="bg-[#272727] hover:bg-[#3F3F3F] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <i className="ph-bold ph-plus text-xs text-[#FF0000]"></i>
            <span>Create MV / Video</span>
          </button>
          <button
            onClick={() => handleOpenChannel(state.artist?.name || 'Artist', true)}
            title="Your Channel"
            className="cursor-pointer rounded-full focus:outline-none"
          >
            <OfficialArtworkImg
              artist={state.artist?.name || 'Artist'}
              explicitSrc={state.artist?.image || state.artist?.avatar}
              isArtistPortrait={true}
              isPlayer={true}
              alt={state.artist?.name || 'You'}
              className={`w-7 h-7 rounded-full object-cover bg-[#272727] transition ${
                activeTab === 'profile' && channelTarget.isPlayer
                  ? 'ring-2 ring-[#FF0000]'
                  : 'border border-white/15'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Top Switcher: Personal Artist Channel vs Official Record Label YouTube Channel */}
      {imprint.isFounded && (
        <div className="bg-[#161616] border-b border-white/10 px-3.5 py-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/45 shrink-0">
            CHANNEL MODE:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setYoutubeChannelMode('artist')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                youtubeChannelMode === 'artist'
                  ? 'bg-[#FF0000] text-white'
                  : 'bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              {state.artist?.name || 'My Artist'} Channel
            </button>
            <button
              onClick={() => setYoutubeChannelMode('label_channel')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                youtubeChannelMode === 'label_channel'
                  ? 'bg-[#FF0000] text-white'
                  : 'bg-white/5 text-white/70 hover:text-white border border-rose-500/30'
              }`}
            >
              <i className="ph-fill ph-vinyl-record text-xs" />
              <span>{imprint.name} Official Channel</span>
            </button>
          </div>
        </div>
      )}

      {youtubeChannelMode === 'label_channel' && imprint.isFounded ? (
        <LabelOfficialYouTubeChannelPanel
          gameState={state}
          setGameState={setState}
          onSelectVideo={setSelectedVideo}
          externalOpenCreateModal={modalType === 'create_mv'}
          onCloseExternalCreateModal={() => setModalType(null)}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <YouTubeHomeView
              state={state}
              playerVideos={videos}
              chartData={chartData}
              onSelectVideo={setSelectedVideo}
              onOpenCreateMv={() => setModalType('create_mv')}
              onNavigateToCharts={() => setActiveTab('chart')}
              onOpenChannel={handleOpenChannel}
              getTimeAgo={getTimeAgo}
            />
          )}

          {activeTab === 'chart' && (
            <YouTubeChartsView
              state={state}
              chartData={chartData}
              chartRegion={chartRegion}
              setChartRegion={setChartRegion}
              onSelectVideo={setSelectedVideo}
              onOpenChannel={handleOpenChannel}
            />
          )}

          {activeTab === 'profile' && (
            <YouTubeArtistProfileView
              state={state}
              channelTarget={channelTarget}
              playerVideos={videos}
              chartData={chartData}
              onSelectVideo={setSelectedVideo}
              onOpenCreateMv={() => setModalType('create_mv')}
              onSwitchToPlayerChannel={() =>
                handleOpenChannel(state.artist?.name || 'Artist', true)
              }
              getTimeAgo={getTimeAgo}
            />
          )}
        </>
      )}

      {/* Authentic YouTube Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-md mx-auto bg-[#0F0F0F]/95 backdrop-blur-md flex justify-around items-center py-2 pb-5 z-40 border-t border-white/[0.08]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center transition cursor-pointer ${
            activeTab === 'home' ? 'text-white' : 'text-[#AAAAAA] hover:text-white'
          }`}
        >
          <i className={`ph${activeTab === 'home' ? '-fill' : ''} ph-house text-xl`}></i>
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex flex-col items-center transition cursor-pointer ${
            activeTab === 'chart' ? 'text-white' : 'text-[#AAAAAA] hover:text-white'
          }`}
        >
          <i className={`ph${activeTab === 'chart' ? '-fill' : ''} ph-fire text-xl`}></i>
          <span className="text-[10px] mt-0.5 font-medium">Charts</span>
        </button>

        <button
          onClick={() => setModalType('create_mv')}
          className="flex flex-col items-center text-[#AAAAAA] hover:text-white transition cursor-pointer"
        >
          <i className="ph ph-plus-circle text-xl"></i>
          <span className="text-[10px] mt-0.5 font-medium">Produce Video</span>
        </button>

        <button
          onClick={() => handleOpenChannel(state.artist?.name || 'Artist', true)}
          className={`flex flex-col items-center transition cursor-pointer ${
            activeTab === 'profile' ? 'text-white' : 'text-[#AAAAAA] hover:text-white'
          }`}
        >
          <i className={`ph${activeTab === 'profile' ? '-fill' : ''} ph-user-circle text-xl`}></i>
          <span className="text-[10px] mt-0.5 font-medium">Channel</span>
        </button>
      </nav>

      {modalType === 'create_mv' && youtubeChannelMode !== 'label_channel' && (
        <YouTubeVisualFormatModal
          song={visualFormatSong}
          onClose={() => {
            setModalType(null);
            setVisualFormatSong(null);
          }}
        />
      )}

      {modalType && modalType !== 'create_mv' && (
        <ActionModal type={modalType} onClose={() => setModalType(null)} />
      )}
    </div>
  );
}

