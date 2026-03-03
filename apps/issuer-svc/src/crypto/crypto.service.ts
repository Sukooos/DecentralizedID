import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ed from '@noble/ed25519';
import { exportJWK, importJWK, type KeyLike } from 'jose';

/**
 * Crypto Service
 * 
 * WHY: Centralize key management & signing operations.
 * Production: integrate dengan Vault/AWS KMS/HSM.
 */
@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);
  private issuerPrivateKey: KeyLike | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Initialize issuer key on startup
    await this.loadIssuerKey();
  }

  /**
   * Get issuer private key (for VC signing)
   * Production: fetch from Vault/KMS, NOT from env var!
   */
  async getIssuerPrivateKey(): Promise<KeyLike> {
    if (!this.issuerPrivateKey) {
      await this.loadIssuerKey();
    }
    return this.issuerPrivateKey!;
  }

  /**
   * Load private key from KMS/Vault
   * 
   * WHY: In dev, generate ephemeral key. In prod, fetch from secure storage.
   */
  private async loadIssuerKey(): Promise<void> {
    const env = this.config.get<string>('NODE_ENV');

    if (env === 'production') {
      // TODO: Implement Vault/KMS integration
      // const vaultToken = this.config.get<string>('VAULT_TOKEN');
      // const keyPath = this.config.get<string>('VAULT_KEY_PATH');
      // const privateKeyJwk = await this.fetchFromVault(keyPath, vaultToken);
      // this.issuerPrivateKey = await importJWK(privateKeyJwk, 'EdDSA');
      
      throw new Error('Production KMS integration not implemented. Set NODE_ENV=development.');
    }

    // Development: generate ephemeral Ed25519 key
    this.logger.warn('⚠️  Using ephemeral Ed25519 key (DEVELOPMENT ONLY)');
    const privateKeyBytes = ed.utils.randomPrivateKey();
    const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);

    // Convert to JWK format
    const privateKeyJwk = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: Buffer.from(publicKeyBytes).toString('base64url'),
      d: Buffer.from(privateKeyBytes).toString('base64url'),
    };

    this.issuerPrivateKey = await importJWK(privateKeyJwk, 'EdDSA');

    this.logger.log('Issuer key loaded (ephemeral, dev-only)');
  }

  /**
   * Get public key JWK (for DID document)
   */
  async getIssuerPublicKeyJwk(): Promise<Record<string, unknown>> {
    const privateKey = await this.getIssuerPrivateKey();
    const publicKeyJwk = await exportJWK(privateKey);
    
    // Remove private key material
    delete publicKeyJwk.d;
    
    return publicKeyJwk;
  }
}
