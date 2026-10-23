import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-native-fs': false,
      };
    }
    return config;
  },
};

export default nextConfig;
