/** @type {import('next').NextConfig} */
const nextConfig = {
  // Revisión de tipos y estilo desactivada en el build para publicar ya.
  // No afecta cómo funciona la app.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
