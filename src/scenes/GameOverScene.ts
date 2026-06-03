import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  private score = 0;
  private highScore = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number; highScore: number }) {
    this.score = data.score;
    this.highScore = data.highScore;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'PARÇALANDIN!', {
      fontFamily: 'Orbitron',
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#ef4444',
      align: 'center',
      stroke: '#7f1d1d',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, height * 0.42, `Skor: ${this.score}`, {
      fontFamily: 'Orbitron',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // High score
    const isNewHigh = this.score >= this.highScore;
    const highScoreText = this.add.text(width / 2, height * 0.52, `En Yüksek: ${this.highScore}`, {
      fontFamily: 'Orbitron',
      fontSize: '22px',
      color: isNewHigh ? '#fbbf24' : '#9ca3af',
    }).setOrigin(0.5);

    if (isNewHigh) {
      highScoreText.setText('YENİ REKOR!');
      this.tweens.add({
        targets: highScoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Restart button
    const restartBtn = this.add.container(width / 2, height * 0.68);
    const btnBg = this.add.rectangle(0, 0, 300, 60, 0x4f46e5, 1)
      .setStrokeStyle(3, 0x818cf8);
    const btnText = this.add.text(0, 0, 'TEKRAR DENE', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    restartBtn.add([btnBg, btnText]);
    restartBtn.setSize(300, 60);
    restartBtn.setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => {
      btnBg.setFillStyle(0x6366f1);
      this.tweens.add({
        targets: restartBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    restartBtn.on('pointerout', () => {
      btnBg.setFillStyle(0x4f46e5);
      this.tweens.add({
        targets: restartBtn,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    restartBtn.on('pointerdown', () => {
      this.sound.play('click', { volume: 0.5 });
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    // Menu button
    const menuBtn = this.add.container(width / 2, height * 0.8);
    const menuBg = this.add.rectangle(0, 0, 300, 50, 0x374151, 1)
      .setStrokeStyle(2, 0x6b7280);
    const menuText = this.add.text(0, 0, 'ANA MENÜ', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      color: '#d1d5db',
    }).setOrigin(0.5);
    menuBtn.add([menuBg, menuText]);
    menuBtn.setSize(300, 50);
    menuBtn.setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => {
      menuBg.setFillStyle(0x4b5563);
      this.tweens.add({
        targets: menuBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    menuBtn.on('pointerout', () => {
      menuBg.setFillStyle(0x374151);
      this.tweens.add({
        targets: menuBtn,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    menuBtn.on('pointerdown', () => {
      this.sound.play('click', { volume: 0.5 });
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });

    // Fade in
    this.cameras.main.fadeIn(500);

    // Title animation
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
