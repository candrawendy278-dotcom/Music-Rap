import React, { useState } from 'react';
import {
  TourStageConfig,
  ERA_LIGHTING_THEMES,
  MAIN_STAGE_ARCHITECTURES,
  RUNWAY_CATWALK_OPTIONS,
  B_STAGE_MODULES,
  evaluateStageArchitectureMetrics
} from '../../data/worldTourSystemEngine';
import { formatNumFull } from '../../constants';

interface TourStagePreviewProps {
  config: TourStageConfig;
  artistName: string;
  compact?: boolean;
}

type StageViewPerspective = 'stadium_3d' | 'front_pov' | 'cad_blueprint';

export default function TourStagePreview({
  config,
  artistName,
  compact = false
}: TourStagePreviewProps) {
  const [viewMode, setViewMode] = useState<StageViewPerspective>('stadium_3d');
  const [pyroBurstActive, setPyroBurstActive] = useState(false);
  const [laserSweepActive, setLaserSweepActive] = useState(false);
  const [wristbandPulseActive, setWristbandPulseActive] = useState(false);

  const theme =
    ERA_LIGHTING_THEMES.find(t => t.id === config.lightingThemeId) ||
    ERA_LIGHTING_THEMES[0];
  const mainSpec =
    MAIN_STAGE_ARCHITECTURES.find(m => m.id === config.mainStageId) ||
    MAIN_STAGE_ARCHITECTURES[0];
  const runwaySpec =
    RUNWAY_CATWALK_OPTIONS.find(r => r.id === config.runwayId) ||
    RUNWAY_CATWALK_OPTIONS[0];
  const bStageSpec =
    B_STAGE_MODULES.find(b => b.id === config.bStageId) || B_STAGE_MODULES[0];

  const metrics = evaluateStageArchitectureMetrics(config);
  const bannerImage = config.customBannerUrl || config.backdropCover || '';

  const triggerPyroTest = () => {
    setPyroBurstActive(true);
    setTimeout(() => setPyroBurstActive(false), 1600);
  };

  const triggerLaserTest = () => {
    setLaserSweepActive(true);
    setTimeout(() => setLaserSweepActive(false), 1700);
  };

  const triggerWristbandPulse = () => {
    setWristbandPulseActive(true);
    setTimeout(() => setWristbandPulseActive(false), 1600);
  };

  // Structured Stadium Bowl & Floor PixMob LED Wristband Matrix
  const bowlWristbands = [
    // Left Lower & Upper Bowl
    { x: 46, y: 152 }, { x: 60, y: 178 }, { x: 44, y: 206 }, { x: 62, y: 234 },
    { x: 74, y: 262 }, { x: 92, y: 286 }, { x: 84, y: 192 }, { x: 92, y: 222 },
    { x: 112, y: 294 }, { x: 108, y: 168 },
    // Right Lower & Upper Bowl
    { x: 474, y: 152 }, { x: 460, y: 178 }, { x: 476, y: 206 }, { x: 458, y: 234 },
    { x: 446, y: 262 }, { x: 428, y: 286 }, { x: 436, y: 192 }, { x: 428, y: 222 },
    { x: 408, y: 294 }, { x: 412, y: 168 },
    // Golden Circle & Floor Pit
    { x: 136, y: 186 }, { x: 158, y: 204 }, { x: 128, y: 222 }, { x: 152, y: 242 },
    { x: 176, y: 256 }, { x: 190, y: 196 }, { x: 202, y: 232 }, { x: 142, y: 268 },
    { x: 384, y: 186 }, { x: 362, y: 204 }, { x: 392, y: 222 }, { x: 368, y: 242 },
    { x: 344, y: 256 }, { x: 330, y: 196 }, { x: 318, y: 232 }, { x: 378, y: 268 },
    // Rear Stadium Bowl
    { x: 168, y: 304 }, { x: 208, y: 312 }, { x: 312, y: 312 }, { x: 352, y: 304 }
  ];

  return (
    <div className="rounded-2xl bg-[#06080F] border border-white/15 overflow-hidden shadow-2xl">
      {/* Top Architectural Header & Mobile-Friendly Camera Switcher */}
      <div className="p-3 bg-[#0D111C] border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: theme.primaryHex,
                boxShadow: `0 0 12px ${theme.primaryHex}`
              }}
            />
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-wider text-white truncate">
                {mainSpec.name}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                {mainSpec.spanSpec} • {mainSpec.ledResolution}
              </div>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-400/40 font-mono text-[10px] font-black text-rose-300 shrink-0">
            SPEC {metrics.productionScore}/100
          </div>
        </div>

        {/* Full-Width Thumb-Friendly Camera Angle Switcher */}
        <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
          {[
            { id: 'stadium_3d' as const, label: '🏟️ 3D Stadium' },
            { id: 'front_pov' as const, label: '👁️ Front POV' },
            { id: 'cad_blueprint' as const, label: '📐 CAD Blueprint' }
          ].map(cam => (
            <button
              key={cam.id}
              type="button"
              onClick={() => setViewMode(cam.id)}
              className={`py-2 px-2 rounded-lg text-[10.5px] font-mono font-bold transition cursor-pointer active:scale-95 ${
                viewMode === cam.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main High-Precision SVG Stage Viewport */}
      <div className="relative w-full aspect-[16/11] bg-[#04060B] select-none overflow-hidden">
        {/* =================================================================
            PERSPECTIVE 1: 3D ISOMETRIC STADIUM BOWL & ARCHITECTURAL RIG
           ================================================================= */}
        {viewMode === 'stadium_3d' && (
          <svg
            viewBox="0 0 520 356"
            className="w-full h-full block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="stadiumNightSky" cx="50%" cy="24%" r="70%">
                <stop offset="0%" stopColor={theme.primaryHex} stopOpacity="0.42" />
                <stop offset="45%" stopColor={theme.secondaryHex} stopOpacity="0.16" />
                <stop offset="100%" stopColor="#04060B" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="catwalkSurfaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#263147" />
                <stop offset="50%" stopColor="#131B2E" />
                <stop offset="100%" stopColor="#0A0E19" />
              </linearGradient>

              <linearGradient id="stageDeckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2E324B" />
                <stop offset="55%" stopColor="#1A1D2E" />
                <stop offset="100%" stopColor="#0E101B" />
              </linearGradient>

              <linearGradient id="pyroColumnGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.98" />
                <stop offset="55%" stopColor="#FACC15" stopOpacity="0.94" />
                <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="spotlightConeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                <stop offset="50%" stopColor={theme.primaryHex} stopOpacity="0.14" />
                <stop offset="100%" stopColor={theme.secondaryHex} stopOpacity="0" />
              </linearGradient>

              <clipPath id="centerImaxClip">
                <rect x="160" y="38" width="200" height="76" rx="4" />
              </clipPath>
              <clipPath id="imaxMonolithClip">
                <path d="M 96 46 Q 260 28 424 46 L 430 116 Q 260 104 90 116 Z" />
              </clipPath>
              <clipPath id="leftWingClip">
                <polygon points="98,52 156,42 156,112 98,118" />
              </clipPath>
              <clipPath id="rightWingClip">
                <polygon points="364,42 422,52 422,118 364,112" />
              </clipPath>
              <clipPath id="halo360Clip">
                <ellipse cx="260" cy="146" rx="102" ry="28" />
              </clipPath>
            </defs>

            {/* Background Night Atmosphere */}
            <rect width="520" height="356" fill="#04060B" />
            <rect width="520" height="356" fill="url(#stadiumNightSky)" />

            {/* 4-Tier Architectural Stadium Bowl Seating Rings */}
            {/* Outer Stadium Roof Canopy Fascia */}
            <ellipse
              cx="260"
              cy="206"
              rx="252"
              ry="140"
              fill="#070A12"
              stroke="#334155"
              strokeWidth="2.5"
            />
            {/* 300 Level Upper Bowl */}
            <ellipse
              cx="260"
              cy="206"
              rx="238"
              ry="130"
              fill="#090D16"
              stroke="#1E293B"
              strokeWidth="1.5"
            />

            {/* Radial Aisle Steps on Stadium Bowl */}
            {[25, 50, 75, 105, 130, 155, 205, 230, 255, 285, 310, 335].map((deg, idx) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = 260 + Math.cos(rad) * 144;
              const y1 = 206 + Math.sin(rad) * 74;
              const x2 = 260 + Math.cos(rad) * 238;
              const y2 = 206 + Math.sin(rad) * 130;
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#1E293B"
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
              );
            })}

            {/* 200 Level Luxury Club Suite Ribbon */}
            <ellipse
              cx="260"
              cy="206"
              rx="208"
              ry="112"
              fill="#0B101C"
              stroke={theme.primaryHex}
              strokeWidth="1.2"
              strokeOpacity="0.42"
            />

            {/* 100 Level Lower Bowl Ring */}
            <ellipse
              cx="260"
              cy="206"
              rx="178"
              ry="92"
              fill="#070A12"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Pitch / Arena Floor Boundary */}
            <ellipse
              cx="260"
              cy="210"
              rx="145"
              ry="75"
              fill="#0B0F1A"
              stroke={theme.secondaryHex}
              strokeWidth="1.3"
              strokeDasharray="5 3"
              strokeOpacity="0.6"
            />

            {/* Golden Circle Front Pit Barricade Zone */}
            <path
              d="M 140 162 Q 260 194 380 162"
              fill="none"
              stroke={theme.primaryHex}
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.55"
            />

            {/* Stadium Roof Floodlight Banks */}
            {[50, 86, 434, 470].map((fx, i) => (
              <g key={i}>
                <rect
                  x={fx - 11}
                  y={i === 0 || i === 3 ? 80 : 62}
                  width="22"
                  height="6"
                  rx="2"
                  fill="#F8FAFC"
                  opacity="0.9"
                />
                <circle
                  cx={fx}
                  cy={i === 0 || i === 3 ? 83 : 65}
                  r="16"
                  fill={theme.primaryHex}
                  fillOpacity="0.2"
                />
              </g>
            ))}

            {/* 600-Drone Stadium Sky Show */}
            {config.hasDroneSkyShow && (
              <g>
                {[
                  [92, 20], [116, 14], [140, 18], [166, 11], [200, 9],
                  [230, 12], [260, 7], [290, 12], [320, 9], [354, 11],
                  [380, 18], [404, 14], [428, 20]
                ].map(([dx, dy], i) => (
                  <g key={i}>
                    <circle
                      cx={dx}
                      cy={dy}
                      r="2.3"
                      fill={i % 2 === 0 ? theme.primaryHex : '#FDE047'}
                    />
                    <circle
                      cx={dx}
                      cy={dy}
                      r="5.8"
                      fill={theme.primaryHex}
                      fillOpacity="0.3"
                    />
                  </g>
                ))}
                <text
                  x="260"
                  y="23"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="6.5"
                  fontFamily="monospace"
                  letterSpacing="2"
                >
                  ✦ SYNCHRONIZED 600-DRONE SKY CONSTELLATION ✦
                </text>
              </g>
            )}

            {/* Volumetric Laser Matrix Beams */}
            {(config.hasLaserMatrix || laserSweepActive) && (
              <g opacity={laserSweepActive ? '0.96' : '0.62'}>
                <polygon
                  points="168,44 24,286 68,312"
                  fill={theme.primaryHex}
                  fillOpacity="0.18"
                />
                <polygon
                  points="218,42 114,330 158,336"
                  fill={theme.secondaryHex}
                  fillOpacity="0.15"
                />
                <polygon
                  points="302,42 362,336 406,330"
                  fill={theme.secondaryHex}
                  fillOpacity="0.15"
                />
                <polygon
                  points="352,44 452,312 496,286"
                  fill={theme.primaryHex}
                  fillOpacity="0.18"
                />
                <line
                  x1="168"
                  y1="44"
                  x2="46"
                  y2="298"
                  stroke={theme.primaryHex}
                  strokeWidth="1.3"
                />
                <line
                  x1="260"
                  y1="40"
                  x2="92"
                  y2="320"
                  stroke={theme.secondaryHex}
                  strokeWidth="1.1"
                />
                <line
                  x1="260"
                  y1="40"
                  x2="428"
                  y2="320"
                  stroke={theme.secondaryHex}
                  strokeWidth="1.1"
                />
                <line
                  x1="352"
                  y1="44"
                  x2="474"
                  y2="298"
                  stroke={theme.primaryHex}
                  strokeWidth="1.3"
                />
              </g>
            )}

            {/* PixMob Crowd Wristbands Across Bowl & Floor */}
            {bowlWristbands.map((pt, idx) => {
              const active = config.hasPixMobWristbands || wristbandPulseActive;
              const color =
                idx % 3 === 0
                  ? theme.primaryHex
                  : idx % 3 === 1
                  ? theme.secondaryHex
                  : '#FFFFFF';
              return (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={wristbandPulseActive ? '3.5' : active ? '2.4' : '1.4'}
                    fill={active ? color : '#475569'}
                    opacity={active ? '0.95' : '0.45'}
                  />
                  {active && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={wristbandPulseActive ? '8' : '5.2'}
                      fill={color}
                      fillOpacity="0.25"
                    />
                  )}
                </g>
              );
            })}

            {/* ==============================================================
                MAIN STAGE ARCHITECTURES (DISTINCT FOR ALL 5 MODELS)
               ============================================================== */}
            {config.mainStageId !== 'in_the_round_360' ? (
              <g>
                {/* ARCHITECTURE A: COLOSSAL STADIUM MEGA-ARCH (WEMBLEY / SOFI STYLE) */}
                {config.mainStageId === 'colossal_mega_arch' && (
                  <g>
                    {/* Twin Crossing Structural Stadium Arches + Central Spire */}
                    <path
                      d="M 68 134 Q 260 -28 452 134"
                      fill="none"
                      stroke={theme.primaryHex}
                      strokeWidth="5"
                    />
                    <path
                      d="M 82 134 Q 260 -8 438 134"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    {/* Central 65m Crown Spire */}
                    <polygon
                      points="255,4 265,4 269,36 251,36"
                      fill="#1E293B"
                      stroke={theme.primaryHex}
                      strokeWidth="1.5"
                    />
                    <circle cx="260" cy="6" r="4" fill="#FFFFFF" />
                  </g>
                )}

                {/* ARCHITECTURE B: CYBERNETIC CATHEDRAL RIG (COACHELLA / GAGA GOTHIC SPIRES) */}
                {config.mainStageId === 'cyber_cathedral' && (
                  <g>
                    {[96, 132, 168, 352, 388, 424].map((tx, idx) => {
                      const spireTop = idx === 2 || idx === 3 ? 14 : 22;
                      return (
                        <g key={idx}>
                          <polygon
                            points={`${tx - 10},118 ${tx},${spireTop} ${tx + 10},118`}
                            fill="#111827"
                            stroke={idx % 2 === 0 ? theme.primaryHex : theme.secondaryHex}
                            strokeWidth="1.5"
                          />
                          <line
                            x1={tx}
                            y1={spireTop + 6}
                            x2={tx}
                            y2="114"
                            stroke="#FFFFFF"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                            strokeOpacity="0.7"
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Overhead Steel Box Truss & Moving-Head Spotlight Array */}
                <rect
                  x="88"
                  y="28"
                  width="344"
                  height="8"
                  rx="2"
                  fill="#1E293B"
                  stroke="#94A3B8"
                  strokeWidth="1.1"
                />
                {/* Truss Cross-Bracing Pattern */}
                <line
                  x1="92"
                  y1="32"
                  x2="428"
                  y2="32"
                  stroke={theme.primaryHex}
                  strokeWidth="1"
                  strokeDasharray="6 4"
                />
                {[110, 140, 170, 200, 230, 260, 290, 320, 350, 380, 410].map(
                  (lx, i) => (
                    <g key={i}>
                      <circle
                        cx={lx}
                        cy="32"
                        r="2.4"
                        fill={i % 2 === 0 ? '#FFFFFF' : theme.primaryHex}
                      />
                      {/* Volumetric Downward Spotlight Cones onto Stage Deck */}
                      {i % 2 === 0 && (
                        <polygon
                          points={`${lx},34 ${lx - 18},136 ${lx + 18},136`}
                          fill="url(#spotlightConeGrad)"
                        />
                      )}
                    </g>
                  )
                )}

                {/* Left & Right Line-Array PA Speaker Hangings */}
                <rect
                  x="76"
                  y="38"
                  width="12"
                  height="46"
                  rx="2"
                  fill="#0B0F1A"
                  stroke="#64748B"
                  strokeWidth="1.2"
                />
                <rect
                  x="432"
                  y="38"
                  width="12"
                  height="46"
                  rx="2"
                  fill="#0B0F1A"
                  stroke="#64748B"
                  strokeWidth="1.2"
                />

                {/* ARCHITECTURE C: PANORAMIC IMAX LED MONOLITH vs TRIPTYCH SCREENS */}
                {config.mainStageId === 'monolith_imax_led' ? (
                  <g>
                    {/* Seamless Curved 85m Wrap-Around IMAX Wall */}
                    <path
                      d="M 96 46 Q 260 28 424 46 L 430 116 Q 260 104 90 116 Z"
                      fill="#090D16"
                      stroke={theme.primaryHex}
                      strokeWidth="2.6"
                    />
                    {bannerImage && (
                      <image
                        href={bannerImage}
                        x="90"
                        y="28"
                        width="340"
                        height="90"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="url(#imaxMonolithClip)"
                        opacity="0.72"
                      />
                    )}
                    <path
                      d="M 96 46 Q 260 28 424 46 L 430 116 Q 260 104 90 116 Z"
                      fill="#05070E"
                      fillOpacity="0.32"
                    />
                  </g>
                ) : (
                  <g>
                    {/* Left Angled IMAG Side Screen */}
                    <polygon
                      points="98,52 156,42 156,112 98,118"
                      fill="#0C111D"
                      stroke={theme.secondaryHex}
                      strokeWidth="1.8"
                    />
                    {bannerImage && (
                      <image
                        href={bannerImage}
                        x="96"
                        y="40"
                        width="62"
                        height="80"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="url(#leftWingClip)"
                        opacity="0.58"
                      />
                    )}

                    {/* Right Angled IMAG Side Screen */}
                    <polygon
                      points="364,42 422,52 422,118 364,112"
                      fill="#0C111D"
                      stroke={theme.secondaryHex}
                      strokeWidth="1.8"
                    />
                    {bannerImage && (
                      <image
                        href={bannerImage}
                        x="362"
                        y="40"
                        width="62"
                        height="80"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="url(#rightWingClip)"
                        opacity="0.58"
                      />
                    )}

                    {/* Center Panoramic 8K LED Wall */}
                    <rect
                      x="160"
                      y="38"
                      width="200"
                      height="76"
                      rx="4"
                      fill="#090D16"
                      stroke={theme.primaryHex}
                      strokeWidth="2.4"
                    />
                    {bannerImage && (
                      <image
                        href={bannerImage}
                        x="160"
                        y="38"
                        width="200"
                        height="76"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="url(#centerImaxClip)"
                        opacity="0.72"
                      />
                    )}
                    <rect
                      x="160"
                      y="38"
                      width="200"
                      height="76"
                      rx="4"
                      fill="#05060A"
                      fillOpacity="0.34"
                    />
                  </g>
                )}

                {/* Main Screen Banner Typography Overlay */}
                <text
                  x="260"
                  y="75"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="900"
                  letterSpacing="2.2"
                >
                  {(config.stageBannerText || artistName).slice(0, 26).toUpperCase()}
                </text>
                <text
                  x="260"
                  y="90"
                  textAnchor="middle"
                  fill={theme.primaryHex}
                  fontSize="6.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="2.5"
                >
                  {mainSpec.ledResolution.toUpperCase()}
                </text>

                {/* Primary Stage Deck & Multi-Level Band Risers */}
                <polygon
                  points="92,116 428,116 452,148 68,148"
                  fill="url(#stageDeckGrad)"
                  stroke={theme.primaryHex}
                  strokeWidth="2"
                />
                {/* Stage Front Apron Neon Edge Strip */}
                <line
                  x1="68"
                  y1="148"
                  x2="452"
                  y2="148"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  strokeOpacity="0.9"
                />
                {/* Illuminated Center Grand Staircase Risers */}
                <g>
                  <rect
                    x="232"
                    y="113"
                    width="56"
                    height="18"
                    rx="2"
                    fill="#1E293B"
                    stroke={theme.secondaryHex}
                    strokeWidth="1"
                  />
                  {[117, 121, 125, 129].map((sy, idx) => (
                    <line
                      key={idx}
                      x1="235"
                      y1={sy}
                      x2="285"
                      y2={sy}
                      stroke={idx % 2 === 0 ? '#FFFFFF' : theme.primaryHex}
                      strokeWidth="1"
                    />
                  ))}
                </g>
              </g>
            ) : (
              /* 360° CENTER-BOWL ISLAND STAGE */
              <g>
                {/* 4 Corner Structural Steel Pylon Towers */}
                {[
                  [168, 114, 192, 184],
                  [352, 114, 328, 184],
                  [158, 166, 184, 214],
                  [362, 166, 336, 214]
                ].map(([x1, y1, x2, y2], i) => (
                  <g key={i}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#94A3B8"
                      strokeWidth="2.4"
                    />
                    <circle cx={x1} cy={y1} r="3" fill={theme.primaryHex} />
                  </g>
                ))}
                {/* Outer 360 Island Stage Deck */}
                <ellipse
                  cx="260"
                  cy="196"
                  rx="88"
                  ry="40"
                  fill="url(#stageDeckGrad)"
                  stroke={theme.primaryHex}
                  strokeWidth="2.4"
                />
                {/* Inner Elevated Turntable Riser */}
                <ellipse
                  cx="260"
                  cy="196"
                  rx="50"
                  ry="22"
                  fill="#1E293B"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
                {/* Suspended Orbital 360 Halo LED Screen */}
                <ellipse
                  cx="260"
                  cy="146"
                  rx="102"
                  ry="28"
                  fill="#0B0F1A"
                  stroke={theme.primaryHex}
                  strokeWidth="2.6"
                />
                {bannerImage && (
                  <image
                    href={bannerImage}
                    x="158"
                    y="118"
                    width="204"
                    height="56"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#halo360Clip)"
                    opacity="0.68"
                  />
                )}
                <text
                  x="260"
                  y="149"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="900"
                  letterSpacing="2"
                >
                  {(config.stageBannerText || artistName).slice(0, 24).toUpperCase()}
                </text>
              </g>
            )}

            {/* ==============================================================
                CATWALK & RUNWAY GEOMETRY (WITH NEON LED EDGE STRIPS)
               ============================================================== */}
            {config.runwayId === 'straight_thrust' && (
              <g>
                <polygon
                  points="244,148 276,148 282,256 238,256"
                  fill="url(#catwalkSurfaceGrad)"
                  stroke={theme.primaryHex}
                  strokeWidth="2"
                />
                <line
                  x1="260"
                  y1="152"
                  x2="260"
                  y2="252"
                  stroke={theme.secondaryHex}
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
              </g>
            )}

            {config.runwayId === 'diamond_catwalk' && (
              <g>
                <polygon
                  points="244,148 276,148 276,176 322,210 260,256 198,210 244,176"
                  fill="url(#catwalkSurfaceGrad)"
                  stroke={theme.primaryHex}
                  strokeWidth="2.2"
                />
                {/* Inner VIP Club Pit inside the Diamond */}
                <polygon
                  points="260,186 296,210 260,234 224,210"
                  fill="#05070D"
                  stroke={theme.secondaryHex}
                  strokeWidth="1.4"
                />
                <text
                  x="260"
                  y="213"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="6"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  VIP CLUB PIT
                </text>
              </g>
            )}

            {config.runwayId === 'dual_parallel' && (
              <g>
                <polygon
                  points="168,148 194,148 182,262 154,262"
                  fill="url(#catwalkSurfaceGrad)"
                  stroke={theme.primaryHex}
                  strokeWidth="2"
                />
                <polygon
                  points="326,148 352,148 366,262 338,262"
                  fill="url(#catwalkSurfaceGrad)"
                  stroke={theme.primaryHex}
                  strokeWidth="2"
                />
              </g>
            )}

            {config.runwayId === 'infinity_loop' && (
              <g>
                <ellipse
                  cx="260"
                  cy="214"
                  rx="94"
                  ry="52"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="15"
                />
                <ellipse
                  cx="260"
                  cy="214"
                  rx="94"
                  ry="52"
                  fill="none"
                  stroke={theme.primaryHex}
                  strokeWidth="2.2"
                />
              </g>
            )}

            {/* ==============================================================
                SECONDARY B-STAGE MODULE & FOH SOUNDBOARD TENT
               ============================================================== */}
            {config.bStageId !== 'none' && (
              <g>
                {config.bStageId === 'acoustic_piano_island' && (
                  <g>
                    <ellipse
                      cx="260"
                      cy="278"
                      rx="38"
                      ry="17"
                      fill="#181C2E"
                      stroke={theme.secondaryHex}
                      strokeWidth="2"
                    />
                    <circle cx="260" cy="276" r="5.5" fill={theme.primaryHex} />
                    <text
                      x="260"
                      y="290"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="6"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ACOUSTIC B-STAGE
                    </text>
                  </g>
                )}

                {config.bStageId === 'hydraulic_rising_cube' && (
                  <g>
                    <polygon
                      points="230,264 290,264 298,288 222,288"
                      fill="#1E293B"
                      stroke={theme.primaryHex}
                      strokeWidth="1.8"
                    />
                    <rect
                      x="232"
                      y="240"
                      width="56"
                      height="25"
                      rx="3"
                      fill="#0F172A"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x="260"
                      y="256"
                      textAnchor="middle"
                      fill={theme.primaryHex}
                      fontSize="6.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      30FT HYDRAULIC CUBE
                    </text>
                  </g>
                )}

                {config.bStageId === 'levitation_ring' && (
                  <g>
                    <ellipse
                      cx="260"
                      cy="276"
                      rx="48"
                      ry="19"
                      fill="none"
                      stroke={theme.primaryHex}
                      strokeWidth="4"
                    />
                    <ellipse
                      cx="260"
                      cy="276"
                      rx="30"
                      ry="12"
                      fill="#181826"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x="260"
                      y="279"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="6"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      KINETIC HALO B-STAGE
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* FOH Sound & Lighting Mix Control Tent at Rear of Floor */}
            <rect
              x="228"
              y="304"
              width="64"
              height="15"
              rx="2"
              fill="#0F172A"
              stroke="#475569"
              strokeWidth="1"
            />
            <text
              x="260"
              y="314"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="5.5"
              fontFamily="monospace"
            >
              FOH SOUND &amp; LIGHT MIX
            </text>

            {/* Live Band Riser Pods & 24 Dancers Formation */}
            {config.hasLiveBandAndDancers && (
              <g>
                <rect
                  x="124"
                  y="122"
                  width="50"
                  height="14"
                  rx="2"
                  fill="#0F172A"
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
                <rect
                  x="346"
                  y="122"
                  width="50"
                  height="14"
                  rx="2"
                  fill="#0F172A"
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
                {/* Artist Lead Center + Choreography V-Formation */}
                {[202, 220, 238, 260, 282, 300, 318].map((dx, i) => (
                  <circle
                    key={i}
                    cx={dx}
                    cy={i === 3 ? 142 : 135}
                    r={i === 3 ? '4.8' : '2.8'}
                    fill={i === 3 ? '#FFFFFF' : theme.secondaryHex}
                  />
                ))}
              </g>
            )}

            {/* Pyrotechnic Flame Columns along Stage Apron */}
            {(config.hasPyro || pyroBurstActive) && (
              <g opacity={pyroBurstActive ? '1' : '0.9'}>
                {[108, 146, 188, 224, 296, 332, 374, 412].map((px, idx) => (
                  <g key={idx}>
                    <path
                      d={`M ${px - 6.5} 122 Q ${px} ${
                        pyroBurstActive ? 50 : 76
                      } ${px + 6.5} 122 Z`}
                      fill="url(#pyroColumnGrad)"
                    />
                    <circle cx={px} cy="122" r="3.2" fill="#FEF08A" />
                  </g>
                ))}
              </g>
            )}

            {/* Bottom HUD Telemetry Strip */}
            <rect
              x="0"
              y="330"
              width="520"
              height="26"
              fill="#070910"
              fillOpacity="0.96"
            />
            <text
              x="14"
              y="346"
              fill="#94A3B8"
              fontSize="7.5"
              fontFamily="monospace"
            >
              RUNWAY: {runwaySpec.name.toUpperCase()} • B-STAGE: {bStageSpec.name.toUpperCase()}
            </text>
            <text
              x="506"
              y="346"
              textAnchor="end"
              fill={theme.primaryHex}
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {metrics.gradeLabel.toUpperCase()}
            </text>
          </svg>
        )}

        {/* =================================================================
            PERSPECTIVE 2: FRONT AUDIENCE POV (GOLDEN CIRCLE EYE-LEVEL)
           ================================================================= */}
        {viewMode === 'front_pov' && (
          <svg
            viewBox="0 0 520 356"
            className="w-full h-full block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="povStageBacklight" cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor={theme.primaryHex} stopOpacity="0.5" />
                <stop offset="55%" stopColor={theme.secondaryHex} stopOpacity="0.2" />
                <stop offset="100%" stopColor="#04060B" stopOpacity="0" />
              </radialGradient>
              <clipPath id="povMainScreenClip">
                <rect x="132" y="50" width="256" height="134" rx="4" />
              </clipPath>
              <clipPath id="povLeftWingClip">
                <rect x="56" y="106" width="68" height="86" rx="3" />
              </clipPath>
              <clipPath id="povRightWingClip">
                <rect x="396" y="106" width="68" height="86" rx="3" />
              </clipPath>
            </defs>

            <rect width="520" height="356" fill="#04060B" />
            <rect width="520" height="356" fill="url(#povStageBacklight)" />

            {/* Colossal Mega-Arch or Cathedral Roof Framing in POV */}
            {config.mainStageId === 'colossal_mega_arch' && (
              <path
                d="M 24 202 Q 260 -36 496 202"
                fill="none"
                stroke={theme.primaryHex}
                strokeWidth="5"
              />
            )}

            {/* Overhead Gantry Steel Roof Structure & Vertical Towers */}
            <rect
              x="32"
              y="26"
              width="456"
              height="14"
              fill="#111827"
              stroke="#64748B"
              strokeWidth="1.5"
            />
            <rect
              x="40"
              y="40"
              width="14"
              height="160"
              fill="#0F172A"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <rect
              x="466"
              y="40"
              width="14"
              height="160"
              fill="#0F172A"
              stroke="#475569"
              strokeWidth="1.2"
            />

            {/* Line Array Speaker Clusters Hanging Left & Right */}
            <rect
              x="62"
              y="46"
              width="18"
              height="54"
              rx="2"
              fill="#090D16"
              stroke="#64748B"
              strokeWidth="1.2"
            />
            <rect
              x="440"
              y="46"
              width="18"
              height="54"
              rx="2"
              fill="#090D16"
              stroke="#64748B"
              strokeWidth="1.2"
            />

            {/* Left & Right Portrait IMAG Screens */}
            <rect
              x="56"
              y="106"
              width="68"
              height="86"
              rx="3"
              fill="#0F172A"
              stroke={theme.secondaryHex}
              strokeWidth="1.8"
            />
            {bannerImage && (
              <image
                href={bannerImage}
                x="56"
                y="106"
                width="68"
                height="86"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#povLeftWingClip)"
                opacity="0.58"
              />
            )}

            <rect
              x="396"
              y="106"
              width="68"
              height="86"
              rx="3"
              fill="#0F172A"
              stroke={theme.secondaryHex}
              strokeWidth="1.8"
            />
            {bannerImage && (
              <image
                href={bannerImage}
                x="396"
                y="106"
                width="68"
                height="86"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#povRightWingClip)"
                opacity="0.58"
              />
            )}

            {/* Colossal Center 8K LED Wall Displaying Player's Tour Banner */}
            <rect
              x="132"
              y="50"
              width="256"
              height="134"
              rx="4"
              fill="#090D16"
              stroke={theme.primaryHex}
              strokeWidth="2.6"
            />
            {bannerImage && (
              <image
                href={bannerImage}
                x="132"
                y="50"
                width="256"
                height="134"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#povMainScreenClip)"
                opacity="0.76"
              />
            )}
            <rect
              x="132"
              y="50"
              width="256"
              height="134"
              fill="#04060B"
              fillOpacity="0.34"
            />

            {/* Overhead Laser Beams From Roof Rig */}
            {(config.hasLaserMatrix || laserSweepActive) && (
              <g opacity="0.78">
                {[88, 144, 202, 260, 318, 376, 432].map((lx, i) => (
                  <line
                    key={i}
                    x1={lx}
                    y1="40"
                    x2={260 + (lx - 260) * 1.48}
                    y2="322"
                    stroke={i % 2 === 0 ? theme.primaryHex : theme.secondaryHex}
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}

            {/* Giant Era Banner Typography */}
            <text
              x="260"
              y="112"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="900"
              letterSpacing="3"
            >
              {(config.stageBannerText || artistName).slice(0, 26).toUpperCase()}
            </text>
            <text
              x="260"
              y="130"
              textAnchor="middle"
              fill={theme.primaryHex}
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="3"
            >
              GOLDEN CIRCLE VIP PIT PERSPECTIVE
            </text>

            {/* Stage Elevation Deck & Center Thrust Toward Viewer */}
            <rect
              x="32"
              y="196"
              width="456"
              height="28"
              fill="#161929"
              stroke={theme.primaryHex}
              strokeWidth="2"
            />
            <polygon
              points="206,224 314,224 362,330 158,330"
              fill="#1E2438"
              stroke="#FFFFFF"
              strokeWidth="1.6"
            />

            {/* Artist Silhouette at Center Thrust */}
            <circle cx="260" cy="180" r="7" fill="#FFFFFF" />
            <path d="M 249 216 L 254 188 L 266 188 L 271 216 Z" fill="#FFFFFF" />

            {/* Pyro Jets in Front POV */}
            {(config.hasPyro || pyroBurstActive) && (
              <g>
                {[92, 142, 192, 328, 378, 428].map((px, i) => (
                  <path
                    key={i}
                    d={`M ${px - 8} 196 Q ${px} ${
                      pyroBurstActive ? 86 : 118
                    } ${px + 8} 196 Z`}
                    fill="#F97316"
                    fillOpacity="0.92"
                  />
                ))}
              </g>
            )}

            {/* Golden Circle Crowd Silhouettes & Glowing Wristbands at Bottom */}
            {[46, 78, 112, 144, 376, 408, 442, 474].map((cx, i) => (
              <g key={i}>
                <circle cx={cx} cy="316" r="11" fill="#090C15" />
                {(config.hasPixMobWristbands || wristbandPulseActive) && (
                  <circle
                    cx={cx + (i % 2 === 0 ? 6 : -6)}
                    cy="302"
                    r="3.2"
                    fill={i % 2 === 0 ? theme.primaryHex : theme.secondaryHex}
                  />
                )}
              </g>
            ))}

            <rect x="0" y="330" width="520" height="26" fill="#070910" />
            <text
              x="260"
              y="346"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="8"
              fontFamily="monospace"
            >
              ELEVATION VIEW • SPAN: {mainSpec.spanSpec} • {mainSpec.ledResolution}
            </text>
          </svg>
        )}

        {/* =================================================================
            PERSPECTIVE 3: ARCHITECTURAL CAD ENGINEERING FLOORPLAN
           ================================================================= */}
        {viewMode === 'cad_blueprint' && (
          <svg
            viewBox="0 0 520 356"
            className="w-full h-full block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="520" height="356" fill="#061222" />
            {/* Precision Blueprint Grid */}
            {Array.from({ length: 21 }).map((_, i) => (
              <line
                key={`v_${i}`}
                x1={i * 25}
                y1="0"
                x2={i * 25}
                y2="356"
                stroke="#38BDF8"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <line
                key={`h_${i}`}
                x1="0"
                y1={i * 25}
                x2="520"
                y2={i * 25}
                stroke="#38BDF8"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
            ))}

            {/* Stadium Bowl Seating Sections CAD */}
            <ellipse
              cx="260"
              cy="185"
              rx="236"
              ry="146"
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <ellipse
              cx="260"
              cy="185"
              rx="178"
              ry="108"
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.8"
              strokeWidth="1.2"
            />

            {/* Section Labels around the CAD Bowl */}
            {[
              [48, 185, 'SEC 101'],
              [78, 265, 'SEC 104'],
              [260, 318, 'SEC 110 (SOUTH)'],
              [442, 265, 'SEC 116'],
              [472, 185, 'SEC 120']
            ].map(([sx, sy, label], i) => (
              <text
                key={i}
                x={sx}
                y={sy}
                textAnchor="middle"
                fill="#7DD3FC"
                fontSize="6.5"
                fontFamily="monospace"
              >
                {label}
              </text>
            ))}

            {/* Main Stage CAD Footprint */}
            <rect
              x="128"
              y="32"
              width="264"
              height="56"
              fill="#0A223D"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <text
              x="260"
              y="56"
              textAnchor="middle"
              fill="#E0F2FE"
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              MAIN STAGE: {mainSpec.name.toUpperCase()}
            </text>
            <text
              x="260"
              y="70"
              textAnchor="middle"
              fill="#38BDF8"
              fontSize="7"
              fontFamily="monospace"
            >
              {mainSpec.spanSpec} • {mainSpec.ledResolution.toUpperCase()}
            </text>

            {/* CAD Catwalk */}
            {config.runwayId !== 'none' && (
              <rect
                x="244"
                y="88"
                width="32"
                height="142"
                fill="#0A223D"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
            )}
            {config.runwayId === 'diamond_catwalk' && (
              <polygon
                points="260,130 315,172 260,214 205,172"
                fill="#0A223D"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
            )}

            {/* CAD B-Stage */}
            {config.bStageId !== 'none' && (
              <circle
                cx="260"
                cy="248"
                r="28"
                fill="#0A223D"
                stroke="#38BDF8"
                strokeWidth="1.8"
              />
            )}

            <rect x="0" y="330" width="520" height="26" fill="#040B16" />
            <text
              x="260"
              y="346"
              textAnchor="middle"
              fill="#38BDF8"
              fontSize="7.5"
              fontFamily="monospace"
            >
              ARCHITECTURAL CAD FLOORPLAN • SCALE 1:500 • RIGGING LOAD VERIFIED
            </text>
          </svg>
        )}
      </div>

      {/* Bottom Interactive FX Test Console & Engineering Metrics */}
      {!compact && (
        <div className="p-3 bg-[#0C0F1A] border-t border-white/10 space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={triggerPyroTest}
              className="py-2 px-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 active:scale-95 border border-orange-400/35 text-orange-300 text-[10.5px] font-mono font-bold transition cursor-pointer"
            >
              🔥 Fire Pyro
            </button>
            <button
              type="button"
              onClick={triggerLaserTest}
              className="py-2 px-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-95 border border-sky-400/35 text-sky-300 text-[10.5px] font-mono font-bold transition cursor-pointer"
            >
              ⚡ Laser Sweep
            </button>
            <button
              type="button"
              onClick={triggerWristbandPulse}
              className="py-2 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 border border-rose-400/35 text-rose-300 text-[10.5px] font-mono font-bold transition cursor-pointer"
            >
              ⌚ Pulse Crowd
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 font-mono text-[10px] tabular-nums text-center">
            <div>
              <span className="text-zinc-400 block font-sans">Build Cost</span>
              <strong className="text-amber-300">
                ${formatNumFull(metrics.upfrontBuildCost)}
              </strong>
            </div>
            <div>
              <span className="text-zinc-400 block font-sans">Rigging/Night</span>
              <strong className="text-white">
                ${formatNumFull(metrics.perShowRiggingCost)}
              </strong>
            </div>
            <div>
              <span className="text-zinc-400 block font-sans">Demand Boost</span>
              <strong className="text-emerald-400">
                +{Math.round((metrics.crowdHypeMultiplier - 1) * 100)}%
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
