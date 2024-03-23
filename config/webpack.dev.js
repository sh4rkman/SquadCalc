const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RobotstxtPlugin = require("robotstxt-webpack-plugin");

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
        new RobotstxtPlugin({
            policy: [{ userAgent: "*", disallow: "/", }]
        }),
        
    ],
});