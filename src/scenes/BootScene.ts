import Phaser from 'phaser';
import WebFont from 'webfontloader';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load images
    this.load.image('space-bg', 'images/space-bg.jpg');
    this.load.image('player-planet', 'sprites/player-planet.png');
    this.load.image('planet-small', 'sprites/planet-small.png');
    this.load.image('planet-medium', 'sprites/planet-medium.png');
    this.load.image('planet-large', 'sprites/planet-large.png');
    this.load.image('planet-huge', 'sprites/planet-huge.png');
    this.load.image('star-particle', 'sprites/star-particle.png');

    // Load audio
    this.load.audio('eat', 'sfx/eat.ogg');
    this.load.audio('grow', 'sfx/grow.ogg');
    this.load.audio('click', 'sfx/click.wav');
    this.load.audio('explode', 'sfx/grow.ogg');

    // Load font
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Yükleniyor...', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 - 5, '0%', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x4f46e5, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  create() {
    WebFont.load({
      google: {
        families: ['Orbitron:400,700,900'],
      },
      active: () => {
        this.scene.start('TitleScene');
      },
      inactive: () => {
        this.scene.start('TitleScene');
      },
    });
  }
}
