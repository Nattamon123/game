// Game Configuration
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

// Mountain Configuration


// Player Configuration
const PLAYER_CONFIG = {
    startX: 400,
    startY: 60,
    scale: 0.2,
    speed: 150
};

// Game State
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

// Game Scene Class
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image("bg", "./image/library-interior-empty-room-reading-with-books-wooden-shelves_33099-1722.avif");
        this.load.image("obstacle", "./image/rock.png");
        // this.load.image("chestopen", "./image/chestopen.png");
        this.load.image("thief", "./image/thief-removebg-preview.png");
        // this.load.image("chest", "./image/chestclose.png");
        this.load.image("shelf", "./image/bookseee.jpg");
        this.load.image("paper", "./image/paperrrr-removebg-preview.png");
        this.load.image("history", "./image/q27h86dkjhmQ9Hvvx1S-o.jpg");
        this.load.image("science", "./image/pid-26957.jpg");
        this.load.image("math", "./image/displaypics.webp");
    }
    create() {
        this.createBackground();
        this.createShelf();
        
        // สร้างหนังสือและเก็บ reference
        this.historyBook = this.add.image(270, 200, "history").setScale(0.11);
        this.scienceBook = this.add.image(270, 300, "science").setScale(0.1);
        this.mathBook = this.add.image(270, 100, "math").setScale(0.05);
        
        // สร้างข้อความบนกระดาษ
        
        // สร้างข้อความบอกประเภทหนังสือ
        this.createFloatingText();
        
        // กำหนดค่าเริ่มต้น
        this.booksArranged = false;
        this.dialogueActive = false;
        this.currentMessageIndex = 0;
        this.typingInterval = null;

        // แสดงข้อความต้อนรับ
        this.showWelcomeDialogue();
    }

    showWelcomeDialogue() {
        if (this.dialogueActive) return;
        this.dialogueActive = true;
        this.currentMessageIndex = 0;
        
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 250;
        
        // วาดกล่องข้อความ
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        // เพิ่มรูปนักบิน
        const pilot = this.add.sprite(x + -20, y + 10, 'thief');
        pilot.setScale(0.5);
        pilot.setDepth(1002);
        
        // สร้างข้อความ
        const messages = [
            { text: "ยินดีต้อนรับสู่ด่านแห่ง Array", delay: 0 },
            { text: "เรียงลำดับหนังสือให้ถูกต้องตามชั้น:", delay: 0 },
            { text: "ชั้นที่ 1: หนังสือประวัติศาสตร์", delay: 0 },
            { text: "ชั้นที่ 2: หนังสือวิทยาศาสตร์", delay: 0 },
            { text: "ชั้นที่ 3: หนังสือคณิตศาสตร์", delay: 0 }
        ];
        
        // สร้าง Text object
        const dialogText = this.add.text(x + 120, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        // ทำให้กล่องข้อความและข้อความอยู่ด้านบนสุด
        dialogBox.setDepth(1000);
        dialogText.setDepth(1001);
        
        // สร้างเอฟเฟกต์เบลอสำหรับส่วนอื่นๆ ของเกม
        const blurEffect = this.add.graphics();
        blurEffect.fillStyle(0x000000, 0.5);
        blurEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        blurEffect.setDepth(999);
        
        // ฟังก์ชันสำหรับแสดงข้อความแบบอนิเมชั่นการพิมพ์
        const showTypingMessage = (text) => {
            if (this.typingInterval) {
                clearInterval(this.typingInterval);
            }
            
            let currentText = '';
            let charIndex = 0;
            
            this.typingInterval = setInterval(() => {
                if (charIndex < text.length) {
                    currentText += text[charIndex];
                    dialogText.setText(currentText);
                    charIndex++;
                } else {
                    clearInterval(this.typingInterval);
                    this.typingInterval = null;
                }
            }, 50);
        };
        
        // แสดงข้อความแรก
        showTypingMessage(messages[0].text);
        
        // ฟังก์ชันสำหรับทำความสะอาด
        const cleanup = () => {
            if (this.typingInterval) {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
            }
            dialogBox.destroy();
            dialogText.destroy();
            blurEffect.destroy();
            pilot.destroy();
            this.input.off('pointerdown', handleClick);
            this.dialogueActive = false;
        };
        
        // ฟังก์ชันจัดการการคลิก
        const handleClick = () => {
            this.currentMessageIndex++;
            if (this.currentMessageIndex < messages.length) {
                showTypingMessage(messages[this.currentMessageIndex].text);
            } else {
                cleanup();
            }
        };
        
        // เพิ่ม event listener สำหรับการคลิกที่ไหนก็ได้ในเกม
        this.input.on('pointerdown', handleClick);
        
        // เพิ่ม timeout เพื่อทำความสะอาดอัตโนมัติหลังจาก 10 วินาที
        this.time.delayedCall(10000, cleanup);
    }

    showSuccessDialogue() {
        if (this.dialogueActive) return;
        this.dialogueActive = true;
        this.currentMessageIndex = 0;
        
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 250;
        
        // วาดกล่องข้อความ
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        // เพิ่มรูปนักบิน
        const pilot = this.add.sprite(x + -20, y + 10, 'thief');
        pilot.setScale(0.5);
        pilot.setDepth(1002);
        
        // สร้างข้อความแสดงความยินดี
        const messages = [
            { text: "ยินดีด้วย! คุณเรียงลำดับหนังสือถูกต้องแล้ว", delay: 0 },
            { text: "คุณได้เรียนรู้การใช้งาน Array แล้ว", delay: 0 },
            { text: "ไปต่อที่ด่านถัดไปกันเถอะ!", delay: 0 }
        ];
        
        // สร้าง Text object
        const dialogText = this.add.text(x + 120, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        // ทำให้กล่องข้อความและข้อความอยู่ด้านบนสุด
        dialogBox.setDepth(1000);
        dialogText.setDepth(1001);
        
        // สร้างเอฟเฟกต์เบลอสำหรับส่วนอื่นๆ ของเกม
        const blurEffect = this.add.graphics();
        blurEffect.fillStyle(0x000000, 0.5);
        blurEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        blurEffect.setDepth(999);
        
        // ฟังก์ชันสำหรับแสดงข้อความแบบอนิเมชั่นการพิมพ์
        const showTypingMessage = (text) => {
            if (this.typingInterval) {
                clearInterval(this.typingInterval);
            }
            
            let currentText = '';
            let charIndex = 0;
            
            this.typingInterval = setInterval(() => {
                if (charIndex < text.length) {
                    currentText += text[charIndex];
                    dialogText.setText(currentText);
                    charIndex++;
                } else {
                    clearInterval(this.typingInterval);
                    this.typingInterval = null;
                }
            }, 50);
        };
        
        // แสดงข้อความแรก
        showTypingMessage(messages[0].text);
        
        // ฟังก์ชันสำหรับทำความสะอาด
        const cleanup = () => {
            if (this.typingInterval) {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
            }
            dialogBox.destroy();
            dialogText.destroy();
            blurEffect.destroy();
            pilot.destroy();
            this.input.off('pointerdown', handleClick);
            this.dialogueActive = false;
            
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
                // เพิ่ม hover effect สำหรับด่านที่เพิ่งปลดล็อค
                nextLevel.style.cursor = 'pointer';
                nextLevel.addEventListener('mouseenter', () => {
                    nextLevel.style.transform = 'scale(1.02)';
                    nextLevel.style.transition = 'transform 0.2s';
                });
                nextLevel.addEventListener('mouseleave', () => {
                    nextLevel.style.transform = 'scale(1)';
                });
            }
            
            // เพิ่มค่า level แต่ไม่เปลี่ยนด่านอัตโนมัติ
            gameState.level++;
        };
        
        // ฟังก์ชันจัดการการคลิก
        const handleClick = () => {
            this.currentMessageIndex++;
            if (this.currentMessageIndex < messages.length) {
                showTypingMessage(messages[this.currentMessageIndex].text);
            } else {
                cleanup();
            }
        };
        
        // เพิ่ม event listener สำหรับการคลิกที่ไหนก็ได้ในเกม
        this.input.on('pointerdown', handleClick);
        
        // เพิ่ม timeout เพื่อทำความสะอาดอัตโนมัติหลังจาก 10 วินาที
        this.time.delayedCall(10000, cleanup);
    }

    createMath() {
        const math = this.add.image(270, 100, "math");
        math.setScale(0.05);
    }
    createFloatingText() {
        // กำหนดตำแหน่งและข้อความ
        const texts = [
            { text: 'ชั้นที่ 1: หนังสือประวัติศาสตร์', x: 370, y: 100 },
            { text: 'ชั้นที่ 2: หนังสือวิทยาศาสตร์', x: 370, y: 190 },
            { text: 'ชั้นที่ 3: หนังสือคณิตศาสตร์', x: 370, y: 290 }
        ];

        // สร้างตัวหนังสือแต่ละตัว
        texts.forEach((item, index) => {
            // สร้างข้อความ
            const text = this.add.text(item.x, item.y, item.text, {
                fontFamily: 'Arial',
                fontSize: '15px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000',
                    blur: 2,
                    stroke: true,
                    fill: true
                }
            }).setOrigin(0.2);
        });
    }
        
    createHistory() {
        const history = this.add.image(270, 200, "history");
        history.setScale(0.11);
    }

    createScience() {
        const science = this.add.image(270, 300, "science");
        science.setScale(0.1);
    }

    createBackground() {
        const bg = this.add.image(350, 200, "bg");
        bg.setDisplaySize(800, 600);
    }
    createShelf() {
        const shelf = this.add.image(330, 200, "shelf");
        shelf.setScale(0.7);
    }
   
    

    createPlayer() {
        this.player = this.physics.add.sprite(350, 213, "chest")
        
            .setScale(0.5);

        
        // กำหนดขนาดเริ่มต้นของประตูตอนเปิด
        this.openchestScale = 0.8;  // คุณสามารถปรับค่านี้ได้ตามต้องการ
    }



  




    update() {
        if (!gameState.isRunning) return;

        // ตรวจสอบการเรียงลำดับหนังสือ
        if (gameState.variables.books && gameState.variables.books.length === 3 && !this.booksArranged) {
            const correctOrder = ['หนังสือประวัติศาสตร์', 'หนังสือวิทยาศาสตร์', 'หนังสือคณิตศาสตร์'];
            const isCorrect = gameState.variables.books.every((book, index) => book === correctOrder[index]);
            
            // ย้ายหนังสือไปยังตำแหน่งที่ถูกต้องตามลำดับที่ผู้เล่นเรียง
            const bookPositions = [
                { x: 220, y: 110 },   // ตำแหน่งชั้นที่ 1
                { x: 220, y: 200 },  // ตำแหน่งชั้นที่ 2
                { x: 220, y: 300 }   // ตำแหน่งชั้นที่ 3
            ];

            // ย้ายหนังสือไปยังตำแหน่งที่ผู้เล่นเรียง
            for (let i = 0; i < gameState.variables.books.length; i++) {
                const book = gameState.variables.books[i];
                let targetBook;

                if (book === 'หนังสือประวัติศาสตร์') {
                    targetBook = this.historyBook;
                } else if (book === 'หนังสือวิทยาศาสตร์') {
                    targetBook = this.scienceBook;
                } else if (book === 'หนังสือคณิตศาสตร์') {
                    targetBook = this.mathBook;
                }

                if (targetBook) {
                    this.tweens.add({
                        targets: targetBook,
                        x: bookPositions[i].x,
                        y: bookPositions[i].y,
                        duration: 1000,
                        ease: 'Power2',
                        onComplete: () => {
                            if (i === 2) {  // เมื่อย้ายหนังสือเล่มสุดท้ายเสร็จ
                                if (isCorrect) {
                                    // เปลี่ยนเครื่องหมายภารกิจจาก ✗ เป็น ✓
                                    const missionStatus = document.getElementById('else-checkbox');
                                    if (missionStatus) {
                                        missionStatus.textContent = '✓';
                                        missionStatus.style.color = '#00ff00';
                                        missionStatus.style.fontSize = '24px';
                                        missionStatus.style.fontWeight = 'bold';
                                    }

                                    // แสดงข้อความยินดี
                                    this.showSuccessDialogue();
                                }
                            }
                        }
                    });
                }
            }

            this.booksArranged = true;
        }
    }
}

