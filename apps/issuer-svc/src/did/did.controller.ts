import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CryptoService } from '../crypto/crypto.service';

/**
 * DID Document Controller
 * 
 * WHY: Serve did:web DID document di /.well-known/did.json
 * Spec: https://w3c-ccg.github.io/did-method-web/
 */
@ApiTags('DID')
@Controller('.well-known')
export class DidController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('did.json')
  @Header('Content-Type', 'application/did+json')
  @ApiOperation({
    summary: 'Get DID Document (did:web resolution)',
    description:
      'Returns DID document dengan public key untuk verify VC signatures.\n\n' +
      'DID: `did:web:issuer.example.ac.id` resolves to `https://issuer.example.ac.id/.well-known/did.json`',
  })
  @ApiResponse({
    status: 200,
    description: 'DID Document',
    schema: {
      type: 'object',
      properties: {
        '@context': { type: 'array', items: { type: 'string' } },
        id: { type: 'string', example: 'did:web:issuer.example.ac.id' },
        verificationMethod: { type: 'array' },
      },
    },
  })
  async getDidDocument(): Promise<Record<string, unknown>> {
    const publicKeyJwk = await this.cryptoService.getIssuerPublicKeyJwk();

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: process.env.ISSUER_DID!,
      verificationMethod: [
        {
          id: `${process.env.ISSUER_DID}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: process.env.ISSUER_DID!,
          publicKeyJwk,
        },
      ],
      authentication: [`${process.env.ISSUER_DID}#key-1`],
      assertionMethod: [`${process.env.ISSUER_DID}#key-1`],
    };
  }
}
