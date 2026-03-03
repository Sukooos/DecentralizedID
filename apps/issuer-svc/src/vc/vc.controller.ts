import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IssueVcUseCase } from './use-cases/issue-vc.usecase';
import { RevokeVcUseCase } from './use-cases/revoke-vc.usecase';
import { IssueVcDto } from './dto/issue-vc.dto';
import { RevokeVcDto } from './dto/revoke-vc.dto';
// import { AdminAuthGuard } from '../auth/admin-auth.guard'; // TODO: implement authn

@ApiTags('VC')
@Controller('vc')
// @UseGuards(AdminAuthGuard) // TODO: Uncomment saat auth ready
@ApiBearerAuth('admin-auth')
export class VcController {
  constructor(
    private readonly issueVcUseCase: IssueVcUseCase,
    private readonly revokeVcUseCase: RevokeVcUseCase,
  ) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10/min (strict rate limit)
  @ApiOperation({
    summary: 'Issue a verifiable credential',
    description:
      'Issue StudentID credential to holder. Returns JWT-VC yang harus disimpan di wallet holder.\n\n' +
      '**Security**: Requires admin authentication.\n' +
      '**Privacy**: Claims MUST NOT contain PII (name, email, phone, NIK, etc).',
  })
  @ApiResponse({
    status: 201,
    description: 'VC issued successfully',
    schema: {
      type: 'object',
      properties: {
        vc: {
          type: 'string',
          description: 'JWT-VC (signed verifiable credential)',
          example: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDp3ZWI6...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or PII detected in claims' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async issueVc(@Body() dto: IssueVcDto): Promise<{ vc: string }> {
    const vc = await this.issueVcUseCase.execute(dto);
    return { vc };
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a credential',
    description:
      'Update StatusList2021 bitstring untuk mark credential as revoked.\n\n' +
      '**Note**: Credential di wallet holder tetap ada, tapi verifier akan reject saat verify.',
  })
  @ApiResponse({
    status: 200,
    description: 'VC revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async revokeVc(@Body() dto: RevokeVcDto): Promise<{ success: boolean }> {
    await this.revokeVcUseCase.execute(dto);
    return { success: true };
  }
}
