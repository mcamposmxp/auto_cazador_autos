import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalificacionEstrellas } from '@/components/reviews/CalificacionEstrellas';
import { useToast } from '@/hooks/use-toast';
import { useMensajeriaProfesional } from '@/hooks/useMensajeriaProfesional';

interface FormularioEvaluacionProfesionalProps {
  interaccion: {
    id: string;
    nombre_otro_profesional: string;
    es_iniciador: boolean;
    autos_profesional_inventario: {
      marca: string;
      modelo: string;
      ano: number;
      precio_actual: number;
    };
    fecha_limite_evaluacion: string;
    mi_evaluacion_existente?: any;
  };
  profesionalEvaluadoId: string;
  onEvaluacionCreada: () => void;
  onCancelar: () => void;
}

export function FormularioEvaluacionProfesional({
  interaccion,
  profesionalEvaluadoId,
  onEvaluacionCreada,
  onCancelar
}: FormularioEvaluacionProfesionalProps) {
  const [calificacion, setCalificacion] = useState(0);
  const [tipoInteraccion, setTipoInteraccion] = useState<'compra' | 'venta' | ''>('');
  const [comentario, setComentario] = useState('');
  const [aspectos, setAspectos] = useState({
    puntualidad: 0,
    comunicacion: 0,
    profesionalismo: 0,
    transparencia: 0,
    conocimiento: 0
  });
  const [enviando, setEnviando] = useState(false);

  const { toast } = useToast();
  const { crearEvaluacionPendiente } = useMensajeriaProfesional();

  const handleSubmit = async () => {
    if (calificacion === 0) {
      toast({
        title: "Error",
        description: "Debes asignar una calificación general",
        variant: "destructive"
      });
      return;
    }

    if (!tipoInteraccion) {
      toast({
        title: "Error",
        description: "Debes seleccionar el tipo de interacción",
        variant: "destructive"
      });
      return;
    }

    setEnviando(true);
    try {
      const exito = await crearEvaluacionPendiente({
        interaccion_id: interaccion.id,
        evaluado_id: profesionalEvaluadoId,
        tipo_interaccion: tipoInteraccion,
        calificacion,
        aspectos,
        comentario: comentario.trim() || undefined
      });

      if (exito) {
        toast({
          title: "Evaluación enviada",
          description: "Tu evaluación ha sido registrada. Se revelará cuando ambos hayan evaluado o expire el tiempo límite.",
          duration: 5000
        });
        onEvaluacionCreada();
      }
    } catch (error) {
      console.error('Error enviando evaluación:', error);
    } finally {
      setEnviando(false);
    }
  };

  const fechaLimite = new Date(interaccion.fecha_limite_evaluacion);
  const diasRestantes = Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluar a {interaccion.nombre_otro_profesional}</CardTitle>
        <div className="text-sm text-muted-foreground">
          <p><strong>Vehículo:</strong> {interaccion.autos_profesional_inventario.marca} {interaccion.autos_profesional_inventario.modelo} {interaccion.autos_profesional_inventario.ano}</p>
          <p><strong>Precio:</strong> ${interaccion.autos_profesional_inventario.precio_actual.toLocaleString()}</p>
          {diasRestantes > 0 && (
            <p className="text-amber-600 mt-2">
              ⏰ Quedan {diasRestantes} días para evaluar
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Información de privacidad */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🔒 Evaluación Protegida
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Tu evaluación permanecerá oculta hasta que:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside mt-1">
            <li>Ambos profesionales hayan evaluado, O</li>
            <li>Expire el tiempo límite ({diasRestantes} días restantes)</li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Esto evita evaluaciones de revancha y garantiza honestidad.
          </p>
        </div>

        {/* Tipo de interacción */}
        <div>
          <Label htmlFor="tipo-interaccion">Tipo de interacción</Label>
          <Select value={tipoInteraccion} onValueChange={(value: 'compra' | 'venta') => setTipoInteraccion(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo de interacción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compra">Como comprador (evalúo al vendedor)</SelectItem>
              <SelectItem value="venta">Como vendedor (evalúo al comprador)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calificación general */}
        <div>
          <Label>Calificación general *</Label>
          <div className="mt-2">
            <CalificacionEstrellas
              calificacion={calificacion}
              onCalificacionChange={setCalificacion}
              interactive={true}
              size="lg"
            />
          </div>
        </div>

        {/* Aspectos específicos */}
        <div>
          <Label>Aspectos específicos</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {[
              { key: 'puntualidad', label: 'Puntualidad' },
              { key: 'comunicacion', label: 'Comunicación' },
              { key: 'profesionalismo', label: 'Profesionalismo' },
              { key: 'transparencia', label: 'Transparencia' },
              { key: 'conocimiento', label: 'Conocimiento del mercado' }
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-sm">{label}</Label>
                <CalificacionEstrellas
                  calificacion={aspectos[key as keyof typeof aspectos]}
                  onCalificacionChange={(valor) => setAspectos(prev => ({ ...prev, [key]: valor }))}
                  interactive={true}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Comentario */}
        <div>
          <Label htmlFor="comentario">Comentario (opcional)</Label>
          <Textarea
            id="comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Describe tu experiencia con este profesional..."
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">
            💰 ¡Incluye un comentario y recibe 2 créditos gratis! (Máximo 10 créditos por mes)
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={calificacion === 0 || !tipoInteraccion || enviando}
            className="flex-1"
          >
            {enviando ? 'Enviando...' : 'Enviar evaluación'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </Button>
        </div>

        {/* Nota final */}
        <p className="text-xs text-muted-foreground">
          * Las evaluaciones ayudan a construir confianza en la comunidad profesional
        </p>
      </CardContent>
    </Card>
  );
}