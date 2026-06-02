import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/console/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
