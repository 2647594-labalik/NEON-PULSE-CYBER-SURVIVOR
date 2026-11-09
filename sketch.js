// ============================================================
// NEON PULSE: CYBER SURVIVOR (p5.js Arcade Action)
// Created by Gemini Notebook
// ============================================================

let player;
let enemies = [];
let bullets = [];
let particles = [];
let xpGems = [];
let floatingTexts = [];

let score = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 50;
let gameTime = 0;
let gameState = 'START'; // 'START', 'PLAY', 'LEVELUP', 'GAMEOVER'

// Upgrades & Weapon Stats
let weaponLevel = 1;
let attackCooldown = 0;
let fireRate = 12; // Frames between shots
let bulletDamage = 25;
let multishot = 1;
let dashCooldown = 0;

// Screen Shake Effect
let shakeTime = 0;
let shakeAmount = 0;

// Upgrade Options for Level Up Screen
let upgradeOptions = [];

function setup() {
  createCanvas(800, 600);
  textFont('Courier New');
  resetGame();
}

function resetGame() {
  player = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    speed: 4.5,
    radius: 16,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    angle: 0
  };

  enemies = [];
  bullets = [];
  particles = [];
  xpGems = [];
  floatingTexts = [];

  score = 0;
  level = 1;
  xp = 0;
  xpToNextLevel = 50;
  gameTime = 0;
  weaponLevel = 1;
  fireRate = 12;
  bulletDamage = 25;
  multishot = 1;
  dashCooldown = 0;
  shakeTime = 0;
}

function draw() {
  // Screen Shake Camera Translation
  push();
  if (shakeTime > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeTime--;
  }

  // Cyber Background Grid
  background(10, 10, 20);
  drawCyberGrid();

  if (gameState === 'START') {
    drawStartScreen();
  } else if (gameState === 'PLAY') {
    updateGameLogic();
    drawEntities();
    drawHUD();
  } else if (gameState === 'LEVELUP') {
    drawEntities();
    drawLevelUpScreen();
  } else if (gameState === 'GAMEOVER') {
    drawGameOverScreen();
  }

  pop();
}

// --- CYBERPUNK GRID BACKGROUND ---
function drawCyberGrid() {
  stroke(30, 40, 70);
  strokeWeight(1);
  let gridSize = 40;
  let offsetX = (frameCount * 0.5) % gridSize;
  let offsetY = (frameCount * 0.5) % gridSize;

  for (let x = -gridSize; x < width + gridSize; x += gridSize) {
    line(x - offsetX, 0, x - offsetX, height);
  }
  for (let y = -gridSize; y < height + gridSize; y += gridSize) {
    line(0, y + offsetY, width, y + offsetY);
  }

  // Outer Neon Boundary Glow
  noFill();
  stroke(0, 255, 200, 100);
  strokeWeight(4);
  rect(4, 4, width - 8, height - 8, 8);
}

// --- MAIN GAME LOGIC ---
function updateGameLogic() {
  gameTime++;
  if (attackCooldown > 0) attackCooldown--;
  if (dashCooldown > 0) dashCooldown--;

  // Regenerate Shield slowly
  if (frameCount % 90 === 0 && player.shield < player.maxShield) {
    player.shield = min(player.shield + 5, player.maxShield);
  }

  // Player Movement
  let dx = 0;
  let dy = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) dx -= 1; // A
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) dx += 1; // D
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) dy -= 1;   // W
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) dy += 1; // S

  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }

  player.x += dx * player.speed;
  player.y += dy * player.speed;

  player.x = constrain(player.x, 20, width - 20);
  player.y = constrain(player.y, 20, height - 20);

  // Rotate towards mouse
  player.angle = atan2(mouseY - player.y, mouseX - player.x);

  // Auto/Manual Shooting
  if (mouseIsPressed && attackCooldown <= 0) {
    fireWeapons();
    attackCooldown = fireRate;
  }

  // Spawn Enemies over time
  let spawnRate = max(20, 90 - floor(gameTime / 120));
  if (frameCount % spawnRate === 0) {
    spawnEnemy();
  }

  // Update Entities
  updateBullets();
  updateEnemies();
  updateXPGems();
  updateParticles();
  updateFloatingTexts();
}

// --- WEAPON SYSTEM ---
function fireWeapons() {
  let spread = 0.15;
  let startAngle = player.angle - ((multishot - 1) * spread) / 2;

  for (let i = 0; i < multishot; i++) {
    let bulletAngle = startAngle + i * spread;
    bullets.push({
      x: player.x + cos(bulletAngle) * 18,
      y: player.y + sin(bulletAngle) * 18,
      vx: cos(bulletAngle) * 12,
      vy: sin(bulletAngle) * 12,
      damage: bulletDamage,
      life: 60,
      color: color(0, 255, 230)
    });
  }

  // Muzzle Flash Particle
  for (let k = 0; k < 4; k++) {
    particles.push({
      x: player.x + cos(player.angle) * 20,
      y: player.y + sin(player.angle) * 20,
      vx: cos(player.angle + random(-0.4, 0.4)) * random(2, 5),
      vy: sin(player.angle + random(-0.4, 0.4)) * random(2, 5),
      size: random(3, 6),
      color: color(0, 255, 255),
      life: 15
    });
  }
}

