import Phaser from 'phaser';

interface PlanetData {
  radius: number;
  mass: number;
  texture: string;
  speed: number;
}

const PLANET_TYPES: PlanetData[] = [
  { radius: 18, mass: 1, texture: 'planet-small', speed: 40 },
  { radius: 30, mass: 2, texture: 'planet-medium', speed: 30 },
  { radius: 50, mass: 3, texture: 'planet-large', speed: 22 },
  { radius: 75, mass: 5, texture: 'planet-huge', speed: 15 },
];

interface StarLayer {
  graphics: Phaser.GameObjects.Graphics;
  stars: { x: number; y: number; size: number; alpha: number; speed: number }[];
  parallaxSpeed: number;
}

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerGlow!: Phaser.GameObjects.Graphics;
  private playerRadius = 45;
  private playerMass = 3;
  private planets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { [key: string]: Phaser.Input.Keyboard.Key };
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private sizeText!: Phaser.GameObjects.Text;
  private worldBounds = { width: 3000, height: 3000 };
  private starLayers: StarLayer[] = [];
  private eatEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private explodeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private spawnTimer = 0;
  private gameTime = 0;
  private difficultyMultiplier = 1;
  private isGameOver = false;
  private targetPos = new Phaser.Math.Vector2();
  private usingMouse = false;
  private audioStarted = false;
  private glowPulse = 0;

  constructor() {
    super('GameScene');
  }

  create() {
    this.isGameOver = false;
    this.score = 0;
    this.playerRadius = 45;
    this.playerMass = 3;
    this.spawnTimer = 0;
    this.gameTime = 0;
    this.difficultyMultiplier = 1;
    this.usingMouse = false;
    this.audioStarted = false;
    this.glowPulse = 0;

    // World bounds
    this.physics.world.setBounds(0, 0, this.worldBounds.width, this.worldBounds.height);

    // Procedural starfield background (3 layers for parallax depth)
    this.createStarfield();

    // Particles
    this.eatEmitter = this.add.particles(0, 0, 'star-particle', {
      speed: { min: 80, max: 250 },
      scale: { start: 0.6, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      tint: [0x4ade80, 0x22d3ee, 0xfbbf24],
      emitting: false,
    });

    this.explodeEmitter = this.add.particles(0, 0, 'star-particle', {
      speed: { min: 100, max: 350 },
      scale: { start: 1, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      tint: [0xef4444, 0xf97316, 0xfde047],
      emitting: false,
    });

    // Player glow (sun-like aura behind planet)
    this.playerGlow = this.add.graphics();
    this.playerGlow.setDepth(5);

    // Player
    this.player = this.physics.add.sprite(this.worldBounds.width / 2, this.worldBounds.height / 2, 'player-planet');
    this.player.setCircle(128, 0, 0);
    this.player.setDisplaySize(this.playerRadius * 2, this.playerRadius * 2);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setData('radius', this.playerRadius);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, this.worldBounds.width, this.worldBounds.height);

    // Planets group
    this.planets = this.physics.add.group();

    // Initial spawn
    for (let i = 0; i < 30; i++) {
      this.spawnPlanet();
    }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as { [key: string]: Phaser.Input.Keyboard.Key };

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.usingMouse = true;
      this.targetPos.set(pointer.worldX, pointer.worldY);
    });

    this.input.on('pointerdown', () => {
      if (!this.audioStarted) {
        this.audioStarted = true;
      }
    });

    // HUD
    this.createHUD();

    // Collisions
    this.physics.add.overlap(this.player, this.planets, this.handlePlanetCollision as any, undefined, this);

    // Fade in
    this.cameras.main.fadeIn(500);
  }

  createStarfield() {
    const layerConfigs = [
      { count: 400, sizeRange: [0.5, 1.5], alphaRange: [0.2, 0.5], speed: 0.05, color: 0xffffff },
      { count: 200, sizeRange: [1, 2.5], alphaRange: [0.4, 0.7], speed: 0.15, color: 0xc7d2fe },
      { count: 80, sizeRange: [2, 4], alphaRange: [0.6, 1], speed: 0.3, color: 0xfde68a },
    ];

    for (const config of layerConfigs) {
      const graphics = this.add.graphics();
      graphics.setScrollFactor(0);
      graphics.setDepth(0);

      const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];

      for (let i = 0; i < config.count; i++) {
        const x = Phaser.Math.Between(0, this.worldBounds.width);
        const y = Phaser.Math.Between(0, this.worldBounds.height);
        const size = Phaser.Math.FloatBetween(config.sizeRange[0], config.sizeRange[1]);
        const alpha = Phaser.Math.FloatBetween(config.alphaRange[0], config.alphaRange[1]);

        stars.push({ x, y, size, alpha, speed: config.speed });

        graphics.fillStyle(config.color, alpha);
        graphics.fillCircle(x, y, size);

        // Some stars get a subtle glow
        if (Math.random() < 0.1) {
          graphics.fillStyle(config.color, alpha * 0.3);
          graphics.fillCircle(x, y, size * 3);
        }
      }

      this.starLayers.push({ graphics, stars, parallaxSpeed: config.speed });
    }
  }

  createHUD() {
    const cam = this.cameras.main;

    this.scoreText = this.add.text(20, 20, 'Skor: 0', {
      fontFamily: 'Orbitron',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(100);

    this.sizeText = this.add.text(20, 55, 'Boyut: 45', {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: '#a5b4fc',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);

    // Mini-map background
    const mmSize = 140;
    const mmX = cam.width - mmSize - 20;
    const mmY = cam.height - mmSize - 20;

    const mmBg = this.add.rectangle(mmX + mmSize / 2, mmY + mmSize / 2, mmSize, mmSize, 0x000000, 0.5)
      .setStrokeStyle(2, 0x4f46e5)
      .setScrollFactor(0)
      .setDepth(100);

    // Mini-map player dot
    const mmPlayer = this.add.circle(mmX + mmSize / 2, mmY + mmSize / 2, 4, 0x4ade80)
      .setScrollFactor(0)
      .setDepth(101);

    this.events.on('update', () => {
      const px = mmX + (this.player.x / this.worldBounds.width) * mmSize;
      const py = mmY + (this.player.y / this.worldBounds.height) * mmSize;
      mmPlayer.setPosition(px, py);
    });
  }

  spawnPlanet() {
    const margin = 200;

    let x: number, y: number, dist: number;
    let attempts = 0;
    do {
      x = Phaser.Math.Between(margin, this.worldBounds.width - margin);
      y = Phaser.Math.Between(margin, this.worldBounds.height - margin);
      dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
      attempts++;
    } while (dist < 400 && attempts < 50);

    let typeIndex = 0;
    const roll = Math.random();
    const playerSizeFactor = this.playerRadius / 160;

    if (roll < 0.45) {
      typeIndex = 0;
    } else if (roll < 0.7) {
      typeIndex = 1;
    } else if (roll < 0.88 - playerSizeFactor * 0.2) {
      typeIndex = 2;
    } else {
      typeIndex = 3;
    }

    if (this.difficultyMultiplier > 1.5 && Math.random() < 0.15) {
      typeIndex = Math.min(3, typeIndex + 1);
    }

    const type = PLANET_TYPES[typeIndex];
    const radius = type.radius * (0.8 + Math.random() * 0.4);

    const planet = this.physics.add.sprite(x, y, type.texture);
    planet.setCircle(128, 0, 0);
    planet.setDisplaySize(radius * 2, radius * 2);
    planet.setData('radius', radius);
    planet.setData('mass', type.mass);
    planet.setData('type', typeIndex);

    const angle = Math.random() * Math.PI * 2;
    const speed = type.speed * (0.5 + Math.random() * 0.5);
    planet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    planet.setCollideWorldBounds(true);
    planet.setBounce(1);

    this.planets.add(planet);
  }

  handlePlanetCollision(player: Phaser.Physics.Arcade.Sprite, planetGO: Phaser.Physics.Arcade.Sprite) {
    if (this.isGameOver) return;

    const planet = planetGO as Phaser.Physics.Arcade.Sprite;
    const pRadius = planet.getData('radius') as number;
    const pMass = planet.getData('mass') as number;

    if (this.playerRadius > pRadius * 1.15) {
      this.eatPlanet(planet, pRadius, pMass);
    } else if (pRadius > this.playerRadius * 1.15) {
      this.die();
    } else {
      const dx = planet.x - this.player.x;
      const dy = planet.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      const pushForce = 150;
      this.player.setVelocity(this.player.body!.velocity.x - nx * pushForce, this.player.body!.velocity.y - ny * pushForce);
      planet.setVelocity(planet.body!.velocity.x + nx * pushForce, planet.body!.velocity.y + ny * pushForce);
    }
  }

  eatPlanet(planet: Phaser.Physics.Arcade.Sprite, radius: number, mass: number) {
    this.eatEmitter.emitParticleAt(planet.x, planet.y, 12);

    const points = Math.floor(mass * 10 + radius);
    this.score += points;
    this.scoreText.setText(`Skor: ${this.score}`);

    const oldRadius = this.playerRadius;
    this.playerRadius = Math.sqrt(this.playerRadius * this.playerRadius + radius * radius * 0.7);
    this.playerMass += mass;
    this.sizeText.setText(`Boyut: ${Math.floor(this.playerRadius)}`);

    const targetScale = this.playerRadius / 128;
    this.tweens.add({
      targets: this.player,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.player.setCircle(128, 0, 0);

    if (this.audioStarted) {
      if (this.playerRadius > oldRadius * 1.3) {
        this.sound.play('grow', { volume: 0.4, rate: 0.8 + Math.random() * 0.3 });
      } else {
        this.sound.play('eat', { volume: 0.4, rate: 0.9 + Math.random() * 0.2 });
      }
    }

    const targetZoom = Math.max(0.4, Math.min(1, 200 / this.playerRadius));
    this.tweens.add({
      targets: this.cameras.main,
      zoom: targetZoom,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    planet.destroy();
  }

  die() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.explodeEmitter.emitParticleAt(this.player.x, this.player.y, 40);
    this.cameras.main.shake(500, 0.02);

    if (this.audioStarted) {
      this.sound.play('explode', { volume: 0.6, rate: 0.5 });
    }

    this.player.setVisible(false);
    this.player.body!.enable = false;
    this.playerGlow.clear();

    const prevHigh = parseInt(localStorage.getItem('gezegenHighScore') || '0');
    if (this.score > prevHigh) {
      localStorage.setItem('gezegenHighScore', this.score.toString());
    }

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene', { score: this.score, highScore: Math.max(prevHigh, this.score) });
      });
    });
  }

  updatePlayerGlow() {
    this.playerGlow.clear();

    // Glow intensity increases with size
    const sizeRatio = Math.min(1, (this.playerRadius - 45) / 120);
    const baseRadius = this.playerRadius * (1 + sizeRatio * 0.8);
    const pulse = Math.sin(this.glowPulse) * 5;

    // Outer warm glow (sun-like)
    const outerAlpha = 0.08 + sizeRatio * 0.12;
    this.playerGlow.fillStyle(0xf59e0b, outerAlpha);
    this.playerGlow.fillCircle(this.player.x, this.player.y, baseRadius + 40 + pulse);

    // Middle orange glow
    const midAlpha = 0.12 + sizeRatio * 0.18;
    this.playerGlow.fillStyle(0xfbbf24, midAlpha);
    this.playerGlow.fillCircle(this.player.x, this.player.y, baseRadius + 20 + pulse * 0.5);

    // Inner bright glow
    const innerAlpha = 0.15 + sizeRatio * 0.2;
    this.playerGlow.fillStyle(0xfde68a, innerAlpha);
    this.playerGlow.fillCircle(this.player.x, this.player.y, baseRadius + 8);

    // Core white-hot center for large planets
    if (sizeRatio > 0.5) {
      this.playerGlow.fillStyle(0xffffff, 0.1 + (sizeRatio - 0.5) * 0.15);
      this.playerGlow.fillCircle(this.player.x, this.player.y, baseRadius * 0.6);
    }
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.glowPulse += delta * 0.003;
    this.updatePlayerGlow();

    this.gameTime += delta;
    this.spawnTimer += delta;
    this.difficultyMultiplier = 1 + this.gameTime / 60000;

    const spawnInterval = Math.max(800, 2000 - this.gameTime / 30);
    if (this.spawnTimer > spawnInterval) {
      this.spawnTimer = 0;
      this.spawnPlanet();
    }

    this.planets.children.each((child) => {
      const planet = child as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(planet.x, planet.y, this.player.x, this.player.y);
      if (dist > 1500) {
        planet.destroy();
      }
      return true;
    });

    const speed = Math.max(80, 220 - this.playerRadius * 0.6);
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (this.usingMouse) {
      const dx = this.targetPos.x - this.player.x;
      const dy = this.targetPos.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        vx = dx / dist;
        vy = dy / dist;
      }
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
    } else {
      this.player.setVelocity(0, 0);
    }

    // Parallax starfield
    const scrollX = this.cameras.main.scrollX;
    const scrollY = this.cameras.main.scrollY;

    for (const layer of this.starLayers) {
      layer.graphics.x = -scrollX * layer.parallaxSpeed;
      layer.graphics.y = -scrollY * layer.parallaxSpeed;
    }

    this.planets.children.each((child) => {
      const planet = child as Phaser.Physics.Arcade.Sprite;
      planet.rotation += 0.005 * (planet.getData('mass') as number);
      return true;
    });

    this.player.rotation += 0.002;
  }
}
