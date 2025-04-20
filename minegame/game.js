// Game Constants
const GAME_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    PLAYER: {
        START_X: 100,
        START_Y: 150,
        MOVEMENT_SPEED: 900,
        SCALE: 0.1
    },
    GOAL: {
        SCALE: 0.5
    },
    MOVE_DISTANCE: 20,
    INITIAL_HP: 100,
    ANIMATION_FRAME_RATE: 8,
    PLAYBACK_SPEED: 200
};

// Animation States
const ANIMATION_STATES = {
    IDLE: 'idle',
    WALK: 'walk',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

// Game Levels
const LEVELS = {
    1: { // Straight line
        goalX: 400,
        goalY: 150,
        description: "เดินเป็นเส้นตรงไปยังเป้าหมาย"
    },
    2: { // Down
        goalX: 100,
        goalY: 300,
        description: "เดินลงไปยังเป้าหมาย"
    },
    3: { // Easy angle
        goalX: 300,
        goalY: 250,
        description: "เดินเฉียงไปยังเป้าหมาย"
    },
    4: { // Optimal angle
        goalX: 500,
        goalY: 200,
        description: "หาเส้นทางที่ดีที่สุดไปยังเป้าหมาย"
    }
};

// Game State
let gameState = {
    player: null,
    goal: null,
    editor: null,
    message: null,
    outputBox: null,
    intervals: [],
    hp: GAME_CONFIG.INITIAL_HP,
    isRunning: false,
    currentFrame: 0,
    isPlaying: false,
    frameInterval: null,
    moveHistory: [],
    maxFrames: GAME_CONFIG.MAX_FRAMES,
    worker: null
};

const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'gameContainer',
    physics: { default: "arcade" },

    scene: {
        preload: function () {
            this.load.image("player", "./image/2204_w053_n004_22_medicharacters_p1_22-modified.png");
            this.load.image("goal", "https://labs.phaser.io/assets/sprites/star.png");
            this.load.image("bg", "./image/Orc-Lands-Horizontal-Battle-Backgrounds2 (1).png");

            // โหลดภาพทั้ง 3 ภาพสำหรับแอนิเมชัน
            this.load.image('walk1', './image/characetor/1.png');
            this.load.image('walk2', './image/characetor/2.png');
            this.load.image('walk3', './image/characetor/3.png');

            // โหลด spritesheet สำหรับ animations ต่างๆ
            this.load.spritesheet('player_idle', 'assets/player_idle.png', { frameWidth: 32, frameHeight: 48 });
            this.load.spritesheet('player_walk', 'assets/player_walk.png', { frameWidth: 32, frameHeight: 48 });
        },
        create: function () {
            let bg = this.add.image(245, 190, "bg");
            bg.setDisplaySize(800, 400);

            // สร้าง animations จากรูปภาพที่มีอยู่
            this.anims.create({
                key: ANIMATION_STATES.WALK,
                frames: [
                    { key: 'walk1' },
                    { key: 'walk2' },
                    { key: 'walk3' }
                ],
                frameRate: GAME_CONFIG.ANIMATION_FRAME_RATE,
                repeat: -1
            });

            this.anims.create({
                key: ANIMATION_STATES.IDLE,
                frames: [
                    { key: 'walk1' }
                ],
                frameRate: 1,
                repeat: 0
            });

            // กำหนดตำแหน่งเริ่มต้น
            const startX = GAME_CONFIG.PLAYER.START_X;
            const startY = GAME_CONFIG.PLAYER.START_Y;

            // สร้างตัวละครและตั้งค่าเริ่มต้น
            gameState.player = this.physics.add.sprite(startX, startY, 'walk1').setScale(GAME_CONFIG.PLAYER.SCALE);
            gameState.player.setCollideWorldBounds(true);
            gameState.player.movementSpeed = GAME_CONFIG.PLAYER.MOVEMENT_SPEED;
            gameState.player.isMoving = false;
            gameState.player.currentDirection = 'right';
            gameState.player.startX = startX;
            gameState.player.startY = startY;

            gameState.goal = this.physics.add.staticSprite(400, 150, "goal").setScale(GAME_CONFIG.GOAL.SCALE);

            gameState.message = this.add.text(200, 50, "HP: 100", { fontSize: "24px", fill: "#fff" });

            // อ้างอิงถึง outputBox ใน DOM ที่มี ID "console-output"
            gameState.outputBox = document.getElementById("console-output");

            // สร้าง Web Worker
            gameState.worker = new Worker('gameWorker.js');
            gameState.worker.onmessage = function (e) {
                const { moveQueue, error } = e.data;
                if (error) {
                    console.error(error);
                    return;
                }

                // ส่งคำสั่งเคลื่อนไหวไปให้ตัวละคร
                if (moveQueue.length > 0) {
                    handleMoveQueue(moveQueue);
                }
            };

            // เริ่มต้นด้วย idle animation
            gameState.player.play(ANIMATION_STATES.IDLE);
        },
        update: function (time, delta) {
            if (gameState.player.isMoving) {
                const dx = gameState.player.targetX - gameState.player.x;
                const dy = gameState.player.targetY - gameState.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 1) {
                    gameState.player.x = gameState.player.targetX;
                    gameState.player.y = gameState.player.targetY;
                    gameState.player.isMoving = false;
                    gameState.player.body.setVelocity(0, 0);
                    gameState.player.anims.stop();
                } else {
                    const speed = gameState.player.movementSpeed * (delta / 1000);
                    const vx = (dx / distance) * speed;
                    const vy = (dy / distance) * speed;
                    gameState.player.body.setVelocity(vx, vy);

                    // เล่นแอนิเมชันการเดินและพลิกภาพตามทิศทาง
                    gameState.player.anims.play('walk', true);
                    if (vx < 0) {
                        gameState.player.setFlipX(true);
                    } else {
                        gameState.player.setFlipX(false);
                    }
                }
            }
            checkWinCondition();
        }
    }
};

