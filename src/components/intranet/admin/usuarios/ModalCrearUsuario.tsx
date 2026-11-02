"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { rutEsValido } from "@/lib/auth/rut";
import { fechaAValorInput, formatearRutInput } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { crearUsuarioAction, type RolCreable } from "@/app/(intranet)/admin/usuarios/actions";
import { CamposContacto } from "./CamposContacto";
import { ETIQUETA_ROL } from "./etiquetas";

export interface BorradorUsuario {
  nombres: string;
  apellidos: string;
  rut: string;
  rol: RolCreable;
  fechaNacimiento: string;
  email: string;
  emailApoderado: string;
}

export const BORRADOR_VACIO: BorradorUsuario = {
  nombres: "",
  apellidos: "",
  rut: "",
  rol: "alumno",
  fechaNacimiento: "",
  email: "",
  emailApoderado: "",
};

interface ModalCrearUsuarioProps {
  /**
   * Lo escrito vive en la página y no en la ventana: si se cierra sin
   * querer, al reabrirla el formulario sigue como estaba.
   */
  borrador: BorradorUsuario;
  onBorrador: (borrador: BorradorUsuario) => void;
  onCerrar: () => void;
  /** Recibe el nombre completo de la cuenta creada. */
  onCreado: (nombre: string) => void;
}

export function ModalCrearUsuario({ borrador, onBorrador, onCerrar, onCreado }: ModalCrearUsuarioProps) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiar<K extends keyof BorradorUsuario>(campo: K, valor: BorradorUsuario[K]) {
    onBorrador({ ...borrador, [campo]: valor });
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!rutEsValido(borrador.rut)) {
      setError("El RUT ingresado no es válido (dígito verificador incorrecto).");
      return;
    }
    if (!auth.currentUser) return;

    setEnviando(true);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await crearUsuarioAction({
        ...borrador,
        emailApoderado: borrador.rol === "alumno" ? borrador.emailApoderado : "",
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear el usuario.");
        return;
      }
      onCreado(`${borrador.nombres.trim()} ${borrador.apellidos.trim()}`);
    } catch {
      setError("No se pudo crear el usuario. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Nuevo usuario"
      subtitulo="Alta de alumnos y docentes"
      icono={UserPlus}
      ancho="lg"
      bloqueado={enviando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <span className={CLASE_ETIQUETA}>Rol</span>
          <div className="grid grid-cols-2 gap-2">
            {(["alumno", "profesor"] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => cambiar("rol", opcion)}
                aria-pressed={borrador.rol === opcion}
                className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                  borrador.rol === opcion
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/40"
                }`}
              >
                {ETIQUETA_ROL[opcion]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombres" className={CLASE_ETIQUETA}>
              Nombres
            </label>
            <input
              id="nombres"
              type="text"
              value={borrador.nombres}
              onChange={(evento) => cambiar("nombres", evento.target.value)}
              required
              maxLength={100}
              autoFocus
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="apellidos" className={CLASE_ETIQUETA}>
              Apellidos
            </label>
            <input
              id="apellidos"
              type="text"
              value={borrador.apellidos}
              onChange={(evento) => cambiar("apellidos", evento.target.value)}
              required
              maxLength={100}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="rut" className={CLASE_ETIQUETA}>
              RUT
            </label>
            <input
              id="rut"
              type="text"
              placeholder="Ej: 21.345.678-9"
              value={borrador.rut}
              onChange={(evento) => cambiar("rut", formatearRutInput(evento.target.value))}
              required
              maxLength={12}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="fechaNacimiento" className={CLASE_ETIQUETA}>
              Fecha de nacimiento
            </label>
            <input
              id="fechaNacimiento"
              type="date"
              value={borrador.fechaNacimiento}
              onChange={(evento) => cambiar("fechaNacimiento", evento.target.value)}
              required
              min="1900-01-01"
              max={fechaAValorInput(new Date())}
              className={CLASE_CAMPO}
            />
          </div>
        </div>

        <CamposContacto
          rol={borrador.rol}
          prefijoId="crear"
          email={borrador.email}
          emailApoderado={borrador.emailApoderado}
          onEmail={(valor) => cambiar("email", valor)}
          onEmailApoderado={(valor) => cambiar("emailApoderado", valor)}
        />

        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          No se define una contraseña aquí: el usuario la crea con el enlace que recibe en el
          correo registrado.
        </p>

        {error && (
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCerrar} disabled={enviando} className={CLASE_BOTON_SECUNDARIO}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={CLASE_BOTON_PRIMARIO}>
            {enviando ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
