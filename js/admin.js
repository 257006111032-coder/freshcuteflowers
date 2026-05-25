// ============================================
// js/admin.js
// JavaScript untuk halaman admin (admin.html)
// ============================================

// ============================================
// KONFIGURASI
// Ubah password & Supabase sesuai milikmu
// ============================================
const ADMIN_PASSWORD    = 'RipkaCantik';
const SUPABASE_URL      = "https://vhfhitghvmgqzxbglzfp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZmhpdGdodm1ncXp4YmdsemZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODU4NzEsImV4cCI6MjA5NDk2MTg3MX0.bJfdceQ44DQ8C35kZ_RT557EVBikku5B7BQqiYnJAWw";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel global
let currentFilter = 'semua';
let globalOrders  = [];
let keuChart      = null;


// ============================================
// FUNGSI FORMAT NOMOR WA
// Ubah 08xxx → 628xxx (format internasional)
// ============================================
function formatWA(nomor) {
  nomor = nomor.trim();
  // Kalau diawali 0, ganti dengan 62
  if (nomor.startsWith('0')) {
    return '62' + nomor.slice(1);
  }
  // Kalau sudah pakai 62, biarkan
  if (nomor.startsWith('62')) {
    return nomor;
  }
  // Kalau pakai +62, hapus tanda +
  if (nomor.startsWith('+62')) {
    return nomor.slice(1);
  }
  // Default: langsung pakai
  return nomor;
}

// ============================================
// 1. FUNGSI LOGIN
//    Cek password, tampilkan panel kalau benar
// ============================================
function doLogin() {
  const input   = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('loginError');

  if (input === ADMIN_PASSWORD) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').classList.add('visible');
    // Simpan status login di sessionStorage
    // (hilang saat tab/browser ditutup)
    sessionStorage.setItem('fcf_admin', 'yes');
    fetchOrdersFromDB();
  } else {
    // Password salah: animasi goyang
    errorEl.classList.remove('show');
    void errorEl.offsetWidth; // reset animasi
    errorEl.classList.add('show');
    document.getElementById('passwordInput').value = '';
  }
}


// ============================================
// 2. FUNGSI LOGOUT
// ============================================
function doLogout() {
  if (confirm('Yakin ingin keluar dari panel admin?')) {
    sessionStorage.removeItem('fcf_admin');
    location.reload();
  }
}


// ============================================
// 3. CEK STATUS LOGIN SEBELUMNYA
//    Kalau tab belum ditutup & sudah login,
//    langsung masuk tanpa input password lagi
// ============================================
if (sessionStorage.getItem('fcf_admin') === 'yes') {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminPage').classList.add('visible');
  fetchOrdersFromDB();
}


// ============================================
// 4. SET TANGGAL HARI INI DI FORM KEUANGAN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const tglEl = document.getElementById('keuTanggal');
  if (tglEl) tglEl.value = today;
});


// ============================================
// 5. SWITCH TAB — Pesanan / Keuangan
// ============================================
function switchTab(tab, btn) {
  // Update tombol aktif
  document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const pesananSection  = document.querySelector('.pesanan-section');
  const keuanganSection = document.getElementById('keuanganSection');

  if (tab === 'keuangan') {
    pesananSection.classList.add('hidden');
    keuanganSection.classList.add('visible');
    fetchKeuangan();
  } else {
    pesananSection.classList.remove('hidden');
    keuanganSection.classList.remove('visible');
  }
}


// ============================================
// 6. AMBIL DATA PESANAN DARI SUPABASE
// ============================================
function fetchOrdersFromDB() {
  _supabase
    .from('pesanan')
    .select('*')
    .order('id', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.error('Gagal mengambil data pesanan:', error.message);
      } else {
        globalOrders = data;
        renderOrders();
      }
    });
}


// ============================================
// 7. FILTER TAB STATUS PESANAN
// ============================================
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderOrders();
}


