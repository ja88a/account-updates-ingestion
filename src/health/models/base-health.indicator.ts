import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import {
  PrometheusHistogram,
  PrometheusService,
} from '../../prometheus/prometheus.service';
import { Gauge } from 'prom-client';
import Logger from '../../common/logger';

// Design Pattern: Template Method

const TAG = 'HealthCheck';

/**
 * Abstract base implementation of the Health Indicator
 */
export abstract class BaseHealthIndicator extends HealthIndicator {
  public abstract name: string;
  public callMetrics: any;

  protected abstract help: string;
  protected abstract readonly promClientService: PrometheusService | undefined;
  protected readonly labelNames = ['status'];
  protected readonly buckets = [1];
  protected stateIsConnected = false;

  private metricsRegistered = false;
  private gaugesRegistered = false;
  private gauge: Gauge<string> | undefined;

  /** Logger */
  private readonly logger = Logger.child({
    label: this.constructor.name,
  });

  protected registerMetrics(): void {
    if (this.promClientService) {
      this.logger.info(
        'Register metrics histogram for: ' + this.name,
        TAG,
        true,
      );
      this.metricsRegistered = true;
      const histogram: PrometheusHistogram =
        this.promClientService.registerMetrics(
          this.name,
          this.help,
          this.labelNames,
          this.buckets,
        );
      this.callMetrics = histogram.startTimer();
    }
  }

  protected registerGauges(): void {
    if (this.promClientService) {
      this.logger.info('Register metrics gauge for: ' + this.name, TAG, true);
      this.gaugesRegistered = true;
      this.gauge = this.promClientService.registerGauge(this.name, this.help);
    }
  }

  protected isDefined(value: string | undefined): boolean {
    return !!value;
  }

  public updatePrometheusData(isConnected: boolean): void {
    if (this.stateIsConnected !== isConnected) {
      if (isConnected) {
        this.logger.info(this.name + ' is available', TAG, true);
      }

      this.stateIsConnected = isConnected;

      if (this.metricsRegistered) {
        this.callMetrics({ status: this.stateIsConnected ? 1 : 0 });
      }

      if (this.gaugesRegistered) {
        this.gauge?.set(this.stateIsConnected ? 1 : 0);
      }
    }
  }

  public abstract isHealthy(): Promise<HealthIndicatorResult>;

  public reportUnhealthy(): HealthIndicatorResult {
    this.updatePrometheusData(false);
    return this.getStatus(this.name, false);
  }

  public customMetricsRegistered(): boolean {
    return this.metricsRegistered;
  }

  public customGaugesRegistered(): boolean {
    return this.gaugesRegistered;
  }
}