const game = new Phaser.Game(config);

// Game Initialization
function initializeGame() {
    // Load Monaco Editor
    require({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" } });
    require(["vs/editor/editor.main"], function () {
        gameState.editor = monaco.editor.create(document.getElementById("editor"), {
            value: `/**
 * Solve this puzzle by writing the shortest code.
 * Whitespaces (spaces, new lines, tabs...) are counted in the total amount of chars.
 **/
        console.log('E');
`,
            language: "javascript",
            theme: "vs-dark",
            fontSize: 15,
        });

        // Create Custom Theme
        monaco.editor.defineTheme("myCustomTheme", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "keyword", foreground: "FF79C6", fontStyle: "bold" },  // สีชมพูสดใส
                { token: "string", foreground: "50FA7B", fontStyle: "bold" },   // สีเขียวสว่าง
                { token: "comment", foreground: "6272A4", fontStyle: "italic" }, // สีฟ้าอมเทา
                { token: "variable", foreground: "FFB86C" },                     // สีส้มอ่อน
                { token: "number", foreground: "BD93F9" },                      // สีม่วงอ่อน
                { token: "function", foreground: "8BE9FD" },                    // สีฟ้าสว่าง
                // เพิ่มสีพิเศษสำหรับ console.log
                { token: "type.identifier.console", foreground: "FF5555", fontStyle: "bold" },  // สีแดงสำหรับ console
                { token: "identifier.log", foreground: "FFB86C", fontStyle: "bold" },          // สีส้มสำหรับ .log
                { token: "delimiter.parenthesis", foreground: "F8F8F2" },                      // สีขาวสำหรับวงเล็บ
                { token: "delimiter.bracket", foreground: "F8F8F2" }                           // สีขาวสำหรับวงเล็บเหลี่ยม
            ],
            colors: {
                "editor.background": "#282A36",             // สีพื้นหลังเข้ม
                "editor.foreground": "#F8F8F2",             // สีข้อความหลักสว่าง
                "editorCursor.foreground": "#F8F8F2",       // สีเคอร์เซอร์
                "editor.lineHighlightBackground": "#44475A", // สีไฮไลท์บรรทัด
                "editor.selectionBackground": "#BD93F9",     // สีพื้นหลังตัวที่เลือก
                "editorLineNumber.foreground": "#6272A4",    // สีเลขบรรทัด
                "editor.selectionHighlightBackground": "#424450", // สีไฮไลท์การเลือก
                "editor.wordHighlightBackground": "#3c4043",      // สีไฮไลท์คำ
                "editorBracketMatch.background": "#44475A",       // สีวงเล็บที่จับคู่กัน
                "editorBracketMatch.border": "#BD93F9"           // สีขอบวงเล็บที่จับคู่กัน
            }
        });

        monaco.editor.setTheme("myCustomTheme");
        
        // Add editor change listener
        gameState.editor.onDidChangeModelContent(function(e) {
            const code = gameState.editor.getValue();
            const hasIf = code.includes('if');
            const hasElse = code.includes('else');
            
            updateMissionStatus({
                hasIf: hasIf,
                hasElse: hasElse,
                isComplete: hasIf && hasElse
            });
        });
    });
}

