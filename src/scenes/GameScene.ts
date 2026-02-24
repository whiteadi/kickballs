import Phaser from 'phaser';
import { BALL_SPEED, LEVELS, TIME_INTERVALS, SPEED_MULTIPLIERS } from '../utils/constants';

// Ball types for special balls
type BallType = 'normal' | 'golden' | 'bomb';

// Power-up types
type PowerUpType = 'timeFreeze' | 'bomb' | 'scoreBoost';

export default class GameScene extends Phaser.Scene {
  // Game state
  private level: number = 0;
  private balls: Phaser.Physics.Arcade.Sprite[] = [];
  private score: number = 0;
  private lost: boolean = false;
  private soundEnabled: boolean = true;
  private levelTransitioning: boolean = false; // Prevent multiple level transitions

  // Combo system
  private comboCount: number = 0;
  private lastKillTime: number = 0;
  private comboTimeout: number = 1500; // ms to maintain combo

  // Power-up system
  private powerUps: Phaser.GameObjects.Sprite[] = [];
  private scoreBoostActive: boolean = false;
  private scoreBoostEndTime: number = 0;
  private timeFreezeActive: boolean = false;
  private powerUpSpawnTimer?: Phaser.Time.TimerEvent;

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

  private getExplosionTintForLevel(): number {
    // Different explosion colors per level to match ball types
    switch (this.level) {
      case 0:
      case 1:
        return 0xff6600; // Orange/red for black balls
      case 2:
      case 3:
        return 0x4488ff; // Blue for shiny balls
      case 4:
        return 0xaaaaaa; // Silver/gray for metal balls
      case 5:
        return 0x00ff88; // Green/cyan for pang balls
      default:
        return 0xff6600;
    }
  }

