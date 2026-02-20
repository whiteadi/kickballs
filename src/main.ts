import Phaser from 'phaser';
import config from './config';
import BootScene from './scenes/BootScene';
import SplashScene from './scenes/SplashScene';
import GameScene from './scenes/GameScene';

// Capacitor support
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: config.gameWidth,
  height: config.gameHeight,
  parent: 'game-container',
  backgroundColor: '#EDEEC9',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: config.gameWidth,
    height: config.gameHeight
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 6 },
      debug: false
    }
  },
  scene: [BootScene, SplashScene, GameScene]
};

class Game extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

// Wait for DOM to be ready
const startGame = (): void => {
  new Game(gameConfig);
};

// Check if running in Capacitor (native mobile)
if (window.Capacitor?.isNativePlatform()) {
  // Wait for Capacitor to be ready
  document.addEventListener('deviceready', startGame, false);
} else {
  // Web browser - start immediately when DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startGame();
  } else {
    document.addEventListener('DOMContentLoaded', startGame);
  }
}