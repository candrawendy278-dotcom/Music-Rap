import type { GameState } from '../types';
import type {
  BrandOfferDefinition,
  BrandSignatureProduct,
  ActiveBrandContract
} from './brandDealsEngine';
import {
  BRAND_OFFERS_CATALOG,
  getEnsuredBrandDealsState,
  getAmbassadorRoleTierMeta
} from './brandDealsEngine';
import { calculateLuxuryPortfolioMetrics } from './luxuryAssetsEngine';

export interface RealBrandVisualConfig {
  brandId: string;
  officialLogoUrl: string;
  secondaryLogoUrl?: string;
  stockTicker: string;
  hqCountryFlag: string;
  authenticMonogramSvgDataUri: string;
}

export interface RealProductAssetMeta {
  productId: string;
  officialProductName: string;
  officialSkuOrRef: string;
  realPhotoUrl: string;
  fallbackPhotoUrl: string;
}

export interface ProductImpactBreakdownItem {
  productId: string;
  officialProductName: string;
  officialSkuOrRef: string;
  categoryTag: string;
  retailPrice: number;
  realPhotoUrl: string;
  fallbackPhotoUrl: string;
  baselineDailyUnits: number;
  playerBoostedDailyUnits: number;
  addedUnitsFromPlayerPerDay: number;
  salesLiftPct: number;
  dailyGrossRetailSales: number;
  playerDrivenGrossSalesPerDay: number;
  playerDailyRoyaltyCut: number;
  sellThroughVelocityPct: number;
}

export interface BrandImpactAnalyticsReport {
  offerId: string;
  brandName: string;
  parentGroup: string;
  stockTicker: string;
  isSigned: boolean;
  roleTitle: string;
  roleOrder: number;
  daysPartnered: number;
  shootsCompleted: number;
  capsuleDropsLaunched: number;
  brandAffinityXp: number;
  // Core Impact KPIs
  earnedMediaValueEMV: number; // in USD (e.g. $18,450,000 MIV/EMV)
  dailyMediaImpressions: number;
  salesConversionLiftPct: number; // e.g. +168.4%
  stockValuationLiftPct: number; // e.g. +3.85%
  lystHeatIndexScore: number; // 0 - 100
  fanToBuyerConversionPct: number; // e.g. 4.2%
  // Unit & Revenue Impact
  baselineTotalDailyUnits: number;
  currentTotalDailyUnits: number;
  playerAddedDailyUnits: number;
  dailyGrossBrandRevenue: number;
  dailyRevenueAttributedToPlayer: number;
  cumulativeRevenueDrivenForBrand: number;
  cumulativeUnitsDrivenForBrand: number;
  playerTotalEarningsFromBrand: number;
  brandRoiMultiple: number; // e.g. 6.4x ROI for the Maison
  // Regional Heat
  regionalImpact: {
    region: string;
    sharePct: number;
    liftLabel: string;
  }[];
  productBreakdowns: ProductImpactBreakdownItem[];
}

/**
 * Generates crisp, authentic monochrome/metallic vector brand emblems matching the real-world brand marks.
 */
