/**
 * Converts a 2-letter ISO country code to an emoji flag.
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getTierBadge(tier?: number): { label: string; color: string; bg: string } {
  switch (tier) {
    case 1:
      return { label: 'Tier 1 Market', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' };
    case 2:
      return { label: 'Tier 2 Market', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' };
    case 3:
    default:
      return { label: 'Tier 3 Market', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' };
  }
}
