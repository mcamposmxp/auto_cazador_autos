import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  User,
  Settings,
  Target,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, formatNumber } from '@/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ConfiguradorFiltrosOfertas } from '@/components/ConfiguradorFiltrosOfertas';

interface ProfessionalStats {
  totalInventory: number;
  averagePrice: number;
  totalValue: number;
  activeListings: number;
  viewsThisMonth: number;
  inquiriesThisMonth: number;
}

interface ProfessionalProfile {
  id: string;
  negocio_nombre: string;
  razon_social: string;
  rfc: string;
  direccion_ciudad: string;
  direccion_estado: string;
  telefono: string;
  correo: string;
  notas: string;
}

export function ProfessionalTools() {
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuthSession();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfessionalData();
    }
  }, [user]);

  const loadProfessionalData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Obtener datos del profesional
      const { data: professionalData, error: profError } = await supabase
        .from('profesionales')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profError && profError.code !== 'PGRST116') throw profError;

      if (professionalData) {
        setProfile({
          id: professionalData.id,
          negocio_nombre: professionalData.negocio_nombre || '',
          razon_social: professionalData.razon_social || '',
          rfc: professionalData.rfc || '',
          direccion_ciudad: professionalData.direccion_ciudad || '',
          direccion_estado: professionalData.direccion_estado || '',
          telefono: professionalData.telefono || '',
          correo: professionalData.correo || '',
          notas: professionalData.notas || ''
        });

        // Obtener inventario
        const { data: inventoryData } = await supabase
          .from('autos_profesional_inventario')
          .select('precio_actual, estado')
          .eq('profesional_id', professionalData.id);

        // Calcular estadísticas
        const activeListings = inventoryData?.filter(item => item.estado === 'activo').length || 0;
        const totalInventory = inventoryData?.length || 0;
        const averagePrice = inventoryData?.length 
          ? inventoryData.reduce((sum, item) => sum + (item.precio_actual || 0), 0) / inventoryData.length 
          : 0;
        const totalValue = inventoryData?.reduce((sum, item) => sum + (item.precio_actual || 0), 0) || 0;

        setStats({
          totalInventory,
          averagePrice,
          totalValue,
          activeListings,
          viewsThisMonth: Math.floor(Math.random() * 500) + 100, // Simulado
          inquiriesThisMonth: Math.floor(Math.random() * 50) + 10 // Simulado
        });
      }
    } catch (error) {
      console.error('Error loading professional data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del profesional",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedProfile: Partial<ProfessionalProfile>) => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profesionales')
        .update(updatedProfile)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updatedProfile });
      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados correctamente"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Profesional Requerido</CardTitle>
          <CardDescription>
            Esta sección está disponible solo para usuarios profesionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Solicitar Acceso Profesional</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Herramientas Profesionales</h2>
        <p className="text-muted-foreground">
          Gestiona tu negocio y analiza el rendimiento de tu inventario
        </p>
      </div>

      {/* KPIs del negocio */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventario Total</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalInventory)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeListings} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {formatPrice(stats.averagePrice)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vistas Este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.viewsThisMonth)}</div>
              <p className="text-xs text-muted-foreground">
                +12% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.inquiriesThisMonth)}</div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Herramientas principales */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="inventory">Gestión de Inventario</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tools">Herramientas</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Negocio
              </CardTitle>
              <CardDescription>
                Actualiza la información de tu empresa o lote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="negocio_nombre">Nombre del Negocio</Label>
                  <Input
                    id="negocio_nombre"
                    value={profile.negocio_nombre || ''}
                    onChange={(e) => setProfile({ ...profile, negocio_nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social</Label>
                  <Input
                    id="razon_social"
                    value={profile.razon_social || ''}
                    onChange={(e) => setProfile({ ...profile, razon_social: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={profile.rfc || ''}
                    onChange={(e) => setProfile({ ...profile, rfc: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={profile.telefono || ''}
                    onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={profile.correo || ''}
                    onChange={(e) => setProfile({ ...profile, correo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion_ciudad">Ciudad</Label>
                  <Input
                    id="direccion_ciudad"
                    value={profile.direccion_ciudad || ''}
                    onChange={(e) => setProfile({ ...profile, direccion_ciudad: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={profile.notas || ''}
                  onChange={(e) => setProfile({ ...profile, notas: e.target.value })}
                  placeholder="Información adicional sobre tu negocio..."
                />
              </div>
              <Button 
                onClick={() => updateProfile(profile)}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filtros" className="space-y-4">
          <ConfiguradorFiltrosOfertas profesionalId={profile?.id || ''} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Gestión de Inventario
              </CardTitle>
              <CardDescription>
                Herramientas para administrar tu inventario de vehículos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Car className="h-6 w-6 mb-2" />
                  <span>Agregar Vehículo</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Análisis de Precios</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  <span>Autoajuste</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Profesional
              </CardTitle>
              <CardDescription>
                Análisis detallado del rendimiento de tu inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Los analytics detallados estarán disponibles próximamente</p>
                <Badge variant="secondary">Próximamente</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Herramientas Avanzadas
              </CardTitle>
              <CardDescription>
                Funciones especiales para profesionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">CRM Básico</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestiona tus contactos y seguimiento de clientes
                  </p>
                  <Button size="sm" variant="outline">
                    Próximamente
                  </Button>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">Marketing Automático</h4>
                  <p className="text-sm text-muted-foreground">
                    Promociona automáticamente tu inventario
                  </p>
                  <Button size="sm" variant="outline">
                    Próximamente
                  </Button>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">Reportes Avanzados</h4>
                  <p className="text-sm text-muted-foreground">
                    Exporta reportes detallados de tu negocio
                  </p>
                  <Button size="sm" variant="outline">
                    Próximamente
                  </Button>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">API Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Integra con tu sistema existente
                  </p>
                  <Button size="sm" variant="outline">
                    Próximamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}