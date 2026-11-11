import type { GameState } from '../types';
import type { XPost } from './xSocialEngine';

export type LuxuryAssetCategory =
  | 'real_estate'
  | 'supercars'
  | 'aviation_marine'
  | 'jewelry_horology';

export interface LuxuryAssetItem {
  id: string;
  name: string;
  subtitle: string;
  category: LuxuryAssetCategory;
  categoryLabel: string;
  price: number;
  dailyUpkeep: number;
  instantHypeBoost: number;
  dailyHypeFloorBonus: number;
  flexPoints: number;
  minPopularityReq: number;
  locationOrSpec: string;
  description: string;
  image: string;
  svgIllustration: string;
  icon: string;
  specs: { label: string; value: string }[];
}

export interface OwnedLuxuryAssetRecord {
  assetId: string;
  purchasedDate: string;
  pricePaid: number;
}

export interface LuxuryAssetsState {
  initialized: boolean;
  ownedAssets: OwnedLuxuryAssetRecord[];
  totalSpentAllTime: number;
  totalUpkeepPaidAllTime: number;
  lastUpkeepPaidToday: number;
}

export const LUXURY_ASSET_CATEGORIES: {
  id: LuxuryAssetCategory | 'all';
  label: string;
  shortLabel: string;
  icon: string;
}[] = [
  { id: 'all', label: 'All Assets', shortLabel: 'All', icon: 'ph-crown' },
  { id: 'real_estate', label: 'Mansions & Estates', shortLabel: 'Estates', icon: 'ph-house-line' },
  { id: 'supercars', label: 'Exotic Garage', shortLabel: 'Supercars', icon: 'ph-steering-wheel' },
  { id: 'aviation_marine', label: 'Jets & Yachts', shortLabel: 'Jets & Yachts', icon: 'ph-airplane-tilt' },
  { id: 'jewelry_horology', label: 'Chains & Watches', shortLabel: 'Horology', icon: 'ph-watch' }
];

/**
 * Generates a bespoke, item-specific vector illustration for each of the 15 luxury assets
 * so every asset has a distinct, recognizable visual depiction.
 */
