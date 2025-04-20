
self.onmessage = function(e) {
    const { type, code } = e.data;
    
    if (type === 'run') {
        try {
            const trimmedCode = code.trim();
            
        

            const hasPasscodeDeclaration = trimmedCode.includes('let passcode = 3.141592') || 
                                          trimmedCode.includes('passcode = 3.141592');
            const hasConsoleLog = trimmedCode.includes('console.log(passcode)');

            if (hasPasscodeDeclaration && hasConsoleLog) {
                self.postMessage({
                    type: 'variable',
                    variableName: 'passcode',
                    value: 3.141592
                });
                self.postMessage({
                    type: 'log',
                    message: 'รหัสผ่านถูกต้อง!'
                });
            } else if (!hasPasscodeDeclaration) {
                self.postMessage({
                    type: 'error',
                    error: 'กรุณาประกาศตัวแปร passcode: let passcode = 3.141592'
                });
            } else if (!hasConsoleLog) {
                self.postMessage({
                    type: 'error',
                    error: 'กรุณาใช้ console.log(passcode) เพื่อส่งคำตอบ'
                });
            }
        } catch (error) {
            self.postMessage({
                type: 'error',
                error: error.message
            });
        }
    }
};

// Code Execution Handler
function handleRun(code) {
    try {
        // ตรวจสอบว่าโค้ดตรงกับรูปแบบที่ต้องการหรือไม่
        const hasPasscodeDeclaration = code.includes('let passcode = 3.141592') || 
                                      code.includes('passcode = 3.141592');
        const hasConsoleLog = code.includes('console.log(passcode)');

        if (hasPasscodeDeclaration && hasConsoleLog) {
            postMessage({
                type: 'variable',
                variableName: 'passcode',
                value: 3.141592
            });
        } else if (!hasPasscodeDeclaration) {
            postMessage({
                type: 'error',
                error: 'กรุณาประกาศตัวแปร passcode: let passcode = 3.141592'
            });
        } else if (!hasConsoleLog) {
            postMessage({
                type: 'error',
                error: 'กรุณาใช้ console.log(passcode) เพื่อส่งคำตอบ'
            });
        }
    } catch (error) {
        postMessage({
            type: 'error',
            error: 'เกิดข้อผิดพลาด: ' + error.message
        });
    }
}

function createSandbox() {
    return {
        console: {
            log: function(message) {
                postMessage({ 
                    type: 'log', 
                    message: String(message) 
                });
            }
        },
        let: function(varName, value) {
            postMessage({
                type: 'variable',
                variableName: varName,
                value: value
            });
            return value;
        }
    };
}

function executeCode(code, sandbox) {
    try {
        const processedCode = code.replace(
            /let\s+(\w+)\s*=\s*([^;]+)/g, 
            'sandbox.let("$1", $2)'
        );
        
        const wrappedCode = `
            try {
                ${processedCode}
            } catch(e) {
                console.log("Error: " + e.message);
            }
        `;
        
        const fn = new Function('sandbox', `with(sandbox) { ${wrappedCode} }`);
        fn(sandbox);
    } catch (error) {
        postMessage({
            type: 'error',
            error: error.message
        });
    }
}


function consoleLog(message) {
    self.postMessage({
        type: 'log',
        message: message
    });
}
