import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global validation pipe (sanitasi input per backend.instructions.md)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip props bukan di DTO
      forbidNonWhitelisted: true, // Error kalau ada extra props
      transform: true, // Auto-transform primitives
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS untuk admin portal & wallet
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // OpenAPI/Swagger spec
  const config = new DocumentBuilder()
    .setTitle('Issuer Service API')
    .setDescription(
      'DID/VC Issuance & Revocation service for StudentID credentials.\n\n' +
        '**Security**: All endpoints require authentication (admin token).\n' +
        '**Privacy**: Credential subject claims MUST NOT contain PII (name, email, phone).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Admin JWT token',
      },
      'admin-auth',
    )
    .addTag('VC', 'Verifiable Credential Issuance & Revocation')
    .addTag('DID', 'DID Document Resolution')
    .addTag('Status', 'StatusList2021 Management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Issuer Service API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT_ISSUER || 3001;
  await app.listen(port);

  logger.log(`🚀 Issuer service running on http://localhost:${port}`);
  logger.log(`📖 API docs: http://localhost:${port}/api-docs`);
  logger.log(`🔑 DID: ${process.env.ISSUER_DID}`);
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});
