import { BALLSPEED, LEVELS, TIME_INTERVALS } from '../utils/constants'

/* globals __DEV__ */
import Phaser from 'phaser'
import lang from '../lang'

export default class extends Phaser.State {
  // basically start the game
  removeLogo = () => {
    // if any ball somehow alive
    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i] !== null) {
        if (this.balls[i].alive) {
          this.balls[i].kill()
        }
      }
    }
    this.logo.kill()
    this.start = new Date()
    // start -> lvl 0
    setTimeout(this.nextLevel, 1000)
    if (this.sound) {
      this.soundtrack.play()
    }
  }
  kill = (ball) => {
    const explosionAnimation = this.explosions.getFirstExists(false)
    explosionAnimation.reset(ball.x, ball.y)
    explosionAnimation.play('explosion', 30, false, true)
    ball.kill()
    if (this.sound) {
      this.boom.play()
    }
    if (!this.lost) {
      this.score += 10 + this.level * 10
      this.scoreText.text = 'Score: ' + this.score
    }
    this.shakeIt(4, 80)
  }
  update = () => {
    if (!this.sound) {
      this.soundtrack.pause()
    } else {
      this.soundtrack.resume()
    }

    if (this.level > 2) {
      this.theBackground.tilePosition.y += 2
    }

    if (this.balls.length > 0) {
      let allBallsKilled = true
      for (let i = 0; i < LEVELS[this.level]; i++) {
        if (this.balls[i] !== null && !this.lost) {
          if (this.balls[i].alive) {
            allBallsKilled = false
            if (this.level > 1) {
              this.balls[i].rotation += this.balls[i].body.velocity.x / 500
            }
            this.game
              .physics
              .arcade
              .collide(this.balls[i], this.platforms, this.collisionHandler, null, this)
            if (i > 0) {
              this.game.physics.arcade.collide(this.balls[i], this.balls[i - 1])
            }
          }
        }
      }
      if (allBallsKilled) {
        if (this.level < 5) {
          this.level = this.level + 1
          if (!this.lost) {
            this.nextLevel()
            //  setTimeout(nextLevel,1000)
          }
        } else {
          if (this.seconds > TIME_INTERVALS[this.level]) {
            this.youLost()
            this.killAll()
          } else {
            if (!this.lost) {
              this.scoreText.x = game.world.centerX - 150
              this.scoreText.fill = '#107378'
              this.stateText.text = ' You Won!'
              this.stateText.visible = true
              this.resetTimer()
            }
          }
        }
      } else {
        if (!this.lost) {
          this.updateTimer()
        }
      }
    }
  }
  collisionHandler = () => {
    if (this.level > 3) {
      this.shakeIt(4, 60)
    }
  }
  nextLevel = () => {
    // each lvl has a number of balls, and increased ball speed ;)    
    for (let i = 0; i < LEVELS[this.level]; i++) {
      // Give the balls a different alpha increase speed.
      this.balls[i] = this.game
        .add
        .sprite(this.game.world.centerX + Math.random() * 30, this.game.world.centerY + Math.random() * 30, 'ball')

      this.balls[i]
        .anchor
        .setTo(0.5, 0.5)

      let randu = this.rand(4)

      let h = this.game.world.height
      let w = this.game.world.width
      let xx = 0
      let yy = 0
      let tox = 0
      let toy = 0

      if (randu === 0) {
        xx = this.rand(w)
        yy = -this.balls[i].height / 2 + 2
        tox = this.rand(w)
        toy = h + this.balls[i].height
      } else if (randu === 1) {
        xx = this.rand(w)
        yy = h + this.balls[i].height / 2 - 2
        tox = this.rand(w)
        toy = -this.balls[i].height
      } else if (randu === 2) {
        xx = -this.balls[i].width / 2 + 2
        yy = this.rand(h)
        tox = w + this.balls[i].width
        toy = this.rand(h)
      } else if (randu === 3) {
        xx = w + this.balls[i].width / 2 - 2
        yy = this.rand(h)
        tox = -this.balls[i].width
        toy = this.rand(h)
      }

      // increase ballspeed per lvl
      const lvlBallSpeed = BALLSPEED + this.level * 10

      // Enable input.
      this.game
        .physics
        .arcade
        .enable(this.balls[i])
      this.balls[i].inputEnabled = true
      this.balls[i]
        .input
        .start(0, true)
      // u click or press on ball it goes to balls haven
      this.balls[i]
        .events
        .onInputUp
        .add(this.kill)
      this.balls[i].body.velocity.x = (Math.random() < 0.5
        ? -1
        : 1) * (lvlBallSpeed + Math.random() * (Math.floor(Math.random() * 10) + 2 ))
      this.balls[i].body.velocity.y = (Math.random() < 0.5
        ? -1
        : 1) * (lvlBallSpeed + Math.random() * (Math.floor(Math.random() * 10) + 2 ))
      this.balls[i].angle = 90 + (Math.atan2(yy - toy, xx - tox) * 180) / Math.PI
      this.balls[i].body.collideWorldBounds = true
      if (this.level > 0) {
        this.balls[i].body.bounce.setTo(0.7 + Math.random() * 0.2, 0.7 + Math.random() * 0.2)
      }
      this.balls[i].body.allowGravity = false
      //  balls[i].body.gravity.y = 6
    }

    this.levelLabel.text = 'Level ' + (this.level + 1)
    this.scoreText.text = 'Score: ' + this.score
  }
  updateTimer = () => {
    const end = new Date()
    let diff = end - this.start
    diff = new Date(diff)
    let milliseconds = diff.getMilliseconds()
    let seconds = diff.getSeconds()
    let minutes = diff.getMinutes()
    if (minutes < 10) {
      minutes = '0' + minutes
    }
    if (seconds < 10) {
      seconds = '0' + seconds
    }
    if (milliseconds < 10) {
      milliseconds = '0' + milliseconds
    }
    this.timer.setText(minutes + ':' + seconds + ':' + ('' + milliseconds).substring(0, 2))

    if (seconds > TIME_INTERVALS[this.level]) {
      this.youLost()
      this.resetTimer()
    }
  }
  youLost = () => {
    this.scoreText.x = this.game.world.centerX - 200
    this.scoreText.fill = '#FF0000'
    if (this.sound) {
      this.gameover.play()
    }
    this.stateText.text = ' You Lost!'
    this.stateText.visible = true
    this.restartGame = this.game
      .add
      .button(this.game.world.width / 2 + 10, 195, 'restart', this.restart, this)
    this.restartGame
      .anchor
      .setTo(0.5, 0.5)
    this.restartGame.alpha = 0
    this.game
      .add
      .tween(this.restartGame)
      .delay(2000)
      .to({
        alpha: 1
      }, 1000)
      .start()
    this.shakeIt(20, 100)
    this.lost = true
  }
  chronoReset = () => {
    this.resetTimer()
    this.timer.content = '00:00:00'
    this.start = new Date()
  }
  resetTimer = () => {
    this.milliseconds = '00'
    this.seconds = '00'
    this.minutes = '00'
  }
  killAll = () => {
    for (let i = 0; i < LEVELS[this.level]; i++) {
      if (this.balls[i].alive) {
        this.balls[i].kill()
      }
    }

    this.resetTimer()
  }
  restart = () => {
    if (!this.sound) {
      this.soundtrack.pause()
    } else {
      if (this.soundtrack.isPlaying) {
        this.soundtrack.resume()
      } else {
        this.soundtrack.play()
      }
    }

    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i] !== null) {
        if (this.balls[i].alive) {
          this.balls[i].kill()
        }
      }
    }
    this.score = 0
    this.scoreText.text = 'Score: ' + this.score
    this.scoreText.fill = '#000'
    this.level = 0
    this.balls = []
    this.lost = false
    this.game
      .time
      .reset()
    this.game.time.time = 0
    this.resetTimer()
    this.timer.content = '00:00:00'
    this.chronoReset()
    this.restartGame.kill()
    this.stateText.visible = false
    this.nextLevel()
  }

  init = () => {
    this.level = 0

    this.balls = []

    this.score = 0

    this.scoreText = ''

    this.platforms = []

    this.textStyle = {
      font: '19px Desyrel',
      align: 'center'
    }

    this.timer = 0

    this.milliseconds = 0

    this.seconds = 0

    this.minutes = 0

    this.lost = false

    this.explosions = []

    this.logo = ''

    this.levelLabel = ''

    this.restartGame = ''

    this.start = 0
    this.end = 0
    this.diff = 0

    this.boom = null

    this.soundtrack = null

    this.soundToggle = null

    this.sound = true

    this.stateText = null

    this.gameover = null

    this.theBackground = null
  }
  create = () => {
    this.game.physics.arcade.gravity.y = 6

    this.game
      .world
      .setBounds(-10, -10, 490, 650)

    this.theBackground = this.game
      .add
      .tileSprite(0, 0, 480, 640, 'background')

    //  sounds
    this.boom = this.game
      .add
      .audio('boom')
    this.boom.volume = 0.2
    this.gameover = this.game
      .add
      .audio('game-over')
    this.gameover.volume = 0.3
    this.soundtrack = this.game
      .add
      .audio('soundtrack')
    this.soundtrack.volume = 0.3
    this.soundtrack.loop = true

    this.soundToggle = this.game
      .add
      .button(this.game.world.width - 130, 15, 'mute', this.setSound, this)
    this.soundToggle.frame = 10

    this.timer = this.game
      .add
      .text(395, 15, '00:00:00', this.textStyle)

    this.platforms = this.game
      .add
      .group()
    this.platforms.enableBody = true
    this.game
      .physics
      .arcade
      .enable(this.platforms)

    const ledge = this.platforms.create(this.game.world.centerX, 450, 'phaser')
    ledge.body.immovable = true
    ledge.body.allowGravity = false

    this.scoreText = this.game
      .add
      .text(10, 15, 'Score: 0', {
        font: '24px Baskerville Old Face',
        fill: '#000'
      })

    this.levelLabel = this.game
      .add
      .text(16, 605, 'Level: 0', {
        font: '24px arial',
        fill: '#000'
      })

    //  Explosion pool
    this.explosions = this.game
      .add
      .group()

    this.stateText = this.game
      .add
      .text(this.game.world.centerX, this.game.world.centerY, '', {
        fontSize: '84px',
        fill: '#fff'
      })
    this.stateText
      .anchor
      .setTo(0.5, 0.5)
    this.stateText.visible = false

    for (let j = 0; j < 10; j++) {
      const explosionAnimation = this.explosions.create(0, 0, 'explosion', [0], false)
      explosionAnimation
        .anchor
        .setTo(0.5, 0.5)
      explosionAnimation
        .animations
        .add('explosion')
    }

    this.logo = this.game
      .add
      .image(100, 175, 'logo')
    this.logo.fixedToCamera = true
    this.logo.inputEnabled = true
    this.logo
      .input
      .start(0, true)
    this.logo
      .events
      .onInputUp
      .add(this.removeLogo)
  }
  setSound = () => {
    if (this.soundToggle.frame === 0) {
      this.soundToggle.frame = 1
      this.sound = false
    } else {
      this.soundToggle.frame = 0
      this.sound = true
    }
  }
  rand = (num) => Math.floor(Math.random() * num)
  shakeIt = (i, t) => {
    this.game
      .add
      .tween(this.game.camera)
      .to({
        y: i
      }, t, Phaser.Easing.Linear.None)
      .to({
        y: -i
      }, t, Phaser.Easing.Linear.None)
      .to({
        y: 0
      }, t, Phaser.Easing.Linear.None)
      .start()

    this.game
      .add
      .tween(this.game.camera)
      .to({
        x: i
      }, t, Phaser.Easing.Linear.None)
      .to({
        x: -i
      }, t, Phaser.Easing.Linear.None)
      .to({
        x: 0
      }, t, Phaser.Easing.Linear.None)
      .start()
  }
  render = () => {
    if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32)
    }
  }
}
