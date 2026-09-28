const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  /** @type {import('webpack').Configuration} */
  const config = {
    entry: {
      'background/service-worker': './src/background/service-worker.ts',
      'content/selection': './src/content/selection.ts',
      'content/fullpage': './src/content/fullpage.ts',
      'content/bridge': './src/content/bridge.ts',
      'popup/popup': './src/popup/popup.ts',
      'offscreen/offscreen': './src/offscreen/offscreen.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'src/popup/popup.html', to: 'popup/popup.html' },
          { from: 'src/offscreen/offscreen.html', to: 'offscreen/offscreen.html' },
          {
            from: 'src/icons',
            to: 'icons',
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devtool: isDev ? 'inline-source-map' : false,
    optimization: {
      minimize: !isDev,
    },
    // Target web for content scripts and popups
    target: ['web', 'es2020'],
    // Don't chunk — Chrome extensions need individual files
    optimization: {
      minimize: !isDev,
      splitChunks: false,
      runtimeChunk: false,
    },
  };

  return config;
};