// ============================================
// 8. UPDATE STATISTIK PESANAN
// ============================================
function updateStats(orders) {
  document.getElementById('statTotal').textContent   = orders.length;
  document.getElementById('statBaru').textContent    = orders.filter(o => (o.status || 'baru') === 'baru').length;
  document.getElementById('statProses').textContent  = orders.filter(o => o.status === 'diproses').length;
  document.getElementById('statSelesai').textContent = orders.filter(o => o.status === 'selesai').length;
}


// ============================================
// 9. RENDER DAFTAR KARTU PESANAN
// ============================================
function renderOrders() {
  updateStats(globalOrders);

  // Filter berdasarkan status yang aktif
  const filtered = currentFilter === 'semua'
    ? globalOrders
    : globalOrders.filter(o => (o.status || 'baru') === currentFilter);

  const list = document.getElementById('orderList');

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada pesanan di kategori ini~ 🌷</div>';
    return;
  }

  // .map() = ubah tiap pesanan jadi string HTML
  list.innerHTML = filtered.map(order => {
    const status = order.status || 'baru';

    const badgeClass = { baru:'badge-baru', diproses:'badge-proses', selesai:'badge-selesai' }[status] || 'badge-baru';
    const badgeLabel = { baru:'🔵 Baru',    diproses:'🟡 Diproses',  selesai:'🟢 Selesai'   }[status] || '🔵 Baru';

    // Format tanggal pesanan
    const tgl = order.tanggal
      ? new Date(order.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      : '-';

    return `
      <div class="order-card" id="card-${order.id}">
        <div class="order-head">
          <span class="order-name">🌸 ${order.nama_pembeli}</span>
          <span class="order-time">${tgl}</span>
        </div>
        <div class="order-badge">${order.detail_order}</div>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
        <div class="order-info" style="margin-top:0.6rem">
          <div class="order-row">
            <span class="lbl">📱 HP</span>
            <span class="val">${order.nomor_hp}</span>
          </div>
          <div class="order-row">
            <span class="lbl">💰 Total Harga</span>
            <span class="val">Rp ${parseInt(order.total_harga || 0).toLocaleString('id-ID')}</span>
          </div>
          <div class="order-row">
            <span class="lbl">📍 Alamat</span>
            <span class="val">${order.alamat}</span>
          </div>
        </div>
        <div class="order-actions">
          <label style="font-size:0.75rem;color:var(--text-muted)">Ubah status:</label>
          <select class="status-select" onchange="updateStatus(${order.id}, this.value)">
            <option value="baru"     ${status==='baru'     ? 'selected':''}>🔵 Baru</option>
            <option value="diproses" ${status==='diproses' ? 'selected':''}>🟡 Diproses</option>
            <option value="selesai"  ${status==='selesai'  ? 'selected':''}>🟢 Selesai</option>
          </select>
          <button class="del-btn" onclick="deleteOrder(${order.id})">Hapus 🗑</button>
          <a href="https://wa.me/${formatWA(order.nomor_hp)}" target="_blank"
             style="text-decoration:none;background:#25D366;color:white;padding:5px 10px;border-radius:6px;font-size:0.8rem;">
            💬 WA
          </a>
        </div>
      </div>
    `;
  }).join('');
}


// ============================================
// 10. UPDATE STATUS PESANAN KE SUPABASE
//     Jika diubah jadi "selesai", otomatis
//     catat pemasukan di tabel keuangan
// ============================================
function updateStatus(id, newStatus) {
  _supabase.from('pesanan').update({ status: newStatus }).eq('id', id)
  .then(({ error }) => {
    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
    } else {
      // Kalau status jadi selesai → catat pemasukan otomatis
      if (newStatus === 'selesai') {
        const order = globalOrders.find(o => o.id === id);
        if (order) catatPemasukanOtomatis(order);
      }
      fetchOrdersFromDB();
    }
  });
}


// ============================================
// 11. HAPUS SATU PESANAN
// ============================================
function deleteOrder(id) {
  if (!confirm('Hapus pesanan ini secara permanen?')) return;

  _supabase.from('pesanan').delete().eq('id', id)
  .then(({ error }) => {
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchOrdersFromDB();
  });
}


