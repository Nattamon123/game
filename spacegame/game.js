const GAME_CONFIG = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const MOUNTAIN_CONFIG = {
    count: 6,
    heights: [400, 410, 450, 250, 290, 280],
    spacing: 90,
    baseY: 550,
    width: 400,
    height: 100,
    image: "mountain"
};

const PLAYER_CONFIG = {
    startX: 400,
    startY: 60,
    scale: 0.25,
    speed: 150
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
    shootQueue: []
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
        this.load.image("player", "./image/ffffffff-removebg-preview.png");
        this.load.image("mountain", "./image/icemtt-removebg-preview.png");
        this.load.image("bg", "./image/ice.jpg");
        this.load.image("pilot", "./image/man-pilot-2d-cartoon-illustraton-white-background-high_889056-26132-removebg-preview.png");
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
        this.createMountains();
        this.createPlayer();
        this.createAnimations();
        this.initializeWorker();
        
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 290;
        
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
            { text: "ยินดีต้อนรับสู่ภารกิจทำลายภูเขา!", delay: 0 },
            { text: "เขียน console.log(หมายเลขภูเขา)ใน editor เพื่อยิงภูเขาที่ต้องการ", delay: 0 },
            { text: "ยานจะลดระดับทุกครั้งที่ยิงภูเขา ระวังอย่าให้ยานชนกับภูเขา ", delay: 0 },
            { text: "สามารถอ่านและทำความเข้าใจ ได้ที่คำแนะนำใต้เกม ", delay: 0 }

        ];
        
        this.dialogText = this.add.text(x + 100, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        let currentMessageIndex = 0;
        let isTyping = false;
        let typingInterval = null;
        
        const showTypingMessage = (text) => {
            if (isTyping) return; 
            
            isTyping = true;
            if (typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
            }
            
            let currentText = '';
            let charIndex = 0;
            
            typingInterval = setInterval(() => {
                if (charIndex < text.length) {
                    currentText += text[charIndex];
                    this.dialogText.setText(currentText);
                    charIndex++;
                } else {
                    clearInterval(typingInterval);
                    typingInterval = null;
                    isTyping = false;
                }
            }, 50); 
        };
        
        showTypingMessage(messages[0].text);
        
        const blurEffect = this.add.graphics();
        blurEffect.fillStyle(0x000000, 0.5);
        blurEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        dialogBox.setDepth(1000);
        this.dialogText.setDepth(1001);
        blurEffect.setDepth(999);
        
        const cleanup = () => {
            if (typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
            }
            dialogBox.destroy();
            this.dialogText.destroy();
            blurEffect.destroy();
            if (pilot && pilot.destroy) {
                pilot.destroy();
            }
            this.input.off('pointerdown', handleClick);
        };
        
        const handleClick = () => {
            if (isTyping) {
                if (typingInterval) {
                    clearInterval(typingInterval);
                    typingInterval = null;
                }
                this.dialogText.setText(messages[currentMessageIndex].text);
                isTyping = false;
                return;
            }
            
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
        const bg = this.add.image(400, 300, "bg");
        bg.setDisplaySize(800, 600);
    }

    createMountains() {
        gameState.mountains = [];
        for (let i = 0; i < MOUNTAIN_CONFIG.count; i++) {
            const x = 100 + i * MOUNTAIN_CONFIG.spacing;
            const height = MOUNTAIN_CONFIG.heights[i];
            this.createMountain(x, height, i + 1);
        }
    }

    createMountain(x, height, id) {
        const mountain = {
            id,
            x,
            y: MOUNTAIN_CONFIG.baseY,
            height,
            sprite: this.add.sprite(x, MOUNTAIN_CONFIG.baseY, MOUNTAIN_CONFIG.image),
            target: this.add.graphics(),
            heightText: this.add.text(x, MOUNTAIN_CONFIG.baseY - height + 50, `${id}`, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5),
            numberText: this.add.text(x, MOUNTAIN_CONFIG.baseY + 20, `${id}`, {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5)
        };

        mountain.sprite.setDisplaySize(MOUNTAIN_CONFIG.width, height);
        mountain.sprite.setOrigin(0.5, 1);
        mountain.sprite.y = MOUNTAIN_CONFIG.baseY;

        mountain.target.clear();
        mountain.target.fillStyle(0xff0000, 0.5);
        mountain.target.fillCircle(mountain.x, MOUNTAIN_CONFIG.baseY - height/2, 10);

        gameState.mountains.push(mountain);
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
            "player"
        ).setScale(PLAYER_CONFIG.scale);
        
        gameState.player.setCollideWorldBounds(true);
        gameState.player.setVelocityX(0);
        gameState.player.movingRight = true;
    }

    createAnimations() {
            this.anims.create({
                key: 'lightning_flash',
                frames: this.anims.generateFrameNumbers('lightning'),
                frameRate: 20,
                repeat: -1
            });
    }

    initializeWorker() {
        if (gameState.worker) {
            gameState.worker.postMessage({ 
                type: 'init',
                mountainHeights: MOUNTAIN_CONFIG.heights
            });
        }
    }

    update() {
        if (!gameState.player || gameState.gameOver) return;

        if (gameState.isRunning) {
            this.updatePlayerMovement();
            this.processShootQueue();
            
            gameState.mountains.forEach(mountain => {
                const isInMountainXRange = Math.abs(gameState.player.x - mountain.x) < 10;
                const mountainTopY = MOUNTAIN_CONFIG.baseY - mountain.height;
                const mountainBottomY = MOUNTAIN_CONFIG.baseY;
                
                const isInMountainYRange = gameState.player.y >= (mountainTopY + 40) && gameState.player.y <= (mountainBottomY - 40);
                
                const isNotInNumberTextArea = !(
                    gameState.player.y >= (mountainTopY + 10) && 
                    gameState.player.y <= (mountainTopY + 30) && 
                    Math.abs(gameState.player.x - mountain.x) < 15
                );
                
                if (isInMountainXRange && isInMountainYRange && isNotInNumberTextArea) {
                    this.handleCollision();
                }
            });
        }
    }

    updatePlayerMovement() {
        if (gameState.player.x >= 700 && gameState.player.movingRight) {
            this.turnPlayerLeft();
        } else if (gameState.player.x <= 100 && !gameState.player.movingRight) {
            this.turnPlayerRight();
        }
    }

    turnPlayerLeft() {
        gameState.player.setVelocityX(-PLAYER_CONFIG.speed);
        gameState.player.movingRight = false;
        gameState.player.y += 20;
        gameState.player.angle = 180;
    }

    turnPlayerRight() {
        gameState.player.setVelocityX(PLAYER_CONFIG.speed);
        gameState.player.movingRight = true;
        gameState.player.y += 20;
        gameState.player.angle = 0;
        
        if (gameState.shootQueue.length > 0) {
            const targetId = gameState.shootQueue.shift();
            console.log('Shooting mountain when turning right:', targetId);
            this.shootMountain(targetId);
        }
    }

    processShootQueue() {
        if (gameState.player.x <= 100 && !gameState.player.movingRight && gameState.shootQueue.length > 0) {
            const targetId = gameState.shootQueue.shift();
            console.log('Processing shoot queue - Shooting mountain:', targetId);
            this.shootMountain(targetId);
        }
    }

    shootMountain(mountainId) {
        console.log('Starting to shoot mountain:', mountainId);
        const mountainIndex = gameState.mountains.findIndex(m => m.id === mountainId);
        if (mountainIndex === -1) {
            console.error('Mountain not found:', mountainId);
            return;
        }
        const mountain = gameState.mountains[mountainIndex];

        const laser = this.add.graphics();
        laser.lineStyle(8, 0x00ffff, 1);
        laser.beginPath();
        laser.moveTo(gameState.player.x, gameState.player.y);
        laser.lineTo(mountain.x, MOUNTAIN_CONFIG.baseY - mountain.height/2);
        laser.strokePath();

        const flash = this.add.graphics();
        flash.fillStyle(0x00ffff, 1);
        flash.fillCircle(gameState.player.x, gameState.player.y, 30);

        const impact = this.add.graphics();
        impact.fillStyle(0xffffff, 1);
        impact.fillCircle(mountain.x, MOUNTAIN_CONFIG.baseY - mountain.height/2, 40);

        const explosion = this.add.graphics();
        explosion.fillStyle(0xff0000, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 20;
            const x = mountain.x + Math.cos(angle) * distance;
            const y = MOUNTAIN_CONFIG.baseY - mountain.height/2 + Math.sin(angle) * distance;
            explosion.fillCircle(x, y, 10);
        }

        this.tweens.add({
            targets: laser,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => laser.destroy()
        });

        this.tweens.add({
            targets: flash,
            scale: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        this.tweens.add({
            targets: impact,
            scale: 3,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                impact.destroy();
                explosion.destroy();
            }
        });

        this.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2'
        });

        mountain.sprite.setVisible(false);
        mountain.heightText.setVisible(false);
        mountain.numberText.setVisible(false);
        mountain.target.setVisible(false);

        gameState.mountains.splice(mountainIndex, 1);

        logToConsole(`ยิงภูเขาหมายเลข ${mountainId} (ภูเขาระเบิดและหายไป)`);

        if (gameState.mountains.length === 0) {
            console.log('All mountains destroyed!');
            
            logToConsole('🎉 ยินดีด้วย! คุณทำภารกิจสำเร็จแล้ว');
            
            gameState.isRunning = false;
            if (gameState.player) {
                gameState.player.setVelocityX(0);
            }

            this.createVictoryEffect();
            
            this.showVictoryDialog();
            
            const missionStatus = document.querySelector('.mission-status');
            if (missionStatus) {
                const conditions = missionStatus.querySelectorAll('.mission-condition');
                conditions.forEach(condition => {
                    const checkmark = condition.querySelector('.checkmark');
                    if (checkmark) {
                        checkmark.style.display = 'inline';
                    }
                });
            }
            
            const elseCheckbox = document.getElementById('else-checkbox');
            if (elseCheckbox) {
                elseCheckbox.textContent = '✓';
                elseCheckbox.style.color = '#4CAF50';
                elseCheckbox.style.animation = 'pulse 2s infinite';
            }

            setTimeout(() => {
                const code = gameState.editor.getValue();
                const analysis = analyzeCodeComplexity(code);
                logToConsole(`📊 Time Complexity: ${analysis.complexity}`);
                logToConsole(analysis.message);
                logToConsole(`💡 ข้อเสนอแนะ: ${analysis.suggestion}`);
            }, 1000);
        }
    }

    showVictoryDialog() {
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 290;
        
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        const pilot = this.add.sprite(x + 10, y + 10, 'pilot');
        pilot.setScale(0.5);
        pilot.setDepth(1002);
        
        const messages = [
            { text: "ยินดีด้วย! คุณทำภารกิจสำเร็จแล้ว! 🎉", delay: 0 },
            { text: "คุณสามารถกดเล่นด่านที่ 2 เพื่อเล่นเกมต่อไป!", delay: 0 },
            { text: "โชคดี!", delay: 0 }
        ];
        
        const dialogText = this.add.text(x + 100, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        let currentMessageIndex = 0;
        let isTyping = false;
        let typingInterval = null;
        
        const showTypingMessage = (text) => {
            if (isTyping) return; 
            
            isTyping = true;
            if (typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
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
                    isTyping = false;
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
                typingInterval = null;
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
            if (isTyping) {
                if (typingInterval) {
                    clearInterval(typingInterval);
                    typingInterval = null;
                }
                this.dialogText.setText(messages[currentMessageIndex].text);
                isTyping = false;
                return;
            }
            
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

    createVictoryEffect() {
        const flash = this.add.graphics();
        flash.fillStyle(0xffd700, 1); 
        flash.fillCircle(gameState.player.x, gameState.player.y, 50);

        const rings = [];
        for (let i = 0; i < 3; i++) {
            const ring = this.add.graphics();
            ring.lineStyle(4, [0xffd700, 0xff0000, 0x00ff00][i], 1);
            ring.strokeCircle(gameState.player.x, gameState.player.y, 30 + (i * 20));
            rings.push(ring);
        }

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
                rings.forEach(ring => ring.destroy());
            }
        });

        rings.forEach((ring, index) => {
            this.tweens.add({
                targets: ring,
                scale: 2,
                alpha: 0,
                duration: 800 + (index * 200),
                ease: 'Power2'
            });
        });
    }

    resetMountains() {
        gameState.mountains.forEach((mountain, index) => {
            mountain.height = MOUNTAIN_CONFIG.heights[index];
            this.drawMountain(mountain);
        });
    }

    handleCollision() {
        if (gameState.gameOver) return;
        
        gameState.gameOver = true;
        gameState.isRunning = false;
        
        this.createExplosion();
        
        gameState.player.setVisible(false);
        
        logToConsole('ยานอวกาศชนกับภูเขา! เกมจบแล้ว');
    }

    createExplosion() {
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(gameState.player.x, gameState.player.y, 50);

        this.tweens.add({
            targets: flash,
            scale: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        const particles = this.add.particles('lightning');
        
        const config = {
            x: gameState.player.x,
            y: gameState.player.y,
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 1000,
            quantity: 50,
            tint: 0xff0000,
            frequency: 50,
            gravityY: 0,
            alpha: { start: 1, end: 0 },
            rotate: { min: 0, max: 360 }
        };

        for (let i = 0; i < config.quantity; i++) {
            const angle = Phaser.Math.Between(config.angle.min, config.angle.max);
            const speed = Phaser.Math.Between(config.speed.min, config.speed.max);
            const rotation = Phaser.Math.Between(config.rotate.min, config.rotate.max);
            
            const particle = this.add.sprite(
                config.x,
                config.y,
                'lightning'
            );
            
            particle.setScale(config.scale.start);
            particle.setAlpha(config.alpha.start);
            particle.setRotation(rotation);
            particle.setTint(config.tint);

            this.physics.add.existing(particle);
            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            this.tweens.add({
                targets: particle,
                scale: config.scale.end,
                alpha: config.alpha.end,
                duration: config.lifespan,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.time.delayedCall(config.lifespan, () => {
            particles.destroy();
        });
    }
}

function initializeGame() {
    gameState.game = new Phaser.Game(GAME_CONFIG);
    gameState.game.scene.add('GameScene', GameScene);
    gameState.game.scene.start('GameScene');
}

function switchToLevel(levelId) {
    console.log('Switching to level:', levelId);
    
    if (gameState.game) {
        gameState.game.destroy(true);
        gameState.game = null;
    }
    if (level2State.game) {
        level2State.game.destroy(true);
        level2State.game = null;
    }

    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
        consoleOutput.innerHTML = '';
    }

    const levelItems = document.querySelectorAll('.level-item');
    levelItems.forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.level) === levelId) {
            item.classList.add('active');
            const status = item.querySelector('.level-status');
            if (status) {
                status.textContent = 'กำลังเล่น';
            }
        } else {
            const status = item.querySelector('.level-status');
            if (status) {
                status.textContent = 'พร้อมเล่น';
            }
        }
    });

    if (levelId === 1) {
        setTimeout(() => {
            initializeGame();
            logToConsole('เริ่มเล่นด่านที่ 1');
        }, 100);
    } else if (levelId === 2) {
        setTimeout(() => {
            if (window.LEVEL2 && window.LEVEL2.initialize) {
                window.LEVEL2.initialize();
                logToConsole('เริ่มเล่นด่านที่ 2');
            } else {
                logToConsole('⛔ ไม่สามารถโหลดด่านที่ 2 ได้');
            }
        }, 100);
    } else {
        logToConsole('⛔ ไม่สามารถเปลี่ยนด่านได้');
    }
}

