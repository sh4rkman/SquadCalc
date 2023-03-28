const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'inline-source-map',
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeAttributeQuotes: true,
            }
        }),
        new WebpackPwaManifest({
            name: 'SquadCalc.app',
            short_name: 'squadcalc',
            description: 'My awesome Progressive Web App!',
            background_color: '#111111',
            inject: true,
            crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
            icons: [{
                src: path.resolve('src/img/favicons/android-chrome.png'),
                destination: '/src/favicons/',
                ios: true,
                sizes: [96, 128, 192, 256, 384, 512] // multiple sizes
            }]
        }),
        new MiniCssExtractPlugin({
            filename: 'src/css/[name].[contenthash].min.css',
        }),
    ],
    module: {
        rules: [{
            test: /\.(sc|sa|c)ss$/i,
            use: [
                MiniCssExtractPlugin.loader,
                { loader: 'css-loader', options: { url: true } },
                'sass-loader'
            ],

        }, ]
    },
    optimization: {
        minimizer: [
            new CssMinimizerPlugin(), //CSS
            new TerserPlugin(), //JS
        ],
    },
});