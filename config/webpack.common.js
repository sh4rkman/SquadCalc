require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
var WebpackPwaManifest = require('webpack-pwa-manifest')
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const workbox = require("workbox-webpack-plugin");
const isProduction = process.env.PROD && process.env.PROD.toLowerCase() === 'true';
const isIndexed = process.env.INDEX && process.env.INDEX.toLowerCase() === 'true';
const robotstxtPolicy = isIndexed 
    ? [{ userAgent: "*", allow: "/" }] 
    : [{ userAgent: "*", disallow: "/" }];



module.exports = {
    entry: './src/app.js',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    output: {
        filename: './src/js/[name].[contenthash].min.js',
        path: path.join(process.cwd(), 'dist'),
        publicPath: '',
        clean: true,
        assetModuleFilename: '[path][name].[contenthash][ext]'
    },
    module: {
        rules: [
            { test: /\.html$/i, loader: "html-loader", },
            { test: /\.(png|svg|jpg|jpeg|gif|webp)$/i, type: 'asset/resource', },
            { test: /\.(sc|sa|c)ss$/i, use: ['style-loader', 'css-loader', 'sass-loader'],},
        ],  
    }, 
    plugins: [
        new Dotenv(),
        new HtmlWebpackPlugin({
          template: './src/index.html',
          minify: isProduction ? {
              collapseWhitespace: true,
              removeComments: true,
              removeAttributeQuotes: true,
          } : false
        }),
        new webpack.ProvidePlugin({
            $: "jquery", jQuery: "jquery", "window.jQuery": "jquery'", "window.$": "jquery"
        }),
        new RobotstxtPlugin({
          policy: robotstxtPolicy,
        }),
        new CopyPlugin({
            patterns: [
              { from: "./src/img/github/", to: "./src/img/github/" },
            ],
        }),
        new WebpackPwaManifest({
          name: 'SquadCalc',
          short_name: 'SquadCalc',
          start_url: "/",
          description: 'A Complete Mortar Calculator for Squad',
          background_color: '#111111',
          publicPath : './',
          fingerprints: false,
          theme_color: '#FFFFFF',
          inject: true,
          ios: true,
          crossorigin: 'use-credentials',
          icons: [
            {
              src: path.resolve('./src/img/favicons/maskable_icon_x512.png'),
              sizes: [96, 192, 256, 384, 512],
              destination: path.join('src', 'img', 'favicons'),
            },
            {
              src: path.resolve('./src/img/favicons/maskable_icon_x512.png'),
              size: '1024x1024',
              destination: path.join('src', 'img', 'favicons'),
              ios: true,
              purpose: 'maskable'
            }
          ],
          screenshots : [
            {
              "src": "./src/img/github/mobile_ui.webp",
              "sizes": "748x1568",
              "type": "image/webp",
              "form_factor": "narrow",
              "label": "Map View"
            },
            {
              "src": "./src/img/github/mobile.webp",
              "sizes": "748x1568",
              "type": "image/webp",
              "form_factor": "narrow",
              "label": "Minimalist/keyboard friendly calculator"
            },
            {
              "src": "./src/img/github/desktop_ui_1.webp",
              "sizes": "800x553",
              "type": "image/webp",
              "form_factor": "wide",
              "label": "Map Mode"
            },
            {
              "src": "./src/img/github/desktop_ui_2.webp",
              "sizes": "800x553",
              "type": "image/webp",
              "form_factor": "wide",
              "label": "Topographic maps"
            },           
            {
              "src": "./src/img/github/desktop_ui_3.webp",
              "sizes": "800x553",
              "type": "image/webp",
              "form_factor": "wide",
              "label": "Weapon Stats"
            },
            {
              "src": "./src/img/github/desktop_ui_4.webp",
              "sizes": "800x553",
              "type": "image/webp",
              "form_factor": "wide",
              "label": "Target Stats"
            },
            {
              "src": "./src/img/github/desktop_ui_0.webp",
              "sizes": "800x553",
              "type": "image/webp",
              "form_factor": "wide",
              "label": "Legacy Mode"
            },
          ]
        }),
        new workbox.GenerateSW({
          swDest: "./sw.js",
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 10000000,
          exclude: [
            /manifest\.json$/, // web app manifest
            /\.map$/, // source maps
            /\/favicons\//, // favicon
            /robots\.txt/, // robots.txt
          ],
          runtimeCaching: [{
            urlPattern: new RegExp(/\/maps\/[^\/]+\/[^\/]+\/[1-5]/),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'squadcalc-tiles',
            },
          }],
        })
    ],
    // Disable warning message for big chuncks
    performance: {
        hints: false,
        maxEntrypointSize: isProduction ? 512000 : Infinity,
        maxAssetSize: isProduction ? 512000 : Infinity,
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
          cacheGroups: {
              vendor: {
                  test: /[\\/]node_modules[\\/]/,
                  name: 'vendors',
                  chunks: 'all',
                  maxSize: isProduction ? 50000 : Infinity,
              },
          },
      },
      minimizer: isProduction ? [
          new CssMinimizerPlugin(), //CSS
          new TerserPlugin({
              extractComments: false,
              terserOptions: {
                  format: {
                      comments: false,
                  },
              },
          }),
      ] : [],
  },
};