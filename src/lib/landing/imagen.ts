/**
 * El optimizador de imágenes de Next.js no descarga desde direcciones
 * locales (127.0.0.1), así que en desarrollo las imágenes del emulador de
 * Storage se muestran sin optimizar. En producción vienen de
 * firebasestorage.googleapis.com y sí se optimizan.
 */
export function sinOptimizar(url: string): boolean {
  return url.startsWith("http://127.0.0.1");
}
