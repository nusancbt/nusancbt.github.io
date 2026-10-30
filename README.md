# NusanCBT - Dashboard Siswa & LMS Terintegrasi

Aplikasi portal pembelajaran sekolah terintegrasi berbasis **React + TypeScript + Vite + Tailwind CSS**. Menyediakan dashboard siswa, pemutar materi & video playlist, perpustakaan digital E-Library (LMS), agenda & pencatat tugas siswa, serta panel pengaturan admin/guru.

## Menjalankan Secara Lokal

1. Instal dependensi:
   ```bash
   npm install
   ```
2. (Opsional) Salin `.env.example` ke `.env` untuk menyesuaikan URL Google Apps Script (`VITE_GOOGLE_SCRIPT_URL`).
3. Jalankan server pengembangan (port `3000`):
   ```bash
   npm run dev
   ```
4. Build untuk produksi (output di folder `dist/`):
   ```bash
   npm run build
   ```

---

## Panduan Deployment

Proyek ini adalah **Static Single-Page Application (SPA)** murni (tanpa ketergantungan server Node.js saat produksi) dan sudah dilengkapi file konfigurasi siap pakai untuk **GitHub Pages, Netlify, Vercel, dan Cloudflare Pages**.

> **Environment Variable (Opsional)**: Pada platform mana pun, Anda dapat menambahkan variabel `VITE_GOOGLE_SCRIPT_URL` bila ingin mengganti endpoint Google Apps Script bawaan.

### 1. GitHub Pages
Sudah tersedia workflow otomatis di `.github/workflows/deploy.yml` dan konfigurasi path relatif (`base: './'`) sehingga mendukung baik domain utama (`username.github.io`) maupun sub-path repositori (`username.github.io/nama-repo/`):
1. Push kode ke branch `main` atau `master` di GitHub.
2. Buka menu **Settings > Pages** pada repositori GitHub Anda.
3. Pada bagian **Build and deployment > Source**, pilih **GitHub Actions**.
4. Setiap `git push` berikutnya akan otomatis mem-build dan men-deploy aplikasi.

### 2. Netlify
Sudah dilengkapi `netlify.toml`:
1. Masuk ke dashboard Netlify, klik **Add new site > Import an existing project**, lalu hubungkan repositori GitHub Anda (konfigurasi `npm run build` dan folder `dist` otomatis terdeteksi).
2. Atau deploy manual dengan mengunggah hasil folder `dist/` setelah menjalankan `npm run build`.

### 3. Vercel
Sudah dilengkapi `vercel.json`:
1. Masuk ke dashboard Vercel, klik **Add New > Project**, lalu pilih repositori GitHub Anda.
2. Klik **Deploy** (Framework Preset: `Vite`, Build Command: `npm run build`, Output Directory: `dist` otomatis diterapkan).

### 4. Cloudflare Workers / Pages
Sudah dilengkapi `wrangler.jsonc` dengan `not_found_handling: "single-page-application"`:
- **Via Git Integration (Cloudflare Workers & Pages)**:
  1. Buka **Workers & Pages > Create > Connect to Git**.
  2. Set **Build command**: `npm run build` dan jika menggunakan Pages set **Build output directory**: `dist`, lalu klik **Deploy**.
- **Via Wrangler CLI**:
  ```bash
  npm run build
  npx wrangler deploy
  ```
