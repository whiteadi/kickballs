import Phaser from 'phaser';
import { BALL_SPEED, LEVELS, TIME_INTERVALS, SPEED_MULTIPLIERS, BOSS_LEVELS } from '../utils/constants';

// Ball types for special balls
type BallType = 'normal' | 'golden' | 'bomb' | 'boss' | 'minion';

// Power-up types
type PowerUpType = 'timeFreeze' | 'bomb' | 'scoreBoost';

export default class GameScene extends Phaser.Scene {
  // Game state
  private level: number = 0;
  private balls: Phaser.Physics.Arcade.Sprite[] = [];
  
  // Boss state
  private isBossLevel: boolean = false;
  private bossBall?: Phaser.Physics.Arcade.Sprite;
  private bossHealth: number = 0;
  private bossMaxHealth: number = 5;
  private bossHealthBar?: Phaser.GameObjects.Graphics;
  private bossHealthBarBg?: Phaser.GameObjects.Graphics;
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
  private timeFreezeActive: boolean = false; // Used to prevent double-freeze
  private powerUpSpawnTimer?: Phaser.Time.TimerEvent;

  // Timer state
  private startTime: number = 0;

  // Game objects
  private theBackground!: Phaser.GameObjects.TileSprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private explosions!: Phaser.GameObjects.Group;
  private logo!: Phaser.GameObjects.Image;
  
  // Particle emitters
  private popParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkleParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private comboParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

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

