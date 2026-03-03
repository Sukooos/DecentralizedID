# AI Agent Instructions — DecentralizedID Project

> **Audience:** GitHub Copilot, Cursor AI, ChatGPT, Claude, atau AI coding assistant lainnya  
> **Purpose:** Ensure AI-generated code follows project architecture, security standards, dan tidak keluar scope

---

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [Coding Standards](#coding-standards)
5. [Security Requirements](#security-requirements)
6. [Do's and Don'ts](#dos-and-donts)
7. [Module-Specific Rules](#module-specific-rules)
8. [Testing Requirements](#testing-requirements)
9. [Documentation Standards](#documentation-standards)
10. [Performance Targets](#performance-targets)

---

## 🎯 **Project Overview**

### **What This Project IS:**
- ✅ Self-Sovereign Identity (SSI) platform untuk Indonesia
- ✅ W3C Verifiable Credentials 2.0 implementation (JWT-VC format)
- ✅ DID method: `did:web` (MVP), `did:ion` (future)
- ✅ Use case: StudentID credential (mahasiswa prove enrollment status)
- ✅ Privacy-by-design: NO PII storage server-side

### **What This Project IS NOT:**
- ❌ **BUKAN blockchain project** (no smart contracts, no on-chain storage)
- ❌ **BUKAN cryptocurrency/token** (no wallet for crypto assets)
- ❌ **BUKAN federated identity** (no OAuth provider, no SSO server)
- ❌ **BUKAN PKI/CA system** (no X.509 certificates)

### **Key Differentiator:**
```
Traditional System:           SSI/DID (This Project):
┌──────────────┐             ┌──────────────┐
│  Centralized │             │    Issuer    │
│   Database   │────────────▶│  (sign VC)   │
│  (stores PII)│             └──────────────┘
└──────────────┘                     │
       │                             ▼
       ▼                      ┌──────────────┐
┌──────────────┐             │    Holder    │
│   Verifier   │             │ (store VC in │
│ (query API)  │             │   wallet)    │
└──────────────┘             └──────┬───────┘
                                    │ present VP
                                    ▼
                             ┌──────────────┐
                             │   Verifier   │
                             │ (verify sig) │
                             └──────────────┘
```

**Key:** Holder owns credential, issuer/verifier NEVER store PII.

---

## 🏗️ **Architecture Principles**

### **1. Clean Architecture / Hexagonal Architecture**

```
src/
├── domain/              # Business logic (PURE, no framework dependencies)
│   ├── entities/        # Domain models
│   ├── use-cases/       # Business rules (IssueVC, VerifyVP)
│   └── ports/           # Interfaces (repository, KMS)
├── infrastructure/      # Framework-specific (NestJS, TypeORM)
│   ├── adapters/        # Port implementations
│   ├── controllers/     # HTTP endpoints
│   └── repositories/    # Database access
└── application/         # Application services (orchestration)
```

**Rules:**
- ✅ Use-cases MUST NOT import `@nestjs/*` directly
- ✅ Dependency injection via constructor (DI container)
- ✅ Use-cases MUST be testable without framework

**Example (CORRECT):**
```typescript
// ✅ GOOD: Use-case independent of NestJS
export class IssueVcUseCase {
  constructor(
    private readonly signingService: ISigningService, // Port (interface)
    private readonly vcRepo: IVcMetadataRepository,   // Port
  ) {}

  async execute(dto: IssueVcDto): Promise<string> {
    // Pure business logic
    const vc = this.buildCredential(dto);
    const jwt = await this.signingService.signJWT(vc);
    await this.vcRepo.save(metadata);
    return jwt;
  }
}
```

**Example (WRONG):**
```typescript
// ❌ BAD: Use-case coupled to NestJS
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable() // ❌ Framework decorator in domain layer
export class IssueVcUseCase {
  constructor(
    @InjectRepository(VcMetadata) // ❌ ORM leak ke use-case
    private vcRepo: Repository<VcMetadata>,
  ) {}
}
```

---

### **2. Privacy-by-Design**

**Golden Rule:** Server NEVER stores Personally Identifiable Information (PII).

**What is PII:**
- ❌ `name`, `fullName`, `firstName`, `lastName`
- ❌ `email`, `phone`, `mobileNumber`
- ❌ `address`, `street`, `city`, `postalCode`
- ❌ `nik`, `ktp`, `npwp`, `passport` (Indonesia ID numbers)
- ❌ `dateOfBirth`, `birthDate`, `birthPlace`
- ❌ `gender`, `religion` (sensitive attributes)

**What is ALLOWED:**
- ✅ `isStudent: true` (boolean claim)
- ✅ `ageOver18: true` (derived, no raw birthdate)
- ✅ `university: "Universitas Indonesia"` (public info)
- ✅ `enrolledUntil: "2027-08-31"` (expiry date)
- ✅ `studentId: "UI-2021-XXXX"` (anonymized, last digits masked)

**Database Schema Rules:**
```typescript
// ✅ GOOD: Only metadata
@Entity('vc_metadata')
export class VcMetadata {
  @Column()
  credentialId: string; // urn:uuid:xxx
  
  @Column()
  subjectDid: string;   // Holder DID (NOT name!)
  
  @Column()
  issuedAt: Date;
  
  @Column()
  revoked: boolean;
  
  // ❌ NEVER add:
  // credentialSubject: any;  // FORBIDDEN!
  // studentName: string;      // FORBIDDEN!
  // email: string;            // FORBIDDEN!
}
```

**Validation Enforcement:**
```typescript
// ALWAYS validate claims in DTO
export class IssueVcDto {
  @IsObject()
  @Validate(NoPiiValidator) // Custom validator
  claims: Record<string, unknown>;
}

// Custom validator implementation
class NoPiiValidator implements ValidatorConstraintInterface {
  validate(claims: Record<string, unknown>): boolean {
    const piiKeys = ['name', 'email', 'phone', 'nik', /* ... */];
    const keys = Object.keys(claims).map(k => k.toLowerCase());
    return !keys.some(k => piiKeys.includes(k));
  }
  
  defaultMessage(): string {
    return 'Claims contain PII fields. Use anonymized data.';
  }
}
```

---

### **3. Security-First**

**Critical Rules:**

#### **A. Secrets Management**
```typescript
// ❌ NEVER hardcode secrets
const privateKey = 'LS0tLS1CRUdJTi...'; // WRONG!

// ✅ ALWAYS load from secure storage
const privateKey = await this.kmsService.getSecret('issuer-private-key');
```

**Allowed sources (priority order):**
1. **Production:** Vault, AWS KMS, Azure Key Vault
2. **Development:** Environment variables (with `.env.example` template)
3. **Testing:** Mock secrets (never commit real keys)

#### **B. Logging Sanitization**
```typescript
// ❌ NEVER log sensitive data
logger.log(`Issued VC to ${dto.claims.email}`); // WRONG!

// ✅ ALWAYS sanitize
import { sanitizeObject } from '@decentralized-id/shared';
logger.log(sanitizeObject({ action: 'issue_vc', claims: dto.claims }));
// Output: { action: 'issue_vc', claims: { email: '[REDACTED]' } }
```

#### **C. Input Validation**
```typescript
// ✅ ALWAYS validate with class-validator
export class IssueVcDto {
  @IsString()
  @Matches(/^did:[a-z0-9]+:.+$/) // DID format validation
  subjectDid: string;
  
  @IsObject()
  @ValidateNested()
  claims: StudentCredentialClaims; // Type-safe
}
```

#### **D. Rate Limiting**
```typescript
// ✅ ALWAYS add throttling to sensitive endpoints
@Controller('vc')
export class VcController {
  @Post('issue')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10/min
  async issueVc(@Body() dto: IssueVcDto) { /* ... */ }
}
```

---

## 🛠️ **Technology Stack**

### **Backend Services**
- **Framework:** NestJS 10+ (strict TypeScript)
- **Runtime:** Node.js 20+ LTS
- **Database:** PostgreSQL 16 (metadata only, NO PII)
- **Cache:** Redis 7 (DID docs, StatusList, nonces)
- **Object Storage:** MinIO (dev) / S3 (prod) — StatusList bitstrings
- **Secrets:** Vault (dev) / AWS KMS (prod)

### **Libraries (ALLOWED)**
```json
{
  "jose": "^5.2.0",              // JWT signing/verification (W3C VC compliant)
  "@noble/ed25519": "^2.0.0",    // Ed25519 crypto (pure JS, audited)
  "zod": "^3.22.4",              // Schema validation
  "typeorm": "^0.3.20",          // ORM
  "ioredis": "^5.3.2",           // Redis client
  "class-validator": "^0.14.1",  // DTO validation
  "class-transformer": "^0.5.1"  // DTO transformation
}
```

### **Libraries (FORBIDDEN)**
```json
{
  "jsonwebtoken": "❌",  // Use 'jose' instead (better TS support, W3C compliant)
  "ethers": "❌",        // No blockchain dependencies
  "web3": "❌",          // No blockchain dependencies
  "bcrypt": "❌",        // No password hashing (we use digital signatures)
  "passport": "❌"       // No traditional auth (we use DID-based auth)
}
```

---

## 📝 **Coding Standards**

### **1. TypeScript Strict Mode**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Rules:**
- ✅ ALWAYS provide explicit return types for functions
- ✅ NEVER use `any` type (use `unknown` if needed)
- ✅ NEVER use `@ts-ignore` (fix the type error)
- ✅ ALWAYS handle nullable values with optional chaining

**Example:**
```typescript
// ❌ BAD
function processVc(vc) {
  return vc.credentialSubject.isStudent;
}

// ✅ GOOD
function processVc(vc: VerifiableCredential): boolean {
  return vc.credentialSubject?.isStudent ?? false;
}
```

---

### **2. Naming Conventions**

| Type | Convention | Example |
|------|------------|---------|
| **Classes** | PascalCase + suffix | `IssueVcUseCase`, `VcController` |
| **Interfaces** | PascalCase (NO `I` prefix) | `SigningService`, `VcRepository` |
| **DTOs** | PascalCase + `Dto` | `IssueVcDto`, `VerifyVpDto` |
| **Entities** | PascalCase (singular) | `VcMetadata`, `StatusListBitstring` |
| **Files** | kebab-case | `issue-vc.usecase.ts`, `vc.controller.ts` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_CREDENTIAL_SIZE`, `DEFAULT_TTL` |
| **Functions** | camelCase (verb) | `issueVc()`, `verifySignature()` |
| **Variables** | camelCase | `credentialId`, `holderDid` |

---

### **3. File Structure**

**Module Structure (NestJS):**
```
src/vc/
├── dto/
│   ├── issue-vc.dto.ts
│   └── revoke-vc.dto.ts
├── entities/
│   └── vc-metadata.entity.ts
├── use-cases/
│   ├── issue-vc.usecase.ts
│   ├── issue-vc.usecase.spec.ts
│   ├── revoke-vc.usecase.ts
│   └── revoke-vc.usecase.spec.ts
├── vc.controller.ts
├── vc.controller.spec.ts
├── vc.service.ts          # Optional: orchestration layer
└── vc.module.ts
```

**Rules:**
- ✅ One class per file
- ✅ Test file next to source file (`.spec.ts` suffix)
- ✅ Group by feature (vertical slicing), NOT by layer

---

### **4. Comment Standards**

**When to Comment:**
```typescript
// ✅ GOOD: Explain WHY (business rule, security reason)
export class IssueVcUseCase {
  async execute(dto: IssueVcDto): Promise<string> {
    // WHY: Idempotency check prevents duplicate issuance on retry
    if (dto.idempotencyKey) {
      const existing = await this.vcRepo.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) throw new ConflictException('Already issued');
    }
    
    // WHY: StatusList index must be allocated before signing
    // (VC includes statusListIndex in credentialStatus)
    const statusIndex = await this.statusListService.allocateIndex();
    
    // Sign and return JWT-VC
    return this.signingService.signJWT(credential);
  }
}
```

**When NOT to Comment:**
```typescript
// ❌ BAD: Obvious "WHAT" comments
// Get the credential ID
const credentialId = vc.id;

// Call the repository
await this.vcRepo.save(metadata);
```

**Special Comments:**
- `// WHY:` — Business logic explanation
- `// SECURITY:` — Security-critical code
- `// TODO:` — Future work (must include ticket/issue number)
- `// FIXME:` — Known bug (must include issue number)
- `// HACK:` — Temporary workaround (must include reason + deadline)

---

## 🚫 **Do's and Don'ts**

### **✅ DO:**

#### **Architecture:**
- ✅ Use dependency injection for all services
- ✅ Write use-cases that are framework-agnostic
- ✅ Validate ALL user input (DTOs with decorators)
- ✅ Use typed errors (custom exception classes)
- ✅ Implement idempotency for write operations

#### **Security:**
- ✅ Sanitize logs (auto-redact PII)
- ✅ Rate-limit all public endpoints
- ✅ Validate DID format, JWT structure, signature
- ✅ Check `nonce`, `aud`, `exp` in presentations
- ✅ Use environment variables for secrets

#### **Performance:**
- ✅ Cache DID documents (TTL: 1 hour)
- ✅ Cache StatusList bitstrings (TTL: 15 min)
- ✅ Use connection pooling (Postgres, Redis)
- ✅ Implement background jobs for heavy tasks

#### **Testing:**
- ✅ Write unit tests for use-cases (mock ports)
- ✅ Write integration tests for controllers
- ✅ Write E2E tests for critical flows
- ✅ Aim for 80%+ coverage

---

### **❌ DON'T:**

#### **Privacy Violations:**
- ❌ NEVER store credential subject in database
- ❌ NEVER log PII (name, email, phone, NIK)
- ❌ NEVER accept PII in claims (validate with Zod)
- ❌ NEVER send PII in error messages

#### **Security Anti-Patterns:**
- ❌ NEVER hardcode secrets in source code
- ❌ NEVER commit `.env` files (only `.env.example`)
- ❌ NEVER disable CORS without explicit reason
- ❌ NEVER skip input validation
- ❌ NEVER use `eval()` or `Function()`

#### **Performance Mistakes:**
- ❌ NEVER make sequential API calls (use `Promise.all()`)
- ❌ NEVER fetch without pagination
- ❌ NEVER skip database indices
- ❌ NEVER forget to close connections

#### **Code Smells:**
- ❌ NEVER use `any` type
- ❌ NEVER write functions > 50 lines (refactor)
- ❌ NEVER nest callbacks > 3 levels (use async/await)
- ❌ NEVER ignore TypeScript errors with `@ts-ignore`

---

## 🔒 **Security Requirements**

### **1. Cryptographic Operations**

**Signing (Issuer):**
```typescript
// ✅ CORRECT: Ed25519 via jose library
import { SignJWT } from 'jose';
import { importJWK } from 'jose';

const privateKeyJwk = await this.kmsService.getPrivateKey();
const privateKey = await importJWK(privateKeyJwk, 'EdDSA');

const jwt = await new SignJWT({
  vc: credentialPayload,
})
  .setProtectedHeader({ 
    alg: 'EdDSA',
    kid: `${issuerDid}#key-1`,
  })
  .setIssuer(issuerDid)
  .setSubject(holderDid)
  .setIssuedAt()
  .setExpirationTime('2y')
  .sign(privateKey);
```

**Verification (Verifier):**
```typescript
// ✅ CORRECT: Verify signature + check claims
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(vpJwt, publicKey, {
  issuer: expectedIssuer,     // MUST match
  audience: verifierDid,      // MUST match
  currentDate: new Date(),    // Check exp/nbf
});

// SECURITY: Check nonce to prevent replay
if (payload.nonce !== expectedNonce) {
  throw new UnauthorizedException('Invalid nonce');
}
```

---

### **2. Rate Limiting Strategy**

```typescript
// Global default: 60 req/min
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'strict', // For sensitive endpoints
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
})

// Per-endpoint override
@Controller('vc')
export class VcController {
  @Post('issue')
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async issueVc() { /* ... */ }
  
  @Post('verify')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // Higher limit
  async verifyVp() { /* ... */ }
}
```

---

### **3. Input Validation (Defense in Depth)**

**Layer 1: DTO Class Validators**
```typescript
export class IssueVcDto {
  @IsString()
  @Matches(/^did:[a-z0-9]+:[a-zA-Z0-9._%-]+$/)
  subjectDid: string;
  
  @IsObject()
  @ValidateNested()
  @Type(() => StudentCredentialClaims)
  claims: StudentCredentialClaims;
}
```

**Layer 2: Zod Schema (Runtime Validation)**
```typescript
import { z } from 'zod';

const issueVcSchema = z.object({
  subjectDid: z.string().regex(/^did:/),
  claims: z.record(z.unknown()).refine(
    (claims) => {
      const piiKeys = ['name', 'email', 'phone'];
      return !Object.keys(claims).some(k => piiKeys.includes(k.toLowerCase()));
    },
    { message: 'Claims contain PII' }
  ),
});
```

**Layer 3: Business Logic Validation**
```typescript
async execute(dto: IssueVcDto): Promise<string> {
  // SECURITY: Additional business rule checks
  if (await this.isBlacklisted(dto.subjectDid)) {
    throw new ForbiddenException('Subject DID blacklisted');
  }
  
  // Proceed with issuance
}
```

---

## 🧪 **Testing Requirements**

### **1. Unit Tests (Use-Cases)**

**Template:**
```typescript
// issue-vc.usecase.spec.ts
describe('IssueVcUseCase', () => {
  let useCase: IssueVcUseCase;
  let mockSigningService: jest.Mocked<SigningService>;
  let mockVcRepo: jest.Mocked<VcMetadataRepository>;
  
  beforeEach(() => {
    mockSigningService = {
      signJWT: jest.fn(),
    } as any;
    
    mockVcRepo = {
      save: jest.fn(),
      findByIdempotencyKey: jest.fn(),
    } as any;
    
    useCase = new IssueVcUseCase(mockSigningService, mockVcRepo);
  });
  
  describe('execute', () => {
    it('should issue VC successfully', async () => {
      // Arrange
      const dto = {
        subjectDid: 'did:key:z6Mk...',
        claims: { isStudent: true },
      };
      mockSigningService.signJWT.mockResolvedValue('eyJ...');
      
      // Act
      const result = await useCase.execute(dto);
      
      // Assert
      expect(result).toBe('eyJ...');
      expect(mockVcRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectDid: dto.subjectDid,
        })
      );
    });
    
    it('should reject PII in claims', async () => {
      // Arrange
      const dto = {
        subjectDid: 'did:key:z6Mk...',
        claims: { name: 'John Doe' }, // PII!
      };
      
      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('PII detected');
    });
    
    it('should handle idempotency', async () => {
      // Arrange
      const dto = {
        subjectDid: 'did:key:z6Mk...',
        claims: { isStudent: true },
        idempotencyKey: 'abc-123',
      };
      mockVcRepo.findByIdempotencyKey.mockResolvedValue({ id: '1' } as any);
      
      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Already issued');
    });
  });
});
```

**Coverage Target:** 80%+ for use-cases

---

### **2. Integration Tests (Controllers)**

```typescript
// vc.controller.spec.ts
describe('VcController (Integration)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [VcModule, TypeOrmModule.forRoot(testDbConfig)],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('POST /vc/issue - should issue VC', () => {
    return request(app.getHttpServer())
      .post('/vc/issue')
      .send({
        subjectDid: 'did:key:z6Mk...',
        claims: { isStudent: true },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.vc).toMatch(/^eyJ/); // JWT format
      });
  });
  
  it('POST /vc/issue - should reject PII', () => {
    return request(app.getHttpServer())
      .post('/vc/issue')
      .send({
        subjectDid: 'did:key:z6Mk...',
        claims: { email: 'user@example.com' },
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('PII');
      });
  });
});
```

---

### **3. E2E Tests (Critical Flows)**

```typescript
// e2e/studentid-flow.e2e-spec.ts
describe('StudentID Flow (E2E)', () => {
  it('should complete full credential lifecycle', async () => {
    // 1. Issue VC
    const issueRes = await request(issuerApp)
      .post('/vc/issue')
      .send({ subjectDid: holderDid, claims: { isStudent: true } });
    
    const vcJwt = issueRes.body.vc;
    
    // 2. Request presentation
    const challengeRes = await request(verifierApp)
      .post('/presentation/request')
      .send({ credentialTypes: ['StudentIDCredential'] });
    
    const challenge = challengeRes.body.challenge;
    
    // 3. Holder creates VP (simulated)
    const vp = await createPresentation(vcJwt, holderDid, challenge);
    
    // 4. Verify VP
    const verifyRes = await request(verifierApp)
      .post('/presentation/verify')
      .send({ presentation: vp, challenge });
    
    expect(verifyRes.body.verified).toBe(true);
    expect(verifyRes.body.claims.isStudent).toBe(true);
    
    // 5. Revoke VC
    await request(issuerApp)
      .post('/vc/revoke')
      .send({ credentialId: vcJwt.jti });
    
    // 6. Verify again (should fail)
    const verifyRevokedRes = await request(verifierApp)
      .post('/presentation/verify')
      .send({ presentation: vp, challenge });
    
    expect(verifyRevokedRes.body.verified).toBe(false);
    expect(verifyRevokedRes.body.error).toContain('revoked');
  });
});
```

---

## 📚 **Documentation Standards**

### **1. README.md Structure**

Every service MUST have:
```markdown
# Service Name

