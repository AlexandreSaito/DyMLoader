const path = require('node:path')
const fs = require('node:fs');
const { spawn } = require('child_process');
const { log } = require('./logger.js');

const { getModuleDirectory, CustomModule } = require('./module');

let listFailedModules = [];
let listModules = [];

function loadModules() {
    const currentDir = getModuleDirectory();

    fs.readdirSync(currentDir).forEach(item => {
        if (path.extname(item) != '' || item == 'venv') return;
        log(item);

        const cm = new CustomModule(item, path.join(currentDir, item));

        cm.load();

        if (cm.hasFailed()) {
            listFailedModules.push(cm);
            return;
        }

        listModules.push(cm);

        cm.init();
    });

}

function forEachModule(func) {
    for (let i = 0; i < listModules.length; i++) {
        const cm = listModules[i];
        func(cm);
    }
}

function getModule(name){
    return listModules.find(x => x.name == name);
}

function forModule(name, func) {
    const cm = listModules.find(x => x.name == name);
    if (!cm) return;
    func(cm);
}

function getTrayMenu() {
    let menu = [];

    forEachModule((cm) => {
        menu.push(cm.getTrayMenu());
    });

    return menu;
}

function getMainMenu() {
    let menu = [];

    forEachModule((cm) => {
        menu.push(cm.getMainMenu());
    });

    return menu;
}

function stopAllModules() {
    const l = listModules.length;
    for (let i = 0; i < l; i++) {
        listModules.pop().unload();
    }
}

function getResumeOfFailtToLoad() {
    let fails = [];
    for (let i = 0; i < listFailedModules.length; i++) {
        fails.push({ name: listFailedModules[i], reasons: listFailedModules[i].failReason() });
    }
    return fails;
}

function process() {
    forEachModule((cm) => { cm.eachSecond(); });
}

function getModulesName(){
    let modules = [];
    forEachModule((cm) => { modules.push(cm.name); });
    return modules;
}

function createTemplate(name, type) {
    const templateFolder = path.join(__dirname, 'template');
    const projectFolder = path.join(getModuleDirectory(), name);
    if (fs.existsSync(projectFolder)) return false;
    fs.mkdirSync(projectFolder, { recursive: true });
    fs.writeFileSync(path.join(projectFolder, 'index.html'), fs.readFileSync(path.join(templateFolder, 'index.html')));

    if (type == 'js') {
        fs.writeFileSync(path.join(projectFolder, 'index.js'), fs.readFileSync(path.join(templateFolder, 'index.js')).toString().replaceAll('{module_name}', name));
    }

    if (type == 'py') {
        fs.writeFileSync(path.join(projectFolder, 'index.py'), fs.readFileSync(path.join(templateFolder, 'index.py')).toString().replaceAll('{module_name}', name));
        //fs.writeFileSync(path.join(projectFolder, 'requirements.txt'), fs.readFileSync(path.join(templateFolder, 'requirements.txt')));
    }

    fs.writeFileSync(path.join(projectFolder, 'manifest.json'), fs.readFileSync(path.join(templateFolder, 'manifest.json')).toString().replaceAll('{module_name}', name).replaceAll('{module_type}', type));

    return projectFolder;
}

module.exports = {
    loadModules,
    stopAllModules,
    getTrayMenu,
    getMainMenu,
    getResumeOfFailtToLoad,
    createTemplate,
    getModulesName,
    getModule,
};
