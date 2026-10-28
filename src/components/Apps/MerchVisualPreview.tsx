import React from 'react';
import {
  MerchFormatId,
  MerchVariantStyle,
  MerchSpecTier,
  ApparelCustomDesign,
  ApparelFontStyle,
  ApparelGraphicMotif
} from '../../data/merchWebstoreEngine';

interface MerchVisualPreviewProps {
  formatId: MerchFormatId;
  coverArt: string;
  title: string;
  artistName: string;
  primaryColor: string;
  secondaryColor: string;
  variantStyle: MerchVariantStyle;
  isSigned?: boolean;
  hasObiStrip?: boolean;
  hypeStickerText?: string;
  specTier?: MerchSpecTier;
  apparelDesign?: ApparelCustomDesign;
  viewSide?: 'front' | 'back' | 'both';
  size?: 'sm' | 'md' | 'lg';
}

function getFontClass(fontStyle?: ApparelFontStyle): string {
  switch (fontStyle) {
    case 'street_gothic':
      return 'font-serif italic font-black tracking-widest uppercase';
    case 'luxury_serif':
      return 'font-serif font-bold tracking-[0.22em] uppercase';
    case 'collegiate_block':
      return 'font-mono font-black tracking-wider uppercase';
    case 'punk_scrawl':
      return 'font-mono italic font-extrabold tracking-tight uppercase';
    case 'brutalist_sans':
    default:
      return 'font-sans font-black tracking-tighter uppercase';
  }
}

/**
 * Renders custom vector streetwear graphics (Chrome Tribal Sigil, Sacred Flame, Angel Wings,
 * Wireframe Globe, Atelier Box Logo, or Custom Uploaded Photo) so apparel & accessories look
 * like authentic high-fashion artist merch rather than a raw album cover square.
 */
