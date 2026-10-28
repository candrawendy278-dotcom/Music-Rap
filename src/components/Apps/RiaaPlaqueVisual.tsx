import React from 'react';
import {
  RiaaMetalClass,
  RiaaPlaqueCustomConfig,
  RIAA_FRAME_STYLES,
  RIAA_MATBOARD_STYLES
} from '../../data/riaaCertificationEngine';
import { formatNumFull } from '../../constants';

interface RiaaPlaqueVisualProps {
  title: string;
  artistName: string;
  releaseSubtype: string;
  cover: string;
  tierLabel: string;
  shortBadge: string;
  metalClass: RiaaMetalClass;
  certifiedUnits: number;
  dateCertified: string;
  serialNumber: string;
  recordLabel: string;
  plaqueConfig: RiaaPlaqueCustomConfig;
  size?: 'sm' | 'md' | 'lg';
}

export const RiaaPlaqueVisual: React.FC<RiaaPlaqueVisualProps> = ({
  title,
  artistName,
  releaseSubtype,
  cover,
  tierLabel,
  shortBadge,
  metalClass,
  certifiedUnits,
  dateCertified,
  serialNumber,
  recordLabel,
  plaqueConfig,
  size = 'lg'
}) => {
  const frameMeta =
    RIAA_FRAME_STYLES.find(f => f.id === plaqueConfig.frameStyle) ||
    RIAA_FRAME_STYLES[0];
  const matMeta =
    RIAA_MATBOARD_STYLES.find(m => m.id === plaqueConfig.matboardStyle) ||
    RIAA_MATBOARD_STYLES[0];

  const fallbackCover =
    cover ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%2318181b"/></svg>';

  const renderMetallicAwardDisc = (
    diameterPx: number,
    uidSuffix: string,
    extraClass = ''
  ) => {
    const isDiamond = metalClass === 'diamond';
    const isGold = metalClass === 'gold';

    const discGradId = `riaaDiscGrad_${uidSuffix}`;
    const sheenId = `riaaDiscSheen_${uidSuffix}`;

    return (
      <div
        style={{ width: `${diameterPx}px`, height: `${diameterPx}px` }}
        className={`relative rounded-full shadow-[0_14px_28px_rgba(0,0,0,0.75)] flex items-center justify-center overflow-hidden select-none shrink-0 ${extraClass}`}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {isDiamond ? (
              <linearGradient id={discGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="22%" stopColor="#7DD3FC" />
                <stop offset="48%" stopColor="#F8FAFC" />
                <stop offset="72%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            ) : isGold ? (
              <linearGradient id={discGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="28%" stopColor="#D4AF37" />
                <stop offset="52%" stopColor="#FFFBEB" />
                <stop offset="78%" stopColor="#A16207" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            ) : (
              /* Platinum & Multi-Platinum Mirror Specular Silver */
              <linearGradient id={discGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="26%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="76%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
            )}

            <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="44%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.65)" />
              <stop offset="56%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Outer Beveled Rim */}
          <circle
            cx="100"
            cy="100"
            r="98"
            fill={`url(#${discGradId})`}
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.8"
          />

          {/* Concentric Micro-Groove Rings */}
          {[90, 82, 74, 66, 58, 50, 43].map((r, idx) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={
                idx % 2 === 0
                  ? 'rgba(0,0,0,0.22)'
                  : 'rgba(255,255,255,0.45)'
              }
              strokeWidth={idx % 2 === 0 ? '0.9' : '0.6'}
            />
          ))}

          {/* Diamond Facet Sparkle Geometry for Diamond Awards */}
          {isDiamond && (
            <g stroke="rgba(255,255,255,0.65)" strokeWidth="0.7" fill="none">
              <polygon points="100,6 194,100 100,194 6,100" />
              <polygon points="34,34 166,34 166,166 34,166" />
            </g>
          )}

          {/* Specular Light Reflection Sweep */}
          <circle cx="100" cy="100" r="97" fill={`url(#${sheenId})`} />
        </svg>

        {/* Center Record Label with Miniature Cover Art & Spindle Hole */}
        <div className="absolute w-[34%] h-[34%] rounded-full overflow-hidden border-2 border-black/40 shadow-inner flex items-center justify-center bg-zinc-900">
          <img
            src={fallbackCover}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-zinc-950 border border-white/80 shadow" />
        </div>
      </div>
    );
  };

  const isCompact = size === 'sm';
  const discDiameter = isCompact ? 68 : size === 'md' ? 86 : 102;

  const plaquePlateGradient =
    metalClass === 'diamond'
      ? 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 35%, #F8FAFC 55%, #DDD6FE 80%, #7DD3FC 100%)'
      : metalClass === 'gold'
      ? 'linear-gradient(135deg, #FEF08A 0%, #D4AF37 40%, #FFFBEB 60%, #B48811 100%)'
      : 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 40%, #FFFFFF 60%, #94A3B8 100%)';

  return (
    <div className="relative w-full flex items-center justify-center select-none">
      {/* Outer Museum Shadow & Frame */}
      <div
        style={{
          backgroundColor: frameMeta.borderHex,
          borderColor: frameMeta.innerTrimHex
        }}
        className={`relative w-full ${
          isCompact ? 'p-2 rounded-lg' : 'p-3.5 rounded-xl'
        } border-2 shadow-[0_24px_48px_rgba(0,0,0,0.85)] overflow-hidden`}
      >
        {/* Inner Metallic Bevel Matboard Frame */}
        <div
          style={{
            background: matMeta.bgGradient,
            borderColor: frameMeta.innerTrimHex
          }}
          className={`relative w-full ${
            isCompact ? 'p-3 rounded-md' : 'p-4 rounded-lg'
          } border shadow-inner flex flex-col items-center justify-between overflow-hidden`}
        >
          {/* Museum Glass Diagonal Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.1] pointer-events-none" />

          {/* Top RIAA Header Seal & Serial Tag */}
          <div className="relative z-10 w-full flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-white/70 mb-2">
            <span>RIAA® CERTIFIED AWARD</span>
            <span>#{serialNumber}</span>
          </div>

          {/* Center Metallic Disc(s) Showcase */}
          <div className="relative z-10 my-1 flex items-center justify-center">
            {plaqueConfig.discLayout === 'classic_crest' &&
              renderMetallicAwardDisc(discDiameter, 'single')}

            {plaqueConfig.discLayout === 'double_symphony' && (
              <div className="flex items-center justify-center -space-x-6">
                {renderMetallicAwardDisc(
                  Math.round(discDiameter * 0.92),
                  'dbl_left',
                  'z-10'
                )}
                {renderMetallicAwardDisc(
                  Math.round(discDiameter * 0.92),
                  'dbl_right',
                  'z-20'
                )}
              </div>
            )}

            {plaqueConfig.discLayout === 'collector_shrine' && (
              <div className="flex items-center justify-center -space-x-7">
                {renderMetallicAwardDisc(
                  Math.round(discDiameter * 0.82),
                  'tri_left',
                  'z-10 translate-y-1.5'
                )}
                {renderMetallicAwardDisc(
                  Math.round(discDiameter * 0.96),
                  'tri_center',
                  'z-30 -translate-y-1'
                )}
                {renderMetallicAwardDisc(
                  Math.round(discDiameter * 0.82),
                  'tri_right',
                  'z-20 translate-y-1.5'
                )}
              </div>
            )}
          </div>

          {/* Lower Section: Miniature Framed Cover Art + RIAA Hologram + Engraved Metallic Dedication Plate */}
          <div
            className={`relative z-10 w-full ${
              isCompact ? 'mt-2.5 gap-2' : 'mt-3.5 gap-3'
            } flex items-stretch`}
          >
            {/* Miniature Framed Album/Single Cover Art */}
            <div
              style={{ borderColor: frameMeta.innerTrimHex }}
              className={`${
                isCompact ? 'w-12 h-12' : 'w-16 h-16'
              } rounded-sm overflow-hidden border bg-zinc-900 shadow-lg shrink-0 relative`}
            >
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[6px] font-mono font-bold text-center text-white py-0.5 uppercase tracking-wider">
                {releaseSubtype}
              </div>
            </div>

            {/* Brushed Metallic Engraved Dedication Plate */}
            <div
              style={{ background: plaquePlateGradient }}
              className="flex-1 rounded-sm p-2 text-zinc-950 shadow-md border border-white/60 flex flex-col justify-between min-w-0"
            >
              <div className="flex items-center justify-between gap-1 border-b border-black/15 pb-0.5">
                <span className="text-[8px] font-black uppercase tracking-wider truncate">
                  {tierLabel}
                </span>
                <span className="text-[7px] font-mono font-bold px-1 py-0.2 bg-black/15 rounded-xs shrink-0">
                  {shortBadge}
                </span>
              </div>

              <div className="my-0.5">
                <div className="text-[7.5px] font-black uppercase tracking-wide truncate">
                  {plaqueConfig.recipientLine ||
                    `PRESENTED TO ${artistName.toUpperCase()}`}
                </div>
                <div className="text-[6.5px] font-medium leading-tight line-clamp-2 opacity-90 mt-0.5">
                  {plaqueConfig.dedicationNote ||
                    `TO COMMEMORATE ${formatNumFull(
                      certifiedUnits
                    )} CERTIFIED RIAA® UNITS OF "${title.toUpperCase()}"`}
                </div>
              </div>

              <div className="flex items-center justify-between text-[6px] font-mono font-bold uppercase opacity-75 pt-0.5 border-t border-black/10">
                <span className="truncate">{recordLabel}</span>
                <span className="shrink-0 ml-1">{dateCertified}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact metallic RIAA Certification Badge for CatalogItem and StatisticApp rows.
 */
export const RiaaCertBadge: React.FC<{
  shortBadge: string;
  metalClass: RiaaMetalClass;
  isCertified: boolean;
  isEligibleForUpgrade?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}> = ({
  shortBadge,
  metalClass,
  isCertified,
  isEligibleForUpgrade = false,
  onClick
}) => {
  const colorStyle =
    metalClass === 'diamond'
      ? 'bg-gradient-to-r from-sky-300 via-white to-purple-300 text-zinc-950 border-sky-400'
      : metalClass === 'gold'
      ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-zinc-950 border-amber-400'
      : 'bg-gradient-to-r from-zinc-200 via-white to-zinc-300 text-zinc-950 border-zinc-300';

  if (!isCertified && isEligibleForUpgrade) {
    return (
      <span
        onClick={onClick}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 shrink-0"
      >
        <i className="ph-fill ph-seal-check text-[10px]"></i>
        <span>RIAA ELIGIBLE</span>
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider border shadow-2xs shrink-0 ${colorStyle}`}
    >
      <i className="ph-fill ph-disc text-[10px]"></i>
      <span>{shortBadge}</span>
      {isEligibleForUpgrade && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Upgrade Eligible" />
      )}
    </span>
  );
};
