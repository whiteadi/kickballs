export interface GameConfig {
  gameWidth: number;
  gameHeight: number;
  localStorageName: string;
  webfonts: string[];
}

const config: GameConfig = {
  gameWidth: 480,
  gameHeight: 640,
  localStorageName: 'kickballs-phaser3',
  webfonts: ['Bangers']
};

export default config;