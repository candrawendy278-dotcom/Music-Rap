// Official Artist Merch & Vinyl Webstore Engine
// Powers the Direct-to-Consumer (D2C) Artist Webstore, Custom Vinyl Pressing Studio,
// Standalone Front/Back Streetwear & Accessories Customizer, Realistic D2C Sales &
// E-Commerce Economics (Price Elasticity, Fan Saturation, Cannibalization, Label/Fulfillment/Warehouse Costs),
// Pre-Order Album Bundles (Physical Music only), and Billboard Pure Sales Chart Integration.

import { GameState, Project, Song } from '../types';

export type MerchCategory = 'vinyl' | 'physical_music' | 'apparel' | 'accessory';

export type MerchFormatId =
  | 'vinyl_standard'
  | 'vinyl_color'
  | 'vinyl_splatter'
  | 'vinyl_picture'
  | 'vinyl_signed'
  | 'cd_standard'
  | 'cd_deluxe_zine'
  | 'cassette_retro'
  | 'box_set_deluxe'
  | 'apparel_hoodie'
  | 'apparel_tshirt'
  | 'apparel_cap'
  | 'apparel_jacket'
  | 'acc_poster'
  | 'acc_tote'
  | 'acc_slipmat';

export type MerchVariantStyle =
  | 'solid'
  | 'translucent'
  | 'splatter'
  | 'marble'
  | 'picture_disc';

export type MerchSpecTier = 'standard' | 'deluxe_heavyweight' | 'archive_collector';

export type MerchPromoCampaignId =
  | 'none'
  | 'digital_bundle_boost'
  | 'fan_club_early_access'
  | 'flash_drop_24h'
  | 'clearance_sale_15';

// Standalone Streetwear & Accessories Customization Types
export type ApparelFontStyle =
  | 'street_gothic'
  | 'brutalist_sans'
  | 'luxury_serif'
  | 'collegiate_block'
  | 'punk_scrawl';

export type ApparelGraphicMotif =
  | 'chrome_tribal'
  | 'sacred_flame'
  | 'fallen_cherub'
  | 'world_globe'
  | 'box_emblem'
  | 'custom_photo'
  | 'typography_only';

export type ApparelBackPrintStyle =
  | 'tour_dates_list'
  | 'oversized_arch_logo'
  | 'jersey_number_99'
  | 'manifesto_quote'
  | 'clean_blank';

export type ApparelGraphicPlacement =
  | 'center_chest'
  | 'left_chest_crest'
  | 'oversized_full';

export interface ApparelCustomDesign {
  frontText: string;
  frontSubText: string;
  backHeading: string;
  backText: string;
  backPrintStyle: ApparelBackPrintStyle;
  fontStyle: ApparelFontStyle;
  graphicMotif: ApparelGraphicMotif;
  customGraphicUrl?: string;
  placement: ApparelGraphicPlacement;
  hasSleevePrint: boolean;
  defaultViewSide: 'front' | 'back' | 'both';
}

export interface VinylColorwayPreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  variantStyle: MerchVariantStyle;
  description: string;
}

export interface MerchSpecTierMeta {
  id: MerchSpecTier;
  name: string;
  shortTag: string;
  description: string;
  costMultiplier: number;
  demandMultiplier: number;
}

export interface MerchFormatTemplate {
  id: MerchFormatId;
  category: MerchCategory;
  name: string;
  shortLabel: string;
  description: string;
  unitManufacturingCost: number;
  recommendedRetailPrice: number;
  minRetailPrice: number;
  maxRetailPrice: number;
  countsForBillboard: boolean;
  demandMultiplier: number;
  defaultVariantStyle: MerchVariantStyle;
  supportsSignedOption: boolean;
  supportsFrontBackView?: boolean;
}

export interface MerchProductItem {
  id: string;
  name: string;
  subtitle: string;
  category: MerchCategory;
  formatId: MerchFormatId;
  formatLabel: string;
  // Note: Only 'vinyl' and 'physical_music' link to a project/song. Apparel & Accessories are 'standalone_merch'.
  linkedReleaseType: 'project' | 'song' | 'era' | 'standalone_merch';
  linkedReleaseId?: number;
  linkedReleaseTitle: string;
  isPreOrderRelease: boolean;
  scheduledReleaseDate?: string;
  coverArt: string;
  colorwayId: string;
  colorwayName: string;
  primaryColor: string;
  secondaryColor: string;
  variantStyle: MerchVariantStyle;
  specTier?: MerchSpecTier;
  hasObiStrip?: boolean;
  hypeStickerText?: string;
  apparelDesign?: ApparelCustomDesign;
  maxPerCustomer?: number;
  unitCost: number;
  retailPrice: number;
  stockRemaining: number;
  totalPressed: number;
  totalSold: number;
  dailySold: number;
  preOrdersAccumulated: number;
  totalRevenue: number; // Net revenue credited to artist after D2C fees
  totalGrossSales?: number; // Raw gross retail sales before platform/fulfillment deductions
  totalManufacturingSpent: number;
  daysActiveOnStore?: number;
  saturationPercent?: number;
  demandPhaseLabel?: string;
  isLimitedEdition: boolean;
  isSigned: boolean;
  isBundle: boolean;
  countsForBillboard: boolean;
  createdAtDate: string;
}

export interface MerchOrderLogEntry {
  id: string;
  date: string;
  productId: string;
  productName: string;
  formatLabel: string;
  unitsSold: number;
  grossRevenue: number;
  netPayout?: number;
  feesDeducted?: number;
  countedForBillboard: boolean;
  isPreOrderWave?: boolean;
}

export interface MerchStoreState {
  storeTitle: string;
  storeBannerSubtitle: string;
  accentColor: string;
  activePromoCampaign?: MerchPromoCampaignId;
  items: MerchProductItem[];
  totalGrossRevenue: number;
  totalPlatformAndFulfillmentFees?: number;
  totalWarehouseHoldingFees?: number;
  totalManufacturingCost: number;
  totalNetProfit: number;
  totalBillboardPureUnitsSold: number;
  dailyRevenue: number; // Daily net artist payout after D2C deductions
  dailyGrossSales?: number;
  dailyFeesAndOverhead?: number;
  dailyUnitsSold: number;
  orderLogs: MerchOrderLogEntry[];
}

export const APPAREL_FONT_STYLES: Array<{
  id: ApparelFontStyle;
  label: string;
  sampleClass: string;
}> = [
  {
    id: 'street_gothic',
    label: 'Old English / Heavy Gothic',
    sampleClass: 'font-serif tracking-widest uppercase font-black italic'
  },
  {
    id: 'brutalist_sans',
    label: 'Brutalist Box Sans',
    sampleClass: 'font-sans tracking-tighter uppercase font-black'
  },
  {
    id: 'luxury_serif',
    label: 'Atelier High-Fashion Serif',
    sampleClass: 'font-serif tracking-[0.18em] uppercase font-bold'
  },
  {
    id: 'collegiate_block',
    label: 'Varsity Athletic Slab',
    sampleClass: 'font-mono tracking-wider uppercase font-black'
  },
  {
    id: 'punk_scrawl',
    label: 'Distressed Punk Stencil',
    sampleClass: 'font-mono tracking-tight uppercase font-extrabold italic'
  }
];

export const APPAREL_GRAPHIC_MOTIFS: Array<{
  id: ApparelGraphicMotif;
  label: string;
  description: string;
}> = [
  {
    id: 'chrome_tribal',
    label: 'Y2K Liquid Chrome Crest',
    description: 'Metallic cyber sigil & star emblem'
  },
  {
    id: 'sacred_flame',
    label: 'Distressed Flame & Dagger',
    description: 'Heavy streetwear tour flame emblem'
  },
  {
    id: 'fallen_cherub',
    label: 'Renaissance Angel Wings',
    description: 'High-contrast vintage halftone angel wings'
  },
  {
    id: 'world_globe',
    label: 'Worldwide Wireframe Globe',
    description: 'Global tour coordinates & orbital grid'
  },
  {
    id: 'box_emblem',
    label: 'Minimalist Atelier Box Crest',
    description: 'Clean luxury framed monogram box'
  },
  {
    id: 'custom_photo',
    label: 'Custom Photo / Graphic Upload',
    description: 'Upload your own photo/art or paste an image URL'
  },
  {
    id: 'typography_only',
    label: 'Pure Puff-Print Typography Only',
    description: 'Clean statement lettering with no graphic icon'
  }
];

