import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusListService } from './status-list.service';
import { StatusListBitstring } from './entities/status-list-bitstring.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StatusListBitstring])],
  providers: [StatusListService],
  exports: [StatusListService],
})
export class StatusListModule {}
