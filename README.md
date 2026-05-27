# MinePlanner - Build Tracker

Aplikasi web sederhana untuk melacak progress build Minecraft. Catat material apa yang dibutuhkan, berapa yang sudah terkumpul, dan lihat progress setiap proyek dalam satu tampilan.

Tidak butuh server atau database. Semua data disimpan di browser. Bisa langsung di-host di GitHub Pages.

---

## Fitur

- Daftar build dengan filter kategori dan pencarian
- Progress bar per build dan per material
- Klik material untuk toggle sudah terkumpul / belum
- Upload foto build, disimpan di browser
- Tambah build baru lewat form manual
- Import file .schematic / .nbt / .litematic untuk baca material otomatis
- Dark mode dan light mode
- Data tidak hilang saat refresh

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

Upload file dari tool Minecraft yang kamu pakai:

```
.schematic  -- MCEdit, WorldEdit
.nbt        -- struktur vanilla
.litematic  -- Litematica mod
```

Nama build otomatis diisi dari nama file. Material dibaca langsung di browser, tidak ada file yang dikirim ke internet.

Catatan: kebanyakan file .schematic terkompresi. Supaya bisa terbaca, tambahkan baris ini di `index.html` sebelum tag script lainnya:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
```

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

## Edit Data Bawaan

Buka `data/builds.json` untuk mengubah build yang muncul saat pertama kali aplikasi dibuka.

Contoh satu build:

```json
{
  "id": 1,
  "nama": "Medieval Castle",
  "kategori": "Megabuild",
  "icon": null,
  "deskripsi": "Kastil gaya medieval.",
  "materials": [
    {
      "nama": "Stone Brick",
      "dibutuhkan": 5000,
      "terkumpul": 0,
      "icon": null
    }
  ]
}
```

Field `icon` bisa diisi path ke file gambar, misalnya `"assets/castle.png"`. Kalau `null`, akan tampil placeholder teks.

---

## Teknologi yang Dipakai

- HTML, CSS, JavaScript biasa (tanpa framework)
- localStorage untuk simpan data
- FileReader API untuk baca file schematic
- Canvas API untuk resize gambar
- NBT parser ditulis sendiri, tidak pakai library eksternal
