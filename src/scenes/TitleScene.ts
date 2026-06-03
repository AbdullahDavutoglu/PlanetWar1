import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private audioStarted = false;

  constructor() {
    super('TitleScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.bg = this.add.tileSprite(0, 0, width, height, 'space-bg')
      .setOrigin(0, 0)
      .setScrollFactor(0);

    // Title
    const title = this.add.text(width / 2, height * 0.3, 'GEZEGEN\nSAVAŞI', {
      fontFamily: 'Orbitron',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: '#4f46e5',
      strokeThickness: 8,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#000000',
        blur: 10,
        stroke: true,
        fill: true,
      },
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.48, 'Küçük gezegenleri yut, büyüğe çarpma!', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      color: '#a5b4fc',
      align: 'center',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.container(width / 2, height * 0.65);
    const btnBg = this.add.rectangle(0, 0, 280, 60, 0x4f46e5, 1)
      .setStrokeStyle(3, 0x818cf8);
    const btnText = this.add.text(0, 0, 'OYNA', {
      fontFamily: 'Orbitron',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    startBtn.add([btnBg, btnText]);
    startBtn.setSize(280, 60);
    startBtn.setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      btnBg.setFillStyle(0x6366f1);
      this.tweens.add({
        targets: startBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    startBtn.on('pointerout', () => {
      btnBg.setFillStyle(0x4f46e5);
      this.tweens.add({
        targets: startBtn,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    startBtn.on('pointerdown', () => {
      if (!this.audioStarted) {
        this.sound.play('click', { volume: 0.5 });
        this.audioStarted = true;
      }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    // Controls hint
    const controls = this.add.text(width / 2, height * 0.82, 'Fare veya Dokunmatik ile hareket et', {
      fontFamily: 'Orbitron',
      fontSize: '14px',
      color: '#6b7280',
    }).setOrigin(0.5);

    const highScore = localStorage.getItem('gezegenHighScore') || '0';
    this.add.text(width / 2, height * 0.9, `En Yüksek Skor: ${highScore}`, {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: '#fbbf24',
    }).setOrigin(0.5);

    // Floating planets decoration
    this.createFloatingPlanet(width * 0.15, height * 0.25, 'planet-small', 0.4);
    this.createFloatingPlanet(width * 0.85, height * 0.2, 'planet-medium', 0.5);
    this.createFloatingPlanet(width * 0.1, height * 0.75, 'planet-large', 0.35);
    this.createFloatingPlanet(width * 0.88, height * 0.7, 'planet-huge', 0.3);

    // Title float animation
    this.tweens.add({
      targets: title,
      y: title.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle pulse
    this.tweens.add({
      targets: subtitle,
      alpha: 0.6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createFloatingPlanet(x: number, y: number, key: string, scale: number) {
    const planet = this.add.image(x, y, key).setScale(scale).setAlpha(0.6);
    this.tweens.add({
      targets: planet,
      y: y + 20,
      duration: 3000 + Math.random() * 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: planet,
      angle: 360,
      duration: 20000 + Math.random() * 10000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  update() {
    this.bg.tilePositionX += 0.2;
    this.bg.tilePositionY += 0.1;
  }
}
