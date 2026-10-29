import React, { useState } from 'react';
import { GameState, Song } from '../../types';
import { formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  RADIO_TERRITORY_DEFINITIONS,
  RADIO_DAYPART_DEFINITIONS,
  FLAGSHIP_STATION_NETWORKS,
  RadioTerritoryId,
  EnhancedRadioChartEntry,
  getEnsuredRadioEcosystemState,
  getTerritoryDefinition,
  executeTerritoryRadioServiceAction,
  executeRadioLiveAppearanceBooking
} from '../../data/globalRadioEcosystemEngine';

interface StationNetworksAndDaypartsPanelProps {
  state: GameState;
  selectedTerritory: RadioTerritoryId;
  onSelectTerritory: (t: RadioTerritoryId) => void;
  entries: EnhancedRadioChartEntry[];
  playerEntries: EnhancedRadioChartEntry[];
}

export function StationNetworksAndDaypartsPanel({
  state,
  selectedTerritory,
  onSelectTerritory,
  entries,
  playerEntries
}: StationNetworksAndDaypartsPanelProps) {
  const [selectedSongId, setSelectedSongId] = useState<string>(
    playerEntries[0]?.id || entries[0]?.id || ''
  );

  const activeEntry =
    entries.find(e => e.id === selectedSongId) ||
    playerEntries[0] ||
    entries[0] ||
    null;

  const filteredStations =
    selectedTerritory === 'ALL'
      ? FLAGSHIP_STATION_NETWORKS
      : FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === selectedTerritory);

  const territoryMeta = getTerritoryDefinition(selectedTerritory);

  return (
    <div className="space-y-4">
      {/* Territory Filter Bar */}
      <div className="bg-[#121824] border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
            Broadcast Territory Filter
          </span>
          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
            {filteredStations.length} Flagship Networks • {territoryMeta.panelStationsCount} Monitored Panel Stations
          </span>
        </div>
        <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-1">
          {RADIO_TERRITORY_DEFINITIONS.map(terr => {
            const active = selectedTerritory === terr.id;
            return (
              <button
                key={terr.id}
                onClick={() => onSelectTerritory(terr.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer border flex items-center space-x-1.5 ${
                  active
                    ? 'bg-sky-400 text-black border-sky-400 font-black'
                    : 'bg-[#171F2E] text-slate-300 border-white/8 hover:bg-[#1E293B]'
                }`}
              >
                <span>{terr.flag}</span>
                <span>{terr.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-HOUR 5-DAYPART ROTATION MATRIX */}
      <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
              24-Hour Broadcast Clock • 5-Daypart Matrix
            </span>
            <h3 className="text-sm font-black text-white mt-0.5">
              Daypart Spin Distribution & Audience Multipliers
            </h3>
          </div>

          {entries.length > 0 && (
            <select
              value={activeEntry?.id || ''}
              onChange={e => setSelectedSongId(e.target.value)}
              className="bg-[#0B0F17] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-400 max-w-[210px] truncate"
            >
              {playerEntries.length > 0 && (
                <optgroup label="Your Charted Singles">
                  {playerEntries.map(pe => (
                    <option key={pe.id} value={pe.id}>
                      #{pe.rank} {pe.title} (YOU)
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Top Panel Leaders">
                {entries.slice(0, 15).map(en => (
                  <option key={en.id} value={en.id}>
                    #{en.rank} {en.title} — {en.artist}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </div>

        {activeEntry ? (
          <>
            <div className="bg-[#0B0F17] border border-white/8 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <OfficialArtworkImg
                  artist={activeEntry.artist}
                  title={activeEntry.title}
                  explicitSrc={activeEntry.cover || undefined}
                  isPlayer={activeEntry.isPlayer}
                  className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-white truncate">
                      {activeEntry.title}
                    </span>
                    {activeEntry.isPlayer && (
                      <span className="bg-sky-400 text-black text-[9px] font-black px-1.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {activeEntry.artist} • #{activeEntry.rank} ({activeEntry.rotationTier})
                  </div>
                </div>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <div className="text-xs font-black text-sky-400">
                  {formatNumFull(activeEntry.weeklySpins)} spins/wk
                </div>
                <div className="text-[11px] font-bold text-white">
                  {activeEntry.audienceMillions.toFixed(2)}M Aud.
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {RADIO_DAYPART_DEFINITIONS.map(dp => {
                const alloc = activeEntry.dayparts.find(d => d.daypartId === dp.id);
                const sharePct = alloc?.sharePct || dp.baseSpinSharePct;
                const spins7d = alloc?.spins7d || 0;
                const audM = alloc?.audienceMillions || 0;
                const statusLabel = alloc?.statusLabel || 'ACTIVE ROTATION';

                let badgeColor = 'bg-slate-800 text-slate-300 border-white/10';
                if (statusLabel === 'PEAK DRIVE') {
                  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                } else if (statusLabel === 'TESTING') {
                  badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                }

                return (
                  <div
                    key={dp.id}
                    className="bg-[#0D131F] border border-white/8 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white">{dp.name}</span>
                          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                            {dp.timeWindow}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${badgeColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{dp.description}</p>
                      </div>

                      <div className="text-right tabular-nums shrink-0">
                        <div className="text-xs font-black text-white">
                          {formatNumFull(spins7d)} spins ({sharePct}%)
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          {audM.toFixed(2)}M Aud • {dp.audiencePerSpinMultiplier.toFixed(2)}x Reach
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(100, sharePct * 2.6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No active radio chart entries available.
          </div>
        )}
      </div>

      {/* REAL-WORLD FLAGSHIP STATION DIRECTORY */}
      <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
            Syndicated Broadcast Partners
          </span>
          <h3 className="text-sm font-black text-white mt-0.5">
            Flagship Station Networks ({territoryMeta.shortName})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {filteredStations.map(st => {
            const terr = getTerritoryDefinition(st.territoryId);
            return (
              <div
                key={st.id}
                className="bg-[#0D131F] border border-white/8 rounded-xl p-3 flex flex-col space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">{terr.flag}</span>
                      <h4 className="text-xs font-black text-white">{st.name}</h4>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded">
                        {st.callSignOrFreq}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {st.city} • {st.ownerGroup} • PD: <strong className="text-slate-200">{st.programDirector}</strong>
                    </div>
                  </div>

                  <div className="text-right tabular-nums shrink-0">
                    <div className="text-xs font-black text-emerald-400">
                      {st.weeklyCumeMillions.toFixed(2)}M
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">
                      Weekly Cume
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/6 text-[10px]">
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                    <span className="text-slate-500 uppercase font-bold block text-[9px]">
                      Morning Drive Flagship
                    </span>
                    <span className="text-slate-200 font-bold truncate block mt-0.5">
                      🎙️ {st.signatureShow}
                    </span>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                    <span className="text-slate-500 uppercase font-bold block text-[9px]">
                      Acoustic Session Stage
                    </span>
                    <span className="text-slate-200 font-bold truncate block mt-0.5">
                      🎸 {st.loungeSessionName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CalloutResearchLabPanelProps {
  state: GameState;
  selectedTerritory: RadioTerritoryId;
  onSelectTerritory: (t: RadioTerritoryId) => void;
  entries: EnhancedRadioChartEntry[];
  playerEntries: EnhancedRadioChartEntry[];
}

export function CalloutResearchLabPanel({
  selectedTerritory,
  onSelectTerritory,
  entries,
  playerEntries
}: CalloutResearchLabPanelProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'player'>('all');
  const territoryMeta = getTerritoryDefinition(selectedTerritory);

  const displayedList =
    filterMode === 'player' && playerEntries.length > 0
      ? playerEntries
      : entries.slice(0, 25);

  return (
    <div className="space-y-4">
      {/* Header & Territory Picker */}
      <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 block">
              Critical Mass Media • MScore Telemetry
            </span>
            <h3 className="text-base font-black text-white mt-0.5">
              Listener Callout & Burnout Research Lab
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Weekly listener auditorium hooks & telephone/online callout scores. Songs exceeding{' '}
              <strong className="text-rose-400">32% Burnout Rate</strong> are downgraded to Recurrent rotation by Program Directors.
            </p>
          </div>
        </div>

        <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-1">
          {RADIO_TERRITORY_DEFINITIONS.map(terr => {
            const active = selectedTerritory === terr.id;
            return (
              <button
                key={terr.id}
                onClick={() => onSelectTerritory(terr.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer border flex items-center space-x-1.5 ${
                  active
                    ? 'bg-fuchsia-400 text-black border-fuchsia-400 font-black'
                    : 'bg-[#171F2E] text-slate-300 border-white/8 hover:bg-[#1E293B]'
                }`}
              >
                <span>{terr.flag}</span>
                <span>{terr.shortName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <div className="text-[11px] text-slate-400">
            Auditorium Sample: <strong className="text-white">{territoryMeta.monitoringBody}</strong>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-black font-black'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              Top 25 Panel
            </button>
            <button
              onClick={() => setFilterMode('player')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                filterMode === 'player'
                  ? 'bg-sky-400 text-black font-black'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              Your Singles ({playerEntries.length})
            </button>
          </div>
        </div>
      </div>

      {/* Callout Cards */}
      <div className="space-y-2.5">
        {displayedList.map(item => {
          const c = item.callout;

          let verdictStyle = 'bg-slate-800 text-slate-300 border-slate-700';
          if (c.calloutVerdict === 'POWER CALLOUT') {
            verdictStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          } else if (c.calloutVerdict === 'STRONG TEST') {
            verdictStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
          } else if (c.calloutVerdict === 'HIGH BURNOUT') {
            verdictStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
          } else if (c.calloutVerdict === 'POLARIZING') {
            verdictStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          }

          return (
            <div
              key={item.id}
              className={`bg-[#121824] border rounded-xl p-3.5 space-y-3 ${
                item.isPlayer ? 'border-sky-400/40 bg-sky-500/[0.05]' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="text-xs font-black font-mono text-slate-400 w-6 tabular-nums">
                    #{item.rank}
                  </span>
                  <OfficialArtworkImg
                    artist={item.artist}
                    title={item.title}
                    explicitSrc={item.cover || undefined}
                    isPlayer={item.isPlayer}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-black text-white truncate">{item.title}</h4>
                      {item.isPlayer && (
                        <span className="bg-sky-400 text-black text-[8px] font-black px-1 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.artist} • {item.weeksOnChart}w on chart
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded border shrink-0 ${verdictStyle}`}
                >
                  {c.calloutVerdict}
                </span>
              </div>

              {/* 4 Key Callout Telemetry Metrics */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/8 tabular-nums text-center">
                <div className="bg-[#0B0F17] rounded-lg p-2 border border-white/5">
                  <div className="text-[9px] uppercase text-slate-400">Net Positive</div>
                  <div
                    className={`text-sm font-black mt-0.5 ${
                      c.netPositiveScore >= 35
                        ? 'text-emerald-400'
                        : c.netPositiveScore >= 20
                        ? 'text-sky-400'
                        : 'text-amber-400'
                    }`}
                  >
                    +{c.netPositiveScore}
                  </div>
                  <div className="text-[8px] text-slate-500">
                    Fav {c.favoritePct}% / Dis {c.dislikePct}%
                  </div>
                </div>

                <div className="bg-[#0B0F17] rounded-lg p-2 border border-white/5">
                  <div className="text-[9px] uppercase text-slate-400">Familiarity</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {c.familiarityPct}%
                  </div>
                  <div className="text-[8px] text-slate-500">Hook Recognition</div>
                </div>

                <div className="bg-[#0B0F17] rounded-lg p-2 border border-white/5">
                  <div className="text-[9px] uppercase text-slate-400">Burnout</div>
                  <div
                    className={`text-sm font-black mt-0.5 ${
                      c.burnoutRatePct >= 32
                        ? 'text-rose-400'
                        : c.burnoutRatePct >= 22
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {c.burnoutRatePct}%
                  </div>
                  <div className="text-[8px] text-slate-500">
                    {c.burnoutRatePct >= 32 ? 'Recurrent Risk' : 'Healthy <32%'}
                  </div>
                </div>

                <div className="bg-[#0B0F17] rounded-lg p-2 border border-white/5">
                  <div className="text-[9px] uppercase text-slate-400">MScore</div>
                  <div className="text-sm font-black text-fuchsia-400 mt-0.5">
                    {c.mScore}
                  </div>
                  <div className="text-[8px] text-slate-500">Retention Index</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RadioPromoAndPayolaDeskPanelProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  releasedPlayerSongs: Song[];
  defaultTerritory: RadioTerritoryId;
}

export function RadioPromoAndPayolaDeskPanel({
  state,
  setState,
  releasedPlayerSongs,
  defaultTerritory
}: RadioPromoAndPayolaDeskPanelProps) {
  const [selectedTerritory, setSelectedTerritory] = useState<Exclude<RadioTerritoryId, 'ALL'>>(
    defaultTerritory === 'ALL' ? 'US' : defaultTerritory
  );
  const [selectedSongId, setSelectedSongId] = useState<number>(
    releasedPlayerSongs[0]?.id || 0
  );
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'scandal';
    text: string;
  } | null>(null);

  const eco = getEnsuredRadioEcosystemState(state);
  const territory = getTerritoryDefinition(selectedTerritory);
  const watchdog = eco.watchdogs[selectedTerritory] || {
    territoryId: selectedTerritory,
    scrutinyPct: 0,
    activeInvestigation: null
  };

  const targetSong =
    releasedPlayerSongs.find(s => s.id === selectedSongId) || releasedPlayerSongs[0] || null;

  const campaignKey = targetSong ? `${targetSong.id}_${selectedTerritory}` : '';
  const activeCampaign = campaignKey ? eco.campaigns[campaignKey] : undefined;

  const handlePromoAction = (tier: 'standard_add' | 'indie_plugger' | 'covert_payola') => {
    if (!targetSong) return;
    const res = executeTerritoryRadioServiceAction(
      state,
      targetSong.id,
      selectedTerritory,
      tier
    );
    setState(res.updatedState);
    setFeedbackBanner({
      type: res.scandalTriggered ? 'scandal' : res.success ? 'success' : 'error',
      text: res.message
    });
  };

  const handleLiveBooking = (type: 'morning_interview' | 'live_lounge') => {
    if (!targetSong) return;
    const res = executeRadioLiveAppearanceBooking(
      state,
      targetSong.id,
      selectedTerritory,
      type
    );
    setState(res.updatedState);
    setFeedbackBanner({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
  };

  const actionableTerritories = RADIO_TERRITORY_DEFINITIONS.filter(
    t => t.id !== 'ALL'
  ) as Array<
    typeof RADIO_TERRITORY_DEFINITIONS[number] & { id: Exclude<RadioTerritoryId, 'ALL'> }
  >;

  return (
    <div className="space-y-4">
      {/* Top Territory Selector & Budget */}
      <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block">
              Global Radio Promotion & Payola Desk
            </span>
            <h3 className="text-base font-black text-white mt-0.5">
              Territory Servicing, Pluggers & Live Lounges
            </h3>
          </div>
          <div className="text-right tabular-nums">
            <div className="text-[10px] uppercase text-slate-400">Available Funds</div>
            <div className="text-sm font-black text-emerald-400">
              ${formatNumFull(state.money)}
            </div>
          </div>
        </div>

        {/* 8 Country Selector Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {actionableTerritories.map(t => {
            const active = selectedTerritory === t.id;
            const w = eco.watchdogs[t.id]?.scrutinyPct || 0;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTerritory(t.id);
                  setFeedbackBanner(null);
                }}
                className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                  active
                    ? 'bg-sky-500/20 border-sky-400 text-white'
                    : 'bg-[#0D131F] border-white/8 text-slate-300 hover:bg-[#162033]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t.flag}</span>
                  {w > 0 && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded ${
                        w >= 65
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {w}%
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-black truncate mt-1">{t.shortName}</div>
                <div className="text-[9px] text-slate-400 tabular-nums">
                  {t.panelStationsCount} stns
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* REGULATORY WATCHDOG & PAYOLA SCRUTINY MONITOR */}
      <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              Broadcast Regulatory Compliance
            </span>
            <h4 className="text-xs font-black text-white mt-0.5">
              {territory.flag} {territory.regulatoryWatchdog}
            </h4>
          </div>
          <span
            className={`text-xs font-black font-mono px-2 py-0.5 rounded border tabular-nums ${
              watchdog.scrutinyPct >= 65
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : watchdog.scrutinyPct >= 30
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            Scrutiny: {watchdog.scrutinyPct}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full transition-all ${
              watchdog.scrutinyPct >= 65
                ? 'bg-rose-500'
                : watchdog.scrutinyPct >= 30
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${watchdog.scrutinyPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>
            Billboard Weights: Hot 100 ({Math.round(territory.billboardHot100Weight * 100)}%) • Global 200 ({Math.round(territory.billboardGlobal200Weight * 100)}%)
          </span>
          <span>Discovery: +{territory.streamDiscoveryRatePerSpin} streams/spin</span>
        </div>

        {watchdog.activeInvestigation && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5 text-[11px] text-rose-200">
            <strong className="text-rose-400 block">
              ⚠️ Active Payola Enforcement Action ({watchdog.activeInvestigation.authority})
            </strong>
            Single "{watchdog.activeInvestigation.songTitle}" was flagged for undisclosed pay-for-play in {territory.shortName}.
          </div>
        )}
      </div>

      {feedbackBanner && (
        <div
          className={`rounded-xl p-3 text-xs font-bold border ${
            feedbackBanner.type === 'scandal'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
              : feedbackBanner.type === 'error'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {feedbackBanner.text}
        </div>
      )}

      {/* SINGLE SELECTOR & CAMPAIGN ACTIONS */}
      {releasedPlayerSongs.length === 0 ? (
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-8 text-center text-xs text-slate-400">
          Release a single first to launch international radio servicing and book Live Lounge appearances.
        </div>
      ) : (
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Select Active Single to Promote in {territory.shortName}
            </label>
            <select
              value={targetSong?.id || ''}
              onChange={e => {
                setSelectedSongId(Number(e.target.value));
                setFeedbackBanner(null);
              }}
              className="w-full bg-[#0B0F17] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-black text-white focus:outline-none focus:border-sky-400"
            >
              {releasedPlayerSongs.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.genre} • {formatNumFull(s.dailyRadioPlays || 0)} daily spins)
                </option>
              ))}
            </select>
          </div>

          {targetSong && (
            <div className="bg-[#0B0F17] border border-white/8 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <OfficialArtworkImg
                  artist={state.artist?.name || 'Artist'}
                  title={targetSong.title}
                  explicitSrc={targetSong.cover}
                  isPlayer={true}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{targetSong.title}</h4>
                  <div className="text-[11px] text-slate-400 tabular-nums">
                    Territory Bonus: +
                    {formatNumFull(activeCampaign?.bonusDailySpins || 0)} spins/day • Fam +
                    {activeCampaign?.familiarityBonus || 0}%
                  </div>
                </div>
              </div>
              {activeCampaign?.isBlacklisted && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                  Blacklisted
                </span>
              )}
            </div>
          )}

          {/* 3 RADIO SERVICING TIERS */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-sky-400">
              1. Station Servicing & Payola Campaigns ({territory.shortName})
            </div>

            {/* Tier 1: Standard Official Add Date */}
            <div className="bg-[#0D131F] border border-white/8 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-white">
                    Official Radio Impact Add Date
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    100% Legal • -4% Scrutiny
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Service press kit & clean radio edit to {territory.panelStationsCount} program directors ({territory.flagshipStations[0]?.name}).
                </p>
              </div>
              <button
                onClick={() => handlePromoAction('standard_add')}
                className="px-3 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-black text-xs shrink-0 cursor-pointer tabular-nums"
              >
                ${formatNumFull(territory.standardAddCost)}
              </button>
            </div>

            {/* Tier 2: Independent Plugger Retainer */}
            <div className="bg-[#0D131F] border border-white/8 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-white">
                    Independent Radio Plugger Team
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                    Afternoon & Evening Drive Push
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hire top regional indie pluggers to lobby music directors for Heavy Rotation & +15% Familiarity.
                </p>
              </div>
              <button
                onClick={() => handlePromoAction('indie_plugger')}
                className="px-3 py-2 rounded-xl bg-indigo-400 hover:bg-indigo-300 text-black font-black text-xs shrink-0 cursor-pointer tabular-nums"
              >
                ${formatNumFull(territory.indiePluggerCost)}
              </button>
            </div>

            {/* Tier 3: Covert Under-the-Table Payola */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-rose-200">
                    Covert "Indie Promo" Payola Push
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/25 text-rose-300 border border-rose-500/40">
                    +34% Watchdog Risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Funnel undisclosed payments to force immediate <strong className="text-white">Power Rotation & Morning Drive</strong> spins. High risk if Scrutiny ≥ 65%.
                </p>
              </div>
              <button
                onClick={() => handlePromoAction('covert_payola')}
                className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-black text-xs shrink-0 cursor-pointer tabular-nums"
              >
                ${formatNumFull(territory.covertPayolaCost)}
              </button>
            </div>
          </div>

          {/* LIVE INTERVIEWS & ACOUSTIC RADIO LOUNGES */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              2. Live On-Air Interviews & Acoustic Radio Lounges
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-[#0D131F] border border-white/8 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                    🎙️ Morning Drive Interview
                  </span>
                  <h5 className="text-xs font-black text-white mt-1.5">
                    {territory.flagshipStations[0]?.signatureShow}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Spikes Hook Familiarity (+14%), Morning Drive rotation (+8%), and daily spins on {territory.flagshipStations[0]?.name}.
                  </p>
                </div>
                <button
                  onClick={() => handleLiveBooking('morning_interview')}
                  className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer tabular-nums"
                >
                  Book Interview (${formatNumFull(territory.interviewCost)})
                </button>
              </div>

              <div className="bg-[#0D131F] border border-white/8 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                    🎸 Acoustic Live Lounge
                  </span>
                  <h5 className="text-xs font-black text-white mt-1.5">
                    {territory.flagshipStations[0]?.loungeSessionName}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Boosts Callout Net Positive (+12), lowers Burnout (-10%), and drives high organic streaming discovery.
                  </p>
                </div>
                <button
                  onClick={() => handleLiveBooking('live_lounge')}
                  className="w-full py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs cursor-pointer tabular-nums"
                >
                  Book Live Lounge (${formatNumFull(territory.loungeCost)})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECENT BROADCAST WIRE & PROMO LOGS */}
      {eco.logs.length > 0 && (
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Broadcast Promotion Wire & Compliance Log
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {eco.logs.slice(0, 12).map(log => (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border text-xs ${
                  log.type === 'scandal'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-[#0B0F17] border-white/6 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-white">{log.headline}</span>
                  <span className="text-[10px] font-mono text-slate-500">{log.date}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
