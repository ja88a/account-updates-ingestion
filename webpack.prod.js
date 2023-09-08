const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = {
  entry: {
    app: './src/main.ts'
  },
  target: 'node',
  optimization: {
    minimize: true,
  },
  devtool: 'source-map',
  externals: [
    nodeExternals(),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
    clean: true
  },
};
