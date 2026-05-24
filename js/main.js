// ============================================
// js/main.js
// JavaScript untuk halaman pembeli (index.html)
// ============================================

// ============================================
// KONFIGURASI SUPABASE
// Ganti dengan URL & KEY project kamu sendiri
// ============================================
const SUPABASE_URL      = "https://vhfhitghvmgqzxbglzfp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZmhpdGdodm1ncXp4YmdsemZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODU4NzEsImV4cCI6MjA5NDk2MTg3MX0.bJfdceQ44DQ8C35kZ_RT557EVBikku5B7BQqiYnJAWw";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ============================================
// 1. ANIMASI KELOPAK GUGUR
//    Membuat elemen div baru secara dinamis
//    dan menjalankan animasi CSS "fall"
// ============================================
const petalEmojis = ['🌸', '🌺', '🌷', '💮', '🏵️'];

function createPetal() {
  const el = document.createElement('div');
  el.className = 'petal';
  el.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
  el.style.left            = Math.random() * 100 + 'vw';
  el.style.fontSize        = (0.9 + Math.random() * 1.1) + 'rem';
  const dur                = 7 + Math.random() * 7;
  el.style.animationDuration = dur + 's';
  el.style.animationDelay  = (Math.random() * 4) + 's';
  el.style.opacity         = 0.5 + Math.random() * 0.5;
  document.body.appendChild(el);
  // Hapus elemen setelah animasi selesai agar tidak menumpuk
  setTimeout(() => el.remove(), (dur + 5) * 1000);
}

// Buat kelopak baru tiap 1.3 detik
setInterval(createPetal, 1300);
// Langsung buat 6 kelopak saat halaman pertama dibuka
for (let i = 0; i < 6; i++) setTimeout(createPetal, i * 400);


// ============================================
// 2. SUBMIT PESANAN KE SUPABASE
//    Dipanggil saat tombol "Kirim Pesanan" diklik
// ============================================
function submitOrder() {
  // Ambil nilai semua input
  const nama    = document.getElementById('nama').value.trim();
  const nohp    = document.getElementById('nohp').value.trim();
  const produk  = document.getElementById('produk').value;
  const jumlah  = document.getElementById('jumlah').value;
  const tanggal = document.getElementById('tanggal').value;
  const alamat  = document.getElementById('alamat').value.trim();
  const catatan = document.getElementById('catatan').value.trim();

  // Validasi: semua field wajib harus terisi
  if (!nama || !nohp || !produk || !jumlah || !tanggal || !alamat) {
    alert('Mohon lengkapi semua field ya~ 🌷');
    return;
  }

  // Hitung harga per pcs berdasarkan produk
  let hargaPerPcs = 0;
  if      (produk === 'Buket 20K') hargaPerPcs = 20000;
  else if (produk === 'Buket 10K') hargaPerPcs = 10000;
  else if (produk === 'Buket 5K')  hargaPerPcs = 5000;

  const totalHarga = parseInt(jumlah) * hargaPerPcs;

  // Susun teks detail order
  let teksDetailOrder = `Produk: ${produk} (${jumlah} pcs) | Tgl Kirim: ${tanggal}`;
  if (catatan) teksDetailOrder += ` | Catatan: ${catatan}`;

  // Kirim data ke Supabase — tabel "pesanan"
  _supabase.from('pesanan').insert([{
    nama_pembeli: nama,
    nomor_hp:     nohp,
    alamat:       alamat,
    detail_order: teksDetailOrder,
    total_harga:  totalHarga,
    status:       'baru',
    tanggal:      tanggal
  }])
  .then(({ error }) => {
    if (error) {
      alert('Gagal mengirim pesanan: ' + error.message);
    } else {
      // Tampilkan toast notifikasi sukses
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4500);

      // Reset semua field input ke kosong
      ['nama','nohp','jumlah','tanggal','alamat','catatan'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('produk').value = '';

      // Otomatis isi nomor HP di kolom cek history
      // dan langsung tampilkan riwayat pesanan
      document.getElementById('searchHp').value = nohp;
      searchHistory();
    }
  });
}


// ============================================
// 3. CEK HISTORY PESANAN PEMBELI
//    Filter berdasarkan nomor HP yang dimasukkan
//    Hanya tampil pesanan milik nomor HP itu
// ============================================
function searchHistory() {
  const hp        = document.getElementById('searchHp').value.trim();
  const resultsEl = document.getElementById('historyResults');

  if (!hp) {
    alert('Masukkan nomor WhatsApp kamu dulu ya~ 🌷');
    return;
  }

  // Tampilkan area hasil + loading indicator
  resultsEl.classList.add('show');
  resultsEl.innerHTML = '<div class="history-loading">🌸 Sedang mencari pesananmu...</div>';

  // Query ke Supabase:
  // .eq('nomor_hp', hp)              → filter nomor HP yang sama persis
  // .order('id', { ascending: false })→ terbaru tampil di atas
  _supabase
    .from('pesanan')
    .select('*')
    .eq('nomor_hp', hp)
    .order('id', { ascending: false })
    .then(({ data, error }) => {

      if (error) {
        resultsEl.innerHTML = `<div class="history-empty">Gagal mengambil data: ${error.message}</div>`;
        return;
      }

      // Tidak ada pesanan dengan nomor HP ini
      if (!data || data.length === 0) {
        resultsEl.innerHTML = `
          <div class="history-empty">
            Belum ada pesanan dengan nomor <b>${hp}</b> 🌷<br>
            <small style="font-size:0.8rem;margin-top:4px;display:block">
              Pastikan nomor yang kamu masukkan sama dengan saat pesan
            </small>
          </div>
        `;
        return;
      }

      // Ada pesanan — ambil nama dari data pertama
      const namaPembeli = data[0].nama_pembeli;

      // Render kartu tiap pesanan
      const cards = data.map(order => {
        const status = order.status || 'baru';

        // Map status ke class CSS dan label
        const badgeMap = {
          baru:     { cls: 'status-baru',     icon: '🔵', label: 'Pesanan Baru' },
          diproses: { cls: 'status-diproses', icon: '🟡', label: 'Sedang Diproses' },
          selesai:  { cls: 'status-selesai',  icon: '🟢', label: 'Selesai / Siap Kirim' }
        };
        const badge = badgeMap[status] || badgeMap['baru'];

        // Format tanggal masuk (created_at dari Supabase)
        const waktuMasuk = order.created_at
          ? new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          : '-';

        // Format total harga ke Rupiah
        const totalFmt = order.total_harga
          ? 'Rp ' + parseInt(order.total_harga).toLocaleString('id-ID')
          : '-';

        return `
          <div class="history-card">
            <div class="hcard-head">
              <span class="hcard-produk">💐 ${order.detail_order}</span>
              <span class="hcard-waktu">${waktuMasuk}</span>
            </div>
            <div class="hcard-info">
              <div class="hcard-row">
                <span class="lbl">💰 Total</span>
                <span class="val">${totalFmt}</span>
              </div>
              <div class="hcard-row">
                <span class="lbl">📍 Alamat</span>
                <span class="val">${order.alamat}</span>
              </div>
            </div>
            <span class="status-badge ${badge.cls}">
              ${badge.icon} ${badge.label}
            </span>
          </div>
        `;
      }).join('');

      // Tampilkan info nama + semua kartu pesanan
      resultsEl.innerHTML = `
        <div class="history-info">
          Halo, <b>${namaPembeli}</b>! 🌸 Kamu punya <b>${data.length}</b> pesanan
        </div>
        ${cards}
      `;
    });
}