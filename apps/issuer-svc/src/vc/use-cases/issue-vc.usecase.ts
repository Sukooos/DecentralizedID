import { Injectable, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignJWT } from 'jose';
import { addDays } from 'date-fns';
import { VcMetadata } from '../entities/vc-metadata.entity';
import { CryptoService } from '../../crypto/crypto.service';
import { StatusListService } from '../../status-list/status-list.service';
import { IssueVcDto } from '../dto/issue-vc.dto';
import { generateCredentialId } from '@decentralized-id/shared';

/**
 * Issue VC Use Case
 * 
 * WHY: Isolated business logic (Clean Architecture/Hexagonal).
 * Dependency injection memudahkan testing & swap implementation.
 */
@Injectable()
export class IssueVcUseCase {
  private readonly logger = new Logger(IssueVcUseCase.name);

  constructor(
    @InjectRepository(VcMetadata)
    private readonly vcMetadataRepo: Repository<VcMetadata>,
    private readonly cryptoService: CryptoService,
    private readonly statusListService: StatusListService,
  ) {}

  /**
   * Execute issuance workflow
   * 
   * @returns JWT-VC (signed verifiable credential)
   */
  async execute(dto: IssueVcDto): Promise<string> {
    // 1. Idempotency check (prevent double issuance)
    if (dto.idempotencyKey) {
      const existing = await this.vcMetadataRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });

      if (existing) {
        this.logger.warn(`Duplicate issuance attempt: ${dto.idempotencyKey}`);
        throw new ConflictException('Credential already issued with this idempotency key');
      }
    }

    // 2. Validate claims (NO PII per privacy-by-design)
    this.validateClaims(dto.claims);

    // 3. Generate credential ID (urn:uuid format)
    const credentialId = generateCredentialId();

    // 4. Allocate status list index
    const statusListIndex = await this.statusListService.allocateIndex();

    // 5. Build JWT-VC payload (W3C VC 2.0 compliant)
    const now = Math.floor(Date.now() / 1000);
    const expirationDate = dto.expirationDate
      ? new Date(dto.expirationDate)
      : addDays(new Date(), 730); // Default: 2 years

    const exp = Math.floor(expirationDate.getTime() / 1000);

    const payload = {
      vc: {
        '@context': [
          'https://www.w3.org/ns/credentials/v2',
          'https://www.w3.org/2018/credentials/examples/v1',
        ],
        type: ['VerifiableCredential', 'StudentIDCredential'],
        id: credentialId,
        issuer: process.env.ISSUER_DID!,
        issuanceDate: new Date().toISOString(),
        expirationDate: expirationDate.toISOString(),
        credentialSubject: {
          id: dto.subjectDid,
          ...dto.claims, // NEVER store PII (enforced by validation)
        },
        credentialStatus: {
          id: `${process.env.ISSUER_DOMAIN}/status/1#${statusListIndex}`,
          type: 'StatusList2021Entry',
          statusPurpose: 'revocation',
          statusListIndex: statusListIndex.toString(),
          statusListCredential: `${process.env.ISSUER_DOMAIN}/status/1`,
        },
      },
      jti: credentialId,
      iss: process.env.ISSUER_DID!,
      sub: dto.subjectDid,
      nbf: now,
      iat: now,
      exp,
    };

    // 6. Sign JWT dengan issuer private key (dari Vault/KMS)
    const privateKey = await this.cryptoService.getIssuerPrivateKey();
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        alg: 'EdDSA',
        kid: `${process.env.ISSUER_DID}#key-1`,
        typ: 'JWT',
      })
      .sign(privateKey);

    // 7. Save metadata (NO credential subject PII!)
    await this.vcMetadataRepo.save({
      credentialId,
      subjectDid: dto.subjectDid,
      credentialType: 'StudentIDCredential',
      issuedAt: new Date(),
      expiresAt: expirationDate,
      revoked: false,
      idempotencyKey: dto.idempotencyKey ?? null,
      statusListIndex,
    });

    this.logger.log({
      message: 'VC issued successfully',
      credentialId,
      subjectDid: dto.subjectDid,
      statusListIndex,
      // NO claims logged (prevent PII leak)
    });

    return jwt;
  }

  /**
   * Validate claims untuk prevent PII
   * WHY: Privacy-by-design requirement (copilot-instructions.md)
   */
  private validateClaims(claims: Record<string, unknown>): void {
    const piiKeys = [
      'name',
      'fullname',
      'firstname',
      'lastname',
      'email',
      'phone',
      'phonenumber',
      'mobile',
      'address',
      'street',
      'city',
      'ktp',
      'nik',
      'npwp',
      'passport',
      'dateofbirth',
      'birthdate',
    ];

    const claimKeys = Object.keys(claims).map((k) => k.toLowerCase().replace(/[_\s-]/g, ''));

    const foundPii = claimKeys.filter((key) => piiKeys.includes(key));

    if (foundPii.length > 0) {
      throw new BadRequestException(
        `Claims contain PII fields: ${foundPii.join(', ')}. Use anonymized/category data instead.`,
      );
    }
  }
}
