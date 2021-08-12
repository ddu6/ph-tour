import {config} from './init'
import {chromium} from 'playwright-chromium'
import {CLIT} from '@ddu6/cli-tools'
const clit=new CLIT(__dirname,config)
let unlocking=false
interface HoleData{
    text:string|null|undefined
    tag:string|null|undefined
    pid:number|string
    timestamp:number|string
    reply:number|string
    likenum:number|string
    type:string|null|undefined
    url:string|null|undefined
    hidden:'1'|'0'|1|0|boolean
    etimestamp:number|string|undefined
}
interface CommentData{
    text:string|null|undefined
    tag:string|null|undefined
    cid:number|string
    pid:number|string
    timestamp:number|string
    name:string|null|undefined
}
async function sleep(time:number){
    await new Promise(resolve=>{
        setTimeout(resolve,time*1000)
    })
}
async function get(path:string,params:Record<string,string>={}){
    const result=await clit.request(`https://${config.domain}/phs/${path}`,params)
    if(typeof result==='number'){
        return result
    }
    const {status,body}=result
    if(status!==200){
        return status
    }
    try{
        const {status,data}=JSON.parse(body)
        if(status===200){
            return {data:data}
        }
        if(typeof status==='number'){
            return status
        }
    }catch(err){
        clit.log(err)
    }
    return 500
}
async function basicallyGetIds(batchNumber:number,token:string,password:string){
    const result:{data:number[]}|number=await get(`local/ids${batchNumber}`,{
        token:token,
        password:password
    })
    if(result===503){
        return 503
    }
    if(result===401){
        return 401
    }
    if(result===403){
        return 403
    }
    if(typeof result==='number'){
        return 500
    }
    return result.data
}
async function getIds(batchNumber:number,token:string,password:string){
    while(true){
        const result=await basicallyGetIds(batchNumber,token,password)
        if(result===503){
            clit.out('503')
            await sleep(config.congestionSleep)
            continue
        }
        if(result===500){
            clit.out('500')
            await sleep(config.errSleep)
            continue
        }
        if(result===401){
            return 401
        }
        if(result===403){
            return 403
        }
        return result
    }
}
function idsToRIds(data:number[],batchNumber:number){
    const batchSize=10000
    data=data.map(val=>val%batchSize)
    batchNumber*=batchSize
    const ids:Record<number,boolean>={}
    for(let i=0;i<data.length;i++){
        ids[data[i]]=true
    }
    const array:number[]=[]
    for(let i=0;i<batchSize;i++){
        if(ids[i]){
            continue
        }
        array.push(batchNumber+i)
    }
    return array
}
async function basicallyGetComments(id:number|string,token:string,password:string){
    const data:{data:CommentData[]}|number=await get(`cs${id}`,{
        update:'',
        token:token,
        password:password
    })
    return data
}
async function basicallyGetLocalComments(id:number|string,token:string,password:string){
    const data:{data:CommentData[]}|number=await get(`local/cs${id}`,{
        token:token,
        password:password
    })
    return data
}
async function basicallyGetHole(id:number|string,token:string,password:string){
    const data:{data:HoleData}|number=await get(`h${id}`,{
        update:'',
        token:token,
        password:password
    })
    return data
}
async function basicallyGetLocalHole(id:number|string,token:string,password:string){
    const data:{data:HoleData}|number=await get(`local/h${id}`,{
        token:token,
        password:password
    })
    return data
}
async function basicallyGetPage(key:string,page:number|string,token:string,password:string){
    const data:{data:HoleData[]}|number=await get(`p${page}`,{
        update:'',
        key:key,
        token:token,
        password:password
    })
    return data
}
async function basicallyUpdateComments(id:number|string,reply:number,token:string,password:string){
    if(reply===0){
        return 200
    }
    const result0=await basicallyGetLocalComments(id,token,password)
    if(result0===401){
        return 401
    }
    if(result0===403){
        return 403
    }
    if(result0===503){
        return 503
    }
    if(typeof result0==='number'){
        return 500
    }
    const data0=result0.data
    const length0=data0.length
    if(reply>=0&&length0>=reply){
        return 200
    }
    const result1=await basicallyGetComments(id,token,password)
    if(result1===423){
        return 423
    }
    if(result1===401){
        return 401
    }
    if(result1===403){
        return 403
    }
    if(result1===503){
        return 503
    }
    if(result1===404){
        return 404
    }
    if(typeof result1==='number'){
        return 500
    }
    const data1=result1.data
    for(let i=0;i<data1.length;i++){
        const {text}=data1[i]
        if(typeof text==='string'&&text.startsWith('[Helper]')){
            return 423
        }
    }
    const cid=Math.max(...data1.map(val=>Number(val.cid)))
    const timestamp=Math.max(...data1.map(val=>Number(val.timestamp)))
    clit.out(`cs${id} updated to c${cid} which is in ${prettyTimestamp(timestamp)}`)
    return 200
}
async function updateComments(id:number|string,reply:number,token:string,password:string){
    while(true){
        if(unlocking){
            await sleep(config.recaptchaSleep)
            continue
        }
        const result=await basicallyUpdateComments(id,reply,token,password)
        if(result===503){
            clit.out('503')
            await sleep(config.congestionSleep)
            continue
        }
        if(result===500){
            clit.out('500')
            await sleep(config.errSleep)
            continue
        }
        if(result===423){
            clit.out('423')
            if(config.autoUnlock){
                await unlock()
            }
            await sleep(config.recaptchaSleep)
            continue
        }
        if(result===401){
            return 401
        }
        if(result===403){
            return 403
        }
        return 200
    }
}
async function basicallyUpdateHole(id:number|string,token:string,password:string){
    const result0=await basicallyGetLocalHole(id,token,password)
    if(result0===401){
        return 401
    }
    if(result0===403){
        return 403
    }
    if(result0===503){
        return 503
    }
    if(result0===404){
        const result1=await basicallyGetHole(id,token,password)
        if(result1===401){
            return 401
        }
        if(result1===403){
            return 403
        }
        if(result1===503){
            return 503
        }
        if(result1===404){
            return 404
        }
        if(typeof result1==='number'){
            return 500
        }
        clit.out(`h${id} included`)
        return await updateComments(id,Number(result1.data.reply),token,password)
    }
    if(typeof result0==='number'){
        return 500
    }
    const data0=result0.data
    if(Number(data0.timestamp)===0){
        return 404
    }
    if(Number(data0.hidden)===1){
        return 404
    }
    const result1=await basicallyGetHole(id,token,password)
    if(result1===401){
        return 401
    }
    if(result1===403){
        return 403
    }
    if(result1===503){
        return 503
    }
    if(result1===404){
        return 404
    }
    if(typeof result1==='number'){
        return 500
    }
    const data1=result1.data
    const reply=Number(data1.reply)
    const deltaComments=reply-Number(data0.reply)
    const deltaLikes=Number(data1.likenum)-Number(data0.likenum)
    if(
        deltaComments>0
        ||deltaLikes!==0
    ){
        clit.out(`h${id} updated by ${deltaComments} comments and ${deltaLikes} likes`)
    }
    return await updateComments(id,reply,token,password)
}
async function updateHole(id:number,token:string,password:string){
    while(true){
        if(unlocking){
            await sleep(config.recaptchaSleep)
            continue
        }
        const result=await basicallyUpdateHole(id,token,password)
        if(result===503){
            clit.out('503')
            await sleep(config.congestionSleep)
            continue
        }
        if(result===500){
            clit.out('500')
            await sleep(config.errSleep)
            continue
        }
        if(result===401){
            return 401
        }
        if(result===403){
            return 403
        }
        return 200
    }
}
async function updateHoles(ids:number[],token:string,password:string){
    let promises:Promise<200|401|403>[]=[]
    let subIds:number[]=[]
    for(let i=0;i<ids.length;i++){
        const id=ids[i]
        promises.push(updateHole(id,token,password))
        subIds.push(id)
        if(promises.length<config.threads&&i<ids.length-1){
            continue
        }
        const result=await Promise.all(promises)
        if(result.includes(401)){
            return 401
        }
        if(result.includes(403)){
            return 403
        }
        clit.out(`#${subIds.join(',')} checked`)
        promises=[]
        subIds=[]
        await sleep(config.stepSleep)
    }
    return 200
}
async function basicallyUpdatePage(key:string,page:number|string,token:string,password:string){
    const result=await basicallyGetPage(key,page,token,password)
    if(result===401){
        return 401
    }
    if(result===403){
        return 403
    }
    if(result===503){
        return 503
    }
    if(result===404){
        return 404
    }
    if(typeof result==='number'){
        return 500
    }
    const data=result.data
    let promises:Promise<200|401|403>[]=[]
    let subIds:(number|string)[]=[]
    for(let i=0;i<data.length;i++){
        const {pid,reply}=data[i]
        promises.push(updateComments(pid,Number(reply),token,password))
        subIds.push(pid)
        if(promises.length<config.threads&&i<data.length-1){
            continue
        }
        const result=await Promise.all(promises)
        if(result.includes(401)){
            return 401
        }
        if(result.includes(403)){
            return 403
        }
        clit.out(`#${subIds.join(',')} checked`)
        promises=[]
        subIds=[]
        await sleep(config.stepSleep)
    }
    return 200
}
async function updatePage(key:string,page:number,token:string,password:string){
    while(true){
        if(unlocking){
            await sleep(config.recaptchaSleep)
            continue
        }
        const result=await basicallyUpdatePage(key,page,token,password)
        if(result===503){
            clit.out('503')
            await sleep(config.congestionSleep)
            continue
        }
        if(result===500){
            clit.out('500')
            await sleep(config.errSleep)
            continue
        }
        if(result===401){
            return 401
        }
        if(result===403){
            return 403
        }
        return 200
    }
}
async function updatePages(key:string,pages:number[],token:string,password:string){
    for(let i=0;i<pages.length;i++){
        const page=pages[i]
        const result=await updatePage(key,page,token,password)
        if(result===401){
            return 401
        }
        if(result===403){
            return 403
        }
        clit.out(`p${page} checked`)
    }
    return 200
}
async function updateBatch(batchNumber:number,token:string,password:string){
    if(batchNumber===-1){
        return await updatePages('',Array.from({length:100},(v,i)=>i+1),token,password)
    }
    if(batchNumber%1===0){
        return await updateHoles(idsToRIds([],batchNumber),token,password)
    }
    batchNumber=Math.floor(batchNumber)
    const ids=await getIds(batchNumber,token,password)
    if(ids===401){
        return 401
    }
    if(ids===403){
        return 403
    }
    return await updateHoles(idsToRIds(ids,batchNumber),token,password)
}
async function updateBatches(start:number,length:number,token:string,password:string){
    if(start===-1){
        length=1
    }
    for(let i=0;i<length;i++){
        const batchNumber=start+i
        const result=await updateBatch(batchNumber,token,password)
        if(result===401){
            return 401
        }
        if(result===403){
            return 403
        }
    }
    return 200
}
async function unlock(){
    if(unlocking){
        return
    }
    unlocking=true
    const browser=await chromium.launch()
    const context=await browser.newContext({storageState:{origins:[{
        origin:'https://pkuhelper.pku.edu.cn',
        localStorage:[{
            name:'TOKEN',
            value:config.token
        }]
    }]}})
    const page=await context.newPage()
    try{
        await page.goto('https://pkuhelper.pku.edu.cn/hole',{timeout:config.unlockingSleep*1000})
    }catch(err){
        clit.log(err)
    }
    await sleep(config.unlockingSleep)
    await browser.close()
    unlocking=false
}
function prettyTimestamp(stamp:string|number){
    const date=new Date(Number(stamp+'000'))
    return [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ]
    .map(val=>val.toString().padStart(2,'0'))
    .join(':')
    +' '
    +[
        date.getMonth()+1,
        date.getDate(),
        date.getFullYear(),
    ]
    .map(val=>val.toString().padStart(2,'0'))
    .join('/')
}
export async function main(){
    const {token,password,batches:{start,length}}=config
    const result=await updateBatches(start,length,token,password)
    if(result===401){
        clit.out('401')
    }else if(result===403){
        clit.out('403')
    }else{
        clit.out('Finished')
    }
}