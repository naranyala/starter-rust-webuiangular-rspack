const path = require('path');
const HtmlRspackPlugin = require('html-rspack-plugin');

/**
 * Rspack configuration for Angular with Bun runtime
 * 
 * This configuration uses esbuild to compile TypeScript and relies on
 * Angular's JIT compiler in the browser.
 * SSR is disabled for WebUI compatibility.
 */
module.exports = {
  entry: {
    winbox: 'winbox/dist/winbox.bundle.min.js',
    main: './src/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist/angular-rspack-demo'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        resourceQuery: /raw/,
        type: 'asset/source',
      },
      {
        test: /\.html$/,
        loader: 'raw-loader',
      },
      {
        test: /\.css$/,
        resourceQuery: /raw/,
        type: 'asset/source',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.[cm]?ts$/,
        exclude: /[\/\\](?:core-js|zone\.js)[\/\\]/,
        use: {
          loader: 'esbuild-loader',
          options: {
            target: 'es2022',
            tsconfigRaw: {
              compilerOptions: {
                target: 'es2022',
                module: 'es2022',
                moduleResolution: 'bundler',
                experimentalDecorators: true,
                useDefineForClassFields: false,
                esModuleInterop: true,
                skipLibCheck: true,
              },
            },
          },
        },
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/,
        type: 'asset',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset',
      },
    ],
  },
  plugins: [
    new HtmlRspackPlugin({
      template: './src/index.html',
      scriptLoading: 'blocking',
      entryNames: ['winbox', 'main'],
    }),
  ],
  optimization: {
    minimize: true,
    splitChunks: false,
  },
  experiments: {
    rspackFuture: {
      bundlerInfo: {
        force: false,
      },
    },
  },
  devServer: {
    port: 4200,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, 'src'),
    },
  },
};
