/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const { withSentryConfig } = require('@sentry/nextjs');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const nextConfig = {
  // Optimize build performance
  swcMinify: true,
  
  // Optimize image loading
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost'],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize for production
  poweredByHeader: false,
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // When ANALYZE is enabled, also emit stats.json for CI budget check
    if (process.env.ANALYZE === 'true') {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new BundleAnalyzerPlugin({ analyzerMode: 'disabled', generateStatsFile: true, statsFilename: 'stats.json' })
      );
    }
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Don't fail build on lint errors during development
    ignoreDuringBuilds: false,
  },
};

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), { silent: true });