Brief description (1-2 sentences)

## Features
- Feature 1
- Feature 2

## Quick Start
```bash
pnpm install
pnpm dev
```

## API Endpoints
### POST /endpoint
Description
Request/Response examples

## Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|

## Testing
```bash
pnpm test
```

## Deployment
Production instructions

## Troubleshooting
Common issues + solutions
```

---

### **2. OpenAPI/Swagger Decorators**

```typescript
@ApiTags('vc')
@Controller('vc')
export class VcController {
  @Post('issue')
  @ApiOperation({
    summary: 'Issue a verifiable credential',
    description: 'Issues StudentID credential. Claims MUST NOT contain PII.',
  })
  @ApiResponse({
    status: 201,
    description: 'VC issued successfully',
    schema: {
      type: 'object',
      properties: {
        vc: { type: 'string', example: 'eyJ...' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or PII detected',
  })
  async issueVc(@Body() dto: IssueVcDto) { /* ... */ }
}
```

---

## ⚡ **Performance Targets**

| Endpoint | Latency (p50) | Latency (p99) | Notes |
|----------|---------------|---------------|-------|
| `POST /vc/issue` | < 200ms | < 500ms | Includes DB write + KMS call |
| `POST /presentation/verify` | < 150ms | < 300ms | Cached DID doc + StatusList |
| `GET /.well-known/did.json` | < 50ms | < 100ms | Static response (can CDN) |
| `GET /status/:id` | < 100ms | < 200ms | S3 GET + decompress |

**Optimization Strategies:**
- ✅ Cache DID docs in Redis (TTL: 3600s)
- ✅ Cache StatusList in Redis (TTL: 900s)
- ✅ Use connection pooling (Postgres: 10-20 connections)
- ✅ Prefetch issuer DID on bootstrap (warm cache)
- ✅ Use compression for StatusList (GZIP)

---

## 🎓 **Learning Resources**

When AI agent encounters unfamiliar concepts:

**W3C Standards:**
- [VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [DID Core](https://www.w3.org/TR/did-core/)
- [StatusList2021](https://w3c.github.io/vc-status-list-2021/)

**Code Examples:**
- `packages/shared/src/` — Type definitions
- `apps/issuer-svc/src/vc/use-cases/` — Business logic examples

**Ask for Clarification When:**
- ❓ Requirement conflicts with security rule
- ❓ Performance target cannot be met with current approach
- ❓ New dependency needed (check if allowed)

---

## ✅ **Checklist Before Submitting Code**

- [ ] No PII in database schema
- [ ] No PII in logs (use `sanitizeObject()`)
- [ ] No hardcoded secrets
- [ ] Input validation with class-validator
- [ ] Rate limiting on public endpoints
- [ ] Unit tests written (80%+ coverage)
- [ ] OpenAPI decorators added
- [ ] TypeScript strict mode passes
- [ ] ESLint passes (no warnings)
- [ ] Comments explain WHY (not WHAT)

---

## 🚨 **Red Flags to Reject**

If AI agent suggests code with these patterns, **STOP** and ask human:

1. ❌ Adding `blockchain`, `web3`, `ethers` dependencies
2. ❌ Storing credential subject in database
3. ❌ Logging `dto.claims` without sanitization
4. ❌ Using `any` type in public APIs
5. ❌ Hardcoded private keys or secrets
6. ❌ Disabling CORS globally (`origin: '*'` in prod)
7. ❌ Accepting PII fields (`name`, `email`) in claims
8. ❌ Skipping signature verification in VP
9. ❌ Missing idempotency for write operations
10. ❌ Not checking `nonce`/`aud`/`exp` in presentations

---

## 📞 **Questions? Escalate to Human**

For decisions on:
- Architecture changes (new modules, layers)
- New dependencies (not in approved list)
- Security trade-offs (performance vs security)
- Privacy requirements (new PII-like fields)
- Regulatory compliance (Indonesia data protection laws)

---

**Last Updated:** 2025-10-19  
**Maintained By:** @Sukooos  
**AI Agents:** Follow strictly, escalate ambiguities
