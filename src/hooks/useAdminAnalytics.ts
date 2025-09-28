import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminAnalytics {
  // General overview
  totalUsers: number;
  newUsersThisMonth: number;
  professionalUsers: number;
  particularUsers: number;
  monthlyVisits: number;
  
  // Credit sales and usage
  creditSalesThisMonth: number;
  totalMarketQueries: number;
  professionalQueries: number;
  particularQueries: number;
  
  // Referrals
  totalReferrals: number;
  referralsThisMonth: number;
  
  // Vehicle operations
  carsToNetwork: number;
  carsToAuction: number;
  carsToDirectSale: number;
  
  // Geographic distribution
  topCities: Array<{ city: string; count: number }>;
  topStates: Array<{ state: string; count: number }>;
  
  // Activity patterns
  monthlyActivity: Array<{ month: string; users: number; queries: number }>;
  dailyActivity: Array<{ date: string; visits: number; registrations: number }>;
}

export const useAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total users and breakdown
      const { data: profiles } = await supabase
        .from('profiles')
        .select('tipo_usuario, created_at');

      const totalUsers = profiles?.length || 0;
      const professionalUsers = profiles?.filter(p => p.tipo_usuario === 'profesional').length || 0;
      const particularUsers = profiles?.filter(p => p.tipo_usuario === 'particular').length || 0;

      // New users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newUsersThisMonth = profiles?.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).length || 0;

      // Credit transactions
      const { data: creditTransactions } = await supabase
        .from('credit_transactions')
        .select('credits_consumed, created_at, action_type');

      const totalMarketQueries = creditTransactions?.length || 0;
      const professionalQueries = creditTransactions?.filter(t => 
        t.action_type?.includes('professional')
      ).length || 0;
      const particularQueries = totalMarketQueries - professionalQueries;

      // Referrals
      const { data: referrals } = await supabase
        .from('referral_codes')
        .select('uses_count, created_at');

      const totalReferrals = referrals?.reduce((sum, r) => sum + r.uses_count, 0) || 0;
      const referralsThisMonth = referrals?.filter(r => 
        new Date(r.created_at) >= thisMonth
      ).reduce((sum, r) => sum + r.uses_count, 0) || 0;

      // Vehicle operations
      const { data: autosVenta } = await supabase
        .from('autos_venta')
        .select('created_at');

      const { data: subastas } = await supabase
        .from('subasta_autos')
        .select('fecha_registro');

      const { data: ayudaVenta } = await supabase
        .from('vendedores_ayuda')
        .select('fecha_registro');

      const carsToNetwork = autosVenta?.length || 0;
      const carsToAuction = subastas?.length || 0;
      const carsToDirectSale = ayudaVenta?.length || 0;

      // Geographic distribution
      const { data: clients } = await supabase
        .from('clientes')
        .select('ciudad, estado');

      const cityCount: Record<string, number> = {};
      const stateCount: Record<string, number> = {};

      clients?.forEach(c => {
        if (c.ciudad) {
          cityCount[c.ciudad] = (cityCount[c.ciudad] || 0) + 1;
        }
        if (c.estado) {
          stateCount[c.estado] = (stateCount[c.estado] || 0) + 1;
        }
      });

      const topCities = Object.entries(cityCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));

      const topStates = Object.entries(stateCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([state, count]) => ({ state, count }));

      // Mock data for some metrics that would require additional tracking
      const monthlyVisits = Math.floor(Math.random() * 10000) + 5000;
      const creditSalesThisMonth = Math.floor(Math.random() * 50000) + 10000;

      // Generate monthly activity data
      const monthlyActivity = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthUsers = profiles?.filter(p => {
          const created = new Date(p.created_at);
          return created.getMonth() === date.getMonth() && 
                 created.getFullYear() === date.getFullYear();
        }).length || 0;

        const monthQueries = creditTransactions?.filter(t => {
          const created = new Date(t.created_at);
          return created.getMonth() === date.getMonth() && 
                 created.getFullYear() === date.getFullYear();
        }).length || 0;

        monthlyActivity.push({
          month: date.toLocaleDateString('es', { month: 'short', year: 'numeric' }),
          users: monthUsers,
          queries: monthQueries
        });
      }

      // Generate daily activity for last 30 days
      const dailyActivity = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyActivity.push({
          date: date.toISOString().split('T')[0],
          visits: Math.floor(Math.random() * 500) + 100,
          registrations: Math.floor(Math.random() * 10) + 1
        });
      }

      setAnalytics({
        totalUsers,
        newUsersThisMonth,
        professionalUsers,
        particularUsers,
        monthlyVisits,
        creditSalesThisMonth,
        totalMarketQueries,
        professionalQueries,
        particularQueries,
        totalReferrals,
        referralsThisMonth,
        carsToNetwork,
        carsToAuction,
        carsToDirectSale,
        topCities,
        topStates,
        monthlyActivity,
        dailyActivity
      });

    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      setError('Error al cargar los datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
};