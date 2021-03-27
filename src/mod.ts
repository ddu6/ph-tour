import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
let domain='ddu6.xyz'
let threads=2
let congestionSleep=3
let errSleep=5
let recaptchaSleep=60
interface Res{
    body:string
    buffer:Buffer
    cookie:string
    headers:http.IncomingHttpHeaders
    status:number
}
interface Config{
    token:string
    password:string
    batchNumber:number
    domain:string
    threads:number
    congestionSleep:number
    errSleep:number
    recaptchaSleep:number
}
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
function getDate(){
    const date=new Date()
    return [date.getMonth()+1,date.getDate()].map(val=>val.toString().padStart(2,'0')).join('-')+' '+[date.getHours(),date.getMinutes(),date.getSeconds()].map(val=>val.toString().padStart(2,'0')).join(':')+':'+date.getMilliseconds().toString().padStart(3,'0')
}
function semilog(msg:string|Error){
    let string=getDate()+'  '
    if(typeof msg!=='string'){
        const {stack}=msg
        if(stack!==undefined){
            string+=stack
        }else{
            string+=msg.message
        }
    }else{
        string+=msg
    }
    string=string.replace(/\n */g,'\n                    ')
    fs.appendFileSync(path.join(__dirname,'../info/semilog.txt'),string+'\n\n')
    return string
}
function log(msg:string|Error){
    const string=semilog(msg)
    console.log(string+'\n')
}
async function sleep(time:number){
    await new Promise(resolve=>{
        setTimeout(resolve,time*1000)
    })
}
async function basicallyGet(url:string,params:Record<string,string>={},cookie='',referer=''){
    let paramsStr=new URL(url).searchParams.toString()
    if(paramsStr.length>0)paramsStr+='&'
    paramsStr+=new URLSearchParams(params).toString()
    if(paramsStr.length>0)paramsStr='?'+paramsStr
    url=new URL(paramsStr,url).href
    const headers:http.OutgoingHttpHeaders={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
    }
    if(cookie.length>0)headers.Cookie=cookie
    if(referer.length>0)headers.Referer=referer
    const result=await new Promise((resolve:(val:number|Res)=>void)=>{
        const httpsOrHTTP=url.startsWith('https://')?https:http
        httpsOrHTTP.get(url,{
            headers:headers
        },async res=>{
            const {statusCode}=res
            if(statusCode===undefined){
                resolve(500)
                return
            }
            if(statusCode>=400){
                resolve(statusCode)
                return
            }
            let cookie:string
            const cookie0=res.headers["set-cookie"]
            if(cookie0===undefined){
                cookie=''
            }else{
                cookie=cookie0.map(val=>val.split(';')[0]).join('; ')
            }
            let body=''
            const buffers:Buffer[]=[]
            res.on('data',chunk=>{
                if(typeof chunk==='string'){
                    body+=chunk
                }else if(chunk instanceof Buffer){
                    body+=chunk
                    buffers.push(chunk)
                }
            })
            res.on('end',()=>{
                resolve({
                    body:body,
                    buffer:Buffer.concat(buffers),
                    cookie:cookie,
                    headers:res.headers,
                    status:statusCode
                })
            })
            res.on('error',err=>{
                semilog(err)
                resolve(500)
            })
        }).on('error',err=>{
            semilog(err)
            resolve(500)
        })
    })
    return result
}
async function getResult(path:string,params:Record<string,string>={}){
    const result=await basicallyGet(`https://${domain}/services/ph-get/${path}`,params)
    if(typeof result==='number')return result
    const {status,body}=result
    if(status!==200)return status
    try{
        const {status,data}=JSON.parse(body)
        if(status===200)return {data:data}
        if(typeof status==='number')return status
    }catch(err){
        semilog(err)
    }
    return 500
}
async function basicallyGetIds(batchNumber:number,token:string,password:string){
    const result:{data:number[]}|number=await getResult(`local/ids${batchNumber}`,{
        token:token,
        password:password
    })
    if(result===503)return 503
    if(result===401)return 401
    if(typeof result==='number')return 500
    return result.data
}
async function getIds(batchNumber:number,token:string,password:string){
    while(true){
        const result=await basicallyGetIds(batchNumber,token,password)
        if(result===503){
            log('503.')
            await sleep(congestionSleep)
            continue
        }
        if(result===500){
            log('500.')
            await sleep(errSleep)
            continue
        }
        if(result===401)return 401
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
        if(ids[i])continue
        array.push(batchNumber+i)
    }
    return array
}
async function basicallyGetComments(id:number|string,token:string,password:string){
    const data:{data:CommentData[]}|number=await getResult(`c${id}`,{
        update:'',
        token:token,
        password:password
    })
    return data
}
async function basicallyGetLocalComments(id:number|string,token:string,password:string){
    const data:{data:CommentData[]}|number=await getResult(`local/c${id}`,{
        token:token,
        password:password
    })
    return data
}
async function basicallyGetHole(id:number|string,token:string,password:string){
    const data:{data:HoleData}|number=await getResult(`h${id}`,{
        update:'',
        token:token,
        password:password
    })
    return data
}
async function basicallyGetLocalHole(id:number|string,token:string,password:string){
    const data:{data:HoleData}|number=await getResult(`local/h${id}`,{
        token:token,
        password:password
    })
    return data
}
async function basicallyGetPage(key:string,page:number|string,token:string,password:string){
    const data:{data:HoleData[]}|number=await getResult(`p${page}`,{
        update:'',
        key:key,
        token:token,
        password:password
    })
    return data
}
async function basicallyUpdateComments(id:number|string,reply:number,token:string,password:string){
    if(reply===0)return 200
    const result0=await basicallyGetLocalComments(id,token,password)
    if(result0===401)return 401
    if(result0===503)return 503
    if(typeof result0==='number')return 500
    const data0=result0.data
    const length0=data0.length
    if(reply>=0&&length0>=reply)return 200
    const result1=await basicallyGetComments(id,token,password)
    if(result1===401)return 401
    if(result1===503)return 503
    if(result1===404)return 404
    if(typeof result1==='number')return 500
    const data1=result1.data
    for(let i=0;i<data1.length;i++){
        const {text}=data1[i]
        if(typeof text==='string'&&text.startsWith('[Helper]'))return 423
    }
    log(`c${id} updated.`)
    return 200
}
async function updateComments(id:number|string,reply:number,token:string,password:string){
    while(true){
        const result=await basicallyUpdateComments(id,reply,token,password)
        if(result===503){
            log('503.')
            await sleep(congestionSleep)
            continue
        }
        if(result===500){
            log('500.')
            await sleep(errSleep)
            continue
        }
        if(result===423){
            log('423.')
            await sleep(recaptchaSleep)
        }
        if(result===401)return 401
        return 200
    }
}
async function basicallyUpdateHole(id:number|string,token:string,password:string){
    const result0=await basicallyGetLocalHole(id,token,password)
    if(result0===401)return 401
    if(result0===503)return 503
    if(result0===404){
        const result1=await basicallyGetHole(id,token,password)
        if(result1===401)return 401
        if(result1===503)return 503
        if(result1===404)return 404
        if(typeof result1==='number')return 500
        log(`h${id} updated.`)
        return await updateComments(id,Number(result1.data.reply),token,password)
    }
    if(typeof result0==='number')return 500
    const data0=result0.data
    if(Number(data0.timestamp)===0)return 404
    if(Number(data0.hidden)===1)return 404
    const result1=await basicallyGetHole(id,token,password)
    if(result1===401)return 401
    if(result1===503)return 503
    if(result1===404)return 404
    if(typeof result1==='number')return 500
    const data1=result1.data
    const reply=Number(data1.reply)
    if(
        reply>Number(data0.reply)
        ||Number(data1.likenum)>Number(data0.likenum)
    ){
        log(`h${id} updated.`)
    }
    return await updateComments(id,reply,token,password)
}
async function updateHole(id:number,token:string,password:string){
    while(true){
        const result=await basicallyUpdateHole(id,token,password)
        if(result===503){
            log('503.')
            await sleep(congestionSleep)
            continue
        }
        if(result===500){
            log('500.')
            await sleep(errSleep)
            continue
        }
        if(result===401)return 401
        return 200
    }
}
async function updateHoles(ids:number[],token:string,password:string){
    let promises:Promise<200|401>[]=[]
    let subIds:number[]=[]
    for(let i=0;i<ids.length;i++){
        const id=ids[i]
        promises.push(updateHole(id,token,password))
        subIds.push(id)
        if(promises.length<threads&&i<ids.length-1)continue
        const result=await Promise.all(promises)
        if(result.includes(401))return 401
        log(`#${subIds.join(',')} toured.`)
        promises=[]
        subIds=[]
    }
    return 200
}
async function basicallyUpdatePage(key:string,page:number|string,token:string,password:string){
    const result=await basicallyGetPage(key,page,token,password)
    if(result===401)return 401
    if(result===503)return 503
    if(result===404)return 404
    if(typeof result==='number')return 500
    const data=result.data
    let promises:Promise<200|401>[]=[]
    let subIds:(number|string)[]=[]
    for(let i=0;i<data.length;i++){
        const {pid,reply}=data[i]
        promises.push(updateComments(pid,Number(reply),token,password))
        subIds.push(pid)
        if(promises.length<threads&&i<data.length-1)continue
        const result=await Promise.all(promises)
        if(result.includes(401))return 401
        log(`#${subIds.join(',')} toured.`)
        promises=[]
        subIds=[]
    }
    return 200
}
async function updatePage(key:string,page:number,token:string,password:string){
    while(true){
        const result=await basicallyUpdatePage(key,page,token,password)
        if(result===503){
            log('503.')
            await sleep(congestionSleep)
            continue
        }
        if(result===500){
            log('500.')
            await sleep(errSleep)
            continue
        }
        if(result===401)return 401
        return 200
    }
}
async function updatePages(key:string,pages:number[],token:string,password:string){
    for(let i=0;i<pages.length;i++){
        const page=pages[i]
        const result=await updatePage(key,page,token,password)
        if(result===401)return 401
        log(`p${page} toured.`)
    }
    return 200
}
async function updateBatch(batchNumber:number,token:string,password:string){
    if(batchNumber===-1)return await updatePages('',Array.from({length:100},(v,i)=>i+1),token,password)
    if(batchNumber%1===0)return await updateHoles(idsToRIds([],batchNumber),token,password)
    batchNumber=Math.floor(batchNumber)
    const ids=await getIds(batchNumber,token,password)
    if(ids===401)return 401
    return await updateHoles(idsToRIds(ids,batchNumber),token,password)
}
export async function main(){
    const config:Config=JSON.parse(fs.readFileSync(path.join(__dirname,'../config.json'),{encoding:'utf8'}))
    const {token,password,batchNumber}=config
    domain=config.domain
    threads=config.threads
    congestionSleep=config.congestionSleep
    errSleep=config.errSleep
    recaptchaSleep=config.recaptchaSleep
    const result=await updateBatch(batchNumber,token,password)
    if(result===401){
        log('401.')
    }else{
        log('Finished.')
    }
}