require('dotenv').config()
const fs = require("fs")
const mysql = require('mysql2/promise')
const express = require("express")
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http')
const https = require('https')
var privateKey = fs.readFileSync('sslcert/server.key');
var certificate = fs.readFileSync('sslcert/server.crt');

var credentials = {key: privateKey, cert: certificate};
const server = require('https').createServer(credentials,app); 

const cookie = require("cookie");
const apiAgent = new https.Agent({
    maxSockets: process.env.MAX_API_OUT_CALLS || 50 ,
    keepAlive: false
})
const socketio = require("socket.io");
const io = socketio(server);
const cron = require('node-cron')
const node_fetch = require('node-fetch')
const apiFetch = (url,_options)=>{
    let options = _options || {}
    options.headers = options.headers || {}
    options.headers["Content-Type"] = "application/json; charset=UTF-8"
    options.headers["X-Token"] = process.env.TOKEN
    options.agent = apiAgent
    return node_fetch(url,options)
}
const { createClient } = require('async-redis')
const redisClient = createClient()
const password_hash = require("password_hash")
const { v4: uuidv4 , validate: uuidValidate  } = require('uuid')
const bcrypt = require('bcrypt')
const moment = require('moment')



const errorHandler = require("./controllers/errorHandler.js")
const helpers = require("./controllers/helpers.js")({bcrypt})
const frameworkInit = require("./controllers/frameworkAdmin")
const auth = require("./controllers/auth.js")
const apiRoute = require("./routes/api.js")

let data = {hello:"hello"}


async function init(){

    let db = await mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "D4rd4n.!$ufI",
        database: process.env.DB_DB || "secret-messenger",
        waitForConnections: true,
        connectionLimit: 50,
        namedPlaceholders : true
    })
    const Framework = frameworkInit({redisClient,apiFetch,db,helpers,moment,path})

    io.on("connection", async (socket)=>{
        let cookief = socket.handshake.headers.cookie; 
        let cookies = cookie.parse(socket.handshake.headers.cookie);    

        if(cookies.id == undefined){
            socket.disconnect()
        }
        let session = await redisClient.hgetall(`ADMINSESSION:${cookies.id}`)
        if(session == null){
            socket.disconnect()
        }

        
    })

    setInterval(async()=>{
        let data = await Framework.getQueueStatus()
        io.emit("event",data)
    },1000)
    app.set('port', process.env.PORT || 3000)
    app.set('view engine', 'ejs')
    app.use('/public', express.static(path.join(__dirname, 'public')))
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(cookieParser())
    app.use(cors())
    app.use("/*" , auth({
        express,
        redisClient,
        db,
        uuidv4,
        uuidValidate,
        password_hash
    }))

    app.get("/",(req,res)=>{
        res.render("index")
    })

    app.use("/api" , apiRoute({
        express,
        redisClient,
        db,
        uuidv4,
        uuidValidate,
        password_hash,
        Framework
    }))

    

    //await Framework.notImportedProfiles()
    //console.log(await Framework.notImportedProfiles())

    // await Framework.ImportProfile("002205b1f318ed54292402871b28a3a85a")

    // let jobs = [
    //     Framework.ImportFavorites("002205b1f318ed54292402871b28a3a85a"),
    //     Framework.ImportNotes("002205b1f318ed54292402871b28a3a85a"),
    //     Framework.ImportDialoges("002205b1f318ed54292402871b28a3a85a")
    // ]
    
    // await Promise.all(jobs)
    
    // console.log("done")
    
    server.listen(app.get('port'), function() {
        console.log("Server started on :" + app.get('port'));
    })
}

init()