const { contextBridge, ipcRenderer, webUtils } = require('electron');
//const { getCurrentAddon } = require('../addons.js');
//const pageManager = require('../pageManager.js');

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
    // we can also expose variables, not just functions
});

contextBridge.exposeInMainWorld('api', {
    system: {
        getCreationTime: () => process.getCreationTime(),
        getCPUUsage: () => process.getCPUUsage(),
        getBlinkMemoryInfo: () => process.getBlinkMemoryInfo(),
        getSystemMemoryInfo: () => process.getSystemMemoryInfo(),
        getProcessMemoryInfo: () => process.getProcessMemoryInfo(),
    },
    getHtmlFromRenderer: (fileName) => { },
    getHtmlFromModule: (fileName) => { },
    on: (channel, listener) => { ipcRenderer.on(channel, listener) },
    send: (channel, data) => { ipcRenderer.send(channel, data) },
    utils: webUtils 
});

window.addEventListener('DOMContentLoaded', () => {
    //pageManager.setWindow(window);

    ipcRenderer.on('on-load', (e, args) => {
        console.log(args)
    });

    //console.log(getCurrentAddon());
});