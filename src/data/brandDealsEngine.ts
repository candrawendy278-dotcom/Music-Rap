import type { GameState } from '../types';
import type { XPost } from './xSocialEngine';
import { calculateLuxuryPortfolioMetrics } from './luxuryAssetsEngine';

export type BrandVertical =
  | 'fashion'
  | 'streetwear'
  | 'tech_audio'
  | 'beverage_lifestyle'
  | 'horology_beauty';

export type AmbassadorRoleTierId =
  | 'friend_of_house'
  | 'brand_ambassador'
  | 'house_ambassador'
  | 'global_ambassador'
  | 'face_of_brand';

export interface AmbassadorRoleTierMeta {
  id: AmbassadorRoleTierId;
  order: 1 | 2 | 3 | 4 | 5;
  title: string;
  shortBadge: string;
  description: string;
  signingBonusMultiplier: number;
  retainerMultiplier: number;
  shootPayoutMultiplier: number;
  productRoyaltyPct: number;
  minPopularityOffset: number;
  minHypeOffset: number;
  minFlexOffset: number;
  requiredAffinityForPromotion: number;
  badgeColor: string;
}

export const AMBASSADOR_ROLE_TIERS: AmbassadorRoleTierMeta[] = [
  {
    id: 'friend_of_house',
    order: 1,
    title: 'Friend of the House',
    shortBadge: 'FRIEND OF THE HOUSE',
    description:
      'VIP showroom pull privileges, regional red-carpet dressing, and introductory product seeding.',
    signingBonusMultiplier: 1.0,
    retainerMultiplier: 1.0,
    shootPayoutMultiplier: 1.0,
    productRoyaltyPct: 2.0,
    minPopularityOffset: 0,
    minHypeOffset: 0,
    minFlexOffset: 0,
    requiredAffinityForPromotion: 0,
    badgeColor: '#94A3B8'
  },
  {
    id: 'brand_ambassador',
    order: 2,
    title: 'Brand Ambassador',
    shortBadge: 'BRAND AMBASSADOR',
    description:
      'Official national campaign endorser featured in digital lookbooks, retail displays, and seasonal drops.',
    signingBonusMultiplier: 1.85,
    retainerMultiplier: 1.75,
    shootPayoutMultiplier: 1.65,
    productRoyaltyPct: 4.0,
    minPopularityOffset: 10,
    minHypeOffset: 8,
    minFlexOffset: 5,
    requiredAffinityForPromotion: 30,
    badgeColor: '#38BDF8'
  },
  {
    id: 'house_ambassador',
    order: 3,
    title: 'House Ambassador',
    shortBadge: 'HOUSE AMBASSADOR',
    description:
      'Atelier & Maison Ambassador with custom haute couture fittings, Fashion Week front-row seating, and co-branded product capsules.',
    signingBonusMultiplier: 3.2,
    retainerMultiplier: 2.9,
    shootPayoutMultiplier: 2.6,
    productRoyaltyPct: 6.5,
    minPopularityOffset: 22,
    minHypeOffset: 16,
    minFlexOffset: 14,
    requiredAffinityForPromotion: 60,
    badgeColor: '#A855F7'
  },
  {
    id: 'global_ambassador',
    order: 4,
    title: 'Global Ambassador',
    shortBadge: 'GLOBAL AMBASSADOR',
    description:
      'Worldwide flagship star across Paris, New York, Tokyo, London, and Seoul billboards with global commercial spots.',
    signingBonusMultiplier: 5.4,
    retainerMultiplier: 4.8,
    shootPayoutMultiplier: 4.2,
    productRoyaltyPct: 10.0,
    minPopularityOffset: 34,
    minHypeOffset: 26,
    minFlexOffset: 24,
    requiredAffinityForPromotion: 90,
    badgeColor: '#F59E0B'
  },
  {
    id: 'face_of_brand',
    order: 5,
    title: 'The Face of the Maison',
    shortBadge: 'THE FACE OF',
    description:
      'Pinnacle cultural icon status — you are the defining global face of the brand’s most iconic flagship product line with a 15% global royalty cut.',
    signingBonusMultiplier: 9.2,
    retainerMultiplier: 8.0,
    shootPayoutMultiplier: 6.8,
    productRoyaltyPct: 15.0,
    minPopularityOffset: 46,
    minHypeOffset: 35,
    minFlexOffset: 36,
    requiredAffinityForPromotion: 125,
    badgeColor: '#F43F5E'
  }
];

export function getAmbassadorRoleTierMeta(
  roleTierId?: AmbassadorRoleTierId
): AmbassadorRoleTierMeta {
  return (
    AMBASSADOR_ROLE_TIERS.find(t => t.id === roleTierId) ||
    AMBASSADOR_ROLE_TIERS[1]
  );
}

export interface BrandSignatureProduct {
  id: string;
  name: string;
  categoryTag: string;
  retailPrice: number;
  baseDailyUnits: number;
  isFlagshipHero?: boolean;
  description: string;
  visualType:
    | 'trunk_bag'
    | 'perfume_flacon'
    | 'sneaker_high'
    | 'sneaker_low'
    | 'chrono_watch'
    | 'diamond_jewelry'
    | 'headphones_pro'
    | 'console_hardware'
    | 'champagne_vintage'
    | 'beverage_can'
    | 'couture_jacket'
    | 'eyewear_luxury'
    | 'supercar_collab';
  primaryHex: string;
  secondaryHex: string;
}

export interface BrandOfferDefinition {
  id: string;
  brandName: string;
  heritageLabel: string; // e.g., "PARIS · EST. 1854"
  parentGroup: string; // e.g., "LVMH Moët Hennessy"
  campaignTitle: string;
  faceOfDesignation: string; // e.g., "The Face of Louis Vuitton Speedy P9 & Menswear"
  vertical: BrandVertical;
  verticalLabel: string;
  tier: 1 | 2 | 3; // 3 = Emerging/Contemporary, 2 = Prestige Global, 1 = Ultra-Luxury Heritage
  minPopularity: number;
  minHype: number;
  minFlexScore: number;
  signingBonus: number;
  dailyRetainer: number;
  durationDays: number;
  shootDeliverableName: string;
  shootBonusPayout: number;
  shootHypeGain: number;
  shootCooldownDays: number;
  terminationPenalty: number;
  description: string;
  logoText: string;
  accentColor: string;
  signatureProducts: BrandSignatureProduct[];
}

export interface ActiveBrandContract {
  offerId: string;
  brandName: string;
  heritageLabel?: string;
  campaignTitle: string;
  faceOfDesignation?: string;
  vertical: BrandVertical;
  verticalLabel: string;
  tier: 1 | 2 | 3;
  roleTierId?: AmbassadorRoleTierId;
  roleTitle?: string;
  isExclusive?: boolean;
  productRoyaltyPct?: number;
  brandAffinityXp?: number;
  capsuleDropsLaunched?: number;
  daysSinceLastCapsuleDrop?: number;
  dailyProductUnitsSold?: number;
  dailyProductRoyaltyEarned?: number;
  totalProductRoyaltiesEarned?: number;
  signedDate: string;
  daysRemaining: number;
  totalDurationDays: number;
  signingBonus: number;
  dailyRetainer: number;
  shootDeliverableName: string;
  shootBonusPayout: number;
  shootHypeGain: number;
  shootCooldownDays: number;
  daysSinceLastShoot: number;
  shootsCompleted: number;
  terminationPenalty: number;
  totalEarnedFromContract: number;
}

export interface IncomingBrandProposal {
  id: string;
  offerId: string;
  brandName: string;
  heritageLabel: string;
  parentGroup: string;
  vertical: BrandVertical;
  verticalLabel: string;
  offeredRoleTierId: AmbassadorRoleTierId;
  offeredRoleTitle: string;
  offeredDurationDays: number;
  offeredIsExclusive: boolean;
  signingBonus: number;
  dailyRetainer: number;
  shootBonusPayout: number;
  productRoyaltyPct: number;
  estimatedDailyProductRoyalty: number;
  totalGuaranteedValue: number;
  terminationPenalty: number;
  executiveName: string;
  executiveTitle: string;
  offerLetterQuote: string;
  expiresInDays: number;
}

export interface BrandDealsState {
  initialized: boolean;
  activeContracts: ActiveBrandContract[];
  incomingProposals?: IncomingBrandProposal[];
  completedContractIds: string[];
  brandAffinityByOfferId?: Record<string, number>;
  lastAutoPromotionMessage?: string | null;
  totalEndorsementIncomeAllTime: number;
  dailyEndorsementIncomeToday: number;
  dailyProductRoyaltiesToday?: number;
}

export const BRAND_VERTICAL_TABS: {
  id: BrandVertical | 'all';
  label: string;
  icon: string;
}[] = [
  { id: 'all', label: 'All Maisons & Brands', icon: 'ph-seal-check' },
  { id: 'fashion', label: 'Haute Couture', icon: 'ph-coat-hanger' },
  { id: 'streetwear', label: 'Sneakers & Sportswear', icon: 'ph-sneaker' },
  { id: 'horology_beauty', label: 'Watches & High Jewelry', icon: 'ph-watch' },
  { id: 'tech_audio', label: 'Audio & Gaming', icon: 'ph-headphones' },
  { id: 'beverage_lifestyle', label: 'Spirits, Beverage & Auto', icon: 'ph-champagne' }
];

/**
 * Generates an authentic, sharp vector SVG data URI for each real-world brand's emblem/monogram.
 */
