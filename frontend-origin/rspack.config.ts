import { defineConfig } from '@rspack/cli';
import HtmlRspackPlugin from '@rspack/plugin-html';
import path from 'node:path';

export default defineConfig({
  entry: {
    index: './src/main.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new HtmlRspackPlugin({
      template: './index.html',
      inject: 'body',
      scriptLoading: 'module',
      chunks: ['index'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.module\.css$/,
        type: 'css/module',
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css',
      },
      {
        test: /\.ts$/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  experiments: {
    css: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: 'static/js/[name].[contenthash:8].js',
    cssFilename: 'static/css/[name].[contenthash:8].css',
    clean: true,
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      hidePathInfo: true,
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all',
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  stats: {
    preset: 'normal',
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
});