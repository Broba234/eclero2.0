/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure ESM packages like Excalidraw are transpiled for production builds
  transpilePackages: ['@excalidraw/excalidraw'],
  // Add empty turbopack config to silence the error
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /@supabase\/realtime-js\/dist\/module\/lib\/websocket-factory\.js/,
        },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;