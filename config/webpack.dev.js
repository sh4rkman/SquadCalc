const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RobotstxtPlugin = require("robotstxt-webpack-plugin");

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
        
    ],
});