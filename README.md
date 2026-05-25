<div align="center">

# 🌸 Fresh Cute Flower

### Web App Pemesanan Buket Bunga Berbasis Cloud

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

**[🔗 Live Demo](https://freshcuteflowers.vercel.app)** · **[🐛 Laporkan Bug](https://github.com/mochraflyar/fresh-cute-flower/issues)**

</div>

---

## 📌 Tentang Project

**Fresh Cute Flower** adalah web app pemesanan buket bunga yang dibangun dari nol menggunakan HTML, CSS, dan JavaScript murni — tanpa framework apapun.

Project ini dibuat sebagai solusi nyata untuk usaha florist kecil agar bisa menerima pesanan secara online. Data pesanan tersimpan secara real-time di cloud menggunakan **Supabase (PostgreSQL)**, dan di-deploy menggunakan **Vercel** sehingga bisa diakses kapan saja dan di mana saja.

---

## ✨ Fitur Lengkap

### 🛍️ Halaman Pembeli (`index.html`)
- Form pemesanan buket yang mudah digunakan
- Pilihan produk: 10K
- Animasi kelopak bunga beterbangan
- Cek status pesanan berdasarkan nomor WhatsApp
- Riwayat pesanan lengkap dengan status terkini
- Notifikasi sukses setelah pesanan terkirim
- Tampilan responsif — nyaman di HP maupun desktop

### 🔐 Panel Admin (`admin.html`)
- Login dengan password sebelum bisa masuk
- Lihat semua pesanan masuk secara real-time
- Filter pesanan: Semua / Baru / Diproses / Selesai
- Ubah status pesanan (Baru → Diproses → Selesai)
- Hubungi pembeli langsung via WhatsApp
- Statistik ringkasan (total, baru, diproses, selesai)
- Auto refresh data setiap 30 detik
- Export data pesanan ke file Excel (.xlsx)

### 💰 Laporan Keuangan
- Pemasukan otomatis tercatat saat pesanan berstatus "Selesai"
- Input transaksi manual (pemasukan & pengeluaran)
- Grafik batang pemasukan vs pengeluaran per bulan
- Tabel riwayat semua transaksi
- Ringkasan: total pemasukan, pengeluaran, dan saldo bersih
- Export laporan keuangan ke Excel

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| **HTML5** | Struktur dan konten halaman |
| **CSS3** | Tampilan, animasi, dan desain responsif |
| **JavaScript (Vanilla)** | Logika, interaksi, dan DOM manipulation |
| **Supabase** | Database cloud PostgreSQL + REST API |
| **Vercel** | Hosting dan auto-deploy dari GitHub |
| **Chart.js** | Visualisasi grafik laporan keuangan |
| **SheetJS (XLSX)** | Export data ke format Excel |
| **Google Fonts** | Tipografi (Playfair Display, Cormorant Garamond, Poppins) |

---

## 📁 Struktur Folder

```
fresh-cute-flower/
│
├── index.html          ← Halaman pembeli (form order + cek status)
├── admin.html          ← Panel admin (kelola pesanan + keuangan)
│
├── css/
│   ├── style.css       ← Styling halaman pembeli
│   └── admin.css       ← Styling panel admin
│
├── js/
│   ├── main.js         ← Logika halaman pembeli
│   └── admin.js        ← Logika panel admin + keuangan
│
└── assets/
    ├── logo.png        ← Logo Fresh Cute Flower
    └── favicon.png     ← Icon tab browser
```

---

## 🗄️ Struktur Database (Supabase)

### Tabel `pesanan`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigserial | Primary key, auto increment |
| `nama_pembeli` | text | Nama lengkap pembeli |
| `nomor_hp` | text | Nomor WhatsApp pembeli |
| `alamat` | text | Alamat pengiriman |
| `detail_order` | text | Detail produk & tanggal kirim |
| `total_harga` | integer | Total harga dalam rupiah |
| `status` | text | baru / diproses / selesai |
| `tanggal` | date | Tanggal pengiriman yang dipilih |
| `created_at` | timestamptz | Waktu pesanan masuk (auto) |

### Tabel `keuangan`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigserial | Primary key, auto increment |
| `jenis` | text | pemasukan / pengeluaran |
| `kategori` | text | Pesanan / Beli Bahan / Operasional / dll |
| `keterangan` | text | Deskripsi transaksi |
| `jumlah` | integer | Nominal dalam rupiah |
| `tanggal` | date | Tanggal transaksi |
| `created_at` | timestamptz | Waktu input (auto) |

---

## 🚀 Cara Deploy Sendiri

### 1. Clone repository ini
```bash
git clone https://github.com/mochraflyar/fresh-cute-flower.git
cd fresh-cute-flower
```

### 2. Buat project di Supabase
- Daftar di [supabase.com](https://supabase.com)
- Buat project baru
- Jalankan SQL berikut di SQL Editor:

```sql
-- Buat tabel pesanan
CREATE TABLE public.pesanan (
  id            bigserial PRIMARY KEY,
  nama_pembeli  text,
  nomor_hp      text,
  alamat        text,
  detail_order  text,
  total_harga   integer,
  status        text DEFAULT 'baru',
  tanggal       date,
  created_at    timestamptz DEFAULT now()
);

-- Buat tabel keuangan
CREATE TABLE public.keuangan (
  id          bigserial PRIMARY KEY,
  jenis       text NOT NULL,
  kategori    text,
  keterangan  text,
  jumlah      integer NOT NULL,
  tanggal     date NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Nonaktifkan RLS (izinkan akses publik)
ALTER TABLE public.pesanan  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.pesanan  TO anon;
GRANT ALL ON public.keuangan TO anon;
GRANT USAGE, SELECT ON SEQUENCE pesanan_id_seq  TO anon;
GRANT USAGE, SELECT ON SEQUENCE keuangan_id_seq TO anon;
```

### 3. Ganti konfigurasi Supabase
Buka `js/main.js` dan `js/admin.js`, ganti bagian ini dengan milik kamu:
```javascript
const SUPABASE_URL      = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
```

### 4. Deploy ke Vercel
- Push ke GitHub
- Buka [vercel.com](https://vercel.com) → Import repository
- Klik Deploy — selesai! 🎉

---

## 📸 Screenshot

> Tambahkan screenshot web kamu di sini!
> Caranya: drag & drop gambar langsung ke editor README di GitHub

---

## 💡 Pelajaran yang Didapat

Selama membangun project ini, saya belajar:

- Cara membangun web app lengkap dari nol tanpa framework
- Integrasi database cloud (Supabase) dengan JavaScript vanilla
- Konsep separation of concerns (HTML, CSS, JS dipisah)
- Deploy dan hosting menggunakan Vercel + GitHub CI/CD
- Visualisasi data dengan Chart.js
- Export data ke Excel menggunakan SheetJS
- Desain UI yang responsif dan estetik

---

## 📄 Lisensi

Project ini dibuat untuk keperluan portofolio dan pembelajaran.
Feel free to use as a reference! 🌸

---

<div align="center">

Dibuat dengan 🌸 oleh **[Moch Rafly Abdillah Rachman](https://github.com/mochraflyar)** · 2026

</div>
