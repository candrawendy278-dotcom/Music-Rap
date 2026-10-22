import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import {
  GRAMMY_CATEGORIES,
  CAMPAIGN_TIER_OPTIONS,
  AWARD_CALENDAR_CONFIG
} from '../../data/awardsCategoriesConfig';
import {
  getEnsuredAwardsState,
  simulateAwardSeason,
  purchaseAwardCampaignTier,
  setPlayerPreferredSubmission,
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
  const [liveCeremonySeason, setLiveCeremonySeason] = useState<AwardSeasonRecord | null>(null);
  const [showTrophyRoom, setShowTrophyRoom] = useState(false);

  const awardsState = useMemo(() => getEnsuredAwardsState(state), [state]);
  const currentDate = new Date(state.date || '2026-01-01');
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const targetCeremonyYear =
    currentMonth > 2 || (currentMonth === 2 && currentDate.getDate() > 5)
      ? currentYear + 1
      : currentYear;

  const currentSeasonPreview = useMemo(() => {
    if (
      awardsState.activeSeasons.grammys &&
      awardsState.activeSeasons.grammys.editionYear === targetCeremonyYear
    ) {
      return awardsState.activeSeasons.grammys;
    }
    return simulateAwardSeason(state, 'grammys', targetCeremonyYear, 'nominations_announced');
  }, [state, awardsState, targetCeremonyYear]);

  const isOfficialNominationsLocked = Boolean(
    awardsState.activeSeasons.grammys &&
      awardsState.activeSeasons.grammys.editionYear === targetCeremonyYear
  );

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

  const releasedSongs = useMemo(
    () => (state.songs || []).filter(s => s && s.status === 'released'),
    [state.songs]
  );
  const releasedProjects = useMemo(
    () =>
      (state.projects || []).filter(
        p => p && p.status === 'released' && (p.type === 'album' || p.type === 'ep')
      ),
    [state.projects]
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
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                {isOfficialNominationsLocked
                  ? 'Official Nominations Ballot · Winners Sealed'
                  : 'Recording Academy Eligibility Window'}
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {currentSeasonPreview.editionLabel}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Nominations: Nov {AWARD_CALENDAR_CONFIG.grammys.nominationsDay} · Ceremony Night: Feb {AWARD_CALENDAR_CONFIG.grammys.ceremonyDay}, {targetCeremonyYear}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <i className="ph-fill ph-trophy text-2xl text-[#E5C158]"></i>
            </div>
          </div>

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
              20 Official Categories · Winners Announced Live on Feb {AWARD_CALENDAR_CONFIG.grammys.ceremonyDay}
            </span>
            <button
              onClick={() => setLiveCeremonySeason(currentSeasonPreview)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-black whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#E5C158] transition-colors"
            >
              View Ballot
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'categories', label: '20 Categories' },
            { id: 'fyc', label: 'FYC & Submissions' },
            { id: 'archive', label: 'Past Winners' }
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

        {/* TAB 1: 20 CATEGORIES & OFFICIAL NOMINEES (NO POINTS OR SPOILERS) */}
        {activeTab === 'categories' && (
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

        {/* TAB 3: HALL OF PAST WINNERS ARCHIVE */}
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
                <div className="rounded-2xl p-4 bg-[#12110E] border border-[#D4AF37]/30 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      Night’s Biggest Winner · {activeArchiveSeason.editionYear}
                    </p>
                    <h3 className="text-lg font-black text-white">
                      {activeArchiveSeason.biggestWinner?.artistName} ({activeArchiveSeason.biggestWinner?.wins} Wins)
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {activeArchiveSeason.biggestWinner?.nominations} Total Nominations
                    </p>
                  </div>
                  <button
                    onClick={() => setLiveCeremonySeason(activeArchiveSeason)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#E5C158] cursor-pointer"
                  >
                    Replay Ceremony
                  </button>
                </div>

                <div className="divide-y divide-white/10 rounded-2xl bg-[#12110E] border border-white/10 overflow-hidden">
                  {activeArchiveSeason.categories.map(cat => (
                    <div key={cat.categoryId} className="p-3.5 flex items-center justify-between gap-3">
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
                            Winner: {cat.winner.artistName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <i className="ph-fill ph-trophy text-[#D4AF37] text-base"></i>
                        <div className="text-[10px] text-[#E5C158] font-bold">
                          GRAMMY Winner
                        </div>
                      </div>
                    </div>
                  ))}
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
