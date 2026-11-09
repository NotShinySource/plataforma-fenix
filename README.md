# Plataforma Fénix

Sitio público e intranet de la Escuela de Música Calambanda (Calama, Chile).
La intranet tiene tres roles: alumno, docente y administración. Cada uno ve
sus elencos, el material de estudio, las clases y la asistencia, las tareas y
los avisos.

**Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Firebase
(Authentication, Firestore, Storage) y Server Actions para la lógica de
servidor.

## Requisitos

- Node.js 20 o superior.
- Firebase CLI (`npm install -g firebase-tools`) y **JDK 21**, para los
  emuladores locales.

## Puesta en marcha

```bash
npm ci
firebase emulators:start      # en otra terminal
npm run seed                  # usuarios y elenco de prueba en el emulador
npm run dev
```

Con `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` la aplicación usa los emuladores.
Los correos no se envían: se imprimen en la terminal del servidor.

## Variables de entorno (`.env.local`, nunca en git)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Configuración web del proyecto Firebase |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | `true` para trabajar contra los emuladores |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Cuenta de servicio del Admin SDK |
| `FENIX_CLAVE_HMAC` | Clave (32 bytes en base64) para derivar el identificador de cada cuenta a partir del RUT |
| `FENIX_CLAVE_CIFRADO` | Clave (32 bytes en base64) para cifrar los datos personales |
| `CORREO_USUARIO`, `CORREO_CONTRASENA_APLICACION` | Cuenta SMTP para los enlaces de activación y recuperación |
| `CORREO_MODO` | Opcional: `smtp` o `consola` |
| `APP_URL` | Opcional: URL pública usada en los enlaces de los correos |
| `ADMIN_*` | Solo para `npm run seed:admin` |

Si se pierde `FENIX_CLAVE_CIFRADO`, los datos cifrados no se pueden
recuperar. Ambas claves deben tener respaldo en un lugar seguro.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Revisión de tipos con TypeScript |
| `npm test` | Pruebas de unidad (lógica pura, sin Firebase) |
| `npm run test:reglas` | Pruebas de las reglas de Firestore y Storage contra el emulador |
| `npm run seed`, `seed:admin`, `seed:tareas` | Datos de prueba y cuenta de administración |

Si `npm run dev` entra en un ciclo de recargas después de un `npm run build`,
borra la carpeta `.next`.
