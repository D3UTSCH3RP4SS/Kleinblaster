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

const SHOT_SOUNDS = Array.from({ length: 15 }, (_, i) => `Shots/Laser${i + 1}.mp3`);
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
    { name: "Air Fight", path: "Backgroundmusic/8-bit-air-fight-158813.mp3" },
    { name: "Arcarde Mode", path: "Backgroundmusic/8-bit-arcade-mode-158814.mp3" },
    { name: "Chiptune", path: "Backgroundmusic/416-8-bit-chiptune-instrumental-for-games-339237.mp3" },
    { name: "Groove", path: "Backgroundmusic/chiptune-grooving-142242.mp3" },
    { name: "FNaF 1", path: "Backgroundmusic/FNaF 1.mp3" },
    { name: "FNaF 2", path: "Backgroundmusic/FNaF 2.mp3" },
    { name: "Order 8bit", path: "Backgroundmusic/8-bitChiptuneRemix.mp3" },
    { name: "Secret", path: "Backgroundmusic/Secret.mp3" },
    { name: "Castle Vein", path: "Backgroundmusic/Castle Vein.mp3" },
    { name: "Town Theme", path: "Backgroundmusic/8bittownthemesong-59266.mp3" }
];

// Start Screen Setup
// Setup Start Screen
function setupStartScreen() {
    document.getElementById('startBtn').addEventListener('click', () => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        init();
    });

    // Neuer Event-Listener für den Tutorial-Button
    document.getElementById('tutorialBtn').addEventListener('click', () => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('tutorialScreen').style.display = 'flex';
    });
}

