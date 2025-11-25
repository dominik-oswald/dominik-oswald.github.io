let words = [];
const textWord = "ZHdK";
const spacingX = 100;
const spacingY = 40;
const repel = 200; // radius wo sichs weg bewegt

let myFont; 

function preload() {
  myFont = loadFont('StretchPro.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(24);        
  textFont(myFont);    
  fill(random(255), random(255), random(255));           
  initWords();
  frameRate(240);       
}

function windowResized() {
  initWords();
}

function initWords() {
  words = [];
  for (let y = 40; y < height; y += spacingY) {
    for (let x = 20; x < width; x += spacingX) {
      words.push({ x: x, y: y, ox: x, oy: y });
    }
  }
}

function draw() {
	background(0);
  
	for (let w of words) {
	  // movement logic
	  let dx = mouseX - w.x;
	  let dy = mouseY - w.y;
	  let dist = sqrt(dx * dx + dy * dy);
  
	  if (dist < repel) {
		let angle = atan2(dy, dx);
		let force = (repel - dist) / repel;
		w.x -= cos(angle) * force * 10;
		w.y -= sin(angle) * force * 10;
	  } else {
		w.x += (w.ox - w.x) * 0.01;
		w.y += (w.oy - w.y) * 0.01;
	  }
  
	  let r = map(w.x, 0, width, 50, 255);
	  let g = map(w.y, 0, height, 50, 200);
	  let b = map(dist, 0, height, 200, 50);
	  fill(r, g, b);
  
	  text(textWord, w.x, w.y);
	}
  }
  
