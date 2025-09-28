import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useToast } from "@/hooks/use-toast";

interface Profesional {
  id: string;
  user_id: string;
  negocio_nombre: string;
  razon_social: string;
  rfc: string;
  tipo_negocio: "agencia_nuevos" | "seminuevos" | "comerciante";
  activo: boolean;
  pausado: boolean;
  telefono?: string;
  correo?: string;
  created_at: string;
  direccion_calle?: string;
  direccion_numero?: string;
  direccion_estado?: string;
  direccion_ciudad?: string;
  direccion_cp?: string;
  representante_legal?: string;
  contacto_principal?: string;
  notas?: string;
}

interface UseProfesionalesReturn {
  profesionales: Profesional[];
  profesionalActual: Profesional | null;
  loading: boolean;
  error: Error | null;
  crearProfesional: (datos: Omit<Partial<Profesional>, 'id' | 'user_id' | 'created_at'> & Pick<Profesional, 'negocio_nombre' | 'razon_social' | 'rfc' | 'tipo_negocio'>) => Promise<Profesional | null>;
  actualizarProfesional: (id: string, datos: Partial<Profesional>) => Promise<any>;
  recargar: () => Promise<any>;
}

export function useProfesionales(): UseProfesionalesReturn {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalActual, setProfesionalActual] = useState<Profesional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthSession();
  const { toast } = useToast();

  const cargarProfesionales = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profesionales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProfesionales(data || []);
      
      // Set current professional if user is one
      const profesionalDelUsuario = data?.find(p => p.user_id === user.id);
      setProfesionalActual(profesionalDelUsuario || null);
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: "Error",
        description: "Error al cargar profesionales",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const crearProfesional = useCallback(async (datos: Omit<Partial<Profesional>, 'id' | 'user_id' | 'created_at'> & Pick<Profesional, 'negocio_nombre' | 'razon_social' | 'rfc' | 'tipo_negocio'>) => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profesionales')
        .insert({
          ...datos,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfesionales(prev => [data, ...prev]);
      setProfesionalActual(data);
      
      toast({
        title: "Éxito",
        description: "Profesional creado correctamente"
      });
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: "Error",
        description: "Error al crear profesional",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const actualizarProfesional = useCallback(async (id: string, datos: Partial<Profesional>) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profesionales')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfesionales(prev =>
        prev.map(p => p.id === id ? { ...p, ...data } : p)
      );
      
      if (profesionalActual?.id === id) {
        setProfesionalActual(prev => prev ? { ...prev, ...data } : null);
      }
      
      toast({
        title: "Éxito",
        description: "Profesional actualizado correctamente"
      });
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: "Error",
        description: "Error al actualizar profesional",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [profesionalActual, toast]);

  useEffect(() => {
    cargarProfesionales();
  }, [cargarProfesionales]);

  return {
    profesionales,
    profesionalActual,
    loading,
    error,
    crearProfesional,
    actualizarProfesional,
    recargar: cargarProfesionales
  };
}