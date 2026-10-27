# Pre-Release System, Single Rollout Roles & Spotify Countdown Plan

## 1. Overview & Goals
We will implement a complete **Pre-Release & Era Rollout System** alongside an authentic **Spotify Upcoming Release Countdown** experience modeled after your reference screenshots:
1. **Full Single Rollout System (`Lead Single`, `Pre-Release Single`, `Promotional Single`, & `Standalone/Official Single`)**:
   - Fixes the issue where every track released prior to an album was automatically forced into `Lead Single` and every other album track was forced into `B-Side`.
   - Allows you to choose the exact single role when releasing a song, release individual tracks early from a scheduled/packaged Album or EP while its countdown is running, and designate a Focus Single when an album drops.
2. **Pre-Release System & Era Momentum**:
   - Scheduling an Album, EP, or Single Pack for a future date initiates an active **Pre-Release Countdown** that accumulates daily **Pre-Saves** based on your artist popularity, hype, fans, and any Pre-Release / Promo Singles dropped during the rollout.
   - Accumulated Pre-Saves convert into a Day-1 streaming surge and first-week album sales boost when the countdown reaches release day.
3. **Spotify Upcoming Release Countdown (Artist Profile Only)**:
   - Displays an authentic **Upcoming Release** countdown card on the **Spotify Artist Profile page** (both on your Artist Profile when you have a scheduled project and on NPC Artist Profiles with upcoming releases).
   - Tapping the card opens the full **Spotify Countdown Page** matching your screenshots: large cover art, dark rounded `Days | Hours | Minutes | Seconds` live countdown bar (which sticks to the top on scroll), project metadata (`EP/Album • Releases on [Date]`), share icon, green `Pre-save (+)` pill button, `Tracklist preview` (where already-released singles are bright/playable and unreleased album tracks are dimmed/locked), and copyright footer.

---

## 2. Modular File Architecture
Following your strict modular file rule, all new features will live in dedicated new files:

### New Files to Create
- **`src/data/preReleaseCountdownEngine.ts`**
  - Handles all Pre-Release & Countdown logic:
    - Live countdown calculation (`days`, `hours`, `minutes`, `seconds` remaining until `releaseDate`).
    - Daily Pre-Save accumulation and Day-1 conversion multipliers when a scheduled project launches.
    - Single Role definitions (`lead_single`, `pre_release_single`, `promotional_single`, `single`, `b_side`), display badges, and commercial rollout modifiers.
    - Early extraction/release of a track from a scheduled or packaged Album/EP as a Pre-Release Single or Promotional Single while keeping the parent album countdown active.
    - Deterministic NPC Upcoming Release Countdown generator so major NPCs also showcase upcoming albums/EPs on their Spotify Artist Profile pages.
- **`src/components/Apps/SpotifyReleaseCountdownView.tsx`**
  - Renders both:
    1. **`SpotifyArtistUpcomingReleaseBanner`**: The compact "Upcoming release" countdown card embedded directly inside the Spotify Artist Profile page (for Player and NPCs).
    2. **`SpotifyReleaseCountdownPage`**: The full-screen Spotify Countdown view matching your reference screenshots, including the sticky top countdown bar on scroll, `Days | Hours | Minutes | Seconds` live ticker, `Pre-save (+)` interaction, Pre-Save analytics & quick "Drop Pre-Release Single" shortcut for the player, `Tracklist preview` (bright playable pre-released singles vs. locked grey unreleased tracks), and `© / ℗` label footer.

### Existing Files to Update (Wiring & Bug Fixes Only)
- **`src/types.ts`**
  - Add `'pre_release_single'` to `Song['trackType']` and optional pre-release fields on `Project` (`preSaves`, `dailyPreSaves`, `distributor`, `marketingStrategy`, `recordLabel`, `focusTrackId`).
- **`src/data/bSideAndSingleStrategyEngine.ts`**
  - Support `pre_release_single` and `promotional_single` promotion profiles (distinct streaming, radio airplay, pure sales, and decay curves compared to `lead_single`, `single`, and `b_side`).
- **`src/components/Modals/EnhancedProjectCreatorModal.tsx` & `src/components/Modals/EnhancedReleaseModal.tsx`**
  - Allow selecting any recorded song **or** any unreleased track inside a packaged/scheduled Album/EP to release early as a `Lead Single`, `Pre-Release Single`, `Promotional Single`, or `Official Single`.
  - Allow choosing a **Focus Single** when scheduling or dropping an Album/EP so the chosen track becomes an official `Single` on the album instead of a `B-Side`, and preserve existing single roles (`Lead Single` vs. `Pre-Release Single` vs. `Promotional Single` vs. `Single`) instead of overwriting all pre-released tracks to `Lead Single`.
- **`src/data/marketStabilityEngine.ts`**
  - Process daily Pre-Save growth for scheduled projects and apply the Pre-Save Day-1 stream/sales boost when a scheduled project reaches its `releaseDate`.
- **`src/components/Apps/SpotifyApp.tsx` & `src/components/Apps/SpotifyNpcArtistProfileView.tsx`**
  - Render the Upcoming Release Countdown section on the Artist Profile page (`renderProfile` for the Player and the main profile view for NPCs) and open `SpotifyReleaseCountdownPage` when clicked.
  - Display accurate track badges (`Lead Single`, `Pre-Release Single`, `Promo Single`, `Single`, `B-Side`) in album tracklists.

---

## 3. Verification Plan
- Run `compile_applet` and `lint_applet` after completing all file creation and wiring to verify zero TypeScript or build errors.
- Verify that all UI copy across the Pre-Release System and Spotify Countdown is 100% in English and works seamlessly in both Light and Dark themes.
