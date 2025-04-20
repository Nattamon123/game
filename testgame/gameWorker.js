// Worker Configuration


// Worker State
let playerX = 0;
let playerY = 0;
let treasureX = 0;
let treasureY = 0;

// Message Handler
self.onmessage = function(e) {
    const { type, code, playerX: px, playerY: py, treasureX: tx, treasureY: ty } = e.data;
    
    switch (type) {
        case 'positions':
            playerX = px;
            playerY = py;
            treasureX = tx;
            treasureY = ty;
            break;
        case 'run':
            handleRun(code);
            break;
        default:
            postMessage({ 
                type: 'error', 
                error: 'Invalid message type' 
            });
    }
};

// Initialization Handler
function handleInit(heights) {
    mountainHeights = heights;
    postMessage({ 
        type: 'log', 
        message: 'Worker initialized with mountain heights' 
    });
}

// Code Execution Handler
function handleRun(code) {
    try {
        // สร้าง object ที่ผู้เล่นสามารถเข้าถึงได้
        const gameObjects = {
            player: {
                get x() { return playerX; },
                get y() { return playerY; }
            },
            treasure: {
                get x() { return treasureX; },
                get y() { return treasureY; }
            }
        };

        // แปลง console.log(ทิศทาง) ให้เป็น console.log("ทิศทาง")
        const processedCode = code.replace(/console\.log\(([^)]+)\)/g, (match, direction) => {
            // ตรวจสอบว่าทิศทางเป็นตัวแปรหรือไม่
            if (direction.trim() === 'east' || direction.trim() === 'west' || 
                direction.trim() === 'north' || direction.trim() === 'south' ||
                direction.trim() === 'right' || direction.trim() === 'left' ||
                direction.trim() === 'up' || direction.trim() === 'down') {
                return `console.log("${direction.trim()}")`;
            }
            return match; // ถ้าไม่ใช่ทิศทางที่กำหนดไว้ ให้ใช้โค้ดเดิม
        });

        // รวมโค้ดทั้งหมดและรัน
        const fullCode = `
            const console = {
                log: function(direction) {
                    self.postMessage({ type: 'log', message: String(direction) });
                }
            };
            const player = ${JSON.stringify(gameObjects.player)};
            const treasure = ${JSON.stringify(gameObjects.treasure)};
            ${processedCode}
        `;
        
        eval(fullCode);
    } catch (error) {
        self.postMessage({ type: 'error', message: error.toString() });
    }
}

// Sandbox Creation
function createSandbox() {
    return {
        console: {
            log: function(message) {
                    postMessage({ 
                        type: 'log', 
                        message: String(message) 
                    });
                }
            }
        }
    };


// Code Execution
function executeCode(code, sandbox) {
    (new Function('sandbox', `with(sandbox) { ${code} }`))(sandbox);
}

// Validation


// ฟังก์ชันสำหรับยิงภูเขา


// ฟังก์ชันสำหรับแสดงข้อความใน console
function consoleLog(message) {
    self.postMessage({
        type: 'log',
        message: message
    });
}
