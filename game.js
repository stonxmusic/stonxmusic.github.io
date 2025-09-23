// Phaser Game - Check The Beat 

// 🔗 Supabase Setup
const SUPABASE_URL = 'https://tljxansjslxesbsakvvc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsanhhbnNqc2x4ZXNic2FrdnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODQ1NzgsImV4cCI6MjA2ODY2MDU3OH0.WBGo15wD6HZWluSqBmPFWKNUyS1IxfM1G3XA5GVWI5E';
// 🛠️ Use a different variable name for the client instance:
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let game;

window.onload = function () {
  const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    backgroundColor: '#0f0f0f',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [BootScene, StartScene, GameScene]
  };

  game = new Phaser.Game(config);
};

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.image('player', 'assets/player.png');
	this.load.image('player_damaged', 'assets/player_damaged.png'); 
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('powerup_small', 'assets/powerup_small.png');
    this.load.image('powerup_shield', 'assets/powerup_shield.png');
    this.load.image('shieldGlow', 'assets/shield_glow.png');
    this.load.image('scanlines', 'assets/scanlines.png');
	this.load.image('powerup_slow', 'assets/powerup_slow.png');
	this.load.image('epArt', 'assets/ep_art.jpg');
	this.load.image('powerup_x2', 'assets/powerup_x2.png');
	this.load.image('stxLogo', 'assets/stx_logo.png');
  
	
	// --- NEW: gun powerup + bullet + shoot SFX
	this.load.image('powerup_gun', 'assets/powerup_gun.png');
	this.load.image('bullet', 'assets/bullet.png');
	this.load.audio('sfx_shoot', 'assets/shoot.mp3');

    this.load.spritesheet('zap', 'assets/zap.png', { frameWidth: 32, frameHeight: 32 });
	this.load.spritesheet('enemy', 'assets/enemy_spritesheet.png', {
  frameWidth: 280,  // Replace with your frame size
  frameHeight: 280
});
    this.load.audio('menuMusic', ['assets/checkthebeat.mp3']);
    this.load.audio('gameMusic', ['assets/checkthebeat.mp3']);
	this.load.audio('sfx_powerup', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_shield', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_mini', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_x2', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_slowmo', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_score_nice', 'assets/sfx_nice.mp3');
this.load.audio('sfx_score_heating', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_score_420', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_score_500', 'assets/sfx_powerup.mp3');
this.load.audio('sfx_death', 'assets/sfx_death.mp3');
  }

  create() {
    this.scene.start('StartScene');
  }
}

class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create() {
    this.menuMusic = this.sound.add('menuMusic', { loop: true, volume: 0.5 });
    this.menuMusic.play();

    // Add logo with reference so we can animate it
    this.logo = this.add.image(240, 250, 'logo').setScale(0.8);

