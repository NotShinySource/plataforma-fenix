export * from "./usuario";
export * from "./elenco";
export * from "./archivo";
export * from "./asistencia";
export * from "./aviso";

/** Añade el ID del documento a un tipo de dominio al leerlo de Firestore. */
export type ConId<T> = T & { id: string };
