# Streaming, Pure Sales, YouTube Views & Home Country Stability Improvement Plan

## 1. Overview & Root Cause Diagnosis
Based on an audit of the existing market and chart engines, three mathematical bottlenecks were causing the issues you experienced:
1. **Home Country Discrepancy (`countryMarketSystem.ts` & `npcRealReleaseChartsEngine.ts`)**:
   - Local NPCs receive a `4.2x` territorial affinity multiplier on a `marketSizeWeight / 320` base (~34% of their global streams concentrated in their home country), whereas when a Player song reached `global_crossover` status, its home-country weight dropped to `1.5x` divided by `sumWeight (~650)` (~4–6% share). This caused a Player song to debut #1 on Spotify Global while underperforming or failing to dominate in the Player's own Home Country.
2. **Pure Sales & iTunes Day 2–3 Drop-Off (`organicMusicMarketRebuild.ts` & `singleDebutDynamicsEngine.ts`)**:
   - Player pure sales suffered from stacked double-tapering (`lifecycleSalesFactor` multiplied by `debutSalesMultiplier` AND a dropping `basePurchaseRate` from `0.00032` on Day 1 down to `0.00015` on Day 4+), whereas NPCs maintained a steady `0.0018` sales-to-streams ratio every day. This caused Player singles to fall off the iTunes Global chart right after Day 3.
3. **Stacked Post-Debut Stream & View Decay (`marketStabilityEngine.ts` & `enhancedStreamingCurveEngine.ts`)**:
   - From Day 2 onward, `debutStreamMultiplier`, `continuousLifecycleFactor`, `postDebutStreamMultiplier`, and `momentum` were all decaying simultaneously, creating an overly steep drop after Day 1 instead of a soft Day 2 dip and stable Week 1–4 hold.

---

## 2. Planned Modular Improvements (Improve, Not Overhaul)

### A. New Dedicated Calibrator Module (`src/data/homeCountryAndMarketStabilityImprover.ts`)
To follow your modular file rule and avoid rewriting your existing engines from scratch, we will create a dedicated improvement module that provides three clean calibration functions:

1. **Strong Hometown Pride & Guaranteed Domestic Chart Sync (`calculateCalibratedPlayerTerritoryMetrics`)**:
   - Ensures your artist's Home Country (`playerCountry`) always gives strong domestic support (matching or exceeding the `4.2x` local affinity given to domestic NPCs).
   - **Global-to-Home Sync Guarantee**: If your song is performing at a Top Global level (e.g., #1 or Top 5 on Global Spotify/iTunes/YouTube), your Home Country streams, views, and sales are automatically synchronized so your home market is your strongest bastion of support and never lags behind your global rank.
   - Ensures your Home Country daily and weekly charts are always generated and synced in real time.

2. **Smooth First-Week Hold & Multi-Week iTunes Sales Longevity (`calculateStabilizedDailyPureSales`)**:
   - Removes the harsh Day 2 / Day 3 double-taper and aligns the Player's digital buyer conversion curve with NPC iTunes competitors.
   - **Day 1 (`daysSinceRelease === 0`)**: Strong fan & pre-order launch rush.
   - **Days 2–7 (`daysSinceRelease 1..6`)**: Smooth first-week hold (`82%–92%` of post-preorder baseline) instead of a cliff drop, keeping hits competitive on iTunes Global and Regional charts throughout Week 1.
   - **Weeks 2–6 (`daysSinceRelease 7..42`)**: Gradual, quality- and fanbase-supported multi-week taper with a realistic iTunes catalog floor so smash hits stay on the iTunes chart for weeks.

3. **Realistic Stream & YouTube View Hold (`calculateStabilizedStreamsAndViewsHold`)**:
   - Smooths the transition from Day 1 Debut (`daysSinceRelease === 0`) to Day 2 (`daysSinceRelease === 1`) with a realistic soft dip (`-10%` to `-18%` for quality singles) and stabilizes Days 3–28 (`Weeks 1–4`) with a smooth day-to-day hold cushion (`±3–6%` natural daily movement + weekend lift).
   - Stabilizes YouTube Music Video daily views on Days 2–28 so MV views hold steadily alongside audio streams without sudden post-premiere drops.

---

## 3. Files to Create & Update
- **`src/data/homeCountryAndMarketStabilityImprover.ts` (New File)**: Houses the Home Country Domestic Chart Sync, Multi-Week iTunes Pure Sales Stabilizer, and Week 1–4 Stream & YouTube View Hold formulas.
- **`src/data/marketStabilityEngine.ts` (Minor Hook-In)**: Applies `calculateStabilizedStreamsAndViewsHold` and `calculateStabilizedDailyPureSales` to daily song calculations.
- **`src/data/npcRealReleaseChartsEngine.ts` & `src/data/countryMarketSystem.ts` (Minor Hook-In)**: Applies `calculateCalibratedPlayerTerritoryMetrics` when scoring Player songs on regional/home-country Spotify, iTunes, YouTube, and Billboard charts.
