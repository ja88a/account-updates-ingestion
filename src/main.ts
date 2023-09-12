import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { MS_CONFIG } from './common/config';

async function bootstrap() {
  // Initiate the app, with the default logger
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Prefix this service's HTTP REST API
  app.setGlobalPrefix(MS_CONFIG.URI_DOMAIN_API);

  // Enable the URI-based versioning of APIs
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Listen for shutdown hooks
  app.enableShutdownHooks();

  // Start the app
  await app.listen(MS_CONFIG.PORT_EXPOSED);
}
bootstrap();