export const APPAREL_BACK_STYLES: Array<{
  id: ApparelBackPrintStyle;
  label: string;
  description: string;
}> = [
  {
    id: 'tour_dates_list',
    label: 'World Tour Cities & Venues List',
    description: '2-column stadium tour itinerary & dates on the back'
  },
  {
    id: 'oversized_arch_logo',
    label: 'Oversized Back Arch & Emblem',
    description: 'Giant shoulder-to-shoulder statement print'
  },
  {
    id: 'jersey_number_99',
    label: 'Athletic Championship Number 01',
    description: 'Bold varsity number + artist name across shoulders'
  },
  {
    id: 'manifesto_quote',
    label: 'Atelier Manifesto / Lyric Block',
    description: 'Editorial paragraph & studio serial stamp on back'
  },
  {
    id: 'clean_blank',
    label: 'Minimalist Clean Back (Woven Neck Tag Only)',
    description: 'Unprinted back with exterior stitched atelier label'
  }
];

export const MERCH_SPEC_TIERS: MerchSpecTierMeta[] = [
  {
    id: 'standard',
    name: 'Standard Retail Grade',
    shortTag: 'Standard Spec',
    description: '140g standard pressing / 240GSM cotton blank / standard retail packaging.',
    costMultiplier: 1.0,
    demandMultiplier: 0.92
  },
  {
    id: 'deluxe_heavyweight',
    name: 'Deluxe Heavyweight Spec',
    shortTag: '180g / 480GSM Deluxe',
    description: '180g audiophile gatefold + foil hype sticker / 480GSM heavyweight fleece + puff print.',
    costMultiplier: 1.25,
    demandMultiplier: 1.18
  },
  {
    id: 'archive_collector',
    name: 'Archive Collector Edition',
    shortTag: 'Archive Tip-On + Luxury',
    description: 'Numbered tip-on jacket + bonus booklet / 600GSM luxury cut-and-sew distressed wash.',
    costMultiplier: 1.55,
    demandMultiplier: 1.38
  }
];

export const MERCH_PROMO_CAMPAIGNS: Array<{
  id: MerchPromoCampaignId;
  name: string;
  badge: string;
  description: string;
  demandMultiplier: number;
  billboardConversionBoost: number;
  priceMultiplier: number;
  dailyAdSpend: number;
}> = [
  {
    id: 'none',
    name: 'Organic Storefront Traffic',
    badge: '$0/day Ad Spend',
    description: 'Standard organic webstore traffic with zero daily marketing spend.',
    demandMultiplier: 1.0,
    billboardConversionBoost: 1.0,
    priceMultiplier: 1.0,
    dailyAdSpend: 0
  },
  {
    id: 'digital_bundle_boost',
    name: 'Chart Push: Physical Music + Digital Bundle Ads',
    badge: '+22% Chart Vol • $350/d',
    description: 'Sponsored checkout funnel prioritizing Vinyl, CD & Cassette chart bundles (Max 4/customer).',
    demandMultiplier: 1.18,
    billboardConversionBoost: 1.22,
    priceMultiplier: 1.0,
    dailyAdSpend: 350
  },
  {
    id: 'fan_club_early_access',
    name: 'VIP Stan Club SMS & Email Drop Campaign',
    badge: '+25% Demand • $250/d',
    description: 'Direct CRM notifications to core fans, boosting signed vinyl & streetwear capsule conversion.',
    demandMultiplier: 1.25,
    billboardConversionBoost: 1.08,
    priceMultiplier: 1.0,
    dailyAdSpend: 250
  },
  {
    id: 'flash_drop_24h',
    name: 'Global Retargeting & Countdown Drop Ads',
    badge: '+35% Vol • $650/d',
    description: 'Aggressive paid social lookbook ads across Instagram, TikTok & X to accelerate unit sales.',
    demandMultiplier: 1.35,
    billboardConversionBoost: 1.12,
    priceMultiplier: 1.0,
    dailyAdSpend: 650
  },
  {
    id: 'clearance_sale_15',
    name: 'Warehouse Clearance Flash Sale (-20% Price)',
    badge: '+55% Vol • -20% Price',
    description: 'Applies an automatic 20% discount at checkout to liquidate slow-moving warehouse inventory.',
    demandMultiplier: 1.55,
    billboardConversionBoost: 1.08,
    priceMultiplier: 0.80,
    dailyAdSpend: 100
  }
];

export const VINYL_AND_MERCH_COLORWAYS: VinylColorwayPreset[] = [
  {
    id: 'obsidian_black',
    name: '180g Audiophile Obsidian Black',
    primaryColor: '#121216',
    secondaryColor: '#F4F4F5',
    variantStyle: 'solid',
    description: 'Heavyweight 180g classic black wax / jet onyx garment with crisp bone ink'
  },
  {
    id: 'ruby_translucent',
    name: 'Crimson Blood Moon Translucent',
    primaryColor: '#991B1B',
    secondaryColor: '#FECACA',
    variantStyle: 'translucent',
    description: 'Glass-clear crimson wax / vintage crimson wash'
  },
  {
    id: 'cobalt_splatter',
    name: 'Midnight Cobalt & Bone Splatter',
    primaryColor: '#1E3A8A',
    secondaryColor: '#F8FAFC',
    variantStyle: 'splatter',
    description: 'Deep sapphire base with hand-poured white splatter'
  },
  {
    id: 'emerald_marble',
    name: 'Emerald Forest Smoke Marble',
    primaryColor: '#064E3B',
    secondaryColor: '#6EE7B7',
    variantStyle: 'marble',
    description: 'Swirled forest green and jade smoke finish'
  },
  {
    id: 'champagne_gold',
    name: 'Liquid Champagne Metallic Gold',
    primaryColor: '#78350F',
    secondaryColor: '#FDE68A',
    variantStyle: 'marble',
    description: 'Collector metallic gold swirl pressing / sand tone'
  },
  {
    id: 'violet_supernova',
    name: 'Ultraviolet & Hot Pink Splatter',
    primaryColor: '#4C1D95',
    secondaryColor: '#F472B6',
    variantStyle: 'splatter',
    description: 'Electric purple wax with neon magenta splatter'
  },
  {
    id: 'bone_espresso',
    name: 'Vintage Bone & Espresso Swirl',
    primaryColor: '#E7E5E4',
    secondaryColor: '#1C1917',
    variantStyle: 'marble',
    description: 'Warm off-white vinyl / heavyweight ecru garment with dark ink'
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz Blush Translucent',
    primaryColor: '#9D174D',
    secondaryColor: '#FBCFE8',
    variantStyle: 'translucent',
    description: 'Soft translucent millennial pink collector pressing'
  },
  {
    id: 'arctic_clear',
    name: 'Coke-Bottle Seafoam Clear',
    primaryColor: '#115E59',
    secondaryColor: '#CCFBF1',
    variantStyle: 'translucent',
    description: 'Ultra-clear seafoam glass finish'
  },
  {
    id: 'blood_honey_splatter',
    name: 'Molten Amber & Black Lava Splatter',
    primaryColor: '#18181B',
    secondaryColor: '#FB923C',
    variantStyle: 'splatter',
    description: 'Jet black base with fiery orange-gold splatter arcs'
  },
  {
    id: 'glacier_ice_marble',
    name: 'Glacier Ice & Silver Mist Marble',
    primaryColor: '#0C4A6E',
    secondaryColor: '#E0F2FE',
    variantStyle: 'marble',
    description: 'Arctic blue marble with metallic silver ribbons'
  },
  {
    id: 'acid_lime_splatter',
    name: 'Cyber Acid Lime & Onyx',
    primaryColor: '#18181B',
    secondaryColor: '#A3E635',
    variantStyle: 'splatter',
    description: 'High-contrast club neon lime on jet black'
  },
  {
    id: 'washed_charcoal_vintage',
    name: 'Enzyme Washed Vintage Charcoal',
    primaryColor: '#27272A',
    secondaryColor: '#F4F4F5',
    variantStyle: 'solid',
    description: 'Distressed pigment-dyed charcoal slate finish'
  },
  {
    id: 'picture_disc_art',
    name: 'Full-Bleed Artwork Picture Disc',
    primaryColor: '#18181B',
    secondaryColor: '#E4E4E7',
    variantStyle: 'picture_disc',
    description: 'Album cover artwork pressed directly onto the disc surface'
  }
];

