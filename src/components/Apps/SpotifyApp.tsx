import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull, COUNTRY_NAMES, NPCS, COUNTRY_TIERS, SPOTIFY_PLAYLISTS } from '../../constants';
import { Project, Song, ChartItem } from '../../types';
import { getTrackCoverArt, DetailedNPC, getDetailedNPC } from '../../data/npcAssets';
import { resolveAuthenticCover } from '../../data/musicCatalog';
import { generateCuratedSpotifyPlaylists } from '../../data/spotifyPlaylistsManager';
import { generateAuthenticRegionalChart } from '../../data/countryMarketSystem';
import { evaluateEditorialPitch, EditorialReviewResult } from '../../data/spotifyEditorialPitchEngine';
import { SpotifyNpcArtistProfileView } from './SpotifyNpcArtistProfileView';
import { NpcArtistsShowcase } from './NpcArtistsShowcase';
import { SpotifyHomeView } from './SpotifyHomeView';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';
import {
  EXPANDED_SPOTIFY_PLAYLISTS,
  getTopArtistsByMonthlyListeners,
  SpotifyPlaylistMeta,
  SpotifyTopArtistItem
} from '../../data/spotifyCatalogExpanded';
import { removeSongFromPlaylist } from '../../data/spotifyPlaylistTenureEngine';
import { ProjectStreamSnapshotModal } from '../Modals/ProjectStreamSnapshotModal';
import { ChartMovementBadge } from '../Common/ChartMovementBadge';
import { SpotifyTrackSubRow } from '../Common/SpotifyTrackSubRow';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';
import {
  SpotifyPlaylistPitchModal,
  SpotifyPlaylistAnalyticsHubModal
} from './SpotifyPlaylistPitchingHub';
import {
  SpotifyArtistUpcomingReleaseBanner,
  SpotifyReleaseCountdownPage,
  buildPlayerUnifiedCountdown
} from './SpotifyReleaseCountdownView';
import { SpotifyAppearsOnSection } from './SpotifyAppearsOnSection';
import { SpotifyArtistMerchShelf } from './SpotifyArtistMerchShelf';
import { getTrackRoleBadgeMeta, SINGLE_ROLE_OPTIONS } from '../../data/preReleaseCountdownEngine';
import {
  findRosterArtistByNameOrId,
  convertRosterArtistToDetailedNpc
} from '../../data/rosterSharedWorldBridge';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';

