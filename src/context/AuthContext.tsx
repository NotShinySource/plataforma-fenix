"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { RolUsuario } from "@/types";

interface AuthContextValue {
  usuario: User | null;
  rol: RolUsuario | null;
  cargando: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, async (usuarioActual) => {
      if (!usuarioActual) {
        setUsuario(null);
        setRol(null);
        setCargando(false);
        return;
      }

      // El rol vive en el Custom Claim del token,
      // no se lee de Firestore aquí para no depender de un get() extra.
      const resultadoToken = await usuarioActual.getIdTokenResult();
      setUsuario(usuarioActual);
      setRol((resultadoToken.claims.rol as RolUsuario | undefined) ?? null);
      setCargando(false);
    });

    return desuscribir;
  }, []);

  async function logout(): Promise<void> {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ usuario, rol, cargando, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
