// Utility functions for price analysis calculations

export interface AutoSimilar {
  id: string;
  titulo: string;
  precio: number;
  kilometraje: number;
  ano: number;
  ubicacion: string;
  sitio_web: string;
  url_anuncio: string;
}

export interface DatosVehiculo {
  marca: string;
  modelo: string;
  ano: number;
  version: string;
  versionId?: string;
  kilometraje: number;
  estado: string;
  ciudad: string;
}

// Interfaz ligera para cálculo de kilometraje (solo requiere kilometraje y año)
export interface AutoKilometraje {
  kilometraje: number;
  ano: number;
}

export const calcularFactorKilometraje = (
  kilometrajeSeleccionado: number, 
  autosSimilares: AutoKilometraje[], 
  datos: DatosVehiculo
) => {
  if (autosSimilares.length === 0 || kilometrajeSeleccionado === 0) return 1;
  
  const kilometrajes = autosSimilares.map(auto => auto.kilometraje).filter(km => km > 0);
  if (kilometrajes.length === 0) return 1;
  
  const anoActual = new Date().getFullYear();
  const antiguedad = anoActual - datos.ano;
  const kmAnualEsperado = 15000; // Promedio mexicano
  const kmEsperadoTotal = antiguedad * kmAnualEsperado;
  
  const factorKmVsEsperado = kilometrajeSeleccionado / kmEsperadoTotal;
  
  let factor = 1;
  
  if (factorKmVsEsperado <= 0.5) {
    factor = 1.12; // Muy poco kilometraje (+12%)
  } else if (factorKmVsEsperado <= 0.7) {
    factor = 1.08; // Poco kilometraje (+8%)
  } else if (factorKmVsEsperado <= 0.9) {
    factor = 1.04; // Ligeramente bajo (+4%)
  } else if (factorKmVsEsperado <= 1.1) {
    factor = 1; // Normal (sin cambio)
  } else if (factorKmVsEsperado <= 1.3) {
    factor = 0.96; // Ligeramente alto (-4%)
  } else if (factorKmVsEsperado <= 1.5) {
    factor = 0.92; // Alto (-8%)
  } else {
    factor = 0.85; // Muy alto (-15%)
  }
  
  const limiteSuperior = 1.15;
  const limiteInferior = 0.75;
  
  return Math.max(limiteInferior, Math.min(limiteSuperior, factor));
};

export const calcularPrecioVentaEstimado = (precioRecomendado: number) => {
  const minimo = Math.round(precioRecomendado * 0.85);
  const maximo = Math.round(precioRecomendado * 0.95);
  return { minimo, maximo };
};

export const calcularTiempoVenta = (precioRecomendado: number, precioPromedio: number) => {
  if (precioRecomendado <= precioPromedio * 0.9) {
    return "7-15 días";
  } else if (precioRecomendado <= precioPromedio * 1.1) {
    return "15-30 días";
  } else {
    return "30-60 días";
  }
};

export const calcularSugerenciaAjuste = (precioRecomendado: number, precioPromedio: number) => {
  const diferencia = ((precioRecomendado - precioPromedio) / precioPromedio) * 100;
  
  if (diferencia > 10) {
    return {
      tipo: "reducir",
      porcentaje: 15,
      beneficio: "vender en 7-10 días",
      color: "destructive"
    };
  } else if (diferencia < -10) {
    return {
      tipo: "aumentar",
      porcentaje: 10,
      beneficio: "mejor rentabilidad",
      color: "default"
    };
  } else {
    return {
      tipo: "mantener",
      porcentaje: 0,
      beneficio: "Mantener un precio en rango promedio",
      color: "default"
    };
  }
};

// Función auxiliar para calcular la moda (precio que más se repite)
const calcularModa = (precios: number[]): number | null => {
  if (precios.length === 0) return null;
  
  const frecuencias = new Map<number, number>();
  precios.forEach(precio => {
    frecuencias.set(precio, (frecuencias.get(precio) || 0) + 1);
  });
  
  let maxFrecuencia = 0;
  let moda = precios[0];
  
  frecuencias.forEach((frecuencia, precio) => {
    if (frecuencia > maxFrecuencia) {
      maxFrecuencia = frecuencia;
      moda = precio;
    }
  });
  
  // Solo retornar moda si se repite al menos 2 veces
  return maxFrecuencia > 1 ? moda : null;
};

// Función auxiliar para calcular cuartiles y percentiles
const calcularCuartiles = (precios: number[]) => {
  const sorted = [...precios].sort((a, b) => a - b);
  const n = sorted.length;
  
  const getPercentil = (p: number) => {
    const index = Math.ceil(n * p) - 1;
    return sorted[Math.max(0, Math.min(index, n - 1))];
  };
  
  return {
    Q0: sorted[0], // Mínimo
    Q1: getPercentil(0.25),
    Q2: getPercentil(0.50), // Mediana
    Q3: getPercentil(0.75),
    Q4: sorted[n - 1], // Máximo
    P90: getPercentil(0.90)
  };
};

