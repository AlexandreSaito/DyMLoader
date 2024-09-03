const path = require('node:path')
const fs = require('node:fs');
const { spawn } = require('child_process');
const { log } = require('./logger.js');

let processes = [];
let pyMainProcess = null;

const mods = {};


//https://chatgpt.com/c/d6b54e18-103a-4536-b015-7fb09d35dd22
function setupPythonEnvironment(pluginPath) {
    return new Promise((resolve, reject) => {
        const venvPath = path.join(pluginPath, 'venv');
        const requirementsFile = path.join(pluginPath, 'requirements.txt');

        // Check if virtual environment exists
        if (!fs.existsSync(venvPath)) {
            // Create virtual environment
            const pythonProcess = spawn('python3', ['-m', 'venv', venvPath]);

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error('Failed to create virtual environment'));
                }

                // Install dependencies
                const pipProcess = spawn(path.join(venvPath, 'bin', 'pip'), ['install', '-r', requirementsFile]);

                pipProcess.stderr.on('data', (data) => {
                    console.error(`pip install error: ${data.toString()}`);
                });

                pipProcess.on('close', (pipCode) => {
                    if (pipCode !== 0) {
                        return reject(new Error('Failed to install dependencies'));
                    }
                    resolve(venvPath);
                });
            });
        } else {
            resolve(venvPath);
        }
    });
}

function sendProcess(moduleName, action, data) {
    processes.push({ module: moduleName, action: action, data: data ? data : {} });
    if (!pyMainProcess) { return; }
    actuallySendProcess();
}

function actuallySendProcess() {
    if (!pyMainProcess || processes.length == 0) return;
    let length = processes.length;
    for (let i = 0; i < length; i++) {
        const p = processes.shift();
        //log(p);
        pyMainProcess.stdin.write(JSON.stringify(p) + '\n\r');
    }
    //pyMainProcess.stdin.end();
}

async function checkPythonEnv(dir) {
    if (pyMainProcess) return;

    const venvPath = await setupPythonEnvironment(dir());
    const pythonExecutable = path.join(venvPath, 'Scripts', 'python');
    pyMainProcess = spawn(pythonExecutable, [path.join(__dirname, 'moduleManager.py')]);

    pyMainProcess.stdout.on('data', (data) => {
        readPythonResponse(data.toString());
    });

    pyMainProcess.stderr.on('data', (data) => {
        readPythonResponse(data.toString());
    });

    pyMainProcess.on('close', (code) => {
        log(`Python process exited with code ${code}`);
        delete venvPath;
        delete pyMainProcess;
    });

    actuallySendProcess();
}

function readPythonResponse(data) {
    log('Python package: ', data);
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line == '' || line == undefined)
            continue;
        try {
            const json = JSON.parse(line.trim());
            handlePyRequest(json);
            //log(json);
        } catch (e) {
            log(`Python Message: ${line}`);
        }
    }
}

function handlePyRequest(request) {
    try {
        if (!request || !request.module) {
            log(`Python request has not sended a request or module name!`);
            return;
        }
        if (!request.data) {
            log(`Python request has not sended data!`);
            return;
        }
        if (!mods[request.module]) {
            log(`Cannot find a module handler for ${request.module}!`);
            return;
        }

        mods[request.module](request.data);
    } catch (e) {
        log('Failed to handle Python request! ', e.message);
    }
}

class PythonToJSMask {
    constructor(name) {
        this.name = name;
        this.responses = {};
        this.page = null;
    }

    async setup(directory, mainFilePath) {
        mods[this.name] = (data) => { this.handlePyRequest(data); };

        sendProcess(this.name, 'setup', { directory, mainFilePath });
    }

    addResponseHandler(request, func) {
        this.responses[request] = func;
    }

    handlePyRequest(request) {

        if (request.action == 'response') {
            if (this.responses[request.request]) this.responses[request.request](request.status, request.data);
            return;
        }

        if (request.action == 'init') {
            this.onInit(json.tray, request.mainMenu);
            this.onInit = null;
        }

        if (request.action == 'page_load_html') {
            this.page.loadHtml(request.parent_query, { clearBeforeRender: request.options ? true : request.options.clear_before_render, fileOrHtml: request.html_or_file })
        }

        if (request.action == 'page_get_data') {
            this.page.getData(request.params, (data) => {
                sendProcess(this.name, 'page_data', { request_id: request.requestId, data: data });
            }, request.requestId);
        }

        if (request.action == 'page_add_event_listener') {
            this.page.addEventListener(request.event, request.query_selector, (value) => {
                log('event listened!')
                sendProcess(this.name, 'page_event', { event_name: request.event, query_selector: request.query_selector, data: value });
            });
        }

        if (request.action == 'kill') this.process.kill();
        if (request.action == 'log') log('JSON LOG', request.data);
    }

    init(trayTemplate, mainTemplate) {
        this.addResponseHandler('init', (status, data) => {

        });
        sendProcess(this.name, 'init');
    }

    hasFailed() {
        return this.fails.length > 0;
    }

    failReason() {
        return this.fails;
    }

    beforePageLoad() {
        log('modulePy.js before_page_load');
        sendProcess(this.name, 'before_page_load');
    }

    onPageLoad(page) {
        this.page = page;
        log('modulePy.js on_page_load');
        sendProcess(this.name, 'on_page_load');
    }

    onAction() {

    }

    beforePageClose(page) {
    }

    onPageClose() {
        this.page = null;
    }

    beforeQuit() {
        sendProcess(this.name, 'unload');
    }

}


module.exports = { PythonToJSMask, checkPythonEnv };