export function getBrandAuthenticLogoSvgDataUri(
  brandId: string,
  accentColor: string,
  logoText: string
): string {
  let innerLogoSvg = '';

  switch (brandId) {
    case 'brand_louis_vuitton':
      innerLogoSvg = `
        <circle cx="60" cy="60" r="46" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.45"/>
        <!-- Four-petal LV flower -->
        <path d="M60 12 C64 20 64 24 60 28 C56 24 56 20 60 12 Z" fill="${accentColor}" opacity="0.8"/>
        <path d="M60 108 C64 100 64 96 60 92 C56 96 56 100 60 108 Z" fill="${accentColor}" opacity="0.8"/>
        <path d="M12 60 C20 64 24 64 28 60 C24 56 20 56 12 60 Z" fill="${accentColor}" opacity="0.8"/>
        <path d="M108 60 C100 64 96 64 92 60 C96 56 100 56 108 60 Z" fill="${accentColor}" opacity="0.8"/>
        <!-- Interlocking LV Serif Monogram -->
        <text x="53" y="74" text-anchor="middle" fill="#FFF8E7" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-style="italic" font-weight="bold">L</text>
        <text x="66" y="68" text-anchor="middle" fill="${accentColor}" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="bold">V</text>
      `;
      break;

    case 'brand_chanel':
      innerLogoSvg = `
        <!-- Interlocking Double C Chanel Monogram -->
        <path d="M56 38 A22 22 0 1 0 56 82" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
        <path d="M64 38 A22 22 0 1 1 64 82" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
        <text x="60" y="103" text-anchor="middle" fill="${accentColor}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="3.5">CHANEL</text>
      `;
      break;

    case 'brand_dior':
      innerLogoSvg = `
        <rect x="18" y="24" width="84" height="72" rx="12" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.5"/>
        <text x="60" y="68" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="bold" letter-spacing="2">DIOR</text>
        <text x="60" y="86" text-anchor="middle" fill="${accentColor}" font-family="Georgia, serif" font-size="9" letter-spacing="4">PARIS</text>
      `;
      break;

    case 'brand_gucci':
      innerLogoSvg = `
        <!-- Gucci Green-Red-Green Web Stripe -->
        <rect x="20" y="92" width="80" height="4" fill="#15803D"/>
        <rect x="20" y="96" width="80" height="4" fill="#DC2626"/>
        <rect x="20" y="100" width="80" height="4" fill="#15803D"/>
        <!-- Interlocking GG -->
        <circle cx="49" cy="54" r="19" fill="none" stroke="${accentColor}" stroke-width="6"/>
        <circle cx="71" cy="54" r="19" fill="none" stroke="${accentColor}" stroke-width="6"/>
        <line x1="49" y1="54" x2="64" y2="54" stroke="#FFFFFF" stroke-width="5"/>
        <line x1="56" y1="54" x2="71" y2="54" stroke="#FFFFFF" stroke-width="5"/>
      `;
      break;

    case 'brand_prada':
      innerLogoSvg = `
        <!-- Iconic Prada Inverted Milano Triangle Plaque -->
        <polygon points="16,28 104,28 60,98" fill="#09090B" stroke="${accentColor}" stroke-width="3.5"/>
        <polygon points="22,32 98,32 60,91" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.6"/>
        <text x="60" y="52" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="16" font-weight="900" letter-spacing="2.5">PRADA</text>
        <text x="60" y="65" text-anchor="middle" fill="${accentColor}" font-family="Arial, sans-serif" font-size="7.5" font-weight="bold" letter-spacing="2">MILANO</text>
        <text x="60" y="75" text-anchor="middle" fill="#A1A1AA" font-family="Georgia, serif" font-size="6.5">DAL 1913</text>
      `;
      break;

    case 'brand_balenciaga':
      innerLogoSvg = `
        <!-- Balenciaga Interlocking Double B -->
        <text x="46" y="70" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="42" font-weight="900">B</text>
        <text x="74" y="70" text-anchor="middle" fill="${accentColor}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="42" font-weight="900">B</text>
        <text x="60" y="96" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9.5" font-weight="900" letter-spacing="2.5">BALENCIAGA</text>
      `;
      break;

    case 'brand_saint_laurent':
      innerLogoSvg = `
        <!-- Vertical Intertwined YSL Cassandre -->
        <text x="60" y="48" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="34" font-weight="bold">Y</text>
        <text x="60" y="72" text-anchor="middle" fill="${accentColor}" font-family="Georgia, serif" font-size="36" font-style="italic" font-weight="bold">S</text>
        <text x="63" y="94" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="34" font-weight="bold">L</text>
      `;
      break;

    case 'brand_nike_signature':
      innerLogoSvg = `
        <!-- Iconic Nike Swoosh -->
        <path d="M26 68 C34 82, 54 78, 98 42 C66 56, 44 62, 36 52 C32 47, 34 38, 40 30 C28 42, 20 56, 26 68 Z" fill="#FFFFFF"/>
        <text x="60" y="98" text-anchor="middle" fill="${accentColor}" font-family="'Arial Black', Impact, sans-serif" font-size="13" font-style="italic" font-weight="900" letter-spacing="3">NIKE</text>
      `;
      break;

    case 'brand_jordan':
      innerLogoSvg = `
        <!-- Jordan Shield & Winged Basketball Crest -->
        <circle cx="60" cy="52" r="14" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
        <line x1="46" y1="52" x2="74" y2="52" stroke="${accentColor}" stroke-width="1.5"/>
        <path d="M46 48 C30 40, 20 44, 16 54 C26 56, 36 56, 46 54 Z" fill="#FFFFFF"/>
        <path d="M74 48 C90 40, 100 44, 104 54 C94 56, 84 56, 74 54 Z" fill="#FFFFFF"/>
        <text x="60" y="94" text-anchor="middle" fill="${accentColor}" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" letter-spacing="3">JORDAN</text>
      `;
      break;

    case 'brand_adidas_originals':
      innerLogoSvg = `
        <!-- Adidas Originals Three-Leaf Trefoil -->
        <ellipse cx="60" cy="48" rx="11" ry="24" fill="${accentColor}"/>
        <ellipse cx="42" cy="56" rx="10" ry="20" transform="rotate(-34 42 56)" fill="${accentColor}"/>
        <ellipse cx="78" cy="56" rx="10" ry="20" transform="rotate(34 78 56)" fill="${accentColor}"/>
        <rect x="26" y="55" width="68" height="3.5" fill="#09090B"/>
        <rect x="26" y="62" width="68" height="3.5" fill="#09090B"/>
        <rect x="26" y="69" width="68" height="3.5" fill="#09090B"/>
        <text x="60" y="96" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="2">adidas</text>
      `;
      break;

    case 'brand_supreme_ny':
      innerLogoSvg = `
        <!-- Supreme Red Box Logo -->
        <rect x="12" y="38" width="96" height="44" rx="3" fill="#DC2626"/>
        <text x="60" y="67" text-anchor="middle" fill="#FFFFFF" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" font-style="italic" font-weight="900" letter-spacing="0.5">Supreme</text>
      `;
      break;

    case 'brand_rolex':
      innerLogoSvg = `
        <!-- Rolex 5-Pointed Geneva Coronet Crown -->
        <path d="M36 68 L28 38 L46 54 L60 28 L74 54 L92 38 L84 68 Z" fill="${accentColor}"/>
        <circle cx="28" cy="34" r="3.5" fill="${accentColor}"/>
        <circle cx="44" cy="30" r="3.5" fill="${accentColor}"/>
        <circle cx="60" cy="24" r="4" fill="${accentColor}"/>
        <circle cx="76" cy="30" r="3.5" fill="${accentColor}"/>
        <circle cx="92" cy="34" r="3.5" fill="${accentColor}"/>
        <ellipse cx="60" cy="73" rx="24" ry="4" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
        <text x="60" y="96" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="13" font-weight="bold" letter-spacing="3">ROLEX</text>
      `;
      break;

    case 'brand_tiffany_co':
      innerLogoSvg = `
        <rect x="14" y="14" width="92" height="92" rx="18" fill="#0ABAB5" opacity="0.22" stroke="#0ABAB5" stroke-width="2"/>
        <polygon points="60,24 76,40 60,64 44,40" fill="none" stroke="#81E6D9" stroke-width="2.5"/>
        <line x1="44" y1="40" x2="76" y2="40" stroke="#81E6D9" stroke-width="1.5"/>
        <text x="60" y="84" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="14" font-weight="bold" letter-spacing="1.5">T &amp; CO.</text>
        <text x="60" y="97" text-anchor="middle" fill="#81E6D9" font-family="Georgia, serif" font-size="7.5" letter-spacing="2.5">NEW YORK</text>
      `;
      break;

    case 'brand_cartier':
      innerLogoSvg = `
        <ellipse cx="60" cy="56" rx="34" ry="40" fill="none" stroke="${accentColor}" stroke-width="2"/>
        <text x="60" y="64" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-size="23" font-style="italic" font-weight="bold">Cartier</text>
        <text x="60" y="82" text-anchor="middle" fill="${accentColor}" font-family="Georgia, serif" font-size="7.5" letter-spacing="3">PARIS</text>
      `;
      break;

    case 'brand_audemars_piguet':
      innerLogoSvg = `
        <!-- Royal Oak Octagonal Bezel with 8 Screws -->
        <polygon points="42,16 78,16 104,42 104,78 78,104 42,104 16,78 16,42" fill="none" stroke="${accentColor}" stroke-width="3"/>
        <text x="60" y="68" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="30" font-weight="bold" letter-spacing="2">AP</text>
      `;
      break;

    case 'brand_beats_apple':
      innerLogoSvg = `
        <!-- Beats by Dre Iconic Red Circle & 'b' -->
        <circle cx="60" cy="58" r="34" fill="#E11D48"/>
        <circle cx="60" cy="58" r="14" fill="none" stroke="#FFFFFF" stroke-width="6.5"/>
        <line x1="46" y1="24" x2="46" y2="58" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round"/>
      `;
      break;

    case 'brand_playstation':
      innerLogoSvg = `
        <text x="60" y="54" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="30" font-weight="900" letter-spacing="1">PS5</text>
        <!-- PlayStation Controller Symbols -->
        <polygon points="30,84 36,72 42,84" fill="none" stroke="#34D399" stroke-width="2.5"/>
        <circle cx="52" cy="78" r="6" fill="none" stroke="#FB7185" stroke-width="2.5"/>
        <line x1="64" y1="72" x2="74" y2="84" stroke="#60A5FA" stroke-width="2.5"/>
        <line x1="74" y1="72" x2="64" y2="84" stroke="#60A5FA" stroke-width="2.5"/>
        <rect x="82" y="72" width="11" height="11" fill="none" stroke="#F472B6" stroke-width="2.5"/>
      `;
      break;

    case 'brand_dom_perignon':
      innerLogoSvg = `
        <!-- Dom Perignon Vintage Shield -->
        <path d="M32 22 L88 22 L88 58 C88 80 60 98 60 102 C60 98 32 80 32 58 Z" fill="#09090B" stroke="${accentColor}" stroke-width="2.8"/>
        <text x="60" y="48" text-anchor="middle" fill="${accentColor}" font-family="Georgia, serif" font-size="14" font-style="italic" font-weight="bold">Dom</text>
        <text x="60" y="64" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="12" font-style="italic" font-weight="bold">Pérignon</text>
        <text x="60" y="80" text-anchor="middle" fill="${accentColor}" font-family="Georgia, serif" font-size="8" letter-spacing="2">VINTAGE</text>
      `;
      break;

    case 'brand_sprite_global':
      innerLogoSvg = `
        <circle cx="60" cy="58" r="36" fill="#059669" stroke="#FACC15" stroke-width="3"/>
        <text x="60" y="66" text-anchor="middle" fill="#FFFFFF" font-family="'Arial Black', Impact, sans-serif" font-size="20" font-style="italic" font-weight="900">SPRITE</text>
        <circle cx="84" cy="40" r="6" fill="#FACC15"/>
      `;
      break;

    case 'brand_porsche':
      innerLogoSvg = `
        <path d="M32 20 L88 20 L88 58 C88 82 60 98 60 102 C60 98 32 82 32 58 Z" fill="#18181B" stroke="${accentColor}" stroke-width="3"/>
        <line x1="60" y1="20" x2="60" y2="100" stroke="${accentColor}" stroke-width="1.5"/>
        <line x1="32" y1="56" x2="88" y2="56" stroke="${accentColor}" stroke-width="1.5"/>
        <text x="60" y="34" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" letter-spacing="2">PORSCHE</text>
      `;
      break;

    default:
      innerLogoSvg = `
        <text x="60" y="68" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-size="26" font-weight="900" letter-spacing="2">${logoText}</text>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="bg_${brandId}" cx="35%" cy="25%" r="75%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.28"/>
        <stop offset="65%" stop-color="#09090B" stop-opacity="0.96"/>
        <stop offset="100%" stop-color="#050507" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect width="120" height="120" rx="26" fill="url(#bg_${brandId})" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.45"/>
    ${innerLogoSvg}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an editorial SVG product illustration for any BrandSignatureProduct.
 */
export function getBrandSignatureProductSvgDataUri(
  product: BrandSignatureProduct,
  brandName: string
): string {
  const p = product.primaryHex || '#D4AF37';
  const s = product.secondaryHex || '#FFFFFF';
  let art = '';

  switch (product.visualType) {
    case 'trunk_bag':
      art = `
        <path d="M115 62 C115 38 165 38 165 62" fill="none" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
        <rect x="75" y="62" width="130" height="86" rx="14" fill="#181411" stroke="${p}" stroke-width="3.5"/>
        <line x1="108" y1="62" x2="108" y2="148" stroke="${p}" stroke-width="4"/>
        <line x1="172" y1="62" x2="172" y2="148" stroke="${p}" stroke-width="4"/>
        <rect x="130" y="94" width="20" height="18" rx="4" fill="${p}"/>
      `;
      break;
    case 'perfume_flacon':
      art = `
        <rect x="122" y="32" width="36" height="20" rx="4" fill="${s}" stroke="${p}" stroke-width="2.5"/>
        <rect x="132" y="52" width="16" height="10" fill="${p}"/>
        <rect x="92" y="62" width="96" height="96" rx="10" fill="${p}" fill-opacity="0.22" stroke="${p}" stroke-width="3"/>
        <rect x="108" y="84" width="64" height="46" rx="4" fill="#FFFFFF" stroke="${p}" stroke-width="2"/>
        <text x="140" y="109" text-anchor="middle" fill="#09090B" font-family="Georgia, serif" font-size="11" font-weight="bold">N° 5 / EDP</text>
      `;
      break;
    case 'sneaker_high':
    case 'sneaker_low':
      art = `
        <path d="M55 138 L225 138 L225 152 C225 156 220 160 214 160 L66 160 C58 160 55 155 55 150 Z" fill="#FFFFFF" stroke="${p}" stroke-width="2.5"/>
        <path d="M62 138 L68 74 L118 74 L148 106 L212 114 C222 116 225 126 225 138 Z" fill="${p}" stroke="${s}" stroke-width="2.5"/>
        <path d="M92 106 C115 118 145 116 178 96" fill="none" stroke="${s}" stroke-width="6" stroke-linecap="round"/>
      `;
      break;
    case 'chrono_watch':
      art = `
        <rect x="118" y="24" width="44" height="168" rx="8" fill="#27272A" stroke="${p}" stroke-width="2.5"/>
        <circle cx="140" cy="108" r="42" fill="#09090B" stroke="${p}" stroke-width="6"/>
        <circle cx="126" cy="108" r="9" fill="none" stroke="${s}" stroke-width="1.5"/>
        <circle cx="154" cy="108" r="9" fill="none" stroke="${s}" stroke-width="1.5"/>
        <line x1="140" y1="108" x2="140" y2="80" stroke="${p}" stroke-width="3" stroke-linecap="round"/>
        <line x1="140" y1="108" x2="162" y2="108" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
      `;
      break;
    case 'diamond_jewelry':
      art = `
        <ellipse cx="140" cy="102" rx="54" ry="44" fill="none" stroke="${p}" stroke-width="7" stroke-dasharray="14 5"/>
        <polygon points="140,126 158,144 140,168 122,144" fill="${s}" stroke="${p}" stroke-width="2.5"/>
      `;
      break;
    case 'headphones_pro':
      art = `
        <path d="M88 118 A52 52 0 0 1 192 118" fill="none" stroke="${p}" stroke-width="10" stroke-linecap="round"/>
        <rect x="74" y="102" width="26" height="48" rx="13" fill="${p}" stroke="${s}" stroke-width="2.5"/>
        <rect x="180" y="102" width="26" height="48" rx="13" fill="${p}" stroke="${s}" stroke-width="2.5"/>
      `;
      break;
    case 'console_hardware':
      art = `
        <path d="M104 38 L176 38 L168 164 L112 164 Z" fill="#FFFFFF" stroke="${p}" stroke-width="3"/>
        <rect x="122" y="44" width="36" height="116" rx="6" fill="#09090B"/>
        <line x1="124" y1="54" x2="124" y2="148" stroke="${p}" stroke-width="2.5"/>
        <line x1="156" y1="54" x2="156" y2="148" stroke="${p}" stroke-width="2.5"/>
      `;
      break;
    case 'champagne_vintage':
      art = `
        <rect x="131" y="26" width="18" height="36" rx="3" fill="${p}"/>
        <path d="M131 62 C114 82 110 96 110 156 L170 156 C170 96 166 82 149 62 Z" fill="#0F172A" stroke="${p}" stroke-width="3"/>
        <path d="M122 100 L158 100 L158 126 C158 136 140 144 140 146 C140 144 122 136 122 126 Z" fill="#09090B" stroke="${p}" stroke-width="2"/>
      `;
      break;
    case 'beverage_can':
      art = `
        <rect x="104" y="42" width="72" height="118" rx="12" fill="${p}" stroke="${s}" stroke-width="3"/>
        <ellipse cx="140" cy="42" rx="34" ry="6" fill="#E4E4E7"/>
        <text x="140" y="108" text-anchor="middle" fill="#FFFFFF" font-family="'Arial Black', sans-serif" font-size="16" font-style="italic">${brandName.split(' ')[0].toUpperCase()}</text>
      `;
      break;
    case 'supercar_collab':
      art = `
        <path d="M48 134 L76 102 L128 84 L188 86 L228 114 L236 134 Z" fill="${p}" stroke="${s}" stroke-width="2.5"/>
        <circle cx="92" cy="136" r="18" fill="#09090B" stroke="${s}" stroke-width="4"/>
        <circle cx="196" cy="136" r="18" fill="#09090B" stroke="${s}" stroke-width="4"/>
      `;
      break;
    default:
      art = `
        <path d="M96 52 L184 52 L202 92 L176 104 L168 82 L168 158 L112 158 L112 82 L104 104 L78 92 Z" fill="${p}" stroke="${s}" stroke-width="2.5"/>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 190" width="280" height="190">
    <defs>
      <radialGradient id="prod_glow" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="#09090B" stop-opacity="0.98"/>
      </radialGradient>
    </defs>
    <rect width="280" height="190" rx="18" fill="url(#prod_glow)"/>
    ${art}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const BRAND_OFFERS_CATALOG: BrandOfferDefinition[] = [
  // =========================================================================
  // 1. HAUTE COUTURE & LUXURY FASHION MAISONS
  // =========================================================================
  {
    id: 'brand_louis_vuitton',
    brandName: 'Louis Vuitton',
    heritageLabel: 'PARIS · EST. 1854',
    parentGroup: 'LVMH Moët Hennessy',
    campaignTitle: 'Pont Neuf Runway & Core Values Campaign',
    faceOfDesignation: 'The Face of Louis Vuitton Speedy P9 & Menswear',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 1,
    minPopularity: 64,
    minHype: 55,
    minFlexScore: 30,
    signingBonus: 1_500_000,
    dailyRetainer: 9_800,
    durationDays: 120,
    shootDeliverableName: 'Pont Neuf Paris Runway Finale & Louvre Billboard Film',
    shootBonusPayout: 360_000,
    shootHypeGain: 10.0,
    shootCooldownDays: 20,
    terminationPenalty: 950_000,
    description:
      'Represent the world’s most valuable luxury Maison with custom Pharrell & Nicolas Ghesquière tour trunks, Met Gala looks, and Place Vendôme global billboards.',
    logoText: 'LV',
    accentColor: '#D4AF37',
    signatureProducts: [
      {
        id: 'lv_speedy_p9',
        name: 'Speedy P9 Bandoulière 40 Monogram Calfskin',
        categoryTag: 'ICONIC LEATHER GOODS',
        retailPrice: 11_200,
        baseDailyUnits: 95,
        isFlagshipHero: true,
        description: 'Supple grained calfskin duffle with silkscreened LV monogram and solid gold-tone padlock.',
        visualType: 'trunk_bag',
        primaryHex: '#D4AF37',
        secondaryHex: '#FEF3C7'
      },
      {
        id: 'lv_courrier_trunk',
        name: 'Malle Courrier Lozine 110 Bespoke Tour Trunk',
        categoryTag: 'HERITAGE HARDSIDED TRUNK',
        retailPrice: 68_000,
        baseDailyUnits: 14,
        description: 'Handcrafted Asnièresatelier exhibition trunk with brass corners and custom stage-wardrobe drawers.',
        visualType: 'trunk_bag',
        primaryHex: '#B45309',
        secondaryHex: '#FDE68A'
      },
      {
        id: 'lv_imagination_edp',
        name: 'LV Imagination & Ombre Nomade Extrait Flacon',
        categoryTag: 'HAUTE PARFUMERIE',
        retailPrice: 410,
        baseDailyUnits: 1_450,
        description: 'Master perfumer Jacques Cavallier Belletrud amber-citrus and oud signature fragrance collection.',
        visualType: 'perfume_flacon',
        primaryHex: '#38BDF8',
        secondaryHex: '#E0F2FE'
      }
    ]
  },
  {
    id: 'brand_chanel',
    brandName: 'Chanel',
    heritageLabel: '31 RUE CAMBON, PARIS · EST. 1910',
    parentGroup: 'Maison Chanel Privée',
    campaignTitle: 'Grand Palais Haute Couture & N°5 Film',
    faceOfDesignation: 'The Face of Chanel N°5 & Coco Crush Fine Jewelry',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 1,
    minPopularity: 68,
    minHype: 58,
    minFlexScore: 34,
    signingBonus: 1_650_000,
    dailyRetainer: 10_500,
    durationDays: 120,
    shootDeliverableName: 'Grand Palais Haute Couture Show & Short Film',
    shootBonusPayout: 390_000,
    shootHypeGain: 10.5,
    shootCooldownDays: 21,
    terminationPenalty: 1_100_000,
    description:
      'Join the most exclusive ambassador roster in fashion history with bespoke Rue Cambon tweed couture, Coco Crush jewelry campaigns, and global cinema spots.',
    logoText: 'CC',
    accentColor: '#F4F4F5',
    signatureProducts: [
      {
        id: 'chanel_classic_flap',
        name: 'Chanel 11.12 Classic Medium Lambskin Flap Bag',
        categoryTag: 'TIMELESS MAROQUINERIE',
        retailPrice: 10_800,
        baseDailyUnits: 110,
        isFlagshipHero: true,
        description: 'Diamond-quilted black lambskin with double-C turnlock and interwoven leather-and-gold chain.',
        visualType: 'trunk_bag',
        primaryHex: '#E4E4E7',
        secondaryHex: '#FDE047'
      },
      {
        id: 'chanel_no5_parfum',
        name: 'Chanel N°5 Grand Extrait Baccarat Crystal Flacon',
        categoryTag: 'ICONIC HIGH PERFUMERY',
        retailPrice: 365,
        baseDailyUnits: 2_200,
        description: 'The world’s most legendary floral-aldehydic fragrance sealed by hand with baudruchage.',
        visualType: 'perfume_flacon',
        primaryHex: '#FACC15',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'chanel_j12_caliber',
        name: 'Chanel J12 Ceramic & Diamond Tourbillon 38mm',
        categoryTag: 'HAUTE HORLOGERIE',
        retailPrice: 28_500,
        baseDailyUnits: 26,
        description: 'High-resistance gloss black ceramic timepiece with baguette-cut diamond bezel.',
        visualType: 'chrono_watch',
        primaryHex: '#F4F4F5',
        secondaryHex: '#A1A1AA'
      }
    ]
  },
  {
    id: 'brand_dior',
    brandName: 'Christian Dior',
    heritageLabel: '30 AVENUE MONTAIGNE, PARIS · EST. 1946',
    parentGroup: 'LVMH Moët Hennessy',
    campaignTitle: 'Avenue Montaigne Couture & Sauvage Global Face',
    faceOfDesignation: 'The Face of Dior Sauvage Elixir & Saddle Couture',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 1,
    minPopularity: 56,
    minHype: 50,
    minFlexScore: 25,
    signingBonus: 1_150_000,
    dailyRetainer: 7_600,
    durationDays: 120,
    shootDeliverableName: 'Jardin des Tuileries Runway & Global Fragrance TVC',
    shootBonusPayout: 280_000,
    shootHypeGain: 8.8,
    shootCooldownDays: 18,
    terminationPenalty: 750_000,
    description:
      'Headline Christian Dior’s global couture and fragrance empire across airport duty-free terminals, Vogue covers, and red-carpet galas.',
    logoText: 'DIOR',
    accentColor: '#93C5FD',
    signatureProducts: [
      {
        id: 'dior_sauvage_elixir',
        name: 'Dior Sauvage Elixir & J’adore L’Or Collector Edition',
        categoryTag: 'GLOBAL #1 FRAGRANCE',
        retailPrice: 255,
        baseDailyUnits: 3_100,
        isFlagshipHero: true,
        description: 'Midnight-blue lacquered flacon housing concentrated Calabrian bergamot and lavender essence.',
        visualType: 'perfume_flacon',
        primaryHex: '#3B82F6',
        secondaryHex: '#DBEAFE'
      },
      {
        id: 'dior_saddle_oblique',
        name: 'Dior Men Saddle Bag in Jacquard Oblique & Calfskin',
        categoryTag: 'RUNWAY LEATHER GOODS',
        retailPrice: 4_100,
        baseDailyUnits: 185,
        description: 'Iconic equestrian silhouette with CD aluminum buckle and tonal Oblique canvas.',
        visualType: 'trunk_bag',
        primaryHex: '#93C5FD',
        secondaryHex: '#1E293B'
      },
      {
        id: 'dior_b23_tailoring',
        name: 'Dior Oblique Silk Bomber & Custom Tour Suiting',
        categoryTag: 'ATELIER MENS & WOMENS RTW',
        retailPrice: 5_400,
        baseDailyUnits: 92,
        description: 'Architectural Parisian tailoring crafted at 30 Avenue Montaigne.',
        visualType: 'couture_jacket',
        primaryHex: '#60A5FA',
        secondaryHex: '#F8FAFC'
      }
    ]
  },
  {
    id: 'brand_gucci',
    brandName: 'Gucci',
    heritageLabel: 'FLORENCE & MILAN · EST. 1921',
    parentGroup: 'Kering Luxury Group',
    campaignTitle: 'Gucci Ancora Milan Runway & Bamboo 1947',
    faceOfDesignation: 'The Face of Gucci Bamboo 1947 & Horsebit Fine Line',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 2,
    minPopularity: 46,
    minHype: 44,
    minFlexScore: 18,
    signingBonus: 720_000,
    dailyRetainer: 5_100,
    durationDays: 90,
    shootDeliverableName: 'Milan Fashion Week Front Row & Palazzo Campaign',
    shootBonusPayout: 175_000,
    shootHypeGain: 7.4,
    shootCooldownDays: 16,
    terminationPenalty: 480_000,
    description:
      'Embody Italian maximalist glamour in Florence and Milan with custom Rosso Ancora leather goods, Horsebit loafers, and stadium tour wardrobes.',
    logoText: 'GG',
    accentColor: '#EF4444',
    signatureProducts: [
      {
        id: 'gucci_jackie_1961',
        name: 'Gucci Jackie 1961 & Bamboo 1947 Rosso Ancora Bag',
        categoryTag: 'FLORENTINE LEATHER',
        retailPrice: 3_950,
        baseDailyUnits: 210,
        isFlagshipHero: true,
        description: 'Curved half-moon silhouette with gold-toned piston closure and green-red-green Web strap.',
        visualType: 'trunk_bag',
        primaryHex: '#DC2626',
        secondaryHex: '#16A34A'
      },
      {
        id: 'gucci_horsebit_1953',
        name: 'Gucci Horsebit 1953 Italian Calfskin Loafer',
        categoryTag: 'HERITAGE FOOTWEAR',
        retailPrice: 1_050,
        baseDailyUnits: 540,
        description: 'Hand-stitched Florentine leather loafer with signature brass double-ring and bar.',
        visualType: 'sneaker_low',
        primaryHex: '#15803D',
        secondaryHex: '#FACC15'
      },
      {
        id: 'gucci_flora_gorgeous',
        name: 'Gucci Guilty Elixir & Flora Eau de Parfum',
        categoryTag: 'PRESTIGE FRAGRANCE',
        retailPrice: 185,
        baseDailyUnits: 1_650,
        description: 'Rich ambery-floral composition housed in an elongated lacquered flacon.',
        visualType: 'perfume_flacon',
        primaryHex: '#F43F5E',
        secondaryHex: '#FEF08A'
      }
    ]
  },
  {
    id: 'brand_prada',
    brandName: 'Prada',
    heritageLabel: 'GALLERIA VITTORIO EMANUELE II, MILAN · EST. 1913',
    parentGroup: 'Prada S.p.A.',
    campaignTitle: 'Fondazione Prada Runway & Re-Nylon Global Face',
    faceOfDesignation: 'The Face of Prada Galleria & Symbole Eyewear',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 2,
    minPopularity: 42,
    minHype: 42,
    minFlexScore: 15,
    signingBonus: 580_000,
    dailyRetainer: 4_200,
    durationDays: 90,
    shootDeliverableName: 'Fondazione Prada Milan Campaign & Cinema Series',
    shootBonusPayout: 140_000,
    shootHypeGain: 6.8,
    shootCooldownDays: 16,
    terminationPenalty: 390_000,
    description:
      'Partner with Miuccia Prada and Raf Simons for intellectual Milanese luxury across Galleria leather goods, Symbole eyewear, and Re-Nylon outerwear.',
    logoText: 'PRADA',
    accentColor: '#E4E4E7',
    signatureProducts: [
      {
        id: 'prada_galleria_saffiano',
        name: 'Prada Galleria Saffiano Leather Tote with Triangle Logo',
        categoryTag: 'ICONIC MILANESE BAG',
        retailPrice: 4_600,
        baseDailyUnits: 175,
        isFlagshipHero: true,
        description: 'Crosshatch-textured Saffiano calfskin invented by Mario Prada with enamel triangle plaque.',
        visualType: 'trunk_bag',
        primaryHex: '#E4E4E7',
        secondaryHex: '#18181B'
      },
      {
        id: 'prada_symbole_sunglasses',
        name: 'Prada Symbole Geometric Acetate Sunglasses',
        categoryTag: 'LUXURY EYEWEAR',
        retailPrice: 575,
        baseDailyUnits: 920,
        description: 'Bold architectural black acetate frames with three-dimensional Prada triangle temples.',
        visualType: 'couture_jacket',
        primaryHex: '#A1A1AA',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'prada_paradoxe_intense',
        name: 'Prada Paradoxe Intense Rechargeable Triangle Bottle',
        categoryTag: 'AVANT-GARDE FRAGRANCE',
        retailPrice: 170,
        baseDailyUnits: 1_780,
        description: 'Tilted triangular glass bottle with neroli bud, amber accord, and jasmine superinfusion.',
        visualType: 'perfume_flacon',
        primaryHex: '#FB7185',
        secondaryHex: '#18181B'
      }
    ]
  },
  {
    id: 'brand_balenciaga',
    brandName: 'Balenciaga',
    heritageLabel: '10 AVENUE GEORGE V, PARIS · EST. 1917',
    parentGroup: 'Kering Luxury Group',
    campaignTitle: 'Avenue George V Couture & Le City Campaign',
    faceOfDesignation: 'The Face of Balenciaga Couture & Le City Bag',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 2,
    minPopularity: 36,
    minHype: 45,
    minFlexScore: 14,
    signingBonus: 490_000,
    dailyRetainer: 3_600,
    durationDays: 90,
    shootDeliverableName: 'Paris Mud/Snow Dystopian Runway Walk & Lookbook',
    shootBonusPayout: 120_000,
    shootHypeGain: 7.2,
    shootCooldownDays: 15,
    terminationPenalty: 330_000,
    description:
      'Walk the viral Balenciaga runway in Paris and front brutalist global street billboards in oversized armored silhouettes and Le City bags.',
    logoText: 'BB',
    accentColor: '#A1A1AA',
    signatureProducts: [
      {
        id: 'balenciaga_le_city',
        name: 'Balenciaga Le City Medium Arena Storico Lambskin Bag',
        categoryTag: 'CULT IT-BAG REVIVAL',
        retailPrice: 2_900,
        baseDailyUnits: 245,
        isFlagshipHero: true,
        description: 'Hand-braided handles, aged brass Giant studs, and distressed Arena lambskin leather.',
        visualType: 'trunk_bag',
        primaryHex: '#71717A',
        secondaryHex: '#E4E4E7'
      },
      {
        id: 'balenciaga_3xl_sneaker',
        name: 'Balenciaga 3XL & Cargo Technical Mesh Runner',
        categoryTag: 'OVERSIZED FOOTWEAR',
        retailPrice: 1_190,
        baseDailyUnits: 460,
        description: 'Worn-out technical mesh silhouette with extra-wide sculpted sole and wrapped toe laces.',
        visualType: 'sneaker_low',
        primaryHex: '#52525B',
        secondaryHex: '#F43F5E'
      },
      {
        id: 'balenciaga_armored_hoodie',
        name: 'Balenciaga Heavy Fleece Couture Boxy Hoodie',
        categoryTag: 'LUXURY STREET COUTURE',
        retailPrice: 1_550,
        baseDailyUnits: 380,
        description: 'Heavyweight 650GSM distressed Japanese jersey with tonal BB Paris embroidery.',
        visualType: 'couture_jacket',
        primaryHex: '#27272A',
        secondaryHex: '#D4D4D8'
      }
    ]
  },
  {
    id: 'brand_saint_laurent',
    brandName: 'Saint Laurent',
    heritageLabel: 'RIVE DROITE, PARIS · EST. 1961',
    parentGroup: 'Kering Luxury Group',
    campaignTitle: 'Rive Droite Paris Music & Le Smoking Campaign',
    faceOfDesignation: 'The Face of Saint Laurent Le Smoking & MYSLF',
    vertical: 'fashion',
    verticalLabel: 'Haute Couture',
    tier: 3,
    minPopularity: 22,
    minHype: 30,
    minFlexScore: 8,
    signingBonus: 260_000,
    dailyRetainer: 2_200,
    durationDays: 75,
    shootDeliverableName: 'Trocadéro Eiffel Tower Night Runway & Monochrome Film',
    shootBonusPayout: 75_000,
    shootHypeGain: 5.8,
    shootCooldownDays: 14,
    terminationPenalty: 180_000,
    description:
      'Rock-and-roll Parisian elegance with razor-sharp Anthony Vaccarello leather jackets, Cassandre bags, and monochrome global print campaigns.',
    logoText: 'YSL',
    accentColor: '#E5E7EB',
    signatureProducts: [
      {
        id: 'ysl_loulou_cassandre',
        name: 'Saint Laurent Loulou & Manhattan Cassandre Bag',
        categoryTag: 'PARISIAN MAROQUINERIE',
        retailPrice: 3_200,
        baseDailyUnits: 230,
        isFlagshipHero: true,
        description: 'Box calfskin shoulder bag crowned with the interlocking golden YSL Cassandre emblem.',
        visualType: 'trunk_bag',
        primaryHex: '#D4AF37',
        secondaryHex: '#18181B'
      },
      {
        id: 'ysl_myslf_le_parfum',
        name: 'YSL MYSLF & Libre Intense Eau de Parfum',
        categoryTag: 'COUTURE FRAGRANCE',
        retailPrice: 168,
        baseDailyUnits: 1_950,
        description: 'Monolithic black glass bottle with orange blossom absolute and warm bourbon vanilla.',
        visualType: 'perfume_flacon',
        primaryHex: '#E5E7EB',
        secondaryHex: '#F59E0B'
      },
      {
        id: 'ysl_leather_biker',
        name: 'Saint Laurent Classic Motorcycle Jacket in Plongé Lambskin',
        categoryTag: 'ICONIC STAGE OUTERWEAR',
        retailPrice: 5_500,
        baseDailyUnits: 74,
        description: 'Asymmetric zip Parisian rock biker jacket crafted from butter-soft lambskin.',
        visualType: 'couture_jacket',
        primaryHex: '#18181B',
        secondaryHex: '#E4E4E7'
      }
    ]
  },

  // =========================================================================
  // 2. SNEAKERS, SPORTSWEAR & STREETWEAR
  // =========================================================================
  {
    id: 'brand_nike_signature',
    brandName: 'Nike',
    heritageLabel: 'BEAVERTON, OREGON · EST. 1971',
    parentGroup: 'NIKE, Inc.',
    campaignTitle: 'Global Signature Sneaker & SNKRS Shock Drop',
    faceOfDesignation: 'The Face of Nike Air Max & Artist Signature Sub-Label',
    vertical: 'streetwear',
    verticalLabel: 'Sneakers & Sportswear',
    tier: 1,
    minPopularity: 58,
    minHype: 52,
    minFlexScore: 22,
    signingBonus: 1_250_000,
    dailyRetainer: 8_200,
    durationDays: 120,
    shootDeliverableName: 'SNKRS Global Shock Drop & World Stadium Commercial',
    shootBonusPayout: 310_000,
    shootHypeGain: 9.4,
    shootCooldownDays: 18,
    terminationPenalty: 820_000,
    description:
      'Co-create your own Nike signature sneaker silhouette with SNKRS app shock drops, Beaverton campus lab access, and global athlete-level royalties.',
    logoText: 'NIKE',
    accentColor: '#F97316',
    signatureProducts: [
      {
        id: 'nike_collab_af1_low',
        name: 'Artist × Nike Air Force 1 Low "Utopia / Cactus" Edition',
        categoryTag: 'SIGNATURE SNKRS COLLAB',
        retailPrice: 180,
        baseDailyUnits: 4_800,
        isFlagshipHero: true,
        description: 'Tear-away canvas shroud, reversed Swoosh detailing, and custom embossed heel insignia.',
        visualType: 'sneaker_low',
        primaryHex: '#F97316',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'nike_air_max_dn',
        name: 'Nike Air Max Dn Dynamic Air Flagship Runner',
        categoryTag: 'GLOBAL FOOTWEAR FRANCHISE',
        retailPrice: 170,
        baseDailyUnits: 6_200,
        description: 'Dual-chamber four-tubed Nike Air unit engineered for futuristic bounce and street wearability.',
        visualType: 'sneaker_low',
        primaryHex: '#FB923C',
        secondaryHex: '#18181B'
      },
      {
        id: 'nike_nocta_tech_fleece',
        name: 'Artist × Nike Signature Tech Fleece Track Jacket',
        categoryTag: 'CO-BRANDED APPAREL LINE',
        retailPrice: 155,
        baseDailyUnits: 3_400,
        description: 'Reflective piping, custom co-branded silicone Swoosh badge, and articulated tour-ready fit.',
        visualType: 'couture_jacket',
        primaryHex: '#EA580C',
        secondaryHex: '#F4F4F5'
      }
    ]
  },
  {
    id: 'brand_jordan',
    brandName: 'Jordan Brand',
    heritageLabel: 'CHICAGO · EST. 1984',
    parentGroup: 'NIKE, Inc.',
    campaignTitle: 'Jumpman Wings Signature Air Jordan 1 & 4 Collab',
    faceOfDesignation: 'The Face of Air Jordan Retro & Jumpman Cutz',
    vertical: 'streetwear',
    verticalLabel: 'Sneakers & Sportswear',
    tier: 1,
    minPopularity: 62,
    minHype: 56,
    minFlexScore: 26,
    signingBonus: 1_400_000,
    dailyRetainer: 9_100,
    durationDays: 120,
    shootDeliverableName: 'Air Jordan 1 Retro High OG Global Raffle & Pop-Up',
    shootBonusPayout: 340_000,
    shootHypeGain: 9.8,
    shootCooldownDays: 19,
    terminationPenalty: 900_000,
    description:
      'Follow in the footsteps of the most coveted sneaker collaborations on earth with your own Air Jordan 1 High OG and Jumpman apparel line.',
    logoText: 'JORDAN',
    accentColor: '#EF4444',
    signatureProducts: [
      {
        id: 'jordan_1_retro_high_collab',
        name: 'Artist × Air Jordan 1 Retro High OG "Mocha / Reverse"',
        categoryTag: 'GRAIL SNEAKER COLLAB',
        retailPrice: 220,
        baseDailyUnits: 4_500,
        isFlagshipHero: true,
        description: 'Premium nubuck suede, hidden stash pocket in ankle collar, and co-branded Wings logo.',
        visualType: 'sneaker_high',
        primaryHex: '#DC2626',
        secondaryHex: '#F4F4F5'
      },
      {
        id: 'jordan_jumpman_jack',
        name: 'Jordan Jumpman Jack TR Signature Trainer',
        categoryTag: 'FIRST ORIGINAL SILHOUETTE',
        retailPrice: 200,
        baseDailyUnits: 3_900,
        description: 'Forefoot lockdown strap, gum outsole with custom traction graphic, and canvas-suede upper.',
        visualType: 'sneaker_high',
        primaryHex: '#B91C1C',
        secondaryHex: '#FDE68A'
      },
      {
        id: 'jordan_wings_varsity',
        name: 'Jordan Wings Italian Leather & Cashmere Varsity Jacket',
        categoryTag: 'PINNACLE CAPSULE',
        retailPrice: 950,
        baseDailyUnits: 420,
        description: 'Full-grain cowhide sleeves with chenille Jumpman and artist tour patches.',
        visualType: 'couture_jacket',
        primaryHex: '#EF4444',
        secondaryHex: '#18181B'
      }
    ]
  },
  {
    id: 'brand_adidas_originals',
    brandName: 'Adidas Originals',
    heritageLabel: 'HERZOGENAURACH · EST. 1949',
    parentGroup: 'adidas AG',
    campaignTitle: 'We Gave the World an Original — Samba & Gazelle Capsule',
    faceOfDesignation: 'The Face of Adidas Originals Samba & Confirmed App',
    vertical: 'streetwear',
    verticalLabel: 'Sneakers & Sportswear',
    tier: 2,
    minPopularity: 34,
    minHype: 36,
    minFlexScore: 10,
    signingBonus: 420_000,
    dailyRetainer: 3_200,
    durationDays: 90,
    shootDeliverableName: 'Confirmed App Global Drop & Three-Stripes Film',
    shootBonusPayout: 105_000,
    shootHypeGain: 6.4,
    shootCooldownDays: 15,
    terminationPenalty: 280_000,
    description:
      'Headline the global Trefoil revival with collaborative Samba and Gazelle Indoor colorways and vintage Firebird tracksuits.',
    logoText: 'ADI',
    accentColor: '#38BDF8',
    signatureProducts: [
      {
        id: 'adidas_samba_og_collab',
        name: 'Artist × Adidas Originals Samba OG Pony Hair & Gum',
        categoryTag: 'CONFIRMED APP EXCLUSIVE',
        retailPrice: 160,
        baseDailyUnits: 5_100,
        isFlagshipHero: true,
        description: 'Fold-over football tongue, gold-foil artist signature stamp, and translucent gum cupsole.',
        visualType: 'sneaker_low',
        primaryHex: '#0284C7',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'adidas_gazelle_indoor',
        name: 'Adidas Gazelle Indoor Velvet & Suede Pack',
        categoryTag: 'TERRACE FOOTWEAR ICON',
        retailPrice: 130,
        baseDailyUnits: 4_600,
        description: 'Rich jewel-toned velvet upper with serrated Three-Stripes and T-toe overlay.',
        visualType: 'sneaker_low',
        primaryHex: '#38BDF8',
        secondaryHex: '#FDE047'
      },
      {
        id: 'adidas_firebird_track',
        name: 'Adidas Originals Adicolor Heritage Firebird Track Top',
        categoryTag: 'ICONIC STREET APPAREL',
        retailPrice: 110,
        baseDailyUnits: 3_800,
        description: 'Recycled tricot sheen with embroidered Trefoil chest badge and Three-Stripes down the sleeves.',
        visualType: 'couture_jacket',
        primaryHex: '#0EA5E9',
        secondaryHex: '#FFFFFF'
      }
    ]
  },
  {
    id: 'brand_supreme_ny',
    brandName: 'Supreme',
    heritageLabel: 'LAFAYETTE ST, NEW YORK · EST. 1994',
    parentGroup: 'EssilorLuxottica / Supreme NY',
    campaignTitle: 'Seasonal Supreme Photo Tee & Box Logo Lookbook',
    faceOfDesignation: 'The Face of the Supreme Seasonal Photo Tee',
    vertical: 'streetwear',
    verticalLabel: 'Sneakers & Sportswear',
    tier: 3,
    minPopularity: 14,
    minHype: 26,
    minFlexScore: 0,
    signingBonus: 95_000,
    dailyRetainer: 1_100,
    durationDays: 60,
    shootDeliverableName: 'Soho, Shibuya & Dover Street Wheatpaste Poster Blitz',
    shootBonusPayout: 32_000,
    shootHypeGain: 5.0,
    shootCooldownDays: 12,
    terminationPenalty: 65_000,
    description:
      'Immortalize yourself wearing the iconic red Box Logo on Supreme’s legendary Photo Tee with Thursday morning lines around Soho, London, and Tokyo.',
    logoText: 'SUP',
    accentColor: '#EF4444',
    signatureProducts: [
      {
        id: 'supreme_photo_tee',
        name: 'Supreme Artist Portrait Photo Tee (FW Week 1 Drop)',
        categoryTag: 'WEEK 1 GRAIL DROP',
        retailPrice: 54,
        baseDailyUnits: 6_400,
        isFlagshipHero: true,
        description: 'All-cotton heavyweight Supreme tee featuring your Polaroid portrait wearing the red Box Logo.',
        visualType: 'couture_jacket',
        primaryHex: '#DC2626',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'supreme_bogo_hoodie',
        name: 'Supreme Cross Box Logo Heavyweight Crossgrain Hoodie',
        categoryTag: 'CULT ARCHIVE FLEECE',
        retailPrice: 168,
        baseDailyUnits: 2_900,
        description: 'Canadian heavyweight crossgrain fleece with iconic woven red Futura Box Logo chest patch.',
        visualType: 'couture_jacket',
        primaryHex: '#EF4444',
        secondaryHex: '#F4F4F5'
      },
      {
        id: 'supreme_af1_low',
        name: 'Supreme × Nike Air Force 1 Low Box Logo White/Red',
        categoryTag: 'SKATE & STREET STAPLE',
        retailPrice: 124,
        baseDailyUnits: 3_100,
        description: 'Full-grain leather AF1 stamped with the red Supreme Box Logo at the lateral heel.',
        visualType: 'sneaker_low',
        primaryHex: '#FFFFFF',
        secondaryHex: '#DC2626'
      }
    ]
  },

  // =========================================================================
  // 3. HAUTE HOROLOGY, HIGH JEWELRY & PRESTIGE BEAUTY
  // =========================================================================
  {
    id: 'brand_rolex',
    brandName: 'Rolex',
    heritageLabel: 'GENEVA, SWITZERLAND · EST. 1905',
    parentGroup: 'Hans Wilsdorf Foundation',
    campaignTitle: 'Perpetual Arts Initiative & Cosmograph Daytona Testimonee',
    faceOfDesignation: 'The Face of Rolex Oyster Perpetual & Cosmograph Daytona',
    vertical: 'horology_beauty',
    verticalLabel: 'Watches & High Jewelry',
    tier: 1,
    minPopularity: 72,
    minHype: 56,
    minFlexScore: 42,
    signingBonus: 1_950_000,
    dailyRetainer: 12_500,
    durationDays: 120,
    shootDeliverableName: 'Geneva Watches & Wonders Gala + Global Print Spread',
    shootBonusPayout: 440_000,
    shootHypeGain: 11.0,
    shootCooldownDays: 22,
    terminationPenalty: 1_350_000,
    description:
      'Become an official Rolex Testimonee with direct Geneva allocation to off-catalog Rainbow Daytonas, Platinum Day-Dates, and back-cover magazine spreads worldwide.',
    logoText: 'ROLEX',
    accentColor: '#10B981',
    signatureProducts: [
      {
        id: 'rolex_daytona_platinum',
        name: 'Rolex Oyster Perpetual Cosmograph Daytona in 950 Platinum',
        categoryTag: 'SWISS CHRONOGRAPH GRAIL',
        retailPrice: 79_300,
        baseDailyUnits: 18,
        isFlagshipHero: true,
        description: 'Ice-blue dial with chestnut brown Cerachrom tachymetric bezel and transparent sapphire caseback.',
        visualType: 'chrono_watch',
        primaryHex: '#10B981',
        secondaryHex: '#BAE6FD'
      },
      {
        id: 'rolex_daydate_40',
        name: 'Rolex Day-Date 40 "President" in 18ct Everose Gold',
        categoryTag: 'THE PRESIDENTS’ WATCH',
        retailPrice: 44_200,
        baseDailyUnits: 34,
        description: 'Fluted bezel, slate ombré dial with Roman numerals, and iconic three-piece President bracelet.',
        visualType: 'chrono_watch',
        primaryHex: '#D4AF37',
        secondaryHex: '#FDE68A'
      },
      {
        id: 'rolex_submariner_date',
        name: 'Rolex Submariner Date "Starbucks" Oystersteel & Cerachrom',
        categoryTag: 'DIVER’S REFERENCE ICON',
        retailPrice: 10_800,
        baseDailyUnits: 145,
        description: 'Unidirectional rotatable green Cerachrom bezel insert and luminescent Chromalight display.',
        visualType: 'chrono_watch',
        primaryHex: '#059669',
        secondaryHex: '#E4E4E7'
      }
    ]
  },
  {
    id: 'brand_tiffany_co',
    brandName: 'Tiffany & Co.',
    heritageLabel: '727 FIFTH AVENUE, NEW YORK · EST. 1837',
    parentGroup: 'LVMH Moët Hennessy',
    campaignTitle: 'The Landmark Fifth Avenue & Tiffany HardWear Global Campaign',
    faceOfDesignation: 'The Face of Tiffany HardWear & Jean Schlumberger High Jewelry',
    vertical: 'horology_beauty',
    verticalLabel: 'Watches & High Jewelry',
    tier: 1,
    minPopularity: 60,
    minHype: 52,
    minFlexScore: 30,
    signingBonus: 1_320_000,
    dailyRetainer: 8_800,
    durationDays: 120,
    shootDeliverableName: 'Fifth Avenue Landmark Gala & Blue Book High Jewelry Shoot',
    shootBonusPayout: 325_000,
    shootHypeGain: 9.5,
    shootCooldownDays: 20,
    terminationPenalty: 880_000,
    description:
      'Wear the legendary 128.54-carat Tiffany Diamond heritage in global campaigns alongside custom HardWear and Lock diamond suites.',
    logoText: 'T&CO',
    accentColor: '#2DD4BF',
    signatureProducts: [
      {
        id: 'tiffany_hardwear_pave',
        name: 'Tiffany HardWear Graduated Link Necklace in 18k Gold & Pavé Diamonds',
        categoryTag: 'NEW YORK HIGH JEWELRY',
        retailPrice: 62_000,
        baseDailyUnits: 22,
        isFlagshipHero: true,
        description: 'Industrial gauge links inspired by a 1962 New York archival bracelet set with over 10 carats of diamonds.',
        visualType: 'diamond_jewelry',
        primaryHex: '#2DD4BF',
        secondaryHex: '#FDE047'
      },
      {
        id: 'tiffany_lock_bangle',
        name: 'Tiffany Lock Full Pavé Diamond Bangle in 18k Rose Gold',
        categoryTag: 'SIGNATURE BRACELET',
        retailPrice: 38_000,
        baseDailyUnits: 36,
        description: 'Swiveling padlock clasp mechanism hand-set with round brilliant diamonds.',
        visualType: 'diamond_jewelry',
        primaryHex: '#81E6D9',
        secondaryHex: '#FDA4AF'
      },
      {
        id: 'tiffany_bird_on_rock',
        name: 'Jean Schlumberger by Tiffany "Bird on a Rock" Brooch',
        categoryTag: 'BLUE BOOK MASTERPIECE',
        retailPrice: 115_000,
        baseDailyUnits: 8,
        description: 'Diamond-encrusted platinum cockatoo perched atop a 50-carat cushion-cut aquamarine.',
        visualType: 'diamond_jewelry',
        primaryHex: '#0ABAB5',
        secondaryHex: '#E0F2FE'
      }
    ]
  },
  {
    id: 'brand_cartier',
    brandName: 'Cartier',
    heritageLabel: '13 RUE DE LA PAIX, PARIS · EST. 1847',
    parentGroup: 'Richemont Group',
    campaignTitle: 'Panthère de Cartier & Santos Global Maison Ambassador',
    faceOfDesignation: 'The Face of Cartier LOVE, Juste un Clou & Santos',
    vertical: 'horology_beauty',
    verticalLabel: 'Watches & High Jewelry',
    tier: 2,
    minPopularity: 48,
    minHype: 44,
    minFlexScore: 22,
    signingBonus: 820_000,
    dailyRetainer: 5_800,
    durationDays: 90,
    shootDeliverableName: 'Rue de la Paix Salon Shoot & Panthère Short Film',
    shootBonusPayout: 195_000,
    shootHypeGain: 7.8,
    shootCooldownDays: 17,
    terminationPenalty: 540_000,
    description:
      'Represent the "Jeweler of Kings and the King of Jewelers" in global campaigns for the Santos de Cartier, Crash, LOVE, and Juste un Clou collections.',
    logoText: 'CARTIER',
    accentColor: '#F43F5E',
    signatureProducts: [
      {
        id: 'cartier_santos_skeleton',
        name: 'Santos de Cartier Large Skeleton Watch in 18k Yellow Gold',
        categoryTag: 'PARISIAN WATCHMAKING',
        retailPrice: 34_800,
        baseDailyUnits: 38,
        isFlagshipHero: true,
        description: 'Roman numeral openworked mechanical movement with heptagonal sapphire crown.',
        visualType: 'chrono_watch',
        primaryHex: '#E11D48',
        secondaryHex: '#FACC15'
      },
      {
        id: 'cartier_love_bracelet',
        name: 'Cartier LOVE & Juste un Clou Diamond Wrist Stack',
        categoryTag: 'ICONIC RED BOX JEWELRY',
        retailPrice: 14_600,
        baseDailyUnits: 135,
        description: '18k gold oval screwdriver-locked LOVE bracelet paired with the nail-inspired Juste un Clou.',
        visualType: 'diamond_jewelry',
        primaryHex: '#F43F5E',
        secondaryHex: '#FDE047'
      },
      {
        id: 'cartier_panthere_ring',
        name: 'Panthère de Cartier Emerald-Eyed Onyx & Diamond Ring',
        categoryTag: 'MAISON EMBLEM',
        retailPrice: 29_400,
        baseDailyUnits: 29,
        description: 'Sculpted feline head set with pear-shaped tsavorite emeralds, onyx nose, and brilliant-cut diamonds.',
        visualType: 'diamond_jewelry',
        primaryHex: '#BE123C',
        secondaryHex: '#34D399'
      }
    ]
  },
  {
    id: 'brand_audemars_piguet',
    brandName: 'Audemars Piguet',
    heritageLabel: 'LE BRASSUS, VALLÉE DE JOUX · EST. 1875',
    parentGroup: 'Audemars Piguet Holding SA',
    campaignTitle: 'Royal Oak Concept Artist Collaboration Piece',
    faceOfDesignation: 'The Face of Audemars Piguet Royal Oak & Music Edition',
    vertical: 'horology_beauty',
    verticalLabel: 'Watches & High Jewelry',
    tier: 1,
    minPopularity: 66,
    minHype: 55,
    minFlexScore: 38,
    signingBonus: 1_580_000,
    dailyRetainer: 10_200,
    durationDays: 120,
    shootDeliverableName: 'Le Brassus Manufacture Reveal & Limited Watch Auction',
    shootBonusPayout: 380_000,
    shootHypeGain: 10.2,
    shootCooldownDays: 21,
    terminationPenalty: 1_050_000,
    description:
      'Co-design an ultra-limited Royal Oak Concept Tourbillon with the independent Swiss watchmakers of Le Brassus.',
    logoText: 'AP',
    accentColor: '#F59E0B',
    signatureProducts: [
      {
        id: 'ap_royal_oak_openworked',
        name: 'Artist × AP Royal Oak Double Balance Wheel Openworked Ceramic',
        categoryTag: 'HAUTE HORLOGERIE GRAIL',
        retailPrice: 145_000,
        baseDailyUnits: 9,
        isFlagshipHero: true,
        description: 'Hand-finished brown/black ceramic octagonal case with visible rose-gold double balance wheel.',
        visualType: 'chrono_watch',
        primaryHex: '#D97706',
        secondaryHex: '#FEF3C7'
      },
      {
        id: 'ap_royal_oak_jumbo',
        name: 'Audemars Piguet Royal Oak "Jumbo" Extra-Thin 16202',
        categoryTag: 'GÉRALD GENTA ICON',
        retailPrice: 74_500,
        baseDailyUnits: 16,
        description: 'Petite Tapisserie dial, octagonal bezel secured by 8 hexagonal gold screws, and integrated bracelet.',
        visualType: 'chrono_watch',
        primaryHex: '#F59E0B',
        secondaryHex: '#E4E4E7'
      },
      {
        id: 'ap_music_edition',
        name: 'Royal Oak Offshore Selfwinding Music Edition 37mm VU-Meter',
        categoryTag: 'STUDIO EQUALIZER DIAL',
        retailPrice: 43_600,
        baseDailyUnits: 24,
        description: 'Tapisserie dial set with gemstone VU-meter equalizer bars and knurled fader crown guards.',
        visualType: 'chrono_watch',
        primaryHex: '#38BDF8',
        secondaryHex: '#F43F5E'
      }
    ]
  },

  // =========================================================================
  // 4. CONSUMER TECH, AUDIO & GAMING
  // =========================================================================
  {
    id: 'brand_beats_apple',
    brandName: 'Apple & Beats by Dre',
    heritageLabel: 'CUPERTINO & CULVER CITY · EST. 2008',
    parentGroup: 'Apple Inc.',
    campaignTitle: 'Global Spatial Audio Keynote & Beats Studio Pro Custom Line',
    faceOfDesignation: 'The Face of Beats Studio Pro & Apple Music Spatial Audio',
    vertical: 'tech_audio',
    verticalLabel: 'Audio & Gaming',
    tier: 2,
    minPopularity: 38,
    minHype: 38,
    minFlexScore: 12,
    signingBonus: 480_000,
    dailyRetainer: 3_700,
    durationDays: 90,
    shootDeliverableName: 'Apple Park Keynote Premiere & Global TV Commercial',
    shootBonusPayout: 125_000,
    shootHypeGain: 6.8,
    shootCooldownDays: 15,
    terminationPenalty: 310_000,
    description:
      'Debut your unreleased single inside a worldwide Apple & Beats by Dre commercial and release a custom colorway Beats Studio Pro sold in every Apple Store.',
    logoText: 'BEATS',
    accentColor: '#F43F5E',
    signatureProducts: [
      {
        id: 'beats_studio_pro_collab',
        name: 'Artist × Beats Studio Pro Custom Metallic Edition',
        categoryTag: 'APPLE STORE FLAGSHIP AUDIO',
        retailPrice: 349,
        baseDailyUnits: 2_800,
        isFlagshipHero: true,
        description: 'Custom acoustic platform with Personalized Spatial Audio, USB-C lossless DAC, and artist colorway.',
        visualType: 'headphones_pro',
        primaryHex: '#E11D48',
        secondaryHex: '#F4F4F5'
      },
      {
        id: 'beats_pill_2026',
        name: 'Beats Pill Wireless Hi-Res Portable Speaker',
        categoryTag: 'LIFESTYLE AUDIO',
        retailPrice: 149,
        baseDailyUnits: 4_100,
        description: '20-degree upward-tilted racetrack woofer with 24-hour battery life and removable lanyard.',
        visualType: 'headphones_pro',
        primaryHex: '#FB7185',
        secondaryHex: '#FACC15'
      },
      {
        id: 'apple_airpods_max_usbc',
        name: 'Apple AirPods Max (Starlight / Midnight Studio Edition)',
        categoryTag: 'SPATIAL STUDIO REFERENCE',
        retailPrice: 549,
        baseDailyUnits: 1_950,
        description: 'Anodized aluminum cups with Apple H1 audio processing and pro-level Active Noise Cancellation.',
        visualType: 'headphones_pro',
        primaryHex: '#A1A1AA',
        secondaryHex: '#FFFFFF'
      }
    ]
  },
  {
    id: 'brand_playstation',
    brandName: 'Sony PlayStation',
    heritageLabel: 'TOKYO & SAN MATEO · EST. 1994',
    parentGroup: 'Sony Interactive Entertainment',
    campaignTitle: 'PlayStation 5 Pro Global Launch & Custom Console Bundle',
    faceOfDesignation: 'The Face of PlayStation 5 Pro & DualSense Edge',
    vertical: 'tech_audio',
    verticalLabel: 'Audio & Gaming',
    tier: 2,
    minPopularity: 32,
    minHype: 35,
    minFlexScore: 10,
    signingBonus: 380_000,
    dailyRetainer: 2_900,
    durationDays: 90,
    shootDeliverableName: 'State of Play Global Trailer & Custom PS5 Unboxing',
    shootBonusPayout: 95_000,
    shootHypeGain: 6.2,
    shootCooldownDays: 14,
    terminationPenalty: 250_000,
    description:
      'Headline Sony’s State of Play broadcast with a co-branded PlayStation 5 Pro console bundle and custom DualSense controller.',
    logoText: 'PS5',
    accentColor: '#3B82F6',
    signatureProducts: [
      {
        id: 'ps5_pro_artist_bundle',
        name: 'PlayStation 5 Pro 2TB Artist Limited Console Bundle',
        categoryTag: 'NEXT-GEN GAMING HARDWARE',
        retailPrice: 749,
        baseDailyUnits: 1_850,
        isFlagshipHero: true,
        description: 'Custom laser-etched console faceplates with PSSR ray-tracing GPU and digital soundtrack code.',
        visualType: 'console_hardware',
        primaryHex: '#2563EB',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'ps5_dualsense_edge',
        name: 'Artist × DualSense Edge Pro Wireless Controller',
        categoryTag: 'PRO ESPORTS CONTROLLER',
        retailPrice: 219,
        baseDailyUnits: 3_200,
        description: 'Swappable stick modules, back paddles, haptic triggers, and bespoke artist emblem touchpad.',
        visualType: 'console_hardware',
        primaryHex: '#3B82F6',
        secondaryHex: '#34D399'
      },
      {
        id: 'ps_pulse_elite_headset',
        name: 'PlayStation Pulse Elite Planar Magnetic Wireless Headset',
        categoryTag: 'LOSSLESS 3D AUDIO',
        retailPrice: 149,
        baseDailyUnits: 2_600,
        description: 'Studio-inspired planar magnetic drivers with PlayStation Link ultra-low latency audio.',
        visualType: 'headphones_pro',
        primaryHex: '#60A5FA',
        secondaryHex: '#09090B'
      }
    ]
  },

  // =========================================================================
  // 5. PRESTIGE SPIRITS, BEVERAGE & EXOTIC AUTO
  // =========================================================================
  {
    id: 'brand_dom_perignon',
    brandName: 'Dom Pérignon',
    heritageLabel: 'ABBAYE D’HAUTVILLERS, CHAMPAGNE · EST. 1668',
    parentGroup: 'LVMH Moët Hennessy',
    campaignTitle: 'Vintage Luminous Plénitude 2 Artistic Director',
    faceOfDesignation: 'The Face & Artistic Director of Dom Pérignon Vintage',
    vertical: 'beverage_lifestyle',
    verticalLabel: 'Spirits, Beverage & Auto',
    tier: 1,
    minPopularity: 54,
    minHype: 48,
    minFlexScore: 28,
    signingBonus: 1_050_000,
    dailyRetainer: 7_200,
    durationDays: 120,
    shootDeliverableName: 'Cannes & Monaco Yacht Club Luminous Bottle Launch',
    shootBonusPayout: 260_000,
    shootHypeGain: 8.6,
    shootCooldownDays: 18,
    terminationPenalty: 700_000,
    description:
      'Serve as Guest Artistic Director for Dom Pérignon Champagne, designing a custom glowing Luminous shield bottle served in every VIP club from Ibiza to Tokyo.',
    logoText: 'DOM',
    accentColor: '#D4AF37',
    signatureProducts: [
      {
        id: 'dom_perignon_luminous',
        name: 'Artist × Dom Pérignon Vintage Luminous Limited Shield 750ml',
        categoryTag: 'PRESTIGE CUVÉE CHAMPAGNE',
        retailPrice: 380,
        baseDailyUnits: 1_600,
        isFlagshipHero: true,
        description: 'Electroluminescent shield label designed by the artist housing 8-year cellar-aged Vintage Brut.',
        visualType: 'champagne_vintage',
        primaryHex: '#D4AF37',
        secondaryHex: '#10B981'
      },
      {
        id: 'dom_perignon_rose_p2',
        name: 'Dom Pérignon Plénitude 2 (P2) Vintage Rosé Coffret',
        categoryTag: 'RARE CELLAR RESERVE',
        retailPrice: 1_250,
        baseDailyUnits: 290,
        description: 'Nearly 20 years of maturation on the lees in the chalk cellars of Épernay.',
        visualType: 'champagne_vintage',
        primaryHex: '#FB7185',
        secondaryHex: '#FDE68A'
      },
      {
        id: 'dom_perignon_jeroboam',
        name: 'Dom Pérignon Methuselah 6L Metallic Gold VIP Parade Bottle',
        categoryTag: 'ULTRA-VIP NIGHTLIFE',
        retailPrice: 12_500,
        baseDailyUnits: 24,
        description: 'Hand-plated metallic gold 6-liter Methuselah bottle presented in an armored flight case.',
        visualType: 'champagne_vintage',
        primaryHex: '#FACC15',
        secondaryHex: '#FFFFFF'
      }
    ]
  },
  {
    id: 'brand_porsche',
    brandName: 'Porsche',
    heritageLabel: 'ZUFFENHAUSEN, STUTTGART · EST. 1931',
    parentGroup: 'Porsche AG',
    campaignTitle: 'Sonderwunsch Bespoke 911 GT3 RS & Global Brand Face',
    faceOfDesignation: 'The Face of Porsche 911 & Sonderwunsch Bespoke Program',
    vertical: 'beverage_lifestyle',
    verticalLabel: 'Spirits, Beverage & Auto',
    tier: 1,
    minPopularity: 65,
    minHype: 54,
    minFlexScore: 36,
    signingBonus: 1_600_000,
    dailyRetainer: 10_000,
    durationDays: 120,
    shootDeliverableName: 'Stuttgart Wind Tunnel Film & Art Basel 1-of-1 911 Reveal',
    shootBonusPayout: 370_000,
    shootHypeGain: 10.0,
    shootCooldownDays: 20,
    terminationPenalty: 1_050_000,
    description:
      'Collaborate with Porsche Exclusive Manufaktur in Stuttgart to unveil a bespoke 911 GT3 RS art car at Art Basel Miami alongside Porsche Design timepieces.',
    logoText: 'PORSCHE',
    accentColor: '#F59E0B',
    signatureProducts: [
      {
        id: 'porsche_911_sonderwunsch',
        name: 'Porsche 911 GT3 RS Sonderwunsch Artist Edition (Limited Allocation)',
        categoryTag: 'BESPOKE SUPERCAR CAPSULE',
        retailPrice: 315_000,
        baseDailyUnits: 3,
        isFlagshipHero: true,
        description: 'Naturally aspirated 9,000 RPM flat-six with Paint-to-Sample Chromaflair finish and custom Pepita cockpit.',
        visualType: 'supercar_collab',
        primaryHex: '#F59E0B',
        secondaryHex: '#E4E4E7'
      },
      {
        id: 'porsche_design_chrono_1',
        name: 'Porsche Design Chronograph 1 — All Black Titanium Edition',
        categoryTag: 'STUTTGART HOROLOGY',
        retailPrice: 9_650,
        baseDailyUnits: 48,
        description: 'COSC-certified flyback chronograph with 911 wheel-rim winding rotor in microbead-blasted titanium.',
        visualType: 'chrono_watch',
        primaryHex: '#D97706',
        secondaryHex: '#FFFFFF'
      },
      {
        id: 'porsche_carbon_luggage',
        name: 'Porsche Roadster Hardcase Carbon Fiber Weekender Trolley',
        categoryTag: 'PERFORMANCE TRAVEL',
        retailPrice: 2_450,
        baseDailyUnits: 165,
        description: 'Ultra-lightweight woven carbon shell with ball-bearing 911 Carrera-style silent wheels.',
        visualType: 'trunk_bag',
        primaryHex: '#71717A',
        secondaryHex: '#F59E0B'
      }
    ]
  },
  {
    id: 'brand_sprite_global',
    brandName: 'Sprite & Coca-Cola',
    heritageLabel: 'ATLANTA, GEORGIA · EST. 1961',
    parentGroup: 'The Coca-Cola Company',
    campaignTitle: 'Obey Your Thirst Global Summer Tour & QR Can Series',
    faceOfDesignation: 'The Face of Sprite "Obey Your Thirst" Global Music Series',
    vertical: 'beverage_lifestyle',
    verticalLabel: 'Spirits, Beverage & Auto',
    tier: 3,
    minPopularity: 16,
    minHype: 24,
    minFlexScore: 0,
    signingBonus: 135_000,
    dailyRetainer: 1_450,
    durationDays: 60,
    shootDeliverableName: 'NBA Halftime Commercial & Limited QR Can Rollout',
    shootBonusPayout: 42_000,
    shootHypeGain: 4.8,
    shootCooldownDays: 12,
    terminationPenalty: 85_000,
    description:
      'Put your face and lyrics on 50 million limited-edition Sprite cans worldwide with NBA broadcast commercials and summer festival stage sponsorships.',
    logoText: 'SPRITE',
    accentColor: '#10B981',
    signatureProducts: [
      {
        id: 'sprite_artist_can_12pk',
        name: 'Sprite × Artist Limited Edition Lyric QR Collector 12-Pack',
        categoryTag: 'GLOBAL MASS RETAIL',
        retailPrice: 9,
        baseDailyUnits: 38_000,
        isFlagshipHero: true,
        description: 'Collector aluminum cans printed with your portrait and QR code unlocking exclusive backstage stems.',
        visualType: 'beverage_can',
        primaryHex: '#10B981',
        secondaryHex: '#FACC15'
      },
      {
        id: 'sprite_chill_cherry_lime',
        name: 'Sprite Chill Cherry-Lime Tour Edition Tallboy Case',
        categoryTag: 'FESTIVAL REFRESHMENT',
        retailPrice: 14,
        baseDailyUnits: 21_500,
        description: 'Cooling sensation cherry-lime crisp lemon-lime soda sold at stadium concessions.',
        visualType: 'beverage_can',
        primaryHex: '#059669',
        secondaryHex: '#F43F5E'
      },
      {
        id: 'sprite_obey_varsity_crate',
        name: 'Obey Your Thirst VIP Press Cooler & Vinyl Crate',
        categoryTag: 'LIMITED MERCH PACK',
        retailPrice: 145,
        baseDailyUnits: 420,
        description: 'Insulated retro steel cooler bundled with translucent lemon-lime 7-inch vinyl single.',
        visualType: 'trunk_bag',
        primaryHex: '#10B981',
        secondaryHex: '#FFFFFF'
      }
    ]
  }
];

const BRAND_EXECUTIVE_BOARD_MAP: Record<
  string,
  { name: string; title: string }
> = {
  brand_louis_vuitton: {
    name: 'Pietro Beccari & Pharrell Williams',
    title: 'CEO & Men’s Creative Director, Louis Vuitton'
  },
  brand_chanel: {
    name: 'Leena Nair & Bruno Pavlovsky',
    title: 'Global CEO & President of Fashion, Chanel'
  },
  brand_dior: {
    name: 'Delphine Arnault & Kim Jones',
    title: 'Chairwoman & Artistic Director, Christian Dior'
  },
  brand_gucci: {
    name: 'Sabato De Sarno & Stefano Cantino',
    title: 'Creative Director & CEO, Gucci'
  },
  brand_prada: {
    name: 'Miuccia Prada & Raf Simons',
    title: 'Co-Creative Directors, Prada S.p.A.'
  },
  brand_balenciaga: {
    name: 'Demna & Gianfranco Gianangeli',
    title: 'Artistic Director & CEO, Balenciaga'
  },
  brand_saint_laurent: {
    name: 'Anthony Vaccarello & Francesca Bellettini',
    title: 'Creative Director & Maison President, Saint Laurent'
  },
  brand_nike_signature: {
    name: 'Elliott Hill & Phil Knight',
    title: 'President & Chairman Emeritus, NIKE, Inc.'
  },
  brand_jordan: {
    name: 'Michael Jordan & Sarah Mensah',
    title: 'Chairman & President, Jordan Brand'
  },
  brand_adidas_originals: {
    name: 'Bjørn Gulden',
    title: 'Chief Executive Officer, adidas AG'
  },
  brand_supreme_ny: {
    name: 'James Jebbia',
    title: 'Founder, Supreme New York'
  },
  brand_rolex: {
    name: 'Jean-Frédéric Dufour',
    title: 'Chief Executive Officer, Rolex SA Geneva'
  },
  brand_tiffany_co: {
    name: 'Anthony Ledru & Alexandre Arnault',
    title: 'CEO & Executive VP, Tiffany & Co.'
  },
  brand_cartier: {
    name: 'Louis Ferla',
    title: 'Chief Executive Officer, Cartier Paris'
  },
  brand_audemars_piguet: {
    name: 'Ilaria Resta',
    title: 'Chief Executive Officer, Audemars Piguet'
  },
  brand_beats_apple: {
    name: 'Eddy Cue & Dr. Dre',
    title: 'SVP Services at Apple & Co-Founder, Beats'
  },
  brand_playstation: {
    name: 'Hideaki Nishino',
    title: 'CEO, Sony Interactive Entertainment'
  },
  brand_dom_perignon: {
    name: 'Vincent Chaperon',
    title: 'Chef de Cave, Dom Pérignon Épernay'
  },
  brand_porsche: {
    name: 'Oliver Blume',
    title: 'Chairman of the Executive Board, Porsche AG'
  },
  brand_sprite_global: {
    name: 'James Quincey',
    title: 'Chairman & CEO, The Coca-Cola Company'
  }
};

export function getEnsuredBrandDealsState(state?: GameState): BrandDealsState {
  const existing = (state as any)?.brandDealsState as BrandDealsState | undefined;
  if (existing && existing.initialized) {
    return {
      ...existing,
      activeContracts: Array.isArray(existing.activeContracts)
        ? existing.activeContracts
        : [],
      incomingProposals: Array.isArray(existing.incomingProposals)
        ? existing.incomingProposals
        : [],
      completedContractIds: Array.isArray(existing.completedContractIds)
        ? existing.completedContractIds
        : [],
      brandAffinityByOfferId: existing.brandAffinityByOfferId || {},
      lastAutoPromotionMessage: existing.lastAutoPromotionMessage || null,
      totalEndorsementIncomeAllTime: Number(existing.totalEndorsementIncomeAllTime) || 0,
      dailyEndorsementIncomeToday: Number(existing.dailyEndorsementIncomeToday) || 0,
      dailyProductRoyaltiesToday: Number(existing.dailyProductRoyaltiesToday) || 0
    };
  }
  return {
    initialized: true,
    activeContracts: [],
    incomingProposals: [],
    completedContractIds: [],
    brandAffinityByOfferId: {},
    lastAutoPromotionMessage: null,
    totalEndorsementIncomeAllTime: 0,
    dailyEndorsementIncomeToday: 0,
    dailyProductRoyaltiesToday: 0
  };
}

/**
 * Computes negotiated financial terms & eligibility for a given BrandOfferDefinition,
 * AmbassadorRoleTierId, Contract Term (days), and Exclusivity setting.
 */
export function calculateNegotiatedBrandTerms(
  state: GameState,
  offer: BrandOfferDefinition,
  roleTierId: AmbassadorRoleTierId = 'brand_ambassador',
  durationDays: number = offer.durationDays,
  isExclusive: boolean = true
): {
  roleMeta: AmbassadorRoleTierMeta;
  roleDisplayTitle: string;
  reqPopularity: number;
  reqHype: number;
  reqFlex: number;
  reqAffinity: number;
  currentAffinity: number;
  signingBonus: number;
  dailyRetainer: number;
  shootBonusPayout: number;
  productRoyaltyPct: number;
  estimatedDailyProductRoyalty: number;
  totalGuaranteedValue: number;
  terminationPenalty: number;
} {
  const roleMeta = getAmbassadorRoleTierMeta(roleTierId);
  const brandState = getEnsuredBrandDealsState(state);
  const currentAffinity = brandState.brandAffinityByOfferId?.[offer.id] || 0;

  const reqPopularity = Math.min(96, offer.minPopularity + roleMeta.minPopularityOffset);
  const reqHype = Math.min(92, offer.minHype + roleMeta.minHypeOffset);
  const reqFlex = offer.minFlexScore > 0 ? offer.minFlexScore + roleMeta.minFlexOffset : roleMeta.minFlexOffset;

  const termLengthMult =
    durationDays >= 240 ? 1.25 : durationDays >= 120 ? 1.05 : 0.82;
  const exclusivityMult = isExclusive ? 1.25 : 0.78;

  const signingBonus = Math.round(
    offer.signingBonus *
      roleMeta.signingBonusMultiplier *
      termLengthMult *
      exclusivityMult
  );
  const dailyRetainer = Math.round(
    offer.dailyRetainer * roleMeta.retainerMultiplier * exclusivityMult
  );
  const shootBonusPayout = Math.round(
    offer.shootBonusPayout * roleMeta.shootPayoutMultiplier * exclusivityMult
  );
  const productRoyaltyPct = Number(
    (roleMeta.productRoyaltyPct * (isExclusive ? 1.15 : 0.85)).toFixed(1)
  );

  // Estimate daily product royalties based on the brand's 3 signature products & player's fanbase/popularity
  const popScale = 0.65 + (Number(state.popularity) || 20) / 85;
  const hypeScale = 0.75 + (Number(state.hype) || 25) / 110;
  let estimatedDailyProductRoyalty = 0;
  for (const prod of offer.signatureProducts) {
    const estUnits = Math.round(prod.baseDailyUnits * popScale * hypeScale);
    const grossSales = estUnits * prod.retailPrice;
    estimatedDailyProductRoyalty += Math.round(
      grossSales * (productRoyaltyPct / 100) * 0.085
    );
  }

  const totalGuaranteedValue =
    signingBonus +
    dailyRetainer * durationDays +
    estimatedDailyProductRoyalty * durationDays;
  const terminationPenalty = Math.round(signingBonus * 0.68);

  const roleDisplayTitle =
    roleTierId === 'face_of_brand'
      ? offer.faceOfDesignation
      : `${offer.brandName} ${roleMeta.title}`;

  return {
    roleMeta,
    roleDisplayTitle,
    reqPopularity,
    reqHype,
    reqFlex,
    reqAffinity: roleMeta.requiredAffinityForPromotion,
    currentAffinity,
    signingBonus,
    dailyRetainer,
    shootBonusPayout,
    productRoyaltyPct,
    estimatedDailyProductRoyalty,
    totalGuaranteedValue,
    terminationPenalty
  };
}

export function checkBrandOfferEligibility(
  state: GameState,
  offer: BrandOfferDefinition,
  roleTierId: AmbassadorRoleTierId = 'friend_of_house',
  isExclusive: boolean = true
): {
  eligible: boolean;
  alreadySignedThisBrand: boolean;
  conflictingBrandName: string | null;
  missingReasons: string[];
} {
  const brandState = getEnsuredBrandDealsState(state);
  const pop = Math.round(Number(state.popularity) || 0);
  const hype = Math.round(Number(state.hype) || 0);
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);

  const terms = calculateNegotiatedBrandTerms(
    state,
    offer,
    roleTierId,
    offer.durationDays,
    isExclusive
  );

  const alreadySignedThisBrand = brandState.activeContracts.some(
    c => c.offerId === offer.id
  );

  // Conflict occurs if an existing contract in the same vertical is Exclusive OR the new contract is Exclusive while another contract exists in that vertical
  const conflictingContract = brandState.activeContracts.find(
    c =>
      c.vertical === offer.vertical &&
      c.offerId !== offer.id &&
      (c.isExclusive !== false || isExclusive)
  );

  const missingReasons: string[] = [];
  if (pop < terms.reqPopularity) {
    missingReasons.push(`Requires ${terms.reqPopularity} Popularity (Current: ${pop})`);
  }
  if (hype < terms.reqHype) {
    missingReasons.push(`Requires ${terms.reqHype}% Hype (Current: ${hype}%)`);
  }
  if (flexScore < terms.reqFlex) {
    missingReasons.push(
      `Requires ${terms.reqFlex} Luxury Flex Score (Current: ${flexScore})`
    );
  }

  return {
    eligible:
      !alreadySignedThisBrand &&
      !conflictingContract &&
      missingReasons.length === 0,
    alreadySignedThisBrand,
    conflictingBrandName: conflictingContract ? conflictingContract.brandName : null,
    missingReasons
  };
}

export function signBrandContract(
  state: GameState,
  offerId: string,
  options?: {
    roleTierId?: AmbassadorRoleTierId;
    durationDays?: number;
    isExclusive?: boolean;
  }
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const offer = BRAND_OFFERS_CATALOG.find(o => o.id === offerId);
  if (!offer) {
    return {
      success: false,
      message: 'Brand offer not found.',
      updatedState: state
    };
  }

  const roleTierId = options?.roleTierId || 'brand_ambassador';
  const durationDays = options?.durationDays || offer.durationDays;
  const isExclusive = options?.isExclusive !== undefined ? options.isExclusive : true;

  const check = checkBrandOfferEligibility(state, offer, roleTierId, isExclusive);
  if (check.alreadySignedThisBrand) {
    return {
      success: false,
      message: `You already have an active ambassadorship contract with ${offer.brandName}.`,
      updatedState: state
    };
  }
  if (check.conflictingBrandName) {
    return {
      success: false,
      message: `Vertical Exclusivity Conflict: Your active deal with ${check.conflictingBrandName} blocks signing an exclusive ${offer.verticalLabel} deal.`,
      updatedState: state
    };
  }
  if (!check.eligible) {
    return {
      success: false,
      message: `Requirements not met for ${getAmbassadorRoleTierMeta(roleTierId).title}: ${check.missingReasons.join(' • ')}`,
      updatedState: state
    };
  }

  const terms = calculateNegotiatedBrandTerms(
    state,
    offer,
    roleTierId,
    durationDays,
    isExclusive
  );

  const brandState = getEnsuredBrandDealsState(state);
  const todayStr = (state.date || new Date().toISOString()).split('T')[0];

  const newContract: ActiveBrandContract = {
    offerId: offer.id,
    brandName: offer.brandName,
    heritageLabel: offer.heritageLabel,
    campaignTitle: offer.campaignTitle,
    faceOfDesignation: offer.faceOfDesignation,
    vertical: offer.vertical,
    verticalLabel: offer.verticalLabel,
    tier: offer.tier,
    roleTierId,
    roleTitle: terms.roleDisplayTitle,
    isExclusive,
    productRoyaltyPct: terms.productRoyaltyPct,
    brandAffinityXp: (brandState.brandAffinityByOfferId?.[offer.id] || 0) + 15,
    capsuleDropsLaunched: 0,
    daysSinceLastCapsuleDrop: 99,
    dailyProductUnitsSold: offer.signatureProducts.reduce(
      (sum, p) => sum + p.baseDailyUnits,
      0
    ),
    dailyProductRoyaltyEarned: terms.estimatedDailyProductRoyalty,
    totalProductRoyaltiesEarned: 0,
    signedDate: todayStr,
    daysRemaining: durationDays,
    totalDurationDays: durationDays,
    signingBonus: terms.signingBonus,
    dailyRetainer: terms.dailyRetainer,
    shootDeliverableName: offer.shootDeliverableName,
    shootBonusPayout: terms.shootBonusPayout,
    shootHypeGain: offer.shootHypeGain,
    shootCooldownDays: offer.shootCooldownDays,
    daysSinceLastShoot: offer.shootCooldownDays, // Ready for first campaign shoot immediately
    shootsCompleted: 0,
    terminationPenalty: terms.terminationPenalty,
    totalEarnedFromContract: terms.signingBonus
  };

  const nextAffinityMap = {
    ...(brandState.brandAffinityByOfferId || {}),
    [offer.id]: newContract.brandAffinityXp || 15
  };

  const nextBrandState: BrandDealsState = {
    ...brandState,
    activeContracts: [newContract, ...brandState.activeContracts],
    brandAffinityByOfferId: nextAffinityMap,
    totalEndorsementIncomeAllTime:
      (brandState.totalEndorsementIncomeAllTime || 0) + terms.signingBonus
  };

  const artistName = state.artist?.name || 'Artist';
  const likes = Math.round(
    46_000 +
      (Number(state.popularity) || 15) * 1_950 +
      terms.roleMeta.order * 18_000
  );
  const announcementPost: XPost = {
    id: `brand_sign_${offer.id}_${Date.now()}`,
    authorName: 'Pop Base',
    authorHandle: '@PopBase',
    authorAvatar: 'https://placehold.co/120x120/111827/38BDF8?text=PB',
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    content: `${artistName} has officially been unveiled as ${terms.roleDisplayTitle} for ${offer.brandName}'s "${offer.campaignTitle}" campaign.`,
    mediaBadge: terms.roleMeta.shortBadge,
    mediaTitle: `${artistName} × ${offer.brandName}`,
    mediaSubtitle: `${terms.roleDisplayTitle} · ${terms.productRoyaltyPct}% Product Royalties`,
    likes,
    reposts: Math.round(likes * 0.22),
    replies: Math.round(likes * 0.09),
    views: Math.round(likes * 16),
    timeAgo: 'Just now',
    dateCreated: todayStr
  };

  const hypeGain =
    (offer.tier === 1 ? 6.5 : offer.tier === 2 ? 4.2 : 2.5) +
    terms.roleMeta.order * 1.1;
  const updatedState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + terms.signingBonus,
    hype: Math.min(100, Number(((state.hype || 0) + hypeGain).toFixed(1))),
    xPosts: [announcementPost, ...(state.xPosts || [])].slice(0, 120),
    brandDealsState: nextBrandState
  } as any;

  return {
    success: true,
    message: `Appointed as ${terms.roleDisplayTitle}! Received $${terms.signingBonus.toLocaleString()} signing bonus, $${terms.dailyRetainer.toLocaleString()}/day retainer + ${terms.productRoyaltyPct}% global product royalty share.`,
    updatedState
  };
}

