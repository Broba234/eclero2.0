/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure ESM packages like Excalidraw are transpiled for production builds
  transpilePackages: ['@excalidraw/excalidraw'],
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
