
let win: any = null;

export function log(...args: any)  {
    const stack = new Error().stack?.split("at ")?? [];
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

export function logProcess(...args: any) {
    console.log('\r\n----/----');
    for (let arg of args) {
        console.log(typeof arg == 'object' ? JSON.stringify(arg) : arg);
    }
}

export function setLoggerWindow(window: any) {
    win = window;
} 