// Game Loop Functions
function updateGame(time, delta) {
    if (gameState.player.isMoving) {
        const dx = gameState.player.targetX - gameState.player.x;
        const dy = gameState.player.targetY - gameState.player.y;
        const distance = Utils.calculateDistance(gameState.player.x, gameState.player.y, gameState.player.targetX, gameState.player.targetY);
        
        if (distance < 1) {
            GameState.updatePlayerState(gameState.player.targetX, gameState.player.targetY, false);
        } else {
            const speed = gameState.player.movementSpeed * (delta / 1000);
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            gameState.player.body.setVelocity(vx, vy);
            
            updatePlayerAnimation(vx < 0 ? 'W' : 'E', true);
        }
    }
    checkWinCondition();
}

// Event Handlers
function handleMoveQueue(moveQueue) {
    if (!gameState.isRunning) return;
    gameState.isRunning = true;
    moveQueue.forEach(handleCommand);
}

function handleCommand(command) {
    const direction = getDirectionFromCommand(command);
    const oldPosition = { x: gameState.player.x, y: gameState.player.y };
    const targetPosition = calculateTargetPosition(command, oldPosition);
    
    if (Utils.isOutOfBounds(targetPosition.x, targetPosition.y)) {
        handleBorderCollision(oldPosition, command, direction);
        return;
    }
    
    updatePlayerMovement(targetPosition, command, direction);
}

// Helper Functions
function getDirectionFromCommand(command) {
    const directions = {
        'N': 'North',
        'S': 'South',
        'E': 'East',
        'W': 'West'
    };
    return directions[command] || '';
}

function calculateTargetPosition(command, currentPosition) {
    const { x, y } = currentPosition;
    const distance = GAME_CONFIG.MOVE_DISTANCE;
    const dx = gameState.goal.x - x;
    const dy = gameState.goal.y - y;
    
    let targetX = x;
    let targetY = y;
    
    switch(command) {
        case 'N':
            targetY = Math.abs(dy) < distance && dy < 0 ? gameState.goal.y : y - distance;
            break;
        case 'S':
            targetY = Math.abs(dy) < distance && dy > 0 ? gameState.goal.y : y + distance;
            break;
        case 'E':
            targetX = Math.abs(dx) < distance && dx > 0 ? gameState.goal.x : x + distance;
            break;
        case 'W':
            targetX = Math.abs(dx) < distance && dx < 0 ? gameState.goal.x : x - distance;
            break;
    }
    
    return { x: targetX, y: targetY };
}

function handleBorderCollision(position, command, direction) {
    GameState.updatePlayerState(position.x, position.y, false);
    
    gameState.moveHistory.push({
        x: position.x,
        y: position.y,
        command,
        direction,
        hp: gameState.hp,
        deathReason: 'Border Collision'
    });
    
    gameOverWithReason('💥 Game Over - Border Collision!');
}

