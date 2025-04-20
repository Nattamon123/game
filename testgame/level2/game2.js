// Game Configuration
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

// Mountain Configuration


// Player Configuration
const PLAYER_CONFIG = {
    startX: 200,
    startY: 150,
    scale: 0.13,
    speed: 60,
    verticalSpeed: 100  // ความเร็วสำหรับการเคลื่อนที่ในแนวตั้ง
};

// Game State
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

// Dialog Configuration
const DIALOG_CONFIG = {
    width: 600,
    padding: 10,
    background: 0x000000,
    alpha: 0.8,
    fontSize: 18,
    fontFamily: 'Arial',
    color: '#ffffff'
};

// Game Scene Class
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // โหลดรูปภาพตัวละครสำหรับอนิเมชั่น
        this.load.image('player1', './image/characetor/1.png');
        this.load.image('player2', './image/characetor/2.png');
        this.load.image('player3', './image/characetor/3.png');
        this.load.image('tresure', './image/tresure.png');
        this.load.image("mountain", "./image/mt-removebg-preview.png");
        this.load.image("bg", "./image/Orc-Lands-Horizontal-Battle-Backgrounds2 (1).png");
        this.load.image("pilot", "./image/man-pilot-2d-cartoon-illustraton-white-background-high_889056-26132-removebg-preview.png");
        this.load.spritesheet('lightning', './image/lightn.png', { frameWidth: 32, frameHeight: 32 });
        
        // เพิ่มการตรวจสอบการโหลดรูปภาพ
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
        this.createEnergyText();
        this.initializeWorker();
        this.createtresure();
        // สร้างอนิเมชั่นการเดิน
        this.createPlayerAnimations();
        
        // สร้างกล่องข้อความ
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 290;
        
        // วาดกล่องข้อความ
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        // ประกาศตัวแปร pilot ในระดับที่สามารถเข้าถึงได้จากทุกที่ใน create()
        let pilot = null;
        
        // เพิ่มรูปนักบิน
        try {
            pilot = this.add.sprite(x + 10, y + 10, 'pilot');
            pilot.setScale(0.5);
            pilot.setDepth(1002); // ให้แน่ใจว่าอยู่ด้านบนสุด
            console.log('Pilot sprite created successfully');
        } catch (error) {
            console.error('Error creating pilot sprite:', error);
        }
        
        // สร้างข้อความ
        const messages = [
            { text: "ยินดีต้อนรับสู่ด่านแห่งการลูป", delay: 0 },
            { text: "ใช้คำสั่ง for loop เพื่อยิงภูเขาทั้งหมด", delay: 0 },
            { text: "ระวังอย่าให้ยานชนกับภูเขา และทำภารกิจให้สำเร็จ!", delay: 0 }
        ];
        
        // สร้าง Text object
        const dialogText = this.add.text(x + 100, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        // เก็บ index ของข้อความปัจจุบัน
        let currentMessageIndex = 0;
        let typingInterval = null;
        
        // ฟังก์ชันสำหรับแสดงข้อความแบบอนิเมชั่นการพิมพ์
        const showTypingMessage = (text) => {
            // เคลียร์ interval ก่อนหน้า (ถ้ามี)
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
            }, 50); // ความเร็วในการพิมพ์
        };
        
        // แสดงข้อความแรก
        showTypingMessage(messages[0].text);
        
        // สร้างเอฟเฟกต์เบลอสำหรับส่วนอื่นๆ ของเกม
        const blurEffect = this.add.graphics();
        blurEffect.fillStyle(0x000000, 0.5);
        blurEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        // ทำให้กล่องข้อความและข้อความอยู่ด้านบนสุด
        dialogBox.setDepth(1000);
        dialogText.setDepth(1001);
        blurEffect.setDepth(999);
        
        // ฟังก์ชันสำหรับทำความสะอาด
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
        
        // ฟังก์ชันจัดการการคลิก
        const handleClick = () => {
            currentMessageIndex++;
            if (currentMessageIndex < messages.length) {
                showTypingMessage(messages[currentMessageIndex].text);
            } else {
                cleanup();
            }
        };
        
        // เพิ่ม event listener สำหรับการคลิกที่ไหนก็ได้ในเกม
        this.input.on('pointerdown', handleClick);
        
        // เพิ่ม timeout เพื่อทำความสะอาดอัตโนมัติหลังจาก 10 วินาที
        this.time.delayedCall(10000, cleanup);
    }

    createBackground() {
        const bg = this.add.image(300,195, "bg");
        bg.setScale(0.5); // ลดขนาดลงเหลือ 50% ของขนาดเดิม
    }
    createtresure() {
        gameState.treasure = this.add.image(450, 150, "tresure");
        gameState.treasure.setScale(0.3);
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
        // สร้างอนิเมชั่นการเดิน
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

        // ส่งตำแหน่งไปยัง worker
        if (gameState.worker && gameState.isRunning) {
            gameState.worker.postMessage({
                type: 'positions',
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                treasureX: gameState.treasure.x,
                treasureY: gameState.treasure.y
            });
        }

        // แสดงข้อมูลสถานะตัวละครทุก 0.5 วินาที
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

        // ตรวจสอบการชนกับกล่องสมบัติ
        if (gameState.treasure && !gameState.missionComplete) {
            const playerBounds = gameState.player.getBounds();
            const treasureBounds = gameState.treasure.getBounds();
            
            // เพิ่มระยะห่างที่ต้องชิดกันมากๆ
            const distance = Phaser.Math.Distance.Between(
                playerBounds.centerX,
                playerBounds.centerY,
                treasureBounds.centerX,
                treasureBounds.centerY
            );
            
            // ต้องอยู่ห่างไม่เกิน 30 pixels
            if (distance < 30) {
                this.handleTreasureCollision();
            }
        }

        // ตรวจสอบการชนขอบก่อนการเคลื่อนที่
        const playerBounds = gameState.player.getBounds();
        const margin = 20;
        
        // ตรวจสอบการชนขอบขวาโดยละเอียด
        const rightEdge = playerBounds.x + playerBounds.width;
        if (rightEdge >= GAME_CONFIG.width - margin) {
            console.log('DEBUG: ชนขอบขวา!', {
                playerX: playerBounds.x,
                playerWidth: playerBounds.width,
                rightEdge: rightEdge,
                gameWidth: GAME_CONFIG.width
            });
            
            // หยุดการเคลื่อนที่และอนิเมชั่นทันที
            gameState.player.setVelocityX(0);
            gameState.player.setVelocityY(0);
            gameState.player.anims.stop();
            
            // เรียกฟังก์ชันจัดการการชนขอบ
            this.handleBoundaryCollision();
            return;
        }

        // ตรวจสอบการชนขอบอื่นๆ
        if (playerBounds.x <= margin || 
            playerBounds.y <= margin || 
            playerBounds.y + playerBounds.height >= GAME_CONFIG.height - margin) {
            
            console.log('DEBUG: ชนขอบอื่น!', {
                x: playerBounds.x,
                y: playerBounds.y,
                width: playerBounds.width,
                height: playerBounds.height
            });
            
            // หยุดการเคลื่อนที่และอนิเมชั่นทันที
            gameState.player.setVelocityX(0);
            gameState.player.setVelocityY(0);
            gameState.player.anims.stop();
            
            // เรียกฟังก์ชันจัดการการชนขอบ
            this.handleBoundaryCollision();
            return;
        }

        // ลดพลังงานเมื่อเคลื่อนที่
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
        // ลดพลังงานเหลือ 0 เมื่อชนขอบ
        gameState.energy = 0;
        this.updateEnergyText();
        
        // สร้างเอฟเฟกต์เมื่อชนขอบ
        this.createCollisionEffect();
        
        // จัดการเมื่อพลังงานหมด
        this.handleEnergyDepleted();
    }

    createCollisionEffect() {
        // สร้างเอฟเฟกต์กระพริบ
        const flash = this.add.graphics();
        flash.fillStyle(0xff0000, 0.5);
        flash.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        // อนิเมชันกระพริบ
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
        
        // หยุดการเคลื่อนที่
        gameState.player.setVelocityX(0);
        gameState.player.setVelocityY(0);
        
        // แสดงข้อความ
        logToConsole('พลังงานหมด! เกมจบแล้ว');
        
        // สร้างเอฟเฟกต์เมื่อพลังงานหมด
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
            
            // เปลี่ยนสีตามระดับพลังงาน
            if (gameState.energy > 50) {
                gameState.energyText.setColor('#00ff00'); // สีเขียว
            } else if (gameState.energy > 20) {
                gameState.energyText.setColor('#ffff00'); // สีเหลือง
            } else {
                gameState.energyText.setColor('#ff0000'); // สีแดง
            }
        }
    }

    createEnergyDepletedEffect() {
        // สร้างเอฟเฟกต์แสงจาง
        const fade = this.add.graphics();
        fade.fillStyle(0x000000, 0.5);
        fade.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        
        // อนิเมชันการจางลง
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
            
            // เปลี่ยนสีตามระดับเลือด
            if (gameState.health > 50) {
                gameState.healthText.setColor('#00ff00'); // สีเขียว
            } else if (gameState.health > 20) {
                gameState.healthText.setColor('#ffff00'); // สีเหลือง
            } else {
                gameState.healthText.setColor('#ff0000'); // สีแดง
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
        console.log('Sending code to worker:', code); // Debug log
        
        if (gameState.worker) {
            gameState.worker.postMessage({
                type: 'run',
                code: code
            });
        } else {
            console.error('Worker is not initialized');
        }
    }

    // เพิ่มฟังก์ชันวิเคราะห์ time complexity
    analyzeCodeComplexity(code) {
        // ตรวจสอบการวนลูป
        const loops = code.match(/for\s*\(|while\s*\(|do\s*{/g) || [];
        const nestedLoops = code.match(/for\s*\(.*for\s*\(|while\s*\(.*while\s*\(|do\s*{.*do\s*{/g) || [];
        
        // ตรวจสอบการเรียกฟังก์ชันแบบ recursive
        const recursiveCalls = code.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?\b\w+\s*\([^)]*\)[\s\S]*?}/g) || [];
        
        // ตรวจสอบการใช้งาน array methods ที่มี time complexity สูง
        const highComplexityMethods = code.match(/\.sort\(|\.reduce\(|\.filter\(|\.map\(/g) || [];
        
        // วิเคราะห์ time complexity
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
        
        // หยุดอนิเมชั่นก่อนเปลี่ยนทิศทาง
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

        // แสดงข้อมูลใน console-output
        if (directionText) {
            const message = `กำลังเคลื่อนที่ไปทาง: ${directionText} | พลังงาน: ${Math.floor(gameState.energy)} | เลือด: ${Math.floor(gameState.health)}`;
            logToConsole(message);
        }
    }

    handleTreasureCollision() {
        gameState.missionComplete = true;
        
        // หยุดการเคลื่อนที่
        gameState.player.setVelocityX(0);
        gameState.player.setVelocityY(0);
        gameState.player.anims.stop();
        
        // อัปเดตสถานะภารกิจ
        const elseCheckbox = document.getElementById('else-checkbox');
        if (elseCheckbox) {
            elseCheckbox.innerHTML = '✓';
            elseCheckbox.parentElement.classList.add('completed');
        }
        
        // สร้างกล่องข้อความ
        const dialogBox = this.add.graphics();
        const x = 90;
        const y = 290;
        
        // วาดกล่องข้อความ
        dialogBox.fillStyle(0x000000, 0.8);
        dialogBox.fillRect(x, y, 600, 100);
        dialogBox.lineStyle(2, 0xffffff);
        dialogBox.strokeRect(x, y, 600, 100);

        // เพิ่มรูปนักบิน
        const pilot = this.add.sprite(x + 10, y + 10, 'pilot');
        pilot.setScale(0.5);
        pilot.setDepth(1002); // ให้แน่ใจว่าอยู่ด้านบนสุด

        // สร้างข้อความ
        const messages = [
            { text: "ยินดีด้วย! คุณได้พบสมบัติแล้ว!", delay: 0 },
            { text: "ภารกิจสำเร็จ! คุณได้เรียนรู้การใช้ for loop ในการควบคุมตัวละคร", delay: 0 },
            { text: "กดปุ่มใดก็ได้เพื่อไปยังด่านต่อไป", delay: 0 }
        ];
        
        // สร้าง Text object
        const dialogText = this.add.text(x + 100, y + 30, '', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 560 }
        });

        // เก็บ index ของข้อความปัจจุบัน
        let currentMessageIndex = 0;
        let typingInterval = null;
        
        // ฟังก์ชันสำหรับแสดงข้อความแบบอนิเมชั่นการพิมพ์
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
        
        // แสดงข้อความแรก
        showTypingMessage(messages[0].text);
        
        // ฟังก์ชันจัดการการคลิก
        const handleClick = () => {
            currentMessageIndex++;
            if (currentMessageIndex < messages.length) {
                showTypingMessage(messages[currentMessageIndex].text);
            } else {
                // เมื่อจบบทสนทนา
                dialogBox.destroy();
                dialogText.destroy();
                pilot.destroy();
                this.input.off('pointerdown', handleClick);
                
                // เปลี่ยนไปยังด่านต่อไป
           
            }
        };
        
        // เพิ่ม event listener สำหรับการคลิก
        this.input.on('pointerdown', handleClick);
    }
}

// Initialize game
function initializeGame() {
    gameState.game = new Phaser.Game(GAME_CONFIG);
    gameState.game.scene.add('GameScene', GameScene);
    gameState.game.scene.start('GameScene');
}

// Function to switch levels


// Initialize editor
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
 for loop เท่านั้น
 **/
console.log(east)



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
    }

    gameState.worker.onmessage = function(e) {
        const { type, message } = e.data;
        
        if (type === 'log') {
            const direction = message.trim();
            const currentScene = gameState.game.scene.scenes[0];
            if (currentScene) {
                currentScene.movePlayer(direction);
            }
            logToConsole(`กำลังเคลื่อนที่ไปทาง: ${direction}`);
        }
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
        if (message.includes('กำลังเคลื่อนที่ไปทาง')) {
            logEntry.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
            logEntry.style.borderLeft = '4px solid #999999';
            logEntry.style.color = '#fefefe';
        } else if (typeof message === 'number') {
            // ถ้าเป็นตัวเลข (เช่น ตำแหน่ง)
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

function resetGame() {
    // ล้าง console
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
        consoleOutput.innerHTML = '';
    }

    // รีเซ็ตสถานะเกม
    gameState.isRunning = false;
    gameState.gameOver = false;
    gameState.shootQueue = [];
    
    // รีเซ็ตยานอวกาศ

    
    // รีเซ็ต HP
    if (gameState.message) {
        gameState.message.setText('HP: 100');
    }
    
    // รีเซ็ตภูเขา

}

// Initialize everything
initializeGame();
initializeEditor();
setupWorkerHandlers();

// Add runTestCase function
window.runTestCase = function() {
    resetGame();
    gameState.isRunning = true;
    if (gameState.player) {
        gameState.player.setVelocityX(0);
    }

    const code = gameState.editor.getValue();
    console.log('Sending code to worker:', code); // Debug log
    
    if (gameState.worker) {
        gameState.worker.postMessage({
            type: 'run',
            code: code
        });
    } else {
        console.error('Worker is not initialized');
    }
};