// Event-Listener für den Zurück-Button in der Anleitung
document.getElementById('tutorialBackBtn').addEventListener('click', () => {
    document.getElementById('tutorialScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
});

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
    select.addEventListener('change', function () {
        bgMusic.pause();
        bgMusic.src = this.value;
        localStorage.setItem('selectedTrack', this.value);
        if (!game.boss) {
            bgMusic.play().catch(e => console.log("Autoplay prevented"));
        };
    });

    // Load saved track
    const savedTrack = localStorage.getItem('selectedTrack');
    if (savedTrack) {
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
        isMovingUp: false,
        isMovingDown: false,
        powerUps: [],
        powerUpTimer: 0,
        shieldCount: 0,
        laserActive: false,
        canonActive: false,
        isMagnetic: false,
        piercingShot: false,
        epicUps: [],
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
    pauseTime: 0,
    bossIntro: false,
    bossIntroTimer: 0,
    bossName: "",
    bossEntryAnimation: null,
    enemyIntro: false,
    enemyIntroTimer: 0
};



//Boss Typen
const BOSS_TYPES = {
    ALIEN_MONSTER: {
        name: "Alien Riese",
        width: 150,
        height: 90,
        color: "FFFFFF",
        images: {
            phase1: "BossImages/AlienP1.png",
            phase2: "BossImages/AlienP2.png"
        },
        attackPatterns: {
            phase1: ["spiral"/*"wave", "circle", "spiral"*/],
            phase2: ["homing", "burst", "laser", "spawn"]
        },
        projectileSpeed: 1,
        health: 300
    },

    SPACE_BOSS: {
        name: "Deathstrider",
        width: 80,
        height: 120,
        color: "FFFFFF",
        images: {
            phase1: "BossImages/SpaceBossP1.png",
            phase2: "BossImages/SpaceBossP2.png"
        },
        attackPatterns: {
            phase1: ["spiral"/*"circle", "spiral", "wave"*/],
            phase2: ["laser", "homing", "burst", "spawn"]
        },
        projectileSpeed: 1,
        health: 200
    },



};

// Power-Up Types
const POWERUP_TYPES = {
    RAPID_FIRE: {
        //für Pulsiereffektfarbe:
        color: "red",
        name: "Rapid Fire",
        image: "Powerups/Item_Powerup_2.png",
        duration: 300,
        sound: "PowerupSounds/rapidUp.mp3",
        effect: (player) => { player.rapidfire = true; }
    },
    SHIELD: {
        //für Pulsiereffektfarbe:
        color: "lightblue",
        name: "Shield",
        image: "Powerups/Item_Powerup_Shield_12.png",
        sound: "PowerupSounds/shield.mp3",
        effect: (player) => { player.shieldCount++; }
    },
    LASER: {
        //für Pulsiereffektfarbe:
        color: "purple",
        name: "Laser",
        image: "Powerups/Gal_Player_Shot.png",
        duration: 300,
        sound: "PowerupSounds/stab.mp3",
        effect: (player) => { player.laserActive = true; }
    },
    CANON: {
        //für Pulsiereffektfarbe:
        color: "green",
        name: "Canon",
        image: "Powerups/Gal_Player_DMG.png",
        duration: 500,
        sound: "PowerupSounds/stab.mp3",
        effect: (player) => { player.canonActive = true; }
    },
    EXTRALIVE: {
        //für Pulsiereffektfarbe:
        color: "darkred",
        name: "Live",
        image: "Powerups/Item_Powerup_Heart_2.png",
        duration: 50,
        sound: "PowerupSounds/stab.mp3",
        effect: () => { game.lives++, updateUI() }
    },
    LUCKUP: {
        //für Pulsiereffektfarbe:
        color: "#90EE90",
        name: "LuckUp",
        image: "Powerups/Gal_Player_Clover.png",
        duration: 500,
        timer: 200,
        sound: "PowerupSounds/coin.mp3",
        effect: (player) => { player.luckActive = true; }
    },
    MAGNET: {
        color: "pink",
        name: "Magnet",
        image: "Powerups/Magnet.png",
        duration: 600,
        sound: "PowerupSounds/coin.mp3",
        effect: (player) => { player.isMagnetic = true; }
    },
    SCORE_MULTIPLIER: {
        color: "gold",
        name: "Score x2",
        image: "Powerups/score.png",
        duration: 450,
        sound: "PowerupSounds/coin.mp3",
        effect: () => { game.scoreMultiplier = 2; }
    },
    PIERCING_SHOT: {
        color: "silver",
        name: "Piercing Shot",
        image: "Powerups/Piercing.png",
        duration: 400,
        sound: "PowerupSounds/coin.mp3",
        effect: (player) => { player.piercingShot = true; }
    }



};

const EPICUP_TYPES = {
    NUKE: {
        //für Pulsiereffektfarbe:
        color: "white",
        name: "Nuke",
        image: "Powerups/Item_Powerup_Skull_9.png",
        duration: 200,
        sound: "PowerupSounds/stab.mp3",
        effect: () => {
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                game.enemies[i].health = Math.floor(game.enemies[i].health - (game.level / 4));
                if (game.enemies[i].health <= 0) {
                    // Chance to spawn power-up
                    if (Math.random() < POWERUP_CHANCE) {
                        spawnPowerUp(game.enemies[i].x + game.enemies[i].width / 2, game.enemies[i].y);
                    } else if (Math.random() < EPICPOWER_CHANCE) {
                        spawnEpicUp(game.enemies[i].x + game.enemies[i].width / 2, game.enemies[i].y);
                    }

                    game.score += (game.level * 10) * (game.scoreMultiplier || 1);
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
        sound: "PowerupSounds/stab.mp3",
        effect: (player) => { player.canonActive = true; player.laserActive = true; player.shieldCount++; player.rapidfire = true; ConstDamage += 0.1, updateUI() }
    },

    SLOWNESS: {
        color: "gold",
        name: "Slowness",
        image: "Powerups/Time.png",
        duration: 200,
        sound: "PowerupSounds/Slownesspowerup.mp3",
        effect: () => { game.timeSlowFactor = 0.5; game.bulletSpeed = 0.01 }
    }
};


const CONSTUP_TYPES = {
    DAMAGEBOOST: {
        color: "red",
        name: "DamageBoost",
        image: "Powerups/Placeholder.jpg",
        sound: "PowerupSounds/stab.mp3",
        effect: () => { bossDamage(), updateUI() }
    }
};


//Lade die Bilder für die Powerups
async function loadPowerupImages() {
    const allTypes = [...Object.values(POWERUP_TYPES), ...Object.values(EPICUP_TYPES), ...Object.values(CONSTUP_TYPES)];

    for (const type of allTypes) {
        type.imageObj = new Image();
        type.imageObj.src = type.image;
        await new Promise(resolve => {
            type.imageObj.onload = resolve;
        })
    }
}

async function loadShotSounds() {
    for (const soundPath of SHOT_SOUNDS) {
        try {
            const response = await fetch(soundPath);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await game.audioContext.decodeAudioData(arrayBuffer);
            game.shotSounds.push(audioBuffer);
        } catch (error) {
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

    // Bilder für Boss-Gesundheitsleiste laden Bg = Hintergrund Fw = Vordergrund
    game.bossHealthBarBg = new Image();
    game.bossHealthBarBg.src = 'BossImages/Boss-Bar-Bg.png';

    game.bossHealthBarFg = new Image();
    game.bossHealthBarFg.src = 'BossImages/Boss-Bar-Fg.png';

    //Highscoreliste
    document.getElementById('saveHighscoreBtn').addEventListener('click', saveHighscore);
    document.getElementById('backToMenuBtn').addEventListener('click', function () {
        document.getElementById('highscoreListScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'none';
        if (!gameOver) document.getElementById('OverScreen').style.display = 'none';
        if (game.isPaused) document.getElementById('pauseScreen').style.display = 'flex';
    });
    document.getElementById('showHighscoresFromPauseBtn')?.addEventListener('click', function () {
        document.getElementById('pauseScreen').style.display = 'none';
        showHighscoreList();
    });


    //Bild laden für Spieler
    game.player.image = new Image();
    game.player.image.src = 'Pictures/Player.png';

    //Bild laden für Gegner
    game.enemyImages = [
        'Pictures/Enemy.png',
        'Pictures/Enemy1.png', //oberste Reihe
        'Pictures/Enemy2.png',
        'Pictures/Enemy3.png',
        'Pictures/Enemy4.png',
        'Pictures/Enemy5.png',
        'Pictures/Enemy6.png',
        'Pictures/Enemy7.png',
        'Pictures/Enemy8.png',
        'Pictures/Enemy9.png',
        'Pictures/Enemy10.png',
    ].map(src => {
        const img = new Image();
        img.src = src;
        return img;
    });

    //minions
    game.minionImages = {
        normal: new Image(),
        fast: new Image(),
        tank: new Image()
    };

    game.minionImages.normal.src = 'Pictures/Enemy.png';
    game.minionImages.fast.src = 'Pictures/Enemy.png';
    game.minionImages.tank.src = 'Pictures/Enemy.png';


    //Epic/-PowerUPs
    game.timeSlowFactor = 1.0;
    game.bulletSpeed = 1.0;
    game.scoreMultiplier = 1;

    //Bilder laden für Powerups
    await loadPowerupImages();

    //Laden von Boss
    game.bossImages = {};
    for (const [key, boss] of Object.entries(BOSS_TYPES)) {
        game.bossImages[key] = {
            phase1: new Image(),
            phase2: new Image()
        };
        game.bossImages[key].phase1.src = boss.images.phase1;
        game.bossImages[key].phase2.src = boss.images.phase2;
    };

    //Laden der Kugeln vom Spieler (um sie mir irgendwann zu geben x.x(war nur Spaß))
    game.bulletImage = new Image();
    game.bulletImage.src = 'Pictures/playerShot.png';

    //Laden der Kugeln vom Gegner (um sie auf mich zu ballern yipieeeeeeeeeeeeee (Coden macht so viel Spaß)
    game.enemyBulletImages = {
        normal: new Image(),
        homing: new Image(),
        circle: new Image(),
        spiral: new Image(),
        burst: new Image(),
        laser: new Image()
    };
    game.enemyBulletImages.normal.src = 'EnemyBullets/EnemyShot.png';
    game.enemyBulletImages.homing.src = 'EnemyBullets/Star.png';
    game.enemyBulletImages.circle.src = 'EnemyBullets/Star.png';
    game.enemyBulletImages.spiral.src = 'EnemyBullets/Fireball2.png';
    game.enemyBulletImages.burst.src = 'EnemyBullets/Star.png';
    game.enemyBulletImages.laser.src = 'EnemyBullets/Star.png';
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

// Für die Sprintfunktion
let sprintActive = false;
let cooldownActive = false;
let sprintTimeout = null;
let cooldownInterval = null;
const SPRINT_DURATION = 5000; // 2000 = 2 Sekunden Sprintdauer
const COOLDOWN_DURATION = 1000; //5000 = 5 Sekunden Cooldown

function playPowerUpSound(soundPath) {
    const audio = new Audio(soundPath);
    audio.volume = PLAYER_HIT_VOLUME * 0.5;
    audio.play().catch(e => console.log("Fehler beim Powerupsound laden", e));
}

function updateSprintStatus() {
    const statusElement = document.getElementById('sprintCooldown');

    if (sprintActive) {
        statusElement.textContent = "Sprint aktiv!";
        statusElement.style.color = "#FFC107"; // Gelb
    }
    else if (cooldownActive) {
        const remaining = Math.ceil((cooldownEndTime - Date.now()) / 1000);
        statusElement.textContent = `Cooldown: ${remaining}s`;
        statusElement.style.color = "#F44336"; // Rot
    }
    else {
        statusElement.textContent = "Sprint verfügbar!";
        statusElement.style.color = "#4CAF50"; // Grün
    }
}

function startSprint() {
    if (cooldownActive) return;

    sprintActive = true;
    game.player.speed = 5; // Sprintgeschwindigkeit
    updateSprintStatus();

    // Sprint nach 2 Sekunden automatisch beenden
    sprintTimeout = setTimeout(() => {
        endSprint();
    }, SPRINT_DURATION);
}

function endSprint() {
    sprintActive = false;
    cooldownActive = true;
    game.player.speed = 2.5; // Normale Geschwindigkeit

    // Cooldown-Zeit setzen
    cooldownEndTime = Date.now() + COOLDOWN_DURATION;
    updateSprintStatus();

    // Cooldown-Überwachung starten
    cooldownInterval = setInterval(() => {
        if (Date.now() >= cooldownEndTime) {
            clearInterval(cooldownInterval);
            cooldownActive = false;
            updateSprintStatus();
        } else {
            updateSprintStatus();
        }
    }, 100);
}

function setupControls() {
    // Initialen Status setzen
    updateSprintStatus();

    document.addEventListener('keydown', (e) => {
        // Bewegung und Schießen
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') game.player.isMovingLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') game.player.isMovingRight = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') game.player.isMovingUp = true;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') game.player.isMovingDown = true;
        if (e.key === ' ') game.player.isShooting = true;

        // Sprintfunktion (nur wenn verfügbar)
        if (e.key === 'Shift' && !sprintActive && !cooldownActive) {
            startSprint();
        }
    });

    document.addEventListener('keyup', (e) => {
        // Bewegung und Schießen
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === "A") game.player.isMovingLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === "D") game.player.isMovingRight = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') game.player.isMovingUp = false;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') game.player.isMovingDown = false;
        if (e.key === ' ') game.player.isShooting = false;

        // Sprint vorzeitig beenden (optional)
        if (e.key === 'Shift' && sprintActive) {
            clearTimeout(sprintTimeout);
            endSprint();
        }
    });

    // Reset bei Fensterwechsel
    window.addEventListener('blur', () => {
        if (sprintActive || cooldownActive) {
            clearTimeout(sprintTimeout);
            clearInterval(cooldownInterval);
            sprintActive = false;
            cooldownActive = false;
            game.player.speed = 2.5;
            updateSprintStatus();
        }
    });
}



//Pause Screen
function togglePause() {
    game.isPaused = !game.isPaused;
    const pauseScreen = document.getElementById('pauseScreen');

    //Pause Aktivieren/Deaktivieren
    if (game.isPaused) {
        pauseScreen.style.display = "flex";
        game.pauseTime = Date.now();
    } else {
        pauseScreen.style.display = "none";
        if (!bgMusic.paused && !game.boss) bgMusic.play();
        if (!bossTrack.paused) bossTrack.play();
        game.lastShotTime += Date.now() - game.pauseTime;
        requestAnimationFrame(gameLoop);
    }

    game.canvas.classList.toggle("paused", game.isPaused);
}


document.addEventListener('keydown', (e) => {
    // Prüfen, ob die Bestenliste angezeigt wird
    const highscoreScreen = document.getElementById('highscoreListScreen');
    const isHighscoreVisible = highscoreScreen && highscoreScreen.style.display !== 'none';

    // Wenn die Bestenliste sichtbar ist, keine Pausierung erlauben
    if (isHighscoreVisible) return;

    //Bei Escape oder P drücken in den Pause Modus wechseln
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

    BOSS_HIT_VOLUME = parseFloat(e.target.value);
    BOSS_DEATH_VOLUME = parseFloat(e.target.value);
    BOSS_ATTACK_VOLUME = parseFloat(e.target.value);


    playerHitSound.volume = PLAYER_HIT_VOLUME;
    playerShieldHitSound.volume = PLAYER_HIT_VOLUME;
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

    PLAYER_HIT_VOLUME = savedSfxVol;
    PLAYER_SHOT_VOLUME = savedSfxVol;
    ENEMY_HIT_VOLUME = savedSfxVol;
    ENEMY_DEATH_VOLUME = savedSfxVol;
    GAME_OVER_VOLUME = savedSfxVol;

    BOSS_HIT_VOLUME = savedSfxVol;
    BOSS_ATTACK_VOLUME = savedSfxVol;
    BOSS_DEATH_VOLUME = savedSfxVol;

    playerHitSound.volume = PLAYER_HIT_VOLUME;
    playerShieldHitSound.volume = PLAYER_HIT_VOLUME;
    enemyHitSound.volume = ENEMY_HIT_VOLUME;
    enemyDeathSound.volume = ENEMY_DEATH_VOLUME;
    gameOverSound.volume = GAME_OVER_VOLUME;

    bgMusic.volume = savedMusicVol;
    bossTrack.volume = savedMusicVol;

    bossHitSound.volume = BOSS_HIT_VOLUME;
    bossAttackSound.volume = BOSS_ATTACK_VOLUME;
    bossDeathSound.volume = BOSS_DEATH_VOLUME;
});

const playerHitSound = document.getElementById("playerHitSound");
const playerShieldHitSound = document.getElementById("playerHitSound");
const enemyHitSound = document.getElementById("enemyHitSound");
const enemyDeathSound = document.getElementById("enemyDeathSound");
const gameOverSound = document.getElementById("gameOverSound");

const bossHitSound = document.getElementById("bossHitSound");
const bossDeathSound = document.getElementById("bossDeathSound");
const bossAttackSound = document.getElementById("bossAttackSound");

// SOUND-FUNKTIONEN
function playEnemyHitSound() {
    enemyHitSound.currentTime = 0;
    enemyHitSound.volume = ENEMY_HIT_VOLUME * 0.1;
    enemyHitSound.play().catch(e => console.log("Hit-Sound fehlgeschlagen:", e));
}

function playPlayerHitSound() {
    playerHitSound.currentTime = 0;
    playerHitSound.volume = PLAYER_HIT_VOLUME;
    playerHitSound.play().catch(e => console.log("Hit-Sound fehlgeschlagen:", e));
}

function playPlayerShieldHitSound() {
    playerShieldHitSound.currentTime = 0;
    playerShieldHitSound.volume = PLAYER_HIT_VOLUME;
    playerShieldHitSound.play().catch(e => console.log("Hit-Sound fehlgeschlagen:", e));
}



function playEnemyDeathSound() {
    enemyDeathSound.currentTime = 0;
    enemyDeathSound.volume = ENEMY_DEATH_VOLUME * 0.07;
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
    if (game.level % 15 === 0) {
        spawnBoss();
        bossTrack.play();
        bgMusic.pause();
        game.bossIntro = true;
    } else {
        bossTrack.pause();
        bgMusic.play();
        updateRows();
        // Create enemy formation
        const enemyWidth = 40;
        const enemyHeight = 30;
        const spacing = 50;
        const startX = (game.canvas.width - (ENEMY_COLS * spacing)) / 2;

        if (ENEMY_ROWS > 0) {
            for (let row = 0; row < ENEMY_ROWS; row++) {
                for (let col = 0; col < ENEMY_COLS; col++) {
                    game.enemies.push({
                        x: startX + col * spacing,
                        y: 50 + row * spacing,
                        width: enemyWidth,
                        height: enemyHeight,
                        color: getEnemyColor(row),
                        health: Math.floor(1 + (game.level / 3)), //Enemy health
                        shootCooldown: Math.floor(Math.random() * 100)
                    });
                }
            }
        }

        game.enemyIntro = true;
        game.enemyIntroTimer = 120; // 2 Sekunden bei 60 FPS

        // Startposition seitlich außerhalb
            const side = Math.floor(Math.random() * 6);
            let testR = 100;
            let testL = -600;
        // Startpositionen für Gegner setzen (oben außerhalb des Bildschirms)
        for (const enemy of game.enemies) {
            testR += 50;
            testL += 50;
            enemy.startX = side === 0 
                ? enemy.x - game.canvas.width:
                side === 1 ?
                game.canvas.width + enemy.x:
                side === 2 ?
                game.canvas.width - enemy.x:
                side === 3 ?
                testR + 100:
                side === 4 ?
                testL:
                game.canvas.width - enemy.y;
            
            // Zielposition (ursprüngliche Formation)
            enemy.targetX = enemy.x;
            enemy.targetY = enemy.y;
            
            // Start-Y-Position selbe
            enemy.startY = enemy.y;
            
            // Aktuelle Position setzen
            enemy.x = enemy.startX;
            enemy.y = enemy.startY;
            
            // Bewegungsparameter
            enemy.directionX = (enemy.targetX - enemy.startX) / 120;
            enemy.directionY = (enemy.targetY - enemy.startY) / 120;
            enemy.speedFactor = 1; 
        }
    }

    // Increase enemy speed slightly each level
    if (game.enemySpeed < 1) {
        game.enemySpeed = 0.5 + (game.level * 0.1);
    }

    // Update UI
    updateUI();
}

function spawnBoss() {
    const bossTypes = Object.entries(BOSS_TYPES);
    const [typeKey, type] = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    game.boss = {
        ...type,
        typeKey,
        x: game.canvas.width / 2 - type.width / 2,
        y: -150, // Starte außerhalb des Bildschirms
        health: type.health * Math.floor(game.level / 15),
        maxHealth: type.health * Math.floor(game.level / 15),
        attackCooldown: 100,
        phase: 1,
        direction: 1,
        currentAttackPattern: type.attackPatterns.phase1[
            Math.floor(Math.random() * type.attackPatterns.phase1.length)
        ]
    };

    // Starte den Boss-Intro
    game.bossIntro = true;
    game.bossIntroTimer = 240; // 120 = 2 Sekunden bei 60 FPS
    game.bossName = type.name;

    // Startposition für die Animation
    const startY = -150;
    const targetY = 100;

    // Erstelle die Animationskurve
    game.bossEntryAnimation = {
        startY: startY,
        targetY: targetY,
        currentY: startY,
        duration: 240, // 120 = 2 Sekunden
        progress: 0,
        // Benutze eine Beschleunigungsfunktion für einen smoothen Effekt
        ease: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    };

    // Setze die Boss-Position
    game.boss.y = startY;
}

// Füge diese Funktion hinzu
function drawBossIntro() {
    if (!game.bossIntro) return;

    // Zeichne den Namensstreifen
    const barHeight = 50;
    const barY = 20;

    // Hintergrund mit Transparenz
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    game.ctx.fillRect(0, barY, game.canvas.width, barHeight);

    // Roter Akzent
    game.ctx.fillStyle = '#FF0000';
    game.ctx.fillRect(0, barY, game.canvas.width, 5);
    game.ctx.fillRect(0, barY + barHeight - 5, game.canvas.width, 5);

    // Text "BOSS"
    game.ctx.fillStyle = '#FF0000';
    game.ctx.font = 'bold 24px "Press Start 2P", Arial, sans-serif';
    game.ctx.textAlign = 'center';
    game.ctx.fillText('BOSS', game.canvas.width / 2, barY + 25);

    // Boss-Name
    game.ctx.fillStyle = '#FFFFFF';
    game.ctx.font = 'bold 20px "Press Start 2P", Arial, sans-serif';
    game.ctx.fillText(game.bossName, game.canvas.width / 2, barY + 55);
}

function spawnMinions() {
    const minionCount = 2 + Math.floor(game.level / 15);
    const minionTypes = ["normal", "fast", "tank"];
    const minionWidth = 30;
    const minionHeight = 30;
    const maxY = game.canvas.height - minionHeight - 10;
    const spawnY = Math.min(game.boss.y + game.boss.height, maxY);

    for (let i = 0; i < minionCount; i++) {
        const type = minionTypes[Math.floor(Math.random() * minionTypes.length)];
        let validPosition = false;
        let attempts = 0;
        let newMinion;

        // Versuche eine freie Position zu finden
        while (!validPosition && attempts < 20) {
            attempts++;
            newMinion = {
                x: game.boss.x + Math.random() * (game.boss.width - minionWidth),
                y: spawnY,
                width: minionWidth,
                height: minionHeight,
                color: type === "tank" ? "#FF0000" : type === "fast" ? "#00FF00" : "#FFFF00",
                health: type === "tank" ? Math.floor(game.level / 5) : 1,
                speed: type === "fast" ? 1.5 : 1,
                type: type,
                direction: Math.random() > 0.5 ? 1 : -1,
                isMinion: true,
                shootCooldown: 0
            };

            // Prüfe Kollision mit bestehenden Minions
            validPosition = true;
            for (const existingMinion of game.enemies) {
                if (existingMinion.isMinion && checkMinionCollision(newMinion, existingMinion)) {
                    validPosition = false;
                    break;
                }
            }
        }

        if (validPosition) {
            game.enemies.push(newMinion);
        }
    }
}

// Spezielle Kollisionsprüfung für Minions mit Pufferbereich
function checkMinionCollision(minion1, minion2) {
    const padding = 5; // Pufferbereich um Minions
    return (
        minion1.x < minion2.x + minion2.width + padding &&
        minion1.x + minion1.width + padding > minion2.x &&
        minion1.y < minion2.y + minion2.height + padding &&
        minion1.y + minion1.height + padding > minion2.y
    );
}

function updateRows() {

    ENEMY_ROWS = 2 + Math.floor(Math.random() * game.level);

    if (ENEMY_ROWS > 6) ENEMY_ROWS = 6;
    if (ENEMY_ROWS < 1) ENEMY_ROWS = 1;
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
    if (game.boss) updateBoss();
    updateMinions();
    updatePowerUps();
    updateEpicUps();
    updateConstUps();
    checkCollisions();
    updateRows();
    caplives();
    capShields();

    // Draw everything
    drawPlayer();
    drawBullets();
    if (game.boss) {
        drawBoss();
        if (game.bossIntro) {
            drawBossIntro();
        }
    }
    drawEnemies();
    drawPowerUps();
    drawEpicUps();
    drawConstUps();
    drawUI();

    // Check for level completion
    if (game.boss) {
        //game.enemies = [];
    } else if (game.enemies.length === 0) {
        game.level++;
        //game.lives++;
        startLevel();
    }

    //Ab Level 5 mehr Leben für Gegner


    requestAnimationFrame(gameLoop);
}

// Update Player
let ConstDamage = game.player.damage;

function bossDamage() {
    ConstDamage += 2;
}

function updatePlayer() {
    // Movement
    if (game.player.isMovingLeft && game.player.x > 0) {
        game.player.x -= game.player.speed;
    }
    if (game.player.isMovingRight && game.player.x < game.canvas.width - game.player.width) {
        game.player.x += game.player.speed;
    }
    if (game.player.isMovingUp && game.player.y > (game.canvas.height / 1.4)) {
        game.player.y -= game.player.speed;
    }
    if (game.player.isMovingDown && game.player.y < game.canvas.height - game.player.height) {
        game.player.y += game.player.speed;
    }

    // Powerups verarbeiten
    for (let i = game.player.powerUps.length - 1; i >= 0; i--) {
        game.player.powerUps[i].timer--;
        if (game.player.powerUps[i].timer <= 0) {
            const type = game.player.powerUps[i].type;

            if (type.name === "Shield") {
                game.player.shieldCount--;
                game.player.shieldCount = Math.max(0, game.player.shieldCount);
            }

            game.player.powerUps.splice(i, 1);

            // Prüfe ob noch andere PowerUps des gleichen Typs aktiv sind
            const sameTypeActive = game.player.powerUps.some(p => p.type.name === type.name);
            if (!sameTypeActive) {
                resetPowerUpEffect(type);
            }
        }
    }

    // EpicUps verarbeiten
    for (let i = game.player.epicUps.length - 1; i >= 0; i--) {
        game.player.epicUps[i].timer--;
        if (game.player.epicUps[i].timer <= 0) {
            const type = game.player.epicUps[i].type;
            game.player.epicUps.splice(i, 1);

            // Prüfe ob noch andere EpicUps des gleichen Typs aktiv sind
            const sameTypeActive = game.player.epicUps.some(e => e.type.name === type.name);
            if (!sameTypeActive) {
                resetEpicUpEffect(type);
            }
        }
    }
    // Update Player damage
    if (game.player.canonActive) {
        game.player.damage = ConstDamage + 5;
    }else {
        game.player.damage = ConstDamage;
    }

    updateUI();

    if (game.player.luckActive) {
        EPICPOWER_CHANCE = 0.15;
        POWERUP_CHANCE = 0.01;
    } else {
        EPICPOWER_CHANCE = 0.01;//here
        POWERUP_CHANCE = 0.15//You can change the Power and Epicup Chance
    }

    if (game.player.isShooting) {
        shoot();
    }



}

//capShields
function capShields() {
    if (game.player.shieldCount > 3) {
        game.player.shieldCount = 3;
        updateUI();
    }
}

//caps lives at 5
function caplives() {
    if (game.lives > 5) {
        game.lives = 5;
        updateUI();
    }
}

// Shoot Bullet
function shoot() {
    const now = Date.now();
    const fireRate = (game.player.rapidfire) ? 100 : 300;


    if (now - game.lastShotTime > fireRate) {
        //sound
        playRandomShotSound();
        if (game.player.laserActive === true) {
            game.bullets.push(createBullet(game.player.x + 5, 0.8));
            game.bullets.push(createBullet(game.player.x + game.player.width / 2 - 2, 0));
            game.bullets.push(createBullet(game.player.x + game.player.width - 9, -0.8));
        }
        else {
            game.bullets.push(createBullet(game.player.x + game.player.width / 2 - 2, 0));
        }
        game.lastShotTime = now;
    }
}

function createBullet(x, spread) {
    return {
        x: x - 10,
        y: game.player.y,
        spread: spread,
        width: 30,  // An Bildgröße anpassen
        height: 20, // An Bildgröße anpassen
        speed: 8,
        color: game.player.powerUps?.color || "#FFFF00",
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

        if (bullet.isHoming) {
            const dx = game.player.x + game.player.width / 2 - bullet.x;
            const dy = game.player.y + game.player.height / 2 - bullet.y;
            if (game.canvas.height / 1.7 > bullet.y) {
                bullet.angle = Math.atan2(dy, dx);
            }

            bullet.x += Math.cos(bullet.angle) * bullet.speed * game.timeSlowFactor * game.bulletSpeed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed * game.timeSlowFactor * game.bulletSpeed;
        }
        // Bewegung mit Winkel
        else if (bullet.angle !== undefined) {
            bullet.x += Math.cos(bullet.angle) * bullet.speed * game.timeSlowFactor * game.bulletSpeed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed * game.timeSlowFactor * game.bulletSpeed;
        }
        // Standardbewegung nach unten
        else {
            bullet.y += bullet.speed * game.timeSlowFactor * game.bulletSpeed;
        }

        // Remove if off screen
        if (bullet.y > game.canvas.height) {
            game.enemyBullets.splice(i, 1);
        }
    }
}

// Update Enemies
function updateEnemies() {
    if (game.boss) return; // Frühzeitig zurückkehren wenn Boss aktiv

    if (game.enemyIntro && game.enemyIntroTimer === 120) {
    const flySound = new Audio("BossSounds/BossAttack.mp3");
    flySound.volume = PLAYER_HIT_VOLUME;
    flySound.play();
    }


    if (game.enemyIntro) {
        game.enemyIntroTimer--;

        // Aktualisiere den Fortschritt der Animation 0 am Anfang, 1 am Ende
        for (const enemy of game.enemies) {
            //von Start zu Ziel
            enemy.x += enemy.directionX * enemy.speedFactor;
            enemy.y += enemy.directionY * enemy.speedFactor;
        }

        // Beende die Animation
        if (game.enemyIntroTimer <= 0) {
            game.enemyIntro = false;
            for (const enemy of game.enemies) {
                enemy.x = enemy.targetX;
                enemy.y = enemy.targetY;
            }
        }
        return; // Keine weiteren Updates während der Animation
    }

    let changeDirection = false;

    // Nur normale Gegner bewegen
    for (const enemy of game.enemies) {
        if (enemy.isMinion) continue;

        enemy.x += game.enemyDirection * game.enemySpeed * game.timeSlowFactor;

        // Randkollision prüfen
        if (enemy.x <= 0 || enemy.x + enemy.width >= game.canvas.width) {
            changeDirection = true;
        }

        // Schusslogik
        if (enemy.shootCooldown <= 0 && Math.random() < 0.003) {
            game.enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 2,
                y: enemy.y + enemy.height,
                width: 30,
                height: 20,
                speed: 4,
                color: "#FF5555"
            });
            enemy.shootCooldown = 50 + Math.floor(Math.random() * 50);
        } else {
            enemy.shootCooldown--;
        }
    }

    // Richtungswechsel bei Bedarf
    if (changeDirection) {
        game.enemyDirection *= -1;
        for (const enemy of game.enemies) {
            if (enemy.isMinion) continue;

            enemy.y += 20;

            // Spielende prüfen
            if (enemy.y + enemy.height > game.canvas.height - 20) {
                gameOver();
                return;
            }
        }
    }

    // Minions separat aktualisieren
    updateMinions();
}

