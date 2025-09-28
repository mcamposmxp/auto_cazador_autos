import { useMemo } from 'react';

export const useOptimizedCharts = () => {
  const chartConfig = useMemo(() => ({
    // Configuración optimizada para gráficos
    animation: {
      duration: 300,
      easing: 'ease-out'
    },
    performance: {
      animationDuration: 300,
      isAnimationActive: false // Desactivar animaciones por defecto para mejor rendimiento
    }
  }), []);

  return chartConfig;
};

export const getOptimizedBarProps = () => ({
  isAnimationActive: false,
  animationDuration: 300
});

export const getOptimizedLineProps = () => ({
  isAnimationActive: false,
  animationDuration: 300,
  dot: false // Remover puntos para mejor rendimiento
});

export const getOptimizedPieProps = () => ({
  isAnimationActive: false,
  animationDuration: 300
});