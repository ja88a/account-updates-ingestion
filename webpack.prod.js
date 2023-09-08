const path = require('path');
const nodeExternals = require('webpack-node-externals');

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
  mode: 'production',
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
