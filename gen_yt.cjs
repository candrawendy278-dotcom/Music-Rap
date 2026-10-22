const fs = require('fs');

const code = `import { useState } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull, COUNTRY_NAMES } from '../../constants';
import ActionModal from '../Modals/ActionModal';
import { Song } from '../../types';

export default function YouTubeApp() {
  const { state, setState } = useGameContext();
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Song | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'chart'>('home');
  const [chartRegion, setChartRegion] = useState<string>('global');

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));

  const videos = [...state.songs].filter(s => s.hasMV).sort((a,b) => b.views - a.views);

  const chartData = state.youtube.charts?.['daily_' + chartRegion] || state.youtube.charts?.['daily_global'] || [];

  if (selectedVideo) {
    return (
      <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0F0F0F] z-50 overflow-y-auto pb-10 animate-in fade-in hide-scrollbar relative">
        <div className="sticky top-0 z-20 bg-black">
          <div className="relative w-full aspect-video flex items-center justify-center group overflow-hidden bg-black">
            {/* Video Player */}
            <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-md" style={{ backgroundImage: \`url(\${selectedVideo.mvThumbnail || selectedVideo.cover})\` }}></div>
            <img src={selectedVideo.mvThumbnail || selectedVideo.cover} className="relative h-full object-contain z-10 w-full" />
            
            {/* Dark overlay for controls */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-between p-3 z-20">
               <div className="flex justify-between items-start">
                  <button onClick={() => setSelectedVideo(null)} className="text-white drop-shadow-md p-1 hover:bg-white/10 rounded-full transition cursor-pointer">
                    <i className="ph ph-caret-down text-2xl"></i>
                  </button>
                  <div className="flex space-x-3 pt-1">
                     <i className="ph ph-cast text-white text-xl drop-shadow-md cursor-pointer hover:opacity-80 transition"></i>
                     <i className="ph ph-closed-captioning text-white text-xl drop-shadow-md cursor-pointer hover:opacity-80 transition"></i>
                     <i className="ph ph-gear text-white text-xl drop-shadow-md cursor-pointer hover:opacity-80 transition"></i>
                  </div>
               </div>
               <div className="flex items-center justify-center absolute inset-0 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm pointer-events-auto cursor-pointer hover:bg-black/70 transition hover:scale-105 active:scale-95">
                     <i className="ph-fill ph-play text-3xl translate-x-[2px]"></i>
                  </div>
               </div>
               <div className="flex justify-between items-end mb-1">
                  <div className="flex items-center text-white text-xs font-medium drop-shadow-md">
                     0:00 / 4:05
                  </div>
                  <i className="ph ph-corners-out text-white text-xl drop-shadow-md cursor-pointer hover:opacity-80 transition"></i>
               </div>
            </div>
            
            {/* Progress Bar always visible at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
               <div className="absolute top-0 left-0 h-full bg-[#FF0000] w-1/3 relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FF0000] rounded-full opacity-0 group-hover:opacity-100 transition"></div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-3 pt-4">
           <h1 className="text-white font-bold text-lg leading-snug mb-1">
             {selectedVideo.title} (Official Music Video)
           </h1>
           <div className="flex space-x-2 mb-4 text-[#AAAAAA] text-sm">
             <span>{formatNumFull(selectedVideo.views)} views</span>
             <span>•</span>
             <span>2 days ago</span>
             <span className="text-white font-medium ml-1">#NewMusic</span>
           </div>

           {/* Action Buttons */}
           <div className="flex items-center space-x-3 mb-5 overflow-x-auto hide-scrollbar pb-1">
              <div className="flex items-center bg-[#272727] rounded-full px-4 py-2 flex-shrink-0 cursor-pointer hover:bg-[#3F3F3F] transition">
                 <i className="ph-fill ph-thumbs-up text-white mr-2 text-lg"></i>
                 <span className="text-white text-sm font-medium border-r border-white/20 pr-3 mr-3">{formatNum(selectedVideo.views * 0.05)}</span>
                 <i className="ph ph-thumbs-down text-white text-lg"></i>
              </div>
              <div className="flex items-center bg-[#272727] rounded-full px-4 py-2 flex-shrink-0 cursor-pointer hover:bg-[#3F3F3F] transition">
                 <i className="ph ph-share-network text-white mr-2 text-lg"></i>
                 <span className="text-white text-sm font-medium">Share</span>
              </div>
              <div className="flex items-center bg-[#272727] rounded-full px-4 py-2 flex-shrink-0 cursor-pointer hover:bg-[#3F3F3F] transition">
                 <i className="ph ph-download-simple text-white mr-2 text-lg"></i>
                 <span className="text-white text-sm font-medium">Download</span>
              </div>
              <div className="flex items-center bg-[#272727] rounded-full px-4 py-2 flex-shrink-0 cursor-pointer hover:bg-[#3F3F3F] transition">
                 <i className="ph ph-scissors text-white mr-2 text-lg"></i>
                 <span className="text-white text-sm font-medium">Clip</span>
              </div>
           </div>

           {/* Channel Info */}
           <div className="flex items-center justify-between py-1 mb-4">
              <div className="flex items-center cursor-pointer flex-1">
                 <img src={state.artist?.image} className="w-10 h-10 rounded-full object-cover mr-3 shadow-md" />
                 <div>
                    <h3 className="text-white font-bold text-base flex items-center">
                      {state.artist?.name} {selectedVideo.mvDistributor === 'vevo' && <span className="ml-1.5 text-[10px] bg-white text-black px-1 rounded-sm font-black tracking-tight">vevo</span>} 
                      {!selectedVideo.mvDistributor || selectedVideo.mvDistributor !== 'vevo' ? <i className="ph-fill ph-check-circle text-gray-400 text-sm ml-1.5"></i> : null}
                    </h3>
                    <p className="text-[#AAAAAA] text-xs mt-0.5">{formatNum(state.youtube.subs)} subscribers</p>
                 </div>
              </div>
           </div>
           
           {/* Comments Section */}
           <div className="bg-[#272727] rounded-xl p-3 cursor-pointer hover:bg-[#3F3F3F] transition mt-2">
              <div className="flex items-center space-x-2 mb-2">
                 <span className="text-white font-bold text-sm">Comments</span>
                 <span className="text-[#AAAAAA] text-xs">{(selectedVideo.views * 0.002).toFixed(0)}K</span>
              </div>
              <div className="flex items-center">
                 <div className="w-6 h-6 rounded-full bg-[#1e40af] flex items-center justify-center text-white text-xs font-bold mr-3 shrink-0">U</div>
                 <p className="text-white text-xs line-clamp-2">
                    <span className="font-semibold text-gray-400 mr-2">@User123</span>
                    This song is an absolute masterpiece! Can't stop replaying the video 🔥 The visuals perfectly match the vibe.
                 </p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <>
      <div className="bg-[#0F0F0F] border-b border-white/10 pb-4">
         <div className="h-32 bg-gray-800 bg-cover bg-center" style={{ backgroundImage: \`url(\${state.artist?.image})\`, filter: 'blur(10px) brightness(0.4)' }}></div>
         <div className="px-4 -mt-10 relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-4 border-[#0F0F0F] bg-gray-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: \`url(\${state.artist?.image})\` }}></div>
            <h2 className="text-2xl font-bold text-white mt-2 flex items-center">{state.artist?.name} <i className="ph-fill ph-check-circle text-gray-400 text-sm ml-1.5"></i></h2>
            <p className="text-[#AAAAAA] text-sm mt-1">{formatNum(state.youtube.subs)} subscribers • {videos.length} videos</p>
         </div>
      </div>
      
      <div className="px-4 mt-4 pb-20">
        <h3 className="text-lg font-bold text-white mb-4">Videos</h3>
        <div className="space-y-4">
          {videos.length > 0 ? videos.map(s => (
            <div key={s.id} className="flex flex-col mb-4 cursor-pointer group" onClick={() => setSelectedVideo(s)}>
              <div className="w-full aspect-video bg-gray-800 rounded-xl bg-cover bg-center relative flex-shrink-0 mb-3 overflow-hidden" style={{ backgroundImage: \`url(\${s.mvThumbnail || s.cover})\` }}>
                {s.mvDistributor === 'vevo' && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center border border-white/10">
                    <span className="text-white font-bold text-[10px] tracking-widest uppercase">vevo</span>
                  </div>
                )}
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-bold">4:05</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300"></div>
              </div>
              <div className="flex space-x-3">
                 <div className="w-10 h-10 rounded-full bg-gray-800 bg-cover bg-center flex-shrink-0 mt-0.5" style={{ backgroundImage: \`url(\${state.artist?.image})\` }}></div>
                 <div className="flex-1">
                   <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-blue-400 transition">{s.title} (Official Music Video)</h4>
                   <p className="text-[#AAAAAA] text-xs mt-1">{state.artist?.name} {s.mvDistributor === 'vevo' && 'VEVO'} • {formatNum(s.views)} views • Just now</p>
                 </div>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-500 py-6 text-center">No videos available.</p>
          )}
        </div>
      </div>
    </>
  );

  const renderChart = () => {
     const countries = Object.entries(COUNTRY_NAMES).sort((a,b) => a[1].localeCompare(b[1]));
     return (
        <div className="pb-24 min-h-screen">
          <div className="px-4 py-4 mb-2">
             <h1 className="text-2xl font-bold text-white tracking-tight mb-4">Trending Music</h1>
             <select 
                value={chartRegion} 
                onChange={e => setChartRegion(e.target.value)}
                className="bg-[#272727] text-white border border-white/10 font-bold text-sm rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none w-full shadow-sm"
             >
                <option value="global">Global Daily Views</option>
                <optgroup label="Daily Views by Country">
                   {countries.map(c => (
                      <option key={c[0]} value={c[0]}>{c[1]}</option>
                   ))}
                </optgroup>
             </select>
          </div>

          <div className="px-4 space-y-4">
            {chartData.length > 0 ? chartData.map((item: any, idx: number) => {
               const currPos = idx + 1;
               const prevPos = item.lastPosition;
               
               let moveIndicator = null;
               if (prevPos === null) {
                   moveIndicator = <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter block mt-0.5">NEW</span>;
               } else if (prevPos > currPos) {
                   moveIndicator = <span className="text-[10px] font-bold text-[#10B981] flex items-center mt-0.5"><i className="ph-fill ph-caret-up mr-0.5"></i> {prevPos - currPos}</span>;
               } else if (prevPos < currPos) {
                   moveIndicator = <span className="text-[10px] font-bold text-[#FF0000] flex items-center mt-0.5"><i className="ph-fill ph-caret-down mr-0.5"></i> {currPos - prevPos}</span>;
               } else {
                   moveIndicator = <span className="text-[10px] font-bold text-gray-500 flex items-center mt-0.5">=</span>;
               }

               return (
               <div key={idx} className="flex items-center p-2 -mx-2 rounded-xl hover:bg-white/5 transition group">
                  <div className="w-8 flex flex-col items-center justify-center shrink-0">
                     <span className={\`font-bold text-base \${idx < 3 ? 'text-white' : 'text-[#AAAAAA]'}\`}>{currPos}</span>
                     {moveIndicator}
                  </div>
                  <div className="w-24 h-14 bg-[#272727] rounded-lg ml-2 shrink-0 bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: \`url(\${item.cover || 'https://placehold.co/320x180/1a1a1a/FFF?text=YT'})\` }}>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-bold">3:45</span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0 pr-2">
                     <h4 className={\`font-medium text-sm leading-tight line-clamp-2 mb-0.5 \${item.isPlayer ? 'text-white font-bold' : 'text-white'}\`}>{item.title}</h4>
                     <p className="text-[#AAAAAA] text-xs truncate">{item.artist} • {formatNumFull(item.points)} views</p>
                  </div>
               </div>
            )}) : (
               <p className="text-center text-[#AAAAAA] text-sm py-10">Chart is calculating... Check back tomorrow.</p>
            )}
          </div>
        </div>
     );
  };

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0F0F0F] z-50 overflow-y-auto animate-in fade-in hide-scrollbar relative">
      <div className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur p-4 flex items-center justify-between z-10 border-b border-white/10">
        <div className="flex items-center">
          <button onClick={handleClose} className="text-white p-2 mr-1 rounded-full hover:bg-white/10 active:scale-95 transition cursor-pointer">
            <i className="ph ph-arrow-left text-2xl"></i>
          </button>
          <i className="ph-fill ph-youtube-logo text-[#FF0000] text-3xl mr-1"></i>
          <span className="text-white font-bold tracking-tight text-xl">YouTube</span>
        </div>
        <div className="flex space-x-3 text-white items-center">
           <i className="ph ph-magnifying-glass text-xl"></i>
           <button onClick={() => setModalType('create_mv')} className="bg-white/10 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition cursor-pointer">
             <i className="ph ph-plus text-xl text-white"></i>
           </button>
        </div>
      </div>
      
      {activeTab === 'home' && renderHome()}
      {activeTab === 'chart' && renderChart()}
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full max-w-md mx-auto bg-[#0F0F0F]/95 backdrop-blur-md flex justify-around items-center p-3 pb-6 z-50 border-t border-white/10">
          <button onClick={() => setActiveTab('home')} className={\`flex flex-col items-center transition cursor-pointer \${activeTab === 'home' ? 'text-white' : 'text-[#AAAAAA] hover:text-white'}\`}>
              <i className={\`ph\${activeTab === 'home' ? '-fill' : ''} ph-house text-2xl\`}></i>
              <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>
          <button onClick={() => setActiveTab('chart')} className={\`flex flex-col items-center transition cursor-pointer \${activeTab === 'chart' ? 'text-white' : 'text-[#AAAAAA] hover:text-white'}\`}>
              <i className={\`ph\${activeTab === 'chart' ? '-fill' : ''} ph-fire text-2xl\`}></i>
              <span className="text-[10px] mt-1 font-medium">Trending</span>
          </button>
      </div>

      {modalType && <ActionModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  );
}
`;

fs.writeFileSync('src/components/Apps/YouTubeApp.tsx', code);
