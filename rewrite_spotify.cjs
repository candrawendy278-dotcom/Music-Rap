const fs = require('fs');

const code = `import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull, COUNTRY_NAMES, NPCS, COUNTRY_TIERS, SPOTIFY_PLAYLISTS } from '../../constants';
import { Project, Song, ChartItem } from '../../types';

export default function SpotifyApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'profile'>('home');
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [pitchModal, setPitchModal] = useState<string | null>(null);
  const [chartRegion, setChartRegion] = useState<string>('global');
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('daily');

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));

  const topSongs = useMemo(() => {
    return [...state.songs].filter(s => s.status === 'released').sort((a,b) => b.streams - a.streams).slice(0, 5);
  }, [state.songs]);

  const allReleases = useMemo(() => {
    const singles = state.songs.filter(s => s.status === 'released' && (!s.collabId || s.collabId === 'none')).map(s => ({ ...s, type: 'single' }));
    const projs = state.projects.filter(p => p.status === 'released');
    return [...singles, ...projs].sort((a,b) => new Date(b.releaseDate || state.date).getTime() - new Date(a.releaseDate || state.date).getTime());
  }, [state.songs, state.projects, state.date]);

  const chartData = useMemo(() => {
      if (!state.spotify.charts) return [];
      const key = \`\${chartType}_\${chartRegion === 'global' ? 'global' : chartRegion}\`;
      // Fallback to global if region not found, or generate temporary if empty (for old saves)
      return state.spotify.charts[key] || state.spotify.charts[\`\${chartType}_global\`] || [];
  }, [state.spotify.charts, chartRegion, chartType]);

  const handlePitch = (songId: number, playlistId: string) => {
      const pl = SPOTIFY_PLAYLISTS.find(p => p.id === playlistId);
      if (!pl) return;
      if (state.popularity < pl.reqPop) return;
      
      setState(prev => {
          const newSongs = prev.songs.map(s => {
              if (s.id === songId) {
                  return { ...s, playlistPlacements: [...(s.playlistPlacements || []), playlistId] };
              }
              return s;
          });
          return { ...prev, songs: newSongs };
      });
      setPitchModal(null);
  };

  const renderHome = () => (
      <div className="p-4 pt-16 pb-24">
        <h1 className="text-3xl font-black text-white tracking-tight mb-6">Good evening</h1>
        
        <h2 className="text-xl font-bold text-white mb-4">Spotify Curated Playlists</h2>
        <div className="grid grid-cols-2 gap-4">
           {SPOTIFY_PLAYLISTS.map(pl => {
               // Dynamic gradient based on playlist ID
               let bgGrad = 'from-gray-700 to-gray-900';
               if (pl.id === 'tth') bgGrad = 'from-blue-700 to-purple-900';
               if (pl.id === 'nmf') bgGrad = 'from-pink-600 to-orange-800';
               if (pl.id === 'rc') bgGrad = 'from-green-700 to-blue-900';
               if (pl.id === 'v50') bgGrad = 'from-cyan-600 to-blue-800';

               return (
               <div 
                   key={pl.id} 
                   className={\`p-4 rounded-lg bg-gradient-to-br \${bgGrad} hover:opacity-90 transition cursor-pointer group shadow-xl relative overflow-hidden h-40 flex flex-col justify-between\`}
                   onClick={() => setSelectedPlaylist(pl)}
               >
                  <div className="absolute top-0 right-0 p-3 opacity-20 transform rotate-12 scale-150">
                      <i className="ph-fill ph-spotify-logo text-6xl text-white"></i>
                  </div>
                  <div>
                      <h3 className="text-white font-black text-lg leading-tight tracking-tight shadow-sm z-10 relative">{pl.name}</h3>
                      <p className="text-white/80 text-[10px] mt-1 font-semibold line-clamp-2 z-10 relative">{pl.desc}</p>
                  </div>
                  <div className="z-10 relative">
                      <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">{formatNumFull(pl.followers)} Likes</p>
                  </div>
               </div>
           )})}
        </div>
      </div>
  );

  const renderPlaylistDetail = () => {
      const pl = selectedPlaylist;
      const tracks = state.spotify.playlists?.[pl.id] || [];
      
      let bgGrad = 'from-gray-600 to-[#121212]';
      if (pl.id === 'tth') bgGrad = 'from-blue-900 to-[#121212]';
      if (pl.id === 'nmf') bgGrad = 'from-pink-900 to-[#121212]';
      
      return (
          <div className="pb-24">
            <div className={\`relative pt-16 px-4 pb-6 bg-gradient-to-b \${bgGrad} z-0\`}>
               <div className="flex flex-col items-center mt-4 text-center">
                  <div className="w-56 h-56 shadow-2xl mb-6 rounded-md bg-cover bg-center" style={{ backgroundImage: \`url(\${pl.cover})\`}}></div>
                  <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{pl.name}</h2>
                  <p className="text-gray-300 text-sm mt-3 leading-relaxed px-4">
                      {pl.id === 'nmf' ? 'Fresh releases updated every Friday. Handpicked by Spotify editors based on quality and potential.' : 
                       pl.id === 'tth' ? 'The biggest songs in the world right now. Driven by viral trends, global data, and massive streaming growth.' : pl.desc}
                  </p>
                  <div className="flex items-center space-x-2 mt-4 text-xs font-bold text-gray-400">
                     <i className="ph-fill ph-spotify-logo text-[#1DB954] text-lg"></i>
                     <span>Spotify</span>
                     <span>•</span>
                     <span>{formatNumFull(pl.followers)} likes</span>
                  </div>
               </div>
            </div>
            
            <div className="px-4 mb-8 relative z-10 flex justify-between items-center">
               <button 
                  onClick={() => setPitchModal(pl.id)}
                  className="bg-white text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition shadow-lg"
               >
                  Pitch a Song
               </button>
               <button className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black active:scale-95 transition shadow-lg hover:bg-[#1ed760] hover:scale-105 cursor-pointer">
                  <i className="ph-fill ph-play text-2xl translate-x-[2px]"></i>
               </button>
            </div>
            
            <div className="px-4 relative z-10 space-y-2">
               {tracks.length > 0 ? tracks.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center p-2 rounded-md hover:bg-white/10 transition group cursor-pointer">
                     <div className="w-6 text-center text-gray-400 font-bold text-sm shrink-0">{idx + 1}</div>
                     <div className="w-12 h-12 bg-gray-800 rounded ml-3 shrink-0 bg-cover bg-center" style={{ backgroundImage: \`url(\${item.cover || 'https://placehold.co/100x100/181818/FFF?text=SP'})\` }}></div>
                     <div className="ml-3 flex-1 min-w-0 pr-2">
                        <h4 className={\`font-bold text-base truncate \${item.isPlayer ? 'text-[#1DB954]' : 'text-white'}\`}>{item.title}</h4>
                        <p className="text-gray-400 text-xs truncate">{item.artist}</p>
                     </div>
                     <div className="text-xs text-gray-400 text-right shrink-0">
                        {formatNumFull(item.points)}
                     </div>
                  </div>
               )) : (
                  <p className="text-center text-gray-500 text-sm py-10">Playlist is updating... Check back Monday.</p>
               )}
            </div>
          </div>
      );
  };

  const renderChart = () => {
     const countries = Object.entries(COUNTRY_NAMES).sort((a,b) => a[1].localeCompare(b[1]));
     return (
        <div className="pt-16 pb-24 min-h-screen">
          <div className="px-4 mb-4 flex items-center justify-between">
             <h1 className="text-3xl font-black text-white tracking-tighter">Charts</h1>
          </div>
          <div className="px-4 mb-6 flex flex-col space-y-3">
             <div className="flex bg-[#282828] rounded-full p-1 w-full max-w-[250px]">
                <button onClick={() => setChartType('daily')} className={\`flex-1 text-xs font-bold py-1.5 rounded-full transition \${chartType === 'daily' ? 'bg-[#1DB954] text-black' : 'text-white'}\`}>Daily</button>
                <button onClick={() => setChartType('weekly')} className={\`flex-1 text-xs font-bold py-1.5 rounded-full transition \${chartType === 'weekly' ? 'bg-[#1DB954] text-black' : 'text-white'}\`}>Weekly</button>
             </div>
             <select 
                value={chartRegion} 
                onChange={e => setChartRegion(e.target.value)}
                className="bg-[#282828] text-white border-none font-bold text-sm rounded-full px-4 py-2 focus:ring-0 focus:outline-none w-full max-w-[250px]"
             >
                <option value="global">Top 50 - Global</option>
                <option value="US">Top 50 - USA</option>
                <option value="GB">Top 50 - UK</option>
                <optgroup label="Other Regions">
                   {countries.filter(c => c[0] !== 'US' && c[0] !== 'GB').map(c => (
                      <option key={c[0]} value={c[0]}>Top 50 - {c[1]}</option>
                   ))}
                </optgroup>
             </select>
          </div>

          <div className="px-4 space-y-2">
            {chartData.length > 0 ? chartData.map((item, idx) => {
               const currPos = idx + 1;
               const prevPos = item.lastPosition;
               
               let moveIndicator = null;
               if (prevPos === null) {
                   moveIndicator = <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter block text-center mt-1">NEW</span>;
               } else if (prevPos > currPos) {
                   moveIndicator = <span className="text-[10px] font-bold text-green-500 flex items-center justify-center mt-0.5"><i className="ph-fill ph-caret-up"></i> {prevPos - currPos}</span>;
               } else if (prevPos < currPos) {
                   moveIndicator = <span className="text-[10px] font-bold text-red-500 flex items-center justify-center mt-0.5"><i className="ph-fill ph-caret-down"></i> {currPos - prevPos}</span>;
               } else {
                   moveIndicator = <span className="text-[10px] font-bold text-gray-500 flex items-center justify-center mt-0.5">=</span>;
               }

               return (
               <div key={idx} className="flex items-center p-2 rounded-md hover:bg-white/10 transition group">
                  <div className="w-8 flex flex-col items-center justify-center shrink-0">
                     <span className={\`font-bold text-sm \${idx === 0 ? 'text-[#1DB954]' : 'text-gray-400'}\`}>{currPos}</span>
                     {moveIndicator}
                  </div>
                  <div className="w-12 h-12 bg-gray-800 rounded ml-2 shrink-0 bg-cover bg-center" style={{ backgroundImage: \`url(\${item.cover || 'https://placehold.co/100x100/181818/FFF?text=SP'})\` }}></div>
                  <div className="ml-3 flex-1 min-w-0 pr-2">
                     <h4 className={\`font-bold text-base truncate \${item.isPlayer ? 'text-[#1DB954]' : 'text-white'}\`}>{item.title}</h4>
                     <p className="text-gray-400 text-xs truncate">{item.artist}</p>
                  </div>
                  <div className="text-xs text-gray-400 text-right shrink-0">
                     {formatNumFull(item.points)}
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
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: \`url(\${state.artist?.image})\` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
             <div className="flex items-center space-x-1.5 mb-2">
                <i className="ph-fill ph-check-circle text-blue-400 text-lg"></i>
                <span className="text-xs font-semibold text-white tracking-widest uppercase">Verified Artist</span>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{state.artist?.name}</h1>
             <p className="text-gray-300 font-medium text-sm">{formatNumFull(state.spotify.listeners)} monthly listeners</p>
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
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 font-medium w-4 text-center text-sm">{i + 1}</span>
                  <img src={s.cover} className="w-12 h-12 rounded object-cover bg-gray-800" />
                  <div>
                    <h4 className="text-white font-medium text-sm leading-tight">{s.title}</h4>
                    <div className="flex items-center mt-1">
                       {s.collabId !== 'none' && <span className="bg-gray-300 text-black text-[9px] px-1 rounded-sm uppercase font-bold mr-1.5">E</span>}
                       <p className="text-gray-400 text-xs">{formatNumFull(s.streams)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-4 text-center">No releases yet.</p>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Discography</h3>
          <div className="flex overflow-x-auto space-x-4 hide-scrollbar pb-4 -mx-4 px-4">
            {allReleases.length > 0 ? allReleases.map((p: any) => (
              <div key={\`\${p.type}_\${p.id}\`} className="w-36 flex-shrink-0 group cursor-pointer" onClick={() => setSelectedRelease(p)}>
                <img src={p.cover} className="w-36 h-36 object-cover rounded-md mb-3 shadow-md" />
                <h4 className="text-white font-bold text-sm truncate">{p.title}</h4>
                <p className="text-gray-400 text-xs mt-1 capitalize">{p.type.replace('_', ' ')} • {new Date(p.releaseDate || state.date).getFullYear()}</p>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-3 text-center w-full">No releases yet.</p>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 mt-8">About</h3>
          <div className="bg-[#282828] rounded-xl hover:bg-[#333] transition cursor-pointer relative overflow-hidden mb-8 h-80 group">
             <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: \`url(\${state.artist?.image})\` }}></div>
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
    let releaseSongs = [selectedRelease];
    let totalStreams = selectedRelease.streams;
    if (selectedRelease.type !== 'single' && selectedRelease.type !== undefined) {
        releaseSongs = selectedRelease.songs || [];
        totalStreams = releaseSongs.reduce((sum: number, s: any) => sum + s.streams, 0);
    }
    
    return (
      <div className="pb-24">
        <div className="relative pt-16 px-4 pb-6 bg-gradient-to-b from-gray-600 to-[#121212] z-0">
           <div className="flex flex-col items-center mt-4">
              <img src={selectedRelease.cover} className="w-56 h-56 object-cover shadow-2xl mb-6 rounded-sm" />
              <h2 className="text-3xl font-black text-white text-center leading-tight">{selectedRelease.title}</h2>
              <div className="flex items-center space-x-2 mt-3">
                 <img src={state.artist?.image} className="w-6 h-6 rounded-full object-cover" />
                 <span className="text-white text-sm font-bold">{state.artist?.name}</span>
              </div>
              <p className="text-gray-400 text-sm capitalize font-medium mt-1">
                 {selectedRelease.type?.replace('_', ' ') || 'Single'} • {new Date(selectedRelease.releaseDate || state.date).getFullYear()}
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
           {releaseSongs.map((s: any, i: number) => (
             <div key={s.id} className="flex items-center justify-between py-2.5 hover:bg-white/10 rounded-md transition group cursor-pointer px-3 -mx-3">
               <div className="flex items-center space-x-4">
                 <span className="text-gray-400 font-medium w-4 text-center text-sm">{i + 1}</span>
                 <div className="flex flex-col">
                   <h4 className="text-white font-medium text-base leading-tight mb-0.5">{s.title}</h4>
                   <div className="flex items-center text-gray-400 text-sm">
                      {s.collabId !== 'none' && s.collabId && <span className="bg-gray-300 text-black text-[9px] px-1 rounded-sm uppercase font-bold mr-1.5">E</span>}
                      <span className="hover:underline">{state.artist?.name}</span>
                   </div>
                 </div>
               </div>
               <div className="text-gray-400 text-xs text-right flex items-center space-x-4">
                  <span className="hidden group-hover:block transition">{formatNumFull(s.streams)}</span>
                  <i className="ph ph-dots-three text-xl hover:text-white transition"></i>
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const renderPitchModal = () => {
      const pl = SPOTIFY_PLAYLISTS.find(p => p.id === pitchModal);
      if (!pl) return null;
      const released = state.songs.filter(s => s.status === 'released');
      
      return (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-end justify-center sm:items-center">
             <div className="bg-[#282828] w-full max-w-md h-[80vh] sm:h-[60vh] sm:rounded-xl rounded-t-xl overflow-y-auto hide-scrollbar flex flex-col animate-in slide-in-from-bottom-10">
                 <div className="sticky top-0 bg-[#282828] p-4 flex items-center justify-between border-b border-white/10 shadow-sm">
                    <h3 className="text-white font-bold text-lg">Pitch to {pl.name}</h3>
                    <button onClick={() => setPitchModal(null)} className="text-gray-400 hover:text-white transition cursor-pointer">
                       <i className="ph ph-x text-2xl"></i>
                    </button>
                 </div>
                 <div className="p-4 flex-1">
                     <p className="text-sm text-gray-300 mb-4">Required Popularity: <span className={\`font-bold \${state.popularity >= pl.reqPop ? 'text-[#1DB954]' : 'text-red-500'}\`}>{pl.reqPop}</span></p>
                     
                     <div className="space-y-2">
                        {released.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No released songs available to pitch.</p>
                        ) : released.map(s => {
                            const isIncluded = s.playlistPlacements?.includes(pl.id);
                            const canPitch = state.popularity >= pl.reqPop && !isIncluded;
                            return (
                            <div key={s.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                                <div className="flex items-center">
                                    <img src={s.cover} className="w-12 h-12 rounded object-cover" />
                                    <div className="ml-3">
                                        <p className="text-white font-bold text-sm">{s.title}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{formatNumFull(s.streams)} streams</p>
                                    </div>
                                </div>
                                
                                {isIncluded ? (
                                    <span className="text-[#1DB954] text-xs font-bold bg-[#1DB954]/10 px-3 py-1.5 rounded-full"><i className="ph ph-check mr-1"></i> Included</span>
                                ) : (
                                    <button 
                                       onClick={() => handlePitch(s.id, pl.id)}
                                       disabled={!canPitch}
                                       className={\`text-xs font-bold px-4 py-1.5 rounded-full transition \${canPitch ? 'bg-white text-black hover:scale-105 cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed'}\`}
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

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#121212] z-50 overflow-y-auto animate-in fade-in hide-scrollbar">
      <div className="absolute top-4 left-4 z-40">
        <button onClick={() => {
            if (pitchModal) { setPitchModal(null); }
            else if (selectedRelease) { setSelectedRelease(null); }
            else if (selectedPlaylist) { setSelectedPlaylist(null); }
            else { handleClose(); }
        }} className="bg-black/50 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/70 active:scale-95 transition cursor-pointer backdrop-blur-md">
          <i className="ph ph-caret-left text-xl"></i>
        </button>
      </div>

      {selectedRelease ? renderReleaseDetail() : selectedPlaylist ? renderPlaylistDetail() : (
          <>
             {activeTab === 'home' && renderHome()}
             {activeTab === 'chart' && renderChart()}
             {activeTab === 'profile' && renderProfile()}
          </>
      )}

      {pitchModal && renderPitchModal()}

      {!selectedRelease && !selectedPlaylist && !pitchModal && (
          <div className="fixed bottom-0 w-full max-w-md mx-auto bg-[#121212]/95 backdrop-blur-md border-t border-white/10 flex justify-around items-center p-3 pb-6 z-50">
             <button onClick={() => setActiveTab('home')} className={\`flex flex-col items-center transition cursor-pointer \${activeTab === 'home' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}>
                 <i className={\`ph\${activeTab === 'home' ? '-fill' : ''} ph-house text-2xl\`}></i>
                 <span className="text-[10px] mt-1 font-medium">Home</span>
             </button>
             <button onClick={() => setActiveTab('chart')} className={\`flex flex-col items-center transition cursor-pointer \${activeTab === 'chart' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}>
                 <i className={\`ph\${activeTab === 'chart' ? '-fill' : ''} ph-chart-bar text-2xl\`}></i>
                 <span className="text-[10px] mt-1 font-medium">Charts</span>
             </button>
             <button onClick={() => setActiveTab('profile')} className={\`flex flex-col items-center transition cursor-pointer \${activeTab === 'profile' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}>
                 <i className={\`ph\${activeTab === 'profile' ? '-fill' : ''} ph-user text-2xl\`}></i>
                 <span className="text-[10px] mt-1 font-medium">Artist</span>
             </button>
          </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/Apps/SpotifyApp.tsx', code);
console.log("Written SpotifyApp.tsx");
