import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class IssueVcDto {
  @ApiProperty({
    description: 'Subject DID (holder/mahasiswa)',
    example: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  })
  @IsString()
  subjectDid: string;

  @ApiProperty({
    description:
      'Credential claims (StudentID). NO PII allowed (no name/NIK). Use anonymized/category data.',
    example: {
      university: 'Universitas Indonesia',
      faculty: 'Computer Science',
      major: 'Informatics Engineering',
      studentId: 'UI-2021-XXXX', // Anonymized
      isStudent: true,
      enrolledUntil: '2027-08-31',
    },
  })
  @IsObject()
  @Type(() => Object)
  claims: Record<string, unknown>;

  @ApiProperty({
    description: 'Credential expiration date (ISO 8601). Defaults to 2 years if not provided.',
    example: '2027-08-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  expirationDate?: string;

  @ApiProperty({
    description:
      'Idempotency key untuk prevent duplicate issuance (gunakan saat retry request)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}