// Initialize game
function initializeGame() {
    gameState.game = new Phaser.Game(GAME_CONFIG);
    gameState.game.scene.add('GameScene', GameScene);
    gameState.game.scene.start('GameScene');
}

// Initialize editor
function initializeEditor() {
    require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" } });
    require(["vs/editor/editor.main"], function () {
        gameState.editor = monaco.editor.create(document.getElementById("editor"), {
            value: `// เรียงลำดับหนังสือให้ถูกต้องตามชั้น:
// ชั้นที่ 1: หนังสือประวัติศาสตร์
// ชั้นที่ 2: หนังสือวิทยาศาสตร์
// ชั้นที่ 3: หนังสือคณิตศาสตร์

let books = ["ชื่อหนังสือ", "ชื่อหนังสือ", "ชื่อหนังสือ"];
console.log(books);`,
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

// Worker management
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

// Utility functions
function logToConsole(message) {
    console.log('Debug:', message);
    const outputBox = document.getElementById('console-output');
    if (outputBox) {
        const logEntry = document.createElement('div');
        logEntry.className = 'console-entry';
        
        // กำหนดสไตล์ให้กับ logEntry
        logEntry.style.padding = '8px 12px';
        logEntry.style.margin = '4px 0';
        logEntry.style.borderRadius = '4px';
        logEntry.style.fontFamily = 'Arial, sans-serif';
        logEntry.style.fontSize = '14px';
        logEntry.style.lineHeight = '1.4';
        logEntry.style.transition = 'all 0.3s ease';
        
        // ตรวจสอบประเภทของข้อความและกำหนดสไตล์ที่เหมาะสม
        if (message.includes('ชนกับภูเขา')) {
            logEntry.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #ff0000';
            logEntry.style.color = '#ff3333';
            
            // เพิ่มไอคอนเตือน
            const icon = document.createElement('span');
            icon.innerHTML = '⚠️ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else if (message.includes('รหัสผ่าน')) {
            logEntry.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #00cc00';
            logEntry.style.color = '#00cc00';
            
            // เพิ่มไอคอนเลเซอร์
            const icon = document.createElement('span');
            icon.innerHTML = '✅ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
            
        } else if (message.includes('ลำดับหนังสือถูกต้อง')) {
            logEntry.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #00cc00';
            logEntry.style.color = '#00cc00';
            
            // เพิ่มไอคอนเลเซอร์
            const icon = document.createElement('span');
            icon.innerHTML = '✅ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
            
        }
        else if (message.includes('เพิ่มภูเขา')) {
            logEntry.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
            logEntry.style.borderLeft = '4px solid #0066cc';
            logEntry.style.color = '#0066cc';
            
            // เพิ่มไอคอนภูเขา
            const icon = document.createElement('span');
            icon.innerHTML = '⛰️ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else if (message.includes('กรุณาเรียงลำดับหนังสือให้ถูกต้อง')) {
            logEntry.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            logEntry.style.borderLeft = '4px solid #cc0000';
            logEntry.style.color = '#cc0000';
            
            // เพิ่มไอคอนข้อผิดพลาด
            const icon = document.createElement('span');
            icon.innerHTML = '❌ ';
            icon.style.marginRight = '8px';
            logEntry.appendChild(icon);
        } else {
            logEntry.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
            logEntry.style.borderLeft = '4px solid #999999';
            logEntry.style.color = '#fefefe';
        }
        
        // เพิ่มข้อความ
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        logEntry.appendChild(textSpan);
        
        // เพิ่มเอฟเฟคเมื่อเพิ่มข้อความใหม่
        logEntry.style.opacity = '0';
        logEntry.style.transform = 'translateY(-10px)';
        
        outputBox.appendChild(logEntry);
        
        // เลื่อนไปที่ข้อความล่าสุด
        outputBox.scrollTop = outputBox.scrollHeight;
        
        // เอฟเฟคการแสดงผล
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

// Initialize everything
initializeGame();
initializeEditor();
setupWorkerHandlers();
