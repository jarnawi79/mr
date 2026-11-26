# Panduan Rekap Nilai Otomatis ke Google Sheets

Dengan fitur ini, siswa mengerjakan kuis dari tautan (misalnya lewat WhatsApp), mengisi **nama** dan **kelas**, lalu nilainya **masuk otomatis** ke Google Sheets milik guru. Spreadsheet juga bisa membuat **rekap per siswa** dan **analisis soal tersulit**.

- **Biaya:** gratis, cukup akun Google (Gmail).
- **Waktu pemasangan:** ±10 menit, hanya sekali.
- **Tempat data:** Google Drive guru sendiri. Data yang disimpan hanya nama dan kelas yang diketik siswa, jawaban, serta nilai.

---

## Bagian 1 — Pasang Rekap Nilai di Google Sheets (sekali saja)

### Langkah 1. Buat spreadsheet baru
1. Buka **sheets.google.com** lalu klik **Kosong** (Blank).
2. Beri nama, misalnya **Rekap Nilai Kuis – SMPN 20 Kaur**.

### Langkah 2. Tempel kode Apps Script
1. Di menu atas spreadsheet, klik **Ekstensi → Apps Script** (*Extensions → Apps Script*).
2. Hapus semua isi bawaan di editor (`function myFunction() {...}`).
3. Salin **seluruh isi file `Code.gs`**, lalu tempel ke editor.
4. Klik ikon **💾 Simpan proyek** (atau tekan Ctrl+S).

### Langkah 3. Jalankan fungsi `siapkan`
1. Di bagian atas editor, pada daftar fungsi, pilih **siapkan**.
2. Klik **▶ Jalankan** (*Run*).
3. Muncul permintaan izin. Klik **Tinjau izin** (*Review permissions*), lalu pilih akun Google Anda.
4. Jika muncul peringatan *"Google belum memverifikasi aplikasi ini"*, klik **Lanjutan** (*Advanced*), lalu **Buka … (tidak aman)** (*Go to … (unsafe)*), lalu **Izinkan** (*Allow*).
   > Peringatan ini wajar karena skripnya buatan Anda sendiri, bukan aplikasi dari toko. Skrip hanya mengakses spreadsheet ini.
5. Kembali ke tab spreadsheet. Sekarang ada sheet **Hasil**, **Detail Jawaban**, dan **Pengaturan**, serta menu baru **📊 Kuis**.

### Langkah 4. Terapkan sebagai Aplikasi Web
1. Di editor Apps Script, klik tombol biru **Terapkan → Deployment baru** (*Deploy → New deployment*).
2. Klik ikon ⚙️ di sebelah *Pilih jenis*, lalu pilih **Aplikasi web** (*Web app*).
3. Isi:
   - **Deskripsi:** Rekap Nilai Kuis
   - **Jalankan sebagai:** **Saya** (*Me*)
   - **Yang memiliki akses:** **Siapa saja** (*Anyone*) ← **wajib**. Tanpa ini, siswa tidak bisa mengirim nilai.
4. Klik **Terapkan** (*Deploy*), lalu salin **URL Aplikasi web** (diawali `https://script.google.com/macros/s/…/exec`).

### Langkah 5. Ambil Kode Sambungan
1. Buka sheet **Pengaturan** di spreadsheet.
2. Tempel URL tadi ke sel **B3**.
3. Sel **B4** otomatis berisi **Kode Sambungan**. Salin isi sel B4.
   > Jika B4 tidak berubah, klik menu **📊 Kuis → 2. Tampilkan kode sambungan**.

✅ Pemasangan selesai. Kode Sambungan ini bisa dipakai berulang kali untuk banyak kuis.

---

## Bagian 2 — Membuat kuis yang nilainya terkirim

