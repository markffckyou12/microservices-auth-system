import React, { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDetails?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetricsUpdate,
  showDetails = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const startTime = useRef<number>(performance.now());
  const renderStartTime = useRef<number>(0);

  // Performance monitoring functions
  const measureLoadTime = () => {
    const loadTime = performance.now() - startTime.current;
    return Math.round(loadTime);
  };

  const measureRenderTime = () => {
    const renderTime = performance.now() - renderStartTime.current;
    return Math.round(renderTime);
  };

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  };

  const simulateApiResponseTime = (): number => {
    // Simulate API response time based on network conditions
    const baseTime = 50; // Base response time in ms
    const jitter = Math.random() * 100; // Random jitter
    return Math.round(baseTime + jitter);
  };

  const simulateCacheHitRate = (): number => {
    // Simulate cache hit rate (0-100%)
    return Math.round(Math.random() * 100);
  };

  const simulateErrorRate = (): number => {
    // Simulate error rate (0-5%)
    return Math.round(Math.random() * 5);
  };

  const updateMetrics = () => {
    const newMetrics: PerformanceMetrics = {
      loadTime: measureLoadTime(),
      renderTime: measureRenderTime(),
      memoryUsage: getMemoryUsage(),
      apiResponseTime: simulateApiResponseTime(),
      cacheHitRate: simulateCacheHitRate(),
      errorRate: simulateErrorRate()
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);
  };

  // Performance monitoring setup
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    
    // Initial metrics update
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  // Performance observer for real-time monitoring
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              loadTime: Math.round(navEntry.loadEventEnd - navEntry.loadEventStart)
            }));
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  const getPerformanceStatus = () => {
    if (metrics.loadTime < 1000 && metrics.apiResponseTime < 200 && metrics.errorRate < 1) {
      return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (metrics.loadTime < 2000 && metrics.apiResponseTime < 500 && metrics.errorRate < 3) {
      return { status: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const performanceStatus = getPerformanceStatus();

  if (!isVisible && !showDetails) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 z-50"
        title="Show Performance Monitor"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900">Performance Monitor</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${performanceStatus.color} ${performanceStatus.bg}`}>
            {performanceStatus.status}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Load Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.loadTime}ms
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">API Response</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.apiResponseTime}ms
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Memory</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.memoryUsage}MB
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Cache Hit</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.cacheHitRate}%
            </div>
          </div>
        </div>

        {/* Error Rate */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Error Rate</div>
            <div className="text-sm font-medium text-gray-900">{metrics.errorRate}%</div>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                metrics.errorRate < 1 ? 'bg-green-500' : 
                metrics.errorRate < 3 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(metrics.errorRate * 20, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Metrics</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Render Time</span>
                <span className="font-medium">{metrics.renderTime}ms</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    metrics.renderTime < 50 ? 'bg-green-500' : 
                    metrics.renderTime < 100 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metrics.renderTime / 2, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Memory Usage</span>
                <span className="font-medium">{metrics.memoryUsage}MB</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    metrics.memoryUsage < 50 ? 'bg-green-500' : 
                    metrics.memoryUsage < 100 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metrics.memoryUsage / 2, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Cache Hit Rate</span>
                <span className="font-medium">{metrics.cacheHitRate}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    metrics.cacheHitRate > 80 ? 'bg-green-500' : 
                    metrics.cacheHitRate > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.cacheHitRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Performance Recommendations */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-xs font-medium text-gray-900 mb-2">Recommendations</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              {metrics.loadTime > 2000 && (
                <li>• Consider code splitting to reduce initial bundle size</li>
              )}
              {metrics.apiResponseTime > 500 && (
                <li>• Optimize API endpoints or implement caching</li>
              )}
              {metrics.memoryUsage > 100 && (
                <li>• Check for memory leaks in components</li>
              )}
              {metrics.cacheHitRate < 60 && (
                <li>• Implement more aggressive caching strategies</li>
              )}
              {metrics.errorRate > 3 && (
                <li>• Review error handling and API stability</li>
              )}
              {metrics.loadTime <= 1000 && metrics.apiResponseTime <= 200 && metrics.errorRate <= 1 && (
                <li>• Performance is excellent! Keep up the good work</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button
            onClick={updateMetrics}
            className="text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 