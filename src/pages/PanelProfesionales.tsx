import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { Loader2, HandCoins, Car, DollarSign, Filter, Search, Eye, Calendar, CheckCircle, Clock } from "lucide-react";
import { PerfilReputacion } from "@/components/reviews/PerfilReputacion";
import { ListaReviews } from "@/components/reviews/ListaReviews";
import { PanelEvaluacionesProfesionales } from "@/components/reviews/PanelEvaluacionesProfesionales";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useFiltrosOfertas } from "@/hooks/useFiltrosOfertas";
import { ConfiguradorFiltrosOfertas } from "@/components/ConfiguradorFiltrosOfertas";

interface AutoVenta {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  kilometraje: number;
  estado_auto: string;
  servicios_agencia: boolean;
  documentos_orden: boolean;
  recibiendo_ofertas: boolean;
  created_at: string;
}

interface Oferta {
  id: string;
  auto_venta_id: string;
  monto_oferta: number;
  monto_min?: number;
  monto_max?: number;
  estado: string;
  created_at: string;
  comentarios: string | null;
  seguimiento_estado?: string;
  fecha_cita?: string;
  notas_seguimiento?: string;
  seller_contact?: {
    nombre_apellido: string;
    numero_telefonico: string;
    correo_electronico: string;
  };
}

