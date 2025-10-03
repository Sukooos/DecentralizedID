# Agent Brief — DecentralizedID

## Goals
- Implement & maintain DID/VC flows: /vc/issue, /vc/revoke, /presentation/request, /presentation/verify.
- Jaga privacy-by-design, no-PII-at-rest, dan latency verify < 300ms (cache DID doc & status list).

## Constraints
- Ikuti arsitektur: NestJS modular, Clean/Hexagonal.
- Standar W3C VC 2.0 (JWT-VC), StatusList2021, did:web.
- Tambah test untuk fungsi baru; jangan ubah API publik tanpa update OpenAPI.

## Tasks you may perform
- Generate boilerplate modul Nest (service/controller/module/spec).
- Tambah/verbaiki test, ESLint/Prettier, CI minor fixes.
- Tulis PR dengan deskripsi singkat + langkah verifikasi e2e.

## Security
- Jangan mengeksekusi tool berisiko tanpa persetujuan eksplisit (CLI).
- Sanitasi log; jangan keluarkan secret/PII di output.

## Definition of Done
- Build & test lulus, lint bersih.
- PR berisi ringkasan perubahan, risiko, dan cara uji manual.
