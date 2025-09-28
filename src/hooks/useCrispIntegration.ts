import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';
import { useIsAdmin } from './useIsAdmin';
import { useIsProfessional } from './useIsProfessional';

// Crisp types
declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}

interface CrispConfig {
  websiteId: string;
}

const CRISP_CONFIG: CrispConfig = {
  websiteId: "1d6d877e-643c-4f60-8c8b-af2e16c6d78e"
};

const FAQ_RESPONSES = {
  // Preguntas generales
  "Preguntas frecuentes": "Aquí tienes las preguntas más comunes:\n\n• ¿Cómo funciona la valuación?\n• ¿Qué es Trust Service?\n• ¿Cómo obtengo más créditos?\n• ¿Cómo configuro el autoajuste?\n• ¿Cómo contacto un experto?\n\n¿Sobre cuál te gustaría saber más?",
  "Contactar soporte": "¡Perfecto! Estás en el lugar correcto. Puedes escribirme tu consulta aquí mismo y te ayudo de inmediato. También puedes:\n\n• Enviar un email a soporte@autopricelabs.com\n• Llamar al +54 11 1234-5678\n• Usar este chat en vivo\n\n¿En qué puedo ayudarte hoy?",
  "Ver tutoriales": "Te comparto los tutoriales más útiles:\n\n🎯 **Tutoriales Básicos:**\n• Cómo valuar tu auto paso a paso\n• Proceso completo de Trust Service\n• Sistema de créditos y planes\n\n🔧 **Tutoriales Avanzados:**\n• Configuración de autoajuste\n• Análisis de mercado\n• Red de profesionales B2B\n\n¿Hay algún tema específico que te interese?",
  
  // Preguntas específicas por funcionalidad
  "¿Cómo funciona la valuación?": "Nuestro sistema analiza múltiples fuentes de datos del mercado automotor para calcular el precio más preciso. Incluye estado del vehículo, historial, demanda regional y tendencias actuales.",
  "¿Cómo valuar mi auto?": "Para valuar tu auto correctamente:\n\n1. Ve a la sección 'Vender' en el menú\n2. Completa todos los datos del vehículo (marca, modelo, año, km, estado)\n3. Sube fotos claras del interior y exterior\n4. El sistema calculará automáticamente el precio de mercado\n5. Recibirás 3 modalidades de venta disponibles\n\n¿Necesitas ayuda con algún paso específico?",
  "¿Qué es Trust Service?": "Trust Service es nuestro servicio de verificación que garantiza la autenticidad de los vehículos y documentación. Incluye verificación técnica, legal y de identidad.",
  "¿Cómo obtengo más créditos?": "Puedes obtener créditos mediante: 1) Planes de suscripción 2) Sistema de referidos 3) Evaluaciones de profesionales 4) Promociones especiales.",
  "¿Cómo configuro el autoajuste?": "Ve a tu panel profesional > Configuración > Autoajuste. Puedes configurar rangos automáticos por categoría de vehículo y frecuencia de actualización.",
  "¿Cómo contacto un experto?": "Usa el chat en vivo, solicita una consulta desde cualquier vehículo, o ve a 'Contacto Experto' en el menú principal.",
  
  // Preguntas por sección
  "¿Cómo usar filtros?": "Para usar los filtros de búsqueda:\n\n1. En la página 'Comprar', usa la barra lateral izquierda\n2. Filtra por marca, modelo, año, precio, ubicación\n3. Aplica filtros avanzados como combustible, transmisión, etc.\n4. Los resultados se actualizan automáticamente\n5. Guarda tus búsquedas favoritas para revisarlas después",
  "¿Cómo contactar vendedor?": "Para contactar al vendedor:\n\n1. Haz clic en el vehículo que te interesa\n2. Usa el botón 'Contactar' en la ficha del auto\n3. Envía un mensaje directo o solicita más información\n4. Si tiene Trust Service, puedes coordinar una inspección\n5. Recuerda siempre verificar la documentación",
  "Modalidades de venta": "Tenemos 3 modalidades de venta:\n\n🏪 **Venta por Cuenta Propia**: Publicas y vendes directamente\n🤝 **Venta Asistida**: Te ayudamos con el proceso\n🚗 **Subasta Profesional**: Para ventas rápidas entre profesionales\n\nCada modalidad tiene diferentes comisiones y beneficios. ¿Te interesa alguna en particular?",
  "¿Cuánto tiempo toma vender?": "El tiempo de venta depende de varios factores:\n\n• **Cuenta propia**: 15-45 días promedio\n• **Venta asistida**: 10-30 días promedio\n• **Subasta profesional**: 1-7 días promedio\n\nFactores que afectan: precio, estado del vehículo, demanda del modelo, calidad de fotos y ubicación.",
  "Configurar autoajuste": "Para configurar el autoajuste de precios:\n\n1. Ve a Panel Profesional > Configuración\n2. Selecciona 'Autoajuste de Precios'\n3. Define rangos por categoría de vehículo\n4. Establece frecuencia de actualización\n5. Configura alertas de cambios de mercado\n\n¿Necesitas ayuda con alguna configuración específica?",
  "Gestionar inventario": "Para gestionar tu inventario profesional:\n\n1. Accede a 'Mis Autos' en el panel profesional\n2. Importa vehículos desde MercadoLibre u otras fuentes\n3. Configura precios automáticos o manuales\n4. Monitorea el rendimiento de cada publicación\n5. Usa analytics para optimizar tus ventas",
  "Red B2B": "La Red B2B te permite:\n\n• Acceder a inventario de otros profesionales\n• Realizar intercambios y ventas mayoristas\n• Participar en subastas exclusivas\n• Obtener precios preferenciales\n• Expandir tu catálogo sin inversión inicial\n\n¿Te interesa activar tu cuenta B2B?",
  "Interpretar gráficos": "Los gráficos de analytics muestran:\n\n📊 **Tendencias de precio**: Evolución temporal del mercado\n📈 **Volumen de ventas**: Cantidad de transacciones por período\n🎯 **Demanda regional**: Preferencias por zona geográfica\n📋 **Comparativo de modelos**: Rendimiento entre diferentes vehículos\n\n¿Hay algún gráfico específico que no entiendes?",
  "Exportar datos": "Para exportar datos de analytics:\n\n1. Ve a la sección Analytics\n2. Selecciona el período y filtros deseados\n3. Haz clic en 'Exportar' (Excel/PDF)\n4. Los reportes incluyen gráficos y tablas detalladas\n5. Ideal para presentaciones y análisis externos",
  "Configurar alertas": "Configura alertas para:\n\n🔔 **Cambios de precio**: Cuando un modelo sube/baja significativamente\n📧 **Nuevos competidores**: Cuando aparecen autos similares\n⏰ **Tiempo en stock**: Vehículos que no se venden en X días\n📊 **Oportunidades**: Autos con precio muy por debajo del mercado\n\n¿Qué tipo de alerta te interesa configurar?",
  "Dashboard admin": "El dashboard administrativo incluye:\n\n👥 **Gestión de usuarios**: Altas, bajas, roles\n📊 **Métricas del sistema**: Uso, rendimiento, errores\n💰 **Control financiero**: Facturación, comisiones\n🔧 **Configuración**: Parámetros del sistema\n🛡️ **Seguridad**: Logs, accesos, auditoría",
  "Gestión usuarios": "Para gestionar usuarios:\n\n1. Accede a Administración > Usuarios\n2. Busca por email, rol o estado\n3. Modifica permisos y roles\n4. Consulta historial de actividad\n5. Gestiona suspensiones y reactivaciones\n\n¿Necesitas hacer alguna gestión específica?",
  "Reportes sistema": "Los reportes del sistema incluyen:\n\n📈 **Uso de la plataforma**: Usuarios activos, páginas vistas\n💼 **Actividad comercial**: Ventas, comisiones, conversiones\n🔧 **Rendimiento técnico**: Tiempos de respuesta, errores\n🛡️ **Seguridad**: Intentos de acceso, actividad sospechosa\n📊 **Analytics avanzados**: Tendencias y predicciones"
};

