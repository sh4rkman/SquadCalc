const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
    mode: 'production',
    devtool: 'inline-source-map',
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
            //chunkFilename: "[id].css",
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeAttributeQuotes: true,
            }
        }),
    ],
    module: {
        rules: [{
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
        }, ]
    },
    optimization: {
        runtimeChunk: 'single',
        minimizer: [
            new CssMinimizerPlugin(), //CSS
            new TerserPlugin(), //JS
        ],
    },
});