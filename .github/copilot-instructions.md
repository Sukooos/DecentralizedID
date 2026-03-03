# Copilot Instructions — DecentralizedID

> **📖 Full Instructions:** See [AI_AGENT_INSTRUCTIONS.md](AI_AGENT_INSTRUCTIONS.md) for comprehensive rules, examples, and checklists.

## Quick Reference

### **Project Context**
- **What:** Self-Sovereign Identity (SSI) platform untuk Indonesia
- **MVP:** StudentID Verifiable Credential (mahasiswa prove enrollment status)
- **Stack:** NestJS (backend), React Native (wallet), Postgres, Redis, MinIO/S3
- **Standards:** W3C VC 2.0 (JWT-VC), DID method `did:web`, StatusList2021
- **NOT:** Blockchain, cryptocurrency, federated identity, PKI/X.509

### **Architecture**
- **Pattern:** Clean/Hexagonal (use-cases independent of framework)
- **Modules:** `vc/`, `did/`, `crypto/`, `status-list/`, `presentation/`
- **Testing:** Unit (use-cases), integration (controllers), E2E (flows) — 80%+ coverage

### **Security & Privacy**
- ✅ **Privacy-by-Design:** NO PII in database/logs (only metadata)
- ✅ **Secrets:** Use KMS/Vault (never hardcode)
- ✅ **Validation:** class-validator + Zod (reject PII in claims)
- ✅ **Rate Limiting:** 10 req/min for `/vc/issue`, 60/min global
- ✅ **Auth Check:** Verify `nonce`, `aud`, `exp` in presentations

### **Code Style**
- **TypeScript:** Strict mode (no `any`, explicit return types)
- **Naming:** `PascalCase` (classes), `camelCase` (functions/vars), `kebab-case` (files)
- **Comments:** Explain WHY (business rules, security), not WHAT
- **Files:** One class per file, test next to source (`.spec.ts`)

### **Critical Do's and Don'ts**

#### ✅ **DO:**
- Use dependency injection (constructor)
- Validate ALL user input (DTOs)
- Sanitize logs (`sanitizeObject()`)
- Cache DID docs (Redis, TTL: 1h)
- Write tests for new use-cases

#### ❌ **DON'T:**
- Store `credentialSubject` in DB (privacy violation!)
- Log PII (`name`, `email`, `phone`, `nik`)
- Hardcode secrets in code
- Use `any` type or `@ts-ignore`
- Add blockchain dependencies (`web3`, `ethers`)

### **Quick Checks**
```typescript
// ❌ BAD: PII in database
@Entity()
class VcMetadata {
  @Column()
  studentName: string; // FORBIDDEN!
}

// ✅ GOOD: Only metadata
@Entity()
class VcMetadata {
  @Column()
  credentialId: string; // urn:uuid:xxx
  
  @Column()
  subjectDid: string;   // Holder DID (NOT name!)
  
  @Column()
  revoked: boolean;
}
```

```typescript
// ❌ BAD: No PII validation
async issueVc(dto: IssueVcDto) {
  return this.sign(dto.claims); // Accepts { email: '...' }!
}

// ✅ GOOD: Validated claims
export class IssueVcDto {
  @IsObject()
  @Validate(NoPiiValidator) // Rejects PII fields
  claims: Record<string, unknown>;
}
```

### **Performance Targets**
| Endpoint | p50 | p99 |
|----------|-----|-----|
| `POST /vc/issue` | < 200ms | < 500ms |
| `POST /presentation/verify` | < 150ms | < 300ms |

**Optimization:** Cache DID docs (Redis, 1h TTL), use connection pooling.

---

**Questions?** Read [AI_AGENT_INSTRUCTIONS.md](AI_AGENT_INSTRUCTIONS.md) or escalate to human.
