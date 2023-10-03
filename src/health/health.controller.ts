import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheckResult, HealthCheck } from '@nestjs/terminus';
import { MS_CONFIG } from '../common/config';
import { ApiTags } from '@nestjs/swagger/dist/decorators';

/**
 * Terminus-based checking of the general server app health statuses
 */
@ApiTags('Node Health')
@Controller({
  version: MS_CONFIG.VERSION_PUBLIC,
  path: 'health',
})
export class HealthController {
  constructor(private healthService: HealthService) {}

  /**
   * Retrieve the results of an health check performed on actual Node integrations,
   * based on the Terminus abilities to report on actual module integrations: http, DB, etc
   *
   * @returns The nodejs/nestjs health check results, in a JSON format
   */
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
