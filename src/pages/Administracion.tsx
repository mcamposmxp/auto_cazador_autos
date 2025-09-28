import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit2, Pause, Play, Trash2, CheckCircle, Copy, Eye, EyeOff, Calendar, Filter, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatRelativeTime } from "@/utils/formatters";
import NotificacionesAdmin from "@/components/NotificacionesAdmin";

interface AutoVenta { 
  id: string; marca: string; modelo: string; ano: number; kilometraje: number; 
  servicios_agencia: boolean; documentos_orden: boolean; recibiendo_ofertas: boolean; 
  cliente_id: string; estado_auto?: string; created_at: string; updated_at: string;
}
interface Cliente { id?: string; nombre_apellido: string; correo_electronico: string; numero_telefonico: string; ciudad: string; estado?: string; }
interface Subasta { id: string; marca: string; modelo: string; ano: number; kilometraje: number; vendedor_nombre: string; vendedor_correo: string; vendedor_telefono: string; ciudad: string | null; estado: string | null; }
interface Ayuda { id: string; marca: string; modelo: string; ano: number; kilometraje: number; vendedor_nombre: string; vendedor_correo: string; vendedor_telefono: string; ciudad: string | null; estado: string | null; }
interface Profesional { id: string; negocio_nombre: string; razon_social: string; rfc: string; tipo_negocio: "agencia_nuevos" | "seminuevos" | "comerciante"; direccion_calle: string | null; direccion_numero: string | null; direccion_estado: string | null; direccion_ciudad: string | null; direccion_cp: string | null; representante_legal: string | null; contacto_principal: string | null; telefono: string | null; correo: string | null; pausado: boolean; user_id?: string | null; }
interface NewOffer { monto_min: string; monto_max: string; comentarios: string; }

const enumOptions = [
  { label: "Agencia de autos nuevos", value: "agencia_nuevos" },
  { label: "Negocio de seminuevos", value: "seminuevos" },
  { label: "Comerciante", value: "comerciante" },
] as const;

function useDocumentSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }, [title, description]);
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-foreground">{title}{typeof count === 'number' ? ` · ${count}` : ''}</h2>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function Administracion() {
  useDocumentSEO("Administración · Panel", "Panel de administración: profesionales, subastas y ayudas");
  const { isAdmin, loading } = useIsAdmin();

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!isAdmin) return <div className="p-6">Acceso restringido.</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Administración</h1>
        <p className="text-sm text-muted-foreground">Gestiona la red de compra, subastas, ayudas y profesionales</p>
      </header>

      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button onClick={() => window.location.href = '/admin/dashboard'} variant="default">
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Dashboard Completo
        </Button>
      </div>

      <Tabs defaultValue="red" className="w-full">
        <TabsList>
          <TabsTrigger value="red">Red de compra</TabsTrigger>
          <TabsTrigger value="subastas">Subastas</TabsTrigger>
          <TabsTrigger value="ayuda">Ayuda para vender</TabsTrigger>
          <TabsTrigger value="profesionales">Profesionales</TabsTrigger>
          <TabsTrigger value="ofertas">Gestión de Ofertas</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="red"><RedDeCompra /></TabsContent>
        <TabsContent value="subastas"><Subastas /></TabsContent>
        <TabsContent value="ayuda"><AyudaVenta /></TabsContent>
        <TabsContent value="profesionales"><ProfesionalesAdmin /></TabsContent>
        <TabsContent value="ofertas"><GestionOfertas /></TabsContent>
        <TabsContent value="notificaciones"><NotificacionesAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function RedDeCompra() {
  const [search, setSearch] = useState("");
  const [autos, setAutos] = useState<AutoVenta[]>([]);
  const [clientes, setClientes] = useState<Record<string, Cliente>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<string>("todos");

  useEffect(() => {
    const load = async () => {
      const { data: autosData, error } = await supabase.from("autos_venta").select("*").order("created_at", { ascending: false });
      if (error) {
        toast.error("Error cargando autos");
        setLoading(false);
        return;
      }
      setAutos(autosData ?? []);
      const ids = Array.from(new Set((autosData ?? []).map(a => a.cliente_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: clientesData } = await supabase.from("clientes").select("*").in("id", ids);
        const map: Record<string, Cliente> = {};
        (clientesData ?? []).forEach(c => { map[c.id] = c as any; });
        setClientes(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = autos.filter(a => {
      const c = clientes[a.cliente_id];
      return [a.marca, a.modelo, String(a.ano), c?.nombre_apellido, c?.correo_electronico, c?.ciudad]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });

    // Filtro por estatus
    if (statusFilter !== "todos") {
      if (statusFilter === "recibiendo") {
        result = result.filter(a => a.recibiendo_ofertas);
      } else if (statusFilter === "pausado") {
        result = result.filter(a => !a.recibiendo_ofertas);
      }
    }

    // Filtro por fecha
    if (dateFilter !== "todos") {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateFilter) {
        case "hoy":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "ultima_semana":
          startDate.setDate(now.getDate() - 7);
          break;
        case "ultimo_mes":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "ultimos_3_meses":
          startDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      result = result.filter(a => new Date(a.created_at) >= startDate);
    }

    return result;
  }, [search, autos, clientes, statusFilter, dateFilter]);

  return (
    <Card>
      <CardHeader>
        <SectionHeader title="Autos enviados a la red de compra" count={autos.length} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar por marca, modelo o cliente" />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="recibiendo">Recibiendo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="ultima_semana">Última semana</SelectItem>
                <SelectItem value="ultimo_mes">Último mes</SelectItem>
                <SelectItem value="ultimos_3_meses">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {loading ? (
          <div>Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auto</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Kms</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Fecha Envío</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => {
                  const c = clientes[a.cliente_id];
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.marca} {a.modelo}</TableCell>
                      <TableCell>{a.ano}</TableCell>
                      <TableCell>{a.kilometraje?.toLocaleString()}</TableCell>
                      <TableCell>{c?.nombre_apellido ?? "-"}</TableCell>
                      <TableCell>{c ? `${c.correo_electronico} · ${c.numero_telefonico}` : "-"}</TableCell>
                      <TableCell>{c?.ciudad ?? "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(a.created_at)}</div>
                          <div className="text-muted-foreground text-xs">{formatRelativeTime(a.created_at)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.recibiendo_ofertas ? "default" : "secondary"}>
                          {a.recibiendo_ofertas ? "Recibiendo" : "Pausado"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          Mostrando {filtered.length} de {autos.length} autos
        </div>
      </CardContent>
    </Card>
  );
}

function Subastas() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Subasta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("subasta_autos").select("*").order("fecha_registro", { ascending: false });
      if (error) {
        toast.error("Error cargando subastas");
      }
      setRows(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => [r.marca, r.modelo, String(r.ano), r.vendedor_nombre, r.vendedor_correo, r.ciudad, r.estado]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q)));
  }, [search, rows]);

  return (
    <Card>
      <CardHeader>
        <SectionHeader title="Solicitudes de subasta" count={rows.length} />
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar por auto o vendedor" />
        {loading ? (
          <div>Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auto</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Kms</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.marca} {r.modelo}</TableCell>
                    <TableCell>{r.ano}</TableCell>
                    <TableCell>{r.kilometraje?.toLocaleString()}</TableCell>
                    <TableCell>{r.vendedor_nombre}</TableCell>
                    <TableCell>{r.vendedor_correo} · {r.vendedor_telefono}</TableCell>
                    <TableCell>{[r.ciudad, r.estado].filter(Boolean).join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AyudaVenta() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Ayuda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("vendedores_ayuda").select("*").order("fecha_registro", { ascending: false });
      if (error) {
        toast.error("Error cargando ayudas");
      }
      setRows(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => [r.marca, r.modelo, String(r.ano), r.vendedor_nombre, r.vendedor_correo, r.ciudad, r.estado]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q)));
  }, [search, rows]);

  return (
    <Card>
      <CardHeader>
        <SectionHeader title="Ayuda para vender (cuenta propia)" count={rows.length} />
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar por auto o vendedor" />
        {loading ? (
          <div>Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auto</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Kms</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.marca} {r.modelo}</TableCell>
                    <TableCell>{r.ano}</TableCell>
                    <TableCell>{r.kilometraje?.toLocaleString()}</TableCell>
                    <TableCell>{r.vendedor_nombre}</TableCell>
                    <TableCell>{r.vendedor_correo} · {r.vendedor_telefono}</TableCell>
                    <TableCell>{[r.ciudad, r.estado].filter(Boolean).join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfesionalesAdmin() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profesional | null>(null);

  const empty: Profesional = {
    id: "", negocio_nombre: "", razon_social: "", rfc: "", tipo_negocio: "comerciante",
    direccion_calle: "", direccion_numero: "", direccion_estado: "", direccion_ciudad: "", direccion_cp: "",
    representante_legal: "", contacto_principal: "", telefono: "", correo: "", pausado: false, user_id: null
  };
  const [form, setForm] = useState<Profesional>(empty);
  const [regeneratingPassword, setRegeneratingPassword] = useState(false);
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("profesionales").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Error cargando profesionales");
    }
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => [r.negocio_nombre, r.razon_social, r.rfc, r.correo, r.telefono, r.direccion_ciudad, r.direccion_estado]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q)));
  }, [search, rows]);

  const onSave = async () => {
    const payload = { ...form } as any;
    
    if (editing) {
      const { error } = await supabase.from("profesionales").update(payload).eq("id", editing.id);
      if (error) return toast.error("No se pudo actualizar");
      
      // Si no tiene user_id y tiene correo, crear credenciales
      if (!editing.user_id && payload.correo) {
        await crearCredenciales(payload, editing.id);
      }
      
      toast.success("Profesional actualizado");
    } else {
      // Remove id from payload when creating new professional to let DB generate it
      const { id, ...createPayload } = payload;
      const { data, error } = await supabase.from("profesionales").insert([createPayload]).select().single();
      if (error) return toast.error("No se pudo crear");
      
      // Crear credenciales automáticamente si tiene correo
      if (data && createPayload.correo) {
        await crearCredenciales(createPayload, data.id);
      }
      
      toast.success("Profesional creado");
    }
    setOpen(false);
    setEditing(null);
    setForm(empty);
    load();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("profesionales").delete().eq("id", id);
    if (error) return toast.error("No se pudo borrar");
    toast.success("Profesional borrado");
    load();
  };

  const onTogglePause = async (row: Profesional) => {
    const { error } = await supabase.from("profesionales").update({ pausado: !row.pausado }).eq("id", row.id);
    if (error) return toast.error("No se pudo actualizar");
    load();
  };

  const openCreate = () => { 
    setEditing(null); 
    setForm(empty); 
    setLastGeneratedPassword("");
    setOpen(true); 
  };
  const openEdit = (row: Profesional) => { 
    setEditing(row); 
    setForm(row); 
    setLastGeneratedPassword("");
    setOpen(true); 
  };

  const enviarCredencialesPorCorreo = async (profesional: any, password: string) => {
    try {
      const response = await supabase.functions.invoke('enviar-credenciales', {
        body: {
          nombreProfesional: profesional.contacto_principal || profesional.negocio_nombre,
          nombreNegocio: profesional.negocio_nombre,
          email: profesional.correo,
          password: password,
          panelUrl: `${window.location.origin}/panel-profesionales`
        }
      });

      if (response.error) {
        console.error('Error enviando credenciales:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en envío de correo:', error);
      return false;
    }
  };

  const crearCredenciales = async (profesional: any, profesionalId: string) => {
    if (!profesional.correo) {
      return; // No crear credenciales si no hay correo
    }

    try {
      // Invocar función Edge para crear usuario sin afectar la sesión actual
      const { data, error } = await supabase.functions.invoke('crear-credenciales', {
        body: {
          profesionalId,
          email: profesional.correo,
          nombre: profesional.contacto_principal || profesional.negocio_nombre,
          telefono: profesional.telefono || '',
          negocio_nombre: profesional.negocio_nombre,
        }
      });

      if (error) {
        console.warn(`Error creando credenciales: ${error.message}`);
        toast.error(`Error creando credenciales: ${error.message}`);
        return;
      }

      const password: string | null = (data as any)?.password ?? null;

      if (password) {
        // Guardar la contraseña generada para mostrarla
        setLastGeneratedPassword(password);

        // Enviar credenciales por correo
        const emailSent = await enviarCredencialesPorCorreo(profesional, password);
        if (emailSent) {
          toast.success(`Credenciales creadas y enviadas por correo a ${profesional.correo}`, {
            description: "Revisa la bandeja de entrada y spam"
          });
        } else {
          toast.success(`Credenciales creadas correctamente`, {
            description: "El correo falló. Puedes ver la contraseña en el formulario."
          });
        }
      } else {
        // Usuario ya existía y fue vinculado
        toast.success(`El email ${profesional.correo} ya tenía cuenta y fue vinculado`);
      }
    } catch (error: any) {
      console.error("Error en creación de credenciales:", error);
      toast.error(`Error creando credenciales: ${error.message}`);
    }
  };

  const regenerarCredenciales = async () => {
    if (!editing || !editing.correo || !editing.id) {
      toast.error("No se pueden regenerar las credenciales");
      return;
    }
    
    setRegeneratingPassword(true);
    
    try {
      // Solicitar al Edge Function que reinicie la contraseña usando Service Role
      const { data, error } = await supabase.functions.invoke('crear-credenciales', {
        body: {
          action: 'reset',
          profesionalId: editing.id,
          email: editing.correo,
        }
      });

      if (error) {
        toast.error(`Error regenerando credenciales: ${error.message}`);
        return;
      }

      const newPassword = (data as any)?.password as string | undefined;
      if (!newPassword) {
        toast.error('No se pudo generar una nueva contraseña');
        return;
      }

      setLastGeneratedPassword(newPassword);
      toast.success('Nueva contraseña generada', {
        description: 'Cópiala y compártela de forma segura con el profesional'
      });
      
      // Intentar enviar por correo
      const emailSentResult = await enviarCredencialesPorCorreo(editing, newPassword);
      if (emailSentResult) {
        toast.success(`Contraseña enviada por correo a ${editing.correo}`, {
          description: 'Revisa la bandeja de entrada y spam'
        });
      }
      
    } catch (error) {
      toast.error("Error regenerando credenciales");
    } finally {
      setRegeneratingPassword(false);
    }
  };

  const reenviarCredenciales = async () => {
    if (!editing || !editing.correo || !editing.user_id) {
      toast.error("No se pueden reenviar las credenciales");
      return;
    }

    // Generate new password for security
    await regenerarCredenciales();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <SectionHeader title="Profesionales registrados" count={rows.length} />
          <Button onClick={openCreate}>Nuevo profesional</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar por nombre, RFC o ciudad" />
        {loading ? (
          <div>Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Razón social</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Credenciales</TableHead>
                  <TableHead className="w-[300px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.negocio_nombre}</TableCell>
                    <TableCell>{r.razon_social}</TableCell>
                    <TableCell>{r.rfc}</TableCell>
                    <TableCell>{enumOptions.find(o => o.value === r.tipo_negocio)?.label ?? r.tipo_negocio}</TableCell>
                    <TableCell>{[r.direccion_ciudad, r.direccion_estado, r.direccion_cp].filter(Boolean).join(", ")}</TableCell>
                    <TableCell>{r.contacto_principal} · {r.telefono} · {r.correo}</TableCell>
                    <TableCell>{r.pausado ? "Pausado" : "Activo"}</TableCell>
                    <TableCell>
                      {r.user_id ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activas
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {r.correo}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Sin credenciales
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => openEdit(r)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant={r.pausado ? "default" : "outline"} 
                          onClick={() => onTogglePause(r)}
                          className="flex items-center gap-1"
                        >
                          {r.pausado ? (
                            <>
                              <Play className="h-3 w-3" />
                              Reactivar
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3" />
                              Pausar
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => onDelete(r.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Borrar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar profesional" : "Nuevo profesional"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del negocio</Label>
              <Input value={form.negocio_nombre} onChange={e => setForm({ ...form, negocio_nombre: e.target.value })} />
            </div>
            <div>
              <Label>Razón social</Label>
              <Input value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} />
            </div>
            <div>
              <Label>RFC</Label>
              <Input value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value })} />
            </div>
            <div>
              <Label>Tipo de negocio</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.tipo_negocio} onChange={e => setForm({ ...form, tipo_negocio: e.target.value as any })}>
                {enumOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Calle</Label>
              <Input value={form.direccion_calle ?? ''} onChange={e => setForm({ ...form, direccion_calle: e.target.value })} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={form.direccion_numero ?? ''} onChange={e => setForm({ ...form, direccion_numero: e.target.value })} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={form.direccion_estado ?? ''} onChange={e => setForm({ ...form, direccion_estado: e.target.value })} />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input value={form.direccion_ciudad ?? ''} onChange={e => setForm({ ...form, direccion_ciudad: e.target.value })} />
            </div>
            <div>
              <Label>CP</Label>
              <Input value={form.direccion_cp ?? ''} onChange={e => setForm({ ...form, direccion_cp: e.target.value })} />
            </div>
            <div>
              <Label>Representante legal</Label>
              <Input value={form.representante_legal ?? ''} onChange={e => setForm({ ...form, representante_legal: e.target.value })} />
            </div>
            <div>
              <Label>Contacto principal</Label>
              <Input value={form.contacto_principal ?? ''} onChange={e => setForm({ ...form, contacto_principal: e.target.value })} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.telefono ?? ''} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <Label>Correo electrónico (Usuario del sistema)</Label>
              <Input value={form.correo ?? ''} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="correo@empresa.com" />
            </div>
            <div>
              <Label>Credenciales de acceso al sistema</Label>
              <div className="space-y-3">
                {form.user_id ? (
                  <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Credenciales activas
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-blue-700">Usuario (Email):</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="px-2 py-1 bg-white border rounded text-sm flex-1">{form.correo}</code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(form.correo || "")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium text-blue-700">Panel de acceso:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="px-2 py-1 bg-white border rounded text-sm flex-1">/panel-profesionales</code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(`${window.location.origin}/panel-profesionales`)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => regenerarCredenciales()}
                        disabled={regeneratingPassword}
                      >
                        {regeneratingPassword ? "Generando..." : "Regenerar contraseña"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => reenviarCredenciales()}
                        disabled={regeneratingPassword}
                      >
                        Reenviar por correo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border rounded-md bg-gray-50">
                    <Badge variant="secondary" className="mb-2">
                      {form.correo ? "Se crearán automáticamente al guardar" : "Requiere correo electrónico"}
                    </Badge>
                    {form.correo && (
                      <p className="text-xs text-muted-foreground">
                        Al guardar este profesional, se crearán automáticamente las credenciales y se enviarán por correo a: <strong>{form.correo}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mostrar credenciales generadas */}
          {lastGeneratedPassword && (
            <div className="mt-4 p-4 border rounded-md bg-green-50 border-green-200">
              <h4 className="font-medium mb-3 text-green-800">🔑 Credenciales generadas recientemente</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-green-700">Usuario (Email):</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-white border rounded text-sm">{form.correo}</code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(form.correo || "")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700">Contraseña temporal:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-white border rounded text-sm font-mono">
                      {showPassword ? lastGeneratedPassword : "••••••••••••••••"}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-6 w-6 p-0"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(lastGeneratedPassword)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700">Panel de acceso:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-white border rounded text-sm">{window.location.origin}/panel-profesionales</code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(`${window.location.origin}/panel-profesionales`)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-3">
                💡 Estas credenciales son válidas inmediatamente. Compártelas de forma segura con el profesional.
              </p>
            </div>
          )}
          {form.user_id && (
            <div className="mt-4 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium mb-2">Información de acceso</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Usuario:</strong> {form.correo}<br />
                <strong>Panel:</strong> <a href="/panel-profesionales" className="text-primary hover:underline">/panel-profesionales</a>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function GestionOfertas() {
  const [autos, setAutos] = useState<(AutoVenta & { cliente?: Cliente })[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAuto, setSelectedAuto] = useState<string | null>(null);
  const [selectedProfesional, setSelectedProfesional] = useState<string | null>(null);
  const [openOfferDialog, setOpenOfferDialog] = useState(false);
  const [newOffer, setNewOffer] = useState<NewOffer>({ monto_min: "", monto_max: "", comentarios: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const [autosResult, ofertasResult, profesionalesResult] = await Promise.all([
      supabase.from("autos_venta").select(`
        *, 
        clientes!inner(nombre_apellido, correo_electronico, numero_telefonico, ciudad, estado)
      `).order("created_at", { ascending: false }),
      
      supabase.from("ofertas").select(`
        *, 
        profesionales!inner(
          negocio_nombre, contacto_principal, telefono, correo
        )
      `).order("created_at", { ascending: false }),
      
      supabase.from("profesionales").select("*").eq("activo", true).order("negocio_nombre")
    ]);

    setAutos((autosResult.data || []).map(auto => ({
      ...auto,
      cliente: auto.clientes
    })));
    setOfertas(ofertasResult.data || []);
    setProfesionales(profesionalesResult.data || []);
    setLoading(false);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('es-MX');
  };

  const parseCurrency = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  const enviarOfertaAdmin = async () => {
    const minAmount = parseFloat(parseCurrency(newOffer.monto_min));
    const maxAmount = parseFloat(parseCurrency(newOffer.monto_max));
    
    if (!selectedAuto || !selectedProfesional || !newOffer.monto_min || (newOffer.monto_max && maxAmount < minAmount)) {
      toast.error("Selecciona un auto, profesional y un rango de oferta válido");
      return;
    }

    const { error } = await supabase.from("ofertas").insert({
      auto_venta_id: selectedAuto,
      profesional_id: selectedProfesional,
      monto_oferta: minAmount,
      monto_min: minAmount,
      monto_max: maxAmount || minAmount,
      comentarios: newOffer.comentarios || null,
      estado: "pendiente"
    });

    if (error) {
      toast.error("Error al enviar oferta");
      console.error(error);
      return;
    }

    toast.success("Oferta enviada exitosamente");
    setOpenOfferDialog(false);
    setNewOffer({ monto_min: "", monto_max: "", comentarios: "" });
    setSelectedAuto(null);
    setSelectedProfesional(null);
    loadData();
  };

  const updateOfferStatus = async (offerId: string, newStatus: string) => {
    const { error } = await supabase
      .from("ofertas")
      .update({ estado: newStatus })
      .eq("id", offerId);

    if (error) {
      toast.error("Error al actualizar oferta");
      return;
    }

    toast.success(`Oferta ${newStatus}`);
    loadData();
  };

  const filteredAutos = useMemo(() => {
    const q = search.toLowerCase();
    return autos.filter(auto => {
      const cliente = auto.cliente;
      return [
        auto.marca, auto.modelo, String(auto.ano),
        cliente?.nombre_apellido, cliente?.correo_electronico
      ].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    });
  }, [search, autos]);

  const getOfertasForAuto = (autoId: string) => {
    return ofertas.filter(oferta => oferta.auto_venta_id === autoId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <SectionHeader title="Gestión de Ofertas" count={ofertas.length} />
            <Button onClick={() => setOpenOfferDialog(true)}>Enviar Oferta Admin</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar autos por marca, modelo o cliente" />
          
          {loading ? (
            <div>Cargando ofertas...</div>
          ) : (
            <div className="space-y-4">
              {filteredAutos.map(auto => {
                const autosOfertas = getOfertasForAuto(auto.id);
                return (
                  <Card key={auto.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {auto.marca} {auto.modelo} {auto.ano}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {auto.kilometraje?.toLocaleString()} km • Estado: {auto.estado_auto}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cliente: {auto.cliente?.nombre_apellido} • {auto.cliente?.correo_electronico}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={auto.recibiendo_ofertas ? "default" : "secondary"}>
                            {auto.recibiendo_ofertas ? "Recibiendo ofertas" : "Pausado"}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {autosOfertas.length} ofertas
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {autosOfertas.length > 0 && (
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Profesional</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Comentarios</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {autosOfertas.map(oferta => (
                                <TableRow key={oferta.id}>
                                  <TableCell>
                                    {oferta.profesionales?.negocio_nombre || 'Admin'}
                                    <br />
                                    <span className="text-xs text-muted-foreground">
                                      {oferta.profesionales?.correo}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    ${oferta.monto_oferta?.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      oferta.estado === 'aceptada' ? 'default' :
                                      oferta.estado === 'rechazada' ? 'destructive' : 'outline'
                                    }>
                                      {oferta.estado}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(oferta.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate">
                                    {oferta.comentarios || '-'}
                                  </TableCell>
                                  <TableCell>
                                    {oferta.estado === 'pendiente' && (
                                      <div className="space-x-1">
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          onClick={() => updateOfferStatus(oferta.id, 'aceptada')}
                                        >
                                          Aceptar
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => updateOfferStatus(oferta.id, 'rechazada')}
                                        >
                                          Rechazar
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para enviar oferta como admin */}
      <Dialog open={openOfferDialog} onOpenChange={setOpenOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Oferta como Administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Seleccionar Auto</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedAuto || ''}
                onChange={(e) => setSelectedAuto(e.target.value)}
              >
                <option value="">Selecciona un auto...</option>
                {autos.filter(auto => auto.recibiendo_ofertas).map(auto => (
                  <option key={auto.id} value={auto.id}>
                    {auto.marca} {auto.modelo} {auto.ano} - {auto.cliente?.nombre_apellido}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Seleccionar Profesional</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedProfesional || ''}
                onChange={(e) => setSelectedProfesional(e.target.value)}
              >
                <option value="">Selecciona un profesional...</option>
                {profesionales.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.negocio_nombre} - {prof.contacto_principal}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto Mínimo (MXN)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input 
                    type="text" 
                    value={newOffer.monto_min} 
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setNewOffer({...newOffer, monto_min: formatted});
                    }}
                    placeholder="80,000"
                    className="pl-8"
                    style={{ appearance: 'textfield' }}
                  />
                </div>
              </div>
              <div>
                <Label>Monto Máximo (MXN) - Opcional</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input 
                    type="text" 
                    value={newOffer.monto_max} 
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setNewOffer({...newOffer, monto_max: formatted});
                    }}
                    placeholder="100,000"
                    className="pl-8"
                    style={{ appearance: 'textfield' }}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Comentarios (opcional)</Label>
              <Input 
                value={newOffer.comentarios} 
                onChange={(e) => setNewOffer({...newOffer, comentarios: e.target.value})}
                placeholder="Comentarios sobre la oferta..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenOfferDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={enviarOfertaAdmin}>
              Enviar Oferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