/**
 * Promotes an active brand contract to the next Ambassador Role Tier (e.g. Brand Ambassador -> House Ambassador -> Global Ambassador -> The Face of [Brand]).
 */
export function promoteBrandContractTier(
  state: GameState,
  offerId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const brandState = getEnsuredBrandDealsState(state);
  const contract = brandState.activeContracts.find(c => c.offerId === offerId);
  const offer = BRAND_OFFERS_CATALOG.find(o => o.id === offerId);
  if (!contract || !offer) {
    return {
      success: false,
      message: 'Active brand contract not found.',
      updatedState: state
    };
  }

  const currentRoleMeta = getAmbassadorRoleTierMeta(contract.roleTierId);
  const nextRoleMeta = AMBASSADOR_ROLE_TIERS.find(
    t => t.order === currentRoleMeta.order + 1
  );
  if (!nextRoleMeta) {
    return {
      success: false,
      message: `You have already reached the highest status at ${offer.brandName} (${contract.roleTitle})!`,
      updatedState: state
    };
  }

  const nextTerms = calculateNegotiatedBrandTerms(
    state,
    offer,
    nextRoleMeta.id,
    contract.totalDurationDays,
    contract.isExclusive !== false
  );

  const pop = Math.round(Number(state.popularity) || 0);
  const hype = Math.round(Number(state.hype) || 0);
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);
  const currentAffinity = contract.brandAffinityXp || 0;

  if (currentAffinity < nextRoleMeta.requiredAffinityForPromotion) {
    return {
      success: false,
      message: `Requires ${nextRoleMeta.requiredAffinityForPromotion} Maison Affinity XP to elevate to ${nextRoleMeta.title} (Current: ${currentAffinity} XP — complete campaign shoots or product capsule drops!).`,
      updatedState: state
    };
  }
  if (pop < nextTerms.reqPopularity || hype < nextTerms.reqHype || flexScore < nextTerms.reqFlex) {
    return {
      success: false,
      message: `Elevation to ${nextRoleMeta.title} requires ${nextTerms.reqPopularity} Pop, ${nextTerms.reqHype}% Hype, and ${nextTerms.reqFlex} Flex Score.`,
      updatedState: state
    };
  }

  const elevationBonus = Math.round(nextTerms.signingBonus * 0.45);
  const todayStr = (state.date || new Date().toISOString()).split('T')[0];

  const nextContracts = brandState.activeContracts.map(c => {
    if (c.offerId !== offerId) return c;
    return {
      ...c,
      roleTierId: nextRoleMeta.id,
      roleTitle: nextTerms.roleDisplayTitle,
      dailyRetainer: nextTerms.dailyRetainer,
      shootBonusPayout: nextTerms.shootBonusPayout,
      productRoyaltyPct: nextTerms.productRoyaltyPct,
      dailyProductRoyaltyEarned: nextTerms.estimatedDailyProductRoyalty,
      daysRemaining: Math.max(c.daysRemaining, 90),
      totalEarnedFromContract: c.totalEarnedFromContract + elevationBonus
    };
  });

  const artistName = state.artist?.name || 'Artist';
  const likes = Math.round(68_000 + pop * 2_400 + nextRoleMeta.order * 25_000);
  const promoPost: XPost = {
    id: `brand_elevate_${offer.id}_${Date.now()}`,
    authorName: 'Pop Base',
    authorHandle: '@PopBase',
    authorAvatar: 'https://placehold.co/120x120/111827/38BDF8?text=PB',
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    content: `${offer.brandName} has officially elevated ${artistName} to ${nextTerms.roleDisplayTitle} following record-breaking global campaign sales.`,
    mediaBadge: nextRoleMeta.shortBadge,
    mediaTitle: `${artistName} Elevated at ${offer.brandName}`,
    mediaSubtitle: `${nextTerms.roleDisplayTitle} · ${nextTerms.productRoyaltyPct}% Royalty Share`,
    likes,
    reposts: Math.round(likes * 0.24),
    replies: Math.round(likes * 0.1),
    views: Math.round(likes * 17),
    timeAgo: 'Just now',
    dateCreated: todayStr
  };

  const updatedState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + elevationBonus,
    hype: Math.min(100, Number(((state.hype || 0) + 6.5).toFixed(1))),
    popularity: Math.min(100, Number(((state.popularity || 0) + 0.8).toFixed(2))),
    xPosts: [promoPost, ...(state.xPosts || [])].slice(0, 120),
    brandDealsState: {
      ...brandState,
      activeContracts: nextContracts,
      totalEndorsementIncomeAllTime:
        (brandState.totalEndorsementIncomeAllTime || 0) + elevationBonus
    }
  } as any;

  return {
    success: true,
    message: `Elevated to ${nextTerms.roleDisplayTitle}! Earned $${elevationBonus.toLocaleString()} elevation bonus, $${nextTerms.dailyRetainer.toLocaleString()}/day retainer, and ${nextTerms.productRoyaltyPct}% product royalty share.`,
    updatedState
  };
}

