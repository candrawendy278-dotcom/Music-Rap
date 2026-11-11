import React, { useMemo, useState } from 'react';
import { GameState } from '../../types';
import { formatNum, formatNumFull } from '../../constants';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';
import { ensureRosterArtistFullFields } from '../../data/recordLabelCeoEngine';
import { getArtistDualContractStatus } from '../../data/rosterGroupAndDualContractEngine';
import {
  createRosterArtistOrFandomXPost,
  generateRosterFandomStatsUpdateTweets,
  getRosterArtistFandomXAccountMeta,
} from '../../data/rosterBrandDealsAndAwardsEngine';
import { XPost } from '../../data/xSocialEngine';
import { XAccountAvatar } from './XAccountAvatar';
import { XRichChartGraphicCard } from './XRichChartGraphicCard';

interface RosterXProfilesAndFandomDrawerProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  selectedArtistId: string;
  onSelectArtistId: (id: string) => void;
  onNotify: (msg: string) => void;
}

export const RosterXProfilesAndFandomDrawer: React.FC<
  RosterXProfilesAndFandomDrawerProps
> = ({ state, setState, selectedArtistId, onSelectArtistId, onNotify }) => {
  const rl = useMemo(() => getEnsuredRecordLabelState(state), [state]);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';

  const rosterList = useMemo(
    () =>
      (rl.imprint.signedRoster || []).map((r) =>
        ensureRosterArtistFullFields(r, dateStr)
      ),
    [rl.imprint.signedRoster, dateStr]
  );

  const currentArtist = useMemo(() => {
    return (
      rosterList.find((a) => a.id === selectedArtistId) || rosterList[0] || null
    );
  }, [rosterList, selectedArtistId]);

  const [accountSubMode, setAccountSubMode] = useState<'official' | 'fandom'>(
    'fandom'
  );
  const [composerText, setComposerText] = useState<string>('');

  const meta = useMemo(
    () =>
      currentArtist
        ? getRosterArtistFandomXAccountMeta(state, currentArtist)
        : null,
    [state, currentArtist]
  );

  const dualStatus = useMemo(
    () => (currentArtist ? getArtistDualContractStatus(currentArtist) : null),
    [currentArtist]
  );

  const rosterFandomTweets = useMemo(
    () => generateRosterFandomStatsUpdateTweets(state),
    [state]
  );

  const filteredPosts = useMemo<XPost[]>(() => {
    if (!currentArtist || !meta) return [];
    const targetHandle =
      accountSubMode === 'official'
        ? meta.officialHandle.toLowerCase()
        : meta.fandomHandle.toLowerCase();

    const customFromState = (state.xPosts || []).filter(
      (p) =>
        (p.authorHandle || '').toLowerCase() === targetHandle ||
        p.id.includes(`_${currentArtist.id}_`)
    );

    const generatedForArtist = rosterFandomTweets.filter((p) => {
      if (accountSubMode === 'official') {
        return (p.authorHandle || '').toLowerCase() === meta.officialHandle.toLowerCase();
      }
      return (p.authorHandle || '').toLowerCase() === meta.fandomHandle.toLowerCase();
    });

    const map = new Map<string, XPost>();
    [...customFromState, ...generatedForArtist].forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [currentArtist, meta, accountSubMode, state.xPosts, rosterFandomTweets]);

  if (!currentArtist || !meta || !dualStatus) {
    return (
      <div className="p-6 text-center text-xs text-[#71767B]">
        Sign at least one Roster Artist in your Record Label CEO Suite to unlock
        Roster X Profiles and Fandom Chart Tracker Accounts.
      </div>
    );
  }

  const releasedSongs = (currentArtist.songs || []).filter(
    (s) => s && s.status === 'released'
  );
  const latestSong = releasedSongs[releasedSongs.length - 1];

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;
    const res = createRosterArtistOrFandomXPost(
      state,
      currentArtist.id,
      composerText,
      accountSubMode === 'official' ? 'official_artist' : 'fandom_hub',
      latestSong?.cover
    );
    if (!res.success) {
      onNotify(res.message);
      return;
    }
    setState(res.nextState);
    setComposerText('');
    onNotify(res.message);
  };

  const applyQuickPrompt = (kind: 'stats' | 'comeback' | 'brand') => {
    if (accountSubMode === 'fandom') {
      if (kind === 'stats' && latestSong) {
        setComposerText(
          `📊 [${meta.fandomName.toUpperCase()} STREAMING PARTY] "${
            latestSong.title
          }" by ${meta.officialName} has now surpassed ${formatNumFull(
            latestSong.streams || 0
          )} Spotify streams & ${formatNumFull(
            latestSong.pureSales || 0
          )} iTunes pure sales! Keep streaming & buying on iTunes! 🔥💿`
        );
      } else if (kind === 'brand' && meta.activeBrandTitles[0]) {
        setComposerText(
          `✨ GLOBAL IMPACT: ${meta.officialName} is trending worldwide following their ${meta.activeBrandTitles[0]} campaign! Drop your favorite look below 👇🖤`
        );
      } else {
        setComposerText(
          `🚨 ${meta.fandomName} MASS VOTING & STREAMING HOUR! Drop your streaming screenshots for ${meta.officialName} below! 🌐📈`
        );
      }
    } else {
      if (kind === 'comeback') {
        setComposerText(
          `Late night studio rehearsals with the ${rl.imprint.imprintName} team. ${meta.fandomName}, are you ready for what's next? 🎙️🖤✨`
        );
      } else if (kind === 'brand' && meta.activeBrandTitles[0]) {
        setComposerText(
          `Honored to represent ${meta.activeBrandTitles[0]} on the global stage. Thank you to ${meta.fandomName} for making this possible ✨👜`
        );
      } else {
        setComposerText(
          `Seeing all of ${meta.fandomName}'s chart updates and love today... thank you for always standing by ${meta.officialName}! ❤️✨`
        );
      }
    }
  };

  const activeName =
    accountSubMode === 'official' ? meta.officialName : meta.fandomAccountName;
  const activeHandle =
    accountSubMode === 'official' ? meta.officialHandle : meta.fandomHandle;
  const activeBio =
    accountSubMode === 'official' ? meta.officialBio : meta.fandomBio;
  const activeFollowers =
    accountSubMode === 'official' ? meta.officialFollowers : meta.fandomFollowers;

  return (
    <div className="flex-1 flex flex-col divide-y divide-[#2F3336]">
      {/* Roster Artist & Group Selector Bar */}
      <div className="bg-[#0B0D10] px-3.5 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#1D9BF0] font-bold">
            ROSTER ARTIST &amp; FANDOM X DIRECTORY ({rosterList.length})
          </span>
          <span className="text-[10px] text-[#71767B]">
            Groups &amp; Soloists Synced
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
          {rosterList.map((art) => {
            const d = getArtistDualContractStatus(art);
            const isSelected = art.id === currentArtist.id;
            const isGrp = Boolean((art as any).isGroupEntity);
            return (
              <button
                key={art.id}
                type="button"
                onClick={() => onSelectArtistId(art.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? isGrp
                      ? 'border-pink-400 bg-pink-500/25 text-white'
                      : 'border-[#1D9BF0] bg-[#1D9BF0]/25 text-white'
                    : 'border-[#2F3336] bg-[#16181C] text-[#71767B] hover:text-white'
                }`}
              >
                <img
                  src={art.avatarUrl || meta.officialAvatar}
                  alt={d.formattedStageName}
                  className="h-4 w-4 rounded-full object-cover"
                />
                <span>{d.formattedStageName}</span>
                {isGrp && (
                  <span className="rounded bg-pink-500/40 px-1 text-[9px] text-pink-200">
                    GROUP
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toggle between Official Artist Account vs Fandom Stats Tracker Account */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setAccountSubMode('official')}
            className={`rounded-xl py-1.5 px-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              accountSubMode === 'official'
                ? 'bg-[#1D9BF0] text-white'
                : 'bg-[#16181C] text-[#71767B] border border-[#2F3336] hover:text-white'
            }`}
          >
            <i className="ph-fill ph-seal-check text-xs"></i>
            <span className="truncate">Official ({meta.officialHandle})</span>
          </button>

          <button
            type="button"
            onClick={() => setAccountSubMode('fandom')}
            className={`rounded-xl py-1.5 px-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              accountSubMode === 'fandom'
                ? 'bg-pink-500 text-white'
                : 'bg-[#16181C] text-pink-300 border border-pink-500/30 hover:text-white'
            }`}
          >
            <i className="ph-fill ph-chart-line-up text-xs"></i>
            <span className="truncate">Fandom Stats ({meta.fandomHandle})</span>
          </button>
        </div>
      </div>

      {/* X Profile Header Card */}
      <div>
        <div
          className={`h-28 relative overflow-hidden flex items-center justify-center ${
            accountSubMode === 'fandom'
              ? 'bg-gradient-to-r from-pink-950 via-purple-950 to-slate-950'
              : 'bg-gradient-to-r from-sky-950 via-indigo-950 to-zinc-950'
          }`}
        >
          <div className="text-center px-4">
            <span className="rounded-full bg-black/60 border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              {accountSubMode === 'fandom'
                ? `${meta.fandomName} • Real-Time Charts & Sales Hub`
                : `${rl.imprint.imprintName} • Official Recording Act`}
            </span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-between items-end -mt-10 mb-2.5">
            <img
              src={meta.officialAvatar}
              alt={activeName}
              className="w-20 h-20 rounded-full border-4 border-black object-cover bg-neutral-900 shadow-xl"
            />
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-[#2F3336] bg-[#16181C] px-3 py-1 text-[11px] font-bold text-[#E7E9EA]">
                Pop {currentArtist.popularity}/100 • Hype {currentArtist.hype}%
              </span>
            </div>
          </div>

          <div className="leading-tight mb-2">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-extrabold text-white">{activeName}</h2>
              <i
                className={`ph-fill ph-seal-check text-base ${
                  meta.isGroup && accountSubMode === 'official'
                    ? 'text-[#E7A33E]'
                    : 'text-[#1D9BF0]'
                }`}
              ></i>
            </div>
            <p className="text-xs text-[#71767B]">{activeHandle}</p>
          </div>

          <p className="text-xs sm:text-sm text-[#E7E9EA] whitespace-pre-line leading-relaxed mb-3">
            {activeBio}
          </p>

          {/* Follower Stats Strip */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="font-bold text-white tabular-nums">
                {meta.officialFollowing}
              </span>{' '}
              <span className="text-[#71767B]">Following</span>
            </div>
            <div>
              <span className="font-bold text-white tabular-nums">
                {formatNumFull(activeFollowers)}
              </span>{' '}
              <span className="text-[#71767B]">Followers</span>
            </div>
            <div>
              <span className="font-bold text-emerald-400 tabular-nums">
                {formatNumFull(currentArtist.totalStreamsGenerated || 0)}
              </span>{' '}
              <span className="text-[#71767B]">Career Streams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Composer for Roster Artist / Fandom Hub */}
      <form onSubmit={handlePublishPost} className="p-3.5 bg-[#050608] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-[#71767B]">
            POSTING AS <strong className="text-white">{activeHandle}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyQuickPrompt('stats')}
              className="rounded-full border border-[#2F3336] bg-[#16181C] px-2.5 py-0.5 text-[10px] font-bold text-[#1D9BF0] hover:bg-[#1D9BF0]/15 cursor-pointer"
            >
              📊 Stats Update
            </button>
            <button
              type="button"
              onClick={() => applyQuickPrompt('comeback')}
              className="rounded-full border border-[#2F3336] bg-[#16181C] px-2.5 py-0.5 text-[10px] font-bold text-pink-400 hover:bg-pink-500/15 cursor-pointer"
            >
              💿 Era Teaser
            </button>
            {meta.activeBrandTitles.length > 0 && (
              <button
                type="button"
                onClick={() => applyQuickPrompt('brand')}
                className="rounded-full border border-[#2F3336] bg-[#16181C] px-2.5 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/15 cursor-pointer"
              >
                👜 Brand Post
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2.5">
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            rows={2}
            placeholder={
              accountSubMode === 'fandom'
                ? `Post a ${meta.fandomName} chart update or streaming party alert...`
                : `Write an official post as ${meta.officialName}...`
            }
            className="flex-1 rounded-xl border border-[#2F3336] bg-black px-3 py-2 text-xs text-white placeholder-[#71767B] focus:outline-none focus:border-[#1D9BF0]"
          />
          <button
            type="submit"
            disabled={!composerText.trim()}
            className="self-end rounded-full bg-[#1D9BF0] px-4 py-2 text-xs font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            Post
          </button>
        </div>
      </form>

      {/* Posts & Visual Chart Cards Feed */}
      <div className="divide-y divide-[#2F3336]">
        {filteredPosts.map((tweet) => (
          <article
            key={tweet.id}
            className="px-4 py-3.5 hover:bg-[#080808] transition flex space-x-3"
          >
            <XAccountAvatar
              authorHandle={tweet.authorHandle}
              authorName={tweet.authorName}
              explicitAvatar={tweet.authorAvatar || meta.officialAvatar}
              playerAvatar={meta.officialAvatar}
              isPlayerPost={false}
              verifiedType={tweet.verifiedType}
              sizeClass="w-10 h-10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1 min-w-0 mb-1">
                <span className="font-bold text-[#E7E9EA] truncate text-sm">
                  {tweet.authorName}
                </span>
                <i
                  className={`ph-fill ph-seal-check text-sm shrink-0 ${
                    tweet.verifiedType === 'gold'
                      ? 'text-[#E7A33E]'
                      : 'text-[#1D9BF0]'
                  }`}
                ></i>
                <span className="text-[#71767B] text-xs truncate">
                  {tweet.authorHandle}
                </span>
                <span className="text-[#71767B] text-xs">·</span>
                <span className="text-[#71767B] text-xs shrink-0">
                  {tweet.timeAgo}
                </span>
              </div>

              <div className="text-[#E7E9EA] text-sm whitespace-pre-wrap leading-snug mb-2.5">
                {tweet.content}
              </div>

              {tweet.visualCard && (
                <XRichChartGraphicCard visualCard={tweet.visualCard} />
              )}

              {!tweet.visualCard && tweet.image && (
                <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2 bg-[#0D0F12] relative">
                  <img
                    src={tweet.image}
                    alt="Post attachment"
                    className="w-full max-h-64 object-cover"
                  />
                  {tweet.mediaBadge && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 border border-white/15 text-[10px] font-extrabold uppercase text-white">
                      {tweet.mediaBadge}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[#71767B] text-xs max-w-xs pt-1">
                <span>💬 {formatNum(tweet.replies)}</span>
                <span>🔁 {formatNum(tweet.reposts)}</span>
                <span>❤️ {formatNum(tweet.likes)}</span>
                <span>📊 {formatNum(tweet.views)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
