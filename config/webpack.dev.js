const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const WebpackFavicons = require('webpack-favicons');

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
        /*new FaviconsWebpackPlugin({
            logo: './src/img/favicons/favicon.png',
            publicPath: '/dist',
            prefix: './src/img/favicons/',
            inject: true,
            start_url: "https://squadcalc.app/",
            favicons: {
              appName: 'SquadCalc',
              appDescription: 'A Minimalist Squad Mortar Calculator',
              manifestMaskable: true,
            }
          }),*/
        new WebpackFavicons({
            src: './src/img/favicons/favicon.png',
            path: 'favicons',
            background: '#000',
            theme_color: '#000',
            icons: {
                favicons: true
            }
        })
    ],
});