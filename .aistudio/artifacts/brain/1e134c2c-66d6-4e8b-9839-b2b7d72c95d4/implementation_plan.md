# Record Label CEO & Full Roster Artist Ecosystem

This upgrade transforms your **Record Label Imprint** into a complete **Record Label CEO Simulation**. Every artist signed to your label becomes a full-fledged recording artist with customizable identity (stage name, real name, custom uploaded avatar), independent career metrics (Popularity, Fans, Monthly Listeners, Hype), physical paper recruitment contracts, dedicated executive Staff Teams, full Song & Album production and discography, and live presence across **Spotify, RIAA Certifications, Pitchfork, Metacritic, an Official Record Label YouTube Channel, and an Official Record Label X (Twitter) Account**.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices incorporate your confirmed preferences from our planning interview alongside every requirement from your prompt:

- **Confirmed Decision 1 — Dual Studio Production Access (Label CEO Studio + Main Studio Switcher)**: You can write, record, produce, and release Songs and Albums/EPs for any signed Roster Artist both directly inside the **Record Label CEO Studio Desk** and via a top **Active Artist Switcher** inside the main **Studio** tab.
- **Confirmed Decision 2 — Cross-App Top Artist & Account Switcher**: **Spotify, RIAA Certifications, Pitchfork, and Metacritic** feature a top **Artist Profile Switcher** allowing you to inspect any Roster Artist's profile, discography, plaques, and reviews alongside your own. **YouTube** features a switchable **Official Record Label Channel** where you upload Music Videos, Lyric Videos, and Visualizers for your roster, while **X (Twitter)** features an **Account Switcher** between your Personal Artist Account and your Official Record Label Account.
- **Confirmed Decision 3 — Flexible Staff Team Management**: You can hire and assign dedicated **6-Role Executive Staff Teams** (Manager, PR Publicist, Producer/Engineer, Tour Agent, Radio Plugger, Creative Director) either per individual Roster Artist or as a Label-Wide Executive Division with negotiated payroll cycles (Daily, Monthly, Annual) and legal contracts.

---

## 1. Overview & Core Concept

- **What It Does**: Elevates the player from a solo recording artist into a dual **Recording Artist & Record Label CEO**:
  1. **Roster Artist Identity & Career Metrics**: Edit any signed artist's **Stage Name**, **Real Name**, **Primary Genre**, **Country**, and upload a custom **Artist Avatar Image** from your device. Each roster artist tracks their own **Popularity (0–100)**, **Dedicated Fans**, **Monthly Listeners**, and **Hype (0–100)**.
  2. **Physical Paper Recruitment Contracts**: Recruiting a scouted artist or creating a new signing opens an authentic **Physical Legal Paper Contract** where you negotiate their **Signing Advance**, **Label vs. Artist Master Royalty Split**, **Album & Single Delivery Quotas**, **Contract Tenure**, and **360 Ancillary Cut**.
  3. **Full Songwriting, Album Production & Discography**: Write and produce individual **Singles** and multi-track **Albums / EPs** for each roster artist (with custom cover art upload, producer credits, studio quality, and release scheduling). Every release enters the roster artist's permanent **Discography**, generates daily streams/sales, and recoups their advance.
  4. **Roster Staff Team Division**: Recruit Junior, Veteran, or Elite executives for your roster artists to autonomously boost their studio quality, playlist/radio reach, fanbase growth, and crisis protection.
  5. **Spotify, RIAA, Pitchfork & Metacritic Integration**: Browse any roster artist's **Spotify Artist Profile** (Monthly Listeners, Top Tracks, Discography), claim **RIAA Gold/Platinum/Diamond Plaques** for their singles and albums, and read their **Pitchfork** (0.0–10.0 + Best New Music) and **Metacritic** (0–100 Metascore) critical reviews.
  6. **Official Record Label YouTube Channel**: Switch to your **Record Label YouTube Channel** inside the YouTube app to produce and upload **Official Music Videos (MVs)**, **Lyric Videos**, and **Audio Visualizers** for any roster artist's released songs, growing the Label Channel's subscribers, views, and ad revenue.
  7. **Official Record Label X (Twitter) Account**: Switch between your **Personal Artist Account** and your **Official Record Label Account (`@LabelHandle`)** inside the X app to post label announcements, promote roster releases with rich visual cards, edit the label's profile/banner, and grow the label's follower base.
