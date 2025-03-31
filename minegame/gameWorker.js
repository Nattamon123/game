onmessage = function (e) {
    const code = e.data.code;
    let moveQueue = [];

    let sandbox = {
        console: {
            log: (command) => {
                if (["N", "S", "E", "W"].includes(command)) {
                    moveQueue.push(command);
                }
            }
        }
    };

    try {
        let func = new Function("sandbox", `with(sandbox) { ${code} }`);

        // ทำให้โค้ดทำงานซ้ำทุก 500ms
        let interval = setInterval(() => {
            moveQueue = []; // ล้าง Queue ทุกครั้งก่อนรันโค้ดใหม่
            func(sandbox); // รันโค้ดของผู้เล่น
            postMessage({ moveQueue });
            
            // หยุดเมื่อถึงเป้าหมาย
            if (moveQueue.length === 0) {
                clearInterval(interval);
            }
           
        }, 500);

    } catch (error) {
        postMessage({ error: error.message });
    }
};