# NusanCBT - Dashboard Siswa & LMS Terintegrasi

Aplikasi portal pembelajaran sekolah terintegrasi berbasis **React + TypeScript + Vite + Tailwind CSS**. Menyediakan dashboard siswa, pemutar materi & video playlist, perpustakaan digital E-Library (LMS), agenda & pencatat tugas siswa, serta panel pengaturan admin/guru.

## Fitur Utama

- **Dashboard Utama**: Ringkasan menu pembelajaran dinamis dengan penjadwalan jam buka/tutup otomatis, pengumuman sekolah terbaru, running text (marquee), jam digital real-time, kalkulator mengambang, dan penghitung pengunjung.
- **Pemutar Materi & Playlist Video**: Menampilkan materi eksternal dan embed otomatis YouTube (mendukung multi-URL / playlist dengan daftar putar samping).
- **Perpustakaan Digital / E-Library (LMS)**: Filter materi berdasarkan kelas, pratinjau dokumen PDF langsung di aplikasi, serta unduh materi dari Google Drive.
- **Agenda & Tugas Siswa**: Pencatatan PR/tugas per mata pelajaran dengan tenggat waktu, indikator keterlambatan, dan statistik penyelesaian yang tersimpan di peramban.
- **Panel Pengaturan Admin**: Dilindungi kata sandi untuk mengelola materi dashboard, unggah/ubah nama/hapus PDF E-Library, manajemen kelas, menu dasar, pengumuman, serta identitas & keamanan aplikasi.

## Menjalankan Proyek

1. Instal dependensi:
   ```bash
   npm install
   ```
2. Salin konfigurasi `.env.example` ke `.env` bila ingin mengganti endpoint Google Apps Script (`VITE_GOOGLE_SCRIPT_URL`).
3. Jalankan server pengembangan (port `3000`):
   ```bash
   npm run dev
   ```
4. Build untuk produksi:
   ```bash
   npm run build
   ```