/**
 * Launches a Co-Branded Signature Product Capsule Drop with an active brand partner.
 */
export function launchBrandSignatureCapsuleDrop(
  state: GameState,
  offerId: string,
  productId?: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const brandState = getEnsuredBrandDealsState(state);
  const contract = brandState.activeContracts.find(c => c.offerId === offerId);
  const offer = BRAND_OFFERS_CATALOG.find(o => o.id === offerId);
  if (!contract || !offer) {
    return {
      success: false,
      message: 'Sign an active contract with this brand first to launch a co-branded product capsule.',
      updatedState: state
    };
  }

  const daysSinceDrop = contract.daysSinceLastCapsuleDrop ?? 99;
  const dropCooldown = 21;
  if (daysSinceDrop < dropCooldown) {
    return {
      success: false,
      message: `Next co-branded product capsule drop for ${offer.brandName} will be ready in ${dropCooldown - daysSinceDrop} day(s).`,
      updatedState: state
    };
  }

  const targetProduct =
    offer.signatureProducts.find(p => p.id === productId) ||
    offer.signatureProducts[0];
  const royaltyPct = contract.productRoyaltyPct || 4.0;
  const pop = Number(state.popularity) || 25;
  const hype = Number(state.hype) || 30;

  const launchUnitsSold = Math.round(
    targetProduct.baseDailyUnits * (6.5 + pop / 18 + hype / 22)
  );
  const launchGrossSales = launchUnitsSold * targetProduct.retailPrice;
  const artistRoyaltyPayout = Math.max(
    25_000,
    Math.round(launchGrossSales * (royaltyPct / 100) * 0.22)
  );
  const affinityGain = 30;

  const nextAffinity = (contract.brandAffinityXp || 15) + affinityGain;
  const nextContracts = brandState.activeContracts.map(c => {
    if (c.offerId !== offerId) return c;
    return {
      ...c,
      brandAffinityXp: nextAffinity,
      capsuleDropsLaunched: (c.capsuleDropsLaunched || 0) + 1,
      daysSinceLastCapsuleDrop: 0,
      totalProductRoyaltiesEarned:
        (c.totalProductRoyaltiesEarned || 0) + artistRoyaltyPayout,
      totalEarnedFromContract: c.totalEarnedFromContract + artistRoyaltyPayout
    };
  });

  const todayStr = (state.date || new Date().toISOString()).split('T')[0];
  const artistName = state.artist?.name || 'Artist';
  const likes = Math.round(52_000 + pop * 2_100);
  const dropPost: XPost = {
    id: `brand_capsule_${offer.id}_${Date.now()}`,
    authorName: 'chart data',
    authorHandle: '@chartdata',
    authorAvatar: 'https://placehold.co/120x120/090D16/38BDF8?text=CD',
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    content: `${artistName} × ${offer.brandName}'s "${targetProduct.name}" collaborative drop sold ${launchUnitsSold.toLocaleString()} units on launch day ($${(launchGrossSales / 1_000_000).toFixed(2)}M gross retail).`,
    mediaBadge: 'COLLAB CAPSULE SOLD OUT',
    mediaTitle: `${artistName} × ${offer.brandName}`,
    mediaSubtitle: `${targetProduct.name} · $${targetProduct.retailPrice.toLocaleString()} Retail`,
    likes,
    reposts: Math.round(likes * 0.21),
    replies: Math.round(likes * 0.08),
    views: Math.round(likes * 15),
    timeAgo: 'Just now',
    dateCreated: todayStr
  };

  const updatedState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + artistRoyaltyPayout,
    hype: Math.min(100, Number(((state.hype || 0) + 5.5).toFixed(1))),
    xPosts: [dropPost, ...(state.xPosts || [])].slice(0, 120),
    brandDealsState: {
      ...brandState,
      activeContracts: nextContracts,
      brandAffinityByOfferId: {
        ...(brandState.brandAffinityByOfferId || {}),
        [offer.id]: nextAffinity
      },
      totalEndorsementIncomeAllTime:
        (brandState.totalEndorsementIncomeAllTime || 0) + artistRoyaltyPayout
    }
  } as any;

  return {
    success: true,
    message: `Sold ${launchUnitsSold.toLocaleString()} units of "${targetProduct.name}"! Earned $${artistRoyaltyPayout.toLocaleString()} in launch royalties (+${affinityGain} Maison Affinity XP).`,
    updatedState
  };
}

