// Billboard Artist History Component
// Recreates the authentic Billboard.com Artist Chart History page (as in the screenshot):
// - Header with ALL CHARTS badge
// - High-contrast neon green chart title banner (e.g. BILLBOARD HOT 100™, UK OFFICIAL SINGLES™, etc.)
// - 3 Stat Boxes: NO. 1 HITS | SONGS/ALBUMS | TOP 10 HITS
// - Comprehensive dropdown supporting Hot 100, Global 200, Billboard 200, and ALL country regional charts
// - Table headers: DEBUT DATE, PEAK POS., PEAK DATE, WKS. ON CHART
// - Song entries with underlined dates, bold peak position, and weeks on chart

import React, { useState } from 'react';
import { ChartItem, GameState } from '../../types';
import { COUNTRY_NAMES } from '../../constants';
import {
  getPlayerBillboardRecords,
  getChartRegionLabels
} from '../../data/playerBillboardHistoryTracker';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

interface BillboardArtistHistoryProps {
  state: GameState;
  onSelectItem: (item: ChartItem, currPos: number, prevPos: number | null) => void;
  onSwitchToCurrentCharts?: () => void;
}

export const BillboardArtistHistory: React.FC<BillboardArtistHistoryProps> = ({
  state,
  onSelectItem,
  onSwitchToCurrentCharts
}) => {
  const [chartType, setChartType] = useState<string>('hot100');

  const { records, no1Hits, totalSongs, top10Hits } = getPlayerBillboardRecords(state, chartType);
  const labels = getChartRegionLabels(chartType);

  const majorRegions = ['GB', 'ID', 'JP', 'KR', 'CA', 'AU', 'BR', 'DE', 'FR', 'MX', 'PH', 'IN'];
  const otherRegions = Object.keys(COUNTRY_NAMES).filter(
    c => c !== 'US' && !majorRegions.includes(c)
  ).sort((a, b) => COUNTRY_NAMES[a].localeCompare(COUNTRY_NAMES[b]));

  return (
    <div className="bg-black min-h-screen pb-16 animate-in fade-in">
      {/* Top Black Header Section matching Billboard.com Mobile */}
      <div className="bg-black px-4 pt-3 pb-2 text-white">
        
        {/* ALL CHARTS button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onSwitchToCurrentCharts}
            className="border border-[#00f076] text-[#00f076] text-[10px] font-black uppercase px-2.5 py-1 tracking-wider rounded hover:bg-[#00f076]/10 active:scale-95 transition cursor-pointer"
          >
            ALL CHARTS
          </button>
        </div>

        {/* Big Neon Green Chart Banner */}
        <div className="w-full bg-[#00f076] text-black font-black text-center py-3.5 rounded-lg text-base sm:text-lg tracking-wider uppercase shadow-lg shadow-[#00f076]/10 mb-3 select-none">
          {labels.banner}
        </div>

        {/* 3 Stat Boxes */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          <div className="border border-zinc-800 bg-zinc-950/80 rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center text-center">
            <div className="text-3xl sm:text-4xl font-black text-white leading-none my-1">
              {no1Hits}
            </div>
            <div className="w-full h-px bg-zinc-800 my-1.5"></div>
            <div className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">
              NO. 1 HITS
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950/80 rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center text-center">
            <div className="text-3xl sm:text-4xl font-black text-white leading-none my-1">
              {totalSongs}
            </div>
            <div className="w-full h-px bg-zinc-800 my-1.5"></div>
            <div className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">
              {labels.category}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950/80 rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center text-center">
            <div className="text-3xl sm:text-4xl font-black text-white leading-none my-1">
              {top10Hits}
            </div>
            <div className="w-full h-px bg-zinc-800 my-1.5"></div>
            <div className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">
              TOP 10 HITS
            </div>
          </div>
        </div>

        {/* Multi-Region Dropdown Selector */}
        <div className="relative mb-3">
          <select
            value={chartType}
            onChange={e => setChartType(e.target.value)}
            className="w-full bg-black border border-[#00f076] text-[#00f076] font-bold text-xs sm:text-sm rounded px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-[#00f076] cursor-pointer"
          >
            <optgroup label="Primary Billboard Charts" className="bg-zinc-900 text-white font-bold">
              <option value="hot100">Billboard Hot 100™ (United States)</option>
              <option value="global200">Billboard Global 200™ (Worldwide)</option>
              <option value="albums200">Billboard 200™ (Albums)</option>
            </optgroup>

            <optgroup label="Major Regional Music Markets" className="bg-zinc-900 text-white font-bold">
              {majorRegions.map(cc => (
                <option key={cc} value={cc}>
                  {getChartRegionLabels(cc).dropdown}
                </option>
              ))}
            </optgroup>

            <optgroup label="Other Regional Markets" className="bg-zinc-900 text-white font-bold">
              {otherRegions.map(cc => (
                <option key={cc} value={cc}>
                  {getChartRegionLabels(cc).dropdown}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="absolute right-3 top-3 pointer-events-none text-[#00f076]">
            <i className="ph ph-caret-down text-base"></i>
          </div>
        </div>

        {/* Table Column Headers in Neon Green */}
        <div className="flex items-center justify-between text-[#00f076] text-[9px] sm:text-[10px] font-black uppercase tracking-wider pt-1 pb-1 px-1">
          <div className="flex-1 min-w-0"></div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-right">
            <span className="w-14 sm:w-16 text-center">DEBUT DATE</span>
            <span className="w-12 sm:w-16 text-center">PEAK POS.</span>
            <span className="w-14 sm:w-16 text-center">PEAK DATE</span>
            <span className="w-12 sm:w-14 text-center">WKS. ON CHART</span>
          </div>
        </div>
      </div>

      {/* White Song List Section */}
      <div className="bg-white">
        {records && records.length > 0 ? (
          records.map((record, idx) => (
            <div
              key={idx}
              onClick={() => {
                const item: ChartItem = {
                  title: record.title,
                  artist: record.artist,
                  points: record.points || 50000,
                  isPlayer: true,
                  cover: record.cover || null,
                  lastPosition: record.lastPosition || null,
                  weeksOnChart: record.weeksOnChart || 1,
                  stats: record.stats
                };
                onSelectItem(item, record.peakPosition, record.lastPosition || null);
              }}
              className="border-b border-gray-200 py-3.5 px-3 sm:px-4 bg-white hover:bg-gray-50 transition cursor-pointer group"
            >
              {/* Cover Art + Title & Artist Credit */}
              <div className="mb-2 flex items-center space-x-3">
                <div className="w-11 h-11 rounded bg-gray-200 overflow-hidden shrink-0 border border-gray-300 shadow-sm">
                  <OfficialArtworkImg
                    artist={record.artist}
                    title={record.title}
                    explicitSrc={record.cover}
                    isAlbum={chartType === 'albums200'}
                    isPlayer={true}
                    alt={record.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base sm:text-lg font-black text-black leading-tight tracking-tight group-hover:text-emerald-700 transition truncate">
                    {record.title}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-500 truncate">
                    {record.artist}
                  </div>
                </div>
              </div>

              {/* Stats Columns matching exact layout */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-4 text-right">
                <div className="w-14 sm:w-16 text-center">
                  <span className="underline font-bold text-xs sm:text-sm text-black">
                    {record.debutDate}
                  </span>
                </div>
                <div className="w-12 sm:w-16 text-center flex flex-col items-center justify-center">
                  <span className="font-black text-xl sm:text-2xl text-black leading-none">
                    {record.peakPosition}
                  </span>
                  {record.weeksAtPeak && record.weeksAtPeak > 1 && (
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded mt-0.5 leading-none whitespace-nowrap">
                      {record.weeksAtPeak} wks
                    </span>
                  )}
                </div>
                <div className="w-14 sm:w-16 text-center">
                  <span className="underline font-bold text-xs sm:text-sm text-black">
                    {record.peakDate}
                  </span>
                </div>
                <div className="w-12 sm:w-14 text-center">
                  <span className="font-black text-base sm:text-lg text-black leading-none">
                    {record.weeksOnChart}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <i className="ph ph-chart-line-up text-2xl"></i>
            </div>
            <h4 className="font-black text-base text-black mb-1">
              No {labels.dropdown} Entries Yet
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Release singles and albums, run promotional campaigns in this territory, and check back on Mondays as your records chart in this region!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