- **Target Audience / Persona**: Players who want deep executive control over a music empire—developing a roster of artists from debut signings into chart-topping, RIAA-certified stars while managing label finances and media channels.
- **Key Value**: Unifies every major music industry platform in the game so signed roster artists feel just as alive, customizable, and rewarding to manage as the player's main artist.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Recruiting & Customizing a Roster Artist**:
     - Open **Record Label HQ → My Imprint → Scout & Recruit**, select a talent (or custom-sign a new act), negotiate clauses on the **Ivory Legal Paper Contract**, and countersign.
     - Click **"Manage Artist"** on any signed roster card to edit their **Stage Name**, **Real Name**, **Genre**, upload a custom **Profile Photo**, inspect their **Popularity / Fans / Hype / Recoupment**, and manage their **Staff Team**.
  2. **Writing & Producing Roster Songs & Albums**:
     - Either inside **Record Label HQ → CEO Studio** or by switching the active artist bar at the top of the main **Studio** tab, compose new songs, upload custom single/album cover art, assemble EPs/Albums, and release them to global DSPs.
  3. **Uploading Roster Visuals on the Record Label YouTube Channel**:
     - Open **YouTube**, switch the top channel selector to **[Your Label Name] Official Channel**, click **"Upload Roster Visual"**, pick a roster artist's song, and launch an **Official Music Video**, **Lyric Video**, or **Visualizer** with custom thumbnail support.
  4. **Posting from the Record Label X Account**:
     - Open **X**, tap the top **Account Switcher** to switch from your personal artist handle to your **Official Record Label Account**, and publish label press releases, roster release promos, or custom image posts.
  5. **Inspecting Spotify, RIAA, Pitchfork & Metacritic**:
     - Use the top **Artist Switcher Bar** (`My Artist` | `Roster Artists`) in **Spotify**, **RIAA Certifications**, **Pitchfork**, and **Metacritic** to view each roster artist's streaming profile, certify their eligible Gold/Platinum/Diamond records, and read their critical reception.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Sovereign Executive Suite & Authentic Parchment Legal Dossiers**—combining obsidian dark executive surfaces (`#0B0A12` / `#14131D`) with warm metallic gold accents (`#F59E0B` / `#D4AF37`) for CEO controls, paired with warm ivory bond paper (`#FBF8F1`) and dark ink (`#181613`) for physical recording contracts.
  - *Typography & Hierarchy*: Crisp geometric sans-serif headings for executive dashboards, `tabular-nums` monospace numerals for royalty/stream counters, and authoritative legal serif typography for recording agreements.
  - *Touch & Viewport Ergonomics*: Compact sticky top switcher bars ($\le 15\%$ viewport height cap) with $44\text{px}$ minimum touch targets and smooth horizontal pill carousels for switching between the player and signed roster artists.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Roster Artist Entity with Full Discography (`songs` & `projects`)**
  - *Chosen Approach*: Each signed roster artist stores a complete artist profile (`stageName`, `realName`, `avatarUrl`, `genre`, `country`, `popularity`, `fans`, `monthlyListeners`, `hype`) plus their own `songs: Song[]`, `projects: Project[]`, `staffRoster`, and `riaaCertifications` arrays using the exact same `Song` and `Project` data structures as the player.
  - *Why*: Reusing the core `Song` and `Project` schema means Spotify profiles, RIAA audits, Pitchfork/Metacritic review generators, and YouTube MV/Lyric/Visualizer uploads work seamlessly across both the player and every roster artist without duplicate brittle logic.
