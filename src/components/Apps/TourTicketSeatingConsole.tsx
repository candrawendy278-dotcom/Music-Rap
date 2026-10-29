import React, { useState } from 'react';
import {
  SeatingZoneId,
  SEATING_ZONES_SPEC,
  TourVipPerksConfig,
  VIP_PERKS_CATALOG,
  evaluateVipPerksMetrics,
  TierDemandBreakdownItem
} from '../../data/worldTourSystemEngine';
import { formatNum, formatNumFull } from '../../constants';

interface TourTicketSeatingConsoleProps {
  mode: 'planner' | 'active_tour';
  nosebleedPrice: number;
  lowerBowlPrice: number;
  floorStandingPrice: number;
  goldenCirclePrice: number;
  vipPackagePrice: number;
  onChangeZonePrice?: (zoneId: SeatingZoneId, newPrice: number) => void;
  onAutoOptimizePrices?: () => void;
  vipPerks: TourVipPerksConfig;
  onToggleVipPerk?: (perkKey: keyof TourVipPerksConfig) => void;
  antiScalperExchangeEnabled: boolean;
  onToggleAntiScalper?: () => void;
  dynamicPlatinumEnabled: boolean;
  onToggleDynamicPlatinum?: () => void;
  tierBreakdown: Record<SeatingZoneId, TierDemandBreakdownItem>;
  elasticityVerdict: string;
  venueNamePreview?: string;
}

type TicketingSubView = 'seating_map' | 'vip_builder' | 'policies';

