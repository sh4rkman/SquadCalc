const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
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
        new RobotstxtPlugin({ policy: [{ userAgent: "*", allow: "/", }] }),

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