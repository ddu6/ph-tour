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
function numbersTosnumbers(numbers) {
    numbers = numbers.filter(isFinite);
    if (numbers.length === 0) {
        return '';
    }
    const array = [];
    let s = numbers[0];
    let e = s;
    for (let i = 1; i <= numbers.length; i++) {
        const number = numbers[i];
        if (number === e + 1) {
            e = number;
            continue;
        }
        if (s === e) {
            array.push(s.toString());
        }
        else {
            array.push(`${s}-${e}`);
        }
        e = s = number;
    }
    return array.join('\n');
}
function snumbersTonumbers(snumbers) {
    snumbers = snumbers.trim();
    if (snumbers.length === 0) {
        return [];
    }
    const array = snumbers.split(/\s+/);
    const numbers = [];
    for (const string of array) {
        if (/^\d+$/.test(string)) {
            numbers.push(Number(string));
            continue;
        }
        const match = string.match(/^(\d+)-(\d+)$/);
        if (match === null) {
            continue;
        }
        const s = Number(match[1]);
        const e = Number(match[2]);
        for (let n = s; n <= e; n++) {
            numbers.push(n);
        }
    }
    return numbers;
}
function saveIds() {
    fs_1.writeFileSync(path1, numbersTosnumbers(exports.ids));
}
exports.saveIds = saveIds;
function savePages() {
    fs_1.writeFileSync(path2, numbersTosnumbers(exports.pages));
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
    exports.ids = snumbersTonumbers(fs_1.readFileSync(path1, { encoding: 'utf8' }));
}
if (!fs_1.existsSync(path2)) {
    savePages();
}
else {
    exports.pages = snumbersTonumbers(fs_1.readFileSync(path2, { encoding: 'utf8' }));
}
