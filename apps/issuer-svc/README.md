# Issuer Service

Issuer service untuk menerbitkan (issue) dan mencabut (revoke) verifiable credentials (VC) dengan standar W3C VC 2.0 + JWT-VC format.

## Features

- ✅ **Issue StudentID Credential** (`POST /vc/issue`)
- ✅ **Revoke Credential** (`POST /vc/revoke`)
- ✅ **DID Document** (`GET /.well-known/did.json`)
- ✅ **StatusList2021** support (revocation bitstring)
- ✅ **Privacy-by-design** (NO PII di DB, cuma metadata)
- ✅ **Rate limiting** (10 req/min untuk `/vc/issue`)
- ✅ **Idempotency** (prevent duplicate issuance)

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (untuk Postgres/Redis/MinIO)

---

## Quick Start

### 1. Install Dependencies

```bash
# Dari root monorepo
cd ../.. 
pnpm install

# Atau langsung di issuer-svc
pnpm install
```

### 2. Start Infrastructure

```bash
# Dari root monorepo
docker-compose up -d

# Check containers
docker-compose ps
```

### 3. Setup Environment

```bash
cp ../../.env.example .env.local

# Edit .env.local:
# - Set ISSUER_DID=did:web:localhost:3001 (untuk local dev)
# - Set ISSUER_DOMAIN=http://localhost:3001
```

### 4. Run Service

```bash
# Development mode (hot-reload)
pnpm dev

# Production build
pnpm build
pnpm start:prod
```

Service running di **http://localhost:3001**

---

## API Endpoints

### **OpenAPI Docs**

http://localhost:3001/api-docs

### **1. Issue VC**

```bash
POST /vc/issue
Content-Type: application/json

{
  "subjectDid": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "claims": {
    "university": "Universitas Indonesia",
    "faculty": "Computer Science",
    "isStudent": true,
    "enrolledUntil": "2027-08-31"
  },
  "expirationDate": "2027-08-31T23:59:59Z"
}
```

**Response:**
```json
{
  "vc": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDp3ZWI6bG9jYWxob3N0OjMwMDEja2V5LTEifQ..."
}
```

### **2. Revoke VC**

```bash
POST /vc/revoke
Content-Type: application/json

{
  "credentialId": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "reason": "graduation"
}
```

### **3. Get DID Document**

```bash
GET /.well-known/did.json
```

**Response:**
```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:web:localhost:3001",
  "verificationMethod": [{
    "id": "did:web:localhost:3001#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:web:localhost:3001",
    "publicKeyJwk": { ... }
  }]
}
```

---

## Architecture

```
src/
├── main.ts                  # Bootstrap
├── app.module.ts            # Root module
├── vc/                      # Verifiable Credential module
│   ├── use-cases/
│   │   ├── issue-vc.usecase.ts     # Business logic: issue VC
│   │   └── revoke-vc.usecase.ts    # Business logic: revoke VC
│   ├── dto/
│   ├── entities/
│   │   └── vc-metadata.entity.ts   # Metadata (NO credential subject!)
│   ├── vc.controller.ts
│   └── vc.module.ts
├── crypto/                  # Key management & signing
│   ├── crypto.service.ts    # Ed25519 key ops (dev: ephemeral, prod: KMS)
│   └── crypto.module.ts
├── status-list/             # StatusList2021 management
│   ├── status-list.service.ts
│   └── entities/
│       └── status-list-bitstring.entity.ts
└── did/                     # DID document serving
    ├── did.controller.ts    # /.well-known/did.json endpoint
    └── did.module.ts
```

---

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

---

## Security Checklist

### **✅ PII Prevention**

Credential claims **MUST NOT** contain:
- `name`, `fullName`, `firstName`, `lastName`
- `email`, `phone`, `address`
- `nik`, `ktp`, `npwp`, `passport`
- `dateOfBirth`, `birthDate`

**Valid claims:**
```json
{
  "university": "Example Univ",
  "isStudent": true,
  "enrolledUntil": "2027-08-31",
  "studentId": "UI-2021-XXXX"  // Anonymized
}
```

### **✅ Private Key Security**

**Development:**
- Ephemeral Ed25519 key (generated on startup)
- ⚠️ Key hilang saat restart (OK untuk dev)

**Production:**
- **WAJIB** pakai Vault/AWS KMS/HSM
- Set `NODE_ENV=production` akan error jika KMS not configured
- NEVER commit private key ke repo

### **✅ Rate Limiting**

- `/vc/issue`: 10 req/min (prevent abuse)
- Global: 60 req/min

### **✅ Idempotency**

Pass `idempotencyKey` (UUID) untuk prevent duplicate issuance saat retry request.

---

## Database Schema

### **vc_metadata**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `credentialId` | String | urn:uuid:xxx (unique) |
| `subjectDid` | String | Holder DID (for audit) |
| `credentialType` | String | StudentIDCredential |
| `issuedAt` | Timestamp | Issue timestamp |
| `expiresAt` | Timestamp | Expiry timestamp |
| `revoked` | Boolean | Revocation status |
| `revokedAt` | Timestamp | Revocation timestamp |
| `revocationReason` | String | Reason (graduation, dropout, etc) |
| `idempotencyKey` | String | Unique key (nullable) |
| `statusListIndex` | Integer | Index di bitstring |

**⚠️ NO `credentialSubject` column!** Privacy-by-design.

---

## Environment Variables

See `../../.env.example` untuk complete list.

Key vars:
```env
ISSUER_DID=did:web:issuer.example.ac.id
ISSUER_DOMAIN=https://issuer.example.ac.id
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NODE_ENV=development
```

---

## Troubleshooting

### **Error: "Claims contain PII fields"**

❌ BAD:
```json
{
  "name": "John Doe",  // PII!
  "email": "john@example.com"  // PII!
}
```

✅ GOOD:
```json
{
  "university": "Example Univ",
  "isStudent": true
}
```

### **Error: "Cannot find module @nestjs/..."**

```bash
pnpm install
```

### **Database connection error**

```bash
docker-compose up -d postgres
docker-compose logs postgres
```

---

## Production Deployment

1. **Set environment:**
   ```bash
   export NODE_ENV=production
   ```

2. **Configure KMS** (Vault/AWS KMS)

3. **Build:**
   ```bash
   pnpm build
   ```

4. **Run migrations:**
   ```bash
   # TODO: implement TypeORM migrations
   ```

5. **Start:**
   ```bash
   node dist/main.js
   ```

---

## License

MIT
