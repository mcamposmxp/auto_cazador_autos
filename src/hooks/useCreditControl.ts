import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UseCreditControlResult {
  checkCredits: () => Promise<boolean>;
  consumeCredits: (amount: number, actionType: string, creditType?: 'search' | 'ad', resourceInfo?: any) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  showUpgradeDialog: boolean;
  setShowUpgradeDialog: (show: boolean) => void;
}

export const useCreditControl = (): UseCreditControlResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkCredits = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Registro requerido",
          description: "Debes registrarte o iniciar sesión para acceder a las consultas de precios.",
          variant: "destructive"
        });
        return false;
      }

      // Authenticated user - check database credits
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_available')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const creditsAvailable = data?.credits_available || 0;
      
      if (creditsAvailable <= 0) {
        setShowUpgradeDialog(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error checking credits:', err);
      setError(err instanceof Error ? err.message : 'Error checking credits');
      toast({
        title: "Error",
        description: "Error al verificar créditos",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const consumeCredits = useCallback(async (
    amount: number, 
    actionType: string, 
    creditType: 'search' | 'ad' = 'search',
    resourceInfo?: any
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Registro requerido",
          description: "Debes registrarte o iniciar sesión para acceder a esta función.",
          variant: "destructive"
        });
        return false;
      }

      // Authenticated user - consume from database with credit type
      const { data, error } = await supabase.functions.invoke('consume-credits-typed', {
        body: {
          credits: amount,
          action_type: actionType,
          credit_type: creditType,
          resource_info: resourceInfo || {}
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        setShowUpgradeDialog(true);
        return false;
      }

      // Award referral credits if this is the user's first action
      if (actionType.includes('first_') || actionType === 'precio_consulta') {
        try {
          await supabase.functions.invoke('award-referral-credits');
        } catch (referralError) {
          console.log('No pending referral or error awarding referral credits:', referralError);
        }
      }

      return true;
    } catch (err) {
      console.error('Error consuming credits:', err);
      setError(err instanceof Error ? err.message : 'Error consuming credits');
      toast({
        title: "Error",
        description: "Error al consumir créditos",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    checkCredits,
    consumeCredits,
    isLoading,
    error,
    showUpgradeDialog,
    setShowUpgradeDialog
  };
};