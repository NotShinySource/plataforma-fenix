import { CLASE_CAMPO, CLASE_ETIQUETA } from "@/components/ui/estilos";
import type { RolUsuario } from "@/types";

interface CamposContactoProps {
  rol: RolUsuario;
  /** Distingue los id de los campos cuando hay más de un formulario en la página. */
  prefijoId: string;
  email: string;
  emailApoderado: string;
  onEmail: (valor: string) => void;
  onEmailApoderado: (valor: string) => void;
}

/** Correos según el rol: alumno → apoderado obligatorio + propio opcional; resto → propio obligatorio. */
export function CamposContacto({
  rol,
  prefijoId,
  email,
  emailApoderado,
  onEmail,
  onEmailApoderado,
}: CamposContactoProps) {
  if (rol === "alumno") {
    return (
      <>
        <div>
          <label htmlFor={`${prefijoId}-emailApoderado`} className={CLASE_ETIQUETA}>
            Correo del apoderado
          </label>
          <input
            id={`${prefijoId}-emailApoderado`}
            type="email"
            value={emailApoderado}
            onChange={(evento) => onEmailApoderado(evento.target.value)}
            required
            maxLength={254}
            placeholder="apoderado@gmail.com"
            className={CLASE_CAMPO}
          />
        </div>
        <div>
          <label htmlFor={`${prefijoId}-email`} className={CLASE_ETIQUETA}>
            Correo del estudiante{" "}
            <span className="normal-case font-semibold text-slate-600">(opcional)</span>
          </label>
          <input
            id={`${prefijoId}-email`}
            type="email"
            value={email}
            onChange={(evento) => onEmail(evento.target.value)}
            maxLength={254}
            placeholder="estudiante@gmail.com"
            className={CLASE_CAMPO}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      <label htmlFor={`${prefijoId}-email`} className={CLASE_ETIQUETA}>
        Correo
      </label>
      <input
        id={`${prefijoId}-email`}
        type="email"
        value={email}
        onChange={(evento) => onEmail(evento.target.value)}
        required
        maxLength={254}
        placeholder="docente@gmail.com"
        className={CLASE_CAMPO}
      />
    </div>
  );
}