export default function TourTicketSeatingConsole({
  mode,
  nosebleedPrice,
  lowerBowlPrice,
  floorStandingPrice,
  goldenCirclePrice,
  vipPackagePrice,
  onChangeZonePrice,
  onAutoOptimizePrices,
  vipPerks,
  onToggleVipPerk,
  antiScalperExchangeEnabled,
  onToggleAntiScalper,
  dynamicPlatinumEnabled,
  onToggleDynamicPlatinum,
  tierBreakdown,
  elasticityVerdict,
  venueNamePreview = 'Sample Stadium Bowl'
}: TourTicketSeatingConsoleProps) {
  const [subView, setSubView] = useState<TicketingSubView>('seating_map');
  const [selectedZone, setSelectedZone] =
    useState<SeatingZoneId>('golden_circle');

  const vipMetrics = evaluateVipPerksMetrics(vipPerks);
  const readOnly = mode === 'active_tour';

  const pricesMap: Record<SeatingZoneId, number> = {
    nosebleed: nosebleedPrice,
    lower_bowl: lowerBowlPrice,
    floor_standing: floorStandingPrice,
    golden_circle: goldenCirclePrice,
    vip_package: vipPackagePrice
  };

  const zoneSliderBounds: Record<
    SeatingZoneId,
    { min: number; max: number; step: number }
  > = {
    nosebleed: { min: 20, max: 220, step: 5 },
    lower_bowl: { min: 40, max: 380, step: 5 },
    floor_standing: { min: 55, max: 460, step: 10 },
    golden_circle: { min: 90, max: 750, step: 15 },
    vip_package: { min: 180, max: 1800, step: 25 }
  };

  const getHeatmapColor = (pct: number) => {
    if (pct >= 95) return '#10B981'; // Emerald Sold Out
    if (pct >= 75) return '#38BDF8'; // Sky Fast Selling
    if (pct >= 50) return '#FBBF24'; // Amber Steady
    return '#F43F5E'; // Rose Resistance
  };

  const activeZoneSpec =
    SEATING_ZONES_SPEC.find(z => z.id === selectedZone) ||
    SEATING_ZONES_SPEC[0];
  const activeZoneData = tierBreakdown[selectedZone];
  const activeBounds = zoneSliderBounds[selectedZone];
  const currentPrice = pricesMap[selectedZone];

  const totalSampleCap = Object.values(tierBreakdown).reduce(
    (s, item) => s + item.capacity,
    0
  );
  const totalSampleSold = Object.values(tierBreakdown).reduce(
    (s, item) => s + item.sold,
    0
  );
  const totalSampleGross = Object.values(tierBreakdown).reduce(
    (s, item) => s + item.gross,
    0
  );
  const overallHeatmapPct = Math.min(
    100,
    Math.round((totalSampleSold / Math.max(1, totalSampleCap)) * 100)
  );

  return (
    <div className="rounded-2xl bg-[#0D111E] border border-white/15 overflow-hidden shadow-2xl">
      {/* Top Box-Office Telemetry Header */}
      <div className="p-3.5 bg-[#121728] border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
              Ticketmaster Stadium Box Office • {venueNamePreview}
            </div>
            <h3 className="text-xs font-black uppercase tracking-wide text-white truncate mt-0.5">
              5-Tier Interactive Seating Map &amp; Dynamic Pricing
            </h3>
          </div>

          <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
            {elasticityVerdict}
          </span>
        </div>

        {/* Mobile Sub-Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-black/55 rounded-xl border border-white/10">
          {[
            { id: 'seating_map' as const, label: '🏟️ 5-Tier Map' },
            {
              id: 'vip_builder' as const,
              label: `💎 VIP Perks (${vipMetrics.activePerksCount}/5)`
            },
            { id: 'policies' as const, label: '🛡️ Bot & Surge' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={`py-2 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 truncate ${
                subView === tab.id
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          SUB-VIEW 1: INTERACTIVE 5-ZONE STADIUM BOWL HEATMAP & TIER PRICING
         ===================================================================== */}
      {subView === 'seating_map' && (
        <div className="p-3.5 space-y-3.5">
          {/* Interactive SVG Stadium Seating Bowl Heatmap */}
          <div className="relative w-full aspect-[16/10.5] rounded-xl bg-[#060912] border border-white/10 overflow-hidden select-none">
            <svg
              viewBox="0 0 480 315"
              className="w-full h-full block"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="bowlAmbientGlow" cx="50%" cy="48%" r="60%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#060912" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="480" height="315" fill="#060912" />
              <rect width="480" height="315" fill="url(#bowlAmbientGlow)" />

              {/* RING 5 (OUTER): 300-LEVEL NOSEBLEED DECK (28% Cap) */}
              <g
                onClick={() => setSelectedZone('nosebleed')}
                className="cursor-pointer"
              >
                <ellipse
                  cx="240"
                  cy="170"
                  rx="222"
                  ry="126"
                  fill={getHeatmapColor(tierBreakdown.nosebleed.selloutPct)}
                  fillOpacity={selectedZone === 'nosebleed' ? '0.36' : '0.18'}
                  stroke={
                    selectedZone === 'nosebleed'
                      ? '#FFFFFF'
                      : getHeatmapColor(tierBreakdown.nosebleed.selloutPct)
                  }
                  strokeWidth={selectedZone === 'nosebleed' ? '2.6' : '1.4'}
                />
                <text
                  x="240"
                  y="286"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  300-LVL NOSEBLEEDS • ${nosebleedPrice} ({tierBreakdown.nosebleed.selloutPct}% SOLD)
                </text>
              </g>

              {/* RING 4: 100-LEVEL LOWER BOWL RESERVED (30% Cap) */}
              <g
                onClick={() => setSelectedZone('lower_bowl')}
                className="cursor-pointer"
              >
                <ellipse
                  cx="240"
                  cy="168"
                  rx="176"
                  ry="98"
                  fill="#080C17"
                />
                <ellipse
                  cx="240"
                  cy="168"
                  rx="176"
                  ry="98"
                  fill={getHeatmapColor(tierBreakdown.lower_bowl.selloutPct)}
                  fillOpacity={selectedZone === 'lower_bowl' ? '0.38' : '0.21'}
                  stroke={
                    selectedZone === 'lower_bowl'
                      ? '#FFFFFF'
                      : getHeatmapColor(tierBreakdown.lower_bowl.selloutPct)
                  }
                  strokeWidth={selectedZone === 'lower_bowl' ? '2.6' : '1.5'}
                />
                <text
                  x="240"
                  y="255"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  100-LVL LOWER BOWL • ${lowerBowlPrice} ({tierBreakdown.lower_bowl.selloutPct}% SOLD)
                </text>
              </g>

              {/* Radial Section Divider Lines on 100/300 Bowls */}
              {[30, 65, 115, 150, 210, 245, 295, 330].map((deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                const x1 = 240 + Math.cos(rad) * 126;
                const y1 = 168 + Math.sin(rad) * 68;
                const x2 = 240 + Math.cos(rad) * 220;
                const y2 = 170 + Math.sin(rad) * 125;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#0F172A"
                    strokeWidth="1.4"
                    pointerEvents="none"
                  />
                );
              })}

              {/* RING 3: MAIN FLOOR STANDING PITCH (22% Cap) */}
              <g
                onClick={() => setSelectedZone('floor_standing')}
                className="cursor-pointer"
              >
                <ellipse
                  cx="240"
                  cy="166"
                  rx="126"
                  ry="68"
                  fill="#070A13"
                />
                <ellipse
                  cx="240"
                  cy="166"
                  rx="126"
                  ry="68"
                  fill={getHeatmapColor(tierBreakdown.floor_standing.selloutPct)}
                  fillOpacity={
                    selectedZone === 'floor_standing' ? '0.42' : '0.22'
                  }
                  stroke={
                    selectedZone === 'floor_standing'
                      ? '#FFFFFF'
                      : getHeatmapColor(tierBreakdown.floor_standing.selloutPct)
                  }
                  strokeWidth={
                    selectedZone === 'floor_standing' ? '2.6' : '1.5'
                  }
                />
                <text
                  x="240"
                  y="222"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="7.2"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  FLOOR PITCH • ${floorStandingPrice} ({tierBreakdown.floor_standing.selloutPct}%)
                </text>
              </g>

              {/* RING 2: GOLDEN CIRCLE FRONT BARRICADE PIT (14% Cap) */}
              <g
                onClick={() => setSelectedZone('golden_circle')}
                className="cursor-pointer"
              >
                <ellipse
                  cx="240"
                  cy="146"
                  rx="84"
                  ry="42"
                  fill="#070A13"
                />
                <ellipse
                  cx="240"
                  cy="146"
                  rx="84"
                  ry="42"
                  fill={getHeatmapColor(tierBreakdown.golden_circle.selloutPct)}
                  fillOpacity={
                    selectedZone === 'golden_circle' ? '0.46' : '0.26'
                  }
                  stroke={
                    selectedZone === 'golden_circle'
                      ? '#FFFFFF'
                      : getHeatmapColor(tierBreakdown.golden_circle.selloutPct)
                  }
                  strokeWidth={selectedZone === 'golden_circle' ? '2.6' : '1.6'}
                />
                <text
                  x="240"
                  y="177"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  GOLDEN CIRCLE • ${goldenCirclePrice} ({tierBreakdown.golden_circle.selloutPct}%)
                </text>
              </g>

              {/* RING 1: VIP SOUNDCHECK & MEET/GREET CLUB PIT (6% Cap) */}
              <g
                onClick={() => setSelectedZone('vip_package')}
                className="cursor-pointer"
              >
                <polygon
                  points="188,112 292,112 276,154 204,154"
                  fill="#080B14"
                />
                <polygon
                  points="188,112 292,112 276,154 204,154"
                  fill={getHeatmapColor(tierBreakdown.vip_package.selloutPct)}
                  fillOpacity={selectedZone === 'vip_package' ? '0.55' : '0.32'}
                  stroke={
                    selectedZone === 'vip_package'
                      ? '#FFFFFF'
                      : getHeatmapColor(tierBreakdown.vip_package.selloutPct)
                  }
                  strokeWidth={selectedZone === 'vip_package' ? '2.6' : '1.6'}
                />
                <text
                  x="240"
                  y="138"
                  textAnchor="middle"
                  fill="#FEF08A"
                  fontSize="6.8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  💎 VIP CLUB • ${vipPackagePrice} ({tierBreakdown.vip_package.selloutPct}%)
                </text>
              </g>

              {/* MAIN STAGE & CATWALK FOOTPRINT AT NORTH END */}
              <g pointerEvents="none">
                <rect
                  x="156"
                  y="54"
                  width="168"
                  height="38"
                  rx="4"
                  fill="#111827"
                  stroke="#F43F5E"
                  strokeWidth="2"
                />
                <polygon
                  points="230,92 250,92 254,132 226,132"
                  fill="#1E293B"
                  stroke="#F43F5E"
                  strokeWidth="1.4"
                />
                <text
                  x="240"
                  y="76"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="1.5"
                >
                  MAIN STAGE &amp; 8K LED WALL
                </text>
              </g>

              {/* Top Overlay Legend */}
              <rect
                x="10"
                y="8"
                width="460"
                height="22"
                rx="5"
                fill="#070A12"
                fillOpacity="0.9"
              />
              <text
                x="20"
                y="22"
                fill="#CBD5E1"
                fontSize="7.5"
                fontFamily="monospace"
              >
                TAP ANY STADIUM RING TO INSPECT &amp; PRICE
              </text>
              <text
                x="460"
                y="22"
                textAnchor="end"
                fill={getHeatmapColor(overallHeatmapPct)}
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                OVERALL DEMAND: {overallHeatmapPct}% ({formatNumFull(totalSampleSold)}/{formatNumFull(totalSampleCap)})
              </text>
            </svg>
          </div>

          {/* 5-Zone Thumb Selector Strip */}
          <div className="grid grid-cols-5 gap-1">
            {SEATING_ZONES_SPEC.map(z => {
              const bd = tierBreakdown[z.id];
              const isSel = selectedZone === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedZone(z.id)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer active:scale-95 ${
                    isSel
                      ? 'bg-rose-500/20 border-rose-400 text-white'
                      : 'bg-black/40 border-white/10 text-zinc-400'
                  }`}
                >
                  <div className="text-[9.5px] font-bold text-white truncate">
                    {z.shortLabel}
                  </div>
                  <div className="text-[10px] font-mono font-black text-amber-300 mt-0.5">
                    ${pricesMap[z.id]}
                  </div>
                  <div
                    className="text-[8.5px] font-mono font-bold mt-0.5"
                    style={{ color: getHeatmapColor(bd.selloutPct) }}
                  >
                    {bd.selloutPct}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Zone Pricing Inspector Card */}
          {activeZoneData && (
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/15 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">
                      {activeZoneSpec.label}
                    </span>
                    <span
                      className="text-[9.5px] font-mono font-bold"
                      style={{
                        color: getHeatmapColor(activeZoneData.selloutPct)
                      }}
                    >
                      · {activeZoneData.statusLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {activeZoneSpec.ringDescription}
                  </p>
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-sm font-black text-white">
                    ${currentPrice}
                  </div>
                  <div className="text-[9.5px] text-zinc-400">
                    {Math.round(activeZoneSpec.capacityShare * 100)}% Venue Cap
                  </div>
                </div>
              </div>

              {!readOnly && onChangeZonePrice && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeZonePrice(
                          selectedZone,
                          Math.max(
                            activeBounds.min,
                            currentPrice - activeBounds.step
                          )
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-mono font-black text-sm cursor-pointer shrink-0"
                    >
                      −
                    </button>

                    <input
                      type="range"
                      min={activeBounds.min}
                      max={activeBounds.max}
                      step={activeBounds.step}
                      value={currentPrice}
                      onChange={e =>
                        onChangeZonePrice(selectedZone, Number(e.target.value))
                      }
                      className="flex-1 accent-rose-500 cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        onChangeZonePrice(
                          selectedZone,
                          Math.min(
                            activeBounds.max,
                            currentPrice + activeBounds.step
                          )
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-mono font-black text-sm cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Zone Telemetry Row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 font-mono text-[10.5px] tabular-nums text-center">
                <div>
                  <span className="text-zinc-400 block font-sans text-[9.5px]">
                    Section Sold
                  </span>
                  <strong className="text-white">
                    {formatNumFull(activeZoneData.sold)} /{' '}
                    {formatNumFull(activeZoneData.capacity)}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block font-sans text-[9.5px]">
                    Sell-Out Rate
                  </span>
                  <strong
                    style={{
                      color: getHeatmapColor(activeZoneData.selloutPct)
                    }}
                  >
                    {activeZoneData.selloutPct}%
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block font-sans text-[9.5px]">
                    Section Gross
                  </span>
                  <strong className="text-emerald-400">
                    ${formatNum(activeZoneData.gross)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Optimize Fair Prices + Total Sample Venue Gross */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="font-mono text-[11px] tabular-nums">
              <span className="text-zinc-400">Est. Show Ticket Gross: </span>
              <strong className="text-emerald-400">
                ${formatNumFull(totalSampleGross)}
              </strong>
            </div>

            {!readOnly && onAutoOptimizePrices && (
              <button
                type="button"
                onClick={onAutoOptimizePrices}
                className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 border border-sky-400/40 text-sky-200 text-[10.5px] font-mono font-bold cursor-pointer"
              >
                ✨ Auto-Balance 5 Tiers
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 2: CUSTOM VIP MEET & GREET PERKS BUILDER
         ===================================================================== */}
      {subView === 'vip_builder' && (
        <div className="p-3.5 space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-amber-300">
                VIP Soundcheck &amp; Meet/Greet Package (${vipPackagePrice})
              </div>
              <div className="text-[10px] font-mono text-zinc-300 mt-0.5">
                Production Cost: ${vipMetrics.costPerVipFan}/fan · Perceived Value Bonus: +${vipMetrics.perceivedValueBonus}
              </div>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-xs font-black text-emerald-400">
                +${Math.max(0, vipPackagePrice - vipMetrics.costPerVipFan)}/fan
              </div>
              <div className="text-[9.5px] text-zinc-400">Net VIP Margin</div>
            </div>
          </div>

          <div className="space-y-2">
            {VIP_PERKS_CATALOG.map(perk => {
              const active = vipPerks[perk.key];
              return (
                <button
                  key={perk.key}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onToggleVipPerk && onToggleVipPerk(perk.key)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-2.5 ${
                    readOnly ? 'cursor-default' : 'cursor-pointer active:scale-99'
                  } ${
                    active
                      ? 'bg-amber-500/15 border-amber-400/50'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white">
                      {perk.label}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {perk.subtitle}
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] tabular-nums shrink-0">
                    <div
                      className={
                        active
                          ? 'text-amber-300 font-black'
                          : 'text-zinc-400 font-bold'
                      }
                    >
                      {active ? 'INCLUDED ✓' : `+$${perk.costPerFan}/fan`}
                    </div>
                    <div className="text-[9px] text-emerald-400">
                      +{perk.valueBonus} Value
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 3: ANTI-SCALPER BOT SHIELD & DYNAMIC PLATINUM PRICING
         ===================================================================== */}
      {subView === 'policies' && (
        <div className="p-3.5 space-y-2.5">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => onToggleAntiScalper && onToggleAntiScalper()}
            className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
              readOnly ? 'cursor-default' : 'cursor-pointer active:scale-99'
            } ${
              antiScalperExchangeEnabled
                ? 'bg-sky-500/15 border-sky-400/50'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-white">
                🛡️ Verified Fan Bot Shield &amp; Face-Value Exchange
              </div>
              <p className="text-[10.5px] text-zinc-400 mt-0.5 leading-relaxed">
                Blocks automated scalper bots and locks ticket resales to 100% original face value. Boosts real fan demand by +9% and protects artist reputation.
              </p>
            </div>
            <span
              className={`font-mono text-[10.5px] font-black shrink-0 ${
                antiScalperExchangeEnabled ? 'text-sky-300' : 'text-zinc-500'
              }`}
            >
              {antiScalperExchangeEnabled ? 'ACTIVE ✓' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            disabled={readOnly}
            onClick={() =>
              onToggleDynamicPlatinum && onToggleDynamicPlatinum()
            }
            className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
              readOnly ? 'cursor-default' : 'cursor-pointer active:scale-99'
            } ${
              dynamicPlatinumEnabled
                ? 'bg-emerald-500/15 border-emerald-400/50'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-white">
                📈 Official Platinum Dynamic Surge Pricing (+18% Yield)
              </div>
              <p className="text-[10.5px] text-zinc-400 mt-0.5 leading-relaxed">
                Automatically surges 100-Level Lower Bowl, Floor &amp; Golden Circle ticket revenue by +18% whenever section sell-out exceeds 85%.
              </p>
            </div>
            <span
              className={`font-mono text-[10.5px] font-black shrink-0 ${
                dynamicPlatinumEnabled ? 'text-emerald-300' : 'text-zinc-500'
              }`}
            >
              {dynamicPlatinumEnabled ? 'ENABLED ✓' : 'OFF'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