1. Buka game dari alamat web: **https://jarnawi79.github.io/mr/** lalu klik **Mulai**.
2. Pilih jenjang, kelas, dan mapel. Pada **Materi**, pilih **✍️ Soal buatan guru**.
3. Isi **Judul kuis** dan soal-soal (ketik, tempel dari Google Sheets/Excel, atau impor CSV).
4. Di kotak **📊 Kirim nilai siswa ke Google Sheets**, tempel **Kode Sambungan**, lalu klik **🔌 Tes koneksi**. Pastikan muncul ✅ *Tersambung ke spreadsheet …*.
5. (Opsional) Centang **Mode ulangan** jika siswa tidak boleh melihat benar/salah, kunci, dan pembahasan. Siswa hanya melihat nilai akhir.
6. Klik **🔗 Buat Tautan untuk Siswa**, lalu **💬 Kirim via WhatsApp** atau **📋 Salin tautan**.

---

## Bagian 3 — Yang dialami siswa

1. Siswa membuka tautan, lalu mengisi **Nama lengkap** dan **Kelas**.
2. Siswa mengerjakan soal sampai selesai.
3. Di halaman hasil muncul **✅ Nilai berhasil diterima guru**.
4. **Jika sinyal hilang:** nilai disimpan di HP siswa dan dikirim otomatis saat kuis dibuka lagi dengan internet. Siswa juga bisa menekan **📤 Kirim ulang nilai**.

---

## Bagian 4 — Melihat nilai

| Sheet | Isi |
|---|---|
| **Hasil** | Satu baris untuk setiap pengerjaan: waktu, kuis, nama, kelas, percobaan ke-, benar/salah, nilai, durasi |
| **Detail Jawaban** | Jawaban setiap siswa untuk setiap soal |
| **Rekap per Siswa** | Jumlah percobaan, nilai tertinggi, dan nilai terakhir |
| **Analisis Soal** | Persentase benar setiap soal, diurutkan dari yang **paling sulit**, beserta jawaban salah yang paling sering dipilih (merah = di bawah 50%, hijau = 80% ke atas) |

Sheet **Rekap per Siswa** dan **Analisis Soal** dibuat atau diperbarui lewat menu **📊 Kuis → Perbarui rekap & analisis soal**.

> 💡 Hasil **Analisis Soal** bisa dipakai untuk menentukan materi remedial: soal dengan persentase benar rendah menunjukkan materi yang belum dikuasai kelas.

---

## Masalah yang sering terjadi

| Gejala | Penyebab & solusi |
|---|---|
| Tes koneksi: *"Akses Aplikasi Web belum diatur…"* | Pada Langkah 4, **Yang memiliki akses** harus **Siapa saja**. Ubah lewat **Terapkan → Kelola deployment → ✏️ Edit**. |
| Tes koneksi: *"Kode sambungan salah"* | Salin ulang isi sel **B4**, jangan URL di B3 saja. |
| Tes koneksi: *"Belum tersambung"* | Pastikan sudah **Terapkan** dan Kode Sambungan disalin lengkap sampai akhir (`…?k=…`). |
| Siswa: *"Nilai ditolak spreadsheet guru"* | Kode sambungan berubah atau akses diubah. Perbaiki, buat tautan kuis baru, lalu bagikan ulang. |
| Kode Sambungan tersebar ke orang lain | Hapus isi **B2**, jalankan **📊 Kuis → 1. Siapkan sheet** (kode baru dibuat), lalu buat tautan kuis baru. |
| Setelah mengubah kode `Code.gs` | **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**. Dengan cara ini URL tetap sama. |

---

## Catatan penting

- **Uji coba dulu.** Coba dengan beberapa siswa sebelum ulangan sungguhan, terutama jika satu kelas menekan "Selesai" hampir bersamaan. Google membatasi jumlah proses yang berjalan bersamaan. Skrip ini mengantrekan kiriman agar tidak bertabrakan, tetapi kapasitas nyatanya perlu dibuktikan di kelas Anda.
- **Data siswa.** Cukup minta nama dan kelas. Jangan meminta NISN, nomor HP, atau data pribadi lain.
- **Kuis berulang.** Jika siswa mengerjakan lebih dari sekali, semua percobaan tercatat (kolom *Percobaan ke-*). Sheet *Rekap per Siswa* menampilkan nilai tertinggi dan nilai terakhir.
- **Nama siswa diketik sendiri.** Penulisan yang berbeda (misalnya "Siti" dan "Siti Aminah") akan tercatat sebagai dua siswa. Ingatkan siswa menulis nama lengkap yang sama setiap kali.
