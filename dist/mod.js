"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const init_1 = require("./init");
const playwright_chromium_1 = require("playwright-chromium");
const cli_tools_1 = require("@ddu6/cli-tools");
const clit = new cli_tools_1.CLIT(__dirname, init_1.config);
let unlocking = false;
async function sleep(time) {
    await new Promise(resolve => {
        setTimeout(resolve, time * 1000);
    });
}
async function get(path, params = {}) {
    const result = await clit.request(`https://${init_1.config.domain}/phs/${path}`, params);
    if (typeof result === 'number') {
        return result;
    }
    const { status, body } = result;
    if (status !== 200) {
        return status;
    }
    try {
        const { status, data } = JSON.parse(body);
        if (status === 200) {
            return { data: data };
        }
        if (typeof status === 'number') {
            return status;
        }
    }
    catch (err) {
        clit.log(err);
    }
    return 500;
}
async function basicallyGetComments(id, token, password) {
    const data = await get(`cs${id}`, {
        update: '',
        token: token,
        password: password
    });
    return data;
}
async function basicallyGetLocalComments(id, token, password) {
    const data = await get(`local/cs${id}`, {
        token: token,
        password: password
    });
    return data;
}
async function basicallyGetHole(id, token, password) {
    const data = await get(`h${id}`, {
        update: '',
        token: token,
        password: password
    });
    return data;
}
async function basicallyGetLocalHole(id, token, password) {
    const data = await get(`local/h${id}`, {
        token: token,
        password: password
    });
    return data;
}
async function basicallyGetPage(key, page, token, password) {
    const data = await get(`p${page}`, {
        update: '',
        key: key,
        token: token,
        password: password
    });
    return data;
}
async function basicallyUpdateComments(id, reply, token, password) {
    if (reply === 0) {
        return 200;
    }
    const result0 = await basicallyGetLocalComments(id, token, password);
    if (result0 === 401) {
        return 401;
    }
    if (result0 === 403) {
        return 403;
    }
    if (result0 === 503) {
        return 503;
    }
    if (typeof result0 === 'number') {
        return 500;
    }
    const data0 = result0.data;
    const length0 = data0.length;
    if (reply >= 0 && length0 >= reply) {
        return 200;
    }
    const result1 = await basicallyGetComments(id, token, password);
    if (result1 === 423) {
        return 423;
    }
    if (result1 === 401) {
        return 401;
    }
    if (result1 === 403) {
        return 403;
    }
    if (result1 === 503) {
        return 503;
    }
    if (result1 === 404) {
        return 404;
    }
    if (typeof result1 === 'number') {
        return 500;
    }
    const data1 = result1.data;
    for (let i = 0; i < data1.length; i++) {
        const { text } = data1[i];
        if (typeof text === 'string' && text.startsWith('[Helper]')) {
            return 423;
        }
    }
    const cid = Math.max(...data1.map(val => Number(val.cid)));
    const timestamp = Math.max(...data1.map(val => Number(val.timestamp)));
    clit.out(`cs${id} updated to c${cid} which is in ${prettyTimestamp(timestamp)}`);
    return 200;
}
async function updateComments(id, reply, token, password) {
    while (true) {
        if (unlocking) {
            await sleep(init_1.config.recaptchaSleep);
            continue;
        }
        const result = await basicallyUpdateComments(id, reply, token, password);
        if (result === 503) {
            clit.out('503');
            await sleep(init_1.config.congestionSleep);
            continue;
        }
        if (result === 500) {
            clit.out('500');
            await sleep(init_1.config.errSleep);
            continue;
        }
        if (result === 423) {
            clit.out('423');
            if (init_1.config.autoUnlock) {
                await unlock();
            }
            await sleep(init_1.config.recaptchaSleep);
            continue;
        }
        if (result === 401) {
            return 401;
        }
        if (result === 403) {
            return 403;
        }
        return 200;
    }
}
async function basicallyUpdateHole(id, token, password) {
    const result0 = await basicallyGetLocalHole(id, token, password);
    if (result0 === 401) {
        return 401;
    }
    if (result0 === 403) {
        return 403;
    }
    if (result0 === 503) {
        return 503;
    }
    if (result0 === 404) {
        const result1 = await basicallyGetHole(id, token, password);
        if (result1 === 401) {
            return 401;
        }
        if (result1 === 403) {
            return 403;
        }
        if (result1 === 503) {
            return 503;
        }
        if (result1 === 404) {
            return 404;
        }
        if (typeof result1 === 'number') {
            return 500;
        }
        clit.out(`h${id} included`);
        return await updateComments(id, Number(result1.data.reply), token, password);
    }
    if (typeof result0 === 'number') {
        return 500;
    }
    const data0 = result0.data;
    if (Number(data0.timestamp) === 0) {
        return 404;
    }
    if (Number(data0.hidden) === 1) {
        return 404;
    }
    const result1 = await basicallyGetHole(id, token, password);
    if (result1 === 401) {
        return 401;
    }
    if (result1 === 403) {
        return 403;
    }
    if (result1 === 503) {
        return 503;
    }
    if (result1 === 404) {
        return 404;
    }
    if (typeof result1 === 'number') {
        return 500;
    }
    const data1 = result1.data;
    const reply = Number(data1.reply);
    const deltaComments = reply - Number(data0.reply);
    const deltaLikes = Number(data1.likenum) - Number(data0.likenum);
    if (deltaComments > 0
        || deltaLikes !== 0) {
        clit.out(`h${id} updated by ${deltaComments} comments and ${deltaLikes} likes`);
    }
    return await updateComments(id, reply, token, password);
}
async function updateHole(id, token, password) {
    while (true) {
        if (unlocking) {
            await sleep(init_1.config.recaptchaSleep);
            continue;
        }
        const result = await basicallyUpdateHole(id, token, password);
        if (result === 503) {
            clit.out('503');
            await sleep(init_1.config.congestionSleep);
            continue;
        }
        if (result === 500) {
            clit.out('500');
            await sleep(init_1.config.errSleep);
            continue;
        }
        if (result === 401) {
            return 401;
        }
        if (result === 403) {
            return 403;
        }
        return 200;
    }
}
async function updateHoles() {
    let promises = [];
    let subIds = [];
    for (let i = 0; i < init_1.ids.length; i++) {
        const id = init_1.ids[i];
        if (!isFinite(id)) {
            continue;
        }
        promises.push(updateHole(id, init_1.config.token, init_1.config.password).then(val => {
            if (val === 200) {
                init_1.ids[i] = NaN;
                init_1.saveIds();
            }
            return val;
        }));
        subIds.push(id);
        if (promises.length < init_1.config.threads && i < init_1.ids.length - 1) {
            continue;
        }
        const result = await Promise.all(promises);
        if (result.includes(401)) {
            return 401;
        }
        if (result.includes(403)) {
            return 403;
        }
        clit.out(`#${subIds.join(',')} checked`);
        promises = [];
        subIds = [];
        await sleep(init_1.config.stepSleep);
    }
    return 200;
}
async function basicallyUpdatePage(key, page, token, password) {
    const result = await basicallyGetPage(key, page, token, password);
    if (result === 401) {
        return 401;
    }
    if (result === 403) {
        return 403;
    }
    if (result === 503) {
        return 503;
    }
    if (result === 404) {
        return 404;
    }
    if (typeof result === 'number') {
        return 500;
    }
    const data = result.data;
    let promises = [];
    let subIds = [];
    for (let i = 0; i < data.length; i++) {
        const { pid, reply } = data[i];
        promises.push(updateComments(pid, Number(reply), token, password));
        subIds.push(pid);
        if (promises.length < init_1.config.threads && i < data.length - 1) {
            continue;
        }
        const result = await Promise.all(promises);
        if (result.includes(401)) {
            return 401;
        }
        if (result.includes(403)) {
            return 403;
        }
        clit.out(`#${subIds.join(',')} checked`);
        promises = [];
        subIds = [];
        await sleep(init_1.config.stepSleep);
    }
    return 200;
}
async function updatePage(key, page, token, password) {
    while (true) {
        if (unlocking) {
            await sleep(init_1.config.recaptchaSleep);
            continue;
        }
        const result = await basicallyUpdatePage(key, page, token, password);
        if (result === 503) {
            clit.out('503');
            await sleep(init_1.config.congestionSleep);
            continue;
        }
        if (result === 500) {
            clit.out('500');
            await sleep(init_1.config.errSleep);
            continue;
        }
        if (result === 401) {
            return 401;
        }
        if (result === 403) {
            return 403;
        }
        return 200;
    }
}
async function updatePages() {
    for (let i = 0; i < init_1.pages.length; i++) {
        const page = init_1.pages[i];
        if (!isFinite(page)) {
            continue;
        }
        const result = await updatePage(init_1.config.key, page, init_1.config.token, init_1.config.password);
        if (result === 401) {
            return 401;
        }
        if (result === 403) {
            return 403;
        }
        init_1.pages[i] = NaN;
        init_1.savePages();
        clit.out(`p${page} checked`);
    }
    return 200;
}
async function unlock() {
    if (unlocking) {
        return;
    }
    unlocking = true;
    const browser = await playwright_chromium_1.chromium.launch();
    const context = await browser.newContext({ storageState: { origins: [{
                    origin: 'https://pkuhelper.pku.edu.cn',
                    localStorage: [{
                            name: 'TOKEN',
                            value: init_1.config.token
                        }]
                }] } });
    const page = await context.newPage();
    try {
        await page.goto('https://pkuhelper.pku.edu.cn/hole', { timeout: init_1.config.unlockingSleep * 1000 });
    }
    catch (err) {
        clit.log(err);
    }
    await sleep(init_1.config.unlockingSleep);
    await browser.close();
    unlocking = false;
}
function prettyTimestamp(stamp) {
    const date = new Date(Number(stamp + '000'));
    return [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ]
        .map(val => val.toString().padStart(2, '0'))
        .join(':')
        + ' '
        + [
            date.getMonth() + 1,
            date.getDate(),
            date.getFullYear(),
        ]
            .map(val => val.toString().padStart(2, '0'))
            .join('/');
}
async function main() {
    let result = await updateHoles();
    if (result === 401) {
        clit.out('401');
        return;
    }
    if (result === 403) {
        clit.out('403');
        return;
    }
    result = await updatePages();
    if (result === 401) {
        clit.out('401');
        return;
    }
    if (result === 403) {
        clit.out('403');
        return;
    }
    clit.out('Finished');
}
exports.main = main;