function buildDetailedLuxurySvgDataUri(
  assetId: string,
  title: string,
  subtitle: string,
  bgHex: string,
  accentHex: string
): string {
  const safeTitle = title.replace(/&/g, '&amp;');
  const safeSub = subtitle.replace(/&/g, '&amp;');
  let illustration = '';

  switch (assetId) {
    case 'estate_hollywood_hills':
      illustration = `
        <!-- LA Twilight Sky & City Lights -->
        <rect x="0" y="210" width="600" height="30" fill="#0F172A" opacity="0.7"/>
        <circle cx="460" cy="70" r="38" fill="#38BDF8" opacity="0.16"/>
        <!-- Cantilevered Modern Glass Villa -->
        <rect x="70" y="75" width="320" height="58" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
        <rect x="85" y="83" width="85" height="42" fill="#FEF08A" opacity="0.65"/>
        <rect x="180" y="83" width="95" height="42" fill="#FDE047" opacity="0.55"/>
        <rect x="285" y="83" width="90" height="42" fill="#FEF08A" opacity="0.7"/>
        <!-- Lower Cantilever & Terrace -->
        <rect x="110" y="133" width="350" height="55" fill="#0F172A" stroke="#94A3B8" stroke-width="1.8"/>
        <rect x="135" y="141" width="130" height="39" fill="#FACC15" opacity="0.45"/>
        <rect x="280" y="141" width="150" height="39" fill="#38BDF8" opacity="0.35"/>
        <!-- Glowing Infinity Pool -->
        <polygon points="180,192 520,192 560,248 120,248" fill="#0284C7" fill-opacity="0.75" stroke="#7DD3FC" stroke-width="2"/>
        <line x1="210" y1="215" x2="490" y2="215" stroke="#BAE6FD" stroke-width="1.5" stroke-opacity="0.6"/>
      `;
      break;

    case 'estate_tribeca_penthouse':
      illustration = `
        <!-- Manhattan Skyline Silhouette -->
        <rect x="60" y="95" width="55" height="150" fill="#18181B" stroke="#3F3F46" stroke-width="1"/>
        <rect x="125" y="70" width="65" height="175" fill="#18181B" stroke="#52525B" stroke-width="1"/>
        <rect x="420" y="80" width="70" height="165" fill="#18181B" stroke="#3F3F46" stroke-width="1"/>
        <!-- Triplex Glass Penthouse Tower -->
        <rect x="205" y="42" width="195" height="203" rx="6" fill="#09090B" stroke="#F59E0B" stroke-width="2.5"/>
        <rect x="220" y="56" width="165" height="42" fill="#FEF3C7" opacity="0.65"/>
        <rect x="220" y="108" width="165" height="42" fill="#FDE68A" opacity="0.5"/>
        <rect x="220" y="160" width="165" height="42" fill="#F59E0B" opacity="0.4"/>
        <!-- Rooftop Pergola & Terrace -->
        <line x1="195" y1="42" x2="410" y2="42" stroke="#FBBF24" stroke-width="4"/>
      `;
      break;

    case 'estate_bel_air_compound':
      illustration = `
        <!-- Limestone Compound Wings -->
        <rect x="55" y="115" width="140" height="95" fill="#064E3B" stroke="#34D399" stroke-width="1.8"/>
        <rect x="405" y="115" width="140" height="95" fill="#064E3B" stroke="#34D399" stroke-width="1.8"/>
        <!-- Central Double-Height Pavilion -->
        <rect x="180" y="78" width="240" height="132" fill="#022C22" stroke="#10B981" stroke-width="2.5"/>
        <rect x="202" y="95" width="196" height="52" fill="#A7F3D0" opacity="0.45"/>
        <rect x="202" y="155" width="196" height="45" fill="#6EE7B7" opacity="0.35"/>
        <!-- Olympic Lap Pool & Palm Symmetric Court -->
        <polygon points="150,215 450,215 495,255 105,255" fill="#059669" fill-opacity="0.6" stroke="#6EE7B7" stroke-width="2"/>
      `;
      break;

    case 'estate_lake_como_palazzo':
      illustration = `
        <!-- Como Mountain Backdrop -->
        <polygon points="0,190 140,65 310,190" fill="#1C1917" opacity="0.8"/>
        <polygon points="240,190 430,55 600,190" fill="#292524" opacity="0.8"/>
        <!-- Classical Italian Renaissance Palazzo -->
        <rect x="145" y="95" width="310" height="102" fill="#451A03" stroke="#D4AF37" stroke-width="2.5"/>
        <polygon points="135,95 300,52 465,95" fill="#78350F" stroke="#FBBF24" stroke-width="2"/>
        <!-- Arched Windows -->
        <rect x="175" y="115" width="28" height="42" rx="14" fill="#FDE68A" opacity="0.75"/>
        <rect x="225" y="115" width="28" height="42" rx="14" fill="#FDE68A" opacity="0.75"/>
        <rect x="286" y="110" width="28" height="52" rx="14" fill="#FEF08A" opacity="0.9"/>
        <rect x="345" y="115" width="28" height="42" rx="14" fill="#FDE68A" opacity="0.75"/>
        <rect x="395" y="115" width="28" height="42" rx="14" fill="#FDE68A" opacity="0.75"/>
        <!-- Lake Como Water Reflections -->
        <rect x="60" y="202" width="480" height="48" rx="8" fill="#0369A1" fill-opacity="0.55" stroke="#D4AF37" stroke-width="1.5"/>
      `;
      break;

    case 'car_gt3rs_weissach':
      illustration = `
        <!-- Swan-Neck DRS Rear Wing -->
        <path d="M95 145 L95 102 L135 102" fill="none" stroke="#A3E635" stroke-width="5" stroke-linecap="round"/>
        <rect x="78" y="96" width="58" height="9" rx="3" fill="#A3E635"/>
        <!-- 911 GT3 RS Silhouette -->
        <path d="M90 190 L98 148 L185 142 L265 105 L385 108 L465 145 L525 162 L528 190 Z" fill="#1E293B" stroke="#A3E635" stroke-width="3"/>
        <path d="M205 140 L270 112 L372 114 L425 142 Z" fill="#0F172A" stroke="#D9F99D" stroke-width="1.5"/>
        <!-- Center-Lock Magnesium Wheels -->
        <circle cx="178" cy="190" r="36" fill="#09090B" stroke="#A3E635" stroke-width="4"/>
        <circle cx="178" cy="190" r="14" fill="#3F6212"/>
        <circle cx="442" cy="190" r="36" fill="#09090B" stroke="#A3E635" stroke-width="4"/>
        <circle cx="442" cy="190" r="14" fill="#3F6212"/>
      `;
      break;

    case 'car_cullinan_black_badge':
      illustration = `
        <!-- Rolls-Royce Cullinan SUV Coachline Body -->
        <path d="M85 192 L90 128 L175 122 L215 84 L415 84 L455 125 L525 132 L525 192 Z" fill="#111827" stroke="#E5E7EB" stroke-width="2.5"/>
        <!-- Orange Coachline Stripe -->
        <line x1="98" y1="145" x2="512" y2="145" stroke="#F97316" stroke-width="2.5"/>
        <!-- Suicide Coach Doors & Glasshouse -->
        <rect x="225" y="92" width="82" height="34" rx="3" fill="#1F2937" stroke="#9CA3AF" stroke-width="1.5"/>
        <rect x="318" y="92" width="84" height="34" rx="3" fill="#1F2937" stroke="#9CA3AF" stroke-width="1.5"/>
        <!-- Pantheon Grille Edge -->
        <rect x="514" y="134" width="12" height="42" fill="#E5E7EB"/>
        <!-- 23-inch Black Badge Wheels -->
        <circle cx="175" cy="192" r="38" fill="#09090B" stroke="#E5E7EB" stroke-width="4"/>
        <circle cx="445" cy="192" r="38" fill="#09090B" stroke="#E5E7EB" stroke-width="4"/>
      `;
      break;

    case 'car_ferrari_sf90_spider':
      illustration = `
        <!-- Low-Slung Maranello Hypercar Body -->
        <path d="M78 190 L95 148 L210 135 L295 104 L405 112 L525 156 L532 190 Z" fill="#DC2626" stroke="#FDA4AF" stroke-width="2.5"/>
        <!-- Cockpit Canopy & Tonneau Buttresses -->
        <path d="M225 135 L295 108 L392 115 L435 142 Z" fill="#09090B" stroke="#F43F5E" stroke-width="1.5"/>
        <!-- Scuderia Shield -->
        <rect x="405" y="144" width="12" height="15" rx="2" fill="#FACC15"/>
        <!-- Forged Carbon Wheels -->
        <circle cx="176" cy="190" r="35" fill="#09090B" stroke="#F43F5E" stroke-width="4"/>
        <circle cx="444" cy="190" r="35" fill="#09090B" stroke="#F43F5E" stroke-width="4"/>
      `;
      break;

    case 'car_bugatti_tourbillon':
      illustration = `
        <!-- Bugatti C-Line & Two-Tone Hypercar Profile -->
        <path d="M75 190 L92 142 L215 126 L305 98 L420 108 L532 155 L535 190 Z" fill="#0284C7" stroke="#7DD3FC" stroke-width="2.5"/>
        <!-- Signature Bugatti C-Curve -->
        <path d="M240 105 C325 96, 365 135, 295 178" fill="none" stroke="#E0F2FE" stroke-width="5" stroke-linecap="round"/>
        <circle cx="175" cy="190" r="37" fill="#09090B" stroke="#38BDF8" stroke-width="4.5"/>
        <circle cx="448" cy="190" r="37" fill="#09090B" stroke="#38BDF8" stroke-width="4.5"/>
      `;
      break;

    case 'jet_maybach_sprinter':
      illustration = `
        <!-- Bespoke Maybach Two-Tone Studio Cruiser -->
        <rect x="95" y="88" width="410" height="102" rx="18" fill="#1C1917" stroke="#FBBF24" stroke-width="2.5"/>
        <rect x="95" y="142" width="410" height="48" rx="8" fill="#451A03" stroke="#F59E0B" stroke-width="1.5"/>
        <!-- Tinted VIP Panorama Windows -->
        <rect x="120" y="100" width="95" height="34" rx="6" fill="#09090B" stroke="#FDE68A" stroke-width="1"/>
        <rect x="228" y="100" width="115" height="34" rx="6" fill="#09090B" stroke="#FDE68A" stroke-width="1"/>
        <rect x="356" y="100" width="120" height="34" rx="6" fill="#09090B" stroke="#FDE68A" stroke-width="1"/>
        <!-- Monoblock Forged Wheels -->
        <circle cx="180" cy="192" r="32" fill="#09090B" stroke="#FBBF24" stroke-width="4"/>
        <circle cx="425" cy="192" r="32" fill="#09090B" stroke="#FBBF24" stroke-width="4"/>
      `;
      break;

    case 'yacht_sunseeker_116':
      illustration = `
        <!-- Tri-Deck Superyacht Silhouette -->
        <path d="M65 185 L540 185 L495 225 L105 225 Z" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5"/>
        <path d="M125 185 L165 142 L455 142 L485 185 Z" fill="#1E293B" stroke="#7DD3FC" stroke-width="2"/>
        <path d="M195 142 L235 106 L395 106 L420 142 Z" fill="#0284C7" fill-opacity="0.45" stroke="#BAE6FD" stroke-width="2"/>
        <!-- Radar Mast -->
        <path d="M295 106 L315 68 L345 68" fill="none" stroke="#E0F2FE" stroke-width="3"/>
        <!-- Mediterranean Waves -->
        <path d="M40 232 Q180 220 300 232 T560 232" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
      `;
      break;

    case 'jet_bombardier_global_7500':
      illustration = `
        <!-- Swept T-Tail & Ultra-Long-Range Fuselage -->
        <path d="M75 168 L125 102 L175 102 L152 168 Z" fill="#27272A" stroke="#D4AF37" stroke-width="2"/>
        <ellipse cx="315" cy="172" rx="225" ry="26" fill="#18181B" stroke="#FBBF24" stroke-width="2.5"/>
        <!-- Gold Livery Pinstripe -->
        <line x1="105" y1="174" x2="520" y2="174" stroke="#D4AF37" stroke-width="3"/>
        <!-- Illuminated Oval Cabin Windows -->
        <circle cx="220" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="245" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="270" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="295" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="320" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="345" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="370" cy="164" r="5" fill="#FEF08A"/>
        <circle cx="395" cy="164" r="5" fill="#FEF08A"/>
        <!-- Swept Wing -->
        <polygon points="255,180 365,180 430,222 295,222" fill="#27272A" stroke="#FBBF24" stroke-width="2"/>
      `;
      break;

    case 'jewelry_vvs_signature_chain':
      illustration = `
        <!-- Heavy Baguette Miami Cuban Link Chain -->
        <ellipse cx="300" cy="115" rx="135" ry="62" fill="none" stroke="#E2E8F0" stroke-width="16" stroke-dasharray="22 6"/>
        <ellipse cx="300" cy="115" rx="135" ry="62" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="10 18"/>
        <!-- Iced-Out VVS1 Diamond Crest Pendant -->
        <polygon points="300,152 348,185 330,242 270,242 252,185" fill="#0F172A" stroke="#F8FAFC" stroke-width="4"/>
        <polygon points="300,165 332,190 320,230 280,230 268,190" fill="#38BDF8" fill-opacity="0.35" stroke="#BAE6FD" stroke-width="2"/>
        <circle cx="300" cy="200" r="12" fill="#FFFFFF"/>
      `;
      break;

    case 'watch_ap_royal_oak_concept':
      illustration = `
        <!-- Integrated Bracelet Links -->
        <rect x="252" y="36" width="96" height="220" rx="12" fill="#271713" stroke="#FBBF24" stroke-width="2.5"/>
        <!-- Iconic Octagonal Royal Oak Bezel with 8 Hex Screws -->
        <polygon points="255,75 345,75 382,112 382,178 345,215 255,215 218,178 218,112" fill="#1C1917" stroke="#F59E0B" stroke-width="4"/>
        <!-- Openworked Tourbillon Dial -->
        <circle cx="300" cy="145" r="54" fill="#09090B" stroke="#FDE68A" stroke-width="2"/>
        <circle cx="300" cy="172" r="16" fill="none" stroke="#FBBF24" stroke-width="2.5"/>
        <line x1="300" y1="145" x2="328" y2="122" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
        <line x1="300" y1="145" x2="274" y2="132" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
      `;
      break;

    case 'watch_patek_grand_complication':
      illustration = `
        <!-- Platinum Case & Alligator Strap -->
        <rect x="260" y="34" width="80" height="222" rx="10" fill="#022C22" stroke="#34D399" stroke-width="2"/>
        <!-- Emerald Baguette Bezel -->
        <circle cx="300" cy="145" r="74" fill="#064E3B" stroke="#10B981" stroke-width="10" stroke-dasharray="14 4"/>
        <circle cx="300" cy="145" r="60" fill="#09090B" stroke="#A7F3D0" stroke-width="2"/>
        <!-- Perpetual Calendar Subdials -->
        <circle cx="272" cy="145" r="14" fill="none" stroke="#34D399" stroke-width="1.5"/>
        <circle cx="328" cy="145" r="14" fill="none" stroke="#34D399" stroke-width="1.5"/>
        <circle cx="300" cy="174" r="14" fill="none" stroke="#FDE68A" stroke-width="1.5"/>
        <line x1="300" y1="145" x2="332" y2="118" stroke="#ECFDF5" stroke-width="3"/>
      `;
      break;

    case 'watch_jacob_billionaire_ashoka':
      illustration = `
        <!-- Full Ashoka Diamond-Pavé Rectangular Bracelet & Case -->
        <rect x="242" y="34" width="116" height="222" rx="8" fill="#1F122B" stroke="#F5D0FE" stroke-width="3" stroke-dasharray="12 4"/>
        <rect x="218" y="68" width="164" height="154" rx="14" fill="#09090B" stroke="#E879F9" stroke-width="6"/>
        <rect x="234" y="84" width="132" height="122" rx="8" fill="#18181B" stroke="#F0ABFC" stroke-width="2"/>
        <!-- Vertical Skeleton Bridges & Tourbillon Cage -->
        <line x1="275" y1="88" x2="275" y2="202" stroke="#E879F9" stroke-width="3"/>
        <line x1="300" y1="88" x2="300" y2="202" stroke="#F5D0FE" stroke-width="3"/>
        <line x1="325" y1="88" x2="325" y2="202" stroke="#E879F9" stroke-width="3"/>
        <circle cx="300" cy="172" r="18" fill="none" stroke="#FDE047" stroke-width="3"/>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="600" height="360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#05070A" />
      </linearGradient>
    </defs>
    <rect width="600" height="360" fill="url(#bg)" />
    <circle cx="490" cy="70" r="150" fill="${accentHex}" fill-opacity="0.1" />
    ${illustration}
    <rect x="0" y="260" width="600" height="100" fill="#05070A" fill-opacity="0.82" />
    <text x="36" y="302" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800">${safeTitle}</text>
    <text x="36" y="328" fill="${accentHex}" font-family="monospace" font-size="13" font-weight="700" letter-spacing="1.2">${safeSub.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// High-resolution AI generated category showcase images
const IMG_MANSION = '/src/assets/images/luxury_mansion_villa_1794360312764.jpg';
const IMG_HYPERCAR = '/src/assets/images/luxury_exotic_hypercar_1794360315108.jpg';
const IMG_JET_YACHT = '/src/assets/images/luxury_jet_superyacht_1794360315446.jpg';
const IMG_HOROLOGY = '/src/assets/images/luxury_haute_horology_watch_1794360316668.jpg';

export const LUXURY_ASSETS_CATALOG: LuxuryAssetItem[] = [
  // --- REAL ESTATE ---
  {
    id: 'estate_hollywood_hills',
    name: 'Hollywood Hills Glass Villa',
    subtitle: 'Infinity Pool · Panoramic LA Skyline',
    category: 'real_estate',
    categoryLabel: 'Mansions & Estates',
    price: 4_200_000,
    dailyUpkeep: 850,
    instantHypeBoost: 8,
    dailyHypeFloorBonus: 2.5,
    flexPoints: 10,
    minPopularityReq: 15,
    locationOrSpec: 'Los Angeles, CA · 7,400 sq ft',
    description:
      'Cantilevered architectural glass residence above the Sunset Strip with a private screening lounge, Dolby Atmos vocal room, and zero-edge infinity pool.',
    image: IMG_MANSION,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'estate_hollywood_hills',
      'Hollywood Hills Villa',
      'Los Angeles · 7,400 SQ FT',
      '#0F172A',
      '#38BDF8'
    ),
    icon: 'ph-house-line',
    specs: [
      { label: 'Living Area', value: '7,400 sq ft · 5 Bed / 7 Bath' },
      { label: 'Signature Feature', value: 'Cantilevered Glass Infinity Pool' },
      { label: 'Studio Facility', value: 'Private vocal booth & 12-seat screening room' }
    ]
  },
  {
    id: 'estate_tribeca_penthouse',
    name: 'Tribeca Sky Triplex Penthouse',
    subtitle: 'Private Elevator · Rooftop Terrace',
    category: 'real_estate',
    categoryLabel: 'Mansions & Estates',
    price: 11_500_000,
    dailyUpkeep: 2_100,
    instantHypeBoost: 14,
    dailyHypeFloorBonus: 4.0,
    flexPoints: 16,
    minPopularityReq: 30,
    locationOrSpec: 'New York, NY · 9,200 sq ft',
    description:
      'Full-floor cobblestone Tribeca loft penthouse with a wraparound heated rooftop terrace frequented by fashion editors, A-list executives, and paparazzi.',
    image: IMG_MANSION,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'estate_tribeca_penthouse',
      'Tribeca Sky Triplex',
      'New York · 9,200 SQ FT Penthouse',
      '#18181B',
      '#F59E0B'
    ),
    icon: 'ph-buildings',
    specs: [
      { label: 'Interior & Terrace', value: '9,200 sq ft + 3,100 sq ft Rooftop' },
      { label: 'Access', value: 'Biometric Private Keyed Elevator' },
      { label: 'Views', value: '360° Lower Manhattan & Hudson River' }
    ]
  },
  {
    id: 'estate_bel_air_compound',
    name: 'Bel-Air Architectural Compound',
    subtitle: 'Gated 3-Acre Estate · 14-Car Gallery',
    category: 'real_estate',
    categoryLabel: 'Mansions & Estates',
    price: 38_000_000,
    dailyUpkeep: 6_400,
    instantHypeBoost: 22,
    dailyHypeFloorBonus: 7.0,
    flexPoints: 26,
    minPopularityReq: 55,
    locationOrSpec: 'Bel-Air, CA · 24,000 sq ft',
    description:
      'Ultra-private limestone promontory fortress with a subterranean 14-car museum, Olympic lap pool, wellness spa, and 24/7 armed perimeter security.',
    image: IMG_MANSION,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'estate_bel_air_compound',
      'Bel-Air Compound',
      'Bel-Air · 24,000 SQ FT Promontory',
      '#062019',
      '#10B981'
    ),
    icon: 'ph-castle-turret',
    specs: [
      { label: 'Compound Footprint', value: '24,000 sq ft on 3.2 Gated Acres' },
      { label: 'Auto Gallery', value: '14-Car Subterranean Museum & Turntable' },
      { label: 'Security', value: '24/7 Armed Executive Detail & Safe Room' }
    ]
  },
  {
    id: 'estate_lake_como_palazzo',
    name: 'Lake Como Historic Palazzo',
    subtitle: 'Private Boat Dock · Helicopter Pad',
    category: 'real_estate',
    categoryLabel: 'Mansions & Estates',
    price: 65_000_000,
    dailyUpkeep: 11_000,
    instantHypeBoost: 30,
    dailyHypeFloorBonus: 10.0,
    flexPoints: 34,
    minPopularityReq: 75,
    locationOrSpec: 'Laglio, Italy · Waterfront',
    description:
      '18th-century Renaissance waterfront palazzo in Northern Italy with terraced cypress gardens, private Riva Aquarama boathouse, and royal-tier prestige.',
    image: IMG_MANSION,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'estate_lake_como_palazzo',
      'Lake Como Palazzo',
      'Laglio, Italy · Waterfront Villa',
      '#1F160A',
      '#D4AF37'
    ),
    icon: 'ph-bank',
    specs: [
      { label: 'Heritage', value: '18th-Century Restored Waterfront Palazzo' },
      { label: 'Marine & Air', value: 'Private Riva Boathouse & Helipad' },
      { label: 'Grounds', value: '6 Acres of Botanical Cypress Gardens' }
    ]
  },

  // --- SUPERCARS ---
  {
    id: 'car_gt3rs_weissach',
    name: 'Porsche 911 GT3 RS Weissach',
    subtitle: 'Exposed Carbon · Track Aero Spec',
    category: 'supercars',
    categoryLabel: 'Exotic Garage',
    price: 420_000,
    dailyUpkeep: 160,
    instantHypeBoost: 4,
    dailyHypeFloorBonus: 1.0,
    flexPoints: 5,
    minPopularityReq: 8,
    locationOrSpec: '518 HP · 9,000 RPM Flat-Six',
    description:
      'Precision German track weapon finished in PTS Paint-to-Sample with forged magnesium wheels, carbon roll cage, and active Formula 1-style DRS wing.',
    image: IMG_HYPERCAR,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'car_gt3rs_weissach',
      '911 GT3 RS Weissach',
      '518 HP · 9,000 RPM Flat-Six',
      '#1E1B4B',
      '#A3E635'
    ),
    icon: 'ph-car-profile',
    specs: [
      { label: 'Powertrain', value: '4.0L Naturally Aspirated Flat-6 (9,000 RPM)' },
      { label: 'Aerodynamics', value: '1,895 lbs Downforce w/ Active DRS Wing' },
      { label: 'Package', value: 'Full Weissach Exposed Carbon & Magnesium' }
    ]
  },
  {
    id: 'car_cullinan_black_badge',
    name: 'Rolls-Royce Cullinan Black Badge',
    subtitle: 'Shooting Star Headliner · Bespoke Spec',
    category: 'supercars',
    categoryLabel: 'Exotic Garage',
    price: 625_000,
    dailyUpkeep: 280,
    instantHypeBoost: 6,
    dailyHypeFloorBonus: 1.5,
    flexPoints: 7,
    minPopularityReq: 15,
    locationOrSpec: 'Twin-Turbo V12 · Chauffeur Spec',
    description:
      'The ultimate music industry arrival vehicle with rear theatre suite, crystal champagne cooler, lambswool carpets, and darkened Spirit of Ecstasy.',
    image: IMG_HYPERCAR,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'car_cullinan_black_badge',
      'Cullinan Black Badge',
      'Rolls-Royce Bespoke Twin-Turbo V12',
      '#111827',
      '#E5E7EB'
    ),
    icon: 'ph-steering-wheel',
    specs: [
      { label: 'Engine', value: '6.75L Twin-Turbocharged V12 (600 PS)' },
      { label: 'Cabin', value: '1,344 Fiber-Optic Shooting Star Headliner' },
      { label: 'Bespoke Option', value: 'Viewing Suite & Dom Pérignon Cooler' }
    ]
  },
  {
    id: 'car_ferrari_sf90_spider',
    name: 'Ferrari SF90 Spider Assetto Fiorano',
    subtitle: 'Rosso Corsa · 986 HP Plug-In V8',
    category: 'supercars',
    categoryLabel: 'Exotic Garage',
    price: 980_000,
    dailyUpkeep: 420,
    instantHypeBoost: 8,
    dailyHypeFloorBonus: 2.0,
    flexPoints: 10,
    minPopularityReq: 28,
    locationOrSpec: '0–60 mph in 2.3s · Maranello Flagship',
    description:
      'Open-top Italian hybrid hypercar with titanium exhaust and carbon-fiber wheels that turns every Nobu valet line and music video shoot into a viral moment.',
    image: IMG_HYPERCAR,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'car_ferrari_sf90_spider',
      'Ferrari SF90 Spider',
      '986 HP · Assetto Fiorano Spec',
      '#2A080C',
      '#F43F5E'
    ),
    icon: 'ph-lightning',
    specs: [
      { label: 'Powertrain', value: 'Twin-Turbo V8 + 3 Electric Motors (986 HP)' },
      { label: 'Acceleration', value: '0–60 mph in 2.3s · Top Speed 211 mph' },
      { label: 'Roof', value: '14-Second Retractable Hardtop (RHT)' }
    ]
  },
  {
    id: 'car_bugatti_tourbillon',
    name: 'Bugatti Tourbillon 1-of-1 Bespoke',
    subtitle: 'Naturally Aspirated V16 · 1,800 HP',
    category: 'supercars',
    categoryLabel: 'Exotic Garage',
    price: 4_800_000,
    dailyUpkeep: 1_250,
    instantHypeBoost: 15,
    dailyHypeFloorBonus: 3.8,
    flexPoints: 18,
    minPopularityReq: 50,
    locationOrSpec: 'Molsheim Atelier · Skeleton Cluster',
    description:
      'Hyper-exclusivity reserved for billionaires and diamond-selling icons. Powered by an 8.3L Cosworth V16 with a Swiss horology skeleton instrument cluster.',
    image: IMG_HYPERCAR,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'car_bugatti_tourbillon',
      'Bugatti Tourbillon',
      '1,800 HP V16 · 1-OF-1 Atelier',
      '#0C192C',
      '#38BDF8'
    ),
    icon: 'ph-gauge',
    specs: [
      { label: 'Powertrain', value: '8.3L Naturally Aspirated V16 + Tri-Motor (1,800 HP)' },
      { label: 'Top Speed', value: '276 mph (445 km/h) Speed Key Unlocked' },
      { label: 'Cockpit', value: '600-Part Titanium Swiss Tourbillon Gauges' }
    ]
  },

  // --- AVIATION & MARINE ---
  {
    id: 'jet_maybach_sprinter',
    name: 'Maybach Bespoke Studio Tour Cruiser',
    subtitle: 'Mobile Vocal Booth · 8K Starlight Cabin',
    category: 'aviation_marine',
    categoryLabel: 'Jets & Yachts',
    price: 390_000,
    dailyUpkeep: 210,
    instantHypeBoost: 4,
    dailyHypeFloorBonus: 1.0,
    flexPoints: 4,
    minPopularityReq: 10,
    locationOrSpec: 'Full Reclining First-Class Suite',
    description:
      'Custom armored executive land-jet with onboard Neumann U87 vocal recording chain, acoustic isolation, and private security driver.',
    image: IMG_JET_YACHT,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'jet_maybach_sprinter',
      'Maybach Tour Cruiser',
      'Executive Mobile Vocal Suite',
      '#1C1917',
      '#FBBF24'
    ),
    icon: 'ph-van',
    specs: [
      { label: 'Interior', value: '4 Maybach First-Class Massage Captain Chairs' },
      { label: 'Mobile Studio', value: 'Acoustic Vocal Booth + Pro Tools HD Rig' },
      { label: 'Connectivity', value: 'Dual Starlink Aviation High-Speed Array' }
    ]
  },
  {
    id: 'yacht_sunseeker_116',
    name: 'Sunseeker 116 Mediterranean Superyacht',
    subtitle: 'Full Crew of 6 · Ibiza & Monaco Berth',
    category: 'aviation_marine',
    categoryLabel: 'Jets & Yachts',
    price: 16_500_000,
    dailyUpkeep: 4_200,
    instantHypeBoost: 18,
    dailyHypeFloorBonus: 4.5,
    flexPoints: 20,
    minPopularityReq: 45,
    locationOrSpec: '116 Feet · Foredeck Jacuzzi & Jet Skis',
    description:
      'Tri-deck luxury motor yacht docked in Marina Botafoch and Port Hercule for Grand Prix weekends, album release parties, and Mediterranean summers.',
    image: IMG_JET_YACHT,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'yacht_sunseeker_116',
      'Sunseeker 116 Yacht',
      'Monaco & Ibiza · 116 FT Tri-Deck',
      '#082F49',
      '#38BDF8'
    ),
    icon: 'ph-boat',
    specs: [
      { label: 'Length & Staterooms', value: '116 ft (35.2m) · 5 VIP En-Suite Cabins' },
      { label: 'Tender Garage', value: 'Williams 565 Jet Tender + 2 Sea-Doo GTX' },
      { label: 'Home Berths', value: 'Port Hercule (Monaco) & Ibiza Magna' }
    ]
  },
  {
    id: 'jet_bombardier_global_7500',
    name: 'Bombardier Global 7500 Custom Jet',
    subtitle: 'Custom Livery · 4-Zone Master Suite',
    category: 'aviation_marine',
    categoryLabel: 'Jets & Yachts',
    price: 54_000_000,
    dailyUpkeep: 9_800,
    instantHypeBoost: 26,
    dailyHypeFloorBonus: 8.5,
    flexPoints: 30,
    minPopularityReq: 68,
    locationOrSpec: '7,700 nm Range · Mach 0.925',
    description:
      'Non-stop private flagship aviation from LA to Tokyo or London to Singapore with a permanent master bedroom, stand-up rain shower, and custom tail emblem.',
    image: IMG_JET_YACHT,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'jet_bombardier_global_7500',
      'Bombardier Global 7500',
      '7,700 NM · Mach 0.925 Private Jet',
      '#17150B',
      '#D4AF37'
    ),
    icon: 'ph-airplane-tilt',
    specs: [
      { label: 'Range & Speed', value: '7,700 Nautical Miles · Mach 0.925 Cruise' },
      { label: 'Cabin Zones', value: '4 Living Spaces + Permanent Master Suite' },
      { label: 'Capacity', value: 'Up to 19 Passengers + 4 Flight Crew' }
    ]
  },

  // --- JEWELRY & HOROLOGY ---
  {
    id: 'jewelry_vvs_signature_chain',
    name: 'Custom 120ct VVS1 Label Pendant & Cuban',
    subtitle: '18K White Gold · Hand-Set Baguettes',
    category: 'jewelry_horology',
    categoryLabel: 'Chains & Watches',
    price: 250_000,
    dailyUpkeep: 75,
    instantHypeBoost: 5,
    dailyHypeFloorBonus: 1.0,
    flexPoints: 5,
    minPopularityReq: 5,
    locationOrSpec: 'Diamond District Custom Piece',
    description:
      'Bespoke iced-out record label crest pendant on a 24mm heavy Miami Cuban link chain set with 120 carats of GIA-certified VVS1 D-color diamonds.',
    image: IMG_HOROLOGY,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'jewelry_vvs_signature_chain',
      '120ct VVS1 Cuban Chain',
      '18K White Gold · GIA D-Flawless',
      '#1E293B',
      '#E2E8F0'
    ),
    icon: 'ph-diamond',
    specs: [
      { label: 'Total Carat Weight', value: '120.5 ct GIA-Certified VVS1 Diamonds' },
      { label: 'Precious Metal', value: '1.4 kg Solid 18K Rhodium White Gold' },
      { label: 'Setting Style', value: 'Invisible-Set Emerald & Baguette Cut' }
    ]
  },
  {
    id: 'watch_ap_royal_oak_concept',
    name: 'Audemars Piguet Royal Oak Concept Tourbillon',
    subtitle: 'Frosted Rose Gold · Openworked Movement',
    category: 'jewelry_horology',
    categoryLabel: 'Chains & Watches',
    price: 540_000,
    dailyUpkeep: 140,
    instantHypeBoost: 6,
    dailyHypeFloorBonus: 1.5,
    flexPoints: 7,
    minPopularityReq: 20,
    locationOrSpec: 'Le Brassus Allocation · 42mm',
    description:
      'Boutique-only Swiss haute horology allocation piece flexed in close-up wrist shots, late-night talk shows, and Met Gala red carpet interviews.',
    image: IMG_HOROLOGY,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'watch_ap_royal_oak_concept',
      'AP Royal Oak Concept',
      'Le Brassus · Flying Tourbillon',
      '#271713',
      '#FBBF24'
    ),
    icon: 'ph-watch',
    specs: [
      { label: 'Calibre', value: 'Hand-Wound Flying Tourbillon Calibre 2950' },
      { label: 'Case Architecture', value: '42mm Hammered 18K Frosted Rose Gold' },
      { label: 'Provenance', value: 'AP House VVIP Direct Allocation' }
    ]
  },
  {
    id: 'watch_patek_grand_complication',
    name: 'Patek Philippe 5271P Emerald Baguette',
    subtitle: 'Platinum Perpetual Calendar Chronograph',
    category: 'jewelry_horology',
    categoryLabel: 'Chains & Watches',
    price: 1_450_000,
    dailyUpkeep: 320,
    instantHypeBoost: 10,
    dailyHypeFloorBonus: 2.5,
    flexPoints: 12,
    minPopularityReq: 38,
    locationOrSpec: 'Geneva Seal · Factory Set Emeralds',
    description:
      'Factory baguette emerald-set 950 platinum Patek Philippe Grand Complication reserved for Geneva salon VVIP collectors and royalty.',
    image: IMG_HOROLOGY,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'watch_patek_grand_complication',
      'Patek Philippe 5271P',
      '950 Platinum · Factory Emeralds',
      '#052E16',
      '#34D399'
    ),
    icon: 'ph-clock-countdown',
    specs: [
      { label: 'Complications', value: 'Perpetual Calendar, Moonphase & Chronograph' },
      { label: 'Gem-Setting', value: '80 Factory Baguette-Cut Colombian Emeralds' },
      { label: 'Case Material', value: '950 Platinum with Single Diamond at 6h' }
    ]
  },
  {
    id: 'watch_jacob_billionaire_ashoka',
    name: 'Jacob & Co. Billionaire III Ashoka',
    subtitle: '260 Carats Ashoka-Cut Diamonds · 1 of 1',
    category: 'jewelry_horology',
    categoryLabel: 'Chains & Watches',
    price: 7_500_000,
    dailyUpkeep: 1_500,
    instantHypeBoost: 16,
    dailyHypeFloorBonus: 4.2,
    flexPoints: 20,
    minPopularityReq: 60,
    locationOrSpec: 'Skeleton Tourbillon · High Jewelry',
    description:
      'One-of-one high-jewelry timepiece covered entirely in rare Ashoka-cut diamonds with a skeletonized tourbillon bridge and dedicated armed security detail.',
    image: IMG_HOROLOGY,
    svgIllustration: buildDetailedLuxurySvgDataUri(
      'watch_jacob_billionaire_ashoka',
      'Billionaire III Ashoka',
      '260 Carats · Pièce Unique 1-OF-1',
      '#1F122B',
      '#E879F9'
    ),
    icon: 'ph-sparkle',
    specs: [
      { label: 'Diamond Weight', value: '260 Carats of William Goldberg Ashoka Diamonds' },
      { label: 'Movement', value: 'JCAM39 Skeleton Tourbillon (72-Hour Reserve)' },
      { label: 'Edition', value: 'Pièce Unique (1 of 1 Worldwide)' }
    ]
  }
];

export function getEnsuredLuxuryAssetsState(state: GameState): LuxuryAssetsState {
  const existing = (state as any)?.luxuryAssetsState as LuxuryAssetsState | undefined;
  if (existing && existing.initialized && Array.isArray(existing.ownedAssets)) {
    return existing;
  }
  return {
    initialized: true,
    ownedAssets: [],
    totalSpentAllTime: 0,
    totalUpkeepPaidAllTime: 0,
    lastUpkeepPaidToday: 0
  };
}

export interface LuxuryPortfolioMetrics {
  ownedCount: number;
  totalPortfolioValue: number;
  totalResaleValue: number;
  totalDailyUpkeep: number;
  flexScore: number; // 0 - 100
  flexRankLabel: string;
  dailyHypeFloorBonus: number;
  ownedItems: (LuxuryAssetItem & { purchasedDate: string; pricePaid: number })[];
}

export function calculateLuxuryPortfolioMetrics(state: GameState): LuxuryPortfolioMetrics {
  const luxState = getEnsuredLuxuryAssetsState(state);
  const ownedItems = luxState.ownedAssets
    .map(rec => {
      const item = LUXURY_ASSETS_CATALOG.find(a => a.id === rec.assetId);
      if (!item) return null;
      return {
        ...item,
        purchasedDate: rec.purchasedDate,
        pricePaid: rec.pricePaid
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const totalPortfolioValue = ownedItems.reduce((sum, i) => sum + i.price, 0);
  const totalResaleValue = Math.round(totalPortfolioValue * 0.75);
  const totalDailyUpkeep = ownedItems.reduce((sum, i) => sum + i.dailyUpkeep, 0);
  const rawFlexPoints = ownedItems.reduce((sum, i) => sum + i.flexPoints, 0);
  const flexScore = Math.min(100, rawFlexPoints);
  const dailyHypeFloorBonus = Math.min(
    28,
    Number(ownedItems.reduce((sum, i) => sum + i.dailyHypeFloorBonus, 0).toFixed(1))
  );

  const flexRankLabel =
    flexScore >= 85
      ? 'Billionaire Cultural Mogul'
      : flexScore >= 60
      ? 'Global A-List Icon'
      : flexScore >= 35
      ? 'High-Net-Worth Headliner'
      : flexScore >= 15
      ? 'New Money Flexer'
      : flexScore > 0
      ? 'Rising Tastemaker'
      : 'Unranked';

  return {
    ownedCount: ownedItems.length,
    totalPortfolioValue,
    totalResaleValue,
    totalDailyUpkeep,
    flexScore,
    flexRankLabel,
    dailyHypeFloorBonus,
    ownedItems
  };
}

export function purchaseLuxuryAsset(
  state: GameState,
  assetId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const asset = LUXURY_ASSETS_CATALOG.find(a => a.id === assetId);
  if (!asset) {
    return { success: false, message: 'Luxury asset not found.', updatedState: state };
  }

  const luxState = getEnsuredLuxuryAssetsState(state);
  if (luxState.ownedAssets.some(o => o.assetId === assetId)) {
    return {
      success: false,
      message: `You already own "${asset.name}" in your collection.`,
      updatedState: state
    };
  }

  const pop = Number(state.popularity) || 0;
  if (pop < asset.minPopularityReq) {
    return {
      success: false,
      message: `Exclusive allocation locked: You need at least ${asset.minPopularityReq}% Popularity (Current: ${pop.toFixed(1)}%) to acquire "${asset.name}".`,
      updatedState: state
    };
  }

  const currentMoney = Number(state.money) || 0;
  if (currentMoney < asset.price) {
    return {
      success: false,
      message: `Insufficient funds. "${asset.name}" costs $${asset.price.toLocaleString()} (Available: $${Math.round(currentMoney).toLocaleString()}).`,
      updatedState: state
    };
  }

  const todayStr = (state.date || new Date().toISOString()).split('T')[0];
  const nextLuxState: LuxuryAssetsState = {
    ...luxState,
    ownedAssets: [
      {
        assetId: asset.id,
        purchasedDate: todayStr,
        pricePaid: asset.price
      },
      ...luxState.ownedAssets
    ],
    totalSpentAllTime: (luxState.totalSpentAllTime || 0) + asset.price
  };

  const nextHype = Math.min(100, Number(((state.hype || 0) + asset.instantHypeBoost).toFixed(1)));
  const artistName = state.artist?.name || 'Artist';

  const newPosts: XPost[] = [];
  if (asset.price >= 500_000) {
    const likes = Math.round(45_000 + pop * 1_850 + asset.flexPoints * 3_200);
    newPosts.push({
      id: `lux_buy_${asset.id}_${Date.now()}`,
      authorName: 'Pop Base',
      authorHandle: '@PopBase',
      authorAvatar: 'https://placehold.co/120x120/111827/38BDF8?text=PB',
      isVerified: true,
      verifiedType: 'gold',
      category: 'media',
      content: `${artistName} has reportedly acquired the ${asset.name} (${asset.locationOrSpec}) for $${(asset.price / 1_000_000).toFixed(2)}M.`,
      image: asset.svgIllustration,
      mediaBadge: 'LUXURY ACQUISITION',
      mediaTitle: asset.name,
      mediaSubtitle: `$${asset.price.toLocaleString()} · ${asset.categoryLabel}`,
      likes,
      reposts: Math.round(likes * 0.19),
      replies: Math.round(likes * 0.08),
      views: Math.round(likes * 16),
      timeAgo: 'Just now',
      dateCreated: todayStr
    });
  }

  const updatedState: GameState = {
    ...state,
    money: Math.max(0, currentMoney - asset.price),
    hype: nextHype,
    xPosts: newPosts.length > 0 ? [...newPosts, ...(state.xPosts || [])].slice(0, 120) : state.xPosts,
    luxuryAssetsState: nextLuxState
  } as any;

  return {
    success: true,
    message: `Acquired "${asset.name}" for $${asset.price.toLocaleString()}! (+${asset.instantHypeBoost}% Hype, +${asset.flexPoints} Flex Rating, $${asset.dailyUpkeep.toLocaleString()}/day upkeep).`,
    updatedState
  };
}

export function sellLuxuryAsset(
  state: GameState,
  assetId: string
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const asset = LUXURY_ASSETS_CATALOG.find(a => a.id === assetId);
  const luxState = getEnsuredLuxuryAssetsState(state);
  const ownedRec = luxState.ownedAssets.find(o => o.assetId === assetId);

  if (!asset || !ownedRec) {
    return {
      success: false,
      message: 'You do not own this asset.',
      updatedState: state
    };
  }

  const resaleAmount = Math.round(asset.price * 0.75);
  const nextLuxState: LuxuryAssetsState = {
    ...luxState,
    ownedAssets: luxState.ownedAssets.filter(o => o.assetId !== assetId)
  };

  const updatedState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + resaleAmount,
    luxuryAssetsState: nextLuxState
  } as any;

  return {
    success: true,
    message: `Liquidated "${asset.name}" for $${resaleAmount.toLocaleString()} (75% resale value) and removed $${asset.dailyUpkeep.toLocaleString()}/day in maintenance overhead.`,
    updatedState
  };
}

/**
 * Processes daily Hype retention floor from owned luxury assets and records upkeep statistics.
 * Note: actual cash deduction for daily upkeep is itemized inside calculateDailyExpensesBreakdown().
 */
export function processDailyLuxuryAssetsStep(state: GameState): {
  updatedLuxuryState: LuxuryAssetsState;
  hypeFloorApplied: number;
} {
  const luxState = getEnsuredLuxuryAssetsState(state);
  const metrics = calculateLuxuryPortfolioMetrics(state);

  const updatedLuxuryState: LuxuryAssetsState = {
    ...luxState,
    lastUpkeepPaidToday: metrics.totalDailyUpkeep,
    totalUpkeepPaidAllTime: (luxState.totalUpkeepPaidAllTime || 0) + metrics.totalDailyUpkeep
  };

  // Ensure artist Hype doesn't decay below a baseline supported by their luxury status lifestyle
  const baseFloor = Math.min(48, 12 + metrics.dailyHypeFloorBonus);

  return {
    updatedLuxuryState,
    hypeFloorApplied: baseFloor
  };
}
