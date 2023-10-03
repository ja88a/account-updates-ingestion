import { Injectable } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class MetricsService {
  constructor(
    private promClientService: PrometheusService,
    private healthService: HealthService,
  ) {}

  /**
   * Trigger the health checks and provide corresponding metrics state, using the Prometheus output format.
   *
   * Metrics must have been registered to be reported here!
   *
   * @returns Metrics states expressed in the prom textual format
   */
  public metrics(): Promise<string> {
    this.healthService.check();
    return this.promClientService.metrics();
  }
}
