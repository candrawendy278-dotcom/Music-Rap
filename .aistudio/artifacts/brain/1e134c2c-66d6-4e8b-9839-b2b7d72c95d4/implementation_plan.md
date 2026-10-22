# Pembaruan Animasi Next Day, Sistem Streaming Organik & Ekosistem Artis Dunia Nyata

Rencana ini menghadirkan pengalaman simulasi musik yang jauh lebih hidup dan autentik melalui transisi pergantian hari (*Next Day*) bergaya studio rekaman sinematik, penyempurnaan kurva streaming harian yang lebih stabil terhadap kualitas lagu serta loyalitas fanbase, dan pembaruan menyeluruh seluruh NPC serta katalog chart menggunakan artis dunia nyata lengkap dengan foto profil, diskografi lagu/album asli, dan *cover art* resmi di seluruh chart termasuk Billboard.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan utama yang telah dikonfirmasi dari jawaban Anda dan akan diterapkan secara menyeluruh:

- **Gaya Animasi Next Day**: Animasi sinematik dan keren bergaya studio musik profesional — menampilkan piringan hitam (*vinyl*) berputar dengan *tonearm* bergerak, efek *3D calendar flip* dari hari ini ke hari berikutnya, *live rolling number counter* untuk stream dan royalti yang sedang dikalkulasi, serta visualizer gelombang suara dinamis.
- **Sistem Streaming & Ketahanan Fanbase/Hype**: Kurva stream harian diperhalus agar bergerak organik mengikuti kualitas lagu (*Song Quality & Synergy*) tanpa fluktuasi kasar, serta memperkuat peran *Dedicated Fans* dan *Hype* sebagai penopang ketahanan (*retention floor*) stream jangka panjang.
- **Artis Dunia Nyata & Diskografi Asli**: Mengubah seluruh NPC utama dan katalog lagu/album di chart menjadi artis dunia nyata (seperti Taylor Swift, Drake, Bad Bunny, Billie Eilish, The Weeknd, Sabrina Carpenter, Kendrick Lamar, Bruno Mars, Ariana Grande, SZA, Olivia Rodrigo, Travis Scott, Chappell Roan, Charli XCX, Post Malone, Dua Lipa, dll.) lengkap dengan foto profil asli, judul lagu dan album asli, serta *cover art* asli yang tampil di profil maupun di seluruh chart **Billboard** (Hot 100, Global 200, Regional, dan Billboard 200 Albums).

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Animasi Next Day Sinematik**: Menyajikan visual pergantian hari yang imersif dengan putaran piringan hitam berlapis cahaya analog, jarum *turntable* yang aktif, kalender yang bertransisi secara halus, dan indikator tahapan simulasi (*Streams & Airplay*, *Billboard & Global Charts*, *Royalties & Fan Growth*) yang responsif.
  2. **Mesin Streaming Organik & Loyalitas Fanbase**: Menstabilkan kurva pertumbuhan dan penurunan (*decay*) stream harian berdasarkan kualitas lagu, sinergi penulisan/rekaman, serta memberikan bantalan (*streaming floor*) yang kuat dari jumlah *Dedicated Fans* dan *Hype* sehingga lagu berkualitas tinggi bertahan lama di chart sebagaimana hit dunia nyata.
  3. **Ekosistem Artis Dunia Nyata & Cover Art Billboard**: Mengganti nama parodi dan aset generik dengan nama artis dunia nyata, foto profil asli, katalog single & album asli, serta *cover art* album/single resolusi tinggi yang terintegrasi penuh di Spotify, iTunes, YouTube, X, dan seluruh chart **Billboard** (termasuk sistem *auto-fetch* sampul resmi dari iTunes/Apple Music API dengan *caching* instan dan *fallback* visual anti-rusak).
