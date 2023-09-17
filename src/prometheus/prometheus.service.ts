import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram, Gauge } from 'prom-client';

export type PrometheusHistogram = Histogram<string>;

interface IMapHistogram {
  [key: string]: Histogram<string>;
}

interface IMapGauge {
  [key: string]: Gauge<string>;
}

@Injectable()
export class PrometheusService {
  private readonly serviceTitle = 'Backend-For-Frontend';
  private readonly servicePrefix = 'FrontendMetrics_';
  private registeredMetrics: IMapHistogram = {};
  private registeredGauges: IMapGauge = {};
  private readonly registry: Registry;

  public metrics(): Promise<string> {
    return this.registry.metrics();
  }

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

  public registerMetrics(
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

  public registerGauge(name: string, help: string): Gauge<string> {
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

  public removeSingleMetric(name: string): void {
    return this.registry.removeSingleMetric(name);
  }

  public clearMetrics(): void {
    this.registry.resetMetrics();
    return this.registry.clear();
  }
}
