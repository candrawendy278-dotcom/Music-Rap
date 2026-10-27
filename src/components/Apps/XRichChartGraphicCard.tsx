import React from 'react';
import { XVisualCardPayload } from '../../data/xRichVisualTweetsEngine';
import { formatNumFull } from '../../constants';

interface XRichChartGraphicCardProps {
  visualCard: XVisualCardPayload;
}

export const XRichChartGraphicCard: React.FC<XRichChartGraphicCardProps> = ({ visualCard }) => {
  const { cardType } = visualCard;

  // ---------------------------------------------------------------------------
  // 1. BILLBOARD HOT 100 TOP 10 & BILLBOARD 200 TOP 10 NEON POSTER CARD
  // Matches @talkofthecharts / @billboard neon green (#00F56A) & cyan (#00E5D9) posters
  // ---------------------------------------------------------------------------
  if (
    (cardType === 'billboard_hot100_top10' || cardType === 'billboard_200_top10') &&
    visualCard.billboardRows
  ) {
    const isHot100 = cardType === 'billboard_hot100_top10';
    const accentBg = isHot100 ? 'bg-[#00F56A]' : 'bg-[#00E5D9]';
    const accentText = isHot100 ? 'text-[#00F56A]' : 'text-[#00E5D9]';

    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 bg-[#0C0E11] select-none shadow-lg">
        {/* Top Neon Banner */}
        <div className={`${accentBg} text-black px-4 pt-3 pb-2.5`}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-black text-xl tracking-tighter lowercase leading-none">
              billboard
            </span>
            <span className="text-[8.5px] font-extrabold uppercase tracking-wider opacity-90">
              {visualCard.chartDatedText || 'CHART DATED OCTOBER 31, 2026'}
            </span>
          </div>
          {isHot100 ? (
            <div className="flex items-center gap-1.5">
              <div className="border-[3px] border-black px-2 py-0.5 font-black text-2xl tracking-tight leading-none uppercase">
                HOT
              </div>
              <div className="font-black text-3xl tracking-tighter leading-none">
                100
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="border-[3px] border-black px-2 py-0.5 font-black text-xl tracking-tight leading-none uppercase">
                BILLBOARD
              </div>
              <div className="font-black text-3xl tracking-tighter leading-none">
                200
              </div>
            </div>
          )}
        </div>

        {/* Sub-header with Weeks at No. 1 Pill & LAST WEEK column label */}
        <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between bg-[#0E1014]">
          <div className={`${accentBg} text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full`}>
            {visualCard.weeksAtNo1 || 1} {(visualCard.weeksAtNo1 || 1) === 1 ? 'WEEK' : 'WEEKS'} AT NO. 1
          </div>
          <div className={`text-[8px] font-black uppercase tracking-wider leading-tight text-right ${accentText}`}>
            LAST<br />WEEK
          </div>
        </div>

        {/* Top 10 Rows */}
        <div className="divide-y divide-white/10 px-3.5 pb-2 bg-[#0E1014]">
          {visualCard.billboardRows.map(row => (
            <div
              key={row.rank}
              className={`py-1.5 flex items-center justify-between gap-2 ${
                row.isPlayer ? 'bg-white/[0.04] -mx-3.5 px-3.5' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-4 text-right text-[11px] font-bold text-zinc-400 tabular-nums shrink-0">
                  {row.rank}
                </span>
                <span className="font-black text-[11.5px] text-white uppercase tracking-tight truncate">
                  {row.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10.5px] font-semibold text-zinc-300 truncate max-w-[115px] text-right">
                  {row.artist}
                </span>
                <span
                  className={`w-7 text-right font-black tabular-nums ${
                    row.isNew ? 'text-[9px]' : 'text-[11px]'
                  } ${accentText}`}
                >
                  {row.lastWeekText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. @talkofthecharts EARLY HOT 100 PREDICTIONS TABLE CARD
  // Matches purple/pink gradient header + white clean prediction table
  // ---------------------------------------------------------------------------
  if (cardType === 'totc_predictions_table' && visualCard.predictionRows) {
    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 bg-white text-zinc-900 select-none shadow-lg">
        {/* Gradient Top Banner */}
        <div className="bg-gradient-to-r from-[#2E3192] via-[#8E2DE2] to-[#FF416C] px-4 py-2.5 text-white flex items-center justify-between">
          <div>
            <div className="font-black text-sm tracking-tight leading-tight">
              Early Hot 100 Predictions
            </div>
            <div className="text-[9.5px] text-white/85 font-semibold">
              {visualCard.chartDatedText || 'OCTOBER 31, 2026'} • Talk of the Charts
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center font-black text-xs">
            ⇅
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 px-2.5 py-1.5 bg-[#1B1E38] text-white text-[9px] font-bold uppercase tracking-wider items-center">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-1 text-center">+/-</div>
          <div className="col-span-5 pl-1">Song</div>
          <div className="col-span-2 text-right">Points</div>
          <div className="col-span-1 text-center">%</div>
          <div className="col-span-1 text-center">Pk</div>
          <div className="col-span-1 text-center">WoC</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-zinc-200 text-[10.5px]">
          {visualCard.predictionRows.map((row, idx) => (
            <div
              key={row.rank}
              className={`grid grid-cols-12 px-2.5 py-1.5 items-center ${
                idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'
              }`}
            >
              <div className="col-span-1 text-center font-black text-zinc-900 tabular-nums">
                {row.rank}
              </div>
              <div className="col-span-1 text-center font-extrabold text-[9px] tabular-nums">
                {row.deltaType === 'new' ? (
                  <span className="px-1 py-0.5 rounded bg-amber-400/90 text-black font-black text-[8px]">
                    {row.deltaText}
                  </span>
                ) : row.deltaType === 'up' ? (
                  <span className="text-emerald-600">{row.deltaText}</span>
                ) : row.deltaType === 'down' ? (
                  <span className="text-rose-600">{row.deltaText}</span>
                ) : (
                  <span className="text-zinc-400">=</span>
                )}
              </div>
              <div className="col-span-5 flex items-center gap-1.5 min-w-0 pl-1">
                <img
                  src={row.cover}
                  alt={row.title}
                  className="w-6 h-6 rounded object-cover shrink-0 bg-zinc-200"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0">
                  <div className="font-extrabold text-zinc-900 truncate leading-tight text-[10.5px]">
                    {row.title}
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate leading-tight">
                    {row.artist}
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-right font-bold text-zinc-800 tabular-nums pr-1">
                {row.points}
              </div>
              <div className="col-span-1 text-center">
                {row.pctChangeText === '-' ? (
                  <span className="text-zinc-400 text-[9px]">-</span>
                ) : (
                  <span
                    className={`px-1 py-0.5 rounded text-[8.5px] font-bold tabular-nums ${
                      row.pctPositive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {row.pctChangeText}
                  </span>
                )}
              </div>
              <div className="col-span-1 text-center font-semibold text-zinc-600 tabular-nums text-[9.5px]">
                {row.peak}
              </div>
              <div className="col-span-1 text-center font-semibold text-zinc-600 tabular-nums text-[9.5px]">
                {row.woc}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SPOTIFY CHARTS OFFICIAL SPLIT SHARE CARD
  // Left half: song cover art; Right half: #EAE8E4 card with purple "Top Songs Global",
  // purple #Rank badge, bold song title, artist name, and "Spotify Charts" footer
  // ---------------------------------------------------------------------------
  if (cardType === 'spotify_chart_split_card' && visualCard.spotifySplitCard) {
    const sp = visualCard.spotifySplitCard;
    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 bg-[#EAE8E4] text-black grid grid-cols-12 min-h-[175px] select-none shadow-lg">
        {/* Left Cover Art */}
        <div className="col-span-5 relative bg-zinc-900 overflow-hidden">
          <img
            src={sp.cover}
            alt={sp.songTitle}
            className="w-full h-full object-cover"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-[#1ED760]">
            <i className="ph-fill ph-spotify-logo text-sm"></i>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="col-span-7 p-3.5 flex flex-col justify-between bg-[#EAE8E4]">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[#8E44EC] font-black text-xs leading-tight">
              {sp.chartTitle}
            </span>
            <span className="text-[#8E44EC] font-extrabold text-[8.5px] uppercase tracking-wider text-right">
              {sp.dateLabel}
            </span>
          </div>

          <div className="my-2">
            <span className="inline-block bg-[#8E44EC] text-white font-black text-base px-2.5 py-0.5 rounded-md leading-tight mb-1.5 shadow-sm">
              #{sp.rank}
            </span>
            <div className="font-black text-zinc-950 text-sm leading-tight line-clamp-2">
              {sp.songTitle}
            </div>
            <div className="text-zinc-700 font-bold text-xs mt-0.5 truncate">
              {sp.artistName}
            </div>
            <div className="text-[10px] font-semibold text-zinc-500 mt-0.5">
              {sp.dailyStreamsText}
            </div>
          </div>

          <div className="pt-1.5 border-t border-zinc-300 flex items-center justify-between text-zinc-900">
            <div className="flex items-center gap-1 font-black text-[11px] tracking-tight">
              <i className="ph-fill ph-spotify-logo text-sm"></i>
              <span>Spotify Charts</span>
            </div>
            <span className="text-xs font-bold">➔</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. ALBUM / EP TRACKLIST STREAM BREAKDOWN POSTER CARD
  // Full-bleed cover background with giant album title, track-by-track (+daily) & total table,
  // and giant "Total: XXX,XXX,XXX STREAMS" footer
  // ---------------------------------------------------------------------------
  if (cardType === 'album_streams_poster' && visualCard.albumPoster) {
    const alb = visualCard.albumPoster;
    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 relative bg-zinc-950 text-white select-none shadow-lg">
        {/* Background Cover Art with Dark Gradient Overlay */}
        <img
          src={alb.cover}
          alt={alb.albumTitle}
          className="absolute inset-0 w-full h-full object-cover opacity-35 blur-[1px] scale-105"
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/95" />

        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="text-center mb-3">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#1ED760] mb-0.5">
              {alb.dateLabel}
            </div>
            <div className="font-black text-2xl uppercase tracking-tight text-white leading-none drop-shadow">
              {alb.albumTitle}
            </div>
            <div className="text-[11px] font-bold text-zinc-300 mt-0.5">
              {alb.artistName}
            </div>
          </div>

          {/* Tracklist Table */}
          <div className="rounded-xl bg-black/55 backdrop-blur-md border border-white/15 divide-y divide-white/10 px-3 py-1.5 mb-3">
            {alb.tracks.map((tr, i) => (
              <div
                key={i}
                className="py-1 flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="font-bold text-white truncate flex-1">
                  {tr.title}
                </span>
                <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                  <span className="text-[10px] font-semibold text-emerald-400">
                    (+{formatNumFull(tr.dailyStreams)})
                  </span>
                  <span className="font-extrabold text-white w-20 text-right">
                    {formatNumFull(tr.totalStreams)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Streams Footer */}
          <div className="flex items-center justify-between bg-black/75 border border-white/15 rounded-xl px-3.5 py-2">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                CUMULATIVE SPOTIFY TOTAL (+{formatNumFull(alb.totalDailyStreams)} TODAY)
              </div>
              <div className="font-black text-base text-white tracking-tight tabular-nums">
                Total: {formatNumFull(alb.totalStreams)} STREAMS
              </div>
            </div>
            <i className="ph-fill ph-spotify-logo text-2xl text-[#1ED760]"></i>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 5. YOUTUBE MUSIC DAILY TOP MUSIC VIDEOS CHART SIDE-BY-SIDE CARDS
  // ---------------------------------------------------------------------------
  if (cardType === 'yt_music_daily_mv_cards' && visualCard.ytMusicCards) {
    const yt = visualCard.ytMusicCards;
    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 bg-[#0D0F12] p-2.5 grid grid-cols-2 gap-2 select-none">
        {yt.items.map((item, idx) => (
          <div
            key={item.rank}
            className={`rounded-xl p-2.5 flex flex-col justify-between text-white ${
              idx === 0
                ? 'bg-gradient-to-br from-[#593825] via-[#2E221B] to-[#14110F]'
                : 'bg-gradient-to-br from-[#2B3B4E] via-[#1B2430] to-[#10141B]'
            } border border-white/10`}
          >
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-white/80 mb-1">
                <span className="flex items-center gap-1">
                  <i className="ph-fill ph-youtube-logo text-rose-500 text-xs"></i>
                  Music
                </span>
                <span>{yt.dateLabel}</span>
              </div>
              <div className="text-[9.5px] font-bold text-white/90 leading-tight mb-2">
                Daily Top Music Videos Chart
              </div>
              <div className="relative rounded-lg overflow-hidden aspect-video bg-black mb-2 border border-white/10">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute bottom-1.5 left-1.5 bg-black/85 px-1.5 py-0.5 rounded text-[11px] font-black text-white">
                  #{item.rank}
                </div>
              </div>
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-tight text-white truncate">
                {item.title}
              </div>
              <div className="text-[10px] font-bold text-white/75 truncate">
                {item.artist}
              </div>
              <div className="text-[9px] text-rose-300/90 font-semibold mt-0.5">
                {item.viewsText}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 6. DUAL #1 WORLDWIDE ITUNES + YOUTUBE TRENDING BANNER CARD
  // ---------------------------------------------------------------------------
  if (cardType === 'dual_itunes_yt_no1_banner' && visualCard.dualNo1Banner) {
    const d = visualCard.dualNo1Banner;
    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 grid grid-cols-2 gap-0.5 bg-[#2F3336] select-none">
        {/* Left: Worldwide iTunes Card */}
        <div className="relative bg-zinc-950 p-3 flex flex-col justify-between min-h-[160px] overflow-hidden">
          <img
            src={d.cover}
            alt={d.songTitle}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded bg-purple-600/90 text-white font-black text-[9px] uppercase tracking-wider">
              iTunes Worldwide
            </span>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="font-black text-3xl text-white leading-none tracking-tighter">
              #{d.itunesRank}
            </div>
            <div className="font-black text-xs uppercase text-white truncate mt-1">
              {d.songTitle}
            </div>
            <div className="text-[10px] font-semibold text-zinc-300 truncate">
              {d.artistName} • {d.itunesSalesText}
            </div>
          </div>
        </div>

        {/* Right: YouTube Music Trending Card */}
        <div className="relative bg-zinc-950 p-3 flex flex-col justify-between min-h-[160px] overflow-hidden">
          <img
            src={d.cover}
            alt={d.songTitle}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded bg-rose-600/90 text-white font-black text-[9px] uppercase tracking-wider">
              YouTube Trending
            </span>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="font-black text-3xl text-white leading-none tracking-tighter">
              #{d.ytRank}
            </div>
            <div className="font-black text-xs uppercase text-white truncate mt-1">
              {d.songTitle}
            </div>
            <div className="text-[10px] font-semibold text-zinc-300 truncate">
              {d.artistName} • {d.ytViewsText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 7. DUAL 2-PHOTO COMPARISON GRID (e.g. Biggest Streaming Days on Spotify)
  // ---------------------------------------------------------------------------
  if (cardType === 'dual_comparison_grid' && visualCard.dualComparisonGrid) {
    const g = visualCard.dualComparisonGrid;
    return (
      <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 grid grid-cols-2 gap-0.5 bg-[#2F3336] h-52 select-none">
        <div className="relative bg-zinc-900 overflow-hidden">
          <img
            src={g.leftImage}
            alt={g.leftLabel}
            className="w-full h-full object-cover"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-extrabold text-white">
            {g.leftLabel}
          </div>
        </div>
        <div className="relative bg-zinc-900 overflow-hidden">
          <img
            src={g.rightImage}
            alt={g.rightLabel}
            className="w-full h-full object-cover"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-extrabold text-white">
            {g.rightLabel}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
