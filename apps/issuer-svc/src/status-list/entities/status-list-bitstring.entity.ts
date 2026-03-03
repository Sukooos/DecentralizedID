import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * StatusList Bitstring Tracker
 * 
 * WHY: Track allocated indices & metadata.
 * Actual bitstring disimpan di S3/MinIO (compressed).
 */
@Entity('status_list_bitstring')
export class StatusListBitstring {
  @PrimaryColumn()
  id: number; // 1 for MVP (single status list)

  @Column({ default: -1 })
  lastAllocatedIndex: number;

  @Column({ default: 0 })
  totalRevoked: number;

  @Column({ nullable: true })
  s3Key: string | null; // S3 object key for bitstring

  @UpdateDateColumn()
  updatedAt: Date;
}
