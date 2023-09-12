import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { MICROSERVICE_PORT_EXPOSED } from './common/config';

async function bootstrap() {
  // Initiate the app, with the default logger
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Enable URI versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Listen for shutdown hooks
  app.enableShutdownHooks();

  // Start the app
  await app.listen(MICROSERVICE_PORT_EXPOSED);
}
bootstrap();