export const HYPE_STICKER_PRESETS: string[] = [
  '180G AUDIOPHILE VINYL',
  'WEBSTORE EXCLUSIVE',
  'LIMITED EDITION PRESSING',
  'INCLUDES SIGNED ART CARD',
  'DELUXE 2LP GATEFOLD',
  'COUNTS TOWARD BILLBOARD'
];

export const MERCH_FORMAT_TEMPLATES: MerchFormatTemplate[] = [
  // 1. VINYL VARIANTS (Counts toward Billboard, Links to Album/Single)
  {
    id: 'vinyl_standard',
    category: 'vinyl',
    name: '12" Standard 180g Vinyl LP',
    shortLabel: 'Standard 12" LP',
    description: 'Heavyweight 180-gram audiophile vinyl pressing in a matte gatefold jacket. Counts 1:1 toward Billboard pure album/single sales.',
    unitManufacturingCost: 11,
    recommendedRetailPrice: 32,
    minRetailPrice: 20,
    maxRetailPrice: 65,
    countsForBillboard: true,
    demandMultiplier: 1.05,
    defaultVariantStyle: 'solid',
    supportsSignedOption: true
  },
  {
    id: 'vinyl_color',
    category: 'vinyl',
    name: '12" Exclusive Color Variant LP',
    shortLabel: 'Color Variant LP',
    description: 'Webstore-exclusive translucent or marbled colored wax variant. Sought after by vinyl collectors for first-week chart pushes.',
    unitManufacturingCost: 13,
    recommendedRetailPrice: 36,
    minRetailPrice: 24,
    maxRetailPrice: 72,
    countsForBillboard: true,
    demandMultiplier: 1.18,
    defaultVariantStyle: 'translucent',
    supportsSignedOption: true
  },
  {
    id: 'vinyl_splatter',
    category: 'vinyl',
    name: '2LP Gatefold Deluxe Splatter Edition',
    shortLabel: '2LP Gatefold Splatter',
    description: 'Double-LP custom hand-poured splatter pressing in a wide gatefold jacket. Counts toward Billboard pure sales.',
    unitManufacturingCost: 17,
    recommendedRetailPrice: 44,
    minRetailPrice: 30,
    maxRetailPrice: 88,
    countsForBillboard: true,
    demandMultiplier: 1.24,
    defaultVariantStyle: 'splatter',
    supportsSignedOption: true
  },
  {
    id: 'vinyl_picture',
    category: 'vinyl',
    name: 'Collector Picture Disc Vinyl LP',
    shortLabel: 'Picture Disc LP',
    description: 'Full-color era artwork pressed directly into the vinyl grooves inside a crystal display sleeve. Counts toward Billboard pure sales.',
    unitManufacturingCost: 15,
    recommendedRetailPrice: 40,
    minRetailPrice: 26,
    maxRetailPrice: 80,
    countsForBillboard: true,
    demandMultiplier: 1.12,
    defaultVariantStyle: 'picture_disc',
    supportsSignedOption: false
  },
  {
    id: 'vinyl_signed',
    category: 'vinyl',
    name: 'Webstore Exclusive Hand-Signed LP',
    shortLabel: 'Signed Vinyl LP',
    description: 'Hand-signed cover jacket by the artist. Strong Day-1 fan conversion for Billboard #1 chart battles.',
    unitManufacturingCost: 19,
    recommendedRetailPrice: 50,
    minRetailPrice: 34,
    maxRetailPrice: 105,
    countsForBillboard: true,
    demandMultiplier: 1.38,
    defaultVariantStyle: 'marble',
    supportsSignedOption: true
  },

  // 2. PHYSICAL MUSIC FORMATS (Counts toward Billboard, Links to Album/Single)
  {
    id: 'cd_standard',
    category: 'physical_music',
    name: 'Official Crystal Jewel Case CD',
    shortLabel: 'Jewel Case CD',
    description: 'Classic crystal jewel case CD with clear spine tray and 16-page lyric booklet. Accessible unit driver for Billboard pure sales.',
    unitManufacturingCost: 4,
    recommendedRetailPrice: 14,
    minRetailPrice: 9,
    maxRetailPrice: 28,
    countsForBillboard: true,
    demandMultiplier: 1.25,
    defaultVariantStyle: 'solid',
    supportsSignedOption: true
  },
  {
    id: 'cd_deluxe_zine',
    category: 'physical_music',
    name: 'Collector Hardcover Zine + CD Pack',
    shortLabel: 'Deluxe Zine + CD',
    description: '64-page cloth-bound studio photo zine book with exclusive CD disc and instant photo cards. Counts toward Billboard pure sales.',
    unitManufacturingCost: 9,
    recommendedRetailPrice: 26,
    minRetailPrice: 16,
    maxRetailPrice: 52,
    countsForBillboard: true,
    demandMultiplier: 1.28,
    defaultVariantStyle: 'solid',
    supportsSignedOption: true
  },
  {
    id: 'cassette_retro',
    category: 'physical_music',
    name: 'Limited Translucent Shell Cassette',
    shortLabel: 'Analog Cassette',
    description: 'High-bias ferric analog tape in a 5-screw tinted transparent shell with multi-panel J-card case. Counts toward Billboard pure sales.',
    unitManufacturingCost: 5,
    recommendedRetailPrice: 16,
    minRetailPrice: 10,
    maxRetailPrice: 34,
    countsForBillboard: true,
    demandMultiplier: 1.08,
    defaultVariantStyle: 'translucent',
    supportsSignedOption: false
  },
  {
    id: 'box_set_deluxe',
    category: 'physical_music',
    name: 'Ultimate Era Collector Box Set (2LP + Zine + CD)',
    shortLabel: 'Collector Box Set',
    description: 'Foil-stamped rigid slipcase containing the Exclusive Splatter LP, Deluxe Zine, and Collector CD. Counts as a verified Billboard album sale.',
    unitManufacturingCost: 36,
    recommendedRetailPrice: 90,
    minRetailPrice: 58,
    maxRetailPrice: 195,
    countsForBillboard: true,
    demandMultiplier: 0.86,
    defaultVariantStyle: 'splatter',
    supportsSignedOption: true
  },

  // 3. STANDALONE STREETWEAR APPAREL (Does NOT link to albums or count for Billboard)
  {
    id: 'apparel_hoodie',
    category: 'apparel',
    name: 'Heavyweight 480GSM Boxy Streetwear Hoodie',
    shortLabel: '480GSM Hoodie',
    description: 'Custom front & back drop-shoulder heavyweight fleece hoodie with custom puff-print typography, graphic motifs, and tour back print.',
    unitManufacturingCost: 24,
    recommendedRetailPrice: 75,
    minRetailPrice: 45,
    maxRetailPrice: 165,
    countsForBillboard: false,
    demandMultiplier: 0.95,
    defaultVariantStyle: 'solid',
    supportsSignedOption: false,
    supportsFrontBackView: true
  },
  {
    id: 'apparel_tshirt',
    category: 'apparel',
    name: 'Washed Vintage 260GSM Boxy Graphic Tee',
    shortLabel: 'Vintage Boxy Tee',
    description: 'Custom front & back enzyme-washed heavyweight cotton tee with custom chest graphic, vintage typography, and back tour print.',
    unitManufacturingCost: 12,
    recommendedRetailPrice: 38,
    minRetailPrice: 24,
    maxRetailPrice: 82,
    countsForBillboard: false,
    demandMultiplier: 1.18,
    defaultVariantStyle: 'solid',
    supportsSignedOption: false,
    supportsFrontBackView: true
  },
  {
    id: 'apparel_cap',
    category: 'apparel',
    name: 'Embroidered 6-Panel Streetwear Cap',
    shortLabel: 'Embroidered Cap',
    description: 'Washed cotton twill 6-panel cap with curved stitched visor, custom 3D chain-stitched front crest, and side embroidery.',
    unitManufacturingCost: 9,
    recommendedRetailPrice: 32,
    minRetailPrice: 20,
    maxRetailPrice: 64,
    countsForBillboard: false,
    demandMultiplier: 1.02,
    defaultVariantStyle: 'solid',
    supportsSignedOption: false,
    supportsFrontBackView: false
  },
  {
    id: 'apparel_jacket',
    category: 'apparel',
    name: 'Custom Chenille Wool & Leather Varsity Jacket',
    shortLabel: 'Varsity Jacket',
    description: 'Custom front & back heavyweight Melton wool body with contrast leather sleeves, 3D chenille monogram patch, and back embroidery.',
    unitManufacturingCost: 52,
    recommendedRetailPrice: 145,
    minRetailPrice: 90,
    maxRetailPrice: 310,
    countsForBillboard: false,
    demandMultiplier: 0.58,
    defaultVariantStyle: 'solid',
    supportsSignedOption: false,
    supportsFrontBackView: true
  },

  // 4. STANDALONE COLLECTOR ACCESSORIES (Does NOT link to albums or count for Billboard)
  {
    id: 'acc_poster',
    category: 'accessory',
    name: '18"x24" Foil-Stamped Archival Art Lithograph',
    shortLabel: 'Archival Lithograph',
    description: 'Museum-grade 300GSM framed exhibition art print with custom graphic/photo, metallic foil seal, and numbered edition stamp.',
    unitManufacturingCost: 6,
    recommendedRetailPrice: 24,
    minRetailPrice: 14,
    maxRetailPrice: 55,
    countsForBillboard: false,
    demandMultiplier: 1.04,
    defaultVariantStyle: 'solid',
    supportsSignedOption: true
  },
  {
    id: 'acc_tote',
    category: 'accessory',
    name: '16oz Heavy Canvas Streetwear Tote Bag',
    shortLabel: 'Heavy Canvas Tote',
    description: 'Reinforced gusseted canvas everyday tote bag with custom screen-printed front motif & typography.',
    unitManufacturingCost: 7,
    recommendedRetailPrice: 26,
    minRetailPrice: 16,
    maxRetailPrice: 52,
    countsForBillboard: false,
    demandMultiplier: 1.0,
    defaultVariantStyle: 'solid',
    supportsSignedOption: false
  },
  {
    id: 'acc_slipmat',
    category: 'accessory',
    name: 'Custom Audiophile Turntable Slipmat',
    shortLabel: 'Turntable Slipmat',
    description: 'Anti-static 12-inch audiophile turntable platter slipmat sublimated with custom emblem & typography.',
    unitManufacturingCost: 5,
    recommendedRetailPrice: 20,
    minRetailPrice: 12,
    maxRetailPrice: 44,
    countsForBillboard: false,
    demandMultiplier: 0.92,
    defaultVariantStyle: 'marble',
    supportsSignedOption: false
  }
];