    // Float up and down + slight glow
    this.tweens.add({
      targets: this.logo,
      y: '+=5',
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: this.logo,
      alpha: { from: 1, to: 0.8 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
	
    const startText = this.add.text(240, 500, 'PRESS TO START', {
      fontSize: '24px', fill: '#00ffcc'
    }).setOrigin(0.5).setInteractive();

    startText.on('pointerdown', () => {
      this.menuMusic.stop();
      this.menuMusic.destroy();

      // Optional: flash when entering
      this.cameras.main.flash(300, 255, 255, 255);

      this.scene.start('GameScene');
    });
	this.add.text(240, 540, 'DODGE THE ENEMIES', {
  fontSize: '16px',
  fill: '#999999'
}).setOrigin(0.5);
this.add.text(240, 560, 'MOVE LEFT & RIGHT TO SURVIVE', {
  fontSize: '16px',
  fill: '#999999'
}).setOrigin(0.5);
this.add.text(240, 580, 'POWER UP + RACK UP POINTS', {
  fontSize: '16px',
  fill: '#999999'
}).setOrigin(0.5);

    this.add.image(240, 320, 'scanlines').setDepth(10).setAlpha(0.2).setScale(2);
  }
}


class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    this.isPointerDown = false;
	this.playerHits = 0;
    this.mobileLeftDown = false;
    this.mobileRightDown = false;
    this.isInvincible = false;
    this.isSmall = false;
    this.originalScale = 1;
    this.isSlowmo = false;
    this.score = 0;
    this.gameOver = false;
    this.baseSpeed = 200;
    this.spawnDelay = 500;
	this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.patternWave = false;
this.bgLogo = this.add.image(240, 320, 'stxLogo')
  .setAlpha(0.05)
  .setScale(0.5)
  .setDepth(-5);
    this.music = this.sound.add('gameMusic', { loop: true, volume: 0.5 });
    this.music.play();
this.sfx = {
  powerup: this.sound.add('sfx_powerup'),
  shield: this.sound.add('sfx_shield'),
  mini: this.sound.add('sfx_mini'),
  x2: this.sound.add('sfx_x2'),
  slowmo: this.sound.add('sfx_slowmo'),
  nice: this.sound.add('sfx_score_nice'),
  heating: this.sound.add('sfx_score_heating'),
  bong: this.sound.add('sfx_score_420'),
  calmdown: this.sound.add('sfx_score_500')


};
this.sfx.death = this.sound.add('sfx_death');

this.sfx.shoot = this.sound.add('sfx_shoot');

this.anims.create({
  key: 'enemyFloat',
  frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 1 }),
  frameRate: 4, // Adjust speed here
  repeat: -1    // Loop forever
});
// Enemy 2 animation
this.anims.create({
    key: 'enemy2Float',
    frames: this.anims.generateFrameNumbers('enemy', { start: 2, end: 3 }),
    frameRate: 4,
    repeat: -1
});
// Enemy 3 animation
this.anims.create({
    key: 'enemy3Float',
    frames: this.anims.generateFrameNumbers('enemy', { start: 4, end: 5 }),
    frameRate: 4,
    repeat: -1
});
    this.anims.create({
      key: 'zapAnim',
      frames: this.anims.generateFrameNumbers('zap', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: 0
    });

    this.player = this.physics.add.sprite(240, 580, 'player').setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
	this.keys = this.input.keyboard.addKeys('W,A,S,D');

    if (this.isMobile) {
      this.input.on('pointerdown', (pointer) => {
        this.isPointerDown = true;
        this.checkPointerDirection(pointer);
      });
      this.input.on('pointermove', (pointer) => {
        if (this.isPointerDown) this.checkPointerDirection(pointer);
      });
      this.input.on('pointerup', () => {
        this.isPointerDown = false;
        this.mobileLeftDown = false;
        this.mobileRightDown = false;
      });
    }

    this.obstacles = this.physics.add.group();
    this.spawnTimer = this.time.delayedCall(this.spawnDelay, this.spawnNextBeat, [], this);

    this.playerObstacleCollider = this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

    this.powerUps = this.physics.add.group();
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerup, null, this);
    this.time.addEvent({ delay: 10000, callback: this.spawnPowerup, callbackScope: this, loop: true });

    // --- NEW: bullets group
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: false
    });
    // overlap bullets with obstacles
    this.physics.add.overlap(this.bullets, this.obstacles, (bullet, obs) => {
      // destroy both
      try { bullet.destroy(); } catch (e) {}
      if (obs && obs.x !== undefined) {
        this.spawnZap(obs.x, obs.y);
      }
      try { obs.destroy(); } catch (e) {}
      // increment score same as when dodging
      this.score += this.isDoubleScore ? 2 : 1;
      this.scoreText.setText('Score: ' + this.score);
      if (this.score === 69) this.sfx.nice.play();
      if (this.score === 200) this.sfx.heating.play();
      if (this.score === 420) this.sfx.bong.play();
      if (this.score === 500) this.sfx.calmdown.play();

      const currentTop = parseInt(localStorage.getItem('topScore') || 0);
      if (this.score > currentTop) {
        this.topScoreText.setText(`Top: ${this.score}`); // just visual
      }

      if (this.score % 20 === 0) {
        this.spawnDelay = Math.max(150, this.spawnDelay * 0.95);
        this.baseSpeed = Math.min(500, this.baseSpeed + 10);
      }
    }, null, this);
    // --- end bullets setup

    this.shieldGlow = null;
    this.shieldGlowFollow = null;
    this.shieldCollider = null;

    this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#00ffcc' });
	const storedTop = localStorage.getItem('topScore') || 0;
