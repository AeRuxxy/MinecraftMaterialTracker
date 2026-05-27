# AeRuxxy - Material Tracker

Aplikasi web sederhana untuk melacak jumlah material build Minecraft. Catat material apa yang dibutuhkan, berapa yang sudah terkumpul, dan lihat progress setiap proyek dalam satu tampilan.

---

## Fitur

- Daftar build dengan filter kategori dan pencarian
- Progress bar per build dan per material
- Klik material untuk toggle sudah terkumpul / belum
- Upload foto build
- Tambah build baru lewat form manual

---

## Cara Tambah Build Baru

Klik tombol `+` di pojok kanan atas. Pilih salah satu cara:

### Input Manual

Isi form yang muncul:
- Nama build
- Kategori (Megabuild, Farm, Storage, Dekorasi, Redstone, Lainnya)
- Deskripsi (opsional)
- Daftar material — isi nama, jumlah yang dibutuhkan, dan jumlah yang sudah ada

Klik tombol tambah baris untuk menambah material baru.

### Import Schematic

Fungsi upload schematic masih dalam pengembangan.

---

## Ganti Foto Build

1. Pilih build di sidebar kiri
2. Arahkan kursor ke kotak gambar
3. Klik tombol Ganti Gambar yang muncul
4. Pilih file gambar dari komputer

Gambar akan otomatis dikecilkan ke maksimal 256x256 piksel supaya tidak terlalu memakan tempat. Disimpan di browser sebagai base64.

Untuk hapus gambar, hover ke kotak gambar lalu klik tombol X di pojok kanan atas.

---

## Data Tersimpan di Mana

Semua data disimpan di `localStorage` browser dengan dua key:

```
mc_builds  -- semua data build, material, dan gambar
mc_theme   -- pilihan tema (dark atau light)
```

Data hanya ada di browser yang dipakai. Tidak bisa dibuka di perangkat lain atau browser lain. Kalau browser di-clear, data kembali ke bawaan dari `data/builds.json`.

---