// --- ENEMIES SYSTEM ---
function spawnEnemy() {
  let side = floor(random(4));
  let ex, ey;

  if (side === 0) { ex = random(width); ey = -20; }
  else if (side === 1) { ex = width + 20; ey = random(height); }
  else if (side === 2) { ex = random(width); ey = height + 20; }
  else { ex = -20; ey = random(height); }

  let r = random();
  let type = 'SEEKER';
  let hp = 30 + floor(gameTime / 180) * 10;
  let spd = random(2.0, 3.2);
  let col = color(255, 0, 110); // Neon Pink
  let radius = 14;

  if (r > 0.75) {
    type = 'TANK';
    hp *= 2.5;
    spd *= 0.55;
    col = color(170, 0, 255); // Neon Purple
    radius = 22;
  } else if (r > 0.55) {
    type = 'SPEEDER';
    hp *= 0.6;
    spd *= 1.5;
    col = color(255, 230, 0); // Neon Gold
    radius = 10;
  }

  enemies.push({
    x: ex,
    y: ey,
    vx: 0,
    vy: 0,
    speed: spd,
    hp: hp,
    maxHp: hp,
    radius: radius,
    color: col,
    type: type
  });
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];

    // Move toward player
    let angle = atan2(player.y - e.y, player.x - e.x);
    e.x += cos(angle) * e.speed;
    e.y += sin(angle) * e.speed;

    // Check collision with player
    let d = dist(e.x, e.y, player.x, player.y);
    if (d < e.radius + player.radius) {
      let dmg = 15;
      if (player.shield > 0) {
        player.shield = max(0, player.shield - dmg);
      } else {
        player.hp -= dmg;
      }

      addScreenShake(6, 10);
      spawnExplosion(player.x, player.y, color(255, 50, 50), 10);
      enemies.splice(i, 1);

      if (player.hp <= 0) {
        gameState = 'GAMEOVER';
      }
      continue;
    }
  }
}

// --- BULLETS SYSTEM ---
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    // Bullet hit enemy check
    for (let j = enemies.length - 1; j >= 0; j--) {
      let e = enemies[j];
      let d = dist(b.x, b.y, e.x, e.y);

      if (d < e.radius + 6) {
        e.hp -= b.damage;

        // Floating Damage Number
        floatingTexts.push({
          x: e.x + random(-10, 10),
          y: e.y - 10,
          text: "-" + b.damage,
          color: color(255, 255, 100),
          life: 30
        });

        // Hit Spark Particles
        for (let k = 0; k < 3; k++) {
          particles.push({
            x: b.x,
            y: b.y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            size: random(2, 5),
            color: b.color,
            life: 20
          });
        }

        bullets.splice(i, 1);

        // Enemy Defeated
        if (e.hp <= 0) {
          spawnExplosion(e.x, e.y, e.color, 16);
          score += (e.type === 'TANK' ? 50 : (e.type === 'SPEEDER' ? 30 : 20));

          // Drop XP Gem
          xpGems.push({
            x: e.x,
            y: e.y,
            val: (e.type === 'TANK' ? 25 : 10)
          });

          enemies.splice(j, 1);
        }
        break;
      }
    }

    if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }
}

// --- XP GEMS & LEVEL UP ---
function updateXPGems() {
  for (let i = xpGems.length - 1; i >= 0; i--) {
    let g = xpGems[i];
    let d = dist(player.x, player.y, g.x, g.y);

    // Magnetic pull when close
    if (d < 120) {
      let angle = atan2(player.y - g.y, player.x - g.x);
      g.x += cos(angle) * 7;
      g.y += sin(angle) * 7;
    }

    if (d < player.radius + 8) {
      xp += g.val;
      floatingTexts.push({
        x: player.x,
        y: player.y - 20,
        text: "+" + g.val + " XP",
        color: color(0, 255, 150),
        life: 25
      });

      xpGems.splice(i, 1);

      // Level Up Check
      if (xp >= xpToNextLevel) {
        levelUp();
      }
    }
  }
}

