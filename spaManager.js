const fs = require('fs');
const { ipcMain } = require('electron');
const { log } = require('./logger.js');

let win;
let lastPage;

let currentPage = null;
let modalHandler = {};
let modalId = 1;

class Page {
    constructor(id, title, mainHtml) {
        if (currentPage && currentPage.id == id) {
            return;
        }
        this.id = id;
        currentPage = this;
        loadPage(id, title, { filePath: mainHtml });
        this.reload = () => loadPage(id, title, { filePath: mainHtml });
        this.currentDataRequest = 1;
        this.dataRequest = {};
        this.events = {};
    }

    loadHtml(parentQuery, { clearBeforeRender, fileOrHtml }) {
        win.webContents.send('page-html', { id: this.id, parentQuery: parentQuery, clearBeforeRender: clearBeforeRender ?? true, html: typeof fileOrHtml == 'string' && fs.existsSync(fileOrHtml) ? fs.readFileSync(fileOrHtml).toString() : fileOrHtml })
    }

    renderTable(parentQuery, table) {

    }

    addEventListener(event, query, func) {
        if (!this.events[event]) this.events[event] = {};
        if (!this.events[event][query]) this.events[event][query] = [];
        ;
        this.events[event][query].push(func);

        win.webContents.send('page-register-event', { id: this.id, event, query });
    }

    getData(queryElements, func, customId) {
        const requestId = customId ? customId : this.currentDataRequest++;
        this.dataRequest[requestId] = func;
        win.webContents.send('page-request-data', { id: this.id, requestId: requestId, queryElements });
    }

    modal({ title, body, footer, on }){
        requestModal({ title: title, body: body, footer: footer, on: on });
    }

}

ipcMain.on('page-loaded', (e, data) => {
    //log(e);
    //log(data);
    if (!currentPage) return;
    if (currentPage.doneLoading) currentPage.doneLoading();
});

ipcMain.on('page-data', (e, data) => {
    //log(e);
    //log(data);
    if (!currentPage || currentPage.id != data.id) {
        log('[page-request-data] Page not found', data);
        return;
    }

    if (!currentPage.dataRequest[data.requestId]) {
        log('[page-request-data] Request not found', data);
        return;
    }

    currentPage.dataRequest[data.requestId](data.data);

});

ipcMain.on('page-event', (e, data) => {
    //log(e);
    //log(data);
    if (!currentPage || currentPage.id != data.id) {
        log('[page-event] Page not found', data);
        return;
    }

    if (!currentPage.events || !currentPage.events[data.event]) {
        log('[page-event] Event not found', data);
        return;
    }

    const event = currentPage.events[data.event];
    for (let i = 0; i < data.matches.length; i++) {
        const match = data.matches[i];
        if (event[match.name]) {
            for (var j = 0; j < event[match.name].length; j++) {
                event[match.name][j](match.value, match.dataset);
            }
        }
    }
});

ipcMain.on('modal-action', (e, data) => {
    if (!data.id) {
        log('This action shouldt be called right now.');
        return;
    }

    const handler = modalHandler[data.id];

    const actions = {
        response: (r) => { win.webContents.send('modal-response', { id: data.id, data: r }); },
    };

    handler.on(actions, data.origin, data.data);

    if (data.origin == 'event-close') delete modalHandler[data.id];
});

function setWindow(window) {
    win = window;

    return currentPage;
}

function hasPageLoaded(){
    return lastPage != null && lastPage != undefined;
}

function setLastPage(page) { lastPage = page; }

function loadPage(id, title, { filePath, html }) {
    win.webContents.send('load-page', { moduleName: id, title: title, html: html ? html : fs.readFileSync(filePath).toString() });
}

function loadLastPage() {
    if (lastPage && lastPage.reload) lastPage.reload();
}

function requestModal({ title, body, footer, on }) {
    const id = modalId++;

    modalHandler[id] = {
        on: on ? on : null,
    };
    win.webContents.send('request-modal', {
        id: id,
        title: title,
        body: body,
        footer: footer,
    });
}

module.exports = {
    Page,
    setWindow,
    hasPageLoaded,
    setLastPage,
    loadLastPage,
    requestModal,
}
