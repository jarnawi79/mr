/**
 * REKAP NILAI KUIS — Google Apps Script
 * Menerima hasil kuis siswa dari game "Kuis Seru Belajar" dan menyimpannya
 * ke Google Sheets milik guru, lalu membuat rekap per siswa dan analisis soal.
 *
 * Cara pasang singkat (panduan lengkap: PANDUAN.md):
 *  1. Buat Google Sheets baru → Ekstensi → Apps Script → tempel seluruh kode ini → Simpan.
 *  2. Pilih fungsi "siapkan" → Jalankan → berikan izin.
 *  3. Terapkan → Deployment baru → Aplikasi web
 *     (Jalankan sebagai: Saya; Yang memiliki akses: Siapa saja) → Terapkan → salin URL.
 *  4. Tempel URL ke sel B3 sheet "Pengaturan", lalu salin "Kode Sambungan" di sel B4
 *     ke kolom "Kirim nilai ke Google Sheets" di game.
 *
 * Data yang disimpan hanya: nama & kelas yang diketik siswa, jawaban, dan nilai.
 */

const SH_HASIL = 'Hasil';
const SH_DETAIL = 'Detail Jawaban';
const SH_REKAP = 'Rekap per Siswa';
const SH_ANALISIS = 'Analisis Soal';
const SH_SET = 'Pengaturan';

const HEAD_HASIL = ['Waktu Kirim', 'Kode Kuis', 'Judul Kuis', 'Mata Pelajaran', 'Kelas Kuis', 'Nama Siswa', 'Kelas Siswa',
  'Percobaan ke-', 'Benar', 'Salah', 'Waktu Habis', 'Jumlah Soal', 'Nilai', 'Durasi (detik)', 'ID Pengerjaan'];
const HEAD_DETAIL = ['Waktu Kirim', 'Kode Kuis', 'Judul Kuis', 'Nama Siswa', 'Kelas Siswa', 'Soal', 'Jawaban Siswa', 'Kunci', 'Status', 'ID Pengerjaan'];

/* ---------------- Menu ---------------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('📊 Kuis')
    .addItem('1. Siapkan sheet', 'siapkan')
    .addItem('2. Tampilkan kode sambungan', 'tampilkanKode')
    .addSeparator()
    .addItem('Perbarui rekap & analisis soal', 'perbaruiRekap')
    .addToUi();
}

/* ---------------- Persiapan ---------------- */
function siapkan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  buatSheet_(ss, SH_HASIL, HEAD_HASIL);
  buatSheet_(ss, SH_DETAIL, HEAD_DETAIL);
  let set = ss.getSheetByName(SH_SET);
  if (!set) set = ss.insertSheet(SH_SET);
  if (!set.getRange('B2').getValue()) {
    set.getRange('A1:B1').setValues([['Pengaturan', 'Isi']]);
    set.getRange('A2:B2').setValues([['Kode rahasia (dibuat otomatis)', token_()]]);
    set.getRange('A3:B3').setValues([['URL Aplikasi Web (tempel di sini setelah Terapkan)', '']]);
    set.getRange('A4').setValue('KODE SAMBUNGAN → salin ke game');
    set.getRange('B4').setValue('(isi B3 dulu — kode muncul otomatis)');
    set.getRange('A6').setValue('Catatan: jangan bagikan Kode Sambungan ke publik. Jika bocor, hapus isi B2, jalankan "Siapkan sheet" lagi, lalu buat tautan kuis baru.');
    set.getRange('A1:B1').setFontWeight('bold');
    set.getRange('A4:B4').setFontWeight('bold').setBackground('#fff3bf');
    set.setColumnWidth(1, 330); set.setColumnWidth(2, 520);
  }
  try {
    SpreadsheetApp.getUi().alert('✅ Sheet siap.\n\nLangkah berikutnya:\n1. Terapkan → Deployment baru → Aplikasi web\n   (Jalankan sebagai: Saya, Akses: Siapa saja).\n2. Salin URL aplikasi web ke sel B3 sheet "Pengaturan".\n3. Salin Kode Sambungan di B4 ke game.');
  } catch (e) { /* dijalankan dari editor tanpa UI */ }
}

