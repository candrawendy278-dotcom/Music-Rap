// Billboard History Tab Component
// Allows players to view historical weekly chart snapshots from earlier dates in the game,
// switch between Global 200, Hot 100, Albums, and search any song's past chart history.

import React, { useState } from 'react';
import { ChartItem, WeeklyChartSnapshot } from '../../types';
import { formatNum, formatNumFull } from '../../constants';
import { searchSongsAcrossHistory, HistoricalSongMatch } from '../../data/billboardHistoryEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';

interface BillboardHistoryTabProps {
  history: WeeklyChartSnapshot[];
  onSelectItem: (item: ChartItem, currPos: number, prevPos: number | null) => void;
}

export const BillboardHistoryTab: React.FC<BillboardHistoryTabProps> = ({
  history,
  onSelectItem
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    history.length > 0 ? history[0].date : ''
  );
  const [historicalChartType, setHistoricalChartType] = useState<'global200' | 'hot100' | 'albums200'>('global200');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeSnapshot = history.find(h => h.date === selectedDate) || (history.length > 0 ? history[0] : null);

  const searchResults: HistoricalSongMatch[] = searchQuery.trim()
    ? searchSongsAcrossHistory(history, searchQuery)
    : [];

  const getActiveChartList = (): ChartItem[] => {
    if (!activeSnapshot) return [];
    if (historicalChartType === 'global200') return activeSnapshot.global200 || [];
    if (historicalChartType === 'hot100') return activeSnapshot.hot100 || [];
    if (historicalChartType === 'albums200') return activeSnapshot.albums200 || [];
    return [];
  };

  const chartList = getActiveChartList();

  return (
    <div className="bg-white min-h-[500px] pb-12">
      {/* Historical Week Selector Header */}
      <div className="bg-gray-100 p-3 sticky top-[125px] z-20 border-b border-gray-300 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs font-black uppercase tracking-wider text-gray-700">
            <i className="ph ph-clock-counter-clockwise text-base mr-1.5 text-black"></i>
            <span>Chart Archive:</span>
          </div>
          {history.length > 0 ? (
            <select
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setSearchQuery('');
              }}
              className="bg-white border border-gray-300 text-black font-bold text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
            >
              {history.map(snap => (
                <option key={snap.date} value={snap.date}>
                  {snap.label} ({snap.date})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-400 italic">No archives recorded yet</span>
          )}
        </div>

        {/* Sub-selector for chart category */}
        <div className="flex space-x-1 pt-1">
          <button
            onClick={() => { setHistoricalChartType('global200'); setSearchQuery(''); }}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer ${
              historicalChartType === 'global200' && !searchQuery
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Global 200
          </button>
          <button
            onClick={() => { setHistoricalChartType('hot100'); setSearchQuery(''); }}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer ${
              historicalChartType === 'hot100' && !searchQuery
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Hot 100
          </button>
          <button
            onClick={() => { setHistoricalChartType('albums200'); setSearchQuery(''); }}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer ${
              historicalChartType === 'albums200' && !searchQuery
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Billboard 200
          </button>
        </div>

        {/* Archive Search Bar */}
        <div className="relative pt-1">
          <i className="ph ph-magnifying-glass absolute left-2.5 top-3.5 text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search song or artist across all past weeks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-black placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-3 text-gray-400 hover:text-black"
            >
              <i className="ph ph-x-circle text-sm"></i>
            </button>
          )}
        </div>
      </div>

      {/* Snapshot metadata banner */}
      {activeSnapshot && !searchQuery && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-[11px]">
          <div className="flex items-center text-amber-900 font-bold">
            <i className="ph ph-seal-check text-amber-600 mr-1.5 text-sm"></i>
            <span>Official Billboard Snapshot: {activeSnapshot.label}</span>
          </div>
          <span className="text-[10px] bg-amber-200/60 text-amber-800 font-black px-2 py-0.5 rounded uppercase">
            Archived
          </span>
        </div>
      )}

      {/* SEARCH RESULTS VIEW */}
      {searchQuery.trim() ? (
        <div className="divide-y divide-gray-100">
          <div className="p-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Found {searchResults.length} historical record{searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
          </div>
          {searchResults.length > 0 ? (
            searchResults.map((match, mIdx) => {
              const displayArtist = match.isPlayer ? match.artist : normalizeRealArtistName(match.artist);
              const displayTitle = match.isPlayer ? match.title : normalizeRealTitle(match.title);
              return (
              <div key={mIdx} className="p-4 hover:bg-gray-50 transition border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0 border border-gray-300 shadow-sm flex items-center justify-center font-bold text-gray-400">
                      <OfficialArtworkImg
                        artist={displayArtist}
                        title={displayTitle}
                        explicitSrc={match.cover}
                        isPlayer={match.isPlayer}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-black text-sm text-black flex items-center">
                        <span>{displayTitle}</span>
                        {match.isPlayer && (
                          <span className="ml-1.5 text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.2 rounded uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-semibold">{displayArtist}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Peak</div>
                    <div className="text-lg font-black text-amber-600 leading-none">#{match.peakPosition}</div>
                    <div className="text-[10px] text-gray-400">{match.weeksCount} wks on archive</div>
                  </div>
                </div>

                {/* Appearance details list */}
                <div className="bg-gray-50 rounded-lg p-2 mt-2 space-y-1 border border-gray-200 text-xs">
                  <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Weekly Chart Appearances:</div>
                  {match.appearances.map((app, aIdx) => (
                    <div
                      key={aIdx}
                      onClick={() => onSelectItem(
                        {
                          title: displayTitle,
                          artist: displayArtist,
                          points: app.points,
                          isPlayer: match.isPlayer,
                          cover: match.cover || null,
                          lastPosition: null,
                          stats: app.stats
                        },
                        app.position,
                        null
                      )}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-white transition cursor-pointer border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-black">#{app.position}</span>
                        <span className="text-gray-600 text-[11px]">{app.weekLabel}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-bold">
                          {app.chartType === 'global200' ? 'Global 200' : (app.chartType === 'hot100' ? 'Hot 100' : 'Billboard 200')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-[11px] text-gray-600 font-semibold">
                        <span>{formatNum(app.points)} units</span>
                        <i className="ph ph-caret-right text-gray-400"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              <i className="ph ph-magnifying-glass text-3xl mb-2 text-gray-300"></i>
              <div>No songs matched "{searchQuery}" in earlier weekly snapshots.</div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD HISTORICAL WEEK LIST VIEW */
        <div className="space-y-0">
          {chartList && chartList.length > 0 ? (
            chartList.map((item, idx) => {
              const prevPos = item.lastPosition;
              const currPos = idx + 1;
              const displayArtist = item.isPlayer ? item.artist : normalizeRealArtistName(item.artist);
              const displayTitle = item.isPlayer ? item.title : normalizeRealTitle(item.title);
              let posIndicator = null;
              if (prevPos === null) {
                posIndicator = <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">New</span>;
              } else if (prevPos > currPos) {
                posIndicator = <span className="text-xs font-bold text-green-500 flex items-center"><i className="ph-fill ph-caret-up"></i> {prevPos - currPos}</span>;
              } else if (prevPos < currPos) {
                posIndicator = <span className="text-xs font-bold text-red-500 flex items-center"><i className="ph-fill ph-caret-down"></i> {currPos - prevPos}</span>;
              } else {
                posIndicator = <span className="text-xs font-bold text-gray-400">=</span>;
              }

              return (
                <div
                  key={idx}
                  onClick={() => onSelectItem({ ...item, artist: displayArtist, title: displayTitle }, currPos, prevPos)}
                  className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition group ${
                    item.isPlayer ? 'bg-amber-50 hover:bg-amber-100' : ''
                  }`}
                >
                  <div className="w-12 flex flex-col items-center justify-center">
                    <div className={`text-center font-black text-2xl leading-none ${idx === 0 ? 'text-amber-500' : 'text-black'}`}>
                      {idx + 1}
                    </div>
                    <div className="mt-1">{posIndicator}</div>
                  </div>

                  <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden mx-3 shrink-0 border border-gray-300 shadow-sm flex items-center justify-center font-bold text-gray-400">
                    <OfficialArtworkImg
                      artist={displayArtist}
                      title={displayTitle}
                      explicitSrc={item.cover}
                      isAlbum={historicalChartType === 'albums200'}
                      isPlayer={item.isPlayer}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-black text-sm text-black truncate tracking-tight flex items-center">
                      <span className="truncate">{displayTitle}</span>
                      {item.isPlayer && (
                        <span className="ml-1.5 text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate font-semibold">{displayArtist}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center space-x-2">
                      <span>Wks: {item.weeksOnChart || 1}</span>
                      <span>•</span>
                      <span>Peak: #{item.peakPosition || currPos}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-black text-black">
                      {formatNumFull(item.points)}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Weekly Units</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              <i className="ph ph-archive text-3xl mb-2 text-gray-300"></i>
              <div>No chart entries found in this historical snapshot.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
