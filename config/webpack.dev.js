const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const RobotstxtPlugin = require("robotstxt-webpack-plugin");

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
        new MiniCssExtractPlugin({
            filename: 'src/css/[name].[contenthash].min.css',
        }),
        new RobotstxtPlugin({
            policy: [{ userAgent: "*", disallow: "/", }]
        }),
    ],
    module: {},
    optimization: {
        minimizer: [
            new CssMinimizerPlugin(), //CSS
            new TerserPlugin(), //JS
        ],
    },
});