const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // Asegura que Webpack sirva los archivos desde la raíz
    clean: true,
  },
  mode: 'development',
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all', // Permite acceso desde cualquier host (incluyendo ngrok)
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    historyApiFallback: true, // ✅ Permite que React Router maneje rutas en el cliente
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
  ],
};
