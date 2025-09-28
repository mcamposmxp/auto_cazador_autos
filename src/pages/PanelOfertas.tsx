import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Car, DollarSign, Calendar, Phone, Star, Mail, MessageCircle, MapPin, XCircle } from 'lucide-react';
import { CalificacionEstrellas } from '@/components/reviews/CalificacionEstrellas';
import { BadgeConfianza } from '@/components/reviews/BadgeConfianza';
import { NotificacionEvaluacionCreditos } from '@/components/NotificacionEvaluacionCreditos';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AutoVenta {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  kilometraje: number;
  estado_auto: string;
  created_at: string;
  recibiendo_ofertas: boolean;
}

interface Oferta {
  id: string;
  monto_oferta: number | null;
  monto_min: number | null;
  monto_max: number | null;
  preferente: boolean;
  comentarios: string | null;
  estado: string;
  created_at: string;
  auto_venta_id: string;
  profesional_id: string;
  profiles?: {
    nombre: string | null;
    apellido: string | null;
    telefono_movil: string | null;
    tipo_usuario: string | null;
    negocio_nombre: string | null;
    reputacion: number | null;
    ubicacion_ciudad: string | null;
    ubicacion_estado: string | null;
    contacto_nombre: string | null;
    contacto_telefono: string | null;
    correo_electronico: string | null;
  } | null;
  // Datos del profesional desde la tabla profesionales (si están disponibles)
  profesional_ubicacion_ciudad?: string | null;
  profesional_ubicacion_estado?: string | null;
  profesional_negocio_nombre?: string | null;
  // Datos de reputación
  stats_profesional?: {
    calificacion_promedio: number;
    total_reviews: number;
    badge_confianza: string;
  } | null;
}

interface AutoConOfertas extends AutoVenta {
  ofertas: Oferta[];
}

