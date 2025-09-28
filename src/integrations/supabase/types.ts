export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_daily_usage: {
        Row: {
          created_at: string | null
          id: string
          last_query_time: string | null
          queries_used: number | null
          updated_at: string | null
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_query_time?: string | null
          queries_used?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_query_time?: string | null
          queries_used?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      anuncios_similares: {
        Row: {
          anuncio_1_id: string | null
          anuncio_2_id: string | null
          created_at: string
          detalles: Json | null
          id: string
          score_similitud: number
          tipo_similitud: string
        }
        Insert: {
          anuncio_1_id?: string | null
          anuncio_2_id?: string | null
          created_at?: string
          detalles?: Json | null
          id?: string
          score_similitud: number
          tipo_similitud: string
        }
        Update: {
          anuncio_1_id?: string | null
          anuncio_2_id?: string | null
          created_at?: string
          detalles?: Json | null
          id?: string
          score_similitud?: number
          tipo_similitud?: string
        }
        Relationships: [
          {
            foreignKeyName: "anuncios_similares_anuncio_1_id_fkey"
            columns: ["anuncio_1_id"]
            isOneToOne: false
            referencedRelation: "anuncios_vehiculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anuncios_similares_anuncio_2_id_fkey"
            columns: ["anuncio_2_id"]
            isOneToOne: false
            referencedRelation: "anuncios_vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      anuncios_vehiculos: {
        Row: {
          activo: boolean | null
          ano: number | null
          caracteristicas: Json | null
          color: string | null
          combustible: string | null
          created_at: string
          datos_raw: Json | null
          descripcion: string | null
          email: string | null
          estado_normalizacion: string | null
          fecha_actualizacion: string | null
          fecha_extraccion: string
          hash_contenido: string | null
          id: string
          imagenes: Json | null
          kilometraje: number | null
          kilometraje_original: string | null
          marca: string | null
          modelo: string | null
          precio: number | null
          precio_original: string | null
          sitio_web: string
          telefono: string | null
          tipo_vehiculo: string | null
          titulo: string
          transmision: string | null
          ubicacion: string | null
          updated_at: string
          url_anuncio: string
        }
        Insert: {
          activo?: boolean | null
          ano?: number | null
          caracteristicas?: Json | null
          color?: string | null
          combustible?: string | null
          created_at?: string
          datos_raw?: Json | null
          descripcion?: string | null
          email?: string | null
          estado_normalizacion?: string | null
          fecha_actualizacion?: string | null
          fecha_extraccion?: string
          hash_contenido?: string | null
          id?: string
          imagenes?: Json | null
          kilometraje?: number | null
          kilometraje_original?: string | null
          marca?: string | null
          modelo?: string | null
          precio?: number | null
          precio_original?: string | null
          sitio_web: string
          telefono?: string | null
          tipo_vehiculo?: string | null
          titulo: string
          transmision?: string | null
          ubicacion?: string | null
          updated_at?: string
          url_anuncio: string
        }
        Update: {
          activo?: boolean | null
          ano?: number | null
          caracteristicas?: Json | null
          color?: string | null
          combustible?: string | null
          created_at?: string
          datos_raw?: Json | null
          descripcion?: string | null
          email?: string | null
          estado_normalizacion?: string | null
          fecha_actualizacion?: string | null
          fecha_extraccion?: string
          hash_contenido?: string | null
          id?: string
          imagenes?: Json | null
          kilometraje?: number | null
          kilometraje_original?: string | null
          marca?: string | null
          modelo?: string | null
          precio?: number | null
          precio_original?: string | null
          sitio_web?: string
          telefono?: string | null
          tipo_vehiculo?: string | null
          titulo?: string
          transmision?: string | null
          ubicacion?: string | null
          updated_at?: string
          url_anuncio?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          expiration_date: string | null
          id: string
          refresh_token: string | null
          seller_id: number | null
          token: string | null
        }
        Insert: {
          expiration_date?: string | null
          id: string
          refresh_token?: string | null
          seller_id?: number | null
          token?: string | null
        }
        Update: {
          expiration_date?: string | null
          id?: string
          refresh_token?: string | null
          seller_id?: number | null
          token?: string | null
        }
        Relationships: []
      }
      autos_profesional_inventario: {
        Row: {
          ano: number
          caracteristicas: Json | null
          created_at: string
          descripcion: string | null
          estado: string
          fecha_publicacion: string | null
          id: string
          imagen_url: string | null
          kilometraje: number
          marca: string
          modelo: string
          precio_actual: number
          precio_maximo: number | null
          precio_maximo_venta: number | null
          precio_minimo: number | null
          precio_minimo_venta: number | null
          precio_original: number | null
          profesional_id: string
          titulo: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          ano: number
          caracteristicas?: Json | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          kilometraje: number
          marca: string
          modelo: string
          precio_actual: number
          precio_maximo?: number | null
          precio_maximo_venta?: number | null
          precio_minimo?: number | null
          precio_minimo_venta?: number | null
          precio_original?: number | null
          profesional_id: string
          titulo: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          caracteristicas?: Json | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          kilometraje?: number
          marca?: string
          modelo?: string
          precio_actual?: number
          precio_maximo?: number | null
          precio_maximo_venta?: number | null
          precio_minimo?: number | null
          precio_minimo_venta?: number | null
          precio_original?: number | null
          profesional_id?: string
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      autos_venta: {
        Row: {
          ano: number
          cliente_id: string
          comentarios_documentos: string | null
          comentarios_estado: string | null
          created_at: string
          documentos_orden: boolean
          estado_auto: string
          id: string
          kilometraje: number
          marca: string
          modelo: string
          recibiendo_ofertas: boolean
          servicios_agencia: boolean
          updated_at: string
          version: string | null
        }
        Insert: {
          ano: number
          cliente_id: string
          comentarios_documentos?: string | null
          comentarios_estado?: string | null
          created_at?: string
          documentos_orden: boolean
          estado_auto: string
          id?: string
          kilometraje: number
          marca: string
          modelo: string
          recibiendo_ofertas?: boolean
          servicios_agencia: boolean
          updated_at?: string
          version?: string | null
        }
        Update: {
          ano?: number
          cliente_id?: string
          comentarios_documentos?: string | null
          comentarios_estado?: string | null
          created_at?: string
          documentos_orden?: boolean
          estado_auto?: string
          id?: string
          kilometraje?: number
          marca?: string
          modelo?: string
          recibiendo_ofertas?: boolean
          servicios_agencia?: boolean
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autos_venta_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ciudad: string
          correo_electronico: string
          created_at: string
          estado: string
          id: string
          nombre_apellido: string
          numero_telefonico: string
          preferencia_contacto: string
          updated_at: string
        }
        Insert: {
          ciudad: string
          correo_electronico: string
          created_at?: string
          estado: string
          id?: string
          nombre_apellido: string
          numero_telefonico: string
          preferencia_contacto: string
          updated_at?: string
        }
        Update: {
          ciudad?: string
          correo_electronico?: string
          created_at?: string
          estado?: string
          id?: string
          nombre_apellido?: string
          numero_telefonico?: string
          preferencia_contacto?: string
          updated_at?: string
        }
        Relationships: []
      }
      config_autoajuste_auto: {
        Row: {
          activo: boolean
          auto_id: string
          calendario_accion_tipo: string | null
          calendario_accion_valor: number | null
          calendario_activa: boolean | null
          calendario_es_aumento: boolean | null
          calendario_fecha_fin: string | null
          calendario_fecha_inicio: string | null
          calendario_frecuencia: string | null
          calendario_precio_final_tipo: string | null
          calendario_precio_final_valor: number | null
          calendario_precio_objetivo: number | null
          created_at: string | null
          demanda_accion_tipo: string | null
          demanda_activa: boolean | null
          demanda_contactos_umbral: number | null
          demanda_dias_evaluar: number | null
          demanda_umbral_tipo: string | null
          demanda_valor: number | null
          demanda_valor_tipo: string | null
          id: string
          precio_inicial: number
          precio_maximo: number | null
          precio_minimo: number | null
          profesional_id: string
          tiempo_accion_tipo: string | null
          tiempo_accion_valor: number | null
          tiempo_activa: boolean | null
          tiempo_dias_limite: number | null
          tiempo_es_aumento: boolean | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          auto_id: string
          calendario_accion_tipo?: string | null
          calendario_accion_valor?: number | null
          calendario_activa?: boolean | null
          calendario_es_aumento?: boolean | null
          calendario_fecha_fin?: string | null
          calendario_fecha_inicio?: string | null
          calendario_frecuencia?: string | null
          calendario_precio_final_tipo?: string | null
          calendario_precio_final_valor?: number | null
          calendario_precio_objetivo?: number | null
          created_at?: string | null
          demanda_accion_tipo?: string | null
          demanda_activa?: boolean | null
          demanda_contactos_umbral?: number | null
          demanda_dias_evaluar?: number | null
          demanda_umbral_tipo?: string | null
          demanda_valor?: number | null
          demanda_valor_tipo?: string | null
          id?: string
          precio_inicial: number
          precio_maximo?: number | null
          precio_minimo?: number | null
          profesional_id: string
          tiempo_accion_tipo?: string | null
          tiempo_accion_valor?: number | null
          tiempo_activa?: boolean | null
          tiempo_dias_limite?: number | null
          tiempo_es_aumento?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          auto_id?: string
          calendario_accion_tipo?: string | null
          calendario_accion_valor?: number | null
          calendario_activa?: boolean | null
          calendario_es_aumento?: boolean | null
          calendario_fecha_fin?: string | null
          calendario_fecha_inicio?: string | null
          calendario_frecuencia?: string | null
          calendario_precio_final_tipo?: string | null
          calendario_precio_final_valor?: number | null
          calendario_precio_objetivo?: number | null
          created_at?: string | null
          demanda_accion_tipo?: string | null
          demanda_activa?: boolean | null
          demanda_contactos_umbral?: number | null
          demanda_dias_evaluar?: number | null
          demanda_umbral_tipo?: string | null
          demanda_valor?: number | null
          demanda_valor_tipo?: string | null
          id?: string
          precio_inicial?: number
          precio_maximo?: number | null
          precio_minimo?: number | null
          profesional_id?: string
          tiempo_accion_tipo?: string | null
          tiempo_accion_valor?: number | null
          tiempo_activa?: boolean | null
          tiempo_dias_limite?: number | null
          tiempo_es_aumento?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_autoajuste_auto_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      config_autoajuste_general: {
        Row: {
          activo: boolean
          calendario_accion_tipo: string | null
          calendario_accion_valor: number | null
          calendario_activa: boolean | null
          calendario_es_aumento: boolean | null
          calendario_fecha_fin: string | null
          calendario_fecha_inicio: string | null
          calendario_frecuencia: string | null
          created_at: string | null
          demanda_accion_tipo: string | null
          demanda_activa: boolean | null
          demanda_contactos_umbral: number | null
          demanda_dias_evaluar: number | null
          demanda_umbral_tipo: string | null
          demanda_valor: number | null
          demanda_valor_tipo: string | null
          id: string
          precio_maximo: number | null
          precio_minimo: number | null
          profesional_id: string
          tiempo_accion_tipo: string | null
          tiempo_accion_valor: number | null
          tiempo_activa: boolean | null
          tiempo_dias_limite: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          calendario_accion_tipo?: string | null
          calendario_accion_valor?: number | null
          calendario_activa?: boolean | null
          calendario_es_aumento?: boolean | null
          calendario_fecha_fin?: string | null
          calendario_fecha_inicio?: string | null
          calendario_frecuencia?: string | null
          created_at?: string | null
          demanda_accion_tipo?: string | null
          demanda_activa?: boolean | null
          demanda_contactos_umbral?: number | null
          demanda_dias_evaluar?: number | null
          demanda_umbral_tipo?: string | null
          demanda_valor?: number | null
          demanda_valor_tipo?: string | null
          id?: string
          precio_maximo?: number | null
          precio_minimo?: number | null
          profesional_id: string
          tiempo_accion_tipo?: string | null
          tiempo_accion_valor?: number | null
          tiempo_activa?: boolean | null
          tiempo_dias_limite?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          calendario_accion_tipo?: string | null
          calendario_accion_valor?: number | null
          calendario_activa?: boolean | null
          calendario_es_aumento?: boolean | null
          calendario_fecha_fin?: string | null
          calendario_fecha_inicio?: string | null
          calendario_frecuencia?: string | null
          created_at?: string | null
          demanda_accion_tipo?: string | null
          demanda_activa?: boolean | null
          demanda_contactos_umbral?: number | null
          demanda_dias_evaluar?: number | null
          demanda_umbral_tipo?: string | null
          demanda_valor?: number | null
          demanda_valor_tipo?: string | null
          id?: string
          precio_maximo?: number | null
          precio_minimo?: number | null
          profesional_id?: string
          tiempo_accion_tipo?: string | null
          tiempo_accion_valor?: number | null
          tiempo_activa?: boolean | null
          tiempo_dias_limite?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_autoajuste_general_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_extraccion: {
        Row: {
          activo: boolean | null
          created_at: string
          delay_entre_requests: number | null
          headers: Json | null
          id: string
          max_requests_por_minuto: number | null
          proxies: Json | null
          selectores: Json
          sitio_web: string
          ultima_extraccion: string | null
          updated_at: string
          user_agents: Json | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          delay_entre_requests?: number | null
          headers?: Json | null
          id?: string
          max_requests_por_minuto?: number | null
          proxies?: Json | null
          selectores?: Json
          sitio_web: string
          ultima_extraccion?: string | null
          updated_at?: string
          user_agents?: Json | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          delay_entre_requests?: number | null
          headers?: Json | null
          id?: string
          max_requests_por_minuto?: number | null
          proxies?: Json | null
          selectores?: Json
          sitio_web?: string
          ultima_extraccion?: string | null
          updated_at?: string
          user_agents?: Json | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action_type: string
          created_at: string
          credits_consumed: number
          id: string
          resource_info: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          credits_consumed: number
          id?: string
          resource_info?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_consumed?: number
          id?: string
          resource_info?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      documentos_profesional: {
        Row: {
          comentarios: string | null
          created_at: string | null
          estado: string | null
          id: string
          nombre_archivo: string
          profesional_id: string
          tipo_documento: string
          updated_at: string | null
          url_documento: string
        }
        Insert: {
          comentarios?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre_archivo: string
          profesional_id: string
          tipo_documento: string
          updated_at?: string | null
          url_documento: string
        }
        Update: {
          comentarios?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre_archivo?: string
          profesional_id?: string
          tipo_documento?: string
          updated_at?: string | null
          url_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_profesional_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      estadisticas_extraccion: {
        Row: {
          created_at: string
          estado_general: string | null
          id: string
          porcentaje_completado: number | null
          sesion_id: string
          tiempo_estimado_restante: number | null
          total_anuncios_actualizados: number | null
          total_anuncios_nuevos: number | null
          total_anuncios_procesados: number | null
          total_errores: number | null
          total_urls_extraidas: number | null
          total_urls_objetivo: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado_general?: string | null
          id?: string
          porcentaje_completado?: number | null
          sesion_id: string
          tiempo_estimado_restante?: number | null
          total_anuncios_actualizados?: number | null
          total_anuncios_nuevos?: number | null
          total_anuncios_procesados?: number | null
          total_errores?: number | null
          total_urls_extraidas?: number | null
          total_urls_objetivo?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado_general?: string | null
          id?: string
          porcentaje_completado?: number | null
          sesion_id?: string
          tiempo_estimado_restante?: number | null
          total_anuncios_actualizados?: number | null
          total_anuncios_nuevos?: number | null
          total_anuncios_procesados?: number | null
          total_errores?: number | null
          total_urls_extraidas?: number | null
          total_urls_objetivo?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      evaluaciones_cliente_profesional_pendientes: {
        Row: {
          aspectos: Json | null
          calificacion: number
          comentario: string | null
          created_at: string
          evaluado_id: string
          evaluador_id: string
          fecha_evaluacion: string
          id: string
          interaccion_id: string
          revelada: boolean
          tipo_evaluador: string
          updated_at: string
        }
        Insert: {
          aspectos?: Json | null
          calificacion: number
          comentario?: string | null
          created_at?: string
          evaluado_id: string
          evaluador_id: string
          fecha_evaluacion?: string
          id?: string
          interaccion_id: string
          revelada?: boolean
          tipo_evaluador: string
          updated_at?: string
        }
        Update: {
          aspectos?: Json | null
          calificacion?: number
          comentario?: string | null
          created_at?: string
          evaluado_id?: string
          evaluador_id?: string
          fecha_evaluacion?: string
          id?: string
          interaccion_id?: string
          revelada?: boolean
          tipo_evaluador?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluaciones_profesional_pendientes: {
        Row: {
          aspectos: Json | null
          calificacion: number
          comentario: string | null
          created_at: string
          evaluado_id: string
          evaluador_id: string
          fecha_evaluacion: string
          id: string
          interaccion_id: string
          revelada: boolean
          tipo_interaccion: string
          updated_at: string
        }
        Insert: {
          aspectos?: Json | null
          calificacion: number
          comentario?: string | null
          created_at?: string
          evaluado_id: string
          evaluador_id: string
          fecha_evaluacion?: string
          id?: string
          interaccion_id: string
          revelada?: boolean
          tipo_interaccion: string
          updated_at?: string
        }
        Update: {
          aspectos?: Json | null
          calificacion?: number
          comentario?: string | null
          created_at?: string
          evaluado_id?: string
          evaluador_id?: string
          fecha_evaluacion?: string
          id?: string
          interaccion_id?: string
          revelada?: boolean
          tipo_interaccion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_profesional_pendientes_evaluado_id_fkey"
            columns: ["evaluado_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_profesional_pendientes_evaluador_id_fkey"
            columns: ["evaluador_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_profesional_pendientes_interaccion_id_fkey"
            columns: ["interaccion_id"]
            isOneToOne: false
            referencedRelation: "interacciones_profesional_profesional"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_rewards: {
        Row: {
          created_at: string
          credits_awarded: number
          id: string
          interaction_id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number
          id?: string
          interaction_id: string
          interaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number
          id?: string
          interaction_id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      historial_cambios_precios: {
        Row: {
          auto_id: string
          created_at: string | null
          detalles_regla: Json | null
          id: string
          precio_anterior: number
          precio_nuevo: number
          profesional_id: string
          regla_aplicada: string
        }
        Insert: {
          auto_id: string
          created_at?: string | null
          detalles_regla?: Json | null
          id?: string
          precio_anterior: number
          precio_nuevo: number
          profesional_id: string
          regla_aplicada: string
        }
        Update: {
          auto_id?: string
          created_at?: string | null
          detalles_regla?: Json | null
          id?: string
          precio_anterior?: number
          precio_nuevo?: number
          profesional_id?: string
          regla_aplicada?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_cambios_precios_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_verificaciones: {
        Row: {
          accion: string
          comentarios: string | null
          created_at: string | null
          id: string
          profesional_id: string
          realizado_por: string | null
        }
        Insert: {
          accion: string
          comentarios?: string | null
          created_at?: string | null
          id?: string
          profesional_id: string
          realizado_por?: string | null
        }
        Update: {
          accion?: string
          comentarios?: string | null
          created_at?: string | null
          id?: string
          profesional_id?: string
          realizado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_verificaciones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ventas: {
        Row: {
          ano: number
          caracteristicas: Json | null
          created_at: string
          dias_en_mercado: number | null
          fecha_publicacion: string
          fecha_venta: string
          id: string
          kilometraje: number | null
          marca: string
          modelo: string
          precio_inicial: number
          precio_venta: number
          tipo_vendedor: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          ano: number
          caracteristicas?: Json | null
          created_at?: string
          dias_en_mercado?: number | null
          fecha_publicacion: string
          fecha_venta: string
          id?: string
          kilometraje?: number | null
          marca: string
          modelo: string
          precio_inicial: number
          precio_venta: number
          tipo_vendedor?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          caracteristicas?: Json | null
          created_at?: string
          dias_en_mercado?: number | null
          fecha_publicacion?: string
          fecha_venta?: string
          id?: string
          kilometraje?: number | null
          marca?: string
          modelo?: string
          precio_inicial?: number
          precio_venta?: number
          tipo_vendedor?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interacciones_profesional_profesional: {
        Row: {
          auto_inventario_id: string
          created_at: string
          elegible_evaluacion: boolean
          evaluaciones_completadas: boolean
          evaluaciones_reveladas: boolean
          fecha_limite_evaluacion: string | null
          id: string
          primera_interaccion: string
          profesional_iniciador_id: string
          profesional_receptor_id: string
          telefono_revelado: boolean
          updated_at: string
        }
        Insert: {
          auto_inventario_id: string
          created_at?: string
          elegible_evaluacion?: boolean
          evaluaciones_completadas?: boolean
          evaluaciones_reveladas?: boolean
          fecha_limite_evaluacion?: string | null
          id?: string
          primera_interaccion?: string
          profesional_iniciador_id: string
          profesional_receptor_id: string
          telefono_revelado?: boolean
          updated_at?: string
        }
        Update: {
          auto_inventario_id?: string
          created_at?: string
          elegible_evaluacion?: boolean
          evaluaciones_completadas?: boolean
          evaluaciones_reveladas?: boolean
          fecha_limite_evaluacion?: string | null
          id?: string
          primera_interaccion?: string
          profesional_iniciador_id?: string
          profesional_receptor_id?: string
          telefono_revelado?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacciones_profesional_profesi_profesional_iniciador_id_fkey"
            columns: ["profesional_iniciador_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_profesional_profesio_profesional_receptor_id_fkey"
            columns: ["profesional_receptor_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_profesional_profesional_auto_inventario_id_fkey"
            columns: ["auto_inventario_id"]
            isOneToOne: false
            referencedRelation: "autos_profesional_inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      interacciones_profesionales: {
        Row: {
          cliente_id: string
          created_at: string
          elegible_evaluacion: boolean
          evaluaciones_reveladas: boolean
          fecha_limite_evaluacion: string | null
          id: string
          oferta_id: string
          primera_interaccion: string
          profesional_id: string
          telefono_revelado: boolean
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          elegible_evaluacion?: boolean
          evaluaciones_reveladas?: boolean
          fecha_limite_evaluacion?: string | null
          id?: string
          oferta_id: string
          primera_interaccion?: string
          profesional_id: string
          telefono_revelado?: boolean
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          elegible_evaluacion?: boolean
          evaluaciones_reveladas?: boolean
          fecha_limite_evaluacion?: string | null
          id?: string
          oferta_id?: string
          primera_interaccion?: string
          profesional_id?: string
          telefono_revelado?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacciones_profesionales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_profesionales_oferta_id_fkey"
            columns: ["oferta_id"]
            isOneToOne: false
            referencedRelation: "ofertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_extraccion: {
        Row: {
          created_at: string
          estado: string
          id: string
          ip_utilizada: unknown | null
          mensaje: string | null
          sitio_web: string
          tiempo_respuesta: number | null
          url: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          estado: string
          id?: string
          ip_utilizada?: unknown | null
          mensaje?: string | null
          sitio_web: string
          tiempo_respuesta?: number | null
          url: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          ip_utilizada?: unknown | null
          mensaje?: string | null
          sitio_web?: string
          tiempo_respuesta?: number | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      marcas_normalizadas: {
        Row: {
          confianza: number | null
          created_at: string
          id: string
          marca_normalizada: string
          marca_original: string
        }
        Insert: {
          confianza?: number | null
          created_at?: string
          id?: string
          marca_normalizada: string
          marca_original: string
        }
        Update: {
          confianza?: number | null
          created_at?: string
          id?: string
          marca_normalizada?: string
          marca_original?: string
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          market_data: Json
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          market_data: Json
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          market_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      mensajes_ofertas: {
        Row: {
          created_at: string
          id: string
          leido: boolean
          mensaje: string
          oferta_id: string
          remitente_id: string
          remitente_tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          leido?: boolean
          mensaje: string
          oferta_id: string
          remitente_id: string
          remitente_tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          leido?: boolean
          mensaje?: string
          oferta_id?: string
          remitente_id?: string
          remitente_tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_ofertas_oferta_id_fkey"
            columns: ["oferta_id"]
            isOneToOne: false
            referencedRelation: "ofertas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_profesional_profesional: {
        Row: {
          created_at: string
          id: string
          interaccion_id: string
          leido: boolean
          mensaje: string
          remitente_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaccion_id: string
          leido?: boolean
          mensaje: string
          remitente_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interaccion_id?: string
          leido?: boolean
          mensaje?: string
          remitente_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_profesional_profesional_interaccion_id_fkey"
            columns: ["interaccion_id"]
            isOneToOne: false
            referencedRelation: "interacciones_profesional_profesional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_profesional_profesional_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_normalizados: {
        Row: {
          confianza: number | null
          created_at: string
          id: string
          marca_id: string | null
          modelo_normalizado: string
          modelo_original: string
        }
        Insert: {
          confianza?: number | null
          created_at?: string
          id?: string
          marca_id?: string | null
          modelo_normalizado: string
          modelo_original: string
        }
        Update: {
          confianza?: number | null
          created_at?: string
          id?: string
          marca_id?: string | null
          modelo_normalizado?: string
          modelo_original?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_normalizados_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas_normalizadas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          es_global: boolean
          id: string
          leida: boolean
          mensaje: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          es_global?: boolean
          id?: string
          leida?: boolean
          mensaje: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          es_global?: boolean
          id?: string
          leida?: boolean
          mensaje?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ofertas: {
        Row: {
          auto_venta_id: string
          comentarios: string | null
          created_at: string
          estado: string
          id: string
          monto_max: number | null
          monto_min: number | null
          monto_oferta: number
          preferente: boolean
          profesional_id: string
          updated_at: string
        }
        Insert: {
          auto_venta_id: string
          comentarios?: string | null
          created_at?: string
          estado?: string
          id?: string
          monto_max?: number | null
          monto_min?: number | null
          monto_oferta: number
          preferente?: boolean
          profesional_id: string
          updated_at?: string
        }
        Update: {
          auto_venta_id?: string
          comentarios?: string | null
          created_at?: string
          estado?: string
          id?: string
          monto_max?: number | null
          monto_min?: number | null
          monto_oferta?: number
          preferente?: boolean
          profesional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_auto_venta_id_fkey"
            columns: ["auto_venta_id"]
            isOneToOne: false
            referencedRelation: "autos_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profesional_filtros_ofertas: {
        Row: {
          activo: boolean
          created_at: string
          filtros_vehiculo: Json
          id: string
          profesional_id: string
          tipo_filtro: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          filtros_vehiculo?: Json
          id?: string
          profesional_id: string
          tipo_filtro?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          filtros_vehiculo?: Json
          id?: string
          profesional_id?: string
          tipo_filtro?: string
          updated_at?: string
        }
        Relationships: []
      }
      profesionales: {
        Row: {
          activo: boolean
          comentarios_verificacion: string | null
          contacto_principal: string | null
          correo: string | null
          created_at: string
          direccion_calle: string | null
          direccion_ciudad: string | null
          direccion_cp: string | null
          direccion_estado: string | null
          direccion_numero: string | null
          documentos_verificacion: Json | null
          estado_verificacion: string | null
          fecha_solicitud: string | null
          fecha_verificacion: string | null
          id: string
          negocio_nombre: string
          notas: string | null
          pausado: boolean
          razon_social: string
          representante_legal: string | null
          rfc: string
          telefono: string | null
          tipo_negocio: Database["public"]["Enums"]["tipo_negocio"]
          updated_at: string
          user_id: string | null
          verificado_por: string | null
        }
        Insert: {
          activo?: boolean
          comentarios_verificacion?: string | null
          contacto_principal?: string | null
          correo?: string | null
          created_at?: string
          direccion_calle?: string | null
          direccion_ciudad?: string | null
          direccion_cp?: string | null
          direccion_estado?: string | null
          direccion_numero?: string | null
          documentos_verificacion?: Json | null
          estado_verificacion?: string | null
          fecha_solicitud?: string | null
          fecha_verificacion?: string | null
          id?: string
          negocio_nombre: string
          notas?: string | null
          pausado?: boolean
          razon_social: string
          representante_legal?: string | null
          rfc: string
          telefono?: string | null
          tipo_negocio: Database["public"]["Enums"]["tipo_negocio"]
          updated_at?: string
          user_id?: string | null
          verificado_por?: string | null
        }
        Update: {
          activo?: boolean
          comentarios_verificacion?: string | null
          contacto_principal?: string | null
          correo?: string | null
          created_at?: string
          direccion_calle?: string | null
          direccion_ciudad?: string | null
          direccion_cp?: string | null
          direccion_estado?: string | null
          direccion_numero?: string | null
          documentos_verificacion?: Json | null
          estado_verificacion?: string | null
          fecha_solicitud?: string | null
          fecha_verificacion?: string | null
          id?: string
          negocio_nombre?: string
          notas?: string | null
          pausado?: boolean
          razon_social?: string
          representante_legal?: string | null
          rfc?: string
          telefono?: string | null
          tipo_negocio?: Database["public"]["Enums"]["tipo_negocio"]
          updated_at?: string
          user_id?: string | null
          verificado_por?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string
          contacto_nombre: string | null
          contacto_telefono: string | null
          correo_electronico: string
          created_at: string
          id: string
          negocio_nombre: string | null
          nombre: string
          reputacion: number | null
          telefono_movil: string
          telefono_secundario: string | null
          tipo_usuario: string
          ubicacion_ciudad: string | null
          ubicacion_estado: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido: string
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          correo_electronico: string
          created_at?: string
          id?: string
          negocio_nombre?: string | null
          nombre: string
          reputacion?: number | null
          telefono_movil: string
          telefono_secundario?: string | null
          tipo_usuario: string
          ubicacion_ciudad?: string | null
          ubicacion_estado?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          correo_electronico?: string
          created_at?: string
          id?: string
          negocio_nombre?: string | null
          nombre?: string
          reputacion?: number | null
          telefono_movil?: string
          telefono_secundario?: string | null
          tipo_usuario?: string
          ubicacion_ciudad?: string | null
          ubicacion_estado?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progreso_extraccion: {
        Row: {
          anuncios_procesados: number | null
          created_at: string
          detalles: Json | null
          errores_count: number | null
          estado: string
          estrategia: string
          id: string
          paginas_procesadas: number | null
          parametro: string
          sesion_id: string
          tiempo_fin: string | null
          tiempo_inicio: string | null
          updated_at: string
          urls_extraidas: number | null
        }
        Insert: {
          anuncios_procesados?: number | null
          created_at?: string
          detalles?: Json | null
          errores_count?: number | null
          estado?: string
          estrategia: string
          id?: string
          paginas_procesadas?: number | null
          parametro: string
          sesion_id?: string
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
          updated_at?: string
          urls_extraidas?: number | null
        }
        Update: {
          anuncios_procesados?: number | null
          created_at?: string
          detalles?: Json | null
          errores_count?: number | null
          estado?: string
          estrategia?: string
          id?: string
          paginas_procesadas?: number | null
          parametro?: string
          sesion_id?: string
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
          updated_at?: string
          urls_extraidas?: number | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          max_uses: number
          updated_at: string
          user_id: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          max_uses?: number
          updated_at?: string
          user_id: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          max_uses?: number
          updated_at?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      reviews_profesional_profesional: {
        Row: {
          aspectos: Json | null
          calificacion: number
          comentario: string | null
          created_at: string
          estado_revision: string | null
          evidencia_transaccion: Json | null
          fecha_transaccion: string
          id: string
          profesional_evaluado_id: string
          profesional_evaluador_id: string
          tipo_interaccion: string
          transaccion_id: string | null
          updated_at: string
        }
        Insert: {
          aspectos?: Json | null
          calificacion: number
          comentario?: string | null
          created_at?: string
          estado_revision?: string | null
          evidencia_transaccion?: Json | null
          fecha_transaccion: string
          id?: string
          profesional_evaluado_id: string
          profesional_evaluador_id: string
          tipo_interaccion?: string
          transaccion_id?: string | null
          updated_at?: string
        }
        Update: {
          aspectos?: Json | null
          calificacion?: number
          comentario?: string | null
          created_at?: string
          estado_revision?: string | null
          evidencia_transaccion?: Json | null
          fecha_transaccion?: string
          id?: string
          profesional_evaluado_id?: string
          profesional_evaluador_id?: string
          tipo_interaccion?: string
          transaccion_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews_profesionales: {
        Row: {
          aspectos: Json | null
          calificacion: number
          cliente_id: string
          comentario: string | null
          created_at: string
          id: string
          oferta_id: string
          profesional_id: string
          updated_at: string
        }
        Insert: {
          aspectos?: Json | null
          calificacion: number
          cliente_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          oferta_id: string
          profesional_id: string
          updated_at?: string
        }
        Update: {
          aspectos?: Json | null
          calificacion?: number
          cliente_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          oferta_id?: string
          profesional_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitudes_paquetes_personalizados: {
        Row: {
          created_at: string
          detalles_necesidades: string | null
          email_contacto: string
          estado: string
          id: string
          nombre_contacto: string
          nombre_empresa: string
          notas_admin: string | null
          numero_consultas_estimadas: number
          presupuesto_estimado: string | null
          telefono_contacto: string
          tipo_negocio: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detalles_necesidades?: string | null
          email_contacto: string
          estado?: string
          id?: string
          nombre_contacto: string
          nombre_empresa: string
          notas_admin?: string | null
          numero_consultas_estimadas: number
          presupuesto_estimado?: string | null
          telefono_contacto: string
          tipo_negocio: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detalles_necesidades?: string | null
          email_contacto?: string
          estado?: string
          id?: string
          nombre_contacto?: string
          nombre_empresa?: string
          notas_admin?: string | null
          numero_consultas_estimadas?: number
          presupuesto_estimado?: string | null
          telefono_contacto?: string
          tipo_negocio?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stats_profesional_profesional: {
        Row: {
          badge_comprador: string | null
          badge_vendedor: string | null
          calificacion_promedio_comprador: number | null
          calificacion_promedio_vendedor: number | null
          created_at: string
          id: string
          profesional_id: string
          reputacion_general: number | null
          total_reviews_comprador: number | null
          total_reviews_vendedor: number | null
          updated_at: string
        }
        Insert: {
          badge_comprador?: string | null
          badge_vendedor?: string | null
          calificacion_promedio_comprador?: number | null
          calificacion_promedio_vendedor?: number | null
          created_at?: string
          id?: string
          profesional_id: string
          reputacion_general?: number | null
          total_reviews_comprador?: number | null
          total_reviews_vendedor?: number | null
          updated_at?: string
        }
        Update: {
          badge_comprador?: string | null
          badge_vendedor?: string | null
          calificacion_promedio_comprador?: number | null
          calificacion_promedio_vendedor?: number | null
          created_at?: string
          id?: string
          profesional_id?: string
          reputacion_general?: number | null
          total_reviews_comprador?: number | null
          total_reviews_vendedor?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stats_profesionales: {
        Row: {
          badge_confianza: string | null
          calificacion_promedio: number | null
          created_at: string
          id: string
          profesional_id: string
          tasa_respuesta: number | null
          total_ofertas_aceptadas: number | null
          total_ofertas_enviadas: number | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          badge_confianza?: string | null
          calificacion_promedio?: number | null
          created_at?: string
          id?: string
          profesional_id: string
          tasa_respuesta?: number | null
          total_ofertas_aceptadas?: number | null
          total_ofertas_enviadas?: number | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          badge_confianza?: string | null
          calificacion_promedio?: number | null
          created_at?: string
          id?: string
          profesional_id?: string
          tasa_respuesta?: number | null
          total_ofertas_aceptadas?: number | null
          total_ofertas_enviadas?: number | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subasta_autos: {
        Row: {
          ano: number
          ciudad: string | null
          comentarios_documentos: string | null
          comentarios_estado: string | null
          created_at: string
          documentos_orden: boolean
          estado: string | null
          estado_auto: string
          fecha_registro: string
          id: string
          kilometraje: number
          marca: string
          modelo: string
          preferencia_contacto: string | null
          servicios_agencia: boolean
          updated_at: string
          user_id: string
          vendedor_correo: string
          vendedor_nombre: string
          vendedor_telefono: string
          version: string | null
        }
        Insert: {
          ano: number
          ciudad?: string | null
          comentarios_documentos?: string | null
          comentarios_estado?: string | null
          created_at?: string
          documentos_orden: boolean
          estado?: string | null
          estado_auto: string
          fecha_registro?: string
          id?: string
          kilometraje: number
          marca: string
          modelo: string
          preferencia_contacto?: string | null
          servicios_agencia: boolean
          updated_at?: string
          user_id: string
          vendedor_correo: string
          vendedor_nombre: string
          vendedor_telefono: string
          version?: string | null
        }
        Update: {
          ano?: number
          ciudad?: string | null
          comentarios_documentos?: string | null
          comentarios_estado?: string | null
          created_at?: string
          documentos_orden?: boolean
          estado?: string | null
          estado_auto?: string
          fecha_registro?: string
          id?: string
          kilometraje?: number
          marca?: string
          modelo?: string
          preferencia_contacto?: string | null
          servicios_agencia?: boolean
          updated_at?: string
          user_id?: string
          vendedor_correo?: string
          vendedor_nombre?: string
          vendedor_telefono?: string
          version?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_available: number
          credits_earned_evaluations: number | null
          credits_earned_referrals: number | null
          credits_used_ads: number | null
          credits_used_searches: number | null
          credits_used_this_month: number
          evaluation_credits_this_month: number | null
          id: string
          last_reset_date: string
          monthly_limit: number
          plan_expires_at: string | null
          plan_type: string
          referrals_count_this_month: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_available?: number
          credits_earned_evaluations?: number | null
          credits_earned_referrals?: number | null
          credits_used_ads?: number | null
          credits_used_searches?: number | null
          credits_used_this_month?: number
          evaluation_credits_this_month?: number | null
          id?: string
          last_reset_date?: string
          monthly_limit?: number
          plan_expires_at?: string | null
          plan_type?: string
          referrals_count_this_month?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_available?: number
          credits_earned_evaluations?: number | null
          credits_earned_referrals?: number | null
          credits_used_ads?: number | null
          credits_used_searches?: number | null
          credits_used_this_month?: number
          evaluation_credits_this_month?: number | null
          id?: string
          last_reset_date?: string
          monthly_limit?: number
          plan_expires_at?: string | null
          plan_type?: string
          referrals_count_this_month?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          id: string
          market_updates: boolean
          new_offers: boolean
          price_alerts: boolean
          system_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_updates?: boolean
          new_offers?: boolean
          price_alerts?: boolean
          system_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_updates?: boolean
          new_offers?: boolean
          price_alerts?: boolean
          system_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          created_at: string
          credits_awarded: number
          id: string
          referee_first_action_at: string | null
          referee_id: string
          referral_code: string
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referee_first_action_at?: string | null
          referee_id: string
          referral_code: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referee_first_action_at?: string | null
          referee_id?: string
          referral_code?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_market_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_updated: string | null
          market_data: Json
          user_id: string
          vehicle_key: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          market_data: Json
          user_id: string
          vehicle_key: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          market_data?: Json
          user_id?: string
          vehicle_key?: string
        }
        Relationships: []
      }
      vendedores_ayuda: {
        Row: {
          ano: number
          ciudad: string | null
          created_at: string
          documentos_orden: boolean
          estado: string | null
          estado_auto: string
          fecha_registro: string
          id: string
          kilometraje: number
          marca: string
          modelo: string
          preferencia_contacto: string | null
          servicios_agencia: boolean
          updated_at: string
          user_id: string | null
          vendedor_correo: string
          vendedor_nombre: string
          vendedor_telefono: string
          version: string | null
        }
        Insert: {
          ano: number
          ciudad?: string | null
          created_at?: string
          documentos_orden?: boolean
          estado?: string | null
          estado_auto: string
          fecha_registro?: string
          id?: string
          kilometraje?: number
          marca: string
          modelo: string
          preferencia_contacto?: string | null
          servicios_agencia?: boolean
          updated_at?: string
          user_id?: string | null
          vendedor_correo: string
          vendedor_nombre: string
          vendedor_telefono: string
          version?: string | null
        }
        Update: {
          ano?: number
          ciudad?: string | null
          created_at?: string
          documentos_orden?: boolean
          estado?: string | null
          estado_auto?: string
          fecha_registro?: string
          id?: string
          kilometraje?: number
          marca?: string
          modelo?: string
          preferencia_contacto?: string | null
          servicios_agencia?: boolean
          updated_at?: string
          user_id?: string | null
          vendedor_correo?: string
          vendedor_nombre?: string
          vendedor_telefono?: string
          version?: string | null
        }
        Relationships: []
      }
      weekly_ad_credits: {
        Row: {
          created_at: string | null
          credits_consumed: number | null
          id: string
          user_id: string
          vehicle_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          credits_consumed?: number | null
          id?: string
          user_id: string
          vehicle_id: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          credits_consumed?: number | null
          id?: string
          user_id?: string
          vehicle_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_stats_profesional: {
        Args: { p_profesional_id: string }
        Returns: undefined
      }
      actualizar_stats_profesional_profesional: {
        Args: { p_profesional_id: string }
        Returns: undefined
      }
      aplicar_autoajuste_general: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_vehicle_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      consume_credits: {
        Args: {
          p_action_type: string
          p_credits: number
          p_resource_info?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      consume_credits_typed: {
        Args: {
          p_action_type: string
          p_credit_type?: string
          p_credits: number
          p_resource_info?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      evaluar_filtros_vehiculo: {
        Args: {
          p_ano: number
          p_kilometraje: number
          p_marca: string
          p_modelo: string
          p_precio_estimado?: number
          p_profesional_id: string
        }
        Returns: boolean
      }
      get_or_create_weekly_ad_credit: {
        Args: { p_user_id: string; p_vehicle_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_referral_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verificar_y_revelar_evaluaciones: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verificar_y_revelar_evaluaciones_cliente_profesional: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      tipo_negocio: "agencia_nuevos" | "seminuevos" | "comerciante"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      tipo_negocio: ["agencia_nuevos", "seminuevos", "comerciante"],
    },
  },
} as const
