import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDebugMode = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDebugMode();
  }, []);

  const loadDebugMode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('debug_mode')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading debug mode:', error);
        setLoading(false);
        return;
      }

      setDebugMode(profile?.debug_mode || false);
    } catch (error) {
      console.error('Error loading debug mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDebugMode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newValue = !debugMode;
      const { error } = await supabase
        .from('profiles')
        .update({ debug_mode: newValue })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el modo debug",
          variant: "destructive"
        });
        return;
      }

      setDebugMode(newValue);
      toast({
        title: "Actualizado",
        description: `Modo debug ${newValue ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      console.error('Error toggling debug mode:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el modo debug",
        variant: "destructive"
      });
    }
  };

  return {
    debugMode,
    loading,
    toggleDebugMode
  };
};