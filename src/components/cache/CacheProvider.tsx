import React, { createContext, useContext, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const cache = useRef<Map<string, CacheEntry<any>>>(new Map());
  const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      cache.current.delete(key);
      return null;
    }

    return entry.data as T;
  }, []);

  const set = useCallback(<T,>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };

    cache.current.set(key, entry);

    // Clean up expired entries periodically
    if (cache.current.size > 100) {
      const now = Date.now();
      for (const [cacheKey, cacheEntry] of cache.current.entries()) {
        if (now > cacheEntry.expiry) {
          cache.current.delete(cacheKey);
        }
      }
    }
  }, [DEFAULT_TTL]);

  const remove = useCallback((key: string) => {
    cache.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      cache.current.delete(key);
      return false;
    }
    
    return true;
  }, []);

  const contextValue: CacheContextType = {
    get,
    set,
    remove,
    clear,
    has
  };

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}

// Hook for caching API requests
export function useCachedApi<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl?: number
) {
  const cache = useCache();
  
  const getCachedData = useCallback(async (): Promise<T> => {
    // Try to get from cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache the data
    const data = await fetcher();
    cache.set(key, data, ttl);
    return data;
  }, [key, fetcher, ttl, cache]);

  const invalidate = useCallback(() => {
    cache.remove(key);
  }, [key, cache]);

  const refresh = useCallback(async (): Promise<T> => {
    cache.remove(key);
    return getCachedData();
  }, [key, cache, getCachedData]);

  return {
    getCachedData,
    invalidate,
    refresh,
    isCached: cache.has(key)
  };
}