# ⚠️ SETUP WAJIB - Sistem Polling Supabase

## 🚨 PENTING! Baca Ini Dulu!

Website ini menggunakan **Supabase database** untuk sistem polling real-time. Tanpa setup ini, polling tidak akan berfungsi dan akan muncul error "Koneksi ke server gagal".

---

## 📋 Langkah Setup (5 Menit)

### 1️⃣ Buka Supabase Dashboard
- Login ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Pilih project Anda: **krchvhkgjbkxaudatzon**

### 2️⃣ Buka SQL Editor
- Di sidebar kiri, klik **"SQL Editor"**
- Klik tombol **"New Query"**

### 3️⃣ Copy & Paste Query Ini

```sql
-- ========================================
-- SETUP POLLING TABLE - COPY SEMUA!
-- ========================================

-- 1. Buat tabel polls
CREATE TABLE IF NOT EXISTS polls (
  id BIGSERIAL PRIMARY KEY,
  poll_type TEXT NOT NULL,
  option_name TEXT NOT NULL,
  anonymous_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_poll UNIQUE(poll_type, anonymous_user_id)
);

-- 2. Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_polls_poll_type ON polls(poll_type);
CREATE INDEX IF NOT EXISTS idx_polls_anonymous_user_id ON polls(anonymous_user_id);

-- 3. Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- 4. Policy untuk service role (backend bisa read/write semua)
CREATE POLICY IF NOT EXISTS "Service role can do anything"
ON polls
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Policy untuk anonymous users (read only)
CREATE POLICY IF NOT EXISTS "Anyone can read polls"
ON polls
FOR SELECT
TO anon
USING (true);

-- 6. Berhasil!
SELECT 'Setup berhasil! Tabel polls siap digunakan.' AS message;
```

### 4️⃣ Run Query
- Klik tombol **"Run"** (atau tekan **Ctrl/Cmd + Enter**)
- Tunggu sampai muncul: **"Success. No rows returned"** atau **"Setup berhasil!"**

### 5️⃣ Verifikasi
- Di sidebar kiri, klik **"Table Editor"**
- Pastikan tabel **`polls`** sudah muncul
- Cek kolom-kolomnya:
  - ✅ `id` (bigint, primary key)
  - ✅ `poll_type` (text)
  - ✅ `option_name` (text)
  - ✅ `anonymous_user_id` (text)
  - ✅ `created_at` (timestamp)
  - ✅ `updated_at` (timestamp)

---

## ✅ Cara Ngecek Setup Berhasil

1. **Buka website** di browser
2. **Scroll ke bagian polling** (Tentukan Pilihan)
3. **Pilih salah satu opsi** dan tunggu 3 detik
4. **Cek di Supabase**:
   - Buka **Table Editor** → **polls**
   - Harusnya muncul 1 row data baru
5. **Refresh website** di tab lain
   - Vote count harusnya **update** otomatis

---

## 🔍 Troubleshooting

### ❌ Error: "relation polls does not exist"
**Penyebab**: Tabel belum dibuat  
**Solusi**: Jalankan SQL query di atas (langkah 3)

### ❌ Error: "permission denied for table polls"
**Penyebab**: RLS policy belum di-setup  
**Solusi**: Pastikan step 3-5 di SQL query sudah dijalankan semua

### ❌ Error: "duplicate key value violates unique constraint"
**Penyebab**: User mencoba vote 2x (ini sebenarnya normal, akan auto-update)  
**Solusi**: Tidak perlu fix, sistem akan handle dengan UPSERT

### ❌ Vote tidak muncul di browser lain
**Penyebab**: Koneksi lambat atau cache browser  
**Solusi**: 
1. Refresh halaman (F5)
2. Clear cache browser
3. Coba incognito mode

### ❌ Total suara tidak update
**Penyebab**: Server belum deployed atau env variable salah  
**Solusi**:
1. Cek console browser (F12) untuk error messages
2. Pastikan edge function sudah deployed
3. Test endpoint: `https://krchvhkgjbkxaudatzon.supabase.co/functions/v1/make-server-861a1fb5/health`
   - Harusnya return: `{"status":"ok","timestamp":"...","supabaseConnected":true}`

---

## 🎯 Cara Kerja Sistem (Technical)

### WhatsApp-Style Polling
- ✅ **Satu user, satu vote** per jenis polling (location/date)
- ✅ **Bisa ganti pilihan** kapan saja
- ✅ **Vote lama di-overwrite**, bukan ditambah
- ✅ **Real-time vote counting**
- ✅ **Anonymous user ID** dari localStorage

### Database Schema
```
polls table:
├── id                    (bigint, auto-increment)
├── poll_type             (text: "location" | "date")
├── option_name           (text: nama pilihan)
├── anonymous_user_id     (text: ID unik per user)
├── created_at            (timestamp)
└── updated_at            (timestamp)

UNIQUE constraint: (poll_type, anonymous_user_id)
→ Memastikan 1 user = 1 vote per poll type
```

### Flow Voting
```
1. User pilih opsi
   ↓
2. Timer 3 detik (bisa ganti pilihan)
   ↓
3. Auto-save → UPSERT ke database
   • Belum pernah vote → INSERT new row
   • Sudah pernah vote → UPDATE existing row
   ↓
4. Server return vote counts (agregasi)
   ↓
5. Frontend update UI real-time
```

### API Endpoints

**Base URL**: `https://krchvhkgjbkxaudatzon.supabase.co/functions/v1/make-server-861a1fb5`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/health` | Health check server |
| GET | `/votes` | Get semua vote counts |
| GET | `/my-vote/:pollType/:userId` | Get vote user saat ini |
| POST | `/vote/:pollType` | Upsert vote (insert/update) |
| DELETE | `/vote/:pollType/:userId` | Delete vote (cancel) |

---

## 🧪 Testing Manual

### Test 1: Vote Baru
1. Buka website di **Chrome**
2. Pilih "Bebek Kaleo Jababeka"
3. Tunggu 3 detik → Muncul checkmark ✓
4. Cek Supabase Table Editor → Ada 1 row baru

### Test 2: Ganti Vote
1. Masih di tab yang sama
2. Klik "Tana Bambu Cibubur"
3. Tunggu 3 detik
4. Cek Supabase → Row yang sama, option_name berubah

### Test 3: Multi-User
1. Buka website di **Firefox** (user kedua)
2. Vote "Tana Bambu Cibubur"
3. Refresh Chrome → Vote count bertambah
4. Cek Supabase → Ada 2 rows (Chrome & Firefox)

### Test 4: Cancel Vote
1. Di Chrome, klik pilihan yang sama lagi
2. Vote terhapus
3. Cek Supabase → Row Chrome hilang

---

## 📞 Bantuan

Jika masih error setelah setup:

1. **Screenshot error message** di browser console (F12)
2. **Check Supabase logs**:
   - Dashboard → Edge Functions → Logs
3. **Test API manual**:
   ```bash
   curl https://krchvhkgjbkxaudatzon.supabase.co/functions/v1/make-server-861a1fb5/health
   ```

---

**💡 Tips**: Setelah setup berhasil, sistem akan jalan otomatis. User tidak perlu tau ini pake database, mereka tinggal vote aja! 🎉
