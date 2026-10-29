import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  getCriticsAndAggregatorData,
  PitchforkReviewItem
} from '../../data/pitchforkAndMetacriticEngine';

type PitchforkTab = 'albums' | 'tracks' | 'bnm' | 'sunday' | 'player';

export default function PitchforkApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<PitchforkTab>('albums');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'highest' | 'lowest'>('latest');

  const summary = useMemo(() => getCriticsAndAggregatorData(state), [state]);
  const allReviews = summary.allPitchforkReviews;

  const filteredReviews = useMemo(() => {
    let list = [...allReviews];

    if (activeTab === 'albums') {
      list = list.filter(
        r => (r.releaseType === 'album' || r.releaseType === 'ep') && !r.isSundayReview
      );
    } else if (activeTab === 'tracks') {
      list = list.filter(r => r.releaseType === 'single');
    } else if (activeTab === 'bnm') {
      list = list.filter(r => r.isBestNewMusic || r.isBestNewTrack);
    } else if (activeTab === 'sunday') {
      list = list.filter(r => r.isSundayReview);
    } else if (activeTab === 'player') {
      list = list.filter(r => r.isPlayer);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.artist.toLowerCase().includes(q) ||
          r.genre.toLowerCase().includes(q) ||
          r.criticName.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'highest') {
      list.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => a.score - b.score);
    }

    return list;
  }, [allReviews, activeTab, searchQuery, sortBy]);

  const selectedReview: PitchforkReviewItem | null = useMemo(() => {
    if (!selectedReviewId) return null;
    return allReviews.find(r => r.id === selectedReviewId) || null;
  }, [allReviews, selectedReviewId]);

  const featuredReview = useMemo(() => {
    const playerBnm = allReviews.find(
      r => r.isPlayer && (r.isBestNewMusic || r.isBestNewTrack)
    );
    if (playerBnm) return playerBnm;
    const latestPlayer = allReviews.find(r => r.isPlayer);
    if (latestPlayer) return latestPlayer;
    return allReviews.find(r => r.isBestNewMusic) || allReviews[0] || null;
  }, [allReviews]);

  const closeApp = () => {
    setState(prev => ({ ...prev, activeApp: 'none' }));
  };

  const renderScoreCircle = (
    review: PitchforkReviewItem,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const isRed = review.isBestNewMusic || review.isBestNewTrack;
    const isSunday = review.isSundayReview && !isRed;

    const sizeClasses =
      size === 'lg'
        ? 'w-20 h-20 text-2xl border-[3px]'
        : size === 'md'
        ? 'w-14 h-14 text-lg border-2'
        : 'w-11 h-11 text-sm border-2';

    const colorClasses = isRed
      ? 'border-[#FF3530] text-[#FF3530] bg-[#FF3530]/[0.04]'
      : isSunday
      ? 'border-[#B45309] text-[#B45309] bg-[#B45309]/[0.04]'
      : 'border-[#0A0A0A] text-[#0A0A0A] bg-white';

    return (
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`${sizeClasses} ${colorClasses} rounded-full flex items-center justify-center font-black tracking-tighter tabular-nums shadow-xs`}
        >
          {review.score.toFixed(1)}
        </div>
        {(review.isBestNewMusic || review.isBestNewTrack) && (
          <span className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#FF3530] text-center leading-tight">
            {review.isBestNewMusic ? 'Best New Music' : 'Best New Track'}
          </span>
        )}
        {review.isSundayReview && !review.isBestNewMusic && (
          <span className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#B45309] text-center leading-tight">
            Sunday Review
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 max-w-md mx-auto bg-[#FAF8F5] text-[#0A0A0A] flex flex-col overflow-hidden animate-fade-in">
      {/* Top Editorial Masthead */}
      <header className="bg-white border-b-2 border-[#0A0A0A] px-4 pt-3 pb-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (selectedReview) {
                setSelectedReviewId(null);
              } else {
                closeApp();
              }
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition cursor-pointer"
            aria-label="Back"
          >
            <i
              className={`ph-bold ${
                selectedReview ? 'ph-arrow-left' : 'ph-x'
              } text-lg text-[#0A0A0A]`}
            ></i>
          </button>

          <div className="text-center">
            <h1 className="font-serif text-2xl font-black tracking-[-0.04em] uppercase leading-none text-[#0A0A0A]">
              PITCHFORK
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#52504C] mt-0.5">
              The Most Trusted Voice in Music
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedReviewId(null);
              setActiveTab('player');
            }}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
              activeTab === 'player' && !selectedReview
                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                : 'bg-white text-[#0A0A0A] border-[#0A0A0A]/30 hover:border-[#0A0A0A]'
            }`}
          >
            My Press
          </button>
        </div>

        {/* Navigation Strip */}
        {!selectedReview && (
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar mt-3 pt-2 border-t border-[#E6E2DC]">
            {[
              { id: 'albums', label: 'Album Reviews' },
              { id: 'tracks', label: 'Tracks' },
              { id: 'bnm', label: 'Best New Music' },
              { id: 'sunday', label: 'Sunday Reviews' },
              { id: 'player', label: `My Catalog (${summary.playerStats.reviewedReleasesCount})` }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as PitchforkTab)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap transition cursor-pointer ${
                    active
                      ? tab.id === 'bnm'
                        ? 'bg-[#FF3530] text-white'
                        : 'bg-[#0A0A0A] text-white'
                      : 'text-[#52504C] hover:text-[#0A0A0A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-16">
        {selectedReview ? (
          /* ==========================================
             FULL EDITORIAL REVIEW READER VIEW
             ========================================== */
          <article className="bg-white min-h-full">
            {/* Top Category Rubric */}
            <div className="px-5 pt-4 pb-2 border-b border-[#E6E2DC] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <span
                  className={
                    selectedReview.isBestNewMusic || selectedReview.isBestNewTrack
                      ? 'text-[#FF3530]'
                      : selectedReview.isSundayReview
                      ? 'text-[#B45309]'
                      : 'text-[#0A0A0A]'
                  }
                >
                  {selectedReview.isSundayReview
                    ? 'Sunday Review • Classic Retrospective'
                    : selectedReview.releaseType === 'single'
                    ? 'Track Review'
                    : selectedReview.releaseType === 'ep'
                    ? 'EP Review'
                    : 'Album Review'}
                </span>
                <span className="text-[#8A857D]">·</span>
                <span className="text-[#52504C]">{selectedReview.genre}</span>
              </div>

              {selectedReview.isPlayer && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#0A0A0A] text-white">
                  Your Release
                </span>
              )}
            </div>

            {/* Editorial Split Header: Cover + Headline + Score Circle */}
            <div className="p-5 border-b border-[#E6E2DC] bg-[#FAF8F5]">
              <div className="flex items-start gap-4">
                <div className="w-28 h-28 shrink-0 border border-[#0A0A0A]/15 shadow-md bg-zinc-900 overflow-hidden">
                  <OfficialArtworkImg
                    src={selectedReview.cover}
                    artist={selectedReview.artist}
                    title={selectedReview.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#52504C] truncate">
                    {selectedReview.artist}
                  </p>
                  <h2 className="font-serif text-2xl font-black tracking-tight text-[#0A0A0A] leading-tight mt-0.5 break-words">
                    {selectedReview.title}
                  </h2>

                  <div className="mt-2 space-y-0.5 text-[11px] text-[#52504C]">
                    <p>
                      <span className="font-bold text-[#0A0A0A]">Label:</span>{' '}
                      {selectedReview.labelName}
                    </p>
                    <p>
                      <span className="font-bold text-[#0A0A0A]">Released:</span>{' '}
                      {selectedReview.sundayReviewOriginalYear
                        ? `${selectedReview.sundayReviewOriginalYear} (Retrospective)`
                        : selectedReview.releaseDate}
                    </p>
                  </div>
                </div>

                {/* Iconic Pitchfork Score Circle */}
                {renderScoreCircle(selectedReview, 'lg')}
              </div>

              {/* Accolade Banner if Best New Music / Track */}
              {(selectedReview.isBestNewMusic || selectedReview.isBestNewTrack) && (
                <div className="mt-4 bg-[#FF3530] text-white px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ph-fill ph-seal-check text-base"></i>
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                      {selectedReview.isBestNewMusic
                        ? 'Pitchfork Best New Music'
                        : 'Pitchfork Best New Track'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                    Editorial Stamp
                  </span>
                </div>
              )}

              {/* Pull Quote Deck */}
              <blockquote className="mt-4 pt-3 border-t border-[#D8D3CA] font-serif text-[15px] italic leading-snug text-[#1F1E1C]">
                “{selectedReview.pullQuote}”
              </blockquote>

              {/* Critic Byline & Bias Note */}
              <div className="mt-3 pt-2.5 border-t border-[#E6E2DC] flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-[#52504C]">By </span>
                    <span className="font-black uppercase tracking-wider text-[#0A0A0A]">
                      {selectedReview.criticName}
                    </span>
                    <span className="text-[#8A857D]"> · </span>
                    <span className="text-[#52504C]">{selectedReview.criticRole}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8A857D]">
                    {selectedReview.releaseDate}
                  </span>
                </div>
                <p className="text-[10px] text-[#52504C] bg-white px-2.5 py-1.5 border border-[#E6E2DC]">
                  <span className="font-black uppercase tracking-wider text-[#0A0A0A]">
                    Critic Lens ({selectedReview.criticSpecialty}):
                  </span>{' '}
                  {selectedReview.criticBiasNote}
                </p>
              </div>
            </div>

            {/* 4-Pillar Critical Sub-Score Breakdown (0-100 Scale) */}
            <div className="px-5 py-4 border-b border-[#E6E2DC] bg-white">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#52504C]">
                  Critical Evaluation Matrix
                </h3>
                <span className="text-[10px] font-mono text-[#8A857D] tabular-nums">
                  FINAL VERDICT: {selectedReview.score.toFixed(1)} / 10.0
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Songwriting & Craft', val: selectedReview.subScores.songwriting },
                  { label: 'Production & Mix', val: selectedReview.subScores.production },
                  { label: 'Cohesion & Pacing', val: selectedReview.subScores.cohesion },
                  { label: 'Originality & Risk', val: selectedReview.subScores.originality }
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-2.5 border border-[#E6E2DC] bg-[#FAF8F5]"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#52504C]">{item.label}</span>
                      <span className="font-black text-[#0A0A0A] tabular-nums">
                        {item.val} / 100
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E6E2DC] mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${
                          item.val >= 82
                            ? 'bg-[#FF3530]'
                            : item.val >= 68
                            ? 'bg-[#0A0A0A]'
                            : 'bg-[#8A857D]'
                        }`}
                        style={{ width: `${Math.min(100, item.val)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strict Pitchfork Editorial Scoring Ledger & BNM/BNT Qualification Audit */}
            {selectedReview.scoringAudit && (
              <div className="px-5 py-4 border-b border-[#E6E2DC] bg-[#FAF8F5]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <i className="ph-fill ph-scales text-xs text-[#0A0A0A]"></i>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0A0A0A]">
                      Editorial Scoring Audit &{' '}
                      {selectedReview.releaseType === 'single'
                        ? 'Best New Track'
                        : 'Best New Music'}{' '}
                      Gates
                    </h3>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                      selectedReview.isBestNewMusic || selectedReview.isBestNewTrack
                        ? 'bg-[#FF3530] text-white border-[#FF3530]'
                        : selectedReview.isSundayReview
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : 'bg-white text-[#52504C] border-[#D8D3CA]'
                    }`}
                  >
                    {selectedReview.isBestNewMusic
                      ? 'BNM CERTIFIED'
                      : selectedReview.isBestNewTrack
                      ? 'BNT CERTIFIED'
                      : selectedReview.isSundayReview
                      ? 'SUNDAY CLASSIC'
                      : 'STANDARD REVIEW (NO STAMP)'}
                  </span>
                </div>

                {/* Modifier Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="bg-white border border-[#E6E2DC] p-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#8A857D]">
                      Raw Track Avg
                    </p>
                    <p className="text-xs font-black text-[#0A0A0A] tabular-nums mt-0.5">
                      {selectedReview.scoringAudit.rawAvgTrackQuality.toFixed(1)} / 100
                    </p>
                  </div>
                  <div className="bg-white border border-[#E6E2DC] p-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#8A857D]">
                      Studio Mastery
                    </p>
                    <p className="text-xs font-black text-emerald-700 tabular-nums mt-0.5">
                      +{selectedReview.scoringAudit.studioMasteryBonus.toFixed(1)} pts
                    </p>
                  </div>
                  <div className="bg-white border border-[#E6E2DC] p-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#8A857D]">
                      Filler / Bloat Penalty
                    </p>
                    <p
                      className={`text-xs font-black tabular-nums mt-0.5 ${
                        selectedReview.scoringAudit.fillerPenaltyPoints +
                          selectedReview.scoringAudit.sequencingPenaltyPoints >
                        0
                          ? 'text-[#FF3530]'
                          : 'text-[#0A0A0A]'
                      }`}
                    >
                      -
                      {(
                        selectedReview.scoringAudit.fillerPenaltyPoints +
                        selectedReview.scoringAudit.sequencingPenaltyPoints
                      ).toFixed(2)}{' '}
                      pts
                    </p>
                  </div>
                  <div className="bg-white border border-[#E6E2DC] p-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#8A857D]">
                      Critic Strictness
                    </p>
                    <p
                      className={`text-xs font-black tabular-nums mt-0.5 ${
                        selectedReview.scoringAudit.criticPersonaDelta < 0
                          ? 'text-[#FF3530]'
                          : 'text-[#0A0A0A]'
                      }`}
                    >
                      {selectedReview.scoringAudit.criticPersonaDelta >= 0 ? '+' : ''}
                      {selectedReview.scoringAudit.criticPersonaDelta.toFixed(2)} pts
                    </p>
                  </div>
                </div>

                {/* Disqualification Reason Banner if missed BNM/BNT */}
                {selectedReview.scoringAudit.accoladeDisqualificationReason && (
                  <div className="mb-3 px-3 py-2 bg-white border-l-2 border-[#0A0A0A] text-[11px] text-[#52504C]">
                    <span className="font-black uppercase tracking-wider text-[#0A0A0A]">
                      Editorial Board Note:{' '}
                    </span>
                    {selectedReview.scoringAudit.accoladeDisqualificationReason}
                  </div>
                )}

                {/* Mandatory Gate Checklist */}
                {!selectedReview.isSundayReview && (
                  <div className="bg-white border border-[#E6E2DC] divide-y divide-[#E6E2DC]">
                    {selectedReview.scoringAudit.pitchforkChecklist.map((gate, gIdx) => (
                      <div
                        key={gIdx}
                        className="px-3 py-2 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 flex items-center justify-center text-[10px] font-black shrink-0 ${
                              gate.passed
                                ? 'bg-[#0A0A0A] text-white'
                                : 'bg-[#E6E2DC] text-[#52504C]'
                            }`}
                          >
                            {gate.passed ? '✓' : '✕'}
                          </span>
                          <span className="font-bold text-[#0A0A0A] truncate">
                            {gate.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] tabular-nums">
                          <span
                            className={`font-black ${
                              gate.passed ? 'text-[#0A0A0A]' : 'text-[#FF3530]'
                            }`}
                          >
                            {gate.currentValue}
                          </span>
                          <span className="text-[#8A857D]">/ Req {gate.requiredValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Longform Editorial Essay Paragraphs */}
            <div className="px-5 py-5 space-y-4 border-b border-[#E6E2DC]">
              {selectedReview.essayParagraphs.map((para, idx) => (
                <p
                  key={idx}
                  className={`font-serif text-[15px] leading-[1.72] text-[#1A1917] ${
                    idx === 0
                      ? 'first-letter:text-4xl first-letter:font-black first-letter:float-left first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#0A0A0A]'
                      : ''
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Track-by-Track Critical Guide */}
            {selectedReview.trackNotes && selectedReview.trackNotes.length > 0 && (
              <div className="px-5 py-5 bg-[#FAF8F5]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#0A0A0A]">
                    Track-by-Track Critical Notes
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52504C]">
                    {selectedReview.trackNotes.length}{' '}
                    {selectedReview.trackNotes.length === 1 ? 'Track' : 'Tracks'}
                  </span>
                </div>

                <div className="divide-y divide-[#E6E2DC] border border-[#E6E2DC] bg-white">
                  {selectedReview.trackNotes.map(t => (
                    <div key={t.trackNumber} className="p-3 flex items-start gap-3">
                      <span className="text-xs font-mono font-bold text-[#8A857D] tabular-nums w-5 pt-0.5">
                        {String(t.trackNumber).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#0A0A0A]">
                            “{t.title}”
                          </span>
                          {t.isEssentialTrack && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#FF3530] text-white">
                              Essential Track
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#52504C] mt-1 leading-relaxed">
                          {t.commentary}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-0.5 text-xs font-black tabular-nums border ${
                          t.trackScore >= 8.3
                            ? 'border-[#FF3530] text-[#FF3530]'
                            : 'border-[#0A0A0A] text-[#0A0A0A]'
                        }`}
                      >
                        {t.trackScore.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ) : (
          /* ==========================================
             FRONT PAGE & FILTERED REVIEW INDEX
             ========================================== */
          <div>
            {/* Player Career Critical Standing Strip */}
            <div className="bg-white border-b border-[#E6E2DC] px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#52504C]">
                  {state.artist?.name || 'Artist'} · Pitchfork Press Dossier
                </span>
                <span className="text-[10px] font-bold text-[#0A0A0A] tabular-nums">
                  {summary.playerStats.reviewedReleasesCount} Reviewed
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-[#FAF8F5] border border-[#E6E2DC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#52504C]">
                    Avg Score
                  </p>
                  <p className="text-base font-black text-[#0A0A0A] tabular-nums mt-0.5">
                    {summary.playerStats.reviewedReleasesCount > 0
                      ? summary.playerStats.avgPitchforkScore.toFixed(1)
                      : '—'}
                  </p>
                </div>
                <div className="p-2 bg-[#FAF8F5] border border-[#E6E2DC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#52504C]">
                    Peak Score
                  </p>
                  <p className="text-base font-black text-[#0A0A0A] tabular-nums mt-0.5">
                    {summary.playerStats.reviewedReleasesCount > 0
                      ? summary.playerStats.highestPitchforkScore.toFixed(1)
                      : '—'}
                  </p>
                </div>
                <div className="p-2 bg-[#FAF8F5] border border-[#E6E2DC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF3530]">
                    Best New Music
                  </p>
                  <p className="text-base font-black text-[#FF3530] tabular-nums mt-0.5">
                    {summary.playerStats.bestNewMusicCount}
                  </p>
                </div>
                <div className="p-2 bg-[#FAF8F5] border border-[#E6E2DC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF3530]">
                    Best New Track
                  </p>
                  <p className="text-base font-black text-[#FF3530] tabular-nums mt-0.5">
                    {summary.playerStats.bestNewTrackCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Cover Story Hero (shown on Albums & BNM tabs when not searching) */}
            {featuredReview && searchQuery.trim() === '' && activeTab === 'albums' && (
              <div
                onClick={() => setSelectedReviewId(featuredReview.id)}
                className="bg-white border-b-2 border-[#0A0A0A] p-4 cursor-pointer group hover:bg-[#FAF8F5] transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF3530]">
                    ★ Featured Lead Review
                  </span>
                  <span className="text-[10px] font-mono text-[#52504C]">
                    {featuredReview.genre} · {featuredReview.releaseDate}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 shrink-0 border border-[#0A0A0A]/15 overflow-hidden bg-zinc-900">
                    <OfficialArtworkImg
                      src={featuredReview.cover}
                      artist={featuredReview.artist}
                      title={featuredReview.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-[#52504C] truncate">
                      {featuredReview.artist}
                    </p>
                    <h2 className="font-serif text-xl font-black text-[#0A0A0A] leading-tight group-hover:underline">
                      {featuredReview.title}
                    </h2>
                    <p className="text-xs font-serif italic text-[#52504C] line-clamp-2 mt-1">
                      “{featuredReview.pullQuote}”
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A] mt-1.5">
                      By {featuredReview.criticName}
                    </p>
                  </div>

                  {renderScoreCircle(featuredReview, 'md')}
                </div>
              </div>
            )}

            {/* Search & Sort Controls */}
            <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E6E2DC] flex items-center gap-2">
              <div className="relative flex-1">
                <i className="ph ph-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A857D] text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search artist, album, genre, critic..."
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#D8D3CA] text-xs text-[#0A0A0A] placeholder:text-[#8A857D] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#D8D3CA] text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A] focus:outline-none cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="highest">Highest Score</option>
                <option value="lowest">Lowest Score</option>
              </select>
            </div>

            {/* Review Feed List */}
            {filteredReviews.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-serif text-lg font-bold text-[#0A0A0A]">
                  No Reviews Found in This Section
                </p>
                <p className="text-xs text-[#52504C] mt-1 max-w-xs mx-auto">
                  {activeTab === 'player'
                    ? 'Release a single, EP, or album in the Studio to receive official Pitchfork critical coverage.'
                    : 'Try adjusting your search query or switching to another editorial category.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E2DC] bg-white">
                {filteredReviews.map(review => (
                  <div
                    key={review.id}
                    onClick={() => setSelectedReviewId(review.id)}
                    className="p-4 flex items-start gap-3.5 hover:bg-[#FAF8F5] transition cursor-pointer group"
                  >
                    <div className="w-16 h-16 shrink-0 border border-[#0A0A0A]/10 overflow-hidden bg-zinc-900">
                      <OfficialArtworkImg
                        src={review.cover}
                        artist={review.artist}
                        title={review.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold uppercase tracking-wider text-[#52504C]">
                        <span>{review.artist}</span>
                        <span>·</span>
                        <span>{review.genre}</span>
                        {review.isPlayer && (
                          <span className="px-1.5 py-0.2 bg-[#0A0A0A] text-white text-[8px] font-black tracking-widest">
                            YOU
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-base font-black text-[#0A0A0A] leading-snug group-hover:underline truncate mt-0.5">
                        {review.title}
                      </h3>

                      <p className="text-xs text-[#52504C] line-clamp-2 mt-1 leading-relaxed">
                        {review.pullQuote}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[#8A857D]">
                        <span className="font-bold text-[#0A0A0A] uppercase tracking-wider">
                          By {review.criticName}
                        </span>
                        <span>·</span>
                        <span>
                          {review.sundayReviewOriginalYear
                            ? `${review.sundayReviewOriginalYear} Classic`
                            : review.releaseDate}
                        </span>
                      </div>
                    </div>

                    {renderScoreCircle(review, 'sm')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
