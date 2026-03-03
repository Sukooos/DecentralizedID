# @decentralized-id/shared

Shared TypeScript types, Zod schemas, and utilities for DecentralizedID platform.

## Installation

```bash
pnpm add @decentralized-id/shared
```

## Usage

### Types

```typescript
import { VerifiableCredential, StudentCredentialSubject, DidDocument } from '@decentralized-id/shared';

const credential: VerifiableCredential = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiableCredential', 'StudentIDCredential'],
  id: 'urn:uuid:...',
  issuer: 'did:web:issuer.univ.ac.id',
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: 'did:key:...',
    university: 'Example University',
    isStudent: true,
  },
};
```

### Schemas (Validation)

```typescript
import { issueVcDtoSchema, studentCredentialClaimsSchema } from '@decentralized-id/shared';

// Validate input DTO
const result = issueVcDtoSchema.safeParse(input);
if (!result.success) {
  console.error(result.error);
}

// Validate student claims (prevents PII)
const claims = studentCredentialClaimsSchema.parse({
  university: 'UI',
  isStudent: true,
  enrolledUntil: '2027-08-31',
});
```

### Utils

```typescript
import { sanitizeObject, generateNonce, didWebToUrl } from '@decentralized-id/shared';

// Sanitize logs (prevent PII leakage)
const sanitized = sanitizeObject({ email: 'user@example.com', name: 'John' });
console.log(sanitized); // { email: '[REDACTED]', name: 'John' }

// Generate nonce for presentation challenge
const nonce = generateNonce(); // base64url-encoded 32 bytes

// Convert did:web to HTTPS URL
const url = didWebToUrl('did:web:issuer.univ.ac.id');
// => 'https://issuer.univ.ac.id/.well-known/did.json'
```

## Security

- **PII Prevention**: Zod schemas reject common PII fields (name, email, phone, etc.)
- **Log Sanitization**: Auto-redact sensitive data in logs
- **Strict Types**: TypeScript strict mode enforced

## License

MIT
