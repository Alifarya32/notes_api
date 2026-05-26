# AI Notes API

Platform catatan belajar berbasis AI yang mengubah dokumen (**PDF**, **DOCX**, **TXT**) menjadi **ringkasan**, **kuis pilihan ganda**, dan **flashcard** interaktif. Proyek ini mencakup **REST API** (Node.js + Express) dan **frontend** vanilla (HTML/CSS/JS) dengan tema *Ultra-Modern Cyberpunk Corporate Dark*.

**Live:** [https://notesa-api.vercel.app](https://notesa-api.vercel.app)

---

## Fitur Utama

| Modul | Deskripsi |
|--------|-----------|
| **Autentikasi** | Register/login email, **Login dengan Google**, JWT access + refresh token |
| **Upload Catatan** | Drag & drop file (maks. 10MB), ekstraksi teks otomatis |
| **Ringkasan AI** | Ringkasan materi via **Google Gemini** |
| **Kuis** | 5 soal pilihan ganda (A–D) yang dihasilkan AI |
| **Flashcards** | 10 kartu hafalan dengan animasi flip 3D |
| **Keamanan** | Helmet, rate limiting, CORS, bcrypt, validasi Zod |

---

## Tech Stack

### Backend
- **Node.js** + **Express 5**
- **PostgreSQL** + **Prisma ORM**
- **JWT** (access 15 menit + refresh 7 hari)
- **Google Auth Library** (verifikasi OAuth)
- **Google Generative AI** (Gemini)
- **Cloudinary** + **Multer** (penyimpanan file)
- **pdf-parse**, **mammoth** (ekstraksi teks)

### Frontend
- Vanilla **HTML5**, **CSS3** (Grid & Flexbox), **JavaScript** (Fetch API)
- Tanpa Tailwind/Bootstrap

### Deploy
- **Vercel** (serverless + static files)

---

## Struktur Proyek

```
notes-api/
├── api/
│   └── index.js              # Entry point Vercel Serverless
├── prisma/
│   ├── schema.prisma         # Model database
│   └── migrations/           # Migrasi SQL
├── src/
│   ├── app.js                # Express app + static frontend
│   ├── config/               # DB, env, multer, cloudinary
│   ├── controllers/          # auth, notes
│   ├── middlewares/          # auth, security, validation
│   ├── routes/               # auth, notes
│   ├── services/             # AI, Google, token, upload, dll.
│   ├── validations/          # Skema Zod
│   ├── utils/
│   └── public/               # Frontend (HTML, CSS, JS)
│       ├── index.html          # Login & Register
│       ├── dashboard.html      # Upload & daftar catatan
│       ├── detail-note.html    # Ringkasan, kuis, flashcards
│       └── assets/
│           ├── css/style.css
│           └── js/
│               ├── config.js   # URL API & Google Client ID
│               ├── session.js  # Token & refresh otomatis
│               ├── auth.js
│               ├── main.js
│               └── detail.js
├── vercel.json
├── package.json
└── README.md
```

---

## Prasyarat

- **Node.js** 18+
- Akun **PostgreSQL** (mis. [Neon](https://neon.tech))
- Akun **Cloudinary** (upload file)
- API Key **Google Gemini**
- **Google Cloud Console** (OAuth Client ID untuk login Google)

---

## Instalasi Lokal

### 1. Clone & install dependensi

```bash
git clone https://github.com/Alifarya32/notes_api.git
cd notes-api
npm install
```

### 2. Environment variables

Buat file `.env` di root proyek:

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# JWT (gunakan string acak panjang, min. 32 karakter)
JWT_SECRET="secret-access-token-anda"
JWT_REFRESH_SECRET="secret-refresh-berbeda"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES_DAYS="7"

# Google OAuth
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"

# CORS (pisahkan dengan koma)
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:5500"

# AI & Cloudinary
GEMINI_API_KEY="your-gemini-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Migrasi database

```bash
npx prisma migrate deploy
# atau saat development:
npx prisma migrate dev
```

### 4. Jalankan server

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

Frontend dan API berjalan di port yang sama.

---

## Setup Login Google

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Buat **OAuth client ID** → tipe **Web application**
3. **Authorized JavaScript origins:**
   - `https://notesa-api.vercel.app`
   - `http://localhost:3000`
   - `http://127.0.0.1:5500` (opsional, Live Server)
4. Salin **Client ID**
5. Set di **Vercel** → Environment Variables → `GOOGLE_CLIENT_ID`
6. (Opsional) Isi juga di `src/public/assets/js/config.js`:

```javascript
GOOGLE_CLIENT_ID: 'xxxx.apps.googleusercontent.com',
```

7. **Redeploy** project Vercel setelah menambah env

Cek konfigurasi:

```text
GET https://notesa-api.vercel.app/api/v1/auth/config
```

Response harus berisi `"googleEnabled": true` dan `googleClientId`.

---

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Tambahkan semua environment variables (sama seperti `.env`)
4. Deploy — script `vercel-build` menjalankan `prisma generate` dan `prisma migrate deploy`

File `vercel.json` mengarahkan semua request ke `api/index.js` (Express), termasuk file static di `src/public/`.

---

## Halaman Frontend

| URL | Halaman |
|-----|---------|
| `/` | Login, register, tombol Google |
| `/dashboard.html` | Upload file, search, grid catatan |
| `/detail-note.html?id={uuid}` | Ringkasan, kuis, flashcards |

---

## API Endpoints

Base URL: `/api/v1`

### Auth

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/auth/config` | — | Config publik (Google Client ID) |
| `POST` | `/auth/register` | — | Daftar akun (email + password) |
| `POST` | `/auth/login` | — | Login email |
| `POST` | `/auth/google` | — | Login dengan Google ID token |
| `POST` | `/auth/refresh` | — | Perbarui access token |
| `POST` | `/auth/logout` | Bearer | Hapus refresh token |
| `GET` | `/auth/me` | Bearer | Profil user |

### Notes

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/notes/health-check` | — | Health check modul notes |
| `GET` | `/notes` | Bearer | Daftar catatan (`?q=&page=&limit=`) |
| `POST` | `/notes/upload` | Bearer | Upload file (`multipart/form-data`, field: `file`) |
| `GET` | `/notes/:id` | Bearer | Detail catatan |
| `POST` | `/notes/:id/generate-quiz` | Bearer | Generate kuis AI |
| `POST` | `/notes/:id/generate-flashcards` | Bearer | Generate flashcards AI |

### Header autentikasi

```http
Authorization: Bearer <access_token>
```

### Contoh respons sukses

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "uuid",
      "name": "Nama",
      "email": "user@email.com"
    }
  }
}
```

---

## Keamanan

- **Helmet** — security headers & CSP
- **Rate limiting** — 30 req/15 menit (auth), 120 req/menit (API)
- **CORS** — hanya origin di `ALLOWED_ORIGINS`
- **Password** — bcrypt (12 rounds), min. 8 karakter, huruf + angka
- **JWT** — access token singkat + refresh token di-hash di database
- **Google OAuth** — verifikasi ID token di server
- **Validasi input** — Zod pada route auth & notes

---

## Format File yang Didukung

- `.pdf`
- `.docx` / `.doc`
- `.txt`

Ukuran maksimal: **10 MB**

---

## Scripts NPM

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Development dengan nodemon |
| `npm start` | Production lokal |
| `npm run vercel-build` | Build Vercel (Prisma generate + migrate) |

---

## Troubleshooting

### Tombol Google tidak muncul
- Pastikan `GOOGLE_CLIENT_ID` ada di Vercel Environment Variables
- **Redeploy** setelah menambah env
- Cek `GET /api/v1/auth/config` → `googleEnabled: true`
- Pastikan origin Vercel ada di Google Console

### CSS tidak tampil (Live Server)
- Buka folder **`src/public/`** sebagai root Live Server
- Path asset: `assets/css/style.css` (relatif ke HTML)

### Upload gagal
- Cek env Cloudinary
- Pastikan Bearer token valid

### Kuis/flashcard gagal dibuat
- Konten catatan minimal ~100 karakter setelah ekstraksi
- Cek `GEMINI_API_KEY` di environment

---

## Lisensi

ISC

---

## Author

**Alifarya32** — [GitHub](https://github.com/Alifarya32/notes_api)
