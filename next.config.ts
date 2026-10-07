import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // R004 : l'ancien domaine renvoie en 308 vers le même chemin du nouveau.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "facturation.forestar.be" }],
        destination: "https://rapprochement.forestar.be/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
