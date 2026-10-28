# RIAA Gold & Platinum Certification Program & Plaque Gallery

An industry-authentic **RIAA (Recording Industry Association of America) Gold & Platinum Program** that audits your Singles, EPs, and Albums using real-world RIAA unit math, alerts you when releases qualify for new milestones, lets you submit official audit claims with customizable commemorative framed plaques, and tracks your all-time certification legacy against global NPC superstars.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core design and gameplay decisions have been locked in based on your answers:

- **Confirmed Decision 1 — Manual RIAA Audit Request + Auto-Eligibility Alerts**: When a released Single, EP, or Album reaches a new threshold (Gold `500K`, Platinum `1M`, Multi-Platinum `2x–9x`, Diamond `10M+`, up to `20x+ Diamond`), the game triggers an eligibility alert badge and notification. You then submit an official **RIAA Audit & Plaque Order** (paying a realistic RIAA certification audit & plaque manufacturing fee, or having your Record Label subsidize part of it) to officially certify the release and unlock its prestige rewards.
- **Confirmed Decision 2 — Real RIAA Unit Conversion Formula**:
  - **Singles (Digital Single Award)**: `1 RIAA Unit = 1 Pure Digital/Physical Single Sale` **OR** `150 On-Demand Audio/Video Streams` (`Spotify Streams + YouTube Official MV/Visualizer/Lyric Views`).
  - **Albums & EPs (Album Award — SEA + TEA + Pure)**: `1 RIAA Album Unit = 1 Pure Album Sale (iTunes + D2C Vinyl/CD/Cassette/Box Set)` **+** `1,500 On-Demand Track Streams (SEA)` **+** `10 Individual Track Pure Sales (TEA)`.
- **Confirmed Decision 3 — Interactive 3D-Style Framed Plaque Wall & Customizer**: Every certified milestone unlocks a bespoke commemorative RIAA presentation plaque featuring metallic Gold, Platinum, or Prismatic Diamond discs, custom frame finishes (*Obsidian Museum Black*, *Brushed 24K Gold*, *Chrome Studio Silver*, *Mahogany Executive Wood*), matboard velvet textures, and an engraved RIAA dedication plate.
- **Confirmed Decision 4 — Global Artist RIAA Leaderboard & Full Ecosystem Integration**: Accessible via a dedicated **RIAA Program** app in the Apps Hub (`Awards & Honors` section), complete with a **Global All-Time RIAA Leaderboard** comparing your Gold, Platinum, Multi-Platinum, and Diamond plaques against NPC artists, inline certification badges on your Songs/Albums in the Catalog & Statistic views, and automatic `@RIAA` announcement posts on **X** whenever you certify a record.

---

## 1. Overview & Core Concept

- **What It Does**: Brings the prestige of real-world music industry sales certifications into the career simulation. Every stream, YouTube view, iTunes purchase, and D2C Vinyl/CD shipment feeds into live RIAA certification progress for every song and project in your discography.
- **Target Audience / Persona**: Players who love tracking career milestones, collecting visual trophies/plaques, competing with top NPC artists on historical all-time charts, and Strategizing D2C Vinyl drops or streaming pushes to cross Platinum and Diamond thresholds.
- **Key Value**: Connects your streaming, YouTube, and Merch Store physical sales into tangible, permanent career accolades that grant Popularity, Hype, Fanbase growth, and visual bragging rights.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Live RIAA Audit Tracker & Eligibility Alerts**:
   - Inside the **RIAA App**, the **Audit Center** tab lists all released Singles, EPs, and Albums with real-time progress bars toward their next certification tier, breaking down exact unit contributions (`Pure & Vinyl Sales` vs. `Streaming Equivalent Units` vs. `Track Equivalent Units`).
   - Whenever a release crosses a threshold (`500,000` for Gold, `1,000,000` for Platinum, `2,000,000+` for Multi-Platinum, `10,000,000+` for Diamond), it is flagged as **Eligible for Audit** with a notification badge.
2. **Official Audit Submission & Plaque Customizer**:
   - Clicking **Submit RIAA Audit** opens the **Plaque Atelier & Certification Modal**, where you can customize the physical presentation plaque (Frame Material, Velvet Matboard Color, Disc Configuration, and Recipient Dedication Text), review the audit fee and career boosts (`+Hype`, `+Popularity`, `+Core Fans`), and officially certify the record.
   - If a release jumped multiple tiers at once (e.g., from uncertified straight to `3x Platinum`), a single audit certifies all intermediate tiers and awards cumulative prestige.
3. **Interactive 3D-Style Plaque Wall Gallery**:
   - The **Plaque Wall** tab displays your collection of framed RIAA awards in a museum-grade gallery. Tapping any plaque opens a high-detail inspection view showing the metallic holographic RIAA seal, reflections across the Gold/Platinum/Diamond record grooves, mini album artwork, and official certification serial number.
4. **Global All-Time RIAA Leaderboard (Player vs. NPCs)**:
   - The **Global Leaderboard** tab ranks you against all NPC superstars by Total Certified Units, Diamond Plaques (`10M+`), Multi-Platinum Plaques, and Total Career Certifications, dynamically evolving as NPCs release new music and accumulate streams/sales.
