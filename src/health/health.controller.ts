import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheckResult, HealthCheck } from '@nestjs/terminus';
import { MS_CONFIG } from '../common/config';

@Controller({
  version: MS_CONFIG.VERSION_PUBLIC,
  path: 'health',
})
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @HealthCheck()
  public async check(): Promise<HealthCheckResult | undefined> {
    const healthCheckResult: HealthCheckResult | undefined =
      await this.healthService.check();
    for (const key in healthCheckResult?.info) {
      if (healthCheckResult?.info[key].status === 'down') {
        throw new ServiceUnavailableException(healthCheckResult);
      }
    }
    return healthCheckResult;
  }
}
