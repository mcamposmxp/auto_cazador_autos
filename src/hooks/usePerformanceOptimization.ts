import { useCallback, useMemo, useRef } from 'react';

// Hook para memoizar cálculos costosos
export const useExpensiveCalculation = <T>(
  calculation: () => T,
  dependencies: any[]
): T => {
  return useMemo(calculation, dependencies);
};

// Hook para throttle de funciones
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
};

// Hook para prevenir re-renders innecesarios
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
};

// Hook para memoizar props de componentes pesados
export const useMemoizedProps = <T extends Record<string, any>>(
  props: T
): T => {
  return useMemo(() => props, Object.values(props));
};