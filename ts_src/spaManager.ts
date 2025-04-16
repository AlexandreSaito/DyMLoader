import fs from 'fs';
import { ipcMain, BrowserWindow } from 'electron';
import { log } from './logger';
import { CustomHTMLObject, CustomModalObject, CustomModalHandler } from './htmlInterface';
import { PageLoadType, PageEventHandler, IPage } from './pageInterface';

let win: BrowserWindow;
let lastPage: Page;

let currentPage: Page | null = null;
let modalHandler: Record<string, null | ModalHandler> = {};
let modalId = 1;

interface ModalHandler {
    on?: undefined | null | CustomModalHandler
}

class Page implements IPage {
    id: string;
    currentDataRequest: number;
    dataRequest: Record<string, Function>;
    events: Record<string, Record<string, Array<PageEventHandler>>>;
    reload: null | Function;
    doneLoading?: null | Function;

    constructor(id: string, title: string, mainHtml: string) {
        this.id = id;
        this.currentDataRequest = 1;
        this.dataRequest = {};
        this.events = {};
        this.reload = () => loadPage(id, title, { filePath: mainHtml });

        if (currentPage && currentPage.id == id) {
            return;
        }
        this.id = id;
        currentPage = this;
        loadPage(id, title, { filePath: mainHtml });
    }

    loadHtml(parentQuery: string, { clearBeforeRender, fileOrHtml }: { clearBeforeRender: boolean, fileOrHtml: string | CustomHTMLObject }) {
        win.webContents.send('page-html', { id: this.id, parentQuery: parentQuery, clearBeforeRender: clearBeforeRender ?? true, html: typeof fileOrHtml == 'string' && fs.existsSync(fileOrHtml) ? fs.readFileSync(fileOrHtml).toString() : fileOrHtml })
    }

    changeHtml(parentQuery: string, { html }: { html: CustomHTMLObject }) {
        win.webContents.send('page-html-change', { id: this.id, parentQuery: parentQuery, clearBeforeRender: true, html: html })
    }

    renderTable(parentQuery: string, table: CustomHTMLObject) {

    }

    addEventListener(event: string, query: string, func: PageEventHandler) {
        if (!this.events[event]) this.events[event] = {};
        if (!this.events[event][query]) this.events[event][query] = [];
        ;
        this.events[event][query].push(func);

        win.webContents.send('page-register-event', { id: this.id, event, query });
    }

    getData(queryElements: string, func: Function, customId: number) {
        const requestId = customId ? customId : this.currentDataRequest++;
        this.dataRequest[requestId] = func;
        win.webContents.send('page-request-data', { id: this.id, requestId: requestId, queryElements });
    }

    modal({ title, body, footer, on }: CustomModalObject) {
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
        response: (r: any) => { win.webContents.send('modal-response', { id: data.id, data: r }); },
    };

    if (handler && handler.on) handler.on(actions, data.origin, data.data);

    if (data.origin == 'event-close') delete modalHandler[data.id];
});

function setWindow(window: BrowserWindow) {
    win = window;

    return currentPage;
}

function hasPageLoaded() {
    return lastPage != null && lastPage != undefined;
}

function setLastPage(page: Page) { lastPage = page; }

function loadPage(id: string, title: string, { filePath, html }: PageLoadType) {
    win.webContents.send('load-page', { moduleName: id, title: title, html: html ? html : filePath ? fs.readFileSync(filePath).toString() : "" });
}

function loadLastPage() {
    if (lastPage && lastPage.reload) lastPage.reload();
}

function requestModal({ title, body, footer, on }: CustomModalObject) {
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
