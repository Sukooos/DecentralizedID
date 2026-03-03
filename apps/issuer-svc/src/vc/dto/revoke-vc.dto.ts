import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum RevocationReason {
  GRADUATION = 'graduation',
  DROPOUT = 'dropout',
  SUSPENSION = 'suspension',
  FRAUD = 'fraud',
  EXPIRED = 'expired',
  OTHER = 'other',
}

export class RevokeVcDto {
  @ApiProperty({
    description: 'Credential ID to revoke (urn:uuid format)',
    example: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  credentialId: string;

  @ApiProperty({
    description: 'Reason for revocation (for audit trail)',
    enum: RevocationReason,
    example: RevocationReason.GRADUATION,
    required: false,
  })
  @IsOptional()
  @IsEnum(RevocationReason)
  reason?: RevocationReason;

  @ApiProperty({
    description: 'Additional notes (internal, not exposed to verifier)',
    example: 'Student graduated on 2025-10-05',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
