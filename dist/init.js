"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePages = exports.saveIds = exports.pages = exports.ids = exports.config = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
[
    '../info/'
].map(val => path_1.join(__dirname, val)).forEach(val => {
    if (!fs_1.existsSync(val)) {
        fs_1.mkdirSync(val);
    }
});
exports.config = {
    domain: "example.com",
    token: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    password: "xxxxxxxx",
    key: '',
    autoUnlock: true,
    threads: 5,
    congestionSleep: 0.5,
    stepSleep: 1,
    errSleep: 1,
    recaptchaSleep: 10,
    unlockingSleep: 10,
    requestTimeout: 10,
};
exports.ids = [];
exports.pages = [];
const path0 = path_1.join(__dirname, '../config.json');
const path1 = path_1.join(__dirname, '../ids');
const path2 = path_1.join(__dirname, '../pages');
function saveIds() {
    fs_1.writeFileSync(path1, exports.ids.filter(isFinite).join('\n'));
}
exports.saveIds = saveIds;
function savePages() {
    fs_1.writeFileSync(path2, exports.pages.filter(isFinite).join('\n'));
}
exports.savePages = savePages;
if (!fs_1.existsSync(path0)) {
    fs_1.writeFileSync(path0, JSON.stringify(exports.config, undefined, 4));
}
else {
    Object.assign(exports.config, JSON.parse(fs_1.readFileSync(path0, { encoding: 'utf8' })));
}
if (!fs_1.existsSync(path1)) {
    saveIds();
}
else {
    const string = fs_1.readFileSync(path1, { encoding: 'utf8' }).trim();
    if (string.length > 0) {
        exports.ids = string.split(/\s+/).map(Number);
    }
}
if (!fs_1.existsSync(path2)) {
    savePages();
}
else {
    const string = fs_1.readFileSync(path2, { encoding: 'utf8' }).trim();
    if (string.length > 0) {
        exports.pages = string.split(/\s+/).map(Number);
    }
}
