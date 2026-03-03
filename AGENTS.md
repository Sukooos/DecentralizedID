# Agent Brief — DecentralizedID

> **📖 Full Guide:** See [`.github/AI_AGENT_INSTRUCTIONS.md`](.github/AI_AGENT_INSTRUCTIONS.md) for complete rules, examples, and standards.

## Mission
Implement **Self-Sovereign Identity (SSI)** platform untuk Indonesia:
- **MVP:** StudentID Verifiable Credential (prove enrollment tanpa KTP fisik)
- **Tech:** W3C VC 2.0 (JWT-VC), DID method `did:web`, StatusList2021
- **NOT:** Blockchain/crypto/federated-identity (fase 2 baru did:ion)

## Critical Constraints
- ✅ **Privacy:** NO PII in database/logs (only credential metadata)
- ✅ **Latency:** Verify VP < 300ms (cache DID docs + StatusList)
- ✅ **Standards:** Follow W3C VC 2.0, DID Core specs exactly
- ✅ **Testing:** 80%+ coverage, unit + E2E flows

## Tasks You May Perform
- Generate NestJS modules (`service/controller/module/spec`)
- Implement use-cases (`IssueVCUseCase`, `VerifyPresentationUseCase`)
- Fix linting/tests/CI (no breaking API changes)
- Write PR descriptions (summary, verification steps)

## Security Rules
- ❌ **Never** execute risky CLI without explicit permission
- ❌ **Never** log PII (`name`, `email`, `phone`, `nik`)
- ❌ **Never** hardcode secrets (`process.env.XYZ` only)
- ✅ **Always** sanitize logs (`sanitizeObject()`)
- ✅ **Always** validate DTOs (class-validator + Zod)

## Definition of Done
- [ ] `pnpm build` succeeds (no TypeScript errors)
- [ ] `pnpm test` passes (80%+ coverage)
- [ ] `pnpm lint` clean (no ESLint warnings)
- [ ] PR includes: summary, risks, manual verification steps
- [ ] No PII stored/logged (audit with grep `credentialSubject`)

---

**Questions?** Read [AI_AGENT_INSTRUCTIONS.md](.github/AI_AGENT_INSTRUCTIONS.md) for details.