// ============================================
// 12. HAPUS SEMUA PESANAN
// ============================================
function clearAll() {
  if (!confirm('Yakin hapus SEMUA pesanan? Tidak bisa dibatalkan!')) return;

  _supabase.from('pesanan').delete().gt('id', 0)
  .then(({ error }) => {
    if (error) alert('Gagal menghapus semua: ' + error.message);
    else fetchOrdersFromDB();
  });
}


// ============================================
// 13. AUTO REFRESH TIAP 30 DETIK
// ============================================
setInterval(() => {
  if (document.getElementById('adminPage').classList.contains('visible')) {
    fetchOrdersFromDB();
  }
}, 30000);


// ============================================
// ============================================
// BAGIAN KEUANGAN
// ============================================
// ============================================


// ============================================
// 14. AMBIL DATA KEUANGAN DARI SUPABASE
// ============================================
function fetchKeuangan() {
  _supabase
    .from('keuangan')
    .select('*')
    .order('tanggal', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.error('Gagal ambil data keuangan:', error.message);
        return;
      }
      renderKeuangan(data || []);
    });
}


// ============================================
// 15. RENDER SEMUA DATA KEUANGAN
//     Hitung total, update UI, render tabel & grafik
// ============================================
function renderKeuangan(data) {
  let totalMasuk  = 0;
  let totalKeluar = 0;

  // Hitung total pemasukan dan pengeluaran
  data.forEach(t => {
    if (t.jenis === 'pemasukan')   totalMasuk  += parseInt(t.jumlah || 0);
    if (t.jenis === 'pengeluaran') totalKeluar += parseInt(t.jumlah || 0);
  });

  const saldo = totalMasuk - totalKeluar;

  // Update angka ringkasan di UI
  document.getElementById('totalMasuk').textContent  = 'Rp ' + totalMasuk.toLocaleString('id-ID');
  document.getElementById('totalKeluar').textContent = 'Rp ' + totalKeluar.toLocaleString('id-ID');
  document.getElementById('totalSaldo').textContent  = 'Rp ' + saldo.toLocaleString('id-ID');
  // Saldo merah kalau minus, biru kalau positif
  document.getElementById('totalSaldo').style.color  = saldo >= 0 ? '#1565c0' : '#c62828';

  renderKeuTable(data);
  renderKeuChart(data);
}