function updateMinions() {
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        if (!enemy.isMinion) continue;


        // Bewegung nach unten
        enemy.y += enemy.speed * game.timeSlowFactor * 0.2;
        //seitliche Bewegung
        enemy.x += enemy.direction * game.enemySpeed * game.timeSlowFactor;

        if (enemy.x <= 0) {
            enemy.x = 0;
            enemy.direction = 1;
        } else if (enemy.x + enemy.width >= game.canvas.width) {
            enemy.x = game.canvas.width - enemy.width;
            enemy.direction = -1;
        }

        // Schießen
        if (enemy.shootCooldown <= 0 && Math.random() < 0.002) {
            game.enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 2,
                y: enemy.y + enemy.height,
                width: 20,
                height: 20,
                speed: 4,
                color: enemy.color
            });
            enemy.shootCooldown = 100 / enemy.speed;
        } else {
            enemy.shootCooldown--;
        }

        // Entfernen wenn außerhalb des Bildschirms
        if (enemy.y > game.canvas.height + 50) {
            game.enemies.splice(i, 1);
        }
    }
}

function waveAttack() {
    for (let i = 0; i < 7; i++) {
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 30,
            height: 50,
            speed: 5,
            imageType: 'normal'
        });
    }
}

// Homing-Angriff
function homingAttack() {
    const playerX = game.player.x + game.player.width / 2;
    const playerY = game.player.y + game.player.height / 2;

    for (let i = 0; i < 5; i++) {
        const dx = playerX - (game.boss.x + game.boss.width / 2);
        const dy = playerY - (game.boss.y + game.boss.height);
        const angle = Math.atan2(dy, dx);

        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height - 20,
            width: 30,
            height: 30,
            speed: 2,
            angle: angle,
            isHoming: true,
            imageType: 'homing'
        });
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height - 10,
            width: 40,
            height: 40,
            speed: 2.1,
            angle: angle,
            isHoming: true,
            imageType: 'homing'
        });
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 50,
            height: 50,
            speed: 2.2,
            angle: angle,
            isHoming: true,
            imageType: 'homing'
        });
    }
}