export function executeBrandCampaignDeliverable(
  state: GameState,
  offerId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const brandState = getEnsuredBrandDealsState(state);
  const contract = brandState.activeContracts.find(c => c.offerId === offerId);
  if (!contract) {
    return {
      success: false,
      message: 'Active brand contract not found.',
      updatedState: state
    };
  }

  if (contract.daysSinceLastShoot < contract.shootCooldownDays) {
    const waitDays = contract.shootCooldownDays - contract.daysSinceLastShoot;
    return {
      success: false,
      message: `Next campaign deliverable for ${contract.brandName} will be ready in ${waitDays} day(s).`,
      updatedState: state
    };
  }

  const affinityGain = 22;
  const nextAffinity = (contract.brandAffinityXp || 15) + affinityGain;

  const nextContracts = brandState.activeContracts.map(c => {
    if (c.offerId !== offerId) return c;
    return {
      ...c,
      brandAffinityXp: nextAffinity,
      daysSinceLastShoot: 0,
      shootsCompleted: c.shootsCompleted + 1,
      totalEarnedFromContract: c.totalEarnedFromContract + c.shootBonusPayout
    };
  });

  const nextBrandState: BrandDealsState = {
    ...brandState,
    activeContracts: nextContracts,
    brandAffinityByOfferId: {
      ...(brandState.brandAffinityByOfferId || {}),
      [offerId]: nextAffinity
    },
    totalEndorsementIncomeAllTime:
      (brandState.totalEndorsementIncomeAllTime || 0) + contract.shootBonusPayout
  };

  const updatedState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + contract.shootBonusPayout,
    hype: Math.min(100, Number(((state.hype || 0) + contract.shootHypeGain).toFixed(1))),
    popularity: Math.min(
      100,
      Number(((state.popularity || 0) + (contract.tier === 1 ? 0.6 : 0.35)).toFixed(2))
    ),
    brandDealsState: nextBrandState
  } as any;

  return {
    success: true,
    message: `Completed "${contract.shootDeliverableName}" for ${contract.brandName}! Earned $${contract.shootBonusPayout.toLocaleString()} campaign payout, +${contract.shootHypeGain}% Hype, and +${affinityGain} Maison Affinity XP.`,
    updatedState
  };
}