function updatePlayerMovement(targetPosition, command, direction) {
    gameState.player.targetX = targetPosition.x;
    gameState.player.targetY = targetPosition.y;
    gameState.player.isMoving = true;
    
    gameState.hp -= 1;
    gameState.message.setText(`HP: ${gameState.hp}`);
    
    if (gameState.hp <= 0) {
        gameState.moveHistory.push({
            x: gameState.player.x,
            y: gameState.player.y,
            command,
            direction,
            hp: gameState.hp,
            deathReason: 'Out of Energy'
        });
        gameOverWithReason('💀 Game Over - Out of Energy!');
        return;
    }
    
    gameState.moveHistory.push({
        x: targetPosition.x,
        y: targetPosition.y,
        command,
        direction,
        hp: gameState.hp
    });
    
    gameState.currentFrame = gameState.moveHistory.length;
    updateProgressBar();
    
    // แสดงข้อมูลตำแหน่งปัจจุบัน
    logToConsole(`Player position = (${Math.round(targetPosition.x)},${Math.round(targetPosition.y)}). Goal position = (${Math.round(gameState.goal.x)},${Math.round(gameState.goal.y)}). Energy = ${gameState.hp}`);
    
    updatePlayerAnimation(command, true);
}

// Initialize the game
initializeGame();

// Utility Functions
const Utils = {
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    calculateDistance: function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    isOutOfBounds: function(x, y) {
        return x < 0 || x > GAME_CONFIG.WIDTH || y < 0 || y > GAME_CONFIG.HEIGHT;
    },

    formatPosition: function(x, y) {
        return `(${Math.round(x)},${Math.round(y)})`;
    }
};