export const BATCH_PRESSING_OPTIONS = [
  { units: 250, label: '250 Units', discount: 1.0, tag: 'Boutique Run' },
  { units: 1000, label: '1,000 Units', discount: 0.95, tag: 'Indie Pressing' },
  { units: 2500, label: '2,500 Units', discount: 0.91, tag: 'Standard Run' },
  { units: 5000, label: '5,000 Units', discount: 0.87, tag: 'Chart Push' },
  { units: 10000, label: '10,000 Units', discount: 0.83, tag: 'Major Distribution' },
  { units: 25000, label: '25,000 Units', discount: 0.79, tag: 'Global Blockbuster' },
  { units: 50000, label: '50,000 Units', discount: 0.75, tag: 'Stadium Era Run' }
];

export function getMerchFormatTemplate(formatId: MerchFormatId): MerchFormatTemplate {
  return (
    MERCH_FORMAT_TEMPLATES.find(t => t.id === formatId) || MERCH_FORMAT_TEMPLATES[0]
  );
}

export function getMerchSpecTierMeta(tier?: MerchSpecTier): MerchSpecTierMeta {
  return MERCH_SPEC_TIERS.find(t => t.id === tier) || MERCH_SPEC_TIERS[0];
}

export function isPhysicalMusicCategory(category: MerchCategory): boolean {
  return category === 'vinyl' || category === 'physical_music';
}

/**
 * Computes realistic D2C price elasticity, customer conversion penalty on overpriced merch,
 * and net artist profit per unit AFTER 18% D2C platform/label cut + $2.50 fulfillment fee.
 */
export function evaluateMerchPricingElasticity(
  template: MerchFormatTemplate,
  retailPrice: number,
  isSigned: boolean,
  isLimitedEdition: boolean,
  specTier: MerchSpecTier = 'standard'
): {
  elasticityMultiplier: number;
  benchmarkPrice: number;
  demandLabel: string;
  demandColor: string;
  profitPerUnit: number;
  netArtistTakePerUnit: number;
  platformAndFulfillmentCutPerUnit: number;
  marginPercent: number;
} {
  const tierMeta = getMerchSpecTierMeta(specTier);
  const effectiveBenchmark = Math.round(
    template.recommendedRetailPrice *
      (isSigned ? 1.18 : 1.0) *
      (isLimitedEdition ? 1.08 : 1.0) *
      (specTier === 'archive_collector'
        ? 1.16
        : specTier === 'deluxe_heavyweight'
        ? 1.08
        : 0.95)
  );

  const ratio = retailPrice / Math.max(1, effectiveBenchmark);
  let elasticityMultiplier = 1.0;
  let demandLabel = 'Optimal Market Price (100% Conv)';
  let demandColor = 'text-emerald-500';

  if (ratio <= 0.78) {
    elasticityMultiplier = 1.42;
    demandLabel = 'Fan-Friendly Deal (+42% Volume)';
    demandColor = 'text-emerald-400';
  } else if (ratio <= 0.94) {
    elasticityMultiplier = 1.16;
    demandLabel = 'Strong Value Price (+16% Volume)';
    demandColor = 'text-emerald-500';
  } else if (ratio <= 1.08) {
    elasticityMultiplier = 1.0;
    demandLabel = 'Balanced Market Price';
    demandColor = 'text-sky-400';
  } else if (ratio <= 1.22) {
    elasticityMultiplier = 0.52;
    demandLabel = 'Pricey / Slow Conversion (-48% Vol)';
    demandColor = 'text-amber-400';
  } else if (ratio <= 1.42) {
    elasticityMultiplier = 0.16;
    demandLabel = 'Overpriced / Fan Pushback (-84% Vol)';
    demandColor = 'text-rose-400';
  } else {
    // Severe penalty when player maxes out the price slider (e.g. $175 Hoodie)
    elasticityMultiplier = 0.03;
    demandLabel = 'Price Gouging / Fan Boycott (-97% Vol)';
    demandColor = 'text-rose-500 font-black';
  }

  const unitMfgCost = Math.round(
    template.unitManufacturingCost * tierMeta.costMultiplier
  );
  // Real D2C deductions: 18% platform/label distribution fee + 3.5% payment processing + $2.50 pick/pack fulfillment
  const platformAndFulfillmentCutPerUnit = Math.max(
    2,
    Math.round(retailPrice * 0.215 + 2.5)
  );
  const netArtistTakePerUnit = Math.max(
    0,
    retailPrice - platformAndFulfillmentCutPerUnit
  );
  const profitPerUnit = netArtistTakePerUnit - unitMfgCost;
  const marginPercent =
    retailPrice > 0 ? Math.round((profitPerUnit / retailPrice) * 100) : 0;

  return {
    elasticityMultiplier: elasticityMultiplier * tierMeta.demandMultiplier,
    benchmarkPrice: effectiveBenchmark,
    demandLabel,
    demandColor,
    profitPerUnit,
    netArtistTakePerUnit,
    platformAndFulfillmentCutPerUnit,
    marginPercent
  };
}

