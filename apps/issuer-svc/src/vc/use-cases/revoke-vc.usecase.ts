import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VcMetadata } from '../entities/vc-metadata.entity';
import { StatusListService } from '../../status-list/status-list.service';
import { RevokeVcDto } from '../dto/revoke-vc.dto';

/**
 * Revoke VC Use Case
 * 
 * WHY: Revocation harus update StatusList2021 bitstring (on-chain/S3).
 * Credential sendiri di wallet holder, gak bisa di-delete dari sana.
 */
@Injectable()
export class RevokeVcUseCase {
  private readonly logger = new Logger(RevokeVcUseCase.name);

  constructor(
    @InjectRepository(VcMetadata)
    private readonly vcMetadataRepo: Repository<VcMetadata>,
    private readonly statusListService: StatusListService,
  ) {}

  async execute(dto: RevokeVcDto): Promise<void> {
    // 1. Find credential metadata
    const metadata = await this.vcMetadataRepo.findOne({
      where: { credentialId: dto.credentialId },
    });

    if (!metadata) {
      throw new NotFoundException(`Credential not found: ${dto.credentialId}`);
    }

    if (metadata.revoked) {
      this.logger.warn(`Credential already revoked: ${dto.credentialId}`);
      return; // Idempotent operation
    }

    // 2. Update StatusList2021 bitstring (set bit to 1)
    if (metadata.statusListIndex !== null) {
      await this.statusListService.revokeCredential(metadata.statusListIndex);
    }

    // 3. Update metadata
    metadata.revoked = true;
    metadata.revokedAt = new Date();
    metadata.revocationReason = dto.reason ?? null;
    metadata.revocationNotes = dto.notes ?? null;

    await this.vcMetadataRepo.save(metadata);

    this.logger.log({
      message: 'VC revoked successfully',
      credentialId: dto.credentialId,
      reason: dto.reason,
      statusListIndex: metadata.statusListIndex,
    });
  }
}
