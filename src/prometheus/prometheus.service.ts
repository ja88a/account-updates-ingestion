import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram, Gauge } from 'prom-client';

export type PrometheusHistogram = Histogram<string>;

interface IMapHistogram {
  [key: string]: Histogram<string>;
}

interface IMapGauge {
  [key: string]: Gauge<string>;
}

/**
 * Adaptor to provide Prometheus compliant metrics.
 *
 * It consists in a registry of metrics.
 *
 * Supported types are: Histogram & Gauge
 */
@Injectable()
export class PrometheusService {
  private readonly serviceTitle = 'AccountUpdateIngestionServer';
  private readonly servicePrefix = 'IngestorMetrics_';
  private registeredMetrics: IMapHistogram = {};
  private registeredGauges: IMapGauge = {};
  private readonly registry: Registry;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({
      app: this.serviceTitle,
    });
    collectDefaultMetrics({
      register: this.registry,
      prefix: this.servicePrefix,
    });
  }

  /**
   * Retrieve the actual list of metrics that are registered
   * @returns the list of registered metrics
   */
  public metrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * New metrics registration, of type Histogram
   * @param name Metrics name
   * @param help Info about the metrics
   * @param labelNames Labels associated to the metrics
   * @param buckets List of buckets for the metrics
   * @returns the [newly] registered histogram metrics
   */
  public registerMetricsHistogram(
    name: string,
    help: string,
    labelNames: string[],
    buckets: number[],
  ): Histogram<string> {
    if (this.registeredMetrics[name] === undefined) {
      const histogram = new Histogram({ name, help, labelNames, buckets });
      this.registry.registerMetric(histogram);
      this.registeredMetrics[name] = histogram;
    }
    return this.registeredMetrics[name];
  }

  /**
   * New metrics registration, of type Gauge
   * @param name Metrics name
   * @param help Info about the metrics
   * @returns the [newly] registered Gauge metrics
   */
  public registerMetricsGauge(name: string, help: string): Gauge<string> {
    if (this.registeredGauges[name] === undefined) {
      const gauge = (this.registeredGauges[name] = new Gauge({
        name: this.servicePrefix + name,
        help,
      }));
      this.registry.registerMetric(gauge);
      this.registeredGauges[name] = gauge;
    }
    return this.registeredGauges[name];
  }

  /**
   * Remove a metrics from the registry, based on its name
   * @param name Target name of the metrics to remove
   * @returns nothing
   */
  public removeSingleMetric(name: string): void {
    return this.registry.removeSingleMetric(name);
  }

  /**
   * Flush out all registered metrics
   * @returns nothing
   */
  public clearMetrics(): void {
    this.registry.resetMetrics();
    return this.registry.clear();
  }
}