// Game State Management
const GameState = {
    reset: function() {
        gameState.isRunning = false;
        gameState.currentFrame = 0;
        gameState.moveHistory = [];
        gameState.hp = GAME_CONFIG.INITIAL_HP;
        
        if (gameState.player) {
            gameState.player.x = gameState.player.startX;
            gameState.player.y = gameState.player.startY;
            gameState.player.isMoving = false;
            gameState.player.body.setVelocity(0, 0);
            gameState.player.anims.stop();
            gameState.player.setFlipX(false);
        }
        
        if (gameState.message) {
            gameState.message.setText(`HP: ${gameState.hp}`);
        }
        
        gameState.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶';
        clearInterval(gameState.frameInterval);
        
        const progressBar = document.querySelector('.progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
    },

    updatePlayerState: function(x, y, isMoving = false) {
        if (!gameState.player) return;
        
        gameState.player.x = x;
        gameState.player.y = y;
        gameState.player.isMoving = isMoving;
        if (!isMoving) {
            gameState.player.body.setVelocity(0, 0);
            gameState.player.anims.stop();
        }
    }
};

// Console Management
const ConsoleManager = {
    clear: function() {
        if (gameState.outputBox) {
            gameState.outputBox.innerHTML = '';
        }
    },

    log: function(message) {
        if (!gameState.outputBox) {
            console.error("❌ outputBox is null.");
            return;
        }

        let p = document.createElement("p");
        p.textContent = message;
        
        if (message === 'Game information:') {
            p.classList.add('frame-start');
            p.dataset.frame = gameState.currentFrame;
            p.style.paddingTop = '10px';
            p.style.borderTop = '1px solid #444';
        }
        
        gameState.outputBox.appendChild(p);

        if (gameState.isRunning) {
            requestAnimationFrame(() => {
                gameState.outputBox.scrollTop = gameState.outputBox.scrollHeight;
            });
        }
    },

    logGameState: function(frameNumber, playerX, playerY, goalX, goalY, energy) {
        this.log('Game information:');
        this.log(`Player's ready to go.`);
        this.log(`Frame ${frameNumber}: Player position = ${Utils.formatPosition(playerX, playerY)}. Goal position = ${Utils.formatPosition(goalX, goalY)}. Energy = ${energy}`);
    }
};

function runCode() {
    // ตรวจสอบว่าเกมกำลังทำงานอยู่หรือไม่
    if (gameState.isRunning) {
        console.log('Game is already running, stopping current game...');
        // หยุดเกมที่กำลังทำงานอยู่
        if (gameState.worker) {
            gameState.worker.terminate();
            gameState.worker = null;
        }
        gameState.isRunning = false;
    }
    
    // ล้าง console ก่อนเริ่มรันโค้ดใหม่
    const outputBox = document.getElementById('console-output');
    if (outputBox) {
        outputBox.innerHTML = '';
    }
    
    // รีเซ็ตสถานะทั้งหมด
    gameState.currentFrame = 0;
    gameState.moveHistory = [];
    gameState.hp = GAME_CONFIG.INITIAL_HP;
    
    // รีเซ็ตตำแหน่งตัวละคร
    if (gameState.player) {
        gameState.player.x = gameState.player.startX;
        gameState.player.y = gameState.player.startY;
        gameState.player.isMoving = false;
        gameState.player.body.setVelocity(0, 0);
        gameState.player.anims.stop();
        gameState.player.setFlipX(false);
    }
    
    // อัพเดทข้อความ
    if (gameState.message) {
        gameState.message.setText(`HP: ${gameState.hp}`);
    }
    
    // รีเซ็ต UI
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.textContent = '▶';
    }
    
    if (gameState.frameInterval) {
        clearInterval(gameState.frameInterval);
        gameState.frameInterval = null;
    }
    
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    
    // แสดงข้อความเริ่มต้น
    logToConsole('Game information:');
    logToConsole(`Player's ready to go.`);
    logToConsole(`Frame 0: Player position = (${Math.round(gameState.player.x)},${Math.round(gameState.player.y)}). Goal position = (${Math.round(gameState.goal.x)},${Math.round(gameState.goal.y)}). Energy = ${gameState.hp}`);
    logToConsole(`Standard Output Stream: Game Start`);

    // สร้าง worker ใหม่
    gameState.worker = new Worker('gameWorker.js');
    gameState.worker.onmessage = function(e) {
        const { moveQueue, error } = e.data;
        if (error) {
            console.error(error);
            gameState.isRunning = false;
            return;
        }

        // ส่งคำสั่งเคลื่อนไหวไปให้ตัวละคร
        if (moveQueue && moveQueue.length > 0) {
            handleMoveQueue(moveQueue);
        }
    };

    // รันโค้ด
    let code = gameState.editor.getValue();
    gameState.worker.postMessage({
        code: code,
        playerPosition: { x: gameState.player.x, y: gameState.player.y }
    });
    
    // ตั้งค่าให้เกมเริ่มทำงาน
    gameState.isRunning = true;
    console.log('Game started with new code');
}

function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        const total = Math.max(gameState.moveHistory.length || 1, gameState.maxFrames);
        const percent = (gameState.currentFrame / total) * 100;
        progressBar.style.width = `${percent}%`;
    }
}


// Add scroll event listener to console output
document.getElementById('console-output').addEventListener('scroll', Utils.debounce(function(e) {
    if (gameState.isPlaying) return;
    
    const consoleOutput = e.target;
    const frameElements = consoleOutput.querySelectorAll('.frame-start');
    const scrollTop = consoleOutput.scrollTop;
    const viewportHeight = consoleOutput.clientHeight;
    
    // หา frame ที่อยู่ใกล้จุดกึ่งกลางของ viewport มากที่สุด
    let closestFrame = null;
    let minDistance = Infinity;
    
    frameElements.forEach((element) => {
        const elementTop = element.offsetTop;
        const distance = Math.abs(elementTop - scrollTop - (viewportHeight / 2));
        
        if (distance < minDistance) {
            minDistance = distance;
            closestFrame = element;
        }
    });
    
    if (closestFrame && closestFrame.dataset.frame) {
        const frameNumber = parseInt(closestFrame.dataset.frame);
        if (frameNumber !== gameState.currentFrame) {
            gameState.currentFrame = frameNumber;
            updatePlayerPosition(true);
        }
    }
}, 100));

