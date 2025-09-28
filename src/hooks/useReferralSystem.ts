import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';

interface ReferralData {
  code: string;
  totalReferrals: number;
  monthlyReferrals: number;
  creditsEarned: number;
  pendingReferrals: number;
  maxMonthlyReferrals: number;
}

export const useReferralSystem = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthSession();
  const { toast } = useToast();

  const fetchReferralData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get or create referral code
      const { data: codeData, error: codeError } = await supabase.functions.invoke('generate-referral-code');
      
      if (codeError) {
        throw codeError;
      }

      // Get user credits info
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('credits_earned_referrals, referrals_count_this_month')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
      }

      // Get referral statistics
      const { data: referralsData, error: referralsError } = await supabase
        .from('user_referrals')
        .select('status')
        .eq('referrer_id', user.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      }

      const totalReferrals = referralsData?.length || 0;
      const pendingReferrals = referralsData?.filter(r => r.status === 'pending').length || 0;

      setReferralData({
        code: codeData.code,
        totalReferrals,
        monthlyReferrals: creditsData?.referrals_count_this_month || 0,
        creditsEarned: creditsData?.credits_earned_referrals || 0,
        pendingReferrals,
        maxMonthlyReferrals: 5
      });

    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de referidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const validateReferral = useCallback(async (referralCode: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('validate-referral', {
        body: { referral_code: referralCode }
      });

      if (error) {
        throw error;
      }

      return data.success;
    } catch (error) {
      console.error('Error validating referral:', error);
      return false;
    }
  }, [user]);

  const awardReferralCredits = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('award-referral-credits');

      if (error) {
        throw error;
      }

      if (data.success) {
        // Refresh referral data
        await fetchReferralData();
        
        if (data.credits_awarded > 0) {
          toast({
            title: "¡Felicitaciones!",
            description: `Has ganado ${data.credits_awarded} créditos por referir a un nuevo usuario.`,
          });
        }
      }

      return data.success;
    } catch (error) {
      console.error('Error awarding referral credits:', error);
      return false;
    }
  }, [user, fetchReferralData, toast]);

  const shareReferralLink = useCallback(() => {
    if (!referralData) return;

    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}/?ref=${referralData.code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Únete a nuestra plataforma',
        text: 'Te invito a unirte a esta plataforma de análisis de precios de autos',
        url: referralUrl
      });
    } else {
      navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Link copiado",
        description: "El link de referido se ha copiado al portapapeles",
      });
    }
  }, [referralData, toast]);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user, fetchReferralData]);

  return {
    referralData,
    loading,
    validateReferral,
    awardReferralCredits,
    shareReferralLink,
    refreshData: fetchReferralData
  };
};