import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '../prometheus/prometheus.module';
import { AccountIngestorModule } from '../account-ingestor/ingestor.module';

@Module({
  imports: [TerminusModule, PrometheusModule, AccountIngestorModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