function levelUp() {
  level++;
  xp -= xpToNextLevel;
  xpToNextLevel = floor(xpToNextLevel * 1.4);

  // Generate 3 Upgrade Choices
  upgradeOptions = [
    { title: "MULTISHOT +1", desc: "Fires an extra plasma bolt per shot", action: () => { multishot++; } },
    { title: "FIRE RATE UP", desc: "Attacks 25% faster", action: () => { fireRate = max(4, floor(fireRate * 0.75)); } },
    { title: "DAMAGE BOOST", desc: "+15 Plasma Damage per bolt", action: () => { bulletDamage += 15; } },
    { title: "SHIELD OVERCHARGE", desc: "Restores HP & increases Max Shield", action: () => { player.maxShield += 25; player.shield = player.maxShield; player.hp = player.maxHp; } },
    { title: "OVERCLOCK SPEED", desc: "+20% Movement Speed", action: () => { player.speed += 0.9; } }
  ];

  // Shuffle and pick 3 random options
  upgradeOptions.sort(() => random() - 0.5);
  upgradeOptions = upgradeOptions.slice(0, 3);

  gameState = 'LEVELUP';
}

// --- PARTICLES & SCREEN SHAKE ---
function spawnExplosion(x, y, col, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-4, 4),
      vy: random(-4, 4),
      size: random(3, 8),
      color: col,
      life: random(20, 40)
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let t = floatingTexts[i];
    t.y -= 0.8;
    t.life--;
    if (t.life <= 0) floatingTexts.splice(i, 1);
  }
}

function addScreenShake(amount, time) {
  shakeAmount = amount;
  shakeTime = time;
}

// --- RENDERING ENTITIES ---
function drawEntities() {
  // 1. XP Gems
  for (let g of xpGems) {
    push();
    translate(g.x, g.y);
    rotate(frameCount * 0.08);
    fill(0, 255, 180);
    stroke(255);
    strokeWeight(1);
    rect(-4, -4, 8, 8);
    pop();
  }

  // 2. Bullets
  for (let b of bullets) {
    fill(b.color);
    noStroke();
    ellipse(b.x, b.y, 8, 8);
    fill(255);
    ellipse(b.x, b.y, 4, 4);
  }

  // 3. Enemies
  for (let e of enemies) {
    push();
    translate(e.x, e.y);
    fill(e.color);
    stroke(255, 255, 255, 180);
    strokeWeight(2);

    if (e.type === 'TANK') {
      rect(-e.radius, -e.radius, e.radius * 2, e.radius * 2, 6);
    } else if (e.type === 'SPEEDER') {
      triangle(0, -e.radius, -e.radius, e.radius, e.radius, e.radius);
    } else {
      ellipse(0, 0, e.radius * 2, e.radius * 2);
    }

    // Health Bar
    if (e.hp < e.maxHp) {
      fill(50);
      noStroke();
      rect(-e.radius, -e.radius - 8, e.radius * 2, 4);
      fill(255, 0, 80);
      rect(-e.radius, -e.radius - 8, map(e.hp, 0, e.maxHp, 0, e.radius * 2), 4);
    }
    pop();
  }

  // 4. Particles
  for (let p of particles) {
    fill(red(p.color), green(p.color), blue(p.color), map(p.life, 0, 40, 0, 255));
    noStroke();
    ellipse(p.x, p.y, p.size);
  }

  // 5. Floating Damage/XP Texts
  for (let t of floatingTexts) {
    fill(t.color);
    textSize(12);
    textAlign(CENTER, CENTER);
    text(t.text, t.x, t.y);
  }

  // 6. Player Character
  push();
  translate(player.x, player.y);
  rotate(player.angle);

  // Outer Neon Shield Ring
  if (player.shield > 0) {
    noFill();
    stroke(0, 180, 255, map(player.shield, 0, player.maxShield, 80, 220));
    strokeWeight(3);
    ellipse(0, 0, player.radius * 2.8, player.radius * 2.8);
  }

  // Cyber Suit Body
  fill(0, 255, 230);
  stroke(10, 20, 40);
  strokeWeight(2);
  ellipse(0, 0, player.radius * 2, player.radius * 2);

  // Core Visor
  fill(255, 255, 255);
  ellipse(6, 0, 8, 8);

  // Dual Plasma Cannon Barrels
  fill(40, 50, 70);
  rect(10, -7, 10, 4, 1);
  rect(10, 3, 10, 4, 1);
  pop();
}