- **Decision 2: Dedicated Official Record Label YouTube Channel & X Account**
  - *Chosen Approach*: Rather than giving each roster artist a separate YouTube or X login, all roster visual uploads (MVs, Lyric Videos, Visualizers) are published under the **Player's Official Record Label YouTube Channel** (similar to *HYBE Labels*, *Top Dawg Entertainment*, or *Dirty Hit* on YouTube), and social posts are published via the switchable **Official Record Label X Account**.
  - *Why*: Matches your exact specification and mirrors how real powerhouse record labels centralize video distribution and social announcements under their flagship label channel and handle.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        GameState (recordLabelState)                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PlayerImprintState                                                   │  │
│  │  • imprintName, logoUrl, youtubeChannel, xAccount                    │  │
│  │  • labelStaffRoster (6 Executive Roles)                              │  │
│  │  • signedRoster: ImprintSignedArtist[]                               │  │
│  │     ├─ Identity: stageName, realName, avatarUrl, genre, country      │  │
│  │     ├─ Stats: popularity, fans, monthlyListeners, hype               │  │
│  │     ├─ Contract: advance, unrecouped, split%, albumQuota, termMonths │  │
│  │     ├─ Staff: dedicated 6-Role Staff Team                            │  │
│  │     └─ Catalog: songs: Song[], projects: Project[], riaaPlaques[]    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────┬────────────────────────────────────────┬───────────────────┘
                │                                        │
                ▼                                        ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│     CEO Management & Production       │  │   Cross-App Platform Switchers  │
│  • RecordLabelApp (CEO Suite)         │  │  • SpotifyApp (Roster Profiles) │
│    - Paper Recruitment Contract Modal │  │  • RiaaCertificationApp (Audit) │
│    - Roster Identity & Avatar Editor  │  │  • PitchforkApp & MetacriticApp │
│    - Roster Staff Team Hiring Desk    │  │  • YouTubeApp (Label Channel:   │
│    - CEO Song & Album Studio          │  │    Upload MV / Lyric / Visual)  │
│  • Main Studio Tab (Artist Switcher)  │  │  • XApp (Personal ↔ Label Acct) │
└───────────────────────────────────────┘  └─────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **Roster Recruitment Paper Contract Modal**:
   - Interactive sliders for **Signing Advance**, **Label/Artist Royalty Split %**, **Album & Single Quotas**, **Contract Duration (1–4 Years)**, and **360 Cut %** on an ivory parchment contract (`#FBF8F1`) with live candidate acceptance odds and wet-ink execution.
2. **Roster Artist Identity & Staff Manager**:
   - Edit **Stage Name**, **Real Name**, **Genre**, and upload a custom **Avatar Photo** (`FileReader` Data URL).
   - Hire/manage **6 Executive Staff Roles** (either per-artist or label-wide) with payroll cycles and autonomous daily buffs to song quality, radio spins, fanbase growth, and hype.
3. **Dual Studio Production (CEO Studio & Main Studio Switcher)**:
   - Write & record **Singles** and assemble **Albums / EPs** for any roster artist with custom artwork upload. Daily turn simulation (`processDailyRecordLabelStep`) calculates daily streams, pure sales, fan growth, advance recoupment, label net profit, and automatic critic review generation.
4. **Platform Switchers Across Spotify, RIAA, Pitchfork, Metacritic, YouTube & X**:
   - **Spotify / RIAA / Pitchfork / Metacritic**: Top selector bar switches the active artist context between the Player and any Signed Roster Artist.
   - **YouTube**: Top channel switcher toggles between the Player's Artist Channel and the **Official Record Label Channel**, complete with a **"Produce & Upload Roster MV / Lyric Video / Visualizer"** modal.
   - **X (Twitter)**: Top account switcher toggles between the Player's Personal Account and the **Official Record Label Account**, allowing the CEO to post updates, attach roster release cards, and grow label followers.
