const path = require('path');

module.exports = {
    entry: {
        app: './src/app.js',
        utils: './src/js/utils.js',
        tooltips: './src/js/tooltips.js',
        weapon: './src/js/weapon.js',
        data: './src/js/data.js',
    },
    output: {
        filename: './src/js/[name].[contenthash].bundle.js',
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

};