const getPageContext = (pathname: string) => {
  const contexts: Record<string, { segment: string; helpText: string; quickActions: string[] }> = {
    '/': { 
      segment: 'landing', 
      helpText: '¿Necesitas ayuda para empezar?',
      quickActions: ['¿Cómo valuar mi auto?', '¿Cómo comprar?', 'Ver planes']
    },
    '/comprar': { 
      segment: 'comprador', 
      helpText: '¿Dudas sobre la compra?',
      quickActions: ['¿Cómo usar filtros?', '¿Qué es Trust Service?', 'Contactar vendedor']
    },
    '/vender': { 
      segment: 'vendedor', 
      helpText: '¿Ayuda para vender tu auto?',
      quickActions: ['¿Cómo valuar?', 'Modalidades de venta', '¿Cuánto tiempo toma?']
    },
    '/profesionales': { 
      segment: 'profesional', 
      helpText: '¿Dudas sobre herramientas profesionales?',
      quickActions: ['Configurar autoajuste', 'Gestionar inventario', 'Red B2B']
    },
    '/analytics': { 
      segment: 'profesional-analytics', 
      helpText: '¿Ayuda con análisis de mercado?',
      quickActions: ['Interpretar gráficos', 'Exportar datos', 'Configurar alertas']
    },
    '/administracion': { 
      segment: 'admin', 
      helpText: '¿Necesitas ayuda administrativa?',
      quickActions: ['Dashboard admin', 'Gestión usuarios', 'Reportes sistema']
    }
  };

  return contexts[pathname] || { 
    segment: 'general', 
    helpText: '¿En qué puedo ayudarte?',
    quickActions: ['Preguntas frecuentes', 'Contactar soporte', 'Ver tutoriales']
  };
};

