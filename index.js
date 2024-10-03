// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu, nativeTheme, shell } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('node:path');

const moduleManager = require('./moduleManager.js');
const { getModuleDirectory } = require('./module');
const spaManager = require('./spaManager.js');
const { log, setLoggerWindow } = require('./logger.js');
const config = require('./configuration.js');

//const { GlobalKeyboardListener } = require("node-global-key-listener")
//const v = new GlobalKeyboardListener();
//v.addListener(function (e, down) {
//    if (e.state == "UP") {
//        shiftIsPressed = down["LEFT SHIFT"] || down["RIGHT SHIFT"];
//        ctrlIsPressed = down["LEFT CTRL"] || down["RIGHT CTRL"];
//        log(e);
//    }
//});
const appFolder = path.dirname(process.execPath)
const updateExe = path.resolve(appFolder, '..', 'dymloader.exe')
const exeName = path.basename(process.execPath)
const iconFile = path.join(__dirname, 'icon.png');

config.loadConfig();

config.setDefault('dymloader-quit-on-x', false);
config.setDefault('dymloader-open-dev-tools', false);

const bodyModalNewModule = {
    tag: 'div', class: 'row', children:
        [
            {
                tag: 'div', class: 'col-12 form-group', children: [
                    { tag: 'label', text: 'Nome do Módulo' },
                    { tag: 'input', type: 'text', name: 'txtModuleName', class: 'form-control', placeholder: 'custommodule' }
                ]
            },
            {
                tag: 'div', class: 'col-12 form-group', children: [
                    { tag: 'label', text: 'Linguagem do Módulo' },
                    {
                        tag: 'select', name: 'ddlModuleType', class: 'form-select', children: [
                            { tag: 'option', value: 'js', text: 'JavaScript' },
                            { tag: 'option', value: 'py', text: 'Python' }
                        ]
                    }
                ]
            },
        ]
};

let tray = null;
let mainWindow = null, logWindow = null;

function loadMainPage(){
    const page = new spaManager.Page('main', 'DyMLoader!', __dirname + '/pages/main/page.html');
    spaManager.setLastPage(page);
}

function createMainWindow() {
    if (mainWindow) return;
    mainWindow = createWindow({
        onFinishLoad: () => {
            mainWindow.webContents.send('on-load', { failedModules: moduleManager.getResumeOfFailtToLoad() });
            spaManager.setWindow(mainWindow);
            if(!spaManager.hasPageLoaded()) {
                loadMainPage();
                return;
            }
            spaManager.loadLastPage();
        },
        onClose: () => { mainWindow = null; spaManager.setWindow(mainWindow); }
    });
}

function createWindow({ file, onFinishLoad, onClose }) {
    //if (BrowserWindow.getAllWindows().length !== 0) return;

    let winState = windowStateKeeper({
        defaultWidth: 800,
        defaultHeight: 800,
    });

    nativeTheme.themeSource = 'dark';
    // Create the browser window.
    const win = new BrowserWindow({
        width: winState.width,
        height: winState.height,
        x: winState.x,
        y: winState.y,
        icon: iconFile,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'renderer', 'preload.js'),
        }
    });

    winState.manage(win);

    const cv = win.contentView;

    if (onClose) win.on('closed', onClose);

    win.webContents.on('did-finish-load', e => {
        if (onFinishLoad) onFinishLoad();
    });

    // and load the index.html of the app.
    win.loadFile(file ? file : path.join(__dirname, 'renderer', '_layout.html'));

    // Open the DevTools.
    if (config.getConfig('dymloader-open-dev-tools')) win.webContents.openDevTools();

    return win;
}

// Update Tray menu, should instanciate if isn't and dinamically build a template.
function updateTrayMenu() {
    if (!tray) tray = new Tray(iconFile);

    tray.setToolTip('DyMLoader!');

    let template = [
        {
            label: 'Modules',
            submenu: [...moduleManager.getTrayMenu()]
        },
        {
            label: 'Open',
            click: () => createMainWindow(),
        },
        {
            label: 'Quit',
            click: () => app.quit(),
        }
    ];

    let ctx = Menu.buildFromTemplate(template);

    tray.setContextMenu(ctx);
}

