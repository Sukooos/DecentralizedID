import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { VcModule } from './vc/vc.module';
import { DidModule } from './did/did.module';
import { StatusListModule } from './status-list/status-list.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database (Postgres)
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development', // PROD: false + migrations
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),

    // Rate limiting (per backend.instructions.md)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 min
        limit: 60, // 60 req/min default
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // For sensitive endpoints (/vc/issue)
      },
    ]),

    // Application modules
    VcModule,
    DidModule,
    StatusListModule,
    CryptoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
  ],
})
export class AppModule {}
