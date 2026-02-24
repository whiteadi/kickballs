import Phaser from 'phaser';
import { BALL_SPEED, LEVELS, TIME_INTERVALS, SPEED_MULTIPLIERS } from '../utils/constants';

declare const __DEV__: boolean;

export default class GameScene extends Phaser.Scene {
  // Game state
  private level: number = 0;
  private balls: Phaser.Physics.Arcade.Sprite[] = [];
  private score: number = 0;
  private lost: boolean = false;
  private soundEnabled: boolean = true;
  private levelTransitioning: boolean = false; // Prevent multiple level transitions

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
    this.levelTransitioning = false;
  }

  create(): void {
    const { width, height } = this.scale;

    // Set up physics with margin to keep balls away from screen edges
    const margin = 30;
    this.physics.world.gravity.y = 6;
    this.physics.world.setBounds(margin, margin, width - margin * 2, height - margin * 2);

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

      if (allBallsKilled && !this.levelTransitioning) {
        if (this.level < 5) {
          this.level++;
          if (!this.lost) {
            this.levelTransitioning = true; // Prevent multiple transitions
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
    // Show level transition animation
    this.showLevelTransition(() => {
      this.spawnBalls();
    });

    this.levelLabel.setText('Level ' + (this.level + 1));
    this.scoreText.setText('Score: ' + this.score);
  }

  private getBackgroundTintForLevel(): number {
    // Different background tints per level for visual variety
    switch (this.level) {
      case 0:
        return 0xffffff; // Normal
      case 1:
        return 0xe8f4e8; // Slight green tint
      case 2:
        return 0xe8e8f4; // Slight blue tint
      case 3:
        return 0xf4e8e8; // Slight red tint
      case 4:
        return 0xf4f0e0; // Slight yellow/sepia tint
      case 5:
        return 0xe0e0e8; // Slight purple/dark tint
      default:
        return 0xffffff;
    }
  }

  private showLevelTransition(onComplete: () => void): void {
    const { width, height } = this.scale;

    // Update background tint for this level
    const newTint = this.getBackgroundTintForLevel();
    this.tweens.add({
      targets: this.theBackground,
      tint: newTint,
      duration: 500,
      ease: 'Power2'
    });

    // Create level announcement text
    const levelText = this.add.text(width / 2, height / 2, `Level ${this.level + 1}`, {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 6
    });
    levelText.setOrigin(0.5, 0.5);
    levelText.setAlpha(0);
    levelText.setScale(0.5);

    // Animate the level text
    this.tweens.add({
      targets: levelText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for a moment then fade out
        this.time.delayedCall(500, () => {
          this.tweens.add({
            targets: levelText,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              levelText.destroy();
              onComplete();
            }
          });
        });
      }
    });
  }

  private getBallTextureForLevel(): string {
    // Different ball types per level for visual variety
    switch (this.level) {
      case 0:
      case 1:
        return 'ball'; // Black balls for tutorial levels
      case 2:
      case 3:
        return 'ball_shiny'; // Shiny balls for medium levels
      case 4:
        return 'ball_metal'; // Metal balls for hard level
      case 5:
        return 'ball_pang'; // Pang balls for expert level
      default:
        return 'ball';
    }
  }

  private getBallScaleForLevel(): number {
    // Base scale for mobile
    const baseScale = 1.5;
    
    // Add size variation at higher levels
    if (this.level >= 4) {
      // Mix of sizes: some smaller, some larger
      return baseScale * (0.8 + Math.random() * 0.6); // 0.8x to 1.4x
    } else if (this.level >= 2) {
      // Slight variation
      return baseScale * (0.9 + Math.random() * 0.3); // 0.9x to 1.2x
    }
    return baseScale;
  }

  private spawnBalls(): void {
    const { width, height } = this.scale;

    // Clear the balls array and reset transition flag
    this.balls = [];
    this.levelTransitioning = false;

    // Get ball texture for this level
    const ballTexture = this.getBallTextureForLevel();

    // Get speed multiplier for current level
    const speedMultiplier = SPEED_MULTIPLIERS[this.level] || 1.0;

    for (let i = 0; i < LEVELS[this.level]; i++) {
      // From level 3+, spawn balls from random positions around the edges
      // Before level 3, spawn from center
      let spawnX: number;
      let spawnY: number;

      if (this.level >= 3) {
        // Random spawn from edges
        const edge = Math.floor(Math.random() * 4);
        const margin = 50;
        
        switch (edge) {
          case 0: // Top edge
            spawnX = margin + Math.random() * (width - margin * 2);
            spawnY = margin;
            break;
          case 1: // Bottom edge
            spawnX = margin + Math.random() * (width - margin * 2);
            spawnY = height - margin;
            break;
          case 2: // Left edge
            spawnX = margin;
            spawnY = margin + Math.random() * (height - margin * 2);
            break;
          case 3: // Right edge
          default:
            spawnX = width - margin;
            spawnY = margin + Math.random() * (height - margin * 2);
            break;
        }
      } else {
        // Levels 0-2: spawn from center with small random offset
        spawnX = width / 2 + (Math.random() - 0.5) * 60;
        spawnY = height / 2 + (Math.random() - 0.5) * 60;
      }

      // Get scale for this ball (varies at higher levels)
      const ballScale = this.getBallScaleForLevel();

      const ball = this.physics.add.sprite(spawnX, spawnY, ballTexture);

      ball.setOrigin(0.5, 0.5);
      ball.setScale(ballScale);
      ball.setAlpha(0); // Start invisible for spawn animation
      
      // Make hit area much larger than visual for easier touch (especially near edges)
      ball.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, ball.width * 1.2),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      });
      ball.on('pointerdown', () => this.killBall(ball));

      // Calculate ball speed with level multiplier
      const baseSpeed = BALL_SPEED * speedMultiplier;
      const randomFactor = Math.floor(Math.random() * 20) + 5;

      // Random velocity direction - ensure balls don't all go same direction
      const angle = Math.random() * Math.PI * 2; // Random angle 0-360 degrees
      const speed = baseSpeed + Math.random() * randomFactor;
      const velX = Math.cos(angle) * speed;
      const velY = Math.sin(angle) * speed;

      ball.setVelocity(velX, velY);

      // Set angle based on velocity direction
      ball.setAngle(90 + (Math.atan2(velY, velX) * 180) / Math.PI);
      ball.setCollideWorldBounds(true);

      // Always add bounce to prevent balls getting stuck in corners
      ball.setBounce(0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.2);

      (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      // Spawn animation - fade in with slight delay per ball
      this.tweens.add({
        targets: ball,
        alpha: 1,
        scale: ballScale,
        duration: 200,
        delay: i * 50, // Stagger spawn
        ease: 'Back.easeOut'
      });

      this.balls[i] = ball;
    }
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