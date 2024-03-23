const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    module: {},
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
    ]
});