const StreetwearGraphicRenderer: React.FC<{
  motif: ApparelGraphicMotif;
  secondaryColor: string;
  primaryColor: string;
  customPhotoUrl?: string;
  frontText: string;
  artistName: string;
  compact?: boolean;
}> = ({
  motif,
  secondaryColor,
  primaryColor,
  customPhotoUrl,
  frontText,
  artistName,
  compact = false
}) => {
  const iconSize = compact ? 'w-9 h-9' : 'w-12 h-12';

  if (motif === 'typography_only') {
    return null;
  }

  if (motif === 'custom_photo' && customPhotoUrl) {
    return (
      <div
        style={{ borderColor: secondaryColor }}
        className={`${
          compact ? 'w-10 h-10' : 'w-13 h-13'
        } rounded-[2px] overflow-hidden border shadow-md relative bg-zinc-950 my-0.5`}
      >
        <img
          src={customPhotoUrl}
          alt={frontText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover contrast-125 saturate-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10 pointer-events-none" />
      </div>
    );
  }

  if (motif === 'box_emblem') {
    return (
      <div
        style={{ backgroundColor: secondaryColor, color: primaryColor }}
        className="px-2 py-0.5 rounded-[1px] shadow-sm my-1 border border-white/20"
      >
        <span className="text-[8px] font-sans font-black uppercase tracking-tighter block leading-tight">
          {frontText || artistName}
        </span>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${iconSize} my-0.5 overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]`}
    >
      {motif === 'chrome_tribal' && (
        <g fill="none" stroke={secondaryColor} strokeWidth="2.4" strokeLinecap="round">
          {/* Y2K Cyber Chrome Star & Tribal Sigil */}
          <path
            d="M50 6 Q54 44 94 50 Q54 56 50 94 Q46 56 6 50 Q46 44 50 6 Z"
            fill={secondaryColor}
            fillOpacity="0.18"
          />
          <path d="M22 22 C40 38, 60 38, 78 22" />
          <path d="M22 78 C40 62, 60 62, 78 78" />
          <circle cx="50" cy="50" r="14" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="4" fill={secondaryColor} />
        </g>
      )}

      {motif === 'sacred_flame' && (
        <g fill={secondaryColor}>
          {/* Streetwear Sacred Flame & Crown Crest */}
          <path
            d="M50 8 C58 26, 78 34, 76 58 C75 76, 62 90, 50 92 C38 90, 25 76, 24 58 C22 34, 42 26, 50 8 Z"
            fillOpacity="0.22"
            stroke={secondaryColor}
            strokeWidth="2.5"
          />
          <path
            d="M50 24 C55 38, 66 44, 64 62 C63 74, 56 82, 50 84 C44 82, 37 74, 36 62 C34 44, 45 38, 50 24 Z"
            fill={secondaryColor}
          />
          <path
            d="M50 4 L50 96 M36 18 L64 18"
            stroke={primaryColor}
            strokeWidth="2.2"
          />
        </g>
      )}

      {motif === 'fallen_cherub' && (
        <g fill="none" stroke={secondaryColor} strokeWidth="2.2" strokeLinecap="round">
          {/* High-Fashion Spread Angel Wings & Halo */}
          <ellipse cx="50" cy="18" rx="14" ry="4" strokeWidth="2" />
          <path
            d="M46 32 C30 20, 10 26, 8 46 C18 46, 26 52, 14 64 C26 62, 34 66, 24 78 C36 74, 44 66, 48 54 Z"
            fill={secondaryColor}
            fillOpacity="0.25"
          />
          <path
            d="M54 32 C70 20, 90 26, 92 46 C82 46, 74 52, 86 64 C74 62, 66 66, 76 78 C64 74, 56 66, 52 54 Z"
            fill={secondaryColor}
            fillOpacity="0.25"
          />
          <path d="M50 28 L50 84" strokeWidth="2.6" />
        </g>
      )}

      {(motif === 'world_globe' || (motif === 'custom_photo' && !customPhotoUrl)) && (
        <g fill="none" stroke={secondaryColor} strokeWidth="2">
          {/* Worldwide Tour Wireframe Globe */}
          <circle cx="50" cy="50" r="36" />
          <ellipse cx="50" cy="50" rx="18" ry="36" />
          <ellipse cx="50" cy="50" rx="36" ry="15" />
          <line x1="14" y1="50" x2="86" y2="50" />
          <line x1="50" y1="14" x2="50" y2="86" />
          <ellipse
            cx="50"
            cy="50"
            rx="44"
            ry="12"
            transform="rotate(-22 50 50)"
            strokeDasharray="4 3"
          />
        </g>
      )}
    </svg>
  );
};

export const MerchVisualPreview: React.FC<MerchVisualPreviewProps> = ({
  formatId,
  coverArt,
  title,
  artistName,
  primaryColor,
  secondaryColor,
  variantStyle,
  isSigned = false,
  hasObiStrip = false,
  hypeStickerText,
  specTier = 'deluxe_heavyweight',
  apparelDesign,
  viewSide,
  size = 'md'
}) => {
  const fallbackCover =
    coverArt ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%2318181b"/></svg>';

  const scaleClass =
    size === 'lg'
      ? 'scale-[1.12]'
      : size === 'sm'
      ? 'scale-[0.72]'
      : 'scale-[0.94]';

  const containerHeight =
    size === 'lg' ? 'h-56' : size === 'sm' ? 'h-32' : 'h-44';

  const activeSide = viewSide || apparelDesign?.defaultViewSide || 'front';
  const frontText = (apparelDesign?.frontText ?? artistName).toUpperCase();
  const frontSubText = (
    apparelDesign?.frontSubText ?? 'OFFICIAL ARCHIVE CAPSULE'
  ).toUpperCase();
  const backHeading = (
    apparelDesign?.backHeading ?? `${artistName.toUpperCase()} WORLD TOUR`
  ).toUpperCase();
  const backText =
    apparelDesign?.backText ||
    'NEW YORK • LONDON • TOKYO • PARIS • SEOUL • LOS ANGELES • SYDNEY • BERLIN';
  const backStyle = apparelDesign?.backPrintStyle || 'tour_dates_list';
  const fontClass = getFontClass(apparelDesign?.fontStyle);
  const motif = apparelDesign?.graphicMotif || 'chrome_tribal';
  const customPhotoUrl = apparelDesign?.customGraphicUrl;
  const hasSleevePrint = apparelDesign?.hasSleevePrint ?? true;

  // ============================================================================
  // HELPER: PHOTOREALISTIC 12-INCH VINYL RECORD DISC (SVG LATHE + REALISTIC WAX)
  // ============================================================================
  const renderStudioVinylRecord = (
    diameterPx: number,
    uidSuffix: string,
    extraClass = ''
  ) => {
    const isPicture =
      variantStyle === 'picture_disc' || formatId === 'vinyl_picture';
    const isSplatter =
      variantStyle === 'splatter' || formatId === 'vinyl_splatter';
    const isMarble = variantStyle === 'marble' || formatId === 'vinyl_signed';
    const isTranslucent =
      variantStyle === 'translucent' || formatId === 'vinyl_color';

    const gradId = `vinylWax_${uidSuffix}_${formatId}`;
    const sheenId = `vinylSheen_${uidSuffix}_${formatId}`;

    return (
      <div
        style={{ width: `${diameterPx}px`, height: `${diameterPx}px` }}
        className={`relative rounded-full shadow-[0_16px_32px_rgba(0,0,0,0.68)] flex items-center justify-center overflow-hidden select-none shrink-0 ${extraClass}`}
      >
        {isPicture ? (
          <img
            src={fallbackCover}
            alt={title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
                {isSplatter ? (
                  <>
                    <stop offset="0%" stopColor={secondaryColor} />
                    <stop offset="32%" stopColor={primaryColor} />
                    <stop offset="82%" stopColor={primaryColor} />
                    <stop offset="100%" stopColor="#09090b" />
                  </>
                ) : isTranslucent ? (
                  <>
                    <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.9" />
                    <stop offset="45%" stopColor={primaryColor} stopOpacity="0.92" />
                    <stop offset="88%" stopColor={primaryColor} stopOpacity="0.98" />
                    <stop offset="100%" stopColor="#09090b" />
                  </>
                ) : isMarble ? (
                  <>
                    <stop offset="0%" stopColor={secondaryColor} />
                    <stop offset="48%" stopColor={primaryColor} />
                    <stop offset="78%" stopColor={secondaryColor} stopOpacity="0.65" />
                    <stop offset="100%" stopColor={primaryColor} />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="45%" stopColor={primaryColor} />
                    <stop offset="92%" stopColor="#09090b" />
                    <stop offset="100%" stopColor="#27272a" />
                  </>
                )}
              </radialGradient>

              <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="42%" stopColor="rgba(255,255,255,0.03)" />
                <stop offset="48%" stopColor="rgba(255,255,255,0.28)" />
                <stop offset="52%" stopColor="rgba(255,255,255,0.28)" />
                <stop offset="58%" stopColor="rgba(255,255,255,0.03)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* Base Wax Disc */}
            <circle cx="100" cy="100" r="99" fill={`url(#${gradId})`} />

            {/* Marble Swirl Bands */}
            {isMarble && (
              <g opacity="0.55" fill="none" stroke={secondaryColor} strokeLinecap="round">
                <path d="M 32 95 A 68 68 0 0 1 162 72" strokeWidth="12" opacity="0.45" />
                <path d="M 38 118 A 65 65 0 0 0 158 128" strokeWidth="9" opacity="0.5" />
                <path d="M 54 52 A 52 52 0 0 1 148 144" strokeWidth="6" opacity="0.4" />
              </g>
            )}

            {/* Starburst Hand-Poured Splatter Rays */}
            {isSplatter && (
              <g opacity="0.92">
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = i * 15;
                  const len = i % 2 === 0 ? 28 : 18;
                  const startY = i % 3 === 0 ? 14 : 22;
                  return (
                    <g key={i} transform={`rotate(${angle} 100 100)`}>
                      <line
                        x1="100"
                        y1={startY}
                        x2="100"
                        y2={startY + len}
                        stroke={secondaryColor}
                        strokeWidth={i % 2 === 0 ? '2.8' : '1.8'}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="103"
                        cy={startY + len + 6}
                        r={i % 3 === 0 ? '2.2' : '1.4'}
                        fill={secondaryColor}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Optical Specular Sheen Across Wax */}
            <circle cx="100" cy="100" r="99" fill={`url(#${sheenId})`} />
            <circle
              cx="100"
              cy="100"
              r="99"
              fill={`url(#${sheenId})`}
              transform="rotate(90 100 100)"
              opacity="0.55"
            />

            {/* Precision Audio Lathe Grooves & Track Bands */}
            <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.9" />
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" />
            <circle cx="100" cy="100" r="71" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
            <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1.1" />
            <circle cx="100" cy="100" r="57" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
            <circle cx="100" cy="100" r="49" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
          </svg>
        )}

        {/* Picture Disc Groove Overlay */}
        {isPicture && (
          <div className="absolute inset-0 rounded-full border-2 border-white/35 shadow-[inset_0_0_18px_rgba(0,0,0,0.75)] pointer-events-none">
            <div className="absolute inset-3 rounded-full border border-white/20" />
            <div className="absolute inset-6 rounded-full border border-black/35" />
            <div className="absolute inset-9 rounded-full border border-white/20" />
          </div>
        )}

        {/* Center 4-Inch Pressed Paper Label & Spindle Hole */}
        <div
          className="relative z-10 w-[33%] h-[33%] rounded-full overflow-hidden border border-black/60 shadow-md flex items-center justify-center bg-zinc-900"
          style={{
            backgroundImage: isPicture ? undefined : `url(${fallbackCover})`,
            backgroundColor: isPicture ? '#18181b' : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-[3px] rounded-full border border-white/40 pointer-events-none" />
          <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#09090b] border border-white/75 shadow-inner" />
        </div>
      </div>
    );
  };

  // ============================================================================
  // 1. STUDIO VINYL LPs (Clean, High-Fidelity Apple Music / UMG Webstore Shot)
  // ============================================================================
  if (formatId.startsWith('vinyl_')) {
    const isDoubleLp = formatId === 'vinyl_splatter';
    const isPictureDisc = formatId === 'vinyl_picture';

    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        {/* Clean studio drop shadow */}
        <div className="absolute bottom-2.5 w-4/5 h-4 rounded-full bg-black/35 blur-md pointer-events-none" />

        {isPictureDisc ? (
          /* Picture Disc in Crystal Clear PVC Display Sleeve */
          <div className={`relative flex items-center justify-center ${scaleClass}`}>
            <div className="relative w-[132px] h-[132px] rounded-[6px] bg-white/10 dark:bg-white/5 backdrop-blur-2xs border border-white/30 shadow-2xl flex items-center justify-center p-1.5">
              {/* Top PVC Sleeve Flap Seam */}
              <div className="absolute top-0 inset-x-0 h-2.5 bg-white/15 border-b border-white/25" />
              {renderStudioVinylRecord(116, 'picdisc')}
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-xs bg-black/85 border border-white/25 text-[5.5px] font-mono font-bold text-white uppercase tracking-wider">
                PICTURE DISC
              </div>
            </div>
          </div>
        ) : (
          /* Standard / Color / 2LP Splatter / Signed LP Gatefold + Emerging Record */
          <div className={`relative flex items-center justify-center ${scaleClass}`}>
            {/* Disc 2 (if 2LP Gatefold) cleanly staggered behind */}
            {isDoubleLp && (
              <div className="relative z-0 translate-x-12 -translate-y-2">
                {renderStudioVinylRecord(108, 'disc2', 'opacity-90')}
              </div>
            )}

            {/* Primary 12" Vinyl Disc smoothly emerging from sleeve */}
            <div
              className={`relative z-10 ${
                isDoubleLp ? 'translate-x-6 translate-y-1' : 'translate-x-8'
              } transition-transform duration-300 group-hover:translate-x-10`}
            >
              {renderStudioVinylRecord(114, 'disc1')}
            </div>

            {/* Crisp Square 12" Album Jacket Sleeve */}
            <div className="relative z-20 -translate-x-7 w-[118px] h-[118px] rounded-[3px] overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.65)] border border-white/20 bg-zinc-900 shrink-0">
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Realistic Spine Fold Crease on Left */}
              <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/65 via-white/25 to-transparent border-r border-black/35 pointer-events-none" />

              {/* Optional Clean Japanese Obi Spine Strip */}
              {hasObiStrip && (
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="absolute inset-y-0 left-2 w-3.5 border-x border-white/30 shadow flex flex-col items-center justify-between py-1 z-10"
                >
                  <div
                    style={{ backgroundColor: secondaryColor }}
                    className="w-full h-2"
                  />
                  <span className="text-[4.5px] font-mono font-black text-white uppercase tracking-tighter writing-vertical-rl">
                    STEREO 33
                  </span>
                  <div className="w-2.5 h-2.5 bg-white text-black text-[4px] font-black flex items-center justify-center">
                    LP
                  </div>
                </div>
              )}

              {/* Subtle Matte Paper & Shrink-Wrap Light Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/18 pointer-events-none" />

              {/* Clean Minimal Hype Sticker */}
              {hypeStickerText && (
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-[2px] bg-black/80 backdrop-blur-xs border border-white/30 text-[5px] font-mono font-bold text-white uppercase tracking-wider shadow">
                  {isDoubleLp
                    ? '2LP SPLATTER'
                    : isSigned
                    ? 'SIGNED LP'
                    : '180G VINYL'}
                </div>
              )}

              {/* Authentic Hand-Signed Marker Autograph on Cover */}
              {isSigned && (
                <svg
                  viewBox="0 0 120 45"
                  className="absolute bottom-1.5 right-1.5 w-20 h-7 z-20 drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]"
                >
                  <path
                    d="M10 32 C 22 8, 34 38, 48 18 C 58 6, 66 34, 80 20 C 90 12, 98 28, 114 14 M 28 35 L 100 25"
                    fill="none"
                    stroke="#FDE047"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 2. ULTIMATE ERA COLLECTOR BOX SET
  // ============================================================================
  if (formatId === 'box_set_deluxe') {
    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="absolute bottom-2 w-4/5 h-5 rounded-full bg-black/40 blur-md pointer-events-none" />
        <div className={`relative flex items-center justify-center ${scaleClass}`}>
          <div className="absolute -translate-x-12 -translate-y-1 z-0">
            {renderStudioVinylRecord(96, 'boxlp')}
          </div>
          <div
            style={{
              background: `linear-gradient(145deg, ${primaryColor}, #18181b)`,
              borderColor: secondaryColor
            }}
            className="absolute translate-x-12 translate-y-1 rotate-6 w-24 h-28 rounded-md shadow-2xl border p-1.5 flex flex-col justify-between z-10"
          >
            <div className="text-[5.5px] font-black uppercase tracking-widest text-white/80">
              64P ARCHIVE ZINE
            </div>
            <img
              src={fallbackCover}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-16 object-cover rounded-xs border border-white/20"
            />
            <div className="text-[6px] font-mono text-amber-300 font-bold">
              + DELUXE CD
            </div>
          </div>

          <div className="relative z-20 w-[112px] h-[120px] rounded-[4px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.75)] border-2 border-amber-400/60 bg-zinc-950 flex">
            <div className="w-3.5 h-full bg-gradient-to-r from-amber-500/40 via-zinc-900 to-black border-r border-amber-400/40 flex items-center justify-center">
              <span className="text-[5px] font-black text-amber-300 tracking-widest uppercase writing-vertical-rl">
                COLLECTOR BOX
              </span>
            </div>
            <div className="flex-1 h-full relative">
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-[9px] font-black text-white uppercase tracking-tight truncate">
                  {title}
                </div>
                <div className="text-[6px] font-mono text-amber-300 uppercase tracking-widest">
                  2LP + ZINE + CD BOX
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. CRYSTAL JEWEL CASE CD & HARDCOVER DELUXE ZINE + CD
  // ============================================================================
  if (formatId === 'cd_standard' || formatId === 'cd_deluxe_zine') {
    const isZine = formatId === 'cd_deluxe_zine';

    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="absolute bottom-2 w-3/4 h-4 rounded-full bg-black/35 blur-md pointer-events-none" />
        <div className={`relative flex items-center justify-center ${scaleClass}`}>
          {isZine && (
            <div className="absolute -translate-x-12 -translate-y-2 -rotate-12 w-20 h-24 bg-white p-1.5 pb-4 rounded-[2px] shadow-xl border border-zinc-300 z-0">
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="relative z-10 translate-x-9 w-[104px] h-[104px] rounded-full shadow-[0_12px_28px_rgba(0,0,0,0.6)] border border-white/50 flex items-center justify-center overflow-hidden"
            style={{
              background: `conic-gradient(from 45deg, #f4f4f5, #a1a1aa, #fde68a, #a7f3d0, #bae6fd, #f5d0fe, #e4e4e7, ${secondaryColor}, #f4f4f5)`
            }}
          >
            <div
              className="absolute inset-1 rounded-full opacity-55 mix-blend-multiply"
              style={{
                backgroundImage: `url(${fallbackCover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div className="relative z-10 w-8 h-8 rounded-full bg-zinc-900/40 backdrop-blur-xs border-2 border-white/80 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-white/60" />
            </div>
          </div>

          <div
            className={`relative z-20 -translate-x-5 ${
              isZine
                ? 'w-[106px] h-[124px] rounded-r-[4px]'
                : 'w-[114px] h-[108px] rounded-[3px]'
            } overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.6)] border border-white/35 bg-zinc-900 flex`}
          >
            <div
              style={{
                backgroundColor: isZine ? primaryColor : undefined
              }}
              className={`w-3.5 h-full shrink-0 border-r border-white/30 flex flex-col justify-between py-1 items-center ${
                isZine
                  ? 'shadow-inner'
                  : 'bg-gradient-to-r from-white/40 via-zinc-500/40 to-black/60'
              }`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-full h-[2px] bg-white/30" />
              ))}
            </div>

            <div className="flex-1 h-full relative">
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/25 pointer-events-none" />
              {isZine && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-xs bg-black/80 text-white text-[6px] font-black uppercase tracking-wider border border-white/20">
                  64P ZINE + CD
                </div>
              )}
              {isSigned && (
                <svg
                  viewBox="0 0 120 45"
                  className="absolute bottom-1 right-1 w-16 h-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                >
                  <path
                    d="M10 32 C 22 8, 34 38, 48 18 C 58 6, 66 34, 80 20 C 90 12, 98 28, 114 14"
                    fill="none"
                    stroke="#FDE047"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 4. LIMITED TRANSLUCENT ANALOG CASSETTE TAPE
  // ============================================================================
  if (formatId === 'cassette_retro') {
    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="absolute bottom-2 w-3/4 h-4 rounded-full bg-black/35 blur-md pointer-events-none" />
        <div className={`relative flex items-center justify-center ${scaleClass}`}>
          <div className="relative z-10 -translate-x-9 -rotate-3 w-[78px] h-[118px] rounded-[3px] overflow-hidden shadow-2xl border border-white/30 bg-zinc-900 flex">
            <div
              style={{ backgroundColor: primaryColor }}
              className="w-3 h-full border-r border-white/25 flex items-center justify-center"
            >
              <span className="text-[5px] font-black text-white uppercase tracking-widest writing-vertical-rl truncate max-h-[90px]">
                {title}
              </span>
            </div>
            <div className="flex-1 h-full relative">
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/20" />
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}aa, ${secondaryColor}66)`,
              borderColor: secondaryColor
            }}
            className="relative z-20 translate-x-4 translate-y-2 w-[132px] h-[84px] rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.7)] border-2 p-2 flex flex-col justify-between overflow-hidden backdrop-blur-xs"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 border border-black/40 absolute top-1 left-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 border border-black/40 absolute top-1 right-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 border border-black/40 absolute bottom-1 left-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 border border-black/40 absolute bottom-1 right-1" />

            <div className="relative z-10 bg-zinc-950/90 rounded-[3px] px-2 py-1 flex items-center gap-2 border border-white/20 shadow-xs">
              <img
                src={fallbackCover}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-[2px] object-cover shrink-0 border border-white/15"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[8px] font-black text-white truncate uppercase tracking-tight">
                  {title}
                </div>
                <div className="text-[6px] font-mono text-zinc-400 uppercase tracking-widest truncate">
                  {artistName} • SIDE A
                </div>
              </div>
            </div>

            <div className="relative z-10 mx-auto w-[96px] h-[26px] rounded-full bg-zinc-950/85 border border-white/25 flex items-center justify-between px-2.5 shadow-inner">
              <div className="w-5 h-5 rounded-full border-2 border-white/85 bg-zinc-900 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              </div>
              <div className="w-9 h-3.5 rounded-[2px] bg-amber-950/80 border border-white/20 flex items-center justify-center overflow-hidden">
                <div className="w-full h-[1px] bg-white/40" />
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-white/85 bg-zinc-900 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SVG-NATIVE GARMENT TYPOGRAPHY & GRAPHIC ENGINE FOR HOODIE, TEE & VARSITY JACKET
  // Renders inside the SVG viewBox (0 0 240 220) clipped to the torso (x=64..176)
  // so text & graphics never drift, never hit sleeves, and never overflow the hem.
  // ============================================================================
  const svgFontProps = (() => {
    switch (apparelDesign?.fontStyle) {
      case 'street_gothic':
        return {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic' as const,
          fontWeight: 900,
          letterSpacing: '1.6px'
        };
      case 'luxury_serif':
        return {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'normal' as const,
          fontWeight: 700,
          letterSpacing: '2.2px'
        };
      case 'collegiate_block':
        return {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontStyle: 'normal' as const,
          fontWeight: 900,
          letterSpacing: '1.4px'
        };
      case 'punk_scrawl':
        return {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontStyle: 'italic' as const,
          fontWeight: 800,
          letterSpacing: '0.6px'
        };
      case 'brutalist_sans':
      default:
        return {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontStyle: 'normal' as const,
          fontWeight: 900,
          letterSpacing: '0.8px'
        };
    }
  })();

  const trimText = (str: string, maxLen: number) => {
    const clean = (str || '').trim().toUpperCase();
    return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
  };

  const renderSvgTorsoMotif = (
    cx: number,
    cy: number,
    boxSize: number,
    uid: string,
    overrideMotif?: ApparelGraphicMotif
  ) => {
    const activeMotif = overrideMotif || motif;
    const half = boxSize / 2;
    const x0 = cx - half;
    const y0 = cy - half;

    if (activeMotif === 'typography_only') {
      return (
        <g>
          <line
            x1={cx - 34}
            y1={cy - 10}
            x2={cx + 34}
            y2={cy - 10}
            stroke={secondaryColor}
            strokeWidth="1"
            opacity="0.45"
          />
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="9.5"
            fontFamily={svgFontProps.fontFamily}
            fontStyle={svgFontProps.fontStyle}
            fontWeight={svgFontProps.fontWeight}
            letterSpacing="2.4px"
          >
            {trimText(frontText || artistName, 12)}
          </text>
          <line
            x1={cx - 34}
            y1={cy + 10}
            x2={cx + 34}
            y2={cy + 10}
            stroke={secondaryColor}
            strokeWidth="1"
            opacity="0.45"
          />
        </g>
      );
    }

    if (activeMotif === 'custom_photo' && customPhotoUrl) {
      const clipId = `photoClip_${uid}`;
      return (
        <g>
          <defs>
            <clipPath id={clipId}>
              <rect x={x0} y={y0} width={boxSize} height={boxSize} rx="3" />
            </clipPath>
          </defs>
          <image
            href={customPhotoUrl}
            x={x0}
            y={y0}
            width={boxSize}
            height={boxSize}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
          <rect
            x={x0}
            y={y0}
            width={boxSize}
            height={boxSize}
            rx="3"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="1.4"
          />
        </g>
      );
    }

    if (activeMotif === 'box_emblem') {
      const bw = Math.min(88, Math.max(54, boxSize * 1.65));
      const bh = 20;
      return (
        <g>
          <rect
            x={cx - bw / 2}
            y={cy - bh / 2}
            width={bw}
            height={bh}
            rx="2"
            fill={secondaryColor}
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={primaryColor}
            fontSize="10.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            letterSpacing="1.2px"
          >
            {trimText(frontText || artistName, 11)}
          </text>
        </g>
      );
    }

    const scale = boxSize / 100;
    return (
      <g transform={`translate(${x0}, ${y0}) scale(${scale})`}>
        {activeMotif === 'chrome_tribal' && (
          <g fill="none" stroke={secondaryColor} strokeWidth="3.2" strokeLinecap="round">
            <path
              d="M50 6 Q54 44 94 50 Q54 56 50 94 Q46 56 6 50 Q46 44 50 6 Z"
              fill={secondaryColor}
              fillOpacity="0.2"
            />
            <path d="M22 22 C40 38, 60 38, 78 22" />
            <path d="M22 78 C40 62, 60 62, 78 78" />
            <circle cx="50" cy="50" r="14" strokeWidth="2.4" />
            <circle cx="50" cy="50" r="4.5" fill={secondaryColor} />
          </g>
        )}

        {activeMotif === 'sacred_flame' && (
          <g fill={secondaryColor}>
            <path
              d="M50 8 C58 26, 78 34, 76 58 C75 76, 62 90, 50 92 C38 90, 25 76, 24 58 C22 34, 42 26, 50 8 Z"
              fillOpacity="0.24"
              stroke={secondaryColor}
              strokeWidth="3"
            />
            <path
              d="M50 24 C55 38, 66 44, 64 62 C63 74, 56 82, 50 84 C44 82, 37 74, 36 62 C34 44, 45 38, 50 24 Z"
              fill={secondaryColor}
            />
            <path
              d="M50 4 L50 96 M36 18 L64 18"
              stroke={primaryColor}
              strokeWidth="2.6"
            />
          </g>
        )}

        {activeMotif === 'fallen_cherub' && (
          <g fill="none" stroke={secondaryColor} strokeWidth="2.8" strokeLinecap="round">
            <ellipse cx="50" cy="18" rx="14" ry="4" strokeWidth="2.4" />
            <path
              d="M46 32 C30 20, 10 26, 8 46 C18 46, 26 52, 14 64 C26 62, 34 66, 24 78 C36 74, 44 66, 48 54 Z"
              fill={secondaryColor}
              fillOpacity="0.25"
            />
            <path
              d="M54 32 C70 20, 90 26, 92 46 C82 46, 74 52, 86 64 C74 62, 66 66, 76 78 C64 74, 56 66, 52 54 Z"
              fill={secondaryColor}
              fillOpacity="0.25"
            />
            <path d="M50 28 L50 84" strokeWidth="3" />
          </g>
        )}

        {(activeMotif === 'world_globe' ||
          (activeMotif === 'custom_photo' && !customPhotoUrl)) && (
          <g fill="none" stroke={secondaryColor} strokeWidth="2.6">
            <circle cx="50" cy="50" r="36" />
            <ellipse cx="50" cy="50" rx="18" ry="36" />
            <ellipse cx="50" cy="50" rx="36" ry="15" />
            <line x1="14" y1="50" x2="86" y2="50" />
            <line x1="50" y1="14" x2="50" y2="86" />
            <ellipse
              cx="50"
              cy="50"
              rx="44"
              ry="12"
              transform="rotate(-22 50 50)"
              strokeDasharray="4 3"
            />
          </g>
        )}
      </g>
    );
  };

  const renderSvgBackPrintLayer = (topY: number, uid: string) => {
    const rawCities = backText
      .split(/[\n•,·]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    const cities =
      rawCities.length > 0
        ? rawCities
        : [
            'NEW YORK',
            'LONDON',
            'TOKYO',
            'PARIS',
            'SEOUL',
            'LOS ANGELES',
            'JAKARTA',
            'BERLIN'
          ];

    if (backStyle === 'clean_blank') {
      return (
        <g>
          <rect
            x="92"
            y={topY + 4}
            width="56"
            height="12"
            rx="1.5"
            fill="rgba(0,0,0,0.45)"
            stroke={secondaryColor}
            strokeWidth="0.9"
          />
          <text
            x="120"
            y={topY + 12}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="5.2"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="700"
            letterSpacing="1.2px"
          >
            {trimText(`${artistName} ATELIER`, 14)}
          </text>
        </g>
      );
    }

    if (backStyle === 'jersey_number_99') {
      return (
        <g>
          <text
            x="120"
            y={topY + 14}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="9.5"
            fontFamily={svgFontProps.fontFamily}
            fontStyle={svgFontProps.fontStyle}
            fontWeight={svgFontProps.fontWeight}
            letterSpacing="2px"
          >
            {trimText(backHeading, 14)}
          </text>
          <text
            x="120"
            y={topY + 62}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="44"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="900"
          >
            01
          </text>
          <text
            x="120"
            y={topY + 76}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="5.4"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="700"
            letterSpacing="1.5px"
            opacity="0.85"
          >
            {trimText(frontSubText, 20)}
          </text>
        </g>
      );
    }

    if (backStyle === 'oversized_arch_logo') {
      return (
        <g>
          <text
            x="120"
            y={topY + 12}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="8.8"
            fontFamily={svgFontProps.fontFamily}
            fontStyle={svgFontProps.fontStyle}
            fontWeight={svgFontProps.fontWeight}
            letterSpacing={svgFontProps.letterSpacing}
          >
            {trimText(backHeading, 16)}
          </text>
          {renderSvgTorsoMotif(
            120,
            topY + 46,
            52,
            `${uid}_arch`,
            motif === 'typography_only' ? 'chrome_tribal' : motif
          )}
          <text
            x="120"
            y={topY + 82}
            textAnchor="middle"
            fill={secondaryColor}
            fontSize="5.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="700"
            letterSpacing="1.8px"
            opacity="0.88"
          >
            WORLDWIDE ARCHIVE
          </text>
        </g>
      );
    }

    if (backStyle === 'manifesto_quote') {
      const words = backText.toUpperCase().split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).trim().length <= 20) {
          current = (current + ' ' + w).trim();
        } else {
          if (lines.length < 4) lines.push(current);
          current = w;
        }
      }
      if (current && lines.length < 4) lines.push(current);

      return (
        <g>
          <rect
            x="76"
            y={topY + 6}
            width="88"
            height="76"
            rx="2"
            fill="rgba(0,0,0,0.38)"
            stroke={secondaryColor}
            strokeWidth="1.1"
          />
          <text
            x="82"
            y={topY + 18}
            fill={secondaryColor}
            fontSize="6.5"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            letterSpacing="0.8px"
          >
            {trimText(backHeading, 16)}
          </text>
          <line
            x1="82"
            y1={topY + 22}
            x2="158"
            y2={topY + 22}
            stroke={secondaryColor}
            strokeWidth="0.7"
            opacity="0.4"
          />
          {lines.map((ln, idx) => (
            <text
              key={idx}
              x="82"
              y={topY + 33 + idx * 9.5}
              fill="#f4f4f5"
              fontSize="5.4"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontWeight="600"
            >
              {trimText(ln, 20)}
            </text>
          ))}
          <text
            x="82"
            y={topY + 76}
            fill={secondaryColor}
            fontSize="4.8"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            opacity="0.75"
          >
            480GSM ARCHIVE EDITION
          </text>
        </g>
      );
    }

    // Default: 'tour_dates_list' — Perfectly aligned 2-column tour list inside the back torso
    const showBackEmblem = motif !== 'typography_only';
    const dividerY = showBackEmblem ? topY + 51 : topY + 20;
    const listStartY = dividerY + 9;

    return (
      <g>
        <text
          x="120"
          y={topY + 11}
          textAnchor="middle"
          fill={secondaryColor}
          fontSize="8.2"
          fontFamily={svgFontProps.fontFamily}
          fontStyle={svgFontProps.fontStyle}
          fontWeight={svgFontProps.fontWeight}
          letterSpacing={svgFontProps.letterSpacing}
        >
          {trimText(backHeading, 17)}
        </text>

        {showBackEmblem &&
          renderSvgTorsoMotif(120, topY + 32, 32, `${uid}_tour`)}

        <line
          x1="76"
          y1={dividerY}
          x2="164"
          y2={dividerY}
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.45"
        />

        {cities.map((city, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const xPos = col === 0 ? 76 : 124;
          const yPos = listStartY + row * 9;
          return (
            <text
              key={idx}
              x={xPos}
              y={yPos}
              textAnchor="start"
              fill="#f4f4f5"
              fontSize="5.5"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontWeight="700"
              letterSpacing="0.3px"
            >
              {trimText(city, 11)}
            </text>
          );
        })}
      </g>
    );
  };

  // ============================================================================
  // 5. STANDALONE STREETWEAR: 480GSM HEAVYWEIGHT BOXY HOODIE (FRONT, BACK, OR BOTH)
  // ============================================================================
  if (formatId === 'apparel_hoodie') {
    const renderSingleHoodie = (side: 'front' | 'back', compact = false) => {
      const uid = `hoodie_${side}_${compact ? 'c' : 'f'}`;
      return (
        <div
          className={`relative ${
            compact ? 'w-[132px] h-[136px]' : 'w-[176px] h-[168px]'
          } flex items-center justify-center shrink-0`}
        >
          <svg
            viewBox="0 0 240 220"
            className="w-full h-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.58)]"
          >
            <defs>
              <linearGradient
                id={`hoodieGrad_${uid}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="62%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
              <clipPath id={`hoodieTorsoClip_${uid}`}>
                <rect x="64" y="46" width="112" height="136" rx="4" />
              </clipPath>
            </defs>

            {/* Structured Double-Layered Hood */}
            {side === 'front' ? (
              <>
                <path
                  d="M 78 42 C 72 12, 102 6, 120 6 C 138 6, 168 12, 162 42 Z"
                  fill={`url(#hoodieGrad_${uid})`}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.5"
                />
                <path
                  d="M 92 40 C 92 20, 148 20, 148 40 C 135 46, 105 46, 92 40 Z"
                  fill="rgba(0,0,0,0.55)"
                />
              </>
            ) : (
              <path
                d="M 78 38 C 74 10, 166 10, 162 38 C 156 70, 84 70, 78 38 Z"
                fill={`url(#hoodieGrad_${uid})`}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1.6"
              />
            )}

            {/* Boxy Drop-Shoulder Heavyweight Torso & Sleeves */}
            <path
              d="M 80 38 L 40 52 L 14 140 L 42 150 L 58 96 L 58 190 L 182 190 L 182 96 L 198 150 L 226 140 L 200 52 L 160 38 Q 120 48 80 38 Z"
              fill={`url(#hoodieGrad_${uid})`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Draped Back Hood on top of upper back if Back View */}
            {side === 'back' && (
              <path
                d="M 82 36 C 86 66, 154 66, 158 36 Q 120 26 82 36 Z"
                fill="rgba(0,0,0,0.3)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.4"
              />
            )}

            {/* Ribbed Cuffs & Waistband Hem */}
            <rect
              x="58"
              y="186"
              width="124"
              height="14"
              rx="2"
              fill="rgba(0,0,0,0.45)"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1"
            />

            {/* Sleeve Prints down the arms if enabled */}
            {hasSleevePrint && (
              <g fill={secondaryColor} opacity="0.85">
                <circle cx="34" cy="96" r="3" />
                <circle cx="30" cy="110" r="2.5" />
                <circle cx="26" cy="124" r="3" />
                <circle cx="206" cy="96" r="3" />
                <circle cx="210" cy="110" r="2.5" />
                <circle cx="214" cy="124" r="3" />
              </g>
            )}

            {/* Kangaroo Pocket & Short Wide-Set Drawstrings ONLY on Front View */}
            {side === 'front' && (
              <>
                <path
                  d="M 76 148 L 164 148 L 174 186 L 66 186 Z"
                  fill="rgba(0,0,0,0.26)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1.2"
                />
                {/* Short wide-spaced drawstrings so they never touch center chest text */}
                <path
                  d="M 96 43 Q 94 54 96 63"
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <path
                  d="M 144 43 Q 146 54 144 63"
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </>
            )}

            {/* TORSO-CLIPPED GRAPHIC & TYPOGRAPHY LAYER */}
            <g clipPath={`url(#hoodieTorsoClip_${uid})`}>
              {side === 'front' ? (
                <g>
                  <text
                    x="120"
                    y="64"
                    textAnchor="middle"
                    fill={secondaryColor}
                    fontSize="11.5"
                    fontFamily={svgFontProps.fontFamily}
                    fontStyle={svgFontProps.fontStyle}
                    fontWeight={svgFontProps.fontWeight}
                    letterSpacing={svgFontProps.letterSpacing}
                  >
                    {trimText(frontText, 14)}
                  </text>

                  {renderSvgTorsoMotif(120, 96, 44, uid)}

                  <text
                    x="120"
                    y="134"
                    textAnchor="middle"
                    fill={secondaryColor}
                    fontSize="5.4"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight="700"
                    letterSpacing="1.2px"
                    opacity="0.88"
                  >
                    {trimText(frontSubText, 21)}
                  </text>
                </g>
              ) : (
                renderSvgBackPrintLayer(72, uid)
              )}
            </g>
          </svg>

          <span className="absolute bottom-1 right-2 text-[6px] font-mono uppercase tracking-widest text-zinc-400">
            {side}
          </span>
        </div>
      );
    };

    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className={`flex items-center justify-center -space-x-3 ${scaleClass}`}>
          {activeSide === 'both' ? (
            <>
              {renderSingleHoodie('front', true)}
              {renderSingleHoodie('back', true)}
            </>
          ) : (
            renderSingleHoodie(activeSide)
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 6. STANDALONE STREETWEAR: WASHED VINTAGE 260GSM BOXY TEE (FRONT, BACK, OR BOTH)
  // ============================================================================
  if (formatId === 'apparel_tshirt') {
    const renderSingleTee = (side: 'front' | 'back', compact = false) => {
      const uid = `tee_${side}_${compact ? 'c' : 'f'}`;
      return (
        <div
          className={`relative ${
            compact ? 'w-[130px] h-[132px]' : 'w-[172px] h-[162px]'
          } flex items-center justify-center shrink-0`}
        >
          <svg
            viewBox="0 0 240 210"
            className="w-full h-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)]"
          >
            <defs>
              <linearGradient
                id={`teeGrad_${uid}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="55%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>
              <clipPath id={`teeTorsoClip_${uid}`}>
                <rect x="66" y="44" width="108" height="144" rx="3" />
              </clipPath>
            </defs>

            <path
              d="M 84 26 L 30 46 L 14 104 L 54 116 L 62 82 L 62 194 L 178 194 L 178 82 L 186 116 L 226 104 L 210 46 L 156 26 Q 120 42 84 26 Z"
              fill={`url(#teeGrad_${uid})`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {side === 'front' ? (
              <>
                <path
                  d="M 88 26 Q 120 40 152 26 Q 120 30 88 26 Z"
                  fill="rgba(0,0,0,0.55)"
                />
                <rect x="112" y="29" width="16" height="6" rx="1" fill="#e4e4e7" />
                <path
                  d="M 82 26 Q 120 48 158 26"
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </>
            ) : (
              <path
                d="M 82 26 Q 120 34 158 26"
                fill="none"
                stroke={secondaryColor}
                strokeWidth="4.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            )}

            {/* TORSO-CLIPPED GRAPHIC & TYPOGRAPHY LAYER */}
            <g clipPath={`url(#teeTorsoClip_${uid})`}>
              {side === 'front' ? (
                <g>
                  <text
                    x="120"
                    y="64"
                    textAnchor="middle"
                    fill={secondaryColor}
                    fontSize="12"
                    fontFamily={svgFontProps.fontFamily}
                    fontStyle={svgFontProps.fontStyle}
                    fontWeight={svgFontProps.fontWeight}
                    letterSpacing={svgFontProps.letterSpacing}
                  >
                    {trimText(frontText, 14)}
                  </text>

                  {renderSvgTorsoMotif(120, 100, 48, uid)}

                  <text
                    x="120"
                    y="142"
                    textAnchor="middle"
                    fill={secondaryColor}
                    fontSize="5.4"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight="700"
                    letterSpacing="1.1px"
                    opacity="0.88"
                  >
                    {trimText(frontSubText, 20)}
                  </text>
                </g>
              ) : (
                renderSvgBackPrintLayer(50, uid)
              )}
            </g>
          </svg>

          <span className="absolute bottom-1 right-2 text-[6px] font-mono uppercase tracking-widest text-zinc-400">
            {side}
          </span>
        </div>
      );
    };

    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className={`flex items-center justify-center -space-x-3 ${scaleClass}`}>
          {activeSide === 'both' ? (
            <>
              {renderSingleTee('front', true)}
              {renderSingleTee('back', true)}
            </>
          ) : (
            renderSingleTee(activeSide)
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 7. STANDALONE STREETWEAR: EMBROIDERED 6-PANEL CAP (KEPT INTACT)
  // ============================================================================
  if (formatId === 'apparel_cap') {
    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="absolute bottom-3 w-3/4 h-4 rounded-full bg-black/40 blur-md pointer-events-none" />
        <div className={`relative w-[176px] h-[148px] flex items-center justify-center ${scaleClass}`}>
          <svg
            viewBox="0 0 240 190"
            className="w-full h-full drop-shadow-[0_16px_26px_rgba(0,0,0,0.6)]"
          >
            <defs>
              <linearGradient id="capCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="65%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
              <linearGradient id="capVisorGrad" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="50%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
            </defs>

            <path
              d="M 46 112 C 44 46, 82 22, 122 22 C 164 22, 196 48, 194 112 Q 120 124 46 112 Z"
              fill="url(#capCrownGrad)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="122"
              cy="21"
              rx="7"
              ry="3.5"
              fill={secondaryColor}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="1"
            />
            <path d="M 122 24 Q 90 62 82 114" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />
            <path d="M 122 24 Q 154 62 162 114" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />
            <circle cx="82" cy="48" r="2.8" fill="#18181b" stroke={secondaryColor} strokeWidth="1.4" />
            <circle cx="162" cy="48" r="2.8" fill="#18181b" stroke={secondaryColor} strokeWidth="1.4" />

            <path
              d="M 38 110 Q 120 128 202 110 C 216 136, 178 164, 118 164 C 58 164, 22 138, 38 110 Z"
              fill="url(#capVisorGrad)"
              stroke={secondaryColor}
              strokeWidth="1.6"
            />
            <path
              d="M 48 122 Q 120 138 192 122"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <path
              d="M 56 134 Q 120 148 184 134"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </svg>

          {/* 3D Chain-Stitched Front Crown Embroidery (No Album Link!) */}
          <div className="absolute top-[30px] flex flex-col items-center text-center pointer-events-none">
            <StreetwearGraphicRenderer
              motif={motif}
              secondaryColor={secondaryColor}
              primaryColor={primaryColor}
              customPhotoUrl={customPhotoUrl}
              frontText={frontText}
              artistName={artistName}
              compact={true}
            />
            <div
              style={{ color: secondaryColor }}
              className={`${fontClass} text-[8.5px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] max-w-[82px] truncate`}
            >
              {frontText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 8. STANDALONE STREETWEAR: WOOL & LEATHER VARSITY JACKET (FRONT, BACK, OR BOTH)
  // ============================================================================
  if (formatId === 'apparel_jacket') {
    const monogramLetter = (frontText || artistName || 'A')
      .trim()
      .charAt(0)
      .toUpperCase();

    const renderSingleJacket = (side: 'front' | 'back', compact = false) => {
      const uid = `jacket_${side}_${compact ? 'c' : 'f'}`;
      return (
        <div
          className={`relative ${
            compact ? 'w-[132px] h-[136px]' : 'w-[176px] h-[168px]'
          } flex items-center justify-center shrink-0`}
        >
          <svg
            viewBox="0 0 240 220"
            className="w-full h-full drop-shadow-[0_16px_28px_rgba(0,0,0,0.62)]"
          >
            <defs>
              <linearGradient
                id={`varsityWool_${uid}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
              <linearGradient
                id={`varsitySleeve_${uid}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={secondaryColor} />
                <stop offset="60%" stopColor={secondaryColor} />
                <stop offset="100%" stopColor="#27272a" />
              </linearGradient>
              <clipPath id={`varsityTorsoClip_${uid}`}>
                <rect x="64" y="46" width="112" height="132" rx="3" />
              </clipPath>
            </defs>

            <path
              d="M 64 42 L 34 54 L 12 146 L 42 156 L 60 98 Z"
              fill={`url(#varsitySleeve_${uid})`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M 176 42 L 206 54 L 228 146 L 198 156 L 180 98 Z"
              fill={`url(#varsitySleeve_${uid})`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            <path
              d="M 82 32 L 60 42 L 58 186 L 182 186 L 180 42 L 158 32 Q 120 46 82 32 Z"
              fill={`url(#varsityWool_${uid})`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
            />

            <path
              d="M 82 32 Q 120 52 158 32 Q 148 20 120 20 Q 92 20 82 32 Z"
              fill="#18181b"
              stroke={secondaryColor}
              strokeWidth="2.5"
            />

            <rect
              x="58"
              y="182"
              width="124"
              height="14"
              rx="2"
              fill="#18181b"
              stroke={secondaryColor}
              strokeWidth="2"
            />
            <line
              x1="58"
              y1="189"
              x2="182"
              y2="189"
              stroke={secondaryColor}
              strokeWidth="1.5"
            />

            {side === 'front' && (
              <>
                <line
                  x1="120"
                  y1="44"
                  x2="120"
                  y2="196"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                />
                {[56, 82, 108, 134, 160, 182].map(cy => (
                  <circle
                    key={cy}
                    cx="120"
                    cy={cy}
                    r="2.8"
                    fill="#f4f4f5"
                    stroke="#18181b"
                    strokeWidth="1"
                  />
                ))}
                <line
                  x1="72"
                  y1="138"
                  x2="88"
                  y2="166"
                  stroke={secondaryColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="168"
                  y1="138"
                  x2="152"
                  y2="166"
                  stroke={secondaryColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* TORSO-CLIPPED VARSITY PATCHES & BACK PRINT */}
            <g clipPath={`url(#varsityTorsoClip_${uid})`}>
              {side === 'front' ? (
                <g>
                  {/* Left Chest Chenille Monogram Patch (x=74..102, y=64..96) */}
                  <rect
                    x="74"
                    y="64"
                    width="28"
                    height="32"
                    rx="4"
                    fill={secondaryColor}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                  />
                  <text
                    x="88"
                    y="86"
                    textAnchor="middle"
                    fill={primaryColor}
                    fontSize="19"
                    fontFamily='Georgia, "Times New Roman", serif'
                    fontWeight="900"
                  >
                    {monogramLetter}
                  </text>

                  {/* Right Chest Chain-Stitch Script (centered at x=150, safely inside wool body x=126..174) */}
                  <text
                    x="150"
                    y="77"
                    textAnchor="middle"
                    fill={secondaryColor}
                    fontSize="8.5"
                    fontFamily={svgFontProps.fontFamily}
                    fontStyle={svgFontProps.fontStyle}
                    fontWeight={svgFontProps.fontWeight}
                    letterSpacing="0.8px"
                  >
                    {trimText(frontText, 8)}
                  </text>
                  <line
                    x1="134"
                    y1="82"
                    x2="166"
                    y2="82"
                    stroke={secondaryColor}
                    strokeWidth="1"
                    opacity="0.65"
                  />
                  <text
                    x="150"
                    y="90"
                    textAnchor="middle"
                    fill={secondaryColor}
                    fontSize="4.6"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight="700"
                    letterSpacing="0.8px"
                    opacity="0.8"
                  >
                    {trimText(frontSubText, 10)}
                  </text>
                </g>
              ) : (
                renderSvgBackPrintLayer(54, uid)
              )}
            </g>
          </svg>

          <span className="absolute bottom-1 right-2 text-[6px] font-mono uppercase tracking-widest text-zinc-400">
            {side}
          </span>
        </div>
      );
    };

    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className={`flex items-center justify-center -space-x-3 ${scaleClass}`}>
          {activeSide === 'both' ? (
            <>
              {renderSingleJacket('front', true)}
              {renderSingleJacket('back', true)}
            </>
          ) : (
            renderSingleJacket(activeSide)
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 9. STANDALONE ACCESSORY: AUDIOPHILE TURNTABLE PLATTER & CUSTOM SLIPMAT
  // ============================================================================
  if (formatId === 'acc_slipmat') {
    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className={`relative flex items-center justify-center ${scaleClass}`}>
          <div className="relative w-[148px] h-[132px] rounded-lg bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 border border-white/20 shadow-[0_18px_34px_rgba(0,0,0,0.7)] flex items-center justify-center p-2">
            <div className="relative w-[114px] h-[114px] -translate-x-2 rounded-full bg-gradient-to-tr from-zinc-400 via-zinc-200 to-zinc-500 p-[3px] shadow-xl flex items-center justify-center">
              <div className="w-full h-full rounded-full border-2 border-dashed border-zinc-900/70 flex items-center justify-center p-[2px]">
                <div
                  style={{
                    background: `radial-gradient(circle, ${primaryColor}, #09090b)`
                  }}
                  className="relative w-full h-full rounded-full overflow-hidden shadow-inner flex flex-col items-center justify-center"
                >
                  <div
                    style={{ borderColor: secondaryColor }}
                    className="absolute inset-2 rounded-full border-2 border-dashed opacity-75 pointer-events-none"
                  />
                  <StreetwearGraphicRenderer
                    motif={motif}
                    secondaryColor={secondaryColor}
                    primaryColor={primaryColor}
                    customPhotoUrl={customPhotoUrl}
                    frontText={frontText}
                    artistName={artistName}
                    compact={true}
                  />
                  <div
                    style={{ color: secondaryColor }}
                    className={`${fontClass} text-[6.5px] mt-1 tracking-widest max-w-[76px] truncate`}
                  >
                    {frontText}
                  </div>
                  <div className="absolute z-10 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-zinc-400 to-white border border-black/60 shadow" />
                </div>
              </div>
            </div>

            <svg
              viewBox="0 0 40 120"
              className="absolute right-1.5 top-2 w-8 h-28 pointer-events-none drop-shadow"
            >
              <circle cx="24" cy="18" r="10" fill="#3f3f46" stroke="#d4d4d8" strokeWidth="1.5" />
              <circle cx="24" cy="18" r="5" fill="#18181b" />
              <path
                d="M 24 18 L 24 58 Q 24 76 14 92 L 10 100"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect
                x="5"
                y="96"
                width="8"
                height="13"
                rx="1.5"
                transform="rotate(20 9 102)"
                fill={secondaryColor}
                stroke="#18181b"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 10. STANDALONE ACCESSORY: 16OZ HEAVY CANVAS STREETWEAR TOTE BAG
  // ============================================================================
  if (formatId === 'acc_tote') {
    return (
      <div
        className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="absolute bottom-1.5 w-2/3 h-4 rounded-full bg-black/35 blur-md pointer-events-none" />
        <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
          {/* Long Webbed Canvas Shoulder Straps */}
          <div className="relative w-14 h-8 -mb-1 flex justify-between z-0">
            <div
              style={{ borderColor: primaryColor }}
              className="w-full h-11 rounded-t-full border-t-[5px] border-x-[5px] brightness-90"
            />
          </div>

          {/* Gusseted 16oz Heavy Canvas Tote Body */}
          <div
            style={{
              background: `linear-gradient(160deg, ${primaryColor}, ${primaryColor}dd, #18181b)`
            }}
            className="relative z-20 w-[108px] h-[116px] rounded-b-[8px] rounded-t-[3px] shadow-[0_18px_32px_rgba(0,0,0,0.6)] border border-white/25 p-2.5 flex flex-col items-center justify-between overflow-hidden"
          >
            <div className="w-full flex justify-between px-3 -mt-1">
              <div className="w-2.5 h-2.5 border border-white/40 bg-black/20" />
              <div className="w-2.5 h-2.5 border border-white/40 bg-black/20" />
            </div>

            <div className="flex flex-col items-center text-center my-auto">
              <div
                style={{ color: secondaryColor }}
                className={`${fontClass} text-[8px] leading-tight max-w-[88px] truncate`}
              >
                {frontText}
              </div>
              <StreetwearGraphicRenderer
                motif={motif}
                secondaryColor={secondaryColor}
                primaryColor={primaryColor}
                customPhotoUrl={customPhotoUrl}
                frontText={frontText}
                artistName={artistName}
              />
              <div
                style={{ color: secondaryColor }}
                className="text-[5px] font-mono uppercase tracking-[0.2em] opacity-85 max-w-[88px] truncate"
              >
                {frontSubText}
              </div>
            </div>

            <div className="w-full pt-1 border-t border-white/15 flex items-center justify-between text-[4.5px] font-mono text-white/70 uppercase">
              <span>16OZ CANVAS</span>
              <span>{artistName}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 11. STANDALONE ACCESSORY: 18"x24" GALLERY-FRAMED ARCHIVAL LITHOGRAPH POSTER
  // ============================================================================
  return (
    <div
      className={`relative w-full ${containerHeight} flex items-center justify-center overflow-hidden select-none`}
    >
      <div className="absolute bottom-1.5 w-2/3 h-4 rounded-full bg-black/40 blur-md pointer-events-none" />
      <div className={`relative flex items-center justify-center ${scaleClass}`}>
        <div
          style={{ borderColor: secondaryColor }}
          className="relative w-[108px] h-[142px] rounded-[3px] bg-zinc-950 p-1.5 shadow-[0_20px_38px_rgba(0,0,0,0.75)] border-2 flex flex-col justify-between overflow-hidden"
        >
          <div
            style={{ backgroundColor: primaryColor }}
            className="w-full h-full p-2 flex flex-col justify-between border border-white/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent pointer-events-none z-20" />

            <div className="flex items-center justify-between text-[5px] font-mono uppercase tracking-widest text-white/75">
              <span>EXHIBITION PRINT</span>
              <span>18&quot; × 24&quot;</span>
            </div>

            <div className="my-auto flex flex-col items-center text-center">
              <StreetwearGraphicRenderer
                motif={motif}
                secondaryColor={secondaryColor}
                primaryColor={primaryColor}
                customPhotoUrl={customPhotoUrl}
                frontText={frontText}
                artistName={artistName}
              />
              <div
                style={{ color: secondaryColor }}
                className={`${fontClass} text-[8.5px] leading-tight mt-1 max-w-[84px] truncate`}
              >
                {frontText}
              </div>
              <div className="text-[4.8px] font-mono text-white/80 uppercase tracking-widest mt-0.5 max-w-[84px] truncate">
                {frontSubText}
              </div>
            </div>

            {isSigned && (
              <svg
                viewBox="0 0 120 45"
                className="absolute bottom-5 right-1 w-14 h-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]"
              >
                <path
                  d="M10 32 C 22 8, 34 38, 48 18 C 58 6, 66 34, 80 20 C 90 12, 98 28, 114 14"
                  fill="none"
                  stroke="#FDE047"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            )}

            <div className="pt-1 border-t border-white/20 flex items-end justify-between gap-1">
              <span className="text-[5px] font-mono text-white/75 uppercase truncate">
                {artistName}
              </span>
              <span className="text-[5px] font-mono text-amber-300 font-bold shrink-0">
                #001/500
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
