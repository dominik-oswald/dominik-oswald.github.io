<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ausweichender Text</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #1a1a1a;
        }
        canvas {
            display: block;
            cursor: crosshair;
        }
    </style>
</head>
<body>
    <canvas id="myCanvas"></canvas>

    <script>
        const canvas = document.getElementById('myCanvas');
        const ctx = canvas.getContext('2d');
        
        // Canvas-Größe an Fenster anpassen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Maus-Position
        let mouseX = -1000;
        let mouseY = -1000;
        
        // Text-Objekte Array
        const words = [];
        const wordText = "placeholder";
        const fontSize = 20;
        const spacing = 30;
        
        // Canvas mit "placeholder" Wörtern füllen
        function initWords() {
            words.length = 0;
            for (let y = fontSize; y < canvas.height; y += spacing) {
                for (let x = 0; x < canvas.width; x += 100) {
                    words.push({
                        text: wordText,
                        originalX: x,
                        originalY: y,
                        x: x,
                        y: y,
                        vx: 0,
                        vy: 0
                    });
                }
            }
        }
        
        // Mausbewegung tracken
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Maus verlässt Canvas
        canvas.addEventListener('mouseleave', () => {
            mouseX = -1000;
            mouseY = -1000;
        });
        
        // Animation
        function animate() {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = '#00ff00';
            
            words.forEach(word => {
                // Distanz zum Cursor berechnen
                const dx = mouseX - word.x;
                const dy = mouseY - word.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Ausweich-Radius
                const repelRadius = 100;
                
                if (distance < repelRadius && distance > 0) {
                    // Ausweichen vom Cursor
                    const force = (repelRadius - distance) / repelRadius;
                    const angle = Math.atan2(dy, dx);
                    
                    word.vx -= Math.cos(angle) * force * 2;
                    word.vy -= Math.sin(angle) * force * 2;
                } else {
                    // Zurück zur Original-Position
                    const returnDx = word.originalX - word.x;
                    const returnDy = word.originalY - word.y;
                    
                    word.vx += returnDx * 0.05;
                    word.vy += returnDy * 0.05;
                }
                
                // Dämpfung
                word.vx *= 0.9;
                word.vy *= 0.9;
                
                // Position aktualisieren
                word.x += word.vx;
                word.y += word.vy;
                
                // Text zeichnen
                ctx.fillText(word.text, word.x, word.y);
            });
            
            requestAnimationFrame(animate);
        }
        
        // Fenster-Resize Handler
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initWords();
        });
        
        // Initialisierung
        initWords();
        animate();
    </script>
</body>
</html>