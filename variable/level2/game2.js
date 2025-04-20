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



const PLAYER_CONFIG = {
    startX: 400,
    startY: 60,
    scale: 0.2,
    speed: 150
};

let gameState = {
    player: null,
    variables: {},
    game: null,
    gameOver: false,
    editor: null,
    message: null,
    outputBox: null,
    hp: 100,
    isRunning: false,
    worker: null,
    score: 0,
    fruits: [],
    obstacles: [],
    level: 1,
    completedLevels: new Set(),
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image("bg", "./image/ChatGPT Image Apr 20, 2025, 01_27_07 PM.png");
        this.load.image("obstacle", "./image/rock.png");
        this.load.image("chestopen", "./image/chestopen.png");
        this.load.image("thief", "./image/thief-removebg-preview.png");
        this.load.image("chest", "./image/chestclose.png");
        this.load.image("paper", "./image/paperrrr-removebg-preview.png");
    }

    create() {
        this.createBackground();
        this.createPlayer();
        this.createpaper();
        
        this.dialogComponents = {
            box: null,
            text: null,
            pilot: null,
            blur: null,
            interval: null
        };
        
        this.createDialog = (messages) => {
            this.input.off('pointerdown', this.handleDialogClick);
            
            this.cleanupDialog();
            
            const x = 90;
            const y = 250;
            
            this.dialogComponents.box = this.add.graphics();
            this.dialogComponents.box.fillStyle(0x000000, 0.8);
            this.dialogComponents.box.fillRect(x, y, 600, 100);
            this.dialogComponents.box.lineStyle(2, 0xffffff);
            this.dialogComponents.box.strokeRect(x, y, 600, 100);
            
            this.dialogComponents.pilot = this.add.sprite(x - 20, y + 10, 'thief');
            this.dialogComponents.pilot.setScale(0.5);
            
            this.dialogComponents.text = this.add.text(x + 120, y + 30, '', {
                fontSize: '15px',
                fontFamily: 'Arial',
                color: '#ffffff',
                wordWrap: { width: 560 }
            });
            
            this.dialogComponents.blur = this.add.graphics();
            this.dialogComponents.blur.fillStyle(0x000000, 0.5);
            this.dialogComponents.blur.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
            
            this.dialogComponents.box.setDepth(1000);
            this.dialogComponents.text.setDepth(1001);
            this.dialogComponents.pilot.setDepth(1002);
            this.dialogComponents.blur.setDepth(999);
            
            this.dialogMessages = messages;
            this.currentMessageIndex = 0;
            
            this.showNextMessage();
            
            this.input.on('pointerdown', this.handleDialogClick);
        };
        
        // ฟังก์ชันสำหรับแสดงข้อความถัดไป
        this.showNextMessage = () => {
            if (this.dialogComponents.interval) {
                clearInterval(this.dialogComponents.interval);
            }
            
            if (this.currentMessageIndex >= this.dialogMessages.length) {
                this.cleanupDialog();
                return;
            }
            
            const text = this.dialogMessages[this.currentMessageIndex].text;
            let currentText = '';
            let charIndex = 0;
            
            this.dialogComponents.interval = setInterval(() => {
                if (charIndex < text.length) {
                    currentText += text[charIndex];
                    this.dialogComponents.text.setText(currentText);
                    charIndex++;
                } else {
                    clearInterval(this.dialogComponents.interval);
                    this.dialogComponents.interval = null;
                }
            }, 50);
        };
        
        // ฟังก์ชันจัดการการคลิก
        this.handleDialogClick = () => {
            this.currentMessageIndex++;
            this.showNextMessage();
        };
        
        // ฟังก์ชันทำความสะอาด
        this.cleanupDialog = () => {
            if (this.dialogComponents.interval) {
                clearInterval(this.dialogComponents.interval);
            }
            
            if (this.dialogComponents.box) {
                this.dialogComponents.box.destroy();
            }
            if (this.dialogComponents.text) {
                this.dialogComponents.text.destroy();
            }
            if (this.dialogComponents.pilot) {
                this.dialogComponents.pilot.destroy();
            }
            if (this.dialogComponents.blur) {
                this.dialogComponents.blur.destroy();
            }
            
            this.input.off('pointerdown', this.handleDialogClick);
            
            // รีเซ็ตตัวแปร
            this.dialogComponents = {
                box: null,
                text: null,
                pilot: null,
                blur: null,
                interval: null
            };
        };
        
        // แสดงบทสนทนาเริ่มต้น
        const welcomeMessages = [
            { text: "ยินดีต้อนรับสู่ด่านแห่งตัวแปร String", delay: 0 },
            { text: "ใช้คำสั่ง let,const เพื่อสร้างตัวแปร", delay: 0 },
            { text: "ใส่ชื่อตัวแปร และใส่ค่าให้กับตัวแปร", delay: 0 }
        ];
        
        this.createDialog(welcomeMessages);
    }
           
        // เช็คว่าเป็นด่านไหนและสร้าง elements ตามด่านนั้น
    createBackground() {
        const bg = this.add.image(350, 200, "bg");
        bg.setDisplaySize(800, 600);
    }

    createpaper() {
        // กำหนดตำแหน่งเริ่มต้นของกระดาษ
        const paperStartX = 500;
        const paperStartY = 100;
        const paperStartScale = 0.2;
        const paperExpandedScale = 0.8;
        const paperExpandedX = 300;
        const paperExpandedY = 200;

        // สร้างภาพกระดาษ
        this.paper = this.add.image(paperStartX, paperStartY, "paper")
            .setScale(paperStartScale)
            .setInteractive({ useHandCursor: true })
            .setDepth(1); // ตั้งค่า depth ให้อยู่ด้านบน

        this.paperText = this.add.text(paperStartX, paperStartY, 'chest = "เปิดกล่อง"', {
            font: '20px Arial',
            fill: '#000000',
            align: 'center'
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(2); // ตั้งค่า depth ให้อยู่ด้านบนสุด

        let isExpanded = false;

        this.paper.on('pointerover', () => {
            document.body.style.cursor = 'pointer';
            if (!isExpanded) {
                this.tweens.add({
                    targets: this.paper,
                    scale: paperStartScale * 1.1,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });

        this.paper.on('pointerout', () => {
            document.body.style.cursor = 'default';
            if (!isExpanded) {
                this.tweens.add({
                    targets: this.paper,
                    scale: paperStartScale,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });

        this.paper.on('pointerdown', () => {
            if (!isExpanded) {
                this.tweens.add({
                    targets: this.paper,
                    x: paperExpandedX,
                    y: paperExpandedY,
                    scale: paperExpandedScale,
                    duration: 500,
                    ease: 'Power2'
                });

                this.paperText.setVisible(true);
                this.paperText.x = paperExpandedX;
                this.paperText.y = paperExpandedY;
                
                this.tweens.add({
                    targets: this.paperText,
                    alpha: 1,
                    scale: 1.2,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        this.tweens.add({
                            targets: this.paperText,
                            scale: 1,
                            duration: 200,
                            ease: 'Power2'
                        });
                    }
                });
                isExpanded = true;
            }
        });

        this.input.on('pointerdown', (pointer) => {
            if (isExpanded) {
                const distance = Phaser.Math.Distance.Between(
                    pointer.x, pointer.y,
                    this.paper.x, this.paper.y
                );
                
                if (distance > 50) {
                    this.tweens.add({
                        targets: this.paper,
                        x: paperStartX,
                        y: paperStartY,
                        scale: paperStartScale,
                        duration: 500,
                        ease: 'Power2'
                    });

                    // แอนิเมชันการซ่อนข้อความที่เนียนขึ้น
                    this.tweens.add({
                        targets: this.paperText,
                        alpha: 0,
                        scale: 0.8,
                        y: paperExpandedY + 20,
                        duration: 100,
                        ease: 'Power2',
                        onComplete: () => {
                            this.paperText.setVisible(false);
                            this.paperText.x = paperStartX;
                            this.paperText.y = paperStartY;
                            this.paperText.alpha = 1;
                            this.paperText.scale = 1;
                        }
                    });
                    isExpanded = false;
                }
            }
        });
    }
    

    createPlayer() {
        this.player = this.physics.add.sprite(350, 213, "chest")
        
            .setScale(0.5);

        
        this.openchestScale = 0.8;  // คุณสามารถปรับค่านี้ได้ตามต้องการ
    }



  




    update() {
        if (!gameState.isRunning) return;

        if (gameState.variables.chest === "เปิดกล่อง" && !this.doorOpened) {
            this.doorOpened = true;
            
            if (this.player) {
                // เก็บตำแหน่งประตูเดิม
                const oldX = this.player.x;
                const oldY = this.player.y;
                
                this.player.destroy();
                
                // สร้างประตูใหม่ในตำแหน่งเดิม
                this.player = this.physics.add.sprite(oldX, oldY, "chestopen")
                    .setScale(0.7); // ตั้งขนาดเริ่มต้น
                
                this.tweens.add({
                    targets: this.player,
                    scaleX: this.openchestScale,
                    scaleY: this.openchestScale,
                    duration: 1000,
                    ease: 'Power2',
                    yoyo: true,
                    repeat: 0,
                    onComplete: () => {
                        logToConsole('ประตูเปิดแล้ว! คุณสามารถไปด่านต่อไปได้');
                        if (this.paper) {
                            this.paper.destroy();
                        }
                        if (this.paperText) {
                            this.paperText.destroy();
                        }
                        
                        gameState.completedLevels.add(gameState.level);
                        
                        const completedLevel = document.querySelector(`.level-item[data-level="${gameState.level}"]`);
                        if (completedLevel) {
                            completedLevel.style.backgroundColor = '#1a1e2f';
                            completedLevel.style.color = 'white';
                            const playButton = completedLevel.querySelector('.play-button');
                            if (playButton) {
                                playButton.style.backgroundColor = '#45a049';
                                playButton.style.color = 'white';
                            }
                        }

                        const missionStatus = document.getElementById('else-checkbox');
                        if (missionStatus) {
                            missionStatus.textContent = '✓';
                            missionStatus.style.color = '#00ff00';
                            missionStatus.style.fontSize = '24px';
                            missionStatus.style.transition = 'all 0.3s ease';
                        }

                        const dialogBox = this.add.graphics();
                        const x = 90;
                        const y = 250;
                        
                        dialogBox.fillStyle(0x000000, 0.8);
                        dialogBox.fillRect(x, y, 600, 100);
                        dialogBox.lineStyle(2, 0xffffff);
                        dialogBox.strokeRect(x, y, 600, 100);

                        const pilot = this.add.sprite(x + -20, y + 10, 'thief');
                        pilot.setScale(0.5);
                        pilot.setDepth(1002);
                        
                        const messages = [
                            { text: "ยินดีด้วย! คุณทำภารกิจสำเร็จแล้ว", delay: 0 },
                            { text: "คุณได้เรียนรู้การใช้งานตัวแปร const แล้ว", delay: 0 },
                            { text: "ไปต่อที่ด่านถัดไปกันเถอะ!", delay: 0 }
                        ];
                        
                        const dialogText = this.add.text(x + 100, y + 30, '', {
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
                            pilot.destroy();
                            this.input.off('pointerdown', handleClick);
                        };
                        
                        // ฟังก์ชันจัดการการคลิก
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

                        // ปลดล็อด่านถัดไป
                        const nextLevel = document.querySelector(`.level-item[data-level="${gameState.level + 1}"]`);
                        if (nextLevel) {
                            nextLevel.classList.remove('locked');
                            const playButton = nextLevel.querySelector('.play-button');
                            if (playButton) {
                                playButton.disabled = false;
                                playButton.style.opacity = '1';
                                playButton.style.cursor = 'pointer';
                            }
                            const lockIcon = nextLevel.querySelector('.lock-icon');
                            if (lockIcon) {
                                lockIcon.remove();
                            }
                            nextLevel.style.cursor = 'pointer';
                            nextLevel.addEventListener('mouseenter', () => {
                                nextLevel.style.transform = 'scale(1.02)';
                                nextLevel.style.transition = 'transform 0.2s';
                            });
                            nextLevel.addEventListener('mouseleave', () => {
                                nextLevel.style.transform = 'scale(1)';
                            });
                        }
                        
                        gameState.level++;
                    }
                });
            }
        } else if (gameState.variables.chest !== undefined && !this.doorOpened) {
            this.player.setVelocityX(0);
            this.player.setVelocityY(0);
            
            if (!this.passcodeErrorLogged) {
                console.log("รหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง");
                this.passcodeErrorLogged = true;
            }
        }
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
            value: `// พิมพ์รหัสผ่านตามรูปแบบด้านล่างเพื่อเปิดประตู:
// กำหนดตัวแปร เป็นค่าคงที่ และใส่ค่าให้กับตัวแปร

let //ใส่คำสั่งตรงนี้;
console.log(chest);`,
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
    });
}

function setupWorkerHandlers() {
    if (!gameState.worker) {
        gameState.worker = new Worker('gameWorker.js');
        console.log('Worker initialized');
    }

    gameState.worker.onmessage = function(e) {
        const { type, variableName, value, message, error } = e.data;
        console.log('Received message from worker:', { type, variableName, value, message, error });
        
        if (type === 'variable') {
            gameState.variables[variableName] = value;
            console.log('Variable set:', variableName, value);
        } else if (type === 'log') {
            logToConsole(message);
        } else if (type === 'error') {
            logToConsole('Error: ' + error);
        }
    };

    gameState.worker.onerror = function(error) {
        console.error('Worker error:', error);
        logToConsole('Error: ' + error.message);
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
        } else if (message.includes('รหัสผ่าน')) {
            logEntry.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #00cc00';
            logEntry.style.color = '#00cc00';
            
            const icon = document.createElement('span');
            icon.innerHTML = '✅ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
            
        } else if (message.includes('ประตู')) {
            logEntry.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #00cc00';
            logEntry.style.color = '#00cc00';
            
            const icon = document.createElement('span');
            icon.innerHTML = '✅ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
            
        }
        else if (message.includes('เพิ่มภูเขา')) {
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

function runTestCase(level) {
    console.log('Running test case');
    resetGame();
    gameState.isRunning = true;

    const code = gameState.editor.getValue();
    console.log('Editor code:', code);
    
    if (gameState.worker) {
        gameState.worker.postMessage({
            type: 'run',
            code: code
        });
        console.log('Code sent to worker');
    } else {
        console.error('Worker not initialized');
    }
}

function resetGame() {
    gameState.isRunning = false;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.level = 1;
    
    if (gameState.player) {
        gameState.player.x = PLAYER_CONFIG.startX;
        gameState.player.y = PLAYER_CONFIG.startY;
        gameState.player.angle = 0;
        gameState.player.setVelocityX(0);
        gameState.player.setVisible(true);
    }
    
    if (gameState.message) {
        gameState.message.setText('HP: 100');
    }
    
   
}

function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        const total = Math.max(gameState.moveHistory.length || 1, gameState.maxFrames);
        const percent = (gameState.currentFrame / total) * 100;
        progressBar.style.width = `${percent}%`;
    }
}

function previousFrame() {
    if (gameState.currentFrame > 0) {
        gameState.currentFrame--;
        updateFrameDisplay();
        updatePlayerPosition(true);
    }
}

function nextFrame() {
    if (gameState.currentFrame < gameState.moveHistory.length) {
        gameState.currentFrame++;
        updateFrameDisplay();
        updatePlayerPosition(true);
    }
}

function playPause() {
    if (!gameState.moveHistory) {
        gameState.moveHistory = [];
    }
    
    if (!gameState.moveHistory.length) return;
    
    gameState.isPlaying = !gameState.isPlaying;
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.textContent = gameState.isPlaying ? '⏸️' : '▶️';
    
    if (gameState.isPlaying) {
        gameState.frameInterval = setInterval(() => {
            if (gameState.currentFrame < gameState.moveHistory.length) {
                gameState.currentFrame++;
                updateFrameDisplay();
                updatePlayerPosition(true);
            } else {
                gameState.isPlaying = false;
                playPauseBtn.textContent = '▶️';
                clearInterval(gameState.frameInterval);
            }
        }, GAME_CONFIG.PLAYBACK_SPEED);
    } else {
        clearInterval(gameState.frameInterval);
    }
}

initializeGame();
initializeEditor();
setupWorkerHandlers();
