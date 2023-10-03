import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { NestFactory } from '@nestjs/core';
import { MS_CONFIG } from './common/config';
import { AppModule } from './app.module';

import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';

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

  // Extra - Publish this app server's OpenAPI
  if (MS_CONFIG.OPENAPI_PUBLISH) {
    const config = new DocumentBuilder()
      .setTitle('Account Updates Ingestor')
      .setDescription(
        'REST API specifications for the Account Updates Ingestor',
      )
      .setVersion('1.0')
      .build();
    const options: SwaggerDocumentOptions = {
      deepScanRoutes: true,
      ignoreGlobalPrefix: false,
    };
    const document = SwaggerModule.createDocument(app, config, options);
    SwaggerModule.setup(MS_CONFIG.URI_DOMAIN_API, app, document);
  }
  // Start the app
  const port = process.env.PORT || MS_CONFIG.PORT_EXPOSED;
  await app.listen(port);
}
bootstrap();
