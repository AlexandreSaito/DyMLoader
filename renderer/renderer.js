//const information = document.getElementById('info')
//information.innerText = `This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`

import getElementFromRole from './roleNodes.js'
import { makeHtml, getFormAsData } from './helperHtml.js'
import openModal from './modal.js'
import log from './logger.js'

console.log(api.system.getCreationTime())

const logger = document.getElementById('logger');
const lblPageTitle = document.getElementById('page-title');
const mainHtml = document.getElementById('main-html');
const lblNetworkStatus = document.getElementById('network-status');

const loadPage = (page) => {
    if (!page) return;
    console.log(page);
    lblPageTitle.innerHTML = page.title;
    mainHtml.innerHTML = page.html;

    mainHtml.setAttribute('module-page', page.moduleName);
    api.send('page-loaded', { valid: true });
}

const setNetworkStatus = (status) => {
    lblNetworkStatus.innerHTML = status ? 'online' : 'offline';
};

let eventRegistered = {};

function addEventListener(element, event) {
    element.addEventListener(event, function (e) {
        //console.log(e.target, e.target.matches);
        if (e.target && e.target.matches) {
            const current = eventRegistered[event];
            if (!current) return;
            let match = current.filter(x => e.target.matches(x)).map(x => {
                const selector = element.querySelectorAll(x);

                return { name: x, value: selector.length == 1 ? (selector[0].type == 'checkbox' ? selector[0].checked : selector[0].value ?? selector[0].selected) : selector[0].type == 'radio' ? (() => { let val = null; selector.forEach(y => { if (y.checked) val = y.value }); return val; })() : '' }
            });
            //console.log(match);
            api.send('page-event', { id: mainHtml.getAttribute('module-page'), event: event, matches: match, value: null });
        }
    });
}

function delegate_event(element, event, query) {
    if (!eventRegistered[event]) {
        eventRegistered[event] = [];
        addEventListener(element, event);
    }

    if (!eventRegistered[event].includes(query)) eventRegistered[event].push(query);
}

window.addEventListener('DOMContentLoaded', () => {

    if (logger) {
        api.on('log', (e, args) => {
            log(args);
        });
        return;
    }

    setNetworkStatus(navigator.onLine);
    window.addEventListener('online', e => { setNetworkStatus(true); });
    window.addEventListener('offline', e => { setNetworkStatus(false); });


    for (const type of ['chrome', 'node', 'electron']) {
        const element = document.getElementById(`${type}-version`);
        if (element) element.innerText = versions[type]();
    }

    api.on('load-page', (e, args) => {
        loadPage(args);
    });

    api.on('page-html', (e, args) => {
        if (args.id != mainHtml.getAttribute('module-page')) {
            console.log('page-html was called before its time');
            return;
        }

        const element = mainHtml.querySelector(args.parentQuery);
        if (!element) {
            console.log('page-html element to append not found');
            return;
        }

        console.log(args);
        let html = document.createElement('div');
        if (typeof args.html == 'object') makeHtml(html, args.html);
        else html.innerHTML = args.html;

        if (args.clearBeforeRender) {
            element.innerHTML = '';
        }

        element.append(...html.children);
    });

    api.on('page-request-data', (e, args) => {
        if (args.id != mainHtml.getAttribute('module-page')) {
            console.log('page-request-data was called before its time');
            return;
        }
        console.log(args);

        const data = {};
        for (let i = 0; i < args.queryElements.length; i++) {
            const current = args.queryElements[i];
            const el = mainHtml.querySelectorAll(current);
            if (el.length == 0) {
                console.log('page-request-data element not found');
                return;
            }

            let value = '';
            if (el.length == 1) {
                value = el[0].type == 'checkbox' ? el[0].checked : el[0].value ?? el[0].selected;
            }
            if (el[0].type == 'radio') {
                el.forEach(x => { if (x.checked) value = x.value });
            }

            data[el[0].getAttribute('name') ?? el[0].getAttribute('id')] = value;
        }

        api.send('page-data', { id: args.id, requestId: args.requestId, data: data });
    });

    api.on('page-register-event', (e, args) => {
        if (args.id != mainHtml.getAttribute('module-page')) {
            console.log('page-register-event was called before its time');
            return;
        }

        console.log(args);
        delegate_event(mainHtml, args.event, args.query);
    });

});
