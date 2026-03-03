/**
 * W3C Verifiable Credential Data Model 2.0
 * @see https://www.w3.org/TR/vc-data-model-2.0/
 */

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  id: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  proof?: Proof;
}

export interface CredentialSubject {
  id: string; // Holder DID
  [key: string]: unknown; // Claims (NO PII per privacy-by-design)
}

/**
 * StatusList2021 Entry
 * @see https://w3c.github.io/vc-status-list-2021/
 */
export interface CredentialStatus {
  id: string;
  type: 'StatusList2021Entry';
  statusPurpose: 'revocation' | 'suspension';
  statusListIndex: string;
  statusListCredential: string;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue?: string;
  jws?: string;
}

/**
 * JWT-VC Payload (Compact format)
 */
export interface JwtVcPayload {
  vc: VerifiableCredential;
  jti: string; // Credential ID
  iss: string; // Issuer DID
  sub: string; // Subject (Holder) DID
  nbf: number; // Not before (Unix timestamp)
  iat: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Verifiable Presentation
 */
export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  id?: string;
  holder?: string;
  verifiableCredential: (VerifiableCredential | string)[]; // Can be JWT string
  proof?: PresentationProof;
}

export interface PresentationProof extends Proof {
  challenge: string; // Nonce from verifier
  domain?: string; // Verifier domain (prevent phishing)
}

/**
 * JWT-VP Payload
 */
export interface JwtVpPayload {
  vp: VerifiablePresentation;
  nonce: string; // Challenge
  aud?: string; // Verifier DID/domain
  iss: string; // Holder DID
  iat: number;
  exp?: number;
}

/**
 * StudentID Credential Subject (MVP use case)
 */
export interface StudentCredentialSubject extends CredentialSubject {
  id: string; // Student DID
  university: string;
  faculty?: string;
  major?: string;
  studentId?: string; // NIM (anonymized, bukan plaintext)
  isStudent: boolean;
  enrolledUntil?: string; // ISO 8601 date
  graduationYear?: number;
}

/**
 * KYC Credential Subject (Phase 2)
 */
export interface KycCredentialSubject extends CredentialSubject {
  id: string;
  kycLevel: 'tier-1' | 'tier-2' | 'tier-3';
  verifiedAt: string;
  ageOver18: boolean;
  nationality: string;
  // NO name, NO KTP number, NO date of birth (privacy!)
}
