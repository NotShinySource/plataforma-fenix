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
npm run seed:demo             # datos de demostración en el emulador
npm run dev
```

`npm run seed:demo` deja la plataforma lista para mostrarla. Se puede
ejecutar varias veces sin duplicar datos y solo funciona contra el emulador.
Crea:

- las cuentas de los tres roles y cuatro alumnos ficticios;
- las escuelas y dos elencos;
- el semestre en curso, con una clase del Coro **hoy** a las 17:00, para
  iniciarla y tomar asistencia;
- tres clases ya realizadas con su asistencia;
- material, avisos y tareas.

Al final imprime los RUT y las contraseñas. `npm run seed` crea solo las
cuentas base y un elenco.

Con `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` la aplicación usa los emuladores.
Los correos no se envían: se imprimen en la terminal del servidor.

## Variables de entorno (`.env.local`, nunca en git)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Configuración web del proyecto Firebase |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | `true` para trabajar contra los emuladores |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Cuenta de servicio del Admin SDK. No se usan en App Hosting, donde el servidor se autentica con la cuenta de servicio del proyecto |
| `FENIX_CLAVE_HMAC` | Clave (32 bytes en base64) para derivar el identificador de cada cuenta a partir del RUT |
| `FENIX_CLAVE_CIFRADO` | Clave (32 bytes en base64) para cifrar los datos personales |
| `CORREO_USUARIO`, `CORREO_CONTRASENA_APLICACION` | Cuenta SMTP para los enlaces de activación y recuperación |
| `CORREO_MODO` | Opcional: `smtp` o `consola` |
| `APP_URL` | URL pública usada en los enlaces de los correos. Opcional en Vercel y en desarrollo; **obligatoria en App Hosting** |
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

## Producción en Firebase App Hosting

La configuración está en `apphosting.yaml`. App Hosting exige el plan Blaze y
cobra por uso; la cuenta de facturación del proyecto debe ser la de la
institución.

1. **Facturación y alertas.** Vincular el proyecto a la cuenta de facturación
   de la institución y crear alertas de presupuesto (por ejemplo, USD 5 y
   USD 10) en Google Cloud. Las alertas avisan, pero no detienen el gasto: el
   tope real lo da `maxInstances` en `apphosting.yaml`.
2. **Secretos.** Crear cada secreto de `apphosting.yaml` con
   `firebase apphosting:secrets:set <nombre>`. `fenix-clave-hmac` y
   `fenix-clave-cifrado` deben tener **los mismos valores que la producción
   actual**: con ellos están cifrados los datos y derivados los
   identificadores de inicio de sesión.
3. **Backend.** `firebase apphosting:backends:create`, conectado a este
   repositorio, rama `main` y carpeta raíz `/`. Elegir la región más cercana
   a Firestore (`southamerica-east1`) entre las que ofrezca App Hosting.
4. **Permisos de los secretos.**
   `firebase apphosting:secrets:grantaccess <nombre> --backend <backend>`
   para cada uno.
5. **`APP_URL`.** Descomentarla en `apphosting.yaml` con la dirección del
   backend (`https://<backend>--<proyecto>.<región>.hosted.app`) y, más
   adelante, con el dominio propio.
6. **Probar en la dirección del backend:** inicio de sesión de los tres
   roles, activación de una cuenta por correo (el correo se envía con
   `after()`, después de responder: confirmar que llega), subida y descarga de
   material, edición de la Landing y una página inexistente (404).
7. **Limpieza de imágenes.** En Artifact Registry, regla para conservar solo
   las últimas 5 imágenes del backend; cada despliegue guarda una.
8. **Dominio.** Conectar el dominio `.cl` desde la consola de App Hosting y
   actualizar `APP_URL`.
9. **Retirar Vercel.** Borrar sus variables de entorno, desconectar el
   repositorio y revocar en Google Cloud la clave de la cuenta de servicio
   que usaba (`FIREBASE_ADMIN_PRIVATE_KEY`).
