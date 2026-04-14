/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/modu_startup',
  assetPrefix: '/modu_startup',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
