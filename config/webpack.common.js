const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
var WebpackPwaManifest = require('webpack-pwa-manifest')
const workbox = require("workbox-webpack-plugin");

module.exports = {
    entry: './src/app.js',
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
    optimization: {
        moduleIds: 'deterministic',
         runtimeChunk: 'single',
         splitChunks: {
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                maxSize: 50000,
              },
           },
         },
       },
    plugins: [
        // Use the ProvidePlugin constructor to inject jquery implicit globals
        new webpack.ProvidePlugin({
            $: "jquery", jQuery: "jquery", "window.jQuery": "jquery'", "window.$": "jquery"
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
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    optimization: {
      minimizer: [
          new CssMinimizerPlugin(), //CSS
          new TerserPlugin({ //JS
              extractComments: false,
              terserOptions: {
                format: {
                  comments: false, // remove *.LICENCE.txt
                },
              },
            }), 
      ],
  },
};