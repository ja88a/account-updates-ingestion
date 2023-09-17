import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { NestFactory } from '@nestjs/core';
import { MS_CONFIG } from './common/config';
import { AppModule } from './app.module';

async function bootstrap() {
  // Initiate the app, with the default logger
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Prefix all URIs of this service's HTTP REST API
  app.setGlobalPrefix(MS_CONFIG.URI_DOMAIN_API);

  // Enable the URI-based versioning of APIs
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Listen for shutdown hooks
  app.enableShutdownHooks();

  // Start the app
  const port = process.env.PORT || MS_CONFIG.PORT_EXPOSED;
  await app.listen(port);
  // await app.listen(port, () => {
  //   Logger.log('Listening at http://localhost:' + port + '/' + MS_CONFIG.URI_DOMAIN_API);
  // });
}
bootstrap();
