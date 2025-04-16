import path from 'node:path'
import fs from 'node:fs'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { app, IpcMain } from 'electron'
import { log, logProcess } from './logger.js';
import { CustomHTMLObject, CustomModalObject, CustomModalHandler } from './htmlInterface';
import { PageLoadType, PageEventHandler, IPage } from './pageInterface';
import { ExecException } from 'node:child_process';

interface IProcess {
    module: string;
    action: string; 
    data?: null | any;
}

let processes: Array<IProcess> = [];
let pyMainProcess : null | ChildProcessWithoutNullStreams = null;

const mods: Record<string, any> = {};

//https://chatgpt.com/c/d6b54e18-103a-4536-b015-7fb09d35dd22
function setupPythonEnvironment(pluginPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const venvPath = path.join(pluginPath, 'venv');
        const requirementsFile = path.join(pluginPath, 'requirements.txt');

        // Check if virtual environment exists
        if (!fs.existsSync(venvPath)) {
            // Create virtual environment
            log('Starting python process');
            const pythonProcess = spawn('python3', ['-m', 'venv', venvPath]);

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error('Failed to create virtual environment'));
                }

                // Install dependencies
                // log('Installing dependencies');
                // const pipProcess = spawn(path.join(venvPath, 'Scripts', 'pip'), ['install', '-r', requirementsFile]);

                // pipProcess.stderr.on('data', (data) => {
                //     console.error(`pip install error: ${data.toString()}`);
                // });

                // pipProcess.on('close', (pipCode) => {
                //     if (pipCode !== 0) {
                //         return reject(new Error('Failed to install dependencies'));
                //     }
                //     resolve(venvPath);
                // });
                resolve(venvPath);
            });
        } else {
            resolve(venvPath);
        }
    });
}

function sendProcess(moduleName: string, action: string, data?:null | any) {
    processes.push({ module: moduleName, action: action, data: data ? data : {} });
    if (!pyMainProcess) { log('Python process not running!'); return; }
    actuallySendProcess();
}

function actuallySendProcess() {
    if (!pyMainProcess || processes.length == 0) { log('Python process not running!'); return; }
    let length = processes.length;
    for (let i = 0; i < length; i++) {
        const p = processes.shift();
        //log(p);
        pyMainProcess.stdin.write(JSON.stringify(p) + '\n\r');
    }
    //pyMainProcess.stdin.end();
}

async function checkPythonEnv(dir: Function) {
    if (pyMainProcess) return;

    const venvPath = await setupPythonEnvironment(dir());
    const pythonExecutable = path.join(venvPath, 'Scripts', 'python');
    log('Starting Manager for pyhton');

    let pyscriptfolder = path.join(app.getAppPath(), '..', 'pyscript', 'moduleManager.py');
    if (!fs.existsSync(pyscriptfolder)) pyscriptfolder = path.join(app.getAppPath(), 'pyscript', 'moduleManager.py');
    pyMainProcess = spawn(pythonExecutable, [pyscriptfolder], { stdio: ['pipe', 'pipe', 'pipe'] });

    // fs.chmod(path.join(app.getAppPath(), '..', 'modules'), 0o755, (err) => {
    //     if (err) {
    //       console.error(`Error setting permissions: ${err.message}`);
    //       return;
    //     }
    // });

    pyMainProcess.stdout.on('data', (data) => {
        readPythonResponse(data.toString());
    });

    pyMainProcess.stderr.on('data', (data) => {
        readPythonResponse(data.toString());
    });

    pyMainProcess.on('close', (code) => {
        log(`Python process exited with code ${code}`);
        pyMainProcess = null;
    });

    actuallySendProcess();
}

function readPythonResponse(data: string) {
    logProcess('Python package: ', data);
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line == '' || line == undefined)
            continue;
        try {
            const json = JSON.parse(line.trim());
            handlePyRequest(json);
        } catch (e) {
            logProcess(`Python Message: ${line}`);
        }
    }
}

function handlePyRequest(request: any) {
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
    } catch (e: any) {
        log('Failed to handle Python request! ', e.message);
    }
}

class PythonToJSMask {
    name: string;
    responses: any;
    page: null | IPage;
    fails: Array<any>;
    process?: any;
    onInit?: null| Function;

    constructor(name: string) {
        this.name = name;
        this.responses = {};
        this.page = null;
        this.fails = [];
    }

    async setup(directory: string, mainFilePath: string) {
        mods[this.name] = (data: any) => { this.handlePyRequest(data); };

        sendProcess(this.name, 'setup', { directory, mainFilePath });
    }

    addResponseHandler(request: string, func: Function) {
        this.responses[request] = func;
    }

    handlePyRequest(request: any) {

        if (request.action == 'response') {
            if (this.responses[request.request]) this.responses[request.request](request.status, request.data);
            return;
        }

        if (request.action == 'init') {
            if(this.onInit) this.onInit(request.tray, request.mainMenu);
            this.onInit = null;
        }

        if (request.action == 'page_load_html') {
            if(this.page) this.page.loadHtml(request.parent_query, { clearBeforeRender: request.options ? true : request.options.clear_before_render, fileOrHtml: request.html_or_file })
        }

        if (request.action == 'page_get_data') {
            if(this.page) this.page.getData(request.params, (data: any) => {
                sendProcess(this.name, 'page_data', { request_id: request.requestId, data: data });
            }, request.requestId);
        }

        if (request.action == 'page_add_event_listener') {
            if(this.page) this.page.addEventListener(request.event, request.query_selector, (value: any) => {
                log('event listened!')
                sendProcess(this.name, 'page_event', { event_name: request.event, query_selector: request.query_selector, data: value });
            });
        }

        if (request.action == 'page_modal') {
            const name = this.name;
            if(this.page) this.page.modal({
                title: request.title,
                body: request.body,
                footer: request.footer,
                on: (event: any, origin: any, data: any) => {
                    // send to python
                    this.responses[`modal-${request.requestId}`] = (func: any, data: any) => {
                        event[func](data);
                    };
                    sendProcess(name, 'page_modal_interaction', { request_id: request.requestId, origin: origin, data: data ?? {} });
                }
            });
        }

        if (request.action == 'page_modal_event') {
            this.responses[`modal-${request.requestId}`](request.function, request.data);
        }

        if (request.action == 'kill') this.process.kill();
        if (request.action == 'log') log('JSON LOG', request.data);
    }

    init(trayTemplate: any, mainTemplate: any) {
        this.addResponseHandler('init', (status: any, data: any) => {

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

    onPageLoad(page: IPage) {
        this.page = page;
        log('modulePy.js on_page_load');
        sendProcess(this.name, 'on_page_load');
    }

    onAction() {

    }

    beforePageClose(page :IPage) {
    }

    onPageClose() {
        this.page = null;
    }

    beforeQuit() {
        sendProcess(this.name, 'unload');
    }

}


module.exports = { PythonToJSMask, checkPythonEnv };
