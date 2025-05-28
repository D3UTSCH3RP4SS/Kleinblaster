        // Game Constants
        const PLAYER_SPEED = 2.5;
        let ENEMY_ROWS = 2;
        let ENEMY_COLS = 5;
        let POWERUP_CHANCE = 1; // like that one under this
        let EPICPOWER_CHANCE = 1; // this does Nothing

        //Boss-Leben
        const BOSS_HEALTH_MULTIPLIER = 50;

        const bgMusic = new Audio();
        bgMusic.volume = 0.1; // Lautstärke anpassen (0.1 - 1.0)
        bgMusic.loop = true;

        const bossTrack = document.getElementById("bossTrack");
        bossTrack.volume = 0.1;

        const SHOT_SOUNDS = Array.from({length:15},(_, i) => `Shots/Laser${i + 1}.mp3`);
        let PLAYER_SHOT_VOLUME = 1;
        let PLAYER_HIT_VOLUME = 1;
        let ENEMY_HIT_VOLUME = 1;
        let ENEMY_DEATH_VOLUME = 1;
        let GAME_OVER_VOLUME = 1;

        let BOSS_HIT_VOLUME = 1;
        let BOSS_DEATH_VOLUME = 1;
        let BOSS_ATTACK_VOLUME = 1;
        let BOSS_TRACK_VOLUME = 1;

        const SOUNDTRACKS = [
            {name:"Air Fight", path:"Backgroundmusic/8-bit-air-fight-158813.mp3"},
            {name:"Arcarde Mode", path:"Backgroundmusic/8-bit-arcade-mode-158814.mp3"},
            {name:"Chiptune", path:"Backgroundmusic/416-8-bit-chiptune-instrumental-for-games-339237.mp3"},
            {name:"Groove", path:"Backgroundmusic/chiptune-grooving-142242.mp3"},
            {name:"FNaF 1", path:"Backgroundmusic/FNaF 1.mp3"},
            {name:"FNaF 2", path:"Backgroundmusic/FNaF 2.mp3"},
            {name:"Order 8bit", path:"Backgroundmusic/8-bitChiptuneRemix.mp3"},
            {name:"Secret", path:"Backgroundmusic/Secret.mp3"}
        ];

        // Start Screen Setup
        function setupStartScreen() {
            document.getElementById('startBtn').addEventListener('click', () => {
                document.getElementById('startScreen').style.display = 'none';
                document.getElementById('gameScreen').style.display = 'block';
                init();
            });
        }

        function setupMusicSelector() {
            const select = document.getElementById('musicSelect');
            
            // Populate options
            SOUNDTRACKS.forEach((track, index) => {
                const option = document.createElement('option');
                option.value = track.path;
                option.textContent = track.name;
                option.selected = localStorage.getItem('selectedTrack') === track.path;
                select.appendChild(option);
            });

            // Event listener for track changes
            select.addEventListener('change', function() {
                bgMusic.pause();
                bgMusic.src = this.value;
                localStorage.setItem('selectedTrack', this.value);
                if(!game.boss){
                    bgMusic.play().catch(e => console.log("Autoplay prevented"));
                };
            });

            // Load saved track
            const savedTrack = localStorage.getItem('selectedTrack');
            if(savedTrack) {
                bgMusic.src = savedTrack;
                select.value = savedTrack;
            }
        }


