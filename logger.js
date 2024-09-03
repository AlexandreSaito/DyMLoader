
let win = null;

function log(...args) {
    const stack = new Error().stack.split("at ");

    if (win) {
        win.webContents.send('log', { stack: stack[stack.length > 1 ? 2 : 1].trim(), args });
        return;
    }

    console.log('\r\n----/----');
    console.log(stack[stack.length > 1 ? 2 : 1].trim());
    for (let arg of args) {
        console.log(typeof arg == 'object' ? JSON.stringify(arg) : arg);
    }
}

function setLoggerWindow(window) {
    win = window;
}

module.exports = { log, setLoggerWindow }
