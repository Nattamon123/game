// Worker Configuration


// Worker State

// Message Handler
self.onmessage = function(e) {
    const { type, code } = e.data;
    
    if (type === 'run') {
        try {
            // ตรวจสอบการประกาศ Array และลำดับหนังสือ
            const trimmedCode = code.trim();
            
            // ตรวจสอบว่ามีการประกาศตัวแปร books และมีการใช้ console.log(books) หรือไม่
            const hasBooksDeclaration = trimmedCode.includes('let books = [') || 
                                      trimmedCode.includes('const books = [');
            const hasConsoleLog = trimmedCode.includes('console.log(books)');

            if (hasBooksDeclaration && hasConsoleLog) {
                // ตรวจสอบลำดับหนังสือที่ถูกต้อง
                const correctBooks = ['หนังสือประวัติศาสตร์', 'หนังสือวิทยาศาสตร์', 'หนังสือคณิตศาสตร์'];
                
                // แยกข้อความใน Array ออกมา
                const arrayContent = trimmedCode.match(/\[(.*?)\]/);
                if (arrayContent) {
                    const books = arrayContent[1].split(',').map(book => book.trim().replace(/"/g, ''));
                    
                    // ตรวจสอบว่ามีหนังสือที่ไม่ถูกต้องหรือไม่
                    const invalidBooks = books.filter(book => !correctBooks.includes(book));
                    
                    if (invalidBooks.length > 0) {
                        self.postMessage({
                            type: 'error',
                            error: `ไม่มีหนังสือนี้: ${invalidBooks.join(', ')}`
                        });
                        return;
                    }
                    
                    // ตรวจสอบว่ามีหนังสือครบทุกเล่มหรือไม่
                    const hasAllBooks = correctBooks.every(book => books.includes(book));
                    
                    if (!hasAllBooks) {
                        self.postMessage({
                            type: 'error',
                            error: 'กรุณาใส่ชื่อหนังสือให้ถูกต้อง: หนังสือประวัติศาสตร์, หนังสือวิทยาศาสตร์, หนังสือคณิตศาสตร์'
                        });
                        return;
                    }

                    // ส่งค่ากลับไปที่เกมก่อนเพื่อให้หนังสือขยับ
                    self.postMessage({
                        type: 'variable',
                        variableName: 'books',
                        value: books
                    });

                    // ตรวจสอบลำดับที่ถูกต้อง
                    const isOrderCorrect = books.every((book, index) => book === correctBooks[index]);
                    
                    if (!isOrderCorrect) {
                        self.postMessage({
                            type: 'log',
                            message: 'กรุณาเรียงลำดับหนังสือให้ถูกต้อง: หนังสือประวัติศาสตร์, หนังสือวิทยาศาสตร์, หนังสือคณิตศาสตร์'
                        });
                    } else {
                        self.postMessage({
                            type: 'log',
                            message: 'ลำดับหนังสือถูกต้อง!'
                        });
                    }
                }
            } else if (!hasBooksDeclaration) {
                self.postMessage({
                    type: 'error',
                    error: 'กรุณาประกาศตัวแปร books: let books = ["หนังสือประวัติศาสตร์", "หนังสือวิทยาศาสตร์", "หนังสือคณิตศาสตร์"]'
                });
            } else if (!hasConsoleLog) {
                self.postMessage({
                    type: 'error',
                    error: 'กรุณาใช้ console.log(books) เพื่อแสดงผล'
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
