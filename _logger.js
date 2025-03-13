
let win = null;

function log(...args) {
    const stack = new Error().stack.split("at ");
    const stackItem = stack[stack.length > 1 ? 2 : 1];

    if (!stackItem) {
        console.log('here');
    }

    if (win) {
        win.webContents.send('log', { stack: stack[stack.length > 1 ? 2 : 1].trim(), args });
        return;
    }

    if (stackItem) {
        console.log('\r\n----/----');
        console.log(stackItem.trim());
    }
    for (let arg of args) {
        const argString = typeof arg == 'object' ? JSON.stringify(arg) : arg;
        console.log(argString);
    }
}

function logProcess(...args) {
    console.log('\r\n----/----');
    for (let arg of args) {
        console.log(typeof arg == 'object' ? JSON.stringify(arg) : arg);
    }
}

function setLoggerWindow(window) {
    win = window;
}

module.exports = { log, logProcess, setLoggerWindow }
