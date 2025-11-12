const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

module.exports = (env = {}) => {
  const isProduction = env.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',

    entry: {
      main: './src/scripts/main.js',
    },

    output: {
      filename: '[name].min.js',
      path: path.resolve(__dirname, 'build/scripts'),
      clean: false,
    },

    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isProduction,
                url: false, // ← ОТКЛЮЧЕНО — не ломаем сборку
                importLoaders: 2, // ← ОБЯЗАТЕЛЬНО: для @import
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: !isProduction,
                postcssOptions: {
                  plugins: [
                    postcssPresetEnv({
                      stage: 3,
                      autoprefixer: { grid: true },
                    }),
                  ],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: { sourceMap: !isProduction },
            },
          ],
        },
        {
          test: /\.css$/,
          include: /node_modules/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { sourceMap: !isProduction } },
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: '> 0.5%, last 2 versions, not dead',
                  useBuiltIns: 'usage',
                  corejs: 3,
                }],
              ],
            },
          },
        },
      ],
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: '../styles/style.min.css',
      }),
      ...(!isProduction ? [new webpack.HotModuleReplacementPlugin()] : []),
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        '...', // Сохраняет TerserPlugin для JS
        new CssMinimizerPlugin(),
      ],
    },

    devServer: {
      static: { directory: path.join(__dirname, 'build') },
      compress: true,
      port: 8080,
      hot: true,
      liveReload: true,
      open: true,
      devMiddleware: { writeToDisk: true }, // ← важно для Gulp
    },

    devtool: isProduction ? false : 'source-map',
  };
};