function initializeEditor() {
require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" } });
require(["vs/editor/editor.main"], function () {
        gameState.editor = monaco.editor.create(document.getElementById("editor"), {
        value: `/**
 * ยิงภูเขาโดยใช้ console.log(หมายเลขภูเขา)
 * ภูเขามีหมายเลข 1-8
 * ตัวอย่าง: console.log(1) จะยิงภูเขาลูกที่ 1
 **/
console.log(ใส่หมายเลขภูเขาที่สูงที่สุด)


`,
        language: "javascript",
        theme: "vs-dark",
        fontSize: 15,
    });

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
    });
}

function setupWorkerHandlers() {
    if (!gameState.worker) {
        gameState.worker = new Worker('gameWorker.js');
    }

    gameState.worker.onmessage = function(e) {
        const { type, targetMountain, message, error } = e.data;
        
        switch (type) {
            case 'shoot':
                gameState.shootQueue.push(targetMountain);
                logToConsole(message || `เพิ่มภูเขาหมายเลข ${targetMountain} เข้าคิวการยิง`);
                break;
            case 'log':
                logToConsole(message);
                break;
            case 'error':
                logToConsole('Error: ' + error);
                break;
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
        
        if (message.includes('ชนกับภูเขา')) {
            logEntry.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #ff0000';
            logEntry.style.color = '#ff3333';
            
            const icon = document.createElement('span');
            icon.innerHTML = '⚠️ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else if (message.includes('ยิงภูเขา')) {
            logEntry.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #00cc00';
            logEntry.style.color = '#00cc00';
            
            const icon = document.createElement('span');
            icon.innerHTML = '🔫 ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else if (message.includes('เพิ่มภูเขา')) {
            logEntry.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
            logEntry.style.borderLeft = '4px solid #0066cc';
            logEntry.style.color = '#0066cc';
            
            const icon = document.createElement('span');
            icon.innerHTML = '⛰️ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else if (message.includes('Error')) {
            logEntry.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #cc0000';
            logEntry.style.color = '#cc0000';
            
            const icon = document.createElement('span');
            icon.innerHTML = '❌ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else {
            logEntry.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
            logEntry.style.borderLeft = '4px solid #999999';
            logEntry.style.color = '#fefefe';
        }
        
        const textSpan = document.createElement('span');
        textSpan.className = 'typing-text';
        textSpan.style.display = 'inline-block';
        textSpan.style.width = '0';
        textSpan.textContent = message;
        logEntry.appendChild(textSpan);
        
        logEntry.style.opacity = '0';
        logEntry.style.transform = 'translateY(-10px)';
        
        outputBox.appendChild(logEntry);
        
        outputBox.scrollTop = outputBox.scrollHeight;
        
        setTimeout(() => {
            logEntry.style.opacity = '1';
            logEntry.style.transform = 'translateY(0)';
            textSpan.style.width = '100%';
        }, 10);
    }
}

function runTestCase() {
    resetGame();
    gameState.isRunning = true;
    if (gameState.player) {
        gameState.player.setVelocityX(PLAYER_CONFIG.speed);
    }

    const code = gameState.editor.getValue();
    
    window.startTime = performance.now();
    
    if (gameState.worker) {
        gameState.worker.postMessage({
            type: 'run',
            code: code
        });
    }

    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.textContent = 'Try Again';
        playButton.onclick = function() {
            resetGame();
            runTestCase();
        };
    }
}

