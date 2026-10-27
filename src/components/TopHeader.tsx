import React, { useRef } from 'react';
import { useGameContext } from '../GameContext';
import { formatDate, formatMoney } from '../constants';
import { compressImageFile } from '../utils/imageOptimizer';
import ThemeToggleWidget from './Common/ThemeToggleWidget';

export default function TopHeader() {
  const { state, setState } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && state.artist) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setState(prev => {
          if (!prev.artist) return prev;
          return {
            ...prev,
            artist: {
              ...prev.artist,
              image: compressed
            }
          };
        });
      }
    }
    // reset input so same file can be re-selected if needed
    if (e.target) e.target.value = '';
  };

  return (
    <header className="pt-12 pb-4 px-6 bg-apple-bg/95 backdrop-blur-md sticky top-0 z-10 flex justify-between items-end border-b border-apple-border/60 shadow-sm transition-colors">
      <div className="flex items-center space-x-3">
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleAvatarChange} 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Click to edit profile picture"
          className="relative group cursor-pointer active:scale-95 transition-transform"
        >
          <div 
            className="w-11 h-11 rounded-full bg-gray-300 bg-cover bg-center shadow-sm border border-black/10 overflow-hidden" 
            style={{ backgroundImage: `url(${state.artist?.image})` }}
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/75 hover:bg-black text-white rounded-full flex items-center justify-center shadow-md border border-white transition-colors">
            <i className="ph-fill ph-camera text-[10px]"></i>
          </div>
        </button>
        <div>
          <p className="text-[10px] font-bold text-apple-subtext uppercase tracking-widest mb-0.5">{formatDate(state.date)}</p>
          <h2 className="text-xl font-black text-apple-text truncate max-w-[140px] leading-none">{state.artist?.name}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggleWidget variant="compact" />
        <div className="text-right">
          <p className="text-[10px] font-bold text-apple-subtext uppercase tracking-widest mb-0.5">FUNDS</p>
          <p className="text-lg font-black text-emerald-500 tracking-tight leading-none">{formatMoney(state.money)}</p>
        </div>
      </div>
    </header>
  );
}