this.topScoreText = this.add.text(10, 35, `Top: ${storedTop}`, {
  fontSize: '16px', fill: '#999999'
});

    this.scanlineOverlay = this.add.image(240, 320, 'scanlines').setDepth(10).setAlpha(0.2).setScale(2);

    this.tweens.add({
      targets: this.scanlineOverlay,
      y: '+=2',
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // gun state
    this.gunActive = false;
    this.lastFired = 0;
    this.gunTimer = null;
  }
  //NEW ENEMIES
getEnemyFrame() {
    if (this.score >= 200) {
        // Enemy2 or Enemy3
        const variants = [0, 1, 2, 3, 4, 5]; // all frames
        return Phaser.Utils.Array.GetRandom(variants);
    } else if (this.score >= 100) {
        const variants = [0, 1, 2, 3]; // enemy1 + enemy2
        return Phaser.Utils.Array.GetRandom(variants);
    } else {
        return Phaser.Utils.Array.GetRandom([0, 1]); // only enemy1
    }
}
// NEW ENEMIES END
  fetchTopScores() {
  supabaseClient
    .from('scores')
    .select('player, score')
    .order('score', { ascending: false })
    .limit(10)
    .then(({ data, error }) => {
      if (error) {
        console.error('Leaderboard fetch error:', error);
        return;
      }

      const list = document.getElementById('leaderboardList');
      list.innerHTML = '';

      if (!data || data.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No scores yet.';
        list.appendChild(li);
      } else {
        data.forEach((row, index) => {
          const li = document.createElement('li');
          li.textContent = `${row.player || 'Anonymous'} - ${row.score}`;
          list.appendChild(li);
        });
      }

      document.getElementById('leaderboard').style.display = 'block';
    });
}


  async submitScore(email, playerName) {
  const { data, error } = await supabaseClient
    .from('scores')
    .insert([
      {
        score: this.score,
        email: email || null,
        player: playerName || null,
        submitted_at: new Date()
      }
    ]);

  if (error) {
    console.error('Error submitting score:', error.message);
  } else {
    console.log('✅ Score submitted!');
  }
}




showPowerupText(text, color = '#ffffff') {
  const powerupText = this.add.text(240, 320, text, {
    fontSize: '40px',
    fill: color,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(25);

  this.tweens.add({
    targets: powerupText,
    alpha: { from: 1, to: 0 },
    duration: 1000,
	scale: { from: 1, to: 1.4 },
    ease: 'Power1',
    onComplete: () => powerupText.destroy()
  });
}

  update(time) {
    if (this.gameOver) return;

   if (
  this.cursors.left.isDown ||
  this.keys.A.isDown ||
  this.mobileLeftDown
) {
  this.player.setVelocityX(-200);
} else if (
  this.cursors.right.isDown ||
  this.keys.D.isDown ||
  this.mobileRightDown
) {
  this.player.setVelocityX(200);
} else {
  this.player.setVelocityX(0);
}

// auto-fire while gun active
if (this.gunActive && time > this.lastFired) {
  // spawn a bullet from current player pos
  const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
  if (bullet) {
    bullet.setVelocityY(-400);
    bullet.setDepth(5);
    this.sfx.shoot?.play();
  }
  this.lastFired = time + 200; // 200ms cadence
}

// destroy bullets that go off-screen (cleanup)
this.bullets.children.iterate((b) => {
  if (b && b.y < -50) {
    try { b.destroy(); } catch (e) {}
  }
});

    this.obstacles.children.iterate((child) => {
      if (child && child.y > this.game.config.height) {
        this.spawnZap(child.x, this.game.config.height - 10);
        child.destroy();
        this.score += this.isDoubleScore ? 2 : 1;
        this.scoreText.setText('Score: ' + this.score);
		if (this.score === 69) this.sfx.nice.play();
if (this.score === 200) this.sfx.heating.play();
if (this.score === 420) this.sfx.bong.play();
if (this.score === 500) this.sfx.calmdown.play();

	const currentTop = parseInt(localStorage.getItem('topScore') || 0);
if (this.score > currentTop) {
  this.topScoreText.setText(`Top: ${this.score}`); // just visual
}



        if (this.score % 20 === 0) {
          this.spawnDelay = Math.max(150, this.spawnDelay * 0.95);
          this.baseSpeed = Math.min(500, this.baseSpeed + 10);
        }
      }
    });
  }

  spawnZap(x, y) {
    const zap = this.add.sprite(x, y, 'zap');
    zap.play('zapAnim');
    zap.once('animationcomplete', () => zap.destroy());
  }

  checkPointerDirection(pointer) {
    if (pointer.x < this.player.x) {
      this.mobileLeftDown = true;
      this.mobileRightDown = false;
    } else {
      this.mobileLeftDown = false;
      this.mobileRightDown = true;
    }
  }

  spawnNextBeat() {
    if (this.gameOver) return;

    if (this.score > 0 && this.score % 30 === 0 && !this.patternWave) {
      this.patternWave = true;
      this.runPatternWave();
    } else {
      this.spawnObstacle();
      this.spawnTimer = this.time.delayedCall(this.spawnDelay, this.spawnNextBeat, [], this);
    }
  }
captureAndDownload() {
  // Hide overlays before capture
  this.scanlineOverlay.setVisible(false);
  this.scoreText.setVisible(false);
  this.topScoreText.setVisible(false);

  // Add temporary watermark text
  const watermark = this.add.text(240, 610, `SCORE: ${this.score}  |  STONX - CHECK THE BEAT - OUT NOW`, {
    fontSize: '16px',
    fill: '#ff33cc'
  }).setOrigin(0.5).setDepth(1000);

  // Wait one frame for draw to complete, then capture
  this.time.delayedCall(100, () => {
    this.game.renderer.snapshot((image) => {
      const link = document.createElement('a');
      link.href = image.src;
      link.download = 'stonx_score.png';
      link.click();

      // Restore everything
      watermark.destroy();
      this.scanlineOverlay.setVisible(true);
      this.scoreText.setVisible(true);
      this.topScoreText.setVisible(true);
    });
  });
}

  runPatternWave() {
  const pattern = Phaser.Math.Between(0, 3); // Now includes 0–3
  let sequence = [];
  let delay = Phaser.Math.Between(500, 800); // Default delay

  if (pattern === 0) {
    sequence = [50, 90, 70, 60];
  } else if (pattern === 1) {
    sequence = [400, 420, 360, 390];
  } else if (pattern === 2) {
    sequence = [180, 210, 240, 270];
  } else if (pattern === 3) {
    // 💥 RUSH HOUR pattern
    sequence = [100, 140, 180, 220, 260, 300, 340];
    delay = 100; // Faster spawn for rapid gauntlet
  }

  sequence.forEach((x, i) => {
    this.time.delayedCall(i * delay, () => {
      const obs = this.physics.add.sprite(x, 0, 'enemy');
      this.obstacles.add(obs);
      obs.play('enemyFloat');
      obs.setVelocityY(this.baseSpeed);
      obs.setScale(Phaser.Math.FloatBetween(0.2, 0.5));
      
    });
  });

  this.time.delayedCall(sequence.length * delay + 600, () => {
    this.patternWave = false;
    this.spawnNextBeat();
  });
}


spawnObstacle() {
  const x = Phaser.Math.Between(30, 450);
const frame = this.getEnemyFrame(); // pick frame based on score
  const obs = this.obstacles.create(x, 0, 'enemy', frame);

if (frame < 2) {
    obs.play('enemyFloat');      // Enemy1
} else if (frame < 4) {
    obs.play('enemy2Float');     // Enemy2
} else {
    obs.play('enemy3Float');     // Enemy3
}

  // Set a scale for more reasonable sizes
  const scale = Phaser.Math.FloatBetween(0.1, 0.25);
  obs.setScale(scale);

  // Set downward speed
  obs.setVelocityY(this.baseSpeed);
  const tints = [0xffaaaa, 0xaaffaa, 0xaaaaff, 0xffffaa];
const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
  Phaser.Display.Color.ValueToColor(0xffffff), // base
  Phaser.Display.Color.ValueToColor(Phaser.Utils.Array.GetRandom(tints)),
  100, Phaser.Math.Between(20, 50)
);
obs.setTint(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));
 
}



  spawnPowerup() {
    if (this.gameOver) return;

    const types = ['powerup_small', 'powerup_shield', 'powerup_x2'];
    if (this.score > 150) types.push('powerup_slow'); // only appears after 150
    // --- NEW: include gun powerup (appears at same rate as others)
    types.push('powerup_gun');

    const type = Phaser.Utils.Array.GetRandom(types);

    const x = Phaser.Math.Between(30, 450);
    const powerup = this.powerUps.create(x, 0, type);
    powerup.setData('type', type);
    powerup.setVelocityY(150);
  }

  collectPowerup(player, powerup) {
    const type = powerup.getData('type');
    powerup.destroy();

       // Restore player health on ANY power-up
    if (this.playerHits > 0) {
    this.playerHits = 0;
    this.player.setTexture('player'); // Restore ship appearance

    // Quick flash to indicate healing
    this.player.setTint(0x33ff33); // green flash
    this.time.delayedCall(200, () => {
        this.player.clearTint();
    });
}

    if (type === 'powerup_small' && !this.isSmall) {
		 this.showPowerupText('MINI', '#33ff33');
		 this.sfx.mini.play();
      this.isSmall = true;
      this.player.setScale(0.5);
      this.time.delayedCall(5000, () => {
        this.player.setScale(this.originalScale);
        this.isSmall = false;
      });
    }

    if (type === 'powerup_shield' && !this.isInvincible) {
		this.showPowerupText('SHIELD', '#3399ff');
		this.sfx.shield.play();
      this.isInvincible = true;

      if (this.shieldGlow) this.shieldGlow.destroy();
      if (this.shieldGlowFollow) this.shieldGlowFollow.remove();
      if (this.shieldCollider) this.physics.world.removeCollider(this.shieldCollider);

      this.shieldGlow = this.physics.add.image(this.player.x, this.player.y, 'shieldGlow');
      this.shieldGlow.setScale(1.5);
      this.shieldGlow.setAlpha(0.6);
      this.shieldGlow.setDepth(-1);
      this.shieldGlow.body.setAllowGravity(false);
      this.shieldGlow.body.setImmovable(true);

      this.tweens.add({ targets: this.shieldGlow, alpha: { from: 0.4, to: 0.8 }, duration: 400, yoyo: true, repeat: -1 });

      this.shieldGlowFollow = this.time.addEvent({
        delay: 16,
        callback: () => this.shieldGlow?.setPosition(this.player.x, this.player.y),
        loop: true
      });

      this.physics.world.removeCollider(this.playerObstacleCollider);

      this.shieldCollider = this.physics.add.overlap(this.shieldGlow, this.obstacles, (glow, obs) => {
        this.spawnZap(obs.x, obs.y);
        obs.destroy();
        this.score == this.isDoubleScore ? 2 : 1;
        
      }, null, this);

      this.time.delayedCall(5000, () => {
        this.isInvincible = false;
        this.shieldGlow?.destroy();
        this.shieldGlowFollow?.remove();
        if (this.shieldCollider) this.physics.world.removeCollider(this.shieldCollider);
        this.playerObstacleCollider = this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
      });
    }
if (type === 'powerup_x2' && !this.isDoubleScore) {
	 this.showPowerupText('x2 SCORE', '#ffcc00');
	 this.sfx.x2.play();
  this.isDoubleScore = true;

  // Optional: visual cue like tint
  this.player.setTint(0xffff00);

  // End after 10 seconds
  this.time.delayedCall(10000, () => {
    this.isDoubleScore = false;
    this.player.clearTint();
  });
}

    if (type === 'powerup_slowmo' && !this.isSlowmo) {
		 this.showPowerupText('SLO-MO', '#ccccff');
      this.isSlowmo = true;
      const oldSpeed = this.baseSpeed;
      const oldDelay = this.spawnDelay;
      this.baseSpeed *= 0.5;
      this.spawnDelay *= 1.5;

      this.time.delayedCall(5000, () => {
        this.baseSpeed = oldSpeed;
        this.spawnDelay = oldDelay;
        this.isSlowmo = false;
      });
    }
	if (type === 'powerup_slow') {
		this.showPowerupText('SLO-MO', '#ccccff');
		this.sfx.slowmo.play();
  this.time.timeScale = 0.4;
  this.physics.world.timeScale = 0.4;
  this.music.setRate(0.7); // optional: pitch shift!

  this.cameras.main.flash(250, 200, 200, 255); // visual cue

  this.time.delayedCall(5000, () => {
    this.time.timeScale = 1;
    this.physics.world.timeScale = 1;
    if (this.music) {
  this.music.setRate(1);
}
  });
}

// --- NEW: gun power-up activation
if (type === 'powerup_gun' && !this.gunActive) {
  this.showPowerupText('GUN', '#ffd166');
  this.sfx.powerup.play();
  this.gunActive = true;
  this.player.setTint(0xffd700); // golden tint as visual cue
  this.lastFired = 0;
  if (this.gunTimer) this.gunTimer.remove(false);
  this.gunTimer = this.time.delayedCall(8000, () => { // 8 seconds
    this.gunActive = false;
    this.player.clearTint();
    this.gunTimer = null;
  });
}
// --- end new

  }

  hitObstacle(player, obstacle) {
  if (this.gameOver) return;
  // Update high score if needed
const previousTop = parseInt(localStorage.getItem('topScore') || 0);

// 🪄 Save BEFORE updating
if (this.score > previousTop) {
  localStorage.setItem('topScoreBeforeGameOver', previousTop);
  localStorage.setItem('topScore', this.score);
} else {
  localStorage.setItem('topScoreBeforeGameOver', previousTop);
}

  if (this.isInvincible) {
    this.spawnZap(obstacle.x, obstacle.y);
    obstacle.destroy();
    return;
  }

  this.spawnZap(obstacle.x, obstacle.y);
  obstacle.destroy();
  this.playerHits++;

  // First hit: change to damaged version
  if (this.playerHits === 1) {
    this.player.setTexture('player_damaged');
this.player.setTint(0xffaaaa); // Visual feedback
this.player.setVelocity(0); //  Stop motion
this.player.y = 580;        //  Reset to original Y
this.time.delayedCall(200, () => this.player.clearTint());

    this.time.delayedCall(200, () => this.player.clearTint());
    return;
    
  }
  

  // Game Over
// Game Over sequence
this.spawnTimer.remove(false);
this.gameOver = true;
this.sfx.death.play();
this.music.stop();
this.music.destroy();
this.music = null;

// Disable player input
this.player.setTint(0xff0000);
this.scoreText.setVisible(false);



// Allow the player to fall
this.player.body.setAllowGravity(true);
this.player.setVelocityY(300); // fall down
this.tweens.add({
  targets: this.player,
  alpha: { from: 1, to: 0.3 },
  duration: 600,
  ease: 'Quad.easeOut'
});

// Shake the camera and wait before showing the overlay
this.cameras.main.shake(300, 0.02);

this.time.delayedCall(800, () => {
  this.physics.pause(); // Freeze after fall

  // Overlay
  const overlay = this.add.rectangle(240, 320, 480, 640, 0x000000, 0.6).setDepth(20);

  // GAME OVER title
  this.add.text(240, 50, 'GAME OVER', {
    fontSize: '32px',
    fill: '#ffffff'
  }).setOrigin(0.5).setDepth(21);

  // Score
  this.add.text(240, 80, `SCORE: ${this.score}`, {
    fontSize: '24px',
    fill: '#00ffcc'
  }).setOrigin(0.5).setDepth(22);
  // HIGH SCORE
this.add.text(240, 105, `BEST: ${localStorage.getItem('topScore') || this.score}`, {
  fontSize: '18px',
  fill: '#ffffff'
}).setOrigin(0.5).setDepth(21);


  // EP Art + Text
  this.add.image(240, 270, 'epArt').setDisplaySize(300, 300).setDepth(21);
  this.add.text(240, 440, 'STONX | CHECK THE BEAT', {
    fontSize: '20px',
    fill: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(21);
  this.add.text(240, 465, 'NEW EP OUT NOW', {
    fontSize: '16px',
    fill: '#ff33cc'
  }).setOrigin(0.5).setDepth(21);

  // Buttons
  const listenNowBtn = this.add.text(150, 520, ' LISTEN NOW ', {
    fontSize: '20px',
    fill: '#ffffff',
    backgroundColor: '#ff33cc',
    padding: { x: 12, y: 6 }
  }).setOrigin(0.5).setInteractive().setDepth(21);
  listenNowBtn.on('pointerdown', () => {
    window.open('https://your.link.to/checkthebeat', '_blank');
  });
  const shareBtn = this.add.text(240, 565, ' SAVE SCORECARD ', {
  fontSize: '20px',
  fill: '#ffffff',
  backgroundColor: '#3333ff',
  padding: { x: 12, y: 6 }
}).setOrigin(0.5).setInteractive().setDepth(21);

shareBtn.on('pointerdown', () => {
  this.captureAndDownload();
});


  const restartBtn = this.add.text(330, 520, '  RESTART  ', {
    fontSize: '20px',
    fill: '#003300',
    backgroundColor: '#00ffcc',
    padding: { x: 12, y: 6 }
  }).setOrigin(0.5).setInteractive().setDepth(21);
  restartBtn.on('pointerdown', () => {
    this.scene.start('StartScene');
  });
  const viewBoardBtn = this.add.text(240, 610, ' VIEW LEADERBOARD ', {
  fontSize: '20px',
  fill: '#000000',
  backgroundColor: '#00ffcc',
  padding: { x: 12, y: 6 }
}).setOrigin(0.5).setInteractive().setDepth(21);

viewBoardBtn.on('pointerdown', () => {
  this.fetchTopScores();
});

});
// ✨ Setup DOM interaction AFTER all Phaser game over UI
this.time.delayedCall(200, () => {
  const formDiv = document.getElementById('score-form');
  const nameInput = document.getElementById('playerName');
  const emailInput = document.getElementById('email');
  const finalSendBtn = document.getElementById('finalSendBtn');

  // Disable Phaser input when typing in form
  [nameInput, emailInput].forEach((input) => {
    input.addEventListener('focus', () => {
      this.input.keyboard.enabled = false;
    });
    input.addEventListener('blur', () => {
      this.input.keyboard.enabled = true;
    });
  });

  const topScore = parseInt(localStorage.getItem('topScoreBeforeGameOver') || 0);

  // ✅ Only show form if this is a new high score
  if (this.score > topScore) {
    formDiv.style.display = 'block';
    nameInput.value = '';
    emailInput.value = '';
    nameInput.style.border = 'none';
    finalSendBtn.disabled = false;
    finalSendBtn.innerText = 'Send Score';

    finalSendBtn.onclick = null; // Clear previous handler
    finalSendBtn.onclick = () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      if (!name) {
        nameInput.style.border = '2px solid red';
        return;
      }

      this.submitScore(email, name);
      formDiv.style.display = 'none';
      finalSendBtn.innerText = 'Sent!';
      finalSendBtn.disabled = true;
    };
  }
});












}

}
