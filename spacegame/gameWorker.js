const WORKER_CONFIG = {
    MIN_MOUNTAIN_ID: 1,
    MAX_MOUNTAIN_ID: 8
};

let mountainHeights = [];

self.onmessage = function(e) {
    const { type, mountainHeights: heights, code } = e.data;
    
    switch (type) {
        case 'init':
            handleInit(heights);
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

function handleInit(heights) {
    mountainHeights = heights;
    postMessage({ 
        type: 'log', 
        message: 'Worker initialized with mountain heights' 
    });
}

function handleRun(code) {
    try {
        const sandbox = createSandbox();
        executeCode(code, sandbox);
        postMessage({ type: 'done' });
    } catch (error) {
        postMessage({ 
            type: 'error', 
            error: error.message 
        });
    }
}

function createSandbox() {
    return {
        console: {
            log: function(message) {
                const mountainId = parseInt(message);
                if (isValidMountainId(mountainId)) {
                    postMessage({ 
                        type: 'shoot', 
                        targetMountain: mountainId,
                        message: `ยิงภูเขาหมายเลข ${mountainId}`
                    });
                } else {
                    postMessage({ 
                        type: 'log', 
                        message: String(message) 
                    });
                }
            }
        }
    };
}

function executeCode(code, sandbox) {
    (new Function('sandbox', `with(sandbox) { ${code} }`))(sandbox);
}

function isValidMountainId(id) {
    return !isNaN(id) && 
           id >= WORKER_CONFIG.MIN_MOUNTAIN_ID && 
           id <= WORKER_CONFIG.MAX_MOUNTAIN_ID;
}

function shootMountain(index) {
    if (index >= 0 && index < 8) {
        self.postMessage({
            type: 'shoot',
            targetMountain: index
        });
    }
}

function consoleLog(message) {
    self.postMessage({
        type: 'log',
        message: message
    });
}
