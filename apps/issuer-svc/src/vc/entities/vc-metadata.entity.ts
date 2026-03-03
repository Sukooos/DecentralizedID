import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * VC Metadata Entity
 * 
 * WHY: Store ONLY metadata, NOT credential subject (privacy-by-design).
 * Credential subject disimpan di wallet holder, bukan di DB issuer.
 */
@Entity('vc_metadata')
@Index(['subjectDid', 'credentialType'])
@Index(['revoked'])
export class VcMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  credentialId: string; // urn:uuid:xxx

  @Column()
  subjectDid: string; // Holder DID (untuk audit, bukan PII)

  @Column()
  credentialType: string; // StudentIDCredential, KYCCredential, etc

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ nullable: true })
  revocationReason: string | null;

  @Column({ type: 'text', nullable: true })
  revocationNotes: string | null;

  @Column({ nullable: true, unique: true })
  idempotencyKey: string | null;

  @Column({ type: 'integer', nullable: true })
  statusListIndex: number | null; // Index di StatusList2021 bitstring

  @UpdateDateColumn()
  updatedAt: Date;

  // NO credentialSubject column! Privacy-by-design.
  // Credential subject cuma di wallet holder.
}
