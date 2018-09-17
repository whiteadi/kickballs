import Phaser from 'phaser'
import { centerGameObjects } from '../utils'

export default class extends Phaser.State {
  init () {
  }

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
    centerGameObjects([this.loaderBg, this.loaderBar])

    this.load.setPreloadSprite(this.loaderBar)
    //
    // load your assets
    //
    this.load.image('ball', 'assets/images/black_ball.png')

    this.load.image('background', 'assets/images/raindrop.jpg')

    this.load.image('phaser', 'assets/images/EnemyBug.png')

    this.load.spritesheet('explosion', 'assets/images/explosion.png', 64, 64, 23)

    this.load.image('logo', 'assets/images/logo.jpg')

    this.load.image('restart', 'assets/images/restart.png')

    this.load.audio('boom', 'assets/media/explosion.wav')

    this.load.audio('game-over', 'assets/media/game-over.wav')

    this.load.audio('soundtrack', 'assets/media/Ascending2.mp3')

    this.load.spritesheet('mute', 'assets/images/mute2.png', 25, 18)
  }

  create () {
    this.state.start('Game')
  }
}
