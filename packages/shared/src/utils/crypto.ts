/**
 * Crypto utilities for DID/VC operations
 */

import { base64url } from './base64url';

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser/Node 19+ with Web Crypto API
    return crypto.getRandomValues(new Uint8Array(length));
  }
  
  // Fallback for Node < 19
  const { randomBytes } = require('crypto');
  return new Uint8Array(randomBytes(length));
}

/**
 * Generate nonce for presentation challenge
 */
export function generateNonce(length: number = 32): string {
  const bytes = generateRandomBytes(length);
  return base64url.encode(bytes);
}

/**
 * Generate credential ID (urn:uuid format)
 */
export function generateCredentialId(): string {
  // Simple UUID v4 implementation
  const bytes = generateRandomBytes(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Variant 10

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Parse DID to extract method and identifier
 */
export function parseDid(did: string): { method: string; identifier: string } | null {
  const match = did.match(/^did:([a-z0-9]+):(.+)$/);
  if (!match) return null;
  return {
    method: match[1]!,
    identifier: match[2]!,
  };
}

/**
 * Convert did:web to HTTPS URL for DID document
 */
export function didWebToUrl(did: string): string | null {
  const parsed = parseDid(did);
  if (parsed?.method !== 'web') return null;

  const identifier = parsed.identifier
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')
    .replace(/%2520/g, '%20');

  const parts = identifier.split(':');
  const domain = parts[0]!;
  const path = parts.slice(1).join('/');

  if (path) {
    return `https://${domain}/${path}/did.json`;
  }
  return `https://${domain}/.well-known/did.json`;
}
