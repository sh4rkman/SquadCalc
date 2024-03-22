const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
var WebpackPwaManifest = require('webpack-pwa-manifest')
const path = require('path');

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            favicon: './src/img/favicons/favicon.ico',
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeAttributeQuotes: true,
            }
          }),
        new RobotstxtPlugin({
            policy: [{ userAgent: "*", disallow: "/", }]
        }),
        new WebpackPwaManifest({
          name: 'quadCalc',
          short_name: 'SquadCalc',
          description: 'A Minimalist Mortar Calculator',
          background_color: '#111111',
          publicPath : './',
          fingerprints: false,
          theme_color: '#FFFFFF',
          inject: true,
          ios: true,
          crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
          icons: [
            {
              src: path.resolve('./src/img/favicons/favicon.png'),
              sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
              destination: path.join('src', 'img', 'favicons'),
            },
            {
              src: path.resolve('./src/img/favicons/favicon.png'),
              size: '1024x1024' // you can also use the specifications pattern
            },
            {
              src: path.resolve('./src/img/favicons/favicon.png'),
              size: '1024x1024',
              ios: true,
              purpose: 'maskable'
            }
          ]
        })
    ],
});