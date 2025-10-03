# Path-specific Instructions — backend (apps/**, packages/**)

- Gunakan NestJS Providers + InjectionToken untuk crypto, did resolver, dan status list store.
- Semua handler HTTP: schema validation (DTO + class-validator/zod).
- Buat fungsi util idempotency untuk /vc/issue. Logging sensitif disanitasi.
- Query DB hanya lewat repository layer; jangan query mentah di controller.
