const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Phaser webpack config
const phaserModule = path.join(__dirname, '/node_modules/phaser-ce/')
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js')
const pixi = path.join(phaserModule, 'build/custom/pixi.js')
const p2 = path.join(phaserModule, 'build/custom/p2.js')

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/main.js')
  },
  devtool: 'eval-source-map',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname),
        publicPath: '/'
      },
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/'
      }
    ],
    compress: true,
    port: process.env.PORT || 3000,
    host: process.env.IP || 'localhost',
    open: true,
    hot: true
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true)
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      minify: false,
      hash: false
    })
  ],
  module: {
    rules: [
      { 
        test: /\.js$/, 
        use: ['babel-loader'], 
        include: path.join(__dirname, 'src') 
      },
      { 
        test: /pixi\.js/, 
        use: [{
          loader: 'expose-loader',
          options: {
            exposes: 'PIXI'
          }
        }]
      },
      { 
        test: /phaser-split\.js$/, 
        use: [{
          loader: 'expose-loader',
          options: {
            exposes: 'Phaser'
          }
        }]
      },
      { 
        test: /p2\.js/, 
        use: [{
          loader: 'expose-loader',
          options: {
            exposes: 'p2'
          }
        }]
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    }
  },
  resolve: {
    alias: {
      'phaser': phaser,
      'pixi': pixi,
      'p2': p2
    }
  }
}