function logToConsole(message) {
    const outputBox = document.getElementById('console-output');
    if (!outputBox) {
        console.error('Console output box not found');
        return;
    }

    const logEntry = document.createElement('div');
    logEntry.className = 'console-entry';
    
    // ตรวจสอบว่าข้อความมีคำว่า "Player position" หรือไม่
    if (message.includes('Player position')) {
        logEntry.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        logEntry.style.borderLeft = '4px solid #00cc00';
        logEntry.style.color = '#00cc00';
    } else {
        logEntry.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
        logEntry.style.borderLeft = '4px solid #999999';
        logEntry.style.color = '#fefefe';
    }
    
    // กำหนดสไตล์พื้นฐาน
    logEntry.style.padding = '8px 12px';
    logEntry.style.margin = '4px 0';
    logEntry.style.borderRadius = '4px';
    logEntry.style.fontFamily = 'Arial, sans-serif';
    logEntry.style.fontSize = '14px';
    logEntry.style.lineHeight = '1.4';
    
    logEntry.textContent = message;
    outputBox.appendChild(logEntry);
    
    // เลื่อนลงล่างเฉพาะตอนที่เกมกำลังทำงานอยู่
    if (gameState.isRunning) {
        outputBox.scrollTop = outputBox.scrollHeight;
    }
}

function updatePlayerPosition(shouldScroll = true) {
    if (!gameState.moveHistory.length) return;

    if (gameState.currentFrame === 0) {
        gameState.player.x = gameState.player.startX;
        gameState.player.y = gameState.player.startY;
        gameState.player.isMoving = false;
        gameState.player.body.setVelocity(0, 0);
        gameState.player.anims.stop();
    } else if (gameState.moveHistory[gameState.currentFrame - 1]) {
        const frame = gameState.moveHistory[gameState.currentFrame - 1];
        gameState.player.x = frame.x;
        gameState.player.y = frame.y;
        gameState.player.isMoving = false;
        gameState.player.body.setVelocity(0, 0);
        
        if (frame.command === 'W') {
            gameState.player.setFlipX(true);
        } else if (frame.command === 'E') {
            gameState.player.setFlipX(false);
        }
    }

    // Scroll console to current frame only if shouldScroll is true
   
}

// อัพเดทการเรียกใช้ updatePlayerPosition ในฟังก์ชันอื่นๆ


// ฟังก์ชันลด HP อัตโนมัติ
function decreaseHP(amount) {
    if (!gameState.isRunning) return; // ถ้ายังไม่ได้กด Run Code ไม่ต้องลด
    gameState.hp -= amount;
    gameState.message.setText(`HP: ${gameState.hp}`);

    if (gameState.hp <= 0) gameOver();
}

// เพิ่มฟังก์ชันใหม่สำหรับจบเกมพร้อมเหตุผล
function gameOverWithReason(reason) {
    console.log(reason);
    gameState.message.setText(reason);
    
    // หยุดการเคลื่อนที่และ animation ทันที
    gameState.player.isMoving = false;
    gameState.player.body.setVelocity(0, 0);
    gameState.player.anims.stop();
    gameState.player.setFlipX(false);
    gameState.player.setFlipY(false);
    
    // ล้าง console และแสดงข้อความเริ่มต้น
    const outputBox = document.getElementById('console-output');
    if (outputBox) {
        outputBox.innerHTML = '';
    }
    
    // แสดงข้อมูลแต่ละเฟรม
    gameState.moveHistory.forEach((frame, index) => {
        logToConsole(`Player position = (${Math.round(frame.x)},${Math.round(frame.y)}). Goal position = (${Math.round(gameState.goal.x)},${Math.round(gameState.goal.y)}). Energy = ${frame.hp}`);
    });

    // หยุด Web Worker
    if (gameState.worker) {
        gameState.worker.terminate();
        gameState.worker = new Worker('gameWorker.js');
        gameState.worker.onmessage = function(e) {
            const { moveQueue, error } = e.data;
            if (error) {
                console.error(error);
                logToConsole(`Error: ${error}`);
                return;
            }

            if (moveQueue && moveQueue.length > 0) {
                handleMoveQueue(moveQueue);
            }
        };
    }
    
    gameState.isRunning = false;
    
    // เล่น frame สุดท้ายแล้วหยุด
    if (reason.includes('Mission Complete')) {
        gameState.player.play(ANIMATION_STATES.IDLE);
    } else {
        gameState.player.play(ANIMATION_STATES.IDLE);
    }
}

