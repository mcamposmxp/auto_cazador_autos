import { supabase } from "@/integrations/supabase/client";

// Define public fields that can be shown to all users
const PUBLIC_FIELDS = [
  'id', 'titulo', 'marca', 'modelo', 'ano', 'precio', 'precio_original',
  'kilometraje', 'kilometraje_original', 'color', 'tipo_vehiculo', 
  'transmision', 'combustible', 'ubicacion', 'descripcion', 'caracteristicas',
  'imagenes', 'datos_raw', 'fecha_extraccion', 'fecha_actualizacion',
  'sitio_web', 'url_anuncio', 'hash_contenido', 'estado_normalizacion',
  'activo', 'created_at', 'updated_at'
];

// Contact fields that should only be visible to professionals
const CONTACT_FIELDS = ['email', 'telefono'];

// All fields including contact information
const ALL_FIELDS = [...PUBLIC_FIELDS, ...CONTACT_FIELDS];

/**
 * Get appropriate field selection based on user permissions
 * @returns Field selection string for Supabase query
 */
export async function getVehicleFieldSelection(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      // Anonymous users - only public fields
      return PUBLIC_FIELDS.join(', ');
    }

    // Check if user is a professional
    const { data: professional, error } = await supabase
      .from('profesionales')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      console.error('Error checking professional status:', error);
      // Default to public fields for security
      return PUBLIC_FIELDS.join(', ');
    }

    if (professional) {
      // Professionals can see all fields including contact info
      return ALL_FIELDS.join(', ');
    } else {
      // Regular authenticated users - only public fields
      return PUBLIC_FIELDS.join(', ');
    }
  } catch (error) {
    console.error('Error determining field selection:', error);
    // Default to public fields for security
    return PUBLIC_FIELDS.join(', ');
  }
}

/**
 * Filter vehicle data to remove contact information for non-professionals
 * @param vehicleData Array of vehicle records
 * @param includeContactInfo Whether to include contact information
 * @returns Filtered vehicle data
 */
export function filterVehicleData(vehicleData: any[], includeContactInfo: boolean = false) {
  if (includeContactInfo) {
    return vehicleData;
  }

  return vehicleData.map(vehicle => {
    const filtered = { ...vehicle };
    // Remove contact fields
    CONTACT_FIELDS.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  });
}

/**
 * Check if current user is a professional
 * @returns Promise<boolean>
 */
export async function isCurrentUserProfessional(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data: professional } = await supabase
      .from('profesionales')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('activo', true)
      .maybeSingle();

    return !!professional;
  } catch (error) {
    console.error('Error checking professional status:', error);
    return false;
  }
}