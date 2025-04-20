const GAME_CONFIG = {
    type: Phaser.AUTO,
    width: 700,
    height: 400,
    parent: 'gameContainer',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const PLAYER_CONFIG = {
    startX: 280,
    startY: 200,
    scale: 0.13,
    speed: 60,
    verticalSpeed: 100
};

let gameState = {
    player: null,
    goal: null,
    editor: null,
    message: null,
    outputBox: null,
    hp: 100,
    isRunning: false,
    worker: null,
    game: null,
    gameOver: false,
    mountains: [],
    shootQueue: [],
    energy: 100,
    energyText: null,
    health: 100,
    healthText: null,
    treasure: null,
    missionComplete: false
};

const DIALOG_CONFIG = {
    width: 600,
    padding: 10,
    background: 0x000000,
    alpha: 0.8,
    fontSize: 18,
    fontFamily: 'Arial',
    color: '#ffffff'
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player1', './image/characetor/1.png');
        this.load.image('player2', './image/characetor/2.png');
        this.load.image('player3', './image/characetor/3.png');
        this.load.image('tresure', './image/thor-removebg-preview.png');
        this.load.image("mountain", "./image/mt-removebg-preview.png");
        this.load.image("bg", "./image/CrystalCave1-1920x1080-2a8443ca448c40ef77c4da5d220c5e23.webp");
        this.load.image("pilot", "./image/angry-cartoon-viking-man-flat-2d-style_1120558-33845-removebg-preview.png");
        this.load.spritesheet('lightning', './image/lightn.png', { frameWidth: 32, frameHeight: 32 });

        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading asset:', file.src);
        });
    }

    create() {
        this.createBackground();
        this.createPlayer();
        this.initializeWorker();
        this.createtresure();
        this.createPlayerAnimations();
        
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 250;
        
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        let pilot = null;
        
        try {
            pilot = this.add.sprite(x + 10, y + 10, 'pilot');
            pilot.setScale(0.5);
            pilot.setDepth(1002);
            console.log('Pilot sprite created successfully');
        } catch (error) {
            console.error('Error creating pilot sprite:', error);
        }
        
        const messages = [
            { text: "ยินดีต้อนรับสู่ด่านแรกของการทดสอบ", delay: 0 },
            { text: "ใช้คำสั่ง console.log(ทิศทาง) เพื่อให้ไปที่เป้าหมาย", delay: 0 },
            { text: "ระวังอย่าให้ไวกิ้งชนกับขอบของด่าน", delay: 0 }
        ];
        
        const dialogText = this.add.text(x + 150, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        let currentMessageIndex = 0;
        let typingInterval = null;
        
        const showTypingMessage = (text) => {
            if (typingInterval) {
                clearInterval(typingInterval);
            }
            
            let currentText = '';
            let charIndex = 0;
            
            typingInterval = setInterval(() => {
                if (charIndex < text.length) {
                    currentText += text[charIndex];
                    dialogText.setText(currentText);
                    charIndex++;
                } else {
                    clearInterval(typingInterval);
                    typingInterval = null;
                }
            }, 50);
        };
        
        showTypingMessage(messages[0].text);
        
        const blurEffect = this.add.graphics();
        blurEffect.fillStyle(0x000000, 0.5);
        blurEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        dialogBox.setDepth(1000);
        dialogText.setDepth(1001);
        blurEffect.setDepth(999);
        
        const cleanup = () => {
            if (typingInterval) {
                clearInterval(typingInterval);
            }
            dialogBox.destroy();
            dialogText.destroy();
            blurEffect.destroy();
            if (pilot && pilot.destroy) {
                pilot.destroy();
            }
            this.input.off('pointerdown', handleClick);
        };
        
        const handleClick = () => {
            currentMessageIndex++;
            if (currentMessageIndex < messages.length) {
                showTypingMessage(messages[currentMessageIndex].text);
            } else {
                cleanup();
            }
        };
        
        this.input.on('pointerdown', handleClick);
        
        this.time.delayedCall(10000, cleanup);
    }

    createBackground() {
        const bg = this.add.image(300,195, "bg");
        bg.setScale(0.5);
    }

    createtresure() {
        gameState.treasure = this.add.image(260, 110, "tresure");
        gameState.treasure.setScale(0.2);
    }

    drawMountain(mountain) {
        mountain.sprite.setDisplaySize(MOUNTAIN_CONFIG.width, mountain.height);
        
        mountain.heightText.setText(`${mountain.id}`);
        mountain.heightText.setPosition(mountain.x, MOUNTAIN_CONFIG.baseY - mountain.height + 10);
        
        mountain.target.clear();
        mountain.target.fillStyle(0xff0000, 0.5);
        mountain.target.fillCircle(mountain.x, MOUNTAIN_CONFIG.baseY - mountain.height/2, 10);
    }

    createPlayer() {
        gameState.player = this.physics.add.sprite(
            PLAYER_CONFIG.startX,
            PLAYER_CONFIG.startY,
            "player1"
        ).setScale(PLAYER_CONFIG.scale);
        
        gameState.player.setVelocityX(0);
    }

    createPlayerAnimations() {
            this.anims.create({
            key: 'walk',
            frames: [
                { key: 'player1' },
                { key: 'player2' },
                { key: 'player3' },
                { key: 'player2' }
            ],
            frameRate: 8,
                repeat: -1
            });
    }

    initializeWorker() {
        if (gameState.worker) {
            gameState.worker.postMessage({ 
                type: 'init'
            });
        }
    }

    update() {
        if (!gameState.player || gameState.gameOver) return;

        if (gameState.worker && gameState.isRunning) {
            gameState.worker.postMessage({
                type: 'positions',
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                treasureX: gameState.treasure.x,
                treasureY: gameState.treasure.y
            });
        }

        if (!this.lastStatusUpdate || this.time.now - this.lastStatusUpdate > 800) {
            let directionText = '';
            if (gameState.player.body.velocity.x > 0) {
                directionText = 'ทิศตะวันออก';
            } else if (gameState.player.body.velocity.x < 0) {
                directionText = 'ทิศตะวันตก';
            } else if (gameState.player.body.velocity.y < 0) {
                directionText = 'ทิศเหนือ';
            } else if (gameState.player.body.velocity.y > 0) {
                directionText = 'ทิศใต้';
            }

            if (directionText) {
                const message = `กำลังเคลื่อนที่ไปทาง: ${directionText} | พลังงาน: ${Math.floor(gameState.energy)} | ตำแหน่งของผู้เล่น: (${Math.floor(gameState.player.x)}, ${Math.floor(gameState.player.y)}) | ตำแหน่งของเป้าหมาย: (${Math.floor(gameState.treasure.x)}, ${Math.floor(gameState.treasure.y)})`;
                logToConsole(message);
            }
            this.lastStatusUpdate = this.time.now;
        }

        if (gameState.treasure && !gameState.missionComplete) {
            const playerBounds = gameState.player.getBounds();
            const treasureBounds = gameState.treasure.getBounds();
            
            const distance = Phaser.Math.Distance.Between(
                playerBounds.centerX,
                playerBounds.centerY,
                treasureBounds.centerX,
                treasureBounds.centerY
            );
            
            if (distance < 30) {
                this.handleTreasureCollision();
            }
        }

        const playerBounds = gameState.player.getBounds();
        const margin = 20;
        
        const rightEdge = playerBounds.x + playerBounds.width;
        if (rightEdge >= GAME_CONFIG.width - margin) {
            console.log('DEBUG: ชนขอบขวา!', {
                playerX: playerBounds.x,
                playerWidth: playerBounds.width,
                rightEdge: rightEdge,
                gameWidth: GAME_CONFIG.width
            });
            
            gameState.player.setVelocityX(0);
            gameState.player.setVelocityY(0);
            gameState.player.anims.stop();
            
            this.handleBoundaryCollision();
            return;
        }

        if (playerBounds.x <= margin || 
            playerBounds.y <= margin || 
            playerBounds.y + playerBounds.height >= GAME_CONFIG.height - margin) {
            
            console.log('DEBUG: ชนขอบอื่น!', {
                x: playerBounds.x,
                y: playerBounds.y,
                width: playerBounds.width,
                height: playerBounds.height
            });
            
                    gameState.player.setVelocityX(0);
            gameState.player.setVelocityY(0);
            gameState.player.anims.stop();
            
            this.handleBoundaryCollision();
                return;
            }
            
        if (gameState.player.body.velocity.x !== 0 || gameState.player.body.velocity.y !== 0) {
            gameState.energy -= 0.1;
            this.updateEnergyText();
            
            if (gameState.energy <= 0) {
                this.handleEnergyDepleted();
            }
        }
    }

    handleBoundaryCollision() {
        console.log('DEBUG: เรียกใช้ handleBoundaryCollision');
        gameState.energy = 0;
        this.updateEnergyText();
        
        this.createCollisionEffect();
        
        this.handleEnergyDepleted();
    }

    createCollisionEffect() {
        const flash = this.add.graphics();
        flash.fillStyle(0xff0000, 0.5);
        flash.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }

    handleEnergyDepleted() {
        console.log('DEBUG: เรียกใช้ handleEnergyDepleted');
        gameState.gameOver = true;
        gameState.isRunning = false;
        
        gameState.player.setVelocityX(0);
        gameState.player.setVelocityY(0);
        
        logToConsole('พลังงานหมด! เกมจบแล้ว');
        
        this.createEnergyDepletedEffect();
    }

    createEnergyText() {
        gameState.energyText = this.add.text(10, 10, 'พลังงาน: 100', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    updateEnergyText() {
        if (gameState.energyText) {
            gameState.energyText.setText(`พลังงาน: ${Math.floor(gameState.energy)}`);
            
            if (gameState.energy > 50) {
                gameState.energyText.setColor('#00ff00');
            } else if (gameState.energy > 20) {
                gameState.energyText.setColor('#ffff00');
                } else {
                gameState.energyText.setColor('#ff0000');
            }
        }
    }

    createEnergyDepletedEffect() {
        const fade = this.add.graphics();
        fade.fillStyle(0x000000, 0.5);
        fade.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        this.tweens.add({
            targets: fade,
            alpha: 0.8,
            duration: 1000,
            ease: 'Power2'
        });
    }

    createHealthText() {
        gameState.healthText = this.add.text(10, 40, 'เลือด: 100', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    updateHealthText() {
        if (gameState.healthText) {
            gameState.healthText.setText(`เลือด: ${Math.floor(gameState.health)}`);
            
            if (gameState.health > 50) {
                gameState.healthText.setColor('#00ff00');
            } else if (gameState.health > 20) {
                gameState.healthText.setColor('#ffff00');
            } else {
                gameState.healthText.setColor('#ff0000');
            }
        }
    }

    runTestCase() {
        resetGame();
        gameState.isRunning = true;
        if (gameState.player) {
            gameState.player.setVelocityX(0);
        }

        const code = gameState.editor.getValue();
        console.log('Sending code to worker:', code);

        if (gameState.worker) {
            gameState.worker.postMessage({
                type: 'run',
                code: code
            });
        } else {
            console.error('Worker is not initialized');
        }
    }

    analyzeCodeComplexity(code) {
        const loops = code.match(/for\s*\(|while\s*\(|do\s*{/g) || [];
        const nestedLoops = code.match(/for\s*\(.*for\s*\(|while\s*\(.*while\s*\(|do\s*{.*do\s*{/g) || [];
        
        const recursiveCalls = code.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?\b\w+\s*\([^)]*\)[\s\S]*?}/g) || [];
        
        const highComplexityMethods = code.match(/\.sort\(|\.reduce\(|\.filter\(|\.map\(/g) || [];
        
        if (nestedLoops.length > 0) {
            return {
                complexity: 'O(n²)',
                message: '🐌 โค้ดของคุณมี time complexity สูง (O(n²)) เนื่องจากมีการวนลูปซ้อนกัน',
                suggestion: 'ลองลดการวนลูปซ้อนกันหรือใช้วิธีอื่นแทน'
            };
        } else if (recursiveCalls.length > 0) {
            return {
                complexity: 'O(2ⁿ)',
                message: '🐌 โค้ดของคุณมี time complexity สูงมาก (O(2ⁿ)) เนื่องจากมีการเรียกฟังก์ชันแบบ recursive',
                suggestion: 'ลองใช้การวนลูปแทนการเรียกฟังก์ชันแบบ recursive'
            };
        } else if (loops.length > 0 || highComplexityMethods.length > 0) {
            return {
                complexity: 'O(n)',
                message: '⚡ โค้ดของคุณมี time complexity ปานกลาง (O(n))',
            };
        } else {
            return {
                complexity: 'O(1)',
                message: '🚀 โค้ดของคุณมี time complexity ต่ำ (O(1))',
                suggestion: 'โค้ดของคุณมีประสิทธิภาพดีมาก!'
            };
        }
    }

    movePlayer(direction) {
        if (gameState.energy <= 0) return;
        
        const speed = PLAYER_CONFIG.speed;
        
        gameState.player.anims.stop();
        
        let directionText = '';
        switch(direction.toLowerCase()) {
            case 'north':
            case 'up':
                gameState.player.setVelocityY(-speed);
                gameState.player.setVelocityX(0);
                gameState.player.anims.play('walk', true);
                directionText = 'ทิศเหนือ';
                break;
            case 'south':
            case 'down':
                gameState.player.setVelocityY(speed);
                gameState.player.setVelocityX(0);
                gameState.player.anims.play('walk', true);
                directionText = 'ทิศใต้';
                break;
            case 'east':
            case 'right':
                gameState.player.setVelocityX(speed);
                gameState.player.setVelocityY(0);
                gameState.player.anims.play('walk', true);
                directionText = 'ทิศตะวันออก';
                break;
            case 'west':
            case 'left':
                gameState.player.setVelocityX(-speed);
                gameState.player.setVelocityY(0);
                gameState.player.anims.play('walk', true);
                directionText = 'ทิศตะวันตก';
                break;
            default:
                gameState.player.setVelocityX(0);
                gameState.player.setVelocityY(0);
                gameState.player.anims.stop();
                break;
        }

        if (directionText) {
            const message = `กำลังเคลื่อนที่ไปทาง: ${directionText} | พลังงาน: ${Math.floor(gameState.energy)} | เลือด: ${Math.floor(gameState.health)}`;
            logToConsole(message);
        }
    }

    handleTreasureCollision() {
        gameState.missionComplete = true;
        
        gameState.player.setVelocityX(0);
        gameState.player.setVelocityY(0);
        gameState.player.anims.stop();
        
        const elseCheckbox = document.getElementById('else-checkbox');
        if (elseCheckbox) {
            elseCheckbox.innerHTML = '✓';
            elseCheckbox.parentElement.classList.add('completed');
        }
        
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 250;
        
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        const pilot = this.add.sprite(x + 10, y + 10, 'pilot');
        pilot.setScale(0.5);
        pilot.setDepth(1002);

        const messages = [
            { text: "ยินดีด้วย! เจ้าได้พบสมบัติแล้ว!", delay: 0 },
            { text: "ภารกิจสำเร็จ! if condition สำเร็จ", delay: 0 },
            { text: "กดปุ่มใดก็ได้เพื่อไปยังด่านต่อไป", delay: 0 }
        ];
        
        const dialogText = this.add.text(x + 150, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        let currentMessageIndex = 0;
        let typingInterval = null;
        
        const showTypingMessage = (text) => {
            if (typingInterval) {
                clearInterval(typingInterval);
            }
            
            let currentText = '';
            let charIndex = 0;
            
            typingInterval = setInterval(() => {
                if (charIndex < text.length) {
                    currentText += text[charIndex];
                    dialogText.setText(currentText);
                    charIndex++;
            } else {
                    clearInterval(typingInterval);
                    typingInterval = null;
                }
            }, 50);
        };
        
        showTypingMessage(messages[0].text);
        
        const handleClick = () => {
            currentMessageIndex++;
            if (currentMessageIndex < messages.length) {
                showTypingMessage(messages[currentMessageIndex].text);
    } else {
                dialogBox.destroy();
                dialogText.destroy();
                pilot.destroy();
                this.input.off('pointerdown', handleClick);
            }
        };
        
        this.input.on('pointerdown', handleClick);
    }
}

function initializeGame() {
    gameState.game = new Phaser.Game(GAME_CONFIG);
    gameState.game.scene.add('GameScene', GameScene);
    gameState.game.scene.start('GameScene');
}

function initializeEditor() {
require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" } });
require(["vs/editor/editor.main"], function () {
        gameState.editor = monaco.editor.create(document.getElementById("editor"), {
        value: `/**
 ใช้คำสั่ง console.log(ทิศทาง)
 east = ทางขวา 
 west = ทางซ้าย
 north = ทางขึ้น
 south = ทางลง
 ตัวแปร player.y คือ ตำแหน่งของผู้เล่นบนแกน y
 ตัวแปร treasure.y คือ ตำแหน่งของเป้าหมายบนแกน y
 **/
if ( /ใส่ตำแหน่งผู้เล่นy/  >= /ใส่ตำแหน่งเป้าหมาย y/) {
    console.log(north);
} else {
    console.log(south);
}


`,
        language: "javascript",
        theme: "vs-dark",
        fontSize: 15,
    });

    monaco.editor.defineTheme("myCustomTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "keyword", foreground: "FF79C6", fontStyle: "bold" },
            { token: "string", foreground: "50FA7B", fontStyle: "bold" },
            { token: "comment", foreground: "6272A4", fontStyle: "italic" },
            { token: "variable", foreground: "FFB86C" },
            { token: "number", foreground: "BD93F9" },
            { token: "function", foreground: "8BE9FD" },
            { token: "type.identifier.console", foreground: "FF5555", fontStyle: "bold" },
            { token: "identifier.log", foreground: "FFB86C", fontStyle: "bold" },
            { token: "delimiter.parenthesis", foreground: "F8F8F2" },
            { token: "delimiter.bracket", foreground: "F8F8F2" }
        ],
        colors: {
            "editor.background": "#282A36",
            "editor.foreground": "#F8F8F2",
            "editorCursor.foreground": "#F8F8F2",
            "editor.lineHighlightBackground": "#44475A",
            "editor.selectionBackground": "#BD93F9",
            "editorLineNumber.foreground": "#6272A4",
            "editor.selectionHighlightBackground": "#424450",
            "editor.wordHighlightBackground": "#3c4043",
            "editorBracketMatch.background": "#44475A",
            "editorBracketMatch.border": "#BD93F9"
        }
    });

    monaco.editor.setTheme("myCustomTheme");
    });
}

function setupWorkerHandlers() {
    if (!gameState.worker) {
        gameState.worker = new Worker('gameWorker.js');
    }

    gameState.worker.onmessage = function(e) {
        const { type, message, hasIf } = e.data;
        
        if (type === 'log') {
            const direction = message.trim();
            const currentScene = gameState.game.scene.scenes[0];
            if (currentScene) {
                currentScene.movePlayer(direction);
            }
            logToConsole(`กำลังเคลื่อนที่ไปทาง: ${direction}`);
        } else if (type === 'ifCheck') {
            const ifCheckbox = document.getElementById('if-checkbox');
            if (ifCheckbox) {
                if (hasIf) {
                    ifCheckbox.innerHTML = '✓';
                    ifCheckbox.parentElement.classList.add('completed');
                } else {
                    ifCheckbox.innerHTML = '✗';
                    ifCheckbox.parentElement.classList.remove('completed');
                }
            }
            logToConsole(message);
        } else if (type === 'error') {
            console.error('Worker error:', message);
            logToConsole(`Error: ${message}`);
        }
    };
}

function logToConsole(message) {
    console.log('Debug:', message);
    const outputBox = document.getElementById('console-output');
    if (outputBox) {
        const logEntry = document.createElement('div');
        logEntry.className = 'console-entry';
        
        logEntry.style.padding = '8px 12px';
        logEntry.style.margin = '4px 0';
        logEntry.style.borderRadius = '4px';
        logEntry.style.fontFamily = 'Arial, sans-serif';
        logEntry.style.fontSize = '14px';
        logEntry.style.lineHeight = '1.4';
        logEntry.style.transition = 'all 0.3s ease';
        
        if (message.includes('กำลังเคลื่อนที่ไปทาง')) {
            logEntry.style.backgroundColor = 'rgba(12, 140, 57, 0.1)';
            logEntry.style.borderLeft = '4px solid #999999';
            logEntry.style.color = '#fefefe';
        } else if (typeof message === 'number') {
            logEntry.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
            logEntry.style.borderLeft = '4px solid #0066cc';
            logEntry.style.color = '#0066cc';
            message = `ตำแหน่ง: ${message}`;
        } else if (message.includes('Error')) {
            logEntry.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #cc0000';
            logEntry.style.color = '#cc0000';
        } else {
            logEntry.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
            logEntry.style.borderLeft = '4px solid #999999';
            logEntry.style.color = '#fefefe';
        }
        
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        logEntry.appendChild(textSpan);
        
        logEntry.style.opacity = '0';
        logEntry.style.transform = 'translateY(-10px)';
        
        outputBox.appendChild(logEntry);
        
        outputBox.scrollTop = outputBox.scrollHeight;
        
        setTimeout(() => {
            logEntry.style.opacity = '1';
            logEntry.style.transform = 'translateY(0)';
        }, 10);
    }
}

function resetGame() {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
        consoleOutput.innerHTML = '';
    }

    gameState.isRunning = false;
    gameState.gameOver = false;
    gameState.shootQueue = [];
    
    if (gameState.message) {
        gameState.message.setText('HP: 100');
    }
}

initializeGame();
initializeEditor();
setupWorkerHandlers();

window.runTestCase = function() {
    resetGame();
    gameState.isRunning = true;
    if (gameState.player) {
        gameState.player.setVelocityX(0);
    }

    const code = gameState.editor.getValue();
    console.log('Sending code to worker:', code);
    
    if (gameState.worker) {
        gameState.worker.postMessage({
            type: 'run',
            code: code
        });
    } else {
        console.error('Worker is not initialized');
    }
};
