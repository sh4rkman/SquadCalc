import Dotenv from 'dotenv-webpack';
import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import RobotstxtPlugin from 'robotstxt-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import workbox from 'workbox-webpack-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { error } from 'console';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default async (env) => {

    // Dynamically import dotenv and await it since it's a Promise
    const { config } = await import('dotenv');
    const dotenv = config();

    // Run checks on .env file
    preChecks(dotenv, env);

    const isIndexed = process.env.INDEX && process.env.INDEX.toLowerCase() === 'true';
    const robotstxtPolicy = isIndexed
        ? [{ userAgent: "*", allow: "/" }]
        : [{ userAgent: "*", disallow: "/" }];

    return {

        entry: {
            main: './src/app.js',
        },
        stats: { warnings: false },
        mode: env.WEBPACK_BUILD ? 'production' : 'development',
        devtool: env.WEBPACK_BUILD ? false : 'inline-source-map',
        output: {
            filename: './src/js/[name].[contenthash].min.js',
            path: path.resolve(__dirname, '../dist'),
            publicPath: '/',
            clean: true,
            assetModuleFilename: '[path][name].[contenthash][ext]'
        },
        module: {
            rules: [
                {
                    test: /\.(sc|sa|c)ss$/i,
                    use: [
                        'style-loader', { loader: 'css-loader', options: { url: false } }, 'sass-loader',
                    ],
                },
                {
                    test: /\.(html)$/,
                    include: path.join(__dirname, ''),
                    use: { loader: 'html-loader', options: { interpolate: true } }
                },
                { test: /\.(png|svg|jpg|jpeg|gif|webp)$/i, type: 'asset/resource', },
            ],
        },
        devServer: {
            port: process.env.DEV_PORT || 3000,
            open: true,
            historyApiFallback: {
                disableDotRule: true,
            },
            static: {
                directory: path.join(__dirname, '../public'),
                publicPath: '/',
            },
            //   proxy: [
            //     {
            //         context: ['/api/'],
            //         target: process.env.DEV_API_URL || 'https://beta.squadcalc.app',
            //         changeOrigin: true,
            //         ws: true,
            //         onProxyReq: (proxyReq) => {
            //             if (process.env.API_KEY) proxyReq.setHeader('X-API-Key', process.env.API_KEY);
            //         }
            //     }
            //   ]
        },
        plugins: [
            new Dotenv(),
            new HtmlWebpackPlugin({
                template: './src/index.html',
                minify: env.WEBPACK_BUILD ? {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeAttributeQuotes: true,
                } : false
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        // Public Assets
                        from: path.resolve(__dirname, '../public'),
                        to: path.resolve(__dirname, '../dist'),
                    },
                    {
                        // PWA ScreenShots
                        from: "./src/img/github/",
                        to: "../dist/img/pwa/",
                    },
                ],
            }),
            new webpack.ProvidePlugin({
                $: "jquery", jQuery: "jquery", "window.jQuery": "jquery'", "window.$": "jquery"
            }),
            new RobotstxtPlugin({
                policy: robotstxtPolicy,
            }),
            new WebpackPwaManifest({
                name: 'SquadCalc',
                short_name: 'SquadCalc',
                start_url: "/",
                description: 'A Complete Mortar Calculator for Squad',
                background_color: '#111111',
                publicPath: './',
                fingerprints: false,
                theme_color: '#FFFFFF',
                inject: true,
                ios: true,
                crossorigin: 'use-credentials',
                icons: [
                    {
                        // Regular FavIcon
                        src: path.resolve('./src/img/favicons/favicon_512x512.png'),
                        sizes: [16, 32, 96, 192, 256, 384, 512],
                        destination: path.join('img', 'favicons'),
                        purpose: 'maskable'
                    },
                    {
                        // PWA Installation icon
                        src: path.resolve('./src/img/favicons/favicon_512x512.png'),
                        size: '192x192',
                        destination: path.join('img', 'favicons'),
                        purpose: 'any'
                    }

                ],
                screenshots: [
                    {
                        "src": "/img/pwa/mobile_ui.webp",
                        "sizes": "748x1568",
                        "type": "image/webp",
                        "form_factor": "narrow",
                        "label": "Map View"
                    },
                    {
                        "src": "/img/pwa/mobile.webp",
                        "sizes": "748x1568",
                        "type": "image/webp",
                        "form_factor": "narrow",
                        "label": "Minimalist/keyboard friendly calculator"
                    },
                    {
                        "src": "/img/pwa/desktop_ui_1.webp",
                        "sizes": "800x553",
                        "type": "image/webp",
                        "form_factor": "wide",
                        "label": "Map Mode"
                    },
                    {
                        "src": "/img/pwa/desktop_ui_2.webp",
                        "sizes": "800x553",
                        "type": "image/webp",
                        "form_factor": "wide",
                        "label": "Topographic maps"
                    },
                    {
                        "src": "/img/pwa/desktop_ui_3.webp",
                        "sizes": "800x553",
                        "type": "image/webp",
                        "form_factor": "wide",
                        "label": "Weapon Stats"
                    },
                    {
                        "src": "/img/pwa/desktop_ui_4.webp",
                        "sizes": "800x553",
                        "type": "image/webp",
                        "form_factor": "wide",
                        "label": "Target Stats"
                    },
                    {
                        "src": "/img/pwa/desktop_ui_0.webp",
                        "sizes": "800x553",
                        "type": "image/webp",
                        "form_factor": "wide",
                        "label": "Legacy Mode"
                    },
                ]
            }),
            new workbox.InjectManifest({
                swSrc: './src/js/sw.js',
                swDest: './sw.js',
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                exclude: [
                    /manifest\.json$/,
                    /\.map$/,
                    /\/favicons\//,
                    /robots\.txt/,
                    /\.webp$/,
                    /\.mp3$/,
                    /\.json$/,
                    /\.gif$/,
                ],
            })
        ],
        performance: {
            hints: false,
            maxEntrypointSize: env.WEBPACK_BUILD ? 512000 : Infinity,
            maxAssetSize: env.WEBPACK_BUILD ? 512000 : Infinity,
        },
        optimization: {
            moduleIds: 'deterministic',
            usedExports: true,
            sideEffects: false,
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        maxSize: env.WEBPACK_BUILD ? 50000 : Infinity,
                    },
                },
            },
            minimizer: env.WEBPACK_BUILD ? [
                new CssMinimizerPlugin(),
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                        compress: {
                            pure_funcs: ['console.debug'], // Removes console.debug
                        },
                    },
                }),
            ] : [],
        },
    }
};

