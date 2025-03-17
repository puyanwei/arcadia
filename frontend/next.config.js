/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...(config.externals || []), { bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate" }];
    return config;
  },
  // Ensure we're using the correct port
  env: {
    PORT: process.env.PORT || '8080'
  }
};

module.exports = nextConfig;