    // Create particle emitters
    this.createParticleEmitters();
  }

  private createParticleEmitters(): void {
    // Pop particles - burst when ball is destroyed
    this.popParticles = this.add.particles(0, 0, 'ball', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.3, end: 0 },
      lifespan: 400,
      gravityY: 200,
      emitting: false
    });

    // Sparkle particles - for golden balls and combos
    this.sparkleParticles = this.add.particles(0, 0, 'ball_shiny', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.2, end: 0 },
      lifespan: 600,
      alpha: { start: 1, end: 0 },
      tint: 0xffd700,
      emitting: false
    });

    // Combo particles - escalating effect
    this.comboParticles = this.add.particles(0, 0, 'ball_shiny', {
      speed: { min: 80, max: 180 },
      scale: { start: 0.25, end: 0 },
      lifespan: 500,
      alpha: { start: 1, end: 0 },
      emitting: false
    });
  }

  private emitPopParticles(x: number, y: number, color: number, count: number = 8): void {
    if (!this.popParticles) return;
    
    this.popParticles.setPosition(x, y);
    this.popParticles.setParticleTint(color);
    this.popParticles.explode(count);
  }

  private emitSparkleParticles(x: number, y: number, count: number = 12): void {
    if (!this.sparkleParticles) return;
    
    this.sparkleParticles.setPosition(x, y);
    this.sparkleParticles.explode(count);
  }

  private emitComboParticles(x: number, y: number, comboLevel: number): void {
    if (!this.comboParticles) return;
    
    // More particles for higher combos
    const count = Math.min(comboLevel * 3, 20);
    
    // Color based on combo level
    let color = 0xffff00; // Yellow
    if (comboLevel >= 5) {
      color = 0xff00ff; // Magenta
    } else if (comboLevel >= 3) {
      color = 0x00ffff; // Cyan
    }
    
    this.comboParticles.setPosition(x, y);
    this.comboParticles.setParticleTint(color);
    this.comboParticles.explode(count);
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
        if (this.level < 11) {
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
    // 12 levels with cycling themes
    switch (this.level) {
      case 0:
      case 1:
        return 0xff6600; // Orange/red for black balls
      case 2:
      case 3:
        return 0x4488ff; // Blue for shiny balls
      case 4:
      case 5:
        return 0xaaaaaa; // Silver/gray for metal balls
      case 6:
      case 7:
        return 0x00ff88; // Green/cyan for pang balls
      case 8:
      case 9:
        return 0xff44ff; // Magenta for mixed balls
      case 10:
      case 11:
        return 0xffaa00; // Gold/orange for final levels
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

    // Emit pop particles
    this.emitPopParticles(ballX, ballY, explosionTint, ballType === 'bomb' ? 15 : 8);
    
    // Extra sparkles for golden balls
    if (ballType === 'golden') {
      this.emitSparkleParticles(ballX, ballY, 15);
    }

    ball.destroy();

    if (this.soundEnabled) {
      // Play different sound based on ball type
      this.playHitSound(ballType);
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
    // Emit combo particles
    this.emitComboParticles(x, y, combo);

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
    // 12 levels with cycling themes
    switch (this.level) {
      case 0:
        return 0xffffff; // Normal - Tutorial
      case 1:
        return 0xe8f4e8; // Slight green tint
      case 2:
        return 0xe8e8f4; // Slight blue tint
      case 3:
        return 0xf4e8e8; // Slight red tint - Boss 1
      case 4:
        return 0xf4f0e0; // Slight yellow/sepia tint
      case 5:
        return 0xe0e0e8; // Slight purple/dark tint
      case 6:
        return 0xe8f4f4; // Slight cyan tint
      case 7:
        return 0xf4e0e0; // Deeper red tint - Boss 2
      case 8:
        return 0xf0e8f4; // Slight magenta tint
      case 9:
        return 0xe8f0e8; // Fresh green tint
      case 10:
        return 0xf4f4e0; // Golden tint
      case 11:
        return 0xe0d8d0; // Dark/epic tint - Final Boss
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
    // 12 levels with cycling ball types
    switch (this.level) {
      case 0:
      case 1:
        return 'ball'; // Black balls for tutorial levels
      case 2:
      case 3:
        return 'ball_shiny'; // Shiny balls for early-mid levels
      case 4:
      case 5:
        return 'ball_metal'; // Metal balls for mid levels
      case 6:
      case 7:
        return 'ball_pang'; // Pang balls for mid-late levels
      case 8:
      case 9: {
        // Mixed - randomly choose between all types
        const mixedTypes = ['ball', 'ball_shiny', 'ball_metal', 'ball_pang'];
        return mixedTypes[Math.floor(Math.random() * mixedTypes.length)];
      }
      case 10:
      case 11: {
        // Final levels - also mixed but with preference for shiny/metal
        const finalTypes = ['ball_shiny', 'ball_metal', 'ball_shiny', 'ball_metal', 'ball_pang'];
        return finalTypes[Math.floor(Math.random() * finalTypes.length)];
      }
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

    // Check if this is a boss level
    this.isBossLevel = BOSS_LEVELS.includes(this.level);
    
    // If boss level, spawn boss instead of regular balls
    if (this.isBossLevel) {
      this.spawnBoss();
      return;
    }

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

  // ==================== SOUND SYSTEM ====================

  private playHitSound(ballType: BallType): void {
    // Different pitch/rate based on ball type and combo
    let rate = 1.0;
    let volume = 0.2;

    switch (ballType) {
      case 'golden':
        rate = 1.5; // Higher pitch for golden
        volume = 0.3;
        break;
      case 'bomb':
        rate = 0.7; // Lower pitch for bomb
        volume = 0.35;
        break;
      case 'boss':
        rate = 0.5; // Very low for boss
        volume = 0.4;
        break;
      case 'minion':
        rate = 1.3; // Slightly higher for minions
        volume = 0.15;
        break;
      default:
        // Vary pitch based on combo for normal balls
        rate = 1.0 + (this.comboCount - 1) * 0.1; // Escalating pitch
        rate = Math.min(rate, 2.0); // Cap at 2x
        break;
    }

    // Play with modified rate
    this.sound.play('boom', { volume, rate });
  }

  private playPowerUpSound(): void {
    // Higher pitch "whoosh" effect for power-ups
    this.sound.play('boom', { volume: 0.25, rate: 1.8 });
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
      this.playPowerUpSound();
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
    // Prevent double-freeze
    if (this.timeFreezeActive) return;
    
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

  // ==================== BOSS SYSTEM ====================

  private spawnBoss(): void {
    const { width, height } = this.scale;

    // Determine boss tier based on level
    const bossIndex = BOSS_LEVELS.indexOf(this.level);
    this.bossMaxHealth = 5 + bossIndex * 2; // 5, 7, 9 health for bosses 1, 2, 3
    this.bossHealth = this.bossMaxHealth;

    // Show boss warning
    this.showBossWarning(() => {
      // Create boss ball
      const bossScale = 3.0 + bossIndex * 0.5; // Bigger for later bosses
      this.bossBall = this.physics.add.sprite(width / 2, -100, 'ball_metal');
      this.bossBall.setData('ballType', 'boss');
      this.bossBall.setOrigin(0.5, 0.5);
      this.bossBall.setScale(bossScale);
      this.bossBall.setTint(0xff0000); // Red tint for boss

      // Make interactive
      this.bossBall.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, this.bossBall.width * 0.8),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      });
      this.bossBall.on('pointerdown', () => this.hitBoss());

      // Physics setup
      this.bossBall.setCollideWorldBounds(true);
      this.bossBall.setBounce(1, 1);
      (this.bossBall.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      // Dramatic entrance animation
      this.tweens.add({
        targets: this.bossBall,
        y: height / 3,
        duration: 1500,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          // Start boss movement
          const speed = 100 + bossIndex * 30;
          this.bossBall!.setVelocity(
            (Math.random() - 0.5) * speed * 2,
            (Math.random() - 0.5) * speed * 2
          );
        }
      });

      // Add boss to balls array for tracking
      this.balls = [this.bossBall];

      // Create health bar
      this.createBossHealthBar();

      // Screen shake for dramatic effect
      this.shakeCamera(15, 300);

      // Start power-up spawning
      this.startPowerUpSpawning();
    });
  }

  private showBossWarning(onComplete: () => void): void {
    const { width, height } = this.scale;

    // Flash screen red
    this.cameras.main.flash(500, 255, 0, 0);

    // Boss warning text
    const bossIndex = BOSS_LEVELS.indexOf(this.level);
    const bossNames = ['MINI BOSS', 'MEGA BOSS', 'FINAL BOSS'];
    const bossName = bossNames[bossIndex] || 'BOSS';

    const warningText = this.add.text(width / 2, height / 2, `⚠️ ${bossName}! ⚠️`, {
      fontSize: '48px',
      color: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    warningText.setOrigin(0.5, 0.5);
    warningText.setAlpha(0);
    warningText.setScale(0.5);

    // Pulsing animation
    this.tweens.add({
      targets: warningText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Pulse effect
        this.tweens.add({
          targets: warningText,
          scale: 1.0,
          duration: 200,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            this.tweens.add({
              targets: warningText,
              alpha: 0,
              y: height / 2 - 50,
              duration: 300,
              onComplete: () => {
                warningText.destroy();
                onComplete();
              }
            });
          }
        });
      }
    });
  }

  private createBossHealthBar(): void {
    const { width } = this.scale;
    const barWidth = 200;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = 50;

    // Background
    this.bossHealthBarBg = this.add.graphics();
    this.bossHealthBarBg.fillStyle(0x333333, 1);
    this.bossHealthBarBg.fillRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 5);

    // Health bar
    this.bossHealthBar = this.add.graphics();
    this.updateBossHealthBar();
  }

  private updateBossHealthBar(): void {
    if (!this.bossHealthBar) return;

    const { width } = this.scale;
    const barWidth = 200;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = 50;

    const healthPercent = this.bossHealth / this.bossMaxHealth;
    const currentWidth = barWidth * healthPercent;

    // Color based on health
    let color = 0x00ff00; // Green
    if (healthPercent <= 0.3) {
      color = 0xff0000; // Red
    } else if (healthPercent <= 0.6) {
      color = 0xffff00; // Yellow
    }

    this.bossHealthBar.clear();
    this.bossHealthBar.fillStyle(color, 1);
    this.bossHealthBar.fillRoundedRect(barX, barY, currentWidth, barHeight, 3);
  }

  private hitBoss(): void {
    if (!this.bossBall || !this.bossBall.active) return;

    this.bossHealth--;
    
    // Flash boss white
    this.bossBall.setTint(0xffffff);
    this.time.delayedCall(100, () => {
      if (this.bossBall && this.bossBall.active) {
        this.bossBall.setTint(0xff0000);
      }
    });

    // Update health bar
    this.updateBossHealthBar();

    // Show damage text
    this.showSpecialBallText(
      this.bossBall.x,
      this.bossBall.y,
      `💥 HIT! ${this.bossHealth}/${this.bossMaxHealth}`,
      50 + this.level * 10,
      '#ff4444'
    );

    // Screen shake
    this.shakeCamera(8, 100);

    // Play sound
    if (this.soundEnabled) {
      this.boom.play();
    }

    // Spawn minion balls when hit
    this.spawnMinions(this.bossBall.x, this.bossBall.y, 2);

    // Check if boss is defeated
    if (this.bossHealth <= 0) {
      this.defeatBoss();
    } else {
      // Boss gets faster when hit
      const body = this.bossBall.body as Phaser.Physics.Arcade.Body;
      const speedBoost = 1.1;
      body.setVelocity(body.velocity.x * speedBoost, body.velocity.y * speedBoost);
    }

    // Add score
    const points = 50 + this.level * 10;
    this.score += points;
    this.scoreText.setText('Score: ' + this.score);
  }

  private spawnMinions(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const minion = this.physics.add.sprite(x, y, 'ball');
      minion.setData('ballType', 'minion');
      minion.setOrigin(0.5, 0.5);
      minion.setScale(1.0);
      minion.setTint(0xff8888); // Light red tint

      // Make interactive
      minion.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, minion.width * 1.2),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      });
      minion.on('pointerdown', () => this.killBall(minion));

      // Random velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 100;
      minion.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      minion.setCollideWorldBounds(true);
      minion.setBounce(0.9, 0.9);
      (minion.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      // Spawn animation
      minion.setAlpha(0);
      minion.setScale(0.3);
      this.tweens.add({
        targets: minion,
        alpha: 1,
        scale: 1.0,
        duration: 200,
        ease: 'Back.easeOut'
      });

      this.balls.push(minion);
    }
  }

  private defeatBoss(): void {
    if (!this.bossBall) return;

    const x = this.bossBall.x;
    const y = this.bossBall.y;

    // Big explosion
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 100, () => {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        const tempExplosion = this.add.sprite(x + offsetX, y + offsetY, 'explosion');
        tempExplosion.setScale(2.5);
        tempExplosion.setTint(0xff0000);
        tempExplosion.play('explode');
        tempExplosion.once('animationcomplete', () => tempExplosion.destroy());
      });
    }

    // Destroy boss
    this.bossBall.destroy();
    this.bossBall = undefined;

    // Clean up health bar
    if (this.bossHealthBar) {
      this.bossHealthBar.destroy();
      this.bossHealthBar = undefined;
    }
    if (this.bossHealthBarBg) {
      this.bossHealthBarBg.destroy();
      this.bossHealthBarBg = undefined;
    }

    // Big score bonus
    const bossIndex = BOSS_LEVELS.indexOf(this.level);
    const bonusPoints = 500 + bossIndex * 250;
    this.score += bonusPoints;
    this.scoreText.setText('Score: ' + this.score);

    // Show victory text
    this.showSpecialBallText(x, y, '🏆 BOSS DEFEATED! 🏆', bonusPoints, '#ffd700');

    // Big screen shake
    this.shakeCamera(25, 500);

    // Play sound
    if (this.soundEnabled) {
      this.boom.play();
    }

    // Remove boss from balls array
    this.balls = this.balls.filter(b => b !== this.bossBall);

    // Reset boss state
    this.isBossLevel = false;
  }
}
