# Copilot Instructions — DecentralizedID

## Project context
- Proyek DID/SSI untuk Indonesia. MVP: StudentID Verifiable Credential.
- Stack: Node.js + NestJS (issuer/verifier), Postgres, Redis, MinIO/S3; React Native (wallet).
- Standar: W3C VC 2.0 (JWT-VC untuk MVP), DID method: did:web; StatusList2021; fase 2: SD-JWT/BBS+.

## Style & architecture
- Backend: NestJS modular + DI, boundary UseCases (IssueVC, RevokeVC, VerifyPresentation).
- Testing wajib (unit + e2e). Tulis test kalau membuat service/helper baru.
- Typescript strict, ESLint + Prettier; jangan disable rule tanpa alasan.
- Security: selalu periksa nonce/aud/exp pada VP; PII-minimization (jangan simpan PII server-side).

## Output rules
- Saat menulis code: sertakan komentar singkat “WHY” di bagian tricky.
- Saat menulis PR/commit: ringkas, imperative, sebut modul yang berubah.
- Jangan menambahkan dependency berat tanpa alasan & run-time impact note.

## Don’t
- Jangan menyimpan kunci privat ke repo/logs.
- Jangan menulis contoh yang menyimpan credential subject PII di DB.
