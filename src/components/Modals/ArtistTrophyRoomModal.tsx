import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { getArtistTrophyRoomSummary } from '../../data/awardsFormulaAndSimulationEngine';
import { getVanguardArtistTrophySummary } from '../../data/vanguardHonorsEngine';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { formatNumFull } from '../../constants';
import { VanguardMonolithEmblem } from '../Apps/VanguardHonorsApp';

interface ArtistTrophyRoomModalProps {
  initialArtistName?: string;
  initialShow?: 'all' | 'grammys' | 'vmas' | 'vanguard';
  onClose: () => void;
}

export default function ArtistTrophyRoomModal({
  initialArtistName,
  initialShow = 'all',
  onClose
}: ArtistTrophyRoomModalProps) {
  const { state } = useGameContext();
  const playerName = state.artist?.name || 'Artist';
  const [selectedArtist, setSelectedArtist] = useState<string>(initialArtistName || playerName);
  const [filterShow, setFilterShow] = useState<'all' | 'grammys' | 'vmas' | 'vanguard'>(initialShow);
  const [winsOnly, setWinsOnly] = useState<boolean>(false);

  const profile = useMemo(
    () => getArtistTrophyRoomSummary(state, selectedArtist),
    [state, selectedArtist]
  );

  const vanguardProfile = useMemo(
    () => getVanguardArtistTrophySummary(state, selectedArtist),
    [state, selectedArtist]
  );

  const combinedTrophies = useMemo(() => {
    const merged = [
      ...profile.trophies.map(t => ({
        ...t,
        show: t.show as 'grammys' | 'vmas' | 'vanguard'
      })),
      ...vanguardProfile.trophies
    ];
    merged.sort((a, b) => {
      if (a.isWin !== b.isWin) return a.isWin ? -1 : 1;
      if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
      return b.editionYear - a.editionYear;
    });
    return merged;
  }, [profile.trophies, vanguardProfile.trophies]);

  const filteredTrophies = useMemo(() => {
    return combinedTrophies.filter(t => {
      if (filterShow !== 'all' && t.show !== filterShow) return false;
      if (winsOnly && !t.isWin) return false;
      return true;
    });
  }, [combinedTrophies, filterShow, winsOnly]);

  const artistOptions = useMemo(() => {
    const topNpcs = REAL_WORLD_NPCS.slice(0, 30).map(n => n.name);
    return [playerName, ...topNpcs.filter(n => n.toLowerCase() !== playerName.toLowerCase())];
  }, [playerName]);

  const releasedSinglesCount = profile.isPlayer
    ? (state.songs || []).filter(s => s.status === 'released' || s.isReleased).length
    : REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === selectedArtist.toLowerCase())?.songs?.length || 0;

  const releasedAlbumsCount = profile.isPlayer
    ? (state.projects || []).filter(p => p.status === 'released' || p.isReleased).length
    : REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === selectedArtist.toLowerCase())?.albums?.length || 0;

  const totalCareerWins = profile.totalWins + vanguardProfile.vanguardWins;
  const totalCareerNoms = profile.totalNominations + vanguardProfile.vanguardNominations;

  return (
    <div className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#0B0D14] text-white w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl border border-[#D4AF37]/30 flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
        {/* Top Bar */}
        <div className="px-5 pt-5 pb-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-gradient-to-r from-[#0E121C] via-[#141826] to-[#0E121C]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Official Artist Profile &amp; Accolades
            </p>
            <h2 className="text-lg font-black tracking-tight text-white">
              Artist Trophy Room
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white cursor-pointer"
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
              className="bg-[#141824] border border-[#D4AF37]/35 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
            >
              {artistOptions.map(name => (
                <option key={name} value={name} className="bg-neutral-900 text-white">
                  {name === playerName ? `${name} (You)` : name}
                </option>
              ))}
            </select>
          </div>

          {/* Artist Identity Card */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1B1914] via-[#111522] to-[#0A0E17] border border-[#D4AF37]/30 flex items-center gap-4">
            <OfficialArtworkImg
              artist={profile.artistName}
              explicitSrc={profile.avatar}
              isArtistPortrait={true}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
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
              <p className="text-xs font-bold text-[#F3E5AB] mt-1 tabular-nums">
                {totalCareerWins} Career Award Wins · {totalCareerNoms} Nominations
              </p>
            </div>
          </div>

          {/* Triple Award Pedestal Summary: Vanguard Monoliths, GRAMMYs & MTV VMAs */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Vanguard Music Honors Card */}
            <div className="rounded-2xl p-3 bg-gradient-to-br from-[#141A29] to-[#080B12] border border-[#D4AF37]/45 space-y-1.5 shadow-[0_6px_20px_rgba(212,175,55,0.12)]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                  Vanguard
                </span>
                <VanguardMonolithEmblem size="sm" glow={false} className="!w-5 !h-5" />
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-xl font-black text-[#FFF2B2]">
                  {vanguardProfile.vanguardWins}
                </span>
                <span className="text-[10px] text-neutral-400">
                  / {vanguardProfile.vanguardNominations} Noms
                </span>
              </div>
              <p className="text-[10px] text-[#D4AF37] font-semibold tabular-nums">
                Supreme: {vanguardProfile.vanguardSupremeWins}
              </p>
            </div>

            {/* GRAMMYs Card */}
            <div className="rounded-2xl p-3 bg-[#15130E] border border-[#D4AF37]/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  GRAMMYs
                </span>
                <i className="ph-fill ph-trophy text-[#D4AF37] text-sm"></i>
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-xl font-black text-white">{profile.grammyWins}</span>
                <span className="text-[10px] text-neutral-400">
                  / {profile.grammyNominations} Noms
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 tabular-nums">
                Big Four: {profile.grammyBigFourWins}
              </p>
            </div>

            {/* MTV VMAs Card */}
            <div className="rounded-2xl p-3 bg-[#140E1E] border border-[#FF1E8A]/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF1E8A]">
                  MTV VMAs
                </span>
                <i className="ph-fill ph-planet text-[#00F0FF] text-sm"></i>
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-xl font-black text-white">{profile.vmaWins}</span>
                <span className="text-[10px] text-neutral-400">
                  / {profile.vmaNominations} Noms
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 tabular-nums">
                Major: {profile.vmaMajorWins}
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'vanguard', label: 'Vanguard' },
                  { id: 'grammys', label: 'GRAMMYs' },
                  { id: 'vmas', label: 'VMAs' }
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterShow(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    filterShow === tab.id
                      ? tab.id === 'vanguard'
                        ? 'bg-gradient-to-r from-[#FFF2B2] to-[#D4AF37] text-black'
                        : 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setWinsOnly(v => !v)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                winsOnly
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#E5C158]'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
            >
              {winsOnly ? 'Wins Only' : 'Wins & Noms'}
            </button>
          </div>

          {/* Trophy & Nomination Ledger */}
          {filteredTrophies.length === 0 ? (
            <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center space-y-2">
              <i className="ph-fill ph-trophy text-3xl text-[#D4AF37]/60"></i>
              <p className="text-sm font-bold text-white">No Award Records Found</p>
              <p className="text-xs text-neutral-400">
                Release high-quality singles, albums, music videos, and world tours before May 10 (Vanguard Honors), August 1 (MTV VMAs), and November 15 (GRAMMYs) to earn official nominations and trophies.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
              {filteredTrophies.map(item => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-center justify-between gap-3 ${
                    item.isWin
                      ? item.show === 'vanguard'
                        ? 'bg-gradient-to-r from-[#D4AF37]/15 via-emerald-500/10 to-transparent'
                        : item.show === 'grammys'
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            item.show === 'vanguard'
                              ? 'text-emerald-300'
                              : item.show === 'grammys'
                              ? 'text-[#D4AF37]'
                              : 'text-[#00F0FF]'
                          }`}
                        >
                          {item.show === 'vanguard'
                            ? 'Vanguard Honors'
                            : item.show === 'grammys'
                            ? 'GRAMMYs'
                            : 'MTV VMAs'}{' '}
                          · {item.editionYear}
                        </span>
                        <span className="text-[10px] text-neutral-500">·</span>
                        <span
                          className={`text-[10px] font-black ${
                            item.isWin
                              ? 'text-[#FFF2B2]'
                              : item.isCeremonyCompleted
                              ? 'text-neutral-400'
                              : 'text-[#D4AF37]'
                          }`}
                        >
                          {item.isWin
                            ? 'WINNER'
                            : item.isCeremonyCompleted
                            ? 'NOMINEE'
                            : 'SEALED NOMINEE'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white truncate">
                        {item.categoryName}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        Work: &ldquo;{item.workTitle}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end">
                    {item.isWin ? (
                      item.show === 'vanguard' ? (
                        <VanguardMonolithEmblem size="sm" glow={false} className="!w-6 !h-6" />
                      ) : (
                        <i
                          className={`ph-fill ${
                            item.show === 'grammys'
                              ? 'ph-trophy text-[#D4AF37]'
                              : 'ph-planet text-[#FF1E8A]'
                          } text-lg`}
                        ></i>
                      )
                    ) : (
                      <i className="ph-fill ph-medal text-neutral-600 text-lg"></i>
                    )}
                    <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                      {item.isWin
                        ? item.show === 'vanguard'
                          ? 'Monolith Won'
                          : 'Trophy Won'
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
