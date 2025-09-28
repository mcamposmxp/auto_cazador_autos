import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FiltrosOfertasData {
  id?: string;
  profesional_id: string;
  activo: boolean;
  tipo_filtro: 'todos' | 'personalizado';
  filtros_vehiculo: {
    marcas_modelos: Array<{
      marca: string;
      modelos: string[];
      versiones: string[];
      años?: {
        min: number;
        max: number;
      };
    }>;
    rango_precio: {
      activo: boolean;
      min: number;
      max: number;
    };
    rango_kilometraje: {
      activo: boolean;
      min: number;
      max: number;
    };
  };
}

export function useFiltrosOfertas(profesionalId: string) {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState<FiltrosOfertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profesionalId) {
      cargarFiltros();
    }
  }, [profesionalId]);

  const cargarFiltros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profesional_filtros_ofertas')
        .select('*')
        .eq('profesional_id', profesionalId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando filtros:', error);
        throw error;
      }

      if (data) {
        setFiltros({
          ...data,
          tipo_filtro: data.tipo_filtro as 'todos' | 'personalizado',
          filtros_vehiculo: data.filtros_vehiculo as any
        });
      } else {
        // Crear filtros por defecto
        setFiltros({
          profesional_id: profesionalId,
          activo: false,
          tipo_filtro: 'todos',
          filtros_vehiculo: {
            marcas_modelos: [],
            rango_precio: { activo: false, min: 50000, max: 500000 },
            rango_kilometraje: { activo: false, min: 0, max: 150000 }
          }
        });
      }
    } catch (error) {
      console.error('Error cargando filtros:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los filtros de ofertas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarFiltros = async (nuevosFiltros: Partial<FiltrosOfertasData>) => {
    try {
      setSaving(true);
      
      const filtrosActualizados = {
        ...filtros,
        ...nuevosFiltros,
        profesional_id: profesionalId,
        filtros_vehiculo: nuevosFiltros.filtros_vehiculo || filtros?.filtros_vehiculo
      };

      const { data, error } = await supabase
        .from('profesional_filtros_ofertas')
        .upsert({
          profesional_id: filtrosActualizados.profesional_id,
          activo: filtrosActualizados.activo,
          tipo_filtro: filtrosActualizados.tipo_filtro,
          filtros_vehiculo: filtrosActualizados.filtros_vehiculo as any
        })
        .select()
        .single();

      if (error) throw error;

      setFiltros({
        ...data,
        tipo_filtro: data.tipo_filtro as 'todos' | 'personalizado',
        filtros_vehiculo: data.filtros_vehiculo as any
      });
      
      toast({
        title: "Filtros guardados",
        description: "Tus preferencias de ofertas han sido actualizadas correctamente.",
      });

      return true;
    } catch (error) {
      console.error('Error guardando filtros:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los filtros. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const evaluarVehiculo = async (vehiculoData: {
    marca: string;
    modelo: string;
    ano: number;
    kilometraje: number;
  }) => {
    try {
      // Primero calcular precio estimado
      const { data: precioData, error: precioError } = await supabase.functions.invoke(
        'calcular-precio-estimado-vehiculo',
        {
          body: {
            marca: vehiculoData.marca,
            modelo: vehiculoData.modelo,
            ano: vehiculoData.ano,
            kilometraje: vehiculoData.kilometraje
          }
        }
      );

      if (precioError) throw precioError;

      // Luego evaluar filtros
      const { data: resultado, error } = await supabase.rpc('evaluar_filtros_vehiculo', {
        p_profesional_id: profesionalId,
        p_marca: vehiculoData.marca,
        p_modelo: vehiculoData.modelo,
        p_ano: vehiculoData.ano,
        p_kilometraje: vehiculoData.kilometraje,
        p_precio_estimado: precioData?.precio_estimado
      });

      if (error) throw error;

      return {
        cumple_filtros: resultado,
        precio_estimado: precioData?.precio_estimado,
        precio_mercado: precioData?.precio_mercado
      };
    } catch (error) {
      console.error('Error evaluando vehículo:', error);
      return {
        cumple_filtros: false,
        precio_estimado: null,
        precio_mercado: null
      };
    }
  };

  return {
    filtros,
    loading,
    saving,
    cargarFiltros,
    guardarFiltros,
    evaluarVehiculo
  };
}