// Distribución basada en cuartiles (para muestras >= 12)
const calcularDistribucionPorCuartiles = (precios: number[], autosSimilares: AutoSimilar[]) => {
  const cuartiles = calcularCuartiles(precios);
  const { Q0: min, Q1, Q2, Q3, Q4: max, P90 } = cuartiles;
  
  const rangos = [
    { nombre: "Muy Bajo", inicio: min, fin: Q1 },
    { nombre: "Bajo", inicio: Q1, fin: Q2 },
    { nombre: "Promedio", inicio: Q2, fin: Q3 },
    { nombre: "Alto", inicio: Q3, fin: P90 },
    { nombre: "Muy Alto", inicio: P90, fin: max }
  ];
  
  return rangos.map((rango, index) => {
    const autosEnRango = autosSimilares.filter(auto => {
      if (index === rangos.length - 1) {
        // Último rango incluye el límite superior
        return auto.precio >= rango.inicio && auto.precio <= rango.fin;
      }
      return auto.precio >= rango.inicio && auto.precio < rango.fin;
    }).length;
    
    return {
      inicio: rango.inicio,
      fin: rango.fin,
      cantidad: autosEnRango,
      porcentaje: (autosEnRango / autosSimilares.length) * 100,
      metodo: 'cuartiles' as const
    };
  });
};

// Distribución fija mejorada (para muestras < 12)
const calcularDistribucionFijaInteligente = (precios: number[], autosSimilares: AutoSimilar[]) => {
  const precioMinimo = Math.min(...precios);
  const precioMaximo = Math.max(...precios);
  
  // Si todos los precios son iguales
  if (precioMinimo === precioMaximo) {
    return [{
      inicio: precioMinimo,
      fin: precioMaximo,
      cantidad: precios.length,
      porcentaje: 100,
      metodo: 'fijo' as const
    }];
  }
  
  // Intentar usar desviación estándar si hay suficientes datos
  if (precios.length >= 5) {
    const promedio = precios.reduce((a, b) => a + b, 0) / precios.length;
    const varianza = precios.reduce((acc, p) => acc + Math.pow(p - promedio, 2), 0) / precios.length;
    const desviacion = Math.sqrt(varianza);
    
    // Crear rangos basados en desviaciones estándar
    const rangos = [
      { inicio: precioMinimo, fin: promedio - desviacion },
      { inicio: promedio - desviacion, fin: promedio - (desviacion * 0.5) },
      { inicio: promedio - (desviacion * 0.5), fin: promedio + (desviacion * 0.5) },
      { inicio: promedio + (desviacion * 0.5), fin: promedio + desviacion },
      { inicio: promedio + desviacion, fin: precioMaximo }
    ];
    
    return rangos.map((rango, index) => {
      const autosEnRango = autosSimilares.filter(auto => {
        if (index === 0) {
          return auto.precio >= rango.inicio && auto.precio < rango.fin;
        } else if (index === rangos.length - 1) {
          return auto.precio >= rango.inicio && auto.precio <= rango.fin;
        }
        return auto.precio >= rango.inicio && auto.precio < rango.fin;
      }).length;
      
      return {
        inicio: Math.max(precioMinimo, rango.inicio),
        fin: Math.min(precioMaximo, rango.fin),
        cantidad: autosEnRango,
        porcentaje: (autosEnRango / autosSimilares.length) * 100,
        metodo: 'desviacion' as const
      };
    });
  }
  
  // Fallback: distribución lineal simple
  const rango = precioMaximo - precioMinimo;
  const numRangos = 5;
  const tamanoRango = rango / numRangos;
  
  const rangos = [];
  for (let i = 0; i < numRangos; i++) {
    const inicio = precioMinimo + (i * tamanoRango);
    const fin = inicio + tamanoRango;
    const autosEnRango = autosSimilares.filter(auto => 
      auto.precio >= inicio && auto.precio < (i === numRangos - 1 ? fin + 1 : fin)
    ).length;
    
    rangos.push({
      inicio,
      fin,
      cantidad: autosEnRango,
      porcentaje: (autosEnRango / autosSimilares.length) * 100,
      metodo: 'lineal' as const
    });
  }
  
  return rangos;
};

