import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  getCriticsAndAggregatorData,
  MetacriticReleaseEntry,
  MetacriticColorTier
} from '../../data/pitchforkAndMetacriticEngine';
import { RosterArtistSwitcherBar } from '../Common/RosterArtistSwitcherBar';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';
import {
  ensureRosterArtistFullFields,
  getRosterArtistCriticsReviews
} from '../../data/recordLabelCeoEngine';

type MetacriticTab = 'new' | 'acclaim' | 'player' | 'must_play' | 'singles';

export default function MetacriticApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<MetacriticTab>('new');
  const [selectedMetacriticArtistId, setSelectedMetacriticArtistId] = useState<'player' | string>('player');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<'critics' | 'users'>('critics');
  const [sortBy, setSortBy] = useState<'metascore' | 'userscore' | 'recent'>('metascore');
  const [searchQuery, setSearchQuery] = useState('');

  const rlState = useMemo(() => getEnsuredRecordLabelState(state), [state]);
  const summary = useMemo(() => getCriticsAndAggregatorData(state), [state]);

  const rosterMetacriticMap = useMemo(() => {
    const map: Record<string, MetacriticReleaseEntry[]> = {};
    for (const raw of rlState.imprint.signedRoster) {
      const full = ensureRosterArtistFullFields(raw);
      map[full.id] = getRosterArtistCriticsReviews(state, full).metacriticEntries;
    }
    return map;
  }, [state, rlState.imprint.signedRoster]);

  const allEntries = useMemo(() => {
    const rosterAll = Object.values(rosterMetacriticMap).flat();
    return [...rosterAll, ...summary.allMetacriticEntries];
  }, [rosterMetacriticMap, summary.allMetacriticEntries]);

  const filteredEntries = useMemo(() => {
    let list: MetacriticReleaseEntry[] = [];

    if (activeTab === 'player') {
      if (selectedMetacriticArtistId !== 'player') {
        list = [...(rosterMetacriticMap[selectedMetacriticArtistId] || [])];
      } else {
        list = [...(summary.playerMetacriticEntries || summary.allMetacriticEntries.filter(e => e.isPlayer))];
      }
    } else {
      list = [...allEntries];
      if (activeTab === 'new') {
        list = list.filter(e => e.releaseType === 'album' || e.releaseType === 'ep');
      } else if (activeTab === 'acclaim') {
        list = list.filter(e => e.metascore >= 81);
      } else if (activeTab === 'must_play') {
        list = list.filter(e => e.isMustPlay);
      } else if (activeTab === 'singles') {
        list = list.filter(e => e.releaseType === 'single');
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        e =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.artist || '').toLowerCase().includes(q) ||
          (e.genre || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'metascore') {
      list.sort((a, b) => b.metascore - a.metascore);
    } else if (sortBy === 'userscore') {
      list.sort((a, b) => b.userScore - a.userScore);
    }

    return list;
  }, [allEntries, activeTab, searchQuery, sortBy, selectedMetacriticArtistId, rosterMetacriticMap, summary.playerMetacriticEntries, summary.allMetacriticEntries]);

  const selectedEntry: MetacriticReleaseEntry | null = useMemo(() => {
    if (!selectedEntryId) return null;
    return allEntries.find(e => e.id === selectedEntryId) || null;
  }, [allEntries, selectedEntryId]);

  const closeApp = () => {
    setState(prev => ({ ...prev, activeApp: 'none' }));
  };

  const getTierBadgeStyle = (tier: MetacriticColorTier) => {
    if (tier === 'green') {
      return 'bg-[#00CE7A] text-[#0B0D10]';
    }
    if (tier === 'yellow') {
      return 'bg-[#FFBD3F] text-[#0B0D10]';
    }
    return 'bg-[#FF6874] text-white';
  };

  return (
    <div className="fixed inset-0 z-50 max-w-md mx-auto bg-[#111318] text-[#F3F4F6] flex flex-col overflow-hidden animate-fade-in">
      {/* Top Aggregator Header */}
      <RosterArtistSwitcherBar
        gameState={state}
        selectedArtistId={selectedMetacriticArtistId}
        onSelectArtist={id => {
          setSelectedMetacriticArtistId(id);
          setSelectedEntryId(null);
          setActiveTab('player');
        }}
        accentColor="#00CE7A"
      />
      <header className="bg-[#0B0D10] border-b border-white/10 px-4 pt-3 pb-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (selectedEntry) {
                setSelectedEntryId(null);
              } else {
                closeApp();
              }
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition cursor-pointer"
            aria-label="Back"
          >
            <i
              className={`ph-bold ${
                selectedEntry ? 'ph-arrow-left' : 'ph-x'
              } text-lg text-white`}
            ></i>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#FFBD3F] text-[#0B0D10] flex items-center justify-center font-black text-base tracking-tighter">
              m
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">
                metacritic
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">
                Music Critic & User Aggregator
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedEntryId(null);
              setActiveTab('player');
            }}
            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'player' && !selectedEntry
                ? 'bg-[#FFBD3F] text-[#0B0D10]'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            My Scores
          </button>
        </div>

        {/* Navigation Tabs */}
        {!selectedEntry && (
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-2 border-t border-white/10">
            {[
              { id: 'new', label: 'Albums & EPs' },
              { id: 'acclaim', label: 'Universal Acclaim (81+)' },
              { id: 'must_play', label: 'Must-Play' },
              { id: 'singles', label: 'Singles' },
              { id: 'player', label: `My Discography (${summary.playerStats.reviewedReleasesCount})` }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MetacriticTab)}
                  className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-[#00CE7A] text-[#0B0D10]'
                      : 'text-[#9CA3AF] hover:text-white bg-white/[0.03]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto pb-16">
        {selectedEntry ? (
          /* ==========================================
             RELEASE METASCORE & USER SCORE DETAIL VIEW
             ========================================== */
          <div className="space-y-4 p-4">
            {/* Release Hero Card */}
            <div className="bg-[#1A1D24] border border-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3.5">
                <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                  <OfficialArtworkImg
                    src={selectedEntry.cover}
                    artist={selectedEntry.artist}
                    title={selectedEntry.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-[#9CA3AF]">
                      {selectedEntry.releaseType.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-[#9CA3AF]">
                      {selectedEntry.genre}
                    </span>
                    {selectedEntry.isMustPlay && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFBD3F] text-[#0B0D10] flex items-center gap-1">
                        <i className="ph-fill ph-trophy"></i> MUST-PLAY
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-black text-white leading-tight mt-1.5 break-words">
                    {selectedEntry.title}
                  </h2>
                  <p className="text-xs font-bold text-[#9CA3AF] mt-0.5">
                    {selectedEntry.artist}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Released: {selectedEntry.releaseDate}
                  </p>
                </div>
              </div>

              {/* Dual Metascore (Square) & User Score (Circle) Side-by-Side Panel */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                {/* Metascore Box */}
                <div className="bg-[#111318] rounded-lg p-3 border border-white/5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                      METASCORE
                    </p>
                    <p className="text-[11px] font-bold text-white leading-tight mt-1">
                      {selectedEntry.sentimentLabel}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 tabular-nums">
                      {selectedEntry.criticReviews.length} Critic Reviews
                    </p>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-black tabular-nums shrink-0 shadow-md ${getTierBadgeStyle(
                      selectedEntry.colorTier
                    )}`}
                  >
                    {selectedEntry.metascore}
                  </div>
                </div>

                {/* User Score Circle */}
                <div className="bg-[#111318] rounded-lg p-3 border border-white/5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                      USER SCORE
                    </p>
                    <p className="text-[11px] font-bold text-white leading-tight mt-1">
                      {selectedEntry.userSentimentLabel}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 tabular-nums">
                      {selectedEntry.userRatingsCount.toLocaleString()} Ratings
                    </p>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black tabular-nums shrink-0 shadow-md ${getTierBadgeStyle(
                      selectedEntry.userColorTier
                    )}`}
                  >
                    {selectedEntry.userScore.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Review Bombing / Stan Brigade Alert Banner */}
              {selectedEntry.reviewBombingStatus !== 'none' &&
                selectedEntry.reviewBombingNotice && (
                  <div
                    className={`mt-3 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      selectedEntry.reviewBombingStatus === 'rival_review_bombing'
                        ? 'bg-[#FF6874]/10 border-[#FF6874]/40 text-[#FF6874]'
                        : selectedEntry.reviewBombingStatus === 'stan_counter_rally'
                        ? 'bg-[#00CE7A]/10 border-[#00CE7A]/40 text-[#00CE7A]'
                        : 'bg-[#FFBD3F]/10 border-[#FFBD3F]/40 text-[#FFBD3F]'
                    }`}
                  >
                    <i className="ph-fill ph-warning-octagon text-base shrink-0 mt-0.5"></i>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        {selectedEntry.reviewBombingStatus === 'rival_review_bombing'
                          ? 'Unusual User Score Activity • Rival Stan Brigade'
                          : selectedEntry.reviewBombingStatus === 'stan_counter_rally'
                          ? 'Active Fanbase Counter-Rally Detected'
                          : 'High Listener Polarization'}
                      </p>
                      <p className="text-[11px] text-white/90 mt-0.5 leading-relaxed">
                        {selectedEntry.reviewBombingNotice}
                      </p>
                    </div>
                  </div>
                )}

              {/* Distribution Bars: Critic vs User Breakdown */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/10">
                {/* Critic Distribution */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#9CA3AF] mb-2">
                    Critic Distribution
                  </p>
                  {[
                    {
                      label: 'Positive',
                      count: selectedEntry.criticBreakdown.positive,
                      total: selectedEntry.criticBreakdown.total,
                      color: 'bg-[#00CE7A]'
                    },
                    {
                      label: 'Mixed',
                      count: selectedEntry.criticBreakdown.mixed,
                      total: selectedEntry.criticBreakdown.total,
                      color: 'bg-[#FFBD3F]'
                    },
                    {
                      label: 'Negative',
                      count: selectedEntry.criticBreakdown.negative,
                      total: selectedEntry.criticBreakdown.total,
                      color: 'bg-[#FF6874]'
                    }
                  ].map(bar => {
                    const pct =
                      bar.total > 0 ? Math.round((bar.count / bar.total) * 100) : 0;
                    return (
                      <div key={bar.label} className="mb-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-[#9CA3AF] tabular-nums">
                          <span>{bar.label}</span>
                          <span className="text-white">
                            {bar.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full ${bar.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* User Distribution */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#9CA3AF] mb-2">
                    User Distribution
                  </p>
                  {[
                    {
                      label: 'Positive',
                      count: selectedEntry.userBreakdown.positive,
                      total: selectedEntry.userBreakdown.total,
                      color: 'bg-[#00CE7A]'
                    },
                    {
                      label: 'Mixed',
                      count: selectedEntry.userBreakdown.mixed,
                      total: selectedEntry.userBreakdown.total,
                      color: 'bg-[#FFBD3F]'
                    },
                    {
                      label: 'Negative',
                      count: selectedEntry.userBreakdown.negative,
                      total: selectedEntry.userBreakdown.total,
                      color: 'bg-[#FF6874]'
                    }
                  ].map(bar => {
                    const pct =
                      bar.total > 0 ? Math.round((bar.count / bar.total) * 100) : 0;
                    return (
                      <div key={bar.label} className="mb-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-[#9CA3AF] tabular-nums">
                          <span>{bar.label}</span>
                          <span className="text-white">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full ${bar.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strict 5-Gate Metacritic Must-Play Qualification Audit */}
              {selectedEntry.pitchforkRef?.scoringAudit?.mustPlayChecklist && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <i className="ph-fill ph-trophy text-xs text-[#FFBD3F]"></i>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white">
                        Metacritic Must-Play Certification Audit
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        selectedEntry.isMustPlay
                          ? 'bg-[#FFBD3F] text-[#0B0D10]'
                          : 'bg-white/10 text-[#9CA3AF]'
                      }`}
                    >
                      {selectedEntry.isMustPlay ? 'MUST-PLAY AWARDED' : 'NOT QUALIFIED'}
                    </span>
                  </div>

                  <div className="bg-[#111318] border border-white/5 rounded-lg divide-y divide-white/5">
                    {selectedEntry.pitchforkRef.scoringAudit.mustPlayChecklist.map(
                      (gate, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                                gate.passed
                                  ? 'bg-[#00CE7A] text-[#0B0D10]'
                                  : 'bg-[#FF6874]/20 text-[#FF6874]'
                              }`}
                            >
                              {gate.passed ? '✓' : '✕'}
                            </span>
                            <span className="text-[#D1D5DB] font-bold truncate">
                              {gate.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] tabular-nums">
                            <span
                              className={`font-black ${
                                gate.passed ? 'text-[#00CE7A]' : 'text-[#FF6874]'
                              }`}
                            >
                              {gate.currentValue}
                            </span>
                            <span className="text-[#6B7280]">/ {gate.requiredValue}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sub-Tab Toggle: 12 Weighted Publications vs User Reviews */}
            <div className="flex rounded-lg bg-[#1A1D24] p-1 border border-white/10">
              <button
                onClick={() => setDetailSubTab('critics')}
                className={`flex-1 py-2 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  detailSubTab === 'critics'
                    ? 'bg-[#00CE7A] text-[#0B0D10]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Critic Reviews ({selectedEntry.criticReviews.length})
              </button>
              <button
                onClick={() => setDetailSubTab('users')}
                className={`flex-1 py-2 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  detailSubTab === 'users'
                    ? 'bg-[#FFBD3F] text-[#0B0D10]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                User Reviews ({selectedEntry.userReviews.length})
              </button>
            </div>

            {detailSubTab === 'critics' ? (
              /* 12 Weighted Publications Breakdown */
              <div className="space-y-2.5">
                {selectedEntry.criticReviews.map(pub => (
                  <div
                    key={pub.publicationId}
                    className="bg-[#1A1D24] border border-white/10 rounded-xl p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black tabular-nums shrink-0 ${getTierBadgeStyle(
                            pub.colorTier
                          )}`}
                        >
                          {pub.score100}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-white">
                              {pub.publicationName}
                            </h4>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-[#9CA3AF]">
                              {pub.weightLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                            By {pub.criticName} · Original Score:{' '}
                            <span className="text-white font-bold tabular-nums">
                              {pub.originalScoreDisplay}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#6B7280]">
                        {pub.date}
                      </span>
                    </div>

                    <p className="text-xs text-[#D1D5DB] mt-2.5 leading-relaxed">
                      “{pub.quote}”
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* User Reviews & Stan/Hater Reactions */
              <div className="space-y-2.5">
                {selectedEntry.userReviews.map(ur => (
                  <div
                    key={ur.id}
                    className="bg-[#1A1D24] border border-white/10 rounded-xl p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black tabular-nums shrink-0 ${getTierBadgeStyle(
                            ur.colorTier
                          )}`}
                        >
                          {ur.score10}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">
                              {ur.username}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                ur.userTag === 'Rival Stan'
                                  ? 'bg-[#FF6874]/20 text-[#FF6874]'
                                  : ur.userTag === 'Core Fan'
                                  ? 'bg-[#00CE7A]/20 text-[#00CE7A]'
                                  : 'bg-white/10 text-[#9CA3AF]'
                              }`}
                            >
                              {ur.userTag}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#6B7280]">{ur.date}</p>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#9CA3AF] tabular-nums">
                        👍 {ur.helpfulYes}/{ur.helpfulTotal} helpful
                      </span>
                    </div>

                    <p className="text-xs text-[#D1D5DB] mt-2.5 leading-relaxed">
                      {ur.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ==========================================
             MAIN AGGREGATOR CHARTS & PLAYER SUMMARY
             ========================================== */
          <div>
            {/* Player Career Metascore Summary Strip */}
            <div className="bg-[#1A1D24] border-b border-white/10 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9CA3AF]">
                  {state.artist?.name || 'Artist'} · Career Metascore Standing
                </span>
                <span className="text-[10px] font-bold text-[#FFBD3F] tabular-nums">
                  {summary.playerStats.mustPlayCount} Must-Play Trophies
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[#111318] border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Avg Metascore
                  </p>
                  <p className="text-base font-black text-[#00CE7A] tabular-nums mt-0.5">
                    {summary.playerStats.reviewedReleasesCount > 0
                      ? summary.playerStats.avgMetascore
                      : '—'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[#111318] border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Avg User Score
                  </p>
                  <p className="text-base font-black text-[#FFBD3F] tabular-nums mt-0.5">
                    {summary.playerStats.reviewedReleasesCount > 0
                      ? summary.playerStats.avgUserScore.toFixed(1)
                      : '—'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[#111318] border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Acclaim (81+)
                  </p>
                  <p className="text-base font-black text-white tabular-nums mt-0.5">
                    {summary.playerStats.universalAcclaimCount}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[#111318] border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#FFBD3F]">
                    Must-Play
                  </p>
                  <p className="text-base font-black text-[#FFBD3F] tabular-nums mt-0.5">
                    {summary.playerStats.mustPlayCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Sort Bar */}
            <div className="px-4 py-2.5 bg-[#111318] border-b border-white/10 flex items-center gap-2">
              <div className="relative flex-1">
                <i className="ph ph-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter releases by title, artist, genre..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-[#1A1D24] border border-white/10 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#00CE7A]"
                />
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-[#1A1D24] border border-white/10 text-[11px] font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="metascore">Sort: Metascore</option>
                <option value="userscore">Sort: User Score</option>
                <option value="recent">Sort: Recent</option>
              </select>
            </div>

            {/* Release Index List */}
            {filteredEntries.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-base font-black text-white">
                  No Releases Found in This Filter
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs mx-auto">
                  {activeTab === 'player'
                    ? 'Release music in the Studio to see your weighted Metascore and User Score consensus.'
                    : 'Try switching tabs or clearing your search query.'}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2.5">
                {filteredEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setSelectedEntryId(entry.id);
                      setDetailSubTab('critics');
                    }}
                    className="bg-[#1A1D24] hover:bg-[#222630] border border-white/10 rounded-xl p-3 flex items-center gap-3 transition cursor-pointer group"
                  >
                    <span className="text-xs font-mono font-bold text-[#6B7280] w-5 text-center tabular-nums">
                      {idx + 1}
                    </span>

                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                      <OfficialArtworkImg
                        src={entry.cover}
                        artist={entry.artist}
                        title={entry.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] truncate">
                          {entry.artist}
                        </span>
                        {entry.isPlayer && (
                          <span className="px-1.5 py-0.2 rounded bg-[#00CE7A]/20 text-[#00CE7A] text-[8px] font-black uppercase tracking-wider">
                            YOU
                          </span>
                        )}
                        {entry.isMustPlay && (
                          <span className="px-1.5 py-0.2 rounded bg-[#FFBD3F] text-[#0B0D10] text-[8px] font-black uppercase tracking-wider">
                            MUST-PLAY
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-white truncate mt-0.5 group-hover:text-[#00CE7A] transition-colors">
                        {entry.title}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#9CA3AF]">
                        <span>{entry.sentimentLabel}</span>
                        <span>·</span>
                        <span className="tabular-nums">
                          User: <strong className="text-white">{entry.userScore.toFixed(1)}</strong>
                        </span>
                        {entry.reviewBombingStatus === 'rival_review_bombing' && (
                          <span className="text-[#FF6874] font-bold">⚠️ Bombed</span>
                        )}
                      </div>
                    </div>

                    {/* Square Metascore Badge */}
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center text-base font-black tabular-nums shrink-0 shadow-sm ${getTierBadgeStyle(
                        entry.colorTier
                      )}`}
                    >
                      {entry.metascore}
                    </div>
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