  private killBall(ball: Phaser.Physics.Arcade.Sprite, triggeredByBomb: boolean = false): void {
    const ballX = ball.x;
    const ballY = ball.y;
    const ballType = ball.getData('ballType') as BallType || 'normal';

    // Get explosion tint based on ball type
    let explosionTint = this.getExplosionTintForLevel();
    let explosionScale = 1.5;
    
    if (ballType === 'golden') {
      explosionTint = 0xffd700; // Gold explosion
      explosionScale = 2.0;
    } else if (ballType === 'bomb') {
      explosionTint = 0xff0000; // Red explosion
      explosionScale = 2.5;
    }

    // Get explosion from pool
    const explosion = this.explosions.getFirstDead(false) as Phaser.GameObjects.Sprite;
    if (explosion) {
      explosion.setPosition(ballX, ballY);
      explosion.setVisible(true);
      explosion.setActive(true);
      explosion.setAlpha(1);
      explosion.setScale(explosionScale);
      explosion.setTint(explosionTint);
      explosion.play('explode');
      
      // Reset explosion when animation completes
      explosion.once('animationcomplete', () => {
        explosion.setVisible(false);
        explosion.setActive(false);
        explosion.clearTint();
      });
    } else {
      // No explosion available in pool, create a temporary one
      const tempExplosion = this.add.sprite(ballX, ballY, 'explosion');
      tempExplosion.setScale(explosionScale);
      tempExplosion.setTint(explosionTint);
      tempExplosion.play('explode');
      tempExplosion.once('animationcomplete', () => {
        tempExplosion.destroy();
      });
    }

    ball.destroy();

    if (this.soundEnabled) {
      this.boom.play();
    }

    // Handle bomb ball effect - destroy nearby balls
    if (ballType === 'bomb' && !triggeredByBomb) {
      this.triggerBombEffect(ballX, ballY);
    }

    if (!this.lost) {
      // Combo system
      const now = Date.now();
      if (now - this.lastKillTime < this.comboTimeout) {
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
      this.lastKillTime = now;

      // Calculate score with combo multiplier
      let basePoints = 10 + this.level * 10;
      
      // Golden ball gives 5x base points!
      if (ballType === 'golden') {
        basePoints *= 5;
      }
      
      // Score boost power-up doubles points!
      if (this.scoreBoostActive) {
        basePoints *= 2;
      }
      
      const comboMultiplier = Math.min(this.comboCount, 10); // Cap at 10x
      const points = basePoints * comboMultiplier;
      
      this.score += points;
      this.scoreText.setText('Score: ' + this.score);

      // Show special ball feedback
      if (ballType === 'golden') {
        this.showSpecialBallText(ballX, ballY, '⭐ GOLDEN! ⭐', points, '#ffd700');
      } else if (ballType === 'bomb') {
        this.showSpecialBallText(ballX, ballY, '💥 BOMB! 💥', points, '#ff4444');
      } else if (this.comboCount > 1) {
        this.showComboText(ballX, ballY, this.comboCount, points);
      }
    }

    this.shakeCamera(ballType === 'bomb' ? 10 : 4, ballType === 'bomb' ? 150 : 80);
  }

  private triggerBombEffect(x: number, y: number): void {
    const blastRadius = 150; // Pixels
    
    // Find and destroy nearby balls
    this.balls.forEach(otherBall => {
      if (otherBall && otherBall.active) {
        const distance = Phaser.Math.Distance.Between(x, y, otherBall.x, otherBall.y);
        if (distance < blastRadius) {
          // Delay slightly for chain reaction effect
          this.time.delayedCall(100, () => {
            if (otherBall.active) {
              this.killBall(otherBall, true); // Pass true to prevent infinite bomb chains
            }
          });
        }
      }
    });
  }

  private showSpecialBallText(x: number, y: number, text: string, points: number, color: string): void {
    const specialText = this.add.text(x, y - 30, `${text}\n+${points}`, {
      fontSize: '28px',
      color: color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    specialText.setOrigin(0.5, 0.5);
    specialText.setAlpha(1);

    // Animate special text with more flair
    this.tweens.add({
      targets: specialText,
      y: y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        specialText.destroy();
      }
    });
  }

  private showComboText(x: number, y: number, combo: number, points: number): void {
    // Get color based on combo level
    let color = '#ffff00'; // Yellow for 2x
    if (combo >= 5) {
      color = '#ff00ff'; // Magenta for 5x+
    } else if (combo >= 3) {
      color = '#00ffff'; // Cyan for 3x+
    }

    // Create combo text
    const comboText = this.add.text(x, y - 30, `${combo}x COMBO!\n+${points}`, {
      fontSize: '24px',
      color: color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    comboText.setOrigin(0.5, 0.5);
    comboText.setAlpha(1);

    // Animate combo text floating up and fading
    this.tweens.add({
      targets: comboText,
      y: y - 80,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        comboText.destroy();
      }
    });
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

  private getSpecialBallType(): BallType {
    // Only spawn special balls from level 2+
    if (this.level < 2) return 'normal';
    
    const rand = Math.random();
    // 10% chance for golden ball, 8% chance for bomb ball at higher levels
    if (rand < 0.10) return 'golden';
    if (rand < 0.18 && this.level >= 3) return 'bomb';
    return 'normal';
  }

  private spawnBalls(): void {
    const { width, height } = this.scale;

    // Clear the balls array and reset transition flag
    this.balls = [];
    this.levelTransitioning = false;
    
    // Reset combo for new level
    this.comboCount = 0;
    this.lastKillTime = 0;

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

      // Determine if this is a special ball
      const specialType = this.getSpecialBallType();
      ball.setData('ballType', specialType);

      ball.setOrigin(0.5, 0.5);
      ball.setScale(ballScale);
      ball.setAlpha(0); // Start invisible for spawn animation
      
      // Apply visual tint for special balls
      if (specialType === 'golden') {
        ball.setTint(0xffd700); // Gold tint
      } else if (specialType === 'bomb') {
        ball.setTint(0xff4444); // Red tint
      }
      
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

    // Start power-up spawning for this level
    this.startPowerUpSpawning();
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

    // Stop power-up spawning
    this.stopPowerUpSpawning();

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
    // Stop power-up spawning and clean up
    this.stopPowerUpSpawning();
    this.scoreBoostActive = false;
    this.timeFreezeActive = false;

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

  // ==================== POWER-UP SYSTEM ====================

  private startPowerUpSpawning(): void {
    // Only spawn power-ups from level 2+
    if (this.level < 2) return;

    // Schedule first power-up spawn
    this.schedulePowerUpSpawn();
  }

  private schedulePowerUpSpawn(): void {
    // Random delay between 5-10 seconds
    const delay = 5000 + Math.random() * 5000;
    
    this.powerUpSpawnTimer = this.time.delayedCall(delay, () => {
      if (!this.lost && this.balls.length > 0) {
        this.spawnPowerUp();
        // Schedule next spawn
        this.schedulePowerUpSpawn();
      }
    });
  }

  private stopPowerUpSpawning(): void {
    if (this.powerUpSpawnTimer) {
      this.powerUpSpawnTimer.destroy();
      this.powerUpSpawnTimer = undefined;
    }
    // Clean up existing power-ups
    this.powerUps.forEach(p => p.destroy());
    this.powerUps = [];
  }

  private spawnPowerUp(): void {
    const { width, height } = this.scale;
    
    // Random position (avoid edges)
    const x = 80 + Math.random() * (width - 160);
    const y = 100 + Math.random() * (height - 250);

    // Random power-up type
    const types: PowerUpType[] = ['timeFreeze', 'bomb', 'scoreBoost'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Create power-up sprite (using mushroom as base)
    const powerUp = this.add.sprite(x, y, 'mushroom');
    powerUp.setData('powerUpType', type);
    powerUp.setScale(1.2);
    powerUp.setAlpha(0);

    // Apply tint based on type
    switch (type) {
      case 'timeFreeze':
        powerUp.setTint(0x00ffff); // Cyan
        break;
      case 'bomb':
        powerUp.setTint(0xff4444); // Red
        break;
      case 'scoreBoost':
        powerUp.setTint(0xffd700); // Gold
        break;
    }

    // Make interactive
    powerUp.setInteractive({ useHandCursor: true });
    powerUp.on('pointerdown', () => this.collectPowerUp(powerUp));

    // Add label
    const labelText = type === 'timeFreeze' ? '⏱️' : type === 'bomb' ? '💥' : '⭐';
    const label = this.add.text(x, y - 25, labelText, {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    label.setOrigin(0.5, 0.5);
    powerUp.setData('label', label);

    // Spawn animation
    this.tweens.add({
      targets: [powerUp, label],
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Floating animation
    this.tweens.add({
      targets: [powerUp, label],
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto-destroy after 8 seconds if not collected
    this.time.delayedCall(8000, () => {
      if (powerUp.active) {
        this.tweens.add({
          targets: [powerUp, label],
          alpha: 0,
          scale: 0.3,
          duration: 300,
          onComplete: () => {
            label.destroy();
            powerUp.destroy();
            this.powerUps = this.powerUps.filter(p => p !== powerUp);
          }
        });
      }
    });

    this.powerUps.push(powerUp);
  }

  private collectPowerUp(powerUp: Phaser.GameObjects.Sprite): void {
    const type = powerUp.getData('powerUpType') as PowerUpType;
    const label = powerUp.getData('label') as Phaser.GameObjects.Text;
    const x = powerUp.x;
    const y = powerUp.y;

    // Remove from array
    this.powerUps = this.powerUps.filter(p => p !== powerUp);

    // Destroy sprite and label
    label.destroy();
    powerUp.destroy();

    // Apply effect
    switch (type) {
      case 'timeFreeze':
        this.activateTimeFreeze();
        this.showPowerUpText(x, y, '⏱️ TIME FREEZE!', '#00ffff');
        break;
      case 'bomb':
        this.activateBombPowerUp();
        this.showPowerUpText(x, y, '💥 BOOM!', '#ff4444');
        break;
      case 'scoreBoost':
        this.activateScoreBoost();
        this.showPowerUpText(x, y, '⭐ 2X SCORE!', '#ffd700');
        break;
    }

    if (this.soundEnabled) {
      this.boom.play();
    }
  }

  private showPowerUpText(x: number, y: number, text: string, color: string): void {
    const powerUpText = this.add.text(x, y, text, {
      fontSize: '32px',
      color: color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    powerUpText.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: powerUpText,
      y: y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => powerUpText.destroy()
    });
  }

  private activateTimeFreeze(): void {
    this.timeFreezeActive = true;

    // Freeze all balls
    this.balls.forEach(ball => {
      if (ball && ball.active && ball.body) {
        const body = ball.body as Phaser.Physics.Arcade.Body;
        ball.setData('savedVelocity', { x: body.velocity.x, y: body.velocity.y });
        body.setVelocity(0, 0);
        ball.setTint(0x88ffff); // Cyan tint to show frozen
      }
    });

    // Flash screen
    this.cameras.main.flash(200, 0, 255, 255);

    // Unfreeze after 3 seconds
    this.time.delayedCall(3000, () => {
      this.timeFreezeActive = false;
      this.balls.forEach(ball => {
        if (ball && ball.active && ball.body) {
          const saved = ball.getData('savedVelocity');
          if (saved) {
            (ball.body as Phaser.Physics.Arcade.Body).setVelocity(saved.x, saved.y);
          }
          // Restore original tint based on ball type
          const ballType = ball.getData('ballType') as BallType;
          if (ballType === 'golden') {
            ball.setTint(0xffd700);
          } else if (ballType === 'bomb') {
            ball.setTint(0xff4444);
          } else {
            ball.clearTint();
          }
        }
      });
    });
  }

  private activateBombPowerUp(): void {
    // Destroy 3 random balls
    const activeBalls = this.balls.filter(b => b && b.active);
    const toDestroy = Math.min(3, activeBalls.length);

    for (let i = 0; i < toDestroy; i++) {
      const randomIndex = Math.floor(Math.random() * activeBalls.length);
      const ball = activeBalls[randomIndex];
      if (ball && ball.active) {
        this.time.delayedCall(i * 150, () => {
          if (ball.active) {
            this.killBall(ball, true);
          }
        });
        activeBalls.splice(randomIndex, 1);
      }
    }

    this.shakeCamera(15, 200);
  }

  private activateScoreBoost(): void {
    this.scoreBoostActive = true;
    this.scoreBoostEndTime = Date.now() + 10000; // 10 seconds

    // Visual indicator - make score text gold
    this.scoreText.setColor('#ffd700');
    this.scoreText.setFontSize('28px');

    // End boost after 10 seconds
    this.time.delayedCall(10000, () => {
      this.scoreBoostActive = false;
      this.scoreText.setColor('#000000');
      this.scoreText.setFontSize('24px');
    });
  }
}