// แก้ไขฟังก์ชัน gameOver เดิมให้ใช้ gameOverWithReason
function gameOver() {
    if (gameState.hp <= 0) {
        gameOverWithReason('💀 Game Over - Out of Energy!');
    } else {
        gameOverWithReason('🎉 Mission Complete!');
        // แสดงข้อความสำเร็จใน console
        logToConsole('🎉 Congratulations! You have completed the mission!');
        logToConsole(`Final position: (${Math.round(gameState.player.x)},${Math.round(gameState.player.y)})`);
        logToConsole(`Energy remaining: ${gameState.hp}`);
    }

}

// ฟังก์ชันล้าง setInterval ทั้งหมด
function clearAllIntervals() {
    gameState.intervals.forEach(clearInterval);
    gameState.intervals = [];
}

// เช็คเงื่อนไขการชนะ
function checkWinCondition() {
    // ตรวจสอบว่าพิกัดตรงกันพอดี
    if (Math.round(gameState.player.x) === Math.round(gameState.goal.x) && Math.round(gameState.player.y) === Math.round(gameState.goal.y)) {
        clearAllIntervals();
        gameState.isRunning = false;
        gameOver();
    }
}

// เพิ่มฟังก์ชันสำหรับอัพเดทสถานะการใช้งาน if-else แบบ realtime
function updateMissionStatus(status) {
    // อัพเดทสถานะบน HTML element ที่มีอยู่แล้ว
    const ifCheckbox = document.getElementById('if-checkbox');
    const elseCheckbox = document.getElementById('else-checkbox');
    
    if (ifCheckbox && elseCheckbox) {
        // อัพเดทสถานะ if
        ifCheckbox.textContent = status.hasIf ? '✓' : '✗';
        ifCheckbox.style.color = status.hasIf ? '#00ff00' : '#ff0000';
        
        // อัพเดทสถานะ else
        elseCheckbox.textContent = status.hasElse ? '✓' : '✗';
        elseCheckbox.style.color = status.hasElse ? '#00ff00' : '#ff0000';
    }
}

// ฟังก์ชันเลือกด่าน
function selectLevel(levelNumber) {
    if (!LEVELS[levelNumber]) return;
    
    // รีเซ็ตเกม
    gameState.isRunning = false;
    gameState.currentFrame = 0;
    gameState.moveHistory = [];
    gameState.hp = GAME_CONFIG.INITIAL_HP;
    
    // รีเซ็ตตำแหน่งตัวละคร
    gameState.player.x = gameState.player.startX;
    gameState.player.y = gameState.player.startY;
    gameState.player.isMoving = false;
    gameState.player.body.setVelocity(0, 0);
    gameState.player.anims.stop();
    gameState.player.setFlipX(false);
    
    // ตั้งค่าตำแหน่งเป้าหมายใหม่
    gameState.goal.x = LEVELS[levelNumber].goalX;
    gameState.goal.y = LEVELS[levelNumber].goalY;
    
    // อัพเดทข้อความ
    gameState.message.setText(`HP: ${gameState.hp}`);
    
    // รีเซ็ต UI
    document.getElementById('playPauseBtn').textContent = '▶';
    clearInterval(gameState.frameInterval);
    
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    
    // ล้าง console และแสดงข้อความเริ่มต้น
    gameState.outputBox.innerHTML = '';
    logToConsole('Game information:');
    logToConsole(`Level ${levelNumber}: ${LEVELS[levelNumber].description}`);
    logToConsole(`Player's ready to go.`);
    logToConsole(`Frame 0: Player position = (${Math.round(gameState.player.x)},${Math.round(gameState.player.y)}). Goal position = (${Math.round(gameState.goal.x)},${Math.round(gameState.goal.y)}). Energy = ${gameState.hp}`);
    logToConsole(`Standard Output Stream: Game Start`);
    
    // ไฮไลท์ด่านที่เลือก
    document.querySelectorAll('.level-item').forEach(item => {
        if (parseInt(item.dataset.level) === levelNumber) {
            item.style.backgroundColor = '#2c3540';
        } else {
            item.style.backgroundColor = '#252e38';
        }
    });
}

