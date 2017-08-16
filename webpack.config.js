const webpack = require('webpack');

exports = module.exports = {
  devtool: 'source-map',
  entry: [
    './src/scripts/app.js'
  ],
  target: 'web',
  output: {
    path: `${__dirname}/dist/static`,
    publicPath: '/static/',
		filename: 'app.js'
  },
  plugins: [],
	module: {
		rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
		]
	}
};
