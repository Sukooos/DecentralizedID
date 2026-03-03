# 🎓 DecentralizedID — Student Credential MVP

> Self-Sovereign Identity (SSI) platform untuk Indonesia. MVP: **StudentID Verifiable Credential** — mahasiswa pegang kredensial digital di wallet, bisa buktiin status mahasiswa tanpa upload KTM scan berulang kali.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 🎯 Problem Statement

**Before (Traditional):**
- Mahasiswa daftar fintech → upload KTP + KTM scan
- Daftar e-commerce student discount → upload KTM lagi
- Apply internship → kirim transkrip scan lagi
- ❌ Data berulang diminta, tersebar di banyak server, risiko kebocoran tinggi

**After (SSI/DID):**
1. **Kampus** → tanda tangan digital VC "Student at Univ X"
2. **Mahasiswa** → simpan VC di wallet (phone keystore)
3. **Fintech/Verifier** → minta proof "is student?" via QR
4. **Mahasiswa** → kirim VP (signed presentation) → Fintech verify signature
5. ✅ Data cuma di wallet mahasiswa, selective disclosure, revokable

---

## ✨ Use Cases (MVP)

- 🎓 **Student discount** (e-commerce, transportasi)
- 💳 **Pinjaman mahasiswa** (fintech BNPL, student loan)
- 🎫 **Event registration** (lomba, hackathon, seminar)
- 🏢 **Job application** (verify enrollment status)

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

---

## 🏗️ Architecture

```
┌──────────────┐                    ┌──────────────┐
│   ISSUER     │ 2. Sign VC         │    HOLDER    │
│ (Universitas)│───────────────────▶│  (Mahasiswa) │
│   (NestJS)   │                    │ (RN Wallet)  │
└──────────────┘                    └──────┬───────┘
                                           │ 3. Present VP
                                           ▼
                                    ┌──────────────┐
                                    │   VERIFIER   │
                                    │   (Fintech)  │
                                    │   (NestJS)   │
                                    └──────────────┘
                                    4. Verify + check status
```

### **Tech Stack**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Issuer Service** | NestJS + TypeScript | Issue & revoke VC, serve DID doc |
| **Verifier Service** | NestJS + TypeScript | Request & verify VP (< 300ms) |
| **Mobile Wallet** | React Native (Expo) | Store VC, scan QR, present VP |
| **SDK Verifier** | TypeScript (npm) | Partner integration library |
| **Database** | PostgreSQL | Metadata (NO PII), audit log |
| **Cache** | Redis | DID doc, StatusList2021 cache |
| **Storage** | MinIO/S3 | StatusList bitstring (compressed) |
| **Crypto** | Ed25519 (`@noble/ed25519`) | Digital signatures |
| **DID Method** | `did:web` (MVP), `did:ion` (Phase 2) | Decentralized identifier |
| **VC Format** | JWT-VC (W3C VC 2.0) | Verifiable credential format |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Docker** & **Docker Compose**
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/Sukooos/DecentralizedID.git
cd DecentralizedID

# Install dependencies (monorepo)
pnpm install
```

### 2. Start Infrastructure

```bash
# Start Postgres, Redis, MinIO
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env (for local dev, defaults are OK)
# Key settings:
# ISSUER_DID=did:web:localhost:3001
# DATABASE_URL=postgresql://did_user:did_pass_dev@localhost:5432/decentralized_id
```

### 4. Run Services

```bash
# Terminal 1: Issuer Service
pnpm dev:issuer

# Terminal 2: Verifier Service (coming soon)
# pnpm dev:verifier

# Services available:
# Issuer:  http://localhost:3001
# API Docs: http://localhost:3001/api-docs
# DID Doc: http://localhost:3001/.well-known/did.json
```

### 5. Test Issue VC

```bash
curl -X POST http://localhost:3001/vc/issue \
  -H "Content-Type: application/json" \
  -d '{
    "subjectDid": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "claims": {
      "university": "Universitas Indonesia",
      "faculty": "Computer Science",
      "isStudent": true,
      "enrolledUntil": "2027-08-31"
    }
  }'
