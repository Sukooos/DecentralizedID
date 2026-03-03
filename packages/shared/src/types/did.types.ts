/**
 * DID Document (W3C DID Core)
 * @see https://www.w3.org/TR/did-core/
 */

export interface DidDocument {
  '@context': string | string[];
  id: string; // DID
  controller?: string | string[];
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  assertionMethod?: (string | VerificationMethod)[];
  keyAgreement?: (string | VerificationMethod)[];
  capabilityInvocation?: (string | VerificationMethod)[];
  capabilityDelegation?: (string | VerificationMethod)[];
  service?: Service[];
  alsoKnownAs?: string[];
}

export interface VerificationMethod {
  id: string;
  type: string; // e.g., 'Ed25519VerificationKey2020'
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: JsonWebKey;
  publicKeyBase58?: string;
}

export interface Service {
  id: string;
  type: string | string[];
  serviceEndpoint: string | Record<string, unknown>;
}

/**
 * DID Resolution Result
 */
export interface DidResolutionResult {
  didDocument: DidDocument | null;
  didResolutionMetadata: DidResolutionMetadata;
  didDocumentMetadata: DidDocumentMetadata;
}

export interface DidResolutionMetadata {
  contentType?: string;
  error?: 'invalidDid' | 'notFound' | 'representationNotSupported' | 'methodNotSupported';
  errorMessage?: string;
}

export interface DidDocumentMetadata {
  created?: string;
  updated?: string;
  deactivated?: boolean;
  versionId?: string;
  nextUpdate?: string;
  nextVersionId?: string;
  equivalentId?: string[];
  canonicalId?: string;
}

/**
 * Supported DID Methods
 */
export type DidMethod = 'web' | 'key' | 'ion' | 'ethr';

/**
 * DID Resolver Interface
 */
export interface IDidResolver {
  resolve(did: string): Promise<DidResolutionResult>;
  supports(did: string): boolean;
}