function resetGame() {
    gameState.isRunning = false;
    gameState.gameOver = false;
    gameState.shootQueue = [];
    
    if (gameState.player) {
        gameState.player.x = PLAYER_CONFIG.startX;
        gameState.player.y = PLAYER_CONFIG.startY;
        gameState.player.angle = 0;
        gameState.player.setVelocityX(0);
        gameState.player.setVisible(true);
        gameState.player.movingRight = true;
    }
    
    if (gameState.message) {
        gameState.message.setText('HP: 100');
    }
    
    const currentScene = gameState.game.scene.scenes[0];
    if (currentScene) {
        gameState.mountains.forEach(mountain => {
            if (mountain.sprite) mountain.sprite.destroy();
            if (mountain.target) mountain.target.destroy();
            if (mountain.heightText) mountain.heightText.destroy();
            if (mountain.numberText) mountain.numberText.destroy();
        });
        gameState.mountains = [];
        
        currentScene.createMountains();
    }

    const missionStatus = document.querySelector('.mission-status');
    if (missionStatus) {
        const conditions = missionStatus.querySelectorAll('.mission-condition');
        conditions.forEach(condition => {
            const checkmark = condition.querySelector('.checkmark');
            if (checkmark) {
                checkmark.style.display = 'none';
            }
        });
    }
    
    const elseCheckbox = document.getElementById('else-checkbox');
    if (elseCheckbox) {
        elseCheckbox.textContent = '✗';
        elseCheckbox.style.color = '#ff0000';
        elseCheckbox.style.animation = 'none';
    }

    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
        consoleOutput.innerHTML = '';
    }
}

function analyzeCodeComplexity(code) {
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
            suggestion: 'ลองลดการวนลูปหรือใช้วิธีอื่นแทน array methods'
        };
    } else {
        return {
            complexity: 'O(1)',
            message: '🚀 โค้ดของคุณมี time complexity ต่ำ (O(1))',
            suggestion: 'โค้ดของคุณมีประสิทธิภาพดีมาก!'
        };
    }
}

initializeGame();
initializeEditor();
setupWorkerHandlers();
