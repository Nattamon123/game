// Worker Configuration


// Worker State

// Message Handler
self.onmessage = function(e) {
    const { type, code } = e.data;
    
    if (type === 'run') {
        try {
            // ตรวจสอบรหัสผ่าน
            const trimmedCode = code.trim();
            
            // แสดงโค้ดที่ได้รับมาเพื่อตรวจสอบ
            

            // ตรวจสอบว่ามีการประกาศตัวแปร chest และมีการใช้ console.log(chest) หรือไม่
            const hasPasscodeDeclaration = trimmedCode.includes('let chest = "เปิดกล่อง"') || 
                                          trimmedCode.includes('chest = "เปิดกล่อง"');
            const hasConsoleLog = trimmedCode.includes('console.log(chest)');

            if (hasPasscodeDeclaration && hasConsoleLog) {
                // ส่งค่ากลับไปที่เกม
                self.postMessage({
                    type: 'variable',
                    variableName: 'chest',
                    value: "เปิดกล่อง"
                });
                self.postMessage({
                    type: 'log',
                    message: 'รหัสผ่านถูกต้อง!'
                });
            } else if (!hasPasscodeDeclaration) {
                // ส่งข้อความแจ้งเตือนถ้าไม่ได้ประกาศตัวแปร chest
                self.postMessage({
                    type: 'error',
                    error: 'กรุณาประกาศตัวแปร chest: let chest = "เปิดกล่อง"'
                });
            } else if (!hasConsoleLog) {
                // ส่งข้อความแจ้งเตือนถ้าไม่ได้ใช้ console.log
                self.postMessage({
                    type: 'error',
                    error: 'กรุณาใช้ console.log(chest) เพื่อส่งคำตอบ'
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
        const hasPasscodeDeclaration = code.includes('let chest = "เปิดกล่อง"') || 
                                      code.includes('chest = "เปิดกล่อง"');
        const hasConsoleLog = code.includes('console.log(chest)');

        if (hasPasscodeDeclaration && hasConsoleLog) {
            postMessage({
                type: 'variable',
                variableName: 'chest',
                value: "เปิดกล่อง"
            });
        } else if (!hasPasscodeDeclaration) {
            postMessage({
                type: 'error',
                error: 'กรุณาประกาศตัวแปร chest: let chest = "เปิดกล่อง"'
            });
        } else if (!hasConsoleLog) {
            postMessage({
                type: 'error',
                error: 'กรุณาใช้ console.log(chest) เพื่อส่งคำตอบ'
            });
        }
    } catch (error) {
        postMessage({
            type: 'error',
            error: 'เกิดข้อผิดพลาด: ' + error.message
        });
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

// Code Execution
function executeCode(code, sandbox) {
    try {
        // แทนที่การประกาศตัวแปรด้วย let ด้วยการเรียกใช้ฟังก์ชัน let ของเรา
        const processedCode = code.replace(
            /let\s+(\w+)\s*=\s*([^;]+)/g, 
            'sandbox.let("$1", $2)'
        );
        
        // ครอบโค้ดด้วย try-catch เพื่อจัดการข้อผิดพลาด
        const wrappedCode = `
            try {
                ${processedCode}
            } catch(e) {
                console.log("Error: " + e.message);
            }
        `;
        
        // สร้างและเรียกใช้ฟังก์ชัน
        const fn = new Function('sandbox', `with(sandbox) { ${wrappedCode} }`);
        fn(sandbox);
    } catch (error) {
        postMessage({
            type: 'error',
            error: error.message
        });
    }
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
