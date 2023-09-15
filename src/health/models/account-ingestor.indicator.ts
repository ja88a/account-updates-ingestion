import { BaseHealthIndicator } from './base-health.indicator';
import { IHealthIndicator } from '../interfaces/health-indicator.interface';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { PrometheusService } from '../../prometheus/prometheus.service';
import { AccountIngestorService } from '../../account-ingestor';

export class AccountIngestorHealthIndicator
  extends BaseHealthIndicator
  implements IHealthIndicator
{
  public readonly name = 'AccountIngestorHealthIndicator';
  protected readonly help = 'Status of ' + this.name;

  constructor(
    private service: AccountIngestorService,
    protected promClientService: PrometheusService,
  ) {
    super();
    // this.registerMetrics();
    this.registerGauges();
  }

  public async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = this.service.isConnected();
    this.updatePrometheusData(isHealthy);
    return this.getStatus(this.name, isHealthy);
  }
}
