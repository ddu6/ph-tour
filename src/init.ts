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
    unlockSleep:10,
    requestTimeout:10,
}
export let ids:number[]=[]
export let pages:number[]=[]
const path0=join(__dirname,'../config.json')
const path1=join(__dirname,'../ids')
const path2=join(__dirname,'../pages')
function numbersTosnumbers(numbers:number[]){
    numbers=numbers.filter(isFinite)
    if(numbers.length===0){
        return ''
    }
    const array:string[]=[]
    let s=numbers[0]
    let e=s
    for(let i=1;i<=numbers.length;i++){
        const number=numbers[i]
        if(number===e+1){
            e=number
            continue
        }
        if(s===e){
            array.push(s.toString())
        }else{
            array.push(`${s}-${e}`)
        }
        e=s=number
    }
    return array.join('\n')
}
function snumbersTonumbers(snumbers:string){
    snumbers=snumbers.trim()
    if(snumbers.length===0){
        return []
    }
    const array=snumbers.split(/\s+/)
    const numbers:number[]=[]
    for(const string of array){
        if(/^\d+$/.test(string)){
            numbers.push(Number(string))
            continue
        }
        const match=string.match(/^(\d+)-(\d+)$/)
        if(match===null){
            continue
        }
        const s=Number(match[1])
        const e=Number(match[2])
        for(let n=s;n<=e;n++){
            numbers.push(n)
        }
    }
    return numbers
}
export function saveIds(){
    writeFileSync(path1,numbersTosnumbers(ids))
}
export function savePages(){
    writeFileSync(path2,numbersTosnumbers(pages))
}
if(!existsSync(path0)){
    writeFileSync(path0,JSON.stringify(config,undefined,4))
}else{
    Object.assign(config,JSON.parse(readFileSync(path0,{encoding:'utf8'})))
}
if(!existsSync(path1)){
    saveIds()
}else{
    ids=snumbersTonumbers(readFileSync(path1,{encoding:'utf8'}))
}
if(!existsSync(path2)){
    savePages()
}else{
    pages=snumbersTonumbers(readFileSync(path2,{encoding:'utf8'}))
}