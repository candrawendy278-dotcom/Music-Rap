import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import {
  VMA_CATEGORIES,
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

export default function MtvVmasApp() {
  const { state, setState, openInfo } = useGameContext();
  const [activeTab, setActiveTab] = useState<'categories' | 'voting' | 'archive'>('categories');
  const [selectedField, setSelectedField] = useState<string>('All Categories');
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [liveCeremonySeason, setLiveCeremonySeason] = useState<AwardSeasonRecord | null>(null);
  const [showTrophyRoom, setShowTrophyRoom] = useState(false);

  const awardsState = useMemo(() => getEnsuredAwardsState(state), [state]);
  const currentDate = new Date(state.date || '2026-01-01');
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const targetCeremonyYear =
    currentMonth > 9 || (currentMonth === 9 && currentDate.getDate() > 12)
      ? currentYear + 1
      : currentYear;

  const currentSeasonPreview = useMemo(() => {
    if (
      awardsState.activeSeasons.vmas &&
      awardsState.activeSeasons.vmas.editionYear === targetCeremonyYear
    ) {
      return awardsState.activeSeasons.vmas;
    }
    return simulateAwardSeason(state, 'vmas', targetCeremonyYear, 'nominations_announced');
  }, [state, awardsState, targetCeremonyYear]);

  const isOfficialVotingOpen = Boolean(
    awardsState.activeSeasons.vmas &&
      awardsState.activeSeasons.vmas.editionYear === targetCeremonyYear
  );

  const fields = useMemo(() => {
    const unique = Array.from(new Set(VMA_CATEGORIES.map(c => c.field)));
    return ['All Categories', ...unique];
  }, []);

  const filteredCategories = useMemo(() => {
    return currentSeasonPreview.categories.filter(
      c => selectedField === 'All Categories' || c.field === selectedField
    );
  }, [currentSeasonPreview.categories, selectedField]);

  const vmaArchive = useMemo(
    () => awardsState.history.filter(h => h.show === 'vmas'),
    [awardsState.history]
  );

  const activeArchiveSeason = useMemo(() => {
    if (selectedArchiveId) {
      return vmaArchive.find(h => h.id === selectedArchiveId) || vmaArchive[0] || null;
    }
    return vmaArchive[0] || null;
  }, [vmaArchive, selectedArchiveId]);

  const releasedSongs = useMemo(
    () => (state.songs || []).filter(s => s && s.status === 'released'),
    [state.songs]
  );
  const releasedVideos = useMemo(
    () => releasedSongs.filter(s => s.hasMV),
    [releasedSongs]
  );

  const vmaCampaigns = useMemo(
    () => CAMPAIGN_TIER_OPTIONS.filter(c => c.show === 'vmas'),
    []
  );

  const playerStanding = useMemo(() => {
    const pName = (state.artist?.name || '').toLowerCase();
    return currentSeasonPreview.artistTallies.find(
      t => t.isPlayer || t.artistName.toLowerCase() === pName
    );
  }, [currentSeasonPreview.artistTallies, state.artist?.name]);

  const handleBuyCampaign = (tierId: string) => {
    const res = purchaseAwardCampaignTier(state, 'vmas', tierId);
    if (!res.success) {
      openInfo('MTV VMA Voting Campaign', res.message);
      return;
    }
    setState(res.updatedState);
    openInfo('Fan Voting Campaign Live!', res.message);
  };

  const handleSelectSubmission = (type: 'song' | 'video', idStr: string) => {
    const idVal = idStr === '' ? null : Number(idStr);
    const updated = setPlayerPreferredSubmission(state, 'vmas', type, idVal);
    setState(updated);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#090910] text-white flex flex-col overflow-y-auto animate-fade-in">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 px-5 pt-11 pb-4 bg-[#090910]/95 backdrop-blur-md border-b border-[#FF1E8A]/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setState(p => ({ ...p, activeApp: 'none' }))}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-[#FF1E8A]/40 flex items-center justify-center text-[#FF1E8A] cursor-pointer shrink-0"
          >
            <i className="ph-bold ph-arrow-left text-base"></i>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#00F0FF]">
              MTV · Moon Person Honors
            </p>
            <h1 className="text-lg font-black tracking-tight text-white truncate">
              Video Music Awards
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowTrophyRoom(true)}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FF1E8A]/20 hover:bg-[#FF1E8A]/30 border border-[#FF1E8A]/50 text-xs font-bold text-white flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <i className="ph-fill ph-planet text-sm text-[#00F0FF]"></i>
          <span>Trophy Room</span>
        </button>
      </header>

      <div className="max-w-md mx-auto w-full px-4 py-5 space-y-5 pb-24">
        {/* Hero Stage Card */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-[#230E36] via-[#120C24] to-[#090910] border border-[#FF1E8A]/40 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]">
                {isOfficialVotingOpen
                  ? 'Official VMA Nominations · Fan Voting Open'
                  : 'MTV VMA Eligibility & Visual Tracker'}
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {currentSeasonPreview.editionLabel}
              </h2>
              <p className="text-xs text-neutral-300 mt-1">
                Nominations: Aug {AWARD_CALENDAR_CONFIG.vmas.nominationsDay} · Live Show: Sep {AWARD_CALENDAR_CONFIG.vmas.ceremonyDay}, {targetCeremonyYear}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FF1E8A]/20 border border-[#FF1E8A]/50 flex items-center justify-center shrink-0">
              <i className="ph-fill ph-planet text-2xl text-[#00F0FF]"></i>
            </div>
          </div>

          {/* Player VMA Standing Strip (Zero Spoilers!) */}
          <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-black/45 border border-white/10 text-center">
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                VMA Noms
              </div>
              <div className="text-lg font-black text-[#00F0FF] tabular-nums mt-0.5">
                {playerStanding?.nominations || 0}
              </div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Winners
              </div>
              <div className="text-sm font-black text-white mt-1">
                Sealed · Sep {AWARD_CALENDAR_CONFIG.vmas.ceremonyDay}
              </div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Fan Campaigns
              </div>
              <div className="text-sm font-black text-[#FF1E8A] tabular-nums mt-1">
                {awardsState.vmasCampaign.purchasedCampaignIds.length}/3 Active
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-neutral-300">
              16 Official Categories · Winners Crowned Live on Sep {AWARD_CALENDAR_CONFIG.vmas.ceremonyDay}
            </span>
            <button
              onClick={() => setLiveCeremonySeason(currentSeasonPreview)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF1E8A] to-[#7928CA] text-white text-xs font-black whitespace-nowrap shrink-0 cursor-pointer"
            >
              View Ballot
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'categories', label: '16 Categories' },
            { id: 'voting', label: 'Fan Voting & Promo' },
            { id: 'archive', label: 'VMA Archive' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#FF1E8A] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: 16 VMA CATEGORIES (NO POINTS OR SPOILERS) */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {fields.map(field => (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                    selectedField === field
                      ? 'bg-[#FF1E8A]/25 border-[#FF1E8A] text-[#00F0FF]'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredCategories.map(cat => (
                <div
                  key={cat.categoryId}
                  className="rounded-2xl bg-[#120D1D] border border-[#FF1E8A]/25 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                        {cat.field}
                        {cat.isMajor ? ' · Major Moon Person' : ''}
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
                          nom.isPlayer ? 'bg-[#FF1E8A]/15' : ''
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
                              nom.isPlayer ? 'text-[#00F0FF]' : 'text-neutral-400'
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

        {/* TAB 2: FAN VOTING & SUBMISSIONS */}
        {activeTab === 'voting' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-4 bg-[#120D1D] border border-[#FF1E8A]/30 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                  Automatic Entry + Priority Selection
                </p>
                <h3 className="text-base font-black text-white mt-0.5">
                  Flagship Music Video & Song Selection
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  All your released Music Videos and singles automatically qualify. Choose your lead visual and anthem for MTV VMA screening priority.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Lead Music Video (Video of the Year & Genre Video Categories)
                  </label>
                  <select
                    value={awardsState.vmasCampaign.preferredVideoSongId || ''}
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

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Lead Single (Song of the Year & Song of the Summer)
                  </label>
                  <select
                    value={awardsState.vmasCampaign.preferredSongId || ''}
                    onChange={e => handleSelectSubmission('song', e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="">Auto-Select Flagship Single</option>
                    {releasedSongs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({formatNumFull(s.streams)} streams · {s.genre})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fanbase Voting Mobilization Campaigns */}
            <div className="rounded-2xl p-4 bg-[#120D1D] border border-[#FF1E8A]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                    Stanbase Power Hour
                  </p>
                  <h3 className="text-base font-black text-white mt-0.5">
                    Fan Voting & MTV Broadcast Campaigns
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">
                  Funds: {formatMoney(state.money || 0)}
                </span>
              </div>

              <div className="space-y-3">
                {vmaCampaigns.map(tier => {
                  const isPurchased =
                    awardsState.vmasCampaign.purchasedCampaignIds.includes(tier.id);
                  return (
                    <div
                      key={tier.id}
                      className="p-3.5 rounded-2xl bg-black/45 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white">{tier.name}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{tier.subtitle}</p>
                        <p className="text-[11px] font-bold text-[#00F0FF] mt-1 tabular-nums">
                          Boosts Global Fan Voting Turnout · +{tier.hypeGain}% Hype
                        </p>
                      </div>

                      <button
                        disabled={isPurchased}
                        onClick={() => handleBuyCampaign(tier.id)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer transition-colors ${
                          isPurchased
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-[#FF1E8A] text-white hover:bg-[#FF1E8A]/90'
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

        {/* TAB 3: VMA MOON PERSON ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {vmaArchive.map(season => (
                <button
                  key={season.id}
                  onClick={() => setSelectedArchiveId(season.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border ${
                    activeArchiveSeason?.id === season.id
                      ? 'bg-[#FF1E8A] text-white border-[#FF1E8A]'
                      : 'bg-white/5 text-neutral-400 border-white/10'
                  }`}
                >
                  {season.editionYear} · {season.editionLabel}
                </button>
              ))}
            </div>

            {activeArchiveSeason && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 bg-[#120D1D] border border-[#FF1E8A]/30 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                      Most Moon Persons Won · {activeArchiveSeason.editionYear}
                    </p>
                    <h3 className="text-lg font-black text-white">
                      {activeArchiveSeason.biggestWinner?.artistName} ({activeArchiveSeason.biggestWinner?.wins} Wins)
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {activeArchiveSeason.biggestWinner?.nominations} Total VMA Nominations
                    </p>
                  </div>
                  <button
                    onClick={() => setLiveCeremonySeason(activeArchiveSeason)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#00F0FF] cursor-pointer"
                  >
                    Replay Ceremony
                  </button>
                </div>

                <div className="divide-y divide-white/10 rounded-2xl bg-[#120D1D] border border-white/10 overflow-hidden">
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
                          className="w-11 h-11 rounded-xl object-cover border border-[#FF1E8A]/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] truncate">
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
                        <i className="ph-fill ph-planet text-[#FF1E8A] text-base"></i>
                        <div className="text-[10px] text-[#00F0FF] font-bold">
                          VMA Winner
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
