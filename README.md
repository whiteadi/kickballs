# KickBalls - Phaser 3 Game

A simple ball-destroying game built with **Phaser 3**, **TypeScript**, **Vite**, and **Capacitor** for mobile deployment.

The idea of the game was given by [Enric](https://github.com/eballo) - destroy all the balls before time runs out!

## 🎮 How to Play

1. Click the logo to start the game
2. Click/tap on balls to destroy them
3. Complete each level before time runs out
4. Progress through 6 increasingly difficult levels

## 🛠️ Tech Stack

- **[Phaser 3](https://phaser.io/)** - Modern HTML5 game framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[Capacitor](https://capacitorjs.com/)** - Native mobile deployment (iOS/Android)

## 📦 Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/whiteadi/kickballs.git
cd kickballs

# Install dependencies
npm install
```

## 🚀 Development

```bash
# Start development server
npm run dev
```

This will start a local server at http://localhost:3000 with hot module replacement.

## 📱 Building

### Web Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Mobile Build (Capacitor)

#### Initial Setup

```bash
# Add Android platform
npm run cap:add:android

# Add iOS platform (macOS only)
npm run cap:add:ios
```

#### Building for Mobile

```bash
# Build web assets and sync to native projects
npm run mobile:build

# Open in Android Studio
npm run cap:open:android

# Open in Xcode (macOS only)
npm run cap:open:ios
```

## 📁 Project Structure

```
kickballs/
├── assets/              # Game assets (images, audio)
│   ├── images/
│   └── media/
├── src/
│   ├── scenes/          # Phaser 3 scenes
│   │   ├── BootScene.ts
│   │   ├── SplashScene.ts
│   │   └── GameScene.ts
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and constants
│   ├── config.ts        # Game configuration
│   └── main.ts          # Entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── capacitor.config.ts  # Capacitor configuration
└── package.json
```

## 🎯 Game Features

- 6 progressive difficulty levels
- Increasing ball count and speed per level
- Time-based challenges
- Sound effects and background music
- Camera shake effects
- Explosion animations
- Score tracking

## 🔧 Configuration

Edit `src/config.ts` to customize:

```typescript
export default {
  gameWidth: 480,
  gameHeight: 640,
  localStorageName: 'kickballs-phaser3',
  webfonts: ['Bangers']
};
```

## 📄 License

GPL-3.0 - see [LICENSE.md](LICENSE.md)

## 🙏 Credits

- Original game concept by [Enric](https://github.com/eballo)
- Built with [Phaser 3](https://phaser.io/)
- Mobile deployment with [Capacitor](https://capacitorjs.com/)

## 🔄 Migration from v1

This is version 2.0, migrated from:
- Phaser CE (v2) → Phaser 3
- Cordova → Capacitor
- Webpack → Vite
- JavaScript → TypeScript

The original v1 code is preserved in the git history.