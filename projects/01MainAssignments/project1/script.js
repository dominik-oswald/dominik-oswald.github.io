<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Canvas: Wörter weichen aus</title>
  <style>
    html,body { height:100%; margin:0; background:#111; }
    canvas { display:block; width:100%; height:100vh; }
    /* kleine UI-Hilfe */
    .hint {
      position: fixed;
      left: 12px; top: 12px;
      color: #ddd; font-family: Inter, Roboto, sans-serif;
      background: rgba(0,0,0,0.35); padding:8px 10px; border-radius:8px;
      font-size:13px;
    }
  </style>
</head>
<body>
  <div class="hint">Bewege die Maus über das Canvas — die Wörter weichen aus.</div>
  <canvas id="c"></canvas>

  <script>
  (function () {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');

    // HiDPI / devicePixelRatio Setup
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // make drawing in CSS pixels
      layoutGrid();
    }
    window.addEventListener('resize', resize);

    // Konfiguration
    const WORD = 'placeholder';
    const FONT_SIZE = 20; // in px (CSS pixels)
    const GAP_X = 24;     // Abstand horizontal
    const GAP_Y = 36;     // Abstand vertikal
    const PUSH_RADIUS = 110; // Radius in px, innerhalb dessen Wörter ausgewichen werden
    const MAX_PUSH = 40;     // maximale Verschiebung in px
    const RETURN_SPEED = 0.12; // wie schnell die Wörter zurückgehen (0..1)
    const FRICTION = 0.85; // für kleine Nachbewegung / smoothing

    // Dynamische Datenstruktur für jedes Wort
    let words = []; // {x0,y0, x,y, vx,vy, textWidth}
    let cols = 0, rows = 0;

    // Maus / pointer state
    let pointer = { x: -9999, y: -9999, active: false };

    // Initial layout: fülle words mit Positionen in einem Raster
    function layoutGrid() {
      words.length = 0;
      // Canvas size in CSS pixels
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      // set font to measure
      ctx.font = `${FONT_SIZE}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // compute number of columns/rows based on gap
      cols = Math.max(1, Math.floor(W / GAP_X));
      rows = Math.max(1, Math.floor(H / GAP_Y));

      // center the grid
      const extraX = (W - (cols - 1) * GAP_X) / 2;
      const extraY = (H - (rows - 1) * GAP_Y) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x0 = Math.round(extraX + c * GAP_X);
          const y0 = Math.round(extraY + r * GAP_Y);
          const metrics = ctx.measureText(WORD);
          const textWidth = metrics.width;
          words.push({
            x0, y0,            // origin position
            x: x0, y: y0,      // current position (animated)
            vx: 0, vy: 0,      // velocity for smoothing
            textWidth
          });
        }
      }
    }

    // Mouse / pointer handlers
    function onPointerMove(e) {
      pointer.active = true;
      const rect = canvas.getBoundingClientRect();
      // support both mouse and touch pointer events
      const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.active = false;
      // send pointer far away so words return
      pointer.x = -9999; pointer.y = -9999;
    }

    canvas.addEventListener('mousemove', onPointerMove, {passive:true});
    canvas.addEventListener('touchmove', onPointerMove, {passive:true});
    canvas.addEventListener('mouseout', onPointerLeave);
    canvas.addEventListener('touchend', onPointerLeave);
    canvas.addEventListener('touchcancel', onPointerLeave);

    // Main animation loop
    function step() {
      updatePhysics();
      render();
      requestAnimationFrame(step);
    }

    function updatePhysics() {
      for (let i = 0; i < words.length; i++) {
        const w = words[i];

        // vector from pointer to the word origin
        const dx = w.x0 - pointer.x;
        const dy = w.y0 - pointer.y;
        const dist = Math.hypot(dx, dy);

        // compute push amount (if pointer is near origin)
        let pushX = 0, pushY = 0;
        if (pointer.active && dist < PUSH_RADIUS) {
          // normalized away vector from pointer toward the word
          const strength = (1 - dist / PUSH_RADIUS); // 0..1 stronger when closer
          const pushMag = strength * MAX_PUSH;
          // avoid division by zero
          const ndx = dx === 0 && dy === 0 ? (Math.random() * 0.01 + 0.01) : dx;
          const ndy = dy === 0 && dx === 0 ? (Math.random() * 0.01 + 0.01) : dy;
          const nd = Math.hypot(ndx, ndy);
          pushX = (ndx / nd) * pushMag;
          pushY = (ndy / nd) * pushMag;
        }

        // target position is origin + push
        const tx = w.x0 + pushX;
        const ty = w.y0 + pushY;

        // simple spring / damping toward target
        const ax = (tx - w.x) * 0.18; // acceleration proportional to distance
        const ay = (ty - w.y) * 0.18;
        w.vx += ax;
        w.vy += ay;

        // friction
        w.vx *= FRICTION;
        w.vy *= FRICTION;

        // integrate
        w.x += w.vx;
        w.y += w.vy;

        // tiny correction: slowly nudge exactly to origin when pointer is far
        if (!pointer.active) {
          // softly lerp back toward origin to remove tiny residuals
          w.x += (w.x0 - w.x) * RETURN_SPEED;
          w.y += (w.y0 - w.y) * RETURN_SPEED;
        }
      }
    }

    function render() {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      // clear
      ctx.clearRect(0, 0, W, H);
      // draw background subtle
      // ctx.fillStyle = '#0b0b0b';
      // ctx.fillRect(0,0,W,H);

      // draw each word
      ctx.font = `${FONT_SIZE}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      for (let i = 0; i < words.length; i++) {
        const w = words[i];

        // color + subtle depth effect based on vertical coordinate
        // create a slight color shift - keeps contrast on dark bg
        const shade = Math.floor(220 - (w.y / H) * 60);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;

        // optional: scale the word slightly when it's pushed
        const dx = w.x - w.x0;
        const dy = w.y - w.y0;
        const disp = Math.hypot(dx, dy);
        const scale = 1 + Math.min(0.18, disp / 300);

        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.scale(scale, scale);
        ctx.fillText(WORD, 0, 0);
        ctx.restore();
      }

      // optional: draw pointer influence circle for debugging (comment out to hide)
      // if (pointer.active) {
      //   ctx.beginPath();
      //   ctx.lineWidth = 1;
      //   ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      //   ctx.arc(pointer.x, pointer.y, PUSH_RADIUS, 0, Math.PI*2);
      //   ctx.stroke();
      // }
    }

    // initial setup
    resize();
    requestAnimationFrame(step);

    // ensure layoutGrid runs after font ready in some environments
    window.requestAnimationFrame(layoutGrid);
  })();
  </script>
</body>
</html>
