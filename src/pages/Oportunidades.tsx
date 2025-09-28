import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { Loader2, DollarSign, Filter, Search, Calendar } from "lucide-react";

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

export default function Oportunidades() {
  const { isProfessional } = useIsProfessional();
  const { toast } = useToast();

  const [autos, setAutos] = useState<AutoVenta[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [comentarios, setComentarios] = useState("");

  const formatCurrency = (value: string) => {
    const numeric = value.replace(/[^\d]/g, "");
    return numeric ? parseInt(numeric, 10).toLocaleString("es-MX") : "";
  };
  const parseCurrency = (value: string) => value.replace(/[^\d]/g, "");

  useEffect(() => {
    // SEO basics
    document.title = "Oportunidades de Compra | AutoPriceLabs";
    const descContent = "Explora oportunidades de compra de autos y envía ofertas como profesional.";
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
    canonical.setAttribute("href", window.location.origin + "/oportunidades");
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

    const { data: oferta, error } = await supabase.from("ofertas").insert({
      auto_venta_id: openDialogId,
      profesional_id: session.user.id,
      monto_oferta: minAmount,
      monto_min: minAmount,
      monto_max: montoMax ? maxAmount : minAmount,
      comentarios: comentarios || null,
    }).select().single();

    if (error) {
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
      return;
    }

    // Send notification to car owner
    try {
      await supabase.functions.invoke('notificar-nueva-oferta', {
        body: { oferta_id: oferta.id }
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't show error to user as the offer was created successfully
    }

    toast({ title: "Oferta enviada", description: "El vendedor podrá revisarla pronto." });
    setOpenDialogId(null);
  };

  if (!isProfessional) {
    return (
      <div className="container mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="text-muted-foreground">Esta sección es exclusiva para profesionales.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Oportunidades de Compra</h1>
        <p className="text-muted-foreground">Explora autos disponibles y envía tus ofertas</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
        </div>
      ) : (
        <>
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
                    <Badge variant={auto.recibiendo_ofertas ? "default" : "secondary"}>
                      {auto.recibiendo_ofertas ? "Recibiendo ofertas" : "No disponible"}
                    </Badge>
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
        </>
      )}
    </div>
  );
}