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

export const calcularFactorKilometraje = (
  kilometrajeSeleccionado: number, 
  autosSimilares: AutoSimilar[], 
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

export const calcularDistribucionPrecios = (autosSimilares: AutoSimilar[]) => {
  if (autosSimilares.length === 0) return [];
  
  const precios = autosSimilares.map(auto => auto.precio).filter(p => p > 0);
  if (precios.length === 0) return [];
  
  const precioMinimo = Math.min(...precios);
  const precioMaximo = Math.max(...precios);
  
  // Evitar división por cero
  if (precioMinimo === precioMaximo) {
    return [{
      inicio: precioMinimo,
      fin: precioMaximo,
      cantidad: precios.length,
      porcentaje: 100
    }];
  }
  
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
      porcentaje: (autosEnRango / autosSimilares.length) * 100
    });
  }
  
  return rangos;
};

export const calcularDemandaAuto = (autosSimilares: AutoSimilar[], datos: DatosVehiculo, estadisticas: any) => {
  const anoActual = new Date().getFullYear();
  const antiguedad = anoActual - datos.ano;
  const totalAnuncios = autosSimilares.length;
  
  let puntajeDemanda = 0;
  
  // Factor 1: Antigüedad del vehículo (35% del peso)
  if (antiguedad <= 2) {
    puntajeDemanda += 35; // Vehículos muy nuevos
  } else if (antiguedad <= 5) {
    puntajeDemanda += 28; // Vehículos nuevos
  } else if (antiguedad <= 8) {
    puntajeDemanda += 20; // Vehículos de edad media
  } else if (antiguedad <= 12) {
    puntajeDemanda += 12; // Vehículos usados
  } else {
    puntajeDemanda += 5; // Vehículos antiguos
  }
  
  // Factor 2: Análisis de competencia/oferta (30% del peso)
  if (totalAnuncios <= 3) {
    puntajeDemanda += 30; // Muy poca oferta = alta demanda
  } else if (totalAnuncios <= 8) {
    puntajeDemanda += 22; // Poca oferta = demanda buena
  } else if (totalAnuncios <= 15) {
    puntajeDemanda += 15; // Oferta moderada
  } else if (totalAnuncios <= 25) {
    puntajeDemanda += 8; // Mucha oferta
  } else {
    puntajeDemanda += 3; // Oferta excesiva = baja demanda
  }
  
  // Factor 3: Análisis de precios del mercado (20% del peso)
  if (estadisticas.precioRecomendado > 0) {
    const dispersionPrecios = autosSimilares.length > 1 ? 
      Math.abs(estadisticas.precioMaximo - estadisticas.precioMinimo) / estadisticas.precioPromedio : 0;
    
    if (dispersionPrecios < 0.3) {
      puntajeDemanda += 20; // Precios estables = demanda consistente
    } else if (dispersionPrecios < 0.6) {
      puntajeDemanda += 12; // Variación moderada
    } else {
      puntajeDemanda += 5; // Alta variación = mercado inestable
    }
  }
  
  // Factor 4: Análisis por marca (15% del peso)
  const marcasAlta = ['Toyota', 'Honda', 'Mazda', 'Subaru'];
  const marcasMedia = ['Nissan', 'Chevrolet', 'Ford', 'Volkswagen', 'Hyundai', 'Kia'];
  
  if (marcasAlta.includes(datos.marca)) {
    puntajeDemanda += 15;
  } else if (marcasMedia.includes(datos.marca)) {
    puntajeDemanda += 10;
  } else {
    puntajeDemanda += 5;
  }
  
  // Determinar nivel de demanda
  if (puntajeDemanda >= 75) {
    return {
      nivel: "Muy alta demanda",
      descripcion: "Modelo muy solicitado",
      icono: "Flame",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    };
  } else if (puntajeDemanda >= 55) {
    return {
      nivel: "Alta demanda",
      descripcion: "Buena demanda del mercado",
      icono: "TrendingUp",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    };
  } else if (puntajeDemanda >= 35) {
    return {
      nivel: "Demanda moderada",
      descripcion: "Demanda equilibrada",
      icono: "BarChart3",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    };
  } else if (puntajeDemanda >= 20) {
    return {
      nivel: "Baja demanda",
      descripcion: "Demanda limitada",
      icono: "AlertTriangle",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    };
  } else {
    return {
      nivel: "Muy baja demanda",
      descripcion: "Mercado saturado",
      icono: "TrendingDown",
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
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
  if (autosSimilares.length > 1) {
    const precios = autosSimilares.map(auto => auto.precio).filter(p => p > 0);
    if (precios.length > 1) {
      const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length;
      const varianza = precios.reduce((acc, precio) => acc + Math.pow(precio - precioPromedio, 2), 0) / precios.length;
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