const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    entry: {
        app: './src/app.js',
        utils: './src/js/utils.js',
        tooltips: './src/js/tooltips.js',
        weapon: './src/js/weapon.js',
        data: './src/js/data.js',
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "./src/img/heightmaps/", to: "./heightmaps/" },
            ],
        }),
    ],
    output: {
        filename: '[name].[contenthash].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [{
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
            },
        ],
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
        },
    },

};