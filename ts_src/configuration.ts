const fs = require('fs')
const path = require('path')

const dataFolder = path.join(__dirname, '..', 'data');
const configFile = path.join(dataFolder, 'config.json');

let configs: any = {} ;

function loadConfig() {
    if(!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);
    if (!fs.existsSync(configFile)) {
        return;
    }
    configs = JSON.parse(fs.readFileSync(configFile).toString());
}

function saveConfig() {
    fs.writeFileSync(configFile, JSON.stringify(configs));
}

function setDefault(conf: string, value: any) {
    if (getConfig(conf) == undefined) {
        setConfig(conf, value);
        saveConfig();
    }
}

function getConfig(conf: string) : any {
    return configs[conf];
}

function setConfig(conf: string, value: any) {
    configs[conf] = value;
}

module.exports = {
    loadConfig,
    setDefault,
    getConfig,
    setConfig,
    saveConfig,
}