export function terminateBrandContractEarly(
  state: GameState,
  offerId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const brandState = getEnsuredBrandDealsState(state);
  const contract = brandState.activeContracts.find(c => c.offerId === offerId);
  if (!contract) {
    return { success: false, message: 'Contract not found.', updatedState: state };
  }

  const currentMoney = Number(state.money) || 0;
  if (currentMoney < contract.terminationPenalty) {
    return {
      success: false,
      message: `Breaking your contract with ${contract.brandName} requires a $${contract.terminationPenalty.toLocaleString()} buyout fee.`,
      updatedState: state
    };
  }

  const nextBrandState: BrandDealsState = {
    ...brandState,
    activeContracts: brandState.activeContracts.filter(c => c.offerId !== offerId)
  };

  const updatedState: GameState = {
    ...state,
    money: Math.max(0, currentMoney - contract.terminationPenalty),
    brandDealsState: nextBrandState
  } as any;

  return {
    success: true,
    message: `Bought out your ${contract.brandName} contract for $${contract.terminationPenalty.toLocaleString()}. The ${contract.verticalLabel} vertical is now open for new offers.`,
    updatedState
  };
}

/**
 * The Brand's Board of Directors determines which Ambassador Tier, Duration, and Exclusivity
 * to offer the player based on their current global stature and past Maison Affinity XP.
 */