```

**Response:**
```json
{
  "vc": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDp3ZWI6bG9jYWxob3N0OjMwMDEja2V5LTEifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53..."
}
```

---

## 📦 Monorepo Structure

```
DecentralizedID/
├── apps/
│   ├── issuer-svc/          # Issue & revoke VC
│   ├── verifier-svc/        # Verify VP (coming soon)
│   └── admin-portal/        # Next.js admin UI (coming soon)
├── packages/
│   ├── shared/              # Types, schemas, utils
│   └── sdk-verifier/        # Partner integration SDK (coming soon)
├── mobile/
│   └── wallet/              # React Native wallet (coming soon)
├── docker-compose.yml       # Local dev infrastructure
├── .env.example             # Environment template
└── pnpm-workspace.yaml      # Monorepo config
```

---

## 📚 Documentation

- **[Issuer Service README](apps/issuer-svc/README.md)** — API endpoints, architecture
- **[OpenAPI Spec](http://localhost:3001/api-docs)** — Interactive API docs (when running)
- **[AGENTS.md](AGENTS.md)** — AI agent brief (goals, constraints, DoD)
- **[Copilot Instructions](.github/copilot-instructions.md)** — Project context

### **Standards & Specs**

- [W3C Verifiable Credentials 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [W3C DID Core](https://www.w3.org/TR/did-core/)
- [did:web Method](https://w3c-ccg.github.io/did-method-web/)
- [StatusList2021](https://w3c.github.io/vc-status-list-2021/)

---

## 🔐 Security & Privacy

### **Privacy-by-Design**

✅ **NO PII in Database**
- Credential subject **NEVER** stored at issuer/verifier
- Only metadata (credential ID, type, timestamps)

✅ **NO PII in Logs**
- Auto-sanitization (see `packages/shared/src/utils/sanitize-log.ts`)
- Email, phone, NIK auto-redacted

✅ **NO PII in Claims**
- Validation rejects: `name`, `email`, `phone`, `nik`, `ktp`, etc.
- Use anonymized/category data: `isStudent: true`, `ageOver18: true`

### **Crypto Security**

- **Ed25519** signatures (modern, fast, secure)
- **Development**: Ephemeral keys (OK untuk testing)
- **Production**: MUST use Vault/AWS KMS/HSM

### **Rate Limiting**

- `/vc/issue`: 10 req/min (prevent abuse)
- Global: 60 req/min

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:cov

# Lint
pnpm lint

# Type check
pnpm typecheck
```

---

## 🚢 Deployment

### **Development**

```bash
docker-compose up -d
pnpm dev
```

### **Production**

See individual service READMEs for deployment guides:
- [Issuer Service](apps/issuer-svc/README.md#production-deployment)
- Verifier Service (coming soon)

**Production Checklist:**

- [ ] Set `NODE_ENV=production`
- [ ] Configure Vault/KMS for private keys
- [ ] Enable PostgreSQL SSL
- [ ] Setup Redis cluster (for cache HA)
- [ ] Configure MinIO/S3 with encryption
- [ ] Setup monitoring (Sentry, Prometheus)
- [ ] Configure load balancer (Nginx/Traefik)
- [ ] Enable HTTPS with valid cert

---

## 🎯 Roadmap

### **Phase 1: MVP StudentID** (Current)
- [x] Issuer service (NestJS)
- [x] VC issuance & revocation
- [x] DID document serving (`did:web`)
- [x] StatusList2021 skeleton
- [ ] Verifier service
- [ ] Mobile wallet (React Native)
- [ ] E2E test: issue → store → present → verify

### **Phase 2: Multi-Credential** (Q1 2026)
- [ ] Alumni credential
- [ ] KYC reusable credential
- [ ] Verifier SDK (npm package)
- [ ] Admin portal (Next.js)
- [ ] Migrate to `did:ion` (optional, for immutability)

### **Phase 3: Advanced Features** (Q2-Q3 2026)
- [ ] BBS+ signatures (selective disclosure)
- [ ] Zero-knowledge proofs (prove age > 18 tanpa kasih tanggal lahir)
- [ ] DIDComm v2 (encrypted messaging)
- [ ] Multi-issuer trust registry

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow code style (ESLint + Prettier)
4. Add tests (coverage > 80%)
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open PR (use template)

### **Development Guidelines**

- **Security First**: No hardcoded secrets, PII prevention
- **Test Coverage**: Minimum 80%
- **Documentation**: Update README when adding features
- **Commit Messages**: Follow Conventional Commits

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [W3C Credentials Community Group](https://www.w3.org/community/credentials/)
- [DIF (Decentralized Identity Foundation)](https://identity.foundation/)
- [Veramo](https://veramo.io/) — DID/VC SDK inspiration
- [jose](https://github.com/panva/jose) — JWT library

---

## 📞 Contact

- **Author**: [Sukooos](https://github.com/Sukooos)
- **Project**: [DecentralizedID](https://github.com/Sukooos/DecentralizedID)
- **Issues**: [GitHub Issues](https://github.com/Sukooos/DecentralizedID/issues)

---

**Built with ❤️ for Indonesia's digital identity future.**