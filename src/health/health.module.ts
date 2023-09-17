import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AccountIngestorModule } from '../account-ingestor/ingestor.module';
import { PrometheusModule } from '../prometheus/prometheus.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    HttpModule,
    TerminusModule,
    PrometheusModule,
    AccountIngestorModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
