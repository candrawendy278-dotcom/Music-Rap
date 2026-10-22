import React, { useState, useRef } from 'react';
import { useGameContext } from './GameContext';
import { Artist } from './types';
import { COUNTRY_TIERS, COUNTRY_NAMES } from './constants';
import { compressImageFile } from './utils/imageOptimizer';
import {
  syncPlayerNameNpcDeduplication,
  purgeDuplicateNpcFromGameState
} from './data/npcPlayerDeduplicationEngine';
import {
  getInitialBillboardSingles,
  getInitialBillboardAlbums
} from './data/billboardInitialData';

export default function StartScreen() {
  const { setState } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('US');
  const [birthdate, setBirthdate] = useState('2000-01-01');
  const [startYear, setStartYear] = useState('2026');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setImagePreview(compressed);
      }
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      alert("Please enter your artist name.");
      return;
    }

    const cleanName = name.trim();
    // Immediately remove any NPC artist with the same name as the Player
    syncPlayerNameNpcDeduplication(cleanName);

    const imgUrl = imagePreview || `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(cleanName.charAt(0))}`;

    const artist: Artist = {
      name: cleanName,
      country,
      tier: COUNTRY_TIERS[country] || 1,
      birthdate,
      startYear: parseInt(startYear) || 2026,
      image: imgUrl
    };

    setState(prev => {
      const next = purgeDuplicateNpcFromGameState({
        ...prev,
        isStarted: true,
        artist,
        date: new Date(`${artist.startYear}-01-01T00:00:00`).toISOString(),
        billboard: {
          ...prev.billboard,
          hot100: getInitialBillboardSingles('US'),
          global200: getInitialBillboardSingles('global'),
          albums200: getInitialBillboardAlbums()
        }
      });
      return next;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center px-6 py-12 relative z-20">
      <div className="text-center mb-6 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Music Rap Logo"
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl shadow-lg border border-white/60 mb-3"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-5xl font-black tracking-tighter text-apple-text mb-1 bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 pb-1">
          Music Rap
        </h1>
        <p className="text-apple-subtext text-sm font-medium">The Simulator • From Zero to Empire</p>
      </div>

      <div className="bg-apple-card rounded-[32px] p-6 shadow-ios-heavy space-y-5 relative overflow-hidden border border-white">
        
        <div className="flex flex-col items-center justify-center">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-apple-blue bg-apple-bg flex items-center justify-center cursor-pointer relative overflow-hidden transition group"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Artist Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400 group-hover:text-apple-blue">
                <i className="ph-bold ph-camera text-2xl"></i>
                <span className="text-[10px] font-bold mt-1">Upload Photo</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImageChange} 
          />
          <p className="text-[11px] font-medium text-apple-subtext mt-1.5">Artist Profile Photo (Optional)</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-apple-subtext mb-1 ml-1 uppercase tracking-wide">Artist Name</label>
          <input 
            type="text" 
            placeholder="e.g. The Weeknd" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-apple-bg text-apple-text rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-apple-blue font-semibold text-lg transition-shadow" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-apple-subtext mb-1 ml-1 uppercase tracking-wide">Origin Country (Global)</label>
          <div className="relative">
            <select 
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-apple-bg text-apple-text rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-apple-blue font-medium transition-shadow appearance-none"
            >
              {Object.keys(COUNTRY_TIERS).map(cc => (
                 <option key={cc} value={cc}>{COUNTRY_NAMES[cc]} (Tier {COUNTRY_TIERS[cc]})</option>
              ))}
            </select>
            <i className="ph ph-caret-down absolute right-4 top-1/2 transform -translate-y-1/2 text-apple-subtext pointer-events-none"></i>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-apple-subtext mb-1 ml-1 uppercase tracking-wide">Birthdate</label>
            <input 
              type="date" 
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              className="w-full bg-apple-bg text-apple-text rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-apple-blue font-medium transition-shadow text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-apple-subtext mb-1 ml-1 uppercase tracking-wide">Start Year</label>
            <input 
              type="number" 
              value={startYear}
              onChange={e => setStartYear(e.target.value)}
              className="w-full bg-apple-bg text-apple-text rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-apple-blue font-medium transition-shadow" 
            />
          </div>
        </div>

        <button 
          onClick={handleCreate}
          className="w-full bg-apple-text text-white font-bold text-lg rounded-2xl py-4 mt-6 active:scale-[0.98] transition-transform shadow-lg cursor-pointer"
        >
          Create Artist ($100k Capital)
        </button>
      </div>
    </div>
  );
}