// Función principal que decide qué método usar
export const calcularDistribucionPrecios = (autosSimilares: AutoSimilar[]) => {
  if (autosSimilares.length === 0) return { distribucion: [], cuartiles: null, moda: null };
  
  const precios = autosSimilares.map(auto => auto.precio).filter(p => p > 0);
  if (precios.length === 0) return { distribucion: [], cuartiles: null, moda: null };
  
  const MUESTRA_MINIMA_CUARTILES = 12;
  const moda = calcularModa(precios);
  
  // Decidir método según tamaño de muestra
  if (precios.length >= MUESTRA_MINIMA_CUARTILES) {
    const cuartiles = calcularCuartiles(precios);
    const distribucion = calcularDistribucionPorCuartiles(precios, autosSimilares);
    return { 
      distribucion, 
      cuartiles: {
        Q0: cuartiles.Q0,
        Q1: cuartiles.Q1,
        Q2: cuartiles.Q2,
        Q3: cuartiles.Q3,
        Q4: cuartiles.Q4
      },
      moda
    };
  } else {
    return { 
      distribucion: calcularDistribucionFijaInteligente(precios, autosSimilares), 
      cuartiles: null,
      moda
    };
  }
};

export const calcularDemandaAuto = (autosSimilares: AutoSimilar[], datos: DatosVehiculo, estadisticas: any) => {
  const anoActual = new Date().getFullYear();
  const antiguedad = anoActual - datos.ano;
  const totalAnuncios = autosSimilares.length;
  
  // Clasificación principal basada en las reglas del debug
  let nivelDemanda: string;
  let descripcion: string;
  let icono: string;
  let color: string;
  let bgColor: string;
  let borderColor: string;

  if (totalAnuncios > 15) {
    nivelDemanda = "Alta demanda";
    descripcion = "Buena demanda del mercado";
    icono = "TrendingUp";
    color = "text-green-600";
    bgColor = "bg-green-50";
    borderColor = "border-green-200";
  } else if (totalAnuncios >= 5) {
    nivelDemanda = "Demanda moderada";
    descripcion = "Demanda equilibrada";
    icono = "BarChart3";
    color = "text-blue-600";
    bgColor = "bg-blue-50";
    borderColor = "border-blue-200";
  } else {
    nivelDemanda = "Baja demanda";
    descripcion = "Demanda limitada";
    icono = "AlertTriangle";
    color = "text-orange-600";
    bgColor = "bg-orange-50";
    borderColor = "border-orange-200";
  }

  // Aplicar ajustes por factores adicionales (antigüedad, marca)
  const marcasAlta = ['Toyota', 'Honda', 'Mazda', 'Subaru'];
  const marcasMedia = ['Nissan', 'Chevrolet', 'Ford', 'Volkswagen', 'Hyundai', 'Kia'];
  
  let ajustePorMarca = 0;
  if (marcasAlta.includes(datos.marca)) {
    ajustePorMarca = 1;
  } else if (marcasMedia.includes(datos.marca)) {
    ajustePorMarca = 0;
  } else {
    ajustePorMarca = -1;
  }

  let ajustePorAntiguedad = 0;
  if (antiguedad <= 2) {
    ajustePorAntiguedad = 1;
  } else if (antiguedad <= 5) {
    ajustePorAntiguedad = 0;
  } else {
    ajustePorAntiguedad = -1;
  }

  // Solo aplicar upgrade a "Muy alta demanda" si tiene factores muy positivos
  if (nivelDemanda === "Alta demanda" && ajustePorMarca === 1 && ajustePorAntiguedad === 1) {
    nivelDemanda = "Muy alta demanda";
    descripcion = "Modelo muy solicitado";
    icono = "Flame";
    color = "text-red-600";
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
  }

  return {
    nivel: nivelDemanda,
    descripcion: descripcion,
    icono: icono,
    color: color,
    bgColor: bgColor,
    borderColor: borderColor
  };
};

import { supabase } from "@/integrations/supabase/client";

// Nueva función para obtener datos de competencia desde maxi_similar_cars
export const obtenerDatosCompetenciaMaxi = async (versionId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('maxi_similar_cars', {
      body: { versionId }
    });
    
    if (error) throw error;
    
    return {
      totalAnuncios: data?.similarsCars?.length || 0,
      similarsCars: data?.similarsCars || []
    };
  } catch (error) {
    console.error('Error al obtener datos de competencia:', error);
    return { totalAnuncios: 0, similarsCars: [] };
  }
};