// Neues Angriffsmuster
function circleAttack() {
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 20,
            height: 20,
            speed: 3,
            angle: angle,
            imageType: 'circle'
        });
    }
    setTimeout(() => {
    for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * Math.PI * 2;
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 20,
            height: 20,
            speed: 2.5,
            angle: angle,
            imageType: 'circle'
        });
    }}, 100);
    setTimeout(() => {
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 20,
            height: 20,
            speed: 2.5,
            angle: angle,
            imageType: 'circle'
        });
    }}, 500);
}

function spiralAttack() {
    for (let i = 0; i < 15; i++) {
        game.enemyBullets.push({
            x: Math.random() * game.canvas.width - 250,
            y: -100,
            width: 40,
            height: 30,
            speed: 1 + Math.random() * 3,
            angle: 1 + Math.random() * 0.5,
            imageType: 'spiral'
        });
    }
}

function burstAttack() {
    const angles = [2, 1.7, 1.5, 1.3, 1];
    for (const angle of angles) {
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 20,
            height: 20,
            speed: 4,
            angle: angle,
            imageType: 'burst'
        });
    }
}

function laserAttack() {
    // Platzhalter für Laser-Angriff
    for (let i = 0; i < 3; i++) {
        game.enemyBullets.push({
            x: game.boss.x + game.boss.width / 2,
            y: game.boss.y + game.boss.height,
            width: 10,
            height: 40,
            speed: 6,
            color: "#FF0000",
            imageType: 'laser'
        });
    }
}