export default function PanelProfesionales() {
  const { isProfessional } = useIsProfessional();
  const { profesionalActual } = useProfesionales();
  const { filtros, evaluarVehiculo } = useFiltrosOfertas(profesionalActual?.id || '');
  const { toast } = useToast();

  const [autos, setAutos] = useState<AutoVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [comentarios, setComentarios] = useState("");

  // Seguimiento states
  const [seguimientoDialog, setSeguimientoDialog] = useState<string | null>(null);
  const [seguimientoEstado, setSeguimientoEstado] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [notasSeguimiento, setNotasSeguimiento] = useState("");

  const currency = useMemo(() => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }), []);
  const formatCurrency = (value: string) => {
    const numeric = value.replace(/[^\d]/g, "");
    return numeric ? parseInt(numeric, 10).toLocaleString("es-MX") : "";
  };
  const parseCurrency = (value: string) => value.replace(/[^\d]/g, "");

  useEffect(() => {
    // SEO basics
    document.title = "Panel Profesionales | Ofertas de Autos";
    const descContent = "Explora autos disponibles y envía ofertas como profesional.";
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", descContent);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/panel-profesionales");
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: autosData } = await supabase
        .from("autos_venta")
        .select("id, marca, modelo, ano, kilometraje, estado_auto, servicios_agencia, documentos_orden, recibiendo_ofertas, created_at")
        .eq("recibiendo_ofertas", true)
        .order("created_at", { ascending: false });
      setAutos(autosData || []);

      const { data: sessionRes } = await supabase.auth.getSession();
      const userId = sessionRes.session?.user.id;
      if (userId) {
        const { data: ofertasData } = await supabase
          .from("ofertas")
          .select(`
            id, auto_venta_id, monto_oferta, monto_min, monto_max, estado, created_at, comentarios,
            autos_venta!inner (
              cliente_id,
              clientes (
                nombre_apellido,
                numero_telefonico,
                correo_electronico
              )
            )
          `)
          .eq("profesional_id", userId)
          .order("created_at", { ascending: false });
        
        // Transform data to include seller contact info only for accepted offers
        const transformedOfertas = ofertasData?.map(oferta => ({
          ...oferta,
          seller_contact: oferta.estado === 'aceptada' ? oferta.autos_venta?.clientes : undefined,
          autos_venta: undefined // Remove this from the final object
        })) || [];
        
        setOfertas(transformedOfertas);
      } else {
        setOfertas([]);
      }
      setLoading(false);
    };

    load();
  }, []);

  // Filtered autos based on search and filters
  const filteredAutos = useMemo(() => {
    return autos.filter(auto => {
      const matchesSearch = searchText === "" || 
        `${auto.marca} ${auto.modelo} ${auto.ano}`.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesDate = dateFilter === "" || 
        new Date(auto.created_at).toDateString() === new Date(dateFilter).toDateString();
      
      return matchesSearch && matchesDate;
    });
  }, [autos, searchText, dateFilter]);

  // Filtered offers based on status
  const filteredOfertas = useMemo(() => {
    return ofertas.filter(oferta => {
      return statusFilter === "" || statusFilter === "all" || oferta.estado === statusFilter;
    });
  }, [ofertas, statusFilter]);

  const abrirOferta = (autoId: string) => {
    setOpenDialogId(autoId);
    setMontoMin("");
    setMontoMax("");
    setComentarios("");
  };

  const enviarOferta = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({ title: "Inicia sesión", description: "Necesitas iniciar sesión para enviar una oferta.", variant: "destructive" });
      return;
    }

    const minAmount = parseFloat(parseCurrency(montoMin));
    const maxAmount = parseFloat(parseCurrency(montoMax || ""));

    if (!openDialogId || !minAmount || minAmount <= 0 || (montoMax && maxAmount < minAmount)) {
      toast({ title: "Rango inválido", description: "Ingresa un monto mínimo válido y, si defines máximo, que sea mayor o igual.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("ofertas").insert({
      auto_venta_id: openDialogId,
      profesional_id: session.user.id,
      monto_oferta: minAmount,
      monto_min: minAmount,
      monto_max: montoMax ? maxAmount : minAmount,
      comentarios: comentarios || null,
    });

    if (error) {
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Oferta enviada", description: "El vendedor podrá revisarla pronto." });
    setOpenDialogId(null);

    // Refresh my offers
    const { data: ofertasData } = await supabase
      .from("ofertas")
      .select(`
        id, auto_venta_id, monto_oferta, monto_min, monto_max, estado, created_at, comentarios,
        autos_venta!inner (
          cliente_id,
          clientes (
            nombre_apellido,
            numero_telefonico,
            correo_electronico
          )
        )
      `)
      .eq("profesional_id", session.user.id)
      .order("created_at", { ascending: false });
    
    // Transform data to include seller contact info only for accepted offers
    const transformedOfertas = ofertasData?.map(oferta => ({
      ...oferta,
      seller_contact: oferta.estado === 'aceptada' ? oferta.autos_venta?.clientes : undefined,
      autos_venta: undefined // Remove this from the final object
    })) || [];
    
    setOfertas(transformedOfertas);
  };

  const actualizarSeguimiento = async () => {
    if (!seguimientoDialog) return;
    
    const updates: any = {};
    if (seguimientoEstado) updates.seguimiento_estado = seguimientoEstado;
    if (fechaCita) updates.fecha_cita = fechaCita;
    if (notasSeguimiento) updates.notas_seguimiento = notasSeguimiento;
    
    const { error } = await supabase
      .from("ofertas")
      .update(updates)
      .eq("id", seguimientoDialog);
    
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el seguimiento", variant: "destructive" });
      return;
    }
    
    toast({ title: "Actualizado", description: "Seguimiento actualizado correctamente" });
    setSeguimientoDialog(null);
    setSeguimientoEstado("");
    setFechaCita("");
    setNotasSeguimiento("");
    
    // Refresh offers
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes.session?.user.id;
    if (userId) {
      const { data: ofertasData } = await supabase
        .from("ofertas")
        .select(`
          id, auto_venta_id, monto_oferta, monto_min, monto_max, estado, created_at, comentarios,
          autos_venta!inner (
            cliente_id,
            clientes (
              nombre_apellido,
              numero_telefonico,
              correo_electronico
            )
          )
        `)
        .eq("profesional_id", userId);
      
      // Transform data to include seller contact info only for accepted offers
      const transformedOfertas = ofertasData?.map(oferta => ({
        ...oferta,
        seller_contact: oferta.estado === 'aceptada' ? oferta.autos_venta?.clientes : undefined,
        autos_venta: undefined // Remove this from the final object
      })) || [];
      
      setOfertas(transformedOfertas);
    }
  };

  if (!isProfessional) {
    return (
      <div className="container mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="text-muted-foreground">Este panel es exclusivo para profesionales.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Profesionales</h1>
            <p className="text-muted-foreground">Explora autos disponibles y envía tus ofertas</p>
          </div>
          {filtros?.activo && filtros?.tipo_filtro === 'personalizado' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Filter className="h-4 w-4 mr-2" />
              Filtros personalizados activos
            </Badge>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
        </div>
      ) : (
        <Tabs defaultValue="autos">
          <TabsList>
            <TabsTrigger value="autos" className="flex items-center gap-2"><Car className="h-4 w-4" /> Oportunidades de compra</TabsTrigger>
            <TabsTrigger value="filtros" className="flex items-center gap-2"><Filter className="h-4 w-4" /> Configurar Filtros</TabsTrigger>
            <TabsTrigger value="mis-ofertas" className="flex items-center gap-2"><HandCoins className="h-4 w-4" /> Mis ofertas</TabsTrigger>
            <TabsTrigger value="reputacion" className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Mi Reputación</TabsTrigger>
            <TabsTrigger value="evaluaciones-profesionales" className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Evaluaciones entre Profesionales</TabsTrigger>
          </TabsList>

          <TabsContent value="autos" className="mt-4">
            {/* Filters and Search */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search" className="flex items-center gap-2">
                      <Search className="h-4 w-4" /> Buscar autos
                    </Label>
                    <Input
                      id="search"
                      placeholder="Marca, modelo, año..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-filter" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Filtrar por fecha
                    </Label>
                    <Input
                      id="date-filter"
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Filter className="h-4 w-4" /> Acciones
                    </Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchText("");
                        setDateFilter("");
                      }}
                      className="w-full"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAutos.map((auto) => (
                <Card key={auto.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{auto.marca} {auto.modelo} {auto.ano}</span>
                      <div className="flex items-center gap-2">
                        {filtros?.activo && filtros?.tipo_filtro === 'personalizado' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Filter className="h-3 w-3 mr-1" />
                            Coincide con tus filtros
                          </Badge>
                        )}
                        <Badge variant={auto.recibiendo_ofertas ? "default" : "secondary"}>
                          {auto.recibiendo_ofertas ? "Recibiendo ofertas" : "No disponible"}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">Kilometraje: {auto.kilometraje.toLocaleString()} km</p>
                    <p className="text-sm text-muted-foreground">Estado: {auto.estado_auto}</p>
                    <div className="flex items-center gap-2">
                      {auto.servicios_agencia && <Badge variant="outline">Servicios de agencia</Badge>}
                      {auto.documentos_orden && <Badge variant="outline">Docs en orden</Badge>}
                    </div>
                    <div className="pt-2">
                      <Dialog open={openDialogId === auto.id} onOpenChange={(o) => !o && setOpenDialogId(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => abrirOferta(auto.id)} disabled={!auto.recibiendo_ofertas}>
                            <DollarSign className="h-4 w-4 mr-2" /> Hacer oferta
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Enviar oferta</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Monto mínimo (MXN)</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                    <Input
                                      type="text"
                                      value={montoMin}
                                      onChange={(e) => setMontoMin(formatCurrency(e.target.value))}
                                      placeholder="80,000"
                                      className="pl-8"
                                      style={{ appearance: 'textfield' }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Monto máximo (MXN) - opcional</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                    <Input
                                      type="text"
                                      value={montoMax}
                                      onChange={(e) => setMontoMax(formatCurrency(e.target.value))}
                                      placeholder="100,000"
                                      className="pl-8"
                                      style={{ appearance: 'textfield' }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="comentarios">Comentarios (opcional)</Label>
                                <Input id="comentarios" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="secondary" onClick={() => setOpenDialogId(null)}>Cancelar</Button>
                            <Button onClick={enviarOferta}>Enviar oferta</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="filtros" className="mt-4">
            <div className="max-w-4xl">
              <ConfiguradorFiltrosOfertas profesionalId={profesionalActual?.id || ''} />
            </div>
          </TabsContent>

          <TabsContent value="mis-ofertas" className="mt-4">
            {/* Status Filter */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filtrar por estado</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="vista">Vista</SelectItem>
                        <SelectItem value="aceptada">Aceptada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estadísticas</Label>
                    <div className="flex gap-2">
                      <Badge variant="outline">Total: {ofertas.length}</Badge>
                      <Badge variant="default">Aceptadas: {ofertas.filter(o => o.estado === 'aceptada').length}</Badge>
                      <Badge variant="secondary">Pendientes: {ofertas.filter(o => o.estado === 'pendiente').length}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredOfertas.length === 0 ? (
              <p className="text-muted-foreground">
                {ofertas.length === 0 ? "Aún no has enviado ofertas." : "No hay ofertas que coincidan con el filtro."}
              </p>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de ofertas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Auto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Comentarios</TableHead>
                        <TableHead>Contacto Vendedor</TableHead>
                        <TableHead>Seguimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOfertas.map((o) => {
                        const auto = autos.find(a => a.id === o.auto_venta_id);
                        const isViewed = o.estado === 'vista' || o.estado === 'aceptada' || o.estado === 'rechazada';
                        return (
                          <TableRow key={o.id}>
                            <TableCell>{auto ? `${auto.marca} ${auto.modelo} ${auto.ano}` : o.auto_venta_id}</TableCell>
                            <TableCell>
                              {o.monto_min && o.monto_max 
                                ? `${currency.format(o.monto_min)} - ${currency.format(o.monto_max)}`
                                : currency.format(o.monto_oferta)
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={o.estado === "aceptada" ? "default" : o.estado === "rechazada" ? "destructive" : "outline"}>
                                  {o.estado}
                                </Badge>
                                {isViewed && <Eye className="h-4 w-4 text-green-500" />}
                              </div>
                            </TableCell>
                            <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                            <TableCell className="max-w-[240px] truncate">{o.comentarios || "-"}</TableCell>
                            <TableCell>
                              {o.seller_contact ? (
                                <div className="space-y-1 text-sm">
                                  <div><strong>Nombre:</strong> {o.seller_contact.nombre_apellido}</div>
                                  <div><strong>Teléfono:</strong> {o.seller_contact.numero_telefonico}</div>
                                  <div><strong>Email:</strong> {o.seller_contact.correo_electronico}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  {o.estado === 'aceptada' ? 'Cargando...' : 'Disponible al aceptar'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Dialog open={seguimientoDialog === o.id} onOpenChange={(open) => !open && setSeguimientoDialog(null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setSeguimientoDialog(o.id)}>
                                    <Clock className="h-4 w-4 mr-1" /> Seguimiento
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Seguimiento de Oferta</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Estado del seguimiento</Label>
                                      <Select value={seguimientoEstado} onValueChange={setSeguimientoEstado}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="contacto_inicial">Contacto inicial</SelectItem>
                                          <SelectItem value="cita_programada">Cita programada</SelectItem>
                                          <SelectItem value="inspeccion_realizada">Inspección realizada</SelectItem>
                                          <SelectItem value="negociacion">En negociación</SelectItem>
                                          <SelectItem value="compra_realizada">Compra realizada</SelectItem>
                                          <SelectItem value="descartado">Descartado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Fecha de cita (opcional)</Label>
                                      <Input
                                        type="datetime-local"
                                        value={fechaCita}
                                        onChange={(e) => setFechaCita(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Notas adicionales</Label>
                                      <Input
                                        value={notasSeguimiento}
                                        onChange={(e) => setNotasSeguimiento(e.target.value)}
                                        placeholder="Notas sobre el seguimiento..."
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="secondary" onClick={() => setSeguimientoDialog(null)}>Cancelar</Button>
                                    <Button onClick={actualizarSeguimiento}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Actualizar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reputacion" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {profesionalActual && (
                  <PerfilReputacion 
                    profesionalId={profesionalActual.id} 
                    showDetailed={true} 
                  />
                )}
              </div>
              
              <div className="lg:col-span-2">
                {profesionalActual && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Mis Reseñas de Clientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ListaReviews profesionalId={profesionalActual.id} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
           </TabsContent>

           <TabsContent value="evaluaciones-profesionales" className="mt-4">
             <PanelEvaluacionesProfesionales />
           </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