function buildPrecisionBrandLogoDataUri(
  brandId: string,
  accentColor: string
): string {
  let mark = '';

  switch (brandId) {
    case 'brand_louis_vuitton':
      mark = `
        <rect width="160" height="160" rx="32" fill="#120E0A"/>
        <rect x="6" y="6" width="148" height="148" rx="28" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-opacity="0.5"/>
        <!-- Four-petal Monogram star -->
        <path d="M80 16 C83 25 87 29 96 32 C87 35 83 39 80 48 C77 39 73 35 64 32 C73 29 77 25 80 16 Z" fill="none" stroke="#D4AF37" stroke-width="1.6" opacity="0.65"/>
        <!-- Official-style Interlocking LV Serif Monogram -->
        <text x="68" y="106" text-anchor="middle" fill="#D4AF37" font-family="'Times New Roman', Georgia, serif" font-size="72" font-style="italic" font-weight="bold">L</text>
        <text x="88" y="94" text-anchor="middle" fill="#FFFBEB" font-family="'Times New Roman', Georgia, serif" font-size="72" font-weight="bold">V</text>
        <text x="80" y="138" text-anchor="middle" fill="#D4AF37" font-family="'Times New Roman', Georgia, serif" font-size="10.5" font-weight="bold" letter-spacing="3.5">LOUIS VUITTON</text>
      `;
      break;

    case 'brand_chanel':
      mark = `
        <rect width="160" height="160" rx="32" fill="#09090B"/>
        <rect x="6" y="6" width="148" height="148" rx="28" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.35"/>
        <!-- Interlocking Double C -->
        <path d="M74 44 A28 28 0 1 0 74 100" fill="none" stroke="#FFFFFF" stroke-width="10.5" stroke-linecap="butt"/>
        <path d="M86 44 A28 28 0 1 1 86 100" fill="none" stroke="#FFFFFF" stroke-width="10.5" stroke-linecap="butt"/>
        <text x="80" y="134" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="5">CHANEL</text>
      `;
      break;

    case 'brand_dior':
      mark = `
        <rect width="160" height="160" rx="32" fill="#0B0F19"/>
        <rect x="10" y="10" width="140" height="140" rx="24" fill="none" stroke="#93C5FD" stroke-width="1.5" stroke-opacity="0.45"/>
        <text x="80" y="94" text-anchor="middle" fill="#FFFFFF" font-family="Cochin, 'Times New Roman', Georgia, serif" font-size="48" font-weight="bold" letter-spacing="3">DIOR</text>
        <text x="80" y="122" text-anchor="middle" fill="#93C5FD" font-family="Georgia, serif" font-size="11" letter-spacing="6">PARIS</text>
      `;
      break;

    case 'brand_gucci':
      mark = `
        <rect width="160" height="160" rx="32" fill="#0B130E"/>
        <rect x="0" y="138" width="160" height="7" fill="#15803D"/>
        <rect x="0" y="145" width="160" height="7" fill="#DC2626"/>
        <rect x="0" y="152" width="160" height="8" fill="#15803D"/>
        <circle cx="64" cy="68" r="25" fill="none" stroke="#D4AF37" stroke-width="8"/>
        <circle cx="96" cy="68" r="25" fill="none" stroke="#D4AF37" stroke-width="8"/>
        <text x="80" y="124" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="16" font-weight="bold" letter-spacing="6">GUCCI</text>
      `;
      break;

    case 'brand_prada':
      mark = `
        <rect width="160" height="160" rx="32" fill="#09090B"/>
        <polygon points="18,34 142,34 80,134" fill="#111115" stroke="#E4E4E7" stroke-width="4"/>
        <polygon points="26,40 134,40 80,124" fill="none" stroke="#A1A1AA" stroke-width="1.2"/>
        <text x="80" y="66" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="22" font-weight="900" letter-spacing="3.5">PRADA</text>
        <text x="80" y="83" text-anchor="middle" fill="#D4D4D8" font-family="Arial, sans-serif" font-size="9.5" font-weight="bold" letter-spacing="3">MILANO</text>
        <text x="80" y="97" text-anchor="middle" fill="#A1A1AA" font-family="Georgia, serif" font-size="8">DAL 1913</text>
      `;
      break;

    case 'brand_balenciaga':
      mark = `
        <rect width="160" height="160" rx="32" fill="#09090B"/>
        <path d="M46 42 L74 42 C86 42 88 58 76 62 C88 66 88 84 74 84 L46 84 Z" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <path d="M114 42 L86 42 C74 42 72 58 84 62 C72 66 72 84 86 84 L114 84 Z" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <text x="80" y="124" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="900" letter-spacing="3.5">BALENCIAGA</text>
      `;
      break;

    case 'brand_saint_laurent':
      mark = `
        <rect width="160" height="160" rx="32" fill="#09090B"/>
        <text x="80" y="62" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="42" font-weight="bold">Y</text>
        <text x="80" y="92" text-anchor="middle" fill="#D4AF37" font-family="Georgia, serif" font-size="44" font-style="italic" font-weight="bold">S</text>
        <text x="84" y="118" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="42" font-weight="bold">L</text>
        <text x="80" y="142" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9.5" font-weight="bold" letter-spacing="3">SAINT LAURENT</text>
      `;
      break;

    case 'brand_nike_signature':
      mark = `
        <rect width="160" height="160" rx="32" fill="#09090B"/>
        <!-- Official Nike Swoosh Vector Proportion -->
        <path d="M32 94 C42 112, 68 106, 134 56 C90 74, 58 82, 46 68 C40 60, 44 48, 52 38 C36 54, 24 76, 32 94 Z" fill="#FFFFFF"/>
        <text x="80" y="134" text-anchor="middle" fill="#F97316" font-family="'Arial Black', Impact, sans-serif" font-size="16" font-style="italic" font-weight="900" letter-spacing="4">NIKE</text>
      `;
      break;

    case 'brand_jordan':
      mark = `
        <rect width="160" height="160" rx="32" fill="#0F0708"/>
        <circle cx="80" cy="68" r="18" fill="none" stroke="#EF4444" stroke-width="3"/>
        <path d="M62 62 C40 50, 24 56, 18 70 C34 72, 48 72, 62 68 Z" fill="#FFFFFF"/>
        <path d="M98 62 C120 50, 136 56, 142 70 C126 72, 112 72, 98 68 Z" fill="#FFFFFF"/>
        <text x="80" y="128" text-anchor="middle" fill="#EF4444" font-family="'Arial Black', sans-serif" font-size="15" font-weight="900" letter-spacing="4">JORDAN</text>
      `;
      break;

    case 'brand_adidas_originals':
      mark = `
        <rect width="160" height="160" rx="32" fill="#07111E"/>
        <ellipse cx="80" cy="64" rx="14" ry="32" fill="#FFFFFF"/>
        <ellipse cx="56" cy="74" rx="13" ry="27" transform="rotate(-34 56 74)" fill="#FFFFFF"/>
        <ellipse cx="104" cy="74" rx="13" ry="27" transform="rotate(34 104 74)" fill="#FFFFFF"/>
        <rect x="34" y="72" width="92" height="4.5" fill="#07111E"/>
        <rect x="34" y="81" width="92" height="4.5" fill="#07111E"/>
        <rect x="34" y="90" width="92" height="4.5" fill="#07111E"/>
        <text x="80" y="132" text-anchor="middle" fill="#38BDF8" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="2.5">adidas</text>
      `;
      break;

    case 'brand_supreme_ny':
      mark = `
        <rect width="160" height="160" rx="32" fill="#180909"/>
        <rect x="14" y="52" width="132" height="56" rx="3" fill="#DC2626"/>
        <text x="80" y="89" text-anchor="middle" fill="#FFFFFF" font-family="'Futura', 'Helvetica Neue', Arial, sans-serif" font-size="31" font-style="italic" font-weight="900">Supreme</text>
      `;
      break;

    case 'brand_rolex':
      mark = `
        <rect width="160" height="160" rx="32" fill="#051811"/>
        <path d="M48 88 L38 48 L62 68 L80 34 L98 68 L122 48 L112 88 Z" fill="#D4AF37"/>
        <circle cx="38" cy="42" r="4.5" fill="#D4AF37"/>
        <circle cx="58" cy="38" r="4.5" fill="#D4AF37"/>
        <circle cx="80" cy="28" r="5" fill="#D4AF37"/>
        <circle cx="102" cy="38" r="4.5" fill="#D4AF37"/>
        <circle cx="122" cy="42" r="4.5" fill="#D4AF37"/>
        <ellipse cx="80" cy="95" rx="32" ry="5" fill="none" stroke="#D4AF37" stroke-width="3"/>
        <text x="80" y="130" text-anchor="middle" fill="#D4AF37" font-family="Georgia, serif" font-size="20" font-weight="bold" letter-spacing="4">ROLEX</text>
      `;
      break;

    case 'brand_tiffany_co':
      mark = `
        <rect width="160" height="160" rx="32" fill="#0ABAB5"/>
        <rect x="10" y="10" width="140" height="140" rx="24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.6"/>
        <text x="80" y="84" text-anchor="middle" fill="#09090B" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="bold" letter-spacing="2">TIFFANY &amp; CO.</text>
        <text x="80" y="108" text-anchor="middle" fill="#09090B" font-family="Georgia, serif" font-size="10" letter-spacing="4">NEW YORK · 1837</text>
      `;
      break;

    case 'brand_cartier':
      mark = `
        <rect width="160" height="160" rx="32" fill="#2A080C"/>
        <ellipse cx="80" cy="76" rx="48" ry="54" fill="none" stroke="#D4AF37" stroke-width="2.5"/>
        <text x="80" y="84" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-size="32" font-style="italic" font-weight="bold">Cartier</text>
        <text x="80" y="108" text-anchor="middle" fill="#D4AF37" font-family="Georgia, serif" font-size="10" letter-spacing="4">PARIS</text>
      `;
      break;

    case 'brand_audemars_piguet':
      mark = `
        <rect width="160" height="160" rx="32" fill="#0C0A09"/>
        <polygon points="54,18 106,18 142,54 142,106 106,142 54,142 18,106 18,54" fill="none" stroke="#D4AF37" stroke-width="4"/>
        <text x="80" y="88" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="42" font-weight="bold" letter-spacing="3">AP</text>
        <text x="80" y="116" text-anchor="middle" fill="#D4AF37" font-family="Georgia, serif" font-size="7.5" letter-spacing="2">AUDEMARS PIGUET</text>
      `;
      break;

    case 'brand_beats_apple':
      mark = `
        <rect width="160" height="160" rx="32" fill="#09090B"/>
        <circle cx="80" cy="78" r="46" fill="#E11D48"/>
        <circle cx="80" cy="78" r="19" fill="none" stroke="#FFFFFF" stroke-width="9"/>
        <line x1="61" y1="32" x2="61" y2="78" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
      `;
      break;

    case 'brand_playstation':
      mark = `
        <rect width="160" height="160" rx="32" fill="#06122C"/>
        <text x="80" y="76" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="40" font-weight="900" letter-spacing="2">PS5</text>
        <text x="80" y="116" text-anchor="middle" fill="#60A5FA" font-family="Arial, sans-serif" font-size="11" font-weight="bold" letter-spacing="4">PLAYSTATION</text>
      `;
      break;

    case 'brand_dom_perignon':
      mark = `
        <rect width="160" height="160" rx="32" fill="#090A06"/>
        <path d="M40 24 L120 24 L120 76 C120 108 80 132 80 138 C80 132 40 108 40 76 Z" fill="#11130B" stroke="#D4AF37" stroke-width="3.5"/>
        <text x="80" y="64" text-anchor="middle" fill="#D4AF37" font-family="Georgia, serif" font-size="20" font-style="italic" font-weight="bold">Dom</text>
        <text x="80" y="88" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="18" font-style="italic" font-weight="bold">Pérignon</text>
        <text x="80" y="110" text-anchor="middle" fill="#D4AF37" font-family="Georgia, serif" font-size="9" letter-spacing="3">CHAMPAGNE</text>
      `;
      break;

    case 'brand_porsche':
      mark = `
        <rect width="160" height="160" rx="32" fill="#0F0D0A"/>
        <path d="M42 24 L118 24 L118 76 C118 110 80 132 80 138 C80 132 42 110 42 76 Z" fill="#18181B" stroke="#F59E0B" stroke-width="3.5"/>
        <line x1="80" y1="24" x2="80" y2="136" stroke="#F59E0B" stroke-width="2"/>
        <line x1="42" y1="74" x2="118" y2="74" stroke="#F59E0B" stroke-width="2"/>
        <text x="80" y="42" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="2.5">PORSCHE</text>
      `;
      break;

    case 'brand_sprite_global':
      mark = `
        <rect width="160" height="160" rx="32" fill="#042F1E"/>
        <circle cx="80" cy="80" r="52" fill="#059669" stroke="#FACC15" stroke-width="4"/>
        <text x="80" y="90" text-anchor="middle" fill="#FFFFFF" font-family="'Arial Black', Impact, sans-serif" font-size="28" font-style="italic" font-weight="900">Sprite</text>
        <circle cx="114" cy="54" r="8" fill="#FACC15"/>
      `;
      break;

    default:
      mark = `<rect width="160" height="160" rx="32" fill="#09090B"/><text x="80" y="90" text-anchor="middle" fill="${accentColor}" font-size="32" font-weight="bold">BRAND</text>`;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">${mark}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Official real-world brand logos (via SimpleIcons / Wikimedia Commons CDN with instant SVG fallback).
 */
export const REAL_BRAND_LOGOS_MAP: Record<string, RealBrandVisualConfig> = {
  brand_louis_vuitton: {
    brandId: 'brand_louis_vuitton',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Louis_Vuitton_LV_logo.png',
    stockTicker: 'EPA: MC (LVMH)',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_louis_vuitton', '#D4AF37')
  },
  brand_chanel: {
    brandId: 'brand_chanel',
    officialLogoUrl: 'https://cdn.simpleicons.org/chanel/ffffff',
    stockTicker: 'PRIV · CHANEL',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_chanel', '#FFFFFF')
  },
  brand_dior: {
    brandId: 'brand_dior',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Dior_Logo.svg',
    stockTicker: 'EPA: CDI',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_dior', '#93C5FD')
  },
  brand_gucci: {
    brandId: 'brand_gucci',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/1960s_Gucci_Logo.svg',
    stockTicker: 'EPA: KER',
    hqCountryFlag: '🇮🇹',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_gucci', '#EF4444')
  },
  brand_prada: {
    brandId: 'brand_prada',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Prada-Logo.svg',
    stockTicker: 'HKG: 1913',
    hqCountryFlag: '🇮🇹',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_prada', '#E4E4E7')
  },
  brand_balenciaga: {
    brandId: 'brand_balenciaga',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Balenciaga_Logo.svg',
    stockTicker: 'EPA: KER',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_balenciaga', '#A1A1AA')
  },
  brand_saint_laurent: {
    brandId: 'brand_saint_laurent',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Yves_Saint_Laurent_Logo.svg',
    stockTicker: 'EPA: KER',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_saint_laurent', '#E5E7EB')
  },
  brand_nike_signature: {
    brandId: 'brand_nike_signature',
    officialLogoUrl: 'https://cdn.simpleicons.org/nike/ffffff',
    stockTicker: 'NYSE: NKE',
    hqCountryFlag: '🇺🇸',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_nike_signature', '#F97316')
  },
  brand_jordan: {
    brandId: 'brand_jordan',
    officialLogoUrl: 'https://cdn.simpleicons.org/airjordan/ef4444',
    stockTicker: 'NYSE: NKE (JORDAN)',
    hqCountryFlag: '🇺🇸',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_jordan', '#EF4444')
  },
  brand_adidas_originals: {
    brandId: 'brand_adidas_originals',
    officialLogoUrl: 'https://cdn.simpleicons.org/adidas/38bdf8',
    stockTicker: 'ETR: ADS',
    hqCountryFlag: '🇩🇪',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_adidas_originals', '#38BDF8')
  },
  brand_supreme_ny: {
    brandId: 'brand_supreme_ny',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Supreme_Logo.svg',
    stockTicker: 'EPA: EL (SUPREME)',
    hqCountryFlag: '🇺🇸',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_supreme_ny', '#EF4444')
  },
  brand_rolex: {
    brandId: 'brand_rolex',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/95/Rolex_logo.svg',
    stockTicker: 'GENEVA · WILSDORF',
    hqCountryFlag: '🇨🇭',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_rolex', '#10B981')
  },
  brand_tiffany_co: {
    brandId: 'brand_tiffany_co',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Tiffany_and_Co_logo.svg',
    stockTicker: 'EPA: MC (TIFFANY)',
    hqCountryFlag: '🇺🇸',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_tiffany_co', '#2DD4BF')
  },
  brand_cartier: {
    brandId: 'brand_cartier',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Cartier_logo.svg',
    stockTicker: 'SWX: CFR',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_cartier', '#F43F5E')
  },
  brand_audemars_piguet: {
    brandId: 'brand_audemars_piguet',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Audemars_Piguet_logo.svg',
    stockTicker: 'LE BRASSUS · AP',
    hqCountryFlag: '🇨🇭',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_audemars_piguet', '#F59E0B')
  },
  brand_beats_apple: {
    brandId: 'brand_beats_apple',
    officialLogoUrl: 'https://cdn.simpleicons.org/beatsbydre/e11d48',
    stockTicker: 'NASDAQ: AAPL',
    hqCountryFlag: '🇺🇸',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_beats_apple', '#F43F5E')
  },
  brand_playstation: {
    brandId: 'brand_playstation',
    officialLogoUrl: 'https://cdn.simpleicons.org/playstation/3b82f6',
    stockTicker: 'NYSE: SONY',
    hqCountryFlag: '🇯🇵',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_playstation', '#3B82F6')
  },
  brand_dom_perignon: {
    brandId: 'brand_dom_perignon',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Dom_P%C3%A9rignon_logo.svg',
    stockTicker: 'EPA: MC (MOËT)',
    hqCountryFlag: '🇫🇷',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_dom_perignon', '#D4AF37')
  },
  brand_porsche: {
    brandId: 'brand_porsche',
    officialLogoUrl: 'https://cdn.simpleicons.org/porsche/f59e0b',
    stockTicker: 'ETR: P911',
    hqCountryFlag: '🇩🇪',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_porsche', '#F59E0B')
  },
  brand_sprite_global: {
    brandId: 'brand_sprite_global',
    officialLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Sprite_Logo.svg',
    stockTicker: 'NYSE: KO',
    hqCountryFlag: '🇺🇸',
    authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri('brand_sprite_global', '#10B981')
  }
};

/**
 * Curated real-world product photography & official reference numbers for every product in the catalog.
 */
export const REAL_PRODUCT_ASSETS_MAP: Record<string, RealProductAssetMeta> = {
  // Louis Vuitton
  lv_speedy_p9: {
    productId: 'lv_speedy_p9',
    officialProductName: 'Louis Vuitton Speedy P9 Bandoulière 40 Monogram',
    officialSkuOrRef: 'REF. M24444 · ASNIÈRES ATELIER',
    realPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85'
  },
  lv_courrier_trunk: {
    productId: 'lv_courrier_trunk',
    officialProductName: 'Louis Vuitton Malle Courrier Lozine 110 Trunk',
    officialSkuOrRef: 'REF. M23022 · HARDSIDED HERITAGE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
  },
  lv_imagination_edp: {
    productId: 'lv_imagination_edp',
    officialProductName: 'Louis Vuitton Imagination & Ombre Nomade EDP 100ml',
    officialSkuOrRef: 'REF. LP0219 · LES PARFUMS LV',
    realPhotoUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85'
  },

  // Chanel
  chanel_classic_flap: {
    productId: 'chanel_classic_flap',
    officialProductName: 'Chanel 11.12 Classic Medium Quilted Lambskin Flap Bag',
    officialSkuOrRef: 'REF. A01112-Y01295-94305',
    realPhotoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
  },
  chanel_no5_parfum: {
    productId: 'chanel_no5_parfum',
    officialProductName: 'Chanel N°5 Eau de Parfum Spray 100ml',
    officialSkuOrRef: 'REF. 125530 · RUE CAMBON',
    realPhotoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=85'
  },
  chanel_j12_caliber: {
    productId: 'chanel_j12_caliber',
    officialProductName: 'Chanel J12 Watch Caliber 12.1 Black Ceramic 38mm',
    officialSkuOrRef: 'REF. H5697 · SWISS MANUFACTURE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85'
  },

  // Christian Dior
  dior_sauvage_elixir: {
    productId: 'dior_sauvage_elixir',
    officialProductName: 'Dior Sauvage Elixir Concentrated Parfum 60ml',
    officialSkuOrRef: 'REF. C099600705 · PARFUMS DIOR',
    realPhotoUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85'
  },
  dior_saddle_oblique: {
    productId: 'dior_saddle_oblique',
    officialProductName: 'Dior Saddle Bag in Blue Dior Oblique Jacquard',
    officialSkuOrRef: 'REF. 1ADPO093YKY_H28E',
    realPhotoUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
  },
  dior_b23_tailoring: {
    productId: 'dior_b23_tailoring',
    officialProductName: 'Dior B23 High-Top Oblique Sneaker & Tailored Bomber',
    officialSkuOrRef: 'REF. 3SH118YJP_H069',
    realPhotoUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85'
  },

  // Gucci
  gucci_jackie_1961: {
    productId: 'gucci_jackie_1961',
    officialProductName: 'Gucci Jackie 1961 Small Shoulder Bag in Rosso Ancora',
    officialSkuOrRef: 'STYLE 810232 AAD5V 6207',
    realPhotoUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
  },
  gucci_horsebit_1953: {
    productId: 'gucci_horsebit_1953',
    officialProductName: 'Gucci Horsebit 1953 Men’s & Women’s Leather Loafer',
    officialSkuOrRef: 'STYLE 307929 BLM00 1000',
    realPhotoUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=85'
  },
  gucci_flora_gorgeous: {
    productId: 'gucci_flora_gorgeous',
    officialProductName: 'Gucci Guilty Elixir de Parfum & Flora Gorgeous Gardenia',
    officialSkuOrRef: 'STYLE 754471 99999 0099',
    realPhotoUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85'
  },

  // Prada
  prada_galleria_saffiano: {
    productId: 'prada_galleria_saffiano',
    officialProductName: 'Prada Galleria Medium Saffiano Leather Bag',
    officialSkuOrRef: 'ART. 1BA274_NZV_F0002_V_DOO',
    realPhotoUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
  },
  prada_symbole_sunglasses: {
    productId: 'prada_symbole_sunglasses',
    officialProductName: 'Prada Symbole Sunglasses in Black Acetate (SPR 17W)',
    officialSkuOrRef: 'ART. SPRA17_E1AB_F05S0',
    realPhotoUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=85'
  },
  prada_paradoxe_intense: {
    productId: 'prada_paradoxe_intense',
    officialProductName: 'Prada Paradoxe Intense Eau de Parfum 90ml',
    officialSkuOrRef: 'ART. 1A1351_2HDR_F0Z99',
    realPhotoUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85'
  },

  // Balenciaga
  balenciaga_le_city: {
    productId: 'balenciaga_le_city',
    officialProductName: 'Balenciaga Le City Medium Bag in Black Arena Lambskin',
    officialSkuOrRef: 'STYLE 797789 2AA9S 1000',
    realPhotoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
  },
  balenciaga_3xl_sneaker: {
    productId: 'balenciaga_3xl_sneaker',
    officialProductName: 'Balenciaga 3XL Sneaker in Worn-Out Mesh & Polyurethane',
    officialSkuOrRef: 'STYLE 734734 W3XL4 9110',
    realPhotoUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85'
  },
  balenciaga_armored_hoodie: {
    productId: 'balenciaga_armored_hoodie',
    officialProductName: 'Balenciaga Tape Type Medium Fit Heavy Fleece Hoodie',
    officialSkuOrRef: 'STYLE 739784 TOVA2 1055',
    realPhotoUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=85'
  },

  // Saint Laurent
  ysl_loulou_cassandre: {
    productId: 'ysl_loulou_cassandre',
    officialProductName: 'Saint Laurent Loulou Medium Matelassé Lambskin Bag',
    officialSkuOrRef: 'STYLE 574946 DV727 1000',
    realPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85'
  },
  ysl_myslf_le_parfum: {
    productId: 'ysl_myslf_le_parfum',
    officialProductName: 'Yves Saint Laurent MYSLF Le Parfum 100ml',
    officialSkuOrRef: 'REF. YSL-3614274',
    realPhotoUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85'
  },
  ysl_leather_biker: {
    productId: 'ysl_leather_biker',
    officialProductName: 'Saint Laurent Classic Motorcycle Jacket in Plongé Leather',
    officialSkuOrRef: 'STYLE 484284 YC2NI 1000',
    realPhotoUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=800&q=85'
  },

  // Nike
  nike_collab_af1_low: {
    productId: 'nike_collab_af1_low',
    officialProductName: 'Nike Air Force 1 ’07 Low Collaboration Edition',
    officialSkuOrRef: 'SKU CW2288-111 · SNKRS LAUNCH',
    realPhotoUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85'
  },
  nike_air_max_dn: {
    productId: 'nike_air_max_dn',
    officialProductName: 'Nike Air Max Dn Dynamic Air "All Night"',
    officialSkuOrRef: 'SKU DV3337-008 · NIKE AIR LAB',
    realPhotoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=85'
  },
  nike_nocta_tech_fleece: {
    productId: 'nike_nocta_tech_fleece',
    officialProductName: 'Nike × NOCTA Tech Fleece Full-Zip Track Hoodie',
    officialSkuOrRef: 'SKU FD8453-010 · NIKE SPORTSWEAR',
    realPhotoUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85'
  },

  // Jordan Brand
  jordan_1_retro_high_collab: {
    productId: 'jordan_1_retro_high_collab',
    officialProductName: 'Air Jordan 1 Retro High OG "Chicago / Lost & Found"',
    officialSkuOrRef: 'SKU DZ5485-612 · JUMPMAN ARCHIVE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85'
  },
  jordan_jumpman_jack: {
    productId: 'jordan_jumpman_jack',
    officialProductName: 'Jordan Jumpman Jack TR "Sail & Dark Mocha"',
    officialSkuOrRef: 'SKU FZ8117-100 · SIGNATURE MODEL',
    realPhotoUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=85'
  },
  jordan_wings_varsity: {
    productId: 'jordan_wings_varsity',
    officialProductName: 'Air Jordan Wings Luxury Leather & Wool Varsity Jacket',
    officialSkuOrRef: 'SKU DZ7322-010 · WINGS COLLECTION',
    realPhotoUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85'
  },

  // Adidas Originals
  adidas_samba_og_collab: {
    productId: 'adidas_samba_og_collab',
    officialProductName: 'Adidas Originals Samba OG Cloud White / Core Black',
    officialSkuOrRef: 'SKU B75806 · CONFIRMED EXCLUSIVE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=85'
  },
  adidas_gazelle_indoor: {
    productId: 'adidas_gazelle_indoor',
    officialProductName: 'Adidas Originals Gazelle Indoor Collegiate Green & Gum',
    officialSkuOrRef: 'SKU IG4998 · TERRACE SERIES',
    realPhotoUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=85'
  },
  adidas_firebird_track: {
    productId: 'adidas_firebird_track',
    officialProductName: 'Adidas Originals Adicolor Classics Firebird Track Jacket',
    officialSkuOrRef: 'SKU IJ7058 · TREFOIL HERITAGE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85'
  },

  // Supreme
  supreme_photo_tee: {
    productId: 'supreme_photo_tee',
    officialProductName: 'Supreme Week 1 Portrait Photo Tee (Heavyweight Cotton)',
    officialSkuOrRef: 'SUP-FW26-WK1 · LAFAYETTE NY',
    realPhotoUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85'
  },
  supreme_bogo_hoodie: {
    productId: 'supreme_bogo_hoodie',
    officialProductName: 'Supreme Box Logo Hooded Sweatshirt Heather Grey / Red',
    officialSkuOrRef: 'SUP-BOGO-FW · CROSSGRAIN FLEECE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85'
  },
  supreme_af1_low: {
    productId: 'supreme_af1_low',
    officialProductName: 'Supreme × Nike Air Force 1 Low Box Logo White',
    officialSkuOrRef: 'SKU CU9225-100 · SUPREME NY',
    realPhotoUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85'
  },

  // Rolex
  rolex_daytona_platinum: {
    productId: 'rolex_daytona_platinum',
    officialProductName: 'Rolex Cosmograph Daytona in 950 Platinum (Ice-Blue Dial)',
    officialSkuOrRef: 'REF. 126506 · CALIBRE 4131',
    realPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=85'
  },
  rolex_daydate_40: {
    productId: 'rolex_daydate_40',
    officialProductName: 'Rolex Oyster Perpetual Day-Date 40 in 18ct Everose Gold',
    officialSkuOrRef: 'REF. 228235 · PRESIDENT BRACELET',
    realPhotoUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85'
  },
  rolex_submariner_date: {
    productId: 'rolex_submariner_date',
    officialProductName: 'Rolex Submariner Date Oystersteel & Green Cerachrom',
    officialSkuOrRef: 'REF. 126610LV · CALIBRE 3235',
    realPhotoUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85'
  },

  // Tiffany & Co.
  tiffany_hardwear_pave: {
    productId: 'tiffany_hardwear_pave',
    officialProductName: 'Tiffany HardWear Graduated Link Necklace in 18k Gold & Diamonds',
    officialSkuOrRef: 'SKU 60153092 · FIFTH AVE LANDMARK',
    realPhotoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85'
  },
  tiffany_lock_bangle: {
    productId: 'tiffany_lock_bangle',
    officialProductName: 'Tiffany Lock Bangle in 18k Rose Gold with Full Pavé Diamonds',
    officialSkuOrRef: 'SKU 70158322 · TIFFANY LOCK',
    realPhotoUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85'
  },
  tiffany_bird_on_rock: {
    productId: 'tiffany_bird_on_rock',
    officialProductName: 'Jean Schlumberger by Tiffany "Bird on a Rock" Aquamarine Brooch',
    officialSkuOrRef: 'BLUE BOOK · HIGH JEWELRY ARCHIVE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85'
  },

  // Cartier
  cartier_santos_skeleton: {
    productId: 'cartier_santos_skeleton',
    officialProductName: 'Santos de Cartier Large Watch in 18k Yellow Gold',
    officialSkuOrRef: 'REF. WGSA0029 · RUE DE LA PAIX',
    realPhotoUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85'
  },
  cartier_love_bracelet: {
    productId: 'cartier_love_bracelet',
    officialProductName: 'Cartier LOVE Bracelet 18k Yellow Gold Set with 10 Diamonds',
    officialSkuOrRef: 'REF. B6036017 · ALDO CIPULLO 1969',
    realPhotoUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85'
  },
  cartier_panthere_ring: {
    productId: 'cartier_panthere_ring',
    officialProductName: 'Panthère de Cartier Ring in 18k White Gold, Emeralds & Diamonds',
    officialSkuOrRef: 'REF. N4224900 · HIGH JEWELRY',
    realPhotoUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85'
  },

  // Audemars Piguet
  ap_royal_oak_openworked: {
    productId: 'ap_royal_oak_openworked',
    officialProductName: 'Audemars Piguet Royal Oak Double Balance Wheel Openworked 41mm',
    officialSkuOrRef: 'REF. 15416CE.OO.1225CE.01',
    realPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=85'
  },
  ap_royal_oak_jumbo: {
    productId: 'ap_royal_oak_jumbo',
    officialProductName: 'Audemars Piguet Royal Oak "Jumbo" Extra-Thin 39mm',
    officialSkuOrRef: 'REF. 16202ST.OO.1240ST.02',
    realPhotoUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85'
  },
  ap_music_edition: {
    productId: 'ap_music_edition',
    officialProductName: 'Audemars Piguet Royal Oak Offshore Selfwinding Music Edition',
    officialSkuOrRef: 'REF. 15600TI.OO.A343CA.01',
    realPhotoUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85'
  },

  // Apple & Beats by Dre
  beats_studio_pro_collab: {
    productId: 'beats_studio_pro_collab',
    officialProductName: 'Beats Studio Pro Wireless Noise Cancelling Headphones',
    officialSkuOrRef: 'MODEL MQTP3LL/A · APPLE INC.',
    realPhotoUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=85'
  },
  beats_pill_2026: {
    productId: 'beats_pill_2026',
    officialProductName: 'Beats Pill Wireless Bluetooth Speaker (Champagne Gold)',
    officialSkuOrRef: 'MODEL MW463LL/A · HI-RES AUDIO',
    realPhotoUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85'
  },
  apple_airpods_max_usbc: {
    productId: 'apple_airpods_max_usbc',
    officialProductName: 'Apple AirPods Max Over-Ear Headphones (USB-C Midnight)',
    officialSkuOrRef: 'MODEL MWW43AM/A · SPATIAL AUDIO',
    realPhotoUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85'
  },

  // Sony PlayStation
  ps5_pro_artist_bundle: {
    productId: 'ps5_pro_artist_bundle',
    officialProductName: 'Sony PlayStation 5 Pro 2TB Console (CFI-7000 Series)',
    officialSkuOrRef: 'MODEL CFI-7019B01X · SONY SIE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=85'
  },
  ps5_dualsense_edge: {
    productId: 'ps5_dualsense_edge',
    officialProductName: 'PlayStation DualSense Edge Wireless Pro Controller',
    officialSkuOrRef: 'MODEL CFI-ZCP1W · HAPTIC PRO',
    realPhotoUrl: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=85'
  },
  ps_pulse_elite_headset: {
    productId: 'ps_pulse_elite_headset',
    officialProductName: 'PlayStation Pulse Elite Wireless Planar Magnetic Headset',
    officialSkuOrRef: 'MODEL CFI-ZWH2 · PS LINK AUDIO',
    realPhotoUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=85'
  },

  // Dom Pérignon
  dom_perignon_luminous: {
    productId: 'dom_perignon_luminous',
    officialProductName: 'Dom Pérignon Vintage 2013 Brut Luminous Label 750ml',
    officialSkuOrRef: 'CUVÉE DP-2013-LUM · ÉPERNAY',
    realPhotoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=800&q=85'
  },
  dom_perignon_rose_p2: {
    productId: 'dom_perignon_rose_p2',
    officialProductName: 'Dom Pérignon Plénitude 2 (P2) Vintage Rosé Champagne',
    officialSkuOrRef: 'CUVÉE DP-P2-ROSE · HAUTVILLERS',
    realPhotoUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=85'
  },
  dom_perignon_jeroboam: {
    productId: 'dom_perignon_jeroboam',
    officialProductName: 'Dom Pérignon Vintage Methuselah 6.0L Gold Shield Coffret',
    officialSkuOrRef: 'CUVÉE DP-6000ML · VIP RESERVE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=800&q=85'
  },

  // Porsche
  porsche_911_sonderwunsch: {
    productId: 'porsche_911_sonderwunsch',
    officialProductName: 'Porsche 911 GT3 RS (992) Weissach & Sonderwunsch Edition',
    officialSkuOrRef: 'CHASSIS 992850 · ZUFFENHAUSEN',
    realPhotoUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=85'
  },
  porsche_design_chrono_1: {
    productId: 'porsche_design_chrono_1',
    officialProductName: 'Porsche Design Chronograph 1 — All Black Numbered Edition',
    officialSkuOrRef: 'REF. 6041.7.01.001.01.5',
    realPhotoUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=85'
  },
  porsche_carbon_luggage: {
    productId: 'porsche_carbon_luggage',
    officialProductName: 'Porsche Roadster Hardcase Carbon Fiber 4W Trolley M',
    officialSkuOrRef: 'WAP0354010P · STUDIO F.A. PORSCHE',
    realPhotoUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=85'
  },

  // Sprite & Coca-Cola
  sprite_artist_can_12pk: {
    productId: 'sprite_artist_can_12pk',
    officialProductName: 'Sprite Original Lemon-Lime 355ml Artist Collector Can Pack',
    officialSkuOrRef: 'KO-SPRITE-355ML · ATLANTA GA',
    realPhotoUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=85'
  },
  sprite_chill_cherry_lime: {
    productId: 'sprite_chill_cherry_lime',
    officialProductName: 'Sprite Chill Cherry-Lime Limited Edition 12-Pack',
    officialSkuOrRef: 'KO-SPRITE-CHILL · TOUR EDITION',
    realPhotoUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=85'
  },
  sprite_obey_varsity_crate: {
    productId: 'sprite_obey_varsity_crate',
    officialProductName: 'Sprite "Obey Your Thirst" Vintage Steel Cooler & Vinyl Pack',
    officialSkuOrRef: 'KO-OBEY-VIP · LIMITED MERCH',
    realPhotoUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=85',
    fallbackPhotoUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=85'
  }
};

export function getRealBrandVisualConfig(brandId: string): RealBrandVisualConfig {
  return (
    REAL_BRAND_LOGOS_MAP[brandId] || {
      brandId,
      officialLogoUrl: '',
      stockTicker: 'GLOBAL LUXURY',
      hqCountryFlag: '🌍',
      authenticMonogramSvgDataUri: buildPrecisionBrandLogoDataUri(brandId, '#38BDF8')
    }
  );
}

export function getRealProductAssetMeta(
  product: BrandSignatureProduct
): RealProductAssetMeta {
  return (
    REAL_PRODUCT_ASSETS_MAP[product.id] || {
      productId: product.id,
      officialProductName: product.name,
      officialSkuOrRef: `SKU-${product.id.toUpperCase()}`,
      realPhotoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85',
      fallbackPhotoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
    }
  );
}

/**
 * Computes a comprehensive commercial & cultural Brand Impact Report showing how much the Player
 * boosts a brand's sales, Earned Media Value (MIV®/EMV), stock valuation, and global demand.
 */
export function calculateBrandImpactReport(
  state: GameState,
  offer: BrandOfferDefinition,
  activeContract?: ActiveBrandContract
): BrandImpactAnalyticsReport {
  const brandState = getEnsuredBrandDealsState(state);
  const contract =
    activeContract ||
    brandState.activeContracts.find(c => c.offerId === offer.id);
  const isSigned = Boolean(contract);

  const pop = Math.max(5, Number(state.popularity) || 15);
  const hype = Math.max(5, Number(state.hype) || 20);
  const fans = Math.max(1_000, Number(state.fans) || 15_000);
  const listeners = Math.max(
    5_000,
    Number(state.spotify?.listeners) || fans * 2.5
  );
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);

  const roleMeta = getAmbassadorRoleTierMeta(
    contract?.roleTierId || 'brand_ambassador'
  );
  const roleOrder = roleMeta.order;
  const daysPartnered = contract
    ? Math.max(1, (contract.totalDurationDays || offer.durationDays) - contract.daysRemaining + 1)
    : 0;
  const shootsCompleted = contract?.shootsCompleted || 0;
  const capsuleDropsLaunched = contract?.capsuleDropsLaunched || 0;
  const brandAffinityXp =
    contract?.brandAffinityXp ||
    brandState.brandAffinityByOfferId?.[offer.id] ||
    0;

  // Player Sales Multiplier (how much the player lifts daily unit sales above the brand's organic baseline)
  const tierAuthorityBoost =
    roleOrder === 5
      ? 1.65
      : roleOrder === 4
      ? 1.25
      : roleOrder === 3
      ? 0.92
      : roleOrder === 2
      ? 0.64
      : 0.38;

  const campaignActivityBoost =
    shootsCompleted * 0.14 + capsuleDropsLaunched * 0.28 + brandAffinityXp * 0.004;

  const rawSalesLiftRatio =
    (pop / 68) * 0.55 +
    (hype / 72) * 0.45 +
    (flexScore / 100) * 0.25 +
    tierAuthorityBoost * 0.45 +
    campaignActivityBoost;

  const salesConversionLiftPct = Number(
    Math.min(480, Math.max(18, rawSalesLiftRatio * 100)).toFixed(1)
  );
  const playerSalesMult = 1 + salesConversionLiftPct / 100;

  const royaltyPct = contract?.productRoyaltyPct ?? roleMeta.productRoyaltyPct;

  let baselineTotalDailyUnits = 0;
  let currentTotalDailyUnits = 0;
  let dailyGrossBrandRevenue = 0;
  let dailyRevenueAttributedToPlayer = 0;

  const productBreakdowns: ProductImpactBreakdownItem[] =
    offer.signatureProducts.map(prod => {
      const realMeta = getRealProductAssetMeta(prod);
      const baselineDailyUnits = prod.baseDailyUnits;
      const playerBoostedDailyUnits = Math.round(
        baselineDailyUnits * playerSalesMult
      );
      const addedUnitsFromPlayerPerDay = Math.max(
        1,
        playerBoostedDailyUnits - baselineDailyUnits
      );

      const dailyGrossRetailSales = playerBoostedDailyUnits * prod.retailPrice;
      const playerDrivenGrossSalesPerDay =
        addedUnitsFromPlayerPerDay * prod.retailPrice;
      const playerDailyRoyaltyCut = Math.round(
        dailyGrossRetailSales * (royaltyPct / 100) * 0.085
      );

      const sellThroughVelocityPct = Math.min(
        99.8,
        Number((62 + salesConversionLiftPct * 0.14 + (prod.isFlagshipHero ? 8 : 0)).toFixed(1))
      );

      baselineTotalDailyUnits += baselineDailyUnits;
      currentTotalDailyUnits += playerBoostedDailyUnits;
      dailyGrossBrandRevenue += dailyGrossRetailSales;
      dailyRevenueAttributedToPlayer += playerDrivenGrossSalesPerDay;

      return {
        productId: prod.id,
        officialProductName: realMeta.officialProductName,
        officialSkuOrRef: realMeta.officialSkuOrRef,
        categoryTag: prod.categoryTag,
        retailPrice: prod.retailPrice,
        realPhotoUrl: realMeta.realPhotoUrl,
        fallbackPhotoUrl: realMeta.fallbackPhotoUrl,
        baselineDailyUnits,
        playerBoostedDailyUnits,
        addedUnitsFromPlayerPerDay,
        salesLiftPct: salesConversionLiftPct,
        dailyGrossRetailSales,
        playerDrivenGrossSalesPerDay,
        playerDailyRoyaltyCut,
        sellThroughVelocityPct
      };
    });

  const playerAddedDailyUnits = Math.max(
    1,
    currentTotalDailyUnits - baselineTotalDailyUnits
  );

  // Earned Media Value (MIV® / EMV) in USD
  const dailyMediaImpressions = Math.round(
    listeners * 0.42 +
      fans * 0.85 +
      pop * 48_000 +
      hype * 36_000 +
      roleOrder * 220_000
  );
  const earnedMediaValueEMV = Math.round(
    dailyMediaImpressions * 0.048 * Math.max(1, isSigned ? daysPartnered : 7) +
      shootsCompleted * 1_850_000 +
      capsuleDropsLaunched * 3_400_000
  );

  // Stock Valuation Lift % (e.g. +1.2% to +9.8% lift on LVMH / NIKE / Kering)
  const stockValuationLiftPct = Number(
    Math.min(
      12.4,
      0.45 +
        (pop / 100) * 2.8 +
        (hype / 100) * 2.2 +
        roleOrder * 0.55 +
        shootsCompleted * 0.35 +
        capsuleDropsLaunched * 0.65
    ).toFixed(2)
  );

  // Lyst / Launchmetrics Brand Heat Index (0 - 100)
  const lystHeatIndexScore = Math.min(
    100,
    Math.round(
      48 +
        pop * 0.24 +
        hype * 0.2 +
        roleOrder * 3.2 +
        Math.min(12, shootsCompleted * 2 + capsuleDropsLaunched * 3)
    )
  );

  const fanToBuyerConversionPct = Number(
    Math.min(14.5, Math.max(0.8, 1.4 + (hype / 100) * 4.8 + roleOrder * 0.65)).toFixed(1)
  );

  const effectiveDays = isSigned ? Math.max(1, daysPartnered) : 1;
  const cumulativeRevenueDrivenForBrand =
    dailyRevenueAttributedToPlayer * effectiveDays +
    capsuleDropsLaunched * (productBreakdowns[0]?.retailPrice || 500) * 1_800;
  const cumulativeUnitsDrivenForBrand =
    playerAddedDailyUnits * effectiveDays + capsuleDropsLaunched * 1_800;

  const playerTotalEarningsFromBrand = contract
    ? contract.totalEarnedFromContract
    : offer.signingBonus;

  const brandRoiMultiple = Number(
    Math.max(
      1.8,
      (cumulativeRevenueDrivenForBrand + earnedMediaValueEMV * 0.35) /
        Math.max(50_000, playerTotalEarningsFromBrand)
    ).toFixed(1)
  );

  const visualCfg = getRealBrandVisualConfig(offer.id);

  const regionalImpact = [
    {
      region: 'North America (NYC / LA)',
      sharePct: 36,
      liftLabel: `+${Math.round(salesConversionLiftPct * 1.08)}% Sell-Through`
    },
    {
      region: 'Europe (Paris / Milan / London)',
      sharePct: 31,
      liftLabel: `+${Math.round(salesConversionLiftPct * 0.96)}% Boutique Traffic`
    },
    {
      region: 'Asia-Pacific (Tokyo / Seoul)',
      sharePct: 24,
      liftLabel: `+${Math.round(salesConversionLiftPct * 1.15)}% Flagship Queue`
    },
    {
      region: 'Latin America & Middle East',
      sharePct: 9,
      liftLabel: `+${Math.round(salesConversionLiftPct * 0.84)}% VIP Orders`
    }
  ];

  return {
    offerId: offer.id,
    brandName: offer.brandName,
    parentGroup: offer.parentGroup,
    stockTicker: visualCfg.stockTicker,
    isSigned,
    roleTitle:
      contract?.roleTitle ||
      `${offer.brandName} ${roleMeta.title} (Projected)`,
    roleOrder,
    daysPartnered,
    shootsCompleted,
    capsuleDropsLaunched,
    brandAffinityXp,
    earnedMediaValueEMV,
    dailyMediaImpressions,
    salesConversionLiftPct,
    stockValuationLiftPct,
    lystHeatIndexScore,
    fanToBuyerConversionPct,
    baselineTotalDailyUnits,
    currentTotalDailyUnits,
    playerAddedDailyUnits,
    dailyGrossBrandRevenue,
    dailyRevenueAttributedToPlayer,
    cumulativeRevenueDrivenForBrand,
    cumulativeUnitsDrivenForBrand,
    playerTotalEarningsFromBrand,
    brandRoiMultiple,
    regionalImpact,
    productBreakdowns
  };
}

/**
 * Aggregates global impact metrics across all active brand contracts for the top summary dashboard.
 */
export function calculateGlobalBrandImpactSummary(state: GameState): {
  activePartnersCount: number;
  totalEMVGenerated: number;
  totalDailyBrandRevenueDriven: number;
  totalCumulativeBrandRevenueDriven: number;
  totalDailyUnitsDriven: number;
  avgSalesLiftPct: number;
  avgBrandRoiMultiple: number;
  reports: BrandImpactAnalyticsReport[];
} {
  const brandState = getEnsuredBrandDealsState(state);
  const reports: BrandImpactAnalyticsReport[] = [];

  for (const contract of brandState.activeContracts) {
    const offer = BRAND_OFFERS_CATALOG.find(o => o.id === contract.offerId);
    if (offer) {
      reports.push(calculateBrandImpactReport(state, offer, contract));
    }
  }

  const activePartnersCount = reports.length;
  const totalEMVGenerated = reports.reduce(
    (sum, r) => sum + r.earnedMediaValueEMV,
    0
  );
  const totalDailyBrandRevenueDriven = reports.reduce(
    (sum, r) => sum + r.dailyRevenueAttributedToPlayer,
    0
  );
  const totalCumulativeBrandRevenueDriven = reports.reduce(
    (sum, r) => sum + r.cumulativeRevenueDrivenForBrand,
    0
  );
  const totalDailyUnitsDriven = reports.reduce(
    (sum, r) => sum + r.playerAddedDailyUnits,
    0
  );
  const avgSalesLiftPct =
    activePartnersCount > 0
      ? Number(
          (
            reports.reduce((sum, r) => sum + r.salesConversionLiftPct, 0) /
            activePartnersCount
          ).toFixed(1)
        )
      : 0;
  const avgBrandRoiMultiple =
    activePartnersCount > 0
      ? Number(
          (
            reports.reduce((sum, r) => sum + r.brandRoiMultiple, 0) /
            activePartnersCount
          ).toFixed(1)
        )
      : 0;

  return {
    activePartnersCount,
    totalEMVGenerated,
    totalDailyBrandRevenueDriven,
    totalCumulativeBrandRevenueDriven,
    totalDailyUnitsDriven,
    avgSalesLiftPct,
    avgBrandRoiMultiple,
    reports
  };
}