- **Target Audience / Persona**: Pemain simulasi karir musik yang menginginkan atmosfer industri musik nyata, bersaing langsung di tangga lagu melawan bintang pop dan hip-hop global sesungguhnya.
- **Key Value**: Meningkatkan imersi visual setiap kali pemain menekan tombol *Advance Time*, memberikan kepuasan progresi karir saat membangun fanbase dan merilis lagu berkualitas tinggi, serta menghadirkan tampilan chart Billboard dan Spotify yang tampak seperti aplikasi musik sungguhan.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Alur Transisi Next Day**: Saat pemain menekan tombol *Advance Time* di Dashboard, layar menampilkan overlay sinematik. Piringan hitam berputar dengan pantulan cahaya spekular, jarum *tonearm* menempel ke piringan, kartu tanggal berganti dari tanggal lama ke tanggal baru dengan animasi transisi mulus, angka estimasi aktivitas berdetak naik, dan bar progres berdenyut melewati tiga tahap kalkulasi sebelum kembali ke Dashboard.
  2. **Alur Performa Streaming Lagu**: Saat hari berganti, lagu yang baru dirilis mendapatkan dorongan *Hype* dan *Dedicated Fans* yang nyata. Lagu dengan kualitas tinggi dan dukungan fanbase besar mengalami penurunan harian yang sangat landai (*organic retention*), sementara lagu dari katalog lama tetap menghasilkan *recurrent streams* yang stabil dari penggemar setia.
  3. **Alur Eksplorasi Artis Nyata & Chart Billboard**: Ketika pemain membuka aplikasi **Billboard** (Singles maupun Billboard 200 Albums) atau **Spotify**, setiap baris chart menampilkan *cover art* asli dari lagu/album artis dunia nyata (misalnya *The Tortured Poets Department* / *Cruel Summer* milik Taylor Swift, *Hit Me Hard and Soft* / *Birds of a Feather* milik Billie Eilish, *GNX* / *Not Like Us* milik Kendrick Lamar, *Short n' Sweet* / *Espresso* milik Sabrina Carpenter, dll.), lengkap dengan foto profil asli saat profil NPC dibuka.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Studio Rekaman High-Craft & Editorial Musik Modern.
  - *Color Palette & Mood*: Kanvas gelap berlapis kaca (`#090A0F` hingga `#121316`) pada overlay transisi dengan aksen *Warm Analog Amber* (`#F59E0B`), *Spotify Emerald* (`#1DB954`), dan kontras monokrom tajam khas editorial **Billboard** (`#000000` & `#FFFFFF`).
  - *Typography & Hierarchy*: Menggunakan angka tabular (`tabular-nums`) untuk seluruh penghitung stream, posisi chart, dan persentase progres agar tidak bergeser saat beranimasi.
  - *Component Styling & Layout*: Mengikuti ergonomi mobile-first dengan target sentuh minimal `44x44px`, pemisahan elemen yang bersih, serta perlindungan *image fallback* berlapis agar tidak pernah ada gambar pecah.
- **Interactive Feedback & Motion**:
  - Animasi berbasis properti kompositor (`transform`, `opacity`) untuk menjamin kelancaran 60fps.
  - Transisi urutan tangga lagu menggunakan pegas halus (*spring layout animation*) dan pemuatan *cover art* dengan *fade-in* mulus.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Arsitektur Modular untuk Fitur Baru & Kalibrasi**
  - *Chosen Approach*: Memisahkan modul katalog artis dunia nyata, resolver sampul album/lagu asli, mesin peningkatan kurva streaming organik, dan komponen animasi *Next Day* ke dalam modul khusus yang terhubung bersih dengan sistem utama.
  - *Why*: Menjaga stabilitas aplikasi, mematuhi prinsip modularitas agar penambahan fitur tidak merusak logika yang sudah berjalan, dan memudahkan pemeliharaan.
  - *Alternatives Considered*: Menumpuk seluruh data dan logika baru di satu file lama — ditolak karena rawan konflik state dan sulit dipelihara.
- **Decision 2: Penyediaan Foto Profil & Cover Art Asli Resolusi Tinggi dengan Auto-Resolver**
  - *Chosen Approach*: Mengombinasikan database URL *artwork* resmi beresolusi tinggi untuk seluruh NPC utama dan lagu/album populer dengan resolver otomatis berbasis iTunes Search API (disertai *local cache* dan *fallback* sampul grafis jika offline).
  - *Why*: Memastikan setiap lagu dan album milik Taylor Swift, Drake, Bad Bunny, Billie Eilish, The Weeknd, Sabrina Carpenter, Kendrick Lamar, SZA, dan artis lainnya menampilkan sampul album dan foto asli secara instan maupun saat offline.
  - *Alternatives Considered*: Hanya mengandalkan pencarian API saat runtime tanpa database bawaan — ditolak karena akan menimbulkan jeda loading pada saat chart pertama kali dibuka.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORE GAME LOOP & STATE                           │
│           (Daily Step, Weekly Monday Charts & Real-Time Engine)         │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│   ENHANCED ORGANIC STREAMING ENGINE   │ │  REAL-WORLD ARTIST & ARTWORK  │
│  • Smooth Quality-Driven Curve        │ │           REGISTRY            │
│  • Fanbase & Hype Retention Cushion   │ │  • Authentic Artist Profiles  │
│  • Recurrent Catalog Stability Floor  │ │  • Real Discographies & Hits  │
│  • Multi-Week Smash Longevity         │ │  • Official Cover Art & Cache │
└───────────────┬───────────────────────┘ └───────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     UI PRESENTATION & IN-GAME APPS                      │
├───────────────────────┬─────────────────────────┬───────────────────────┤
│   NEXT DAY CINEMATIC  │     BILLBOARD APP       │   SPOTIFY / ITUNES /  │
│        OVERLAY        │  • Hot 100 & Global 200 │      YOUTUBE / X      │
│  • Turntable & Tonearm│  • Billboard 200 Albums │  • Real NPC Showcases │
│  • 3D Date Card Flip  │  • Verified Cover Art   │  • Full Discography   │
│  • Live Metric Ticker │    on Every Chart Row   │    & Official Covers  │
└───────────────────────┴─────────────────────────┴───────────────────────┘
```

- **Data Model & State**:
  - **Registry Artis Dunia Nyata**: Menyimpan profil lengkap artis asli (nama resmi, genre, bio autentik, foto profil asli, daftar lagu hit asli beserta angka stream/sales/radio realistis, dan daftar album studio asli beserta sampul resminya).
  - **Resolver Sampul & Migrasi State Otomatis**: Memetakan setiap kombinasi `artist` + `title` ke sampul asli resmi, serta secara otomatis menyinkronkan data chart atau NPC pada save game yang sedang berjalan agar langsung menampilkan nama artis dan *cover art* asli tanpa perlu mengulang permainan dari awal.
  - **Model Kurva Streaming**: Menghitung koefisien ketahanan harian menggunakan fungsi kontinu dari `quality`, `synergyScore`, `hype`, dan logaritma jumlah `fans`, menghasilkan perubahan harian (`dailyChangePercent`) yang organik dan stabil.
- **Interactive Component & State Mapping**:
  - **Tombol Advance Time -> Cinematic Next Day Overlay**: Memicu tahapan animasi berurutan (0% -> 35% -> 70% -> 100%) dengan indikator visual pergerakan jarum *vinyl*, efek pergantian kartu kalender, dan *ticker* aktivitas harian.
  - **Billboard Chart View & Breakdown Modal**: Setiap baris di tab *Singles* (Global 200, US Hot 100, Regional) dan *Billboard 200* (Albums) serta modal *Breakdown* memanggil resolver *cover art* asli dengan penanganan `onError` berlapis sehingga sampul asli selalu tampil tajam.
  - **NPC Showcase & Profile View**: Menampilkan avatar asli dan daftar lagu/album asli ketika pemain melihat rival di Spotify, memilih kolaborator di Studio, atau melihat chart di iTunes dan YouTube.
