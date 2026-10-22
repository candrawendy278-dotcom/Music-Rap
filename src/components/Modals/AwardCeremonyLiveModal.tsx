import React, { useState, useMemo } from 'react';
import { AwardSeasonRecord, AwardCategoryResult } from '../../data/awardsFormulaAndSimulationEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

interface AwardCeremonyLiveModalProps {
  season: AwardSeasonRecord;
  onClose: () => void;
}

export default function AwardCeremonyLiveModal({
  season,
  onClose
}: AwardCeremonyLiveModalProps) {
  const isGrammy = season.show === 'grammys';
  const isNominationsMode = season.phase === 'nominations_announced';

  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'stage' | 'leaderboard'>('stage');

  const categories = season.categories;
  const currentCat: AwardCategoryResult | undefined = categories[activeCatIndex];
  const isCurrentRevealed =
    !isNominationsMode && currentCat ? Boolean(revealedIds[currentCat.categoryId]) : false;

  const revealedCount = useMemo(
    () => Object.values(revealedIds).filter(Boolean).length,
    [revealedIds]
  );

  const mostNominatedTallies = useMemo(() => {
    return [...season.artistTallies].sort((a, b) => b.nominations - a.nominations);
  }, [season.artistTallies]);

  const handleRevealCurrent = () => {
    if (!currentCat || isNominationsMode) return;
    setRevealedIds(prev => ({ ...prev, [currentCat.categoryId]: true }));
  };

  const handleRevealAll = () => {
    if (isNominationsMode) return;
    const all: Record<string, boolean> = {};
    categories.forEach(c => {
      all[c.categoryId] = true;
    });
    setRevealedIds(all);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between overflow-y-auto animate-fade-in">
      {/* Top Broadcast Bar */}
      <div
        className={`sticky top-0 z-20 px-5 pt-11 pb-4 border-b flex items-center justify-between ${
          isGrammy
            ? 'bg-[#0A0A0D]/95 border-[#D4AF37]/25 text-[#F7F3E8]'
            : 'bg-[#090910]/95 border-[#FF1E8A]/30 text-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isGrammy
                ? 'bg-gradient-to-br from-[#D4AF37]/25 to-[#8A6D1B]/10 border-[#D4AF37]/50 text-[#E5C158]'
                : 'bg-gradient-to-br from-[#FF1E8A]/25 to-[#00F0FF]/15 border-[#FF1E8A]/50 text-[#FF1E8A]'
            }`}
          >
            <i className={`ph-fill ${isGrammy ? 'ph-trophy' : 'ph-planet'} text-xl`}></i>
          </div>
          <div className="min-w-0">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                isGrammy ? 'text-[#D4AF37]' : 'text-[#00F0FF]'
              }`}
            >
              {isNominationsMode
                ? isGrammy
                  ? 'Recording Academy · Official Nominations Reveal'
                  : 'MTV Official Broadcast · VMA Nominations Reveal'
                : isGrammy
                ? 'Live From Los Angeles · Ceremony Night'
                : 'MTV Live Broadcast · VMA Ceremony Night'}
            </p>
            <h2 className="text-base font-black tracking-tight truncate">
              {season.editionLabel}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors shrink-0 cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Mode Switcher Bar */}
      <div className="px-5 pt-3 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setViewMode('stage')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'stage'
                ? isGrammy
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-[#FF1E8A] text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {isNominationsMode
              ? `Official Nominees (${categories.length} Categories)`
              : `Ceremony Stage (${revealedCount}/${categories.length})`}
          </button>
          <button
            onClick={() => {
              if (!isNominationsMode) handleRevealAll();
              setViewMode('leaderboard');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'leaderboard'
                ? isGrammy
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-[#FF1E8A] text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {isNominationsMode ? 'Most Nominated Tally' : 'Trophy Leaderboard'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-4 max-w-md mx-auto w-full space-y-4">
        {viewMode === 'stage' && currentCat ? (
          <>
            {/* Horizontal Category Scroller */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {categories.map((cat, idx) => {
                const isDone = Boolean(revealedIds[cat.categoryId]);
                const isActive = idx === activeCatIndex;
                return (
                  <button
                    key={cat.categoryId}
                    onClick={() => setActiveCatIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                      isActive
                        ? isGrammy
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                          : 'bg-[#FF1E8A] text-white border-[#FF1E8A]'
                        : isDone
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {idx + 1}. {cat.shortName}
                  </button>
                );
              })}
            </div>

            {/* Category Presentation Card */}
            <div
              className={`rounded-3xl p-5 border relative overflow-hidden ${
                isGrammy
                  ? 'bg-gradient-to-b from-[#171510] to-[#0C0B09] border-[#D4AF37]/30'
                  : 'bg-gradient-to-b from-[#160D24] to-[#090910] border-[#FF1E8A]/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>
                  {currentCat.field} · Category {activeCatIndex + 1} of {categories.length}
                </span>
                {currentCat.isMajor && (
                  <span
                    className={`font-bold ${
                      isGrammy ? 'text-[#D4AF37]' : 'text-[#00F0FF]'
                    }`}
                  >
                    {isGrammy ? 'General Field Honor' : 'Major Moon Person'}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                {currentCat.categoryName}
              </h3>

              {/* Status Banner or Envelope Reveal Box */}
              <div className="mt-4">
                {isNominationsMode ? (
                  <div
                    className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
                      isGrammy
                        ? 'bg-black/45 border-[#D4AF37]/35'
                        : 'bg-black/45 border-[#FF1E8A]/35'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                          isGrammy ? 'text-[#E5C158]' : 'text-[#00F0FF]'
                        }`}
                      >
                        Official Ballot Announced · Winner Sealed
                      </p>
                      <p className="text-xs text-neutral-300 mt-0.5">
                        {isGrammy
                          ? `Final voting is underway. The envelope will be opened live on Ceremony Night (${season.ceremonyDate}).`
                          : `Global fan voting is live. The Moon Person winner will be crowned on ${season.ceremonyDate}.`}
                      </p>
                    </div>
                    <i
                      className={`ph-fill ph-lock-key text-xl shrink-0 ${
                        isGrammy ? 'text-[#D4AF37]' : 'text-[#FF1E8A]'
                      }`}
                    ></i>
                  </div>
                ) : !isCurrentRevealed ? (
                  <div
                    className={`rounded-2xl p-5 border text-center space-y-3 ${
                      isGrammy
                        ? 'bg-black/50 border-[#D4AF37]/40'
                        : 'bg-black/50 border-[#FF1E8A]/40'
                    }`}
                  >
                    <p className="text-xs font-medium text-neutral-300">
                      {isGrammy
                        ? 'The sealed Recording Academy envelope is on stage. Who will take home the Golden Gramophone?'
                        : 'The Moon Person statue is ready on stage. Who will win the category tonight?'}
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={handleRevealCurrent}
                        className={`min-h-[44px] px-5 py-2.5 rounded-xl font-black text-xs tracking-wide transition-transform active:scale-95 cursor-pointer ${
                          isGrammy
                            ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                            : 'bg-gradient-to-r from-[#FF1E8A] to-[#7928CA] text-white shadow-lg shadow-[#FF1E8A]/25'
                        }`}
                      >
                        {isGrammy ? 'Open Envelope: Reveal Winner' : 'Announce Moon Person Winner'}
                      </button>
                      <button
                        onClick={handleRevealAll}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-neutral-200 cursor-pointer"
                      >
                        Reveal All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl p-4 border flex items-center gap-4 ${
                      isGrammy
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]'
                        : 'bg-[#FF1E8A]/15 border-[#FF1E8A]'
                    }`}
                  >
                    <OfficialArtworkImg
                      artist={currentCat.winner.artistName}
                      title={
                        currentCat.winner.workTitle === currentCat.winner.artistName
                          ? undefined
                          : currentCat.winner.workTitle
                      }
                      explicitSrc={currentCat.winner.coverArt}
                      isArtistPortrait={currentCat.winner.workTitle === currentCat.winner.artistName}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                          isGrammy ? 'text-[#E5C158]' : 'text-[#00F0FF]'
                        }`}
                      >
                        {isGrammy ? 'And the GRAMMY Goes To...' : 'And the Moon Person Goes To...'}
                      </p>
                      <h4 className="text-lg font-black text-white truncate">
                        {currentCat.winner.workTitle}
                      </h4>
                      <p className="text-xs font-semibold text-neutral-300 truncate">
                        {currentCat.winner.artistName} · {currentCat.winner.secondaryLabel}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Official Nominees List (Zero points / zero spoilers before reveal) */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span className="font-bold text-neutral-300">Official Nominees</span>
                  <span>{isCurrentRevealed ? 'Final Result' : 'Official Ballot'}</span>
                </div>

                <div className="divide-y divide-white/10 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                  {currentCat.nominees.map(nom => {
                    const isWin = isCurrentRevealed && nom.isWinner;
                    return (
                      <div
                        key={nom.id}
                        className={`p-3.5 flex items-center justify-between gap-3 ${
                          isWin
                            ? isGrammy
                              ? 'bg-[#D4AF37]/20'
                              : 'bg-[#FF1E8A]/20'
                            : nom.isPlayer
                            ? 'bg-white/[0.04]'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <OfficialArtworkImg
                            artist={nom.artistName}
                            title={nom.workTitle === nom.artistName ? undefined : nom.workTitle}
                            explicitSrc={nom.coverArt}
                            isArtistPortrait={nom.workTitle === nom.artistName}
                            className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white truncate">
                                {nom.workTitle}
                              </span>
                              {nom.isPlayer && (
                                <span className="text-[10px] font-bold text-emerald-400">
                                  · YOU
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 truncate">
                              {nom.artistName} · {nom.secondaryLabel}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {isWin ? (
                            <span
                              className={`text-xs font-black uppercase tracking-wider ${
                                isGrammy ? 'text-[#E5C158]' : 'text-[#00F0FF]'
                              }`}
                            >
                              🏆 WINNER
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-neutral-400">
                              Nominee
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prev / Next Category Controls */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  disabled={activeCatIndex === 0}
                  onClick={() => setActiveCatIndex(i => Math.max(0, i - 1))}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 disabled:opacity-30 text-xs font-bold text-white cursor-pointer"
                >
                  Previous Category
                </button>
                <button
                  onClick={() => {
                    if (activeCatIndex < categories.length - 1) {
                      setActiveCatIndex(i => i + 1);
                    } else {
                      if (!isNominationsMode) handleRevealAll();
                      setViewMode('leaderboard');
                    }
                  }}
                  className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-black cursor-pointer ${
                    isGrammy
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-[#FF1E8A] text-white'
                  }`}
                >
                  {activeCatIndex < categories.length - 1
                    ? 'Next Category'
                    : isNominationsMode
                    ? 'View Nominations Tally'
                    : 'View Final Trophy Tally'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Leaderboard View: Either Most Nominated (if nominations phase) or Most Wins (if ceremony phase) */
          <div
            className={`rounded-3xl p-5 border space-y-4 ${
              isGrammy
                ? 'bg-[#12110E] border-[#D4AF37]/30'
                : 'bg-[#110C1D] border-[#FF1E8A]/30'
            }`}
          >
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                  isGrammy ? 'text-[#D4AF37]' : 'text-[#00F0FF]'
                }`}
              >
                {isNominationsMode
                  ? 'Official Nominations Leaderboard · Reported on X'
                  : 'Official Ceremony Recap · Reported on X'}
              </p>
              <h3 className="text-xl font-black text-white mt-0.5">
                {isNominationsMode
                  ? 'Most Nominated Artists This Season'
                  : 'Most Trophies Taken Home Tonight'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isNominationsMode
                  ? `Winners remain sealed until the live ceremony on ${season.ceremonyDate}.`
                  : `Complete tally of wins and nominations across all ${categories.length} categories.`}
              </p>
            </div>

            <div className="divide-y divide-white/10 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
              {(isNominationsMode ? mostNominatedTallies : season.artistTallies)
                .slice(0, 12)
                .map((tally, idx) => (
                  <div
                    key={tally.artistName}
                    className="p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-neutral-400 tabular-nums w-5">
                        #{idx + 1}
                      </span>
                      <OfficialArtworkImg
                        artist={tally.artistName}
                        explicitSrc={tally.avatar}
                        isArtistPortrait={true}
                        className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white truncate">
                            {tally.artistName}
                          </span>
                          {tally.isPlayer && (
                            <span className="text-[10px] font-bold text-emerald-400">· YOU</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {isNominationsMode
                            ? `Nominated in: ${(tally.nominatedCategories || []).slice(0, 3).join(', ')}`
                            : tally.wonCategories.length > 0
                            ? `Won: ${tally.wonCategories.join(', ')}`
                            : `${tally.nominations} Nominations`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      {isNominationsMode ? (
                        <div
                          className={`text-sm font-black ${
                            isGrammy ? 'text-[#E5C158]' : 'text-[#00F0FF]'
                          }`}
                        >
                          {tally.nominations} {tally.nominations === 1 ? 'Nom' : 'Noms'}
                        </div>
                      ) : (
                        <>
                          <div
                            className={`text-sm font-black ${
                              tally.wins > 0
                                ? isGrammy
                                  ? 'text-[#E5C158]'
                                  : 'text-[#00F0FF]'
                                : 'text-neutral-400'
                            }`}
                          >
                            {tally.wins} {tally.wins === 1 ? 'Win' : 'Wins'}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {tally.nominations} Noms
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
