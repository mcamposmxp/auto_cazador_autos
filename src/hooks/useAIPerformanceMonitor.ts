import { useState, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface AIMetrics {
  requestCount: number;
  successRate: number;
  avgResponseTime: number;
  errorTypes: Record<string, number>;
  cacheHitRate: number;
  lastUpdated: Date;
}

interface AIRequest {
  id: string;
  type: 'tiempo-venta' | 'recomendaciones';
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  cached: boolean;
}

class AIPerformanceMonitor {
  private metrics: AIMetrics = {
    requestCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    errorTypes: {},
    cacheHitRate: 0,
    lastUpdated: new Date()
  };

  private requests: AIRequest[] = [];
  private maxRequests = 100; // Mantener últimas 100 requests

  recordRequest(type: 'tiempo-venta' | 'recomendaciones', cached: boolean = false): string {
    const id = `${type}_${Date.now()}_${Math.random()}`;
    const request: AIRequest = {
      id,
      type,
      startTime: Date.now(),
      success: false,
      cached
    };

    this.requests.push(request);
    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }

    return id;
  }

  recordSuccess(id: string, responseData?: any): void {
    const request = this.requests.find(r => r.id === id);
    if (request) {
      request.endTime = Date.now();
      request.success = true;
      this.updateMetrics();
      
      logger.debug('AI Request Success:', {
        id,
        type: request.type,
        duration: request.endTime - request.startTime,
        cached: request.cached
      });
    }
  }

  recordError(id: string, error: string): void {
    const request = this.requests.find(r => r.id === id);
    if (request) {
      request.endTime = Date.now();
      request.success = false;
      request.error = error;
      this.updateMetrics();
      
      logger.error('AI Request Error:', {
        id,
        type: request.type,
        error,
        duration: request.endTime! - request.startTime
      });
    }
  }

  private updateMetrics(): void {
    const completedRequests = this.requests.filter(r => r.endTime);
    const successfulRequests = completedRequests.filter(r => r.success);
    const cachedRequests = completedRequests.filter(r => r.cached);

    this.metrics.requestCount = completedRequests.length;
    this.metrics.successRate = completedRequests.length > 0 
      ? (successfulRequests.length / completedRequests.length) * 100 
      : 100;

    this.metrics.avgResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => sum + (req.endTime! - req.startTime), 0) / completedRequests.length
      : 0;

    this.metrics.cacheHitRate = completedRequests.length > 0
      ? (cachedRequests.length / completedRequests.length) * 100
      : 0;

    // Contar tipos de errores
    this.metrics.errorTypes = {};
    completedRequests
      .filter(r => !r.success && r.error)
      .forEach(r => {
        const errorType = this.categorizeError(r.error!);
        this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
      });

    this.metrics.lastUpdated = new Date();
  }

  private categorizeError(error: string): string {
    if (error.includes('rate limit') || error.includes('429')) return 'Rate Limit';
    if (error.includes('timeout') || error.includes('ETIMEDOUT')) return 'Timeout';
    if (error.includes('network') || error.includes('fetch')) return 'Network';
    if (error.includes('parse') || error.includes('JSON')) return 'Parse Error';
    if (error.includes('credits') || error.includes('insufficient')) return 'Credits';
    return 'Other';
  }

  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  getHealthScore(): number {
    const weights = {
      successRate: 0.4,
      responseTime: 0.3,
      cacheHit: 0.2,
      requestVolume: 0.1
    };

    const successScore = this.metrics.successRate;
    const responseScore = Math.max(0, 100 - (this.metrics.avgResponseTime / 100)); // Penalizar respuestas > 10s
    const cacheScore = this.metrics.cacheHitRate;
    const volumeScore = Math.min(100, (this.metrics.requestCount / 50) * 100); // Score basado en uso

    return (
      successScore * weights.successRate +
      responseScore * weights.responseTime +
      cacheScore * weights.cacheHit +
      volumeScore * weights.requestVolume
    );
  }

  getRecentErrors(limit: number = 5): AIRequest[] {
    return this.requests
      .filter(r => !r.success && r.error)
      .slice(-limit)
      .reverse();
  }

  clearHistory(): void {
    this.requests = [];
    this.updateMetrics();
  }
}

// Singleton instance
const aiMonitor = new AIPerformanceMonitor();

export const useAIPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<AIMetrics>(aiMonitor.getMetrics());
  const intervalRef = useRef<NodeJS.Timeout>();

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setMetrics(aiMonitor.getMetrics());
    }, 5000); // Actualizar cada 5 segundos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const recordRequest = useCallback((type: 'tiempo-venta' | 'recomendaciones', cached: boolean = false) => {
    return aiMonitor.recordRequest(type, cached);
  }, []);

  const recordSuccess = useCallback((id: string, responseData?: any) => {
    aiMonitor.recordSuccess(id, responseData);
    setMetrics(aiMonitor.getMetrics());
  }, []);

  const recordError = useCallback((id: string, error: string) => {
    aiMonitor.recordError(id, error);
    setMetrics(aiMonitor.getMetrics());
  }, []);

  const getHealthScore = useCallback(() => {
    return aiMonitor.getHealthScore();
  }, []);

  const getRecentErrors = useCallback((limit?: number) => {
    return aiMonitor.getRecentErrors(limit);
  }, []);

  const clearHistory = useCallback(() => {
    aiMonitor.clearHistory();
    setMetrics(aiMonitor.getMetrics());
  }, []);

  return {
    metrics,
    startMonitoring,
    recordRequest,
    recordSuccess,
    recordError,
    getHealthScore,
    getRecentErrors,
    clearHistory
  };
};

export default useAIPerformanceMonitor;