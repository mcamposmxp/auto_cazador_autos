import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseAsyncOperationReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T | void>;
  loading: boolean;
  error: Error | null;
  data: T | null;
}

export function useAsyncOperation<T = any>(
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { toast } = useToast();

  const execute = useCallback(async (operation: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation();
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options.successMessage) {
        toast({
          title: "Éxito",
          description: options.successMessage,
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      toast({
        title: "Error",
        description: options.errorMessage || error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  return { execute, loading, error, data };
}