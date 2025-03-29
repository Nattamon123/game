let player, goal;
let editor, message, outputBox;
let intervals = [];
let hp = 100; // HP ของผู้เล่น
let isRunning = false; // เช็คว่าผู้เล่นกด Run Code หรือยัง

const config = {
    type: Phaser.AUTO,
    width: 750,
    height: 550,
    parent: 'gameContainer',
    physics: { default: "arcade" },

    scene: {
        preload: function () {
            this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
            this.load.image("goal", "https://labs.phaser.io/assets/sprites/star.png");
            this.load.image("bg", "./image/hmzm_zekz_231108.jpg");
        },
        create: function () {
            let bg = this.add.image(235, 185, "bg");
            bg.setDisplaySize(750, 550);

            player = this.physics.add.sprite(100, 400, "player").setScale(0.5);
            player.setCollideWorldBounds(true);

            goal = this.physics.add.staticSprite(400, 200, "goal").setScale(0.5);

            message = this.add.text(200, 50, "HP: 100", { fontSize: "24px", fill: "#fff" });

            outputBox = document.getElementById("console-output");
        }
    }
};

const game = new Phaser.Game(config);

// โหลด Monaco Editor
require({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" } });
require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("editor"), {
        value: `// ลองเขียนโค้ด เช่น
console.log("เริ่มเคลื่อนที่...");

setInterval(() => {
    player.x += 10; // เดินไปขวาเรื่อยๆ
    console.log("เดินไปข้างหน้า!");
}, 1000);`,
        language: "javascript",
        theme: "vs-dark"
    });
});

// 📌 ฟังก์ชันรันโค้ด
function runCode() {
    if (isRunning) return; // ป้องกันกดซ้ำ
    isRunning = true;
    hp = 100;

    let code = editor.getValue();
    clearAllIntervals(); // รีเซ็ต interval ทั้งหมดก่อนเริ่มใหม่

    // 🔥 ลด HP อัตโนมัติทุก 2 วินาทีเมื่อกด Run Code
    intervals.push(setInterval(() => {
        decreaseHP(5);
    }, 2000));

    try {
        let sandbox = {
            player,
            // console: { log: logToConsole },
            setTimeout: (fn, time) => setTimeout(() => safeExecute(fn), time),
            setInterval: (fn, time) => {
                let id = setInterval(() => safeExecute(fn), time);
                intervals.push(id);
                return id;
            },
            clearInterval: (id) => clearInterval(id)
        };

        let sandboxProxy = new Proxy(sandbox, {
            has: () => true,
            get: (target, prop) => target[prop]
        });

        let func = new Function("sandbox", `"use strict"; return (function() { ${code} }).call(sandbox)`);
        func(sandboxProxy);

        checkWinCondition();
    } catch (error) {
        
    }
}

// 📌 ฟังก์ชันลด HP อัตโนมัติ
function decreaseHP(amount) {
    if (!isRunning) return; // ถ้ายังไม่ได้กด Run Code ไม่ต้องลด
    hp -= amount;
    message.setText(`HP: ${hp}`);

    if (hp <= 0) gameOver();
}

// 📌 ฟังก์ชันจบเกม
function gameOver() {
    logToConsole("💀 Game Over!");
    message.setText("💀 Game Over!");
    clearAllIntervals();
    isRunning = false; // ให้กด Run Code ใหม่ได้
}




// 📌 ฟังก์ชันล้าง setInterval ทั้งหมด
function clearAllIntervals() {
    intervals.forEach(clearInterval);
    intervals = [];
}

// 📌 เช็คเงื่อนไขการชนะ
function checkWinCondition() {
    if (Phaser.Math.Distance.Between(player.x, player.y, goal.x, goal.y) < 30) {
        logToConsole("🎉 Mission Complete!");
        message.setText("🎉 Mission Complete!");
        clearAllIntervals();
        isRunning = false; // ให้กด Run Code ใหม่ได้
    }
}
