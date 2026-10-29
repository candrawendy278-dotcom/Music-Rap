import React, { useState, useMemo } from 'react';
import {
  GLOBAL_TOUR_CITIES,
  TourCityDefinition,
  TourRegionId,
  VenueTierId
} from '../../data/worldTourSystemEngine';
import { formatNumFull } from '../../constants';

interface TourWorldMapProps {
  /** Stops either from an active tour or from the tour planner draft */
  stops: Array<{
    cityId: string;
    venueTier: VenueTierId;
    status?: 'scheduled' | 'completed' | 'cancelled';
    nightNumber?: number;
    presaleSelloutPct?: number;
  }>;
  selectedCityId: string | null;
  onSelectCity: (city: TourCityDefinition) => void;
  interactiveMode?: 'active_tour' | 'planner';
  onQuickAddCityStop?: (cityId: string, venueTier: VenueTierId) => void;
  recommendedTierByCity?: Record<string, VenueTierId>;
}

const REGION_CAMERA_VIEWBOX: Record<TourRegionId | 'all', string> = {
  all: '0 0 1000 520',
  north_america: '95 95 265 180',
  latin_america: '165 215 255 230',
  europe: '425 78 175 128',
  middle_east: '545 155 190 140',
  asia: '700 145 210 198',
  oceania: '775 330 175 125'
};