// --- HUD & SCREENS ---
function drawHUD() {
  push();
  // Health & Shield Bars
  fill(20, 25, 40, 200);
  stroke(0, 255, 200);
  strokeWeight(2);
  rect(15, 15, 220, 70, 6);

  noStroke();
  // HP Bar
  fill(255, 20);
  rect(25, 28, 200, 12, 3);
  fill(255, 50, 80);
  rect(25, 28, map(max(0, player.hp), 0, player.maxHp, 0, 200), 12, 3);
  fill(255);
  textSize(10);
  textAlign(LEFT, CENTER);
  text("HP: " + player.hp + "/" + player.maxHp, 30, 34);

  // Shield Bar
  fill(255, 20);
  rect(25, 48, 200, 12, 3);
  fill(0, 180, 255);
  rect(25, 48, map(max(0, player.shield), 0, player.maxShield, 0, 200), 12, 3);
  fill(255);
  text("SHIELD: " + player.shield + "/" + player.maxShield, 30, 54);

  // Score & XP Bar (Top Right)
  fill(20, 25, 40, 200);
  stroke(0, 255, 200);
  strokeWeight(2);
  rect(width - 235, 15, 220, 70, 6);

  noStroke();
  fill(255, 215, 0);
  textSize(16);
  textAlign(RIGHT, TOP);
  text("SCORE: " + score, width - 25, 25);
  fill(0, 255, 150);
  textSize(12);
  text("LEVEL " + level, width - 25, 48);

  // XP Progress Bar
  fill(255, 20);
  rect(width - 225, 65, 200, 8, 2);
  fill(0, 255, 150);
  rect(width - 225, 65, map(xp, 0, xpToNextLevel, 0, 200), 8, 2);

  // Dash Ability Indicator
  fill(255, 200);
  textSize(11);
  textAlign(LEFT, BOTTOM);
  text("[SPACE] Dash Boost  |  [HOLD CLICK] Auto Fire", 20, height - 15);
  pop();
}

function drawStartScreen() {
  fill(0, 0, 0, 210);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(0, 255, 230);
  textSize(38);
  text("NEON PULSE: CYBER SURVIVOR", width / 2, 140);

  fill(200, 220, 255);
  textSize(15);
  text("Battle through endless synthwave swarms, absorb energy gems,\nand upgrade your cyber-mech to survive!", width / 2, 220);

  fill(255, 215, 0);
  textSize(14);
  text("WASD: Move  |  MOUSE: Aim & Fire  |  SPACE: Emergency Dash", width / 2, 290);

  fill(0, 255, 150);
  textSize(20);
  text("[ CLICK ANYWHERE TO INITIATE ]", width / 2, 380);
}

function drawLevelUpScreen() {
  fill(0, 0, 0, 215);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(0, 255, 150);
  textSize(34);
  text("⚡ SYSTEM OVERCLOCK LEVEL " + level + " ⚡", width / 2, 80);
  fill(220);
  textSize(14);
  text("Choose 1 Cyber Enhancement to Install:", width / 2, 120);

  for (let i = 0; i < upgradeOptions.length; i++) {
    let opt = upgradeOptions[i];
    let cardY = 170 + i * 110;

    // Card background
    let isHover = mouseY > cardY && mouseY < cardY + 90 && mouseX > width / 2 - 220 && mouseX < width / 2 + 220;
    fill(isHover ? color(30, 60, 90) : color(15, 25, 45));
    stroke(isHover ? color(0, 255, 230) : color(0, 180, 150));
    strokeWeight(2);
    rect(width / 2 - 220, cardY, 440, 90, 8);

    noStroke();
    fill(255, 215, 0);
    textSize(18);
    textAlign(LEFT, TOP);
    text((i + 1) + ". " + opt.title, width / 2 - 200, cardY + 18);

    fill(200);
    textSize(13);
    text(opt.desc, width / 2 - 200, cardY + 48);
  }
}

function drawGameOverScreen() {
  fill(0, 0, 0, 230);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255, 0, 80);
  textSize(44);
  text("SYSTEM CRITICAL: OVERLOAD", width / 2, 140);

  fill(255);
  textSize(22);
  text("Final Score: " + score, width / 2, 220);
  textSize(16);
  text("Sector Level Reached: " + level, width / 2, 260);

  fill(0, 255, 150);
  textSize(18);
  text("[ CLICK TO REBOOT SYSTEM ]", width / 2, 350);
}

// --- INPUT HANDLERS ---
function mousePressed() {
  if (gameState === 'START' || gameState === 'GAMEOVER') {
    resetGame();
    gameState = 'PLAY';
    return;
  }

  if (gameState === 'LEVELUP') {
    for (let i = 0; i < upgradeOptions.length; i++) {
      let cardY = 170 + i * 110;
      if (mouseY > cardY && mouseY < cardY + 90 && mouseX > width / 2 - 220 && mouseX < width / 2 + 220) {
        upgradeOptions[i].action();
        gameState = 'PLAY';
        break;
      }
    }
  }
}

function keyPressed() {
  // SPACEBAR Dash Boost
  if (key === ' ' && gameState === 'PLAY' && dashCooldown <= 0) {
    let angle = player.angle;
    player.x += cos(angle) * 90;
    player.y += sin(angle) * 90;
    player.x = constrain(player.x, 20, width - 20);
    player.y = constrain(player.y, 20, height - 20);
    dashCooldown = 60; // 1 second cooldown

    spawnExplosion(player.x, player.y, color(0, 255, 255), 12);
    addScreenShake(4, 6);
  }
}