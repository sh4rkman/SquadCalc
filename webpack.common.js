const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/app.js',
        utils: './src/js/utils.js',
        tooltips: './src/js/tooltips.js',
        weapon: './src/js/weapons.js',
        map: './src/js/maps.js',
        data: './src/js/conf.js',
        listeners: './src/js/listeners.js',
    },
    output: {
        filename: './src/js/[name].[contenthash].min.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        assetModuleFilename: '[path][name].[contenthash][ext]'
    },
    module: {
        rules: [{
                test: /\.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ]
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
        },
    },
    plugins: [
        /* Use the ProvidePlugin constructor to inject jquery implicit globals */
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery'",
            "window.$": "jquery"
        })
    ]
};