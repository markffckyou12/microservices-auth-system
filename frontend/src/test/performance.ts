import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private renderStartTime: number = 0;
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  };

  startLoad() {
    this.startTime = performance.now();
  }

  endLoad() {
    this.metrics.loadTime = performance.now() - this.startTime;
  }

  startRender() {
    this.renderStartTime = performance.now();
  }

  endRender() {
    this.metrics.renderTime = performance.now() - this.renderStartTime;
  }

  measureMemoryUsage() {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  measureApiResponseTime(responseTime: number) {
    this.metrics.apiResponseTime = responseTime;
  }

  setCacheHitRate(hitRate: number) {
    this.metrics.cacheHitRate = hitRate;
  }

  setErrorRate(errorRate: number) {
    this.metrics.errorRate = errorRate;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      apiResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance testing utilities
export const measureComponentPerformance = async (
  componentName: string,
  testFunction: () => Promise<void>
) => {
  const monitor = new PerformanceMonitor();
  
  monitor.startLoad();
  monitor.startRender();
  
  try {
    await testFunction();
  } finally {
    monitor.endRender();
    monitor.endLoad();
    monitor.measureMemoryUsage();
  }
  
  const metrics = monitor.getMetrics();
  
  console.log(`Performance metrics for ${componentName}:`, {
    loadTime: `${metrics.loadTime.toFixed(2)}ms`,
    renderTime: `${metrics.renderTime.toFixed(2)}ms`,
    memoryUsage: `${metrics.memoryUsage.toFixed(2)}MB`
  });
  
  return metrics;
};

// Performance assertions
export const assertPerformanceThresholds = (
  metrics: PerformanceMetrics,
  thresholds: Partial<PerformanceMetrics>
) => {
  const assertions: string[] = [];
  
  if (thresholds.loadTime && metrics.loadTime > thresholds.loadTime) {
    assertions.push(`Load time ${metrics.loadTime}ms exceeds threshold ${thresholds.loadTime}ms`);
  }
  
  if (thresholds.renderTime && metrics.renderTime > thresholds.renderTime) {
    assertions.push(`Render time ${metrics.renderTime}ms exceeds threshold ${thresholds.renderTime}ms`);
  }
  
  if (thresholds.memoryUsage && metrics.memoryUsage > thresholds.memoryUsage) {
    assertions.push(`Memory usage ${metrics.memoryUsage}MB exceeds threshold ${thresholds.memoryUsage}MB`);
  }
  
  if (thresholds.apiResponseTime && metrics.apiResponseTime > thresholds.apiResponseTime) {
    assertions.push(`API response time ${metrics.apiResponseTime}ms exceeds threshold ${thresholds.apiResponseTime}ms`);
  }
  
  if (assertions.length > 0) {
    throw new Error(`Performance thresholds exceeded:\n${assertions.join('\n')}`);
  }
}; 