import { z } from 'zod';

/**
 * DID Schema (W3C DID format)
 */
export const didSchema = z
  .string()
  .regex(/^did:[a-z0-9]+:[a-zA-Z0-9._%-]*[a-zA-Z0-9]$/, 'Invalid DID format');

/**
 * ISO 8601 Date Schema
 */
export const iso8601DateSchema = z.string().datetime();

/**
 * Issue VC DTO Schema
 */
export const issueVcDtoSchema = z.object({
  subjectDid: didSchema,
  claims: z.record(z.unknown()).refine(
    (claims: Record<string, unknown>) => {
      // WHY: Prevent PII in credential subject (privacy-by-design)
      const piiKeys = ['name', 'fullName', 'email', 'phone', 'address', 'ktp', 'nik', 'npwp'];
      return !Object.keys(claims).some((key) => piiKeys.includes(key.toLowerCase()));
    },
    { message: 'Claims contain PII fields (name, email, phone, etc). Use anonymized claims.' },
  ),
  expirationDate: iso8601DateSchema.optional(),
  idempotencyKey: z.string().uuid().optional(),
});

export type IssueVcDto = z.infer<typeof issueVcDtoSchema>;

/**
 * Revoke VC DTO Schema
 */
export const revokeVcDtoSchema = z.object({
  credentialId: z.string().min(1),
  reason: z.enum(['graduation', 'dropout', 'suspension', 'fraud', 'other']).optional(),
});

export type RevokeVcDto = z.infer<typeof revokeVcDtoSchema>;

/**
 * Presentation Request Schema
 */
export const presentationRequestSchema = z.object({
  challenge: z.string().min(16),
  domain: z.string().url().optional(),
  credentialTypes: z.array(z.string()).optional(),
  expiresAt: iso8601DateSchema.optional(),
});

export type PresentationRequest = z.infer<typeof presentationRequestSchema>;

/**
 * Verify Presentation DTO Schema
 */
export const verifyPresentationDtoSchema = z.object({
  presentation: z.string().min(1), // JWT-VP
  challenge: z.string().min(16),
  domain: z.string().optional(),
});

export type VerifyPresentationDto = z.infer<typeof verifyPresentationDtoSchema>;

/**
 * Student Credential Claims Schema (MVP)
 */
export const studentCredentialClaimsSchema = z.object({
  university: z.string().min(1),
  faculty: z.string().optional(),
  major: z.string().optional(),
  studentId: z.string().optional(), // Anonymized NIM
  isStudent: z.boolean(),
  enrolledUntil: iso8601DateSchema.optional(),
  graduationYear: z.number().int().min(2020).max(2050).optional(),
});

export type StudentCredentialClaims = z.infer<typeof studentCredentialClaimsSchema>;
