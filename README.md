# DecentralizedID

DecentralizedID adalah blueprint open-source untuk membangun sistem identitas mandiri (self-sovereign identity/SSI) di Indonesia. Proyek ini menunjukkan cara menerbitkan dan memverifikasi **verifiable credentials (VC)** menggunakan standar DID (Decentralized Identifier) dan verifiable presentations (VP). Tujuannya adalah menyediakan identitas digital yang dapat dimiliki dan dikendalikan oleh pengguna, serta dipercaya oleh penyedia layanan tanpa bergantung pada basis data terpusat.

Repositori ini menawarkan titik awal untuk proyek pilot **Student ID** dan menyiapkan landasan untuk use-case di masa depan, seperti reusable KYC bagi fintech, kredensial kepegawaian, atau klaim lain yang membutuhkan bukti digital terverifikasi.

---

## ✨ Tujuan Proyek

Identifikasi digital tradisional di Indonesia berpusat pada basis data terpusat dan proses onboarding berulang. Setiap layanan meminta ulang data pribadi dan scan dokumen yang sama, sehingga tidak efisien dan berpotensi bocor. DecentralizedID mengadopsi model **self-sovereign identity**:

- Pengguna memegang kunci dan kredensial sendiri dalam dompet (wallet) yang aman. Tidak ada server pusat yang menyimpan data pribadi.
- Issuer tepercaya (universitas, institusi keuangan, dll.) menandatangani kredensial yang dapat diverifikasi pihak ketiga.
- Mendukung selective disclosure dan revocation: pengguna dapat membuktikan status mahasiswa tanpa membuka seluruh transkrip, dan issuer dapat mencabut kredensial via status list.

---

## 📦 Struktur Repositori (Saran)

.
├── apps
│ ├── issuer-svc # Service NestJS untuk menerbitkan kredensial
│ ├── verifier-svc # Service NestJS untuk meminta & memverifikasi presentasi
│ └── admin-portal # (opsional) UI web bagi issuer untuk mengelola kredensial
│
├── packages
│ ├── sdk-verifier # Library TypeScript untuk integrasi verifier eksternal
│ └── shared # Tipe, skema, dan utilitas bersama
│
└── mobile
└── wallet # Aplikasi React Native tempat pengguna menyimpan DID & VC

yaml
Copy code

> **Catatan:** Struktur ini hanya saran. Anda bebas menyesuaikan sesuai kebutuhan (mis. memisahkan ke repositori berbeda).

---

## 🧠 Arsitektur Tingkat Tinggi

Sistem terdiri dari tiga peran utama: **Issuer**, **Holder**, dan **Verifier**. Issuer membuat verifiable credential; Holder (pengguna) menyimpannya di dompet; Verifier meminta presentasi untuk memeriksa kebenaran klaim.

┌────────────┐ 1. Minta credential ┌───────────┐ 3. Presentasikan ┌─────────────┐
│ Student │ ─────────────────────────▶│ Issuer │────────────────────────▶│ Verifier │
│ (Holder) │ 2. VC ditandatangani │ (mis. Univ)│ 4. Verifikasi VC+VP │ │
└────────────┘ └───────────┘ └─────────────┘

yaml
Copy code

---

## 🏗️ Teknologi yang Digunakan

| Komponen           | Teknologi                                    |
|--------------------|-----------------------------------------------|
| **Issuer/Verifier**| Node.js + NestJS, Postgres, Redis, MinIO/S3   |
| **Wallet (Holder)**| React Native (Expo), secure OS keystore       |
| **Metode DID**     | `did:web` untuk MVP; rencana ke `did:ion`     |
| **Kriptografi**    | Ed25519, JWT-VC via `jose`/`did-jwt-vc`       |
| **Selective disclosure** | SD-JWT atau BBS+ signatures (fase 2)    |
| **Status list**    | StatusList2021 (revocation/suspension)        |

### Kenapa `did:web`?

Untuk MVP, `did:web` memungkinkan Anda mempublikasikan DID document di URL yang dapat diakses (mis. `https://issuer.example.ac.id/.well-known/did.json`), tanpa harus membuat sidechain atau memanfaatkan blockchain publik. Setelah konsep teruji, Anda dapat bermigrasi ke `did:ion` atau metode lain untuk jaminan desentralisasi yang lebih kuat.

---

## 🚀 Cara Memulai

### Prasyarat

- Node.js 20+ dan npm atau pnpm  
- PostgreSQL 16  
- Redis (untuk nonce/challenge)  
- Docker & Docker Compose (opsional)

### Instalasi

1. Clone repositori:

   ```bash
   git clone https://github.com/Sukooos/DecentralizedID.git
   cd DecentralizedID
Instal dependensi (disarankan pnpm):

bash
Copy code
corepack enable
pnpm install
Konfigurasikan variabel lingkungan masing-masing layanan (.env) untuk koneksi DB, Redis, dan KMS.

Jalankan layanan:

bash
Copy code
pnpm --filter issuer-svc start:dev
pnpm --filter verifier-svc start:dev
Jalankan aplikasi wallet:

bash
Copy code
cd mobile/wallet
pnpm start
⚡ Contoh Alur Penerbitan & Verifikasi
bash
Copy code
# Minta StudentID credential untuk holder DID
curl -X POST https://issuer.example.ac.id/vc/issue \
  -H 'Content-Type: application/json' \
  -d '{"subjectDid":"did:key:z6Mkholder...","claims":{"university":"Example University","faculty":"Computer Science","isStudent":true,"enrolledUntil":"2027-08-31"}}'

# Verifier meminta presentasi tertentu
curl -X POST https://verifier.example.id/presentation/request \
  -H 'Content-Type: application/json' \
  -d '{"type":["StudentIDCredential"],"claims":["isStudent"],"aud":"verifier.example.id"}'

# Wallet mengirimkan VP ke verifier
curl -X POST https://verifier.example.id/presentation/verify \
  -H 'Content-Type: application/json' \
  -d '{"vp":"<signed-vp-jwt>"}'
🛣 Roadmap Singkat
Fondasi (Minggu 1–2): domain & DID document, scaffolding layanan, penerbitan VC dasar.

Penerbitan & status (Minggu 3–4): integrasi autentikasi kampus, distribusi credential, revocation.

Presentasi & verifikasi (Minggu 5–6): permintaan presentasi dengan nonce/aud, verifikasi signature & status.

Pilot (Minggu 7): onboarding pengguna awal, kumpulkan umpan balik.

Perbaikan (Minggu 8+): perbaikan UX, tambah selective disclosure, rencana migrasi ke metode DID terdesentralisasi.

🤝 Kontribusi
Kontribusi sangat diterima! Silakan fork repositori ini, buat branch, dan ajukan pull request. Harap ikuti arsitektur dan konvensi kode yang disarankan. Jika menemukan isu keamanan, mohon laporkan secara tertutup.

📜 Lisensi
Proyek ini dirilis dengan lisensi MIT. Lihat file LICENSE untuk detail.

📬 Kontak
Pertanyaan atau saran? Buka issue atau diskusi di repositori ini.
Mari bersama-sama membangun identitas digital yang lebih aman dan berpusat pada pengguna untuk Indonesia.

yaml
Copy code

---

Mau sekalian gua bikinin juga **struktur folder + package.json monorepo (pnpm workspaces)** biar repo lu langsung siap dipakai?