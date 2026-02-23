import Phaser from 'phaser';

export default class SplashScene extends Phaser.Scene {
  private loaderBg!: Phaser.GameObjects.Image;
  private loaderBar!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'Splash' });
  }

  preload(): void {
    const { width, height } = this.scale;

    // Create loading bar
    this.loaderBg = this.add.image(width / 2, height / 2, 'loaderBg');
    this.loaderBar = this.add.image(width / 2, height / 2, 'loaderBar');

    // Set up progress bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Load game assets (served from publicDir 'assets', so paths start from there)
    this.load.image('ball', 'images/black_ball.png');
    this.load.image('background', 'images/raindrop.jpg');
    this.load.image('phaser', 'images/EnemyBug.png');
    this.load.spritesheet('explosion', 'images/explosion.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.image('logo', 'images/logo.jpg');
    this.load.image('restart', 'images/restart.png');

    // Load audio
    this.load.audio('boom', 'media/explosion.wav');
    this.load.audio('game-over', 'media/game-over.wav');
    this.load.audio('soundtrack', 'media/Ascending2.mp3');

    // Load mute button spritesheet
    this.load.spritesheet('mute', 'images/mute2.png', {
      frameWidth: 25,
      frameHeight: 18
    });
  }

  create(): void {
    // Clean up loader images
    this.loaderBg.destroy();
    this.loaderBar.destroy();

    // Start the game
    this.scene.start('Game');
  }
}