// Cooldown je nach Angriffsmuster
function getCooldownForPattern(pattern) {
    const cooldowns = {
        wave: Math.floor(Math.random() * 100) + 200,
        homing: Math.floor(Math.random() * 100) + 400,
        circle: Math.floor(Math.random() * 100) + 350,
        spiral: Math.floor(Math.random() * 100) + 250,
        burst: Math.floor(Math.random() * 100) + 300,
        laser: Math.floor(Math.random() * 100) + 10,
        spawn: 400
    };
    return cooldowns[pattern] || 300;
}




let cooldown2 = 450;
//Updatet den Boss
function updateBoss() {
    if (!game.boss) return;

    // Boss-Intro Animation
    if (game.bossIntro) {
        game.bossIntroTimer--;

        // Update der Einflug-Animation
        if (game.bossEntryAnimation) {
            game.bossEntryAnimation.progress = Math.min(
                game.bossEntryAnimation.progress + 1 / game.bossEntryAnimation.duration,
                1
            );

            const easedProgress = game.bossEntryAnimation.ease(game.bossEntryAnimation.progress);
            game.boss.y = game.bossEntryAnimation.startY +
                (game.bossEntryAnimation.targetY - game.bossEntryAnimation.startY) * easedProgress;
        }

        // Ende des Intros
        if (game.bossIntroTimer <= 0) {
            game.bossIntro = false;
            game.bossEntryAnimation = null;
        }
        return; // Keine weiteren Updates während des Intros
    }
    if (game.boss) {
        // Bewegungsgeschwindigkeit
        const BOSS_SPEED = 2;
        // Boss-Breite berücksichtigen
        const bossWidth = game.boss.width;
        // Update Boss Position
        game.boss.x += BOSS_SPEED * game.boss.direction * game.timeSlowFactor;

        // Richtung umkehren bei Randberührung
        if (game.boss.x <= 0) {
            game.boss.x = 0;
            game.boss.direction = 1; // Nach rechts bewegen
        }
        if (game.boss.x + bossWidth >= game.canvas.width) {
            game.boss.x = game.canvas.width - bossWidth;
            game.boss.direction = -1; // Nach links bewegen
        }
    }

    //Phasenwechsel bei 50% Leben
    if (game.boss.health < game.boss.maxHealth / 2 && game.boss.phase === 1) {
        game.boss.phase = 2;
        // Neues zufälliges Muster für Phase 2
        game.boss.currentAttackPattern = BOSS_TYPES[game.boss.typeKey].attackPatterns.phase2[
            Math.floor(Math.random() * BOSS_TYPES[game.boss.typeKey].attackPatterns.phase2.length)
        ];
    }

    //Angriffslogik
    if (game.boss.attackCooldown <= 0) {
        bossAttackSound.play();
        game.boss.attackCooldown = getCooldownForPattern(game.boss.currentAttackPattern);

        switch (game.boss.currentAttackPattern) {
            case "wave":
                waveAttack();
                break;
            case "homing":
                homingAttack();
                break;
            case "circle":
                circleAttack();
                break;
            case "spiral":
                spiralAttack();
                break;
            case "burst":
                burstAttack();
                break;
            case "laser":
                laserAttack();
                break;
            case "spawn":
                spawnMinions();
                break;
        }
    } else {
        game.boss.attackCooldown--;
    }

    if (game.boss.phase === 2 && Math.random() < 0.01) {
        spawnMinions();
    }
}


// Update Power-Ups
function updatePowerUps() {
    for (let i = game.powerUps.length - 1; i >= 0; i--) {
        const powerUp = game.powerUps[i];

        // Magnet-Anziehung
        if (game.player.isMagnetic) {
            const dx = game.player.x + game.player.width / 2 - (powerUp.x + powerUp.width / 2);
            const dy = game.player.y + game.player.height / 2 - (powerUp.y + powerUp.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) { // Anziehungsradius
                const speed = 5;
                powerUp.x += (dx / distance) * speed;
                powerUp.y += (dy / distance) * speed;
            }
        }
        powerUp.y += 2 * game.timeSlowFactor;

        //remove if offscreen
        if (powerUp.y > game.canvas.height) {
            game.powerUps.splice(i, 1);
        }
    }
}

function updateEpicUps() {
    for (let i = game.epicUps.length - 1; i >= 0; i--) {
        const epicUp = game.epicUps[i];

        // Magnet-Anziehung für EpicUps
        if (game.player.isMagnetic) {
            const dx = game.player.x + game.player.width / 2 - (epicUp.x + epicUp.width / 2);
            const dy = game.player.y + game.player.height / 2 - (epicUp.y + epicUp.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                const speed = 5;
                epicUp.x += (dx / distance) * speed;
                epicUp.y += (dy / distance) * speed;
            }
        }

        epicUp.y += 2 * game.timeSlowFactor;

        if (epicUp.y > game.canvas.height) {
            game.epicUps.splice(i, 1);
        }
    }
}

function updateConstUps() {
    for (let i = game.constUps.length - 1; i >= 0; i--) {
        game.constUps[i].y += 2;
        if (game.constUps[i].y > game.canvas.height) {
            game.constUps.splice(i, 1);
        }
    }
}