5. **Cross-App Badges & `@RIAA` Social Posts**:
   - Certified songs and albums display crisp metallic **RIAA Badges** (`GLD`, `PLT`, `3x PLT`, `DMD`) in your Studio Catalog and Statistic pages.
   - Every newly certified milestone automatically publishes a verified `@RIAA` announcement post on **X** celebrating your achievement with fan engagement.

### Visual Identity & Theme
- **Aesthetic Direction**: Institutional Luxury & Museum Archive — inspired by the official RIAA Washington D.C. headquarters gallery and executive record-label trophy halls.
- **Color Palette & Mood**:
  - Deep Obsidian Gallery Slate (`#0A0A0E`) and Velvet Charcoal (`#12131A`) surfaces.
  - Metallic Accents: **24K Gold** (`#D4AF37` / `#FDE047`), **Specular Platinum** (`#E4E4E7` / `#CBD5E1`), and **Prismatic Crystalline Diamond** (`#38BDF8` / `#E0F2FE` / `#C084FC`).
- **Typography & Hierarchy**:
  - Display / Headers: Bold editorial authority for certification titles and plaque engravings.
  - Telemetry & Audit Ledgers: Strict monospace tabular numerals (`font-mono tabular-nums`) for unit counts, SEA/TEA breakdowns, and leaderboard rankings.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Separate Modular Engine & Visual Plaque Renderer**
  - *Chosen Approach*: Build the RIAA certification math, NPC career certification modeling, and audit state transitions inside a dedicated engine module, paired with a dedicated SVG/CSS 3D-style Plaque visual component and app view.
  - *Why*: Keeps the codebase modular, prevents regressions in existing apps, and ensures crisp, scalable metallic plaque rendering at any screen size without external image dependencies.
- **Decision 2: Real-World SEA/TEA Album Unit Aggregation**
  - *Chosen Approach*: Album/EP eligible units automatically combine the project's direct pure/vinyl sales (`project.pureSales`) plus `1/1500` of the total streams/views of tracks packaged on that project (`SEA`) plus `1/10` of individual track pure sales (`TEA`).
  - *Why*: Mirrors real RIAA Album rules and rewards both hit singles on an album and physical Vinyl/CD sales from the Official Merch Store.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         GAME STATE (GameContext)                             │
│  • riaaState: Certified Records, Plaque Customizations, Audit History Log    │
│  • Songs & Projects: Streams, YouTube Views, Pure & Merch Store Vinyl Sales  │
└──────────────────────┬───────────────────────────────────┬───────────────────┘
                       │                                   │
                       ▼                                   ▼
┌─────────────────────────────────────────┐ ┌──────────────────────────────────┐
│      RIAA CERTIFICATION ENGINE          │ │     DAILY TICK & X INTEGRATION   │
│  • Real RIAA Unit Math (1:150 / 1:1500) │ │  • Checks newly eligible records │
│  • Tier Thresholds (Gold → 20x Diamond) │ │  • Simulates NPC RIAA progression│
│  • Manual Audit Claim & Career Rewards  │ │  • Posts verified @RIAA X alerts │
└──────────────────────┬──────────────────┘ └──────────────────────────────────┘
                       │
       ┌───────────────┴───────────────────────────┐
       ▼                                           ▼
┌─────────────────────────────────────────┐ ┌──────────────────────────────────┐
│       RIAA GOLD & PLATINUM APP          │ │    CATALOG & STATISTIC BADGES    │
│  • Tab 1: Audit Center (Unit Breakdown) │ │  • Inline Gold/Platinum/Diamond  │
│  • Tab 2: 3D Plaque Wall & Customizer   │ │    certification seals on songs  │
│  • Tab 3: Global Artist Leaderboard     │ │    and albums across the UI      │
│  • Tab 4: Official Audit History Ledger │ └──────────────────────────────────┘
└─────────────────────────────────────────┘
```

### Data Model & State
- **Certification Tiers**:
  - `Gold`: `500,000` units
  - `Platinum`: `1,000,000` units
  - `Multi-Platinum`: `2x Platinum` (`2,000,000`) through `9x Platinum` (`9,000,000`)
  - `Diamond`: `10,000,000` units (`1x Diamond`), plus `11x–19x Platinum` and `2x+ Diamond` (`20,000,000+`) for historic mega-hits.
- **Plaque Customization Options**:
  - Frame Style (`obsidian_gallery`, `gold_leaf_executive`, `brushed_chrome`, `mahogany_heritage`)
  - Matboard Velvet (`royal_obsidian`, `crimson_velvet`, `midnight_sapphire`, `emerald_vault`)
  - Custom Inscribed Dedication (`"Presented to [Artist] to Commemorate..."`)
- **Interactive Component & State Mapping**:
  - **Audit Center Filter & Claim Flow**: Filters by `Eligible Now`, `Singles`, `Albums & EPs`, or `All Releases`. Clicking `Certify & Order Plaque` opens the customizer modal, validates cash against the audit fee, deducts the fee, updates `riaaState.certifications`, grants Hype/Popularity/Fans, and fires an `@RIAA` post into `xPosts`.
  - **Plaque Wall Customizer**: Allows re-framing or updating the matboard/dedication of any already-certified plaque at any time and inspecting the full unit audit breakdown.
