import type { GameState } from '../types';

export interface DailyExpenseItem {
  id: string;
  title: string;
  category: 'recurring' | 'operational';
  amount: number;
  rawAmount?: number;
  description: string;
  detailBadge?: string;
  icon: string;
}

export interface DailyExpensesBreakdown {
  /** Total recurring daily overhead after hiatus discount (deducted from money daily) */
  effectiveRecurringExpense: number;
  /** Raw recurring daily overhead before hiatus discount */
  rawRecurringExpense: number;
  /** Amount saved today due to Hiatus mode (-80%) */
  hiatusSavings: number;
  /** Operational deductions today (Collab royalties, Merch warehouse/ads, Tour show costs) */
  operationalDeductionsToday: number;
  /** Combined total of recurring expenses + operational deductions */
  totalAllExpensesToday: number;
  /** Net cashflow added to player's funds today (dailyIncome - effectiveRecurringExpense) */
  netDailyCashflow: number;
  /** Breakdown of recurring daily expenses */
  recurringItems: DailyExpenseItem[];
  /** Breakdown of operational & revenue-split deductions today */
  operationalItems: DailyExpenseItem[];
}

/**
 * Calculates a realistic, itemized breakdown of the player's daily expenses.
 */
export function calculateDailyExpensesBreakdown(state: GameState): DailyExpensesBreakdown {
  const popularity = Math.max(0, Number(state.popularity) || 0);
  const tier = Math.max(1, Number(state.artist?.tier) || 3);
  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const releasedProjects = (state.projects || []).filter(p => p.status === 'released');
  const isHiatus = Boolean(state.isHiatus);

  // 1. Living & Personal Lifestyle
  // Starts at $65/day for indie artists, scales gently with popularity up to ~$385/day
  const livingRaw = Math.round(65 + popularity * 3.2);

  // 2. Studio & Equipment Maintenance
  // Base $40/day for DAW, vocal booth, & hardware upkeep + $6 per released project (max $160)
  const studioRaw = Math.min(160, Math.round(40 + releasedProjects.length * 6 + popularity * 0.8));

  // 3. Management, Legal & PR Retainer
  // Base $30/day for booking & clearance team, scales modestly with popularity
  const managementRaw = Math.round(30 + popularity * 1.8 + (tier === 1 ? 35 : tier === 2 ? 15 : 0));

  // 4. Digital Distribution & Catalog Hosting
  // Base $15/day + $3 per released song (capped at $135/day)
  const distributionRaw = Math.min(135, Math.round(15 + releasedSongs.length * 3));

  // 5. Security & Entourage Detail
  // $0 for emerging artists (<20% popularity); scales from $35 to $220/day for stars
  const securityRaw = popularity >= 20
    ? Math.round(35 + (popularity - 20) * 2.3)
    : 0;

  const rawRecurringExpense = livingRaw + studioRaw + managementRaw + distributionRaw + securityRaw;
  const discountMultiplier = isHiatus ? 0.2 : 1.0;

  const livingEffective = Math.round(livingRaw * discountMultiplier);
  const studioEffective = Math.round(studioRaw * discountMultiplier);
  const managementEffective = Math.round(managementRaw * discountMultiplier);
  const distributionEffective = Math.round(distributionRaw * discountMultiplier);
  const securityEffective = Math.round(securityRaw * discountMultiplier);

  const effectiveRecurringExpense =
    livingEffective +
    studioEffective +
    managementEffective +
    distributionEffective +
    securityEffective;

  const hiatusSavings = Math.max(0, rawRecurringExpense - effectiveRecurringExpense);

  const recurringItems: DailyExpenseItem[] = [
    {
      id: 'living_lifestyle',
      title: 'Living & Personal Lifestyle',
      category: 'recurring',
      amount: livingEffective,
      rawAmount: livingRaw,
      description: 'Daily living costs, local transit, and standard artist accommodation.',
      detailBadge: popularity >= 60 ? 'A-List Lifestyle' : popularity >= 25 ? 'Rising Artist' : 'Indie Standard',
      icon: 'ph-house-line'
    },
    {
      id: 'studio_maintenance',
      title: 'Studio & Gear Upkeep',
      category: 'recurring',
      amount: studioEffective,
      rawAmount: studioRaw,
      description: 'Recording gear maintenance, DAW plugin licenses, microphones, and vocal booth upkeep.',
      detailBadge: `${releasedProjects.length} Released Projects`,
      icon: 'ph-sliders-horizontal'
    },
    {
      id: 'management_pr',
      title: 'Management, Legal & PR Retainer',
      category: 'recurring',
      amount: managementEffective,
      rawAmount: managementRaw,
      description: 'Daily retainer for artist management, music clearance attorneys, and PR publicists.',
      detailBadge: `Pop ${popularity.toFixed(1)}%`,
      icon: 'ph-briefcase'
    },
    {
      id: 'catalog_hosting',
      title: 'Catalog Distribution & Server',
      category: 'recurring',
      amount: distributionEffective,
      rawAmount: distributionRaw,
      description: 'Master audio cloud hosting, ISRC/UPC registry maintenance, and global DSP delivery.',
      detailBadge: `${releasedSongs.length} Active Tracks`,
      icon: 'ph-cloud-check'
    },
    {
      id: 'security_entourage',
      title: 'Security & Personal Entourage',
      category: 'recurring',
      amount: securityEffective,
      rawAmount: securityRaw,
      description: popularity >= 20
        ? 'Personal bodyguards and road assistance required for high-profile public appearances.'
        : 'Not required yet (activates automatically at 20%+ Popularity).',
      detailBadge: popularity >= 20 ? 'Active Guard' : 'Inactive (<20% Pop)',
      icon: 'ph-shield-star'
    }
  ];

  // --- OPERATIONAL & REVENUE-SPLIT DEDUCTIONS TODAY ---
  // 1. Collaborator Royalty Splits paid today
  const collabSongsActive = releasedSongs.filter(s => s.collabId && s.collabId !== 'none' && (s.collabRoyaltyPaidToday || 0) > 0);
  const collabRoyaltyToday = collabSongsActive.reduce(
    (sum, s) => sum + Math.max(0, Math.round(Number(s.collabRoyaltyPaidToday) || 0)),
    0
  );

  // 2. Merch Warehouse Holding & Active Campaign Ads
  const merchStore = state.merchStore;
  let merchWarehouseFeeToday = 0;
  let merchAdSpendToday = 0;
  if (merchStore) {
    const items = Array.isArray(merchStore.items) ? merchStore.items : [];
    merchWarehouseFeeToday = items.reduce((sum: number, item: any) => {
      if (item?.isArchived || (item?.stock || 0) <= 0) return sum;
      return sum + Math.min(120, Math.round((item.stock || 0) * 0.1));
    }, 0);

    if (merchStore.activeCampaign && (merchStore.activeCampaign.daysRemaining || 0) > 0) {
      merchAdSpendToday = Math.max(0, Math.round(Number(merchStore.activeCampaign.dailyCost) || 0));
    }
  }
  const totalMerchOperationalToday = merchWarehouseFeeToday + merchAdSpendToday;

  // 3. World Tour Show Expenses (if a concert stop was performed on current date)
  let tourShowExpenseToday = 0;
  let tourShowBadge = 'No Concert Today';
  const currentDateKey = (state.date || '').split('T')[0];
  const activeTour = state.tourState?.activeTour;
  if (activeTour && Array.isArray(activeTour.stops)) {
    const todayStop = activeTour.stops.find(
      (st: any) => st.status === 'completed' && st.date === currentDateKey
    );
    if (todayStop) {
      tourShowExpenseToday = Math.max(0, Math.round(Number(todayStop.totalExpenses) || 0));
      tourShowBadge = `${todayStop.city} (${todayStop.venueName})`;
    } else if (activeTour.status === 'on_tour') {
      tourShowBadge = 'Travel / Rest Day';
    }
  }

  const operationalItems: DailyExpenseItem[] = [
    {
      id: 'collab_royalty_splits',
      title: 'Featured Artist Royalty Splits',
      category: 'operational',
      amount: collabRoyaltyToday,
      description: 'Automated daily royalty splits paid to featured collaborators (deducted from gross streaming/sales).',
      detailBadge: collabSongsActive.length > 0 ? `${collabSongsActive.length} Collab Tracks` : 'No Active Splits',
      icon: 'ph-users-three'
    },
    {
      id: 'merch_warehouse_ads',
      title: 'Merch Warehouse & Promo Ads',
      category: 'operational',
      amount: totalMerchOperationalToday,
      description: `Physical inventory storage ($${merchWarehouseFeeToday}/day) & active webstore ad campaigns ($${merchAdSpendToday}/day).`,
      detailBadge: totalMerchOperationalToday > 0 ? 'Deducted from Merch' : 'No Active Overhead',
      icon: 'ph-t-shirt'
    },
    {
      id: 'world_tour_show_costs',
      title: 'World Tour Venue & Crew Production',
      category: 'operational',
      amount: tourShowExpenseToday,
      description: 'Venue rental, stage rigging, road crew logistics, promoter cut, and opening act fees on show days.',
      detailBadge: tourShowBadge,
      icon: 'ph-microphone-stage'
    }
  ];

  const operationalDeductionsToday = collabRoyaltyToday + totalMerchOperationalToday + tourShowExpenseToday;
  const totalAllExpensesToday = effectiveRecurringExpense + operationalDeductionsToday;
  const dailyIncomeSafe = Math.max(0, Math.round(Number(state.dailyIncome) || 0));
  const netDailyCashflow = dailyIncomeSafe - effectiveRecurringExpense;

  return {
    effectiveRecurringExpense,
    rawRecurringExpense,
    hiatusSavings,
    operationalDeductionsToday,
    totalAllExpensesToday,
    netDailyCashflow,
    recurringItems,
    operationalItems
  };
}
