import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameContext } from '../../GameContext';
import { COUNTRY_NAMES, formatNumFull } from '../../constants';
import { ChartItem } from '../../types';
import {
  ensureBillboard200Albums,
  ensureBillboardSinglesChart
} from '../../data/billboardInitialData';
import { calculateRegionalBillboardBreakdown } from '../../data/billboardRegionalBreakdownEngine';
import { BillboardArtistHistory } from './BillboardArtistHistory';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';
import { ChartMovementBadge } from '../Common/ChartMovementBadge';
import { resolveChartItemMovement } from '../../data/chartMovementAndReEntryEngine';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';
import BillboardEntryBreakdownModal from './BillboardEntryBreakdownModal';
import RadioAirplayChartApp from './RadioAirplayChartApp';

export default function BillboardApp() {
  const { state, setState } = useGameContext();
  const [tab, setTab] = useState<'singles' | 'albums' | 'radio' | 'history'>('singles');
  const [region, setRegion] = useState<string>('global');
  const [selectedChartItem, setSelectedChartItem] = useState<{item: ChartItem, currPos: number, prevPos: number | null} | null>(null);

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));
  
  let data: ChartItem[];
  if (tab === 'albums') {
      data = ensureBillboard200Albums(state.billboard.albums200, null, state.date);
  } else {
      const liveData = region === 'global'
        ? (state.billboard.global200 || [])
        : (state.billboard.regionalSingles?.[region] || (region === 'US' ? state.billboard.hot100 : []));
      
      data = ensureBillboardSinglesChart(liveData, region, null, state.date);
  }

  const countries = Object.entries(COUNTRY_NAMES).sort((a,b) => a[1].localeCompare(b[1]));

  if (selectedChartItem) {
      return (
        <BillboardEntryBreakdownModal
          item={selectedChartItem.item}
          currPos={selectedChartItem.currPos}
          chartLength={data.length || 100}
          region={region}
          isAlbumChart={tab === 'albums'}
          state={state}
          onClose={() => setSelectedChartItem(null)}
        />
      );
  }

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-white z-50 overflow-y-auto pb-10 animate-in fade-in hide-scrollbar">
      <div className="sticky top-0 bg-white p-4 flex items-center justify-between z-20 border-b-4 border-black">
        <div className="flex items-center">
          <button onClick={handleClose} className="text-black p-2 rounded-full hover:bg-black/5 active:scale-95 transition cursor-pointer">
            <i className="ph ph-x text-2xl"></i>
          </button>
          <h1 className="text-4xl font-black font-serif italic tracking-tighter ml-2 text-black">billboard</h1>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-black text-white px-2.5 py-1 rounded">
          <i className="ph ph-calendar text-xs"></i>
          <span>Official Weekly</span>
        </div>
      </div>
      
      <div className="flex border-b border-gray-300 sticky top-[72px] bg-white z-20">
        <button 
           onClick={() => setTab('singles')} 
           className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-4 transition-colors cursor-pointer ${tab === 'singles' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
        >
          Singles
        </button>
        <button 
           onClick={() => setTab('albums')} 
           className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-4 transition-colors cursor-pointer ${tab === 'albums' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
        >
          Albums 200
        </button>
        <button 
           onClick={() => setTab('radio')} 
           className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-4 transition-colors cursor-pointer ${tab === 'radio' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
        >
          <span className="flex items-center justify-center space-x-1">
            <i className="ph-fill ph-broadcast text-sky-500 text-xs"></i>
            <span>Radio</span>
          </span>
        </button>
        <button 
           onClick={() => setTab('history')} 
           className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-4 transition-colors cursor-pointer ${tab === 'history' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
        >
          <span className="flex items-center justify-center space-x-1">
            <i className="ph ph-clock-counter-clockwise text-sm"></i>
            <span>History</span>
          </span>
        </button>
      </div>

      {tab === 'radio' ? (
        <RadioAirplayChartApp embedded={true} />
      ) : tab === 'history' ? (
        <BillboardArtistHistory
          state={state}
          onSelectItem={(item, currPos, prevPos) => setSelectedChartItem({ item, currPos, prevPos })}
          onSwitchToCurrentCharts={() => setTab('singles')}
        />
      ) : (
        <>
          {tab === 'singles' && (
            <div className="bg-gray-100 p-3 sticky top-[125px] z-20 border-b border-gray-300 flex items-center justify-between shadow-sm">
               <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Region:</span>
               <select 
                  value={region} 
                  onChange={e => setRegion(e.target.value)}
                  className="bg-white border border-gray-300 text-black font-bold text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
               >
                  <option value="global">Global 200</option>
                  <option value="US">US Hot 100</option>
                  <option value="GB">UK Official Singles</option>
                  <optgroup label="Other Regions">
                     {countries.filter(c => c[0] !== 'US' && c[0] !== 'GB').map(c => (
                        <option key={c[0]} value={c[0]}>{c[1]} Top 100</option>
                     ))}
                  </optgroup>
               </select>
            </div>
          )}

          <div className="bg-white min-h-screen">
            <div className="space-y-0">
              {data && data.length > 0 ? data.map((item, idx) => {
                const currPos = idx + 1;
                const move = resolveChartItemMovement(item, currPos, data.length || 100, state.date);
                const prevPos = move.lastPosition;
                const meta = tab === 'albums'
                  ? null
                  : resolveSongMetadataAndCollabCredits(item, item.artist, state);
                const displayArtist = meta
                  ? meta.formattedArtistCredits
                  : (item.isPlayer ? item.artist : normalizeRealArtistName(item.artist));
                const primaryArtworkArtist = meta ? meta.primaryArtist : displayArtist.split(',')[0].trim();
                const displayTitle = meta
                  ? meta.cleanTitle
                  : (item.isPlayer ? item.title : normalizeRealTitle(item.title));
                
                return (
                <motion.div 
                   layout
                   transition={{
                     type: 'spring',
                     stiffness: 300,
                     damping: 28,
                     mass: 0.8
                   }}
                   key={(item as any).id ? `chart-id-${(item as any).id}` : `chart-${idx}-${displayArtist}-${displayTitle}`} 
                   onClick={() => setSelectedChartItem({ item, currPos, prevPos })}
                   className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors group ${item.isPlayer ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
                >
                  <div className="w-14 flex flex-col items-center justify-center shrink-0">
                     <div className={`text-center font-black text-2xl leading-none ${idx === 0 ? 'text-amber-500' : 'text-black'}`}>{currPos}</div>
                     <div className="mt-1">
                       <ChartMovementBadge
                         item={item}
                         currentRank={currPos}
                         chartLimit={data.length || 100}
                         currentDate={state.date}
                         variant="billboard"
                       />
                     </div>
                  </div>
                  <OfficialArtworkImg
                     artist={primaryArtworkArtist}
                     title={displayTitle}
                     explicitSrc={item.cover}
                     isAlbum={tab === 'albums'}
                     isPlayer={item.isPlayer}
                     alt={displayTitle}
                     className="w-14 h-14 bg-gray-100 ml-2 object-cover shadow-sm flex-shrink-0 rounded-sm border border-gray-200"
                  />
                  <div className="ml-4 flex-1 min-w-0 pr-4">
                    <h4 className={`font-black uppercase tracking-tight text-lg leading-tight truncate ${item.isPlayer ? 'text-amber-600' : 'text-black'}`}>{displayTitle}</h4>
                    <p className="text-gray-600 text-sm font-semibold truncate">{displayArtist}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>LW: <strong className="text-gray-700">{prevPos ?? (move.status === 're-entry' ? 'RE' : 'NEW')}</strong></span>
                      <span>PK: <strong className="text-gray-700">{move.peakPosition}</strong></span>
                      <span>WKS: <strong className="text-gray-700">{move.weeksOnChart}</strong></span>
                    </div>
                  </div>
                  <i className="ph ph-caret-right text-gray-300 group-hover:text-black transition"></i>
                </motion.div>
              )}) : (
                <p className="p-6 text-center text-gray-500 font-bold uppercase text-sm tracking-widest mt-10">Chart data calculating<br/><span className="text-xs text-gray-400">(Wait for Monday)</span></p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
