import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrometheusService } from '../prometheus/prometheus.service';
import { IHealthIndicator } from './interfaces/health-indicator.interface';
import { NestjsHealthIndicator } from './models/nestjs-health.indicator';
import { AccountIngestorHealthIndicator } from './models/account-ingestor.indicator';
import { AccountIngestorService } from '../account-ingestor';

@Injectable()
export class HealthService {
  private readonly listOfThingsToMonitor: IHealthIndicator[];

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private promClientService: PrometheusService,
    private anyOtherService: AccountIngestorService,
  ) {
    this.listOfThingsToMonitor = [
      new NestjsHealthIndicator(
        this.http,
        'https://docs.nestjs.com',
        this.promClientService,
      ),
      new AccountIngestorHealthIndicator(
        this.anyOtherService,
        this.promClientService,
      ),
    ];
  }

  @HealthCheck()
  public async check(): Promise<HealthCheckResult | undefined> {
    return await this.health.check(
      this.listOfThingsToMonitor.map(
        (apiIndicator: IHealthIndicator) => async () => {
          try {
            return await apiIndicator.isHealthy();
          } catch (e) {
            Logger.warn(e);
            return apiIndicator.reportUnhealthy();
          }
        },
      ),
    );
  }
}
