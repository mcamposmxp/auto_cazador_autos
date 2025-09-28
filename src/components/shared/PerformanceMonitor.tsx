import { useEffect } from 'react';
import { logger } from '@/utils/logger';

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  componentName, 
  children 
}) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Solo logear renders que toman más de 100ms
            logger.warn(`Slow render detected in ${componentName}:`, {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
      
      return () => observer.disconnect();
    }
  }, [componentName]);

  return <>{children}</>;
};