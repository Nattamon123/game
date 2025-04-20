// ค่าคงที่ของ Worker
const WORKER_CONFIG = {
    INTERVAL: 500,          // ระยะเวลาระหว่างการทำงาน (มิลลิวินาที)
    MOVE_DISTANCE: 20       // ระยะทางในการเคลื่อนที่แต่ละครั้ง
};

// สถานะของ Worker
let workerState = {
    moveQueue: [],          // คิวคำสั่งการเคลื่อนที่
    logs: [],               // เก็บข้อความที่แสดงในคอนโซล
    playerPosition: { x: 100, y: 300 },  // ตำแหน่งเริ่มต้นของผู้เล่น
    intervalId: null        // ID ของ interval ที่กำลังทำงาน
};

// สร้างสภาพแวดล้อมจำลอง (Sandbox) สำหรับรันโค้ด
const createSandbox = (position) => ({
    player: position,       // ตำแหน่งผู้เล่น
    console: {
        log: (command) => {
            workerState.logs.push(command);
            // ถ้าเป็นคำสั่งเคลื่อนที่ (N,S,E,W) ให้เพิ่มเข้าไปในคิว
            if (["N", "S", "E", "W"].includes(command)) {
                workerState.moveQueue.push(command);
            }
        }
    },
    // ฟังก์ชันและตัวแปรพื้นฐานของ JavaScript
    Math, Array, Object, String, Number, Boolean, Date, RegExp, Error, JSON,
    parseInt, parseFloat, isNaN, isFinite,
    escape, unescape, encodeURI, encodeURIComponent, decodeURI, decodeURIComponent,
    
    // ตัวแปรสำหรับเกม
    playerX: position.x,    // ตำแหน่ง X ของผู้เล่น
    playerY: position.y,    // ตำแหน่ง Y ของผู้เล่น
    goalX: 400,            // ตำแหน่ง X ของเป้าหมาย
    goalY: 150,            // ตำแหน่ง Y ของเป้าหมาย
    moveDistance: WORKER_CONFIG.MOVE_DISTANCE,  // ระยะทางในการเคลื่อนที่
    
    // ฟังก์ชันช่วยเหลือสำหรับการเคลื่อนที่
    moveToGoal: function() {
        // คำนวณระยะทางที่ต้องเดินไปถึงเป้าหมาย
        const dx = this.goalX - this.playerX;
        const dy = this.goalY - this.playerY;
        
        // เคลื่อนที่ในแนวนอน
        if (dx > 0) {
            for (let i = 0; i < Math.abs(dx) / this.moveDistance; i++) {
                this.console.log('E');  // เดินไปทางขวา
            }
        } else {
            for (let i = 0; i < Math.abs(dx) / this.moveDistance; i++) {
                this.console.log('W');  // เดินไปทางซ้าย
            }
        }
        
        // เคลื่อนที่ในแนวตั้ง
        if (dy < 0) {
            for (let i = 0; i < Math.abs(dy) / this.moveDistance; i++) {
                this.console.log('N');  // เดินขึ้น
            }
        } else {
            for (let i = 0; i < Math.abs(dy) / this.moveDistance; i++) {
                this.console.log('S');  // เดินลง
            }
        }
    },
    
    // เคลื่อนที่เป็นรูปสี่เหลี่ยม
    moveInSquare: function() {
        this.console.log('E');  // ขวา
        this.console.log('N');  // ขึ้น
        this.console.log('W');  // ซ้าย
        this.console.log('S');  // ลง
    },
    
    // เคลื่อนที่เป็นรูปตัว Z
    moveInZ: function() {
        for (let i = 0; i < 3; i++) {
            this.console.log('E');  // ขวา 3 ครั้ง
        }
        this.console.log('S');      // ลง 1 ครั้ง
        for (let i = 0; i < 3; i++) {
            this.console.log('E');  // ขวา 3 ครั้ง
        }
    },
    
    // เคลื่อนที่แบบสุ่ม
    moveRandom: function(steps) {
        const directions = ['N', 'S', 'E', 'W'];
        for (let i = 0; i < steps; i++) {
            const randomIndex = Math.floor(Math.random() * directions.length);
            this.console.log(directions[randomIndex]);
        }
    }
});

// ฟังก์ชันจัดการข้อความที่ได้รับจาก main thread
onmessage = function(e) {
    const { code, playerPosition: newPosition } = e.data;
    
    // รีเซ็ตสถานะ
    workerState.moveQueue = [];
    workerState.logs = [];
    workerState.playerPosition = newPosition || { x: 100, y: 300 };
    
    // ล้าง interval ที่กำลังทำงานอยู่ (ถ้ามี)
    if (workerState.intervalId) {
        clearInterval(workerState.intervalId);
    }
    
    try {
        // สร้าง sandbox พร้อมตำแหน่งผู้เล่นปัจจุบัน
        const sandbox = createSandbox(workerState.playerPosition);
        
        // สร้างและรันฟังก์ชันจากโค้ดที่ได้รับ
        const func = new Function("sandbox", `
            with(sandbox) {
                ${code}
            }
        `);
        
        // ตั้งค่า interval สำหรับการรันโค้ด
        workerState.intervalId = setInterval(() => {
            // รีเซ็ตคิว
            workerState.moveQueue = [];
            workerState.logs = [];
            
            // อัพเดทตำแหน่งผู้เล่นใน sandbox
            sandbox.player = workerState.playerPosition;
            sandbox.playerX = workerState.playerPosition.x;
            sandbox.playerY = workerState.playerPosition.y;
            
            try {
                // รันโค้ด
                func(sandbox);
                
                // ส่งผลลัพธ์กลับไปยัง main thread
                postMessage({ moveQueue: workerState.moveQueue, logs: workerState.logs });
                
                // หยุดถ้าไม่มีการเคลื่อนที่หรือข้อความในคอนโซล
                if (workerState.moveQueue.length === 0 && workerState.logs.length === 0) {
                    clearInterval(workerState.intervalId);
                    workerState.intervalId = null;
                }
            } catch (error) {
                handleError(error);
            }
        }, WORKER_CONFIG.INTERVAL);
        
    } catch (error) {
        handleError(error);
    }
};

// ฟังก์ชันจัดการข้อผิดพลาด
function handleError(error) {
    if (workerState.intervalId) {
        clearInterval(workerState.intervalId);
        workerState.intervalId = null;
    }
    postMessage({ error: error.message });
}
