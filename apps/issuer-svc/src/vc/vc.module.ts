import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VcController } from './vc.controller';
import { IssueVcUseCase } from './use-cases/issue-vc.usecase';
import { RevokeVcUseCase } from './use-cases/revoke-vc.usecase';
import { VcMetadata } from './entities/vc-metadata.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { StatusListModule } from '../status-list/status-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VcMetadata]),
    CryptoModule,
    StatusListModule,
  ],
  controllers: [VcController],
  providers: [IssueVcUseCase, RevokeVcUseCase],
  exports: [IssueVcUseCase, RevokeVcUseCase], // For other modules
})
export class VcModule {}
