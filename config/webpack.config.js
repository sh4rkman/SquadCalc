import Dotenv from 'dotenv-webpack';
import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
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
    const DEV_SERVER_AUTO_OPEN = (process.env.DEV_SERVER_AUTO_OPEN || "true").toLowerCase() === "true";
    const SEARCH_ENGINES = (process.env.SEARCH_ENGINES || "false").toLowerCase() === "true";
    const SMO_WEBSOCKET = (process.env.SMO_WEBSOCKET || "false").toLowerCase() === "true";
    

    // Run checks on .env file
    preChecks(dotenv, env, DEV_SERVER_AUTO_OPEN, SEARCH_ENGINES, SMO_WEBSOCKET);



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
            port: process.env.DEV_SERVER_PORT || 3000,
            open: DEV_SERVER_AUTO_OPEN,
            allowedHosts: "all",
            historyApiFallback: {
                disableDotRule: true,
            },
            static: {
                directory: path.join(__dirname, '../public'),
                publicPath: '/',
            },
            client: {
                webSocketURL: 'ws://0.0.0.0:80/ws',
            }
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
                    // {
                    //     // PWA ScreenShots
                    //     from: "./src/img/github/",
                    //     to: "../dist/img/pwa/",
                    // },
                ],
            }),
            new webpack.ProvidePlugin({
                $: "jquery", jQuery: "jquery", "window.jQuery": "jquery'", "window.$": "jquery"
            }),
            new RobotstxtPlugin({
                policy: SEARCH_ENGINES ? [{ userAgent: "*", allow: "/" }] : [{ userAgent: "*", disallow: "/" }],
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
                    // /\.webp$/,
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



function preChecks(dotenv, env, DEV_SERVER_AUTO_OPEN, SEARCH_ENGINES, SMO_WEBSOCKET) {
    
    console.log("\n\n*****************************************************")
    console.log(`   _____                       _  _____      _      `)
    console.log(`  / ____|                     | |/ ____|    | |     `)
    console.log(` | (___   __ _ _   _  __ _  __| | |     __ _| | ___ `)
    console.log(`  \\___ \\ / _\` | | | |/ _\` |/ _\` | |    / _\` | |/ __|`)
    console.log(`  ____) | (_| | |_| | (_| | (_| | |___| (_| | | (__ `)
    console.log(` |_____/ \\__, |\\__,_|\\__,_|\\__,_|\\_____\\__,_|_|\\___|`)
    console.log(`            | |                                     `)
    console.log(`            |_|                 https://squadcalc.app`)
    console.log("*****************************************************\n")

    if (dotenv.error) {
        console.error("    -> NO .ENV CONFIGURATION FOUND IN ROOT FOLDER ❌")
        console.error("    -> see https://github.com/sh4rkman/SquadCalc/wiki/Installation-&-Configuration#optional-configuration\n\n");
        process.exit(1);
    }

     console.log(`    -> Found .env file ✅ !`)
    console.log(`      -> SquadMortarOverlay Support : ${SMO_WEBSOCKET ? '✅' : '❌'}`)
    console.log(`      -> Index on search engines : ${SEARCH_ENGINES ? '✅' : '❌'}`)
    if (!env.WEBPACK_BUILD) console.log(`      -> URL will be http://localhost:${process.env.DEV_SERVER_PORT || 3000} ✅`)
    if (process.env.API_URL) {
        if (process.env.API_URL.endsWith("/")) {
            console.error("      -> API_URL should NOT end with a slash (/) ❌\n\n");
            process.exit(1);
        }
        console.log(`      -> API used : ${process.env.API_URL} ✅`);
    }
    else {
        console.error("      -> NO API URL FOUND IN .ENV ❌");
        console.error("      -> Check if a .env file exists and if API_URL is defined\n\n");
        process.exit(1);
    }
    if (!env.WEBPACK_BUILD) console.log(`      -> Should dev server open in a new Tab ? ${DEV_SERVER_AUTO_OPEN ? "✅" : "❌"}`);
    console.log(`    -> ${env.WEBPACK_BUILD ? 'Building /dist/ folder...\n' : 'Launching dev server...\n'}`)
}