/**
 * Ensures `state.merchStore` is initialized with a clean structure.
 */
export function ensureMerchStoreState(state: GameState): MerchStoreState {
  const existing = (state as any).merchStore as MerchStoreState | undefined;
  const artistName = state.artist?.name || 'ARTIST';

  if (existing && Array.isArray(existing.items)) {
    return {
      ...existing,
      activePromoCampaign: existing.activePromoCampaign || 'none',
      totalPlatformAndFulfillmentFees:
        existing.totalPlatformAndFulfillmentFees || 0,
      totalWarehouseHoldingFees: existing.totalWarehouseHoldingFees || 0
    };
  }

  return {
    storeTitle: `${artistName.toUpperCase()} OFFICIAL STORE`,
    storeBannerSubtitle:
      'Official D2C Vinyl Pressings, Collector Box Sets & Custom Streetwear',
    accentColor: '#1ED760',
    activePromoCampaign: 'none',
    items: [],
    totalGrossRevenue: 0,
    totalPlatformAndFulfillmentFees: 0,
    totalWarehouseHoldingFees: 0,
    totalManufacturingCost: 0,
    totalNetProfit: 0,
    totalBillboardPureUnitsSold: 0,
    dailyRevenue: 0,
    dailyGrossSales: 0,
    dailyFeesAndOverhead: 0,
    dailyUnitsSold: 0,
    orderLogs: []
  };
}

/**
 * Creates a new custom Merch or Vinyl product and deducts upfront manufacturing cost.
 */
