let player, goal;
let editor, message, outputBox;
let intervals = [];
let hp = 100; // HP ของผู้เล่น
let isRunning = false; // เช็คว่าผู้เล่นกด Run Code หรือยัง

const config = {
    type: Phaser.AUTO,
    width: 750,
    height: 350,
    parent: 'gameContainer',
    physics: { default: "arcade" },

    scene: {
        preload: function () {
            this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
            this.load.image("goal", "https://labs.phaser.io/assets/sprites/star.png");
            this.load.image("bg", "./image/hmzm_zekz_231108.jpg");
        },
        create: function () {
            let bg = this.add.image(199, 169, "bg");
            bg.setDisplaySize(750, 350);

            player = this.physics.add.sprite(100, 300, "player").setScale(0.5);
            player.setCollideWorldBounds(true);

            goal = this.physics.add.staticSprite(400, 300, "goal").setScale(0.5);

            message = this.add.text(200, 50, "HP: 100", { fontSize: "24px", fill: "#fff" });

            // อ้างอิงถึง outputBox ใน DOM ที่มี ID "console-output"
            outputBox = document.getElementById("console-output");

            // สร้าง Web Worker
            worker = new Worker('gameWorker.js');
            worker.onmessage = function (e) {
                const { moveQueue, error } = e.data;
                if (error) {
                    console.error(error);
                    return;
                }

                // ส่งคำสั่งเคลื่อนไหวไปให้ตัวละคร
                if (moveQueue.length > 0) {
                    handleMoveQueue(moveQueue);
                }
            };
        },
        update: function () {
            checkWinCondition();
        }
    }
};

const game = new Phaser.Game(config);

// โหลด Monaco Editor
require({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" } });
require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("editor"), {
        value: `/**
 * Solve this puzzle by writing the shortest code.
 * Whitespaces (spaces, new lines, tabs...) are counted in the total amount of chars.
 **/
        console.log('E');
`,
        language: "javascript",
        theme: "vs-dark",
        fontSize: 15,
    });
});

function runCode() {
    if (isRunning) return;
    isRunning = true;

    let code = editor.getValue();
    
    // ส่งโค้ดไปยัง Web Worker เพื่อให้มันทำงาน
    worker.postMessage({
        code: code
    });
}


function handleMoveQueue(moveQueue) {
    if (!isRunning) return; // หยุดทำงานถ้าเกมจบ
    isRunning = true;
    moveQueue.forEach(command => {
        handleCommand(command);
    });

    // หยุดเมื่อถึงเป้าหมาย
    if (Phaser.Math.Distance.Between(player.x, player.y, goal.x, goal.y) < 30) {
        gameOver();
    }
}



// ฟังก์ชันเคลื่อนที่ของตัวละคร
// ฟังก์ชันเคลื่อนที่ของตัวละคร
function handleCommand(command) {
    console.log(`Moving: ${command}`); // แสดงผลใน Console
    if (command === 'N') player.y -= 10;
    else if (command === 'S') player.y += 10;
    else if (command === 'E') player.x += 10;
    else if (command === 'W') player.x -= 10;
}


// ฟังก์ชันลด HP อัตโนมัติ
function decreaseHP(amount) {
    if (!isRunning) return; // ถ้ายังไม่ได้กด Run Code ไม่ต้องลด
    hp -= amount;
    message.setText(`HP: ${hp}`);

    if (hp <= 0) gameOver();
}

// ฟังก์ชันจบเกม
function gameOver() {
    console.log("🎉 Mission Complete!");
    message.setText("🎉 Mission Complete!");
    
    // หยุด Web Worker
    worker.terminate();
    
    isRunning = false; // ให้กด Run Code ใหม่ได้
}


// ฟังก์ชันล้าง setInterval ทั้งหมด
function clearAllIntervals() {
    intervals.forEach(clearInterval);
    intervals = [];
}

// เช็คเงื่อนไขการชนะ
function checkWinCondition() {
    if (Phaser.Math.Distance.Between(player.x, player.y, goal.x, goal.y) < 30) {
        // logToConsole("🎉 Mission Complete!");
        // message.setText("🎉 Mission Complete!");
        clearAllIntervals();
        isRunning = false; // ให้กด Run Code ใหม่ได้
        worker.terminate()
    }
}

// ฟังก์ชันจับคำสั่ง console.log และขยับตัวละคร
function logToConsole(message) {
    outputBox.innerHTML += `<p>"Misson complete</p>`;
}
