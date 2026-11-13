"use client";

import { ListChecks } from "lucide-react";
import { useTareas } from "@/hooks/useTareas";
import { ListaTareas } from "@/components/intranet/alumno/ListaTareas";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { Modal } from "@/components/ui/Modal";

interface TareasElencoModalProps {
  elencoId: string;
  nombreElenco: string;
  alumnoId: string;
  onCerrar: () => void;
}

/**
 * Pop-up con las tareas de un solo elenco: las del elenco completo y las
 * dirigidas a este alumno. La consulta a Firestore ya viene filtrada: no trae
 * tareas ajenas para descartarlas después en el navegador.
 */
export function TareasElencoModal({
  elencoId,
  nombreElenco,
  alumnoId,
  onCerrar,
}: TareasElencoModalProps) {
  const { tareas, cargando, error } = useTareas([elencoId], alumnoId);

  return (
    <Modal
      titulo="Tareas del elenco"
      subtitulo={nombreElenco}
      icono={ListChecks}
      ancho="lg"
      onCerrar={onCerrar}
    >
      {cargando && <EstadoCargando texto="Cargando tareas..." />}
      {!cargando && error && <EstadoError mensaje={error} />}
      {!cargando && !error && <ListaTareas tareas={tareas} alumnoId={alumnoId} columnas={1} />}
    </Modal>
  );
}
