const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
    entry: {
        background: './background.tsx',
        overlay: './overlay/overlay.tsx',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/, // Matches both .ts and .tsx
                use: {
                    loader: 'ts-loader',
                    options: {
                      configFile: path.resolve(__dirname, 'tsconfig.json')
                    }
                },
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'] // Lets you import without extensions
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: "manifest.json"},
                {from: "popup/*"},
                {from: "overlay/overlay.css", to: "overlay.css"},
                {from: "icons/*", to: "icons/[name][ext]"},
            ]
        }),
        new webpack.DefinePlugin(envKeys)
    ]
};