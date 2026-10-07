import type { NextConfig } from "next";

const OLD_HOST = "facturation.forestar.be";

const nextConfig: NextConfig = {
  //output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // L'ancien domaine ne sert plus l'application : une page fixe annonce la
  // nouvelle adresse, pour que les favoris soient mis à jour.
  async rewrites() {
    return {
      beforeFiles: [
        {
          // tout sauf le logo affiché par la page
          source: "/:path((?!logo-70x70\\.png$).*)",
          has: [{ type: "host", value: OLD_HOST }],
          destination: "/ancien-domaine.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: OLD_HOST }],
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
