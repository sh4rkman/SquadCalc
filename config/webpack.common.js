const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    stats: 'verbose',
    entry: './src/app.js',
    output: {
        filename: './src/js/[name].[contenthash].min.js',
        path: path.join(process.cwd(), 'dist'),
        publicPath: 'auto',
        clean: true,
        assetModuleFilename: '[path][name].[contenthash][ext]'
    },
    module: {
        rules: [
            { test: /\.html$/i, loader: "html-loader", },
            { test: /\.(png|svg|jpg|jpeg|gif|webp)$/i, type: 'asset/resource', },
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
                maxSize: 50000,
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
              { from: "./src/img/maps/albasrah/", to: "./src/img/maps/albasrah/" },
              { from: "./src/img/maps/anvil/", to: "./src/img/maps/anvil/" },
              { from: "./src/img/maps/belaya/", to: "./src/img/maps/belaya/" },
              { from: "./src/img/maps/blackcoast/", to: "./src/img/maps/blackcoast/" },
              { from: "./src/img/maps/chora/", to: "./src/img/maps/chora/" },
              { from: "./src/img/maps/fallujah/", to: "./src/img/maps/fallujah/" },
              { from: "./src/img/maps/foolsroad/", to: "./src/img/maps/foolsroad/" },
              { from: "./src/img/maps/goosebay/", to: "./src/img/maps/goosebay/" },
              { from: "./src/img/maps/gorodok/", to: "./src/img/maps/gorodok/" },
              { from: "./src/img/maps/harju/", to: "./src/img/maps/harju/" },
              { from: "./src/img/maps/kamdesh/", to: "./src/img/maps/kamdesh/" },
              { from: "./src/img/maps/kohat/", to: "./src/img/maps/kohat/" },
              { from: "./src/img/maps/kokan/", to: "./src/img/maps/kokan/" },
              { from: "./src/img/maps/lashkar/", to: "./src/img/maps/lashkar/" },
              { from: "./src/img/maps/logar/", to: "./src/img/maps/logar/" },
              { from: "./src/img/maps/manicouagan/", to: "./src/img/maps/manicouagan/" },
              { from: "./src/img/maps/mestia/", to: "./src/img/maps/mestia/" },
              { from: "./src/img/maps/mutaha/", to: "./src/img/maps/mutaha/" },
              { from: "./src/img/maps/narva/", to: "./src/img/maps/narva/" },
              { from: "./src/img/maps/sanxian/", to: "./src/img/maps/sanxian/" },
              { from: "./src/img/maps/skorpo/", to: "./src/img/maps/skorpo/" },
              { from: "./src/img/maps/sumari/", to: "./src/img/maps/sumari/" },
              { from: "./src/img/maps/tallil/", to: "./src/img/maps/tallil/" },
              { from: "./src/img/maps/yehorivka/", to: "./src/img/maps/yehorivka/" },
            ],
          }),
    ],
    // Disable warning message for big chuncks
    performance: {
        //hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
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
};