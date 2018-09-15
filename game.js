var game = new Phaser.Game(480, 640, Phaser.AUTO, "content", {
  preload: preload,
  create: create,
  update: update
})

var ballSpeed = 180

var time_intervals = [4, 10, 17, 22, 26, 33]

var levels = [4, 6, 15, 20, 26, 30]

//var levels = [1, 2, 3, 4, 5, 6]

var level = 0

var balls = []

var score = 0

var scoreText

var platforms

var textStyle = {
  font: "19px Desyrel",
  align: "center"
}

var timer

var milliseconds = 0

var seconds = 0

var minutes = 0

var lost = false

var explosions

var logo

var levelLabel

var restartGame

var start = 0
var end = 0
var diff = 0

var boom

var soundtrack

var soundToggle

var sound = true

var stateText

var gameover

var theBackground

function preload() {
  game.load.image("ball", "assets/black_ball.png")

  game.load.image("background", "assets/raindrop.jpg")

  game.load.image("phaser", "assets/EnemyBug.png")

  game.load.spritesheet("explosion", "assets/explosion.png", 64, 64, 23)

  game.load.image("logo", "assets/logo.jpg")

  game.load.image("restart", "assets/restart.png")

  game.load.audio("boom", "assets/explosion.wav")

  game.load.audio("game-over", "assets/game-over.wav")

  game.load.audio("soundtrack", "assets/Ascending2.mp3")

  game.load.spritesheet("mute", "assets/mute2.png", 25, 18)
}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE)
  game.physics.arcade.gravity.y = 6

  /*game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL //resize your window to see the stage resize too
    game.stage.scale.setShowAll()
    game.stage.scale.refresh()       */

  game.world.setBounds(-10, -10, 490, 650)

  theBackground = game.add.tileSprite(0, 0, 480, 640, "background")

  //sounds
  boom = game.add.audio("boom")
  boom.volume = 0.2
  gameover = game.add.audio("game-over")
  gameover.volume = 0.3
  soundtrack = game.add.audio("soundtrack")
  soundtrack.volume = 0.3
  soundtrack.loop = true

  soundToggle = game.add.button(
    game.world.width - 130,
    15,
    "mute",
    setSound,
    this
  )
  soundToggle.frame = 10

  timer = game.add.text(395, 15, "00:00:00", textStyle)

  platforms = game.add.group()
  platforms.enableBody = true
  game.physics.arcade.enable(platforms)

  var ledge = platforms.create(game.world.centerX, 450, "phaser")
  ledge.body.immovable = true
  ledge.body.allowGravity = false

  ledge = platforms.create(game.world.centerX, 173, "phaser")
  ledge.body.immovable = true
  ledge.body.allowGravity = false

  scoreText = game.add.text(10, 15, "Score: 0", {
    font: "24px Baskerville Old Face",
    fill: "#000"
  })

  levelLabel = game.add.text(16, 605, "Level: 0", {
    font: "24px arial",
    fill: "#000"
  })

  //  Explosion pool
  explosions = game.add.group()

  stateText = game.add.text(game.world.centerX, game.world.centerY, "", {
    fontSize: "84px",
    fill: "#fff"
  })
  stateText.anchor.setTo(0.5, 0.5)
  stateText.visible = false

  for (var j = 0; j < 10; j++) {
    var explosionAnimation = explosions.create(0, 0, "explosion", [0], false)
    explosionAnimation.anchor.setTo(0.5, 0.5)
    explosionAnimation.animations.add("explosion")
  }

  logo = game.add.image(100, 175, "logo")
  logo.fixedToCamera = true
  logo.inputEnabled = true
  logo.input.start(0, true)
  logo.events.onInputUp.add(removeLogo)
}

// basically start the game
function removeLogo() {
  // if any ball somehow alive
  for (var i = 0; i < balls.length; i++) {
    if (balls[i] !== null) {
      if (balls[i].alive) {
        balls[i].kill()
      }
    }
  }
  logo.kill()
  start = new Date()
  // start -> lvl 0
  setTimeout(nextLevel, 1000)
  if (sound) {
    soundtrack.play()
  }
}

function kill(ball) {
  var explosionAnimation = explosions.getFirstExists(false)
  explosionAnimation.reset(ball.x, ball.y)
  explosionAnimation.play("explosion", 30, false, true)
  ball.kill()
  if (sound) {
    boom.play()
  }
  if (!lost) {
    score += 10 + level * 10
    scoreText.text = "Score: " + score
  }
  shakeIt(4, 80)
}

function update() {
  if (!sound) {
    soundtrack.pause()
  } else {
    soundtrack.resume()
  }

  if (level > 2) theBackground.tilePosition.y += 2

  if (balls.length > 0) {
    var allBallsKilled = true
    for (var i = 0; i < levels[level]; i++) {
      if (balls[i] !== null && !lost) {
        if (balls[i].alive) {
          allBallsKilled = false
          if (level > 1) balls[i].rotation += balls[i].body.velocity.x / 500
          game.physics.arcade.collide(
            balls[i],
            platforms,
            collisionHandler,
            null,
            this
          )
          if (i > 0) game.physics.arcade.collide(balls[i], balls[i - 1])
        }
      }
    }
    if (allBallsKilled) {
      if (level < 5) {
        level = level + 1
        if (!lost) {
          nextLevel()
          //setTimeout(nextLevel,1000)
        }
      } else {
        if (seconds > time_intervals[level]) {
          youLost()
          killAll()
        } else {
          if (!lost) {
            scoreText.x = game.world.centerX - 150
            scoreText.font.fill = "#107378"
            stateText.text = " You Won!"
            stateText.visible = true
            resetTimer()
          }
        }
      }
    } else {
      if (!lost) {
        updateTimer()
      }
    }
  }
}

