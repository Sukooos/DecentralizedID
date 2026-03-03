import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusListBitstring } from './entities/status-list-bitstring.entity';

/**
 * StatusList2021 Service
 * 
 * WHY: Manage revocation bitstring (compressed, stored in S3/MinIO).
 * StatusList spec: https://w3c.github.io/vc-status-list-2021/
 */
@Injectable()
export class StatusListService {
  private readonly logger = new Logger(StatusListService.name);
  private readonly STATUS_LIST_SIZE = parseInt(process.env.STATUS_LIST_SIZE || '131072', 10);

  constructor(
    @InjectRepository(StatusListBitstring)
    private readonly bitstringRepo: Repository<StatusListBitstring>,
  ) {}

  /**
   * Allocate index di bitstring untuk credential baru
   */
  async allocateIndex(): Promise<number> {
    // Simple implementation: increment counter
    // Production: use distributed counter (Redis INCR)
    
    const latestIndex = await this.bitstringRepo
      .createQueryBuilder('bitstring')
      .select('MAX(bitstring.lastAllocatedIndex)', 'max')
      .getRawOne<{ max: number | null }>();

    const nextIndex = (latestIndex?.max ?? -1) + 1;

    if (nextIndex >= this.STATUS_LIST_SIZE) {
      throw new Error('StatusList full! Create new status list.');
    }

    // Update tracker
    await this.bitstringRepo.save({
      id: 1, // Single status list untuk MVP
      lastAllocatedIndex: nextIndex,
      totalRevoked: 0, // Will update on revocation
    });

    return nextIndex;
  }

  /**
   * Revoke credential (set bit to 1)
   */
  async revokeCredential(index: number): Promise<void> {
    // TODO: Implement bitstring manipulation
    // 1. Load bitstring dari S3/MinIO
    // 2. Set bit[index] = 1
    // 3. Compress (GZIP)
    // 4. Upload kembali ke S3
    // 5. Invalidate cache (Redis)

    this.logger.log(`Credential at index ${index} revoked (bitstring update pending)`);
    
    // Increment revoked counter
    await this.bitstringRepo.increment({ id: 1 }, 'totalRevoked', 1);
  }

  /**
   * Check if credential revoked
   */
  async isRevoked(index: number): Promise<boolean> {
    // TODO: Implement bitstring check
    // 1. Fetch bitstring dari cache (Redis) atau S3
    // 2. Decompress
    // 3. Check bit[index]
    
    return false; // Placeholder
  }
}