export function createNewMerchProduct(params: {
  state: GameState;
  formatId: MerchFormatId;
  customName: string;
  customSubtitle: string;
  linkedReleaseType: 'project' | 'song' | 'era' | 'standalone_merch';
  linkedReleaseId?: number;
  colorwayId: string;
  customPrimaryColor?: string;
  customSecondaryColor?: string;
  customVariantStyle?: MerchVariantStyle;
  specTier?: MerchSpecTier;
  hasObiStrip?: boolean;
  hypeStickerText?: string;
  apparelDesign?: ApparelCustomDesign;
  retailPrice: number;
  batchUnits: number;
  isLimitedEdition: boolean;
  isSigned: boolean;
}): {
  success: boolean;
  error?: string;
  updatedState: GameState;
  createdItem?: MerchProductItem;
} {
  const {
    state,
    formatId,
    customName,
    customSubtitle,
    linkedReleaseType,
    linkedReleaseId,
    colorwayId,
    customPrimaryColor,
    customSecondaryColor,
    customVariantStyle,
    specTier = 'deluxe_heavyweight',
    hasObiStrip = false,
    hypeStickerText,
    apparelDesign,
    retailPrice,
    batchUnits,
    isLimitedEdition,
    isSigned
  } = params;

  const template = getMerchFormatTemplate(formatId);
  const tierMeta = getMerchSpecTierMeta(specTier);
  const colorway =
    VINYL_AND_MERCH_COLORWAYS.find(c => c.id === colorwayId) ||
    VINYL_AND_MERCH_COLORWAYS[0];
  const batchMeta =
    BATCH_PRESSING_OPTIONS.find(b => b.units === batchUnits) ||
    BATCH_PRESSING_OPTIONS[1];

  const isPhysicalMusic = isPhysicalMusicCategory(template.category);

  const signedExtraCost = isSigned && template.supportsSignedOption ? 3 : 0;
  const obiExtraCost = isPhysicalMusic && hasObiStrip ? 1 : 0;
  const sleeveExtraCost =
    !isPhysicalMusic && apparelDesign?.hasSleevePrint ? 2 : 0;
  const backPrintExtraCost =
    !isPhysicalMusic &&
    apparelDesign?.backPrintStyle &&
    apparelDesign.backPrintStyle !== 'clean_blank'
      ? 3
      : 0;

  // Mold/setup tooling fee + unit pressing cost
  const setupToolingFee = isPhysicalMusic ? 450 : 300;
  const effectiveUnitCost = Math.max(
    3,
    Math.round(
      (template.unitManufacturingCost * tierMeta.costMultiplier +
        signedExtraCost +
        obiExtraCost +
        sleeveExtraCost +
        backPrintExtraCost) *
        batchMeta.discount
    )
  );
  const totalUpfrontCost = effectiveUnitCost * batchUnits + setupToolingFee;

  if ((state.money || 0) < totalUpfrontCost) {
    return {
      success: false,
      error: `Insufficient funds for production run + tooling ($${totalUpfrontCost.toLocaleString()} required).`,
      updatedState: state
    };
  }

  const artistName = state.artist?.name || 'Artist';
  let linkedReleaseTitle = `${artistName} Capsule`;
  let coverArt = state.artist?.image || '';
  let isPreOrderRelease = false;
  let scheduledReleaseDate: string | undefined = undefined;
  let finalLinkedType: 'project' | 'song' | 'era' | 'standalone_merch' =
    isPhysicalMusic ? linkedReleaseType : 'standalone_merch';
  let finalLinkedId: number | undefined = isPhysicalMusic
    ? linkedReleaseId
    : undefined;

  if (isPhysicalMusic) {
    if (linkedReleaseType === 'project' && linkedReleaseId !== undefined) {
      const proj = state.projects.find(p => p.id === linkedReleaseId);
      if (proj) {
        linkedReleaseTitle = proj.title;
        coverArt = proj.cover || coverArt;
        isPreOrderRelease = proj.status === 'scheduled';
        scheduledReleaseDate = proj.releaseDate;
      }
    } else if (linkedReleaseType === 'song' && linkedReleaseId !== undefined) {
      const sng = state.songs.find(s => s.id === linkedReleaseId);
      if (sng) {
        linkedReleaseTitle = sng.title;
        coverArt = sng.cover || coverArt;
        isPreOrderRelease = sng.status === 'scheduled';
        scheduledReleaseDate = sng.releaseDate;
      }
    } else {
      const latestProj = state.projects[state.projects.length - 1];
      const latestSong = state.songs[state.songs.length - 1];
      if (latestProj) {
        linkedReleaseTitle = latestProj.title;
        coverArt = latestProj.cover || coverArt;
        finalLinkedType = 'project';
        finalLinkedId = latestProj.id;
        isPreOrderRelease = latestProj.status === 'scheduled';
        scheduledReleaseDate = latestProj.releaseDate;
      } else if (latestSong) {
        linkedReleaseTitle = latestSong.title;
        coverArt = latestSong.cover || coverArt;
        finalLinkedType = 'song';
        finalLinkedId = latestSong.id;
        isPreOrderRelease = latestSong.status === 'scheduled';
        scheduledReleaseDate = latestSong.releaseDate;
      }
    }
  } else {
    linkedReleaseTitle =
      apparelDesign?.frontText?.trim() || `${artistName.toUpperCase()} ARCHIVE`;
    if (
      apparelDesign?.graphicMotif === 'custom_photo' &&
      apparelDesign.customGraphicUrl
    ) {
      coverArt = apparelDesign.customGraphicUrl;
    }
  }

  const finalPrimary = customPrimaryColor || colorway.primaryColor;
  const finalSecondary = customSecondaryColor || colorway.secondaryColor;
  const finalVariantStyle: MerchVariantStyle =
    template.id === 'vinyl_picture'
      ? 'picture_disc'
      : customVariantStyle || colorway.variantStyle;

  const isCustomColors =
    (customPrimaryColor && customPrimaryColor !== colorway.primaryColor) ||
    (customSecondaryColor && customSecondaryColor !== colorway.secondaryColor);

  const finalColorwayName = isCustomColors
    ? `Bespoke Palette (${finalPrimary.toUpperCase()})`
    : colorway.name;

  const defaultTitle =
    customName.trim() ||
    (isPhysicalMusic
      ? `${linkedReleaseTitle} — ${isSigned ? 'Signed ' : ''}${template.shortLabel}`
      : `${
          apparelDesign?.frontText?.trim() || artistName
        } — ${template.shortLabel}`);

  const defaultSub =
    customSubtitle.trim() ||
    `${finalColorwayName} • ${tierMeta.shortTag}${
      isLimitedEdition ? ' • Limited Run' : ''
    }`;

  const store = ensureMerchStoreState(state);
  const newItem: MerchProductItem = {
    id: `merch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: defaultTitle,
    subtitle: defaultSub,
    category: template.category,
    formatId: template.id,
    formatLabel: template.shortLabel,
    linkedReleaseType: finalLinkedType,
    linkedReleaseId: finalLinkedId,
    linkedReleaseTitle,
    isPreOrderRelease: isPhysicalMusic ? isPreOrderRelease : false,
    scheduledReleaseDate: isPhysicalMusic ? scheduledReleaseDate : undefined,
    coverArt,
    colorwayId: isCustomColors ? 'custom' : colorway.id,
    colorwayName: finalColorwayName,
    primaryColor: finalPrimary,
    secondaryColor: finalSecondary,
    variantStyle: finalVariantStyle,
    specTier,
    hasObiStrip: isPhysicalMusic && (hasObiStrip || specTier === 'archive_collector'),
    hypeStickerText: isPhysicalMusic
      ? hypeStickerText ||
        (isSigned
          ? 'INCLUDES SIGNED ART CARD'
          : isLimitedEdition
          ? 'LIMITED EDITION PRESSING'
          : '180G AUDIOPHILE VINYL')
      : undefined,
    apparelDesign: !isPhysicalMusic ? apparelDesign : undefined,
    maxPerCustomer: 4,
    unitCost: effectiveUnitCost,
    retailPrice: Math.max(template.minRetailPrice, Math.round(retailPrice)),
    stockRemaining: batchUnits,
    totalPressed: batchUnits,
    totalSold: 0,
    dailySold: 0,
    preOrdersAccumulated: 0,
    totalRevenue: 0,
    totalGrossSales: 0,
    totalManufacturingSpent: totalUpfrontCost,
    daysActiveOnStore: 0,
    saturationPercent: 0,
    demandPhaseLabel: 'Launch Drop Window',
    isLimitedEdition,
    isSigned: isSigned && template.supportsSignedOption,
    isBundle: template.id === 'box_set_deluxe',
    countsForBillboard:
      isPhysicalMusic &&
      template.countsForBillboard &&
      (finalLinkedType === 'project' || finalLinkedType === 'song'),
    createdAtDate: state.date.split('T')[0]
  };

  const updatedStore: MerchStoreState = {
    ...store,
    items: [newItem, ...store.items],
    totalManufacturingCost: store.totalManufacturingCost + totalUpfrontCost,
    totalNetProfit:
      store.totalGrossRevenue -
      (store.totalPlatformAndFulfillmentFees || 0) -
      (store.totalWarehouseHoldingFees || 0) -
      (store.totalManufacturingCost + totalUpfrontCost)
  };

  return {
    success: true,
    createdItem: newItem,
    updatedState: {
      ...state,
      money: state.money - totalUpfrontCost,
      merchStore: updatedStore
    } as GameState
  };
}

/**
 * Restocks an existing non-limited merch item.
 */
export function restockMerchProduct(
  state: GameState,
  productId: string,
  additionalUnits: number
): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const store = ensureMerchStoreState(state);
  const target = store.items.find(i => i.id === productId);
  if (!target) {
    return { success: false, error: 'Product not found.', updatedState: state };
  }
  if (target.isLimitedEdition) {
    return {
      success: false,
      error: 'Limited Edition pressings cannot be restocked once pressed.',
      updatedState: state
    };
  }

  const batchMeta =
    BATCH_PRESSING_OPTIONS.find(b => b.units === additionalUnits) ||
    BATCH_PRESSING_OPTIONS[1];
  const template = getMerchFormatTemplate(target.formatId);
  const tierMeta = getMerchSpecTierMeta(target.specTier);
  const restockUnitCost = Math.max(
    3,
    Math.round(
      template.unitManufacturingCost * tierMeta.costMultiplier * batchMeta.discount
    )
  );
  const totalCost = restockUnitCost * additionalUnits + 150;

  if ((state.money || 0) < totalCost) {
    return {
      success: false,
      error: `Insufficient funds to press ${additionalUnits.toLocaleString()} units ($${totalCost.toLocaleString()} needed).`,
      updatedState: state
    };
  }

  const updatedItems = store.items.map(item => {
    if (item.id !== productId) return item;
    return {
      ...item,
      stockRemaining: item.stockRemaining + additionalUnits,
      totalPressed: item.totalPressed + additionalUnits,
      totalManufacturingSpent: item.totalManufacturingSpent + totalCost
    };
  });

  const newTotalMfg = store.totalManufacturingCost + totalCost;
  return {
    success: true,
    updatedState: {
      ...state,
      money: state.money - totalCost,
      merchStore: {
        ...store,
        items: updatedItems,
        totalManufacturingCost: newTotalMfg,
        totalNetProfit:
          store.totalGrossRevenue -
          (store.totalPlatformAndFulfillmentFees || 0) -
          (store.totalWarehouseHoldingFees || 0) -
          newTotalMfg
      }
    } as GameState
  };
}

/**
 * Updates the retail price of an active webstore item.
 */
export function updateMerchProductPrice(
  state: GameState,
  productId: string,
  newRetailPrice: number
): GameState {
  const store = ensureMerchStoreState(state);
  const updatedItems = store.items.map(item => {
    if (item.id !== productId) return item;
    const template = getMerchFormatTemplate(item.formatId);
    const clampedPrice = Math.max(
      template.minRetailPrice,
      Math.min(template.maxRetailPrice, Math.round(newRetailPrice))
    );
    return {
      ...item,
      retailPrice: clampedPrice
    };
  });

  return {
    ...state,
    merchStore: {
      ...store,
      items: updatedItems
    }
  } as GameState;
}

/**
 * Toggles the active D2C storefront marketing/promo campaign.
 */
export function setMerchStorePromoCampaign(
  state: GameState,
  campaignId: MerchPromoCampaignId
): GameState {
  const store = ensureMerchStoreState(state);
  return {
    ...state,
    merchStore: {
      ...store,
      activePromoCampaign: campaignId
    }
  } as GameState;
}

/**
 * Archives/removes a product from the active storefront.
 */
export function removeMerchProductFromStore(
  state: GameState,
  productId: string
): GameState {
  const store = ensureMerchStoreState(state);
  return {
    ...state,
    merchStore: {
      ...store,
      items: store.items.filter(i => i.id !== productId)
    }
  } as GameState;
}

/**
 * Simulates daily Official Artist Webstore orders with realistic D2C economics:
 * - Fanbase Buying Pool & Product Saturation (core fans don't buy the same item twice)
 * - Multi-SKU Cannibalization (having 15 items splits the daily fan wallet across SKUs)
 * - Steep Price Elasticity & Overpricing Boycott Penalty
 * - Drop Recency Decay (3-day drop rush -> steady era demand -> long-tail archive trickle)
 * - Full E-Commerce Deductions (18% Label/Platform Cut + 3.5% Payment Fee + $2.50/unit Pick-Pack + Daily Warehouse Storage Cost + Ad Campaign Spend)
 */
export function processDailyMerchWebstoreStep(
  state: GameState,
  currentDate: Date
): {
  updatedStore: MerchStoreState;
  updatedProjects: Project[];
  updatedSongs: Song[];
  dailyMerchRevenue: number;
  dailyBillboardUnitsAdded: number;
  dailyHypeBonus: number;
} {
  const store = ensureMerchStoreState(state);
  if (!store.items || store.items.length === 0) {
    return {
      updatedStore: store,
      updatedProjects: state.projects,
      updatedSongs: state.songs,
      dailyMerchRevenue: 0,
      dailyBillboardUnitsAdded: 0,
      dailyHypeBonus: 0
    };
  }

  const activeCampaign =
    MERCH_PROMO_CAMPAIGNS.find(c => c.id === store.activePromoCampaign) ||
    MERCH_PROMO_CAMPAIGNS[0];

  const dateStr = currentDate.toISOString().split('T')[0];
  const fans = Math.max(100, state.fans || 500);
  const popularity = Math.max(1, state.popularity || 5);
  const hype = Math.max(5, state.hype || 15);

  // Count how many in-stock SKUs are competing for the fan wallet today (Cannibalization factor)
  const inStockSkuCount = Math.max(
    1,
    store.items.filter(i => i.stockRemaining > 0).length
  );
  const skuCannibalizationFactor = 1 / Math.pow(inStockSkuCount, 0.58);

  const projectSalesAddMap = new Map<number, number>();
  const songSalesAddMap = new Map<number, number>();

  let dailyGrossSalesTotal = 0;
  let dailyPlatformAndFulfillmentTotal = 0;
  let dailyWarehouseHoldingTotal = 0;
  let dailyNetArtistPayoutTotal = 0;
  let dailyUnitsSoldTotal = 0;
  let dailyBillboardUnitsAdded = 0;
  const newLogs: MerchOrderLogEntry[] = [];

  const projectMap = new Map<number, Project>();
  state.projects.forEach(p => projectMap.set(p.id, p));
  const songMap = new Map<number, Song>();
  state.songs.forEach(s => songMap.set(s.id, s));

  const updatedItems = store.items.map((item, idx) => {
    const template = getMerchFormatTemplate(item.formatId);
    const isPhysMusic = isPhysicalMusicCategory(item.category);
    const daysActive = (item.daysActiveOnStore || 0) + 1;

    const linkedProj =
      isPhysMusic &&
      item.linkedReleaseType === 'project' &&
      item.linkedReleaseId !== undefined
        ? projectMap.get(item.linkedReleaseId)
        : undefined;
    const linkedSong =
      isPhysMusic &&
      item.linkedReleaseType === 'song' &&
      item.linkedReleaseId !== undefined
        ? songMap.get(item.linkedReleaseId)
        : undefined;

    const isStillScheduled = Boolean(
      isPhysMusic &&
        ((linkedProj && linkedProj.status === 'scheduled') ||
          (linkedSong && linkedSong.status === 'scheduled'))
    );

    let shippedPreOrderUnitsToday = 0;

    // 1. Pre-order release day wave (Physical music only)
    if (isPhysMusic && !isStillScheduled && item.preOrdersAccumulated > 0) {
      shippedPreOrderUnitsToday = item.preOrdersAccumulated;
      if (item.countsForBillboard) {
        dailyBillboardUnitsAdded += shippedPreOrderUnitsToday;
        if (linkedProj) {
          projectSalesAddMap.set(
            linkedProj.id,
            (projectSalesAddMap.get(linkedProj.id) || 0) + shippedPreOrderUnitsToday
          );
          const focusId = linkedProj.focusTrackId || linkedProj.songs?.[0]?.id;
          if (focusId !== undefined) {
            songSalesAddMap.set(
              focusId,
              (songSalesAddMap.get(focusId) || 0) +
                Math.round(shippedPreOrderUnitsToday * 0.35)
            );
          }
        } else if (linkedSong) {
          songSalesAddMap.set(
            linkedSong.id,
            (songSalesAddMap.get(linkedSong.id) || 0) + shippedPreOrderUnitsToday
          );
        }
      }

      newLogs.push({
        id: `log_prewave_${item.id}_${dateStr}`,
        date: dateStr,
        productId: item.id,
        productName: `${item.name} (Day-1 Pre-Order Wave Shipped)`,
        formatLabel: item.formatLabel,
        unitsSold: shippedPreOrderUnitsToday,
        grossRevenue: 0,
        netPayout: 0,
        countedForBillboard: item.countsForBillboard,
        isPreOrderWave: true
      });
    }

    if (item.stockRemaining <= 0) {
      return {
        ...item,
        daysActiveOnStore: daysActive,
        demandPhaseLabel: 'Sold Out',
        isPreOrderRelease: isStillScheduled,
        dailySold: shippedPreOrderUnitsToday,
        preOrdersAccumulated: isStillScheduled ? item.preOrdersAccumulated : 0
      };
    }

    // 2. Daily Warehouse Holding Fee (capped so large inventory never drains personal bank balance)
    const itemHoldingFee = Math.min(120, Math.round((item.stockRemaining / 1000) * 0.25));
    dailyWarehouseHoldingTotal += itemHoldingFee;

    // 3. Calculate realistic daily D2C conversion pool
    const effectiveCheckoutPrice = Math.max(
      template.minRetailPrice,
      Math.round(item.retailPrice * activeCampaign.priceMultiplier)
    );

    const pricingEval = evaluateMerchPricingElasticity(
      template,
      effectiveCheckoutPrice,
      item.isSigned,
      item.isLimitedEdition,
      item.specTier || 'standard'
    );

    // Core buyer pool: only ~12% of total fans + popularity reach ever buy a single merch SKU
    const maxPotentialBuyerPool = Math.max(
      250,
      Math.round(fans * 0.12 + Math.pow(popularity, 1.55) * 18)
    );
    const saturationRatio = Math.min(
      1,
      item.totalSold / Math.max(1, maxPotentialBuyerPool)
    );
    const saturationDecay = Math.max(0.06, Math.pow(1 - saturationRatio * 0.88, 1.65));

    // Drop recency & era momentum curve
    let dropLifecycleMult = 1.0;
    let demandPhaseLabel = 'Steady Catalog Demand';

    if (pricingEval.elasticityMultiplier <= 0.06) {
      demandPhaseLabel = 'Overpriced Boycott (-97%)';
    } else if (saturationRatio >= 0.82) {
      dropLifecycleMult = 0.22;
      demandPhaseLabel = 'Fanbase Saturated';
    } else if (daysActive <= 3) {
      dropLifecycleMult = 1.55;
      demandPhaseLabel = 'Launch Drop Rush (Day 1–3)';
    } else if (daysActive <= 10) {
      dropLifecycleMult = 1.05;
      demandPhaseLabel = 'Active Drop Window';
    } else if (daysActive <= 28) {
      dropLifecycleMult = 0.58;
      demandPhaseLabel = 'Mid-Era Demand';
    } else {
      dropLifecycleMult = 0.25;
      demandPhaseLabel = 'Long-Tail Archive';
    }

    // Bonus if linked to a scheduled pre-order or first-week release
    if (isStillScheduled) {
      dropLifecycleMult *= 1.22;
      if (pricingEval.elasticityMultiplier > 0.2) {
        demandPhaseLabel = 'Pre-Order Campaign Active';
      }
    } else if (linkedProj && linkedProj.status === 'released') {
      const relDate = linkedProj.releaseDate
        ? new Date(linkedProj.releaseDate)
        : currentDate;
      const daysSince = Math.max(
        0,
        Math.floor((currentDate.getTime() - relDate.getTime()) / 86400000)
      );
      if (daysSince <= 7) {
        dropLifecycleMult *= 1.45;
        if (pricingEval.elasticityMultiplier > 0.2) {
          demandPhaseLabel = 'Release Week Chart Push';
        }
      }
    }

    // Calibrated base daily conversion (prevents runaway $100k+/day exploit!)
    const dailyBaseBuyers =
      Math.pow(fans, 0.52) * 0.065 +
      Math.pow(popularity, 1.22) * 0.28 +
      Math.pow(hype, 1.1) * 0.16;

    const scarcityBoost =
      (item.isLimitedEdition ? 1.18 : 1.0) *
      (item.isSigned ? 1.24 : 1.0) *
      (item.hasObiStrip ? 1.05 : 1.0);

    const campaignMult =
      activeCampaign.demandMultiplier *
      (isPhysMusic && item.countsForBillboard
        ? activeCampaign.billboardConversionBoost
        : 1.0);

    const variance = 0.88 + (((currentDate.getDate() * 13 + idx * 7) % 25) / 100);

    const rawDesiredUnits = Math.max(
      0,
      Math.round(
        dailyBaseBuyers *
          template.demandMultiplier *
          pricingEval.elasticityMultiplier *
          saturationDecay *
          dropLifecycleMult *
          skuCannibalizationFactor *
          scarcityBoost *
          campaignMult *
          variance
      )
    );

    const unitsSoldToday = Math.min(item.stockRemaining, rawDesiredUnits);
    const grossSalesToday = unitsSoldToday * effectiveCheckoutPrice;

    // Deductions: 18% label/platform cut + 3.5% payment processing + $2.50/unit pick-pack + 2% returns reserve
    const unitPlatformAndFulfillment = Math.max(
      2,
      Math.round(effectiveCheckoutPrice * 0.235 + 2.5)
    );
    const totalDeductionsToday = unitsSoldToday * unitPlatformAndFulfillment;
    const netArtistRevenueToday = Math.max(0, grossSalesToday - totalDeductionsToday);

    dailyGrossSalesTotal += grossSalesToday;
    dailyPlatformAndFulfillmentTotal += totalDeductionsToday;
    dailyNetArtistPayoutTotal += netArtistRevenueToday;
    dailyUnitsSoldTotal += unitsSoldToday;

    // Strictly ONLY physical music (Vinyl/CD/Cassette/Box Set) counts toward Billboard pure sales
    if (isPhysMusic && !isStillScheduled && item.countsForBillboard && unitsSoldToday > 0) {
      dailyBillboardUnitsAdded += unitsSoldToday;
      if (linkedProj) {
        projectSalesAddMap.set(
          linkedProj.id,
          (projectSalesAddMap.get(linkedProj.id) || 0) + unitsSoldToday
        );
        const focusId = linkedProj.focusTrackId || linkedProj.songs?.[0]?.id;
        if (focusId !== undefined) {
          songSalesAddMap.set(
            focusId,
            (songSalesAddMap.get(focusId) || 0) + Math.round(unitsSoldToday * 0.25)
          );
        }
      } else if (linkedSong) {
        songSalesAddMap.set(
          linkedSong.id,
          (songSalesAddMap.get(linkedSong.id) || 0) + unitsSoldToday
        );
      }
    }

    if (unitsSoldToday > 0) {
      newLogs.push({
        id: `log_${item.id}_${dateStr}`,
        date: dateStr,
        productId: item.id,
        productName: isStillScheduled ? `${item.name} (Pre-Order)` : item.name,
        formatLabel: item.formatLabel,
        unitsSold: unitsSoldToday,
        grossRevenue: grossSalesToday,
        netPayout: netArtistRevenueToday,
        feesDeducted: totalDeductionsToday,
        countedForBillboard: isPhysMusic && !isStillScheduled && item.countsForBillboard
      });
    }

    const newTotalSold = item.totalSold + unitsSoldToday;
    const updatedSaturationPct = Math.min(
      100,
      Math.round((newTotalSold / Math.max(1, maxPotentialBuyerPool)) * 100)
    );

    return {
      ...item,
      daysActiveOnStore: daysActive,
      saturationPercent: updatedSaturationPct,
      demandPhaseLabel,
      isPreOrderRelease: isStillScheduled,
      countsForBillboard: isPhysMusic ? item.countsForBillboard : false,
      stockRemaining: item.stockRemaining - unitsSoldToday,
      totalSold: newTotalSold,
      dailySold: unitsSoldToday + shippedPreOrderUnitsToday,
      preOrdersAccumulated: isStillScheduled
        ? item.preOrdersAccumulated + unitsSoldToday
        : 0,
      totalGrossSales: (item.totalGrossSales || 0) + grossSalesToday,
      totalRevenue: item.totalRevenue + netArtistRevenueToday
    };
  });

  // Deduct daily marketing campaign ad spend & warehouse holding fees from today's net store payout
  // Overhead is deducted from store revenue rather than draining the artist's personal bank account below $0
  const campaignAdSpendToday =
    inStockSkuCount > 0 && dailyUnitsSoldTotal > 0 ? activeCampaign.dailyAdSpend : 0;
  const effectiveOverheadDeducted = Math.min(
    dailyNetArtistPayoutTotal,
    dailyWarehouseHoldingTotal + campaignAdSpendToday
  );
  const finalDailyMerchNetIncome = Math.max(
    0,
    dailyNetArtistPayoutTotal - effectiveOverheadDeducted
  );

  // Apply Billboard pure sales credits to Projects and Songs
  const updatedProjects = state.projects.map(proj => {
    const bonusUnits = projectSalesAddMap.get(proj.id) || 0;
    if (bonusUnits <= 0) return proj;
    return {
      ...proj,
      pureSales: (proj.pureSales || 0) + bonusUnits,
      dailyPureSales: (proj.dailyPureSales || 0) + bonusUnits,
      weeklyPureSales: (proj.weeklyPureSales || 0) + bonusUnits
    };
  });

  const updatedSongs = state.songs.map(song => {
    const bonusUnits = songSalesAddMap.get(song.id) || 0;
    if (bonusUnits <= 0) return song;
    return {
      ...song,
      pureSales: (song.pureSales || 0) + bonusUnits,
      dailyPureSales: (song.dailyPureSales || 0) + bonusUnits,
      weeklyPureSales: (song.weeklyPureSales || 0) + bonusUnits
    };
  });

  const newTotalGross = store.totalGrossRevenue + dailyGrossSalesTotal;
  const newTotalFees =
    (store.totalPlatformAndFulfillmentFees || 0) +
    dailyPlatformAndFulfillmentTotal +
    campaignAdSpendToday;
  const newTotalHolding =
    (store.totalWarehouseHoldingFees || 0) + dailyWarehouseHoldingTotal;

  const updatedStore: MerchStoreState = {
    ...store,
    items: updatedItems,
    totalGrossRevenue: newTotalGross,
    totalPlatformAndFulfillmentFees: newTotalFees,
    totalWarehouseHoldingFees: newTotalHolding,
    totalNetProfit:
      newTotalGross - newTotalFees - newTotalHolding - store.totalManufacturingCost,
    totalBillboardPureUnitsSold:
      store.totalBillboardPureUnitsSold + dailyBillboardUnitsAdded,
    dailyRevenue: Math.max(0, finalDailyMerchNetIncome),
    dailyGrossSales: dailyGrossSalesTotal,
    dailyFeesAndOverhead:
      dailyPlatformAndFulfillmentTotal +
      dailyWarehouseHoldingTotal +
      campaignAdSpendToday,
    dailyUnitsSold: dailyUnitsSoldTotal,
    orderLogs: [...newLogs, ...(store.orderLogs || [])].slice(0, 45)
  };

  const dailyHypeBonus =
    dailyUnitsSoldTotal > 300 ? 0.25 : dailyUnitsSoldTotal > 60 ? 0.1 : 0;

  return {
    updatedStore,
    updatedProjects,
    updatedSongs,
    dailyMerchRevenue: finalDailyMerchNetIncome,
    dailyBillboardUnitsAdded,
    dailyHypeBonus
  };
}
