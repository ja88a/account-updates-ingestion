import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MS_CONFIG } from '../common/config';
import { ApiTags } from '@nestjs/swagger/dist/decorators';

/**
 * Entry-point for Prometheus to extract the app server specific metrics
 * for monitoring the health and performances using custom indicators.
 */
@ApiTags('Metrics')
@Controller({
  version: MS_CONFIG.VERSION_PUBLIC,
  path: 'metrics',
})
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  /**
   * Retrieve the statuses of all registered services' health metrics
   * @returns Actual metrics states, expressed in the prometheus textual format
   */
  @Get()
  public metrics(): Promise<string> {
    return this.metricsService.metrics();
  }
}
