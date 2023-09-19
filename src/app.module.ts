import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AccountIngestorModule } from './account-ingestor/ingestor.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrometheusModule } from './prometheus/prometheus.module';
import { ConfigModule } from '@nestjs/config';

/**
 * The Server Application main module.
 *
 * Enable binding internal & external modules and services
 */
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
    ConfigModule.forRoot({ cache: true }),
    AccountIngestorModule,
    HealthModule,
    MetricsModule,
    PrometheusModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