export function determineBrandOfferedProposalForPlayer(
  state: GameState,
  offer: BrandOfferDefinition
): IncomingBrandProposal {
  const brandState = getEnsuredBrandDealsState(state);
  const pop = Math.round(Number(state.popularity) || 15);
  const hype = Math.round(Number(state.hype) || 20);
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);
  const affinity = brandState.brandAffinityByOfferId?.[offer.id] || 0;

  // Brand decides the starting tier based on past Maison Affinity & player's global impact stature:
  let offeredRoleTierId: AmbassadorRoleTierId = 'friend_of_house';
  if (
    affinity >= 115 &&
    pop >= offer.minPopularity + 38 &&
    hype >= offer.minHype + 28 &&
    flexScore >= offer.minFlexScore + 28
  ) {
    offeredRoleTierId = 'face_of_brand';
  } else if (
    affinity >= 75 &&
    pop >= offer.minPopularity + 26 &&
    hype >= offer.minHype + 20
  ) {
    offeredRoleTierId = 'global_ambassador';
  } else if (
    (affinity >= 40 || pop >= offer.minPopularity + 22) &&
    hype >= offer.minHype + 12
  ) {
    offeredRoleTierId = 'house_ambassador';
  } else if (
    affinity >= 15 ||
    (pop >= offer.minPopularity + 10 && hype >= offer.minHype + 6)
  ) {
    offeredRoleTierId = 'brand_ambassador';
  } else {
    offeredRoleTierId = 'friend_of_house';
  }

  // Brand also determines contract duration & whether they demand category exclusivity
  const offeredIsExclusive = offer.tier === 1 || offeredRoleTierId !== 'friend_of_house';
  const offeredDurationDays =
    offeredRoleTierId === 'face_of_brand' || offeredRoleTierId === 'global_ambassador'
      ? 180
      : offeredRoleTierId === 'house_ambassador'
      ? 120
      : 90;

  const terms = calculateNegotiatedBrandTerms(
    state,
    offer,
    offeredRoleTierId,
    offeredDurationDays,
    offeredIsExclusive
  );

  const exec = BRAND_EXECUTIVE_BOARD_MAP[offer.id] || {
    name: `${offer.brandName} Executive Board`,
    title: `Global Brand Directorate, ${offer.brandName}`
  };

  const artistName = state?.artist?.name || 'Artist';
  const offerLetterQuote =
    offeredRoleTierId === 'friend_of_house'
      ? `"We have been closely following ${artistName}'s cultural momentum. Our Maison invites you to join ${offer.brandName} as an official Friend of the House — prove your commercial impact and our Board will elevate you to full Ambassador status."`
      : offeredRoleTierId === 'brand_ambassador'
      ? `"${artistName}'s global streaming velocity and audience engagement align with ${offer.brandName}. We are pleased to extend an official Brand Ambassador contract with a ${terms.productRoyaltyPct}% royalty share."`
      : `"${artistName} has become an undeniable cultural force. Our Executive Board formally invites you to represent ${offer.brandName} as ${terms.roleDisplayTitle} for our global flagship campaign."`;

  return {
    id: `prop_${offer.id}`,
    offerId: offer.id,
    brandName: offer.brandName,
    heritageLabel: offer.heritageLabel,
    parentGroup: offer.parentGroup,
    vertical: offer.vertical,
    verticalLabel: offer.verticalLabel,
    offeredRoleTierId,
    offeredRoleTitle: terms.roleDisplayTitle,
    offeredDurationDays,
    offeredIsExclusive,
    signingBonus: terms.signingBonus,
    dailyRetainer: terms.dailyRetainer,
    shootBonusPayout: terms.shootBonusPayout,
    productRoyaltyPct: terms.productRoyaltyPct,
    estimatedDailyProductRoyalty: terms.estimatedDailyProductRoyalty,
    totalGuaranteedValue: terms.totalGuaranteedValue,
    terminationPenalty: terms.terminationPenalty,
    executiveName: exec.name,
    executiveTitle: exec.title,
    offerLetterQuote,
    expiresInDays: 14
  };
}

/**
 * Generates or refreshes the list of live Brand-Initiated Proposals in the player's Inbox.
 * Brands that the player qualifies for (plus accessible starter brands if the player is new)
 * proactively send offers with the tier decided by the Brand.
 */
export function getActiveIncomingBrandProposals(
  state: GameState
): IncomingBrandProposal[] {
  const brandState = getEnsuredBrandDealsState(state);
  const signedIds = new Set(brandState.activeContracts.map(c => c.offerId));
  const pop = Math.round(Number(state?.popularity) || 12);
  const hype = Math.round(Number(state?.hype) || 20);
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);

  // If state already has stored incomingProposals that aren't signed yet, refresh their calculated numbers
  const existingStored = (brandState.incomingProposals || []).filter(
    p => !signedIds.has(p.offerId) && p.expiresInDays > 0
  );

  if (existingStored.length > 0) {
    return existingStored.map(p => {
      const offer = BRAND_OFFERS_CATALOG.find(o => o.id === p.offerId);
      if (!offer) return p;
      const refreshed = determineBrandOfferedProposalForPlayer(state, offer);
      return {
        ...refreshed,
        expiresInDays: p.expiresInDays
      };
    });
  }

  // Otherwise, Brands evaluate the player and send initial proposals
  const qualifiedOffers = BRAND_OFFERS_CATALOG.filter(offer => {
    if (signedIds.has(offer.id)) return false;
    return (
      pop >= offer.minPopularity &&
      hype >= offer.minHype &&
      flexScore >= offer.minFlexScore
    );
  });

  // Always ensure at least 3 starter brands send a "Friend of the House" invitation even early in career
  const pool =
    qualifiedOffers.length >= 3
      ? qualifiedOffers.slice(0, 6)
      : [
          ...qualifiedOffers,
          ...BRAND_OFFERS_CATALOG.filter(
            o => !signedIds.has(o.id) && !qualifiedOffers.some(q => q.id === o.id)
          )
            .sort((a, b) => a.minPopularity - b.minPopularity)
            .slice(0, Math.max(0, 3 - qualifiedOffers.length))
        ];

  return pool.map(offer => determineBrandOfferedProposalForPlayer(state, offer));
}

