// Worker Configuration


// Worker State
let playerX = 0;
let playerY = 0;
let treasureX = 0;
let treasureY = 0;
let directionQueue = [];
let isProcessing = false;

function processNextDirection() {
    if (directionQueue.length > 0 && !isProcessing) {
        isProcessing = true;
        const direction = directionQueue.shift();
        self.postMessage({ type: 'log', message: direction });
        setTimeout(() => {
            isProcessing = false;
            processNextDirection();
        }, 500);
    }
}

// Message Handler
self.onmessage = function(e) {
    const { type, code, playerX: px, playerY: py, treasureX: tx, treasureY: ty } = e.data;
    
    if (type === 'positions') {
        playerX = px;
        playerY = py;
        treasureX = tx;
        treasureY = ty;
    } else if (type === 'run') {
        const customConsole = {
            log: function(direction) {
                if (typeof direction === 'string') {
                    direction = direction.toLowerCase();
                    if (direction === 'east' || direction === 'west' || 
                        direction === 'north' || direction === 'south') {
                        self.postMessage({ type: 'log', message: direction });
                    }
                }
            }
        };

        try {
            // ตรวจสอบว่ามีการใช้ if statement หรือไม่
            const hasIfStatement = /if\s*\(.*\)\s*\{/.test(code);
            if (!hasIfStatement) {
                self.postMessage({ 
                    type: 'error', 
                    message: 'คุณต้องใช้ if statement เพื่อผ่านด่านนี้!'
                });
                return;
            }

            const processedCode = code.replace(/console\.log\((.*?)\)/g, (match, content) => {
                if (content === 'west' || content === 'east' || content === 'north' || content === 'south') {
                    return `customConsole.log("${content}")`;
                }
                return `customConsole.log(${content})`;
            });

            const fullCode = `
                const player = { x: ${playerX}, y: ${playerY} };
                const treasure = { x: ${treasureX}, y: ${treasureY} };
                ${processedCode}
            `;
            
            eval(fullCode);
        } catch (error) {
            console.error('Error executing code:', error);
        }
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

        // ตรวจสอบว่ามีการใช้ if statement หรือไม่
        const hasIfStatement = /if\s*\(.*\)\s*\{/.test(code);
        self.postMessage({ 
            type: 'ifCheck', 
            hasIf: hasIfStatement,
            message: hasIfStatement ? 'ตรวจสอบการใช้ if statement: ✓' : 'ตรวจสอบการใช้ if statement: ✗ คุณต้องใช้ if statement เพื่อผ่านด่านนี้!'
        });

        const processedCode = code.replace(/console\.log\((.*?)\)/g, (match, content) => {
            return `customConsole.log(${content})`;
        });

        const fullCode = `
            const customConsole = {
                log: function(direction) {
                    if (typeof direction === 'string') {
                        direction = direction.toLowerCase();
                        if (direction === 'east' || direction === 'west' || 
                            direction === 'north' || direction === 'south') {
                            directionQueue.push(direction);
                            if (!isProcessing) {
                                processNextDirection();
                            }
                        }
                    }
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
