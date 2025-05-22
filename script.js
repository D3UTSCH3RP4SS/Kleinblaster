        // Game Constants
        const PLAYER_SPEED = 3;
        let ENEMY_ROWS = 2;
        let ENEMY_COLS = 5;
        const POWERUP_CHANCE = 0.2; // 0.1 = 10% chance when enemy dies
        const EPICPOWER_CHANCE = 1;

        // Start Screen Setup
        function setupStartScreen() {
            document.getElementById('startBtn').addEventListener('click', () => {
                document.getElementById('startScreen').style.display = 'none';
                document.getElementById('gameScreen').style.display = 'block';
                init();
    });
}

// Modify the window.onload to use the start screen
window.onload = setupStartScreen;

        // Game State
        const game = {
            canvas: null,
            ctx: null,
            score: 0,
            lives: 3,
            level: 1,
            gameOver: false,
            player: {
                x: 0,
                y: 0,
                width: 32,
                height: 32,
                speed: PLAYER_SPEED,
                isMovingLeft: false,
                isMovingRight: false,
                powerUp: null,
                powerUpTimer: 0,
                epicUp: null,
                epicUpTimer: 0,
                damage: 1,
                isShooting: false, //-- Macht möglich während des Bewegens gedrückt zu halten um zu schießen
                shootCooldown: 0
            },
            bullets: [],
            enemyBullets: [],
            enemies: [],
            powerUps: [],
            epicUps: [],
            lastShotTime: 0,
            enemyDirection: 1,
            enemySpeed: 1,
            enemyMoveDown: false,
            frames: 0
        };

        // Power-Up Types
        const POWERUP_TYPES = {
            RAPID_FIRE: { 
                name: "Rapid Fire", 
                color: "#00FFFF", 
                duration: 300,
                effect: (player) => { player.fireRate = 10; }
            },
            SHIELD: { 
                name: "Shield", 
                color: "#3366FF", 
                duration: 450,
                effect: (player) => { player.hasShield = true; }
            },
            LASER: { 
                name: "Laser", 
                color: "#FF00FF", 
                duration: 250,
                effect: (player) => { player.laserActive = true; }
            },
            CANON: {
                name: "Canon",
                color: "#8900ae",
                duration: 200,
                effect: (player) => { player.canonActive = true; }
            },
            EXTRALIVE: {
                name: "Live",
                color: "red",
                duration: 50,
                effect: () => { game.lives++ && updateUI()}
            }
                

        };
        
        const EPICUP_TYPES = {
            NUKE: {
                name: "Nuke",
                color: "#e4f148",
                duration: 10,
                effect: () => { game.enemies = []}
            },

            ALLTHEUPS: {
                name: "AllTheUps",
                color: "#f2860c",
                duration: 500,
                effect: (player) => { player.canonActive = true; player.laserActive = true; player.hasShield = true; player.fireRate = 10;}
            }
        };

        // Initialize Game
        function init() {
            game.canvas = document.getElementById('gameCanvas');
            game.ctx = game.canvas.getContext('2d');
            
            // Set player initial position
            game.player.x = game.canvas.width / 2 - game.player.width / 2;
            game.player.y = game.canvas.height - game.player.height - 20;
            
            // Setup controls
            setupControls();
            
            // Setup restart button
            document.getElementById('restartBtn').addEventListener('click', resetGame);
            
            // Start first level
            startLevel();
            
            // Start game loop
            requestAnimationFrame(gameLoop);


            //Bild laden für Spieler
            game.player.image = new Image();
            game.player.image.src = 'Pictures/Player.png';

            //Bild laden für Gegner
            game.enemyImages = [
                'Pictures/Enemy.png',
                'Pictures/Enemy.png',
                'Pictures/Enemy.png',
            ].map(src =>{
                const img = new Image();
                img.src = src;
                return img;
            });

            //Laden der Kugeln vom Spieler (um sie mir irgendwann zu geben x.x(war nur Spaß))
            game.bulletImage = new Image();
            game.bulletImage.src = 'Pictures/playerShot.png';

            //Laden der Kugeln vom Gegner (um sie auf mich zu ballern yipieeeeeeeeeeeeee (Coden macht so viel Spaß))
            game.enemyBulletImage = new Image();
            game.enemyBulletImage.src = 'Pictures/Enemy.png';

        }

        // Setup Controls
        function setupControls() {
        document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') game.player.isMovingLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd') game.player.isMovingRight = true;
        if (e.key === ' ') game.player.isShooting = true; //Schießen bei gedrückter Leertaste
        });   
    
        document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') game.player.isMovingLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd') game.player.isMovingRight = false;
        if (e.key === ' ') game.player.isShooting = false; //Stoppe Schießen
        });
        }

        // Start Level
        function startLevel() {
            // Clear existing enemies
            game.enemies = [];
            
            // Create enemy formation
            const enemyWidth = 40;
            const enemyHeight = 30;
            const spacing = 50;
            const startX = (game.canvas.width - (ENEMY_COLS * spacing)) / 2;
            
            for (let row = 0; row < ENEMY_ROWS; row++) {
                for (let col = 0; col < ENEMY_COLS; col++) {
                    game.enemies.push({
                        x: startX + col * spacing,
                        y: 50 + row * spacing,
                        width: enemyWidth,
                        height: enemyHeight,
                        color: getEnemyColor(row),
                        health: Math.floor(1 + (game.level/3)), //Enemy health
                        shootCooldown: Math.floor(Math.random() * 100)
                    });
                }
            } 

    
            
            // Increase enemy speed slightly each level
            if(game.enemySpeed < 1){
            game.enemySpeed = 0.5 + (game.level * 0.1);
            }
            
            // Update UI
            updateUI();
        }

        function updateRows(){
            
            ENEMY_ROWS = 2 + Math.random() * game.level;
            
            if(ENEMY_ROWS > 6){
                ENEMY_ROWS = 2 + Math.random() * game.lives;
            }
        }

        function getEnemyColor(row) {
            const colors = ['#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#00CCFF'];
            return colors[row % colors.length];
        }

        // Game Loop
        function gameLoop() {
            if (game.gameOver) return;
            
            game.frames++;
            
            // Clear canvas
            game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
            
            // Update game state
            updatePlayer();
            updateBullets();
            updateEnemies();
            updatePowerUps();
            updateEpicUps();
            checkCollisions();
            updateRows();
            caplives();
            
            // Draw everything
            drawPlayer();
            drawBullets();
            drawEnemies();
            drawPowerUps();
            drawEpicUps();
            drawUI();
            
            // Check for level completion
            if (game.enemies.length === 0) {
                game.level++;
                game.lives++;
                startLevel();
            }
            

            //Ab Level 5 mehr Leben für Gegner
            
            
            requestAnimationFrame(gameLoop);
        }

        // Update Player
        function updatePlayer() {
            // Movement
            if (game.player.isMovingLeft && game.player.x > 0) {
                game.player.x -= game.player.speed;
            }
            if (game.player.isMovingRight && game.player.x < game.canvas.width - game.player.width) {
                game.player.x += game.player.speed;
            }
            
            // Update power-up timer
            if (game.player.powerUp) {
                game.player.powerUpTimer--;
                if (game.player.powerUpTimer <= 0) {
                    resetPowerUp();
                }
            }

            // Update epic-up timer
            if (game.player.epicUp) {
                game.player.epicUpTimer--;
                if (game.player.epicUpTimer <= 0) {
                    resetEpicUp();
                }
            }
            // Update Player damage
            if (game.player.powerUp?.name === "Canon") {
                game.player.damage = 5;
            }else{
                game.player.damage = 1;
            }

            if (game.player.isShooting) {
                shoot();
            }

        }

        //caps lives at 5
        function caplives() {
            if(game.lives > 5){
                game.lives = 5;
                updateUI();
            }
        }

        // Shoot Bullet
        function shoot() {
            const now = Date.now();
            const fireRate = game.player.powerUp?.name === "Rapid Fire" ? 100 : 300;

            if (now - game.lastShotTime > fireRate) {
                if (game.player.powerUp?.name === "Laser") {
                    game.bullets.push(createBullet(game.player.x + 5));
                    game.bullets.push(createBullet(game.player.x + game.player.width / 2 - 2));
                    game.bullets.push(createBullet(game.player.x + game.player.width - 9));
                } else {
                    game.bullets.push(createBullet(game.player.x + game.player.width / 2 - 2));
                }
                game.lastShotTime = now;
            }
        }

        function createBullet(x) {
            return {
                x: x,
                y: game.player.y,
                width: 8,  // An Bildgröße anpassen
                height: 16, // An Bildgröße anpassen
                speed: 10,
                color: game.player.powerUp?.color || "#FFFF00",
                isPlayerBullet: true // Neu: Unterscheidung zwischen Spieler- und Gegner-Schüssen
            };
        }

        // Update Bullets
        function updateBullets() {
            // Player bullets
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                game.bullets[i].y -= game.bullets[i].speed;
                
                // Remove if off screen
                if (game.bullets[i].y < 0) {
                    game.bullets.splice(i, 1);
                }
            }
            
            // Enemy bullets
            for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
                game.enemyBullets[i].y += 4;
                
                // Remove if off screen
                if (game.enemyBullets[i].y > game.canvas.height) {
                    game.enemyBullets.splice(i, 1);
                }
            }
        }

        // Update Enemies
        function updateEnemies() {
            let changeDirection = false;
            
            // Move enemies
            for (const enemy of game.enemies) {
                enemy.x += game.enemyDirection * game.enemySpeed;
                
                // Check if any enemy hits the edge
                if (enemy.x <= 0 || enemy.x + enemy.width >= game.canvas.width) {
                    changeDirection = true;
                }
                
                // Enemy shooting
                if (enemy.shootCooldown <= 0 && Math.random() < 0.001) {
                    game.enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 2,
                        y: enemy.y + enemy.height,
                        width: 4,
                        height: 15,
                        speed: 0.2,
                        color: "#FF5555"
                    });
                    enemy.shootCooldown = 50 + Math.floor(Math.random() * 50);
                    
                } else {
                    enemy.shootCooldown--;
                }
            }
            
            // Change direction if needed
            if (changeDirection) {
                game.enemyDirection *= -1;
                for (const enemy of game.enemies) {
                    enemy.y += 20;
                    
                    // Check if enemies reached bottom
                    if (enemy.y + enemy.height > game.canvas.height - 50) {
                        gameOver();
                        return;
                    }
                }
            }
        }

        // Update Power-Ups
        function updatePowerUps() {
            for (let i = game.powerUps.length - 1; i >= 0; i--) {
                game.powerUps[i].y += 2;
                
                // Remove if off screen
                if (game.powerUps[i].y > game.canvas.height) {
                    game.powerUps.splice(i, 1);
                }
            }
        }

        // Update Epic-Ups
        function updateEpicUps() {
            for (let i = game.epicUps.length - 1; i >= 0; i--) {
                game.epicUps[i].y += 2;
                
                // Remove if off screen
                if (game.epicUps[i].y > game.canvas.height) {
                    game.epicUps.splice(i, 1);
                }
            }
        }

        // Check Collisions
        function checkCollisions() {
            // Player bullets vs enemies
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    if (checkCollision(game.bullets[i], game.enemies[j])) {
                        game.enemies[j].health = game.enemies[j].health - game.player.damage;
                        
                        if (game.enemies[j].health <= 0) {
                            // Chance to spawn power-up
                            if (Math.random() < POWERUP_CHANCE) {
                                spawnPowerUp(game.enemies[j].x + game.enemies[j].width / 2, game.enemies[j].y);
                            }else if (Math.random() < EPICPOWER_CHANCE) {
                                spawnEpicUp(game.enemies[j].x + game.enemies[j].width / 2, game.enemies[j].y);
                            }
                            
                            game.score += (game.level * 10);
                            game.enemies.splice(j, 1);
                        }
                        
                        game.bullets.splice(i, 1);
                        break;
                    }
                }
            }
            
            // Enemy bullets vs player
            for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
                if (checkCollision(game.enemyBullets[i], game.player)) {
                    if (!game.player.hasShield) {
                        game.lives--;
                        updateUI();
                        
                        if (game.lives <= 0) {
                            gameOver();
                            return;
                        }
                    }
                    game.enemyBullets.splice(i, 1);
                }
            }
            
            // Power-ups vs player
            for (let i = game.powerUps.length - 1; i >= 0; i--) {
                if (checkCollision(game.powerUps[i], game.player)) {
                    activatePowerUp(game.powerUps[i].type);
                    game.powerUps.splice(i, 1);
                }
            }

            // Epic-ups vs player
            for (let i = game.epicUps.length - 1; i >= 0; i--) {
                if (checkCollision(game.epicUps[i], game.player)) {
                    activateEpicUp(game.epicUps[i].epictype);
                    game.epicUps.splice(i, 1);
                }
            }
        }

        function checkCollision(obj1, obj2) {
            return (
                obj1.x < obj2.x + obj2.width &&
                obj1.x + obj1.width > obj2.x &&
                obj1.y < obj2.y + obj2.height &&
                obj1.y + obj1.height > obj2.y
            );
        }

        // Power-Up Functions
        function spawnPowerUp(x, y) {
            const types = Object.values(POWERUP_TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            
            game.powerUps.push({
                x: x - 15,
                y: y,
                width: 30,
                height: 30,
                type: type,
                color: type.color
            });
        }
        
        function spawnEpicUp(x, y) {
            const epictypes = Object.values(EPICUP_TYPES);
            const epictype = epictypes[Math.floor(Math.random() * epictypes.length)];
            
            game.epicUps.push({
                x: x - 15,
                y: y,
                width: 30,
                height: 30,
                epictype: epictype,
                color: epictype.color
            });
        }

        function activatePowerUp(type) {
            // Reset current power-up if exists
            if (game.player.powerUp) {
                resetPowerUp();
            }
            
            game.player.powerUp = type;
            game.player.powerUpTimer = type.duration;
            type.effect(game.player);
        }

        function activateEpicUp(epictype) {
            // Reset current epic-up if exists
            if (game.player.epicUp) {
                resetEpicUp();
            }
            
            game.player.epicUp = epictype;
            game.player.epicUpTimer = epictype.duration;
            epictype.effect(game.player);
        }

        function resetPowerUp() {
            game.player.powerUp = null;
            game.player.powerUpTimer = 0;
            game.player.fireRate = null;
            game.player.hasShield = false;
            game.player.laserActive = false;
            game.player.canonActive = false;
        }
        
        function resetEpicUp() {
            game.player.epicUp = null;
            game.player.epicUpTimer = 0;
            if(game.player.epicUp?.name === "AllTheUps") {
                resetPowerUp();
            }
        }

        // Draw Functions
        function drawPlayer() {
            
            
            // Draw shield if active
            if (game.player.hasShield) {
                game.ctx.strokeStyle = "#3366FF";
                game.ctx.lineWidth = 3;
                game.ctx.beginPath();
                game.ctx.arc(
                    game.player.x + game.player.width / 2,
                    game.player.y + game.player.height / 2,
                    game.player.width * 0.8,
                    0,
                    Math.PI * 2
                );
                game.ctx.stroke();
            }

            if(game.player.image.complete){
                //Bild erstellen
                game.ctx.drawImage(
                    game.player.image,
                    game.player.x,
                    game.player.y,
                    game.player.width,
                    game.player.height
                );
            } else{
                game.ctx.fillStyle = "#00FF00";
                game.ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
            }
        }

        function drawBullets() {
            for (const bullet of game.bullets) {
                if (game.bulletImage && game.bulletImage.complete) {
                    game.ctx.drawImage(
                        game.bulletImage,
                        bullet.x,
                        bullet.y,
                        bullet.width,
                        bullet.height
                    );
                } else {
                    game.ctx.fillStyle = bullet.color;
                    game.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                }
            }
    
            for (const bullet of game.enemyBullets) {
                if (game.enemyBulletImage && game.enemyBulletImage.complete) {
                    game.ctx.drawImage(
                        game.enemyBulletImage,
                        bullet.x,
                        bullet.y,
                        bullet.width,
                        bullet.height
                    );
                } else {
                    game.ctx.fillStyle = bullet.color;
                    game.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                }
            }
        }

        function drawEnemies() {
            for (const enemy of game.enemies) {
                const imgIndex = Math.min(Math.floor(enemy.y/50), game.enemyImages.length - 1);
                const enemyImg = game.enemyImages[imgIndex];
                
                if(enemyImg.complete){
                    //Bild erstellen
                    game.ctx.drawImage(
                        enemyImg,
                        enemy.x,
                        enemy.y,
                        enemy.width,
                        enemy.height
                    );
                }else{
                    game.ctx.fillStyle = enemy.color;
                    game.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                }
                


                // Draw health bar for enemies with health > 1
                if (enemy.health > 0) {
                     const healthWidth =  enemy.width * (enemy.health / (1 + Math.floor(game.level/3)));
                    game.ctx.fillStyle = "#00FF00";
                    game.ctx.fillRect(enemy.x, enemy.y - 10, healthWidth, 3);
                }
            }
        }

        function drawPowerUps() {
            for (const powerUp of game.powerUps) {
                game.ctx.fillStyle = powerUp.color;
                game.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
                
                // Draw pulsing effect
                const pulse = Math.sin(game.frames * 0.1) * 5 + 20;
                game.ctx.strokeStyle = powerUp.color;
                game.ctx.lineWidth = 2;
                game.ctx.beginPath();
                game.ctx.arc(
                    powerUp.x + powerUp.width / 2,
                    powerUp.y + powerUp.height / 2,
                    pulse,
                    0,
                    Math.PI * 2
                );
                game.ctx.stroke();
            }
        }

        function drawEpicUps() {
            for (const epicUp of game.epicUps) {
                game.ctx.fillStyle = epicUp.color;
                game.ctx.fillRect(epicUp.x, epicUp.y, epicUp.width, epicUp.height);
                
                // Draw pulsing effect
                const pulse = Math.sin(game.frames * 0.1) * 5 + 20;
                game.ctx.strokeStyle = epicUp.color;
                game.ctx.lineWidth = 2;
                game.ctx.beginPath();
                game.ctx.arc(
                    epicUp.x + epicUp.width / 2,
                    epicUp.y + epicUp.height / 2,
                    pulse,
                    0,
                    Math.PI * 2
                );
                game.ctx.stroke();
            }
        }

        function drawUI() {
            // Score, lives, level are already in HTML
        }

        function updateUI() {
            document.getElementById('score').textContent = game.score;
            document.getElementById('lives').textContent = game.lives;
            document.getElementById('level').textContent = game.level;
        }

        // Game Over
        function gameOver() {
            game.gameOver = true;
            document.getElementById('restartBtn').style.display = 'block';
        }

        // Reset Game
        function resetGame() {
            ENEMY_ROWS = 2;
            game.score = 0;
            game.lives = 3;
            game.level = 1;
            game.gameOver = false;
            game.bullets = [];
            game.enemyBullets = [];
            game.powerUps = [];
            game.epicUps = [];
            game.player.powerUp = null;
            game.player.powerUpTimer = 0;
            game.player.epicUp = null;
            game.player.epicUpTimer = 0;
            game.player.hasShield = false;
            game.player.laserActive = false;
            game.player.canonActive = false;
            game.player.damage = 1;
            document.getElementById('restartBtn').style.display = 'none';
            updateUI();
            startLevel();
            requestAnimationFrame(gameLoop);
        }

        //Einfärbung bei Power Ups
        /*if(game.player.powerUp){
            game.ctx.filter = 'hue-rotate(${Math.random()*360}deg)';
        }*/

        