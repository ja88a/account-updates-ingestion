import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MS_CONFIG } from '../common/config';

@Controller({
  version: MS_CONFIG.VERSION_PUBLIC,
  path: 'metrics',
})
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  public metrics(): Promise<string> {
    return this.metricsService.metrics();
  }
}
