import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MS_CONFIG } from '../src/common/config';

const API_URI =
  '/' + MS_CONFIG.URI_DOMAIN_API + '/v' + MS_CONFIG.VERSION_PUBLIC;

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Prefix this service's HTTP REST API
    app.setGlobalPrefix(MS_CONFIG.URI_DOMAIN_API);

    // Enable the URI-based versioning of APIs
    app.enableVersioning({
      type: VersioningType.URI,
    });

    // Start the app server
    await app.listen(MS_CONFIG.PORT_EXPOSED).then(() => {
      app.init();
    });
  });

  it('/ping (GET)', () => {
    return request(app.getHttpServer())
      .get(API_URI + '/ping')
      .expect(200)
      .expect('true');
  });
});