// Check Collisions
function checkCollisions() {
    // Spieler Kugeln gegen Boss
    if (game.boss && !game.bossIntro) { // Nur Kollisionen prüfen, wenn Intro beendet
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            if (checkCollision(game.bullets[i], game.boss)) {
                game.boss.health -= game.player.damage;
                //Sound für Bosshit
                bossHitSound.currentTime = 0;
                bossHitSound.play().catch(e => console.log("Boss hit Sound Error"));

                if (game.boss.health <= 0) {
                    //Sound für Bossdeath
                    bossDeathSound.currentTime = 0;
                    bossDeathSound.play().catch(e => console.log("Boss death Sound Error"));
                    game.score += 1000 * Math.floor(game.level / 15) * (game.scoreMultiplier || 1);
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
    if (!game.enemyIntro) {
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
                        } else if (Math.random() < EPICPOWER_CHANCE) {
                            spawnEpicUp(game.enemies[j].x + game.enemies[j].width / 2, game.enemies[j].y);
                        }

                        game.score += (game.level * 1) * (game.scoreMultiplier || 1);
                        game.enemies.splice(j, 1);
                        updateUI();
                    }

                    if (!game.player.piercingShot) {
                        game.bullets.splice(i, 1);
                    }
                    break;
                }
            }
        }
    }

    // Enemy bullets vs player
    for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
        if (checkCollision(game.enemyBullets[i], game.player)) {
            if (game.player.shieldCount <= 0) {
                playPlayerHitSound();
                game.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
                game.lives--;
                updateUI();

                if (game.lives <= 0) {
                    playGameOverSound();
                    gameOver();
                    return;
                }
            } else {
                playPlayerShieldHitSound();
                game.player.shieldCount--;
                game.enemyBullets.splice(i, 1);
            }
            game.enemyBullets.splice(i, 1);
        }
    }

    // Power-ups vs player
    for (let i = game.powerUps.length - 1; i >= 0; i--) {
        if (checkCollision(game.powerUps[i], game.player)) {
            activatePowerUp(game.powerUps[i].type);
            playPowerUpSound(game.powerUps[i].type.sound);
            game.powerUps.splice(i, 1);
        }
    }

    // Epic-ups vs player
    for (let i = game.epicUps.length - 1; i >= 0; i--) {
        if (checkCollision(game.epicUps[i], game.player)) {
            activateEpicUp(game.epicUps[i].epictype);
            playPowerUpSound(game.epicUps[i].epictype.sound);
            game.epicUps.splice(i, 1);
        }
    }

    // Const ups vs players
    for (let i = game.constUps.length - 1; i >= 0; i--) {
        if (checkCollision(game.constUps[i], game.player)) {
            activateConstUp(game.constUps[i].constType);
            playPowerUpSound(game.constUps[i].constType.sound);
            game.constUps.splice(i, 1);
        }
    }

    for (let i = game.enemies.length - 1; i >= 0; i--) {
        if (checkCollision(game.enemies[i], game.player)) {
            gameOver();
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

function spawnConstUp(x, y) {
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
    //Push das nächste Powerup
    const existingIndex = game.player.powerUps.findIndex(p => p.type.name === type.name);

    if (existingIndex !== -1) {
        // Verlängere die Dauer des bestehenden Powerups
        game.player.powerUps[existingIndex].timer = type.duration;
    } else {
        // Füge ein neues Powerup hinzu
        game.player.powerUps.push({
            type: type,
            timer: type.duration
        });
    }

    type.effect(game.player);
}

function activateEpicUp(epictype) {
    //Push das nächste Epicup
    const existingIndex = game.player.epicUps.findIndex(e => e.type.name === epictype.name);

    if (existingIndex !== -1) {
        game.player.epicUps[existingIndex].timer = epictype.duration;
    } else {
        game.player.epicUps.push({
            type: epictype,
            timer: epictype.duration
        });
    }

    epictype.effect(game.player);
}

function activateConstUp(constType) {
    constType.effect(game.player);
}

function resetPowerUpEffect(type) {
    switch (type.name) {
        case "Rapid Fire":
            if (!game.player.powerUps.some(p => p.type.name === "Rapid Fire")) {
                game.player.rapidfire = false;
            }
            break;
        case "Shield":
            if (!game.player.powerUps.some(p => p.type.name === "Shield")) {

            }
            break;
        case "Laser":
            if (!game.player.powerUps.some(p => p.type.name === "Laser")) {
                game.player.laserActive = false;
            }
            break;
        case "Canon":
            if (!game.player.powerUps.some(p => p.type.name === "Canon")) {
                game.player.canonActive = false;
            }
            break;
        case "LuckUp":
            if (!game.player.powerUps.some(p => p.type.name === "LuckUp")) {
                game.player.luckActive = false;
            }
            break;
        case "Magnet":
            if (!game.player.powerUps.some(p => p.type.name === "Magnet")) {
                game.player.isMagnetic = false;
            }
            break;
        case "Score x2":
            if (!game.player.powerUps.some(p => p.type.name === "Score x2")) {
                game.scoreMultiplier = 1;
            }
            break;
        case "Piercing Shot":
            if (!game.player.powerUps.some(p => p.type.name === "Piercing Shot")) {
                game.player.piercingShot = false;
            }
            break;
        case "Slowness":
            if (!game.player.powerUps.some(p => p.type.name === "Slowness")) {
                game.timeSlowFactor = 1.0;
                game.bulletSpeed = 1.0;
            }
            break;
    }
}

function resetEpicUpEffect(type) {
    if (type.name === "AllTheUps") {
        if (!game.player.epicUps.some(e => e.type.name === "AllTheUps")) {
            game.player.laserActive = false;
            game.player.canonActive = false;
            game.player.rapidfire = false;
        }
    }
    if (type.name === "Slowness") {
        if (!game.player.epicUps.some(e => e.type.name === "Slowness")) {
            game.timeSlowFactor = 1.0;
            game.bulletSpeed = 1.0;
        }
    }
}

// Draw Functions
function drawPlayer() {

    const shieldCount = game.player.powerUps.filter(p => p.type.name === "Shield").length;
    if (shieldCount > 0) {
        for (let i = 1; i < shieldCount; i++) {
            const size = game.player.width * (0.8 + i * 0.1);
            game.ctx.strokeStyle = `rgba(51, 102, 255, ${1 - i * 0.3})`;
            game.ctx.lineWidth = 2 + i;
            game.ctx.beginPath();
            game.ctx.arc(
                game.player.x + game.player.width / 2,
                game.player.y + game.player.height / 2,
                size,
                0,
                Math.PI * 2
            );
            game.ctx.stroke();
        }
    }

    // Draw shield if active
    if (game.player.shieldCount > 0) {
        for (let i = 0; i < game.player.shieldCount; i++) {
            const size = game.player.width * (0.7 + i * 0.1);
            game.ctx.strokeStyle = `rgba(51, 102, 255, ${1 - i * 0.4})`;
            game.ctx.lineWidth = 2 + i;
            game.ctx.beginPath();
            game.ctx.arc(
                game.player.x + game.player.width / 2,
                game.player.y + game.player.height / 2,
                size,
                0,
                Math.PI * 2
            );
            game.ctx.stroke();
        }
    }

    if (game.player.image.complete) {
        //Bild erstellen
        game.ctx.drawImage(
            game.player.image,
            game.player.x,
            game.player.y,
            game.player.width,
            game.player.height
        );
    } else {
        game.ctx.fillStyle = "#00FF00";
        game.ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    }
}

function drawBullets() {
    //Player Bullets
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


    // Enemy bullets
    for (const bullet of game.enemyBullets) {
        let img;

        // Wähle Bild basierend auf dem imageType
        if (bullet.imageType && game.enemyBulletImages[bullet.imageType]) {
            img = game.enemyBulletImages[bullet.imageType];
        } else if (bullet.isHoming) {
            img = game.enemyBulletImages.homing;
        } else {
            img = game.enemyBulletImages.normal;
        }

        if (bullet.imageType === 'laser') {
            // Laser-Streifen-Effekt
            game.ctx.globalAlpha = 0.7;
            game.ctx.fillStyle = "#FF0000";
            game.ctx.fillRect(bullet.x - 5, bullet.y, bullet.width + 10, bullet.height);
            game.ctx.globalAlpha = 1.0;
        }

        if (img && img.complete) {
            game.ctx.drawImage(
                img,
                bullet.x,
                bullet.y,
                bullet.width,
                bullet.height
            );
        } else {
            game.ctx.fillStyle = bullet.color || "#FF5555";
            game.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
}

function drawEnemies() {

    for (const enemy of game.enemies) {

        /*Einfluganimation gegner
        if (game.enemyIntro) {
            game.ctx.globalAlpha = 0.3;
            game.ctx.fillStyle = "red";
            for (let i = 0; i < 3; i++) {
                game.ctx.beginPath();
                game.ctx.arc(
                    enemy.x - enemy.directionX * i * 3,
                    enemy.y - enemy.directionY * i * 3,
                    2 + i,
                    0,
                    Math.PI * 2
                );
                game.ctx.fill();
            }
            game.ctx.globalAlpha = 1.0;
        }*/

        if (enemy.isMinion) {
            const img = game.minionImages[enemy.type];

            if (img && img.complete) {
                game.ctx.drawImage(
                    img,
                    enemy.x,
                    enemy.y,
                    enemy.width,
                    enemy.height
                );
            }
            // Fallback: Einfache Formen zeichnen
            else {
                game.ctx.fillStyle = enemy.color;

                if (enemy.type === "tank") {
                    game.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    game.ctx.strokeStyle = "#000";
                    game.ctx.lineWidth = 2;
                    game.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
                }
                else if (enemy.type === "fast") {
                    game.ctx.beginPath();
                    game.ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
                    game.ctx.lineTo(enemy.x, enemy.y + enemy.height);
                    game.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                    game.ctx.closePath();
                    game.ctx.fill();
                }
                else {
                    game.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                }
            }

            const barWidth = enemy.width;
            const barHeight = 4;
            const barX = enemy.x;
            const barY = enemy.y - 10;
            let maxHealth = 1;
            if (enemy.type === "tank") maxHealth = Math.floor(game.level / 5);

            const healthPercentage = enemy.health / maxHealth;

            game.ctx.fillStyle = "#333";
            game.ctx.fillRect(barX, barY, barWidth, barHeight);

            if (healthPercentage > 0.5) {
                game.ctx.fillStyle = "#00FF00";
            } else if (healthPercentage > 0.25) {
                game.ctx.fillStyle = "#FFFF00";
            } else {
                game.ctx.fillStyle = "#FF0000";
            }
            game.ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

            game.ctx.strokeStyle = "#FFF";
            game.ctx.lineWidth = 1;
            game.ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        else {
            // Normale Gegner
            const imgIndex = Math.min(Math.floor(enemy.y / 50), game.enemyImages.length - 1);
            const enemyImg = game.enemyImages[imgIndex];

            if (enemyImg && enemyImg.complete) {
                game.ctx.drawImage(
                    enemyImg,
                    enemy.x,
                    enemy.y,
                    enemy.width,
                    enemy.height
                );
            } else {
                game.ctx.fillStyle = enemy.color;
                game.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
            const barWidth = enemy.width;
            const barHeight = 4;
            const barX = enemy.x;
            const barY = enemy.y - 10;
            const maxHealth = 1 + Math.floor(game.level / 3);
            const healthPercentage = enemy.health / maxHealth;

            // Hintergrund leerer Teil
            game.ctx.fillStyle = "#333";
            game.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Füllung aktuelle Leben
            const healthWidth = barWidth * healthPercentage;
            if (healthPercentage > 0.5) {
                game.ctx.fillStyle = "#00FF00"; // Grün hohe Gesundheit
            } else if (healthPercentage > 0.25) {
                game.ctx.fillStyle = "#FFFF00"; // Gelb mittlere Gesundheit
            } else {
                game.ctx.fillStyle = "#FF0000"; // Rot niedrige Gesundheit
            }
            game.ctx.fillRect(barX, barY, healthWidth, barHeight);

            // Rahmen
            game.ctx.strokeStyle = "#FFF";
            game.ctx.lineWidth = 1;
            game.ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}




function drawBoss() {
    if (!game.boss) return;

    if (game.bossIntro) {
        const pulse = Math.sin(game.frames * 0.2) * 0.2 + 0.8;
        game.ctx.globalAlpha = pulse;
    }

    let img;
    //Boss bild erstellen
    if (game.boss.phase === 1) {
        img = game.bossImages[game.boss.typeKey].phase1;
    } else {
        img = game.bossImages[game.boss.typeKey].phase2;
    }

    if (img.complete) {
        game.ctx.drawImage(
            img,
            game.boss.x,
            game.boss.y,
            game.boss.width,
            game.boss.height
        );
    } else {
        game.ctx.fillStyle = game.boss.color;
        game.ctx.fillRect(game.boss.x, game.boss.y, game.boss.width, game.boss.height);
    }

    // Gesundheit mit Bildern
    const barWidth = game.boss.width;
    const barHeight = 12;
    const barX = game.boss.x;
    const barY = game.boss.y - 22;
    const borderRadius = 3;

    // Rahmen
    game.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    game.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Hintergrund
    game.ctx.fillStyle = "#444";
    game.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Gesundheitsfüllung mit Bild
    const healthWidth = barWidth * (game.boss.health / game.boss.maxHealth);
    if (game.bossHealthBarFg.complete) {
        game.ctx.save();
        game.ctx.beginPath();
        game.ctx.roundRect(barX, barY, healthWidth, barHeight, borderRadius);
        game.ctx.clip();

        game.ctx.drawImage(
            game.bossHealthBarFg,
            barX, barY,
            healthWidth, barHeight
        );

        game.ctx.restore();
    } else {
        game.ctx.fillStyle = "linear-gradient(to right, #FF0000, #990000)";
        game.ctx.fillRect(barX, barY, healthWidth, barHeight);
    }

    // Pulsierende Animation niedrige gesundheit
    if (game.boss.health / game.boss.maxHealth < 0.3) {
        const pulse = Math.sin(game.frames * 0.2) * 0.5 + 0.5;
        game.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
        game.ctx.fillRect(barX, barY, healthWidth, barHeight);
    }

    if (game.bossIntro) {
        game.ctx.globalAlpha = 1.0;
    }

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
            // zur not Zeichne farbiges Rechteck
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

function drawConstUps() {
    for (const constUp of game.constUps) {
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


function spawnVictoryPowerUps() {
    spawnConstUp(
        game.canvas.width / 2,
        game.canvas.height / 2 + 40
    );
}



function Highscore() {
    if (game.highscore < game.score) {
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
    document.getElementById('damage').textContent = Math.floor(game.player.damage * 10) / 10;
    document.getElementById('Highscore').textContent = savedHighscore;


    // Powerup-Anzeige mit Gruppierung und kleineren Icons
    const powerupContainer = document.getElementById('powerup-container');
    powerupContainer.innerHTML = '';

    // Gruppiere Powerups nach Typ und behalte den längsten Timer
    const groupedPowerups = {};
    const allActiveUps = [...game.player.powerUps, ...game.player.epicUps];

    const shieldCount = game.player.shieldCount;
    if (shieldCount > 0) {
        groupedPowerups["Shield"] = {
            type: POWERUP_TYPES.SHIELD,
            count: shieldCount
        };
    }

    allActiveUps.forEach(up => {
        const typeName = up.type.name;
        if (typeName === "Shield") return;

        if (!groupedPowerups[typeName] || groupedPowerups[typeName].timer < up.timer) {
            groupedPowerups[typeName] = up;
        }
    });

    // Erstelle Anzeige-Elemente für jede Powerup-Gruppe
    Object.values(groupedPowerups).forEach(up => {
        const powerupElement = document.createElement('div');
        powerupElement.className = 'powerup-item';

        // Icon mit Bild
        const icon = document.createElement('img');
        icon.src = up.type.image;
        icon.alt = up.type.name;
        icon.className = 'powerup-icon';
        powerupElement.appendChild(icon);

        //Schilde
        if (up.type.name === "Shield") {
            const countElement = document.createElement('div');
            countElement.className = 'shield-count';
            countElement.textContent = up.count;
            powerupElement.appendChild(countElement);
        } else {
            const cooldownBar = document.createElement('div');
            cooldownBar.className = 'cooldown-bar';

            const progress = document.createElement('div');
            progress.className = 'cooldown-progress';

            // Berechne Fortschritt
            const progressPercentage = (up.timer / up.type.duration) * 100;
            progress.style.width = `${progressPercentage}%`;
            progress.style.backgroundColor = up.type.color;

            cooldownBar.appendChild(progress);
            powerupElement.appendChild(cooldownBar);

            // Tooltip mit Namen und verbleibender Zeit
            const secondsLeft = Math.ceil(up.timer / 60);
            powerupElement.title = `${up.type.name} (${secondsLeft}s)`;
        }

        powerupContainer.appendChild(powerupElement);
    });

    // Falls keine Powerups aktiv sind
    if (Object.keys(groupedPowerups).length === 0) {
        powerupContainer.innerHTML = '<div class="no-powerups">Keine aktiven Powerups</div>';
    }

    // Visuelle Lebensanzeige
    const lifeContainer = document.getElementById('lifeContainer');
    lifeContainer.innerHTML = ''; // Alte Herzen löschen

    // Füge für jedes Leben ein Icon hinzu
    for (let i = 0; i < game.lives; i++) {
        const lifeIcon = document.createElement('div');
        lifeIcon.className = 'life-icon';
        lifeContainer.appendChild(lifeIcon);
    }

    //Begrenze Leben auf 5 und füge ausgegrautes Herz hinzu, wenn es fehlt
    const maxLives = 5;
    const lifeContainer2 = document.getElementById('lifeContainer');
    lifeContainer2.innerHTML = '';

    for (let i = 0; i < maxLives; i++) {
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

    game.player.powerUps = [];
    game.player.epicUps = [];
    game.player.shieldCount = 0;
    game.player.laserActive = false;
    game.player.canonActive = false;
    game.player.luckActive = false;
    game.player.rapidfire = false;
    game.player.isMagnetic = false;
    game.player.piercingShot = false;
    game.timeSlowFactor = 1.0;
    game.bulletSpeed = 1.0;
    game.scoreMultiplier = 1;

    updateUI();

    document.getElementById('restartBtn').style.display = 'block';
    document.getElementById('creditsButton').style.display = 'block';
    document.getElementById('OverScreen').style.display = 'flex';

    const currentHighscore = localStorage.getItem("highscore") || 0;
    if (/*game.score > currentHighscore*/true) {
        document.getElementById('finalScore').textContent = game.score;
        document.getElementById('highscoreInputScreen').style.display = 'flex';
    }
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
    game.player.powerUpTimer = 0;
    game.player.epicUpTimer = 0;
    game.player.shieldCount = 0;
    game.player.laserActive = false;
    game.player.canonActive = false;
    game.player.rapidfire = false;
    game.player.luckActive = false;
    game.timeSlowFactor = 1.0;
    game.bulletSpeed = 1.0;
    game.scoreMultiplier = 1;
    game.player.isMagnetic = false;
    game.player.piercingShot = false;
    game.player.damage = 1;
    game.boss = null;
    game.player.x = game.canvas.width / 2 - game.player.width / 2;
    powerupNames = [];
    epicupNames = [];
    ConstDamage = 1;
    document.getElementById('restartBtn').style.display = 'none';
    document.getElementById('creditsButton').style.display = 'none';
    document.getElementById('creditsRestartBtn').style.display = 'block';
    document.getElementById('OverScreen').style.display = 'none';
    document.getElementById("gameScreen").style.display = 'block';
    document.getElementById("creditScreen").style.display = 'none';
    document.getElementById('highscoreInputScreen').style.display = 'none';
    document.getElementById('highscoreListScreen').style.display = 'none';
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

// Funktion zum Erstellen von Hintergrundpartikeln
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    // Sternenhintergrund
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = `${Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(star);
    }

    // Bewegliche Partikel
    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;

        // Verschiedene Farben für Partikel
        const colors = ['#ff6666', '#66ff66', '#6666ff', '#ffff66', '#ff66ff', '#66ffff'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        container.appendChild(particle);

        // Animation
        particle.animate([
            {
                opacity: 0,
                transform: 'translateY(0) translateX(0)'
            },
            {
                opacity: 0.7,
                transform: `translateY(${Math.random() * 100 - 50}px) translateX(${Math.random() * 100 - 50}px)`
            },
            {
                opacity: 0,
                transform: `translateY(${Math.random() * 200 - 100}px) translateX(${Math.random() * 200 - 100}px)`
            }
        ], {
            duration: 3000 + Math.random() * 5000,
            easing: 'cubic-bezier(0.1, 0.7, 0.8, 0.1)'
        }).onfinish = () => particle.remove();
    }, 300);
}

// Initialisiere die Partikel wenn die Credit Scene geladen wird
document.addEventListener('DOMContentLoaded', createParticles);

// Event-Listener für den Credit Button
document.getElementById('creditsButton')?.addEventListener('click', function () {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('creditScreen').style.display = 'flex';
});

document.getElementById('creditsRestartBtn')?.addEventListener('click', function () {
    document.getElementById('creditScreen').style.display = 'none';
    startLevel();
});

function saveHighscore() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert("Bitte gib deinen Namen ein!");
        return;
    }

    const newHighscore = {
        name: playerName,
        score: game.score,
        date: new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    };

    const highscores = JSON.parse(localStorage.getItem('highscores') || '[]');
    highscores.push(newHighscore);

    // Sortieren und auf Top 10 begrenzen
    highscores.sort((a, b) => b.score - a.score);
    const topScores = highscores.slice(0, 10);

    localStorage.setItem('highscores', JSON.stringify(topScores));
    localStorage.setItem('highscore', game.score);

    document.getElementById('highscoreInputScreen').style.display = 'none';
    showHighscoreList();
}

function showHighscoreList() {
    const highscores = JSON.parse(localStorage.getItem('highscores') || '[]');
    const tableBody = document.getElementById('highscoreTable').querySelector('tbody');
    tableBody.innerHTML = '';

    if (highscores.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Noch keine Highscores!</td></tr>';
    } else {
        highscores.forEach((entry, index) => {
            const row = document.createElement('tr');

            // Highlight aktuellen Score
            if (entry.score === game.score) {
                row.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                row.style.fontWeight = 'bold';
            }

            row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.score}</td>
        <td>${entry.date}</td>
      `;
            tableBody.appendChild(row);
        });
    }

    document.getElementById('highscoreListScreen').style.display = 'flex';
}

// Präzise Messung der Bildwiederholfrequenz
    async function measureRefreshRate() {
      return new Promise(resolve => {
        const numFrames = 60; // Anzahl der zu messenden Frames
        let startTime = null;
        let frameCount = 0;
        let lastTimestamp = 0;
        
        // Zeitstempel-Differenzen speichern
        const deltas = [];

        function measure(timestamp) {
          if (startTime === null) {
            startTime = timestamp;
          }
          
          // Zeitdifferenz zum vorherigen Frame berechnen
          if (lastTimestamp > 0) {
            const delta = timestamp - lastTimestamp;
            deltas.push(delta);
          }
          
          lastTimestamp = timestamp;
          frameCount++;
          
          if (frameCount < numFrames) {
            requestAnimationFrame(measure);
          } else {
            // Nur plausible Werte behalten
            const validDeltas = deltas.filter(d => d > 2 && d < 50);
            
            // Wenn nicht genügend valide Werte, Messung als ungültig markieren
            if (validDeltas.length < numFrames * 0.8) {
              resolve(0);
              return;
            }
            
            // Durchschnittliche Framedauer berechnen
            const avgDelta = validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length;
            
            // Hertz berechnen (1000ms / Framedauer)
            const refreshRate = Math.round(1000 / avgDelta);
            resolve(refreshRate);
          }
        }
        
        requestAnimationFrame(measure);
      });
    }

    // Überprüft die Bildschirmfrequenz und aktualisiert die Anzeige
    async function checkRefreshRate() {
      const rateDisplay = document.getElementById('currentRate');
      const errorMsg = document.getElementById('errorMessage');
      const overlay = document.getElementById('refreshRateOverlay');
      const statusIndicator = document.querySelector('.status-indicator');
      const warningContent = document.querySelector('.warning-content');
      
      try {
        rateDisplay.textContent = "Messung läuft...";
        errorMsg.style.display = 'none';
        statusIndicator.className = 'status-indicator status-checking';
        
        const rate = await measureRefreshRate();
        
        if (rate > 0) {
          rateDisplay.textContent = `${rate} Hz`;
          rateDisplay.className = 'current-rate blink';
          
          // Akzeptiere 58-62 Hz als 60 Hz
          const is60Hz = rate >= 58 && rate <= 62;
          
          if (is60Hz) {
            statusIndicator.className = 'status-indicator status-good';
            overlay.classList.add('hidden');
            warningContent.classList.remove('animate');
          } else {
            statusIndicator.className = 'status-indicator status-bad';
            overlay.classList.remove('hidden');
            warningContent.classList.add('animate');
          }
          
          return is60Hz;
        } else {
          rateDisplay.textContent = "Messung fehlgeschlagen";
          rateDisplay.className = 'current-rate';
          statusIndicator.className = 'status-indicator status-bad';
          errorMsg.style.display = 'block';
          overlay.classList.remove('hidden');
          warningContent.classList.add('animate');
          return false;
        }
      } catch (e) {
        console.error("Messfehler:", e);
        rateDisplay.textContent = "Messung fehlgeschlagen";
        rateDisplay.className = 'current-rate';
        statusIndicator.className = 'status-indicator status-bad';
        errorMsg.style.display = 'block';
        overlay.classList.remove('hidden');
        warningContent.classList.add('animate');
        return false;
      }
    }

    // Kontinuierliche Überwachung der Bildschirmfrequenz
    async function startMonitoring() {
      // Erste Messung sofort durchführen
      await checkRefreshRate();
      
      // Kontinuierlich alle 3 Sekunden prüfen
      setInterval(async () => {
        await checkRefreshRate();
      }, 3000);
    }

    // Manueller Neustart der Messung
    document.getElementById('retryButton').addEventListener('click', async () => {
      await checkRefreshRate();
    });

    // Starte die Überwachung
    window.addEventListener('load', startMonitoring);