function tampilkanKode() {
  const set = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH_SET);
  if (!set) return SpreadsheetApp.getUi().alert('Jalankan menu "1. Siapkan sheet" dulu.');
  const url = String(set.getRange('B3').getValue() || '').trim();
  if (!url) return SpreadsheetApp.getUi().alert('Sel B3 (URL Aplikasi Web) masih kosong.\nTerapkan sebagai Aplikasi web terlebih dahulu, lalu tempel URL-nya di B3.');
  SpreadsheetApp.getUi().alert('Kode Sambungan (salin ke game):\n\n' + kodeSambungan_(url, set.getRange('B2').getValue()));
}

/* Saat guru menempel URL di B3, Kode Sambungan di B4 dibuat otomatis */
function onEdit(e) {
  const r = e && e.range;
  if (!r || r.getSheet().getName() !== SH_SET || r.getA1Notation() !== 'B3') return;
  const sh = r.getSheet(), url = String(r.getValue() || '').trim();
  sh.getRange('B4').setValue(url ? kodeSambungan_(url, sh.getRange('B2').getValue()) : '(isi B3 dulu — kode muncul otomatis)');
}

/* ---------------- Web App ---------------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.ping) {
    if (!tokenCocok_(p.k)) return json_({ ok: false, error: 'Kode sambungan salah. Salin ulang dari sel B4 sheet "Pengaturan".' });
    return json_({ ok: true, app: 'rekap-kuis', sheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
  }
  return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">Rekap Nilai Kuis aktif. Halaman ini dipakai oleh game kuis, bukan untuk dibuka langsung.</p>');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const k = (e && e.parameter && e.parameter.k) || '';
    if (!tokenCocok_(k)) return json_({ ok: false, error: 'Kode sambungan salah.' });
    let d;
    try { d = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: 'Data tidak terbaca.' }); }
    const err = validasi_(d);
    if (err) return json_({ ok: false, error: err });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hasil = buatSheet_(ss, SH_HASIL, HEAD_HASIL);
    const detail = buatSheet_(ss, SH_DETAIL, HEAD_DETAIL);

    // Abaikan kiriman ganda (misalnya siswa menekan "kirim ulang")
    const last = hasil.getLastRow();
    const rows = last > 1 ? hasil.getRange(2, 1, last - 1, HEAD_HASIL.length).getValues() : [];
    if (rows.some(r => r[14] === d.uid)) return json_({ ok: true, duplikat: true });

    const nama = bersih_(d.nama, 60), kelas = bersih_(d.kelas, 30);
    const percobaan = 1 + rows.filter(r => r[1] === d.id && norm_(r[5]) === norm_(nama) && norm_(r[6]) === norm_(kelas)).length;
    const now = new Date();
    hasil.appendRow([now, bersih_(d.id, 20), bersih_(d.judul, 100), bersih_(d.mapel, 60), bersih_(d.kelasKuis, 40), nama, kelas,
      percobaan, angka_(d.benar), angka_(d.salah), angka_(d.habis), angka_(d.n), angka_(d.nilai), angka_(d.durasi), bersih_(d.uid, 40)]);

    if (Array.isArray(d.detail) && d.detail.length) {
      const det = d.detail.slice(0, 200).map(x => [now, bersih_(d.id, 20), bersih_(d.judul, 100), nama, kelas,
        bersih_(x.soal, 500), bersih_(x.jawab, 200), bersih_(x.kunci, 200), bersih_(x.status, 20), bersih_(d.uid, 40)]);
      detail.getRange(detail.getLastRow() + 1, 1, det.length, HEAD_DETAIL.length).setValues(det);
    }
    return json_({ ok: true, percobaan: percobaan });
  } catch (x) {
    return json_({ ok: false, error: 'Server sibuk, coba lagi. (' + x.message + ')' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------------- Rekap & analisis ---------------- */
