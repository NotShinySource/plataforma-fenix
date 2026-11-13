export type TipoArchivo = "pdf" | "mp3" | "wav";

export interface Archivo {
  elencoId: string;
  profesorId: string;
  tipo: TipoArchivo;
  categoria: string;
  titulo: string;
  nombreArchivo: string;
  urlStorage: string;
  tamanioBytes: number;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente: la fecha la fija el servidor. */
  fechaSubida: Date;
}
