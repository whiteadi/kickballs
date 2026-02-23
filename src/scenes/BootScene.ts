import Phaser from 'phaser';
import WebFont from 'webfontloader';
import config from '../config';

export default class BootScene extends Phaser.Scene {
  private fontsReady: boolean = false;

  constructor() {
    super({ key: 'Boot' });
  }

  init(): void {
    this.fontsReady = false;
  }

  preload(): void {
    // Set background color
    this.cameras.main.setBackgroundColor('#EDEEC9');

    // Load webfonts if configured
    if (config.webfonts.length > 0) {
      WebFont.load({
        google: {
          families: config.webfonts
        },
        active: () => {
          this.fontsReady = true;
        },
        inactive: () => {
          // Fonts failed to load, continue anyway
          this.fontsReady = true;
        }
      });
    } else {
      this.fontsReady = true;
    }

    // Show loading text
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'loading fonts', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#dddddd'
    }).setOrigin(0.5);

    // Load loader assets (served from publicDir 'assets', so paths start from there)
    this.load.image('loaderBg', 'images/loader-bg.png');
    this.load.image('loaderBar', 'images/loader-bar.png');
  }

  update(): void {
    if (this.fontsReady) {
      this.scene.start('Splash');
    }
  }
}