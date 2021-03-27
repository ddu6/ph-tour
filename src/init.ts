import * as fs from 'fs'
import * as path from 'path'
[
    '../info/'
].map(val=>path.join(__dirname,val)).forEach(val=>{
    if(!fs.existsSync(val))fs.mkdirSync(val)
})
const path0=path.join(__dirname,'../config.json')
if(!fs.existsSync(path0))fs.writeFileSync(path0,
`{
    "token":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "password":"xxxxxxxx",
    "batchNumber":-1,
    "domain":"ddu6.xyz",
    "congestionSleep":5000,
    "errSleep":30000,
    "recaptchaSleep":300000
}`)
