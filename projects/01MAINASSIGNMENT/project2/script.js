let vol = 0; 
let customFont;
let colorLow, colorMid, colorHigh;
let frameOverMax = 0;  
let exploded = false;
let frameSinceExplosion = 0;
let particles = [];

function preload() {
  customFont = loadFont('StretchPro.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(customFont);

  colorLow = color(80, 255, 80);
  colorMid = color(255, 200, 80);
  colorHigh = color(255, 50, 50);
  frameRate(60); 
}

function draw() {
  background(20);

  if (!exploded) {
    vol = max(0, vol - 0.003);

    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (vol > 0.80) {
      let intensity = map(vol, 0.80, 1, 0, 1);
      let maxShake = 30;
      let shake = intensity * maxShake;
      shakeOffsetX = random(-shake, shake);
      shakeOffsetY = random(-shake, shake);
    }

    drawPanel(shakeOffsetX, shakeOffsetY);
    drawHorizontalBar(shakeOffsetX, shakeOffsetY);
    drawLabels(shakeOffsetX, shakeOffsetY);

    if (vol > 0.95) {
      frameOverMax++;
      if (frameOverMax >= 60 * 3) { //nach 3 sekunde explodierts (180 frames bi 60fps)
        triggerExplosion();
        frameOverMax = 0;
      }
    } else frameOverMax = 0;

  } else {
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 5;
      fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], p.alpha);
      noStroke();
      ellipse(p.x, p.y, 8);
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    frameSinceExplosion++;
    if (frameSinceExplosion >= 60 * 3) { 
      exploded = false;
      particles = [];
      vol = 0; 
      frameSinceExplosion = 0;
    }
  }
}

function triggerExplosion() {
  exploded = true;
  frameSinceExplosion = 0;

  let barW = width * 0.55;
  let barH = height * 0.06;
  let barX = width / 2;
  let barY = height / 2;

  for (let i = 0; i < 250; i++) { // ahzahl partikel
    particles.push({
      x: barX + random(-barW/2, barW/2),
      y: barY + random(-barH/2, barH/2),
      vx: random(-5, 5),
      vy: random(-5, 5),
      alpha: 255,
      color: color(255)
    });
  }
}

function drawPanel(offsetX = 0, offsetY = 0) {
  rectMode(CENTER);
  noStroke();
  fill(40, 40, 50, 180);
  rect(width / 2 + offsetX, height / 2 + offsetY, width * 0.65, height * 0.3, 20);
}

function drawHorizontalBar(offsetX = 0, offsetY = 0) {
  if (exploded) return;

  let barW = width * 0.55;
  let barH = height * 0.06;
  let barX = width / 2 + offsetX;
  let barY = height / 2 + offsetY;

  rectMode(CENTER);
  fill(70);
  noStroke();
  rect(barX, barY, barW, barH, 10);

  let filledW = vol * barW;

  let hueColor;
  if (vol < 0.5) hueColor = lerpColor(colorLow, colorMid, vol * 2);
  else hueColor = lerpColor(colorMid, colorHigh, (vol - 0.5) * 2);

  fill(hueColor);
  rect(barX - barW/2 + filledW/2, barY, filledW, barH, 10);
}

function drawLabels(offsetX = 0, offsetY = 0) {
  fill(255);
  textAlign(CENTER);

  textSize(24);
  text("Press SPACEBAR to change the volume", width/2 + offsetX, height/2 - height*0.08 + offsetY);

  textSize(16);
  text("Volume: " + floor(vol*100) + "%", width/2 + offsetX, height/2 - height*0.04 + offsetY);
}

function keyPressed() {
  if (!exploded && key === " ") vol = min(1, vol + 0.10);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