function collisionHandler() {
  if (level > 3) shakeIt(4, 60)
}

function nextLevel() {
  // each lvl has a number of balls
  for (var i = 0; i < levels[level]; i++) {
    // Give the balls a different alpha increase speed.
    balls[i] = game.add.sprite(
      game.world.centerX + Math.random() * 30,
      game.world.centerY + Math.random() * 30,
      "ball"
    )

    balls[i].anchor.setTo(0.5, 0.5)

    var randu = rand(4)

    var h = game.world.height
    var w = game.world.width
    var xx = 0
    var yy = 0
    var tox = 0
    var toy = 0

    if (randu === 0) {
      xx = rand(w)
      yy = -balls[i].height / 2 + 2
      tox = rand(w)
      toy = h + balls[i].height
    } else if (randu == 1) {
      xx = rand(w)
      yy = h + balls[i].height / 2 - 2
      tox = rand(w)
      toy = -balls[i].height
    } else if (randu == 2) {
      xx = -balls[i].width / 2 + 2
      yy = rand(h)
      tox = w + balls[i].width
      toy = rand(h)
    } else if (randu == 3) {
      xx = w + balls[i].width / 2 - 2
      yy = rand(h)
      tox = -balls[i].width
      toy = rand(h)
    }

    // Enable input.
    game.physics.arcade.enable(balls[i])
    balls[i].inputEnabled = true
    balls[i].input.start(0, true)
    // u click or press on ball it goes to balls haven
    balls[i].events.onInputUp.add(kill)
    balls[i].body.velocity.x =
      (Math.random() < 0.5 ? -1 : 1) * (ballSpeed + Math.random() * 5)
    balls[i].body.velocity.y =
      (Math.random() < 0.5 ? -1 : 1) * (ballSpeed + Math.random() * 5)
    balls[i].angle = 90 + (Math.atan2(yy - toy, xx - tox) * 180) / Math.PI
    balls[i].body.collideWorldBounds = true
    if (level > 0)
      balls[i].body.bounce.setTo(
        0.7 + Math.random() * 0.2,
        0.7 + Math.random() * 0.2
      )
    balls[i].body.allowGravity = false
    //balls[i].body.gravity.y = 6
  }

  levelLabel.text = "Level " + (level + 1)
  scoreText.text = "Score: " + score
}

function updateTimer() {
  end = new Date()
  diff = end - start
  diff = new Date(diff)
  milliseconds = diff.getMilliseconds()
  seconds = diff.getSeconds()
  minutes = diff.getMinutes()
  var hr = diff.getHours() - 1
  if (minutes < 10) {
    minutes = "0" + minutes
  }
  if (seconds < 10) {
    seconds = "0" + seconds
  }
  if (milliseconds < 10) {
    milliseconds = "0" + milliseconds
  }
  /*else if(milliseconds < 100){
        milliseconds = "0" +milliseconds
    }*/

  timer.setText(
    minutes + ":" + seconds + ":" + ("" + milliseconds).substring(0, 2)
  )

  if (seconds > time_intervals[level]) {
    youLost()
    resetTimer()
  }
}

function youLost() {
  scoreText.x = game.world.centerX - 200
  scoreText.font.fill = "#FF0000"
  if (sound) {
    gameover.play()
  }
  stateText.text = " You Lost!"
  stateText.visible = true
  restartGame = game.add.button(
    game.world.width / 2 + 10,
    195,
    "restart",
    this.restart,
    this
  )
  restartGame.anchor.setTo(0.5, 0.5)
  restartGame.alpha = 0
  game.add
    .tween(restartGame)
    .delay(2000)
    .to({
        alpha: 1
      },
      1000
    )
    .start()
  shakeIt(20, 100)
  lost = true
}

function chronoReset() {
  resetTimer()
  timer.content = "00:00:00"
  start = new Date()
}

function resetTimer() {
  milliseconds = "00"
  seconds = "00"
  minutes = "00"
}

function killAll() {
  for (var i = 0; i < levels[level]; i++) {
    if (balls[i].alive) {
      balls[i].kill()
    }
  }

  resetTimer()
}

function restart() {
  if (!sound) {
    soundtrack.pause()
  } else {
    if (soundtrack.isPlaying) {
      soundtrack.resume()
    } else {
      soundtrack.play()
    }
  }

  for (var i = 0; i < balls.length; i++) {
    if (balls[i] !== null) {
      if (balls[i].alive) {
        balls[i].kill()
      }
    }
  }
  score = 0
  scoreText.text = "Score: " + score
  scoreText.font.fill = "#000"
  level = 0
  balls = []
  lost = false
  game.time.reset()
  game.time.time = 0
  resetTimer()
  timer.content = "00:00:00"
  chronoReset()
  restartGame.kill()
  stateText.visible = false
  nextLevel()
}

function setSound() {
  if (soundToggle.frame === 0) {
    soundToggle.frame = 1
    sound = false
  } else {
    soundToggle.frame = 0
    sound = true
  }
}

function rand(num) {
  return Math.floor(Math.random() * num)
}

function shakeIt(i, t) {
  game.add
    .tween(game.camera)
    .to({
        y: i
      },
      t,
      Phaser.Easing.Linear.None
    )
    .to({
        y: -i
      },
      t,
      Phaser.Easing.Linear.None
    )
    .to({
        y: 0
      },
      t,
      Phaser.Easing.Linear.None
    )
    .start()

  game.add
    .tween(game.camera)
    .to({
        x: i
      },
      t,
      Phaser.Easing.Linear.None
    )
    .to({
        x: -i
      },
      t,
      Phaser.Easing.Linear.None
    )
    .to({
        x: 0
      },
      t,
      Phaser.Easing.Linear.None
    )
    .start()
}