// ============================================
// 16. RENDER TABEL RIWAYAT TRANSAKSI
// ============================================
function renderKeuTable(data) {
  const tbody = document.getElementById('keuTableBody');

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#bbb;padding:1.5rem">Belum ada transaksi</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(t => {
    const tgl = t.tanggal
      ? new Date(t.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric'
        })
      : '-';

    const badgeCls   = t.jenis === 'pemasukan' ? 'badge-masuk' : 'badge-keluar';
    const jenisLabel = t.jenis === 'pemasukan' ? '💚 Masuk'   : '❤️ Keluar';
    const nominal    = 'Rp ' + parseInt(t.jumlah).toLocaleString('id-ID');
    const warna      = t.jenis === 'pemasukan' ? '#2e7d32' : '#c62828';

    return `
      <tr>
        <td>${tgl}</td>
        <td><span class="${badgeCls}">${jenisLabel}</span></td>
        <td>${t.kategori || '-'}</td>
        <td>${t.keterangan || '-'}</td>
        <td style="font-weight:600;color:${warna}">${nominal}</td>
        <td>
          <button class="del-keu-btn" onclick="hapusTransaksi(${t.id})">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}


// ============================================
// 17. RENDER GRAFIK BULANAN (Chart.js)
//     Kelompokkan data per bulan → tampilkan bar chart
// ============================================
function renderKeuChart(data) {
  // Kelompokkan transaksi per bulan
  // Key format: "2026-05" (tahun-bulan)
  const bulanMap = {};

  data.forEach(t => {
    if (!t.tanggal) return;
    const key = t.tanggal.slice(0, 7);
    if (!bulanMap[key]) bulanMap[key] = { masuk: 0, keluar: 0 };
    if (t.jenis === 'pemasukan')   bulanMap[key].masuk  += parseInt(t.jumlah || 0);
    if (t.jenis === 'pengeluaran') bulanMap[key].keluar += parseInt(t.jumlah || 0);
  });

  // Urutkan dari bulan paling lama
  const keys = Object.keys(bulanMap).sort();

  // Format label jadi "Mei 2026"
  const labels = keys.map(k => {
    const [y, m] = k.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', {
      month: 'long', year: 'numeric'
    });
  });

  const dataMasuk  = keys.map(k => bulanMap[k].masuk);
  const dataKeluar = keys.map(k => bulanMap[k].keluar);

  const ctx = document.getElementById('keuChart').getContext('2d');

  // Hancurkan chart lama agar tidak tumpang tindih
  if (keuChart) keuChart.destroy();

  keuChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: dataMasuk,
          backgroundColor: 'rgba(46, 125, 50, 0.7)',
          borderColor: '#2e7d32',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Pengeluaran',
          data: dataKeluar,
          backgroundColor: 'rgba(198, 40, 40, 0.7)',
          borderColor: '#c62828',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            // Format tooltip jadi Rupiah
            label: ctx => 'Rp ' + ctx.raw.toLocaleString('id-ID')
          }
        }
      },
      scales: {
        y: {
          ticks: {
            // Format sumbu Y jadi Rupiah
            callback: val => 'Rp ' + val.toLocaleString('id-ID')
          }
        }
      }
    }
  });
}


// ============================================
// 18. TAMBAH TRANSAKSI MANUAL
//     Dipanggil saat tombol "Simpan" diklik
// ============================================
function tambahTransaksi() {
  const jenis      = document.getElementById('keuJenis').value;
  const kategori   = document.getElementById('keuKategori').value;
  const jumlah     = document.getElementById('keuJumlah').value;
  const tanggal    = document.getElementById('keuTanggal').value;
  const keterangan = document.getElementById('keuKeterangan').value.trim();

  if (!jumlah || !tanggal) {
    alert('Nominal dan tanggal harus diisi ya~ 🌷');
    return;
  }

  // Insert ke tabel keuangan di Supabase
  _supabase.from('keuangan').insert([{
    jenis,
    kategori,
    jumlah:     parseInt(jumlah),
    tanggal,
    keterangan: keterangan || '-'
  }])
  .then(({ error }) => {
    if (error) {
      alert('Gagal simpan transaksi: ' + error.message);
    } else {
      // Reset form input
      document.getElementById('keuJumlah').value     = '';
      document.getElementById('keuKeterangan').value = '';
      // Refresh tampilan
      fetchKeuangan();
    }
  });
}


// ============================================
// 19. HAPUS SATU TRANSAKSI KEUANGAN
// ============================================
function hapusTransaksi(id) {
  if (!confirm('Hapus transaksi ini?')) return;

  _supabase.from('keuangan').delete().eq('id', id)
  .then(({ error }) => {
    if (error) alert('Gagal hapus: ' + error.message);
    else fetchKeuangan();
  });
}


// ============================================
// 20. CATAT PEMASUKAN OTOMATIS
//     Dipanggil saat admin ubah status pesanan
//     menjadi "selesai"
// ============================================
function catatPemasukanOtomatis(order) {
  _supabase.from('keuangan').insert([{
    jenis:      'pemasukan',
    kategori:   'Pesanan',
    jumlah:     parseInt(order.total_harga || 0),
    tanggal:    new Date().toISOString().split('T')[0],
    keterangan: `Pesanan ${order.nama_pembeli} - ${order.detail_order}`
  }])
  .then(({ error }) => {
    if (error) console.warn('Gagal catat pemasukan otomatis:', error.message);
  });
}

// ============================================
// EXPORT EXCEL — Pakai library SheetJS
// Ambil data dari Supabase → convert → download
// ============================================


// --------------------------------------------
// Export data PESANAN ke Excel
// --------------------------------------------
function exportPesanan() {
  // Ambil data pesanan terbaru dari Supabase
  _supabase
    .from('pesanan')
    .select('*')
    .order('id', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        alert('Gagal ambil data: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert('Belum ada data pesanan untuk di-export!');
        return;
      }

      // Ubah data jadi format yang rapi untuk Excel
      // Setiap objek = satu baris di Excel
      const rows = data.map(o => ({
        'No'            : o.id,
        'Nama Pembeli'  : o.nama_pembeli || '-',
        'Nomor HP'      : o.nomor_hp || '-',
        'Detail Order'  : o.detail_order || '-',
        'Alamat'        : o.alamat || '-',
        'Total Harga'   : o.total_harga || 0,
        'Status'        : o.status || 'baru',
        'Tanggal Kirim' : o.tanggal || '-',
        'Tanggal Masuk' : o.created_at
          ? new Date(o.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          : '-'
      }));

      // Buat worksheet dari array of objects
      // XLSX.utils.json_to_sheet = konversi JSON → sheet Excel
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Atur lebar kolom agar tidak terlalu sempit
      worksheet['!cols'] = [
        { wch: 6  },  // No
        { wch: 20 },  // Nama Pembeli
        { wch: 16 },  // Nomor HP
        { wch: 40 },  // Detail Order
        { wch: 30 },  // Alamat
        { wch: 14 },  // Total Harga
        { wch: 12 },  // Status
        { wch: 16 },  // Tanggal Kirim
        { wch: 20 },  // Tanggal Masuk
      ];

      // Buat workbook (file Excel) dan masukkan worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pesanan');

      // Generate nama file dengan tanggal hari ini
      const today = new Date().toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, '-');

      // Download file .xlsx
      // XLSX.writeFile = simpan file ke komputer user
      XLSX.writeFile(workbook, `Pesanan_FreshCuteFlower_${today}.xlsx`);
    });
}


// --------------------------------------------
// Export data KEUANGAN ke Excel
// --------------------------------------------
function exportKeuangan() {
  _supabase
    .from('keuangan')
    .select('*')
    .order('tanggal', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        alert('Gagal ambil data: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert('Belum ada data keuangan untuk di-export!');
        return;
      }

      // Hitung total pemasukan & pengeluaran
      let totalMasuk  = 0;
      let totalKeluar = 0;

      data.forEach(t => {
        if (t.jenis === 'pemasukan')   totalMasuk  += parseInt(t.jumlah || 0);
        if (t.jenis === 'pengeluaran') totalKeluar += parseInt(t.jumlah || 0);
      });

      // Buat baris data transaksi
      const rows = data.map(t => ({
        'No'          : t.id,
        'Tanggal'     : t.tanggal
          ? new Date(t.tanggal).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          : '-',
        'Jenis'       : t.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        'Kategori'    : t.kategori || '-',
        'Keterangan'  : t.keterangan || '-',
        'Nominal (Rp)': parseInt(t.jumlah || 0),
      }));

      // Tambah baris kosong + baris ringkasan di bawah tabel
      rows.push({});  // baris kosong pemisah
      rows.push({
        'No'          : '',
        'Tanggal'     : '',
        'Jenis'       : 'TOTAL PEMASUKAN',
        'Kategori'    : '',
        'Keterangan'  : '',
        'Nominal (Rp)': totalMasuk,
      });
      rows.push({
        'No'          : '',
        'Tanggal'     : '',
        'Jenis'       : 'TOTAL PENGELUARAN',
        'Kategori'    : '',
        'Keterangan'  : '',
        'Nominal (Rp)': totalKeluar,
      });
      rows.push({
        'No'          : '',
        'Tanggal'     : '',
        'Jenis'       : 'SALDO BERSIH',
        'Kategori'    : '',
        'Keterangan'  : '',
        'Nominal (Rp)': totalMasuk - totalKeluar,
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Atur lebar kolom
      worksheet['!cols'] = [
        { wch: 6  },  // No
        { wch: 20 },  // Tanggal
        { wch: 16 },  // Jenis
        { wch: 16 },  // Kategori
        { wch: 35 },  // Keterangan
        { wch: 16 },  // Nominal
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan');

      const today = new Date().toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, '-');

      XLSX.writeFile(workbook, `Keuangan_FreshCuteFlower_${today}.xlsx`);
    });
}
