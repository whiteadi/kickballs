import 'pixi'
import 'p2'

import BootState from './states/Boot'
import GameState from './states/Game'
import Phaser from 'phaser'
import SplashState from './states/Splash'
import config from './config'

class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement
    const calculateWidth = window.innerWidth * window.devicePixelRatio
    const calculateHeight = window.innerHeight * window.devicePixelRatio
    const width = docElement.clientWidth > calculateWidth ? calculateWidth : docElement.clientWidth
    const height = docElement.clientHeight > calculateHeight ? calculateHeight : docElement.clientHeight

    super(width, height, Phaser.CANVAS, 'content', null)

    this.state.add('Boot', BootState, false)
    this.state.add('Splash', SplashState, false)
    this.state.add('Game', GameState, false)

    // with Cordova with need to wait that the device is ready so we will call the Boot state in another file
    if (!window.cordova) {
      this.state.start('Boot')
    }
  }
}

window.game = new Game()

if (window.cordova) {
  var app = {
    initialize: function () {
      document.addEventListener(
        'deviceready',
        this.onDeviceReady.bind(this),
        false
      )
    },

    // device ready Event Handler
    onDeviceReady: function () {
      this.receivedEvent('deviceready')

      // When the device is ready, start Phaser Boot state.
      window.game.state.start('Boot')
    },

    receivedEvent: function (id) {
      console.log('Received Event: ' + id)
    }
  }

  app.initialize()
}
