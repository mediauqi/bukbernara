# Setup Database Supabase untuk Sistem Polling

## Langkah Setup (Wajib Dilakukan!)

Karena sistem polling sekarang menggunakan database Supabase yang proper, Anda perlu membuat tabel `polls` terlebih dahulu.

### 1. Buka Supabase Dashboard
- Login ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Pilih project Anda

### 2. Buka SQL Editor
- Klik menu "SQL Editor" di sidebar kiri
- Klik "New Query"

### 3. Jalankan SQL Query Berikut

```sql
-- Buat tabel polls
CREATE TABLE IF NOT EXISTS polls (
  id BIGSERIAL PRIMARY KEY,
  poll_type TEXT NOT NULL,
  option_name TEXT NOT NULL,
  anonymous_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_type, anonymous_user_id)
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_polls_poll_type ON polls(poll_type);
CREATE INDEX IF NOT EXISTS idx_polls_anonymous_user_id ON polls(anonymous_user_id);

-- Berikan akses ke service role
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Policy untuk service role (backend bisa read/write semua)
CREATE POLICY "Service role can do anything"
ON polls
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy untuk anonymous users (read only untuk aggregated data)
CREATE POLICY "Anyone can read polls"
ON polls
FOR SELECT
TO anon
USING (true);
```

### 4. Klik "Run" atau tekan Ctrl+Enter

### 5. Verifikasi
- Buka menu "Table Editor"
- Pastikan tabel `polls` sudah muncul dengan kolom:
  - id (bigint)
  - poll_type (text)
  - option_name (text)
  - anonymous_user_id (text)
  - created_at (timestamp)
  - updated_at (timestamp)

## Cara Kerja Sistem Polling Baru

### Konsep WhatsApp-style Polling
- **Satu user, satu pilihan per polling**
- User bisa **ganti pilihan** kapan saja
- Pilihan lama akan **ditimpa** (overwrite), bukan ditambah
- Vote tersimpan **langsung ke database**, bukan localStorage

### Anonymous User ID
- Setiap pengunjung mendapat ID unik: `anon_[timestamp]_[random]`
- ID disimpan di localStorage browser
- ID ini digunakan untuk tracking vote per user
- Tidak perlu login atau registrasi

### Database Schema
- `poll_type`: "location" atau "date"
- `option_name`: Nama pilihan (misal: "Bebek Kaleo Jababeka")
- `anonymous_user_id`: ID unik pengunjung
- **UNIQUE constraint** pada (poll_type, anonymous_user_id) memastikan satu user hanya punya satu vote per polling

### Flow Voting
1. User pilih opsi → Timer 3 detik
2. Setelah 3 detik → **UPSERT** ke database
   - Jika belum pernah vote: **INSERT** data baru
   - Jika sudah pernah vote: **UPDATE** pilihan lama
3. Vote count dihitung real-time dari database
4. User bisa batalkan vote (DELETE) atau ganti pilihan (UPDATE)

## Troubleshooting

### Error: "relation polls does not exist"
**Solusi**: Anda belum membuat tabel. Jalankan SQL query di atas.

### Error: "insufficient_privilege"
**Solusi**: Pastikan RLS (Row Level Security) policy sudah disetup dengan benar.

### Vote tidak tersimpan
**Solusi**: 
1. Cek console browser untuk error messages
2. Pastikan SUPABASE_SERVICE_ROLE_KEY sudah diset
3. Cek apakah edge function sudah deployed

### Vote terduplikasi
**Solusi**: Pastikan UNIQUE constraint pada (poll_type, anonymous_user_id) sudah ada.

## Testing

Setelah setup, test dengan:
1. Buka website di 2 browser berbeda (Chrome & Firefox)
2. Vote di browser pertama
3. Cek apakah vote muncul di browser kedua (refresh)
4. Ganti vote di browser pertama
5. Pastikan vote count berubah, bukan bertambah

## Technical Details

### API Endpoints

**GET /votes**
- Mendapatkan semua vote count (agregasi)
- Public endpoint

**GET /my-vote/:pollType/:userId**
- Mendapatkan pilihan user saat ini
- Untuk restore state saat page reload

**POST /vote/:pollType**
- Upsert vote (insert or update)
- Body: `{ anonymousUserId, option }`

**DELETE /vote/:pollType/:userId**
- Hapus vote user
- Untuk cancel voting

---

**Dibuat untuk**: Buka Bareng Nara Event Website
**Database**: Supabase PostgreSQL
**Backend**: Supabase Edge Functions (Deno)
**Frontend**: React + TypeScript
