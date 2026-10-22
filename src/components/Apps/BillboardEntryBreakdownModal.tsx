import { ChartItem, GameState } from '../../types';
import { formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { ChartMovementBadge } from '../Common/ChartMovementBadge';
import { resolveChartItemMovement } from '../../data/chartMovementAndReEntryEngine';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';
import { buildComprehensiveBillboardBreakdown } from '../../data/enhancedBillboardAnalyticsEngine';

interface BillboardEntryBreakdownModalProps {
  item: ChartItem;
  currPos: number;
  chartLength: number;
  region: string;
  isAlbumChart: boolean;
  state: GameState;
  onClose: () => void;
}

export default function BillboardEntryBreakdownModal({
  item,
  currPos,
  chartLength,
  region,
  isAlbumChart,
  state,
  onClose
}: BillboardEntryBreakdownModalProps) {
  const meta = isAlbumChart
    ? null
    : resolveSongMetadataAndCollabCredits(item, item.artist, state);

  const displayArtist = meta
    ? meta.formattedArtistCredits
    : item.isPlayer
    ? item.artist
    : normalizeRealArtistName(item.artist);

  const primaryArtworkArtist = meta ? meta.primaryArtist : displayArtist.split(',')[0].trim();
  const displayTitle = meta
    ? meta.cleanTitle
    : item.isPlayer
    ? item.title
    : normalizeRealTitle(item.title);

  const move = resolveChartItemMovement(item, currPos, chartLength || 100, state.date);
  const prevPos = move.lastPosition;

  const analytics = buildComprehensiveBillboardBreakdown(
    item,
    region,
    isAlbumChart,
    move,
    state
  );

  let moveText = 'Debut Entry This Week';
  if (move.status === 're-entry') moveText = 'Re-Entry On Chart';
  else if (move.status === 'up') moveText = `Gained +${move.delta} Spots`;
  else if (move.status === 'down') moveText = `Dropped ${move.delta} Spots`;
  else if (move.status === 'equal') moveText = 'Holding Steady (=)';

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-white z-[60] overflow-y-auto pb-12 animate-in slide-in-from-bottom-10 hide-scrollbar">
      {/* Top Sticky Billboard Header */}
      <div className="sticky top-0 bg-white px-4 py-3.5 flex items-center justify-between z-20 border-b-4 border-black shadow-xs">
        <button
          onClick={onClose}
          className="text-black p-2 rounded-full hover:bg-black/5 active:scale-95 transition cursor-pointer"
        >
          <i className="ph-bold ph-arrow-left text-xl" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-black font-serif italic tracking-tighter text-black leading-none">
            billboard
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-0.5">
            Luminate Official Chart Breakdown
          </p>
        </div>
        <div className="px-2 py-1 rounded bg-black text-white text-[9px] font-black uppercase tracking-wider">
          #{currPos}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Track / Album Identity Card */}
        <div className="flex items-start gap-4 border-b border-gray-200 pb-5">
          <div className="flex flex-col items-center shrink-0 min-w-[54px]">
            <span className={`text-5xl font-black tracking-tighter leading-none ${currPos === 1 ? 'text-amber-500' : 'text-black'}`}>
              {currPos}
            </span>
            <div className="mt-2">
              <ChartMovementBadge
                item={item}
                currentRank={currPos}
                chartLimit={chartLength || 100}
                currentDate={state.date}
                variant="billboard"
              />
            </div>
          </div>

          <OfficialArtworkImg
            artist={primaryArtworkArtist}
            title={displayTitle}
            explicitSrc={item.cover}
            isAlbum={isAlbumChart}
            isPlayer={item.isPlayer}
            alt={displayTitle}
            className="w-24 h-24 bg-gray-100 shadow-md shrink-0 object-cover rounded-md border border-gray-200"
          />

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-900 text-white">
                {analytics.chartTypeLabel}
              </span>
              {item.isPlayer && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400 text-black">
                  Your Release
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-black leading-tight break-words">
              {displayTitle}
            </h2>
            <h3 className="text-sm font-bold text-gray-600 mt-0.5 break-words">
              {displayArtist}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-bold text-gray-500">
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                LW: <strong className="text-black">{prevPos ?? (move.status === 're-entry' ? 'RE' : 'NEW')}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                PEAK: <strong className="text-black">#{move.peakPosition}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                WKS: <strong className="text-black">{move.weeksOnChart}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Chart Performance Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="border-2 border-black rounded-xl p-3 flex flex-col items-center justify-center text-center bg-gray-50">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              {isAlbumChart ? 'Equivalent Units' : 'Chart Points'}
            </div>
            <div className="text-xl font-black text-black my-1">
              {formatNumFull(analytics.totalWeeklyUnits)}
            </div>
            <div className="text-[9px] text-gray-500 font-bold uppercase">
              This Tracking Week
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Velocity
            </div>
            <div
              className={`text-xl font-black my-1 ${
                move.status === 'up'
                  ? 'text-emerald-600'
                  : move.status === 'down'
                  ? 'text-rose-600'
                  : move.status === 're-entry'
                  ? 'text-purple-700'
                  : move.status === 'new'
                  ? 'text-amber-600'
                  : 'text-gray-700'
              }`}
            >
              {move.badgeText}
            </div>
            <div className="text-[9px] text-gray-500 font-bold uppercase line-clamp-1">
              {moveText}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Next Wk Pace
            </div>
            <div className="text-lg font-black text-indigo-700 my-1">
              {formatNumFull(analytics.pacingNextWeekProjection)}
            </div>
            <div className="text-[9px] text-gray-500 font-bold uppercase">
              Projected Units
            </div>
          </div>
        </div>

        {/* Component Point Share Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <i className="ph-fill ph-chart-pie-slice text-blue-600 text-base" />
              <span>Formula Point Contribution</span>
            </span>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded uppercase">
              {analytics.regionLabel}
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-gray-200 overflow-hidden flex my-3 shadow-inner">
            <div
              style={{ width: `${analytics.share1Pct}%` }}
              className={`${analytics.share1Color} h-full transition-all`}
            />
            <div
              style={{ width: `${analytics.share2Pct}%` }}
              className={`${analytics.share2Color} h-full transition-all`}
            />
            {analytics.share3Pct > 0 && (
              <div
                style={{ width: `${analytics.share3Pct}%` }}
                className={`${analytics.share3Color} h-full transition-all`}
              />
            )}
          </div>

          {/* Share Legend Rows */}
          <div className="space-y-2.5 mt-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-xs ${analytics.share1Color} shrink-0`} />
                <div>
                  <div className="font-black text-gray-900">{analytics.share1Label}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{analytics.share1Subtext}</div>
                </div>
              </div>
              <span className="font-black text-sm text-black">{analytics.share1Pct}%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-xs ${analytics.share2Color} shrink-0`} />
                <div>
                  <div className="font-black text-gray-900">{analytics.share2Label}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{analytics.share2Subtext}</div>
                </div>
              </div>
              <span className="font-black text-sm text-black">{analytics.share2Pct}%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-xs ${analytics.share3Color} shrink-0`} />
                <div>
                  <div className="font-black text-gray-900">{analytics.share3Label}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{analytics.share3Subtext}</div>
                </div>
              </div>
              <span className="font-black text-sm text-black">{analytics.share3Pct}%</span>
            </div>
          </div>
        </div>

        {/* Detailed Metric Cards (Album vs Single specific) */}
        {isAlbumChart ? (
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2.5">
              Billboard 200 Album Equivalent Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>PURE ALBUM SALES</span>
                  <i className="ph-fill ph-vinyl-record text-emerald-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {formatNumFull(analytics.pureAlbumSales)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Physical CD, Vinyl & Digital Full Copies
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>SEA UNITS</span>
                  <i className="ph-fill ph-headphones text-blue-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {formatNumFull(analytics.seaUnits)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  From {formatNumFull(analytics.albumOnDemandStreams)} track streams
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>TEA UNITS</span>
                  <i className="ph-fill ph-download-simple text-amber-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {formatNumFull(analytics.teaUnits)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  From {formatNumFull(analytics.individualTrackSales)} song downloads
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>CERTIFICATION PACE</span>
                  <i className="ph-fill ph-seal-check text-purple-600 text-base" />
                </div>
                <div className="text-xs font-black text-black leading-snug mt-1">
                  {analytics.certificationStatus}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {move.weeksOnChart} weeks on Billboard 200
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2.5">
              Luminate Weekly Consumption Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>AUDIO STREAMS</span>
                  <i className="ph-fill ph-spotify-logo text-emerald-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {formatNumFull(analytics.onDemandAudioStreams)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Paid & Ad-Supported DSP Audio
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>VIDEO STREAMS</span>
                  <i className="ph-fill ph-youtube-logo text-rose-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {formatNumFull(analytics.videoStreams)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Official Music Video & Visualizers
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>PURE TRACK SALES</span>
                  <i className="ph-fill ph-shopping-bag text-blue-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {formatNumFull(analytics.pureDigitalSales)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  iTunes, Digital & Physical Single
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>RADIO AIRPLAY</span>
                  <i className="ph-fill ph-broadcast text-purple-600 text-base" />
                </div>
                <div className="text-lg font-black text-black">
                  {region === 'global' ? 'N/A (Global)' : formatNumFull(analytics.radioAirplayImpressions)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {region === 'global' ? 'Streams + Sales Only' : 'Audience Impressions'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Official Chart Methodology & Market Box */}
        <div className="bg-black text-white rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Official Billboard Methodology
            </span>
            <span className="text-[10px] font-bold text-white/70">
              {analytics.certificationStatus}
            </span>
          </div>
          <p className="text-xs text-white/85 leading-relaxed">
            {analytics.formulaSummaryText}
          </p>
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/70">
            <span>{analytics.territorialHighlight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