// Nueva función asíncrona que usa datos de maxi_similar_cars
export const calcularCompetenciaMercadoMaxi = async (
  versionId: string,
  estadoSeleccionado: string, 
  tipoVendedorSeleccionado: string
) => {
  const { totalAnuncios, similarsCars } = await obtenerDatosCompetenciaMaxi(versionId);
  
  // Análisis de competencia considerando también filtros activos
  let factorCompetencia = totalAnuncios;
  
  // Ajustar según filtros aplicados (menos filtros = más competencia general)
  if (estadoSeleccionado === "todos") {
    factorCompetencia *= 1.3; // Más competencia al ver todo el país
  }
  if (tipoVendedorSeleccionado === "todos") {
    factorCompetencia *= 1.2; // Más competencia incluyendo ambos tipos
  }
  
  // Análisis de dispersión de precios para entender la competencia
  let intensidadCompetencia = "normal";
  if (similarsCars.length > 1) {
    const precios = similarsCars.map((auto: any) => auto.price).filter((p: number) => p > 0);
    if (precios.length > 1) {
      const precioPromedio = precios.reduce((a: number, b: number) => a + b, 0) / precios.length;
      const varianza = precios.reduce((acc: number, precio: number) => acc + Math.pow(precio - precioPromedio, 2), 0) / precios.length;
      const coeficienteVariacion = Math.sqrt(varianza) / precioPromedio;
      
      if (coeficienteVariacion > 0.4) {
        intensidadCompetencia = "agresiva"; // Precios muy dispersos = competencia agresiva
      } else if (coeficienteVariacion < 0.15) {
        intensidadCompetencia = "estable"; // Precios similares = mercado estable
      }
    }
  }
  
  if (factorCompetencia <= 4) {
    return {
      nivel: "Muy baja competencia",
      descripcion: "Excelente oportunidad de venta",
      icono: "Shield",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia
    };
  } else if (factorCompetencia <= 8) {
    return {
      nivel: "Baja competencia",
      descripcion: "Buenas condiciones del mercado",
      icono: "TrendingUp",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia
    };
  } else if (factorCompetencia <= 15) {
    return {
      nivel: "Competencia moderada",
      descripcion: "Mercado equilibrado",
      icono: "BarChart3",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia
    };
  } else if (factorCompetencia <= 25) {
    return {
      nivel: "Alta competencia",
      descripcion: "Mercado muy competitivo",
      icono: "AlertTriangle",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia
    };
  } else {
    return {
      nivel: "Competencia extrema",
      descripcion: "Mercado saturado",
      icono: "TrendingDown",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia
    };
  }
};

export const calcularCompetenciaMercado = (
  autosSimilares: AutoSimilar[], 
  estadoSeleccionado: string, 
  tipoVendedorSeleccionado: string
) => {
  const totalAnuncios = autosSimilares.length;
  
  // Análisis de competencia considerando también filtros activos
  let factorCompetencia = totalAnuncios;
  
  // Ajustar según filtros aplicados (menos filtros = más competencia general)
  if (estadoSeleccionado === "todos") {
    factorCompetencia *= 1.3; // Más competencia al ver todo el país
  }
  if (tipoVendedorSeleccionado === "todos") {
    factorCompetencia *= 1.2; // Más competencia incluyendo ambos tipos
  }
  
  // Análisis de dispersión de precios para entender la competencia
  let intensidadCompetencia = "normal";
  let coeficienteVariacion = 0;
  
  if (autosSimilares.length > 1) {
    const precios = autosSimilares.map(auto => auto.precio).filter(p => p > 0);
    if (precios.length > 1) {
      const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length;
      const varianza = precios.reduce((acc, precio) => acc + Math.pow(precio - precioPromedio, 2), 0) / precios.length;
      coeficienteVariacion = Math.sqrt(varianza) / precioPromedio;
      
      if (coeficienteVariacion > 0.4) {
        intensidadCompetencia = "agresiva"; // Precios muy dispersos = competencia agresiva
      } else if (coeficienteVariacion < 0.15) {
        intensidadCompetencia = "estable"; // Precios similares = mercado estable
      }
    }
  }
  
  if (factorCompetencia <= 4) {
    return {
      nivel: "Muy baja competencia",
      descripcion: "Excelente oportunidad de venta",
      icono: "Shield",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia,
      factorCompetencia,
      coeficienteVariacion
    };
  } else if (factorCompetencia <= 8) {
    return {
      nivel: "Baja competencia",
      descripcion: "Buenas condiciones del mercado",
      icono: "TrendingUp",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia,
      factorCompetencia,
      coeficienteVariacion
    };
  } else if (factorCompetencia <= 15) {
    return {
      nivel: "Competencia moderada",
      descripcion: "Mercado equilibrado",
      icono: "BarChart3",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia,
      factorCompetencia,
      coeficienteVariacion
    };
  } else if (factorCompetencia <= 25) {
    return {
      nivel: "Alta competencia",
      descripcion: "Mercado muy competitivo",
      icono: "AlertTriangle",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia,
      factorCompetencia,
      coeficienteVariacion
    };
  } else {
    return {
      nivel: "Competencia extrema",
      descripcion: "Mercado saturado",
      icono: "TrendingDown",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      cantidad: totalAnuncios,
      intensidad: intensidadCompetencia,
      factorCompetencia,
      coeficienteVariacion
    };
  }
};