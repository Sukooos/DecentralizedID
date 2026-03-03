import { Module } from '@nestjs/common';
import { DidController } from './did.controller';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  controllers: [DidController],
})
export class DidModule {}
