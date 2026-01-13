const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

// Phaser webpack config
const phaserModule = path.join(__dirname, '/node_modules/phaser-ce/')
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js')
const pixi = path.join(phaserModule, 'build/custom/pixi.js')
const p2 = path.join(phaserModule, 'build/custom/p2.js')

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/main.js')
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: './',
    filename: 'js/[name].[contenthash].js',
    clean: true
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(false)
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      minify: {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        removeComments: true,
        removeEmptyAttributes: true
      },
      hash: true
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' }
      ]
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
    minimize: true,
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