function preChecks(dotenv, env) {
    console.log("*******************************************************")
    console.log(`                               __           __    `)
    console.log(`   _________ ___  ______ _____/ /________ _/ /____`)
    console.log('  / ___/ __ `/ / / / __ `/ __  / ___/ __ `/ / ___/')
    console.log(` (__  ) /_/ / /_/ / /_/ / /_/ / /__/ /_/ / / /__  `)
    console.log(`/____/\\__, /\\__,_/\\__,_/\\__,_/\\___/\\__,_/_/\\___/  `)
    console.log(`        /_/                                       `)
    console.log("*******************************************************")
    if (!dotenv.error) console.log(`    -> found .env file ✅`)
    else {
        console.error("    -> NO .ENV CONFIGURATION FOUND IN ROOT FOLDER ❌")
        console.error("    -> see https://github.com/sh4rkman/SquadCalc/wiki/Installation-&-Configuration#optional-configuration\n\n");
        throw error;
    }
    if (!env.WEBPACK_BUILD) console.log(`    -> URL will be http://localhost:${process.env.DEV_PORT || 3000} ✅`)
    console.log(`    -> Index on search engines : ${process.env.INDEX ? '✅' : '❌'}`)
    if (process.env.API_URL) {
        if (process.env.API_URL.endsWith("/")) {
            console.error("    -> API_URL should NOT end with a slash (/) ❌\n\n");
            throw error;
        }
        console.log(`    -> API used : ${process.env.API_URL} ✅`);
    }
    else {
        console.error("    -> NO API URL FOUND IN .ENV ❌");
        console.error("    -> Check if a .env file exists and if API_URL is defined\n\n");
        throw error;
    }

    console.log(`    -> ${env.WEBPACK_BUILD ? 'Building /dist/ folder...' : 'Launching dev server...'}`)
}