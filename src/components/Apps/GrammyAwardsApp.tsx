import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import {
  GRAMMY_CATEGORIES,
  CAMPAIGN_TIER_OPTIONS,
  AWARD_CALENDAR_CONFIG
} from '../../data/awardsCategoriesConfig';
import {
  getEnsuredAwardsState,
  getAwardShowOpenStatus,
  simulateAwardSeason,
  purchaseAwardCampaignTier,
  setPlayerPreferredSubmission,
  isReleaseEligibleForAwardSeason,
  AwardSeasonRecord
} from '../../data/awardsFormulaAndSimulationEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { formatMoney, formatNumFull } from '../../constants';
import AwardCeremonyLiveModal from '../Modals/AwardCeremonyLiveModal';
import ArtistTrophyRoomModal from '../Modals/ArtistTrophyRoomModal';

export default function GrammyAwardsApp() {
  const { state, setState, openInfo } = useGameContext();
  const [activeTab, setActiveTab] = useState<'categories' | 'fyc' | 'archive'>('categories');
  const [selectedField, setSelectedField] = useState<string>('All Fields');
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [expandedArchiveCatId, setExpandedArchiveCatId] = useState<string | null>(null);
  const [liveCeremonySeason, setLiveCeremonySeason] = useState<AwardSeasonRecord | null>(null);
  const [showTrophyRoom, setShowTrophyRoom] = useState(false);

  const awardsState = useMemo(() => getEnsuredAwardsState(state), [state]);
  const openStatus = useMemo(() => getAwardShowOpenStatus(state, 'grammys'), [state]);
  const targetCeremonyYear = openStatus.targetCeremonyYear;

  const currentSeasonPreview = useMemo(() => {
    if (
      awardsState.activeSeasons.grammys &&
      awardsState.activeSeasons.grammys.editionYear === targetCeremonyYear
    ) {
      return awardsState.activeSeasons.grammys;
    }
    return simulateAwardSeason(state, 'grammys', targetCeremonyYear, 'nominations_announced');
  }, [state, awardsState, targetCeremonyYear]);

  const fields = useMemo(() => {
    const unique = Array.from(new Set(GRAMMY_CATEGORIES.map(c => c.field)));
    return ['All Fields', ...unique];
  }, []);

  const filteredCategories = useMemo(() => {
    return currentSeasonPreview.categories.filter(
      c => selectedField === 'All Fields' || c.field === selectedField
    );
  }, [currentSeasonPreview.categories, selectedField]);

  const grammyArchive = useMemo(
    () => awardsState.history.filter(h => h.show === 'grammys'),
    [awardsState.history]
  );

  const activeArchiveSeason = useMemo(() => {
    if (selectedArchiveId) {
      return grammyArchive.find(h => h.id === selectedArchiveId) || grammyArchive[0] || null;
    }
    return grammyArchive[0] || null;
  }, [grammyArchive, selectedArchiveId]);

  const priorNominatedWorks = useMemo(() => {
    const set = new Set<string>();
    grammyArchive.forEach(h => {
      if (h.editionYear < targetCeremonyYear) {
        h.categories.forEach(cat => {
          if (cat.subjectType !== 'artist') {
            cat.nominees.forEach(n => {
              if (n.workTitle) set.add(n.workTitle.trim().toLowerCase());
            });
          }
        });
      }
    });
    return set;
  }, [grammyArchive, targetCeremonyYear]);

  const releasedSongs = useMemo(
    () =>
      (state.songs || []).filter(
        s =>
          s &&
          s.status === 'released' &&
          !priorNominatedWorks.has((s.title || '').trim().toLowerCase()) &&
          isReleaseEligibleForAwardSeason(s.releaseDate, 'grammys', targetCeremonyYear)
      ),
    [state.songs, priorNominatedWorks, targetCeremonyYear]
  );
  const releasedProjects = useMemo(
    () =>
      (state.projects || []).filter(
        p =>
          p &&
          p.status === 'released' &&
          (p.type === 'album' || p.type === 'ep') &&
          !priorNominatedWorks.has((p.title || '').trim().toLowerCase()) &&
          isReleaseEligibleForAwardSeason(p.releaseDate, 'grammys', targetCeremonyYear)
      ),
    [state.projects, priorNominatedWorks, targetCeremonyYear]
  );
  const releasedVideos = useMemo(
    () => releasedSongs.filter(s => s.hasMV),
    [releasedSongs]
  );

  const grammyCampaigns = useMemo(
    () => CAMPAIGN_TIER_OPTIONS.filter(c => c.show === 'grammys'),
    []
  );

  const playerStanding = useMemo(() => {
    const pName = (state.artist?.name || '').toLowerCase();
    return currentSeasonPreview.artistTallies.find(
      t => t.isPlayer || t.artistName.toLowerCase() === pName
    );
  }, [currentSeasonPreview.artistTallies, state.artist?.name]);

  const handleBuyCampaign = (tierId: string) => {
    const res = purchaseAwardCampaignTier(state, 'grammys', tierId);
    if (!res.success) {
      openInfo('Recording Academy FYC', res.message);
      return;
    }
    setState(res.updatedState);
    openInfo('FYC Campaign Activated', res.message);
  };

  const handleSelectSubmission = (type: 'song' | 'album' | 'video', idStr: string) => {
    const idVal = idStr === '' ? null : Number(idStr);
    const updated = setPlayerPreferredSubmission(state, 'grammys', type, idVal);
    setState(updated);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0A0A0D] text-[#F7F3E8] flex flex-col overflow-y-auto animate-fade-in">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 px-5 pt-11 pb-4 bg-[#0A0A0D]/95 backdrop-blur-md border-b border-[#D4AF37]/25 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setState(p => ({ ...p, activeApp: 'none' }))}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] cursor-pointer shrink-0"
          >
            <i className="ph-bold ph-arrow-left text-base"></i>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
              The Recording Academy
            </p>
            <h1 className="text-lg font-black tracking-tight text-white truncate">
              The GRAMMY Awards
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowTrophyRoom(true)}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-bold text-[#E5C158] flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <i className="ph-fill ph-trophy text-sm"></i>
          <span>Trophy Room</span>
        </button>
      </header>

      <div className="max-w-md mx-auto w-full px-4 py-5 space-y-5 pb-24">
        {/* Hero Prestige Banner */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-[#1C1810] via-[#110F0A] to-[#0A0A0D] border border-[#D4AF37]/35 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                  openStatus.isOpen ? 'text-[#D4AF37]' : 'text-rose-400'
                }`}
              >
                {openStatus.statusBadge}
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {openStatus.headline}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {openStatus.subheadline}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                openStatus.isOpen
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#E5C158]'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
              }`}
            >
              <i className={`ph-fill ${openStatus.isOpen ? 'ph-trophy' : 'ph-lock-key'} text-2xl`}></i>
            </div>
          </div>

          {openStatus.isOpen ? (
            <>
              {/* Player Season Standing Strip (Zero Winner Spoilers!) */}
              <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-black/45 border border-white/10 text-center">
                <div className="p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Your Noms
                  </div>
                  <div className="text-lg font-black text-[#E5C158] tabular-nums mt-0.5">
                    {playerStanding?.nominations || 0}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Envelopes
                  </div>
                  <div className="text-sm font-black text-white mt-1">
                    Sealed · Feb {AWARD_CALENDAR_CONFIG.grammys.ceremonyDay}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    FYC Outreach
                  </div>
                  <div className="text-sm font-black text-emerald-400 tabular-nums mt-1">
                    {awardsState.grammysCampaign.purchasedCampaignIds.length}/3 Active
                  </div>
                </div>
              </div>

              {/* Action to View Official Nominations Ballot */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-neutral-400">
                  20 Official Categories · Max 1 Entry/Artist per Category
                </span>
                <button
                  onClick={() => setLiveCeremonySeason(currentSeasonPreview)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-black whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#E5C158] transition-colors"
                >
                  View Ballot
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-3.5 bg-black/50 border border-rose-500/25 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-rose-300 uppercase tracking-wider">
                  Event Closed
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Next Nominations: {openStatus.nextNominationsDateLabel}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('archive')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-black whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#E5C158] transition-colors"
              >
                Open Archive
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'categories', label: openStatus.isOpen ? '20 Categories' : 'Event Closed' },
            { id: 'fyc', label: 'FYC & Submissions' },
            { id: 'archive', label: 'Archive (Winners & Noms)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: 20 CATEGORIES & OFFICIAL NOMINEES (OR CLOSED PANEL WHEN SEASON HAS CONCLUDED) */}
        {activeTab === 'categories' && (
          openStatus.isOpen ? (
            <div className="space-y-4">
              {/* Field Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {fields.map(field => (
                  <button
                    key={field}
                    onClick={() => setSelectedField(field)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                      selectedField === field
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#E5C158]'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>

              {/* Category Cards */}
              <div className="space-y-4">
                {filteredCategories.map(cat => (
                  <div
                    key={cat.categoryId}
                    className="rounded-2xl bg-[#12110E] border border-[#D4AF37]/25 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          {cat.field}
                          {cat.isMajor ? ' · General Field ("Big Four")' : ''}
                        </p>
                        <h3 className="text-base font-black text-white mt-0.5">
                          {cat.categoryName}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-neutral-400 shrink-0 tabular-nums">
                        {cat.nominees.length} Nominees
                      </span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {cat.nominees.map(nom => (
                        <div
                          key={nom.id}
                          className={`p-3.5 flex items-center justify-between gap-3 ${
                            nom.isPlayer ? 'bg-[#D4AF37]/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <OfficialArtworkImg
                              artist={nom.artistName}
                              title={nom.workTitle === nom.artistName ? undefined : nom.workTitle}
                              explicitSrc={nom.coverArt}
                              isArtistPortrait={nom.workTitle === nom.artistName}
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
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
                            <span
                              className={`text-[11px] font-bold ${
                                nom.isPlayer ? 'text-[#E5C158]' : 'text-neutral-400'
                              }`}
                            >
                              {nom.isPlayer ? 'Your Nomination' : 'Nominee'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-6 bg-[#12110E] border border-[#D4AF37]/30 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-400 flex items-center justify-center mx-auto">
                <i className="ph-fill ph-lock-key text-2xl"></i>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                  Award Event Closed
                </p>
                <h3 className="text-xl font-black text-white">
                  Current GRAMMY Season Has Concluded
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  The live GRAMMY Awards ceremony and ballot for this cycle have ended. Official Nominations for the next edition open on <strong className="text-[#E5C158]">{openStatus.nextNominationsDateLabel}</strong>. You can view all Past Winners and Official Nominations in the Archive at any time.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => setActiveTab('archive')}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-black cursor-pointer hover:bg-[#E5C158] transition-colors"
                >
                  View Past Winners &amp; Nominations
                </button>
                <button
                  onClick={() => setShowTrophyRoom(true)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  Trophy Room
                </button>
              </div>
            </div>
          )
        )}

        {/* TAB 2: FYC CAMPAIGNS & PRIORITY SUBMISSIONS */}
        {activeTab === 'fyc' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-4 bg-[#12110E] border border-[#D4AF37]/30 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  Automatic Eligibility + Flagship Selection
                </p>
                <h3 className="text-base font-black text-white mt-0.5">
                  Priority Academy Submissions
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  All your released tracks and albums enter automatically. Selecting a flagship entry prioritizes it with Recording Academy screening committees.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Flagship Song (Record & Song of the Year + Genre Fields)
                  </label>
                  <select
                    value={awardsState.grammysCampaign.preferredSongId || ''}
                    onChange={e => handleSelectSubmission('song', e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="">Auto-Select Flagship Song</option>
                    {releasedSongs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.genre} · {formatNumFull(s.streams)} streams)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Flagship Album / EP (Album of the Year & Genre Vocal Album)
                  </label>
                  <select
                    value={awardsState.grammysCampaign.preferredAlbumId || ''}
                    onChange={e => handleSelectSubmission('album', e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="">Auto-Select Flagship Project</option>
                    {releasedProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.type.toUpperCase()} · {formatNumFull(p.pureSales)} sales)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Flagship Music Video (Best Music Video)
                  </label>
                  <select
                    value={awardsState.grammysCampaign.preferredVideoSongId || ''}
                    onChange={e => handleSelectSubmission('video', e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="">Auto-Select Flagship Music Video</option>
                    {releasedVideos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.title} ({formatNumFull(v.views)} YouTube views)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* For Your Consideration (FYC) Academy Campaigns */}
            <div className="rounded-2xl p-4 bg-[#12110E] border border-[#D4AF37]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    Recording Academy Outreach
                  </p>
                  <h3 className="text-base font-black text-white mt-0.5">
                    "For Your Consideration" (FYC) Campaigns
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">
                  Funds: {formatMoney(state.money || 0)}
                </span>
              </div>

              <div className="space-y-3">
                {grammyCampaigns.map(tier => {
                  const isPurchased =
                    awardsState.grammysCampaign.purchasedCampaignIds.includes(tier.id);
                  return (
                    <div
                      key={tier.id}
                      className="p-3.5 rounded-2xl bg-black/45 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white">{tier.name}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{tier.subtitle}</p>
                        <p className="text-[11px] font-bold text-[#E5C158] mt-1 tabular-nums">
                          Strengthens Academy Voting Standing · +{tier.hypeGain}% Hype
                        </p>
                      </div>

                      <button
                        disabled={isPurchased}
                        onClick={() => handleBuyCampaign(tier.id)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer transition-colors ${
                          isPurchased
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-[#D4AF37] text-black hover:bg-[#E5C158]'
                        }`}
                      >
                        {isPurchased ? 'Active' : formatMoney(tier.cost)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HALL OF PAST WINNERS & NOMINATIONS ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {grammyArchive.map(season => (
                <button
                  key={season.id}
                  onClick={() => setSelectedArchiveId(season.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border ${
                    activeArchiveSeason?.id === season.id
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                      : 'bg-white/5 text-neutral-400 border-white/10'
                  }`}
                >
                  {season.editionYear} · {season.editionLabel}
                </button>
              ))}
            </div>

            {activeArchiveSeason && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 bg-[#12110E] border border-[#D4AF37]/30 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      Night’s Biggest Winner · {activeArchiveSeason.editionYear}
                    </p>
                    <h3 className="text-lg font-black text-white">
                      {activeArchiveSeason.biggestWinner?.artistName} ({activeArchiveSeason.biggestWinner?.wins} Wins)
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {activeArchiveSeason.biggestWinner?.nominations} Total Nominations · Tap any category to inspect all nominees
                    </p>
                  </div>
                  <button
                    onClick={() => setLiveCeremonySeason(activeArchiveSeason)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#E5C158] cursor-pointer shrink-0"
                  >
                    Replay Ceremony
                  </button>
                </div>

                <div className="divide-y divide-white/10 rounded-2xl bg-[#12110E] border border-white/10 overflow-hidden">
                  {activeArchiveSeason.categories.map(cat => {
                    const isExpanded = expandedArchiveCatId === cat.categoryId;
                    return (
                      <div key={cat.categoryId} className="transition-colors">
                        <button
                          onClick={() =>
                            setExpandedArchiveCatId(isExpanded ? null : cat.categoryId)
                          }
                          className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.03] cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <OfficialArtworkImg
                              artist={cat.winner.artistName}
                              title={
                                cat.winner.workTitle === cat.winner.artistName
                                  ? undefined
                                  : cat.winner.workTitle
                              }
                              explicitSrc={cat.winner.coverArt}
                              isArtistPortrait={cat.winner.workTitle === cat.winner.artistName}
                              className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] truncate">
                                {cat.categoryName}
                              </p>
                              <h4 className="text-sm font-black text-white truncate">
                                {cat.winner.workTitle}
                              </h4>
                              <p className="text-xs text-neutral-400 truncate">
                                Winner: {cat.winner.artistName} · {cat.nominees.length} Nominees
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <i className="ph-fill ph-trophy text-[#D4AF37] text-base"></i>
                              <div className="text-[10px] text-[#E5C158] font-bold">
                                Winner
                              </div>
                            </div>
                            <i
                              className={`ph-bold ${
                                isExpanded ? 'ph-caret-up' : 'ph-caret-down'
                              } text-xs text-neutral-400`}
                            ></i>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 bg-black/40 border-t border-white/5 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 py-1">
                              Official Category Nominees ({activeArchiveSeason.editionYear})
                            </div>
                            {cat.nominees.map(nom => {
                              const isWin =
                                nom.isWinner ||
                                (nom.artistName === cat.winner.artistName &&
                                  nom.workTitle === cat.winner.workTitle);
                              return (
                                <div
                                  key={nom.id}
                                  className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 border ${
                                    isWin
                                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40'
                                      : 'bg-white/[0.02] border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <OfficialArtworkImg
                                      artist={nom.artistName}
                                      title={
                                        nom.workTitle === nom.artistName
                                          ? undefined
                                          : nom.workTitle
                                      }
                                      explicitSrc={nom.coverArt}
                                      isArtistPortrait={nom.workTitle === nom.artistName}
                                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-white truncate">
                                        {nom.workTitle}
                                      </div>
                                      <div className="text-[11px] text-neutral-400 truncate">
                                        {nom.artistName}
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                      isWin ? 'text-[#E5C158]' : 'text-neutral-500'
                                    }`}
                                  >
                                    {isWin ? '★ Winner' : 'Nominee'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {liveCeremonySeason && (
        <AwardCeremonyLiveModal
          season={liveCeremonySeason}
          onClose={() => setLiveCeremonySeason(null)}
        />
      )}

      {showTrophyRoom && (
        <ArtistTrophyRoomModal onClose={() => setShowTrophyRoom(false)} />
      )}
    </div>
  );
}