export function useCrispIntegration() {
  const { user, loading } = useAuthSession();
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { isProfessional } = useIsProfessional();

  useEffect(() => {
    if (loading) return;

    // Evitar múltiples inicializaciones
    if (window.$crisp && Array.isArray(window.$crisp) && window.$crisp.length > 0) {
      console.log('Crisp ya está inicializado');
      return;
    }

    console.log('Iniciando Crisp Chat por primera vez...');
    
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_CONFIG.websiteId;
    
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    script.onload = () => {
      console.log('Script de Crisp cargado exitosamente');
    };
    script.onerror = () => {
      console.error('Error al cargar el script de Crisp');
    };
    document.getElementsByTagName("head")[0].appendChild(script);

  }, [loading]); // Solo depende de loading

  useEffect(() => {
    if (!window.$crisp || loading) return;

    // Configure user information
    if (user) {
      window.$crisp.push(["set", "user:email", user.email]);
      window.$crisp.push(["set", "user:nickname", user.email?.split('@')[0] || 'Usuario']);
      
      // Set user segments based on role
      const segments = ["usuario-registrado"];
      if (isAdmin) segments.push("administrador");
      if (isProfessional) segments.push("profesional");
      else segments.push("particular");
      
      window.$crisp.push(["set", "session:segments", segments]);
    } else {
      window.$crisp.push(["set", "session:segments", ["visitante"]]);
    }

    // Configure company info
    window.$crisp.push(["set", "user:company", "AutoPriceLabs"]);
    
    // Set page context
    const context = getPageContext(location.pathname);
    window.$crisp.push(["set", "session:data", [
      ["página_actual", location.pathname],
      ["contexto", context.segment],
      ["rol_usuario", isAdmin ? "admin" : isProfessional ? "profesional" : "particular"]
    ]]);

  }, [user, loading, location.pathname, isAdmin, isProfessional]);

  // Helper functions for manual control
  const openChat = () => {
    console.log('Intentando abrir chat, window.$crisp:', !!window.$crisp);
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
      console.log('Comando de abrir chat enviado');
    } else {
      console.error('Crisp no está disponible');
    }
  };

  const sendMessage = (message: string) => {
    if (window.$crisp) {
      window.$crisp.push(["do", "message:send", ["text", message]]);
    }
  };

  const showHelp = (topic: string) => {
    console.log('showHelp llamado con topic:', topic);
    console.log('window.$crisp disponible:', !!window.$crisp);
    
    const response = FAQ_RESPONSES[topic as keyof typeof FAQ_RESPONSES];
    console.log('Respuesta encontrada:', !!response);
    
    if (window.$crisp) {
      openChat();
      if (response) {
        setTimeout(() => {
          window.$crisp.push(["do", "message:send", ["text", response]]);
          console.log('Mensaje automático enviado');
        }, 500);
      } else {
        // Si no encuentra la respuesta, envía la consulta como mensaje del usuario
        setTimeout(() => {
          window.$crisp.push(["do", "message:send", ["text", `Hola, necesito ayuda con: ${topic}`]]);
          console.log('Consulta genérica enviada');
        }, 500);
      }
    } else {
      console.error('No se puede enviar mensaje, Crisp no está disponible');
    }
  };

  return {
    openChat,
    sendMessage,
    showHelp,
    isLoaded: !!window.$crisp
  };
}