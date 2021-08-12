import * as fs from 'fs'
import * as path from 'path'
[
    '../info/'
].map(val=>path.join(__dirname,val)).forEach(val=>{
    if(!fs.existsSync(val))fs.mkdirSync(val)
})
export const config={
    token:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    password:"xxxxxxxx",
    batches:{
        start:-1,
        length:1
    },
    domain:"example.com",
    autoUnlock:true,
    threads:5,
    congestionSleep:0.5,
    stepSleep:1,
    errSleep:1,
    recaptchaSleep:10,
    unlockingSleep:10,
    requestTimeout:5,
}
const path0=path.join(__dirname,'../config.json')
if(!fs.existsSync(path0)){
    fs.writeFileSync(path0,JSON.stringify(config,undefined,4))
}else{
    Object.assign(config,JSON.parse(fs.readFileSync(path0,{encoding:'utf8'})))
}