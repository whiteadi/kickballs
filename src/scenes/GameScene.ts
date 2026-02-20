import Phaser from 'phaser';
import { BALL_SPEED, LEVELS, TIME_INTERVALS } from '../utils/constants';

declare const __DEV__: boolean;

export default class GameScene extends Phaser.Scene {
  // Game state
  private level: number = 0;
  private balls: Phaser.Physics.Arcade.Sprite[] = [];
  private score: number = 0;
  private lost: boolean = false;
  private soundEnabled: boolean = true;

  // Timer state
  private startTime: number = 0;

  // Game objects
  private theBackground!: Phaser.GameObjects.TileSprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private explosions!: Phaser.GameObjects.Group;
  private logo!: Phaser.GameObjects.Image;

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private levelLabel!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private soundToggle!: Phaser.GameObjects.Image;
  private restartButton?: Phaser.GameObjects.Image;

  // Audio
  private boom!: Phaser.Sound.BaseSound;
  private gameoverSound!: Phaser.Sound.BaseSound;
  private soundtrack!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'Game' });
  }

  init(): void {
    this.level = 0;
    this.balls = [];
    this.score = 0;
    this.lost = false;
    this.soundEnabled = true;
    this.startTime = 0;
  }

  create(): void {
    const { width, height } = this.scale;

    // Set up physics
    this.physics.world.gravity.y = 6;
    this.physics.world.setBounds(-10, -10, 490, 650);

    // Background
    this.theBackground = this.add.tileSprite(0, 0, 480, 640, 'background');
    this.theBackground.setOrigin(0, 0);

    // Audio setup
    this.boom = this.sound.add('boom', { volume: 0.2 });
    this.gameoverSound = this.sound.add('game-over', { volume: 0.3 });
    this.soundtrack = this.sound.add('soundtrack', { volume: 0.3, loop: true });

    // Sound toggle button
    this.soundToggle = this.add.image(width - 130, 15, 'mute', 0);
    this.soundToggle.setInteractive();
    this.soundToggle.on('pointerup', this.toggleSound, this);

    // Timer text
    this.timerText = this.add.text(395, 15, '00:00:00', {
      fontFamily: 'Desyrel, Arial',
      fontSize: '19px',
      color: '#000000'
    });

    // Platforms group
    this.platforms = this.physics.add.staticGroup();
    const ledge = this.platforms.create(width / 2, 450, 'phaser');
    ledge.refreshBody();

    // Score text
    this.scoreText = this.add.text(10, 15, 'Score: 0', {
      fontFamily: 'Baskerville Old Face, serif',
      fontSize: '24px',
      color: '#000000'
    });

    // Level label
    this.levelLabel = this.add.text(16, 605, 'Level: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#000000'
    });

    // Explosion pool
    this.explosions = this.add.group();
    for (let j = 0; j < 10; j++) {
      const explosion = this.add.sprite(0, 0, 'explosion');
      explosion.setOrigin(0.5, 0.5);
      explosion.setVisible(false);
      explosion.setActive(false);
      this.explosions.add(explosion);
    }

    // Create explosion animation
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 22 }),
      frameRate: 30,
      hideOnComplete: true
    });

    // State text (win/lose message)
    this.stateText = this.add.text(width / 2, height / 2, '', {
      fontSize: '84px',
      color: '#ffffff'
    });
    this.stateText.setOrigin(0.5, 0.5);
    this.stateText.setVisible(false);

    // Logo (click to start) - centered
    this.logo = this.add.image(width / 2, height / 2 - 50, 'logo');
    this.logo.setOrigin(0.5, 0.5);
    this.logo.setInteractive();
    this.logo.on('pointerup', this.removeLogo, this);
  }

  update(): void {
    // Handle soundtrack based on sound setting
    if (!this.soundEnabled) {
      if (this.soundtrack.isPlaying) {
        this.soundtrack.pause();
      }
    } else {
      if (this.soundtrack.isPaused) {
        this.soundtrack.resume();
      }
    }

    // Scroll background at higher levels
    if (this.level > 2) {
      this.theBackground.tilePositionY += 2;
    }

    if (this.balls.length > 0) {
      let allBallsKilled = true;

      for (let i = 0; i < LEVELS[this.level]; i++) {
        const ball = this.balls[i];
        if (ball && ball.active && !this.lost) {
          allBallsKilled = false;

          // Rotate balls at higher levels
          if (this.level > 1 && ball.body) {
            ball.rotation += (ball.body as Phaser.Physics.Arcade.Body).velocity.x / 500;
          }

          // Ball-platform collision
          this.physics.add.collider(ball, this.platforms, () => {
            if (this.level > 3) {
              this.shakeCamera(4, 60);
            }
          });

          // Ball-ball collision
          if (i > 0 && this.balls[i - 1] && this.balls[i - 1].active) {
            this.physics.add.collider(ball, this.balls[i - 1]);
          }
        }
      }

      if (allBallsKilled) {
        if (this.level < 5) {
          this.level++;
          if (!this.lost) {
            this.nextLevel();
          }
        } else {
          const elapsed = this.getElapsedSeconds();
          if (elapsed > TIME_INTERVALS[this.level]) {
            this.youLost();
            this.killAllBalls();
          } else if (!this.lost) {
            this.scoreText.setX(this.scale.width / 2 - 150);
            this.scoreText.setColor('#107378');
            this.stateText.setText(' You Won!');
            this.stateText.setVisible(true);
            this.resetTimer();
          }
        }
      } else if (!this.lost) {
        this.updateTimer();
      }
    }
  }

  private removeLogo(): void {
    // Kill any existing balls
    this.balls.forEach(ball => {
      if (ball && ball.active) {
        ball.destroy();
      }
    });
    this.balls = [];

    this.logo.destroy();
    this.startTime = Date.now();

    // Start level 0 after delay
    this.time.delayedCall(1000, () => {
      this.nextLevel();
    });

    if (this.soundEnabled) {
      this.soundtrack.play();
    }
  }

  private killBall(ball: Phaser.Physics.Arcade.Sprite): void {
    // Get explosion from pool
    const explosion = this.explosions.getFirstDead(false) as Phaser.GameObjects.Sprite;
    if (explosion) {
      explosion.setPosition(ball.x, ball.y);
      explosion.setVisible(true);
      explosion.setActive(true);
      explosion.play('explode');
    }

    ball.destroy();

    if (this.soundEnabled) {
      this.boom.play();
    }

    if (!this.lost) {
      this.score += 10 + this.level * 10;
      this.scoreText.setText('Score: ' + this.score);
    }

    this.shakeCamera(4, 80);
  }

  private nextLevel(): void {
    const { width, height } = this.scale;

    for (let i = 0; i < LEVELS[this.level]; i++) {
      const ball = this.physics.add.sprite(
        width / 2 + Math.random() * 30,
        height / 2 + Math.random() * 30,
        'ball'
      );

      ball.setOrigin(0.5, 0.5);
      ball.setInteractive();
      ball.on('pointerup', () => this.killBall(ball));

      // Random direction
      const randu = Math.floor(Math.random() * 4);
      let xx = 0, yy = 0, tox = 0, toy = 0;

      if (randu === 0) {
        xx = Math.floor(Math.random() * width);
        yy = -ball.height / 2 + 2;
        tox = Math.floor(Math.random() * width);
        toy = height + ball.height;
      } else if (randu === 1) {
        xx = Math.floor(Math.random() * width);
        yy = height + ball.height / 2 - 2;
        tox = Math.floor(Math.random() * width);
        toy = -ball.height;
      } else if (randu === 2) {
        xx = -ball.width / 2 + 2;
        yy = Math.floor(Math.random() * height);
        tox = width + ball.width;
        toy = Math.floor(Math.random() * height);
      } else {
        xx = width + ball.width / 2 - 2;
        yy = Math.floor(Math.random() * height);
        tox = -ball.width;
        toy = Math.floor(Math.random() * height);
      }

      // Increase ball speed per level
      const lvlBallSpeed = BALL_SPEED + this.level * 10;
      const randomFactor = Math.floor(Math.random() * 10) + 2;

      ball.setVelocity(
        (Math.random() < 0.5 ? -1 : 1) * (lvlBallSpeed + Math.random() * randomFactor),
        (Math.random() < 0.5 ? -1 : 1) * (lvlBallSpeed + Math.random() * randomFactor)
      );

      ball.setAngle(90 + (Math.atan2(yy - toy, xx - tox) * 180) / Math.PI);
      ball.setCollideWorldBounds(true);

      if (this.level > 0) {
        ball.setBounce(0.7 + Math.random() * 0.2, 0.7 + Math.random() * 0.2);
      }

      (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      this.balls[i] = ball;
    }

    this.levelLabel.setText('Level ' + (this.level + 1));
    this.scoreText.setText('Score: ' + this.score);
  }

  private updateTimer(): void {
    const elapsed = Date.now() - this.startTime;
    const date = new Date(elapsed);
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).substring(0, 2).padStart(2, '0');

    this.timerText.setText(`${minutes}:${seconds}:${ms}`);

    if (date.getSeconds() > TIME_INTERVALS[this.level]) {
      this.youLost();
      this.resetTimer();
    }
  }

  private getElapsedSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private youLost(): void {
    const { width } = this.scale;

    this.scoreText.setX(width / 2 - 200);
    this.scoreText.setColor('#FF0000');

    if (this.soundEnabled) {
      this.gameoverSound.play();
    }

    this.stateText.setText(' You Lost!');
    this.stateText.setVisible(true);

    // Create restart button with fade-in
    this.restartButton = this.add.image(width / 2 + 10, 195, 'restart');
    this.restartButton.setOrigin(0.5, 0.5);
    this.restartButton.setAlpha(0);
    this.restartButton.setInteractive();
    this.restartButton.on('pointerup', this.restart, this);

    this.tweens.add({
      targets: this.restartButton,
      alpha: 1,
      duration: 1000,
      delay: 2000
    });

    this.shakeCamera(20, 100);
    this.lost = true;
  }

  private resetTimer(): void {
    this.startTime = Date.now();
  }

  private killAllBalls(): void {
    this.balls.forEach(ball => {
      if (ball && ball.active) {
        ball.destroy();
      }
    });
    this.balls = [];
    this.resetTimer();
  }

  private restart(): void {
    // Handle soundtrack
    if (!this.soundEnabled) {
      if (this.soundtrack.isPlaying) {
        this.soundtrack.pause();
      }
    } else {
      if (!this.soundtrack.isPlaying) {
        this.soundtrack.play();
      }
    }

    // Kill all balls
    this.killAllBalls();

    // Reset state
    this.score = 0;
    this.scoreText.setText('Score: ' + this.score);
    this.scoreText.setColor('#000000');
    this.level = 0;
    this.lost = false;

    this.resetTimer();
    this.timerText.setText('00:00:00');

    if (this.restartButton) {
      this.restartButton.destroy();
      this.restartButton = undefined;
    }

    this.stateText.setVisible(false);
    this.nextLevel();
  }

  private toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.soundToggle.setFrame(this.soundEnabled ? 0 : 1);
  }

  private shakeCamera(intensity: number, duration: number): void {
    this.cameras.main.shake(duration * 3, intensity / 100);
  }
}