export default function TourWorldMap({
  stops,
  selectedCityId,
  onSelectCity,
  interactiveMode = 'active_tour',
  onQuickAddCityStop,
  recommendedTierByCity = {}
}: TourWorldMapProps) {
  const [regionFilter, setRegionFilter] = useState<TourRegionId | 'all'>('all');

  const isZoomed = regionFilter !== 'all';
  const cameraViewBox = REGION_CAMERA_VIEWBOX[regionFilter] || REGION_CAMERA_VIEWBOX.all;

  // Build ordered city sequence for flight route arcs & total distance calculation
  const orderedStopCities = useMemo(() => {
    const list: Array<{
      city: TourCityDefinition;
      status: string;
      index: number;
    }> = [];
    stops.forEach((st, idx) => {
      const found = GLOBAL_TOUR_CITIES.find(c => c.id === st.cityId);
      if (found) {
        list.push({
          city: found,
          status: st.status || 'scheduled',
          index: idx + 1
        });
      }
    });
    return list;
  }, [stops]);

  const totalFlightKm = useMemo(() => {
    let distUnits = 0;
    for (let i = 1; i < orderedStopCities.length; i++) {
      const a = orderedStopCities[i - 1].city;
      const b = orderedStopCities[i].city;
      distUnits += Math.hypot(b.mapX - a.mapX, b.mapY - a.mapY);
    }
    return Math.round(distUnits * 38.5);
  }, [orderedStopCities]);

  const nextLiveStopCityId = stops.find(
    s => !s.status || s.status === 'scheduled'
  )?.cityId;

  const selectedCity =
    GLOBAL_TOUR_CITIES.find(c => c.id === selectedCityId) ||
    orderedStopCities[0]?.city ||
    GLOBAL_TOUR_CITIES[0];

  const pinScale = isZoomed ? 0.55 : 1;

  return (
    <div className="rounded-2xl bg-[#070A12] border border-white/15 overflow-hidden shadow-2xl">
      {/* Top Satellite Navigation Header & Region Camera Zoom */}
      <div className="px-3.5 py-2.5 bg-[#0D121F] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-white">
              Global Flight Routing & Venue Satellite
            </div>
            <div className="text-[9px] font-mono text-zinc-400">
              {stops.length} Scheduled Stops • {formatNumFull(totalFlightKm)} km Air Charter Distance
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as const, label: 'World View' },
            { id: 'north_america' as const, label: 'N. America' },
            { id: 'europe' as const, label: 'Europe' },
            { id: 'asia' as const, label: 'Asia' },
            { id: 'latin_america' as const, label: 'LATAM' },
            { id: 'oceania' as const, label: 'Oceania' }
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegionFilter(r.id)}
              className={`px-2 py-1 rounded-md text-[9.5px] font-mono font-bold transition cursor-pointer shrink-0 ${
                regionFilter === r.id
                  ? 'bg-sky-400 text-zinc-950 shadow-xs'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-Precision Cartographic SVG World Map with Dynamic Camera Zoom */}
      <div className="relative w-full aspect-[1000/520] bg-[#050811] select-none overflow-hidden">
        <svg
          viewBox={cameraViewBox}
          className="w-full h-full block transition-all duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="mapOceanRadial" cx="50%" cy="48%" r="65%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.14" />
              <stop offset="60%" stopColor="#1E1B4B" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#050811" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="landmassFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#131D31" />
              <stop offset="100%" stopColor="#0D1424" />
            </linearGradient>

            <linearGradient id="flightRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
          </defs>

          {/* Deep Ocean Base */}
          <rect width="1000" height="520" fill="#050811" />
          <rect width="1000" height="520" fill="url(#mapOceanRadial)" />

          {/* Cartographic Graticule Grid & Coordinate Labels */}
          {Array.from({ length: 19 }).map((_, i) => (
            <line
              key={`lon_${i}`}
              x1={(i + 1) * 50}
              y1="0"
              x2={(i + 1) * 50}
              y2="520"
              stroke="#1E293B"
              strokeWidth={isZoomed ? '0.4' : '0.7'}
              strokeOpacity="0.65"
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`lat_${i}`}
              x1="0"
              y1={(i + 1) * 52}
              x2="1000"
              y2={(i + 1) * 52}
              stroke="#1E293B"
              strokeWidth={isZoomed ? '0.4' : '0.7'}
              strokeOpacity="0.65"
            />
          ))}

          {/* Equator & Tropics Reference Lines */}
          <line
            x1="0"
            y1="268"
            x2="1000"
            y2="268"
            stroke="#38BDF8"
            strokeOpacity="0.28"
            strokeWidth={isZoomed ? '0.6' : '1'}
            strokeDasharray="4 4"
          />
          {!isZoomed && (
            <g fill="#475569" fontSize="7" fontFamily="monospace">
              <text x="10" y="100">60°N</text>
              <text x="10" y="182">30°N</text>
              <text x="10" y="264" fill="#38BDF8" opacity="0.7">0° EQUATOR</text>
              <text x="10" y="366">30°S</text>
            </g>
          )}

          {/* Smooth High-Craft Continental Vector Landmasses */}
          <g
            fill="url(#landmassFill)"
            stroke="#334155"
            strokeWidth={isZoomed ? '0.9' : '1.4'}
            strokeLinejoin="round"
          >
            {/* North America & Central America */}
            <path d="M 52 84 Q 95 62 165 64 L 245 72 L 312 96 L 306 138 L 292 166 L 278 192 L 268 224 L 254 222 L 244 210 L 218 228 L 216 254 L 254 274 L 236 278 L 194 252 L 166 218 L 146 196 L 136 164 L 105 132 L 58 116 Z" />
            {/* Greenland & Iceland */}
            <path d="M 328 36 Q 375 28 418 38 L 402 82 L 344 78 Z" />
            <path d="M 426 92 L 446 90 L 444 102 L 424 100 Z" />
            {/* South America */}
            <path d="M 254 274 L 308 272 L 352 302 L 382 342 L 368 388 L 336 436 L 316 476 L 296 468 L 288 412 L 272 356 L 248 312 Z" />
            {/* UK & Ireland */}
            <path d="M 458 118 L 478 116 L 482 142 L 462 144 Z" />
            <path d="M 446 126 L 456 125 L 456 138 L 446 138 Z" />
            {/* Scandinavia */}
            <path d="M 495 68 L 542 62 L 562 88 L 542 122 L 516 122 L 496 98 Z" />
            {/* Continental Europe & Mediterranean */}
            <path d="M 462 148 L 498 134 L 548 128 L 596 122 L 592 166 L 558 182 L 528 186 L 518 168 L 502 178 L 464 186 L 454 166 Z" />
            {/* Africa & Madagascar */}
            <path d="M 452 194 L 518 192 L 568 202 L 618 248 L 606 318 L 572 396 L 532 426 L 504 398 L 492 332 L 474 282 L 442 252 Z" />
            <path d="M 608 358 L 622 354 L 618 392 L 604 388 Z" />
            {/* Eurasia, Middle East, India & East Asia */}
            <path d="M 596 86 L 745 72 L 898 88 L 912 132 L 866 172 L 842 224 L 806 258 L 768 286 L 748 256 L 702 276 L 676 238 L 638 242 L 602 224 L 588 172 Z" />
            {/* Japan & Korean Peninsula */}
            <path d="M 808 174 L 824 174 L 824 196 L 810 196 Z" />
            <path d="M 842 168 L 868 176 L 862 208 L 838 202 Z" />
            {/* Philippines & Maritime Southeast Asia (Indonesia / Malaysia) */}
            <path d="M 812 242 L 828 246 L 826 272 L 810 268 Z" />
            <path d="M 748 288 L 796 294 L 844 304 L 848 326 L 762 324 L 744 306 Z" />
            {/* Australia & New Zealand */}
            <path d="M 784 352 Q 842 342 894 354 L 906 406 L 864 428 L 818 422 L 778 396 Z" />
            <path d="M 924 416 L 948 422 L 938 454 L 918 446 Z" />
          </g>

          {/* Animated Curved Flight Route Paths Between Scheduled Tour Stops */}
          {orderedStopCities.map((item, idx) => {
            if (idx === 0) return null;
            const prev = orderedStopCities[idx - 1].city;
            const curr = item.city;
            if (prev.id === curr.id) return null;

            const midX = (prev.mapX + curr.mapX) / 2;
            const dist = Math.hypot(curr.mapX - prev.mapX, curr.mapY - prev.mapY);
            const arcLift = Math.min(75, Math.max(18, dist * 0.2));
            const midY = Math.min(prev.mapY, curr.mapY) - arcLift;

            const isCompletedLeg = item.status === 'completed';

            return (
              <g key={`arc_${prev.id}_${curr.id}_${idx}`}>
                <path
                  d={`M ${prev.mapX} ${prev.mapY} Q ${midX} ${midY} ${curr.mapX} ${curr.mapY}`}
                  fill="none"
                  stroke={isCompletedLeg ? '#10B981' : '#38BDF8'}
                  strokeWidth={3.2 * pinScale}
                  strokeOpacity="0.22"
                />
                <path
                  d={`M ${prev.mapX} ${prev.mapY} Q ${midX} ${midY} ${curr.mapX} ${curr.mapY}`}
                  fill="none"
                  stroke={isCompletedLeg ? '#10B981' : 'url(#flightRouteGrad)'}
                  strokeWidth={1.6 * pinScale}
                  strokeDasharray={isCompletedLeg ? 'none' : `${4 * pinScale} ${3 * pinScale}`}
                />
              </g>
            );
          })}

          {/* City Nodes & Clean Non-Overlapping Callout Badges */}
          {GLOBAL_TOUR_CITIES.map(city => {
            const matchingStops = stops.filter(s => s.cityId === city.id);
            const isInTour = matchingStops.length > 0;
            const allCompleted =
              isInTour && matchingStops.every(s => s.status === 'completed');
            const isNextLive = city.id === nextLiveStopCityId;
            const isSelected = selectedCity?.id === city.id;
            const firstStopOrder =
              stops.findIndex(s => s.cityId === city.id) + 1;

            const pinColor = isNextLive
              ? '#FBBF24'
              : allCompleted
              ? '#10B981'
              : isInTour
              ? '#F43F5E'
              : '#64748B';

            // Smart label visibility: show label if city is in tour, is selected, or we are zoomed into its region
            const showLabel = isInTour || isSelected || isZoomed;
            const labelX = city.mapX + city.labelDx * pinScale;
            const labelY = city.mapY + city.labelDy * pinScale;

            return (
              <g
                key={city.id}
                onClick={() => onSelectCity(city)}
                className="cursor-pointer"
              >
                {/* Leader Line connecting City Node to its non-overlapping Callout Label */}
                {showLabel && (
                  <line
                    x1={city.mapX}
                    y1={city.mapY}
                    x2={labelX}
                    y2={labelY}
                    stroke={isSelected || isInTour ? pinColor : '#475569'}
                    strokeWidth={0.85 * pinScale}
                    strokeOpacity="0.75"
                  />
                )}

                {/* Invisible Mobile Thumb Touch Hit Target (18px radius) */}
                <circle
                  cx={city.mapX}
                  cy={city.mapY}
                  r={18 * pinScale}
                  fill="transparent"
                />

                {/* Outer Radar Halo for Selected or Active Tour Stop */}
                {(isSelected || isNextLive || isInTour) && (
                  <circle
                    cx={city.mapX}
                    cy={city.mapY}
                    r={(isSelected ? 11.5 : isNextLive ? 9.5 : 7) * pinScale}
                    fill={pinColor}
                    fillOpacity={isSelected ? '0.34' : '0.2'}
                    stroke={pinColor}
                    strokeWidth={(isSelected ? 1.5 : 0.9) * pinScale}
                  />
                )}

                {/* Main City Satellite Node */}
                <circle
                  cx={city.mapX}
                  cy={city.mapY}
                  r={(isInTour || isSelected ? 4.8 : 3.4) * pinScale}
                  fill={pinColor}
                  stroke="#FFFFFF"
                  strokeWidth={(isSelected ? 1.6 : 1) * pinScale}
                />

                {/* Clean Pill Callout with Stop Number & City Name */}
                {showLabel && (
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={-29 * pinScale}
                      y={-7 * pinScale}
                      width={58 * pinScale}
                      height={13.5 * pinScale}
                      rx={3.5 * pinScale}
                      fill="#070A12"
                      fillOpacity="0.94"
                      stroke={isSelected || isInTour ? pinColor : '#334155'}
                      strokeWidth={0.95 * pinScale}
                    />
                    <text
                      x="0"
                      y={2.5 * pinScale}
                      textAnchor="middle"
                      fill={isSelected || isInTour ? '#FFFFFF' : '#CBD5E1'}
                      fontSize={6.8 * pinScale}
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {isInTour ? `#${firstStopOrder} ` : ''}
                      {city.city.slice(0, 10)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom Map Legend Bar */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-300 bg-[#070A12]/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/10 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Next Stop
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Scheduled
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Played
            </span>
          </div>
          <span className="hidden xs:inline">Tap city pin for venues</span>
        </div>
      </div>

      {/* Ordered Flight Route Sequence Ribbon */}
      {orderedStopCities.length > 0 && (
        <div className="px-3.5 py-2.5 bg-[#0A0E19] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[9.5px] font-mono uppercase text-zinc-400 shrink-0 mr-1">
            Route:
          </span>
          {orderedStopCities.map((st, i) => (
            <React.Fragment key={`${st.city.id}_${i}`}>
              <button
                type="button"
                onClick={() => onSelectCity(st.city)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 cursor-pointer border active:scale-95 transition ${
                  selectedCity?.id === st.city.id
                    ? 'bg-rose-500/25 border-rose-400 text-white'
                    : st.status === 'completed'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-zinc-300'
                }`}
              >
                #{st.index} {st.city.city}
              </button>
              {i < orderedStopCities.length - 1 && (
                <span className="text-[10px] text-zinc-500 shrink-0">✈</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Selected City Interactive Venue & Routing Card */}
      {selectedCity && (
        <div className="p-3.5 bg-[#0D111C] border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white">
                  {selectedCity.city}, {selectedCity.country}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[9px] font-mono text-sky-300">
                  {selectedCity.regionLabel}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Purchasing Power: {Math.round(selectedCity.marketMultiplier * 100)}% • Crowd Passion: {Math.round(selectedCity.fanPassionBonus * 100)}%
              </div>
            </div>

            {recommendedTierByCity[selectedCity.id] && (
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg shrink-0">
                Rec: {recommendedTierByCity[selectedCity.id].toUpperCase()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['club', 'theater', 'arena', 'stadium'] as VenueTierId[]).map(
              tier => {
                const v = selectedCity.venues[tier];
                const isRec = recommendedTierByCity[selectedCity.id] === tier;
                return (
                  <div
                    key={tier}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 ${
                      isRec
                        ? 'bg-sky-500/10 border-sky-400/45'
                        : 'bg-black/40 border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9.5px] font-mono uppercase text-zinc-400">
                        <span>{v.tierLabel}</span>
                        <span className="text-white font-bold">
                          {formatNumFull(v.capacity)}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-white truncate mt-0.5">
                        {v.venueName}
                      </div>
                      <div className="text-[9.5px] font-mono text-zinc-400 mt-0.5">
                        Rent: ${formatNumFull(v.rentalCost)}
                      </div>
                    </div>

                    {interactiveMode === 'planner' && onQuickAddCityStop && (
                      <button
                        type="button"
                        onClick={() => onQuickAddCityStop(selectedCity.id, tier)}
                        className="w-full py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 active:scale-95 text-zinc-950 text-[10.5px] font-black transition cursor-pointer"
                      >
                        + Add {v.tierLabel}
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
