import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { getArtistTrophyRoomSummary } from '../../data/awardsFormulaAndSimulationEngine';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { formatNumFull } from '../../constants';

interface ArtistTrophyRoomModalProps {
  initialArtistName?: string;
  onClose: () => void;
}

export default function ArtistTrophyRoomModal({
  initialArtistName,
  onClose
}: ArtistTrophyRoomModalProps) {
  const { state } = useGameContext();
  const playerName = state.artist?.name || 'Artist';
  const [selectedArtist, setSelectedArtist] = useState<string>(initialArtistName || playerName);
  const [filterShow, setFilterShow] = useState<'all' | 'grammys' | 'vmas'>('all');
  const [winsOnly, setWinsOnly] = useState<boolean>(false);

  const profile = useMemo(
    () => getArtistTrophyRoomSummary(state, selectedArtist),
    [state, selectedArtist]
  );

  const filteredTrophies = useMemo(() => {
    return profile.trophies.filter(t => {
      if (filterShow !== 'all' && t.show !== filterShow) return false;
      if (winsOnly && !t.isWin) return false;
      return true;
    });
  }, [profile.trophies, filterShow, winsOnly]);

  const artistOptions = useMemo(() => {
    const topNpcs = REAL_WORLD_NPCS.slice(0, 25).map(n => n.name);
    return [playerName, ...topNpcs.filter(n => n.toLowerCase() !== playerName.toLowerCase())];
  }, [playerName]);

  const releasedSinglesCount = profile.isPlayer
    ? (state.songs || []).filter(s => s.status === 'released').length
    : REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === selectedArtist.toLowerCase())?.songs?.length || 0;

  const releasedAlbumsCount = profile.isPlayer
    ? (state.projects || []).filter(p => p.status === 'released').length
    : REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === selectedArtist.toLowerCase())?.albums?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#0E0E12] text-white w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between bg-[#14141A]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
              Official Artist Profile & Accolades
            </p>
            <h2 className="text-lg font-black tracking-tight text-white">
              Artist Trophy Room
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
          >
            <i className="ph-bold ph-x text-base"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Artist Switcher (Player or Top Industry Peers) */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-neutral-400">Inspect Artist Profile:</span>
            <select
              value={selectedArtist}
              onChange={e => setSelectedArtist(e.target.value)}
              className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
            >
              {artistOptions.map(name => (
                <option key={name} value={name} className="bg-neutral-900 text-white">
                  {name === playerName ? `${name} (You)` : name}
                </option>
              ))}
            </select>
          </div>

          {/* Artist Identity Card */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1B1914] via-[#121217] to-[#170F24] border border-white/10 flex items-center gap-4">
            <OfficialArtworkImg
              artist={profile.artistName}
              explicitSrc={profile.avatar}
              isArtistPortrait={true}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white truncate">{profile.artistName}</h3>
                {profile.isPlayer && (
                  <span className="text-[10px] font-bold text-emerald-400">· YOUR ARTIST</span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {releasedSinglesCount} Singles · {releasedAlbumsCount} Projects
                {profile.isPlayer ? ` · ${formatNumFull(state.fans || 250)} Fans` : ''}
              </p>
              <p className="text-xs font-bold text-[#E5C158] mt-1 tabular-nums">
                {profile.totalWins} Career Award Wins · {profile.totalNominations} Nominations
              </p>
            </div>
          </div>

          {/* Dual Award Pedestal Summary: GRAMMYs vs MTV VMAs */}
          <div className="grid grid-cols-2 gap-3">
            {/* GRAMMYs Card */}
            <div className="rounded-2xl p-4 bg-[#15130E] border border-[#D4AF37]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  The GRAMMYs
                </span>
                <i className="ph-fill ph-trophy text-[#D4AF37] text-base"></i>
              </div>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl font-black text-white">{profile.grammyWins}</span>
                <span className="text-xs text-neutral-400">
                  Wins / {profile.grammyNominations} Noms
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 tabular-nums">
                General Field (Big 4): {profile.grammyBigFourWins} Wins
              </p>
            </div>

            {/* MTV VMAs Card */}
            <div className="rounded-2xl p-4 bg-[#140E1E] border border-[#FF1E8A]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF1E8A]">
                  MTV VMAs
                </span>
                <i className="ph-fill ph-planet text-[#00F0FF] text-base"></i>
              </div>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl font-black text-white">{profile.vmaWins}</span>
                <span className="text-xs text-neutral-400">
                  Wins / {profile.vmaNominations} Noms
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 tabular-nums">
                Major Moon Persons: {profile.vmaMajorWins} Wins
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              {(['all', 'grammys', 'vmas'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterShow(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterShow === tab
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'grammys' ? 'GRAMMYs' : 'MTV VMAs'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setWinsOnly(v => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                winsOnly
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#E5C158]'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
            >
              {winsOnly ? 'Showing Wins Only' : 'Wins & Nominations'}
            </button>
          </div>

          {/* Trophy & Nomination Ledger */}
          {filteredTrophies.length === 0 ? (
            <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center space-y-2">
              <i className="ph-fill ph-trophy text-3xl text-neutral-500"></i>
              <p className="text-sm font-bold text-white">No Award Records Yet</p>
              <p className="text-xs text-neutral-400">
                Release high-quality singles, albums, and official music videos before November 15 (GRAMMYs) and August 1 (MTV VMAs) to earn nominations and trophies.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
              {filteredTrophies.map(item => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-center justify-between gap-3 ${
                    item.isWin
                      ? item.show === 'grammys'
                        ? 'bg-[#D4AF37]/10'
                        : 'bg-[#FF1E8A]/10'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <OfficialArtworkImg
                      artist={profile.artistName}
                      title={item.workTitle === profile.artistName ? undefined : item.workTitle}
                      explicitSrc={item.coverArt}
                      isArtistPortrait={item.workTitle === profile.artistName}
                      className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            item.show === 'grammys' ? 'text-[#D4AF37]' : 'text-[#00F0FF]'
                          }`}
                        >
                          {item.show === 'grammys' ? 'GRAMMYs' : 'MTV VMAs'} · {item.editionYear}
                        </span>
                        <span className="text-[10px] text-neutral-500">·</span>
                        <span
                          className={`text-[10px] font-black ${
                            item.isWin ? 'text-emerald-400' : 'text-neutral-400'
                          }`}
                        >
                          {item.isWin ? 'WINNER' : 'NOMINEE'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white truncate">
                        {item.categoryName}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        Work: "{item.workTitle}"
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <i
                      className={`ph-fill ${
                        item.isWin
                          ? item.show === 'grammys'
                            ? 'ph-trophy text-[#D4AF37]'
                            : 'ph-planet text-[#FF1E8A]'
                          : 'ph-medal text-neutral-600'
                      } text-lg`}
                    ></i>
                    <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                      {item.isWin
                        ? 'Trophy Won'
                        : item.isCeremonyCompleted
                        ? 'Official Nominee'
                        : 'Ballot Sealed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
