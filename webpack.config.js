const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
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
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { sourceMap: !isProduction } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    postcssPresetEnv({
                      browsers: [
                        'last 2 versions',
                        '> 0.5%',
                        'not dead',
                        'ie 11',
                        'Safari 9',
                      ],
                      autoprefixer: { grid: true },
                    }),
                  ],
                },
                sourceMap: !isProduction,
              },
            },
            { loader: 'sass-loader', options: { sourceMap: !isProduction } },
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: [
                        'last 2 versions',
                        '> 0.5%',
                        'not dead',
                        'ie 11',
                        'Safari 9',
                      ],
                    },
                    useBuiltIns: 'usage',
                    corejs: { version: 3, proposals: false },
                  },
                ],
              ],
              sourceMaps: !isProduction,
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
        new TerserPlugin({ extractComments: false }),
        new CssMinimizerPlugin(),
      ],
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'build'),
      },
      compress: true,
      port: 8080,
      hot: true,
      watchFiles: ['src/**/*.html'],
      liveReload: true,
      open: true,
      devMiddleware: {
        writeToDisk: true,
      },
    },
    devtool: isProduction ? false : 'source-map',
    resolve: {
      modules: ['node_modules'],
    },
  };
};