// Update window menu, should instanciate if isn't and dinamically build a template.
function updateWindowMenu() {

    let template = [
        {
            label: 'Main',
            click: () => {
                loadMainPage();
            }
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Name to be defined.',
                    click: (e) => {
                        const page = new spaManager.Page('helper_html', 'Name to be defined.', __dirname + '/pages/helper_html/page.html');
                        spaManager.setLastPage(page);
                    },
                }
            ]
        },
        {
            label: 'Options',
            submenu: [
                {
                    label: 'Open on boot',
                    type: 'checkbox',
                    click: (e) => {
                        app.setLoginItemSettings({
                            openAtLogin: e.checked,
                            path: updateExe,
                            args: [
                                '--processStart', `"${exeName}"`,
                                '--process-start-args', '"--hidden"'
                            ]
                        })
                    },
                    checked: app.getLoginItemSettings().executableWillLaunchAtLogin,
                },
                {
                    label: 'Quit on Close',
                    type: 'checkbox',
                    click: (e) => {
                        config.setConfig('dymloader-quit-on-x', e.checked);
                    },
                    checked: config.getConfig('dymloader-quit-on-x'),
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Console',
                    role: 'toggleDevTools',
                    accelerator: 'F12'
                },
                {
                    label: 'Log Window',
                    click: () => {
                        if (logWindow) return;
                        logWindow = createWindow({
                            file: path.join(__dirname, 'renderer', 'console.html'),
                            onFinishLoad: () => { logWindow.setMenu(null); setLoggerWindow(logWindow); },
                            onClose: () => { logWindow = null; setLoggerWindow(logWindow); }
                        });
                    },
                },
                {
                    label: 'Reload',
                    role: 'reload',
                    //accelerator: 'Ctrl+F5'
                    accelerator: 'F5'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Electron Page',
                    click: () => shell.openExternal('https://www.electronjs.org/docs/latest/'),
                    accelerator: 'Ctrl+F1'
                },
            ]
        },
        {
            label: 'Modules',
            submenu: [
                {
                    label: 'Open Folder',
                    click: () => {
                        shell.openPath(getModuleDirectory());
                    },
                },
                {
                    label: 'New Module',
                    click: () => {
                        // should create a folder with default parameters and open the folder
                        spaManager.requestModal({
                            title: 'New Module',
                            body: bodyModalNewModule,
                            footer: [
                                { role: 'modal-dismiss' },
                                { tag: 'button', type: 'button', id: 'btn-save', class: 'btn btn-success', text: 'Save' },
                            ],
                            on: (event, origin, data) => {
                                if (origin == 'btn-save') {
                                    if (!data.txtModuleName) {
                                        event.response('Failed to create module, inform the name.');
                                        return;
                                    }
                                    if (data.txtModuleName.trim().includes(' ') || data.txtModuleName.includes('\\') || data.txtModuleName.includes('/')) {
                                        event.response('Failed to create module, the name should\'t have spaces or "/"/"\\".');
                                        return;
                                    }

                                    const folder = moduleManager.createTemplate(data.txtModuleName, data.ddlModuleType);
                                    if (folder) {
                                        event.response(true);
                                        shell.openPath(folder);
                                        return;
                                    }

                                    event.response('Falha ao criar modulo.');
                                }
                            }
                        });
                    },
                },
                {
                    label: 'Reload Module',
                    click: () => {
                        spaManager.requestModal({
                            title: 'Select to reaload!',
                            body: {
                                tag: 'div', class: 'row', children:
                                    [
                                        {
                                            tag: 'div', class: 'col-12 form-group', children: [
                                                { tag: 'label', text: 'Open Module' },
                                                {
                                                    tag: 'select', name: 'ddlModule', class: 'form-select', children: [
                                                        ...moduleManager.getResumeOfFailtToLoad().map(x => { return { tag: 'option', value: x, text: x }; }),
                                                        ...moduleManager.getModulesName().reverse().map(x => { return { tag: 'option', value: x, text: x }; }),
                                                    ]
                                                }
                                            ]
                                        },
                                    ]
                            },
                            footer: [
                                { role: 'modal-dismiss' },
                                { tag: 'button', type: 'button', id: 'btn-open', class: 'btn btn-success', text: 'Reload' },
                            ],
                            on: (event, origin, data) => {
                                if (origin == 'btn-open') {
                                    if (!data.ddlModule) {
                                        event.response('Module not found.');
                                        return;
                                    }

                                    // should reload only this module
                                    moduleManager.stopModule(data.ddlModule);

                                    updateTrayMenu();
                                    updateWindowMenu();

                                    loadMainPage();
                                    setTimeout(() => {
                                        moduleManager.loadModule(data.ddlModule);
                                        updateTrayMenu();
                                        updateWindowMenu();
                                    }, 1000);
                                    event.response(true);
                                }
                            }
                        });
                    },
                },
                {
                    label: 'Open Module with VS Code',
                    click: () => {
                        spaManager.requestModal({
                            title: 'Open Module with VS Code',
                            body: {
                                tag: 'div', class: 'row', children:
                                    [
                                        {
                                            tag: 'div', class: 'col-12 form-group', children: [
                                                { tag: 'label', text: 'Open Module' },
                                                {
                                                    tag: 'select', name: 'ddlModule', class: 'form-select', children: [
                                                        ...moduleManager.getResumeOfFailtToLoad().map(x => { return { tag: 'option', value: x, text: x }; }),
                                                        ...moduleManager.getModulesName().map(x => { return { tag: 'option', value: x, text: x }; }),
                                                    ]
                                                }
                                            ]
                                        },
                                    ]
                            },
                            footer: [
                                { role: 'modal-dismiss' },
                                { tag: 'button', type: 'button', id: 'btn-open', class: 'btn btn-success', text: 'Open' },
                            ],
                            on: (event, origin, data) => {
                                if (origin == 'btn-open') {
                                    if (!data.ddlModule) {
                                        event.response('Module not found.');
                                        return;
                                    }

                                    const mod = moduleManager.getModule(data.ddlModule);
                                    if (!mod) {
                                        event.response('Module not found.');
                                        return;
                                    }

                                    mod.openWithVSCode();
                                    //event.response(true);
                                }
                            }
                        });
                    }
                },
                {
                    label: 'Reload All Modules',
                    click: () => {
                        // should reload all modules
                        moduleManager.stopAllModules();
                        updateTrayMenu();
                        updateWindowMenu();
                        loadMainPage();
                        setTimeout(() => {
                            moduleManager.loadModules();
                            updateTrayMenu();
                            updateWindowMenu();
                        }, 1000);
                    },
                }
            ]
        },
        ...moduleManager.getMainMenu()
    ];

    let ctx = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(ctx);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    moduleManager.loadModules();

    updateTrayMenu();
    updateWindowMenu();

    createMainWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    //if (process.platform !== 'darwin') app.quit()
    if (config.getConfig('dymloader-quit-on-x')) app.quit();
});

app.on('before-quit', (e) => {
    // do not quit
    //e.preventDefault();
    config.saveConfig();
    moduleManager.stopAllModules();
    log('App Quitting');
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