// Modify the window.onload to use the start screen
window.onload = setupStartScreen;

        // Game State
        const game = {
            canvas: null,
            ctx: null,
            score: 0,
            highscore: 0,
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
                laserActive: false,
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
            constUps: [],
            lastShotTime: 0,
            enemyDirection: 1,
            enemySpeed: 1,
            enemyMoveDown: false,
            bosstrackisplaying: false,
            frames: 0,
            audioContext: null,
            shotSounds: [],
            isPaused: false,
            pauseTime: 0
        };



        //Boss Typen
        const BOSS_TYPES = {
            ALIEN_MONSTER: {
                name: "Alien Riese",
                width: 100,
                height: 120,
                color: "FFFFFF",
                //eventuell können wir verschiedene Attackmuster einbauen
                attackPattern: "wave",
                projectileSpeed: 1,
                health: 200,
                image: "Pictures/playerShot.png"
            }
        };

        // Power-Up Types
        const POWERUP_TYPES = {
            RAPID_FIRE: { 
                //für Pulsiereffektfarbe:
                color: "red",
                name: "Rapid Fire", 
                image: "Powerups/Item_Powerup_2.png", 
                duration: 300,
                effect: (player) => { player.rapidfire = true; }
            },
            SHIELD: { 
                //für Pulsiereffektfarbe:
                color: "lightblue",
                name: "Shield", 
                image: "Powerups/Item_Powerup_Shield_12.png",
                duration: 450,
                effect: (player) => { player.hasShield = true; }
            },
            LASER: { 
                //für Pulsiereffektfarbe:
                color: "purple",
                name: "Laser", 
                image: "Powerups/Gal_Player_Shot.png",
                duration: 300,
                effect: (player) => { player.laserActive = true; }
            },
            CANON: {
                //für Pulsiereffektfarbe:
                color: "green",
                name: "Canon",
                image: "Powerups/Gal_Player_DMG.png",
                duration: 500,
                effect: (player) => { player.canonActive = true; }
            },
            EXTRALIVE: {
                //für Pulsiereffektfarbe:
                color: "darkred",
                name: "Live",
                image: "Powerups/Item_Powerup_Heart_2.png",
                duration: 50,
                effect: () => {game.lives++, updateUI()}
            },
            LUCKUP: {
                //für Pulsiereffektfarbe:
                color: "#90EE90",
                name: "LuckUp",
                image: "Powerups/Gal_Player_Clover.png",
                duration: 500,
                effect: (player) => {player.luckActive = true; }
            }
                

        };
        
        const EPICUP_TYPES = {
            NUKE: {
                //für Pulsiereffektfarbe:
                color: "white",
                name: "Nuke",
                image: "Powerups/Item_Powerup_Skull_9.png",
                duration: 10,
                effect: () => { for(let i = game.enemies.length - 1; i >= 0; i--){
                                    game.enemies[i].health = Math.floor(game.enemies[i].health - (game.level / 4));
                                    if (game.enemies[i].health <= 0) {
                                        // Chance to spawn power-up
                                        if (Math.random() < POWERUP_CHANCE) {
                                            spawnPowerUp(game.enemies[i].x + game.enemies[i].width / 2, game.enemies[i].y);
                                        }else if (Math.random() < EPICPOWER_CHANCE) {
                                            spawnEpicUp(game.enemies[i].x + game.enemies[i].width / 2, game.enemies[i].y);
                                        }
                                        
                                        game.score += (game.level * 10);
                                        game.enemies.splice(i, 1);
                                    }
                                }
                }
            },

            ALLTHEUPS: {
                //für Pulsiereffektfarbe:
                color: "silver",
                name: "AllTheUps",
                image: "Powerups/Item_Powerup_Shield_8.png",
                duration: 300,
                effect: (player) => { player.canonActive = true; player.laserActive = true; player.hasShield = true; player.rapidfire = true; ConstDamage += 0.1, updateUI()}
            }
        };

        
        const CONSTUP_TYPES = {
            DAMAGEBOOST:{
                color: "red",
                name: "DamageBoost",
                image: "Powerups/Placeholder.jpg",
                effect: () => {bossDamage(), updateUI()}
            }
        };


        //Lade die Bilder für die Powerups
        async function loadPowerupImages(){
            const allTypes =[...Object.values(POWERUP_TYPES), ...Object.values(EPICUP_TYPES), ...Object.values(CONSTUP_TYPES)];

            for (const type of allTypes){
                type.imageObj = new Image();
                type.imageObj.src = type.image;
                await new Promise(resolve => {
                    type.imageObj.onload = resolve;
                })
            }
        }

        async function loadShotSounds(){
            for(const soundPath of SHOT_SOUNDS){
                try{
                    const response = await fetch(soundPath);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await game.audioContext.decodeAudioData(arrayBuffer);
                    game.shotSounds.push(audioBuffer);
                }catch(error){
                    console.error("Fehler beim Laden der Sounds:", soundPath, error);
                }
            }
        }

        // Initialize Game
        async function init() {

            game.canvas = document.getElementById('gameCanvas');
            game.ctx = game.canvas.getContext('2d');

            // Lebensleisten Bilder laden
            game.heartFullImage = new Image();
            game.heartFullImage.src = 'Powerups/Item_Powerup_Heart_2.png';
            game.heartHalfImage = new Image();
            game.heartHalfImage.src = 'Powerups/Item_Powerup_Heart_2.png';
            game.heartEmptyImage = new Image();
            game.heartEmptyImage.src = 'Powerups/Item_Powerup_DarkHeart_2.png';
            
            
            // Set player initial position
            game.player.x = game.canvas.width / 2 - game.player.width / 2;
            game.player.y = game.canvas.height - game.player.height - 20;
            
            // Setup controls
            setupControls();
            
            // Setup restart button
            document.getElementById('restartBtn').addEventListener('click', resetGame);

            // Setup Credits button
            document.getElementById('creditsButton').addEventListener('click', showCredits);

            //Setup Credits Restart Button
            document.getElementById('creditsRestartBtn').addEventListener('click', resetGame);
            
            // Start first level
            startLevel();
            	
            //Audio Content Initialisieren
            game.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            //Musik starten
            bgMusic.play();

            //Schusssounds laden
            await loadShotSounds();
            
            // Start game loop
            requestAnimationFrame(gameLoop);

            //Musikauswahl laden
            setupMusicSelector();


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

            //Bilder laden für Powerups
            await loadPowerupImages();

            //Laden von Boss
            game.bossImages = {};
            for(const [key, boss] of Object.entries(BOSS_TYPES)){
                const img = new Image();
                img.src = boss.image;
                game.bossImages[key] = img;
            }

            //Laden der Kugeln vom Spieler (um sie mir irgendwann zu geben x.x(war nur Spaß))
            game.bulletImage = new Image();
            game.bulletImage.src = 'Pictures/playerShot.png';

            //Laden der Kugeln vom Gegner (um sie auf mich zu ballern yipieeeeeeeeeeeeee (Coden macht so viel Spaß))
            game.enemyBulletImage = new Image();
            game.enemyBulletImage.src = 'Pictures/Enemy.png';

        }

        

        //Player Shot sound 
        function playRandomShotSound() {
            if (game.shotSounds.length === 0 || !game.audioContext) return;
            
            const source = game.audioContext.createBufferSource();
            const gainNode = game.audioContext.createGain();
            source.buffer = game.shotSounds[Math.floor(Math.random() * game.shotSounds.length)];
            gainNode.gain.value = PLAYER_SHOT_VOLUME;

            source.connect(gainNode);
            gainNode.connect(game.audioContext.destination);
            source.start(0);
        }

        

        // Setup Controls
        function setupControls() {
        document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') game.player.isMovingLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd') game.player.isMovingRight = true;
        if (e.key === ' ' || e.key === "ArrowUp" || e.key === "w") game.player.isShooting = true; //Schießen bei gedrückter Leertaste
        });   
    
        document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') game.player.isMovingLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd') game.player.isMovingRight = false;
        if (e.key === ' ' || e.key === "ArrowUp" || e.key === "w") game.player.isShooting = false; //Stoppe Schießen
        });
        }

        //Pause Screen
        function togglePause(){
            game.isPaused = !game.isPaused;
            const pauseScreen = document.getElementById('pauseScreen');

            //Pause Aktivieren/Deaktivieren
            if (game.isPaused){
                pauseScreen.style.display = "flex";
                game.pauseTime = Date.now();
            }else{
                pauseScreen.style.display = "none";
                if(!bgMusic.paused && !game.boss) bgMusic.play();
                if(!bossTrack.paused) bossTrack.play();
                game.lastShotTime += Date.now() - game.pauseTime;
                requestAnimationFrame(gameLoop);
            }

            game.canvas.classList.toggle("paused", game.isPaused);
        }

        //Bei Escape oder P drücken in den Pause Modus wechseln
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p') {
                togglePause();
            }
        });

        document.getElementById('resumeBtn').addEventListener('click', togglePause);

        //Sound Kontrolle
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            bgMusic.volume = e.target.value;
            bossTrack.volume = e.target.value;
            localStorage.setItem('musicVolume', e.target.value);
        });

        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            
            PLAYER_HIT_VOLUME = parseFloat(e.target.value);
            PLAYER_SHOT_VOLUME = parseFloat(e.target.value);
            ENEMY_HIT_VOLUME = parseFloat(e.target.value);
            ENEMY_DEATH_VOLUME = parseFloat(e.target.value);
            GAME_OVER_VOLUME = parseFloat(e.target.value);

            BOSS_HIT_VOLUME = parseFloat(e.target.value) * 0.6;
            BOSS_DEATH_VOLUME = parseFloat(e.target.value);
            BOSS_ATTACK_VOLUME = parseFloat(e.target.value) * 0.7;
            

            playerHitSound.volume = PLAYER_HIT_VOLUME;
            enemyHitSound.volume = ENEMY_HIT_VOLUME;
            enemyDeathSound.volume = ENEMY_DEATH_VOLUME;
            gameOverSound.volume = GAME_OVER_VOLUME;

            bossHitSound.volume = BOSS_HIT_VOLUME;
            bossDeathSound.volume = BOSS_DEATH_VOLUME;
            bossAttackSound.volume = BOSS_ATTACK_VOLUME;

            localStorage.setItem('sfxVolume', e.target.value);

        });

        //die gespeicherten werte beim Laden wieder holen
        window.addEventListener('load', () => {
            const savedMusicVol = localStorage.getItem('musicVolume') || 0.1;
            const savedSfxVol = localStorage.getItem('sfxVolume') || 0.2;
            
            document.getElementById('musicVolume').value = savedMusicVol;
            document.getElementById('sfxVolume').value = savedSfxVol;

            PLAYER_HIT_VOLUME = savedSfxVol * 0.7;
            PLAYER_SHOT_VOLUME = savedSfxVol * 0.7;
            ENEMY_HIT_VOLUME = savedSfxVol * 0.1;
            ENEMY_DEATH_VOLUME = savedSfxVol * 0.05;
            GAME_OVER_VOLUME = savedSfxVol * 1;

            BOSS_HIT_VOLUME = savedSfxVol * 0.5;
            BOSS_ATTACK_VOLUME = savedSfxVol * 0.5;
            BOSS_DEATH_VOLUME = savedSfxVol * 1;
            
            playerHitSound.volume = PLAYER_HIT_VOLUME;
            enemyHitSound.volume = ENEMY_HIT_VOLUME;
            enemyDeathSound.volume = ENEMY_DEATH_VOLUME;
            gameOverSound.volume = GAME_OVER_VOLUME;

            bgMusic.volume = savedMusicVol;
            bossTrack.volume = savedMusicVol * 0.5;

            bossHitSound.volume = BOSS_HIT_VOLUME;
            bossAttackSound.volume = BOSS_ATTACK_VOLUME;
            bossDeathSound.volume = BOSS_DEATH_VOLUME;
        });

        const playerHitSound = document.getElementById("playerHitSound");
        const enemyHitSound = document.getElementById("enemyHitSound");
        const enemyDeathSound = document.getElementById("enemyDeathSound");
        const gameOverSound = document.getElementById("gameOverSound");

        const bossHitSound = document.getElementById("bossHitSound");
        const bossDeathSound = document.getElementById("bossDeathSound");
        const bossAttackSound = document.getElementById("bossAttackSound");

        // SOUND-FUNKTIONEN
        function playEnemyHitSound() {
            enemyHitSound.currentTime = 0;
            enemyHitSound.volume = ENEMY_HIT_VOLUME;
            enemyHitSound.play().catch(e => console.log("Hit-Sound fehlgeschlagen:", e));
        }

        function playPlayerHitSound(){
            playerHitSound.currentTime = 0;
            playerHitSound.volume = PLAYER_HIT_VOLUME;
            playerHitSound.play().catch(e => console.log("Hit-Sound fehlgeschlagen:", e));
        }

        

        function playEnemyDeathSound() {
            enemyDeathSound.currentTime = 0;
            enemyDeathSound.volume = ENEMY_DEATH_VOLUME;
            enemyDeathSound.play().catch(e => console.log("Death-Sound fehlgeschlagen:", e));
        }

        function playGameOverSound() {
            gameOverSound.currentTime = 0;
            gameOverSound.volume = GAME_OVER_VOLUME;
            gameOverSound.play().catch(e => console.log("Game-Over-Sound fehlgeschlagen:", e));
        }

        // Start Level
        function startLevel() {
            
            // Clear existing enemies
            game.enemies = [];
            

            //Boss erstellen bei jedem 15. Level
            if(game.level % 15 === 0){
                spawnBoss();
                bossTrack.play();
                bgMusic.pause();
            }else{
                // Create enemy formation
                bossTrack.pause();
                bgMusic.play();
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
            }

            // Increase enemy speed slightly each level
            if(game.enemySpeed < 1){
            game.enemySpeed = 0.5 + (game.level * 0.1);
            }
            
            // Update UI
            updateUI();
        }

        function spawnBoss(){
            const bossType = BOSS_TYPES.ALIEN_MONSTER;
            game.boss = {
                ...bossType,
                x: game.canvas.width/2 - bossType.width/2,
                y: 100,
                // Erhöht das Leben späterer Bosse
                health: bossType.health * Math.floor(game.level/15),
                maxHealth: bossType.health * Math.floor(game.level/15),
                attackCooldown: 100,
                secondCooldown: 100,
                phase: 1,
                direction: 1
            };

        }

        function updateRows(){
            
            ENEMY_ROWS = 2 + Math.random() * game.level;
            
            if(ENEMY_ROWS > 6){
                ENEMY_ROWS = 2 + Math.random() * 3;
            }
        }

        function getEnemyColor(row) {
            const colors = ['#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#00CCFF'];
            return colors[row % colors.length];
        }

        // Game Loop
        function gameLoop() {
            if (game.gameOver || game.isPaused) return;
            
            game.frames++;
            
            // Clear canvas
            game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
            
            // Update game state
            updatePlayer();
            updateBullets();
            updateEnemies();
            updatePowerUps();
            updateEpicUps();
            updateConstUps();
            checkCollisions();
            updateRows();
            caplives();
            
            // Draw everything
            drawPlayer();
            drawBullets();
            drawEnemies();
            drawPowerUps();
            drawEpicUps();
            drawConstUps();
            drawUI();
            
            // Check for level completion
            if (game.boss) {
                game.enemies = [];
            }else if(game.enemies.length === 0){
                game.level++;
                //game.lives++;
                startLevel();
            }

            //Ab Level 5 mehr Leben für Gegner
            
            
            requestAnimationFrame(gameLoop);
        }

        // Update Player
        let ConstDamage = game.player.damage;

        function bossDamage(){ 
            ConstDamage += 10;
        }

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

            if (game.player.canonActive) {
                game.player.damage = ConstDamage + 5;
                updateUI();
            }else{
                game.player.damage = ConstDamage;
                updateUI();
            }

            if(game.player.luckActive){
                EPICPOWER_CHANCE = 1;
                POWERUP_CHANCE = 0;
            }else{
                EPICPOWER_CHANCE = 0.01;//here
                POWERUP_CHANCE = 0.25;//You can change the Power and Epicup Chance
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
            const fireRate = game.player?.rapidfire? 100 : 300;

            if (now - game.lastShotTime > fireRate) {
                //sound
                playRandomShotSound();
                if (game.player.laserActive === true) {
                    game.bullets.push(createBullet(game.player.x + 5, 0.8));
                    game.bullets.push(createBullet(game.player.x + game.player.width / 2 - 2, 0));
                    game.bullets.push(createBullet(game.player.x + game.player.width - 9, -0.8));
                } else {
                    game.bullets.push(createBullet(game.player.x + game.player.width / 2 - 2, 0));
                }
                game.lastShotTime = now;
            }
        }

        function createBullet(x,spread) {
            return {
                x: x,
                y: game.player.y,
                spread: spread,
                width: 8,  // An Bildgröße anpassen
                height: 16, // An Bildgröße anpassen
                speed: 8,
                color: game.player.powerUp?.color || "#FFFF00",
                isPlayerBullet: true // Neu: Unterscheidung zwischen Spieler- und Gegner-Schüssen
            };
        }

        // Update Bullets
        function updateBullets() {
            // Player bullets
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                game.bullets[i].y -= game.bullets[i].speed;
                game.bullets[i].x -= game.bullets[i].spread;
                
                // Remove if off screen
                if (game.bullets[i].y < 0) {
                    game.bullets.splice(i, 1);
                }
            }
            
            // Enemy bullets
            for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = game.enemyBullets[i];

                if(bullet.isHoming){

                    
                    const dx = game.player.x + game.player.width/2 - bullet.x;
                    const dy = game.player.y + game.player.height/2 - bullet.y;
                    if(game.canvas.height/1.7 > bullet.y){
                    bullet.angle = Math.atan2(dy, dx);
                    }
                    
                    bullet.x += Math.cos(bullet.angle) * bullet.speed;
                    bullet.y += Math.sin(bullet.angle) * bullet.speed;

                }else{
                    bullet.y += bullet.speed;
                }
                
                // Remove if off screen
                if (bullet.y > game.canvas.height) {
                    game.enemyBullets.splice(i, 1);
                }
            }
        }

        // Update Enemies
        function updateEnemies() {

            //wenn ein Boss gespawnt wird 
            if(game.boss){
                updateBoss();
                return;
            }

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
                        speed: 4,
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

        let cooldown2 = 450;
        //Updatet den Boss
        function updateBoss(){
            //Boss bewegungen 
            if(game.boss){
                // Bewegungsgeschwindigkeit
                const BOSS_SPEED = 2;
                // Boss-Breite berücksichtigen
                const bossWidth = game.boss.width;
                // Update Boss Position
                game.boss.x += BOSS_SPEED * game.boss.direction;
                
                // Richtung umkehren bei Randberührung
                if(game.boss.x <= 0) {
                    game.boss.x = 0;
                    game.boss.direction = 1; // Nach rechts bewegen
                }
                if(game.boss.x + bossWidth >= game.canvas.width) {
                    game.boss.x = game.canvas.width - bossWidth;
                    game.boss.direction = -1; // Nach links bewegen
                }
            }

            //Angriffslogik
            if(game.boss.attackCooldown <= 0){
                bossAttackSound.currentTime = 0;
                bossAttackSound.play().catch(e => console.log("Error beim Laden vom Attack Sound"));
            
                //lege den Cooldown für den Boss fest
                game.boss.attackCooldown = cooldown2;
            
                if(game.boss.attackPattern === "wave" && game.boss.phase === 1){
                    //Spezielles Angriffsmuster
                    for(let i = 0; i < 7; i++){
                        game.enemyBullets.push({
                            x: game.boss.x + game.boss.width/2,
                            y: game.boss.y + game.boss.height,
                            width: 15,
                            height: 25,
                            speed: 7
                        });
                    }
                    cooldown2 = 450;
                }

                //Phasenwechsel bei 50% Leben
                if(game.boss.health < game.boss.maxHealth/2 && game.boss.phase === 1){
                    game.boss.phase = 2;
                    game.boss.attackPattern = "homing";
                    const dx = game.player.x + game.player.width/2 - (game.boss.x + game.boss.width/2);
                    const dy = game.player.y + game.player.height/2 - (game.boss.y + game.boss.height);
                    const angle = Math.atan2(dy, dx);
                }

                //2. Bossphase
                if(game.boss.attackPattern === "homing" && game.boss.phase === 2){
                    const playerX = game.player.x + game.player.width/2;
                    const playerY = game.player.y + game.player.height/2;

                    for(let i = 0; i < 5; i++){

                        const dx = playerX - (game.boss.x + game.boss.width/2);
                        const dy = playerY - (game.boss.y + game.boss.height);
                        const angle = Math.atan2(dy, dx);

                            game.enemyBullets.push({
                                x: game.boss.x + game.boss.width/2,
                                y: game.boss.y + game.boss.height - 20,
                                width: 20,
                                height: 20,
                                speed: 2,
                                angle: angle,
                                isHoming: true
                            });
                            game.enemyBullets.push({
                                x: game.boss.x + game.boss.width/2,
                                y: game.boss.y + game.boss.height - 10,
                                width: 30,
                                height: 30,
                                speed: 2.1,
                                angle: angle,
                                isHoming: true
                            });
                            game.enemyBullets.push({
                                x: game.boss.x + game.boss.width/2,
                                y: game.boss.y + game.boss.height,
                                width: 40,
                                height: 40,
                                speed: 2.2,
                                angle: angle,
                                isHoming: true
                            });
                    }
                    cooldown2 = 300;
                }
                

            } else {
                game.boss.attackCooldown--;
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

        function updateConstUps(){
            for(let i = game.constUps.length - 1; i >= 0; i--){
                game.constUps[i].y += 2;
                if(game.constUps[i].y > game.canvas.height){
                    game.constUps.splice(i, 1);
                }
            }
        }

        // Check Collisions
        function checkCollisions() {
            // Spieler Kugeln gegen Boss
            if(game.boss){
                for(let i = game.bullets.length - 1; i>=0; i--){
                    if(checkCollision(game.bullets[i], game.boss)){
                        game.boss.health -= game.player.damage;
                        //Sound für Bosshit
                        bossHitSound.currentTime = 0;
                        bossHitSound.play().catch(e => console.log("Boss hit Sound Error"));

                        if(game.boss.health <= 0){
                            //Sound für Bossdeath
                            bossDeathSound.currentTime = 0;
                            bossDeathSound.play().catch(e => console.log("Boss death Sound Error"));
                            game.score += 1000 * Math.floor(game.level/15);
                            game.boss = null;
                            //Spezielle Powerups, die das Ganze Spiel lang halten
                            spawnVictoryPowerUps();
                        }

                        game.bullets.splice(i, 1);
                        break;
                    }
                }
            }
            // Player bullets vs enemies
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    if (checkCollision(game.bullets[i], game.enemies[j])) {
                        game.enemies[j].health = game.enemies[j].health - game.player.damage;
                        playEnemyHitSound();
                        if (game.enemies[j].health <= 0) {
                            //sound
                            playEnemyDeathSound();
                            // Chance to spawn power-up
                            if (Math.random() < POWERUP_CHANCE) {
                                spawnPowerUp(game.enemies[j].x + game.enemies[j].width / 2, game.enemies[j].y);
                            }else if (Math.random() < EPICPOWER_CHANCE) {
                                spawnEpicUp(game.enemies[j].x + game.enemies[j].width / 2, game.enemies[j].y);
                            }
                            
                            game.score += (game.level * 10);
                            game.enemies.splice(j, 1);
                            updateUI();
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
                        playPlayerHitSound();
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

            // Const ups vs player
            for (let i = game.constUps.length - 1; i >= 0; i--){
                if(checkCollision(game.constUps[i], game.player)){
                    activateConstUp(game.constUps[i].constType);
                    game.constUps.splice(i, 1);
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

        function spawnConstUp(x, y){
            const constTypes = Object.values(CONSTUP_TYPES);
            const constType = constTypes[Math.floor(Math.random() * constTypes.length)];

            game.constUps.push({
                x: x - 15,
                y: y,
                width: 30,
                height: 30,
                constType: constType,
                color: constType.color
            })
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

        function activateConstUp(constType){
            constType.effect(game.player);
        }

        function resetPowerUp() {
            
            game.player.powerUpTimer = 0;
            if(game.player.powerUp?.name === "Rapid Fire"){
                game.player.fireRate = null;
                game.player.rapidfire = false;
            }
            if(game.player.powerUp?.name === "Shield"){
                game.player.hasShield = false;
            }
            if(game.player.powerUp?.name === "Laser"){
                game.player.laserActive = false;
            }
            if(game.player.powerUp?.name === "Canon"){
                game.player.canonActive = false;
            }if(game.player.powerUp?.name === "LuckUp"){
                game.player.luckActive = false;
            }
            game.player.powerUp = null;
            
        }
        
        function resetEpicUp() {
            game.player.epicUpTimer = 0;
            if(game.player.epicUp?.name === "AllTheUps") {
                game.player.laserActive = false;
                game.player.hasShield = false;
                game.player.canonActive = false;
                game.player.fireRate = null;
                game.player.rapidfire = false;
                game.powerUpTimer = 0;
            }
            game.player.epicUp = null;
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
            //Boss erstellen
            if(game.boss){
                drawBoss();
                return;
            }
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
                    const maxHealth = 1 + Math.floor(game.level/3);
                    const heartSize = 10;
                    
                    // Dynamische Berechnung der Herz-Anzeige
                    const healthPerHeart = Math.pow(1, Math.floor(Math.log2(maxHealth/4)));
                    const heartCount = Math.ceil(maxHealth / healthPerHeart);
                    const visibleHearts = Math.min(heartCount, 4); // Maximal 4 Herzen
                    
                    const startX = enemy.x + (enemy.width - (heartSize * visibleHearts)) / 2;
                    
                    for(let i = 0; i < visibleHearts; i++) {
                        const currentThreshold = (i + 1) * healthPerHeart;
                        const isFull = enemy.health >= currentThreshold;
                        const isPartial = enemy.health > (i * healthPerHeart) && enemy.health < currentThreshold;
                        
                        // Bildauswahl
                        const img = isFull ? game.heartFullImage : 
                                    isPartial ? game.heartHalfImage : 
                                    game.heartEmptyImage;
                        
                        if(img.complete) {
                            game.ctx.drawImage(
                                img,
                                startX + (i * heartSize),
                                enemy.y - 15,
                                heartSize,
                                heartSize
                            );
                        } else {
                            // Fallback farbige Darstellung
                            game.ctx.fillStyle = isFull ? "#FF0000" : 
                                            isPartial ? "#FF8888" : 
                                            "#444444";
                            game.ctx.fillRect(
                                startX + (i * heartSize),
                                enemy.y - 15,
                                heartSize,
                                heartSize
                            );
                        }
                    }
                }
            }
        }

        
        function drawBoss(){
            const img = game.bossImages.ALIEN_MONSTER;

            //Boss bild erstellen
            if(img.complete){
                game.ctx.drawImage(
                    img,
                    game.boss.x,
                    game.boss.y,
                    game.boss.width,
                    game.boss.height
                );
            }else{
                game.ctx.fillStyle = game.boss.color;
                game.ctx.fillRect(game.boss.x, game.boss.y, game.boss.width, game.boss.height);
            }

            //Gesundheitsbalken zeichnen
            const healthWidth = game.boss.width * (game.boss.health / game.boss.maxHealth);
            game.ctx.fillStyle = "red";
            game.ctx.fillRect(game.boss.x, game.boss.y - 20, healthWidth, 10);
        }


        function drawPowerUps() {
            for (const powerUp of game.powerUps) {
                const img = powerUp.type.imageObj;
                
                if (img.complete) {
                game.ctx.drawImage(
                    img,
                    powerUp.x,
                    powerUp.y,
                    powerUp.width,
                    powerUp.height
                );
                } else {
                // Fallback: Farbe zeichnen
                game.ctx.fillStyle = powerUp.color;
                game.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
                }

                // Puls-Effekt
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
                const img = epicUp.epictype.imageObj; // Bildreferenz aus dem Epic-Up-Typ
                
                // Versuche Bild zu zeichnen
                if (img && img.complete) {
                game.ctx.drawImage(
                    img,
                    epicUp.x,
                    epicUp.y,
                    epicUp.width,
                    epicUp.height
                );
                } else {
                // Fallback: Zeichne farbiges Rechteck
                game.ctx.fillStyle = epicUp.color;
                game.ctx.fillRect(epicUp.x, epicUp.y, epicUp.width, epicUp.height);
                }

                // Pulsierender Effekt (wie bei Power-Ups)
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

        function drawConstUps(){
            for(const constUp of game.constUps){
                const img = constUp.constType.imageObj; // Bildreferenz aus dem Const-Up-Typ
                
                // Versuche Bild zu zeichnen
                if (img && img.complete) {
                game.ctx.drawImage(
                    img,
                    constUp.x,
                    constUp.y,
                    constUp.width,
                    constUp.height
                );
                } else {
                // Fallback: Zeichne farbiges Rechteck
                game.ctx.fillStyle = constUp.color;
                game.ctx.fillRect(constUp.x, constUp.y, constUp.width, constUp.height);
                }

                // Pulsierender Effekt (wie bei Power-Ups)
                const pulse = Math.sin(game.frames * 0.1) * 5 + 20;
                game.ctx.strokeStyle = constUp.color;
                game.ctx.lineWidth = 2;
                game.ctx.beginPath();
                game.ctx.arc(
                constUp.x + constUp.width / 2,
                constUp.y + constUp.height / 2,
                pulse,
                0,
                Math.PI * 2
                );
                game.ctx.stroke();
            }
        }


        function spawnVictoryPowerUps(){
            spawnConstUp(
                game.canvas.width/2,
                game.canvas.height/2 + 40
            );
        }

        

        function Highscore(){

            

            if(game.highscore < game.score){
            game.highscore = game.score;
            }
            localStorage.setItem("highscore", game.highscore);
        }

        function drawUI() {
            // Score, lives, level are already in HTML
        }

        function updateUI() {
            let savedHighscore = localStorage.getItem("highscore");
            document.getElementById('score').textContent = game.score;
            document.getElementById('lives').textContent = game.lives;
            document.getElementById('level').textContent = game.level;
            document.getElementById('damage').textContent = Math.floor(game.player.damage);
            document.getElementById('Highscore').textContent = savedHighscore;

            // Visuelle Lebensanzeige
            const lifeContainer = document.getElementById('lifeContainer');
            lifeContainer.innerHTML = ''; // Alte Herzen löschen
            
            // Füge für jedes Leben ein Icon hinzu
            for(let i = 0; i < game.lives; i++) {
                const lifeIcon = document.createElement('div');
                lifeIcon.className = 'life-icon';
                lifeContainer.appendChild(lifeIcon);
            }

            //Begrenze Leben auf 5 und füge ausgegrautes Herz hinzu, wenn es fehlt
            const maxLives = 5;
            const lifeContainer2 = document.getElementById('lifeContainer');
            lifeContainer2.innerHTML = '';
            
            for(let i = 0; i < maxLives; i++) {
                const lifeIcon = document.createElement('div');
                lifeIcon.className = `life-icon ${i < game.lives ? '' : 'empty'}`;
                lifeContainer2.appendChild(lifeIcon);
            }
        }

        // Game Over
        function gameOver() {
            bgMusic.pause();
            bossTrack.pause();
            game.gameOver = true;
            playGameOverSound();
            document.getElementById('restartBtn').style.display = 'block';
            document.getElementById('creditsButton').style.display = 'block';
            document.getElementById('OverScreen').style.display = 'flex';
            
        }

        

        // Reset Game
        function resetGame() {
            Highscore();
            ENEMY_ROWS = 2;
            game.score = 0;
            game.lives = 3;
            game.level = 1;
            game.gameOver = false;
            game.bullets = [];
            game.enemyBullets = [];
            game.powerUps = [];
            game.epicUps = [];
            game.constUps = [];
            game.player.powerUp = null;
            game.player.powerUpTimer = 0;
            game.player.epicUp = null;
            game.player.epicUpTimer = 0;
            game.player.hasShield = false;
            game.player.laserActive = false;
            game.player.canonActive = false;
            game.player.luckActive = false;
            game.player.rapidfire = false;
            game.player.damage = 1;
            game.boss = false; 
            ConstDamage = 1;
            document.getElementById('restartBtn').style.display = 'none';
            document.getElementById('creditsButton').style.display = 'none';
            document.getElementById('creditsRestartBtn').style.display = 'block';
            document.getElementById('OverScreen').style.display = 'none';
            document.getElementById("gameScreen").style.display = 'block';
            document.getElementById("creditScreen").style.display = 'none';
            updateUI();
            startLevel();
            bgMusic.play();
            requestAnimationFrame(gameLoop);
        }

        //Show credits
        function showCredits() {
            document.getElementById('creditsRestartBtn').style.display = 'block';
            document.getElementById('OverScreen').style.display = 'none';
            document.getElementById("gameScreen").style.display = 'none';
            document.getElementById("creditScreen").style.display = 'flex';
        }

        

        //Einfärbung bei Power Ups
        /*if(game.player.powerUp){
            game.ctx.filter = 'hue-rotate(${Math.random()*360}deg)';
        }*/
        