export default function PanelOfertas() {
  const [autosConOfertas, setAutosConOfertas] = useState<AutoConOfertas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [showEvaluationNotification, setShowEvaluationNotification] = useState(true);
  const [filters, setFilters] = useState<Record<string, {
    negocio: string;
    ubicacion: string;
    estado: string;
    reputacionMin: string;
    min: string;
    max: string;
  }>>({});
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeOffer, setComposeOffer] = useState<Oferta | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchAutosYOfertas();
  }, []);

  const fetchAutosYOfertas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener IDs de clientes del usuario por email
      const { data: clientesRows, error: clientesError } = await supabase
        .from('clientes')
        .select('id, correo_electronico')
        .eq('correo_electronico', user.email);

      if (clientesError) {
        console.error('Error fetching clientes:', clientesError);
        return;
      }

      const clienteIds = (clientesRows || []).map((c) => c.id);
      if (clienteIds.length === 0) {
        setAutosConOfertas([]);
        setIsLoading(false);
        return;
      }

      const { data: autos, error: autosError } = await supabase
        .from('autos_venta')
        .select(`
          id,
          marca,
          modelo,
          ano,
          kilometraje,
          estado_auto,
          created_at,
          recibiendo_ofertas,
          cliente_id
        `)
        .in('cliente_id', clienteIds);

      if (autosError) {
        console.error('Error fetching autos:', autosError);
        return;
      }

      // Para cada auto, obtener las ofertas
      const autosConOfertasData: AutoConOfertas[] = [];
      
      for (const auto of autos || []) {
        const { data: ofertas, error: ofertasError } = await supabase
          .from('ofertas')
          .select(`
            id,
            monto_oferta,
            monto_min,
            monto_max,
            preferente,
            comentarios,
            estado,
            created_at,
            auto_venta_id,
            profesional_id,
            profiles!ofertas_profesional_id_fkey(
              nombre,
              apellido,
              telefono_movil,
              tipo_usuario,
              negocio_nombre,
              reputacion,
              ubicacion_ciudad,
              ubicacion_estado,
              contacto_nombre,
              contacto_telefono,
              correo_electronico
            )
          `)
          .eq('auto_venta_id', auto.id)
          .order('created_at', { ascending: false });

        if (ofertasError) {
          console.error('Error fetching ofertas:', ofertasError);
          continue;
        }

        // Enriquecer ofertas con ubicación y estadísticas desde 'profesionales' y 'stats_profesionales'
        let ofertasEnriquecidas = ofertas || [];
        try {
          const profesionalIds = Array.from(new Set(ofertasEnriquecidas.map(o => o.profesional_id).filter(Boolean)));
          if (profesionalIds.length > 0) {
            // Obtener datos de profesionales
            const { data: profRows } = await supabase
              .from('profesionales')
              .select('id, user_id, direccion_ciudad, direccion_estado, negocio_nombre')
              .in('user_id', profesionalIds as string[]);
            
            // Obtener estadísticas de reputación
            const profesionalDbIds = (profRows || []).map(p => p.id);
            const { data: statsRows } = await supabase
              .from('stats_profesionales')
              .select('profesional_id, calificacion_promedio, total_reviews, badge_confianza')
              .in('profesional_id', profesionalDbIds);
            
            const profMap = Object.fromEntries((profRows || []).map((r: any) => [r.user_id, r]));
            const statsMap = Object.fromEntries((statsRows || []).map((s: any) => [s.profesional_id, s]));
            
            ofertasEnriquecidas = ofertasEnriquecidas.map((o) => {
              const prof = profMap[o.profesional_id];
              const stats = prof ? statsMap[prof.id] : null;
              
              return {
                ...o,
                profesional_ubicacion_ciudad: prof?.direccion_ciudad ?? null,
                profesional_ubicacion_estado: prof?.direccion_estado ?? null,
                profesional_negocio_nombre: prof?.negocio_nombre ?? null,
                stats_profesional: stats ? {
                  calificacion_promedio: stats.calificacion_promedio,
                  total_reviews: stats.total_reviews,
                  badge_confianza: stats.badge_confianza
                } : null
              };
            });
          }
        } catch (e) {
          console.warn('No se pudo enriquecer ofertas con profesionales:', e);
        }

        autosConOfertasData.push({
          id: auto.id,
          marca: auto.marca,
          modelo: auto.modelo,
          ano: auto.ano,
          kilometraje: auto.kilometraje,
          estado_auto: auto.estado_auto,
          created_at: auto.created_at,
          recibiendo_ofertas: auto.recibiendo_ofertas,
          ofertas: ofertasEnriquecidas
        });
      }

      setAutosConOfertas(autosConOfertasData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus autos y ofertas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'aceptada' | 'rechazada') => {
    try {
      const { error } = await supabase
        .from('ofertas')
        .update({ estado: action })
        .eq('id', offerId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la oferta",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Oferta actualizada",
        description: `La oferta ha sido ${action}`,
      });

      fetchAutosYOfertas();
    } catch (error) {
      console.error('Error updating offer:', error);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'default';
      case 'aceptada':
        return 'success';
      case 'rechazada':
        return 'destructive';
      case 'cerrada':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const deleteAuto = async (autoId: string) => {
    try {
      // Eliminar ofertas asociadas
      const { error: offersError } = await supabase
        .from('ofertas')
        .delete()
        .eq('auto_venta_id', autoId);
      if (offersError) {
        toast({ title: 'Error', description: 'No se pudieron borrar las ofertas del auto', variant: 'destructive' });
        return;
      }

      // Eliminar el auto
      const { error: carError } = await supabase
        .from('autos_venta')
        .delete()
        .eq('id', autoId);
      if (carError) {
        toast({ title: 'Error', description: 'No se pudo borrar el auto', variant: 'destructive' });
        return;
      }

      toast({ title: 'Eliminado', description: 'Auto y ofertas eliminados correctamente' });
      fetchAutosYOfertas();
    } catch (e) {
      console.error('Error deleting car and offers:', e);
      toast({ title: 'Error', description: 'Ocurrió un error al borrar', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Cargando tus autos y ofertas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Panel de Ofertas</h1>
        <p className="text-muted-foreground">
          Gestiona tus autos en venta y las ofertas recibidas de profesionales
        </p>
      </div>

      <Tabs defaultValue="mis-autos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mis-autos">Mis Autos</TabsTrigger>
          <TabsTrigger value="ofertas-recibidas">Ofertas Recibidas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mis-autos" className="space-y-4">
          {autosConOfertas.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes autos registrados para venta</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {autosConOfertas.map((auto) => (
                <Card key={auto.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          {auto.marca} {auto.modelo} {auto.ano}
                        </CardTitle>
                        <CardDescription>
                          {auto.kilometraje.toLocaleString()} km • {auto.estado_auto}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {auto.ofertas.length} ofertas
                        </Badge>
                        <Button
                          size="sm"
                          variant={auto.recibiendo_ofertas ? 'outline' : 'default'}
                          onClick={async () => {
                            const { error } = await supabase
                              .from('autos_venta')
                              .update({ recibiendo_ofertas: !auto.recibiendo_ofertas })
                              .eq('id', auto.id);
                            if (error) {
                              toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
                            } else {
                              toast({ title: auto.recibiendo_ofertas ? 'Ofertas pausadas' : 'Ofertas reanudadas' });
                              fetchAutosYOfertas();
                            }
                          }}
                        >
                          {auto.recibiendo_ofertas ? 'Dejar de recibir ofertas' : 'Reanudar ofertas'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">Borrar auto</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Borrar auto y sus ofertas?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará todas las ofertas asociadas y el auto. No podrás deshacerla.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAuto(auto.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Publicado el {new Date(auto.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ofertas-recibidas" className="space-y-4">
          {autosConOfertas.every(auto => auto.ofertas.length === 0) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No has recibido ofertas aún</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {autosConOfertas.map((auto) => (
                auto.ofertas.length > 0 && (
                  <div key={auto.id}>
                    <h3 className="text-lg font-semibold mb-3">
                      Ofertas para {auto.marca} {auto.modelo} {auto.ano}
                    </h3>

                    {(() => {
                      const f = filters[auto.id] || { negocio: '', ubicacion: '', estado: '', reputacionMin: '', min: '', max: '' };
                      const parseNum = (v: string) => (v ? Number(v) : undefined);
                      const minFilter = parseNum(f.min);
                      const maxFilter = parseNum(f.max);
                      const repMin = parseNum(f.reputacionMin);

                      const filtered = (auto.ofertas || []).filter((o) => {
                        const p = o.profiles || ({} as any);
                        const negocio = ((o.profesional_negocio_nombre || p.negocio_nombre || `${p.nombre || ''} ${p.apellido || ''}`) || '').toLowerCase();
                        const ubic = `${(o.profesional_ubicacion_ciudad || p.ubicacion_ciudad || '')} ${(o.profesional_ubicacion_estado || p.ubicacion_estado || '')}`.toLowerCase();
                        const estadoOk = f.estado ? o.estado === f.estado : true;
                        const negocioOk = f.negocio ? negocio.includes(f.negocio.toLowerCase()) : true;
                        const ubicOk = f.ubicacion ? ubic.includes(f.ubicacion.toLowerCase()) : true;
                        const repOk = repMin !== undefined ? (Number(p.reputacion || 0) >= repMin) : true;
                        const offerMin = o.monto_min ?? o.monto_oferta ?? undefined;
                        const offerMax = o.monto_max ?? o.monto_oferta ?? undefined;
                        const minOk = minFilter !== undefined ? (offerMax !== undefined ? offerMax >= minFilter : true) : true;
                        const maxOk = maxFilter !== undefined ? (offerMin !== undefined ? offerMin <= maxFilter : true) : true;
                        return estadoOk && negocioOk && ubicOk && repOk && minOk && maxOk;
                      });

                      const updateFilter = (patch: Partial<typeof f>) =>
                        setFilters((prev) => ({ ...prev, [auto.id]: { ...f, ...patch } }));

                      return (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                              <Input placeholder="Negocio" value={f.negocio} onChange={(e) => updateFilter({ negocio: e.target.value })} />
                              <Input placeholder="Ubicación" value={f.ubicacion} onChange={(e) => updateFilter({ ubicacion: e.target.value })} />
                              <Select value={f.estado || 'all'} onValueChange={(v) => updateFilter({ estado: v === 'all' ? '' : v })}>
                                <SelectTrigger aria-label="Estado"><SelectValue placeholder="Estado" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos</SelectItem>
                                  <SelectItem value="pendiente">Pendiente</SelectItem>
                                  <SelectItem value="aceptada">Aceptada</SelectItem>
                                  <SelectItem value="rechazada">Rechazada</SelectItem>
                                  <SelectItem value="cerrada">Cerrada</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input placeholder="Reputación mínima" inputMode="numeric" value={f.reputacionMin} onChange={(e) => updateFilter({ reputacionMin: e.target.value })} />
                              <Input placeholder="Rango mín" inputMode="numeric" value={f.min} onChange={(e) => updateFilter({ min: e.target.value })} />
                              <Input placeholder="Rango máx" inputMode="numeric" value={f.max} onChange={(e) => updateFilter({ max: e.target.value })} />
                            </div>

                            <div className="relative w-full overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Rango de oferta</TableHead>
                                    <TableHead>Negocio</TableHead>
                                    <TableHead>Reputación</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Observaciones</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Preferente</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filtered.map((o) => (
                                    <TableRow key={o.id}>
                                      <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                                      <TableCell>
                                        {o.monto_min != null && o.monto_max != null ? (
                                          `$${Number(o.monto_min).toLocaleString()} - $${Number(o.monto_max).toLocaleString()}`
                                        ) : (
                                          o.monto_oferta != null ? `$${Number(o.monto_oferta).toLocaleString()}` : '—'
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {((o.profesional_negocio_nombre || o.profiles?.negocio_nombre || `${o.profiles?.nombre || ''} ${o.profiles?.apellido || ''}`) || '').trim() || '—'}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col gap-1">
                                          {o.stats_profesional ? (
                                            <>
                                              <CalificacionEstrellas
                                                calificacion={o.stats_profesional.calificacion_promedio}
                                                totalReviews={o.stats_profesional.total_reviews}
                                                size="sm"
                                              />
                                              <BadgeConfianza badge={o.stats_profesional.badge_confianza} size="sm" />
                                            </>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">Sin calificaciones</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          {`${o.profesional_ubicacion_ciudad || o.profiles?.ubicacion_ciudad || ''}${((o.profesional_ubicacion_ciudad || o.profiles?.ubicacion_ciudad) && (o.profesional_ubicacion_estado || o.profiles?.ubicacion_estado)) ? ', ' : ''}${o.profesional_ubicacion_estado || o.profiles?.ubicacion_estado || ''}`.trim() || '—'}
                                        </div>
                                      </TableCell>
                                      <TableCell className="max-w-[280px] truncate" title={o.comentarios || ''}>{o.comentarios || '—'}</TableCell>
                                      <TableCell>
                                        <Badge variant={getEstadoBadgeColor(o.estado) as any}>{o.estado}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Button size="sm" variant={o.preferente ? 'default' : 'outline'} onClick={async () => {
                                          const { error } = await supabase.from('ofertas').update({ preferente: !o.preferente }).eq('id', o.id);
                                          if (error) {
                                            toast({ title: 'Error', description: 'No se pudo actualizar la oferta', variant: 'destructive' });
                                          } else {
                                            toast({ title: o.preferente ? 'Quitada de preferentes' : 'Marcada como preferente' });
                                            fetchAutosYOfertas();
                                          }
                                        }}>
                                          <Star className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col gap-1 text-sm">
                                          <div>{o.profiles?.contacto_nombre || (o.profiles?.nombre ? `${o.profiles?.nombre} ${o.profiles?.apellido || ''}` : '—')}</div>
                                          <div className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" /> {o.profiles?.contacto_telefono || o.profiles?.telefono_movil || '—'}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {o.profiles?.correo_electronico ? (
                                              <a href={`mailto:${o.profiles.correo_electronico}`} className="underline">
                                                {o.profiles.correo_electronico}
                                              </a>
                                            ) : (
                                              '—'
                                            )}
                                          </div>
                                          <Button size="sm" variant="outline" onClick={() => {
                                            if (!o.profiles?.correo_electronico) {
                                              toast({ title: 'Sin correo', description: 'El ofertante no tiene correo registrado', variant: 'destructive' });
                                              return;
                                            }
                                            setComposeOffer(o);
                                            setComposeSubject(`Consulta sobre tu oferta para ${auto.marca} ${auto.modelo} ${auto.ano}`);
                                            setComposeMessage('Hola, me interesa tu propuesta. ¿Podemos conversar?');
                                            setIsComposeOpen(true);
                                          }}>
                                            <Mail className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" onClick={async () => {
                                            const { error } = await supabase.from('ofertas').update({ estado: 'cerrada' }).eq('id', o.id);
                                            if (error) {
                                              toast({ title: 'Error', description: 'No se pudo cerrar la oferta', variant: 'destructive' });
                                            } else {
                                              toast({ title: 'Oferta cerrada' });
                                              fetchAutosYOfertas();
                                            }
                                          }}>
                                            <XCircle className="h-4 w-4" /> Cerrar
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                                {filtered.length === 0 && (
                                  <TableCaption>No hay ofertas que coincidan con los filtros.</TableCaption>
                                )}
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                )
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}