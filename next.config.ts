import type { NextConfig } from "next";

const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  images: {
    // Imágenes de la Landing subidas por el Administrador: solo las de
    // nuestro bucket de Storage. El parámetro "token" de cada enlace cambia,
    // por eso no se fija "search".
    remotePatterns: bucket
      ? [{ protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: `/v0/b/${bucket}/o/**` }]
      : [],
  },
};

export default nextConfig;