/**
 * Accepts an Incoming Brand Proposal (where the Brand decided the Tier, Duration, and Exclusivity).
 */
export function acceptIncomingBrandProposal(
  state: GameState,
  offerId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const offer = BRAND_OFFERS_CATALOG.find(o => o.id === offerId);
  if (!offer) {
    return { success: false, message: 'Brand offer not found.', updatedState: state };
  }

  const brandState = getEnsuredBrandDealsState(state);
  if (brandState.activeContracts.some(c => c.offerId === offerId)) {
    return {
      success: false,
      message: `You already have an active contract with ${offer.brandName}.`,
      updatedState: state
    };
  }

  const proposal = determineBrandOfferedProposalForPlayer(state, offer);

  // Check vertical exclusivity conflict
  const conflictingContract = brandState.activeContracts.find(
    c =>
      c.vertical === offer.vertical &&
      c.offerId !== offer.id &&
      (c.isExclusive !== false || proposal.offeredIsExclusive)
  );
  if (conflictingContract) {
    return {
      success: false,
      message: `Vertical Exclusivity Conflict: Your active deal with ${conflictingContract.brandName} blocks signing ${offer.brandName}'s ${offer.verticalLabel} offer.`,
      updatedState: state
    };
  }

  const todayStr = (state.date || new Date().toISOString()).split('T')[0];
  const initialAffinity = (brandState.brandAffinityByOfferId?.[offer.id] || 0) + 15;

  const newContract: ActiveBrandContract = {
    offerId: offer.id,
    brandName: offer.brandName,
    heritageLabel: offer.heritageLabel,
    campaignTitle: offer.campaignTitle,
    faceOfDesignation: offer.faceOfDesignation,
    vertical: offer.vertical,
    verticalLabel: offer.verticalLabel,
    tier: offer.tier,
    roleTierId: proposal.offeredRoleTierId,
    roleTitle: proposal.offeredRoleTitle,
    isExclusive: proposal.offeredIsExclusive,
    productRoyaltyPct: proposal.productRoyaltyPct,
    brandAffinityXp: initialAffinity,
    capsuleDropsLaunched: 0,
    daysSinceLastCapsuleDrop: 99,
    dailyProductUnitsSold: offer.signatureProducts.reduce(
      (sum, p) => sum + p.baseDailyUnits,
      0
    ),
    dailyProductRoyaltyEarned: proposal.estimatedDailyProductRoyalty,
    totalProductRoyaltiesEarned: 0,
    signedDate: todayStr,
    daysRemaining: proposal.offeredDurationDays,
    totalDurationDays: proposal.offeredDurationDays,
    signingBonus: proposal.signingBonus,
    dailyRetainer: proposal.dailyRetainer,
    shootDeliverableName: offer.shootDeliverableName,
    shootBonusPayout: proposal.shootBonusPayout,
    shootHypeGain: offer.shootHypeGain,
    shootCooldownDays: offer.shootCooldownDays,
    daysSinceLastShoot: offer.shootCooldownDays,
    shootsCompleted: 0,
    terminationPenalty: proposal.terminationPenalty,
    totalEarnedFromContract: proposal.signingBonus
  };

  const roleMeta = getAmbassadorRoleTierMeta(proposal.offeredRoleTierId);
  const artistName = state.artist?.name || 'Artist';
  const likes = Math.round(
    46_000 + (Number(state.popularity) || 15) * 1_950 + roleMeta.order * 18_000
  );

  const announcementPost: XPost = {
    id: `brand_sign_${offer.id}_${Date.now()}`,
    authorName: 'Pop Base',
    authorHandle: '@PopBase',
    authorAvatar: 'https://placehold.co/120x120/111827/38BDF8?text=PB',
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    content: `${offer.brandName} has officially appointed ${artistName} as ${proposal.offeredRoleTitle} for their "${offer.campaignTitle}" campaign.`,
    mediaBadge: roleMeta.shortBadge,
    mediaTitle: `${artistName} × ${offer.brandName}`,
    mediaSubtitle: `${proposal.offeredRoleTitle} · ${proposal.productRoyaltyPct}% Product Royalties`,
    likes,
    reposts: Math.round(likes * 0.22),
    replies: Math.round(likes * 0.09),
    views: Math.round(likes * 16),
    timeAgo: 'Just now',
    dateCreated: todayStr
  };

  const remainingProposals = getActiveIncomingBrandProposals(state).filter(
    p => p.offerId !== offer.id
  );

  const hypeGain =
    (offer.tier === 1 ? 6.5 : offer.tier === 2 ? 4.2 : 2.5) + roleMeta.order * 1.1;

  const updatedState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + proposal.signingBonus,
    hype: Math.min(100, Number(((state.hype || 0) + hypeGain).toFixed(1))),
    xPosts: [announcementPost, ...(state.xPosts || [])].slice(0, 120),
    brandDealsState: {
      ...brandState,
      activeContracts: [newContract, ...brandState.activeContracts],
      incomingProposals: remainingProposals,
      brandAffinityByOfferId: {
        ...(brandState.brandAffinityByOfferId || {}),
        [offer.id]: initialAffinity
      },
      totalEndorsementIncomeAllTime:
        (brandState.totalEndorsementIncomeAllTime || 0) + proposal.signingBonus
    }
  } as any;

  return {
    success: true,
    message: `${offer.brandName} appointed you as ${proposal.offeredRoleTitle}! Received $${proposal.signingBonus.toLocaleString()} signing bonus + $${proposal.dailyRetainer.toLocaleString()}/day retainer. Your tier will automatically rise as your Brand Impact grows!`,
    updatedState
  };
}

/**
 * Declines an incoming brand offer so another Maison can approach the player.
 */
export function declineIncomingBrandProposal(
  state: GameState,
  offerId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const brandState = getEnsuredBrandDealsState(state);
  const currentProposals = getActiveIncomingBrandProposals(state);
  const remaining = currentProposals.filter(p => p.offerId !== offerId);

  return {
    success: true,
    message: 'Declined proposal. Your management team notified the Maison.',
    updatedState: {
      ...state,
      brandDealsState: {
        ...brandState,
        incomingProposals: remaining
      }
    } as any
  };
}

/**
 * Allows the player's PR / Management team to send a Lookbook Pitch to a specific Maison.
 * If the player meets the Maison's baseline stature, the Brand Board sends an official Proposal to their Inbox!
 */
export function pitchBrandForProposal(
  state: GameState,
  offerId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const offer = BRAND_OFFERS_CATALOG.find(o => o.id === offerId);
  if (!offer) {
    return { success: false, message: 'Maison not found.', updatedState: state };
  }

  const brandState = getEnsuredBrandDealsState(state);
  if (brandState.activeContracts.some(c => c.offerId === offerId)) {
    return {
      success: false,
      message: `You are already partnered with ${offer.brandName}.`,
      updatedState: state
    };
  }

  const currentProposals = getActiveIncomingBrandProposals(state);
  if (currentProposals.some(p => p.offerId === offerId)) {
    return {
      success: false,
      message: `${offer.brandName} has already sent a contract proposal to your Offers Inbox!`,
      updatedState: state
    };
  }

  const pop = Math.round(Number(state.popularity) || 0);
  const hype = Math.round(Number(state.hype) || 0);
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);

  const missing: string[] = [];
  if (pop < offer.minPopularity) {
    missing.push(`${offer.minPopularity} Popularity (You: ${pop})`);
  }
  if (hype < offer.minHype) {
    missing.push(`${offer.minHype}% Hype (You: ${hype}%)`);
  }
  if (flexScore < offer.minFlexScore) {
    missing.push(`${offer.minFlexScore} Flex Score (You: ${flexScore})`);
  }

  if (missing.length > 0) {
    return {
      success: false,
      message: `${offer.brandName}'s Executive Board declined to send an offer yet — Requires: ${missing.join(' • ')}`,
      updatedState: state
    };
  }

  const newProposal = determineBrandOfferedProposalForPlayer(state, offer);
  return {
    success: true,
    message: `${offer.brandName}'s Board of Directors reviewed your cultural impact and sent an official "${newProposal.offeredRoleTitle}" contract offer to your Inbox!`,
    updatedState: {
      ...state,
      brandDealsState: {
        ...brandState,
        incomingProposals: [newProposal, ...currentProposals]
      }
    } as any
  };
}

/**
 * Processes daily brand ambassadorship retainers, daily signature product sales & royalties,
 * AUTOMATIC Brand Board Tier Elevations based on Player Impact, and incoming brand proposals.
 */
export function processDailyBrandDealsStep(state: GameState): {
  updatedBrandDealsState: BrandDealsState;
  dailyEndorsementPayout: number;
  expiredBrandNames: string[];
} {
  const brandState = getEnsuredBrandDealsState(state);
  const signedIds = new Set(brandState.activeContracts.map(c => c.offerId));

  // Advance and replenish Incoming Brand Proposals
  const pop = Math.round(Number(state.popularity) || 15);
  const hype = Math.round(Number(state.hype) || 20);
  const { flexScore } = calculateLuxuryPortfolioMetrics(state);

  let nextProposals = getActiveIncomingBrandProposals(state)
    .map(p => ({ ...p, expiresInDays: p.expiresInDays - 1 }))
    .filter(p => p.expiresInDays > 0 && !signedIds.has(p.offerId));

  // Brands proactively approach the player when they qualify and have fewer than 5 inbox offers
  if (nextProposals.length < 5) {
    const candidates = BRAND_OFFERS_CATALOG.filter(
      o =>
        !signedIds.has(o.id) &&
        !nextProposals.some(p => p.offerId === o.id) &&
        pop >= o.minPopularity &&
        hype >= o.minHype &&
        flexScore >= o.minFlexScore
    );
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      nextProposals = [
        determineBrandOfferedProposalForPlayer(state, picked),
        ...nextProposals
      ].slice(0, 6);
    }
  }

  if (brandState.activeContracts.length === 0) {
    return {
      updatedBrandDealsState: {
        ...brandState,
        incomingProposals: nextProposals,
        dailyEndorsementIncomeToday: 0,
        dailyProductRoyaltiesToday: 0
      },
      dailyEndorsementPayout: 0,
      expiredBrandNames: []
    };
  }

  let dailyEndorsementPayout = 0;
  let dailyProductRoyaltiesToday = 0;
  let lastAutoPromotionMessage = brandState.lastAutoPromotionMessage || null;
  const expiredBrandNames: string[] = [];
  const remainingContracts: ActiveBrandContract[] = [];
  const newlyCompletedIds = [...(brandState.completedContractIds || [])];
  const nextAffinityMap = { ...(brandState.brandAffinityByOfferId || {}) };

  const popScale = 0.65 + (Number(state.popularity) || 20) / 85;
  const hypeScale = 0.75 + (Number(state.hype) || 25) / 110;

  brandState.activeContracts.forEach(c => {
    const offer = BRAND_OFFERS_CATALOG.find(o => o.id === c.offerId);
    let currentRoleTierId: AmbassadorRoleTierId =
      c.roleTierId || 'brand_ambassador';
    let currentRoleTitle = c.roleTitle || `${c.brandName} Ambassador`;
    let currentRetainer = c.dailyRetainer;
    let currentShootPayout = c.shootBonusPayout;
    let currentRoyaltyPct = c.productRoyaltyPct ?? 4.0;
    let currentDaysRemaining = c.daysRemaining - 1;
    let autoPromotionBonusToday = 0;

    let contractUnitsToday = 0;
    let contractProductRoyaltyToday = 0;

    if (offer) {
      for (const prod of offer.signatureProducts) {
        const units = Math.max(
          1,
          Math.round(
            prod.baseDailyUnits * popScale * hypeScale * (0.9 + Math.random() * 0.22)
          )
        );
        contractUnitsToday += units;
        const grossSales = units * prod.retailPrice;
        contractProductRoyaltyToday += Math.round(
          grossSales * (currentRoyaltyPct / 100) * 0.085
        );
      }
    } else {
      contractProductRoyaltyToday = c.dailyProductRoyaltyEarned || 0;
    }

    // Daily Impact & Affinity XP gain (scales with player popularity & hype impact)
    const dailyImpactXpGain =
      1.5 + (pop >= 50 ? 1.0 : 0.4) + (hype >= 55 ? 0.8 : 0.3);
    const nextAffinity = Number(
      ((c.brandAffinityXp || 15) + dailyImpactXpGain).toFixed(1)
    );
    nextAffinityMap[c.offerId] = nextAffinity;

    // Automatic Brand Board Tier Evaluation: if Player Impact / Affinity XP reaches next tier's threshold, the Brand automatically promotes the player!
    if (offer && currentDaysRemaining > 0) {
      const currentMeta = getAmbassadorRoleTierMeta(currentRoleTierId);
      const nextMeta = AMBASSADOR_ROLE_TIERS.find(
        t => t.order === currentMeta.order + 1
      );
      if (
        nextMeta &&
        nextAffinity >= nextMeta.requiredAffinityForPromotion
      ) {
        const nextTerms = calculateNegotiatedBrandTerms(
          state,
          offer,
          nextMeta.id,
          c.totalDurationDays,
          c.isExclusive !== false
        );
        currentRoleTierId = nextMeta.id;
        currentRoleTitle = nextTerms.roleDisplayTitle;
        currentRetainer = nextTerms.dailyRetainer;
        currentShootPayout = nextTerms.shootBonusPayout;
        currentRoyaltyPct = nextTerms.productRoyaltyPct;
        currentDaysRemaining = Math.max(currentDaysRemaining, 90);
        autoPromotionBonusToday = Math.round(nextTerms.signingBonus * 0.35);
        lastAutoPromotionMessage = `${offer.brandName} automatically promoted you to ${currentRoleTitle} (+$${autoPromotionBonusToday.toLocaleString()} bonus, ${currentRoyaltyPct}% royalties)!`;
      }
    }

    const totalDailyFromContract =
      currentRetainer + contractProductRoyaltyToday + autoPromotionBonusToday;
    dailyEndorsementPayout += totalDailyFromContract;
    dailyProductRoyaltiesToday += contractProductRoyaltyToday;

    const updatedContract: ActiveBrandContract = {
      ...c,
      roleTierId: currentRoleTierId,
      roleTitle: currentRoleTitle,
      dailyRetainer: currentRetainer,
      shootBonusPayout: currentShootPayout,
      productRoyaltyPct: currentRoyaltyPct,
      brandAffinityXp: nextAffinity,
      daysRemaining: currentDaysRemaining,
      daysSinceLastShoot: c.daysSinceLastShoot + 1,
      daysSinceLastCapsuleDrop: (c.daysSinceLastCapsuleDrop ?? 99) + 1,
      dailyProductUnitsSold: contractUnitsToday,
      dailyProductRoyaltyEarned: contractProductRoyaltyToday,
      totalProductRoyaltiesEarned:
        (c.totalProductRoyaltiesEarned || 0) + contractProductRoyaltyToday,
      totalEarnedFromContract: c.totalEarnedFromContract + totalDailyFromContract
    };

    if (currentDaysRemaining <= 0) {
      expiredBrandNames.push(c.brandName);
      if (!newlyCompletedIds.includes(c.offerId)) {
        newlyCompletedIds.push(c.offerId);
      }
    } else {
      remainingContracts.push(updatedContract);
    }
  });

  return {
    updatedBrandDealsState: {
      ...brandState,
      activeContracts: remainingContracts,
      incomingProposals: nextProposals,
      completedContractIds: newlyCompletedIds,
      brandAffinityByOfferId: nextAffinityMap,
      lastAutoPromotionMessage,
      totalEndorsementIncomeAllTime:
        (brandState.totalEndorsementIncomeAllTime || 0) + dailyEndorsementPayout,
      dailyEndorsementIncomeToday: dailyEndorsementPayout,
      dailyProductRoyaltiesToday
    },
    dailyEndorsementPayout,
    expiredBrandNames
  };
}