export default function SpotifyApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'profile'>('home');
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [selectedCountdownProjectId, setSelectedCountdownProjectId] = useState<number | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedNpc, setSelectedNpc] = useState<DetailedNPC | null>(null);
  const [pitchModal, setPitchModal] = useState<string | null>(null);
  const [showPlaylistHub, setShowPlaylistHub] = useState<boolean>(false);
  const [editorialResult, setEditorialResult] = useState<EditorialReviewResult | null>(null);
  const [snapshotItem, setSnapshotItem] = useState<any>(null);
  const [chartRegion, setChartRegion] = useState<string>('global');
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('daily');

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));

  const openArtistProfileByName = (artName: string) => {
    const rosterMatch = findRosterArtistByNameOrId(artName, state);
    if (rosterMatch) {
      const labelState = getEnsuredRecordLabelState(state);
      const impName = labelState?.imprint?.imprintName || 'Record Label';
      const dateStr = state?.date ? String(state.date).split('T')[0] : '2026-01-01';
      setSelectedNpc(convertRosterArtistToDetailedNpc(rosterMatch, impName, dateStr));
      return;
    }
    const npcObj = getDetailedNPC(artName);
    if (npcObj) setSelectedNpc(npcObj);
  };

  const topSongs = useMemo(() => {
    return [...state.songs].filter(s => s.status === 'released').sort((a,b) => (b.dailyStreams || 0) - (a.dailyStreams || 0)).slice(0, 5);
  }, [state.songs]);

  const allReleases = useMemo(() => {
    const bSideIds = new Set();
    state.songs.forEach(s => {
       const proj = state.projects.find(p => p.songs && p.songs.some(ps => ps.id === s.id));
       if (proj && proj.releaseDate && s.releaseDate && s.releaseDate >= proj.releaseDate) {
           bSideIds.add(s.id);
       }
    });

    const singles = state.songs
       .filter(s => s.status === 'released' && !bSideIds.has(s.id))
       .map(s => ({ ...s, type: 'single' }));
       
    const projs = state.projects.filter(p => p.status === 'released');
    
    return [...singles, ...projs].sort((a,b) => new Date(b.releaseDate || state.date).getTime() - new Date(a.releaseDate || state.date).getTime());
  }, [state.songs, state.projects, state.date]);

  const scheduledPlayerProjects = useMemo(() => {
    const todayStr = state.date.split('T')[0];
    return state.projects.filter(
      p => p.status === 'scheduled' && (!p.releaseDate || p.releaseDate > todayStr)
    );
  }, [state.projects, state.date]);

  const activePlayerCountdown = useMemo(() => {
    if (selectedCountdownProjectId === null) return null;
    const proj = state.projects.find(
      p => p.id === selectedCountdownProjectId && p.status === 'scheduled'
    );
    if (!proj) return null;
    return buildPlayerUnifiedCountdown(proj, state);
  }, [selectedCountdownProjectId, state]);

  const handleEarlyReleaseFromCountdown = (
    projectId: number,
    songId: number,
    role: 'lead_single' | 'pre_release_single' | 'promotional_single' | 'single'
  ) => {
    const todayStr = state.date.split('T')[0];
    const roleMeta = SINGLE_ROLE_OPTIONS.find(r => r.id === role) || SINGLE_ROLE_OPTIONS[1];
    const tierMult = state.artist?.tier === 1 ? 1.4 : state.artist?.tier === 2 ? 1.7 : 1.0;

    setState(prev => {
      const newHype = Math.min(100, Number(((prev.hype || 0) + roleMeta.hypeBonus).toFixed(1)));
      let updatedPot = 0;

      const updatedSongs = prev.songs.map(s => {
        if (s.id === songId) {
          const collabBonus = s.collabId && s.collabId !== 'none' ? 25 : 0;
          const calcPot =
            ((s.quality * 0.5) + ((prev.popularity || 0) * 0.3) + (newHype * 0.2) + collabBonus) *
            tierMult *
            roleMeta.streamMult;
          updatedPot = Math.max(s.basePotential || 0, calcPot);
          return {
            ...s,
            status: 'released' as const,
            releaseDate: todayStr,
            trackType: role,
            basePotential: updatedPot,
            momentum: 1.08
          };
        }
        return s;
      });

      const updatedProjects = prev.projects.map(pr => {
        if (pr.id !== projectId) return pr;
        const preSaveBonus = Math.round((pr.preSaves || 300) * (roleMeta.preSaveBoost - 1) + 500);
        return {
          ...pr,
          preSaves: (pr.preSaves || 0) + preSaveBonus,
          songs: (pr.songs || []).map(ps =>
            ps.id === songId
              ? {
                  ...ps,
                  status: 'released' as const,
                  releaseDate: todayStr,
                  trackType: role,
                  basePotential: updatedPot || ps.basePotential
                }
              : ps
          )
        };
      });

      return {
        ...prev,
        hype: newHype,
        songs: updatedSongs,
        projects: updatedProjects
      };
    });
  };

  const chartData = useMemo(() => {
      const key = `${chartType}_${chartRegion === 'global' ? 'global' : chartRegion}`;
      if (state.spotify.charts && state.spotify.charts[key] && state.spotify.charts[key].length > 0) {
        return state.spotify.charts[key];
      }
      // Generate authentic regional chart for the selected country on demand
      return generateAuthenticRegionalChart({
        platform: 'spotify',
        region: chartRegion,
        playerSongs: state.songs.filter(s => s.status === 'released'),
        playerName: state.artist?.name || '',
        playerCountry: state.artist?.country || 'US',
        playerPopularity: state.popularity || 2.0,
        playerHype: state.hype || 15.0,
        isWeekly: chartType === 'weekly',
        currentDate: new Date(state.date),
        limit: 50
      });
  }, [state.spotify.charts, chartRegion, chartType, state.songs, state.artist, state.popularity, state.hype, state.date]);

  const topMonthlyArtists = useMemo(() => {
    return getTopArtistsByMonthlyListeners(state);
  }, [state.spotify.listeners, state.artist]);

  const [homeFilter, setHomeFilter] = useState<'all' | 'music' | 'playlists' | 'artists'>('all');

  const greeting = useMemo(() => {
    const d = new Date(state.date);
    const h = d.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, [state.date]);

  const handlePitch = (songId: number, playlistId: string) => {
      const pl = EXPANDED_SPOTIFY_PLAYLISTS.find(p => p.id === playlistId) || SPOTIFY_PLAYLISTS.find(p => p.id === playlistId);
      if (!pl) return;
      
      const targetSong = state.songs.find(s => s.id === songId);
      if (!targetSong) return;

      const review = evaluateEditorialPitch(targetSong, playlistId, state.popularity, state.hype, state.date);
      
      if (review.accepted) {
          setState(prev => {
              const newSongs = prev.songs.map(s => {
                  if (s.id === songId) {
                      return { ...s, playlistPlacements: [...(s.playlistPlacements || []), playlistId] };
                  }
                  return s;
              });
              return { ...prev, songs: newSongs };
          });
      }

      setPitchModal(null);
      setEditorialResult(review);
  };

  const handleExitPlaylist = (songId: number, playlistId: string) => {
      setState(prev => ({
          ...prev,
          songs: removeSongFromPlaylist(songId, playlistId, prev.songs)
      }));
  };

  const flagshipPlaylists = useMemo(() => {
    return EXPANDED_SPOTIFY_PLAYLISTS.filter(p => p.category === 'flagship' || p.category === 'genre');
  }, []);

  const moodPlaylists = useMemo(() => {
    return EXPANDED_SPOTIFY_PLAYLISTS.filter(p => p.category === 'mood');
  }, []);

  const algorithmicPlaylists = useMemo(() => {
    return EXPANDED_SPOTIFY_PLAYLISTS.filter(p => p.category === 'algorithmic');
  }, []);

  const quickAccessPlaylists = useMemo(() => {
    return [
      EXPANDED_SPOTIFY_PLAYLISTS[0], // Today's Top Hits
      EXPANDED_SPOTIFY_PLAYLISTS[10], // Release Radar
      EXPANDED_SPOTIFY_PLAYLISTS[5], // Chill Vibes
      EXPANDED_SPOTIFY_PLAYLISTS[3], // RapCaviar
      EXPANDED_SPOTIFY_PLAYLISTS[2], // Pop Rising
      EXPANDED_SPOTIFY_PLAYLISTS[11] // Discover Weekly
    ];
  }, []);

  const renderHome = () => (
      <div className="p-4 pt-12 pb-28 bg-gradient-to-b from-emerald-950/35 via-[#121212] to-[#121212]">
        <SpotifyHomeView
          state={state}
          homeFilter={homeFilter}
          setHomeFilter={setHomeFilter}
          onSelectPlaylist={setSelectedPlaylist}
          onSelectNpc={setSelectedNpc}
          onOpenPlayerProfile={() => setActiveTab('profile')}
          onOpenCharts={() => setActiveTab('chart')}
          onSelectPlayerRelease={setSelectedRelease}
          onOpenPlaylistHub={() => setShowPlaylistHub(true)}
        />
      </div>
  );

  const renderPlaylistDetail = () => {
      const pl = selectedPlaylist;
      const rawTracks = state.spotify.playlists?.[pl.id];
      const tracks = (rawTracks && rawTracks.length > 0)
        ? rawTracks
        : (generateCuratedSpotifyPlaylists(state.songs, state.artist?.name || '', state.popularity || 30)[pl.id] || []);
      
      let bgGrad = 'from-zinc-800 via-[#181818] to-[#121212]';
      let coverGrad = pl.gradient || 'from-gray-700 to-gray-900';
      
      if (pl.id === 'tth') { bgGrad = 'from-blue-900/90 via-[#151928] to-[#121212]'; coverGrad = 'from-blue-700 to-purple-900'; }
      else if (pl.id === 'nmf') { bgGrad = 'from-rose-900/90 via-[#24151b] to-[#121212]'; coverGrad = 'from-pink-600 to-orange-800'; }
      else if (pl.id === 'rc') { bgGrad = 'from-emerald-900/90 via-[#13221c] to-[#121212]'; coverGrad = 'from-green-700 to-blue-900'; }
      else if (pl.id === 'pr') { bgGrad = 'from-fuchsia-900/90 via-[#221526] to-[#121212]'; coverGrad = 'from-fuchsia-600 to-purple-800'; }
      else if (pl.id === 'v50') { bgGrad = 'from-cyan-900/90 via-[#132126] to-[#121212]'; coverGrad = 'from-cyan-600 to-blue-800'; }

      const leadTrack = tracks[0];
      const leadArtist = leadTrack ? (leadTrack.isPlayer ? leadTrack.artist : normalizeRealArtistName(leadTrack.artist)) : 'Taylor Swift';
      const leadTitle = leadTrack ? (leadTrack.isPlayer ? leadTrack.title : normalizeRealTitle(leadTrack.title)) : '';
      
      return (
          <div className="pb-28">
            <div className={`relative pt-14 px-4 pb-5 bg-gradient-to-b ${bgGrad} z-0`}>
               <div className="flex flex-col items-center mt-2">
                  {/* AUTHENTIC SPOTIFY EDITORIAL PLAYLIST COVER WITH #1 ARTIST PHOTO */}
                  <div className={`w-52 h-52 shadow-2xl mb-5 rounded-[6px] bg-gradient-to-br ${coverGrad} relative overflow-hidden`}>
                      <OfficialArtworkImg
                        artist={leadArtist}
                        title={leadTitle}
                        explicitSrc={leadTrack?.cover}
                        isArtistPortrait={!leadTitle}
                        isPlayer={Boolean(leadTrack?.isPlayer)}
                        alt={pl.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${coverGrad} opacity-60 mix-blend-multiply`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <i className="ph-fill ph-spotify-logo text-white text-lg drop-shadow"></i>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-left">
                        <span className="text-[9px] uppercase tracking-widest font-black text-[#1DB954] block mb-0.5">
                          {pl.curator || 'Spotify Editorial'}
                        </span>
                        <span className="text-2xl font-black text-white leading-none tracking-tight drop-shadow-md block">
                          {pl.name}
                        </span>
                      </div>
                  </div>
               </div>

               <div className="text-left">
                  <p className="text-[#A7A7A7] text-xs leading-relaxed">
                      {pl.id === 'nmf' ? 'The best new music of the week, handpicked by Spotify editors every Friday.' : 
                       pl.id === 'tth' ? `The biggest songs in the world right now. Cover: ${leadArtist}.` : pl.desc}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-2.5 text-xs text-[#A7A7A7]">
                     <i className="ph-fill ph-spotify-logo text-[#1DB954] text-base"></i>
                     <span className="font-bold text-white">Spotify</span>
                     <span>•</span>
                     <span>{formatNumFull(pl.followers)} saves</span>
                     <span>•</span>
                     <span>{tracks.length} songs</span>
                  </div>
               </div>
            </div>
            
            {/* Authentic Spotify Playlist Action Bar */}
            <div className="px-4 py-3 relative z-10 flex justify-between items-center border-b border-white/5">
               <div className="flex items-center space-x-2.5">
                  <button 
                     onClick={() => setPitchModal(pl.id)}
                     className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs px-4 py-2 rounded-full active:scale-95 transition flex items-center space-x-1.5 cursor-pointer shadow"
                  >
                     <i className="ph-bold ph-paper-plane-tilt"></i>
                     <span>Pitch Song</span>
                  </button>
                  <button
                     onClick={() => setShowPlaylistHub(true)}
                     className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs px-3.5 py-2 rounded-full active:scale-95 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                     <i className="ph-fill ph-playlist text-[#1DB954]"></i>
                     <span>Playlist Hub</span>
                  </button>
               </div>
               <div className="flex items-center space-x-3">
                  <i className="ph-fill ph-shuffle text-xl text-[#1DB954]"></i>
                  <button className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-xl hover:bg-[#1ed760] hover:scale-105 cursor-pointer">
                     <i className="ph-fill ph-play text-xl translate-x-[1px]"></i>
                  </button>
               </div>
            </div>
            
            <div className="px-3 pt-2 relative z-10 space-y-1">
               {tracks.length > 0 ? tracks.map((item: any, idx: number) => {
                  const rank = idx + 1;
                  const meta = resolveSongMetadataAndCollabCredits(item, item.artist, state);
                  const displayArtist = meta.primaryArtist;
                  const displayTitle = meta.cleanTitle;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.isPlayer) {
                          setSelectedPlaylist(null);
                          setActiveTab('profile');
                        } else {
                          openArtistProfileByName(displayArtist);
                        }
                      }}
                      className={`flex items-center py-2 px-2 rounded-lg hover:bg-white/10 transition group cursor-pointer ${
                        item.isPlayer ? 'bg-[#1DB954]/10 ring-1 ring-[#1DB954]/30' : ''
                      }`}
                    >
                       <div className="w-7 text-center shrink-0 mr-1.5 tabular-nums">
                          <span className={`text-xs font-bold ${rank === 1 ? 'text-amber-400 font-black' : item.isPlayer ? 'text-[#1DB954] font-black' : 'text-[#A7A7A7]'}`}>
                            {rank}
                          </span>
                       </div>
                       <div className="relative shrink-0">
                         <OfficialArtworkImg
                            artist={displayArtist}
                            title={displayTitle}
                            explicitSrc={item.cover}
                            isPlayer={item.isPlayer}
                            alt={displayTitle}
                            className="w-12 h-12 bg-[#282828] rounded-[4px] shrink-0 object-cover shadow"
                         />
                         {rank === 1 && (
                           <span className="absolute -top-1 -left-1 bg-amber-400 text-black text-[8px] font-black px-1 rounded-sm shadow">
                             ★1
                           </span>
                         )}
                       </div>
                       <div className="ml-3 flex-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <h4 className={`font-semibold text-[14px] truncate ${item.isPlayer ? 'text-[#1DB954]' : 'text-white'}`}>{displayTitle}</h4>
                            {rank === 1 && (
                              <span className="text-[8px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1 py-0.2 rounded shrink-0">
                                Cover Star
                              </span>
                            )}
                            {item.isPlayer && (
                              <span className="text-[8px] font-black uppercase bg-[#1DB954] text-black px-1 py-0.2 rounded shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <SpotifyTrackSubRow
                            songOrItem={item}
                            fallbackArtistName={displayArtist}
                            state={state}
                            onSelectArtistName={(artName, isPl) => {
                              if (isPl) {
                                setSelectedPlaylist(null);
                                setActiveTab('profile');
                              } else {
                                openArtistProfileByName(artName);
                              }
                            }}
                          />
                       </div>
                       <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                             <div className="text-xs text-white font-semibold tabular-nums">{formatNumFull(item.streams || item.points)}</div>
                             <div className="text-[10px] text-[#A7A7A7]">streams</div>
                          </div>
                          {item.isPlayer ? (
                             <button
                                onClick={(e) => {
                                   e.stopPropagation();
                                   const matchingSong = state.songs.find(s => s.title.toLowerCase() === item.title.toLowerCase());
                                   if (matchingSong) handleExitPlaylist(matchingSong.id, pl.id);
                                }}
                                className="text-[10px] font-bold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-600 px-2 py-1 rounded border border-red-500/30 transition cursor-pointer"
                                title="Leave playlist"
                             >
                                Leave
                             </button>
                          ) : (
                             <i className="ph ph-dots-three-vertical text-lg text-[#A7A7A7]"></i>
                          )}
                       </div>
                    </div>
                  );
               }) : (
                  <p className="text-center text-gray-500 text-sm py-10">Playlist is updating... Check back Monday.</p>
               )}
            </div>
          </div>
      );
  };

  const renderChart = () => {
     const countries = Object.entries(COUNTRY_NAMES).sort((a,b) => a[1].localeCompare(b[1]));
     const regionLabel = chartRegion === 'global' ? 'Global' : (COUNTRY_NAMES[chartRegion] || chartRegion);

     // Region-specific authentic Spotify Top 50 cover gradients
     let coverGrad = 'from-[#0d7361] via-[#134e4a] to-[#082f2c]';
     let backdropGrad = 'from-[#0f5246]/90 via-[#152421] to-[#121212]';
     let accentLineColor = '#1DB954';

     if (chartType === 'weekly') {
       coverGrad = 'from-indigo-600 via-purple-800 to-slate-950';
       backdropGrad = 'from-indigo-900/85 via-[#181726] to-[#121212]';
       accentLineColor = '#c084fc';
     } else if (chartRegion === 'US') {
       coverGrad = 'from-blue-600 via-indigo-800 to-slate-950';
       backdropGrad = 'from-blue-900/85 via-[#141a29] to-[#121212]';
       accentLineColor = '#60a5fa';
     } else if (chartRegion === 'GB') {
       coverGrad = 'from-rose-600 via-red-800 to-zinc-950';
       backdropGrad = 'from-rose-900/85 via-[#261419] to-[#121212]';
       accentLineColor = '#fb7185';
     } else if (chartRegion === 'ID') {
       coverGrad = 'from-red-600 via-rose-800 to-stone-950';
       backdropGrad = 'from-red-900/85 via-[#261414] to-[#121212]';
       accentLineColor = '#f87171';
     } else if (chartRegion === 'KR') {
       coverGrad = 'from-violet-600 via-fuchsia-800 to-zinc-950';
       backdropGrad = 'from-violet-900/85 via-[#201429] to-[#121212]';
       accentLineColor = '#e879f9';
     } else if (chartRegion === 'JP') {
       coverGrad = 'from-pink-600 via-rose-800 to-slate-950';
       backdropGrad = 'from-pink-900/85 via-[#261420] to-[#121212]';
       accentLineColor = '#f472b6';
     } else if (chartRegion !== 'global') {
       coverGrad = 'from-cyan-600 via-teal-800 to-slate-950';
       backdropGrad = 'from-cyan-900/85 via-[#132226] to-[#121212]';
       accentLineColor = '#2dd4bf';
     }

     const topOneItem = chartData[0];
     const topOneArtist = topOneItem
       ? (topOneItem.isPlayer ? topOneItem.artist : normalizeRealArtistName(topOneItem.artist))
       : 'Taylor Swift';
     const topOneTitle = topOneItem
       ? (topOneItem.isPlayer ? topOneItem.title : normalizeRealTitle(topOneItem.title))
       : '';

     const totalChartStreams = chartData.reduce((sum, item) => sum + (item.points || 0), 0);
     const quickRegions = [
       { code: 'global', label: 'Global' },
       { code: 'US', label: 'USA' },
       { code: 'GB', label: 'UK' },
       { code: 'ID', label: 'Indonesia' },
       { code: 'KR', label: 'South Korea' },
       { code: 'JP', label: 'Japan' },
       { code: 'BR', label: 'Brazil' }
     ];

     return (
        <div className="pb-28 min-h-screen bg-[#121212]">
          {/* AUTHENTIC SPOTIFY CHARTS PLAYLIST HEADER */}
          <div className={`relative pt-14 px-4 pb-5 bg-gradient-to-b ${backdropGrad}`}>
            {/* Top Controls: Daily / Weekly Switch + Country Dropdown */}
            <div className="flex items-center justify-between gap-2 mb-4 pl-10">
              <div className="flex bg-black/40 backdrop-blur-md rounded-full p-0.5 border border-white/10">
                <button
                  onClick={() => setChartType('daily')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition cursor-pointer ${
                    chartType === 'daily' ? 'bg-[#1DB954] text-black' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Daily Top 50
                </button>
                <button
                  onClick={() => setChartType('weekly')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition cursor-pointer ${
                    chartType === 'weekly' ? 'bg-[#1DB954] text-black' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Weekly
                </button>
              </div>

              <select
                value={chartRegion}
                onChange={e => setChartRegion(e.target.value)}
                className="bg-black/40 backdrop-blur-md text-white border border-white/15 font-bold text-xs rounded-full px-3 py-1.5 focus:outline-none cursor-pointer max-w-[145px] truncate"
              >
                <option value="global" className="bg-[#181818]">🌍 Global</option>
                <option value="US" className="bg-[#181818]">🇺🇸 USA</option>
                <option value="GB" className="bg-[#181818]">🇬🇧 UK</option>
                <option value="ID" className="bg-[#181818]">🇮🇩 Indonesia</option>
                <optgroup label="All Territories" className="bg-[#181818]">
                  {countries.filter(c => !['US', 'GB', 'ID'].includes(c[0])).map(c => (
                    <option key={c[0]} value={c[0]} className="bg-[#181818]">{c[1]}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Quick Territory Pills */}
            <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar mb-5 -mx-4 px-4">
              {quickRegions.map(r => (
                <button
                  key={r.code}
                  onClick={() => setChartRegion(r.code)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition cursor-pointer ${
                    chartRegion === r.code
                      ? 'bg-white text-black font-bold shadow'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* OFFICIAL SPOTIFY "TOP 50" SQUARE ARTWORK CARD */}
            <div className="flex flex-col items-center">
              <div
                className={`w-48 h-48 rounded-[6px] shadow-2xl bg-gradient-to-br ${coverGrad} relative overflow-hidden flex flex-col justify-between p-4 border border-white/10 mb-5`}
              >
                {/* Decorative Background Glow */}
                <div
                  className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-40"
                  style={{ backgroundColor: accentLineColor }}
                />

                {/* Top Row: Spotify Icon + Chart Frequency Tag */}
                <div className="flex items-center justify-between relative z-10">
                  <i className="ph-fill ph-spotify-logo text-white text-xl drop-shadow"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/80 bg-black/30 px-2 py-0.5 rounded-full">
                    {chartType === 'weekly' ? 'Weekly Chart' : 'Daily Chart'}
                  </span>
                </div>

                {/* Center: Iconic "Top 50" Typography & Divider */}
                <div className="my-auto relative z-10 text-left">
                  <h2 className="text-[34px] font-black text-white leading-none tracking-tighter drop-shadow-md">
                    {chartType === 'weekly' ? 'Top Songs' : 'Top 50'}
                  </h2>
                  <div
                    className="w-full h-[3px] my-2 rounded-full"
                    style={{ backgroundColor: accentLineColor }}
                  />
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-white/95 block truncate">
                    {regionLabel}
                  </span>
                </div>

                {/* Bottom Row: Official Spotify Charts Watermark */}
                <div className="flex items-center justify-between relative z-10 pt-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-white/75">
                    Spotify Charts
                  </span>
                  <span className="text-[9px] font-mono text-white/75">
                    TOP 50
                  </span>
                </div>
              </div>
            </div>

            {/* Official Spotify Chart Playlist Title & Metadata */}
            <div className="text-left">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {chartType === 'weekly' ? `Weekly Top Songs – ${regionLabel}` : `Top 50 – ${regionLabel}`}
              </h1>
              <p className="text-xs text-[#A7A7A7] mt-1 leading-relaxed">
                Your {chartType} update of the most played tracks right now – {regionLabel}.
              </p>

              <div className="flex items-center flex-wrap gap-1.5 mt-2.5 text-xs text-[#A7A7A7]">
                <i className="ph-fill ph-spotify-logo text-[#1DB954] text-base"></i>
                <span className="font-bold text-white">SpotifyCharts</span>
                <span>•</span>
                <span>{formatNum(totalChartStreams)} total streams</span>
                <span>•</span>
                <span className="text-[#1DB954] font-semibold">Updated {chartType}</span>
              </div>
            </div>
          </div>

          {/* SPOTIFY ACTION BAR */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center space-x-5">
              <i className="ph ph-plus-circle text-2xl text-[#A7A7A7] hover:text-white transition cursor-pointer"></i>
              <i className="ph ph-arrow-circle-down text-2xl text-[#A7A7A7] hover:text-white transition cursor-pointer"></i>
              <i className="ph ph-share-network text-2xl text-[#A7A7A7] hover:text-white transition cursor-pointer"></i>
              <i className="ph ph-dots-three text-2xl text-[#A7A7A7] hover:text-white transition cursor-pointer"></i>
            </div>

            <div className="flex items-center space-x-3">
              <i className="ph-fill ph-shuffle text-xl text-[#1DB954]"></i>
              <button className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-xl hover:bg-[#1ed760] cursor-pointer">
                <i className="ph-fill ph-play text-xl translate-x-[1px]"></i>
              </button>
            </div>
          </div>

          {/* TRACKLIST TABLE HEADER */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#A7A7A7]">
            <div className="flex items-center space-x-3">
              <span className="w-7 text-center">#</span>
              <span>Track</span>
            </div>
            <span className="pr-5">{chartType === 'weekly' ? 'Weekly Streams' : 'Daily Streams'}</span>
          </div>

          {/* AUTHENTIC SPOTIFY TOP 50 CHART TRACKLIST */}
          <div className="px-2 space-y-0.5">
            {chartData.length > 0 ? chartData.map((item, idx) => {
               const currPos = idx + 1;
               const meta = resolveSongMetadataAndCollabCredits(item, item.artist, state);
               const displayArtist = meta.primaryArtist;
               const displayTitle = meta.cleanTitle;

               return (
               <div
                 key={idx}
                 onClick={() => {
                   if (item.isPlayer) {
                     const matchingSong = state.songs.find(
                       s => s.title.toLowerCase() === displayTitle.toLowerCase()
                     );
                     if (matchingSong) {
                       setSelectedRelease({ ...matchingSong, type: 'single' });
                     } else {
                       setActiveTab('profile');
                     }
                   } else {
                     openArtistProfileByName(displayArtist);
                   }
                 }}
                 className={`flex items-center py-2 px-2 rounded-[6px] hover:bg-white/10 transition group cursor-pointer ${
                   item.isPlayer ? 'bg-[#1DB954]/10 ring-1 ring-[#1DB954]/30' : ''
                 }`}
               >
                  {/* Rank & Movement Column (Up, Down, =, RE-ENTRY, NEW) */}
                  <div className="w-9 flex flex-col items-center justify-center shrink-0">
                     <span className={`font-bold text-sm tabular-nums ${
                       currPos === 1 ? 'text-[#1DB954] font-black' : item.isPlayer ? 'text-[#1DB954]' : 'text-white'
                     }`}>
                       {currPos}
                     </span>
                     <ChartMovementBadge
                       item={item}
                       currentRank={currPos}
                       chartLimit={chartData.length}
                       currentDate={state.date}
                       variant="spotify"
                     />
                  </div>

                  {/* Cover Artwork */}
                  <div className="relative ml-2 shrink-0">
                    <OfficialArtworkImg
                       artist={displayArtist}
                       title={displayTitle}
                       explicitSrc={item.cover}
                       isPlayer={item.isPlayer}
                       alt={displayTitle}
                       className="w-12 h-12 bg-[#282828] rounded-[4px] object-cover shadow"
                    />
                    {currPos === 1 && (
                      <span className="absolute -top-1 -left-1 bg-[#1DB954] text-black text-[8px] font-black px-1 rounded-sm shadow">
                        #1
                      </span>
                    )}
                  </div>

                  {/* Song Title & Subtitle ([E], [TV Music video], Artist 1, Artist 2) */}
                  <div className="ml-3 flex-1 min-w-0 pr-2">
                     <div className="flex items-center space-x-1.5">
                       <h4 className={`font-semibold text-[14px] truncate ${
                         item.isPlayer || currPos === 1 ? 'text-[#1DB954]' : 'text-white'
                       }`}>
                         {displayTitle}
                       </h4>
                       {item.isPlayer && (
                         <span className="bg-[#1DB954] text-black text-[8px] font-black px-1 py-0.2 rounded uppercase shrink-0">
                           YOU
                         </span>
                       )}
                     </div>
                     <SpotifyTrackSubRow
                       songOrItem={item}
                       fallbackArtistName={displayArtist}
                       state={state}
                       onSelectArtistName={(artName, isPl) => {
                         if (isPl) {
                           setActiveTab('profile');
                         } else {
                           openArtistProfileByName(artName);
                         }
                       }}
                     />
                  </div>

                  {/* Stream Count & Menu */}
                  <div className="text-right shrink-0 flex items-center space-x-2">
                     <div>
                       <div className="text-xs text-white font-semibold tabular-nums">
                         {formatNumFull(item.points)}
                       </div>
                       <div className="text-[10px] text-[#A7A7A7]">
                         streams
                       </div>
                     </div>
                     <i className="ph ph-dots-three-vertical text-base text-[#A7A7A7] group-hover:text-white"></i>
                  </div>
               </div>
            )}) : (
               <p className="text-center text-gray-500 text-sm py-10">Chart is calculating... Check back tomorrow.</p>
            )}
          </div>
        </div>
     );
  };

  const renderProfile = () => {
    return (
      <div className="pb-24">
        <div className="relative h-[40vh] min-h-[300px]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${state.artist?.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
             <div className="flex items-center space-x-1.5 mb-2">
                <i className="ph-fill ph-check-circle text-blue-400 text-lg"></i>
                <span className="text-xs font-semibold text-white tracking-widest uppercase">Verified Artist</span>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{state.artist?.name}</h1>
             <div className="flex items-center flex-wrap gap-2">
               <p className="text-gray-300 font-medium text-sm">{formatNumFull(state.spotify.listeners)} monthly listeners</p>
               {Boolean(state.spotify.listenerDelta) && (
                 <span
                   className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                     (state.spotify.listenerDelta || 0) > 0
                       ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40'
                       : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                   }`}
                 >
                   {(state.spotify.listenerDelta || 0) > 0 ? '+' : ''}
                   {formatNumFull(state.spotify.listenerDelta || 0)} today
                 </span>
               )}
             </div>
          </div>
        </div>
        
        <div className="p-4 -mt-2 relative z-10">
          <div className="flex justify-between items-center mb-8">
             <div className="flex space-x-4 items-center">
                <button className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-white active:scale-95 transition">
                   <i className="ph ph-dots-three text-xl"></i>
                </button>
             </div>
             <button className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-lg hover:bg-[#1ed760] cursor-pointer">
                <i className="ph-fill ph-play text-2xl translate-x-[2px]"></i>
             </button>
          </div>

          <h3 className="text-xl font-bold text-white mb-4">Popular</h3>
          <div className="space-y-1 mb-10">
            {topSongs.length > 0 ? topSongs.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between p-2 hover:bg-white/10 rounded-md transition group cursor-pointer" onClick={() => setSelectedRelease(s)}>
                <div className="flex items-center space-x-4 min-w-0 flex-1 pr-3">
                  <span className="text-gray-400 font-medium w-4 text-center text-sm shrink-0">{i + 1}</span>
                  <OfficialArtworkImg
                    artist={state.artist?.name || 'Artist'}
                    title={s.title}
                    isAlbum={false}
                    isPlayer={true}
                    explicitSrc={s.cover}
                    className="w-12 h-12 rounded object-cover bg-gray-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-medium text-sm leading-tight truncate">{s.title}</h4>
                    <SpotifyTrackSubRow
                      songOrItem={s}
                      fallbackArtistName={state.artist?.name || 'Artist'}
                      state={state}
                      showArtists={s.collabId !== 'none' && Boolean(s.collabId)}
                      customSubText={`${formatNumFull(s.streams)} streams`}
                      onSelectArtistName={(artName, isPl) => {
                        if (!isPl) {
                          const npcObj = getDetailedNPC(artName);
                          if (npcObj) setSelectedNpc(npcObj);
                        }
                      }}
                    />
                  </div>
                </div>
                <i className="ph ph-dots-three text-xl text-gray-400 group-hover:text-white transition shrink-0"></i>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-4 text-center">No releases yet.</p>
            )}
          </div>

          {scheduledPlayerProjects.length > 0 && (
            <div className="space-y-4 mb-8">
              {scheduledPlayerProjects.map(schedProj => {
                const unifiedCountdown = buildPlayerUnifiedCountdown(schedProj, state);
                return (
                  <SpotifyArtistUpcomingReleaseBanner
                    key={schedProj.id}
                    countdownRelease={unifiedCountdown}
                    currentDateStr={state.date}
                    onOpenCountdownPage={() => setSelectedCountdownProjectId(schedProj.id)}
                  />
                );
              })}
            </div>
          )}

          <h3 className="text-xl font-bold text-white mb-4">Discography</h3>
          <div className="flex overflow-x-auto space-x-4 hide-scrollbar pb-4 -mx-4 px-4">
            {allReleases.length > 0 ? allReleases.map((p: any) => (
              <div key={`${p.type}_${p.id}`} className="w-36 flex-shrink-0 group cursor-pointer" onClick={() => setSelectedRelease(p)}>
                <OfficialArtworkImg
                  artist={state.artist?.name || 'Artist'}
                  title={p.title}
                  isAlbum={p.type !== 'single'}
                  isPlayer={true}
                  explicitSrc={p.cover}
                  className="w-36 h-36 object-cover rounded-md mb-3 shadow-md"
                />
                <h4 className="text-white font-bold text-sm truncate">{p.title}</h4>
                <p className="text-gray-400 text-xs mt-1 capitalize">{p.type.replace('_', ' ')} • {new Date(p.releaseDate || state.date).getFullYear()}</p>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-3 text-center w-full">No releases yet.</p>
            )}
          </div>

          <SpotifyAppearsOnSection
            isPlayer={true}
            artistName={state.artist?.name || 'Artist'}
            artistAvatar={state.artist?.image}
            state={state}
            onSelectPlaylist={pl => setSelectedPlaylist(pl)}
            onSelectRelease={rel => setSelectedRelease(rel)}
            onSelectCollaboratorArtist={(artName, isPl) => {
              if (!isPl) {
                openArtistProfileByName(artName);
              }
            }}
          />

          <div className="-mx-4 mt-6">
            <SpotifyArtistMerchShelf
              state={state}
              onOpenMerchStore={() => setState(p => ({ ...p, activeApp: 'merch' }))}
            />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 mt-8">About</h3>
          <div className="bg-[#282828] rounded-xl hover:bg-[#333] transition cursor-pointer relative overflow-hidden mb-8 h-80 group">
             <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${state.artist?.image})` }}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
             <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-black text-2xl">{formatNumFull(state.spotify.listeners)}</p>
                <p className="text-gray-300 text-sm font-medium uppercase tracking-widest mt-0.5">Monthly Listeners</p>
                <p className="text-gray-400 text-xs mt-3 leading-relaxed line-clamp-3">
                   Hailing from {state.artist?.country}, {state.artist?.name} is breaking records in the music industry. Known for their versatile sound and passionate fanbase.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReleaseDetail = () => {
    const isProject = selectedRelease.type !== 'single' && selectedRelease.type !== undefined;

    // Resolve live up-to-date project or song directly from game state so streams update in real-time
    let releaseSongs: Song[] = [];
    let totalStreams = 0;
    let liveReleaseTitle = selectedRelease.title;
    let liveReleaseCover = selectedRelease.cover;
    let liveReleaseType = selectedRelease.type?.replace('_', ' ') || 'Single';
    let liveReleaseDate = selectedRelease.releaseDate || state.date;

    if (isProject) {
      const liveProj = state.projects.find(p => p.id === selectedRelease.id) || selectedRelease;
      liveReleaseTitle = liveProj.title;
      liveReleaseCover = liveProj.cover;
      liveReleaseType = liveProj.type?.replace('_', ' ') || 'Album';
      liveReleaseDate = liveProj.releaseDate || state.date;

      // Map every project song to its live counterpart in state.songs so B-sides and singles display accurate live streams
      releaseSongs = (liveProj.songs || []).map((ps: Song) => {
        const liveSong = state.songs.find(s => s.id === ps.id);
        return liveSong || ps;
      });
      totalStreams = releaseSongs.reduce((sum: number, s: Song) => sum + (s.streams || 0), 0);
    } else {
      const liveSong = state.songs.find(s => s.id === selectedRelease.id) || selectedRelease;
      liveReleaseTitle = liveSong.title;
      liveReleaseCover = liveSong.cover;
      liveReleaseType = 'Single';
      liveReleaseDate = liveSong.releaseDate || state.date;
      releaseSongs = [liveSong];
      totalStreams = liveSong.streams || 0;
    }
    
    return (
      <div className="pb-24">
        <div className="relative pt-16 px-4 pb-6 bg-gradient-to-b from-gray-600 to-[#121212] z-0">
           <div className="flex flex-col items-center mt-4">
              <OfficialArtworkImg
                artist={state.artist?.name || 'Artist'}
                title={liveReleaseTitle}
                isAlbum={isProject}
                isPlayer={true}
                explicitSrc={liveReleaseCover}
                className="w-56 h-56 object-cover shadow-2xl mb-6 rounded-sm"
              />
              <h2 className="text-3xl font-black text-white text-center leading-tight">{liveReleaseTitle}</h2>
              <div className="flex items-center space-x-2 mt-3">
                 <OfficialArtworkImg
                   artist={state.artist?.name || 'Artist'}
                   isArtistPortrait={true}
                   isPlayer={true}
                   explicitSrc={state.artist?.image}
                   className="w-6 h-6 rounded-full object-cover"
                 />
                 <span className="text-white text-sm font-bold">{state.artist?.name}</span>
              </div>
              <p className="text-gray-400 text-sm capitalize font-medium mt-1">
                 {liveReleaseType} • {new Date(liveReleaseDate).getFullYear()} • <span className="text-white font-bold">{formatNum(totalStreams)} streams</span>
              </p>
           </div>
        </div>
        <div className="px-4 mb-6 relative z-10">
           <div className="flex justify-between items-center">
              <div className="flex space-x-5 items-center">
                 <i className="ph ph-heart text-3xl text-[#1DB954] hover:text-[#1ed760] transition cursor-pointer"></i>
                 <i className="ph ph-arrow-circle-down text-3xl text-gray-400 hover:text-white transition cursor-pointer"></i>
                 <button
                   onClick={() => setSnapshotItem(selectedRelease)}
                   className="flex items-center gap-1.5 bg-[#282828] hover:bg-[#3E3E3E] text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 transition cursor-pointer"
                 >
                   <i className="ph-fill ph-chart-polar text-[#1DB954] text-sm"></i>
                   <span>Daily Snapshot</span>
                 </button>
              </div>
              <button className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-lg hover:bg-[#1ed760] hover:scale-105 cursor-pointer">
                 <i className="ph-fill ph-play text-2xl translate-x-[2px]"></i>
              </button>
           </div>
        </div>
        <div className="px-4 relative z-10 space-y-1">
           {releaseSongs.map((s: any, i: number) => (
             <div key={s.id} className="flex items-center justify-between py-2.5 hover:bg-white/10 rounded-md transition group cursor-pointer px-3 -mx-3">
               <div className="flex items-center space-x-4 min-w-0 flex-1 pr-3">
                 <span className="text-gray-400 font-medium w-4 text-center text-sm shrink-0">{i + 1}</span>
                 <div className="flex flex-col min-w-0 flex-1">
                   <div className="flex items-center space-x-2 mb-0.5">
                     <h4 className="text-white font-medium text-base leading-tight truncate">{s.title}</h4>
                     {(() => {
                       const roleBadge = getTrackRoleBadgeMeta(s.trackType);
                       return (
                         <span
                           className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${roleBadge.className}`}
                         >
                           {roleBadge.label}
                         </span>
                       );
                     })()}
                     {s.collabId && s.collabId !== 'none' && s.collabRoyaltyPercent ? (
                       <span className="text-[8px] bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700/40 font-bold shrink-0">
                         {s.collabRoyaltyPercent}% Collab Split
                       </span>
                     ) : null}
                   </div>
                   <SpotifyTrackSubRow
                     songOrItem={s}
                     fallbackArtistName={state.artist?.name || 'Artist'}
                     state={state}
                     onSelectArtistName={(artName, isPl) => {
                       if (!isPl) {
                         setSelectedRelease(null);
                         const npcObj = getDetailedNPC(artName);
                         if (npcObj) setSelectedNpc(npcObj);
                       }
                     }}
                   />
                 </div>
               </div>
               <div className="text-gray-400 text-xs text-right flex items-center space-x-3 shrink-0">
                  <span className="text-gray-300 font-semibold">{formatNum(s.streams || 0)}</span>
                  <i className="ph ph-dots-three text-xl hover:text-white transition"></i>
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const renderPitchModal = () => {
      const pl = EXPANDED_SPOTIFY_PLAYLISTS.find(p => p.id === pitchModal) || SPOTIFY_PLAYLISTS.find(p => p.id === pitchModal);
      if (!pl) return null;
      const released = state.songs.filter(s => s.status === 'released');

      let requirementNote = "Curators evaluate Track Quality (65+), Artist Buzz, and Streaming Retention.";
      if (pl.id === 'tth') {
        requirementNote = "TTH Editorial Bar: Popularity 70+ • Quality 80+ • Proven 120k+ Daily Streams • Official Singles Only • Highly Selective (Pass rate ~25%).";
      } else if (pl.id === 'rc') {
        requirementNote = "RapCaviar Bar: Popularity 45+ • Quality 72+ • Hip-Hop, Rap & Trap Tracks Only.";
      } else if (pl.id === 'nmf') {
        requirementNote = "New Music Friday Bar: Released within 14 Days • Quality 68+ • Editorial Roundup.";
      } else if (pl.id === 'pr') {
        requirementNote = "Pop Rising Bar: Popularity 25+ • Quality 70+ • Pop & Dance Releases.";
      } else if (pl.id === 'v50') {
        requirementNote = "Viral 50 Bar: Requires Rapid Momentum Spike / High Hype • Quality 60+.";
      } else if (pl.id === 'chill_vibes') {
        requirementNote = "Chill Vibes Bar: Quality 60+ • Melodic, R&B, Acoustic & Low-Tempo Tracks.";
      } else if (pl.id === 'workout_energy') {
        requirementNote = "Workout Energy Bar: Quality 65+ or High Hype • Upbeat, Energetic Beats.";
      } else if (pl.id === 'late_night') {
        requirementNote = "Late Night Drive Bar: Quality 62+ • Atmospheric, Electronic & Melodic Vibe.";
      } else if (pl.id === 'feel_good' || pl.id === 'sad_hour') {
        requirementNote = "Mood Curators Bar: Quality 60+ • Expressive lyrical depth and audience resonance.";
      }
      
      return (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-end justify-center sm:items-center">
             <div className="bg-[#282828] w-full max-w-md h-[82vh] sm:h-[65vh] sm:rounded-xl rounded-t-xl overflow-y-auto hide-scrollbar flex flex-col animate-in slide-in-from-bottom-10">
                 <div className="sticky top-0 bg-[#282828] p-4 flex items-center justify-between border-b border-white/10 shadow-sm z-10">
                    <div>
                      <h3 className="text-white font-bold text-lg">Pitch to {pl.name}</h3>
                      <p className="text-gray-400 text-xs">{pl.desc}</p>
                    </div>
                    <button onClick={() => setPitchModal(null)} className="text-gray-400 hover:text-white transition cursor-pointer">
                       <i className="ph ph-x text-2xl"></i>
                    </button>
                 </div>
                 <div className="p-4 flex-1">
                     <div className="bg-black/30 p-3 rounded-lg border border-white/10 mb-4 text-xs">
                        <div className="flex items-center text-[#1DB954] font-bold mb-1">
                          <i className="ph ph-shield-check mr-1 text-sm"></i> Curated Editorial Standards
                        </div>
                        <p className="text-gray-300 leading-relaxed">{requirementNote}</p>
                     </div>
                     
                     <div className="space-y-2.5">
                        {released.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No released songs available to pitch.</p>
                        ) : released.map(s => {
                            const isIncluded = s.playlistPlacements?.includes(pl.id);
                            const isBSide = s.trackType === 'b_side';
                            return (
                            <div key={s.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition">
                                <div className="flex items-center flex-1 mr-3">
                                    <OfficialArtworkImg
                                      artist={state.artist?.name || 'Artist'}
                                      title={s.title}
                                      isAlbum={false}
                                      isPlayer={true}
                                      explicitSrc={s.cover}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                    <div className="ml-3 flex-1 min-w-0">
                                        <div className="flex items-center space-x-1.5">
                                          <p className="text-white font-bold text-sm truncate">{s.title}</p>
                                          {isBSide ? (
                                            <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50 uppercase font-semibold">B-Side</span>
                                          ) : (
                                            <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50 uppercase font-semibold">Single</span>
                                          )}
                                        </div>
                                        <div className="flex text-gray-400 text-xs space-x-2 mt-0.5">
                                          <span>{formatNumFull(s.streams)} st.</span>
                                          <span>•</span>
                                          <span>Q: <strong className="text-white">{s.quality || 50}</strong></span>
                                          <span>•</span>
                                          <span>{s.genre}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {isIncluded ? (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[#1DB954] text-xs font-bold bg-[#1DB954]/10 px-2.5 py-1.5 rounded-full flex items-center">
                                        <i className="ph ph-check mr-1"></i> Placed
                                      </span>
                                      <button 
                                         onClick={() => handleExitPlaylist(s.id, pl.id)}
                                         className="text-xs font-bold px-2.5 py-1.5 rounded-full transition bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 cursor-pointer"
                                         title="Remove song from this playlist"
                                      >
                                         Remove
                                      </button>
                                    </div>
                                ) : (
                                    <button 
                                       onClick={() => handlePitch(s.id, pl.id)}
                                       className="text-xs font-bold px-4 py-1.5 rounded-full transition bg-white text-black hover:bg-[#1DB954] hover:text-white hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
                                    >
                                        Pitch
                                    </button>
                                )}
                            </div>
                        )})}
                     </div>
                 </div>
             </div>
          </div>
      );
  };

  const renderEditorialDecisionModal = () => {
    if (!editorialResult) return null;
    const isAccepted = editorialResult.accepted;

    return (
      <div className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-3xl shadow-lg ${isAccepted ? 'bg-[#1DB954]/20 text-[#1DB954] border-2 border-[#1DB954]' : 'bg-red-500/20 text-red-400 border-2 border-red-500/50'}`}>
            <i className={`ph-fill ${isAccepted ? 'ph-check-circle' : 'ph-x-circle'}`}></i>
          </div>

          <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 bg-white/5 px-2 py-0.5 rounded">
            Spotify for Artists • Editorial Review
          </span>

          <h3 className="text-xl font-black text-white mt-2 mb-1">
            {editorialResult.headline}
          </h3>

          <div className="text-xs font-semibold text-gray-400 mb-4">
            Playlist: <span className="text-white">{editorialResult.playlistName}</span>
            {editorialResult.addedPosition ? (
              <span className="ml-2 text-[#1DB954] font-black">Position #{editorialResult.addedPosition}</span>
            ) : null}
          </div>

          <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed text-left mb-6">
            {editorialResult.editorialFeedback}
          </div>

          <button
            onClick={() => setEditorialResult(null)}
            className={`w-full py-2.5 rounded-full font-bold text-sm transition cursor-pointer active:scale-95 ${isAccepted ? 'bg-[#1DB954] text-black hover:brightness-110' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isAccepted ? 'Awesome!' : 'Understood'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#121212] z-50 overflow-y-auto animate-in fade-in hide-scrollbar">
      <div className="absolute top-4 left-4 z-40">
        <button onClick={() => {
            if (pitchModal) { setPitchModal(null); }
            else if (selectedNpc) { setSelectedNpc(null); }
            else if (selectedRelease) { setSelectedRelease(null); }
            else if (selectedPlaylist) { setSelectedPlaylist(null); }
            else { handleClose(); }
        }} className="bg-black/50 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/70 active:scale-95 transition cursor-pointer backdrop-blur-md">
          <i className="ph ph-caret-left text-xl"></i>
        </button>
      </div>

      {selectedRelease ? (
        renderReleaseDetail()
      ) : selectedPlaylist ? (
        renderPlaylistDetail()
      ) : (
        <>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'chart' && renderChart()}
          {activeTab === 'profile' && renderProfile()}
        </>
      )}

      {selectedNpc && (
        <SpotifyNpcArtistProfileView
          npc={selectedNpc}
          onClose={() => setSelectedNpc(null)}
          onSelectPlaylist={pl => {
            setSelectedNpc(null);
            setSelectedPlaylist(pl);
          }}
        />
      )}
      {activePlayerCountdown && (
        <SpotifyReleaseCountdownPage
          countdownRelease={activePlayerCountdown}
          currentDateStr={state.date}
          onBack={() => setSelectedCountdownProjectId(null)}
          onSelectTrack={trk => {
            if (trk.rawSong) {
              setSelectedCountdownProjectId(null);
              setSelectedRelease({ ...trk.rawSong, type: 'single' });
            }
          }}
          onEarlyReleaseTrack={handleEarlyReleaseFromCountdown}
        />
      )}
      {pitchModal && (
        <SpotifyPlaylistPitchModal
          playlistId={pitchModal}
          state={state}
          onClose={() => setPitchModal(null)}
          onPitchSong={handlePitch}
          onExitPlaylist={handleExitPlaylist}
        />
      )}
      {showPlaylistHub && (
        <SpotifyPlaylistAnalyticsHubModal
          state={state}
          onClose={() => setShowPlaylistHub(false)}
          onOpenPlaylist={(pl) => setSelectedPlaylist(pl)}
          onOpenPitchModal={(plId) => {
            setShowPlaylistHub(false);
            setPitchModal(plId);
          }}
          onExitPlaylist={handleExitPlaylist}
        />
      )}
      {editorialResult && renderEditorialDecisionModal()}
      {snapshotItem && (
        <ProjectStreamSnapshotModal
          item={snapshotItem}
          state={state}
          onClose={() => setSnapshotItem(null)}
        />
      )}

      {!selectedRelease && !selectedPlaylist && !pitchModal && (
        <div className="fixed bottom-0 w-full max-w-md mx-auto z-50 bg-gradient-to-t from-black via-black/95 to-[#121212]/90 backdrop-blur-md border-t border-white/10 flex justify-around items-center py-2.5 pb-5">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center transition cursor-pointer ${
              activeTab === 'home' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'
            }`}
          >
            <i className={`ph${activeTab === 'home' ? '-fill' : ''} ph-house text-2xl`}></i>
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex flex-col items-center transition cursor-pointer ${
              activeTab === 'chart' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'
            }`}
          >
            <i className={`ph${activeTab === 'chart' ? '-fill' : ''} ph-chart-bar text-2xl`}></i>
            <span className="text-[10px] mt-0.5 font-medium">Charts</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center transition cursor-pointer ${
              activeTab === 'profile' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'
            }`}
          >
            <i className={`ph${activeTab === 'profile' ? '-fill' : ''} ph-user-circle text-2xl`}></i>
            <span className="text-[10px] mt-0.5 font-medium">Your Artist</span>
          </button>
        </div>
      )}
    </div>
  );
}
