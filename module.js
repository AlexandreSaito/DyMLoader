const path = require('node:path');
const fs = require('node:fs');
const { exec, execSync } = require('child_process');

const { PythonToJSMask, checkPythonEnv } = require('./modulePy');
const { Page, setLastPage } = require('./spaManager');
const { log } = require('./logger.js');

function getModuleDirectory() {
    if (!fs.existsSync(path.join(__dirname, "..", "modules"))) fs.mkdirSync(path.join(__dirname, "..", "modules"));
    return path.join(__dirname, "..", "modules");
}

function loadPage(cm) {
    if (cm.module.beforePageLoad) cm.module.beforePageLoad();

    const page = new Page(cm.name, cm.mainTemplate.label, path.join(cm.directory, cm.mainPage));

    setLastPage(page);

    if (cm.module.beforePageLoad) page.doneLoading = () => cm.module.onPageLoad(page);

    return page;
}

class Plugin {
    constructor(){
        this.templates = [];
    }

    log(data){
        log(data);
    }

}

class CustomModule {
    constructor(moduleName, directory) {
        this.directory = directory;
        this.fails = [];
        this.name = moduleName;
        this.mainPage = '';
        this.mainFile = '';
        this.module = null;
        this.page = null;
        this.isAsync = false;

        this.mainTemplate = { label: moduleName, click: () => { this.page = loadPage(this) } };
        this.trayTemplate = { label: moduleName, click: () => { this.page = loadPage(this) } };
        //this.openWithVSCode();
    }

    openWithVSCode(){
        exec(`cd /d ${this.directory} & code .`, (error, stdout, stderr) => {
            if(error){
                log('Error', error.message);
                return;
            }

            if(stderr){
                log('Stderr', stderr);
            }

            log('Output', stdout);
        });
    }

    load() {
        // load manifest
        const manifestFile = path.join(this.directory, 'manifest.json');

        if (!fs.existsSync(manifestFile)) {
            this.fails.push({ message: 'Manifest not found.' });
            return;
        }

        const manifestName = require.resolve(manifestFile);
        const manifest = require(manifestFile);
        // get pertinent data from manifest
        this.mainPage = manifest.page;
        this.mainFile = manifest.start;

        if (manifest.menuName) this.mainTemplate.label = manifest.menuName;
        if (manifest.trayName) this.trayTemplate.label = manifest.trayName;

        // unload manifest
        delete require.cache[manifestName];

        const mainFilePath = path.join(this.directory, this.mainFile);

        if (!fs.existsSync(path.join(this.directory, this.mainPage))) {
            this.fails.push({ message: 'Main page not found!' });
            return;
        }

        if (!fs.existsSync(mainFilePath)) {
            this.fails.push({ message: 'Main script not found!' });
            return;
        }

        const mainExt = path.extname(mainFilePath);

        switch (mainExt) {
            case '.js':
                try {
                    const requirementsFile = path.join(this.directory, 'requirements.txt');
                    const packageFile = path.join(this.directory, 'package.json');
                    if(fs.existsSync(requirementsFile)){
                        try{
                            const pluginDir = this.directory;
                            const dependencies = fs.readFileSync(requirementsFile).toString().split('\n');
                            const pack = JSON.parse(fs.readFileSync(packageFile).toString());
                            dependencies.forEach(dep => {
                                if (!pack.dependencies[dep]) {
                                    log(`Installing ${dep}...`);
                                    execSync(`npm install ${dep}`, { stdio: 'inherit', cwd: pluginDir });
                                } else {
                                    log(`${dep} is already installed.`);
                                }
                            });
                        }catch(e){
                            log(e);
                        }
                    }

                    let mod = undefined;
                    while(mod == undefined){
                        try{
                            mod = require(mainFilePath);
                        }catch(e){
                            log(e);
                            if(e.code == 'MODULE_NOT_FOUND') {
                                if(!e.message.startsWith('Cannot find module')){
                                    this.fails.push({ message: e.message });
                                    return;
                                }
                                let f = e.message.indexOf("'") + 1;
                                let l = e.message.indexOf("'", f);
                                const toInstall = e.message.substr(f, l - f);
                                if(toInstall.startsWith('/') || toInstall.startsWith('\\') || toInstall.startsWith('.')){
                                    this.fails.push({ message: e.message });
                                    return;
                                }

                                execSync(`npm install ${toInstall}`, { stdio: 'inherit', cwd: this.directory });
                                continue;
                            }
                        }
                    }
                    
                    if(!mod){
                        this.fails.push({ message: 'Something has gone wrong when loading module!' });
                        return;
                    }
                    const plugin = new Plugin();
                    mod.getPlugin(plugin);
                    this.module = plugin;
                    this.module.log = log;
                } catch (e) {
                    this.fails.push({ message: `Failed to load module ${this.name}! ${e}` });
                }
                return;
            case '.py':
                checkPythonEnv(getModuleDirectory);
                this.module = new PythonToJSMask(this.name);
                this.isAsync = true;
                this.module.setup(this.directory, mainFilePath);
                return;
            case '.dll':
            default:
                this.isAsync = true;
                this.fails.push({ message: `Extension not handled ${mainExt}.` });
                return;
        }
    }

    init() {
        if (!this.module) return;

        const updateTemplate = (trayTemplate, mainTemplate) => {
            if (trayTemplate.submenu) trayTemplate.click = undefined;
            if (mainTemplate.submenu) mainTemplate.click = undefined;
        };

        this.module.init(this.trayTemplate, this.mainTemplate);

        if (this.isAsync) {
            this.module.addResponseHandler('init', (status, data) => {
                if (status != 'ok') {
                    log(status);
                    return;
                }

                updateTemplate(this.trayTemplate, this.mainTemplate)
            });
            return;
        }
        updateTemplate(this.trayTemplate, this.mainTemplate);
    }

    hasFailed() {
        return this.fails.length > 0;
    }

    failReason() {
        return this.fails;
    }

    getTrayMenu() {
        return this.trayTemplate;
    }

    getMainMenu() {
        return this.mainTemplate;
    }

    unload() {
        this.beforeQuit();

        if (!this.isAsync) {
            delete require.cache[path.join(this.directory, this.mainFile)];
        }
        delete this.module;
    }

    eachSecond() {
        if (this.module.eachSecond) this.module.eachSecond();
    }

    beforePageLoad() {
        this.page = new Page();

        if (this.module.beforePageLoad) this.module.beforePageLoad();
    }

    onPageLoad() {
        if (this.module.onPageLoad) this.module.onPageLoad(this.page);
    }

    onAction() {
        if (this.module.onAction) this.module.onAction();
    }

    beforePageClose() {
        if (this.module.beforePageClose) this.module.beforePageClose(this.page);
    }

    onPageClose() {
        if (this.module.onPageClose) this.module.onPageClose();

        this.page = null;
    }

    beforeQuit() {
        if (this.module.beforeQuit) this.module.beforeQuit();
    }

}

module.exports = {
    getModuleDirectory,
    CustomModule
}
