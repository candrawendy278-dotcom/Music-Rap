import React, { useState, useMemo } from 'react';
import { DETAILED_NPCS, DetailedNPC } from '../../data/npcAssets';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { useGameContext } from '../../GameContext';
import { isNpcMatchingPlayerName } from '../../data/npcPlayerDeduplicationEngine';

interface NpcArtistsShowcaseProps {
  onSelectNpc: (npc: DetailedNPC) => void;
}

const GENRE_FILTERS = ['All', 'Pop', 'Hip-Hop', 'R&B', 'K-Pop', 'J-Pop', 'Pop Indonesia', 'Latin', 'Rock', 'Country', 'Afrobeats'];

export const NpcArtistsShowcase: React.FC<NpcArtistsShowcaseProps> = ({ onSelectNpc }) => {
  const { state } = useGameContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const playerName = state?.artist?.name || '';

  const filteredNpcs = useMemo(() => {
    return DETAILED_NPCS.filter(npc => {
      if (isNpcMatchingPlayerName(npc.name, playerName)) return false;
      const matchesSearch =
        !searchQuery.trim() ||
        npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre =
        selectedGenre === 'All' ||
        npc.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre, playerName]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Global Artists Directory</h2>
          <p className="text-[11px] text-gray-400">
            {DETAILED_NPCS.length} Verified Real-World Artists • Official Discographies
          </p>
        </div>
        <span className="text-xs text-[#1DB954] font-bold bg-[#1DB954]/10 px-2.5 py-1 rounded-full border border-[#1DB954]/30">
          {filteredNpcs.length} Artists
        </span>
      </div>

      {/* Search & Genre Filter Bar */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search real-world artists (Taylor Swift, Drake, Kendrick, Bad Bunny...)"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954]"
          />
        </div>
        <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-1">
          {GENRE_FILTERS.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                selectedGenre === g
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#282828] border border-white/5'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredNpcs.map(npc => (
          <div
            key={npc.id}
            onClick={() => onSelectNpc(npc)}
            className="flex flex-col items-center p-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#242424] transition cursor-pointer group border border-white/5"
          >
            <div className="relative mb-2">
              <OfficialArtworkImg
                artist={npc.name}
                explicitSrc={npc.avatar}
                isArtistPortrait={true}
                alt={npc.name}
                className="w-20 h-20 rounded-full object-cover shadow-lg group-hover:scale-105 transition duration-200 border-2 border-white/10 bg-zinc-800"
              />
              <span className="absolute bottom-0 right-0 bg-[#1DB954] text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                ✓
              </span>
            </div>
            <h4 className="font-bold text-xs text-white text-center truncate w-full group-hover:text-[#1DB954] transition">
              {npc.name}
            </h4>
            <span className="text-[10px] text-gray-400 text-center truncate w-full mt-0.5">
              {npc.genre.split('/')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
