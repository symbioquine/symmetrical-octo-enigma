const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const farmOSMapDistDir = `${__dirname}/node_modules/@farmos.org/farmos-map/dist`;

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: '@Symbioquine\'s farmOS-map Playground',
      template: path.resolve(__dirname, 'src/index.html'),
      minify: false,
      templateParameters: {
        'gmapsKeyParam': (process.env.NODE_ENV === "production") ? '&key=AIzaSyB-Eb4CJbRd-S5D2RlKIczSNQuOXe_AHsw' : '',
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        { context: farmOSMapDistDir, from: `${farmOSMapDistDir}/*.js`, to: 'farmOS-map/' },
        { context: farmOSMapDistDir, from: `${farmOSMapDistDir}/*.css`, to: 'farmOS-map/' },
      ],
    }),
  ],
  externals: {
    '@farmos.org/farmos-map': 'farmOS.map',
  },
};