const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: './src/app.js',
    output: {
        filename: './src/js/[name].[contenthash].min.js',
        path: path.join(process.cwd(), 'dist'),
        publicPath: 'auto',
        clean: true,
        assetModuleFilename: '[path][name][ext]'
    },
    module: {
        rules: [
            { test: /\.html$/i, loader: "html-loader", },
            { test: /\.(png|svg|jpg|jpeg|gif)$/i, type: 'asset/resource', },
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
              { from: "./src/img/maps/", to: "./src/img/maps/" },
            ],
          }),
    ],
    // Disable warning message for big chuncks
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};