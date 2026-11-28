/**
 * Archivos de prueba generados en memoria (sin depender de archivos en el
 * disco) y subida al emulador de Storage con un enlace de descarga igual al
 * que entrega getDownloadURL() en el navegador.
 */
import { randomUUID } from "node:crypto";

/** PDF mínimo válido de una página, con las posiciones de la tabla xref calculadas. */
export function generarPdfDePrueba(texto: string): Buffer {
  const contenido = `BT /F1 20 Tf 72 720 Td (${texto}) Tj ET`;
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const posiciones: number[] = [];
  objetos.forEach((objeto, indice) => {
    posiciones.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  posiciones.forEach((posicion) => {
    pdf += `${String(posicion).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

/** WAV PCM de 8 bits mono con una nota de la frecuencia indicada. */
export function generarWavDePrueba(frecuencia = 440, segundos = 3): Buffer {
  const frecuenciaMuestreo = 8000;
  const muestras = frecuenciaMuestreo * segundos;
  const buffer = Buffer.alloc(44 + muestras);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + muestras, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); // tamaño del bloque fmt
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(frecuenciaMuestreo, 24);
  buffer.writeUInt32LE(frecuenciaMuestreo, 28); // bytes por segundo
  buffer.writeUInt16LE(1, 32); // bytes por muestra
  buffer.writeUInt16LE(8, 34); // bits por muestra
  buffer.write("data", 36);
  buffer.writeUInt32LE(muestras, 40);
  for (let i = 0; i < muestras; i++) {
    buffer[44 + i] = 128 + Math.round(50 * Math.sin((2 * Math.PI * frecuencia * i) / frecuenciaMuestreo));
  }
  return buffer;
}

interface Bucket {
  name: string;
  file(ruta: string): {
    save(datos: Buffer, opciones: { contentType: string; metadata: { metadata: Record<string, string> } }): Promise<unknown>;
  };
}

/**
 * Sube un archivo al emulador de Storage y devuelve su enlace de descarga.
 * El enlace se arma con un token propio (firebaseStorageDownloadTokens), que
 * es lo mismo que hace getDownloadURL() en el navegador; el getDownloadURL
 * del Admin SDK no funciona contra el emulador.
 */
export async function subirAlEmulador(
  bucket: Bucket,
  ruta: string,
  datos: Buffer,
  contentType: string,
): Promise<string> {
  const token = randomUUID();
  await bucket.file(ruta).save(datos, {
    contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:9199";
  return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}`;
}
