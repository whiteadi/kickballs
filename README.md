# simple phaser game, destroy all balls

The idea of the game was actually given to me by [Enric](https://github.com/eballo) when I asked him, in a cloudy afternoon, to give me an idea of a simple game to play with in order to learn phaser...
#### I used the bootstrap project for creating games with Phaser + ES6 + Webpack:

[Phaser+ES6+Webpack](https://github.com/lean/phaser-es6-webpack)

# Setup for dev or running locally

## 1. Clone this repo:

Navigate into your workspace directory.

Run:

```git clone https://github.com/whiteadi/kickballs.git```

## 2. Install node.js and npm:

https://nodejs.org/en/


## 3. Install dependencies (optionally you can install [yarn](https://yarnpkg.com/)):

Navigate to the cloned repo's directory.

Run:

```npm install``` 

or if you chose yarn, just run ```yarn```

## 4. Run the development server:

Run:

```npm run dev```  or ```yarn dev```

This will run a server so you can run the game in a browser. It will also start a watch process, so you can change the source and the process will recompile and refresh the browser automatically.

To run the game, open your browser and enter http://localhost:3000 into the address bar.


## Build for deployment:

Run:

```npm run deploy```

This will optimize and minimize the compiled bundle.

## Deploy for cordova:
Make sure to uncomment the cordova.js file in the src/index.html and to update config.xml with your informations. (name/description...)

More informations about the cordova configuration:
https://cordova.apache.org/docs/en/latest/config_ref/

Also u need 2 have cordova installed globally:
```npm install -g cordova```

There is 3 platforms actually tested and supported : 
- browser
- ios
- android

First run (ios example):

```
yarn cordova
cordova platform add ios
cordova run ios
```

Update (ios example):

```
yarn cordova
cordova platform update ios
cordova run ios
```

This will optimize and minimize the compiled bundle.

## Config:
before you get to work you will surely want to check the config file. You could setup dimensions, webfonts, etc

## Webfonts:
In the config file you can specify which webfonts you want to include. In case you do not want to use webfonts simply leave the array empty

## Credits
Big thanks to these great repo:

https://github.com/lean/phaser-es6-webpack/
