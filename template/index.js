const { Plugin } = require('../plugin.js');

const plugin = new Plugin();

//setInterval(() => { console.log('Salve Akio!'); }, 1000)

// check Electron for menu management
// menu.click is removed if submenu is added
plugin.init = (trayMenu, mainMenu) => {
    plugin.log('{module_name} init');
};

plugin.beforePageLoad = () => {
    plugin.log('{module_name} beforePageLoad');
};

plugin.onPageLoad = (page) => {
    plugin.log('{module_name} onPageLoad');

    page.addEventListener('click', '#btn-1', () => {
        plugin.log("'#btn-1' was clicked")
        page.getData(['#text-1', '#select-1', 'input[name="rdb-1"]', '#chk-1'], (data) => {
            page.loadHtml('#list-data-getted', {
                clearBeforeRender: false, // Can be ommited, default: true
                fileOrHtml: [{ tag: 'div', text: `data received: ${JSON.stringify(data)}` }]
            });
        });

    });

    page.addEventListener('change', '#select-1', () => {
        plugin.log(`'#select-1' value has changed to {data}`)
    });

    page.addEventListener('change', 'input[name="rdb-1"]', (data) => {
        plugin.log(`radio value has changed to ${data}"`);
    });

    page.addEventListener('change', '#chk-1', (data) => {
        plugin.log(`check value has changed to ${data}`)
    });

    page.loadHtml('#list-data-getted', {
        clearBeforeRender: false, // Can be ommited, default: true
        fileOrHtml: [{ tag: 'div', text: 'Content Load from script!' }]
    });

};

plugin.beforePageClose = (page) => {
    plugin.log('{module_name} beforePageClose');
};

plugin.onPageClose = () => {
    plugin.log('{module_name} onPageClose');
};

plugin.beforeQuit = () => {
    plugin.log('{module_name} beforeQuit');
};

module.exports = {
    plugin,
};