// ฟังก์ชันรัน testcase
function runTestCase(levelNumber) {
    // ตรวจสอบว่าเกมกำลังทำงานอยู่หรือไม่
    if (gameState.isRunning) {
        console.log('Game is already running, stopping current game...');
        // หยุดเกมที่กำลังทำงานอยู่
        if (gameState.worker) {
            gameState.worker.terminate();
            gameState.worker = null;
        }
        gameState.isRunning = false;
    }
    
    // รีเซ็ตเกมก่อนเริ่มด่านใหม่
    gameState.currentFrame = 0;
    gameState.moveHistory = [];
    gameState.hp = GAME_CONFIG.INITIAL_HP;
    
    // รีเซ็ตตำแหน่งตัวละคร
    if (gameState.player) {
        gameState.player.x = gameState.player.startX;
        gameState.player.y = gameState.player.startY;
        gameState.player.isMoving = false;
        gameState.player.body.setVelocity(0, 0);
        gameState.player.anims.stop();
        gameState.player.setFlipX(false);
    }
    
    // ตั้งค่าตำแหน่งเป้าหมายใหม่
    if (gameState.goal) {
        gameState.goal.x = LEVELS[levelNumber].goalX;
        gameState.goal.y = LEVELS[levelNumber].goalY;
    }
    
    // อัพเดทข้อความ
    if (gameState.message) {
        gameState.message.setText(`HP: ${gameState.hp}`);
    }
    
    // รีเซ็ต UI
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.textContent = '▶';
    }
    
    if (gameState.frameInterval) {
        clearInterval(gameState.frameInterval);
        gameState.frameInterval = null;
    }
    
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    
    // ล้าง console และแสดงข้อความเริ่มต้น
    const outputBox = document.getElementById('console-output');
    if (outputBox) {
        outputBox.innerHTML = '';
    }
    
    logToConsole('Game information:');
    logToConsole(`Level ${levelNumber}: ${LEVELS[levelNumber].description}`);
    logToConsole(`Player's ready to go.`);
    logToConsole(`Frame 0: Player position = (${Math.round(gameState.player.x)},${Math.round(gameState.player.y)}). Goal position = (${Math.round(gameState.goal.x)},${Math.round(gameState.goal.y)}). Energy = ${gameState.hp}`);
    logToConsole(`Standard Output Stream: Game Start`);
    
    // สร้าง worker ใหม่
    gameState.worker = new Worker('gameWorker.js');
    gameState.worker.onmessage = function(e) {
        const { moveQueue, error, missionStatus } = e.data;
        
        // อัพเดทสถานะ if-else ถ้ามี
        if (missionStatus) {
            updateMissionStatus(missionStatus);
        }
        
        if (error) {
            console.error(error);
            gameState.isRunning = false;
            return;
        }
        
        // ส่งคำสั่งเคลื่อนไหวไปให้ตัวละคร
        if (moveQueue && moveQueue.length > 0) {
            handleMoveQueue(moveQueue);
        }
    };
    
    // รันโค้ด
    let code = gameState.editor.getValue();
    gameState.worker.postMessage({
        code: code,
        playerPosition: { x: gameState.player.x, y: gameState.player.y }
    });
    
    // ตั้งค่าให้เกมเริ่มทำงาน
    gameState.isRunning = true;
    console.log('Game started with level:', levelNumber);
}


