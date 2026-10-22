import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { Song } from '../../types';
import { formatNum } from '../../constants';
import { 
  calculateSongTerritorialBreakdown, 
  evaluateSongHitScope, 
  CountryMetricResult, 
  RegionGroup,
  getCountryMarketProfile
} from '../../data/countryMarketSystem';

interface MarketDistributionViewProps {
  selectedSong?: Song | any;
  onSelectSong?: (songId: string) => void;
  catalogSongs?: any[];
}

export default function MarketDistributionView({ selectedSong }: MarketDistributionViewProps) {
  const { state } = useGameContext();
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [metricTab, setMetricTab] = useState<'all' | 'streams' | 'views' | 'sales'>('all');

  const artistCountry = state.artist?.country || 'US';
  const artistPop = state.popularity || 20;
  const artistHype = state.hype || 20;

  // Evaluate hit scope & trajectory
  const hitScopeInfo = useMemo(() => {
    if (!selectedSong) return null;
    return evaluateSongHitScope(selectedSong, artistCountry, artistPop, artistHype);
  }, [selectedSong, artistCountry, artistPop, artistHype]);

  // Compute realistic country-by-country breakdown
  const territorialData: CountryMetricResult[] = useMemo(() => {
    if (!selectedSong) return [];
    return calculateSongTerritorialBreakdown(selectedSong, artistCountry, artistPop, artistHype);
  }, [selectedSong, artistCountry, artistPop, artistHype]);

  // Calculate domestic vs international ratio
  const domesticVsInternational = useMemo(() => {
    if (!territorialData.length) return { domestic: 0, intl: 0 };
    const homeEntry = territorialData.find(d => d.code === artistCountry);
    const domesticStreams = homeEntry ? homeEntry.streams : 0;
    const totalStreams = territorialData.reduce((acc, d) => acc + d.streams, 0) || 1;
    const domPct = Math.round((domesticStreams / totalStreams) * 100);
    return {
      domestic: domPct,
      intl: Math.max(0, 100 - domPct)
    };
  }, [territorialData, artistCountry]);

  // Filter & sort by selected metric
  const filteredData = useMemo(() => {
    const base = regionFilter === 'all'
      ? [...territorialData]
      : territorialData.filter(d => d.regionGroup === regionFilter);

    if (metricTab === 'streams') return base.sort((a, b) => b.streams - a.streams);
    if (metricTab === 'views') return base.sort((a, b) => b.views - a.views);
    if (metricTab === 'sales') return base.sort((a, b) => b.pureSales - a.pureSales);
    return base;
  }, [territorialData, regionFilter, metricTab]);

  const regionGroups: RegionGroup[] = [
    'North America',
    'Latin America',
    'East Asia',
    'Southeast Asia',
    'Europe',
    'South Asia',
    'Africa',
    'Oceania'
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Hit Trajectory & Domestic vs Global Split */}
      {hitScopeInfo && (
        <div className="p-4 rounded-xl bg-[#12151E] border border-white/[0.08]">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {hitScopeInfo.label}
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Global Reach: {(hitScopeInfo.internationalReach * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {hitScopeInfo.description}
          </p>

          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
              <span className="text-amber-400">Domestic ({artistCountry}): {domesticVsInternational.domestic}%</span>
              <span className="text-sky-400">International: {domesticVsInternational.intl}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-amber-400" style={{ width: `${domesticVsInternational.domestic}%` }} />
              <div className="h-full bg-sky-500" style={{ width: `${domesticVsInternational.intl}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Continent Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        <button
          onClick={() => setRegionFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
            regionFilter === 'all'
              ? 'bg-[#222736] text-white border border-white/15'
              : 'bg-[#12151E] text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          All Regions ({territorialData.length})
        </button>
        {regionGroups.map(rg => (
          <button
            key={rg}
            onClick={() => setRegionFilter(rg)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              regionFilter === rg
                ? 'bg-[#222736] text-white border border-white/15'
                : 'bg-[#12151E] text-zinc-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            {rg}
          </button>
        ))}
      </div>

      {/* Metric Sort Selector */}
      <div className="grid grid-cols-4 bg-[#12151E] p-1 rounded-lg border border-white/[0.08]">
        <button
          onClick={() => setMetricTab('all')}
          className={`py-1.5 text-center text-[11px] font-semibold rounded-md transition cursor-pointer ${
            metricTab === 'all' ? 'bg-[#222736] text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Share %
        </button>
        <button
          onClick={() => setMetricTab('streams')}
          className={`py-1.5 text-center text-[11px] font-semibold rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
            metricTab === 'streams' ? 'bg-[#222736] text-[#1DB954]' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <i className="ph-fill ph-spotify-logo"></i>
          <span>Streams</span>
        </button>
        <button
          onClick={() => setMetricTab('views')}
          className={`py-1.5 text-center text-[11px] font-semibold rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
            metricTab === 'views' ? 'bg-[#222736] text-[#FF0000]' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <i className="ph-fill ph-youtube-logo"></i>
          <span>Views</span>
        </button>
        <button
          onClick={() => setMetricTab('sales')}
          className={`py-1.5 text-center text-[11px] font-semibold rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
            metricTab === 'sales' ? 'bg-[#222736] text-[#0a84ff]' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <i className="ph-fill ph-apple-logo"></i>
          <span>Sales</span>
        </button>
      </div>

      {/* Territorial Rankings Table */}
      <div className="bg-[#12151E] border border-white/[0.08] rounded-xl overflow-hidden divide-y divide-white/[0.05]">
        {filteredData.slice(0, 20).map((item, index) => {
          const profile = getCountryMarketProfile(item.code);

          return (
            <div
              key={item.code}
              className={`p-3.5 transition ${
                item.isHomeMarket ? 'bg-amber-500/[0.05]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono text-zinc-500 w-5 text-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xl leading-none shrink-0" role="img" aria-label={item.name}>
                    {item.flag}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-white truncate">
                        {item.name}
                      </span>
                      {item.isHomeMarket && (
                        <span className="text-[10px] font-semibold text-amber-400 shrink-0">
                          · Home Market
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                      <span>Tier {item.tier}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.regionGroup}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-zinc-500 truncate">
                        {profile.dominantGenres.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
                    {item.marketSharePercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 block">share</span>
                </div>
              </div>

              {/* Share Progress Bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${
                    item.isHomeMarket ? 'bg-amber-400' : 'bg-[#3b82f6]'
                  }`}
                  style={{ width: `${Math.min(100, item.marketSharePercent * 2.8)}%` }}
                />
              </div>

              {/* Platform Metrics Row */}
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-300">
                <div className="flex items-center gap-1">
                  <i className="ph-fill ph-spotify-logo text-[#1DB954]"></i>
                  <span>{formatNum(item.streams)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className="ph-fill ph-youtube-logo text-[#FF0000]"></i>
                  <span>{formatNum(item.views)}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <i className="ph-fill ph-apple-logo text-[#0a84ff]"></i>
                  <span>{formatNum(item.pureSales)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
