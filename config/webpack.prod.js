const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
const WebpackPwaManifest = require('webpack-pwa-manifest')

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeAttributeQuotes: true,
            }
        }),
        new RobotstxtPlugin({ policy: [{ userAgent: "*", allow: "/", }] }),
        new WebpackPwaManifest({
            name: 'SquadCalc',
            short_name: 'SquadCalc',
            description: 'A Minimalist Squad Mortar Calculator',
            start_url: "https://squadcalc.app/",
            background_color: '#111111',
            theme_color: '#111111',
            crossorigin: 'use-credentials',
            icons: [{
                    // Default .ico
                    src: path.resolve('src/img/favicons/favicon.ico'),
                    sizes: [16, 32],
                },
                {
                    // General use iOS/Android
                    src: path.resolve('src/img/favicons/favicon.png'),
                    size: 180,
                    destination: path.join('src', 'img', 'favicons'),
                    ios: true,
                },
                {
                    // 
                    src: path.resolve('src/img/favicons/favicon.png'),
                    sizes: [32, 57, 76, 96, 120, 128, 144, 152, 195, 196],
                    destination: path.join('src', 'img', 'favicons'),
                },
                {
                    // Mask for Safari
                    src: path.resolve('src/img/favicons/favicon.svg'),
                    size: '1024x1024',
                    destination: path.join('src', 'img', 'favicons'),
                    purpose: 'maskable'
                }
            ]
        }),

    ],
    module: {},
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
});