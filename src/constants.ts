import { NPC } from './types';
import { DETAILED_NPCS } from './data/npcAssets';
import { generateTypographyCover } from './data/typographyCoverGenerator';

export const COUNTRY_TIERS: Record<string, number> = {
  'US': 1, 'GB': 1, 'JP': 1, 'KR': 1, 'DE': 1, 'FR': 1, 'CA': 1, 'AU': 1, 'CH': 1, 'DK': 1, 'NO': 1, 'FI': 1, 'NZ': 1, 'IE': 1, 'SG': 1, 'NL': 1, 'SE': 1,
  'ID': 2, 'BR': 2, 'IN': 2, 'MX': 2, 'PH': 2, 'VN': 2, 'TR': 2, 'TH': 2, 'MY': 2, 'TW': 2, 'IT': 2, 'ES': 2, 'SA': 2, 'AE': 2, 'BE': 2, 'AT': 2, 'IL': 2,
  'AR': 3, 'NG': 3, 'CO': 3, 'PL': 3, 'ZA': 3, 'EG': 3, 'CL': 3, 'PE': 3, 'RU': 3, 'UA': 3, 'PK': 3, 'BD': 3, 'KE': 3, 'MA': 3, 'DZ': 3, 'VE': 3, 'EC': 3, 'RO': 3, 'GR': 3, 'PT': 3, 'CZ': 3, 'HU': 3
};

export const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'GB': 'United Kingdom', 'JP': 'Japan', 'KR': 'South Korea',
  'DE': 'Germany', 'FR': 'France', 'CA': 'Canada', 'AU': 'Australia', 'CH': 'Switzerland',
  'DK': 'Denmark', 'NO': 'Norway', 'FI': 'Finland', 'NZ': 'New Zealand', 'IE': 'Ireland',
  'SG': 'Singapore', 'NL': 'Netherlands', 'SE': 'Sweden',
  'ID': 'Indonesia', 'BR': 'Brazil', 'IN': 'India', 'MX': 'Mexico',
  'PH': 'Philippines', 'VN': 'Vietnam', 'TR': 'Turkey', 'TH': 'Thailand',
  'MY': 'Malaysia', 'TW': 'Taiwan', 'IT': 'Italy', 'ES': 'Spain',
  'SA': 'Saudi Arabia', 'AE': 'United Arab Emirates', 'BE': 'Belgium', 'AT': 'Austria', 'IL': 'Israel',
  'AR': 'Argentina', 'NG': 'Nigeria', 'CO': 'Colombia', 'PL': 'Poland',
  'ZA': 'South Africa', 'EG': 'Egypt', 'CL': 'Chile', 'PE': 'Peru', 'RU': 'Russia',
  'UA': 'Ukraine', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'KE': 'Kenya', 'MA': 'Morocco',
  'DZ': 'Algeria', 'VE': 'Venezuela', 'EC': 'Ecuador', 'RO': 'Romania', 'GR': 'Greece',
  'PT': 'Portugal', 'CZ': 'Czech Republic', 'HU': 'Hungary'
};

export const NPCS: NPC[] = DETAILED_NPCS;

export const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
export const formatNum = (val: number) => new Intl.NumberFormat('en-US', {notation: "compact", compactDisplay: "short"}).format(Math.floor(val));
export const formatNumFull = (val: number) => new Intl.NumberFormat('en-US').format(Math.floor(val));
export const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

export const SPOTIFY_PLAYLISTS = [
  { id: 'tth', name: "Today's Top Hits", followers: 34500000, reqPop: 80, cover: generateTypographyCover("Today's Top Hits", 'Spotify'), desc: 'The biggest hits right now.' },
  { id: 'nmf', name: "New Music Friday", followers: 4200000, reqPop: 15, cover: generateTypographyCover("New Music Friday", 'Spotify'), desc: 'The best new releases.' },
  { id: 'rc', name: "RapCaviar", followers: 15800000, reqPop: 50, cover: generateTypographyCover("RapCaviar", 'Spotify'), desc: 'Hip-Hop\'s biggest playlist.' },
  { id: 'pr', name: "Pop Rising", followers: 3100000, reqPop: 30, cover: generateTypographyCover("Pop Rising", 'Spotify'), desc: 'The hits of tomorrow.' },
  { id: 'v50', name: "Viral 50 - Global", followers: 2800000, reqPop: 5, cover: generateTypographyCover("Viral 50 - Global", 'Spotify'), desc: 'What\'s trending globally.' },
];
