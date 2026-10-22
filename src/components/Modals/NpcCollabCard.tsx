import React, { useState, useMemo } from 'react';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

interface NpcCollabCardProps {
  selectedNpcId: string;
  onSelectNpc: (id: string) => void;
}

export const NpcCollabCard: React.FC<NpcCollabCardProps> = ({ selectedNpcId, onSelectNpc }) => {
  const [search, setSearch] = useState('');

  const filteredNpcs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...REAL_WORLD_NPCS].sort((a, b) => (b.pop || 0) - (a.pop || 0));
    if (!q) return sorted.slice(0, 45);
    return sorted.filter(
      n =>
        n.name.toLowerCase().includes(q) ||
        (n.genre || '').toLowerCase().includes(q) ||
        (n.country || '').toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-2.5">
      {/* Search Filter for 155+ In-Game NPC Collaborators */}
      <div className="relative">
        <i className="ph ph-magnifying-glass text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"></i>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search artist to feature (e.g. Sabrina Carpenter, Taylor Swift, SZA)..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-neutral-900"
        />
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        <div
          onClick={() => onSelectNpc('none')}
          className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition ${
            selectedNpcId === 'none'
              ? 'border-neutral-900 bg-neutral-900/5 ring-1 ring-neutral-900'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-3 shrink-0">
            Solo
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-gray-900">No Collaboration (Solo Track)</div>
            <div className="text-xs text-gray-500">100% solo credit & creative control</div>
          </div>
          {selectedNpcId === 'none' && (
            <i className="ph-fill ph-check-circle text-neutral-900 text-xl shrink-0"></i>
          )}
        </div>

        {filteredNpcs.map(npc => {
          const isSelected =
            selectedNpcId === npc.name ||
            selectedNpcId === npc.id ||
            selectedNpcId.toLowerCase() === npc.name.toLowerCase();
          return (
            <div
              key={npc.id}
              onClick={() => onSelectNpc(npc.name)}
              className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900/5 ring-1 ring-neutral-900'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <OfficialArtworkImg
                artist={npc.name}
                explicitSrc={npc.avatar || npc.image}
                isArtistPortrait={true}
                alt={npc.name}
                className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-300 shadow-xs bg-gray-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 truncate flex items-center gap-1.5">
                  <span className="truncate">feat. {npc.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold shrink-0">
                    Pop {npc.pop}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {npc.genre} • {npc.country} • Appears on both Artist Profiles
                </div>
              </div>
              {isSelected && (
                <i className="ph-fill ph-check-circle text-neutral-900 text-xl shrink-0"></i>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
