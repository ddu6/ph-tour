import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'fs'
import {join} from 'path'
[
    '../info/'
].map(val=>join(__dirname,val)).forEach(val=>{
    if(!existsSync(val)){
        mkdirSync(val)
    }
})
export const config={
    domain:"example.com",
    token:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    password:"xxxxxxxx",
    key:'',
    autoUnlock:true,
    threads:5,
    congestionSleep:0.5,
    stepSleep:1,
    errSleep:1,
    recaptchaSleep:10,
    unlockingSleep:10,
    requestTimeout:10,
}
export let ids:number[]=[]
export let pages:number[]=[]
const path0=join(__dirname,'../config.json')
const path1=join(__dirname,'../ids')
const path2=join(__dirname,'../pages')
export function saveIds(){
    writeFileSync(path1,ids.filter(isFinite).join('\n'))
}
export function savePages(){
    writeFileSync(path2,pages.filter(isFinite).join('\n'))
}
if(!existsSync(path0)){
    writeFileSync(path0,JSON.stringify(config,undefined,4))
}else{
    Object.assign(config,JSON.parse(readFileSync(path0,{encoding:'utf8'})))
}
if(!existsSync(path1)){
    saveIds()
}else{
    const string=readFileSync(path1,{encoding:'utf8'}).trim()
    if(string.length>0){
        ids=string.split(/\s+/).map(Number)
    }
}
if(!existsSync(path2)){
    savePages()
}else{
    const string=readFileSync(path2,{encoding:'utf8'}).trim()
    if(string.length>0){
        pages=string.split(/\s+/).map(Number)
    }
}