function perbaruiRekap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hasil = ss.getSheetByName(SH_HASIL), detail = ss.getSheetByName(SH_DETAIL);
  if (!hasil || hasil.getLastRow() < 2) { try { SpreadsheetApp.getUi().alert('Belum ada nilai yang masuk.'); } catch (e) {} return; }

  // Rekap per siswa per kuis
  const H = hasil.getRange(2, 1, hasil.getLastRow() - 1, HEAD_HASIL.length).getValues();
  const map = {};
  H.forEach(r => {
    const key = [r[1], norm_(r[5]), norm_(r[6])].join('|');
    const m = map[key] || (map[key] = { judul: r[2], mapel: r[3], nama: r[5], kelas: r[6], n: 0, tinggi: 0, akhir: 0, waktu: null });
    m.n++; m.tinggi = Math.max(m.tinggi, Number(r[12]) || 0);
    if (!m.waktu || r[0] >= m.waktu) { m.waktu = r[0]; m.akhir = Number(r[12]) || 0; }
  });
  const rekap = Object.values(map)
    .sort((a, b) => String(a.judul).localeCompare(String(b.judul)) || String(a.kelas).localeCompare(String(b.kelas)) || String(a.nama).localeCompare(String(b.nama)))
    .map(m => [m.judul, m.mapel, m.kelas, m.nama, m.n, m.tinggi, m.akhir, m.waktu]);
  tulis_(ss, SH_REKAP, ['Judul Kuis', 'Mata Pelajaran', 'Kelas Siswa', 'Nama Siswa', 'Jumlah Percobaan', 'Nilai Tertinggi', 'Nilai Terakhir', 'Terakhir Mengerjakan'], rekap);

  // Analisis soal: persentase benar, urut dari yang paling sulit
  if (detail && detail.getLastRow() > 1) {
    const Dt = detail.getRange(2, 1, detail.getLastRow() - 1, HEAD_DETAIL.length).getValues();
    const s = {};
    Dt.forEach(r => {
      const key = r[2] + '|' + r[5];
      const m = s[key] || (s[key] = { judul: r[2], soal: r[5], kunci: r[7], total: 0, benar: 0, habis: 0, salahJ: {} });
      m.total++;
      if (r[8] === 'Benar') m.benar++;
      else if (r[8] === 'Waktu habis') m.habis++;
      else m.salahJ[r[6]] = (m.salahJ[r[6]] || 0) + 1;
    });
    const an = Object.values(s).map(m => {
      const top = Object.keys(m.salahJ).sort((a, b) => m.salahJ[b] - m.salahJ[a])[0] || '-';
      return [m.judul, m.soal, m.kunci, m.total, m.benar, Math.round(m.benar / m.total * 100), m.habis, top];
    }).sort((a, b) => String(a[0]).localeCompare(String(b[0])) || a[5] - b[5]);
    tulis_(ss, SH_ANALISIS, ['Judul Kuis', 'Soal', 'Kunci', 'Dijawab', 'Benar', '% Benar', 'Waktu Habis', 'Jawaban Salah Terbanyak'], an);
    const sh = ss.getSheetByName(SH_ANALISIS);
    if (an.length) {
      const rules = [
        SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(50).setBackground('#ffe3e3').setRanges([sh.getRange(2, 6, an.length, 1)]).build(),
        SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(80).setBackground('#d3f9d8').setRanges([sh.getRange(2, 6, an.length, 1)]).build()
      ];
      sh.setConditionalFormatRules(rules);
    }
  }
  try { SpreadsheetApp.getUi().alert('✅ Rekap per siswa dan analisis soal sudah diperbarui.'); } catch (e) {}
}

/* ---------------- Utilitas ---------------- */
function buatSheet_(ss, name, head) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#e7f5ff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function tulis_(ss, name, head, rows) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#e7f5ff');
  sh.setFrozenRows(1);
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows);
}
function token_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function tokenCocok_(k) {
  const set = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH_SET);
  const t = set ? String(set.getRange('B2').getValue() || '').trim() : '';
  return !t || String(k || '') === t;   // jika B2 dikosongkan, kode tidak diperiksa
}
function kodeSambungan_(url, t) { return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'k=' + t; }
function validasi_(d) {
  if (!d || typeof d !== 'object') return 'Data kosong.';
  if (!String(d.nama || '').trim()) return 'Nama siswa kosong.';
  if (!String(d.kelas || '').trim()) return 'Kelas siswa kosong.';
  if (!d.uid || !d.id) return 'Data kuis tidak lengkap.';
  const n = Number(d.n), b = Number(d.benar);
  if (!(n > 0 && n <= 200) || !(b >= 0 && b <= n)) return 'Jumlah soal tidak valid.';
  return '';
}
/* Teks dari siswa disimpan sebagai teks biasa (mencegah rumus/formula disisipkan) */
function bersih_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function angka_(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function norm_(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
