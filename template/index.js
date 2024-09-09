function getPlugin(plugin) {
	
    plugin.init = (trayMenu, mainMenu) => {
        plugin.log('{module_name} init');
    };

    plugin.beforePageLoad = () => {
        plugin.log('{module_name} beforePageLoad');
    };

    plugin.onPageLoad = (page) => {
        plugin.log('{module_name} onPageLoad');

        page.addEventListener('click', '#btn-1', () => {
            plugin.log("'#btn-1' was clicked");
            page.getData(['#text-1', '#select-1', 'input[name="rdb-1"]', '#chk-1', '#inputFile'], (data) => {
                page.loadHtml('#list-data-gotten', {
                    clearBeforeRender: false, // Can be ommited, default: true
                    fileOrHtml: [{ tag: 'div', text: `data received: ${JSON.stringify(data)}` }]
                });
            });
        });

        page.addEventListener('click', '#btn-2', () => {
            plugin.log("'#btn-2' was clicked");
            page.modal({
                title: 'Title',
                body: 'A text on the body.',
                footer: [ 
					{ 'role': 'modal-dismiss' },
					{ 'tag': 'button', 'type': 'button', 'id': 'btn-save', 'class': 'btn btn-success', 'text': 'Save' },
				],
                on: (event, origin, data) => {

                },
            });
        });

        page.addEventListener('click', '#btn-3', () => {
            plugin.log("'#btn-3' was clicked");
            page.modal({
                title: 'Title',
                body: [ { tag: 'input', name: 'modal-input', class: 'form-control' } ],
                footer: [ 
					{ 'role': 'modal-dismiss' },
					{ 'tag': 'button', 'type': 'button', 'id': 'btn-save', 'class': 'btn btn-success', 'text': 'Save' },
				],
                on: (event, origin, data) => {
                    plugin.log(`origin: ${origin}`)
                    plugin.log(`data: ${data}`)
					if(origin == 'event-close') return;
                    if(!data['modal-input']){
                        event.response('Fill the input!');
                        return;
                    }
                    event.response(true);
                },
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

        page.loadHtml('#list-data-gotten', {
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

}

module.exports = {
    getPlugin,
};
